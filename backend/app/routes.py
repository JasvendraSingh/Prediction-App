from fastapi import APIRouter, HTTPException, Query, Request
from fastapi.responses import JSONResponse, FileResponse
from .scraping import scrape_ucl, scrape_uel, scrape_ucfl
from .predictions import parse_predictions, league_progress
from .league import calculate_league_table, format_table_for_frontend
from .pdf_utils import export_to_pdf
from .ipfs_utils import save_to_ipfs, get_latest_cid, load_from_ipfs
import os
from typing import Dict, Any
import datetime
import json

router = APIRouter()

# In-memory caches
last_tables: Dict[str, Any] = {}
last_predictions: Dict[str, Any] = {}

# Helper Functions
def get_matches_for_league(league: str, force_refresh: bool = False):
    league = league.lower()
    if league == "ucl":
        return scrape_ucl(force_refresh=force_refresh)
    elif league == "uel":
        return scrape_uel(force_refresh=force_refresh)
    elif league == "ucfl":
        return scrape_ucfl(force_refresh=force_refresh)
    return None

def apply_real_results(matches_by_day):
    """Extract all played matches from scraped data"""
    results = {}
    for day, games in matches_by_day.items():
        for g in games:
            if g.get("played"):
                results[(g["home"], g["away"])] = (g["home_score"], g["away_score"])
    return results

def get_first_unplayed_matchday(matches_by_day):
    """Find the first matchday that has at least one unplayed match"""
    for matchday in sorted(matches_by_day.keys(), key=lambda x: int(x)):
        if not all(m["played"] for m in matches_by_day[matchday]):
            return matchday
    return None

# API Endpoints
@router.get("/matches/{league}")
def get_matches(league: str):
    print(f"== Fetching matches for {league} ==")
    matches_by_day = get_matches_for_league(league)
    if matches_by_day is None:
        return JSONResponse({"error": "Invalid league."}, status_code=400)

    league_upper = league.upper()
    real_results = apply_real_results(matches_by_day)
    league_progress[league_upper] = real_results

    table_dict = calculate_league_table(matches_by_day, real_results)
    table_array = format_table_for_frontend(table_dict)

    first_unplayed = get_first_unplayed_matchday(matches_by_day)
    unplayed = {day: g for day, g in matches_by_day.items() if not all(m["played"] for m in g)}

    latest_cid = get_latest_cid(f"{league_upper}_matches")

    return {
        "league": league_upper,
        "completed_table": table_array,
        "next_matchdays": unplayed,
        "first_unplayed_matchday": first_unplayed,
        "played_results": {f"{h}_{a}": s for (h, a), s in real_results.items()},
        "total_matchdays": len(matches_by_day),
        "played_matchdays": len(matches_by_day) - len(unplayed),
        "ipfs_cid": latest_cid
    }

@router.post("/predict/{league}")
def submit_predictions(league: str, payload: dict):
    matchday = payload.get("matchday")
    predictions = payload.get("predictions", {})
    username = payload.get("username", "guest")

    if not matchday or not predictions:
        return JSONResponse({"error": "Missing matchday or predictions."}, status_code=400)

    matches_by_day = get_matches_for_league(league)
    if matches_by_day is None or matchday not in matches_by_day:
        return JSONResponse({"error": "Invalid league or matchday."}, status_code=400)

    league_upper = league.upper()
    if all(m["played"] for m in matches_by_day[matchday]):
        return JSONResponse({"error": "Matchday already played."}, status_code=400)

    # Ensure real result state exists
    if league_upper not in league_progress:
        league_progress[league_upper] = apply_real_results(matches_by_day)

    # Parse predictions into correct format
    new_predictions = parse_predictions(
        [(m["home"], m["away"]) for m in matches_by_day[matchday]],
        predictions,
        league_upper
    )
    league_progress[league_upper].update(new_predictions)

    # Update league table
    table_dict = calculate_league_table(matches_by_day, league_progress[league_upper])
    table_array = format_table_for_frontend(table_dict)
    last_tables[league_upper] = table_array

    return {
        "status": "saved",
        "league": league_upper,
        "matchday": matchday,
        "table": table_array,
    }

@router.post("/save_predictions/{league}")
def save_user_predictions(league: str, payload: dict):
    """Save ALL predictions for a user to IPFS (single file)."""
    username = payload.get("username", "guest")
    predictions = payload.get("predictions")

    if not predictions:
        return JSONResponse({"error": "Missing predictions."}, status_code=400)

    league_upper = league.upper()
    key = f"{username}_{league_upper}_all_predictions"

    cid = save_to_ipfs({
        "username": username,
        "league": league_upper,
        "predictions": predictions,
        "timestamp": datetime.datetime.now().isoformat()
    }, name=key)

    if cid:
        return {"status": "success", "cid": cid}
    return JSONResponse({"error": "Failed to upload to IPFS"}, status_code=500)

@router.get("/load_predictions/{league}")
def load_user_predictions(league: str, username: str = Query(...)):
    """Load saved predictions for a user from IPFS."""
    league_upper = league.upper()
    key = f"{username}_{league_upper}_all_predictions"

    cid = get_latest_cid(key)
    if not cid:
        return JSONResponse({"error": "No predictions found."}, status_code=404)

    data = load_from_ipfs(cid)
    if data:
        return {"status": "success", "predictions": data.get("predictions"), "cid": cid}
    return JSONResponse({"error": "Failed to load data from IPFS"}, status_code=500)

@router.get("/download/{league}")
@router.post("/download/{league}")
def download_pdf(league: str, payload: dict = None):
    """Download league table with optional user predictions from IPFS."""
    league_upper = league.upper()
    if league_upper not in last_tables:
        return JSONResponse({"error": "No data. Predict first."}, status_code=400)

    # Now this is a list of dicts with keys matching the frontend
    table_data = last_tables[league_upper]

    username = None
    user_predictions = {}

    if payload and "username" in payload:
        username = payload["username"]

    if username:
        key = f"{username}_{league_upper}_all_predictions"
        cid = get_latest_cid(key)
        if cid:
            data = load_from_ipfs(cid)
            if data:
                user_predictions = data.get("predictions", {})

    filename = f"{league_upper}_table.pdf"
    print("DEBUG RAW TABLE DATA:", table_data)

    export_to_pdf(
        table_data,
        filename,
        predictions=user_predictions,
        username=username,
        league=league_upper,
    )
    return FileResponse(path=filename, filename=filename, media_type="application/pdf")

@router.post("/refresh/{league}")
def refresh_data(league: str):
    """Force refresh and upload updated league data to IPFS."""
    matches_by_day = get_matches_for_league(league, force_refresh=True)
    if matches_by_day is None:
        return JSONResponse({"error": "Invalid league."}, status_code=400)

    league_upper = league.upper()
    real_results = apply_real_results(matches_by_day)
    league_progress[league_upper] = real_results

    ipfs_data = {
        "league": league_upper,
        "matches_by_day": matches_by_day,
        "played_results": {f"{h}_{a}": s for (h, a), s in real_results.items()},
        "timestamp": datetime.datetime.now().isoformat()
    }

    cid = save_to_ipfs(ipfs_data, name=f"{league_upper}_matches")
    if cid:
        return {"status": "success", "cid": cid}
    return JSONResponse({"error": "IPFS upload failed"}, status_code=500)

@router.get("/status/{league}")
def get_status(league: str):
    league_upper = league.upper()
    matches_by_day = get_matches_for_league(league)
    if matches_by_day is None:
        return JSONResponse({"error": "Invalid league"}, status_code=400)

    real_results = apply_real_results(matches_by_day)
    latest_cid = get_latest_cid(f"{league_upper}_matches")
    return {
        "league": league_upper,
        "total_matchdays": len(matches_by_day),
        "played_matches": len(real_results),
        "has_predictions": league_upper in league_progress,
        "pinata_configured": bool(os.getenv('PINATA_API_KEY')) and bool(os.getenv('PINATA_SECRET_API_KEY')),
        "latest_ipfs_cid": latest_cid,
        "ipfs_url": f"https://gateway.pinata.cloud/ipfs/{latest_cid}" if latest_cid else None
    }

@router.post("/reset")
def reset_data():
    """Reset in-memory caches."""
    last_tables.clear()
    last_predictions.clear()
    league_progress.clear()
    return {"status": "cleared"}

@router.get("/health")
def health_check():
    return {"status": "ok"}

@router.post("/logout")
def logout_user(payload: dict):
    """Frontend logout helper endpoint (no auth here)."""
    username = payload.get("username", "guest")
    return {"message": f"User {username} logged out successfully."}

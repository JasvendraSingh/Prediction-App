from fastapi import APIRouter
from fastapi.responses import JSONResponse, FileResponse
from .scraping import scrape_ucl, scrape_uel, scrape_ucfl
from .predictions import parse_predictions, league_progress
from .league import calculate_league_table, format_table_for_frontend
from .pdf_utils import export_to_pdf
from .ipfs_utils import save_to_ipfs, get_latest_cid
import os
router = APIRouter()
last_tables = {}  # cache for PDF export

def get_matches_for_league(league: str, force_refresh: bool = False):
    if league.lower() == "ucl":
        return scrape_ucl(force_refresh=force_refresh)
    elif league.lower() == "uel":
        return scrape_uel(force_refresh=force_refresh)
    elif league.lower() == "ucfl":
        return scrape_ucfl(force_refresh=force_refresh)
    return None

def apply_real_results(matches_by_day):
    """Extract all played matches from scraped data"""
    results = {}
    for day, games in matches_by_day.items():
        for g in games:
            if g.get("played"):
                # Use tuple as internal key
                results[(g["home"], g["away"])] = (g["home_score"], g["away_score"])
    return results

def get_first_unplayed_matchday(matches_by_day):
    """Find the first matchday that has at least one unplayed match"""
    for matchday in sorted(matches_by_day.keys(), key=lambda x: int(x)):
        if not all(m["played"] for m in matches_by_day[matchday]):
            return matchday
    return None

@router.get("/matches/{league}")
def get_matches(league: str):
    print(f"\n=== DEBUG: Get Matches Request ===")
    print(f"League: {league}")
    print(f"Pinata API Key exists: {bool(os.getenv('PINATA_API_KEY'))}")
    matches_by_day = get_matches_for_league(league)
    if matches_by_day is None:
        return JSONResponse(
            {"error": "Invalid league. Use 'UCL' or 'UEL' or 'UCFL'."},
            status_code=400)
    league_upper = league.upper()
    # Get all played matches
    real_results = apply_real_results(matches_by_day)
    league_progress[league_upper] = real_results
    print(f"Found {len(real_results)} played matches")
    # Convert tuple keys to strings for JSON serialization
    json_friendly_results = {f"{home}_{away}": scores for (home, away), scores in real_results.items()}
    # Calculate league table
    table_dict = calculate_league_table(matches_by_day, real_results)
    table_array = format_table_for_frontend(table_dict)
    # Get first unplayed matchday
    first_unplayed = get_first_unplayed_matchday(matches_by_day)
    # Only return unplayed matchdays for predictions
    unplayed = {
        day: g for day, g in matches_by_day.items()
        if not all(m["played"] for m in g)
    }
    # Get latest IPFS CID if available
    latest_cid = get_latest_cid(f"{league_upper}_matches")
    response_data = {
        "league": league_upper,
        "completed_table": table_array,
        "next_matchdays": unplayed,
        "first_unplayed_matchday": first_unplayed,
        "played_results": json_friendly_results,
        "total_matchdays": len(matches_by_day),
        "played_matchdays": len(matches_by_day) - len(unplayed),
        "ipfs_cid": latest_cid
    }
    print(f"Returning data with {len(table_array)} teams")
    return response_data

@router.post("/predict/{league}")
def submit_predictions(league: str, payload: dict):
    matchday = payload.get("matchday")
    predictions = payload.get("predictions", {})
    print(f"\n=== DEBUG: Submit Predictions ===")
    print(f"League: {league}")
    print(f"Matchday: {matchday}")
    print(f"Received predictions: {predictions}")
    matches_by_day = get_matches_for_league(league)
    if matches_by_day is None or matchday not in matches_by_day:
        return JSONResponse({"error": "Invalid league or matchday."}, status_code=400)
    league_upper = league.upper()
    # Block predictions on already played rounds
    if all(m["played"] for m in matches_by_day[matchday]):
        return JSONResponse({"error": "This matchday is already played."}, status_code=400)
    # Ensure league_progress exists and has real results
    if league_upper not in league_progress:
        real_results = apply_real_results(matches_by_day)
        league_progress[league_upper] = real_results
    print(f"League progress BEFORE parse: {league_progress[league_upper]}")
    # Parse and merge new predictions with existing results
    new_predictions = parse_predictions(
        [(m["home"], m["away"]) for m in matches_by_day[matchday]],
        predictions,
        league_upper
    )
    # Merge with existing (real results + previous predictions)
    league_progress[league_upper].update(new_predictions)
    print(f"League progress AFTER parse: {league_progress[league_upper]}")
    # Calculate updated table
    table_dict = calculate_league_table(matches_by_day, league_progress[league_upper])
    print(f"Calculated table: {table_dict}")
    table_array = format_table_for_frontend(table_dict)
    last_tables[league_upper] = table_dict
    return {"league": league_upper, "matchday": matchday, "table": table_array}

@router.get("/download/{league}")
def download_pdf(league: str):
    league_upper = league.upper()
    if league_upper not in last_tables:
        return JSONResponse({"error": "No table available. Submit predictions first."}, status_code=400)    
    filename = f"{league_upper}_table.pdf"
    export_to_pdf(last_tables[league_upper], filename)
    return FileResponse(path=filename, filename=filename, media_type="application/pdf")

@router.post("/refresh/{league}")
def refresh_data(league: str):
    """
    Force refresh of scraping and push updated data to IPFS.
    Intended to be run only after a round is finished.
    """
    print(f"\n=== DEBUG: Refresh Data ===")
    print(f"League: {league}")
    print(f"Pinata API Key: {os.getenv('PINATA_API_KEY')[:10]}..." if os.getenv('PINATA_API_KEY') else "NOT SET")
    print(f"Pinata Secret Key: {os.getenv('PINATA_SECRET_API_KEY')[:10]}..." if os.getenv('PINATA_SECRET_API_KEY') else "NOT SET")
    matches_by_day = get_matches_for_league(league, force_refresh=True)
    if matches_by_day is None:
        return JSONResponse({"error": "Invalid league. Use 'UCL' or 'UEL' or 'UCFL'."}, status_code=400)
    league_upper = league.upper()
    # Reset league progress with new real results
    real_results = apply_real_results(matches_by_day)
    league_progress[league_upper] = real_results    
    # Prepare data for IPFS with metadata
    ipfs_data = {
        "league": league_upper,
        "matches_by_day": matches_by_day,
        "played_results": {f"{h}_{a}": scores for (h, a), scores in real_results.items()},
        "timestamp": __import__('datetime').datetime.now().isoformat()
    }
    # Push to IPFS with league-specific name
    try:
        cid = save_to_ipfs(ipfs_data, name=f"{league_upper}_matches")
        if cid:
            print(f"Successfully pushed to IPFS: {cid}")
            print(f"View at: https://gateway.pinata.cloud/ipfs/{cid}")
            return {
                "league": league_upper,
                "message": "Data refreshed and pushed to IPFS",
                "cid": cid,
                "ipfs_url": f"https://gateway.pinata.cloud/ipfs/{cid}",
                "played_matches": len(real_results)
            }
        else:
            print("IPFS upload returned None (likely no API keys configured)")
            return {
                "league": league_upper,
                "message": "Data refreshed (IPFS upload skipped - no API keys)",
                "cid": None,
                "played_matches": len(real_results)
            }
    except Exception as e:
        print(f"Error pushing to IPFS: {str(e)}")
        import traceback
        traceback.print_exc()
        return JSONResponse(
            {
                "error": f"Failed to push to IPFS: {str(e)}",
                "league": league_upper,
                "played_matches": len(real_results)
            }, 
            status_code=500
        )

@router.get("/status/{league}")
def get_status(league: str):
    """Check current status of league data"""
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
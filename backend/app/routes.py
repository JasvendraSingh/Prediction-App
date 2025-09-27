from fastapi import APIRouter
from fastapi.responses import JSONResponse, FileResponse
from .scraping import scrape_uel, scrape_ucfl
from .predictions import parse_predictions, league_progress
from .league import calculate_league_table
from .pdf_utils import export_to_pdf
from .ipfs_utils import save_to_ipfs

router = APIRouter()
last_tables = {}  # cache for PDF export

def get_matches_for_league(league: str, force_refresh: bool = False):
    if league.lower() == "uel":
        return scrape_uel(force_refresh=force_refresh)
    elif league.lower() == "ucfl":
        return scrape_ucfl(force_refresh=force_refresh)
    return None

def apply_real_results(matches_by_day):
    results = {}
    for day, games in matches_by_day.items():
        for g in games:
            if g.get("played"):
                results[(g["home"], g["away"])] = (g["home_score"], g["away_score"])
    return results

@router.get("/matches/{league}")
def get_matches(league: str):
    matches_by_day = get_matches_for_league(league)
    if matches_by_day is None:
        return JSONResponse(
            {"error": "Invalid league. Use 'UEL' or 'UCFL'."},
            status_code=400
        )

    league_upper = league.upper()
    real_results = apply_real_results(matches_by_day)
    league_progress[league_upper] = real_results

    table = calculate_league_table(matches_by_day, real_results)

    # Only upcoming matchdays for predictions
    unplayed = {
        day: g for day, g in matches_by_day.items()
        if not all(m["played"] for m in g)
    }

    return {
        "league": league_upper,
        "completed_table": table,
        "next_matchdays": unplayed
    }

@router.post("/predict/{league}")
def submit_predictions(league: str, payload: dict):
    matchday = payload.get("matchday")
    predictions = payload.get("predictions", {})

    matches_by_day = get_matches_for_league(league)
    if matches_by_day is None or matchday not in matches_by_day:
        return JSONResponse({"error": "Invalid league or matchday."}, status_code=400)

    league_upper = league.upper()

    # Block predictions on already played rounds
    if all(m["played"] for m in matches_by_day[matchday]):
        return JSONResponse({"error": "This matchday is already played."}, status_code=400)

    league_progress.setdefault(league_upper, {})

    league_progress[league_upper] = parse_predictions(
        [(m["home"], m["away"]) for m in matches_by_day[matchday]],
        predictions,
        league_upper
    )

    table = calculate_league_table(matches_by_day, league_progress[league_upper])
    last_tables[league_upper] = table

    return {"league": league_upper, "matchday": matchday, "table": table}

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
    matches_by_day = get_matches_for_league(league, force_refresh=True)
    if matches_by_day is None:
        return JSONResponse({"error": "Invalid league. Use 'UEL' or 'UCFL'."}, status_code=400)

    # Push to IPFS again
    cid = save_to_ipfs(matches_by_day)

    return {
        "league": league.upper(),
        "message": "Data refreshed and pushed to IPFS",
        "cid": cid
    }

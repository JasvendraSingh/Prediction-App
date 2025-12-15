from fastapi import APIRouter, HTTPException
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import Optional
import datetime, os, json
from fastapi.responses import FileResponse
import tempfile

from ..ipfs_utils import save_to_ipfs
from ..pdf_utils_fifa import export_fifa_worldcup_pdf
from ..ipfs_utils import save_to_ipfs, get_latest_cid, load_from_ipfs
from ..pdf_utils import export_to_pdf
from .config import FIFA_CONFIG, FLAG_MAP
from .state import create_initial_state, replace_playoff_winners_in_groups
from .groups import apply_group_match, generate_group_fixtures
from .knockouts import build_r32_from_tables, build_next_round
from .playoffs import create_playoffs_state, run_playoff

router = APIRouter()

# HELPERS
def all_group_matches_completed(matches: dict) -> bool:
    """
    Returns True only if ALL group matches are played
    """
    for group_matches in matches.values():
        for m in group_matches:
            if not m.get("played"):
                return False
    return True

# MODELS
class KnockoutPredictRequest(BaseModel):
    user_id: str
    stage: str
    match_slot: str
    teamA: str
    teamB: str
    scoreA: int
    scoreB: int
    penaltyWinner: Optional[str] = None

# INIT
@router.post("/init")
def init_tournament(payload: dict):
    user_id = payload.get("user_id", "guest")
    state = create_initial_state()
    state["created_at"] = datetime.datetime.utcnow().isoformat()
    return {"success": True, "state": state}

# PLAYOFFS
@router.get("/playoffs/init")
def playoffs_init():
    state = create_playoffs_state()
    return {"success": True, "state": state}

@router.post("/playoffs/predict_match")
def predict_playoff_match(payload: dict):
    key = payload.get("key")
    round_type = payload.get("round_type")
    match_id = payload.get("match_id")
    scoreA = payload.get("scoreA")
    scoreB = payload.get("scoreB")
    penaltyWinner = payload.get("penaltyWinner")
    playoff_state = payload.get("state")

    if not key or not round_type or not match_id:
        raise HTTPException(status_code=400, detail="Missing identifiers")

    if playoff_state is None:
        raise HTTPException(status_code=400, detail="Missing playoff state")

    matches = playoff_state.get(round_type)
    if not matches:
        raise HTTPException(status_code=400, detail="Invalid round_type")

    match = next((m for m in matches if m.get("match") == match_id), None)
    if not match:
        raise HTTPException(status_code=400, detail="Match not found")

    teamA = match["teamA"]
    teamB = match["teamB"]

    if scoreA == scoreB:
        if not penaltyWinner or penaltyWinner not in (teamA, teamB):
            raise HTTPException(status_code=400, detail="Valid penaltyWinner required")
        winner = penaltyWinner
    else:
        winner = teamA if scoreA > scoreB else teamB

    match["scoreA"] = int(scoreA)
    match["scoreB"] = int(scoreB)
    match["penaltyWinner"] = penaltyWinner
    match["winner"] = winner

    playoff_state = run_playoff(key, playoff_state)

    return {"success": True, "state": {key: playoff_state}, "winner": winner}


@router.post("/playoffs/commit_to_groups")
def commit_playoffs_to_groups(payload: dict):
    user_id = payload.get("user_id", "guest")
    playoffs_state = payload.get("playoffs_state")
    if not playoffs_state:
        raise HTTPException(status_code=400, detail="Missing playoffs_state")

    state = create_initial_state()
    winners_map = {}

    for key, block in playoffs_state.items():
        final = block.get("final") and block["final"][0]
        if final:
            w = final.get("winner")
            if w:
                winners_map[block.get("slot_name", key)] = w
                winners_map[key] = w

    state["groups"] = replace_playoff_winners_in_groups(state["groups"], winners_map)
    state["matches"] = generate_group_fixtures(state["groups"])
    state["group_tables"] = {
        g: {
            team: {
                "played": 0,
                "won": 0,
                "drawn": 0,
                "lost": 0,
                "gf": 0,
                "ga": 0,
                "gd": 0,
                "points": 0,
            }
            for team in teams
        }
        for g, teams in state["groups"].items()
    }

    return {"success": True, "state": state}

# FLAGS
@router.get("/flag/{team}")
def get_flag(team: str):
    code = FLAG_MAP.get(team)
    if not code:
        return {"success": False, "url": None}
    url = f"https://flagcdn.com/w40/{code}.png"
    return {"success": True, "team": team, "code": code, "url": url}

# GROUP STAGE
@router.post("/predict_group_match")
def predict_group_match(payload: dict):
    try:
        teamA = payload["teamA"]
        teamB = payload["teamB"]
    except KeyError:
        raise HTTPException(status_code=400, detail="Missing fields")

    try:
        from ..predictions import predict_match as model_predict
    except Exception:
        model_predict = None

    if model_predict:
        try:
            res = model_predict(teamA, teamB)
            return {"success": True, "scoreA": res["scoreA"], "scoreB": res["scoreB"]}
        except Exception:
            pass

    import random
    r = random.Random(teamA + teamB)
    return {"success": True, "scoreA": r.randint(0, 4), "scoreB": r.randint(0, 4)}


@router.post("/submit_group_results")
def submit_group_results(payload: dict):
    state = payload.get("state")
    if not state:
        raise HTTPException(status_code=400, detail="Missing state")

    matches = state.get("matches", {})
    group_tables = {}

    for g, mlist in matches.items():
        table = {}
        for m in mlist:
            if m.get("played"):
                apply_group_match(
                    table,
                    m["teamA"],
                    m["teamB"],
                    m["scoreA"],
                    m["scoreB"],
                )
        group_tables[g] = table

    state["group_tables"] = group_tables
    user = payload.get("user_id", "guest")

    if all_group_matches_completed(matches):
        cid = save_to_ipfs(state, name=f"fifa_groups_{user}")
        return {
            "success": True,
            "state": state,
            "ipfs_cid": cid,
            "groups_complete": True,
        }

    return {
        "success": True,
        "state": state,
        "groups_complete": False,
    }

# KNOCKOUTS
@router.post("/generate_r32")
def generate_r32(payload: dict):
    state = payload.get("state")
    r32 = build_r32_from_tables(state["group_tables"])
    state["r32"] = r32
    return {"success": True, "r32": r32, "state": state}


@router.post("/generate_r16")
def generate_r16(payload: dict):
    state = payload.get("state")
    state["r16"] = build_next_round(state["r32"], "r16")
    return {"success": True, "state": state}


@router.post("/generate_qf")
def generate_qf(payload: dict):
    state = payload.get("state")
    state["qf"] = build_next_round(state["r16"], "qf")
    return {"success": True, "state": state}


@router.post("/generate_sf")
def generate_sf(payload: dict):
    state = payload.get("state")
    state["sf"] = build_next_round(state["qf"], "sf")
    return {"success": True, "state": state}


@router.post("/generate_final")
def generate_final(payload: dict):
    state = payload.get("state")

    winners, losers = [], []
    for m in state["sf"].values():
        winners.append(m["winner"])
        loser = m["teamA"] if m["winner"] == m["teamB"] else m["teamB"]
        losers.append(loser)

    state["third_place"] = {"teamA": losers[0], "teamB": losers[1]}
    state["final"] = {"teamA": winners[0], "teamB": winners[1]}
    return {"success": True, "state": state}

# KNOCKOUT PREDICT
@router.post("/predict_knockout_match")
def predict_knockout(req: KnockoutPredictRequest):
    if req.scoreA != req.scoreB:
        winner = req.teamA if req.scoreA > req.scoreB else req.teamB
        return {
            "success": True,
            "stage": req.stage,
            "slot": req.match_slot,
            "scoreA": req.scoreA,
            "scoreB": req.scoreB,
            "wentToPenalties": False,
            "winner": winner,
        }

    if not req.penaltyWinner or req.penaltyWinner not in (req.teamA, req.teamB):
        raise HTTPException(status_code=400, detail="Valid penaltyWinner required")

    return {
        "success": True,
        "stage": req.stage,
        "slot": req.match_slot,
        "scoreA": req.scoreA,
        "scoreB": req.scoreB,
        "wentToPenalties": True,
        "winner": req.penaltyWinner,
    }

# SAVE FINAL
@router.post("/save_final")
def save_final(payload: dict):
    state = payload.get("state")
    user = payload.get("user_id", "guest")

    if not state or not state.get("final", {}).get("winner"):
        raise HTTPException(status_code=400, detail="Final not completed")

    tmp_dir = tempfile.gettempdir()
    filename = f"FIFA_World_Cup_{user}.pdf"
    file_path = os.path.join(tmp_dir, filename)

    export_fifa_worldcup_pdf(state=state, filename=file_path, username=user)

    try:
        save_to_ipfs(state, name=f"fifa_final_{user}")
    except Exception:
        pass

    return FileResponse(
        path=file_path,
        media_type="application/pdf",
        filename=filename,
    )

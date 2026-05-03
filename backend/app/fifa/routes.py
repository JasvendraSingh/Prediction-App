from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
import datetime, os
from fastapi.responses import FileResponse
import tempfile

from ..ipfs_utils import save_to_ipfs
from ..pdf_utils_fifa import export_fifa_worldcup_pdf
from .config import FIFA_CONFIG, FLAG_MAP
from .state import create_initial_state
from .groups import apply_group_match, generate_group_fixtures
from .knockouts import build_r32_from_tables, build_next_round

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

# (Playoffs removed — all 32 group-stage teams are already determined)

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
    """
    Build the Round of 32 using the 496-pairing lookup system.
    Each match includes pairing_id from R32_pairings.json plus posA/posB
    for transparency on how 3rd-place teams were assigned.
    """
    state = payload.get("state")
    if not state or not state.get("group_tables"):
        raise HTTPException(status_code=400, detail="Missing or empty group_tables in state")

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

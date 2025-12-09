# backend/app/fifa/routes.py
from fastapi import APIRouter, HTTPException
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import Optional
import datetime, os, json

from ..ipfs_utils import save_to_ipfs, get_latest_cid, load_from_ipfs
from ..pdf_utils import export_to_pdf
from .config import FIFA_CONFIG, FLAG_MAP
from .state import create_initial_state, replace_playoff_winners_in_groups
from .groups import apply_group_match, generate_group_fixtures
from .knockouts import build_r32_from_tables
from .playoffs import create_playoffs_state, run_playoff

router = APIRouter()

class KnockoutPredictRequest(BaseModel):
    user_id: str
    stage: str
    match_slot: str
    teamA: str
    teamB: str
    scoreA: int
    scoreB: int
    penaltyWinner: Optional[str] = None 

# --------- Initiate tournament ---------
@router.post("/init")
def init_tournament(payload: dict):
    user_id = payload.get("user_id", "guest")
    state = create_initial_state()
    state["created_at"] = datetime.datetime.utcnow().isoformat()
    return {"success": True, "state": state}


# --------- Playoffs init & run ----------
@router.get("/playoffs/init")
def playoffs_init():
    # returns playoff structure ready for predictions
    state = create_playoffs_state()
    return {"success": True, "state": state}

@router.post("/playoffs/predict_match")
def predict_playoff_match(payload: dict):
    """
    payload:
    {
      "key": "UEFA_Playoff_A",
      "round_type": "semifinals" | "round1" | "final",
      "match_id": "UPA-SF1",
      "scoreA": 1,
      "scoreB": 1,
      "penaltyWinner": "Italy"
    }
    """

    key = payload.get("key")
    round_type = payload.get("round_type")
    match_id = payload.get("match_id")
    scoreA = payload.get("scoreA")
    scoreB = payload.get("scoreB")
    penaltyWinner = payload.get("penaltyWinner")

    if key is None or round_type is None or match_id is None:
        raise HTTPException(status_code=400, detail="Missing key/round_type/match_id")

    # Load playoff block
    playoff = payload.get("state")
    if not playoff:
        raise HTTPException(status_code=400, detail="Missing playoff state")

    # Find match
    matches = playoff.get(round_type)
    if not matches:
        raise HTTPException(status_code=400, detail=f"Invalid round_type {round_type}")

    match = next((m for m in matches if m["match"] == match_id), None)
    if not match:
        raise HTTPException(status_code=400, detail="Match not found")

    teamA = match["teamA"]
    teamB = match["teamB"]

    # Decide winner
    if scoreA != scoreB:
        winner = teamA if scoreA > scoreB else teamB
    else:
        if not penaltyWinner:
            raise HTTPException(status_code=400, detail="Penalty winner required")
        if penaltyWinner not in (teamA, teamB):
            raise HTTPException(status_code=400, detail="Invalid penalty winner")
        winner = penaltyWinner

    # Update match in state
    match["scoreA"] = scoreA
    match["scoreB"] = scoreB
    match["winner"] = winner

    # If round complete, update next round
    if round_type == "round1":
        if all("winner" in m for m in playoff["round1"]):
            playoff["final"][0]["teamA"] = playoff["round1"][0]["winner"]

    if round_type == "semifinals":
        if all("winner" in m for m in playoff["semifinals"]):
            playoff["final"][0]["teamA"] = playoff["semifinals"][0]["winner"]
            playoff["final"][0]["teamB"] = playoff["semifinals"][1]["winner"]

    return {"success": True, "playoff": playoff, "winner": winner}


@router.post("/playoffs/run")
def playoffs_run(payload: dict):
    """
    payload: { "key": "UEFA_Playoff_A", "state": { ... } } - run simulation on provided block
    """
    key = payload.get("key")
    playoff_state = payload.get("state")
    if not key or not playoff_state:
        raise HTTPException(status_code=400, detail="Missing key/state")
    updated = run_playoff(key, playoff_state)
    # return winner
    final = updated.get("final", [{}])[0]
    winner = final.get("winner")
    return {"success": True, "playoff": updated, "winner": winner}

# POST /playoffs/predict_match  (match-by-match update)
@router.post("/playoffs/predict_match")
def predict_playoff_match(payload: dict):
    """
    payload:
    {
      "key": "UEFA_Playoff_A",
      "round_type": "semifinals" | "round1" | "final",
      "match_id": "UPA-SF1",
      "scoreA": 1,
      "scoreB": 1,
      "penaltyWinner": "Italy",
      "state": { ... }   # current playoff block state (optional but recommended)
    }
    """
    key = payload.get("key")
    round_type = payload.get("round_type")
    match_id = payload.get("match_id")
    scoreA = payload.get("scoreA")
    scoreB = payload.get("scoreB")
    penaltyWinner = payload.get("penaltyWinner")
    playoff_state = payload.get("state")

    if not key or not round_type or not match_id or scoreA is None or scoreB is None:
        raise HTTPException(status_code=400, detail="Missing fields")

    # Allow client to provide playoff_state (preferred). Otherwise load defaults.
    if not playoff_state:
        playoff_state = create_playoffs_state()
        # if provided key not present, error
    block = playoff_state.get(round_type)
    if block is None:
        raise HTTPException(status_code=400, detail=f"Invalid round_type {round_type}")

    # find the match object
    match = next((m for m in block if str(m.get("match")) == str(match_id)), None)
    if not match:
        raise HTTPException(status_code=400, detail="Match not found")

    teamA = match.get("teamA")
    teamB = match.get("teamB")

    # determine winner
    if scoreA != scoreB:
        winner = teamA if scoreA > scoreB else teamB
    else:
        if not penaltyWinner:
            raise HTTPException(status_code=400, detail="Penalty winner required for tied match")
        if penaltyWinner not in (teamA, teamB):
            raise HTTPException(status_code=400, detail="Invalid penalty winner")
        winner = penaltyWinner

    # update match record
    match["scoreA"] = int(scoreA)
    match["scoreB"] = int(scoreB)
    match["winner"] = winner

    # write the winner into next round slots if both matches complete
    # round1 -> final.teamA
    if round_type == "round1":
        if all("winner" in m for m in playoff_state.get("round1", [])):
            # assign first round winner into final[0].teamA as your existing logic expects
            playoff_state["final"][0]["teamA"] = playoff_state["round1"][0]["winner"]

    # semifinals -> final.teamA/teamB
    if round_type == "semifinals":
        if all("winner" in m for m in playoff_state.get("semifinals", [])):
            playoff_state["final"][0]["teamA"] = playoff_state["semifinals"][0]["winner"]
            playoff_state["final"][0]["teamB"] = playoff_state["semifinals"][1]["winner"]

    return {"success": True, "playoff": playoff_state, "winner": winner}


# POST /playoffs/commit_to_groups  (commit playoff winners into new initial state)
@router.post("/playoffs/commit_to_groups")
def commit_playoffs_to_groups(payload: dict):
    """
    payload:
    {
      "user_id": "guest",
      "playoffs_state": { <full playoffs state with winners> }
    }

    This creates an initial fifa state, replaces playoff placeholders in groups
    using replace_playoff_winners_in_groups(), and returns the complete state.
    """
    user_id = payload.get("user_id", "guest")
    playoffs_state = payload.get("playoffs_state")
    if not playoffs_state:
        raise HTTPException(status_code=400, detail="Missing playoffs_state")

    # create initial overall fifa state (groups, matches, group_tables...)
    state = create_initial_state()

    # Build winners_map: keys are the slot names or playoff keys; values are winners
    winners_map = {}
    for key, block in playoffs_state.items():
        # try block.final[0].winner or final winner field
        final = block.get("final") and block["final"][0]
        if final:
            w = final.get("winner")
            if w:
                # Use both slot_name and key as possible lookup tokens
                winners_map[block.get("slot_name", key)] = w
                winners_map[key] = w

    # Use your replace helper to inject winners (it returns new groups)
    new_groups = replace_playoff_winners_in_groups(state["groups"], winners_map)
    state["groups"] = new_groups

    # regenerate fixtures based on new groups
    from .groups import generate_group_fixtures
    state["matches"] = generate_group_fixtures(state["groups"])
    state["group_tables"] = {g: {} for g in state["groups"].keys()}

    # DO NOT save to IPFS here (only save on submit_group_results and save_final)
    return {"success": True, "state": state}


# --------- Flag endpoint ----------
@router.get("/flag/{team}")
def get_flag(team: str):
    code = FLAG_MAP.get(team)
    if not code:
        return {"success": False, "url": None}
    url = f"https://flagcdn.com/w40/{code}.png"
    return {"success": True, "team": team, "code": code, "url": url}

# --------- Group stage match prediction ----------
@router.post("/predict_group_match")
def predict_group_match(payload: dict):
    """
    payload: {user_id, group, match_id, teamA, teamB}
    returns simulated/predicted score
    """
    try:
        teamA = payload["teamA"]; teamB = payload["teamB"]
    except KeyError:
        raise HTTPException(status_code=400, detail="Missing fields")
    # try to use app.predictions.predict_match if exists
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
    # fallback simple random deterministic
    import random
    r = random.Random(teamA + teamB)
    a = r.randint(0,4); b = r.randint(0,4)
    return {"success": True, "scoreA": a, "scoreB": b}

# --------- Submit group results (compute group tables) ----------
@router.post("/submit_group_results")
def submit_group_results(payload: dict):
    """
    payload: { user_id, state }
    state: { groups, matches } where matches[group] is list of matches with played flag and scoreA/scoreB
    """
    state = payload.get("state")
    if not state:
        raise HTTPException(status_code=400, detail="Missing state")
    matches = state.get("matches", {})
    group_tables = {}
    for g, mlist in matches.items():
        table = {}
        for m in mlist:
            if m.get("played"):
                apply_group_match(table, m["teamA"], m["teamB"], m["scoreA"], m["scoreB"])
        group_tables[g] = table
    state["group_tables"] = group_tables
    # save to IPFS
    user = payload.get("user_id", "guest")
    cid = save_to_ipfs(state, name=f"fifa_groups_{user}")
    return {"success": True, "state": state, "ipfs_cid": cid}

# --------- Generate R32 ----------
@router.post("/generate_r32")
def generate_r32(payload: dict):
    state = payload.get("state")
    if not state or "group_tables" not in state:
        raise HTTPException(status_code=400, detail="Group stage incomplete")
    try:
        r32 = build_r32_from_tables(state["group_tables"])
        state["r32"] = r32
        return {"success": True, "r32": r32, "state": state}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# --------- Knockout predict ----------
@router.post("/predict_knockout_match")
def predict_knockout(req: KnockoutPredictRequest):
    """
    Predict knockout match results.
    User MUST choose penaltyWinner if the match ends in a draw.
    """

    a = req.scoreA
    b = req.scoreB

    # CASE 1 — Normal win in 90 mins
    if a != b:
        winner = req.teamA if a > b else req.teamB
        return {
            "success": True,
            "stage": req.stage,
            "slot": req.match_slot,
            "scoreA": a,
            "scoreB": b,
            "wentToPenalties": False,
            "winner": winner
        }

    # CASE 2 — MATCH TIED → USER MUST CHOOSE PK WINNER
    if not req.penaltyWinner:
        raise HTTPException(
            status_code=400,
            detail="Match is tied — 'penaltyWinner' is required for knockout matches."
        )

    if req.penaltyWinner not in (req.teamA, req.teamB):
        raise HTTPException(
            status_code=400,
            detail="penaltyWinner must be one of the teams playing the match."
        )

    return {
        "success": True,
        "stage": req.stage,
        "slot": req.match_slot,
        "scoreA": a,
        "scoreB": b,
        "wentToPenalties": True,
        "winner": req.penaltyWinner
    }

# --------- Save final ----------
@router.post("/save_final")
def save_final(payload: dict):
    state = payload.get("state")
    if not state:
        raise HTTPException(status_code=400, detail="Missing state")
    user = payload.get("user_id", "guest")
    cid = save_to_ipfs(state, name=f"fifa_final_{user}")
    return {"success": True, "saved": True, "ipfs_cid": cid}

import copy
import random
from .config import FIFA_CONFIG

try:
    from ..predictions import predict_match as model_predict
except Exception:
    model_predict = None

def create_playoffs_state():
    """
    Returns a deep-copied FIFA playoff structure from FIFA_CONFIG.
    This does NOT include any UEFA logic because UEFA has no playoffs.
    """
    raw = FIFA_CONFIG.get("playoffs", {})
    return copy.deepcopy(raw)

def simulate_score(teamA, teamB):
    seed = (teamA + "_" + teamB).lower()
    r = random.Random(seed)
    return r.randint(0, 4), r.randint(0, 4)

def get_score(teamA, teamB):
    """Try model_predict; otherwise fallback to deterministic pseudo-random."""
    if model_predict:
        try:
            res = model_predict(teamA, teamB)
            return res["scoreA"], res["scoreB"]
        except Exception:
            pass
    return simulate_score(teamA, teamB)

def run_playoff(playoff_key, playoff_state):
    """
    Handles ONLY FIFA-style playoffs:

    Case 1 → 2-stage playoff:
        round1 → final

    Case 2 → UEFA-style format for playoffs:
        semifinals (2 matches) → final

    But these structures refer ONLY to FIFA playoffs present in config.
    UEFA competitions (UCL/UEL/UCFL) never enter here.
    """
    state = playoff_state

    if "round1" in state:
        # Play ROUND 1
        for match in state["round1"]:
            a = match["teamA"]
            b = match["teamB"]

            sa, sb = get_score(a, b)
            match["scoreA"] = sa
            match["scoreB"] = sb

            if sa > sb:
                match["winner"] = a
            elif sb > sa:
                match["winner"] = b
            else:
                match["winner"] = a if random.random() < 0.5 else b

        final = state["final"][0]
        final["teamA"] = state["round1"][0]["winner"]

        teamA = final["teamA"]
        teamB = final["teamB"]

        sa, sb = get_score(teamA, teamB)
        final["scoreA"] = sa
        final["scoreB"] = sb

        final["winner"] = teamA if sa > sb else (teamB if sb > sa else (teamA if random.random() < 0.5 else teamB))

        return state

    if "semifinals" in state:
        semifinals = state["semifinals"]

        # Play semis
        for match in semifinals:
            a = match["teamA"]
            b = match["teamB"]

            sa, sb = get_score(a, b)
            match["scoreA"] = sa
            match["scoreB"] = sb

            match["winner"] = a if sa > sb else (b if sb > sa else (a if random.random() < 0.5 else b))

        final = state["final"][0]
        final["teamA"] = semifinals[0]["winner"]
        final["teamB"] = semifinals[1]["winner"]

        a = final["teamA"]
        b = final["teamB"]
        sa, sb = get_score(a, b)
        final["scoreA"] = sa
        final["scoreB"] = sb

        final["winner"] = a if sa > sb else (b if sb > sa else (a if random.random() < 0.5 else b))

        return state

    return state

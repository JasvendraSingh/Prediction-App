import copy
from .config import FIFA_CONFIG

def create_playoffs_state():
    return copy.deepcopy(FIFA_CONFIG.get("playoffs", {}))

def resolve_winner(match):
    sa = match.get("scoreA")
    sb = match.get("scoreB")

    if sa is None or sb is None:
        return None

    a = int(sa)
    b = int(sb)

    if a > b:
        return match["teamA"]
    if b > a:
        return match["teamB"]

    return match.get("penaltyWinner")

def run_playoff(playoff_key, playoff_state):
    """
    STRUCTURAL PROGRESSION ONLY
    NO SCORE GENERATION
    NO AUTO WINNERS
    """
    state = playoff_state

    # FIFA intercontinental playoff
    if "round1" in state:
        r1 = state["round1"][0]
        final = state["final"][0]

        if r1.get("winner") and not final.get("teamA"):
            final["teamA"] = r1["winner"]

        return state

    # UEFA playoffs
    if "semifinals" in state:
        semis = state["semifinals"]
        final = state["final"][0]

        w1 = semis[0].get("winner")
        w2 = semis[1].get("winner")

        if w1 and w2:
            final.setdefault("teamA", w1)
            final.setdefault("teamB", w2)

        return state

    return state

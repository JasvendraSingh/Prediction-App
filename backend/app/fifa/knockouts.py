import copy
from .groups import rank_group, best_third_places
from .config import FIFA_CONFIG

# ---------------- R32 ----------------
R32_SLOTS = FIFA_CONFIG["knockouts"]["round_of_32"]

def build_r32_from_tables(group_tables):
    """
    group_tables: {group: {team:stats}}
    returns r32 dict: {match_id: {"teamA":..., "teamB":...}, ...}
    """
    top1 = {}
    top2 = {}

    for g, table in group_tables.items():
        ranked = rank_group(table)
        if len(ranked) < 2:
            raise ValueError(f"Group {g} incomplete")
        top1[g] = ranked[0]["team"]
        top2[g] = ranked[1]["team"]

    thirds = best_third_places(group_tables)
    third_teams = [x["team"] for x in thirds]

    r32 = {}

    for slot in R32_SLOTS:
        for match_id, rule in slot.items():
            left, right = [x.strip() for x in rule.split("vs")]

            def resolve(tok):
                tok = tok.strip()
                if tok.startswith("1") and len(tok) >= 2:
                    return top1[tok[1]]
                if tok.startswith("2") and len(tok) >= 2:
                    return top2[tok[1]]
                if tok.startswith("best3rd"):
                    return third_teams.pop(0) if third_teams else None
                return tok

            r32[match_id] = {
                "teamA": resolve(left),
                "teamB": resolve(right),
            }

    return r32


# ---------------- GENERIC NEXT ROUND ----------------
def build_next_round(prev_round: dict, next_round_key: str):
    """
    prev_round: {
      "R32_01": { teamA, teamB, winner, ... },
      ...
    }

    next_round_key: "r16" | "qf" | "sf" | "final"

    returns:
    {
      "R16_01": { teamA, teamB },
      ...
    }
    """

    winners = []

    for match_id, match in prev_round.items():
        winner = match.get("winner")
        if not winner:
            raise ValueError(f"Match {match_id} has no winner")
        winners.append(winner)

    if len(winners) % 2 != 0:
        raise ValueError("Odd number of winners — bracket invalid")

    next_round = {}
    prefix = next_round_key.upper()

    for i in range(0, len(winners), 2):
        slot = f"{prefix}_{(i // 2) + 1:02d}"
        next_round[slot] = {
            "teamA": winners[i],
            "teamB": winners[i + 1],
        }

    return next_round

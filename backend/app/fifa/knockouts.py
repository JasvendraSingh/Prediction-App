import copy
from .groups import rank_group, best_third_places
from .config import FIFA_CONFIG

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
    # iterate in order and resolve tokens
    for slot in R32_SLOTS:
        for match_id, rule in slot.items():
            left, right = [x.strip() for x in rule.split("vs")]
            def resolve(tok):
                tok = tok.strip()
                if tok.startswith("1") and len(tok) >=2:
                    g = tok[1]
                    return top1[g]
                if tok.startswith("2") and len(tok) >=2:
                    g = tok[1]
                    return top2[g]
                if tok.startswith("best3rd"):
                    # pop in order produced by best_third_places
                    return third_teams.pop(0) if third_teams else None
                return tok
            a = resolve(left); b = resolve(right)
            r32[match_id] = {"teamA": a, "teamB": b}
    return r32

import uuid
import copy

def generate_group_fixtures(groups):
    """
    groups: { "A": [t1,t2,t3,t4], ... }
    returns: matches dict: { "A": [ {id,teamA,teamB,played,scoreA,scoreB}, ... ], ... }
    """
    state_matches = {}
    for g, teams in groups.items():
        # standard 4-team round robin 6 matches
        fixtures = [
            (teams[0], teams[1]),
            (teams[2], teams[3]),
            (teams[0], teams[2]),
            (teams[1], teams[3]),
            (teams[0], teams[3]),
            (teams[1], teams[2]),
        ]
        state_matches[g] = [{
            "id": str(uuid.uuid4()),
            "teamA": a,
            "teamB": b,
            "played": False,
            "scoreA": None,
            "scoreB": None
        } for a, b in fixtures]
    return state_matches

def apply_group_match(table, A, B, ga, gb):
    # creates team rows if missing and updates stats
    for t in (A, B):
        if t not in table:
            table[t] = {"played":0, "won":0, "drawn":0, "lost":0, "gf":0, "ga":0, "gd":0, "points":0}
    ta = table[A]; tb = table[B]
    ta["played"] += 1; tb["played"] += 1
    ta["gf"] += ga; ta["ga"] += gb; ta["gd"] = ta["gf"] - ta["ga"]
    tb["gf"] += gb; tb["ga"] += ga; tb["gd"] = tb["gf"] - tb["ga"]
    if ga > gb:
        ta["won"] += 1; tb["lost"] += 1; ta["points"] += 3
    elif gb > ga:
        tb["won"] += 1; ta["lost"] += 1; tb["points"] += 3
    else:
        ta["drawn"] += 1; tb["drawn"] += 1; ta["points"] += 1; tb["points"] += 1

def rank_group(table):
    """
    table: {team: stats}
    returns: list of rows sorted by points,gd,gf descending with keys team,points,gd,gf,played,won,drawn,lost
    """
    rows = []
    for team, s in table.items():
        rows.append({
            "team": team,
            "points": s["points"],
            "gd": s["gd"],
            "gf": s["gf"],
            "played": s["played"],
            "won": s["won"],
            "drawn": s["drawn"],
            "lost": s["lost"]
        })
    rows.sort(key=lambda r: (r["points"], r["gd"], r["gf"]), reverse=True)
    return rows

def best_third_places(group_tables, top_n=8):
    """
    group_tables: {group: {team:stats}}
    returns list of top third place teams in order by points/gd/gf
    """
    thirds = []
    for g, table in group_tables.items():
        ranked = rank_group(table)
        if len(ranked) >=3:
            t = ranked[2]
            thirds.append({"group": g, "team": t["team"], "points": t["points"], "gd": t["gd"], "gf": t["gf"]})
    thirds.sort(key=lambda r: (r["points"], r["gd"], r["gf"]), reverse=True)
    return thirds[:top_n]

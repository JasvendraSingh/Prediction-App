import copy
from .config import FIFA_CONFIG
from .groups import generate_group_fixtures

def create_initial_state():
    """
    Create initial tournament state:
      - groups (from config)
      - matches (fixtures generated)
      - group_tables empty
      - created_at timestamp string (frontend can fill)
    """
    groups = copy.deepcopy(FIFA_CONFIG["groupStage"]["groups"])
    matches = generate_group_fixtures(groups)
    state = {
        "groups": groups,
        "matches": matches,
        "group_tables": {g: {} for g in groups.keys()},
        "created_at": None  # backend caller can fill datetime.isoformat()
    }
    return state

def replace_playoff_winners_in_groups(groups, winners_map):
    """
    winners_map: keys like 'UEFA_Playoff_A' or 'FIFA_Playoff_1' or 'UEFA Playoff A' variations.
    We'll normalize both: allow keys with spaces or underscores.
    """
    out = copy.deepcopy(groups)
    # Normalize winners_map keys to both underscore and space variants
    norm = {}
    for k, v in winners_map.items():
        norm[k] = v
        norm[k.replace("_"," ")] = v
        norm[k.replace(" ","_")] = v
    for g, teams in out.items():
        for i, t in enumerate(teams):
            if t in norm:
                out[g][i] = norm[t]
    return out

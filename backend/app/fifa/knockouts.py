import json
import os
import copy
from .groups import rank_group, best_third_places
from .config import FIFA_CONFIG

# ------------------------------------------------------------------ #
#  POSITION MAPPING                                                    #
#  Team_1  .. Team_12 → 1st place: Group A, B, C, D, E, F, G, H,    #
#                                   I, J, K, L                        #
#  Team_13 .. Team_24 → 2nd place: Group A, B, C, D, E, F, G, H,    #
#                                   I, J, K, L                        #
#  Team_25 .. Team_32 → 8 best 3rd-place teams (ranked 1st→8th)     #
# ------------------------------------------------------------------ #

GROUPS = list("ABCDEFGHIJKL")          # 12 groups in order

# Load the 496-pairing lookup once at module level
_DATA_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "data")
_R32_PATH = os.path.join(_DATA_DIR, "R32_pairings.json")

with open(_R32_PATH, "r", encoding="utf-8") as _f:
    _R32_DATA = json.load(_f)

# Build a fast lookup: (team_1_idx, team_2_idx) → pairing_id
# where team_1_idx / team_2_idx are 1-based integers (1..32)
_PAIRING_LOOKUP: dict[tuple[int, int], int] = {}
for _p in _R32_DATA["pairings"]:
    _i = int(_p["team_1"].split("_")[1])
    _j = int(_p["team_2"].split("_")[1])
    lo, hi = min(_i, _j), max(_i, _j)
    _PAIRING_LOOKUP[(lo, hi)] = _p["pairing_id"]


def position_index(group: str, place: int) -> int:
    """
    Return the 1-based Team_N position for a group-stage finisher.
      place=1 → 1st place (positions 1-12)
      place=2 → 2nd place (positions 13-24)
    """
    idx = GROUPS.index(group)
    if place == 1:
        return idx + 1           # 1..12
    elif place == 2:
        return idx + 13          # 13..24
    raise ValueError(f"place must be 1 or 2, got {place}")


def third_place_index(rank: int) -> int:
    """
    rank is 1-based (1 = best 3rd place team → Team_25, 8 = worst → Team_32).
    """
    if not 1 <= rank <= 8:
        raise ValueError(f"rank must be 1-8, got {rank}")
    return 24 + rank             # 25..32


def get_pairing_id(pos_a: int, pos_b: int) -> int:
    """
    Return the pairing_id for two 1-based position indices.
    """
    lo, hi = min(pos_a, pos_b), max(pos_a, pos_b)
    pid = _PAIRING_LOOKUP.get((lo, hi))
    if pid is None:
        raise KeyError(f"No pairing found for Team_{lo} vs Team_{hi}")
    return pid


# ------------------------------------------------------------------ #
#  R32 BRACKET DEFINITION                                             #
#                                                                     #
#  Each slot is a tuple:                                              #
#    (slot_id, side_A_spec, side_B_spec)                             #
#  where a spec is one of:                                            #
#    ("winner", group)      → 1st-place team of that group           #
#    ("runner_up", group)   → 2nd-place team of that group           #
#    ("best3rd", rank)      → Nth best 3rd-place team (1=best)       #
#                                                                     #
#  Slot order matches official FIFA 2026 bracket (matches 73-88).    #
# ------------------------------------------------------------------ #

R32_BRACKET_TEMPLATE = [
    # slot_id,  side_A,                    side_B
    ("73",  ("runner_up", "A"),        ("runner_up", "B")),
    ("74",  ("winner",   "E"),         ("best3rd",   1)),
    ("75",  ("winner",   "F"),         ("runner_up", "C")),
    ("76",  ("winner",   "C"),         ("runner_up", "F")),
    ("77",  ("winner",   "I"),         ("best3rd",   2)),
    ("78",  ("runner_up","E"),         ("runner_up", "I")),
    ("79",  ("winner",   "A"),         ("best3rd",   3)),
    ("80",  ("winner",   "L"),         ("best3rd",   4)),
    ("81",  ("winner",   "D"),         ("best3rd",   5)),
    ("82",  ("winner",   "G"),         ("best3rd",   6)),
    ("83",  ("runner_up","K"),         ("runner_up", "L")),
    ("84",  ("winner",   "H"),         ("runner_up", "J")),
    ("85",  ("winner",   "B"),         ("best3rd",   7)),
    ("86",  ("winner",   "J"),         ("runner_up", "H")),
    ("87",  ("winner",   "K"),         ("best3rd",   8)),
    ("88",  ("runner_up","D"),         ("runner_up", "G")),
]


def build_r32_from_tables(group_tables: dict) -> dict:
    """
    Build the Round of 32 bracket using the 496-pairing lookup system.

    group_tables: {group_letter: {team_name: stats_dict}}

    Returns:
        r32: {
            slot_id: {
                "teamA": str,
                "teamB": str,
                "pairing_id": int,       ← from R32_pairings.json
                "posA": int,             ← Team_N position (1-32)
                "posB": int,
            }
        }
    """
    # ---- 1. Rank each group ----
    top1: dict[str, str] = {}   # group → 1st-place team name
    top2: dict[str, str] = {}   # group → 2nd-place team name

    for g, table in group_tables.items():
        ranked = rank_group(table)
        if len(ranked) < 2:
            raise ValueError(f"Group {g} incomplete — only {len(ranked)} team(s) ranked")
        top1[g] = ranked[0]["team"]
        top2[g] = ranked[1]["team"]

    # ---- 2. Find the 8 best 3rd-place teams ----
    thirds_info = best_third_places(group_tables, top_n=8)
    thirds: list[str] = [x["team"] for x in thirds_info]   # ranked best→worst

    if len(thirds) < 8:
        raise ValueError(
            f"Need 8 best 3rd-place teams, only found {len(thirds)}. "
            "Make sure all groups have at least 3 teams with results."
        )

    # ---- 3. Resolve each bracket slot ----
    def resolve_spec(spec) -> tuple[str, int]:
        """Return (team_name, position_index_1_to_32)."""
        kind, val = spec
        if kind == "winner":
            grp = val
            return top1[grp], position_index(grp, 1)
        elif kind == "runner_up":
            grp = val
            return top2[grp], position_index(grp, 2)
        elif kind == "best3rd":
            rank = val          # 1-based rank among 8 best 3rd-place teams
            return thirds[rank - 1], third_place_index(rank)
        else:
            raise ValueError(f"Unknown spec kind: {kind!r}")

    r32: dict = {}
    for slot_id, spec_a, spec_b in R32_BRACKET_TEMPLATE:
        team_a, pos_a = resolve_spec(spec_a)
        team_b, pos_b = resolve_spec(spec_b)
        pid = get_pairing_id(pos_a, pos_b)

        r32[slot_id] = {
            "teamA":      team_a,
            "teamB":      team_b,
            "pairing_id": pid,
            "posA":       pos_a,
            "posB":       pos_b,
        }

    return r32


# ------------------------------------------------------------------ #
#  GENERIC NEXT-ROUND BUILDER  (R16, QF, SF, Final)                  #
# ------------------------------------------------------------------ #

# R16 bracket: which R32 winners pair up (official FIFA 2026 draw)
R16_PAIRS = [
    ("R16_01", "73", "88"),
    ("R16_02", "74", "87"),
    ("R16_03", "75", "86"),
    ("R16_04", "76", "85"),
    ("R16_05", "77", "84"),
    ("R16_06", "78", "83"),
    ("R16_07", "79", "82"),
    ("R16_08", "80", "81"),
]


def build_next_round(prev_round: dict, next_round_key: str) -> dict:
    """
    Build the next knockout round from the previous round's results.

    For R16: uses the official FIFA 2026 bracket pairings (R16_PAIRS).
    For QF/SF/Final: pairs winners sequentially (winner[0] vs winner[1], etc.)

    prev_round: {slot_id: {teamA, teamB, winner, ...}}
    next_round_key: "r16" | "qf" | "sf" | "final"
    """
    if next_round_key == "r16":
        # Official bracket: specific R32 match winners face each other
        next_round = {}
        for r16_slot, r32_a, r32_b in R16_PAIRS:
            match_a = prev_round.get(r32_a) or prev_round.get(f"R32_{r32_a}")
            match_b = prev_round.get(r32_b) or prev_round.get(f"R32_{r32_b}")

            if not match_a or not match_a.get("winner"):
                raise ValueError(f"R32 match {r32_a} has no winner yet")
            if not match_b or not match_b.get("winner"):
                raise ValueError(f"R32 match {r32_b} has no winner yet")

            next_round[r16_slot] = {
                "teamA": match_a["winner"],
                "teamB": match_b["winner"],
            }
        return next_round

    # For QF, SF, Final: pair winners sequentially
    winners = []
    for match_id, match in prev_round.items():
        winner = match.get("winner")
        if not winner:
            raise ValueError(f"Match {match_id} has no winner yet")
        winners.append(winner)

    if len(winners) % 2 != 0:
        raise ValueError("Odd number of winners — bracket is invalid")

    next_round = {}
    prefix = next_round_key.upper()
    for i in range(0, len(winners), 2):
        slot = f"{prefix}_{(i // 2) + 1:02d}"
        next_round[slot] = {
            "teamA": winners[i],
            "teamB": winners[i + 1],
        }

    return next_round

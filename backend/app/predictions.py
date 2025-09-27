league_progress = {} 

def parse_predictions(matches, predictions_json, league: str):
    """
    matches: list of (home, away) tuples
    predictions_json: dict of "Home_vs_Away": "score-score"
    league: str ("UEL" or "UCFL")
    """
    if league not in league_progress:
        league_progress[league] = {}

    parsed = {}
    for home, away in matches:
        key = f"{home}_vs_{away}"
        if key in predictions_json:
            try:
                home_score, away_score = map(int, predictions_json[key].split("-"))
                parsed[(home, away)] = (home_score, away_score)
            except ValueError:
                parsed[(home, away)] = (0, 0)  # invalid → default
        else:
            parsed[(home, away)] = (0, 0)  # missing → default

    # Merge into persistent storage (cumulative across matchdays)
    league_progress[league].update(parsed)

    return league_progress[league]

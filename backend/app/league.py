def calculate_league_table(matches, predictions):
    teams = {}
    for (home, away), (home_score, away_score) in predictions.items():
        for team in [home, away]:
            if team not in teams:
                teams[team] = {
                    "played": 0, "won": 0, "draw": 0, "lost": 0,
                    "points": 0, "goal_difference": 0
                }

        teams[home]["played"] += 1
        teams[away]["played"] += 1

        if home_score > away_score:
            teams[home]["won"] += 1
            teams[away]["lost"] += 1
            teams[home]["points"] += 3
        elif home_score < away_score:
            teams[away]["won"] += 1
            teams[home]["lost"] += 1
            teams[away]["points"] += 3
        else:
            teams[home]["draw"] += 1
            teams[away]["draw"] += 1
            teams[home]["points"] += 1
            teams[away]["points"] += 1

        teams[home]["goal_difference"] += (home_score - away_score)
        teams[away]["goal_difference"] += (away_score - home_score)

    return teams


def format_table_for_frontend(teams_dict):
    """
    Convert the teams dictionary to a sorted array for the frontend
    """
    table = []
    for team_name, stats in teams_dict.items():
        table.append({
            "team": team_name,
            "points": stats["points"],
            "gd": stats["goal_difference"],
            "played": stats["played"],
            "won": stats["won"],
            "draw": stats["draw"],
            "lost": stats["lost"]
        })
    
    # Sort by points (desc), then by goal difference (desc)
    table.sort(key=lambda x: (x["points"], x["gd"]), reverse=True)
    
    return table
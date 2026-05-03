import os, json

STORAGE_DIR = "storage"
os.makedirs(STORAGE_DIR, exist_ok=True)

def get_local_path(username: str, league: str):
    return os.path.join(STORAGE_DIR, f"{username}_{league}.json")

def save_predictions_locally(username: str, league: str, matchday: str, predictions: list):
    path = get_local_path(username, league)
    data = {}
    if os.path.exists(path):
        with open(path, "r") as f:
            data = json.load(f)

    data[matchday] = predictions

    with open(path, "w") as f:
        json.dump(data, f, indent=2)
    return data

def load_all_predictions(username: str, league: str):
    path = get_local_path(username, league)
    if os.path.exists(path):
        with open(path, "r") as f:
            return json.load(f)
    return {}

def clear_league_data(username: str, league: str):
    path = get_local_path(username, league)
    if os.path.exists(path):
        os.remove(path)

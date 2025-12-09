import json
import os

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(os.path.dirname(BASE_DIR), "data")  # ../data
FIFA_JSON_PATH = os.path.join(DATA_DIR, "fifa2026.json")
FLAGS_JSON_PATH = os.path.join(DATA_DIR, "fifa_flags.json")

# load fifa config
with open(FIFA_JSON_PATH, "r", encoding="utf-8") as f:
    FIFA_CONFIG = json.load(f)

# load flags map (team -> country code)
if os.path.exists(FLAGS_JSON_PATH):
    with open(FLAGS_JSON_PATH, "r", encoding="utf-8") as f:
        FLAG_MAP = json.load(f)
else:
    FLAG_MAP = {}

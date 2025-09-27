import requests
from bs4 import BeautifulSoup, Comment
from collections import defaultdict
import json
import os
import time
from .ipfs_utils import save_to_ipfs, load_from_ipfs

CACHE_DIR = "cache"
os.makedirs(CACHE_DIR, exist_ok=True)

def scrape_matches(url: str, cache_file: str, force_refresh=False):
    """
    Returns dict:
    {
      "1": [ {home, away, home_score, away_score, played}, ... ],
      "2": [ ... ]
    }
    """
    cache_path = os.path.join(CACHE_DIR, cache_file)

    # Load cache if exists and not force_refresh
    if not force_refresh and os.path.exists(cache_path):
        with open(cache_path, "r", encoding="utf-8") as f:
            print(f" Loading matches from cache: {cache_file}")
            return json.load(f)

    print(f" Scraping FBref URL: {url}")
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
                      "(KHTML, like Gecko) Chrome/140.0 Safari/537.36",
        "Accept-Language": "en-US,en;q=0.9",
        "Referer": "https://fbref.com/"
    }

    # Retry on 429
    for attempt in range(1, 6):
        response = requests.get(url, headers=headers)
        if response.status_code == 200:
            break
        elif response.status_code == 429:
            wait = 2 ** attempt
            print(f" 429 Too Many Requests, retrying in {wait}s...")
            time.sleep(wait)
        else:
            print(f" Failed to fetch URL {url} (status {response.status_code})")
            return {}
    else:
        print(" Max retries exceeded")
        return {}

    soup = BeautifulSoup(response.text, "html.parser")
    matches_by_day = defaultdict(list)

    # Determine table ID based on URL/competition
    if "882" in url:
        table_id = "sched_2025-2026_882_2"  # UCFL
    elif "19" in url:
        table_id = "sched_2025-2026_19_2"   # UEL
    else:
        table_id = None

    # Find table
    table = soup.find("table", {"id": table_id})

    # Also check inside comments (some tables are commented out)
    if not table:
        comments = soup.find_all(string=lambda text: isinstance(text, Comment))
        for c in comments:
            if table_id in c:
                comment_soup = BeautifulSoup(c, "html.parser")
                table = comment_soup.find("table", {"id": table_id})
                if table:
                    break

    if not table:
        print(f" No schedule table found. Table ID may have changed or structure is different: {table_id}")
        return {}

    # Parse rows
    for row in table.find("tbody").find_all("tr"):
        if "class" in row.attrs and "spacer" in row["class"]:
            continue

        matchday_cell = row.find("th", {"data-stat": "gameweek"})
        if not matchday_cell or not matchday_cell.text.strip():
            continue
        matchday = matchday_cell.text.strip()

        # Home team (name is in <a>)
        home_cell = row.find("td", {"data-stat": "home_team"})
        home_team_a = home_cell.find("a")
        home_team = home_team_a.get_text(strip=True) if home_team_a else ""

        # Away team (name is in <a>)
        away_cell = row.find("td", {"data-stat": "away_team"})
        away_team_a = away_cell.find("a")
        away_team = away_team_a.get_text(strip=True) if away_team_a else ""

        # Score
        score_cell = row.find("td", {"data-stat": "score"})
        home_score, away_score, played = None, None, False
        if score_cell and score_cell.text.strip() and "-" in score_cell.text:
            parts = score_cell.text.strip().replace("–", "-").split("-")
            if len(parts) == 2:
                try:
                    home_score, away_score = int(parts[0]), int(parts[1])
                    played = True
                except ValueError:
                    pass

        matches_by_day[matchday].append({
            "home": home_team,
            "away": away_team,
            "home_score": home_score,
            "away_score": away_score,
            "played": played
        })

    matches_by_day = dict(matches_by_day)

    # Save local cache
    with open(cache_path, "w", encoding="utf-8") as f:
        json.dump(matches_by_day, f, ensure_ascii=False, indent=2)
        print(f" Matches saved to cache: {cache_file}")

    # Push to IPFS
    try:
        cid = save_to_ipfs(matches_by_day)
        print(f" Data pushed to IPFS: CID={cid}")
    except Exception as e:
        print(f"  Failed to push to IPFS: {e}")

    return matches_by_day

def scrape_uel(force_refresh=False):
    url = "https://fbref.com/en/comps/19/schedule/Europa-League-Scores-and-Fixtures"
    cache_file = "uel_matches.json"
    return scrape_matches(url, cache_file, force_refresh=force_refresh)

def scrape_ucfl(force_refresh=False):
    url = "https://fbref.com/en/comps/882/schedule/Conference-League-Scores-and-Fixtures"
    cache_file = "ucfl_matches.json"
    return scrape_matches(url, cache_file, force_refresh=force_refresh)

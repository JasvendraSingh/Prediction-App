import requests
from bs4 import BeautifulSoup, Comment
from collections import defaultdict
import json
import os
import time
from datetime import datetime
from .ipfs_utils import save_to_ipfs, load_from_ipfs

CACHE_DIR = os.getenv("CACHE_DIR", "cache")
os.makedirs(CACHE_DIR, exist_ok=True)

def should_refresh_cache(cache_path, max_age_hours=24):
    """Check if cache should be refreshed based on age"""
    if not os.path.exists(cache_path):
        return True
    file_time = os.path.getmtime(cache_path)
    current_time = time.time()
    age_hours = (current_time - file_time) / 3600    
    return age_hours > max_age_hours

def scrape_matches(url: str, cache_file: str, ipfs_name: str, force_refresh=False):
    """
    Data loading priority:
    1. Check if force_refresh is True
    2. Check cache age (auto-refresh if older than 24 hours)
    3. Load from local cache
    4. Load from Pinata IPFS
    5. Scrape from web
    Returns dict:
    {
      "1": [ {home, away, home_score, away_score, played, date}, ... ],
      "2": [ ... ]
    }
    """
    cache_path = os.path.join(CACHE_DIR, cache_file)
    # Check if we should auto-refresh based on cache age
    if not force_refresh and should_refresh_cache(cache_path):
        print(f" Cache is older than 24 hours, forcing refresh")
        force_refresh = True
    # Step 1: Try loading from local cache (if not force_refresh)
    if not force_refresh and os.path.exists(cache_path):
        try:
            with open(cache_path, "r", encoding="utf-8") as f:
                data = json.load(f)
                print(f" Loading matches from local cache: {cache_file}")
                return data
        except Exception as e:
            print(f"  Failed to load cache: {e}")
    # Step 2: Try loading from Pinata IPFS
    if not force_refresh:
        print(f" Attempting to load from Pinata IPFS: {ipfs_name}")
        ipfs_data = load_from_ipfs(name=ipfs_name)
        if ipfs_data:
            # Save to local cache for future use
            with open(cache_path, "w", encoding="utf-8") as f:
                json.dump(ipfs_data, f, ensure_ascii=False, indent=2)
            print(f" Loaded from IPFS and cached locally")
            return ipfs_data
    # Step 3: Scrape from web
    print(f" Scraping FBref URL: {url}")
    # Add delay to avoid rate limiting
    time.sleep(3)
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
                      "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
        "Accept-Encoding": "gzip, deflate, br",
        "DNT": "1",
        "Connection": "keep-alive",
        "Upgrade-Insecure-Requests": "1",
        "Sec-Fetch-Dest": "document",
        "Sec-Fetch-Mode": "navigate",
        "Sec-Fetch-Site": "none",
        "Cache-Control": "max-age=0",
        "Referer": "https://fbref.com/"
    }
    # Retry on 429 or 403
    response = None
    for attempt in range(1, 6):
        try:
            response = requests.get(url, headers=headers, timeout=15)
            if response.status_code == 200:
                break
            elif response.status_code in [429, 403]:
                wait = 5 * attempt
                print(f" Status {response.status_code}, retrying in {wait}s... (attempt {attempt}/5)")
                time.sleep(wait)
            else:
                print(f" Failed to fetch URL {url} (status {response.status_code})")
                return {}
        except requests.exceptions.RequestException as e:
            wait = 3 * attempt
            print(f" Request error: {e}, retrying in {wait}s...")
            time.sleep(wait)
    else:
        print(" Max retries exceeded")
        return {}
    if not response or response.status_code != 200:
        print(f" Could not fetch data after retries")
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
        print(f" No schedule table found. Table ID may have changed: {table_id}")
        return {}
    # Parse rows
    for row in table.find("tbody").find_all("tr"):
        if "class" in row.attrs and "spacer" in row["class"]:
            continue
        matchday_cell = row.find("th", {"data-stat": "gameweek"})
        if not matchday_cell or not matchday_cell.text.strip():
            continue
        matchday = matchday_cell.text.strip()
        # Home team 
        home_cell = row.find("td", {"data-stat": "home_team"})
        home_team_a = home_cell.find("a") if home_cell else None
        home_team = home_team_a.get_text(strip=True) if home_team_a else ""
        # Away team 
        away_cell = row.find("td", {"data-stat": "away_team"})
        away_team_a = away_cell.find("a") if away_cell else None
        away_team = away_team_a.get_text(strip=True) if away_team_a else ""
        # Date
        date_cell = row.find("td", {"data-stat": "date"})
        match_date = date_cell.get_text(strip=True) if date_cell else None
        # Score - Check specifically for the score element
        score_cell = row.find("td", {"data-stat": "score", "class": "center"})
        home_score, away_score, played = None, None, False
        if score_cell and score_cell.text.strip():
            score_text = score_cell.text.strip()
            # Check for various dash characters (–, -, —)
            if any(dash in score_text for dash in ['-', '–', '—']):
                # Replace all dash variants with standard dash
                score_text = score_text.replace("–", "-").replace("—", "-")
                parts = score_text.split("-")
                if len(parts) == 2:
                    try:
                        home_score = int(parts[0].strip())
                        away_score = int(parts[1].strip())
                        played = True
                        print(f"  Found played match: {home_team} {home_score}-{away_score} {away_team}")
                    except ValueError:
                        pass
        matches_by_day[matchday].append({
            "home": home_team,
            "away": away_team,
            "home_score": home_score,
            "away_score": away_score,
            "played": played,
            "date": match_date
        })
    matches_by_day = dict(matches_by_day)
    if not matches_by_day:
        print("  No matches found during scraping")
        return {}
    # Count played matches
    played_count = sum(1 for day in matches_by_day.values() for m in day if m["played"])
    print(f" Found {played_count} played matches out of {sum(len(v) for v in matches_by_day.values())} total")
    # Save local cache
    try:
        with open(cache_path, "w", encoding="utf-8") as f:
            json.dump(matches_by_day, f, ensure_ascii=False, indent=2)
            print(f" Matches saved to local cache: {cache_file}")
    except Exception as e:
        print(f"  Failed to save cache: {e}")
    # Push to Pinata IPFS
    try:
        cid = save_to_ipfs(matches_by_day, name=ipfs_name)
        if cid:
            print(f"  Data pushed to Pinata IPFS: CID={cid}")
    except Exception as e:
        print(f"  Failed to push to IPFS: {e}")
    return matches_by_day

def scrape_uel(force_refresh=False):
    url = "https://fbref.com/en/comps/19/schedule/Europa-League-Scores-and-Fixtures"
    cache_file = "uel_matches.json"
    ipfs_name = "UEL_matches"
    return scrape_matches(url, cache_file, ipfs_name, force_refresh=force_refresh)

def scrape_ucfl(force_refresh=False):
    url = "https://fbref.com/en/comps/882/schedule/Conference-League-Scores-and-Fixtures"
    cache_file = "ucfl_matches.json"
    ipfs_name = "UCFL_matches"
    return scrape_matches(url, cache_file, ipfs_name, force_refresh=force_refresh)
import requests
from bs4 import BeautifulSoup, Comment
from collections import defaultdict
import json
import os
import time
import random
from .ipfs_utils import save_to_ipfs, load_from_ipfs

CACHE_DIR = os.getenv("CACHE_DIR", "cache")
os.makedirs(CACHE_DIR, exist_ok=True)

USER_AGENTS = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Safari/605.1.15"
]

def should_refresh_cache(cache_path, max_age_hours=24):
    if not os.path.exists(cache_path):
        return True
    return (time.time() - os.path.getmtime(cache_path)) / 3600 > max_age_hours

def get_random_headers():
    return {
        "User-Agent": random.choice(USER_AGENTS),
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9", "Accept-Encoding": "gzip, deflate, br",
        "DNT": "1", "Connection": "keep-alive", "Upgrade-Insecure-Requests": "1",
        "Sec-Fetch-Dest": "document", "Sec-Fetch-Mode": "navigate", "Sec-Fetch-Site": "none",
        "sec-ch-ua": '"Chromium";v="120"', "sec-ch-ua-mobile": "?0", "sec-ch-ua-platform": '"Windows"'
    }

def fetch_with_session(url, max_retries=5):
    session = requests.Session()
    time.sleep(random.uniform(2, 4))
    
    for attempt in range(1, max_retries + 1):
        try:
            headers = get_random_headers()
            if attempt == 1:
                print(f"Establishing session...")
                session.get("https://fbref.com/", headers=headers, timeout=15)
                time.sleep(random.uniform(1, 2))
            
            print(f"Attempt {attempt}/{max_retries}: Fetching...")
            response = session.get(url, headers=headers, timeout=20)
            
            if response.status_code == 200:
                print(f"Success!")
                return response
            elif response.status_code in [403, 429]:
                wait = (2 ** attempt) + random.uniform(1, 3)
                print(f"Status {response.status_code}, waiting {wait:.1f}s...")
                time.sleep(wait)
            else:
                print(f"Unexpected status: {response.status_code}")
                return None
        except (requests.exceptions.Timeout, requests.exceptions.ConnectionError) as e:
            print(f"Error: {type(e).__name__}")
            time.sleep(random.uniform(2, 4))
    
    print(f"Max retries exceeded")
    return None

def load_cache(cache_path):
    try:
        with open(cache_path, "r", encoding="utf-8") as f:
            return json.load(f)
    except:
        return None

def save_cache(data, cache_path):
    try:
        with open(cache_path, "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        return True
    except:
        return False

def scrape_matches(url: str, cache_file: str, ipfs_name: str, force_refresh=False):
    cache_path = os.path.join(CACHE_DIR, cache_file)
    
    if not force_refresh and should_refresh_cache(cache_path):
        print(f"Cache expired, forcing refresh")
        force_refresh = True
    
    # Try local cache
    if not force_refresh and (data := load_cache(cache_path)):
        print(f"Loading from cache: {cache_file}")
        return data
    
    # Try IPFS
    if not force_refresh and (ipfs_data := load_from_ipfs(name=ipfs_name)):
        print(f"Loaded from IPFS")
        save_cache(ipfs_data, cache_path)
        return ipfs_data
    
    # Scrape web
    print(f"Scraping: {url}")
    response = fetch_with_session(url)
    
    if not response or response.status_code != 200:
        print(f"Fetch failed, trying old cache...")
        return load_cache(cache_path) or {}
    
    soup = BeautifulSoup(response.text, "html.parser")
    
    # Determine table ID
    table_id = f"sched_2025-2026_{'882' if '882' in url else '19' if '19' in url else '8'}_2"
    print(f"  Looking for: {table_id}")
    
    # Find table
    table = soup.find("table", {"id": table_id})
    if not table:
        for c in soup.find_all(string=lambda t: isinstance(t, Comment) and table_id in t):
            table = BeautifulSoup(c, "html.parser").find("table", {"id": table_id})
            if table:
                break
    
    if not table or not (tbody := table.find("tbody")):
        print(f"✗ Table not found")
        return {}
    
    # Parse matches
    matches_by_day = defaultdict(list)
    for row in tbody.find_all("tr"):
        if row.get("class") and "spacer" in row["class"]:
            continue
        
        matchday_cell = row.find("th", {"data-stat": "gameweek"})
        if not matchday_cell or not matchday_cell.text.strip():
            continue
        
        matchday = matchday_cell.text.strip()
        home = row.find("td", {"data-stat": "home_team"})
        away = row.find("td", {"data-stat": "away_team"})
        date_cell = row.find("td", {"data-stat": "date"})
        score_cell = row.find("td", {"data-stat": "score", "class": "center"})
        
        home_team = home.find("a").get_text(strip=True) if home and home.find("a") else ""
        away_team = away.find("a").get_text(strip=True) if away and away.find("a") else ""
        match_date = date_cell.get_text(strip=True) if date_cell else None
        
        home_score, away_score, played = None, None, False
        if score_cell and score_cell.text.strip():
            score_text = score_cell.text.strip().replace("–", "-").replace("—", "-")
            if "-" in score_text:
                parts = score_text.split("-")
                if len(parts) == 2:
                    try:
                        home_score, away_score, played = int(parts[0].strip()), int(parts[1].strip()), True
                    except ValueError:
                        pass
        
        matches_by_day[matchday].append({
            "home": home_team, "away": away_team,
            "home_score": home_score, "away_score": away_score,
            "played": played, "date": match_date
        })
    
    matches_by_day = dict(matches_by_day)
    if not matches_by_day:
        print(f"✗ No matches found")
        return {}
    
    played_count = sum(1 for day in matches_by_day.values() for m in day if m["played"])
    total = sum(len(v) for v in matches_by_day.values())
    print(f"✓ Found {played_count}/{total} played matches")
    
    save_cache(matches_by_day, cache_path)
    try:
        cid = save_to_ipfs(matches_by_day, name=ipfs_name)
        if cid:
            print(f"✓ Pushed to IPFS: {cid}")
    except Exception as e:
        print(f"✗ IPFS failed: {e}")
    
    return matches_by_day

def scrape_ucl(force_refresh=False):
    return scrape_matches(
        "https://fbref.com/en/comps/8/schedule/Champions-League-Scores-and-Fixtures",
        "ucl_matches.json", "UCL_matches", force_refresh)

def scrape_uel(force_refresh=False):
    return scrape_matches(
        "https://fbref.com/en/comps/19/schedule/Europa-League-Scores-and-Fixtures",
        "uel_matches.json", "UEL_matches", force_refresh)

def scrape_ucfl(force_refresh=False):
    return scrape_matches(
        "https://fbref.com/en/comps/882/schedule/Conference-League-Scores-and-Fixtures",
        "ucfl_matches.json", "UCFL_matches", force_refresh)
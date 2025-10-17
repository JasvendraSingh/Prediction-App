import sys
import requests

try:
    from .scraping import scrape_ucfl, scrape_uel
except ImportError:
    from scraping import scrape_ucfl, scrape_uel

def check_cloudflare(url):
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
                      "(KHTML, like Gecko) Chrome/140.0 Safari/537.36"
    }
    response = requests.get(url, headers=headers)
    if any(x in response.text for x in ["Attention Required", "cf-browser-verification", "cf-error"]):
        return True
    return False

def test_scraper(scraper_func, name):
    print(f"\nStarting {name} scraper test...\n")

    # Detect Cloudflare blocking
    test_url = {
        "UCFL": "https://fbref.com/en/comps/882/schedule/Conference-League-Scores-and-Fixtures",
        "UEL":  "https://fbref.com/en/comps/19/schedule/Europa-League-Scores-and-Fixtures"
    }.get(name, "")

    is_blocked = check_cloudflare(test_url) if test_url else False

    try:
        matches = scraper_func()

        if not matches:
            if is_blocked:
                print("Scraper returned no data: Blocked by Cloudflare!")
            else:
                print("Scraper returned no data: Table missing or wrong table ID.")
            return

        for day, games in matches.items():
            print(f"Matchday {day}:")
            for g in games:
                print(f"  {g['home']} vs {g['away']}")
            print("-" * 40)

    except requests.exceptions.RequestException as e:
        print("Network error:", e)

    except Exception as e:
        # Skip IPFS errors during testing
        if "ipfshttpclient" in str(e):
            print("Skipping IPFS during test:", e)
        else:
            print("Scraper error:", e)

    print(f"\n{name} test completed.")

if __name__ == "__main__":
    test_scraper(scrape_ucfl, "UCFL")
    test_scraper(scrape_uel, "UEL")

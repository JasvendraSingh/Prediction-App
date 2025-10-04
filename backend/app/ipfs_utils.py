import requests
import json
import os

PINATA_API_KEY = os.getenv("PINATA_API_KEY")
PINATA_SECRET_API_KEY = os.getenv("PINATA_SECRET_API_KEY")
PINATA_PIN_URL = "https://api.pinata.cloud/pinning/pinJSONToIPFS"
PINATA_GATEWAY = "https://gateway.pinata.cloud/ipfs/"

# Store CIDs in a local file to track latest data
CID_STORE_PATH = os.path.join(os.getenv("CACHE_DIR", "cache"), "cids.json")

def load_cid_store():
    """Load the CID mapping from local storage"""
    if os.path.exists(CID_STORE_PATH):
        with open(CID_STORE_PATH, "r") as f:
            return json.load(f)
    return {}

def save_cid_store(cid_store):
    """Save the CID mapping to local storage"""
    os.makedirs(os.path.dirname(CID_STORE_PATH), exist_ok=True)
    with open(CID_STORE_PATH, "w") as f:
        json.dump(cid_store, f, indent=2)

def save_to_ipfs(data: dict, name: str = "matches_data") -> str:
    """
    Saves dict JSON to Pinata IPFS and returns CID
    """
    if not PINATA_API_KEY or not PINATA_SECRET_API_KEY:
        print("  Pinata API keys not set, skipping IPFS upload")
        return None

    headers = {
        "pinata_api_key": PINATA_API_KEY,
        "pinata_secret_api_key": PINATA_SECRET_API_KEY,
        "Content-Type": "application/json"
    }

    payload = {
        "pinataContent": data,
        "pinataMetadata": {
            "name": name
        }
    }

    try:
        response = requests.post(PINATA_PIN_URL, json=payload, headers=headers)
        response.raise_for_status()
        result = response.json()
        cid = result["IpfsHash"]
        print(f" Data uploaded to Pinata: {cid}")
        
        # Store the CID for this data
        cid_store = load_cid_store()
        cid_store[name] = cid
        save_cid_store(cid_store)
        
        return cid
    except Exception as e:
        print(f" Failed to upload to Pinata: {e}")
        return None

def load_from_ipfs(cid: str = None, name: str = None) -> dict:
    """
    Loads JSON dict from Pinata IPFS
    If cid is provided, uses that. Otherwise looks up by name.
    """
    if not cid and name:
        # Look up CID by name
        cid_store = load_cid_store()
        cid = cid_store.get(name)
        
    if not cid:
        print(f"  No CID found for {name}")
        return None

    try:
        url = f"{PINATA_GATEWAY}{cid}"
        response = requests.get(url, timeout=10)
        response.raise_for_status()
        data = response.json()
        print(f" Data loaded from Pinata: {cid}")
        return data
    except Exception as e:
        print(f" Failed to load from Pinata: {e}")
        return None

def get_latest_cid(name: str) -> str:
    """Get the latest CID for a given data name"""
    cid_store = load_cid_store()
    return cid_store.get(name)
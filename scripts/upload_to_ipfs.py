import os
import requests
from pathlib import Path

PINATA_API_KEY = os.getenv("PINATA_API_KEY")
PINATA_SECRET_API_KEY = os.getenv("PINATA_SECRET_API_KEY")
PINATA_URL = "https://api.pinata.cloud/pinning/pinFileToIPFS"

CACHE_DIR = Path(__file__).resolve().parent.parent / "backend" / "cache"

def upload_file(filepath: Path):
    with open(filepath, "rb") as f:
        response = requests.post(
            PINATA_URL,
            files={"file": (filepath.name, f)},
            headers={
                "pinata_api_key": PINATA_API_KEY,
                "pinata_secret_api_key": PINATA_SECRET_API_KEY,
            },
        )
    if response.status_code == 200:
        ipfs_hash = response.json()["IpfsHash"]
        print(f" Uploaded {filepath.name} → {ipfs_hash}")
        return ipfs_hash
    else:
        print(f" Failed {filepath.name}: {response.text}")
        return None

if __name__ == "__main__":
    if not PINATA_API_KEY or not PINATA_SECRET_API_KEY:
        raise RuntimeError("Missing Pinata API keys in environment variables!")

    for file in CACHE_DIR.glob("*.json"):
        upload_file(file)

import ipfshttpclient

def save_to_ipfs(data: dict) -> str:
    """
    Saves dict JSON to IPFS and returns CID
    """
    with ipfshttpclient.connect() as client:
        cid = client.add_json(data)
    return cid

def load_from_ipfs(cid: str) -> dict:
    """
    Loads JSON dict from IPFS
    """
    with ipfshttpclient.connect() as client:
        return client.get_json(cid)

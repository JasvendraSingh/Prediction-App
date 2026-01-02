import requests
from pathlib import Path
import json

OLLAMA_URL = "http://localhost:11434/api/generate"
MODEL = "qwen2.5:3b"

summary = {
    "failed_tests": Path("tests/output/output.xml").exists(),
    "new_regressions": Path("tests/ai_regression.robot").exists(),
    "self_healed": Path("tests/resource.resource").exists(),
}

PROMPT = f"""
You are a release manager AI.

Pipeline summary:
{json.dumps(summary, indent=2)}

Decide:
- DEPLOY
- BLOCK_DEPLOYMENT

Rules:
- Block if critical flow broken
- Allow if cosmetic or flaky
- Be conservative

Respond ONLY with:
DEPLOY
or
BLOCK_DEPLOYMENT
"""

response = requests.post(
    OLLAMA_URL,
    json={"model": MODEL, "prompt": PROMPT, "stream": False},
    timeout=60
)
decision = response.json()["response"].strip()

Path("aiops/deploy_decision.txt").write_text(decision)
print("Deployment decision:", decision)

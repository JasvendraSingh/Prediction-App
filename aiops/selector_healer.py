import requests
from pathlib import Path
import re

OLLAMA_URL = "http://localhost:11434/api/generate"
MODEL = "qwen2.5:3b"

log_file = Path("tests/output/log.html")
resource_file = Path("tests/resource.resource")

if not log_file.exists():
    exit(0)

log_text = log_file.read_text()

broken_selectors = re.findall(r'css=.*?|xpath=.*?', log_text)
broken_selectors = list(set(broken_selectors))

if not broken_selectors:
    exit(0)

PROMPT = f"""
You are a UI automation expert.

Broken selectors:
{broken_selectors}

Resource file:
{resource_file.read_text()}

Suggest improved selectors:
- Prefer role, label, aria
- Avoid brittle class chains
- Output Robot Framework compatible replacements

Output format:
OLD_SELECTOR -> NEW_SELECTOR
"""

response = requests.post(
    OLLAMA_URL,
    json={"model": MODEL, "prompt": PROMPT, "stream": False},
    timeout=120
)
response.raise_for_status()

suggestions = response.json()["response"].splitlines()

content = resource_file.read_text()
for line in suggestions:
    if "->" in line:
        old, new = map(str.strip, line.split("->"))
        content = content.replace(old, new)

resource_file.write_text(content)
print("Selectors self-healed")

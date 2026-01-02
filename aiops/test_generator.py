import requests, textwrap, time, yaml
from pathlib import Path

OLLAMA_URL = "http://localhost:11434/api/generate"
MODEL = "qwen2.5:3b"

# TEST INTENTS
INTENTS_FILE = Path("aiops/test_intents.yaml")
TEST_INTENTS = yaml.safe_load(INTENTS_FILE.read_text())

# UTILS
def head(text, lines=120):
    return "\n".join(text.splitlines()[:lines])

resources = head(Path("tests/resource.resource").read_text(), 120)
base_tests = head(Path("tests/Tests.robot").read_text(), 120)

Path("tests").mkdir(exist_ok=True)

# GENERATION LOOP
for name, intent in TEST_INTENTS.items():
    print(f" Generating AI tests for intent: {name}")

    prompt = f"""
You are a senior QA automation engineer.

Generate Robot Framework Browser tests ONLY for this intent.

Intent name: {name}
Page: {intent.get('page')}
URL (if relevant): {intent.get('url', 'N/A')}

Actions to cover:
{chr(10).join(f"- {a}" for a in intent.get("actions", []))}

Positive assertions:
{chr(10).join(f"- {a}" for a in intent.get("assertions", []))}

Negative scenarios:
{chr(10).join(f"- {n}" for n in intent.get("negative", []))}

Rules:
- Use Browser library
- Reuse existing keywords from resource.resource
- Do NOT redefine keywords
- Do NOT invent new selectors
- Max 5 test cases
- Deterministic behavior (no randomness)
- Clear test names
- Output ONLY valid Robot Framework syntax
- Include both positive and negative tests if defined

Resources (reference):
{resources}

Existing tests (reference only):
{base_tests}

Start output EXACTLY with:
*** Settings ***
"""

    payload = {
        "model": MODEL,
        "prompt": prompt,
        "stream": False,
        "options": {
            "num_ctx": 2048,
            "num_predict": 250,
            "temperature": 0.1,
            "stop": [
                "*** Keywords ***",
                "*** Variables ***"
            ]
        }
    }

    try:
        r = requests.post(OLLAMA_URL, json=payload, timeout=300)
        r.raise_for_status()
        content = r.json()["response"].strip()

        # Basic sanity check
        if not content.startswith("*** Settings ***"):
            raise ValueError("Invalid Robot output (missing Settings header)")

        out = Path(f"tests/ai_{name}.robot")
        out.write_text(textwrap.dedent(content))
        print(f" Written {out}")

    except Exception as e:
        print(f" Skipping intent '{name}' due to error:", e)

    time.sleep(2)

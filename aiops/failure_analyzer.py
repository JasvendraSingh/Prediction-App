import requests
from pathlib import Path
import xml.etree.ElementTree as ET
import textwrap

OLLAMA_URL = "http://localhost:11434/api/generate"
MODEL = "qwen2.5:3b"

output_xml = Path("tests/output/output.xml")
if not output_xml.exists():
    print("No Robot output found, skipping failure analysis")
    exit(0)

tree = ET.parse(output_xml)
root = tree.getroot()

failures = []
for test in root.iter("test"):
    status = test.find("status")
    if status is not None and status.attrib.get("status") == "FAIL":
        failures.append({
            "name": test.attrib.get("name"),
            "message": status.text
        })

if not failures:
    print("No failures detected")
    exit(0)

PROMPT = f"""
You are a senior QA automation engineer.

Robot Framework tests failed.

Failures:
{failures}

Generate NEW Robot Framework tests that:
- Reproduce these failures
- Prevent regressions
- Use Browser library
- Reuse existing keywords
- Do NOT redefine keywords
- Output ONLY valid Robot Framework

Start with:
*** Settings ***
"""

response = requests.post(
    OLLAMA_URL,
    json={"model": MODEL, "prompt": PROMPT, "stream": False},
    timeout=120
)
response.raise_for_status()

regression_tests = response.json()["response"]

Path("tests/ai_regression.robot").write_text(
    textwrap.dedent(regression_tests)
)

print("AI regression tests generated")

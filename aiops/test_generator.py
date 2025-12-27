from pathlib import Path

tests = Path("tests/Tests.robot").read_text()

suggestions = [
    "*** Test Cases ***",
    "Invalid Payload Test",
    "    POST /predict {}",
]

Path("tests/ai_generated.robot").write_text("\n".join(suggestions))

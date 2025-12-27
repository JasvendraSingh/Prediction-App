import re

def analyze(logs):
    errors = [l for l in logs if re.search("error|exception", l, re.I)]
    return {
        "total_logs": len(logs),
        "error_count": len(errors),
        "sample_errors": errors[:5]
    }

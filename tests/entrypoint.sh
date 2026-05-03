#!/bin/bash
set -e

# Install Playwright Chromium at runtime
python -m playwright install chromium

# Initialize Robot Framework Browser (ensures fresh browser)
rfbrowser init

# Run Robot tests
robot --outputdir /app/output /app/*.robot

from robot.api.deco import keyword
import os
import requests

BACKEND_URL = "https://friendly-adventure-wrjvx564jjq42vq4v-8000.app.github.dev"

class RegressionKeywords:

    @keyword
    def prediction_exists_in_backend(self, team1: str, team2: str, score1: int, score2: int):
        """Ensure a prediction exists in backend"""
        response = requests.get(f"{BACKEND_URL}/predictions")
        response.raise_for_status()
        predictions = response.json()
        if not any(
            p["team1"] == team1 and p["team2"] == team2 and p["score1"] == score1 and p["score2"] == score2
            for p in predictions
        ):
            raise AssertionError(f"Prediction {team1}-{team2} {score1}:{score2} not found in backend")

    @keyword
    def file_should_exist(self, file_path: str):
        """Check that file exists"""
        if not os.path.exists(file_path):
            raise AssertionError(f"File not found: {file_path}")

    @keyword
    def page_should_contain_text(self, browser, text: str):
        """Check page contains text"""
        page_source = browser.page_source
        if text not in page_source:
            raise AssertionError(f"Text '{text}' not found on page")

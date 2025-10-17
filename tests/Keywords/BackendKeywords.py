from robot.api.deco import keyword
from app.utils import calculate_prediction, validate_input, generate_pdf

class BackendKeywords:

    @keyword
    def prediction_should_be_correct(self, team1_score: int, team2_score: int, expected_result: str):
        """Verify prediction calculation logic"""
        result = calculate_prediction(team1_score, team2_score)
        if result != expected_result:
            raise AssertionError(f"Expected {expected_result}, got {result}")

    @keyword
    def input_should_be_valid(self, input_value: str):
        """Validate input"""
        valid = validate_input(input_value)
        if not valid:
            raise AssertionError(f"Input '{input_value}' is invalid")

    @keyword
    def pdf_should_be_generated(self, data: dict, file_path: str):
        """Generate PDF and verify success"""
        success = generate_pdf(data, file_path)
        if not success:
            raise AssertionError(f"PDF not generated at {file_path}")

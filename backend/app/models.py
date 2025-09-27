from pydantic import BaseModel

class Prediction(BaseModel):
    matchday: int
    home: str
    away: str
    home_goals: int
    away_goals: int

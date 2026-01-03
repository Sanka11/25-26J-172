from pydantic import BaseModel
from typing import Dict, Any


class RLDecisionRequest(BaseModel):
    student_id: str
    week: int
    state: Dict[str, Any]


class RLDecisionResponse(BaseModel):
    student_id: str
    week: int
    action: str
    q_value: float

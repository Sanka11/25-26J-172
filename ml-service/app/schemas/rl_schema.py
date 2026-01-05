from pydantic import BaseModel
from typing import Dict, Any


# ======================================================
# LOW-LEVEL RL DECISION (INTERNAL USE)
# ======================================================
# Used by:
# - rl_service.py
# - Q-learning inference
# - Not exposed directly to frontend
# ======================================================

class RLDecisionRequest(BaseModel):
    student_id: str
    week: int
    state: Dict[str, Any]


class RLDecisionResponse(BaseModel):
    student_id: str
    week: int
    action: str
    q_value: float


# ======================================================
# NEXT-WEEK SIMULATION (FRONTEND-FACING)
# ======================================================
# Used by:
# - POST /rl/simulate/next
# - User-driven what-if analysis
# - GRU + RL combined output
# ======================================================

class RLNextWeekInput(BaseModel):
    login_count: int
    days_since_last_login: int
    alerts_sent: int
    alerts_responded: int
    engagement_score: float


class RLNextWeekRequest(BaseModel):
    student_id: str
    new_week: RLNextWeekInput


class RLNextWeekResponse(BaseModel):
    student_id: str
    previous_risk: str
    new_risk: str
    recommended_action: str

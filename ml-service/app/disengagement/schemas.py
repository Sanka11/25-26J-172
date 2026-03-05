from pydantic import BaseModel
from typing import List


# --------------------------------------------------
# Weekly behavioral input (USED BY GRU)
# --------------------------------------------------
class WeeklyActivity(BaseModel):
    login_count: float
    avg_session_duration_min: float
    total_active_time_min: float
    days_since_last_login: float
    page_views: float
    assignments_submitted: float
    on_time_submissions: float
    late_submissions: float
    alerts_responded: float
    response_rate: float


# --------------------------------------------------
# GRU-only request
# --------------------------------------------------
class GRUOnlyRequest(BaseModel):
    last_10_weeks: List[WeeklyActivity]


# --------------------------------------------------
# RL-only request (OPTION A — risk_trend based)
# --------------------------------------------------
class RLOnlyRequest(BaseModel):
    current_risk: str            # LOW / NORMAL / HIGH
    risk_trend: str              # INCREASING / STABLE / DECREASING
    last_action: str             # DO_NOTHING / REMINDER / PEER_CHEER / ...
    no_response_streak: int
    fatigue_level: int


# --------------------------------------------------
# FULL PIPELINE REQUEST (GRU → RL)
# --------------------------------------------------
class DisengagementRequest(BaseModel):
    last_10_weeks: List[WeeklyActivity]
    risk_trend: str
    last_action: str
    no_response_streak: int
    fatigue_level: int


# --------------------------------------------------
# FINAL RESPONSE (GRU + RL)
# --------------------------------------------------
class DisengagementResponse(BaseModel):
    risk_level: str
    reconstruction_error: float
    risk_trend: str
    recommended_action: str
    decision_reason: str
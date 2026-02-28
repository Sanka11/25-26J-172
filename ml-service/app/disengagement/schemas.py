from pydantic import BaseModel
from typing import List


class WeeklyActivity(BaseModel):
    login_freq: float
    session_duration: float
    inactivity_days: float
    assignment_completion: float
    quiz_score: float
    forum_posts: float
    video_watch_ratio: float
    late_submissions: float
    alert_interactions: float
    help_requests: float


class DisengagementRequest(BaseModel):
    last_10_weeks: List[WeeklyActivity]
    last_action: str
    no_response_streak: int
    fatigue_level: int
    risk_trend: str


class DisengagementResponse(BaseModel):
    risk_level: str
    reconstruction_error: float
    risk_trend: str
    recommended_action: str
    decision_reason: str
from pydantic import BaseModel

class RecommendationRequest(BaseModel):
    attendance_pct: float
    midterm_score: float
    final_score: float
    assignments_avg: float
    quizzes_avg: float
    participation_score: float
    projects_score: float
    total_score: float
    study_hours_per_week: float
    stress_level: float
    sleep_hours: float

class RecommendationResponse(BaseModel):
    academic_recommendation: str
    academic_explanation: str

    wellbeing_recommendation: str
    wellbeing_explanation: str

    study_recommendation: str
    study_explanation: str


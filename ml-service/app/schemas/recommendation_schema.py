from pydantic import BaseModel
from typing import List, Optional, Any, Dict

# =======================
# 1. INPUT MODELS (Request)
# =======================
class StudentData(BaseModel):
    student_id: str
    attendance_pct: float
    midterm_score: float
    assignments_avg: float
    quizzes_avg: float
    projects_score: float
    study_hours_per_week: float
    stress_level: float
    sleep_hours: Optional[float] = None

class RecommendationRequest(BaseModel):
    subject: str = "OOP"           # Default to OOP if not provided
    week_number: int = 1           # Default to Week 1 if not provided
    students: List[StudentData]



# =======================
# 2. OUTPUT MODELS (Response)
# =======================
class StudentRecommendation(BaseModel):
    student_id: str
    status: str
    recommendation_index: float
    ai_insights: Dict[str, Any]  # This holds the JSON from the AI (summary, tips, action_items)

class RecommendationResponse(BaseModel):
    cohort_average_recommendation_index: float
    student_recommendations: List[StudentRecommendation]
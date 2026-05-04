# from pydantic import BaseModel, Field
# from typing import List, Any, Dict

# # ===============================
# # 1. INPUT MODELS (Request)
# # ===============================
# class StudentData(BaseModel):
#     """
#     Input schema for individual student metrics.
#     Excludes demographic data for ethical modeling.
#     """
#     student_id: str
#     attendance_pct: float
#     midterm_score: float
#     assignments_avg: float
#     quizzes_avg: float
#     participation_score: float
#     projects_score: float
#     study_hours_per_week: float
#     extracurricular_activities: str = "No"  # Binary category (Yes/No)
#     stress_level: float = Field(..., alias="stress_level_1_10")
#     sleep_hours: float = Field(..., alias="sleep_hours_per_night")

#     class Config:
#         populate_by_name = True

# class RecommendationRequest(BaseModel):
#     """Batch request model for a list of students."""
#     students: List[StudentData]


# # ===============================
# # 2. OUTPUT MODELS (Response)
# # ===============================
# class ProfileDetail(BaseModel):
#     """Detailed predicted index and categorical status."""
#     index: float
#     status: str

# class StudentRecommendation(BaseModel):
#     """Full personalized profile for each student."""
#     student_id: str
#     wellbeing_profile: ProfileDetail
#     study_profile: ProfileDetail
#     ai_insights: Dict[str, Any]  # JSON output from LLM (summary, tips, steps)

# class RecommendationResponse(BaseModel):
#     """The final batch response structure."""
#     student_recommendations: List[StudentRecommendation]
from pydantic import BaseModel, Field
from typing import List, Any, Dict

# ===============================
# 1. INPUT MODELS (Request)
# ===============================
class IndividualStudentMetric(BaseModel):
    """
    Input schema for individual student metrics.
    Excludes demographic data for ethical modeling.
    """
    student_id: str
    attendance_pct: float
    midterm_score: float
    assignments_avg: float
    quizzes_avg: float
    participation_score: float
    projects_score: float
    study_hours_per_week: float
    extracurricular_activities: str = "No"  # Binary category (Yes/No)
    stress_level: float = Field(..., alias="stress_level_1_10")
    sleep_hours: float = Field(..., alias="sleep_hours_per_night")

    class Config:
        populate_by_name = True

class AcademicRecommendationRequest(BaseModel):
    """Batch request model using unique names to avoid conflicts."""
    students: List[IndividualStudentMetric]


# ===============================
# 2. OUTPUT MODELS (Response)
# ===============================
class AnalyticScoreProfile(BaseModel):
    """Detailed predicted index and categorical status."""
    index: float
    status: str

class IndividualAnalyticResult(BaseModel):
    """Full personalized profile for each student."""
    student_id: str
    wellbeing_profile: AnalyticScoreProfile
    study_profile: AnalyticScoreProfile
    ai_insights: Dict[str, Any]  # JSON output from LLM (summary, tips, steps)

class AcademicRecommendationResponse(BaseModel):
    """The final batch response structure with unique naming."""
    student_recommendations: List[IndividualAnalyticResult]
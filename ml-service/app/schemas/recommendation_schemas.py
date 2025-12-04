from pydantic import BaseModel

class RecommendationRequest(BaseModel):
    student_id: str
    gpa: float
    attendance_rate: float
    stress_level: int
    assignments_pending: int

class RecommendationResponse(BaseModel):
    recommendations: list[str]

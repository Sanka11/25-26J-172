from pydantic import BaseModel

class RiskRequest(BaseModel):
    student_id: str
    gpa: float
    attendance_rate: float
    assignments_completed: int

class RiskResponse(BaseModel):
    risk_score: float

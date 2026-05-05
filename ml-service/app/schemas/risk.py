from pydantic import BaseModel, Field
from typing import Optional, List


# shared by other team members — do not remove
class UploadPdfRequest(BaseModel):
    file_b64: str
    filename: str


class FeedbackRequest(BaseModel):
    rating:        Optional[int] = None
    comment:       str
    created_at:    float
    last_question: Optional[str] = None
    last_answer:   Optional[str] = None


# original schema kept so older endpoints don't break
class RiskRequest(BaseModel):
    student_id:             str
    gpa:                    float
    attendance_rate:        float
    assignments_completed:  int


class RiskResponse(BaseModel):
    risk_score: float


# 17 fields the hybrid ensemble model was trained on — field names and ranges must match training data exactly
class StudentRiskInput(BaseModel):
    Attendance_pct:           float = Field(..., ge=0, le=100)
    Midterm_Score:            float = Field(..., ge=0, le=100)
    Final_Score:              float = Field(..., ge=0, le=100)
    Assignments_Avg:          float = Field(..., ge=0, le=100)
    Quizzes_Avg:              float = Field(..., ge=0, le=100)
    Participation_Score:      float = Field(..., ge=0, le=100)
    Projects_Score:           float = Field(..., ge=0, le=100)
    Age:                      int   = Field(..., ge=15, le=40)
    Study_Hours_per_Week:     float = Field(..., ge=0, le=100)
    Stress_Level:             float = Field(..., ge=1,  le=10)
    Sleep_Hours_per_Night:    float = Field(..., ge=0, le=24)
    Gender:                   str
    Department:               str
    Extracurricular_Activities:  str
    Internet_Access_at_Home:     str
    Parent_Education_Level:      str
    Family_Income_Level:         str


# represents one factor from SHAP output (either a risk driver or a protective factor)
class SHAPFactor(BaseModel):
    feature:      str
    display_name: str
    impact:       float
    direction:    str
    value:        Optional[float] = None


class RiskExplanation(BaseModel):
    risk_factors:       List[SHAPFactor]
    protective_factors: List[SHAPFactor]
    summary_text:       List[str]


class StudentRiskResponse(BaseModel):
    student_id:      Optional[str] = None
    risk_score:      float
    risk_percentage: int
    risk_level:      str
    risk_color:      str
    explanation:     RiskExplanation
    model_version:   str = "v3_final"
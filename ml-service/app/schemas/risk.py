from pydantic import BaseModel


class RiskRequest(BaseModel):
    student_id: str
    gpa: float
    attendance_rate: float
    assignments_completed: int


class RiskResponse(BaseModel):
    risk_score: float


class UploadPdfRequest(BaseModel):
    file_b64: str
    filename: str


class FeedbackRequest(BaseModel):
    rating: int | None = None
    comment: str
    created_at: float
    last_question: str | None = None
    last_answer: str | None = None

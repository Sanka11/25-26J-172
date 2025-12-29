
from pydantic import BaseModel
from typing import List

class QuestionAttempt(BaseModel):
    question_id: str
    skill: str
    correct: int
    hint_count: float
    ms_first_response: float
    overlap_time: float

class StruggleRequest(BaseModel):
    user_id: str   # ✅ STRING (not int)
    attempts: List[QuestionAttempt]

class LessonStruggle(BaseModel):
    lesson: str
    average_struggle_score: float
    level: str

class StruggleResponse(BaseModel):
    user_id: int
    lessons: List[LessonStruggle]
class StruggleResponse(BaseModel):
    user_id: str
    quiz_average_struggle_score: float
    question_struggles: list
    lesson_struggles: list


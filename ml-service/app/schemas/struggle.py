
from pydantic import BaseModel
from typing import List

class SkillInput(BaseModel):
    skill_name: str
    correct: float
    hint_count: float
    ms_first_response: float
    overlap_time: float
    opportunity: float


class StruggleRequest(BaseModel):
    user_id: int
    skills: List[SkillInput]


class SkillStruggleResult(BaseModel):
    skill_name: str
    struggle_score: float
    level: str


class StruggleResponse(BaseModel):
    user_id: int
    struggling_skills: List[SkillStruggleResult]

from pydantic import BaseModel
from typing import List

class CareerReadinessRequest(BaseModel):
    user_skills: str
    job_title: str

class CareerReadinessResponse(BaseModel):
   
   
    strengths: List[str]
    weaknesses: List[str]
    learning_topics: List[str]
    recommendation: str



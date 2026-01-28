# from pydantic import BaseModel
# from typing import List


# class LessonGroup(BaseModel):
#     subject: str
#     lessons: List[str]


# class CognitiveLoadRequest(BaseModel):
#     subjects: List[LessonGroup]

from pydantic import BaseModel
from typing import List


class LessonGroup(BaseModel):
    subject: str
    lessons: List[str]


class CognitiveLoadRequest(BaseModel):
    subjects: List[LessonGroup]


class LessonItem(BaseModel):
    subject: str
    lesson: str


class SkillCluster(BaseModel):
    shared_skill: str
    why_shared: str
    size: int
    lessons: List[LessonItem]


class CognitiveLoadResponse(BaseModel):
    shared_cognitive_load_detected: bool
    skill_clusters: List[SkillCluster]

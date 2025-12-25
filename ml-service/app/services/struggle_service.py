import joblib
import numpy as np
from app.schemas.struggle import (
    StruggleRequest,
    StruggleResponse,
    SkillStruggleResult
)

MODEL_PATH = "app/models/rf_struggling_skill_all_features.pkl"
model = joblib.load(MODEL_PATH)

def predict_struggling_skills(payload: StruggleRequest) -> StruggleResponse:
    results = []

    for skill in payload.skills:
       
        X = np.array([[
            skill.correct,
            skill.attempt_count,
            skill.hint_count,
            skill.ms_first_response,
            skill.opportunity,
            skill.overlap_time
        ]])

        score = model.predict_proba(X)[0][1]

        if score >= 0.75:
            level = "High"
        elif score >= 0.4:
            level = "Medium"
        else:
            level = "Low"

        results.append(
            SkillStruggleResult(
                skill_name=skill.skill_name,
                struggle_score=round(float(score), 3),
                level=level
            )
        )

    return StruggleResponse(
        user_id=payload.user_id,
        struggling_skills=results
    )

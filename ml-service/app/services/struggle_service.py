import joblib
import numpy as np

from app.schemas.struggle import (
    StruggleRequest,
    StruggleResponse,
    SkillStruggleResult
)

# =========================
# Load trained GB model
# =========================

MODEL_PATH = "app/models/gb_struggle_model.pkl"
model = joblib.load(MODEL_PATH)

# Training feature order (VERY IMPORTANT)
# [
#   "correct",
#   "hint_count",
#   "ms_first_response",
#   "overlap_time",
#   "opportunity"
# ]


def predict_struggling_skills(payload: StruggleRequest) -> StruggleResponse:
    """
    Predict struggling skills for a user using Gradient Boosting.
    Feature order strictly matches training.
    """

    results = []

    for skill in payload.skills:
        # -------------------------
        # Build feature vector
        # ORDER MUST MATCH TRAINING
        # -------------------------
        X = np.array([[
            skill.correct,
            skill.hint_count,
            skill.ms_first_response,
            skill.overlap_time,
            skill.opportunity
        ]])

        # -------------------------
        # Predict struggle probability
        # -------------------------
        score = model.predict_proba(X)[0][1]

        # -------------------------
        # Convert probability → level
        # -------------------------
        if score >= 0.60:
            level = "High"
        elif score >= 0.35:
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

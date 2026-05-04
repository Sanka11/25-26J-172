from fastapi import APIRouter

from app.disengagement.schemas import (
    GRUOnlyRequest,
    RLOnlyRequest,
    DisengagementRequest,
    DisengagementResponse
)

from app.disengagement.gru_inference import compute_gru_risk
from app.disengagement.rl_inference import rl_decide_action


router = APIRouter(
    prefix="/disengagement",
    tags=["Disengagement"]
)


# --------------------------------------------------
# FULL PIPELINE: GRU → RL (OPTION A)
# --------------------------------------------------
@router.post(
    "/predict",
    response_model=DisengagementResponse
)
def predict_disengagement(request: DisengagementRequest):

    # 1️⃣ GRU
    gru_out = compute_gru_risk(request.last_10_weeks)

    current_risk = gru_out["risk_level"]
    reconstruction_error = gru_out["reconstruction_error"]

    risk_trend = request.risk_trend or "STABLE"

    # 2️⃣ RL
    rl_out = rl_decide_action(
        current_risk=current_risk,
        risk_trend=risk_trend,
        last_action=request.last_action,
        no_response_streak=request.no_response_streak,
        fatigue_level=request.fatigue_level
    )

    # 3️⃣ RESPONSE
    return DisengagementResponse(
        risk_level=current_risk,
        reconstruction_error=reconstruction_error,
        risk_trend=rl_out["trend"],
        recommended_action=rl_out["action"],
        decision_reason=rl_out["reason"]
    )


# --------------------------------------------------
# GRU-ONLY
# --------------------------------------------------
@router.post("/gru-only")
def predict_gru_only(request: GRUOnlyRequest):
    return compute_gru_risk(request.last_10_weeks)


# --------------------------------------------------
# RL-ONLY (OPTION A — risk_trend input)
# --------------------------------------------------
@router.post("/rl-only")
def predict_rl_only(request: RLOnlyRequest):
    return rl_decide_action(
        current_risk=request.current_risk,
        risk_trend=request.risk_trend,
        last_action=request.last_action,
        no_response_streak=request.no_response_streak,
        fatigue_level=request.fatigue_level
    )
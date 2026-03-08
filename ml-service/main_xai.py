# app/main_xai.py
# XAI Component — Student Risk Prediction & SHAP Explainability
# Runs independently on port 8000
# Author: it22354792

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.services.risk_service import predict_risk_score, predict_risk_with_shap
from app.schemas.risk import (
    RiskRequest, RiskResponse,
    StudentRiskInput, StudentRiskResponse
)

app = FastAPI(
    title="AcademiGuard XAI Service",
    description="Student Risk Prediction with SHAP Explainability",
    version="4.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health():
    return {
        "status": "ok",
        "service": "xai",
        "model": "Hybrid Ensemble (RF + XGBoost + LightGBM)",
        "version": "v4_hybrid"
    }


@app.post("/predict-risk", response_model=RiskResponse)
def predict_risk(payload: RiskRequest):
    """Legacy endpoint — kept for backward compatibility."""
    score = predict_risk_score(payload)
    return RiskResponse(risk_score=score)


@app.post("/predict-risk/shap")
def predict_risk_shap(payload: StudentRiskInput):
    """SHAP-based risk prediction. Returns score + full explanation."""
    data = payload.dict()
    data["Stress_Level_1-10"] = data.pop("Stress_Level")
    return predict_risk_with_shap(data)


@app.post("/predict-risk/shap/{student_id}")
def predict_risk_shap_for_student(student_id: str, payload: StudentRiskInput):
    """SHAP risk prediction for a specific student ID."""
    data = payload.dict()
    data["Stress_Level_1-10"] = data.pop("Stress_Level")
    return predict_risk_with_shap(data, student_id=student_id)


@app.post("/predict-risk/next-semester")
def predict_next_semester(payload: StudentRiskInput):
    """What-if prediction — result is NEVER stored."""
    data = payload.dict()
    data["Stress_Level_1-10"] = data.pop("Stress_Level")
    result = predict_risk_with_shap(data)
    result["is_hypothetical"] = True
    result["note"] = "Simulation only. Results are not saved."
    return result
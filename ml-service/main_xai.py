# XAI Service entry point — run with: uvicorn main_xai:app --port 8001
# Handles all risk prediction and SHAP explainability for AcademiGuard
# Author: IT22354792

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


# kept for backward compatibility with older callers
@app.post("/predict-risk", response_model=RiskResponse)
def predict_risk(payload: RiskRequest):
    score = predict_risk_score(payload)
    return RiskResponse(risk_score=score)


# returns risk score + full SHAP explanation without storing anything
@app.post("/predict-risk/shap")
def predict_risk_shap(payload: StudentRiskInput):
    data = payload.dict()
    data["Stress_Level_1-10"] = data.pop("Stress_Level")
    return predict_risk_with_shap(data)


# main endpoint used by the backend — result is written to Firestore by the caller
@app.post("/predict-risk/shap/{student_id}")
def predict_risk_shap_for_student(student_id: str, payload: StudentRiskInput):
    data = payload.dict()
    data["Stress_Level_1-10"] = data.pop("Stress_Level")
    return predict_risk_with_shap(data, student_id=student_id)


# what-if simulation for "next semester" predictor — never saved to Firestore
@app.post("/predict-risk/next-semester")
def predict_next_semester(payload: StudentRiskInput):
    data = payload.dict()
    data["Stress_Level_1-10"] = data.pop("Stress_Level")
    result = predict_risk_with_shap(data)
    result["is_hypothetical"] = True
    result["note"] = "Simulation only. Results are not saved."
    return result
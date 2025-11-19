from fastapi import FastAPI
from .schemas import RiskRequest, RiskResponse
from .services import predict_risk_score

app = FastAPI(title="AcademiGuard ML Service")

@app.get("/health")
def health():
    return {"status": "ok"}

@app.post("/predict-risk", response_model=RiskResponse)
def predict_risk(payload: RiskRequest):
    score = predict_risk_score(payload)
    return RiskResponse(risk_score=score)

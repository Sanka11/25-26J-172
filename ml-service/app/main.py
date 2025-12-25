from fastapi import FastAPI

# RISK SCHEMAS
from app.schemas.risk import RiskRequest, RiskResponse

from app.schemas.struggle import StruggleRequest, StruggleResponse
from app.services.struggle_service import predict_struggling_skills


# RECOMMENDATION SCHEMAS
from app.schemas.recommendation_schemas import (
    RecommendationRequest,
    RecommendationResponse,
)


# SERVICES
from app.services.risk_service import predict_risk_score
from app.services.recommendation_service import generate_recommendations

app = FastAPI(title="AcademiGuard ML Service")


@app.get("/health")
def health():
    return {"status": "ok"}

@app.post("/predict-risk", response_model=RiskResponse)
def predict_risk(payload: RiskRequest):
    score = predict_risk_score(payload)
    return RiskResponse(risk_score=score)

# @app.post("/recommendation", response_model=RecommendationResponse)
# def recommend(payload: RecommendationRequest):
#     recs = generate_recommendations(payload)
#     return RecommendationResponse(recommendations=recs)
@app.post("/recommend", response_model=RecommendationResponse)
def recommend(payload: RecommendationRequest):
    return generate_recommendations(payload)


@app.post("/predictStruggle", response_model=StruggleResponse)
def struggle_endpoint(payload: StruggleRequest):
    return predict_struggling_skills(payload)

# from fastapi import FastAPI
# from app.disengagement.router import router

# app = FastAPI(
#     title="Student Disengagement ML Service",
#     version="1.0"
# )

# app.include_router(router)
from fastapi import APIRouter
from app.disengagement.gru_inference import predict_disengagement

router = APIRouter(
    prefix="/disengagement",
    tags=["Disengagement"]
)

@router.post("/predict")
def predict(data: dict):
    return predict_disengagement(data)
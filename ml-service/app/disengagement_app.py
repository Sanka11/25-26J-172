from fastapi import FastAPI
from app.disengagement.router import router

app = FastAPI(
    title="Student Disengagement ML Service",
    version="1.0"
)

app.include_router(router)
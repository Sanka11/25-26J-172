# from fastapi import FastAPI
# from fastapi.middleware.cors import CORSMiddleware

# from app.predict_all_students import predict_all_students
# from app.predict_single_student import get_student_risk

# app = FastAPI(
#     title="Student Risk Detection ML Service",
#     description="GRU Autoencoder Risk Prediction API",
#     version="1.0"
# )

# # Allow frontend/backend to connect
# app.add_middleware(
#     CORSMiddleware,
#     allow_origins=["*"],
#     allow_methods=["*"],
#     allow_headers=["*"],
# )

# # -------------------------------------------
# # Health Check
# # -------------------------------------------
# @app.get("/")
# def root():
#     return {"message": "ML Service Running Successfully"}

# # -------------------------------------------
# # Predict ALL students
# # -------------------------------------------
# @app.get("/predict-all")
# def predict_all():
#     results = predict_all_students()
#     return {"students": results}

# # -------------------------------------------
# # Predict ONE student
# # -------------------------------------------
# @app.get("/predict/{student_id}")
# def predict_student(student_id: str):
#     result = get_student_risk(student_id)
#     return {"student": result}



from fastapi import FastAPI, HTTPException, BackgroundTasks
from uuid import uuid4

import torch
import numpy as np
import pandas as pd

from app.autoencoder_model import GRUAutoencoder
from app.data_preprocess import load_and_preprocess

# -------------------------------------------------
# ASYNC JOB STORE (STEP 1)
# -------------------------------------------------
jobs = {}

SEQ_LEN = 10

app = FastAPI(
    title="Student Disengagement ML Service",
    version="1.0"
)

# -------------------------------------------------
# GLOBALS
# -------------------------------------------------
model = None
df = None
p50 = None
p75 = None

FEATURE_NAMES = [
    "login_count",
    "avg_session_duration_min",
    "total_active_time_min",
    "days_since_last_login",
    "page_views",
    "video_watch_minutes",
    "forum_posts",
    "messages_sent",
    "assignments_due",
    "assignments_submitted",
    "quiz_attempts",
    "alerts_sent",
    "alerts_responded",
    "notifications_opened",
    "on_time_submission_ratio",
    "forum_ratio",
    "response_rate",
    "activity_drop_score"
]

FEATURE_REASON_MAP = {
    "activity_drop_score": "Sharp drop in activity",
    "response_rate": "Low response rate to alerts",
    "login_count": "Reduced login frequency",
    "page_views": "Low platform interaction",
    "video_watch_minutes": "Low video engagement",
    "forum_ratio": "Low forum participation",
    "assignments_submitted": "Assignments not submitted regularly",
    "on_time_submission_ratio": "Late submissions"
}

# -------------------------------------------------
# LOAD RESOURCES (UNCHANGED)
# -------------------------------------------------
def load_resources():
    global model, df, p50, p75

    if model is None:
        model = GRUAutoencoder()
        model.load_state_dict(
            torch.load("app/autoencoder_model.pth", map_location="cpu")
        )
        model.eval()

    if df is None:
        df = pd.read_csv("app/data/dataset.csv")

    if p50 is None:
        p50 = float(np.load("app/threshold_p50.npy"))

    if p75 is None:
        p75 = float(np.load("app/threshold_p75.npy"))

# -------------------------------------------------
# CORE LOGIC (UNCHANGED)
# -------------------------------------------------
def compute_error(X):
    with torch.no_grad():
        recon, _ = model(X)
        err = torch.mean((X - recon) ** 2, dim=(1, 2))
    return err.mean().item()


def label_risk(error):
    if error >= p75:
        return "HIGH"
    elif error >= p50:
        return "NORMAL"
    return "LOW"


def explain_deviation(X):
    with torch.no_grad():
        recon, _ = model(X)

    error_per_feature = torch.mean(
        (X - recon) ** 2,
        dim=(0, 1)
    ).numpy()

    top_idx = np.argsort(error_per_feature)[-3:][::-1]

    reasons = []
    for i in top_idx:
        fname = FEATURE_NAMES[i]
        reasons.append(
            FEATURE_REASON_MAP.get(fname, f"Abnormal {fname}")
        )

    return reasons

# -------------------------------------------------
# ROOT
# -------------------------------------------------
@app.get("/")
def root():
    return {"status": "ML service running"}

# -------------------------------------------------
# SINGLE STUDENT (UNCHANGED)
# -------------------------------------------------
@app.get("/predict/{student_id}")
def predict_student(student_id: str):
    load_resources()

    stu = df[df["student_id"] == student_id]

    if len(stu) < SEQ_LEN:
        raise HTTPException(
            status_code=400,
            detail="Not enough data (need at least 10 weeks)"
        )

    temp_path = "app/data/_temp_single.csv"
    stu.to_csv(temp_path, index=False)

    X = load_and_preprocess(temp_path, mode="inference")
    X = X[-1:].float()

    error = compute_error(X)
    risk = label_risk(error)
    reasons = explain_deviation(X)

    return {
        "student_id": student_id,
        "reconstruction_error": round(error, 6),
        "risk": risk,
        "reasons": reasons
    }

# -------------------------------------------------
# ALL STUDENTS (SYNC – UNCHANGED)
# -------------------------------------------------
@app.get("/predict-all")
def predict_all():
    load_resources()
    results = []

    for sid in df["student_id"].unique():
        stu = df[df["student_id"] == sid]

        if len(stu) < SEQ_LEN:
            continue

        temp_path = "app/data/_temp.csv"
        stu.to_csv(temp_path, index=False)

        X = load_and_preprocess(temp_path, mode="inference")
        X = X[-1:].float()

        error = compute_error(X)
        risk = label_risk(error)

        results.append({
            "student_id": sid,
            "error": round(error, 6),
            "risk": risk
        })

    return {
        "count": len(results),
        "students": results
    }

# -------------------------------------------------
# BACKGROUND JOB LOGIC (STEP 2 – NEW, SAFE)
# -------------------------------------------------
def run_predict_all_job(job_id: str):
    try:
        load_resources()
        results = []

        for sid in df["student_id"].unique():
            stu = df[df["student_id"] == sid]

            if len(stu) < SEQ_LEN:
                continue

            temp_path = "app/data/_temp.csv"
            stu.to_csv(temp_path, index=False)

            X = load_and_preprocess(temp_path, mode="inference")
            X = X[-1:].float()

            error = compute_error(X)
            risk = label_risk(error)

            results.append({
                "student_id": sid,
                "error": round(error, 6),
                "risk": risk
            })

        jobs[job_id] = {
            "status": "completed",
            "count": len(results),
            "students": results
        }

    except Exception as e:
        jobs[job_id] = {
            "status": "failed",
            "error": str(e)
        }

# -------------------------------------------------
# START ASYNC ALL STUDENTS (STEP 2 – NEW)
# -------------------------------------------------
@app.post("/predict-all-start")
def start_predict_all(background_tasks: BackgroundTasks):
    job_id = str(uuid4())

    jobs[job_id] = {
        "status": "processing"
    }

    background_tasks.add_task(run_predict_all_job, job_id)

    return {
        "job_id": job_id,
        "status": "processing"
    }


# -------------------------------------------------
# GET ASYNC JOB RESULT (STEP 3)
# -------------------------------------------------
@app.get("/predict-all-result/{job_id}")
def get_predict_all_result(job_id: str):
    if job_id not in jobs:
        raise HTTPException(status_code=404, detail="Job not found")

    return jobs[job_id]

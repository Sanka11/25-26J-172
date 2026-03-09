"""
seed_database.py
────────────────────────────────────────────────────────────────
Complete database seeding script for DemiGuard XAI module.

Collections used (NO interference with teammates' collections):
  - student_acc/{studentId}                    ← personal info + current semester
  - student_acc/{studentId}/semesters/{key}    ← semester marks + risk
  - student_risk_predictions/{studentId}       ← latest risk mirrored

Run:
    pip install firebase-admin requests
    python seed_database.py

Requirements:
    - firebase_adminkey.json in same folder
    - XAI service running: uvicorn main_xai:app --port 8002
"""

import csv
import time
import random
import requests
import firebase_admin
from firebase_admin import credentials, firestore

# ── CONFIG ──────────────────────────────────────────────────────
SERVICE_ACCOUNT_PATH = "firebase_adminkey.json"
CSV_PATH = "Processed_Student_Performance (1).csv"

XAI_BASE_URL = "http://127.0.0.1:8002"
# XAI_BASE_URL = "https://epithetically-wisest-kairi.ngrok-free.dev"

# For demo use 20, for full seed use None
MAX_STUDENTS = 20

# ── INIT FIREBASE ────────────────────────────────────────────────
cred = credentials.Certificate(SERVICE_ACCOUNT_PATH)
firebase_admin.initialize_app(cred)
db = firestore.client()
print("✅ Firebase connected")

# ── LOAD CSV ─────────────────────────────────────────────────────
with open(CSV_PATH, newline="", encoding="utf-8") as f:
    reader = csv.DictReader(f)
    all_students = list(reader)

students = all_students[:MAX_STUDENTS] if MAX_STUDENTS else all_students
print(f"📋 Loaded {len(students)} students from CSV")

# ── HELPERS ──────────────────────────────────────────────────────

def safe_float(val, default=0.0):
    try:
        return float(val)
    except:
        return default

def safe_int(val, default=0):
    try:
        return int(float(val))
    except:
        return default

def vary(value, delta_pct, min_val=0, max_val=100):
    delta = value * (delta_pct / 100)
    varied = value + random.uniform(-delta, delta)
    return round(max(min_val, min(max_val, varied)), 2)

def build_marks(row, variation_pct=0):
    base = {
        "Attendance_pct": safe_float(row["Attendance_pct"]),
        "Midterm_Score": safe_float(row["Midterm_Score"]),
        "Final_Score": safe_float(row["Final_Score"]),
        "Assignments_Avg": safe_float(row["Assignments_Avg"]),
        "Quizzes_Avg": safe_float(row["Quizzes_Avg"]),
        "Participation_Score": safe_float(row["Participation_Score"]),
        "Projects_Score": safe_float(row["Projects_Score"]),
        "Age": safe_int(row["Age"], 20),
        "Study_Hours_per_Week": safe_float(row["Study_Hours_per_Week"]),
        "Stress_Level": safe_int(row["Stress_Level_1-10"], 5),
        "Sleep_Hours_per_Night": safe_float(row["Sleep_Hours_per_Night"]),
        "Gender": row["Gender"],
        "Department": row["Department"],
        "Extracurricular_Activities": row["Extracurricular_Activities"],
        "Internet_Access_at_Home": row["Internet_Access_at_Home"],
        "Parent_Education_Level": row["Parent_Education_Level"],
        "Family_Income_Level": row["Family_Income_Level"],
    }
    if variation_pct > 0:
        for key in ["Attendance_pct", "Midterm_Score", "Final_Score",
                    "Assignments_Avg", "Quizzes_Avg", "Participation_Score",
                    "Projects_Score", "Study_Hours_per_Week"]:
            base[key] = vary(base[key], variation_pct)
    return base

def get_risk_prediction(student_id, marks):
    try:
        payload = {**marks, "studentId": student_id}
        response = requests.post(
            f"{XAI_BASE_URL}/predict-risk/shap",
            json=payload,
            timeout=30
        )
        if response.status_code == 200:
            return response.json()
        else:
            print(f"  ⚠️  XAI error {response.status_code} for {student_id}")
            return None
    except Exception as e:
        print(f"  ❌ XAI call failed for {student_id}: {e}")
        return None

def risk_color_from_level(level):
    return {"High": "red", "Medium": "amber", "Low": "green"}.get(level, "amber")

# ── SEMESTER CONFIGS ─────────────────────────────────────────────
SEMESTER_CONFIGS = [
    {
        "year": 2024,
        "semester": "Semester 1",
        "key": "2024_Semester1",
        "variation_pct": 20,
        "stress_boost": 2,
        "sleep_penalty": -1,
        "study_penalty": -3,
    },
    {
        "year": 2024,
        "semester": "Semester 2",
        "key": "2024_Semester2",
        "variation_pct": 10,
        "stress_boost": 1,
        "sleep_penalty": -0.5,
        "study_penalty": -1,
    },
    {
        "year": 2025,
        "semester": "Semester 1",
        "key": "2025_Semester1",
        "variation_pct": 0,
        "stress_boost": 0,
        "sleep_penalty": 0,
        "study_penalty": 0,
    },
]

# ── MAIN SEEDING LOOP ─────────────────────────────────────────────
print("\n🚀 Starting seed...\n")

success_count = 0
fail_count = 0

for i, row in enumerate(students):
    student_id = row["Student_ID"]
    print(f"[{i+1}/{len(students)}] Seeding {student_id}...")

    # ── 1. Create student_acc top-level document ─────────────────
    student_acc_data = {
        "student_id": student_id,
        "first_name": row["First_Name"],
        "last_name": row["Last_Name"],
        "email": row["Email"],
        "gender": row["Gender"],
        "age": safe_int(row["Age"], 20),
        "department": row["Department"],
        "current_year": 2025,
        "current_semester": "Semester 1",
        "extracurricular_activities": row["Extracurricular_Activities"],
        "internet_access_at_home": row["Internet_Access_at_Home"],
        "parent_education_level": row["Parent_Education_Level"],
        "family_income_level": row["Family_Income_Level"],
        "created_at": firestore.SERVER_TIMESTAMP,
        "updated_at": firestore.SERVER_TIMESTAMP,
    }
    db.collection("student_acc").document(student_id).set(student_acc_data)

    latest_risk = None
    latest_marks = None

    # ── 2. Seed each semester into student_acc sub-collection ────
    for sem_cfg in SEMESTER_CONFIGS:
        marks = build_marks(row, variation_pct=sem_cfg["variation_pct"])

        marks["Stress_Level"] = max(1, min(10,
            marks["Stress_Level"] + sem_cfg["stress_boost"]))
        marks["Sleep_Hours_per_Night"] = max(3, min(10,
            marks["Sleep_Hours_per_Night"] + sem_cfg["sleep_penalty"]))
        marks["Study_Hours_per_Week"] = max(1,
            marks["Study_Hours_per_Week"] + sem_cfg["study_penalty"])

        risk = get_risk_prediction(student_id, marks)

        semester_data = {
            **marks,
            "year": sem_cfg["year"],
            "semester": sem_cfg["semester"],
            "semester_key": sem_cfg["key"],
            "updated_at": firestore.SERVER_TIMESTAMP,
            "updated_by": "seed_script",
        }

        if risk:
            semester_data.update({
                "risk_score": risk.get("risk_score", 0),
                "risk_percentage": risk.get("risk_percentage", 0),
                "risk_level": risk.get("risk_level", "Unknown"),
                "risk_color": risk.get("risk_color",
                    risk_color_from_level(risk.get("risk_level", ""))),
                "explanation": risk.get("explanation", {}),
                "model_version": risk.get("model_version", "v4_hybrid"),
                "predicted_at": firestore.SERVER_TIMESTAMP,
            })
            print(f"  ✅ {sem_cfg['key']} → {risk.get('risk_level')} ({risk.get('risk_percentage')}%)")
        else:
            print(f"  ⚠️  {sem_cfg['key']} → saved without risk prediction")

        # Save to student_acc/{id}/semesters/{key}
        db.collection("student_acc").document(student_id)\
          .collection("semesters").document(sem_cfg["key"])\
          .set(semester_data)

        # Track latest (2025 S1)
        if sem_cfg["year"] == 2025 and sem_cfg["semester"] == "Semester 1":
            latest_risk = risk
            latest_marks = marks

        time.sleep(0.3)

    # ── 3. Update student_acc top-level with latest marks ────────
    if latest_marks:
        db.collection("student_acc").document(student_id).set({
            **latest_marks,
            "current_year": 2025,
            "current_semester": "Semester 1",
            "updated_at": firestore.SERVER_TIMESTAMP,
        }, merge=True)

    # ── 4. Mirror latest risk to student_risk_predictions ────────
    if latest_risk:
        db.collection("student_risk_predictions").document(student_id).set({
            **latest_risk,
            "student_id": student_id,
            "year": 2025,
            "semester": "Semester 1",
            "semester_key": "2025_Semester1",
            "updated_by": "seed_script",
            "cached_at": firestore.SERVER_TIMESTAMP,
            "predicted_at": firestore.SERVER_TIMESTAMP,
        }, merge=True)
        success_count += 1
    else:
        fail_count += 1

    print()

# ── SUMMARY ──────────────────────────────────────────────────────
print("=" * 50)
print(f"✅ Seeded successfully: {success_count}")
print(f"❌ Failed:             {fail_count}")
print(f"📦 Total students:     {len(students)}")
print("\n🎉 Done! Firestore collections updated:")
print("   - student_acc/{studentId}                 ← personal info + latest marks")
print("   - student_acc/{studentId}/semesters/2024_Semester1")
print("   - student_acc/{studentId}/semesters/2024_Semester2")
print("   - student_acc/{studentId}/semesters/2025_Semester1")
print("   - student_risk_predictions/{studentId}    ← latest risk mirrored")
print("\n✅ 'students' collection NOT touched — teammates safe!")
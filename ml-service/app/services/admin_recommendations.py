# import os
# import joblib
# import pandas as pd
# import json
# import logging
# from dotenv import load_dotenv
# from groq import Groq
# from app.schemas.admin_recommendations import RecommendationRequest

# # ==========================================
# # 1. SETUP, LOGGING & DYNAMIC PATHING
# # ==========================================
# # ==========================================
# # 1. SETUP, LOGGING & DEEP DEBUGGING
# # ==========================================
# logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
# load_dotenv()

# # Get absolute paths
# FILE_PATH = os.path.abspath(__file__)
# SERVICES_DIR = os.path.dirname(FILE_PATH)
# APP_DIR = os.path.dirname(SERVICES_DIR)
# MODELS_DIR = os.path.join(APP_DIR, "models")
# MODEL_PATH = os.path.join(MODELS_DIR, "student_model.pkl")

# print("\n" + "="*50)
# print("🔍 DEBUGGING MODEL LOADING")
# print(f"📂 Current File: {FILE_PATH}")
# print(f"📂 App Directory: {APP_DIR}")
# print(f"📂 Models Directory: {MODELS_DIR}")

# # Check if the folder exists
# if os.path.exists(MODELS_DIR):
#     print(f"✅ Models folder found. Contents: {os.listdir(MODELS_DIR)}")
# else:
#     print(f"❌ Models folder NOT FOUND at {MODELS_DIR}")

# print(f"🎯 Looking for: {MODEL_PATH}")
# print("="*50 + "\n")

# GROQ_API_KEY = os.getenv("GROQ_API_KEY")
# client = Groq(api_key=GROQ_API_KEY) if GROQ_API_KEY else None

# try:
#     if not os.path.exists(MODEL_PATH):
#         # Check for similar filenames if the exact one is missing
#         available = os.listdir(MODELS_DIR) if os.path.exists(MODELS_DIR) else []
#         raise FileNotFoundError(f"Missing {MODEL_PATH}. Did you mean one of these? {available}")
        
#     model = joblib.load(MODEL_PATH)
#     logging.info(f"✅ SUCCESS: Multi-Output model loaded.")
# except Exception as e:
#     logging.error(f"❌ LOAD FAILED: {e}")
#     model = None
# # ==========================================
# # 2. CATEGORIZATION LOGIC
# # ==========================================
# def get_wellbeing_category(idx):
#     """Categorizes wellbeing index into actionable tiers."""
#     if idx <= 0.35: return "CRITICAL (High Stress / Burnout Risk)"
#     if idx <= 0.65: return "MODERATE (Needs Wellness Intervention)"
#     return "STABLE (Healthy Work-Life Balance)"

# def get_study_category(idx):
#     """Categorizes study index into academic discipline tiers."""
#     if idx <= 0.35: return "STRUGGLING (Ineffective Habits / High Risk)"
#     if idx <= 0.65: return "MODERATE (Needs Technique Refinement)"
#     return "EXCELLENT (Strong Academic Discipline)"

# # ==========================================
# # 3. GENERATIVE AI ADVICE (Personalized)
# # ==========================================
# def generate_llm_advice(student_data, w_status, s_status):
#     """
#     Calls Groq LLM to generate personalized student interventions.
#     """
#     if not client:
#         return {"summary": "AI Insight Service currently unavailable."}

#     prompt = f"""
#     You are an elite Academic Mentor. Analyze this student's dual-index profile.
    
#     PREDICTED STATUS:
#     - Wellbeing Category: {w_status}
#     - Study Habit Category: {s_status}
    
#     CURRENT METRICS:
#     - Attendance: {student_data['Attendance']}%
#     - Study Hours: {student_data['Study_Hours']} hrs/week
#     - Stress Level (1-10): {student_data['Stress']}
#     - Sleep: {student_data['Sleep']} hrs/night

#     TASK:
#     1. Write a 2-sentence summary acknowledging their specific Wellbeing and Study status.
#     2. Identify the ONE most urgent Priority Focus (Wellbeing or Study).
#     3. Provide 3 Academic Tips for general subject mastery (e.g., Feynman Technique, Active Recall).
#     4. Provide 3 Wellness Tips (focused on Stress and Sleep hygiene).
#     5. Provide 3 Action Items (Step 1, Step 2, Step 3).

#     Return STRICTLY JSON format:
#     {{
#       "summary": "",
#       "priority_focus": "",
#       "academic_tips": [],
#       "wellness_tips": [],
#       "action_items": []
#     }}
#     """
#     try:
#         response = client.chat.completions.create(
#             messages=[{"role": "user", "content": prompt}],
#             model="llama-3.3-70b-versatile",
#             response_format={"type": "json_object"},
#             temperature=0.7,
#         )
#         return json.loads(response.choices[0].message.content)
#     except Exception as e:
#         logging.error(f"LLM Generation Error: {e}")
#         return {"summary": "Error generating personalized AI insights."}

# # ==========================================
# # 4. PREDICTION PIPELINE
# # ==========================================
# def predict_recommendations(data: RecommendationRequest):
#     student_results = []
#     X_list = []
    
#     # 1. Map Request data to Model features
#     for s in data.students:
#         X_list.append({
#             "Attendance_pct": s.attendance_pct,
#             "Midterm_Score": s.midterm_score,
#             "Assignments_Avg": s.assignments_avg,
#             "Quizzes_Avg": s.quizzes_avg,
#             "Participation_Score": s.participation_score,
#             "Projects_Score": s.projects_score,
#             "Study_Hours_per_Week": s.study_hours_per_week,
#             "Extracurricular_Activities": s.extracurricular_activities,
#             "Stress_Level_1-10": s.stress_level,
#             "Sleep_Hours_per_Night": s.sleep_hours
#         })

#     df_batch = pd.DataFrame(X_list)
    
#     # 2. ML Execution
#     if model:
#         # Predicts both wellbeing_index and study_index
#         predictions = model.predict(df_batch)
#     else:
#         # Fallback if model loading failed
#         predictions = [[0.5, 0.5]] * len(X_list)

#     # 3. Individual Student Processing
#     for i, s in enumerate(data.students):
#         w_idx = float(predictions[i][0])
#         s_idx = float(predictions[i][1])

#         # Get categorical labels
#         w_status = get_wellbeing_category(w_idx)
#         s_status = get_study_category(s_idx)

#         # Build data package for LLM
#         rich_data = {
#             "Attendance": s.attendance_pct,
#             "Study_Hours": s.study_hours_per_week,
#             "Stress": s.stress_level,
#             "Sleep": s.sleep_hours
#         }
        
#         # Generate personalized insights
#         ai_insights = generate_llm_advice(rich_data, w_status, s_status)

#         student_results.append({
#             "student_id": s.student_id,
#             "wellbeing_profile": {
#                 "index": round(w_idx, 2),
#                 "status": w_status
#             },
#             "study_profile": {
#                 "index": round(s_idx, 2),
#                 "status": s_status
#             },
#             "ai_insights": ai_insights
#         })

#     return {
#         "student_recommendations": student_results
#     }
import os
import joblib
import pandas as pd
import json
import logging
from dotenv import load_dotenv
from groq import Groq
# UPDATED: Using your new unique schema names
from app.schemas.admin_recommendations import AcademicRecommendationRequest

# ==========================================
# 1. SETUP, LOGGING & DYNAMIC PATHING
# ==========================================
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
load_dotenv()

# Get absolute paths
FILE_PATH = os.path.abspath(__file__)
SERVICES_DIR = os.path.dirname(FILE_PATH)
APP_DIR = os.path.dirname(SERVICES_DIR)
MODELS_DIR = os.path.join(APP_DIR, "models")
MODEL_PATH = os.path.join(MODELS_DIR, "student_model.pkl")

print("\n" + "="*50)
print("🔍 DEBUGGING MODEL LOADING")
print(f"🎯 Looking for: {MODEL_PATH}")

try:
    if not os.path.exists(MODEL_PATH):
        available = os.listdir(MODELS_DIR) if os.path.exists(MODELS_DIR) else []
        raise FileNotFoundError(f"Missing {MODEL_PATH}. Available: {available}")
        
    model = joblib.load(MODEL_PATH)
    logging.info(f"✅ SUCCESS: Multi-Output model loaded.")
except Exception as e:
    logging.error(f"❌ LOAD FAILED: {e}")
    model = None

GROQ_API_KEY = os.getenv("GROQ_API_KEY")
client = Groq(api_key=GROQ_API_KEY) if GROQ_API_KEY else None

# ==========================================
# 2. CATEGORIZATION LOGIC
# ==========================================
def get_wellbeing_category(idx):
    if idx <= 0.35: return "CRITICAL (High Stress / Burnout Risk)"
    if idx <= 0.65: return "MODERATE (Needs Wellness Intervention)"
    return "STABLE (Healthy Work-Life Balance)"

def get_study_category(idx):
    if idx <= 0.35: return "STRUGGLING (Ineffective Habits / High Risk)"
    if idx <= 0.65: return "MODERATE (Needs Technique Refinement)"
    return "EXCELLENT (Strong Academic Discipline)"

# ==========================================
# 3. GENERATIVE AI ADVICE (Personalized)
# ==========================================
def generate_llm_advice(student_data, w_status, s_status):
    if not client:
        return {"summary": "AI Insight Service currently unavailable."}

    prompt = f"""
    You are an elite Academic Mentor. Analyze this student's dual-index profile.
    
    PREDICTED STATUS:
    - Wellbeing Category: {w_status}
    - Study Habit Category: {s_status}
    
    CURRENT METRICS:
    - Attendance: {student_data['Attendance']}%
    - Study Hours: {student_data['Study_Hours']} hrs/week
    - Stress Level (1-10): {student_data['Stress']}
    - Sleep: {student_data['Sleep']} hrs/night

    TASK:
    1. Write a 2-sentence summary.
    2. Identify ONE Priority Focus.
    3. 3 Academic Tips.
    4. 3 Wellness Tips.
    5. 3 Step-by-step Action Items.

    Return STRICTLY JSON format:
    {{
      "summary": "",
      "priority_focus": "",
      "academic_tips": [],
      "wellness_tips": [],
      "action_items": []
    }}
    """
    try:
        response = client.chat.completions.create(
            messages=[{"role": "user", "content": prompt}],
            model="llama-3.3-70b-versatile",
            response_format={"type": "json_object"},
            temperature=0.7,
        )
        return json.loads(response.choices[0].message.content)
    except Exception as e:
        logging.error(f"LLM Generation Error: {e}")
        return {"summary": "Error generating personalized AI insights."}

# ==========================================
# 4. PREDICTION PIPELINE
# ==========================================
def predict_rec(data: AcademicRecommendationRequest):
    student_results = []
    X_list = []
    
    # 1. Map Request data to Model features with Encoding
    for s in data.students:
        # CONVERSION: The model needs 1/0, not "Yes"/"No"
        extra_val = 1 if str(s.extracurricular_activities).lower() == "yes" else 0
        
        X_list.append({
            "Attendance_pct": s.attendance_pct,
            "Midterm_Score": s.midterm_score,
            "Assignments_Avg": s.assignments_avg,
            "Quizzes_Avg": s.quizzes_avg,
            "Participation_Score": s.participation_score,
            "Projects_Score": s.projects_score,
            "Study_Hours_per_Week": s.study_hours_per_week,
            "Extracurricular_Activities": extra_val, # Now a number!
            "Stress_Level_1-10": s.stress_level,
            "Sleep_Hours_per_Night": s.sleep_hours
        })

    df_batch = pd.DataFrame(X_list)
    
    # 2. ML Execution
    if model:
        try:
            predictions = model.predict(df_batch)
        except Exception as e:
            logging.error(f"❌ Prediction Error: {e}")
            predictions = [[0.5, 0.5]] * len(X_list)
    else:
        predictions = [[0.5, 0.5]] * len(X_list)

    # 3. Individual Student Processing
    for i, s in enumerate(data.students):
        w_idx = float(predictions[i][0])
        s_idx = float(predictions[i][1])

        w_status = get_wellbeing_category(w_idx)
        s_status = get_study_category(s_idx)

        rich_data = {
            "Attendance": s.attendance_pct,
            "Study_Hours": s.study_hours_per_week,
            "Stress": s.stress_level,
            "Sleep": s.sleep_hours
        }
        
        ai_insights = generate_llm_advice(rich_data, w_status, s_status)

        # UPDATED: Matching IndividualAnalyticResult & AnalyticScoreProfile
        student_results.append({
            "student_id": s.student_id,
            "wellbeing_profile": {
                "index": round(w_idx, 2),
                "status": w_status
            },
            "study_profile": {
                "index": round(s_idx, 2),
                "status": s_status
            },
            "ai_insights": ai_insights
        })

    # UPDATED: Matching AcademicRecommendationResponse structure
    return {
        "student_recommendations": student_results
    }
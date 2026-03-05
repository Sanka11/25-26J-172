

import joblib
import pandas as pd
import json
import os
import sys
import logging
from dotenv import load_dotenv
from groq import Groq

from app.services.syllabus import get_syllabus_context

# ==========================================
# SETUP LOGGING & SILENCE HTTPX
# ==========================================
logging.basicConfig(
    level=logging.INFO, 
    format='%(asctime)s - %(levelname)s - %(message)s'
)

# Hide the "HTTP Request: POST..." logs from the Groq client
logging.getLogger("httpx").setLevel(logging.WARNING)

# ==========================================
# LOAD ENV VARIABLES
# ==========================================
try:
    load_dotenv()
    GROQ_API_KEY = os.getenv("GROQ_API_KEY")
    
    if not GROQ_API_KEY:
        raise ValueError("GROQ_API_KEY is missing from the environment variables.")
        
except Exception as e:
    logging.critical(f"App Startup Failed: {e}")
    sys.exit(1)

# ==========================================
# INITIALIZE GROQ CLIENT
# ==========================================
try:
    client = Groq(api_key=GROQ_API_KEY)
    logging.info("Groq client initialized successfully.")
except Exception as e:
    logging.error(f"Failed to initialize Groq client: {e}")
    client = None

# ==========================================
# LOAD ML MODEL
# ==========================================
MODEL_PATH = "app/models/recommendation_engine_model.pkl"

try:
    model = joblib.load(MODEL_PATH)
    logging.info("Recommendation engine model loaded successfully.")
except FileNotFoundError:
    logging.error(f"The model file was not found at '{MODEL_PATH}'. Check file paths.")
    model = None
except Exception as e:
    logging.error(f"Unexpected error loading the model: {e}")
    model = None

# ==========================================
# 2. GENERATIVE AI FUNCTION (Syllabus-Aware)
# ==========================================
# def generate_llm_advice(student_data, status_label, syllabus_context):
    
#     prompt = f"""
#     You are a world-class, data-driven Academic Advisor at a top-tier university.
#     Run a diagnostic analysis on this student's exact performance metrics.
    
#     Current System Status: {status_label}
#     - Attendance: {student_data['Attendance_pct']}%
#     - Study Hours: {student_data['Study_Hours_per_Week']} hours/week
#     - Stress Level (1-10): {student_data['Stress_Level_1-10']}
#     - Sleep: {student_data.get('Sleep_Hours', 'Unknown')} hours/night
#     - Midterm Score: {student_data['Midterm_Score']}/100
#     - Assignments Average: {student_data['Assignments_Avg']}/100
#     - Quizzes Average: {student_data['Quizzes_Avg']}/100

#     Course Context for this week:
#     - Current Module: {syllabus_context['module']}
#     - Upcoming Assessment: {syllabus_context['assessment']}
#     - Key Concepts to Master: {syllabus_context['key_concepts']}

#     Your task is to provide a highly personalized, step-by-step intervention plan.
    
#     RULES FOR YOUR RESPONSE:
#     1. SUMMARY: Write 2 powerful sentences. Acknowledge their Status and their lowest grade.
#     2. ACADEMIC TIP (The Study Method): Recommend a specific, NAMED psychological study framework (e.g., "The Feynman Technique", "Active Recall"). 
#        CRITICAL: You MUST explicitly use the "Key Concepts" provided above and tell them how to apply the study framework to those specific concepts to prepare for the "{syllabus_context['assessment']}".
#     3. WELLNESS TIP: Base this strictly on their Stress Level, Sleep, and Study Hours. 
#     4. ACTION ITEMS: Provide exactly 3 short tasks. Begin each with "Step 1:", "Step 2:", and "Step 3:". These steps MUST mention specific actions related to the "Key Concepts".
    
#     Return STRICTLY in JSON format:
#     {{
#       "summary": "",
#       "academic_tip": "",
#       "wellness_tip": "",
#       "action_items": ["Step 1: ...", "Step 2: ...", "Step 3: ..."]
#     }}
#     """

#     try:
#         # Call the blazing fast Groq API
#         chat_completion = client.chat.completions.create(
#             messages=[
#                 {"role": "system", "content": "You are a professional academic advisor. You strictly output valid JSON."},
#                 {"role": "user", "content": prompt}
#             ],
#             model="llama-3.1-8b-instant", # The newest fast model
#             response_format={"type": "json_object"}, 
#             temperature=0.7, 
#         )
#         return json.loads(chat_completion.choices[0].message.content)
        
#     except Exception as e:
#         print(f"⚠️ Cloud LLM Error ({e})")
#         return {
#             "summary": "System fallback triggered. We are temporarily unable to generate custom AI advice.",
#             "academic_tip": f"Apply Active Recall to this week's topic: {syllabus_context['module']}.",
#             "wellness_tip": "Take a 10-minute screen break to lower your stress.",
#             "action_items": ["Step 1: Review notes.", "Step 2: Do practice problems.", "Step 3: Sleep 7 hours."]
#         }


# ==========================================
# 2. GENERATIVE AI FUNCTION (Syllabus-Aware)
# ==========================================
def generate_llm_advice(student_data, status_label, syllabus_context):
    
    prompt = f"""
    You are a world-class, data-driven Academic Advisor at a top-tier university.
    Run a diagnostic analysis on this student's exact performance metrics.
    
    Current System Status: {status_label}
    - Attendance: {student_data['Attendance_pct']}%
    - Study Hours: {student_data['Study_Hours_per_Week']} hours/week
    - Stress Level (1-10): {student_data['Stress_Level_1-10']}
    - Sleep: {student_data.get('Sleep_Hours', 'Unknown')} hours/night
    - Midterm Score: {student_data['Midterm_Score']}/100
    - Assignments Average: {student_data['Assignments_Avg']}/100
    - Quizzes Average: {student_data['Quizzes_Avg']}/100

    Course Context for this week:
    - Current Module: {syllabus_context['module']}
    - Upcoming Assessment: {syllabus_context['assessment']}
    - Key Concepts to Master: {syllabus_context['key_concepts']}

    Your task is to provide a highly personalized, step-by-step intervention plan.
    
    RULES FOR YOUR RESPONSE:
    1. SUMMARY: Write 2 powerful sentences. Acknowledge their Status and their lowest grade.
    2. WELLNESS SUMMARY: Write 1-2 empathetic sentences acknowledging their current stress level, sleep, and study habits.
    3. ACADEMIC TIPS (Point-wise): Recommend a specific, NAMED psychological study framework (e.g., "The Feynman Technique"). Provide exactly 2-3 specific bullet points. CRITICAL: You MUST explicitly tell them how to apply it to the "Key Concepts" provided above.
    4. WELLNESS TIPS (Point-wise): Provide exactly 2-3 actionable, short bullet points based strictly on their reported Stress Level, Sleep, and Study Hours.
    5. ACTION ITEMS: Provide exactly 3 short tasks. Begin each with "Step 1:", "Step 2:", and "Step 3:". These steps MUST mention specific actions related to the "Key Concepts".
    
    Return STRICTLY in JSON format:
    {{
      "summary": "",
      "wellness_summary": "",
      "academic_tips": ["...", "..."],
      "wellness_tips": ["...", "..."],
      "action_items": ["Step 1: ...", "Step 2: ...", "Step 3: ..."]
    }}
    """

    try:
        # Call the blazing fast Groq API
        chat_completion = client.chat.completions.create(
            messages=[
                {"role": "system", "content": "You are a professional academic advisor. You strictly output valid JSON."},
                {"role": "user", "content": prompt}
            ],
            model="llama-3.1-8b-instant", # The newest fast model
            response_format={"type": "json_object"}, 
            temperature=0.7, 
        )
        return json.loads(chat_completion.choices[0].message.content)
        
    except Exception as e:
        print(f"⚠️ Cloud LLM Error ({e})")
        # Ensure the fallback also matches the new array structure!
        return {
            "summary": "System fallback triggered. We are temporarily unable to generate custom AI advice.",
            "wellness_summary": "Please ensure you are prioritizing your physical and mental health this week.",
            "academic_tips": [
                f"Apply Active Recall to this week's topic: {syllabus_context['module']}.",
                "Review your past assignments to identify weak points."
            ],
            "wellness_tips": [
                "Take a 10-minute screen break every hour.",
                "Aim for at least 7 hours of sleep tonight."
            ],
            "action_items": ["Step 1: Review notes.", "Step 2: Do practice problems.", "Step 3: Sleep 7 hours."]
        }

# ==========================================
# 3. MAIN RECOMMENDATION PIPELINE
# ==========================================
def predict_recommendations(data):
    student_results = []
    X_batch = []
    meta = []  

    for s in data.students:
        X_batch.append({
            "Attendance_pct": s.attendance_pct,
            "Midterm_Score": s.midterm_score,
            "Assignments_Avg": s.assignments_avg,
            "Quizzes_Avg": s.quizzes_avg,
            "Projects_Score": s.projects_score,
            "Study_Hours_per_Week": s.study_hours_per_week,
            "Stress_Level_1-10": s.stress_level
        })
        meta.append(s.student_id)

    df_batch = pd.DataFrame(X_batch)
    index_probabilities = model.predict_proba(df_batch)[:, 1] 

    total_index = 0.0

    for student_id, prob, s in zip(meta, index_probabilities, data.students):
        rec_index = float(max(0.0, min(prob, 1.0)))
        total_index += rec_index
        
        # 🚦 3-TIER TRAFFIC LIGHT LOGIC 🚦
        if rec_index < 0.40:
            status_label = "ON TRACK"
        elif rec_index < 0.60:
            status_label = "NEEDS ATTENTION"
        else:
            status_label = "PRIORITY SUPPORT NEEDED"

        # Build a rich dictionary of ALL student data to feed the LLM
        rich_student_data = {
            "Attendance_pct": s.attendance_pct,
            "Midterm_Score": s.midterm_score,
            "Assignments_Avg": s.assignments_avg,
            "Quizzes_Avg": s.quizzes_avg,
            "Projects_Score": s.projects_score,
            "Study_Hours_per_Week": s.study_hours_per_week,
            "Stress_Level_1-10": s.stress_level,
            "Sleep_Hours": getattr(s, 'sleep_hours', 'Unknown') 
        }

        # 📚 Get the syllabus context (Currently testing with OOP Week 4)
        # Later, we can pass "OOP" and "4" dynamically from the frontend!
        current_syllabus = get_syllabus_context("OOP", 4)

        # Call the world-class advisor prompt!
        llm_advice_json = generate_llm_advice(rich_student_data, status_label, current_syllabus)

        student_results.append({
            "student_id": student_id,
            "status": status_label,
            "recommendation_index": round(rec_index, 4),
            "ai_insights": llm_advice_json  
        })

    cohort_avg = total_index / len(index_probabilities) if len(index_probabilities) > 0 else 0.0

    return {
        "cohort_average_recommendation_index": round(cohort_avg, 4),
        "student_recommendations": student_results
    }










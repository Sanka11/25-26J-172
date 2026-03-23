

import joblib
import pandas as pd
import json
import os
import sys
import logging
from dotenv import load_dotenv
from groq import Groq
# Add this to the top of recommendation_service.py
from app.schemas.recommendation_schema import RecommendationRequest
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
def generate_llm_advice(student_data, status_label, syllabus_context):
    
    # prompt = f"""
    # You are an elite, highly empathetic Academic Tutor and Mentor at a top-tier university. 
    # You combine data-driven insights with psychological support to help students master complex subjects.
    # Run a diagnostic analysis on this student's exact performance metrics.
    
    # Current System Status: {status_label}
    # - Attendance: {student_data['Attendance_pct']}%
    # - Study Hours: {student_data['Study_Hours_per_Week']} hours/week
    # - Stress Level (1-10): {student_data['Stress_Level_1-10']}
    # - Sleep: {student_data.get('Sleep_Hours', 'Unknown')} hours/night
    # - Midterm Score: {student_data['Midterm_Score']}/100
    # - Assignments Average: {student_data['Assignments_Avg']}/100
    # - Quizzes Average: {student_data['Quizzes_Avg']}/100

    # Course Context for this week:
    # - Current Module: {syllabus_context['module']}
    # - Upcoming Assessment: {syllabus_context['assessment']}
    # - Key Concepts to Master: {syllabus_context['key_concepts']}

    # Your task is to provide a highly personalized, step-by-step tutoring and intervention plan.
    
    # RULES FOR YOUR RESPONSE:
    # 1. SUMMARY: Write 2 powerful sentences. Speak directly to the student as their personal tutor. Acknowledge their Status and their lowest grade with an encouraging, growth-mindset tone.
    # 2. WELLNESS SUMMARY: Write 1-2 empathetic sentences. 
    #    CRITICAL LOGIC RULE: 6 to 7 hours of sleep is healthy. Less than 6 is "inadequate". More than 7 is "oversleeping". You MUST evaluate their exact sleep number logically.
    # 3. ACADEMIC TIPS (Point-wise): Provide exactly 3 specific tutoring strategies. 
    #    - Recommend advanced cognitive frameworks (e.g., "The Feynman Technique", "Spaced Repetition", "Interleaving", or "Pomodoro Method").
    #    - CRITICAL: You MUST explicitly tell them how to apply these frameworks step-by-step to the "Key Concepts" provided above to prepare for the {syllabus_context['assessment']}.
    # 4. WELLNESS TIPS (Point-wise): Provide exactly 3 actionable, short bullet points.
    #    - CRITICAL CONDITIONAL RULE: If Stress Level > 4, you MUST recommend specific, named relaxation techniques (e.g., "4-7-8 Box Breathing", "Progressive Muscle Relaxation", "5-4-3-2-1 Grounding Technique", or taking a break with a warm drink and a cozy blanket). 
    #    - If Stress Level is 4 or below, focus on maintaining energy levels and healthy sleep hygiene.
    # 5. ACTION ITEMS: Provide exactly 3 short tasks. Begin each with "Step 1:", "Step 2:", and "Step 3:". These steps MUST balance academic review of the "Key Concepts" with wellness actions.
    
    # Return STRICTLY in JSON format:
    # {{
    #   "summary": "",
    #   "wellness_summary": "",
    #   "academic_tips": ["...", "...", "..."],
    #   "wellness_tips": ["...", "...", "..."],
    #   "action_items": ["Step 1: ...", "Step 2: ...", "Step 3: ..."]
    # }}
    # """
    prompt = f"""
    You are an elite, highly empathetic Academic Tutor and Mentor at a top-tier university. 
    You combine data-driven insights with psychological support to help students master complex subjects.
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

    Your task is to provide a highly personalized, step-by-step tutoring and intervention plan.
    
    RULES FOR YOUR RESPONSE:
    1. SUMMARY & PRIORITY: Write 2 powerful sentences speaking directly to the student. Acknowledge their Status. 
       - Then, define their ONE "Priority Focus" (e.g., Is their biggest bottleneck a specific low grade, lack of sleep, or low attendance?).
    
    2. WELLNESS SUMMARY: Write 1-2 empathetic sentences. 
       - CRITICAL LOGIC RULE: 6 to 8 hours of sleep is healthy. Less than 6 is "inadequate". More than 8 is "oversleeping". Evaluate their exact sleep logically.
    
    3. STATUS-DRIVEN ACADEMIC TIPS (Point-wise): Provide exactly 3 specific tutoring strategies tailored to their Status.
       - IF STATUS IS "ON-TRACK" OR "EXCELLING": Focus on mastery, deep understanding, and efficiency. Recommend advanced techniques like "Elaborative Interrogation", "Dual Coding", or teaching the material to someone else.
       - IF STATUS IS "AT-RISK" OR "STRUGGLING": Focus on triage, foundational gaps, and high-yield studying. Recommend core techniques like "The Feynman Technique", "Active Recall", "Spaced Repetition", or the "SQ3R Reading Method".
       - CRITICAL: You MUST explicitly tell them how to apply these frameworks step-by-step to the "Key Concepts" provided above to prepare for the {syllabus_context['assessment']}.
    
    4. WELLNESS TIPS (Point-wise): Provide exactly 3 actionable, short bullet points.
       - If Stress Level > 4: You MUST recommend specific, named relaxation techniques (e.g., "4-7-8 Box Breathing", "Progressive Muscle Relaxation", "5-4-3-2-1 Grounding Technique").
       - If Stress Level <= 4: Focus on maintaining energy levels, nutrition, and healthy sleep hygiene.
    
    5. ACTION ITEMS (The "Next Steps"): Provide exactly 3 short tasks. Begin each with "Step 1:", "Step 2:", and "Step 3:". 
       - These steps MUST address their "Priority Focus" directly. Balance academic review of the "Key Concepts" with wellness actions.
    
    Return STRICTLY in JSON format:
    {{
      "summary": "",
      "priority_focus": "",
      "wellness_summary": "",
      "academic_tips": ["...", "...", "..."],
      "wellness_tips": ["...", "...", "..."],
      "action_items": ["Step 1: ...", "Step 2: ...", "Step 3: ..."]
    }}
    """

    try:
        # Call the blazing fast Groq API
        chat_completion = client.chat.completions.create(
            messages=[
                {"role": "system", "content": "You are a professional academic tutor. You strictly output valid JSON."},
                {"role": "user", "content": prompt}
            ],
            model="llama-3.3-70b-versatile", # The newest fast model   llama-3.3-70b-versatile llama-3.1-8b-instant
            response_format={"type": "json_object"}, 
            temperature=0.7, 
        )
        return json.loads(chat_completion.choices[0].message.content)
        
    except Exception as e:
        print(f"⚠️ Cloud LLM Error ({e})")
        # Fallback ensuring the array structures match the new 3-item rules
        return {
            "summary": "System fallback triggered. We are temporarily unable to generate custom AI advice.",
            "wellness_summary": "Please ensure you are prioritizing your physical and mental health this week.",
            "academic_tips": [
                f"Apply the Feynman Technique to teach the core ideas of {syllabus_context['module']} to an imaginary peer.",
                "Use Spaced Repetition flashcards to memorize the specific Key Concepts for this week.",
                "Review your past assignments to identify weak points before moving forward."
            ],
            "wellness_tips": [
                "Practice 4-7-8 Box Breathing: Inhale for 4 seconds, hold for 7, exhale for 8 to quickly lower stress.",
                "Step away from the screen for 10 minutes every hour to prevent cognitive fatigue.",
                "Aim for at least 7 hours of uninterrupted sleep tonight to consolidate your memory."
            ],
            "action_items": ["Step 1: Organize your notes.", "Step 2: Do 3 practice problems.", "Step 3: Complete a 5-minute breathing exercise."]
        }


# ==========================================
# 3. MAIN RECOMMENDATION PIPELINE
# ==========================================
def predict_recommendations(data: RecommendationRequest):
    student_results = []
    X_batch = []
    meta = []  

    # 👇 1. Pull the subject and week directly from your Pydantic model!
    request_subject = data.subject
    request_week = data.week_number 

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
    
    # Run the ML Model
    if model:
        index_probabilities = model.predict_proba(df_batch)[:, 1] 
    else:
        index_probabilities = [0.5] * len(X_batch)

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

        # Build the rich dictionary for the LLM
        rich_student_data = {
            "Attendance_pct": s.attendance_pct,
            "Midterm_Score": s.midterm_score,
            "Assignments_Avg": s.assignments_avg,
            "Quizzes_Avg": s.quizzes_avg,
            "Projects_Score": s.projects_score,
            "Study_Hours_per_Week": s.study_hours_per_week,
            "Stress_Level_1-10": s.stress_level,
            "Sleep_Hours": s.sleep_hours if s.sleep_hours is not None else "Unknown"
        }

        # 👇 2. Pass those Pydantic variables to your syllabus function
        current_syllabus = get_syllabus_context(request_subject, request_week)

        # Call the LLM
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
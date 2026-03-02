import joblib
import pandas as pd
import json
import os
from dotenv import load_dotenv
from groq import Groq

from app.services.syllabus import get_syllabus_context

# ==========================================
# LOAD ENV VARIABLES
# ==========================================
load_dotenv()

GROQ_API_KEY = os.getenv("GROQ_API_KEY")

# Initialize Groq client
client = Groq(api_key=GROQ_API_KEY)

# Load ML model
model = joblib.load("app/models/recommendation_engine_model.pkl")

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
    2. ACADEMIC TIP (The Study Method): Recommend a specific, NAMED psychological study framework (e.g., "The Feynman Technique", "Active Recall"). 
       CRITICAL: You MUST explicitly use the "Key Concepts" provided above and tell them how to apply the study framework to those specific concepts to prepare for the "{syllabus_context['assessment']}".
    3. WELLNESS TIP: Base this strictly on their Stress Level, Sleep, and Study Hours. 
    4. ACTION ITEMS: Provide exactly 3 short tasks. Begin each with "Step 1:", "Step 2:", and "Step 3:". These steps MUST mention specific actions related to the "Key Concepts".
    
    Return STRICTLY in JSON format:
    {{
      "summary": "",
      "academic_tip": "",
      "wellness_tip": "",
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
        return {
            "summary": "System fallback triggered. We are temporarily unable to generate custom AI advice.",
            "academic_tip": f"Apply Active Recall to this week's topic: {syllabus_context['module']}.",
            "wellness_tip": "Take a 10-minute screen break to lower your stress.",
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





# ///////////

# import joblib
# import pandas as pd
# import json
# import ollama

# from app.services.syllabus import get_syllabus_context

# # ==========================================
# # LOAD ML MODEL
# # ==========================================
# model = joblib.load("app/models/recommendation_engine_model.pkl")


# # ==========================================
# # GENERATIVE AI FUNCTION (LOCAL OLLAMA)
# # ==========================================
# def generate_llm_advice(student_data, status_label, syllabus_context):

#     prompt = f"""
# You are a world-class, data-driven Academic Advisor.

# Student Status: {status_label}

# Attendance: {student_data['Attendance_pct']}%
# Study Hours: {student_data['Study_Hours_per_Week']} hours/week
# Stress Level: {student_data['Stress_Level_1-10']}
# Sleep: {student_data.get('Sleep_Hours', 'Unknown')} hours/night
# Midterm Score: {student_data['Midterm_Score']}
# Assignments Avg: {student_data['Assignments_Avg']}
# Quizzes Avg: {student_data['Quizzes_Avg']}

# Course Context:
# Current Module: {syllabus_context['module']}
# Upcoming Assessment: {syllabus_context['assessment']}
# Key Concepts: {syllabus_context['key_concepts']}

# TASK:

# 1️⃣ SUMMARY → 2 powerful sentences acknowledging status & weakest area  
# 2️⃣ ACADEMIC TIP → Use a NAMED study technique and apply it to key concepts  
# 3️⃣ WELLNESS TIP → Based on stress, sleep & study hours  
# 4️⃣ ACTION ITEMS → EXACTLY 3 steps starting with Step 1, Step 2, Step 3  

# Return ONLY valid JSON:

# {{
#   "summary": "",
#   "academic_tip": "",
#   "wellness_tip": "",
#   "action_items": ["Step 1: ...", "Step 2: ...", "Step 3: ..."]
# }}
# """

#     try:
#         response = ollama.chat(
#             model="llama3",  # or "llama3"
#             messages=[
#                 {"role": "system", "content": "You return ONLY valid JSON."},
#                 {"role": "user", "content": prompt}
#             ],
#             options={"temperature": 0.7}
#         )

#         content = response["message"]["content"]

#         # Attempt to parse JSON safely
#         try:
#             return json.loads(content)
#         except:
#             import re
#             json_text = re.search(r'\{.*\}', content, re.S)
#             if json_text:
#                 return json.loads(json_text.group())
#             else:
#                 raise ValueError("JSON not found")

#     except Exception as e:
#         print("⚠️ Ollama AI Error:", e)

#         return {
#             "summary": "AI advice temporarily unavailable.",
#             "academic_tip": f"Use Active Recall to review {syllabus_context['module']}.",
#             "wellness_tip": "Take short breaks and maintain a consistent sleep schedule.",
#             "action_items": [
#                 "Step 1: Review key concepts",
#                 "Step 2: Practice related problems",
#                 "Step 3: Ensure at least 7 hours of sleep"
#             ]
#         }


# # ==========================================
# # MAIN RECOMMENDATION PIPELINE
# # ==========================================
# def predict_recommendations(data):

#     student_results = []
#     X_batch = []
#     meta = []

#     # -------- Build batch input --------
#     for s in data.students:
#         X_batch.append({
#             "Attendance_pct": s.attendance_pct,
#             "Midterm_Score": s.midterm_score,
#             "Assignments_Avg": s.assignments_avg,
#             "Quizzes_Avg": s.quizzes_avg,
#             "Projects_Score": s.projects_score,
#             "Study_Hours_per_Week": s.study_hours_per_week,
#             "Stress_Level_1-10": s.stress_level
#         })
#         meta.append(s.student_id)

#     df_batch = pd.DataFrame(X_batch)

#     # Predict probability
#     index_probabilities = model.predict_proba(df_batch)[:, 1]

#     total_index = 0.0

#     # -------- Process results --------
#     for student_id, prob, s in zip(meta, index_probabilities, data.students):

#         rec_index = float(max(0.0, min(prob, 1.0)))
#         total_index += rec_index

#         # 🚦 TRAFFIC LIGHT STATUS
#         if rec_index < 0.40:
#             status_label = "ON TRACK"
#         elif rec_index < 0.60:
#             status_label = "NEEDS ATTENTION"
#         else:
#             status_label = "PRIORITY SUPPORT NEEDED"

#         rich_student_data = {
#             "Attendance_pct": s.attendance_pct,
#             "Midterm_Score": s.midterm_score,
#             "Assignments_Avg": s.assignments_avg,
#             "Quizzes_Avg": s.quizzes_avg,
#             "Projects_Score": s.projects_score,
#             "Study_Hours_per_Week": s.study_hours_per_week,
#             "Stress_Level_1-10": s.stress_level,
#             "Sleep_Hours": getattr(s, 'sleep_hours', 'Unknown')
#         }

#         # 📚 syllabus context (example: OOP week 4)
#         syllabus = get_syllabus_context("OOP", 4)

#         ai_advice = generate_llm_advice(
#             rich_student_data,
#             status_label,
#             syllabus
#         )

#         student_results.append({
#             "student_id": student_id,
#             "status": status_label,
#             "recommendation_index": round(rec_index, 4),
#             "ai_insights": ai_advice
#         })

#     cohort_avg = (
#         total_index / len(index_probabilities)
#         if len(index_probabilities) > 0 else 0.0
#     )

#     return {
#         "cohort_average_recommendation_index": round(cohort_avg, 4),
#         "student_recommendations": student_results
#     }




# import joblib
# import pandas as pd
# import json
# import os
# import re
# import google.generativeai as genai
# from dotenv import load_dotenv

# from app.services.syllabus import get_syllabus_context

# # ==========================================
# # 1. LOAD ENV VARIABLES & CONFIG
# # ==========================================
# load_dotenv()

# GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

# if GEMINI_API_KEY:
#     genai.configure(api_key=GEMINI_API_KEY)

# # Load ML model
# model = joblib.load("app/models/recommendation_engine_model.pkl")

# # ==========================================
# # 2. SAFE JSON PARSER
# # ==========================================
# def extract_json(text):
#     try:
#         return json.loads(text)
#     except:
#         match = re.search(r'\{.*\}', text, re.S)
#         if match:
#             return json.loads(match.group())
#         raise ValueError("No JSON found")

# # ==========================================
# # 3. GENERATIVE AI FUNCTION (Gemini Only)
# # ==========================================
# def generate_llm_advice(student_data, status_label, syllabus_context):
    
#     # 🌟 The Rich Prompt for highly detailed insights
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

#     # ---------- DIRECT CALL TO GEMINI ----------
#     if not GEMINI_API_KEY:
#         print("⚠️ Gemini API key not configured. Using static fallback.")
#     else:
#         try:
#             model = genai.GenerativeModel("gemini-1.5-flash")
            
#             # 🚀 FORCED JSON MODE guarantees clean output
#             response = model.generate_content(
#                 prompt,
#                 generation_config=genai.GenerationConfig(
#                     response_mime_type="application/json"
#                 )
#             )
#             return extract_json(response.text)

#         except Exception as e:
#             print(f"⚠️ Gemini AI Error: {e}")

#     # ---------- FINAL SAFE FALLBACK ----------
#     return {
#         "summary": "AI advice temporarily unavailable due to system overload.",
#         "academic_tip": f"Use Active Recall to review this week's key concepts for {syllabus_context['module']}.",
#         "wellness_tip": "Take short screen breaks and try to maintain a healthy sleep schedule.",
#         "action_items": [
#             "Step 1: Review the key concepts from class.",
#             "Step 2: Complete a set of practice problems without looking at your notes.",
#             "Step 3: Aim for at least 7 hours of sleep tonight."
#         ]
#     }

# # ==========================================
# # 4. MAIN RECOMMENDATION PIPELINE
# # ==========================================
# def predict_recommendations(data):
#     student_results = []
#     X_batch = []
#     meta = []  

#     for s in data.students:
#         X_batch.append({
#             "Attendance_pct": s.attendance_pct,
#             "Midterm_Score": s.midterm_score,
#             "Assignments_Avg": s.assignments_avg,
#             "Quizzes_Avg": s.quizzes_avg,
#             "Projects_Score": s.projects_score,
#             "Study_Hours_per_Week": s.study_hours_per_week,
#             "Stress_Level_1-10": s.stress_level
#         })
#         meta.append(s.student_id)

#     df_batch = pd.DataFrame(X_batch)
#     index_probabilities = model.predict_proba(df_batch)[:, 1] 

#     total_index = 0.0

#     for student_id, prob, s in zip(meta, index_probabilities, data.students):
#         rec_index = float(max(0.0, min(prob, 1.0)))
#         total_index += rec_index
        
#         # 🚦 3-TIER TRAFFIC LIGHT LOGIC 🚦
#         if rec_index < 0.40:
#             status_label = "ON TRACK"
#         elif rec_index < 0.60:
#             status_label = "NEEDS ATTENTION"
#         else:
#             status_label = "PRIORITY SUPPORT NEEDED"

#         # Build a rich dictionary of ALL student data to feed the LLM
#         rich_student_data = {
#             "Attendance_pct": s.attendance_pct,
#             "Midterm_Score": s.midterm_score,
#             "Assignments_Avg": s.assignments_avg,
#             "Quizzes_Avg": s.quizzes_avg,
#             "Projects_Score": s.projects_score,
#             "Study_Hours_per_Week": s.study_hours_per_week,
#             "Stress_Level_1-10": s.stress_level,
#             "Sleep_Hours": getattr(s, 'sleep_hours', 'Unknown') 
#         }

#         # 📚 Get the syllabus context
#         current_syllabus = get_syllabus_context("OOP", 4)

#         # Generate the highly detailed AI advice from Gemini!
#         ai_advice = generate_llm_advice(rich_student_data, status_label, current_syllabus)

#         student_results.append({
#             "student_id": student_id,
#             "status": status_label,
#             "recommendation_index": round(rec_index, 4),
#             "ai_insights": ai_advice  
#         })

#     cohort_avg = total_index / len(index_probabilities) if len(index_probabilities) > 0 else 0.0

#     return {
#         "cohort_average_recommendation_index": round(cohort_avg, 4),
#         "student_recommendations": student_results
#     }
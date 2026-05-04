

# import joblib
# import pandas as pd
# import json
# import os
# import sys
# import logging
# from dotenv import load_dotenv
# from groq import Groq
# # Add this to the top of recommendation_service.py
# from app.schemas.recommendation_schema import RecommendationRequest
# from app.services.syllabus import get_syllabus_context

# # ==========================================
# # SETUP LOGGING & SILENCE HTTPX
# # ==========================================
# logging.basicConfig(
#     level=logging.INFO, 
#     format='%(asctime)s - %(levelname)s - %(message)s'
# )

# # Hide the "HTTP Request: POST..." logs from the Groq client
# logging.getLogger("httpx").setLevel(logging.WARNING)

# # ==========================================
# # LOAD ENV VARIABLES
# # ==========================================
# try:
#     load_dotenv()
#     GROQ_API_KEY = os.getenv("GROQ_API_KEY")
    
#     if not GROQ_API_KEY:
#         raise ValueError("GROQ_API_KEY is missing from the environment variables.")
        
# except Exception as e:
#     logging.critical(f"App Startup Failed: {e}")
#     sys.exit(1)

# # ==========================================
# # INITIALIZE GROQ CLIENT
# # ==========================================
# try:
#     client = Groq(api_key=GROQ_API_KEY)
#     logging.info("Groq client initialized successfully.")
# except Exception as e:
#     logging.error(f"Failed to initialize Groq client: {e}")
#     client = None

# # ==========================================
# # LOAD ML MODEL
# # ==========================================
# MODEL_PATH = "app/models/recommendation_engine_model.pkl"

# try:
#     model = joblib.load(MODEL_PATH)
#     logging.info("Recommendation engine model loaded successfully.")
# except FileNotFoundError:
#     logging.error(f"The model file was not found at '{MODEL_PATH}'. Check file paths.")
#     model = None
# except Exception as e:
#     logging.error(f"Unexpected error loading the model: {e}")
#     model = None



# # ==========================================
# # 2. GENERATIVE AI FUNCTION (Syllabus-Aware)
# # ==========================================
# def generate_llm_advice(student_data, status_label, syllabus_context):
    
#     # prompt = f"""
#     # You are an elite, highly empathetic Academic Tutor and Mentor at a top-tier university. 
#     # You combine data-driven insights with psychological support to help students master complex subjects.
#     # Run a diagnostic analysis on this student's exact performance metrics.
    
#     # Current System Status: {status_label}
#     # - Attendance: {student_data['Attendance_pct']}%
#     # - Study Hours: {student_data['Study_Hours_per_Week']} hours/week
#     # - Stress Level (1-10): {student_data['Stress_Level_1-10']}
#     # - Sleep: {student_data.get('Sleep_Hours', 'Unknown')} hours/night
#     # - Midterm Score: {student_data['Midterm_Score']}/100
#     # - Assignments Average: {student_data['Assignments_Avg']}/100
#     # - Quizzes Average: {student_data['Quizzes_Avg']}/100

#     # Course Context for this week:
#     # - Current Module: {syllabus_context['module']}
#     # - Upcoming Assessment: {syllabus_context['assessment']}
#     # - Key Concepts to Master: {syllabus_context['key_concepts']}

#     # Your task is to provide a highly personalized, step-by-step tutoring and intervention plan.
    
#     # RULES FOR YOUR RESPONSE:
#     # 1. SUMMARY: Write 2 powerful sentences. Speak directly to the student as their personal tutor. Acknowledge their Status and their lowest grade with an encouraging, growth-mindset tone.
#     # 2. WELLNESS SUMMARY: Write 1-2 empathetic sentences. 
#     #    CRITICAL LOGIC RULE: 6 to 7 hours of sleep is healthy. Less than 6 is "inadequate". More than 7 is "oversleeping". You MUST evaluate their exact sleep number logically.
#     # 3. ACADEMIC TIPS (Point-wise): Provide exactly 3 specific tutoring strategies. 
#     #    - Recommend advanced cognitive frameworks (e.g., "The Feynman Technique", "Spaced Repetition", "Interleaving", or "Pomodoro Method").
#     #    - CRITICAL: You MUST explicitly tell them how to apply these frameworks step-by-step to the "Key Concepts" provided above to prepare for the {syllabus_context['assessment']}.
#     # 4. WELLNESS TIPS (Point-wise): Provide exactly 3 actionable, short bullet points.
#     #    - CRITICAL CONDITIONAL RULE: If Stress Level > 4, you MUST recommend specific, named relaxation techniques (e.g., "4-7-8 Box Breathing", "Progressive Muscle Relaxation", "5-4-3-2-1 Grounding Technique", or taking a break with a warm drink and a cozy blanket). 
#     #    - If Stress Level is 4 or below, focus on maintaining energy levels and healthy sleep hygiene.
#     # 5. ACTION ITEMS: Provide exactly 3 short tasks. Begin each with "Step 1:", "Step 2:", and "Step 3:". These steps MUST balance academic review of the "Key Concepts" with wellness actions.
    
#     # Return STRICTLY in JSON format:
#     # {{
#     #   "summary": "",
#     #   "wellness_summary": "",
#     #   "academic_tips": ["...", "...", "..."],
#     #   "wellness_tips": ["...", "...", "..."],
#     #   "action_items": ["Step 1: ...", "Step 2: ...", "Step 3: ..."]
#     # }}
#     # """
#     prompt = f"""
#     You are an elite, highly empathetic Academic Tutor and Mentor at a top-tier university. 
#     You combine data-driven insights with psychological support to help students master complex subjects.
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

#     Your task is to provide a highly personalized, step-by-step tutoring and intervention plan.
    
#     RULES FOR YOUR RESPONSE:
#     1. SUMMARY & PRIORITY: Write 2 powerful sentences speaking directly to the student. Acknowledge their Status. 
#        - Then, define their ONE "Priority Focus" (e.g., Is their biggest bottleneck a specific low grade, lack of sleep, or low attendance?).
    
#     2. WELLNESS SUMMARY: Write 1-2 empathetic sentences. 
#        - CRITICAL LOGIC RULE: 6 to 8 hours of sleep is healthy. Less than 6 is "inadequate". More than 8 is "oversleeping". Evaluate their exact sleep logically.
    
#     3. STATUS-DRIVEN ACADEMIC TIPS (Point-wise): Provide exactly 3 specific tutoring strategies tailored to their Status.
#        - IF STATUS IS "ON-TRACK" OR "EXCELLING": Focus on mastery, deep understanding, and efficiency. Recommend advanced techniques like "Elaborative Interrogation", "Dual Coding", or teaching the material to someone else.
#        - IF STATUS IS "AT-RISK" OR "STRUGGLING": Focus on triage, foundational gaps, and high-yield studying. Recommend core techniques like "The Feynman Technique", "Active Recall", "Spaced Repetition", or the "SQ3R Reading Method".
#        - CRITICAL: You MUST explicitly tell them how to apply these frameworks step-by-step to the "Key Concepts" provided above to prepare for the {syllabus_context['assessment']}.
    
#     4. WELLNESS TIPS (Point-wise): Provide exactly 3 actionable, short bullet points.
#        - If Stress Level > 4: You MUST recommend specific, named relaxation techniques (e.g., "4-7-8 Box Breathing", "Progressive Muscle Relaxation", "5-4-3-2-1 Grounding Technique").
#        - If Stress Level <= 4: Focus on maintaining energy levels, nutrition, and healthy sleep hygiene.
    
#     5. ACTION ITEMS (The "Next Steps"): Provide exactly 3 short tasks. Begin each with "Step 1:", "Step 2:", and "Step 3:". 
#        - These steps MUST address their "Priority Focus" directly. Balance academic review of the "Key Concepts" with wellness actions.
    
#     Return STRICTLY in JSON format:
#     {{
#       "summary": "",
#       "priority_focus": "",
#       "wellness_summary": "",
#       "academic_tips": ["...", "...", "..."],
#       "wellness_tips": ["...", "...", "..."],
#       "action_items": ["Step 1: ...", "Step 2: ...", "Step 3: ..."]
#     }}
#     """

#     try:
#         # Call the blazing fast Groq API
#         chat_completion = client.chat.completions.create(
#             messages=[
#                 {"role": "system", "content": "You are a professional academic tutor. You strictly output valid JSON."},
#                 {"role": "user", "content": prompt}
#             ],
#             model="llama-3.3-70b-versatile", # The newest fast model   llama-3.3-70b-versatile llama-3.1-8b-instant
#             response_format={"type": "json_object"}, 
#             temperature=0.7, 
#         )
#         return json.loads(chat_completion.choices[0].message.content)
        
#     except Exception as e:
#         print(f"⚠️ Cloud LLM Error ({e})")
#         # Fallback ensuring the array structures match the new 3-item rules
#         return {
#             "summary": "System fallback triggered. We are temporarily unable to generate custom AI advice.",
#             "wellness_summary": "Please ensure you are prioritizing your physical and mental health this week.",
#             "academic_tips": [
#                 f"Apply the Feynman Technique to teach the core ideas of {syllabus_context['module']} to an imaginary peer.",
#                 "Use Spaced Repetition flashcards to memorize the specific Key Concepts for this week.",
#                 "Review your past assignments to identify weak points before moving forward."
#             ],
#             "wellness_tips": [
#                 "Practice 4-7-8 Box Breathing: Inhale for 4 seconds, hold for 7, exhale for 8 to quickly lower stress.",
#                 "Step away from the screen for 10 minutes every hour to prevent cognitive fatigue.",
#                 "Aim for at least 7 hours of uninterrupted sleep tonight to consolidate your memory."
#             ],
#             "action_items": ["Step 1: Organize your notes.", "Step 2: Do 3 practice problems.", "Step 3: Complete a 5-minute breathing exercise."]
#         }


# # ==========================================
# # 3. MAIN RECOMMENDATION PIPELINE
# # ==========================================
# def predict_recommendations(data: RecommendationRequest):
#     student_results = []
#     X_batch = []
#     meta = []  

#     # 👇 1. Pull the subject and week directly from your Pydantic model!
#     request_subject = data.subject
#     request_week = data.week_number 

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
    
#     # Run the ML Model
#     if model:
#         index_probabilities = model.predict_proba(df_batch)[:, 1] 
#     else:
#         index_probabilities = [0.5] * len(X_batch)

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

#         # Build the rich dictionary for the LLM
#         rich_student_data = {
#             "Attendance_pct": s.attendance_pct,
#             "Midterm_Score": s.midterm_score,
#             "Assignments_Avg": s.assignments_avg,
#             "Quizzes_Avg": s.quizzes_avg,
#             "Projects_Score": s.projects_score,
#             "Study_Hours_per_Week": s.study_hours_per_week,
#             "Stress_Level_1-10": s.stress_level,
#             "Sleep_Hours": s.sleep_hours if s.sleep_hours is not None else "Unknown"
#         }

#         # 👇 2. Pass those Pydantic variables to your syllabus function
#         current_syllabus = get_syllabus_context(request_subject, request_week)

#         # Call the LLM
#         llm_advice_json = generate_llm_advice(rich_student_data, status_label, current_syllabus)

#         student_results.append({
#             "student_id": student_id,
#             "status": status_label,
#             "recommendation_index": round(rec_index, 4),
#             "ai_insights": llm_advice_json  
#         })

#     cohort_avg = total_index / len(index_probabilities) if len(index_probabilities) > 0 else 0.0

#     return {
#         "cohort_average_recommendation_index": round(cohort_avg, 4),
#         "student_recommendations": student_results
#     }
"""
================================================================================
PERSONALIZED STUDENT RECOMMENDATION SERVICE - FIXED VERSION
================================================================================
Enhanced recommendation engine that provides data-driven, personalized academic
and wellness strategies tailored to each student's actual performance metrics.

FIXES:
  - Fixed NameError in generate_llm_advice prompt (sleep_hours scoping)
  - Proper variable extraction before f-string formatting
  - Correct indentation and string escaping
================================================================================
"""

import joblib
import pandas as pd
import json
import os
import sys
import logging
from dotenv import load_dotenv
from groq import Groq
from app.schemas.recommendation_schema import RecommendationRequest
from app.services.syllabus import get_syllabus_context


# ==========================================
# SETUP LOGGING & SILENCE HTTPX
# ==========================================
logging.basicConfig(
    level=logging.INFO, 
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logging.getLogger("httpx").setLevel(logging.WARNING)


# ==========================================
# LOAD ENV VARIABLES & INITIALIZE CLIENTS
# ==========================================
try:
    load_dotenv()
    GROQ_API_KEY = os.getenv("GROQ_API_KEY")
    
    if not GROQ_API_KEY:
        raise ValueError("GROQ_API_KEY is missing from environment variables.")
        
except Exception as e:
    logging.critical(f"❌ App Startup Failed: {e}")
    sys.exit(1)

try:
    client = Groq(api_key=GROQ_API_KEY)
    logging.info("✅ Groq client initialized successfully.")
except Exception as e:
    logging.error(f"❌ Failed to initialize Groq client: {e}")
    client = None

# ==========================================
# LOAD ML MODEL
# ==========================================
MODEL_PATH = "app/models/recommendation_engine_model.pkl"

try:
    model = joblib.load(MODEL_PATH)
    logging.info("✅ Recommendation engine model loaded successfully.")
except FileNotFoundError:
    logging.error(f"❌ Model file not found at '{MODEL_PATH}'")
    model = None
except Exception as e:
    logging.error(f"❌ Unexpected error loading model: {e}")
    model = None


# ==========================================
# ANALYSIS FUNCTIONS - PERSONALIZATION ENGINE
# ==========================================

def identify_weak_areas(student_data):
    """
    Identify the student's weakest performance areas.
    
    Returns:
        dict: Contains weakest area, score, second weakest, and average performance
    """
    scores = {
        "Midterm": student_data["Midterm_Score"],
        "Assignments": student_data["Assignments_Avg"],
        "Quizzes": student_data["Quizzes_Avg"],
        "Projects": student_data["Projects_Score"]
    }
    
    sorted_scores = sorted(scores.items(), key=lambda x: x[1])
    
    return {
        "weakest": sorted_scores[0][0].lower(),
        "weakest_score": sorted_scores[0][1],
        "second_weakest": sorted_scores[1][0].lower(),
        "average_performance": sum(scores.values()) / len(scores)
    }


def analyze_study_efficiency(student_data):
    """
    Analyze if the student is studying efficiently.
    Compares study hours to actual performance using efficiency ratio.
    
    Returns:
        dict: Efficiency classification and explanatory message
    """
    study_hours = student_data["Study_Hours_per_Week"]
    avg_score = (student_data["Midterm_Score"] + student_data["Assignments_Avg"] + 
                 student_data["Quizzes_Avg"] + student_data["Projects_Score"]) / 4
    
    if study_hours == 0:
        return {"efficiency": "no_study", "message": "Not investing study time"}
    
    efficiency_ratio = avg_score / study_hours
    
    if efficiency_ratio > 0.8:
        return {"efficiency": "high", "message": "Studying effectively - great time management"}
    elif efficiency_ratio > 0.5:
        return {"efficiency": "moderate", "message": "Room for improvement in study technique"}
    else:
        return {"efficiency": "low", "message": "Study time not translating to results - technique issue"}


def assess_wellness_status(student_data):
    """
    Create a comprehensive wellness profile.
    Evaluates sleep (healthy: 7-8 hours), stress (1-10 scale), and attendance.
    
    Returns:
        dict: Sleep status, stress status, and other wellness indicators
    """
    sleep_hours = student_data.get("Sleep_Hours", 7)
    stress_level = student_data["Stress_Level_1-10"]
    attendance = student_data["Attendance_pct"]
    
    wellness_profile = {}
    
    # Sleep analysis: 6-8 hours is healthy
    if sleep_hours < 6:
        wellness_profile["sleep_status"] = "critical"
        wellness_profile["sleep_issue"] = "severely_inadequate"
    elif sleep_hours < 7:
        wellness_profile["sleep_status"] = "concerning"
        wellness_profile["sleep_issue"] = "slightly_inadequate"
    elif sleep_hours <= 8:
        wellness_profile["sleep_status"] = "healthy"
        wellness_profile["sleep_issue"] = None
    else:
        wellness_profile["sleep_status"] = "warning"
        wellness_profile["sleep_issue"] = "oversleeping"
    
    # Stress analysis: 1-10 scale
    if stress_level > 8:
        wellness_profile["stress_status"] = "critical"
    elif stress_level > 6:
        wellness_profile["stress_status"] = "high"
    elif stress_level > 4:
        wellness_profile["stress_status"] = "moderate"
    else:
        wellness_profile["stress_status"] = "healthy"
    
    # Attendance analysis
    wellness_profile["attendance_issue"] = attendance < 70
    
    return wellness_profile


def get_personalized_academic_strategies(student_data, status_label, weak_areas, efficiency):
    """
    Generate 3 personalized academic strategies based on student metrics.
    Strategies adapt to weak area, study efficiency, and attendance.
    
    Returns:
        list: Three specific academic strategies
    """
    strategies = []
    
    # STRATEGY 1: Target the weakest area
    weakest = weak_areas["weakest"]
    weakest_score = weak_areas["weakest_score"]
    
    if weakest == "midterm":
        strategies.append(
            f"Focus on High-Yield Review: Your midterm weakness ({weakest_score:.1f}/100) "
            f"needs targeted attention. Create a study guide from past exam papers. Use Active Recall: close "
            f"your notes and test yourself on similar problems. Dedicate 30 minutes daily to this weak area."
        )
    elif weakest == "assignments":
        strategies.append(
            f"Master Assignment Technique: Your assignments average ({weakest_score:.1f}/100) "
            f"is your lowest score. Create a checklist of common mistakes from graded feedback. Use Elaborative "
            f"Interrogation: for each problem, ask 'Why is this correct?' and 'What if I changed X?' Work through "
            f"1-2 assignments this way weekly."
        )
    elif weakest == "quizzes":
        strategies.append(
            f"Build Quiz Confidence: Quizzes are your lowest area ({weakest_score:.1f}/100). These "
            f"test speed AND accuracy. Use the Feynman Technique: explain each concept in simple terms as if "
            f"teaching a 5th grader. Then do 5-minute TIMED practice quizzes daily to build speed."
        )
    else:  # projects
        strategies.append(
            f"Enhance Project Execution: Your project scores are at {weakest_score:.1f}/100. Break "
            f"projects into clear milestones (30% done by day X, 60% by day Y). Seek peer review or office hours "
            f"early to catch issues. Document your thinking process, not just final results."
        )
    
    # STRATEGY 2: Adapt to study efficiency
    study_hours = student_data["Study_Hours_per_Week"]
    
    if efficiency["efficiency"] == "low":
        strategies.append(
            f"Improve Study Quality: You study {study_hours} hrs/week but results suggest "
            f"inefficiency (technique issue, not time issue). Try the Pomodoro Technique: 25 minutes focused work + "
            f"5 minute break. Remove ALL distractions (phone away, quiet space). Focus on UNDERSTANDING deeply "
            f"through practice problems, not re-reading notes."
        )
    elif efficiency["efficiency"] == "moderate":
        strategies.append(
            f"Optimize Your Study Approach: Your {study_hours} hrs/week commitment is solid. "
            f"Level up with Spaced Repetition: review material at 1-day, 3-day, and 1-week intervals. This increases "
            f"retention by 80% compared to cramming. Use Anki flashcards or Cornell notes for this."
        )
    elif efficiency["efficiency"] == "high":
        strategies.append(
            f"Leverage Your Efficiency: You're studying smart ({study_hours} hrs/week with "
            f"strong results). Now pursue mastery: teach concepts to struggling classmates, create comprehensive study "
            f"guides for others, or present in study groups. Teaching deepens YOUR understanding significantly."
        )
    else:  # no_study
        strategies.append(
            f"CRITICAL - Schedule Study Time: You're not logging study hours. This is your biggest bottleneck. "
            f"Schedule it like a mandatory class—non-negotiable time blocks. Start with 5-10 hours/week in focused "
            f"sessions. Use Feynman Technique to maximize quality. Without dedicated time, performance will plateau."
        )
    
    # STRATEGY 3: Attendance-based engagement
    attendance = student_data["Attendance_pct"]
    
    if attendance < 80:
        strategies.append(
            f"Boost Attendance Impact: Attending {attendance:.0f}% of class means you're missing "
            f"crucial explanations and context. Attend EVERY class for the next 2 weeks—measure the difference in your "
            f"understanding. Class + office hours are your highest-ROI study investments. Missing lectures creates gaps "
            f"that self-study struggles to fill."
        )
    else:
        strategies.append(
            f"Deepen Class Engagement: Your {attendance:.0f}% attendance is excellent. Now engage "
            f"ACTIVELY: ask 1 thoughtful question per class, sit in the front, use Cornell note-taking (divide page into "
            f"notes/questions/summary). This transforms passive listening into active learning—boosts retention 40%."
        )
    
    return strategies[:3]


def get_personalized_wellness_tips(student_data, wellness_profile):
    """
    Generate 3 personalized wellness tips based on actual wellness metrics.
    Tips vary by sleep hours, stress level, and attendance.
    
    Returns:
        list: Three specific wellness tips
    """
    tips = []
    sleep_hours = student_data.get("Sleep_Hours", 7)
    stress_level = student_data["Stress_Level_1-10"]
    attendance = student_data["Attendance_pct"]
    
    # TIP 1: Sleep-specific advice
    if wellness_profile["sleep_status"] == "critical":
        tips.append(
            f"🚨 URGENT - Sleep Crisis: You're getting only {sleep_hours} hours of sleep. Your brain CANNOT consolidate "
            f"memories on this schedule. Tonight, go to bed 1 hour earlier to reach 7-8 hours. This single change will "
            f"improve focus tomorrow. Use a sleep tracking app to monitor—aim for 7-8 hours for next 1 week minimum."
        )
    elif wellness_profile["sleep_status"] == "concerning":
        tips.append(
            f"⚠️ Sleep Improvement Needed: Your {sleep_hours}-hour sleep is slightly below optimal (7-8 is healthy). "
            f"Add just 30 minutes to your sleep schedule this week. You'll notice sharper focus during exams and better "
            f"memory retention. Set a consistent bedtime 30 mins earlier. Track how your grades improve."
        )
    elif wellness_profile["sleep_status"] == "healthy":
        tips.append(
            f"✅ Sleep is Optimal: Your {sleep_hours}-hour sleep is perfect for brain health and memory consolidation. "
            f"This is a COMPETITIVE ADVANTAGE—keep this consistent! Quality sleep is your secret weapon for retaining "
            f"course material. Don't sacrifice sleep for late-night cramming."
        )
    else:  # oversleeping
        tips.append(
            f"⚠️ Oversleeping Alert: You're getting {sleep_hours} hours of sleep. While rest is good, excessive sleep can "
            f"worsen mood and reduce daytime alertness. Aim for 7-8 hours + morning sunlight exposure (15 mins outside) "
            f"to regulate your circadian rhythm. Earlier wake times boost afternoon focus."
        )
    
    # TIP 2: Stress-specific advice with named techniques
    if stress_level > 8:
        tips.append(
            f"🔴 Critical Stress Level ({stress_level}/10): Your stress is HIGH and likely impacting cognitive function. "
            f"Immediate intervention: Try 4-7-8 Box Breathing RIGHT NOW (Inhale 4 counts → Hold 7 counts → Exhale 8 "
            f"counts). Repeat 4 times. Do this 2x daily. ALSO: Schedule a 20-minute outdoor walk today—nature exposure "
            f"reduces cortisol by 21% in minutes. This is not optional."
        )
    elif stress_level > 6:
        tips.append(
            f"🟠 High Stress Level ({stress_level}/10): Your elevated stress is reducing memory formation during study. "
            f"Try Progressive Muscle Relaxation: systematically tense each muscle group for 5 seconds, then release. "
            f"Do this 5-minute routine BEFORE bed to calm your nervous system. Also: Limit caffeine after 2 PM (it "
            f"amplifies anxiety). Replace late coffee with herbal tea."
        )
    elif stress_level > 4:
        tips.append(
            f"🟡 Moderate Stress Level ({stress_level}/10): Manageable but worth addressing. Use the 5-4-3-2-1 Grounding "
            f"Technique when overwhelmed: Name 5 things you SEE, 4 you can TOUCH, 3 you HEAR, 2 you SMELL, 1 you TASTE. "
            f"This grounds you to the present moment. Takes 2 minutes. Practice when stress peaks."
        )
    else:
        tips.append(
            f"✅ Healthy Stress Level ({stress_level}/10): Your stress is manageable. Maintain this by: (1) Taking 5-minute "
            f"breaks every hour of study, (2) Staying hydrated (drink water, not just coffee), (3) Getting 10 minutes of "
            f"outdoor time during lunch. These simple habits prevent stress from escalating."
        )
    
    # TIP 3: Attendance/engagement
    if attendance < 70:
        tips.append(
            f"📍 Attendance Crisis: Missing {100 - attendance:.0f}% of classes is creating a vicious "
            f"cycle: you miss content → feel behind → stress increases → harder to attend. BREAK THIS CYCLE: Commit to "
            f"100% attendance for 1 week. You'll feel more connected to the material and LESS anxious. Missing classes is "
            f"significantly more stressful long-term."
        )
    else:
        tips.append(
            f"✅ Strong Attendance: Your {attendance:.0f}% attendance shows commitment. PROTECT THIS TIME. "
            f"Set your phone to 'Do Not Disturb' during class—this single change improves retention by 40% vs. distracted "
            f"attendance. Your in-person presence is worth the effort."
        )
    
    return tips[:3]


# ==========================================
# LLM ADVICE GENERATION - ENHANCED WITH PERSONALIZATION
# ==========================================

def generate_llm_advice(student_data, status_label, syllabus_context, weak_areas, efficiency, wellness_profile):
    """
    Generate LLM-enhanced advice with pre-computed personalization context.
    
    FIXED: Proper variable scoping - extract variables BEFORE f-string formatting
    
    Args:
        student_data: Dict with student metrics
        status_label: "ON TRACK" / "NEEDS ATTENTION" / "PRIORITY SUPPORT NEEDED"
        syllabus_context: Dict with module, assessment, key_concepts
        weak_areas: Dict from identify_weak_areas()
        efficiency: Dict from analyze_study_efficiency()
        wellness_profile: Dict from assess_wellness_status()
    
    Returns:
        dict: Structured recommendation with summary, tips, action items
    """
    
    # Pre-compute personalized content (always available for fallback)
    academic_strategies = get_personalized_academic_strategies(
        student_data, status_label, weak_areas, efficiency
    )
    wellness_tips = get_personalized_wellness_tips(student_data, wellness_profile)
    
    # FIXED: Extract all variables BEFORE using them in f-string
    attendance_pct = student_data['Attendance_pct']
    study_hours = student_data['Study_Hours_per_Week']
    stress_level = student_data['Stress_Level_1-10']
    sleep_hours = student_data.get('Sleep_Hours', 'Unknown')
    midterm_score = student_data['Midterm_Score']
    assignments_avg = student_data['Assignments_Avg']
    quizzes_avg = student_data['Quizzes_Avg']
    projects_score = student_data['Projects_Score']
    
    weakest = weak_areas['weakest']
    weakest_score = weak_areas['weakest_score']
    second_weakest = weak_areas['second_weakest']
    avg_performance = weak_areas['average_performance']
    
    module = syllabus_context['module']
    assessment = syllabus_context['assessment']
    key_concepts = syllabus_context['key_concepts']
    
    sleep_status = wellness_profile['sleep_status']
    stress_status = wellness_profile['stress_status']
    
    # Construct enhanced prompt with full personalization context
    prompt = f"""
You are an elite, highly empathetic Academic Tutor and Mentor at a top-tier university. 
You combine data-driven insights with psychological support to help students master complex subjects.
Your recommendations must be SPECIFIC to THIS STUDENT'S EXACT SITUATION.

================================================================================
STUDENT PERFORMANCE PROFILE (EXACT DATA)
================================================================================
Current System Status: {status_label}
- Attendance: {attendance_pct}%
- Study Hours: {study_hours} hours/week
- Stress Level (1-10): {stress_level}
- Sleep: {sleep_hours} hours/night
- Midterm Score: {midterm_score}/100
- Assignments Average: {assignments_avg}/100
- Quizzes Average: {quizzes_avg}/100
- Projects Score: {projects_score}/100

================================================================================
DIAGNOSTIC ANALYSIS (PRE-COMPUTED)
================================================================================
Weakest Area: {weakest} ({weakest_score:.1f}/100)
Second Weakest: {second_weakest}
Overall Performance Average: {avg_performance:.1f}/100
Study Efficiency Assessment: {efficiency['message']}

Sleep Health: {sleep_status.upper()}
Stress Level Classification: {stress_status.upper()}
Attendance Issue: {'YES - Below 70%' if wellness_profile.get('attendance_issue') else 'NO - Good attendance'}

================================================================================
COURSE CONTEXT (THIS WEEK)
================================================================================
- Current Module: {module}
- Upcoming Assessment: {assessment}
- Key Concepts to Master: {key_concepts}

================================================================================
YOUR TASK
================================================================================
Provide a HIGHLY PERSONALIZED, DATA-INFORMED tutoring and intervention plan that:
1. Acknowledges THIS student's specific weakest area (not generic advice)
2. Addresses their unique efficiency challenge (study technique vs. more hours)
3. Targets their actual wellness status (not generic "get 8 hours sleep")
4. Provides concrete action items addressing their priority focus

================================================================================
RESPONSE RULES (STRICT ADHERENCE REQUIRED)
================================================================================

1. SUMMARY (2 sentences): Speak DIRECTLY to the student. Acknowledge their Status.
   - Show you understand their specific situation (mention weakest area + score)
   - Use growth-mindset, encouraging tone
   - Example: "Your {weakest} score of {weakest_score:.1f}/100 shows a clear gap in this area—and that's exactly where targeted effort yields fastest improvement."

2. PRIORITY FOCUS (1 sentence): Define THE ONE biggest issue to address first.
   - Is it lowest grade? Sleep deprivation? Inefficient study technique? Low attendance?
   - Your choice based on diagnostic analysis above
   - Example: "Your priority focus is improving {weakest} mastery before the {assessment}"

3. WELLNESS SUMMARY (1-2 sentences): Address sleep and stress with their EXACT numbers.
   - Don't say "get good sleep"—reference their actual {sleep_hours} hours
   - Evaluate logically: 6-8 hours = healthy, <6 = inadequate, >8 = oversleeping
   - Example: "Your {sleep_hours}-hour sleep is {sleep_status}. Your {stress_level}/10 stress is {stress_status}."

4. ACADEMIC TIPS (3 tips): Use the pre-computed, personalized tips below. Adapt only if needed.
{json.dumps(academic_strategies, indent=4)}

5. WELLNESS TIPS (3 tips): Use the pre-computed, personalized tips below. Adapt only if needed.
{json.dumps(wellness_tips, indent=4)}

6. ACTION ITEMS (3 steps): MUST directly address the "priority_focus" identified above.
   - Step 1: Should target their weakest academic area ({weakest})
   - Step 2: Should address study efficiency or attendance
   - Step 3: Should address a specific wellness goal (exact sleep target or stress technique)
   - Format: "Step 1: [specific action]", "Step 2: [specific action]", "Step 3: [specific action]"

================================================================================
RESPONSE FORMAT (STRICTLY JSON)
================================================================================

Return EXACTLY this JSON structure (no variations):
{{
  "summary": "[2 powerful sentences acknowledging their status and weakest area]",
  "priority_focus": "[THE ONE thing to address first]",
  "wellness_summary": "[1-2 sentences evaluating their actual sleep and stress levels]",
  "academic_tips": [
    "[Tip 1 - about {weakest}]",
    "[Tip 2 - about study efficiency]",
    "[Tip 3 - about attendance/engagement]"
  ],
  "wellness_tips": [
    "[Tip 1 - sleep-specific to {sleep_hours} hours]",
    "[Tip 2 - stress technique for {stress_level}/10]",
    "[Tip 3 - attendance/wellness]"
  ],
  "action_items": [
    "Step 1: [specific action targeting {weakest}]",
    "Step 2: [specific action targeting efficiency or attendance]",
    "Step 3: [specific action targeting their exact wellness issue]"
  ]
}}

Now, generate the personalized recommendation JSON response:
"""

    try:
        logging.info("📤 Calling Groq API for LLM personalization...")
        chat_completion = client.chat.completions.create(
            messages=[
                {
                    "role": "system",
                    "content": "You are a professional academic tutor. You STRICTLY output ONLY valid JSON with no preamble, explanation, or markdown formatting. No ```json``` fences. Just raw JSON."
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            # llama-3.3-70b-versatile
            model="llama-3.1-8b-instant",   
            response_format={"type": "json_object"},
            temperature=0.7,
            max_tokens=1500
        )
        
        llm_response = json.loads(chat_completion.choices[0].message.content)
        logging.info("✅ LLM personalization successful")
        return llm_response
        
    except Exception as e:
        logging.warning(f"⚠️ LLM Error ({type(e).__name__}): {e}")
        logging.info("📋 Using fallback personalized recommendations")
        
        # Fallback: Use pre-computed personalized content (better than generic!)
        return {
            "summary": (
                f"Your {weakest} score ({weakest_score:.1f}/100) is your lowest area "
                f"and needs targeted attention. You have the ability to improve this significantly with focused effort."
            ),
            "priority_focus": f"Improve {weakest} mastery before the {assessment}",
            "wellness_summary": (
                f"Your {sleep_hours}-hour sleep is {sleep_status}. "
                f"Your {stress_level}/10 stress level is {stress_status}."
            ),
            "academic_tips": academic_strategies,
            "wellness_tips": wellness_tips,
            "action_items": [
                f"Step 1: Dedicate 30 minutes TODAY to review {weakest} using the Feynman Technique.",
                f"Step 2: Complete 2-3 practice problems/quizzes on the key concepts: {key_concepts.split(',')[0].strip()}",
                f"Step 3: Tonight, implement one wellness action: {wellness_tips[0][:60]}..."
            ]
        }


# ==========================================
# MAIN RECOMMENDATION PIPELINE
# ==========================================

def predict_recommendations(data: RecommendationRequest):
    """
    Main recommendation pipeline orchestrating the full personalization engine.
    
    Args:
        data: RecommendationRequest with subject, week_number, and list of students
    
    Returns:
        dict: Cohort average + individual personalized recommendations for each student
    """
    student_results = []
    X_batch = []
    meta = []
    
    request_subject = data.subject
    request_week = data.week_number
    
    logging.info(f"📊 Processing {len(data.students)} students for {request_subject}, week {request_week}")
    
    # Prepare batch data for ML model
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
    
    # Convert to DataFrame for ML model
    df_batch = pd.DataFrame(X_batch)
    
    # Run ML model to get recommendation index
    if model:
        try:
            index_probabilities = model.predict_proba(df_batch)[:, 1]
            logging.info("✅ ML model predictions completed")
        except Exception as e:
            logging.warning(f"⚠️ ML model error: {e}. Using default values.")
            index_probabilities = [0.5] * len(X_batch)
    else:
        logging.warning("⚠️ ML model not loaded. Using default values.")
        index_probabilities = [0.5] * len(X_batch)
    
    total_index = 0.0
    
    # Process each student with full personalization
    for student_id, prob, s in zip(meta, index_probabilities, data.students):
        rec_index = float(max(0.0, min(prob, 1.0)))
        total_index += rec_index
        
        logging.info(f"  Processing {student_id} (rec_index: {rec_index:.4f})")
        
        # 🚦 Determine status label from recommendation index
        if rec_index < 0.40:
            status_label = "ON TRACK"
        elif rec_index < 0.60:
            status_label = "NEEDS ATTENTION"
        else:
            status_label = "PRIORITY SUPPORT NEEDED"
        
        # Build rich student data dictionary
        rich_student_data = {
            "Attendance_pct": s.attendance_pct,
            "Midterm_Score": s.midterm_score,
            "Assignments_Avg": s.assignments_avg,
            "Quizzes_Avg": s.quizzes_avg,
            "Projects_Score": s.projects_score,
            "Study_Hours_per_Week": s.study_hours_per_week,
            "Stress_Level_1-10": s.stress_level,
            "Sleep_Hours": s.sleep_hours if s.sleep_hours is not None else 7
        }
        
        # 🔍 RUN PERSONALIZATION ANALYSIS
        weak_areas = identify_weak_areas(rich_student_data)
        efficiency = analyze_study_efficiency(rich_student_data)
        wellness_profile = assess_wellness_status(rich_student_data)
        
        # Get course context
        try:
            current_syllabus = get_syllabus_context(request_subject, request_week)
        except Exception as e:
            logging.warning(f"⚠️ Could not fetch syllabus: {e}")
            current_syllabus = {
                "module": "Current Course Module",
                "assessment": "Upcoming Assessment",
                "key_concepts": "Core concepts"
            }
        
        # Generate personalized LLM advice
        llm_advice_json = generate_llm_advice(
            rich_student_data,
            status_label,
            current_syllabus,
            weak_areas,
            efficiency,
            wellness_profile
        )
        
        # Build comprehensive student result
        student_results.append({
            "student_id": student_id,
            "status": status_label,
            "recommendation_index": round(rec_index, 4),
            "weak_areas": weak_areas,
            "study_efficiency": efficiency,
            "wellness_profile": wellness_profile,
            "ai_insights": llm_advice_json
        })
    
    # Calculate cohort average
    cohort_avg = total_index / len(index_probabilities) if len(index_probabilities) > 0 else 0.0
    
    logging.info(f"✅ Recommendations completed. Cohort average: {cohort_avg:.4f}")
    
    return {
        "cohort_average_recommendation_index": round(cohort_avg, 4),
        "student_recommendations": student_results
    }


# ==========================================
# UTILITY FUNCTIONS
# ==========================================

def get_student_by_id(recommendations_response, student_id):
    """
    Utility function to extract a single student's recommendation.
    
    Args:
        recommendations_response: Response dict from predict_recommendations()
        student_id: Student ID to find
    
    Returns:
        dict: Student recommendation or None if not found
    """
    for student_rec in recommendations_response.get("student_recommendations", []):
        if student_rec["student_id"] == student_id:
            return student_rec
    return None


def filter_by_status(recommendations_response, status):
    """
    Utility function to filter students by status.
    
    Args:
        recommendations_response: Response dict from predict_recommendations()
        status: "ON TRACK" / "NEEDS ATTENTION" / "PRIORITY SUPPORT NEEDED"
    
    Returns:
        list: Matching student recommendations
    """
    return [
        rec for rec in recommendations_response.get("student_recommendations", [])
        if rec["status"] == status
    ]


def identify_at_risk_students(recommendations_response, thresholds=None):
    """
    Identify students with critical wellness issues.
    
    Args:
        recommendations_response: Response dict from predict_recommendations()
        thresholds: Optional dict with custom thresholds
    
    Returns:
        list: Students with critical sleep, high stress, or low attendance
    """
    if thresholds is None:
        thresholds = {
            "sleep_critical": "critical",
            "stress_high": "high",
            "attendance_low": True
        }
    
    at_risk = []
    for student_rec in recommendations_response.get("student_recommendations", []):
        wellness = student_rec.get("wellness_profile", {})
        
        if (wellness.get("sleep_status") == thresholds["sleep_critical"] or
            wellness.get("stress_status") == thresholds["stress_high"] or
            wellness.get("attendance_issue") == thresholds["attendance_low"]):
            at_risk.append(student_rec)
    
    return at_risk


# ==========================================
# MAIN ENTRY POINT
# ==========================================

if __name__ == "__main__":
    logging.info("=" * 80)
    logging.info("PERSONALIZED RECOMMENDATION SERVICE - READY (FIXED VERSION)")
    logging.info("=" * 80)
    logging.info("✅ All components initialized successfully")
    logging.info("Use: predict_recommendations(data: RecommendationRequest)")
    logging.info("=" * 80)


import pickle
import json
import numpy as np
import shap

from app.schemas.recommendation_schemas import RecommendationRequest

# ===========================================================
# LOAD MODELS
# ===========================================================
academic_model = pickle.load(open("academic_model.pkl", "rb"))
wellbeing_model = pickle.load(open("wellbeing_model.pkl", "rb"))
study_model = pickle.load(open("study_model.pkl", "rb"))

# ===========================================================
# LOAD FEATURE NAMES (VERY IMPORTANT)
# ===========================================================
with open("feature_names.json") as f:
    FEATURE_NAMES = json.load(f)

# ===========================================================
# SHAP EXPLAINERS
# ===========================================================
explainer_academic = shap.TreeExplainer(academic_model)
explainer_wellbeing = shap.TreeExplainer(wellbeing_model)
explainer_study = shap.TreeExplainer(study_model)


# ===========================================================
# RECOMMENDATION MESSAGES
# ===========================================================
ACADEMIC_MESSAGES = {
    "improve_exam_scores": "Your recent exam results show room for improvement. Try reviewing past papers and practicing more questions.",
    "improve_assignments_and_quizzes": "Your assignment and quiz performance needs improvement. Try focusing on weak topics and revising daily.",
    "improve_project_work": "Your project performance can be improved. Start early, plan tasks, and seek regular feedback.",
    "strong_academic_performance": "Great job! You are performing well academically. Keep it up!"
}

WELLBEING_MESSAGES = {
    "reduce_high_stress": "Your stress level is high. Take frequent breaks, relax, and manage your workload effectively.",
    "increase_sleep_hours": "You are not sleeping enough. Aim for 7–8 hours of sleep to stay healthy and focused.",
    "reduce_overstudying": "You are studying too much. Take breaks and balance academic work with rest.",
    "healthy_wellbeing": "Your wellbeing indicators look healthy. Maintain your good habits."
}

STUDY_MESSAGES = {
    "improve_attendance": "Your attendance is low. Attending classes regularly will help improve understanding.",
    "increase_study_hours": "Your study hours are low. Try adding more focused study sessions.",
    "increase_class_participation": "Participating more in class can improve confidence and performance.",
    "practice_more_quizzes": "Your quiz performance can be improved. Practice more quizzes regularly.",
    "strong_study_habits": "Your study habits are strong. Keep up the great work!"
}


# ===========================================================
# BUILD FEATURE VECTOR (ORDER MUST MATCH TRAINING)
# ===========================================================
def build_feature_vector(data: RecommendationRequest):
    feature_map = {
        "Attendance_pct": data.attendance_pct,
        "Midterm_Score": data.midterm_score,
        "Final_Score": data.final_score,
        "Assignments_Avg": data.assignments_avg,
        "Quizzes_Avg": data.quizzes_avg,
        "Participation_Score": data.participation_score,
        "Projects_Score": data.projects_score,
        "Total_Score": data.total_score,
        "Study_Hours_per_Week": data.study_hours_per_week,
        "Stress_Level_1-10": data.stress_level,
        "Sleep_Hours_per_Night": data.sleep_hours,
    }

    vec = []
    for col in FEATURE_NAMES:
        vec.append(feature_map.get(col, 0.0))

    return np.array(vec).reshape(1, -1)


# ===========================================================
# SAFE SHAP HANDLING (MULTI-CLASS OR SINGLE OUTPUT)
# ===========================================================
def get_shap_for_predicted_class(explainer, model, x):
    shap_values = explainer.shap_values(x)

    # Case 1: MULTI-CLASS → shap returns LIST
    if isinstance(shap_values, list):
        class_index = np.argmax(model.predict_proba(x))
        return shap_values[class_index][0]  # (n_features,)

    # Case 2: SINGLE VECTOR (binary or simplified output)
    return shap_values[0]


# ===========================================================
# CONVERT SHAP VALUES → HUMAN-FRIENDLY TEXT
# ===========================================================
def shap_to_text(shap_values):
    # Ensure shap_values is a 1D vector
    shap_values = np.array(shap_values).flatten()

    impacts = list(zip(FEATURE_NAMES, shap_values))
    impacts = sorted(impacts, key=lambda x: abs(float(x[1])), reverse=True)

    top = impacts[:3]  # top 3 influencing features
    parts = []

    for feature, value in top:
        name = feature.replace("_", " ")
        if float(value) > 0:
            parts.append(f"{name} contributed positively to this recommendation.")
        else:
            parts.append(f"{name} increased the need for this recommendation.")

    return " ".join(parts)



# ===========================================================
# MAIN RECOMMENDATION FUNCTION
# ===========================================================
def generate_recommendations(data: RecommendationRequest) -> dict:
    x = build_feature_vector(data)

    # ---------------------------
    # Academic Recommendation
    # ---------------------------
    academic_pred = academic_model.predict(x)[0]
    academic_shap = get_shap_for_predicted_class(explainer_academic, academic_model, x)
    academic_explanation = shap_to_text(academic_shap)

    # ---------------------------
    # Wellbeing Recommendation
    # ---------------------------
    wellbeing_pred = wellbeing_model.predict(x)[0]
    wellbeing_shap = get_shap_for_predicted_class(explainer_wellbeing, wellbeing_model, x)
    wellbeing_explanation = shap_to_text(wellbeing_shap)

    # ---------------------------
    # Study Recommendation
    # ---------------------------
    study_pred = study_model.predict(x)[0]
    study_shap = get_shap_for_predicted_class(explainer_study, study_model, x)
    study_explanation = shap_to_text(study_shap)

    # ---------------------------
    # Return Output
    # ---------------------------
    return {
        "academic_recommendation": ACADEMIC_MESSAGES[academic_pred],
        "academic_explanation": academic_explanation,

        "wellbeing_recommendation": WELLBEING_MESSAGES[wellbeing_pred],
        "wellbeing_explanation": wellbeing_explanation,

        "study_recommendation": STUDY_MESSAGES[study_pred],
        "study_explanation": study_explanation
    }


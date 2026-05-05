import joblib
import pandas as pd
import numpy as np
from pathlib import Path
from typing import Optional
import logging

logger = logging.getLogger(__name__)

MODEL_DIR = Path(__file__).parent.parent / "models"

# models are loaded once at startup — joblib.load on every request would be too slow
try:
    _model           = joblib.load(MODEL_DIR / "risk_model_final.pkl")
    _explainer       = joblib.load(MODEL_DIR / "shap_explainer_final.pkl")
    _feature_columns = joblib.load(MODEL_DIR / "feature_columns_final.pkl")
    logger.info(f"✅ Risk model loaded — {len(_feature_columns)} features")
    print(f"✅ Risk model loaded — {len(_feature_columns)} features")
except Exception as e:
    logger.error(f"❌ Failed to load risk model: {e}")
    print(f"❌ Failed to load risk model: {e}")
    _model           = None
    _explainer       = None
    _feature_columns = []

# these must match the column names used during model training exactly
CATEGORICAL_COLS = [
    "Gender", "Department", "Extracurricular_Activities",
    "Internet_Access_at_Home", "Parent_Education_Level", "Family_Income_Level"
]

# maps internal feature names to what the student/lecturer sees on screen
FEATURE_DISPLAY_NAMES = {
    "Attendance_pct":        "Attendance Rate",
    "Midterm_Score":         "Midterm Score",
    "Final_Score":           "Final Exam Score",
    "Assignments_Avg":       "Assignment Average",
    "Quizzes_Avg":           "Quiz Average",
    "Participation_Score":   "Class Participation",
    "Projects_Score":        "Project Score",
    "Age":                   "Age",
    "Study_Hours_per_Week":  "Weekly Study Hours",
    "Stress_Level_1-10":     "Stress Level",
    "Sleep_Hours_per_Night": "Sleep Hours",
}


def _get_display_name(feature: str) -> str:
    # one-hot encoded features come in as e.g. "Gender_Female" — strip the suffix for display
    for base, display in FEATURE_DISPLAY_NAMES.items():
        if feature == base:
            return display
        if feature.startswith(base + "_"):
            suffix = feature[len(base) + 1:].replace("_", " ")
            return f"{display}: {suffix}"
    return feature.replace("_", " ").title()


def _build_input_df(data: dict) -> pd.DataFrame:
    # Stress_Level is stored as "Stress_Level_1-10" in training — rename before encoding
    if "Stress_Level" in data:
        data["Stress_Level_1-10"] = data.pop("Stress_Level")

    df = pd.DataFrame([data])
    df_encoded = pd.get_dummies(df, columns=CATEGORICAL_COLS, drop_first=True)

    # reindex fills any categories the student's data doesn't have (e.g. unseen departments)
    df_encoded = df_encoded.reindex(columns=_feature_columns, fill_value=0)
    return df_encoded


def _extract_shap_for_risk(shap_values, sample_index: int = 0) -> np.ndarray:
    # SHAP output format changed across versions — handle all three shapes
    # list [class0_arr, class1_arr] is old format; 3D array is shap 0.46+
    if isinstance(shap_values, list):
        return shap_values[1][sample_index]

    arr = np.array(shap_values)
    if arr.ndim == 3:
        return arr[sample_index, :, 1]
    elif arr.ndim == 2:
        return arr[sample_index]
    return arr


def _build_explanation(shap_vals: np.ndarray, raw_data: dict) -> dict:
    shap_series = pd.Series(shap_vals, index=_feature_columns)

    # positive SHAP = pushes toward at-risk, negative = protective
    risk_factors_raw = shap_series[shap_series > 0].nlargest(5)
    protective_raw   = shap_series[shap_series < 0].nsmallest(3)

    risk_factors = []
    for feat, impact in risk_factors_raw.items():
        risk_factors.append({
            "feature":      feat,
            "display_name": _get_display_name(feat),
            "impact":       round(float(impact), 4),
            "direction":    "increases_risk",
            "value":        (float(raw_data.get(feat)) if isinstance(raw_data.get(feat), (int, float)) else None) if feat in raw_data else None,
        })

    protective_factors = []
    for feat, impact in protective_raw.items():
        protective_factors.append({
            "feature":      feat,
            "display_name": _get_display_name(feat),
            "impact":       round(float(impact), 4),
            "direction":    "decreases_risk",
            "value":        (float(raw_data.get(feat)) if isinstance(raw_data.get(feat), (int, float)) else None) if feat in raw_data else None,
        })

    summary_text = []
    for f in risk_factors[:3]:
        summary_text.append(f"{f['display_name']} is contributing to elevated risk.")
    for f in protective_factors[:2]:
        summary_text.append(f"{f['display_name']} is helping reduce your risk.")

    return {
        "risk_factors":       risk_factors,
        "protective_factors": protective_factors,
        "summary_text":       summary_text,
    }


def predict_risk_with_shap(data: dict, student_id: Optional[str] = None) -> dict:
    if _model is None:
        raise RuntimeError("Risk model not loaded. Check app/models/ folder.")

    raw_data = data.copy()

    # when Final_Score is 0 the student hasn't sat the exam yet — use Midterm as proxy
    # to avoid inflating risk based on a missing value
    if data.get("Final_Score", 0) == 0 and data.get("Midterm_Score", 0) > 0:
        data["Final_Score"] = data["Midterm_Score"]

    df_input = _build_input_df(data)

    # index [0][1] gives probability of class 1 (at-risk)
    risk_prob = float(_model.predict_proba(df_input)[0][1])

    # floor at 1% — a student with perfect scores still has some theoretical risk
    risk_percentage = max(1, int(round(risk_prob * 100)))

    if risk_prob >= 0.7:
        risk_level, risk_color = "High", "red"
    elif risk_prob >= 0.4:
        risk_level, risk_color = "Medium", "amber"
    else:
        risk_level, risk_color = "Low", "green"

    shap_values   = _explainer.shap_values(df_input)
    shap_for_risk = _extract_shap_for_risk(shap_values, sample_index=0)
    explanation   = _build_explanation(shap_for_risk, raw_data)

    return {
        "student_id":      student_id,
        "risk_score":      round(risk_prob, 4),
        "risk_percentage": risk_percentage,
        "risk_level":      risk_level,
        "risk_color":      risk_color,
        "explanation":     explanation,
        "model_version":   "v4_hybrid",
    }


# legacy fallback — not used by the main flow, kept so old endpoints still respond
def predict_risk_score(payload) -> float:
    gpa_penalty        = (4.0 - payload.gpa) / 4.0 * 40
    attendance_penalty = (100 - payload.attendance_rate) / 100 * 40
    assignment_penalty = max(0, 10 - payload.assignments_completed) * 2
    score = gpa_penalty + attendance_penalty + assignment_penalty
    return round(max(0, min(100, score)), 2)
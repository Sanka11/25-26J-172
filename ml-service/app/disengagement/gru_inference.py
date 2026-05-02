# app/disengagement/gru_inference.py

import numpy as np
import tensorflow as tf
import joblib
import os

BASE_DIR = os.path.dirname(__file__)

# --------------------------------------------------
# 🔥 VERSION SWITCH (SAFE)
# --------------------------------------------------
USE_V3 = True   # ✅ Set True to use new model, False to fallback

# --------------------------------------------------
# Load correct model files
# --------------------------------------------------
if USE_V3:
    MODEL_PATH = os.path.join(BASE_DIR, "gru_autoencoder_v3.keras")
    SCALER_PATH = os.path.join(BASE_DIR, "gru_scaler_v3.joblib")
    THRESHOLD_PATH = os.path.join(BASE_DIR, "gru_thresholds_v3.joblib")
else:
    MODEL_PATH = os.path.join(BASE_DIR, "gru_autoencoder.keras")
    SCALER_PATH = os.path.join(BASE_DIR, "gru_scaler.joblib")
    THRESHOLD_PATH = os.path.join(BASE_DIR, "gru_thresholds.joblib")

# --------------------------------------------------
# Load trained artifacts (ONCE)
# --------------------------------------------------
gru_model = tf.keras.models.load_model(MODEL_PATH)
scaler = joblib.load(SCALER_PATH)
thresholds = joblib.load(THRESHOLD_PATH)

print("✅ GRU Model Loaded:", MODEL_PATH)

# --------------------------------------------------
# ⚠️ MUST MATCH TRAINING EXACTLY
# --------------------------------------------------
FEATURE_ORDER = [
    "login_count",
    "avg_session_duration_min",
    "total_active_time_min",
    "days_since_last_login",
    "page_views",
    "assignments_submitted",
    "on_time_submissions",
    "late_submissions",
    "alerts_responded",
    "response_rate"
]

SEQ_LEN = 10


def compute_gru_risk(last_10_weeks: list):
    """
    last_10_weeks: list of WeeklyActivity objects
    """

    # --------------------------------------------------
    # Convert to NumPy array (IMPORTANT: ORDER MATTERS)
    # --------------------------------------------------
    X = np.array(
        [[getattr(w, f) for f in FEATURE_ORDER] for w in last_10_weeks],
        dtype=np.float32
    )

    # --------------------------------------------------
    # Pad if less than 10 weeks (prepend zeros)
    # --------------------------------------------------
    if X.shape[0] < SEQ_LEN:
        pad_len = SEQ_LEN - X.shape[0]
        pad = np.zeros((pad_len, X.shape[1]), dtype=np.float32)
        X = np.vstack([pad, X])

    # --------------------------------------------------
    # Final shape check
    # --------------------------------------------------
    if X.shape != (SEQ_LEN, len(FEATURE_ORDER)):
        raise ValueError(
            f"Invalid GRU input shape: {X.shape}, expected (10, 10)"
        )

    # --------------------------------------------------
    # DEBUG — raw values
    # --------------------------------------------------
    print("DEBUG | Raw input (first week):", X[0])
    print("DEBUG | Raw min/max:", float(X.min()), float(X.max()))

    # --------------------------------------------------
    # Scale using TRAINED scaler
    # --------------------------------------------------
    X_scaled = scaler.transform(X)
    X_scaled = np.expand_dims(X_scaled, axis=0)

    # --------------------------------------------------
    # DEBUG — scaled values
    # --------------------------------------------------
    print(
        "DEBUG | Scaled min/max:",
        float(X_scaled.min()),
        float(X_scaled.max())
    )

    # --------------------------------------------------
    # GRU reconstruction
    # --------------------------------------------------
    recon = gru_model.predict(X_scaled, verbose=0)

    # Reconstruction error
    recon_error = float(np.mean(np.square(X_scaled - recon)))

    # --------------------------------------------------
    # DEBUG — reconstruction & thresholds
    # --------------------------------------------------
    print("DEBUG | Reconstruction error:", recon_error)
    print("DEBUG | Thresholds:", thresholds)

    # --------------------------------------------------
    # 🔥 Risk classification (supports BOTH models)
    # --------------------------------------------------
    if "low" in thresholds:
        # ✅ NEW MODEL (v3)
        if recon_error <= thresholds["low"]:
            risk = "LOW"
        elif recon_error <= thresholds["normal"]:
            risk = "NORMAL"
        else:
            risk = "HIGH"
    else:
        # ⚠️ OLD MODEL fallback
        if recon_error <= thresholds["p95"]:
            risk = "LOW"
        elif recon_error <= thresholds["p97"]:
            risk = "NORMAL"
        else:
            risk = "HIGH"

    # --------------------------------------------------
    # FINAL OUTPUT (DO NOT CHANGE STRUCTURE)
    # --------------------------------------------------
    return {
        "risk_level": risk,
        "reconstruction_error": recon_error
    }
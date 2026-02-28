# app/disengagement/gru_inference.py

import numpy as np
import tensorflow as tf
import joblib
import os

BASE_DIR = os.path.dirname(__file__)

MODEL_PATH = os.path.join(BASE_DIR, "gru_autoencoder.keras")
SCALER_PATH = os.path.join(BASE_DIR, "gru_scaler.joblib")
THRESHOLD_PATH = os.path.join(BASE_DIR, "gru_thresholds.joblib")

# Load once (important for performance)
gru_model = tf.keras.models.load_model(MODEL_PATH)
scaler = joblib.load(SCALER_PATH)
thresholds = joblib.load(THRESHOLD_PATH)

FEATURE_ORDER = [
    "login_freq",
    "session_duration",
    "inactivity_days",
    "assignment_completion",
    "quiz_score",
    "forum_posts",
    "video_watch_ratio",
    "late_submissions",
    "alert_interactions",
    "help_requests"
]

SEQ_LEN = 10


def compute_gru_risk(last_10_weeks: list):
    """
    last_10_weeks: list of WeeklyActivity dicts (can be < 10)
    """

    # Convert to numpy
    X = np.array(
        [[getattr(w, f) for f in FEATURE_ORDER] for w in last_10_weeks],
        dtype=np.float32
    )

    # ❗ PAD IF LESS THAN 10 WEEKS
    if X.shape[0] < SEQ_LEN:
        pad_len = SEQ_LEN - X.shape[0]
        pad = np.zeros((pad_len, X.shape[1]), dtype=np.float32)
        X = np.vstack([pad, X])

    # Safety check
    if X.shape != (10, 10):
        raise ValueError(f"Invalid GRU input shape after padding: {X.shape}")

    # Scale
    X_scaled = scaler.transform(X)

    # Add batch dimension
    X_scaled = np.expand_dims(X_scaled, axis=0)

    # Predict
    recon = gru_model.predict(X_scaled, verbose=0)

    # Reconstruction error
    recon_error = float(np.mean(np.square(X_scaled - recon)))

    # Risk label
    if recon_error >= thresholds["p99"]:
        risk = "HIGH"
    elif recon_error >= thresholds["p97"]:
        risk = "NORMAL"
    else:
        risk = "LOW"

    return {
        "risk_level": risk,
        "reconstruction_error": recon_error
    }
# app/disengagement/gru_inference.py

import numpy as np
import tensorflow as tf
import joblib
import os

BASE_DIR = os.path.dirname(__file__)

MODEL_PATH = os.path.join(BASE_DIR, "gru_autoencoder.keras")
SCALER_PATH = os.path.join(BASE_DIR, "gru_scaler.joblib")
THRESHOLD_PATH = os.path.join(BASE_DIR, "gru_thresholds.joblib")

# --------------------------------------------------
# Load trained artifacts (ONCE)
# --------------------------------------------------
gru_model = tf.keras.models.load_model(MODEL_PATH)
scaler = joblib.load(SCALER_PATH)
thresholds = joblib.load(THRESHOLD_PATH)

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
    # Convert to NumPy array (ATTRIBUTE ACCESS)
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
    # DEBUG — raw values
    # --------------------------------------------------
    print("DEBUG | Raw GRU input (first week):", X[0])
    print("DEBUG | Raw min/max:", float(X.min()), float(X.max()))

    # --------------------------------------------------
    # Final shape check
    # --------------------------------------------------
    if X.shape != (SEQ_LEN, len(FEATURE_ORDER)):
        raise ValueError(
            f"Invalid GRU input shape: {X.shape}, expected (10, 10)"
        )

    # --------------------------------------------------
    # Scale using TRAINED scaler
    # --------------------------------------------------
    X_scaled = scaler.transform(X)

    # Add batch dimension → (1, 10, 10)
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
    # Risk classification (MATCH TRAINING LOGIC)
    # --------------------------------------------------
    if recon_error <= thresholds["p95"]:
        risk = "LOW"
    elif recon_error <= thresholds["p97"]:
        risk = "NORMAL"
    else:
        risk = "HIGH"

    return {
        "risk_level": risk,
        "reconstruction_error": recon_error
    }
import os
import numpy as np
import joblib
import tensorflow as tf

# --------------------------------------------------
# Paths
# --------------------------------------------------
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

MODEL_PATH = os.path.join(BASE_DIR, "gru_autoencoder.keras")
SCALER_PATH = os.path.join(BASE_DIR, "gru_scaler.joblib")
THRESHOLDS_PATH = os.path.join(BASE_DIR, "gru_thresholds.pkl")

SEQ_LEN = 10
NUM_FEATURES = 10

# --------------------------------------------------
# Load artifacts (loaded once)
# --------------------------------------------------
model = tf.keras.models.load_model(MODEL_PATH)
scaler = joblib.load(SCALER_PATH)
thresholds = joblib.load(THRESHOLDS_PATH)

P95 = thresholds["p95"]
P97 = thresholds["p97"]

# --------------------------------------------------
# Risk mapping
# --------------------------------------------------
def map_risk(reconstruction_error: float) -> str:
    if reconstruction_error < P95:
        return "LOW"
    elif reconstruction_error < P97:
        return "NORMAL"
    else:
        return "HIGH"

# --------------------------------------------------
# GRU inference function
# --------------------------------------------------
def predict_gru_risk(last_10_weeks_features: np.ndarray):
    """
    last_10_weeks_features:
        shape = (10, 10)
        order must match training feature order
    """

    if last_10_weeks_features.shape != (SEQ_LEN, NUM_FEATURES):
        raise ValueError(
            f"Expected shape (10, 10), got {last_10_weeks_features.shape}"
        )

    # scale
    scaled = scaler.transform(last_10_weeks_features)

    # reshape for GRU: (1, 10, 10)
    x = np.expand_dims(scaled, axis=0)

    # reconstruction
    reconstructed = model.predict(x, verbose=0)

    # reconstruction error (MSE)
    error = np.mean(np.square(x - reconstructed))

    risk = map_risk(error)

    return {
        "risk_level": risk,
        "reconstruction_error": float(error),
    }

# --------------------------------------------------
# Local test (sanity check)
# --------------------------------------------------
if __name__ == "__main__":
    # Dummy example input (replace later with real student data)
    dummy_input = np.random.rand(SEQ_LEN, NUM_FEATURES)

    result = predict_gru_risk(dummy_input)

    print("GRU inference result:")
    print(result)

import torch
import numpy as np
import pandas as pd
from joblib import load

from app.autoencoder_model import GRUAutoencoder


# -------------------------------------------------------------
#   GET RISK FOR A SINGLE STUDENT
# -------------------------------------------------------------
def get_student_risk(student_id, dataset_path="app/data/dataset.csv", sequence_length=10):

    # -------------------------
    # Load dataset
    # -------------------------
    df = pd.read_csv(dataset_path)

    # -------------------------
    # Define feature columns
    # -------------------------
    raw_features = [
        'login_count', 'avg_session_duration_min',
        'total_active_time_min', 'days_since_last_login',
        'page_views', 'video_watch_minutes',
        'forum_posts', 'messages_sent',
        'assignments_due', 'assignments_submitted',
        'quiz_attempts', 'alerts_sent',
        'alerts_responded', 'notifications_opened'
    ]

    extra_features = [
        'on_time_submission_ratio', 'forum_ratio',
        'response_rate', 'activity_drop_score'
    ]

    feature_cols = raw_features + extra_features

    # -------------------------
    # Feature Engineering
    # -------------------------
    df['on_time_submission_ratio'] = df.apply(
        lambda r: r['assignments_submitted'] / r['assignments_due']
        if r['assignments_due'] > 0 else 0, axis=1
    )

    df['forum_ratio'] = df.apply(
        lambda r: r['forum_posts'] / r['page_views']
        if r['page_views'] > 0 else 0, axis=1
    )

    df['response_rate'] = df.apply(
        lambda r: r['alerts_responded'] / r['alerts_sent']
        if r['alerts_sent'] > 0 else 0, axis=1
    )

    df['activity'] = df['login_count'] + df['page_views'] + df['video_watch_minutes']
    df['activity_drop_score'] = df.groupby("student_id")['activity'].diff().fillna(0) * -1

    # -------------------------
    # FILTER STUDENT
    # -------------------------
    stu_df = df[df["student_id"] == student_id]

    if len(stu_df) < sequence_length:
        return {
            "student_id": student_id,
            "error": None,
            "risk_level": None,
            "message": f"Not enough weekly records (have {len(stu_df)}, need {sequence_length})"
        }

    stu_df = stu_df.sort_values(by="week_start_date")

    # Last N-week window
    seq = stu_df[feature_cols].tail(sequence_length).values.astype(np.float32)

    # -------------------------
    # Load scaler + thresholds
    # -------------------------
    scaler = load("app/scaler.save")
    seq_scaled = scaler.transform(seq)

    p50 = float(np.load("app/threshold_p50.npy"))
    p75 = float(np.load("app/threshold_p75.npy"))

    # -------------------------
    # Load model
    # -------------------------
    model = GRUAutoencoder()
    model.load_state_dict(torch.load("app/autoencoder_model.pth", map_location="cpu"))
    model.eval()

    seq_tensor = torch.tensor(seq_scaled).unsqueeze(0)

    # -------------------------
    # Compute reconstruction error
    # -------------------------
    with torch.no_grad():
        recon, _ = model(seq_tensor)
        error = torch.mean((seq_tensor - recon) ** 2).item()

    # -------------------------
    # CLASSIFY RISK
    # -------------------------
    if error <= p50:
        risk = "LOW"
    elif error <= p75:
        risk = "NORMAL"
    else:
        risk = "HIGH"

    # -------------------------
    # Return result as JSON-like dict
    # -------------------------
    return {
        "student_id": student_id,
        "reconstruction_error": float(error),
        "risk_level": risk,
        "cutoff_low": float(p50),
        "cutoff_high": float(p75)
    }


# -------------------------------------------------------------
#   CLI USAGE
#   Example:
#       python -m app.predict_single_student S007
# -------------------------------------------------------------
if __name__ == "__main__":
    import sys

    if len(sys.argv) < 2:
        print("\n❌ ERROR: Please provide a student ID")
        print("Usage: python -m app.predict_single_student S001\n")
        sys.exit(1)

    student_id = sys.argv[1]
    result = get_student_risk(student_id)

    print("\n🎯 SINGLE STUDENT RISK RESULT")
    print("--------------------------------")
    print(result)

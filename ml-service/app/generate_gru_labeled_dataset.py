import pandas as pd
import numpy as np

from app.autoencoder_predict import (
    load_autoencoder_model,
    load_threshold,
    predict_risk
)

# ======================================================
# CONFIG
# ======================================================

# Input dataset (your original dataset)
INPUT_DATASET = "app/data/dataset.csv"

# Output dataset (GRU-labeled)
OUTPUT_DATASET = "app/data/gru_labeled_dataset.csv"

# GRU model files
MODEL_PATH = "app/autoencoder_model.pth"
THRESHOLD_PATH = "app/reconstruction_threshold.npy"

# GRU sequence settings
SEQ_LEN = 10

# EXACT 18 features used by your GRU model
FEATURE_COLUMNS = [
    "login_count",
    "avg_session_duration_min",
    "total_active_time_min",
    "days_since_last_login",
    "page_views",
    "video_watch_minutes",
    "forum_posts",
    "messages_sent",
    "assignments_due",
    "assignments_submitted",
    "quiz_attempts",
    "alerts_sent",
    "alerts_responded",
    "notifications_opened",
    "on_time_submission_ratio",
    "response_rate",
    "activity_drop_score",
    "engagement_score"
]

# ======================================================
# BUILD TEMPORAL SEQUENCES (10 × 18)
# ======================================================
def build_sequences(df, student_id):
    # Sort by real time column
    student_df = (
        df[df["student_id"] == student_id]
        .sort_values("week_start_date")
        .reset_index(drop=True)
    )

    sequences = []
    last_rows = []

    for i in range(len(student_df) - SEQ_LEN + 1):
        window = student_df.iloc[i:i + SEQ_LEN]

        # Extract GRU input sequence
        seq = window[FEATURE_COLUMNS].values.astype(np.float32)

        sequences.append(seq)

        # Keep last row for labeling
        last_rows.append(window.iloc[-1])

    return sequences, last_rows


# ======================================================
# MAIN
# ======================================================
def main():
    print("📥 Loading dataset...")
    df = pd.read_csv(INPUT_DATASET)

    print("🧠 Loading GRU model...")
    model = load_autoencoder_model(MODEL_PATH)
    threshold = load_threshold(THRESHOLD_PATH)

    output_rows = []

    print("⚙️ Generating GRU-labeled data...")

    for student_id in df["student_id"].unique():
        sequences, rows = build_sequences(df, student_id)

        for seq, row in zip(sequences, rows):
            prediction = predict_risk(model, threshold, seq)

            labeled_row = row.to_dict()
            labeled_row["reconstruction_error"] = prediction["reconstruction_error"]
            labeled_row["risk"] = prediction["risk_level"]

            output_rows.append(labeled_row)

    labeled_df = pd.DataFrame(output_rows)
    labeled_df.to_csv(OUTPUT_DATASET, index=False)

    print(f"✅ GRU-labeled dataset generated successfully!")
    print(f"📄 Saved to: {OUTPUT_DATASET}")


if __name__ == "__main__":
    main()

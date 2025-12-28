import torch
import numpy as np
import pandas as pd
import argparse
from joblib import load

from app.autoencoder_model import GRUAutoencoder


def prepare_student_sequences(dataset_path, feature_cols, sequence_length=10):
    df = pd.read_csv(dataset_path)

    # ----- Calculated Features -----
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

    df = df.sort_values(by=["student_id", "week_start_date"]).reset_index(drop=True)

    student_sequences = {}
    for stu in df["student_id"].unique():
        stu_df = df[df["student_id"] == stu]
        features = stu_df[feature_cols].values

        seq_list = []
        for i in range(len(stu_df) - sequence_length + 1):
            seq = features[i:i + sequence_length]
            seq_list.append(seq)

        if len(seq_list) > 0:
            student_sequences[stu] = seq_list

    return student_sequences


def predict_all_students(dataset_path="app/data/dataset.csv", filter_mode="all"):
    scaler = load("app/scaler.save")

    p50 = float(np.load("app/threshold_p50.npy"))
    p75 = float(np.load("app/threshold_p75.npy"))

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

    print("📌 Preparing student sequences...")
    student_sequences = prepare_student_sequences(dataset_path, feature_cols)

    model = GRUAutoencoder()
    model.load_state_dict(torch.load("app/autoencoder_model.pth", map_location="cpu"))
    model.eval()

    results = []

    with torch.no_grad():
        for stu_id, seq_list in student_sequences.items():
            seq = np.array(seq_list[-1], dtype=np.float32)

            seq_scaled = scaler.transform(seq)
            seq_tensor = torch.tensor(seq_scaled).unsqueeze(0)

            recon, _ = model(seq_tensor)
            error = torch.mean((seq_tensor - recon) ** 2).item()

            if error <= p50:
                risk = "LOW"
            elif error <= p75:
                risk = "NORMAL"
            else:
                risk = "HIGH"

            results.append({
                "student_id": stu_id,
                "error": error,
                "risk": risk
            })

    # ----- Sort alphabetically by student_id -----
    results.sort(key=lambda x: x["student_id"])

    # ----- Filtering logic -----
    if filter_mode == "high":
        results = [r for r in results if r["risk"] == "HIGH"]
    elif filter_mode == "normal":
        results = [r for r in results if r["risk"] == "NORMAL"]
    elif filter_mode == "low":
        results = [r for r in results if r["risk"] == "LOW"]
    # else: show all

    # ----- Print -----
    print("\n🎯 STUDENT RISK REPORT (", filter_mode.upper(), ")\n")
    for r in results:
        print(f"{r['student_id']:>6} → {r['risk']:6} (error={r['error']:.5f})")

    return results


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--mode", type=str, default="all",
                        choices=["all", "high", "normal", "low"],
                        help="Filter risk level")
    args = parser.parse_args()

    predict_all_students(filter_mode=args.mode)

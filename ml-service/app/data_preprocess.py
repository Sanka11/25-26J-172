# import pandas as pd
# import numpy as np
# import torch
# from sklearn.preprocessing import MinMaxScaler
# from joblib import dump, load


# FEATURE_COLS = [
#     'login_count', 'avg_session_duration_min', 'total_active_time_min',
#     'days_since_last_login', 'page_views', 'video_watch_minutes',
#     'forum_posts', 'messages_sent', 'assignments_due', 'assignments_submitted',
#     'quiz_attempts', 'alerts_sent', 'alerts_responded', 'notifications_opened',
#     'on_time_submission_ratio', 'forum_ratio',
#     'response_rate', 'activity_drop_score'
# ]


# def load_and_preprocess(dataset_path, sequence_length=10, mode="train"):
#     df = pd.read_csv(dataset_path)

#     # ---------- engineered features ----------
#     df['on_time_submission_ratio'] = df.apply(
#         lambda r: r['assignments_submitted'] / r['assignments_due']
#         if r['assignments_due'] > 0 else 0, axis=1
#     )

#     df['forum_ratio'] = df.apply(
#         lambda r: r['forum_posts'] / r['page_views']
#         if r['page_views'] > 0 else 0, axis=1
#     )

#     df['response_rate'] = df.apply(
#         lambda r: r['alerts_responded'] / r['alerts_sent']
#         if r['alerts_sent'] > 0 else 0, axis=1
#     )

#     df['activity'] = df['login_count'] + df['page_views'] + df['video_watch_minutes']
#     df['activity_drop_score'] = df.groupby("student_id")['activity'].diff().fillna(0) * -1

#     df = df.sort_values(["student_id", "week_start_date"])

#     # ---------- SCALER ----------
#     if mode == "train":
#         scaler = MinMaxScaler()
#         df[FEATURE_COLS] = scaler.fit_transform(df[FEATURE_COLS])
#         dump(scaler, "app/scaler.save")
#     else:
#         scaler = load("app/scaler.save")
#         df[FEATURE_COLS] = scaler.transform(df[FEATURE_COLS])

#     # ---------- SEQUENCES ----------
#     sequences = []

#     for sid in df["student_id"].unique():
#         stu = df[df["student_id"] == sid]
#         values = stu[FEATURE_COLS].values

#         for i in range(len(values) - sequence_length + 1):
#             sequences.append(values[i:i + sequence_length])

#     return torch.tensor(np.array(sequences), dtype=torch.float32)

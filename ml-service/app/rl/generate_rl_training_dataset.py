# import pandas as pd
# import numpy as np


# # ======================================================
# # CONFIG
# # ======================================================
# INPUT_DATASET = "app/data/dataset.csv"
# OUTPUT_DATASET = "app/rl/rl_training_dataset.csv"

# RISK_MAP = {
#     "LOW": 0,
#     "NORMAL": 1,
#     "HIGH": 2
# }


# # ======================================================
# # GENERATE RL TRAINING DATASET
# # ======================================================
# def generate_rl_dataset():

#     df = pd.read_csv(INPUT_DATASET)
#     df = df.sort_values(["student_id", "week_start_date"]).reset_index(drop=True)

#     rows = []

#     for _, row in df.iterrows():

#         # -------------------------------
#         # Synthetic RL labels
#         # -------------------------------
#         if row["activity_drop_score"] > 2 or row["days_since_last_login"] > 5:
#             gru_risk = "HIGH"
#         elif row["activity_drop_score"] > 1:
#             gru_risk = "NORMAL"
#         else:
#             gru_risk = "LOW"

#         academic_issue = int(
#             row["assignments_due"] > 0 and
#             row["assignments_submitted"] / max(row["assignments_due"], 1) < 0.5
#         )

#         # -------------------------------
#         # RL training row
#         # -------------------------------
#         rows.append({
#             "gru_risk": gru_risk,
#             "rl_risk": gru_risk,
#             "academic_issue": academic_issue,
#             "days_since_last_login": row["days_since_last_login"],
#             "alerts_sent": row["alerts_sent"],
#             "alerts_responded": row["alerts_responded"],
#             "engagement_score": row.get("engagement_score", np.random.uniform(1.5, 3.0))
#         })

#     rl_df = pd.DataFrame(rows)
#     rl_df.to_csv(OUTPUT_DATASET, index=False)

#     print("✅ RL training dataset generated!")
#     print("📁 Saved to:", OUTPUT_DATASET)
#     print("\n📊 RL Risk Distribution:")
#     print(rl_df["rl_risk"].value_counts())


# # ======================================================
# # RUN
# # ======================================================
# if __name__ == "__main__":
#     generate_rl_dataset()

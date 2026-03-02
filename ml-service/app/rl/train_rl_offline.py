# import pandas as pd
# import pickle

# from app.rl.q_learning import QLearningAgent
# from app.rl.state_builder import build_state
# from app.rl.reward import compute_reward


# # ======================================================
# # CONFIG
# # ======================================================
# DATASET_PATH = "app/rl/rl_training_dataset.csv"   # generated offline dataset
# Q_TABLE_PATH = "app/rl/q_table.pkl"

# EPISODES = 30
# MAX_STEPS = 6


# # ======================================================
# # LOAD DATA
# # ======================================================
# df = pd.read_csv(DATASET_PATH)

# print("📊 RL Risk Distribution:")
# print(df["rl_risk"].value_counts())


# # ======================================================
# # INITIALIZE RL AGENT
# # ======================================================
# agent = QLearningAgent(
#     state_size=5,
#     action_size=5,
#     alpha=0.1,
#     gamma=0.9,
#     epsilon=0.3
# )


# # ======================================================
# # TRAINING LOOP (WITH prev_action FIX)
# # ======================================================
# for episode in range(EPISODES):
#     print(f"🔁 Episode {episode+1}/{EPISODES}")


#     prev_action = None  # 🔥 CRITICAL FIX

#     for _, row in df.iterrows():

#         # -------------------------------
#         # Build current state
#         # -------------------------------
#         gru_output = {
#             "risk": row["gru_risk"],
#             "reasons": ["academic_issue"] if row["academic_issue"] == 1 else []
#         }

#         student_features = {
#             "days_since_last_login": row["days_since_last_login"],
#             "alerts_sent": row["alerts_sent"],
#             "alerts_responded": row["alerts_responded"],
#             "engagement_score": row["engagement_score"]
#         }

#         state = build_state(
#             gru_output=gru_output,
#             student_features=student_features
#         )

#         # -------------------------------
#         # Choose action
#         # -------------------------------
#         action = agent.choose_action(state)

#         # -------------------------------
#         # Simulate environment transition
#         # -------------------------------
#         next_row = row.copy()

#         if action != 0:  # not DO_NOTHING
#             next_row["alerts_sent"] += 1

#         if action in [2, 3]:  # EMAIL or MOTIVATIONAL
#             next_row["alerts_responded"] += 1
#             next_row["days_since_last_login"] = max(
#                 0, next_row["days_since_last_login"] - 1
#             )

#         next_row["engagement_score"] = min(
#             3.0, next_row["engagement_score"] + 0.3
#         )

#         # -------------------------------
#         # Risk transition
#         # -------------------------------
#         prev_risk = row["rl_risk"]

#         if prev_risk == "HIGH" and next_row["engagement_score"] >= 2.5:
#             next_risk = "NORMAL"
#         elif prev_risk == "NORMAL" and next_row["engagement_score"] >= 2.8:
#             next_risk = "LOW"
#         else:
#             next_risk = prev_risk

#         next_gru_output = {
#             "risk": next_risk,
#             "reasons": []
#         }

#         next_features = {
#             "days_since_last_login": next_row["days_since_last_login"],
#             "alerts_sent": next_row["alerts_sent"],
#             "alerts_responded": next_row["alerts_responded"],
#             "engagement_score": next_row["engagement_score"]
#         }

#         next_state = build_state(
#             gru_output=next_gru_output,
#             student_features=next_features
#         )

#         # -------------------------------
#         # Compute reward (🔥 FIX APPLIED)
#         # -------------------------------
#         reward = compute_reward(
#             prev_state=state,
#             action=action,
#             new_state=next_state,
#             prev_action=prev_action
#         )

#         # -------------------------------
#         # Q-table update
#         # -------------------------------
#         agent.update_q_value(state, action, reward, next_state)

#         prev_action = action  # 🔥 TRACK PREVIOUS ACTION

#     agent.decay_epsilon()


# # ======================================================
# # SAVE Q-TABLE
# # ======================================================
# with open(Q_TABLE_PATH, "wb") as f:
#     pickle.dump(agent.q_table, f)

# print("\n🎉 RL training completed successfully!")
# print(f"📦 Q-table saved to: {Q_TABLE_PATH}")

# """
# Quick script to generate a placeholder Gradient Boosting model for struggle prediction.
# This creates a basic model with the expected feature structure.

# Usage:
#     python train_struggle_model.py
# """

# import joblib
# import numpy as np
# from sklearn.ensemble import GradientBoostingClassifier

# # =========================
# # Create synthetic training data
# # =========================
# # Features: [correct, hint_count, ms_first_response, overlap_time, opportunity]
# np.random.seed(42)

# # Generate 1000 samples
# n_samples = 1000

# # Feature ranges based on typical values
# correct = np.random.randint(0, 2, n_samples)  # 0 or 1
# hint_count = np.random.randint(0, 10, n_samples)  # 0-9
# ms_first_response = np.random.randint(500, 30000, n_samples)  # 0.5s to 30s
# overlap_time = np.random.randint(0, 60000, n_samples)  # 0-60s
# opportunity = np.random.randint(1, 20, n_samples)  # 1-19

# X_train = np.column_stack([correct, hint_count, ms_first_response, overlap_time, opportunity])

# # Generate labels (struggling = 1, not struggling = 0)
# # Higher hint count, lower correct, slower response → more likely struggling
# y_train = (
#     (hint_count > 3) & 
#     (correct == 0) & 
#     (ms_first_response > 10000)
# ).astype(int)

# # =========================
# # Train Gradient Boosting model
# # =========================
# print("Training Gradient Boosting classifier...")
# model = GradientBoostingClassifier(
#     n_estimators=100,
#     learning_rate=0.1,
#     max_depth=3,
#     random_state=42
# )

# model.fit(X_train, y_train)
# print(f"Model trained. Training accuracy: {model.score(X_train, y_train):.3f}")

# # =========================
# # Save model
# # =========================
# output_path = "app/models/gb_struggle_model.pkl"
# joblib.dump(model, output_path)
# print(f"✓ Model saved to {output_path}")

# # =========================
# # Test the model
# # =========================
# test_sample = np.array([[0, 5, 15000, 30000, 3]])  # Struggling student
# prob = model.predict_proba(test_sample)[0][1]
# print(f"\nTest prediction (struggling student): {prob:.3f}")

# test_sample = np.array([[1, 0, 2000, 5000, 10]])  # Good student
# prob = model.predict_proba(test_sample)[0][1]
# print(f"Test prediction (good student): {prob:.3f}")
# import pandas as pd
# import numpy as np
# import joblib

# from sklearn.preprocessing import MinMaxScaler
# from sklearn.model_selection import train_test_split
# from sklearn.ensemble import RandomForestRegressor
# from sklearn.metrics import mean_absolute_error, r2_score

# # -----------------------------
# # LOAD DATA
# # -----------------------------
# df = pd.read_csv("D:/Y4S1/Research_2025/before_reserchpaper/final_2025/2012-2013-data-with-predictions-4-final.csv")

# selected_columns = [
#     "user_id",
#     "skill",
#     "problem_id",
#     "correct",
#     "hint_count",
#     "ms_first_response",
#     "overlap_time"
# ]

# df = df[selected_columns]

# # -----------------------------
# # CLEAN DATA
# # -----------------------------
# df = df[
#     (df["ms_first_response"] >= 0) &
#     (df["overlap_time"] >= 0)
# ]

# df = df.dropna()

# df["hint_count"] = df["hint_count"].clip(0, 10)
# df["ms_first_response"] = df["ms_first_response"].clip(0, 120000)
# df["overlap_time"] = df["overlap_time"].clip(0, 120000)

# # -----------------------------
# # NORMALIZE FEATURES
# # -----------------------------
# scaler = MinMaxScaler()

# df[["hint_count", "ms_first_response", "overlap_time"]] = scaler.fit_transform(
#     df[["hint_count", "ms_first_response", "overlap_time"]]
# )

# # -----------------------------
# # CREATE STRUGGLE SCORE
# # -----------------------------
# df["struggle_score"] = (
#     (1 - df["correct"]) * 0.5 +
#     df["hint_count"] * 0.25 +
#     df["ms_first_response"] * 0.125 +
#     df["overlap_time"] * 0.125
# )

# df["struggle_score"] = df["struggle_score"].clip(0, 1)

# # -----------------------------
# # TRAIN MODEL
# # -----------------------------
# X = df[["correct", "hint_count", "ms_first_response", "overlap_time"]]
# y = df["struggle_score"]

# X_train, X_test, y_train, y_test = train_test_split(
#     X, y, test_size=0.2, random_state=42
# )

# model = RandomForestRegressor(
#     n_estimators=100,
#     max_depth=12,
#     random_state=42,
#     n_jobs=-1
# )

# model.fit(X_train, y_train)

# # -----------------------------
# # EVALUATE
# # -----------------------------
# y_pred = model.predict(X_test)

# print("MAE:", mean_absolute_error(y_test, y_pred))
# print("R² :", r2_score(y_test, y_pred))

# # -----------------------------
# # SAVE MODEL + SCALER
# # -----------------------------
# joblib.dump(model, "db_struggle_model.pkl")
# joblib.dump(scaler, "scaler.pkl")

# print("✅ Model & scaler saved successfully!")
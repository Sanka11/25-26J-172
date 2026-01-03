"""
Quick script to generate a placeholder Gradient Boosting model for struggle prediction.
This creates a basic model with the expected feature structure.

Usage:
    python train_struggle_model.py
"""

import joblib
import numpy as np
from sklearn.ensemble import GradientBoostingClassifier

# =========================
# Create synthetic training data
# =========================
# Features: [correct, hint_count, ms_first_response, overlap_time, opportunity]
np.random.seed(42)

# Generate 1000 samples
n_samples = 1000

# Feature ranges based on typical values
correct = np.random.randint(0, 2, n_samples)  # 0 or 1
hint_count = np.random.randint(0, 10, n_samples)  # 0-9
ms_first_response = np.random.randint(500, 30000, n_samples)  # 0.5s to 30s
overlap_time = np.random.randint(0, 60000, n_samples)  # 0-60s
opportunity = np.random.randint(1, 20, n_samples)  # 1-19

X_train = np.column_stack([correct, hint_count, ms_first_response, overlap_time, opportunity])

# Generate labels (struggling = 1, not struggling = 0)
# Higher hint count, lower correct, slower response → more likely struggling
y_train = (
    (hint_count > 3) & 
    (correct == 0) & 
    (ms_first_response > 10000)
).astype(int)

# =========================
# Train Gradient Boosting model
# =========================
print("Training Gradient Boosting classifier...")
model = GradientBoostingClassifier(
    n_estimators=100,
    learning_rate=0.1,
    max_depth=3,
    random_state=42
)

model.fit(X_train, y_train)
print(f"Model trained. Training accuracy: {model.score(X_train, y_train):.3f}")

# =========================
# Save model
# =========================
output_path = "app/models/gb_struggle_model.pkl"
joblib.dump(model, output_path)
print(f"✓ Model saved to {output_path}")

# =========================
# Test the model
# =========================
test_sample = np.array([[0, 5, 15000, 30000, 3]])  # Struggling student
prob = model.predict_proba(test_sample)[0][1]
print(f"\nTest prediction (struggling student): {prob:.3f}")

test_sample = np.array([[1, 0, 2000, 5000, 10]])  # Good student
prob = model.predict_proba(test_sample)[0][1]
print(f"Test prediction (good student): {prob:.3f}")

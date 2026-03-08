import pandas as pd
import numpy as np
import joblib
import json
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report, accuracy_score, roc_auc_score
import shap
from pathlib import Path

np.random.seed(42)

# ── Load dataset ──
CSV_NAME = "Processed_Student_Performance (1).csv"
df = pd.read_csv(CSV_NAME)
print(f"✅ Dataset loaded: {df.shape}")

# ── Drop leakage + identifiers ──
DROP_COLS = [
    "Student_ID", "First_Name", "Last_Name", "Email",
    "Total_Score", "Grade", "risk_score_cont", "ml_risk_score"
]
TARGET = "risk_label"

X = df.drop(columns=DROP_COLS + [TARGET])
y = df[TARGET]

print(f"Features: {X.columns.tolist()}")
print(f"X shape: {X.shape}")
print(f"Class distribution:\n{y.value_counts()}")

# ── Encode categoricals ──
CATEGORICAL_COLS = [
    "Gender", "Department", "Extracurricular_Activities",
    "Internet_Access_at_Home", "Parent_Education_Level", "Family_Income_Level"
]
X_encoded = pd.get_dummies(X, columns=CATEGORICAL_COLS, drop_first=True)
print(f"\nEncoded shape: {X_encoded.shape}")

# ── Split ──
X_train, X_test, y_train, y_test = train_test_split(
    X_encoded, y, test_size=0.2, random_state=42, stratify=y
)
print(f"Train: {X_train.shape}  Test: {X_test.shape}")

# ── Train ──
print("\n⏳ Training RandomForest...")
model = RandomForestClassifier(
    n_estimators=300,
    max_depth=12,
    class_weight="balanced",
    random_state=42,
    n_jobs=-1
)
model.fit(X_train, y_train)

y_pred = model.predict(X_test)
y_prob = model.predict_proba(X_test)[:, 1]

acc = round(accuracy_score(y_test, y_pred), 4)
auc = round(roc_auc_score(y_test, y_prob), 4)

print("\n── Model Results ──")
print(f"Accuracy : {acc}")
print(f"ROC-AUC  : {auc}")
print(classification_report(y_test, y_pred))

# ── SHAP ──
print("⏳ Building SHAP explainer (30-60 seconds)...")
explainer = shap.TreeExplainer(model)

# Test on 1 sample
shap_values = explainer.shap_values(X_test.iloc[:1])

# shap 0.46 with RandomForest outputs shape (1, 22, 2)
# Last dimension = [class0, class1] — take class 1 (at-risk)
if isinstance(shap_values, list):
    shap_for_risk = shap_values[1][0]        # old format
else:
    shap_for_risk = shap_values[0, :, 1]     # new format: sample 0, all features, class 1

print(f"✅ SHAP test passed. Shape: {shap_for_risk.shape}")

top = pd.Series(shap_for_risk, index=X_encoded.columns)
print("\nTop 5 risk factors by SHAP:")
print(top.abs().sort_values(ascending=False).head(5))

# ── Save artifacts ──
OUTPUT_DIR = Path("app/models")
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

joblib.dump(model,                     OUTPUT_DIR / "risk_model_final.pkl")
joblib.dump(explainer,                 OUTPUT_DIR / "shap_explainer_final.pkl")
joblib.dump(X_train.columns.tolist(),  OUTPUT_DIR / "feature_columns_final.pkl")

metadata = {
    "model_name": "RandomForestClassifier",
    "version": "v3_final",
    "accuracy": acc,
    "roc_auc": auc,
    "feature_count": len(X_train.columns),
    "categorical_cols": CATEGORICAL_COLS,
    "feature_columns": X_train.columns.tolist()
}
with open(OUTPUT_DIR / "model_metadata.json", "w") as f:
    json.dump(metadata, f, indent=2)

print("\n✅ All files saved to app/models/:")
for f in sorted(OUTPUT_DIR.iterdir()):
    print(f"   {f.name}  —  {f.stat().st_size/1024:.1f} KB")

print("\n🎉 Training complete! Ready for Phase 2.")
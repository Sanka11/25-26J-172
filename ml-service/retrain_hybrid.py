import pandas as pd
import numpy as np
import joblib
import json
import os
import warnings
warnings.filterwarnings('ignore')

from sklearn.ensemble import RandomForestClassifier, VotingClassifier, GradientBoostingClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import train_test_split, StratifiedKFold, cross_val_score
from sklearn.metrics import accuracy_score, roc_auc_score, classification_report
from sklearn.preprocessing import LabelEncoder
from xgboost import XGBClassifier
from lightgbm import LGBMClassifier
import shap

# ── 1. Load dataset ──────────────────────────────────────────────────────────
CSV_PATH = "Processed_Student_Performance (1).csv"
df = pd.read_csv(CSV_PATH)
print(f"✅ Dataset loaded: {df.shape}")

# ── 2. Features & target ─────────────────────────────────────────────────────
FEATURES = [
    'Gender', 'Age', 'Department', 'Attendance_pct', 'Midterm_Score',
    'Final_Score', 'Assignments_Avg', 'Quizzes_Avg', 'Participation_Score',
    'Projects_Score', 'Study_Hours_per_Week', 'Extracurricular_Activities',
    'Internet_Access_at_Home', 'Parent_Education_Level', 'Family_Income_Level',
    'Stress_Level_1-10', 'Sleep_Hours_per_Night'
]
TARGET = 'risk_label'

df = df[FEATURES + [TARGET]].dropna()
X_raw = df[FEATURES]
y = df[TARGET]

print(f"Class distribution:\n{y.value_counts()}")

# ── 3. Encode categoricals ────────────────────────────────────────────────────
cat_cols = X_raw.select_dtypes(include='object').columns.tolist()
encoders = {}
X = X_raw.copy()
for col in cat_cols:
    le = LabelEncoder()
    X[col] = le.fit_transform(X[col].astype(str))
    encoders[col] = le

X = pd.get_dummies(X, columns=[], drop_first=False)
feature_columns = X.columns.tolist()
print(f"Encoded shape: {X.shape}")

# ── 4. Train/test split ───────────────────────────────────────────────────────
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42, stratify=y
)
print(f"Train: {X_train.shape}  Test: {X_test.shape}")

# ── 5. Define hybrid ensemble ─────────────────────────────────────────────────
rf = RandomForestClassifier(
    n_estimators=300, max_depth=12, min_samples_leaf=2,
    class_weight='balanced', random_state=42, n_jobs=-1
)

xgb = XGBClassifier(
    n_estimators=300, max_depth=6, learning_rate=0.05,
    subsample=0.8, colsample_bytree=0.8,
    scale_pos_weight=4, random_state=42,
    eval_metric='logloss', verbosity=0
)

lgbm = LGBMClassifier(
    n_estimators=300, max_depth=6, learning_rate=0.05,
    subsample=0.8, colsample_bytree=0.8,
    class_weight='balanced', random_state=42, verbose=-1
)

hybrid = VotingClassifier(
    estimators=[('rf', rf), ('xgb', xgb), ('lgbm', lgbm)],
    voting='soft',
    weights=[2, 2, 1]
)

print("⏳ Training Hybrid Ensemble (RF + XGBoost + LightGBM)...")
hybrid.fit(X_train, y_train)

# ── 6. Evaluate ───────────────────────────────────────────────────────────────
y_pred = hybrid.predict(X_test)
y_prob = hybrid.predict_proba(X_test)[:, 1]

acc = accuracy_score(y_test, y_pred)
auc = roc_auc_score(y_test, y_prob)

print(f"\n── Hybrid Model Results ──")
print(f"Accuracy : {acc:.3f}")
print(f"ROC-AUC  : {auc:.4f}")
print(classification_report(y_test, y_pred))

# Cross validation
cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
cv_scores = cross_val_score(hybrid, X, y, cv=cv, scoring='roc_auc', n_jobs=-1)
print(f"5-Fold CV AUC: {cv_scores.mean():.4f} ± {cv_scores.std():.4f}")

# ── 7. SHAP explainer on RF component ────────────────────────────────────────
print("\n⏳ Building SHAP explainer...")
rf_model = hybrid.named_estimators_['rf']
explainer = shap.TreeExplainer(rf_model)

sample = X_test.iloc[:50]
shap_values = explainer.shap_values(sample)

if isinstance(shap_values, list):
    sv = np.abs(shap_values[1]).mean(axis=0)
elif shap_values.ndim == 3:
    sv = np.abs(shap_values[:, :, 1]).mean(axis=0)
else:
    sv = np.abs(shap_values).mean(axis=0)

print(f"✅ SHAP passed. Shape: {sv.shape}")
top = pd.Series(sv, index=feature_columns).sort_values(ascending=False).head(5)
print(f"Top 5 risk factors:\n{top}")

# ── 8. Save all files ─────────────────────────────────────────────────────────
os.makedirs("app/models", exist_ok=True)

joblib.dump(hybrid,   "app/models/risk_model_final.pkl")
joblib.dump(explainer,"app/models/shap_explainer_final.pkl")
joblib.dump(feature_columns, "app/models/feature_columns_final.pkl")

metadata = {
    "model_type": "HybridEnsemble_RF_XGB_LGBM",
    "accuracy": round(acc, 4),
    "roc_auc": round(auc, 4),
    "cv_auc_mean": round(cv_scores.mean(), 4),
    "cv_auc_std": round(cv_scores.std(), 4),
    "n_features": len(feature_columns),
    "version": "v4_hybrid"
}
with open("app/models/model_metadata.json", "w") as f:
    json.dump(metadata, f, indent=2)

print(f"\n✅ Hybrid model saved!")
print(f"   Accuracy: {acc:.1%} | AUC: {auc:.4f}")
print(f"🎉 Training complete!")
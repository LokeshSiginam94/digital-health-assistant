import json
from pathlib import Path

import joblib
import numpy as np
import pandas as pd
from sklearn.calibration import CalibratedClassifierCV
from sklearn.ensemble import RandomForestClassifier
from sklearn.feature_selection import SelectFromModel
from sklearn.metrics import accuracy_score, classification_report
from sklearn.model_selection import train_test_split

BASE_DIR = Path(__file__).resolve().parent
DATA_DIR = BASE_DIR / "data"
MODEL_DIR = BASE_DIR / "model"

DATA_PATH = DATA_DIR / "final_symptom_dataset.csv"
MODEL_PATH = MODEL_DIR / "disease_model.pkl"
SYMPTOM_COLUMNS_PATH = MODEL_DIR / "symptom_columns.pkl"
DISEASE_CLASSES_PATH = MODEL_DIR / "disease_classes.pkl"
MODEL_INFO_PATH = MODEL_DIR / "model_info.json"
FEATURE_SELECTOR_PATH = MODEL_DIR / "feature_selector.pkl"

MODEL_DIR.mkdir(parents=True, exist_ok=True)

KEEP_DISEASES = [
    "Dengue",
    "Common Cold",
    "Pneumonia",
    "Migraine",
    "Heart attack",
    "Diabetes",
]

df = pd.read_csv(DATA_PATH)
df["prognosis"] = df["prognosis"].astype(str).str.strip()
df = df[df["prognosis"].isin(KEEP_DISEASES)].copy()

X = df.drop("prognosis", axis=1)
y = df["prognosis"]

X = X.apply(pd.to_numeric, errors="coerce").fillna(0).astype(int)

X_train, X_test, y_train, y_test = train_test_split(
    X,
    y,
    test_size=0.2,
    random_state=42,
    stratify=y
)

base_selector_model = RandomForestClassifier(
    n_estimators=300,
    random_state=42,
    class_weight="balanced",
    n_jobs=-1
)
base_selector_model.fit(X_train, y_train)

selector = SelectFromModel(base_selector_model, prefit=True, threshold="median")
X_train_sel = selector.transform(X_train)
X_test_sel = selector.transform(X_test)

selected_columns = X.columns[selector.get_support()].tolist()

rf = RandomForestClassifier(
    n_estimators=500,
    max_depth=14,
    min_samples_leaf=2,
    random_state=42,
    class_weight="balanced",
    n_jobs=-1
)

calibrated_model = CalibratedClassifierCV(rf, method="sigmoid", cv=3)
calibrated_model.fit(X_train_sel, y_train)

y_pred = calibrated_model.predict(X_test_sel)
y_prob = calibrated_model.predict_proba(X_test_sel)

accuracy = accuracy_score(y_test, y_pred)

print("Class counts:")
print(y.value_counts())
print("Original feature count:", X.shape[1])
print("Selected feature count:", len(selected_columns))
print("Train shape:", X_train_sel.shape)
print("Test shape:", X_test_sel.shape)
print("Accuracy:", accuracy)
print(classification_report(y_test, y_pred, zero_division=0))

joblib.dump(calibrated_model, MODEL_PATH)
joblib.dump(selected_columns, SYMPTOM_COLUMNS_PATH)
joblib.dump(list(calibrated_model.classes_), DISEASE_CLASSES_PATH)
joblib.dump(selector, FEATURE_SELECTOR_PATH)

top3_correct = 0
for i, probs in enumerate(y_prob):
    top3_idx = np.argsort(probs)[::-1][:3]
    top3_labels = calibrated_model.classes_[top3_idx]
    if y_test.iloc[i] in top3_labels:
        top3_correct += 1

top3_accuracy = top3_correct / len(y_test) if len(y_test) else 0

model_info = {
    "selected_model": "calibrated_random_forest",
    "accuracy": round(float(accuracy), 4),
    "top3_accuracy": round(float(top3_accuracy), 4),
    "rows": int(len(df)),
    "diseases": int(df["prognosis"].nunique()),
    "original_symptoms": int(X.shape[1]),
    "selected_symptoms": int(len(selected_columns)),
    "kept_diseases": KEEP_DISEASES,
}

with open(MODEL_INFO_PATH, "w", encoding="utf-8") as f:
    json.dump(model_info, f, indent=2)

print(f"Saved: {MODEL_PATH}")
print(f"Saved: {SYMPTOM_COLUMNS_PATH}")
print(f"Saved: {DISEASE_CLASSES_PATH}")
print(f"Saved: {FEATURE_SELECTOR_PATH}")
print(f"Saved: {MODEL_INFO_PATH}")
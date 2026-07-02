import os
import pandas as pd
import joblib
from sklearn.model_selection import train_test_split, StratifiedKFold, cross_val_score
from sklearn.ensemble import RandomForestClassifier
from sklearn.calibration import CalibratedClassifierCV
from sklearn.metrics import accuracy_score, balanced_accuracy_score, classification_report

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_PATH = os.path.join(BASE_DIR, "Diseases_and_Symptoms_dataset.csv")
MODEL_PATH = os.path.join(BASE_DIR, "disease_model.pkl")
SYMPTOM_COLUMNS_PATH = os.path.join(BASE_DIR, "symptom_columns.pkl")
DISEASE_CLASSES_PATH = os.path.join(BASE_DIR, "disease_classes.pkl")

df = pd.read_csv(DATA_PATH)
df.columns = df.columns.str.strip()
df = df.loc[:, ~df.columns.str.contains("^Unnamed")]
df = df.drop_duplicates()

if "diseases" not in df.columns:
    raise ValueError("Dataset must contain a 'diseases' column")

df = df.fillna(0)

X = df.drop("diseases", axis=1)
y = df["diseases"]

for col in X.columns:
    if X[col].dtype == "object":
        X[col] = X[col].astype(str).str.strip()
    X[col] = pd.to_numeric(X[col], errors="coerce").fillna(0).astype(int)

print("Dataset shape:", df.shape)
print("Number of diseases:", y.nunique())
print("Top diseases:", y.value_counts().head(10).to_dict())

base_model = RandomForestClassifier(
    n_estimators=250,
    max_depth=20,
    min_samples_split=4,
    min_samples_leaf=2,
    random_state=42,
    n_jobs=-1,
    class_weight="balanced_subsample"
)

cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
cv_scores = cross_val_score(base_model, X, y, cv=cv, scoring="accuracy")

print("CV scores:", cv_scores)
print("Mean CV accuracy:", round(cv_scores.mean(), 4))

X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42, stratify=y
)

calibrated_model = CalibratedClassifierCV(
    estimator=base_model,
    method="sigmoid",
    cv=3
)

calibrated_model.fit(X_train, y_train)

y_pred = calibrated_model.predict(X_test)

accuracy = accuracy_score(y_test, y_pred)
balanced_acc = balanced_accuracy_score(y_test, y_pred)

print("Test Accuracy:", round(accuracy, 4))
print("Balanced Accuracy:", round(balanced_acc, 4))
print(classification_report(y_test, y_pred))

joblib.dump(calibrated_model, MODEL_PATH)
joblib.dump(list(X.columns), SYMPTOM_COLUMNS_PATH)
joblib.dump(sorted(y.unique().tolist()), DISEASE_CLASSES_PATH)

print("Saved model to:", MODEL_PATH)
print("Saved symptom columns to:", SYMPTOM_COLUMNS_PATH)
print("Saved disease classes to:", DISEASE_CLASSES_PATH)
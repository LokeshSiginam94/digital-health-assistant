import pandas as pd
import numpy as np

df = pd.read_csv("data/cleaned_training.csv")

target = "prognosis"

feature_cols = [c for c in df.columns if c != target]

X = df[feature_cols].copy()

for col in X.columns:
    X[col] = pd.to_numeric(X[col], errors="coerce")

X = X.fillna(0)

symptom_frequency = X.sum(numeric_only=True).sort_values(ascending=False)

print(symptom_frequency.head(50))

symptom_frequency.to_csv("data/symptom_frequency.csv")
print("Saved: data/symptom_frequency.csv")
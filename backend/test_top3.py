import pandas as pd
import joblib
import numpy as np

model = joblib.load("data/disease_model.pkl")
df = pd.read_csv("data/final_symptom_dataset.csv")

X_cols = [c for c in df.columns if c != "prognosis"]

def predict_top3(symptoms):
    sample = {col: 0 for col in X_cols}
    for s in symptoms:
        s = s.strip().lower().replace(" ", "_")
        if s in sample:
            sample[s] = 1

    sample_df = pd.DataFrame([sample])
    probs = model.predict_proba(sample_df)[0]
    classes = model.classes_

    top3_idx = np.argsort(probs)[::-1][:3]

    print("\nTop 3 Likely Diseases:")
    for rank, i in enumerate(top3_idx, 1):
        print(f"{rank}. {classes[i]} - {round(probs[i]*100, 2)}%")

if __name__ == "__main__":
    symptoms = input("Enter 5+ symptoms separated by comma: ").split(",")
    predict_top3(symptoms)
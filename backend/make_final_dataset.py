from pathlib import Path

import pandas as pd

BASE_DIR = Path(__file__).resolve().parent
INPUT_PATH = BASE_DIR / "data" / "cleaned_training.csv"
OUTPUT_PATH = BASE_DIR / "data" / "final_symptom_dataset.csv"

df = pd.read_csv(INPUT_PATH)

if "prognosis" not in df.columns:
    raise ValueError("cleaned_training.csv must contain a prognosis column")

symptom_columns = [c for c in df.columns if c != "prognosis"]

binary_df = df.copy()

for col in symptom_columns:
    binary_df[col] = pd.to_numeric(binary_df[col], errors="coerce").fillna(0)
    binary_df[col] = (binary_df[col] > 0).astype(int)

class_counts = binary_df["prognosis"].value_counts()
valid_classes = class_counts[class_counts >= 2].index
binary_df = binary_df[binary_df["prognosis"].isin(valid_classes)].copy()

ordered_columns = symptom_columns + ["prognosis"]
final_df = binary_df[ordered_columns]

print("Total symptom columns:", len(symptom_columns))
print("Available symptom columns:", symptom_columns)
print("Class counts after filtering:")
print(final_df["prognosis"].value_counts())
print("Final shape:", final_df.shape)

final_df.to_csv(OUTPUT_PATH, index=False)
print(f"Saved: {OUTPUT_PATH}")
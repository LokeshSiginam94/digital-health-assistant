from pathlib import Path

import pandas as pd

BASE_DIR = Path(__file__).resolve().parent
INPUT_PATH = BASE_DIR / "data" / "training.csv"
OUTPUT_PATH = BASE_DIR / "data" / "cleaned_training.csv"

df = pd.read_csv(INPUT_PATH)

original_shape = df.shape

df.columns = (
    df.columns
    .str.strip()
    .str.lower()
    .str.replace(" ", "_", regex=False)
)

if "prognosis" not in df.columns:
    raise ValueError("training.csv must contain a prognosis column")

for col in df.columns:
    if df[col].dtype == "object":
        df[col] = df[col].astype(str).str.strip()

df["prognosis"] = df["prognosis"].astype(str).str.strip()
df = df[df["prognosis"].notna()]
df = df[df["prognosis"].str.lower() != "nan"]

for col in df.columns:
    if col != "prognosis":
        df[col] = pd.to_numeric(df[col], errors="coerce").fillna(0)
        df[col] = (df[col] > 0).astype(int)

df = df.fillna(0)

df.to_csv(OUTPUT_PATH, index=False)

print("Original shape:", original_shape)
print("Cleaned shape:", df.shape)
print("Saved to", OUTPUT_PATH)
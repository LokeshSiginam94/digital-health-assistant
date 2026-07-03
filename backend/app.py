import os
import re
import json
import datetime
from pathlib import Path
from functools import wraps
from typing import Dict, List, Tuple, Any

import joblib
import jwt
import numpy as np
import pandas as pd
from dotenv import load_dotenv
from flask import Flask, jsonify, request, g
from flask_bcrypt import Bcrypt
from flask_cors import CORS
from pymongo import MongoClient
from pymongo.errors import PyMongoError, DuplicateKeyError

load_dotenv()

BASE_DIR = Path(__file__).resolve().parent
MODEL_DIR = BASE_DIR / "model"

MODEL_PATH = MODEL_DIR / "disease_model.pkl"
SYMPTOM_COLUMNS_PATH = MODEL_DIR / "symptom_columns.pkl"
DISEASE_CLASSES_PATH = MODEL_DIR / "disease_classes.pkl"
MODEL_INFO_PATH = MODEL_DIR / "model_info.json"
ENCODERS_PATH = MODEL_DIR / "encoders.pkl"

MONGO_URI = os.getenv("MONGO_URI", "").strip()
DB_NAME = os.getenv("DB_NAME", "healthcare_db").strip() or "healthcare_db"
JWT_SECRET = os.getenv("JWT_SECRET", "change-me-in-env").strip()

app = Flask(__name__)
app.config["JSON_SORT_KEYS"] = False

CORS(
    app,
    resources={r"/*": {"origins": "*"}},
    supports_credentials=False,
    methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization"],
)

bcrypt = Bcrypt(app)

mongo_client = None
db = None
users_collection = None
auth_db_connected = False
auth_db_error = None

try:
    if MONGO_URI:
        print("Connecting to MongoDB Atlas...")
        print("Using DB:", DB_NAME)
        print(
            "URI starts with:",
            MONGO_URI[:35] + "..." if len(MONGO_URI) > 35 else MONGO_URI,
        )
        mongo_client = MongoClient(MONGO_URI, serverSelectionTimeoutMS=8000)
        mongo_client.admin.command("ping")
        db = mongo_client[DB_NAME]
        users_collection = db["users"]
        users_collection.create_index("email", unique=True)
        auth_db_connected = True
        print("MongoDB Atlas connected successfully.")
    else:
        auth_db_error = "MONGO_URI is missing in .env"
        print("MongoDB error:", auth_db_error)
except Exception as e:
    auth_db_connected = False
    auth_db_error = str(e)
    print("MongoDB connection failed:", auth_db_error)

if not MODEL_PATH.exists():
    raise FileNotFoundError(f"Missing model file: {MODEL_PATH}")
if not SYMPTOM_COLUMNS_PATH.exists():
    raise FileNotFoundError(f"Missing symptom columns file: {SYMPTOM_COLUMNS_PATH}")
if not DISEASE_CLASSES_PATH.exists():
    raise FileNotFoundError(f"Missing disease classes file: {DISEASE_CLASSES_PATH}")
if not ENCODERS_PATH.exists():
    raise FileNotFoundError(f"Missing encoders file: {ENCODERS_PATH}")

model = joblib.load(MODEL_PATH)
symptom_columns = joblib.load(SYMPTOM_COLUMNS_PATH)
saved_disease_classes = joblib.load(DISEASE_CLASSES_PATH)
encoders: Dict[str, Any] = joblib.load(ENCODERS_PATH)

if MODEL_INFO_PATH.exists():
    with open(MODEL_INFO_PATH, "r", encoding="utf-8") as f:
        model_info = json.load(f)
else:
    model_info = {}

symptom_columns = [str(x).strip() for x in symptom_columns]

if hasattr(model, "classes_") and model.classes_ is not None:
    disease_classes = [str(x).strip() for x in list(model.classes_)]
else:
    disease_classes = [str(x).strip() for x in saved_disease_classes]

DISPLAY_NAME_MAP = {
    "urinary tract infection": "Urine infection",
    "uti": "Urine infection",
    "common cold": "Common cold",
    "gastroesophageal reflux disease": "Acid reflux",
    "gerd": "Acid reflux",
    "hypertension": "High blood pressure",
    "bronchial asthma": "Asthma",
    "asthma": "Asthma",
    "peptic ulcer disease": "Peptic ulcer",
    "cervical spondylosis": "Neck spondylosis",
    "drug reaction": "Medicine reaction",
    "fungal infection": "Fungal skin infection",
    "dimorphic hemmorhoids(piles)": "Piles",
    "paralysis (brain hemorrhage)": "Stroke-related paralysis",
    "chronic obstructive pulmonary disease (copd)": "COPD",
    "copd": "COPD",
    "influenza": "Flu",
    "flu": "Flu",
}

SYMPTOM_ALIASES = {
    "breathlessness": "shortness of breath",
    "short breath": "shortness of breath",
    "breathing trouble": "difficulty breathing",
    "chest pain": "sharp chest pain",
    "burning urine": "painful urination",
    "pain while urinating": "painful urination",
    "burning micturition": "painful urination",
    "loose motions": "diarrhea",
    "loose motion": "diarrhea",
    "stomach pain": "sharp abdominal pain",
    "belly pain": "sharp abdominal pain",
    "tiredness": "fatigue",
    "body pain": "ache all over",
    "runny nose": "coryza",
    "passing out": "fainting",
    "black stool": "melena",
    "cough with sputum": "coughing up sputum",
    "heart racing": "increased heart rate",
    "high pulse": "increased heart rate",
    "low pulse": "decreased heart rate",
    "itchy eyes": "itchiness of eye",
    "red eyes": "eye redness",
    "itchy skin": "itching of skin",
    "rash": "skin rash",
    "head pain": "headache",
    "blurred vision": "diminished vision",
    "lower back pain": "low back pain",
    "painful periods": "painful menstruation",
    "frequent pee": "frequent urination",
    "weak": "weakness",
    "vomit": "vomiting",
    "feeling dizzy": "dizziness",
    "high fever": "fever",
    "mild fever": "fever",
    "yellowish skin": "yellowing of skin",
    "yellowing of eyes": "yellow eyes",
    "dark urine": "dark urine",
    "loss of appetite": "decreased appetite",
    "abdominal pain": "sharp abdominal pain",
    "skin rash": "skin rash",
}

SYMPTOM_CATEGORIES = {
    "General": [
        "fever",
        "fatigue",
        "weakness",
        "chills",
        "sweating",
        "feeling ill",
        "decreased appetite",
        "sleepiness",
        "restlessness",
        "ache all over",
    ],
    "Breathing and Chest": [
        "cough",
        "shortness of breath",
        "difficulty breathing",
        "wheezing",
        "sharp chest pain",
        "chest tightness",
        "congestion in chest",
        "breathing fast",
        "coughing up sputum",
    ],
    "Stomach and Bowel": [
        "nausea",
        "vomiting",
        "diarrhea",
        "constipation",
        "sharp abdominal pain",
        "burning abdominal pain",
        "upper abdominal pain",
        "stomach bloating",
        "blood in stool",
        "melena",
        "heartburn",
        "regurgitation",
    ],
    "Urine and Kidney": [
        "painful urination",
        "frequent urination",
        "blood in urine",
        "retention of urine",
        "low urine output",
        "unusual color or odor to urine",
        "dark urine",
    ],
    "Head and Brain": [
        "headache",
        "dizziness",
        "fainting",
        "seizures",
        "disturbance of memory",
        "loss of sensation",
        "paresthesia",
        "focal weakness",
    ],
    "Ear Nose Throat": ["sore throat", "nasal congestion", "coryza", "hoarse voice"],
    "Bones and Joints": [
        "joint pain",
        "back pain",
        "low back pain",
        "neck pain",
        "shoulder pain",
        "leg pain",
        "hip pain",
        "rib pain",
    ],
    "Skin and Eye": [
        "skin rash",
        "itching of skin",
        "eye redness",
        "itchiness of eye",
        "yellowing of skin",
        "yellow eyes",
    ],
    "Other": [],
}

RED_FLAG_SYMPTOMS = {
    "sharp chest pain",
    "chest tightness",
    "difficulty breathing",
    "shortness of breath",
    "fainting",
    "seizures",
    "blood in stool",
    "blood in urine",
    "melena",
    "loss of sensation",
    "focal weakness",
    "yellowing of skin",
    "yellow eyes",
}

URGENT_COMBINATIONS = [
    {"shortness of breath", "sharp chest pain"},
    {"difficulty breathing", "chest tightness"},
    {"fever", "difficulty breathing"},
    {"fever", "shortness of breath"},
    {"blood in urine", "painful urination", "fever"},
    {"vomiting", "sharp abdominal pain", "fever"},
    {"yellowing of skin", "yellow eyes"},
]

DISCLAIMER_TEXT = (
    "This system provides AI-assisted preliminary disease suggestions and triage support. "
    "It is not a confirmed medical diagnosis."
)

EMAIL_REGEX = re.compile(r"^[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,}$")


def normalize_text(text: Any) -> str:
    text = str(text or "").strip().lower()
    text = text.replace("_", " ")
    text = re.sub(r"[^a-z0-9\s()-]", " ", text)
    text = re.sub(r"\s+", " ", text)
    return text.strip()


def normalize_email(email: Any) -> str:
    return str(email or "").strip().lower()


def prettify_symptom(text: str) -> str:
    return str(text).replace("_", " ").strip().title()


def prettify_name(name: str) -> str:
    key = normalize_text(name)
    if key in DISPLAY_NAME_MAP:
        return DISPLAY_NAME_MAP[key]
    return str(name).replace("_", " ").strip().title()


def make_slug(text: str) -> str:
    text = normalize_text(text)
    text = re.sub(r"[^a-z0-9\s-]", "", text)
    text = re.sub(r"\s+", "-", text)
    return text.strip("-")


def safe_float(value: Any, default: float = 0.0) -> float:
    try:
        return float(value)
    except Exception:
        return default


def deduplicate_preserve_order(items: List[str]) -> List[str]:
    seen = set()
    result = []
    for item in items:
        key = normalize_text(item)
        if key and key not in seen:
            seen.add(key)
            result.append(item)
    return result


def create_jwt_token(user_id: str, email: str) -> str:
    payload = {
        "user_id": str(user_id),
        "email": email,
        "iat": datetime.datetime.utcnow(),
        "exp": datetime.datetime.utcnow() + datetime.timedelta(days=7),
    }
    return jwt.encode(payload, JWT_SECRET, algorithm="HS256")


def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        auth_header = request.headers.get("Authorization", "")
        if not auth_header.startswith("Bearer "):
            return (
                jsonify(
                    {
                        "success": False,
                        "error": "Missing or invalid authorization token",
                    }
                ),
                401,
            )

        token = auth_header.split(" ", 1)[1]

        try:
            payload = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
        except jwt.ExpiredSignatureError:
            return (
                jsonify({"success": False, "error": "Token has expired"}),
                401,
            )
        except jwt.InvalidTokenError:
            return jsonify({"success": False, "error": "Invalid token"}), 401

        g.user_id = payload.get("user_id")
        g.user_email = payload.get("email")
        return f(*args, **kwargs)

    return decorated


def ensure_auth_db():
    if not auth_db_connected or users_collection is None:
        return (
            False,
            jsonify(
                {
                    "success": False,
                    "error": "Authentication database is not connected",
                    "details": auth_db_error,
                }
            ),
            503,
        )
    return True, None, None


SYMPTOM_LOOKUP: Dict[str, str] = {normalize_text(col): col for col in symptom_columns}

categorized_symptoms = set()
for _, category_items in SYMPTOM_CATEGORIES.items():
    for item in category_items:
        categorized_symptoms.add(normalize_text(item))

uncategorized = []
for symptom in symptom_columns:
    if normalize_text(symptom) not in categorized_symptoms:
        uncategorized.append(symptom)

SYMPTOM_CATEGORIES["Other"] = sorted(uncategorized, key=lambda x: normalize_text(x))

SYMPTOM_ALPHABETICAL: Dict[str, List[str]] = {}
for symptom in sorted(symptom_columns, key=lambda x: normalize_text(x)):
    first = symptom[0].upper() if symptom and symptom[0].isalpha() else "#"
    SYMPTOM_ALPHABETICAL.setdefault(first, []).append(symptom)


def fuzzy_map_symptom(symptom: str) -> str:
    s = normalize_text(symptom)

    if s in SYMPTOM_ALIASES:
        s = normalize_text(SYMPTOM_ALIASES[s])

    if s in SYMPTOM_LOOKUP:
        return SYMPTOM_LOOKUP[s]

    for key, value in SYMPTOM_LOOKUP.items():
        if s == key or s in key or key in s:
            return value

    s_words = set(s.split())
    best_match = None
    best_score = 0
    for key, value in SYMPTOM_LOOKUP.items():
        key_words = set(key.split())
        overlap = len(s_words.intersection(key_words))
        if overlap > best_score and overlap > 0:
            best_score = overlap
            best_match = value

    return best_match if best_match else s


def parse_symptoms_from_request(payload: Dict[str, Any]) -> List[str]:
    raw = payload.get("symptoms", [])
    if isinstance(raw, str):
        raw = [x.strip() for x in raw.split(",") if x.strip()]
    if not isinstance(raw, list):
        return []
    cleaned = []
    for item in raw:
        s = normalize_text(item)
        if s:
            cleaned.append(s)
    return deduplicate_preserve_order(cleaned)


def build_feature_dataframe(
    user_symptoms: List[str],
) -> Tuple[pd.DataFrame, List[str], List[str], List[str]]:
    row = {col: 0 for col in symptom_columns}
    matched = []
    unmatched = []
    canonical = []

    for symptom in user_symptoms:
        canon = fuzzy_map_symptom(symptom)
        canon_norm = normalize_text(canon)

        if canon_norm in SYMPTOM_LOOKUP:
            actual_col = SYMPTOM_LOOKUP[canon_norm]
            row[actual_col] = 1
            matched.append(actual_col)
            canonical.append(actual_col)
        else:
            unmatched.append(symptom)

    matched = deduplicate_preserve_order(matched)
    canonical = deduplicate_preserve_order(canonical)
    unmatched = deduplicate_preserve_order(unmatched)

    df = pd.DataFrame([row], columns=symptom_columns).astype("int8")
    return df, matched, unmatched, canonical


def build_feature_vector_with_encoders(
    selected_symptoms: List[str],
    severity: str = "moderate",
    age_group: str = "adult",
    triage: str = "routine",
) -> List[int]:
    features = [0] * len(symptom_columns)
    col_index = {col: idx for idx, col in enumerate(symptom_columns)}

    for symptom in selected_symptoms:
        if symptom in col_index:
            features[col_index[symptom]] = 1

    if "symptom_count" in col_index:
        features[col_index["symptom_count"]] = len(selected_symptoms)

    if "severity" in col_index and "severity" in encoders:
        features[col_index["severity"]] = encoders["severity"].transform([severity])[0]

    if "age_group" in col_index and "age_group" in encoders:
        features[col_index["age_group"]] = encoders["age_group"].transform([age_group])[0]

    if "triage" in col_index and "triage" in encoders:
        features[col_index["triage"]] = encoders["triage"].transform([triage])[0]

    return features


def get_red_flags(matched_symptoms: List[str]) -> List[str]:
    return [s for s in matched_symptoms if normalize_text(s) in RED_FLAG_SYMPTOMS]


def detect_urgent_combination(matched_symptoms: List[str]) -> bool:
    matched_set = {normalize_text(s) for s in matched_symptoms}
    for combo in URGENT_COMBINATIONS:
        if combo.issubset(matched_set):
            return True
    return False


def rerank_predictions(
    probabilities: np.ndarray, matched_symptoms: List[str], top_n: int = 5
) -> List[Dict[str, Any]]:
    probabilities = np.asarray(probabilities, dtype=float)

    model_classes = disease_classes
    if len(model_classes) != len(probabilities):
        model_classes = [
            str(x).strip() for x in getattr(model, "classes_", disease_classes)
        ]

    indices = np.argsort(probabilities)[::-1][:top_n]

    results = []
    for rank, idx in enumerate(indices, start=1):
        raw_label = model_classes[idx]
        base_prob = safe_float(probabilities[idx])

        severity = "mild"
        if base_prob >= 0.55:
            severity = "moderate"
        if base_prob >= 0.75:
            severity = "higher"

        triage = "routine"
        if len(matched_symptoms) >= 3 and base_prob >= 0.45:
            triage = "consult"
        if detect_urgent_combination(matched_symptoms) or len(
            get_red_flags(matched_symptoms)
        ) > 0:
            triage = "urgent"

        results.append(
            {
                "rank": rank,
                "raw_label": raw_label,
                "disease": prettify_name(raw_label),
                "display_name": prettify_name(raw_label),
                "probability": round(base_prob, 4),
                "adjusted_score": round(base_prob, 4),
                "confidence_percent": round(base_prob * 100, 2),
                "severity": severity,
                "triage": triage,
                "estimated_duration": "2-7 days"
                if base_prob >= 0.30
                else "Not clear",
                "common_symptoms": [
                    prettify_symptom(x) for x in matched_symptoms[:5]
                ],
                "home_care_tips": [],
                "warning_signs": [
                    prettify_symptom(x) for x in get_red_flags(matched_symptoms)
                ],
            }
        )

    return results


def build_model_summary() -> Dict[str, Any]:
    return {
        "selected_model": model_info.get("selected_model"),
        "validation_accuracy": model_info.get("accuracy"),
        "validation_weighted_f1": model_info.get("weighted_f1"),
        "validation_macro_f1": model_info.get("macro_f1"),
        "validation_top3_accuracy": model_info.get("top3_accuracy"),
        "top3_accuracy": model_info.get("top3_accuracy"),
        "training_rows": model_info.get("rows"),
        "rows": model_info.get("rows"),
        "disease_count": model_info.get("diseases"),
        "symptom_count": model_info.get("symptoms"),
    }


def search_symptoms(query: str, limit: int = 20) -> List[str]:
    query = normalize_text(query)
    if not query:
        return []

    results = []
    for symptom in symptom_columns:
        norm = normalize_text(symptom)
        score = 0

        if norm == query:
            score += 100
        if norm.startswith(query):
            score += 60
        if query in norm:
            score += 40

        query_words = set(query.split())
        symptom_words = set(norm.split())
        score += len(query_words.intersection(symptom_words)) * 10

        for alias, target in SYMPTOM_ALIASES.items():
            if query in alias and normalize_text(target) == norm:
                score += 35

        if score > 0:
            results.append((score, symptom))

    results.sort(key=lambda x: (-x[0], normalize_text(x[1])))
    return [item[1] for item in results[:limit]]


def get_category_for_symptom(symptom: str) -> str:
    symptom_norm = normalize_text(symptom)
    for category, items in SYMPTOM_CATEGORIES.items():
        normalized_items = {normalize_text(x) for x in items}
        if symptom_norm in normalized_items:
            return category
    return "Other"


@app.route("/", methods=["GET"])
def home():
    return jsonify(
        {
            "message": "Smart Preventive Healthcare System API is running",
            "status": "ok",
            "disclaimer": DISCLAIMER_TEXT,
            "auth_db_connected": auth_db_connected,
            "auth_db_error": auth_db_error,
        }
    )


@app.route("/health", methods=["GET"])
def health():
    return jsonify(
        {
            "status": "ok",
            "api_ready": True,
            "model_loaded": model is not None,
            "symptom_count": len(symptom_columns),
            "disease_count": len(disease_classes),
            "has_model_info": bool(model_info),
            "selected_model": model_info.get("selected_model"),
            "actual_model_type": type(model).__name__,
            "auth_db_connected": auth_db_connected,
            "auth_db_error": auth_db_error,
        }
    )


@app.route("/register", methods=["POST", "OPTIONS"])
def register():
    ok, response, status = ensure_auth_db()
    if not ok:
        return response, status

    if request.method == "OPTIONS":
        return jsonify({"success": True, "message": "Preflight OK"}), 200

    data = request.get_json(silent=True)
    if not data:
        return jsonify(
            {
                "success": False,
                "error": "Request body is missing or invalid JSON",
            }
        ), 400

    full_name = str(data.get("full_name", "")).strip()
    email = normalize_email(data.get("email", ""))
    password = str(data.get("password", "")).strip()
    confirm_password = str(data.get("confirm_password", "")).strip()

    if not full_name:
        return jsonify({"success": False, "error": "Full name is required"}), 400
    if not email:
        return jsonify({"success": False, "error": "Email is required"}), 400
    if not EMAIL_REGEX.fullmatch(email):
        return jsonify({"success": False, "error": "Valid email is required"}), 400
    if len(password) < 6:
        return jsonify(
            {
                "success": False,
                "error": "Password must be at least 6 characters",
            }
        ), 400
    if not confirm_password:
        return jsonify(
            {"success": False, "error": "Confirm password is required"}
        ), 400
    if password != confirm_password:
        return jsonify(
            {"success": False, "error": "Passwords do not match"}
        ), 400

    try:
        existing_user = users_collection.find_one({"email": email})
        if existing_user:
            return jsonify(
                {
                    "success": False,
                    "error": "User already exists with this email",
                }
            ), 409

        password_hash = bcrypt.generate_password_hash(password).decode("utf-8")

        user_doc = {
            "full_name": full_name,
            "email": email,
            "password_hash": password_hash,
            "created_at": datetime.datetime.utcnow(),
            "last_login_at": None,
            "is_active": True,
        }

        result = users_collection.insert_one(user_doc)
        token = create_jwt_token(str(result.inserted_id), email)

        return jsonify(
            {
                "success": True,
                "message": "Registration successful",
                "token": token,
                "user": {
                    "id": str(result.inserted_id),
                    "full_name": full_name,
                    "email": email,
                },
            }
        ), 201

    except DuplicateKeyError:
        return jsonify(
            {"success": False, "error": "User already exists with this email"}
        ), 409
    except PyMongoError as e:
        return jsonify(
            {
                "success": False,
                "error": "Database error during registration",
                "details": str(e),
            }
        ), 500
    except Exception as e:
        return jsonify(
            {
                "success": False,
                "error": "Unexpected registration error",
                "details": str(e),
            }
        ), 500


@app.route("/login", methods=["POST", "OPTIONS"])
def login():
    ok, response, status = ensure_auth_db()
    if not ok:
        return response, status

    if request.method == "OPTIONS":
        return jsonify({"success": True, "message": "Preflight OK"}), 200

    data = request.get_json(silent=True)
    if not data:
        return jsonify(
            {
                "success": False,
                "error": "Request body is missing or invalid JSON",
            }
        ), 400

    email = normalize_email(data.get("email", ""))
    password = str(data.get("password", "")).strip()

    if not email:
        return jsonify({"success": False, "error": "Email is required"}), 400
    if not EMAIL_REGEX.fullmatch(email):
        return jsonify({"success": False, "error": "Valid email is required"}), 400
    if not password:
        return jsonify({"success": False, "error": "Password is required"}), 400

    try:
        user = users_collection.find_one({"email": email})

        if not user:
            return jsonify(
                {"success": False, "error": "Invalid email or password"}
            ), 401
        if not user.get("is_active", True):
            return jsonify(
                {"success": False, "error": "This account is inactive"}
            ), 403
        if not bcrypt.check_password_hash(user["password_hash"], password):
            return jsonify(
                {"success": False, "error": "Invalid email or password"}
            ), 401

        users_collection.update_one(
            {"_id": user["_id"]},
            {"$set": {"last_login_at": datetime.datetime.utcnow()}},
        )

        token = create_jwt_token(str(user["_id"]), email)

        return jsonify(
            {
                "success": True,
                "message": "Login successful",
                "token": token,
                "user": {
                    "id": str(user["_id"]),
                    "full_name": user.get("full_name", ""),
                    "email": user["email"],
                },
            }
        ), 200

    except PyMongoError as e:
        return jsonify(
            {
                "success": False,
                "error": "Database error during login",
                "details": str(e),
            }
        ), 500
    except Exception as e:
        return jsonify(
            {
                "success": False,
                "error": "Unexpected login error",
                "details": str(e),
            }
        ), 500


@app.route("/profile", methods=["GET"])
@token_required
def profile():
    ok, response, status = ensure_auth_db()
    if not ok:
        return response, status

    try:
        user = users_collection.find_one({"email": g.user_email})
        if not user:
            return jsonify({"success": False, "error": "User not found"}), 404

        return jsonify(
            {
                "success": True,
                "user": {
                    "id": str(user["_id"]),
                    "full_name": user.get("full_name", ""),
                    "email": user["email"],
                    "created_at": user.get("created_at").isoformat()
                    if user.get("created_at")
                    else None,
                    "last_login_at": user.get("last_login_at").isoformat()
                    if user.get("last_login_at")
                    else None,
                },
            }
        ), 200
    except Exception as e:
        return jsonify(
            {
                "success": False,
                "error": "Unexpected profile error",
                "details": str(e),
            }
        ), 500


@app.route("/model-info", methods=["GET"])
def get_model_info():
    return jsonify(
        {
            "success": True,
            "model_summary": build_model_summary(),
            "disclaimer": DISCLAIMER_TEXT,
        }
    )


@app.route("/symptoms", methods=["GET"])
def get_symptoms():
    return jsonify(
        {
            "success": True,
            "count": len(symptom_columns),
            "symptoms": symptom_columns,
        }
    )


@app.route("/symptoms/examples", methods=["GET"])
def get_symptom_examples():
    examples = [
        "fever",
        "cough",
        "fatigue",
        "headache",
        "sore throat",
        "shortness of breath",
        "nausea",
        "vomiting",
        "diarrhea",
        "painful urination",
        "frequent urination",
        "sharp abdominal pain",
    ]
    return jsonify(
        {
            "success": True,
            "count": len(examples),
            "examples": examples,
        }
    )


@app.route("/symptoms/search", methods=["GET"])
def symptom_search():
    query = request.args.get("q", "").strip()
    limit = request.args.get("limit", default=20, type=int)
    limit = max(1, min(limit, 50))
    results = search_symptoms(query, limit=limit)

    return jsonify(
        {
            "query": query,
            "count": len(results),
            "results": [
                {
                    "symptom": s,
                    "display_name": prettify_symptom(s),
                    "slug": make_slug(s),
                    "category": get_category_for_symptom(s),
                }
                for s in results
            ],
        }
    )


@app.route("/symptoms/categories", methods=["GET"])
def symptom_categories():
    payload = {}
    for category, items in SYMPTOM_CATEGORIES.items():
        payload[category] = sorted(items, key=lambda x: normalize_text(x))

    return jsonify(
        {
            "success": True,
            "category_count": len(payload),
            "categories": payload,
        }
    )


@app.route("/symptoms/alphabetical", methods=["GET"])
def symptom_alphabetical():
    return jsonify(
        {
            "success": True,
            "group_count": len(SYMPTOM_ALPHABETICAL),
            "groups": SYMPTOM_ALPHABETICAL,
        }
    )


@app.route("/predict", methods=["POST", "OPTIONS"])
def predict():
    if request.method == "OPTIONS":
        return jsonify({"success": True, "message": "Preflight OK"}), 200

    payload = request.get_json(silent=True)
    if not payload:
        return jsonify(
            {
                "success": False,
                "error": "Request body is missing or invalid JSON",
            }
        ), 400

    user_symptoms = parse_symptoms_from_request(payload)

    if not user_symptoms:
        return jsonify(
            {
                "success": False,
                "error": "No symptoms provided",
                "guidance": "Please send at least one symptom.",
                "check_status": "Please add symptoms before analysis.",
                "important_disclaimer": DISCLAIMER_TEXT,
            }
        ), 400

    features_df, matched, unmatched, canonical = build_feature_dataframe(
        user_symptoms
    )

    if len(matched) == 0:
        return jsonify(
            {
                "success": False,
                "error": "No valid symptoms matched the trained symptom list",
                "entered_symptoms": user_symptoms,
                "matched_symptoms": [],
                "unmatched_symptoms": unmatched,
                "guidance": "Try using symptom names from the available symptom list.",
                "check_status": "No valid symptoms matched the trained model.",
                "important_disclaimer": DISCLAIMER_TEXT,
            }
        ), 400

    try:
        probabilities = model.predict_proba(features_df)[0]
        predictions = rerank_predictions(probabilities, matched, top_n=5)

        red_flags = get_red_flags(matched)
        urgent_combo = detect_urgent_combination(matched)

        triage = "routine"
        if red_flags or urgent_combo:
            triage = "urgent"
        elif len(matched) <= 1:
            triage = "insufficient"
        elif (
            predictions
            and predictions[0]["adjusted_score"] >= 0.5
            and len(matched) >= 3
        ):
            triage = "medical_review"

        top3 = predictions[:3]
        primary = (
            top3[0]["display_name"] if top3 else "No primary suggestion available."
        )
        top_score = round(float(top3[0]["confidence_percent"]), 2) if top3 else 0.0

        if triage == "urgent":
            emergency_guidance = "Urgent attention"
        elif triage == "medical_review":
            emergency_guidance = "Consult a doctor"
        elif len(matched) < 3:
            emergency_guidance = "Add more symptoms"
        else:
            emergency_guidance = "Monitor at home"

        if triage == "urgent":
            severity_indicator = "Higher Risk"
        elif top_score >= 45:
            severity_indicator = "Moderate"
        elif top_score > 0:
            severity_indicator = "Mild"
        else:
            severity_indicator = "Low Evidence"

        response = {
            "success": True,
            "disclaimer": DISCLAIMER_TEXT,
            "important_disclaimer": DISCLAIMER_TEXT,
            "entered_symptoms": user_symptoms,
            "canonical_symptoms": canonical,
            "matched_symptoms": [prettify_symptom(x) for x in matched],
            "unmatched_symptoms": unmatched,
            "matched_symptom_count": len(matched),
            "triage": triage,
            "red_flag_symptoms": red_flags,
            "guidance": "Predictions are ranked suggestions, not a medical diagnosis.",
            "check_status": "Preliminary guidance generated successfully.",
            "top_prediction": top3[0] if top3 else None,
            "predictions": top3,
            "top_3": top3,
            "primary_health_suggestion": primary,
            "result_confidence": {
                "top_ranked_score": top_score,
                "validation_accuracy": model_info.get("accuracy"),
                "top3_validation_accuracy": model_info.get("top3_accuracy"),
                "note": "These are model-ranked suggestions based on matched symptoms.",
            },
            "symptom_pattern_summary": {
                "matched_symptoms_count": len(matched),
                "top_ranked_condition": primary,
                "triage_level": triage,
                "note": f"{len(matched)} symptom(s) matched the trained feature list.",
            },
            "ai_health_risk_score": min(max(int(round(top_score)), 0), 100),
            "symptom_severity_indicator": severity_indicator,
            "emergency_guidance_support": emergency_guidance,
            "warning_signs": [
                f"Urgent attention may be needed for {prettify_symptom(x)}."
                for x in red_flags
            ]
            or [],
            "indian_home_care_tips": [],
            "recovery_planner": [],
            "seasonal_health_alerts": [],
            "model_summary": build_model_summary(),
            "debug": {
                "actual_model_type": type(model).__name__,
                "selected_model_from_info": model_info.get("selected_model"),
                "probability_vector_length": int(len(probabilities)),
                "class_count": int(len(disease_classes)),
                "feature_count": int(features_df.shape[1]),
            },
        }

        return jsonify(response), 200

    except Exception as e:
        return jsonify(
            {
                "success": False,
                "error": "Prediction failed",
                "details": str(e),
                "check_status": "Prediction failed on the backend.",
                "important_disclaimer": DISCLAIMER_TEXT,
            }
        ), 500


if __name__ == "__main__":
    app.run(
        debug=False,
        host="0.0.0.0",
        port=int(os.environ.get("PORT", 5000))
    )
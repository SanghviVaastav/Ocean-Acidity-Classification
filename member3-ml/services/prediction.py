import os
import joblib
import pandas as pd

MODEL_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), "xgboost_acidity_model.pkl")

# Load model globally for service
if not os.path.exists(MODEL_PATH):
    raise FileNotFoundError(f"Model file not found at {MODEL_PATH}")
model = joblib.load(MODEL_PATH)
try:
    expected_features = model.get_booster().feature_names
except Exception:
    expected_features = None

def get_expected_features():
    return expected_features

def validate_input(data: dict):
    if not expected_features:
        return True, ""
    
    missing = [f for f in expected_features if f not in data]
    if missing:
        return False, f"Missing required features: {missing}"
    
    # Type validation: ensure all expected features are numeric
    invalid_types = []
    for f in expected_features:
        val = data.get(f)
        if not isinstance(val, (int, float)):
            invalid_types.append(f"{f} (expected numeric, got {type(val).__name__})")
    
    if invalid_types:
        return False, f"Invalid data types for features: {', '.join(invalid_types)}"
        
    return True, ""

def predict_single(data: dict):
    # Convert dict to DataFrame (single row)
    df_input = pd.DataFrame([data])
    if expected_features:
         # Ensure order matches what the model expects
         df_input = df_input[expected_features]
    prediction = model.predict(df_input)
    # Convert float32/int64 to native python types
    return prediction[0].item() if hasattr(prediction[0], "item") else prediction[0]

def predict_batch(df: pd.DataFrame):
    # Validated earlier, predict for entire DataFrame
    if expected_features:
        missing = [f for f in expected_features if f not in df.columns]
        if missing:
            raise ValueError(f"Missing columns in batch CSV: {missing}")
        df = df[expected_features]
    predictions = model.predict(df)
    return [p.item() if hasattr(p, "item") else p for p in predictions]

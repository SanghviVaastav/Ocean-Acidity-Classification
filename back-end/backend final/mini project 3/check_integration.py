import joblib
import os
import pandas as pd

model_path = "xgboost_acidity_model.pkl"
if os.path.exists(model_path):
    try:
        model = joblib.load(model_path)
        print("Model loaded successfully")
        if hasattr(model, 'get_booster'):
            print(f"Booster features: {model.get_booster().feature_names}")
        if hasattr(model, 'feature_names_in_'):
            print(f"Feature names in: {model.feature_names_in_}")
        
        # Test with a dummy row
        # We'll get columns from the CSV first
        df_sample = pd.read_csv("ocean_acidity_preprocessed.csv", nrows=1)
        print(f"CSV Columns: {df_sample.columns.tolist()}")
        
        # Prediction test
        # Note: We need to drop the target column if any.
        # Assuming last column or something named 'acidity' etc.
        # Let's just print the columns for now.
    except Exception as e:
        print(f"Error: {e}")
else:
    print("Model not found")

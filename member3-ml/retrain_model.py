"""
retrain_model.py — Retrain the XGBoost acidity classifier with class balancing.

Run from the back-end directory:
    python retrain_model.py

Improvements over the original model:
  - Full 150k dataset
  - sample_weight='balanced'  → fixes Critical class under-representation
  - Tuned hyperparameters for OOD generalization
  - Stratified train/test split evaluation before saving
  - Backs up existing model first
"""

import os, shutil, time
import pandas as pd
import numpy as np
import joblib
from xgboost import XGBClassifier
from sklearn.model_selection import train_test_split
from sklearn.utils.class_weight import compute_sample_weight
from sklearn.metrics import classification_report, accuracy_score, f1_score

# ── Config ──────────────────────────────────────────────────────
CSV_PATH   = "../ocean_acidity_preprocessed.csv"
MODEL_PATH = "../xgboost_acidity_model.pkl"
BACKUP     = "../xgboost_acidity_model_backup.pkl"
LABEL_MAP  = {0: "Critical", 1: "Safe", 2: "Vulnerable"}

FEATURES = [
    'lat','lon','SST','WOA_SSS','NCEP_SLP','ETOPO2_depth','dist_to_land',
    'PPPP','xCO2water_SST_dry','shipping_proxy','is_coastal','shipping_intensity',
    'month_sin','month_cos','day_of_year','abs_lat','hemisphere',
    'SST_salinity_interaction','pressure_diff','fCO2_per_SST'
]
TARGET = 'acidity_level_encoded'

# ── 1. Load full dataset ─────────────────────────────────────────
print("Loading dataset...")
df = pd.read_csv(CSV_PATH)
print(f"  Rows: {len(df):,}  |  Class dist: {df[TARGET].value_counts().to_dict()}")

X = df[FEATURES].values
y = df[TARGET].values

# ── 2. Stratified 80/20 split ────────────────────────────────────
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.20, random_state=42, stratify=y
)
print(f"  Train: {len(X_train):,}  |  Test: {len(X_test):,}")

# ── 3. Class-balanced sample weights ────────────────────────────
sample_weights = compute_sample_weight(class_weight='balanced', y=y_train)
print(f"  Weight ratio  Safe:Vuln:Crit  ≈  "
      f"{sample_weights[y_train==1].mean():.2f} : "
      f"{sample_weights[y_train==2].mean():.2f} : "
      f"{sample_weights[y_train==0].mean():.2f}")

# ── 4. Build retrained model ─────────────────────────────────────
model = XGBClassifier(
    n_estimators      = 400,
    max_depth         = 7,
    learning_rate     = 0.08,
    subsample         = 0.80,
    colsample_bytree  = 0.80,
    gamma             = 1.0,
    min_child_weight  = 5,
    reg_alpha         = 0.1,
    reg_lambda        = 1.5,
    objective         = 'multi:softmax',
    eval_metric       = 'mlogloss',
    random_state      = 42,
    n_jobs            = -1,
    verbosity         = 0,
)

print("\nTraining model (this may take 2-4 min)...")
t0 = time.time()
model.fit(
    X_train, y_train,
    sample_weight      = sample_weights,
    eval_set           = [(X_test, y_test)],
    verbose            = False,
)
elapsed = time.time() - t0
print(f"  Done in {elapsed:.1f}s")

# ── 5. Held-out evaluation ───────────────────────────────────────
y_pred        = model.predict(X_test)
held_acc      = accuracy_score(y_test, y_pred) * 100
held_macro_f1 = f1_score(y_test, y_pred, average='macro') * 100

print(f"\n{'='*52}")
print(f"  Held-out Test Set  (20% stratified, {len(y_test):,} rows)")
print(f"{'='*52}")
print(f"  Accuracy   : {held_acc:.2f}%")
print(f"  Macro F1   : {held_macro_f1:.2f}%")
print()
print(classification_report(
    y_test, y_pred,
    target_names=[LABEL_MAP[i] for i in sorted(LABEL_MAP)],
    digits=3
))

# ── 6. Backup & save ─────────────────────────────────────────────
if os.path.exists(MODEL_PATH):
    shutil.copy2(MODEL_PATH, BACKUP)
    print(f"  Backup saved → {BACKUP}")

joblib.dump(model, MODEL_PATH)
print(f"  New model saved → {MODEL_PATH}")
print(f"\n  Retrained model feature names: {model.get_booster().feature_names}")

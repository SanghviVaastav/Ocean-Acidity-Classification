# Member 3 — ML Services, Evaluation & Tests

This folder contains the **ML inference layer, evaluation scripts, and test suite**.

## Files

| File | Purpose |
|---|---|
| `services/prediction.py` | Model loading, validation, single & batch prediction |
| `tests/test_api.py` | Pytest test suite for all API endpoints |
| `retrain_model.py` | Retrain the XGBoost model with class balancing |
| `evaluate_ood.py` | Evaluate model on out-of-distribution data |
| `evaluate_predictions.py` | Evaluate model against sample predictions |

## How to Run
```bash
# Run tests (from back-end/ root directory)
pytest tests/ -v

# Retrain the model (from back-end/ root directory)
python retrain_model.py

# Evaluate OOD performance (from back-end/ root directory)
python evaluate_ood.py

# Evaluate predictions (from back-end/ root directory)
python evaluate_predictions.py
```

> **Note:** Always run scripts from the `back-end/` root directory, not from this folder.

## Your Tasks
- Add confidence scores to `predict_single` in `services/prediction.py`
- Add test cases for `/map-data` and `/summary` in `tests/test_api.py`
- Add cross-validation to `retrain_model.py`
- Add per-class F1 reporting to `evaluate_ood.py`

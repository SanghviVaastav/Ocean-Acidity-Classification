# Backend Contributors Guide

This document divides the backend into **3 independent areas** so each team member has clear ownership with no overlap.

---

## 👤 Member 1 — API Layer

### Files Owned
| File | Description |
|------|-------------|
| `app.py` | FastAPI app setup, middleware, CORS, startup |
| `api/routes.py` | All route handlers (`/predict`, `/batch`, `/health`, `/history`, `/map-data`, `/summary`) |
| `api/schemas.py` | Pydantic request/response models |

### Responsibilities
- Add, modify, or remove API endpoints
- Update schemas for new fields or validations
- Configure middleware and CORS settings

### Example Tasks
- Add a `GET /stations/{id}` endpoint to fetch a single station
- Add pagination parameters to `/history` (e.g., `page`, `page_size`)
- Add custom exception handlers for cleaner error responses
- Add field-level descriptions to Pydantic schemas (for auto-generated API docs)

### How to Run
```bash
# From the back-end/ directory
uvicorn app:app --reload
# API docs available at: http://localhost:8000/docs
```

---

## 👤 Member 2 — Database & Data Layer

### Files Owned
| File | Description |
|------|-------------|
| `db/models.py` | SQLAlchemy ORM models (`PredictionLog`, `Station`, `AcidityZone`, `ShippingRoute`) |
| `db/database.py` | DB engine, session factory, `get_db` dependency |
| `db/seed.py` | Script to populate the DB with initial/demo data |

### Responsibilities
- Define and evolve database table schemas
- Manage DB connections and session lifecycle
- Populate and maintain seed data

### Example Tasks
- Add a `recorded_at` timestamp field to `Station`
- Add a relationship between `Station` and `PredictionLog`
- Expand `seed.py` with more realistic ocean station data
- Set up Alembic for schema migrations (`alembic init`, `alembic revision`)

### How to Run
```bash
# Seed the database
python db/seed.py

# Inspect the DB (SQLite)
sqlite3 predictions.db ".tables"
```

---

## 👤 Member 3 — ML Services, Evaluation & Tests

### Files Owned
| File | Description |
|------|-------------|
| `services/prediction.py` | Model loading, input validation, single & batch inference |
| `tests/test_api.py` | Pytest test suite for all API endpoints |
| `retrain_model.py` | Model retraining pipeline |
| `evaluate_ood.py` | Out-of-distribution evaluation |
| `evaluate_predictions.py` | Prediction quality evaluation |

### Responsibilities
- Maintain the XGBoost model inference logic
- Write and maintain API tests
- Improve the model retraining and evaluation pipeline

### Example Tasks
- Return confidence scores alongside predictions in `predict_single`
- Add test cases for `/map-data` and `/summary` endpoints
- Add cross-validation to `retrain_model.py`
- Add per-class F1 scores to evaluation output in `evaluate_ood.py`

### How to Run
```bash
# Run all tests
pytest tests/ -v

# Retrain the model
python retrain_model.py

# Evaluate OOD performance
python evaluate_ood.py
```

---

## File Ownership Summary

| File/Folder | Owner |
|---|---|
| `app.py` | Member 1 |
| `api/routes.py` | Member 1 |
| `api/schemas.py` | Member 1 |
| `db/models.py` | Member 2 |
| `db/database.py` | Member 2 |
| `db/seed.py` | Member 2 |
| `services/prediction.py` | Member 3 |
| `tests/test_api.py` | Member 3 |
| `retrain_model.py` | Member 3 |
| `evaluate_ood.py` | Member 3 |
| `evaluate_predictions.py` | Member 3 |
| `requirements.txt`, `Dockerfile`, `docker-compose.yml` | Shared — coordinate before changing |

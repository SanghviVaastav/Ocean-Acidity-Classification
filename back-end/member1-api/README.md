# Member 1 — API Layer

This folder contains the **API layer** of the Ocean Acidity Classification backend.

## Files

| File | Purpose |
|---|---|
| `app.py` | FastAPI app entry point (startup, CORS, middleware) |
| `api/routes.py` | All API route handlers |
| `api/schemas.py` | Pydantic request/response schemas |

## How to Run
```bash
# From the back-end/ root directory (not this folder)
uvicorn app:app --reload
# Swagger docs: http://localhost:8000/docs
```

## Your Tasks
- Add or modify API endpoints in `api/routes.py`
- Add/update Pydantic models in `api/schemas.py`
- Configure app settings, CORS, or middleware in `app.py`

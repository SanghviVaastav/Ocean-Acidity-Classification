# Member 2 — Database & Data Layer

This folder contains the **database layer** of the Ocean Acidity Classification backend.

## Files

| File | Purpose |
|---|---|
| `db/models.py` | SQLAlchemy ORM models (tables) |
| `db/database.py` | DB engine, session factory, `get_db` dependency |
| `db/seed.py` | Script to populate initial/demo data |

## How to Run
```bash
# Seed the database (from back-end/ root directory)
python db/seed.py

# Inspect the SQLite DB
sqlite3 predictions.db ".tables"
sqlite3 predictions.db "SELECT * FROM stations LIMIT 5;"
```

## Your Tasks
- Add or modify DB table schemas in `db/models.py`
- Add indexes, relationships, or constraints between tables
- Expand `db/seed.py` with more realistic ocean station data
- Set up Alembic for DB migrations

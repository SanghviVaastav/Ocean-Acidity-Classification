# back-end/app.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from api.routes import router as api_router
from db.database import engine          # ← ADD THIS LINE
from db import models                   # ← ADD THIS LINE

app = FastAPI(title="Ocean Acidity Classification API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Auto-create all DB tables on startup ──────────────────────
models.Base.metadata.create_all(bind=engine)   # ← ADD THIS LINE

@app.get("/")
async def root():
    return {"message": "Ocean Acidity Classification API is running."}

app.include_router(api_router, prefix="/api")
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from api.routes import router as api_router

app = FastAPI(title="Ocean Acidity Classification API", version="1.0.0")

# CORS configuration (allow all origins for simplicity; adjust as needed)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {"message": "Ocean Acidity Classification API is running. Visit /docs for Swagger UI."}

# Include API router
app.include_router(api_router)
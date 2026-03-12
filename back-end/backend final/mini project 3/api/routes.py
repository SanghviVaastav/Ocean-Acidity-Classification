from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
import pandas as pd
import io
import logging

logger = logging.getLogger("uvicorn.error")

from api.schemas import (
    PredictionRequest, 
    PredictionResponse, 
    BatchPredictionResponse,
    HealthResponse,
    HistoryResponse
)
from services.prediction import predict_single, predict_batch, validate_input
from db.database import get_db
from db import models

router = APIRouter()

@router.post("/predict", response_model=PredictionResponse)
async def predict(request: PredictionRequest, db=Depends(get_db)):
    input_data = request.model_dump()
    is_valid, msg = validate_input(input_data)
    if not is_valid:
        raise HTTPException(status_code=400, detail=msg)
    
    try:
        pred = predict_single(input_data)
    except Exception as e:
        logger.error(f"Prediction failed for input {input_data}: {e}")
        raise HTTPException(status_code=500, detail=f"Internal prediction error: {str(e)}")
    
    # Log to DB
    db_log = models.PredictionLog(input_data=str(input_data), prediction=str(pred))
    db.add(db_log)
    db.commit()
    db.refresh(db_log)
    
    return PredictionResponse(prediction=pred)

@router.post("/predict/batch", response_model=BatchPredictionResponse)
async def batch_predict(file: UploadFile = File(...), db=Depends(get_db)):
    if not file.filename.endswith('.csv'):
        raise HTTPException(status_code=400, detail="Only CSV files are accepted")
    
    contents = await file.read()
    try:
        df = pd.read_csv(io.BytesIO(contents))
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid CSV format: {e}")
        
    try:
        predictions = predict_batch(df)
    except Exception as e:
        logger.error(f"Batch prediction failed: {e}")
        raise HTTPException(status_code=500, detail=f"Batch prediction failed: {str(e)}")
        
    # Log each prediction using bulk insertion for performance
    db_logs = [
        models.PredictionLog(input_data=str(df.iloc[idx].to_dict()), prediction=str(pred))
        for idx, pred in enumerate(predictions)
    ]
    db.add_all(db_logs)
    db.commit()
    
    return BatchPredictionResponse(predictions=predictions)

@router.get("/health", response_model=HealthResponse)
async def health_check():
    return HealthResponse(status="ok", version="1.0.0")

@router.get("/history", response_model=HistoryResponse)
async def get_history(skip: int = 0, limit: int = 10, db=Depends(get_db)):
    logs_query = db.query(models.PredictionLog)
    total = logs_query.count()
    logs = logs_query.offset(skip).limit(limit).all()
    return HistoryResponse(logs=logs, total=total)

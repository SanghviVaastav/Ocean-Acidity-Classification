from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
import pandas as pd
import io
import logging
from typing import List

logger = logging.getLogger("uvicorn.error")

from api.schemas import (
    PredictionRequest,
    PredictionResponse,
    BatchPredictionResponse,
    HealthResponse,
    HistoryResponse,
    MapDataResponse,
    SummaryResponse,
)
from services.prediction import predict_single, predict_batch, validate_input
from db.database import get_db
from db import models

router = APIRouter()


# ── ORIGINAL ENDPOINTS — ZERO CHANGES ────────────────────────

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


# ── NEW ENDPOINTS ─────────────────────────────────────────────

def _classify_ph(ph: float) -> str:
    if ph < 8.00: return "critical"
    if ph < 8.10: return "vulnerable"
    return "safe"


@router.get("/map-data", response_model=MapDataResponse)
async def get_map_data(db=Depends(get_db)):
    raw_stations = db.query(models.Station).all()
    raw_zones    = db.query(models.AcidityZone).all()
    raw_shipping = db.query(models.ShippingRoute).all()

    stations = [
        {"id":s.id,"name":s.name,"region":s.region,
         "lat":s.lat,"lng":s.lng,"ph":s.ph,
         "temp":s.temp,"salinity":s.salinity,
         "depth":s.depth,"trend":s.trend,
         "status":_classify_ph(s.ph)}
        for s in raw_stations
    ]
    zones = [
        {"id":z.id,"name":z.name,"ph":z.ph,
         "coords":z.coords,"status":_classify_ph(z.ph)}
        for z in raw_zones
    ]
    shipping = [
        {"id":r.id,"name":r.name,
         "density":r.density,"coords":r.coords}
        for r in raw_shipping
    ]
    return MapDataResponse(stations=stations, zones=zones, shipping_routes=shipping)


@router.get("/summary", response_model=SummaryResponse)
async def get_summary(db=Depends(get_db)):
    raw = db.query(models.Station).all()
    if not raw:
        return SummaryResponse(total_stations=0,critical=0,vulnerable=0,
                               safe=0,avg_ph=0,min_ph=0,max_ph=0)
    statuses  = [_classify_ph(s.ph) for s in raw]
    ph_values = [s.ph for s in raw]
    return SummaryResponse(
        total_stations = len(raw),
        critical       = statuses.count("critical"),
        vulnerable     = statuses.count("vulnerable"),
        safe           = statuses.count("safe"),
        avg_ph         = round(sum(ph_values)/len(ph_values), 3),
        min_ph         = min(ph_values),
        max_ph         = max(ph_values),
    )
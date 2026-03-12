from pydantic import BaseModel
from typing import List, Any, Optional
from datetime import datetime

class PredictionRequest(BaseModel):
    lat: float
    lon: float
    SST: float
    WOA_SSS: float
    NCEP_SLP: float
    ETOPO2_depth: float
    dist_to_land: float
    PPPP: float
    xCO2water_SST_dry: float
    shipping_proxy: float
    is_coastal: float
    shipping_intensity: float
    month_sin: float
    month_cos: float
    day_of_year: float
    abs_lat: float
    hemisphere: float
    SST_salinity_interaction: float
    pressure_diff: float
    fCO2_per_SST: float

class PredictionResponse(BaseModel):
    prediction: Any

class BatchPredictionResponse(BaseModel):
    predictions: List[Any]

class HealthResponse(BaseModel):
    status: str
    version: str

class PredictionLogSchema(BaseModel):
    id: int
    timestamp: datetime
    input_data: str
    prediction: str

    class Config:
        from_attributes = True

class HistoryResponse(BaseModel):
    logs: List[PredictionLogSchema]
    total: int

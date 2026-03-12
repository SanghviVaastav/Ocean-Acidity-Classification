from sqlalchemy import Column, Integer, String, Text, DateTime, Float, JSON
from sqlalchemy.orm import declarative_base
from datetime import datetime, timezone

Base = declarative_base()

# ── ORIGINAL ──────────────────────────────────────────────────
class PredictionLog(Base):
    __tablename__ = "prediction_logs"

    id         = Column(Integer, primary_key=True, index=True)
    timestamp  = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    input_data = Column(Text, nullable=False)
    prediction = Column(String(50), nullable=False)


# ── NEW ───────────────────────────────────────────────────────
class Station(Base):
    __tablename__ = "stations"

    id       = Column(Integer, primary_key=True, index=True)
    name     = Column(String(100), nullable=False)
    region   = Column(String(100), nullable=False)
    lat      = Column(Float, nullable=False)
    lng      = Column(Float, nullable=False)
    ph       = Column(Float, nullable=False)
    temp     = Column(Float, nullable=False)
    salinity = Column(Float, nullable=False)
    depth    = Column(Integer, nullable=False)
    trend    = Column(Float, nullable=False)


class AcidityZone(Base):
    __tablename__ = "acidity_zones"

    id     = Column(Integer, primary_key=True, index=True)
    name   = Column(String(150), nullable=False)
    ph     = Column(Float, nullable=False)
    coords = Column(JSON, nullable=False)


class ShippingRoute(Base):
    __tablename__ = "shipping_routes"

    id      = Column(Integer, primary_key=True, index=True)
    name    = Column(String(150), nullable=False)
    density = Column(String(10), nullable=False)
    coords  = Column(JSON, nullable=False)
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
import pandas as pd
import io

from app import app
from db.database import get_db
from db.models import Base
from services.prediction import get_expected_features

# Setup SQLite in-memory DB for testing
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base.metadata.create_all(bind=engine)

def override_get_db():
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db

client = TestClient(app)

# Fixture to generate valid sample input
@pytest.fixture
def sample_valid_input():
    features = get_expected_features()
    if features:
        # Create a dictionary with dummy values for expected features
        return {feature: 1.0 for feature in features}
    return {}

def test_single_prediction(sample_valid_input):
    if not sample_valid_input:
        pytest.skip("Model not loaded properly or expected features not available")
    
    response = client.post("/predict", json=sample_valid_input)
    if response.status_code != 200:
        print("Validation error:", response.json())
    assert response.status_code == 200
    assert "prediction" in response.json()

def test_invalid_payload():
    # Sending missing fields (schema validation failure)
    response = client.post("/predict", json={"lat": 1.0})
    assert response.status_code == 422

def test_batch_prediction(sample_valid_input):
    if not sample_valid_input:
        pytest.skip("Model not loaded properly or expected features not available")
        
    # Create dummy DataFrame
    df = pd.DataFrame([sample_valid_input, sample_valid_input])
    
    # Save to IO Bytes instead of file for testing
    buffer = io.BytesIO()
    df.to_csv(buffer, index=False)
    buffer.seek(0)
    
    # Send post request with file
    files = {"file": ("test.csv", buffer, "text/csv")}
    response = client.post("/predict/batch", files=files)
    
    assert response.status_code == 200
    data = response.json()
    assert "predictions" in data
    assert len(data["predictions"]) == 2

def test_health_check():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok", "version": "1.0.0"}

def test_get_history(sample_valid_input):
    if not sample_valid_input:
        pytest.skip("Model not loaded properly")
        
    # First, make a prediction to ensure there is something in the history
    client.post("/predict", json=sample_valid_input)
    
    response = client.get("/history")
    assert response.status_code == 200
    data = response.json()
    assert "logs" in data
    assert "total" in data
    assert data["total"] >= 1
    assert len(data["logs"]) >= 1

def test_large_batch_prediction(sample_valid_input):
    if not sample_valid_input:
        pytest.skip("Model not loaded properly")
        
    # Create a larger batch (e.g., 50 rows)
    df = pd.DataFrame([sample_valid_input] * 50)
    buffer = io.BytesIO()
    df.to_csv(buffer, index=False)
    buffer.seek(0)
    
    files = {"file": ("large_test.csv", buffer, "text/csv")}
    response = client.post("/predict/batch", files=files)
    
    assert response.status_code == 200
    assert len(response.json()["predictions"]) == 50

def test_missing_features():
    # Sending payload with missing features that are expected by the model
    # Note: PredictionRequest schema might catch some, but we want to test our custom validate_input
    # We bypass Pydantic by sending a partial dict if possible, but here we test the service layer via route
    response = client.post("/predict", json={"lat": 1.0, "lon": 2.0})
    assert response.status_code == 422 or response.status_code == 400
    if response.status_code == 400:
        assert "Missing required features" in response.json()["detail"]

def test_invalid_types(sample_valid_input):
    if not sample_valid_input:
        pytest.skip("Model not loaded properly")
    
    payload = sample_valid_input.copy()
    # Change one field to string
    payload["lat"] = "invalid_string"
    
    # This might be caught by Pydantic first (422)
    response = client.post("/predict", json=payload)
    assert response.status_code == 422 or response.status_code == 400

"""Tests for API endpoints."""

import pytest
from fastapi.testclient import TestClient
from unittest.mock import Mock, AsyncMock
import io
from PIL import Image

from agmo.main import app


@pytest.fixture
def client():
    """Create a test client."""
    return TestClient(app)


@pytest.fixture
def mock_plant_classifier():
    """Create a mock plant classifier."""
    classifier = Mock()
    classifier.predict = AsyncMock(return_value=("healthy", 0.85))
    return classifier


@pytest.fixture
def mock_rl_trainer():
    """Create a mock RL trainer."""
    trainer = Mock()
    trainer.is_training = False
    trainer.total_timesteps = 1000
    trainer.current_timesteps = 0
    trainer.episodes = 0
    trainer.mean_reward = 0.0
    trainer.model_name = "PPO"
    trainer.get_metrics = Mock(return_value={
        "is_training": False,
        "current_timesteps": 0,
        "total_timesteps": 1000,
        "episodes": 0,
        "mean_reward": 0.0,
        "training_metrics": {"episode_rewards": [], "episode_lengths": [], "timesteps": []}
    })
    trainer.start_training = AsyncMock()
    trainer.stop_training = AsyncMock()
    trainer.load_model = AsyncMock()
    return trainer


def test_root_endpoint(client):
    """Test root endpoint."""
    response = client.get("/")
    assert response.status_code == 200
    
    data = response.json()
    assert data["message"] == "AGMO Backend API"
    assert data["version"] == "1.0.0"
    assert data["status"] == "running"


def test_health_endpoint(client):
    """Test health check endpoint."""
    response = client.get("/health")
    assert response.status_code == 200
    
    data = response.json()
    assert "status" in data
    assert "rl_trainer" in data
    assert "plant_classifier" in data
    assert "websocket" in data


def test_classify_endpoint_no_classifier(client):
    """Test classify endpoint when classifier is not initialized."""
    # Create a dummy image file
    image = Image.new('RGB', (100, 100), color='red')
    img_bytes = io.BytesIO()
    image.save(img_bytes, format='JPEG')
    img_bytes.seek(0)
    
    response = client.post(
        "/api/classify",
        files={"file": ("test.jpg", img_bytes, "image/jpeg")}
    )
    
    assert response.status_code == 503
    assert "Plant classifier not initialized" in response.json()["detail"]


def test_training_status_no_trainer(client):
    """Test training status endpoint when trainer is not initialized."""
    response = client.get("/api/training/status")
    assert response.status_code == 503
    assert "RL trainer not initialized" in response.json()["detail"]


def test_start_training_no_trainer(client):
    """Test start training endpoint when trainer is not initialized."""
    response = client.post("/api/training/start")
    assert response.status_code == 503
    assert "RL trainer not initialized" in response.json()["detail"]


def test_stop_training_no_trainer(client):
    """Test stop training endpoint when trainer is not initialized."""
    response = client.post("/api/training/stop")
    assert response.status_code == 503
    assert "RL trainer not initialized" in response.json()["detail"]


def test_list_models(client):
    """Test list models endpoint."""
    response = client.get("/api/models")
    assert response.status_code == 200
    
    data = response.json()
    assert "models" in data
    assert isinstance(data["models"], list)


def test_load_model_no_trainer(client):
    """Test load model endpoint when trainer is not initialized."""
    response = client.post("/api/models/test_model.zip/load")
    assert response.status_code == 503
    assert "RL trainer not initialized" in response.json()["detail"]


def test_metrics_no_trainer(client):
    """Test metrics endpoint when trainer is not initialized."""
    response = client.get("/api/metrics")
    assert response.status_code == 503
    assert "RL trainer not initialized" in response.json()["detail"]


def test_classify_base64_endpoint_no_classifier(client):
    """Test classify base64 endpoint when classifier is not initialized."""
    response = client.post(
        "/api/classify/base64",
        json={"image": "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChAGA"}
    )
    
    assert response.status_code == 503
    assert "Plant classifier not initialized" in response.json()["detail"]
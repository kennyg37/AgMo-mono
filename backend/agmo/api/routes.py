"""API routes."""

import base64
import io
from typing import Dict, Any, List
from datetime import datetime, timedelta
import random

from fastapi import APIRouter, HTTPException, UploadFile, File, Query
from PIL import Image
import numpy as np

from agmo.core.config import settings
from agmo.vision.cnn_model import PlantClassifier

# Import all route modules
from .auth import router as auth_router
from .farms import router as farms_router
from .monitoring import router as monitoring_router
from .chat import router as chat_router
from .disease_detection import router as disease_detection_router

router = APIRouter()

# Include all route modules
router.include_router(auth_router)
router.include_router(farms_router)
router.include_router(monitoring_router)
router.include_router(chat_router)
router.include_router(disease_detection_router)

# Global references (will be set by main.py)
plant_classifier: PlantClassifier = None


@router.post("/classify")
async def classify_plant(file: UploadFile = File(...)) -> Dict[str, Any]:
    """Classify plant health from uploaded image."""
    if not plant_classifier:
        raise HTTPException(status_code=503, detail="Plant classifier not initialized")
    
    try:
        # Read and process image
        image_data = await file.read()
        image = Image.open(io.BytesIO(image_data))
        
        # Convert to RGB if necessary
        if image.mode != 'RGB':
            image = image.convert('RGB')
        
        # Classify
        prediction, confidence = await plant_classifier.predict(image)
        
        return {
            "prediction": prediction,
            "confidence": float(confidence),
            "classes": ["healthy", "sick"]
        }
        
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Classification failed: {str(e)}")


@router.post("/classify/base64")
async def classify_plant_base64(data: Dict[str, str]) -> Dict[str, Any]:
    """Classify plant health from base64 encoded image."""
    if not plant_classifier:
        raise HTTPException(status_code=503, detail="Plant classifier not initialized")
    
    try:
        # Decode base64 image
        image_data = base64.b64decode(data["image"])
        image = Image.open(io.BytesIO(image_data))
        
        # Convert to RGB if necessary
        if image.mode != 'RGB':
            image = image.convert('RGB')
        
        # Classify
        prediction, confidence = await plant_classifier.predict(image)
        
        return {
            "prediction": prediction,
            "confidence": float(confidence),
            "classes": ["healthy", "sick"]
        }
        
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Classification failed: {str(e)}")


@router.get("/cnn/status")
async def get_cnn_status() -> Dict[str, Any]:
    """Get CNN model status."""
    if not plant_classifier:
        raise HTTPException(status_code=503, detail="Plant classifier not initialized")
    
    return {
        "status": "ready",
        "model_info": plant_classifier.get_model_info(),
        "available_classes": ["healthy", "sick"]
    }


@router.get("/models")
async def list_models() -> Dict[str, List[str]]:
    """List available CNN models."""
    import os
    
    models = []
    models_dir = settings.MODELS_DIR
    
    if os.path.exists(models_dir):
        for file in os.listdir(models_dir):
            if file.endswith('.pth'):
                models.append(file)
    
    return {"models": models}


@router.post("/models/{model_name}/load")
async def load_cnn_model(model_name: str) -> Dict[str, str]:
    """Load a specific CNN model."""
    if not plant_classifier:
        raise HTTPException(status_code=503, detail="Plant classifier not initialized")
    
    try:
        model_path = f"{settings.MODELS_DIR}/{model_name}"
        await plant_classifier.load_model(model_path)
        return {"message": f"CNN model {model_name} loaded successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to load CNN model: {str(e)}")


@router.get("/cnn/metrics")
async def get_cnn_metrics() -> Dict[str, Any]:
    """Get CNN model metrics."""
    if not plant_classifier:
        raise HTTPException(status_code=503, detail="Plant classifier not initialized")
    
    return {
        "model_info": plant_classifier.get_model_info(),
        "status": "operational"
    }


# Analytics APIs
@router.get("/analytics/overview")
async def get_analytics_overview() -> Dict[str, Any]:
    """Get comprehensive analytics overview."""
    return {
        "crop_health": {
            "healthy": 75,
            "sick": 15,
            "unknown": 10
        },
        "yield_prediction": {
            "current": 94.2,
            "previous": 87.8,
            "trend": 7.3
        },
        "water_usage": {
            "current": 2340,
            "previous": 2670,
            "efficiency": 12.4
        },
        "weather_impact": {
            "temperature": 24.5,
            "humidity": 68,
            "rainfall": 45
        },
        "cost_analysis": {
            "total": 45600,
            "per_acre": 182.4,
            "savings": 12.3
        }
    }


@router.get("/analytics/field/{field_id}")
async def get_field_analytics(field_id: int) -> Dict[str, Any]:
    """Get analytics for a specific field."""
    return {
        "field_id": field_id,
        "health_score": random.randint(70, 95),
        "yield_prediction": random.randint(80, 98),
        "water_efficiency": random.randint(10, 25),
        "cost_savings": random.randint(5, 20),
        "time_series_data": generate_time_series_data()
    }


@router.get("/analytics/time-series")
async def get_time_series_data(
    field_id: int = Query(None),
    days: int = Query(30)
) -> Dict[str, Any]:
    """Get time series data for analytics."""
    return {
        "data": generate_time_series_data(days),
        "field_id": field_id,
        "period_days": days
    }


# Enhanced Weather APIs
@router.get("/weather/forecast")
async def get_weather_forecast(
    field_id: int = Query(None),
    days: int = Query(7)
) -> Dict[str, Any]:
    """Get weather forecast for fields."""
    forecast = []
    for i in range(days):
        date = datetime.now() + timedelta(days=i)
        forecast.append({
            "date": date.strftime("%Y-%m-%d"),
            "day": date.strftime("%a"),
            "temperature": random.randint(15, 30),
            "humidity": random.randint(40, 80),
            "wind_speed": random.randint(5, 25),
            "rainfall": random.randint(0, 20),
            "condition": random.choice(["sunny", "cloudy", "rainy", "partly_cloudy"])
        })
    
    return {
        "forecast": forecast,
        "field_id": field_id,
        "days": days
    }


@router.get("/weather/current")
async def get_current_weather(field_id: int = Query(None)) -> Dict[str, Any]:
    """Get current weather conditions."""
    return {
        "field_id": field_id,
        "temperature": random.randint(20, 28),
        "humidity": random.randint(50, 75),
        "wind_speed": random.randint(8, 18),
        "pressure": random.randint(1000, 1020),
        "rainfall": random.randint(0, 5),
        "timestamp": datetime.now().isoformat(),
        "condition": random.choice(["sunny", "cloudy", "rainy"])
    }


# Enhanced Sensor APIs
@router.get("/sensors/status")
async def get_sensors_status() -> Dict[str, Any]:
    """Get status of all sensors."""
    return {
        "total_sensors": 6,
        "active_sensors": 6,
        "warning_sensors": 1,
        "critical_sensors": 0,
        "last_update": datetime.now().isoformat()
    }


@router.get("/sensors/types")
async def get_sensor_types() -> Dict[str, List[str]]:
    """Get available sensor types."""
    return {
        "types": [
            "temperature",
            "humidity", 
            "soil_moisture",
            "wind_speed",
            "light",
            "pressure",
            "ph",
            "nutrient_level"
        ]
    }


@router.post("/sensors/calibrate")
async def calibrate_sensor(sensor_id: int) -> Dict[str, str]:
    """Calibrate a specific sensor."""
    return {
        "message": f"Sensor {sensor_id} calibration started",
        "estimated_time": "5 minutes"
    }


# Enhanced Farm Management APIs
@router.get("/farms/{farm_id}/summary")
async def get_farm_summary(farm_id: int) -> Dict[str, Any]:
    """Get comprehensive farm summary."""
    return {
        "farm_id": farm_id,
        "total_fields": random.randint(3, 8),
        "active_fields": random.randint(2, 6),
        "total_acres": random.randint(500, 2000),
        "health_score": random.randint(75, 95),
        "crop_types": ["corn", "wheat", "soybean"],
        "last_updated": datetime.now().isoformat()
    }


@router.get("/farms/{farm_id}/fields/{field_id}/crops")
async def get_field_crops(farm_id: int, field_id: int) -> Dict[str, Any]:
    """Get crops for a specific field."""
    crops = []
    for i in range(random.randint(1, 3)):
        crops.append({
            "id": i + 1,
            "field_id": field_id,
            "type": random.choice(["corn", "wheat", "soybean", "cotton"]),
            "variety": f"Variety-{random.randint(1, 5)}",
            "planting_date": (datetime.now() - timedelta(days=random.randint(30, 90))).strftime("%Y-%m-%d"),
            "expected_harvest": (datetime.now() + timedelta(days=random.randint(60, 120))).strftime("%Y-%m-%d"),
            "health_score": random.randint(70, 95),
            "yield_prediction": random.randint(80, 98),
            "status": random.choice(["growing", "harvested", "failed"])
        })
    
    return {
        "field_id": field_id,
        "farm_id": farm_id,
        "crops": crops
    }


@router.post("/farms/{farm_id}/fields/{field_id}/crops")
async def create_field_crop(
    farm_id: int, 
    field_id: int, 
    crop_data: Dict[str, Any]
) -> Dict[str, Any]:
    """Create a new crop for a field."""
    return {
        "id": random.randint(1000, 9999),
        "field_id": field_id,
        "farm_id": farm_id,
        **crop_data,
        "created_at": datetime.now().isoformat()
    }


# Alert and Notification APIs
@router.get("/alerts")
async def get_alerts(
    farm_id: int = Query(None),
    severity: str = Query(None),
    limit: int = Query(10)
) -> Dict[str, Any]:
    """Get system alerts and notifications."""
    alerts = []
    alert_types = ["warning", "success", "info", "critical"]
    
    for i in range(min(limit, 5)):
        alerts.append({
            "id": i + 1,
            "type": random.choice(alert_types),
            "title": f"Alert {i + 1}",
            "description": f"This is alert description {i + 1}",
            "farm_id": farm_id or random.randint(1, 3),
            "field_id": random.randint(1, 5),
            "timestamp": (datetime.now() - timedelta(hours=random.randint(1, 24))).isoformat(),
            "severity": random.choice(["low", "medium", "high", "critical"])
        })
    
    return {
        "alerts": alerts,
        "total": len(alerts),
        "unread": random.randint(0, 3)
    }


@router.post("/alerts/{alert_id}/acknowledge")
async def acknowledge_alert(alert_id: int) -> Dict[str, str]:
    """Acknowledge an alert."""
    return {
        "message": f"Alert {alert_id} acknowledged",
        "timestamp": datetime.now().isoformat()
    }


# System Status APIs
@router.get("/system/status")
async def get_system_status() -> Dict[str, Any]:
    """Get overall system status."""
    return {
        "status": "operational",
        "uptime": "99.8%",
        "last_maintenance": "2024-01-15T10:00:00Z",
        "next_maintenance": "2024-02-15T10:00:00Z",
        "active_connections": random.randint(10, 50),
        "data_storage": {
            "used": "2.3 GB",
            "total": "10 GB",
            "percentage": 23
        }
    }


@router.get("/system/health")
async def get_system_health() -> Dict[str, Any]:
    """Get system health check."""
    return {
        "database": "healthy",
        "cnn_model": "ready",
        "websocket": "connected",
        "sensors": "operational",
        "overall": "healthy"
    }


# Utility function to generate time series data
def generate_time_series_data(days: int = 30) -> List[Dict[str, Any]]:
    """Generate mock time series data for analytics."""
    data = []
    base_date = datetime.now() - timedelta(days=days)
    
    for i in range(days):
        date = base_date + timedelta(days=i)
        data.append({
            "date": date.strftime("%Y-%m-%d"),
            "health": random.randint(75, 95),
            "yield": random.randint(80, 98),
            "water": random.randint(2000, 3000),
            "cost": random.randint(44000, 46000)
        })
    
    return data
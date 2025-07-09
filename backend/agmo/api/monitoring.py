"""Monitoring routes for plant health, weather, and sensor data."""

from typing import List, Optional
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.orm import Session
from pydantic import BaseModel
import json

from agmo.core.auth import get_current_active_user
from agmo.core.database import get_db
from agmo.models import User, Farm, Field, PlantHealth, WeatherData, SensorData
from agmo.models.monitoring import HealthStatus, WeatherCondition

router = APIRouter(prefix="/monitoring", tags=["monitoring"])


# Pydantic models
class PlantHealthCreate(BaseModel):
    """Plant health creation model."""
    field_id: int
    health_score: float
    status: HealthStatus
    disease_detected: bool = False
    disease_type: Optional[str] = None
    pest_infestation: bool = False
    pest_type: Optional[str] = None
    nutrient_deficiency: Optional[str] = None
    stress_factors: Optional[str] = None
    notes: Optional[str] = None


class PlantHealthResponse(BaseModel):
    """Plant health response model."""
    id: int
    field_id: int
    health_score: float
    status: HealthStatus
    disease_detected: bool
    disease_type: Optional[str]
    pest_infestation: bool
    pest_type: Optional[str]
    nutrient_deficiency: Optional[str]
    stress_factors: Optional[str]
    image_url: Optional[str]
    notes: Optional[str]
    recorded_at: datetime
    created_at: datetime

    class Config:
        from_attributes = True


class WeatherDataCreate(BaseModel):
    """Weather data creation model."""
    field_id: int
    temperature: float
    humidity: float
    wind_speed: Optional[float] = None
    wind_direction: Optional[float] = None
    precipitation: Optional[float] = None
    pressure: Optional[float] = None
    condition: Optional[WeatherCondition] = None
    uv_index: Optional[float] = None
    visibility: Optional[float] = None


class WeatherDataResponse(BaseModel):
    """Weather data response model."""
    id: int
    field_id: int
    temperature: float
    humidity: float
    wind_speed: Optional[float]
    wind_direction: Optional[float]
    precipitation: Optional[float]
    pressure: Optional[float]
    condition: Optional[WeatherCondition]
    uv_index: Optional[float]
    visibility: Optional[float]
    recorded_at: datetime
    created_at: datetime

    class Config:
        from_attributes = True


class SensorDataCreate(BaseModel):
    """Sensor data creation model."""
    field_id: int
    sensor_type: str
    sensor_id: str
    value: float
    unit: str
    location: Optional[str] = None
    battery_level: Optional[float] = None
    signal_strength: Optional[float] = None


class SensorDataResponse(BaseModel):
    """Sensor data response model."""
    id: int
    field_id: int
    sensor_type: str
    sensor_id: str
    value: float
    unit: str
    location: Optional[str]
    battery_level: Optional[float]
    signal_strength: Optional[float]
    recorded_at: datetime
    created_at: datetime

    class Config:
        from_attributes = True


# Plant Health routes
@router.post("/plant-health", response_model=PlantHealthResponse)
async def create_plant_health(
    health_data: PlantHealthCreate,
    current_user_id: int = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Create plant health record."""
    # Verify field ownership through farm
    field = db.query(Field).join(Farm).filter(
        Field.id == health_data.field_id,
        Farm.owner_id == current_user_id
    ).first()
    
    if not field:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Field not found"
        )
    
    db_health = PlantHealth(**health_data.dict())
    db.add(db_health)
    db.commit()
    db.refresh(db_health)
    return PlantHealthResponse.from_orm(db_health)


@router.get("/plant-health/field/{field_id}", response_model=List[PlantHealthResponse])
async def get_plant_health(
    field_id: int,
    days: Optional[int] = 30,
    current_user_id: int = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get plant health records for a field."""
    # Verify field ownership through farm
    field = db.query(Field).join(Farm).filter(
        Field.id == field_id,
        Farm.owner_id == current_user_id
    ).first()
    
    if not field:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Field not found"
        )
    
    start_date = datetime.utcnow() - timedelta(days=days)
    health_records = db.query(PlantHealth).filter(
        PlantHealth.field_id == field_id,
        PlantHealth.recorded_at >= start_date
    ).order_by(PlantHealth.recorded_at.desc()).all()
    
    return [PlantHealthResponse.from_orm(record) for record in health_records]


@router.post("/plant-health/upload-image")
async def upload_plant_health_image(
    field_id: int,
    file: UploadFile = File(...),
    current_user_id: int = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Upload plant health image and analyze."""
    # Verify field ownership through farm
    field = db.query(Field).join(Farm).filter(
        Field.id == field_id,
        Farm.owner_id == current_user_id
    ).first()
    
    if not field:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Field not found"
        )
    
    # TODO: Implement image upload and analysis
    # For now, return mock data
    return {
        "message": "Image uploaded successfully",
        "analysis": {
            "health_score": 85.5,
            "disease_detected": False,
            "pest_infestation": False,
            "recommendations": ["Continue current irrigation schedule", "Monitor for early signs of disease"]
        }
    }


# Weather Data routes
@router.post("/weather", response_model=WeatherDataResponse)
async def create_weather_data(
    weather_data: WeatherDataCreate,
    current_user_id: int = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Create weather data record."""
    # Verify field ownership through farm
    field = db.query(Field).join(Farm).filter(
        Field.id == weather_data.field_id,
        Farm.owner_id == current_user_id
    ).first()
    
    if not field:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Field not found"
        )
    
    db_weather = WeatherData(**weather_data.dict())
    db.add(db_weather)
    db.commit()
    db.refresh(db_weather)
    return WeatherDataResponse.from_orm(db_weather)


@router.get("/weather/field/{field_id}", response_model=List[WeatherDataResponse])
async def get_weather_data(
    field_id: int,
    days: Optional[int] = 7,
    current_user_id: int = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get weather data for a field."""
    # Verify field ownership through farm
    field = db.query(Field).join(Farm).filter(
        Field.id == field_id,
        Farm.owner_id == current_user_id
    ).first()
    
    if not field:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Field not found"
        )
    
    start_date = datetime.utcnow() - timedelta(days=days)
    weather_records = db.query(WeatherData).filter(
        WeatherData.field_id == field_id,
        WeatherData.recorded_at >= start_date
    ).order_by(WeatherData.recorded_at.desc()).all()
    
    return [WeatherDataResponse.from_orm(record) for record in weather_records]


# Sensor Data routes
@router.post("/sensors", response_model=SensorDataResponse)
async def create_sensor_data(
    sensor_data: SensorDataCreate,
    current_user_id: int = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Create sensor data record."""
    # Verify field ownership through farm
    field = db.query(Field).join(Farm).filter(
        Field.id == sensor_data.field_id,
        Farm.owner_id == current_user_id
    ).first()
    
    if not field:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Field not found"
        )
    
    db_sensor = SensorData(**sensor_data.dict())
    db.add(db_sensor)
    db.commit()
    db.refresh(db_sensor)
    return SensorDataResponse.from_orm(db_sensor)


@router.get("/sensors/field/{field_id}", response_model=List[SensorDataResponse])
async def get_sensor_data(
    field_id: int,
    sensor_type: Optional[str] = None,
    hours: Optional[int] = 24,
    current_user_id: int = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get sensor data for a field."""
    # Verify field ownership through farm
    field = db.query(Field).join(Farm).filter(
        Field.id == field_id,
        Farm.owner_id == current_user_id
    ).first()
    
    if not field:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Field not found"
        )
    
    start_date = datetime.utcnow() - timedelta(hours=hours)
    query = db.query(SensorData).filter(
        SensorData.field_id == field_id,
        SensorData.recorded_at >= start_date
    )
    
    if sensor_type:
        query = query.filter(SensorData.sensor_type == sensor_type)
    
    sensor_records = query.order_by(SensorData.recorded_at.desc()).all()
    return [SensorDataResponse.from_orm(record) for record in sensor_records]


# Analytics routes
@router.get("/analytics/field/{field_id}")
async def get_field_analytics(
    field_id: int,
    current_user_id: int = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get comprehensive analytics for a field."""
    # Verify field ownership through farm
    field = db.query(Field).join(Farm).filter(
        Field.id == field_id,
        Farm.owner_id == current_user_id
    ).first()
    
    if not field:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Field not found"
        )
    
    # Get latest plant health
    latest_health = db.query(PlantHealth).filter(
        PlantHealth.field_id == field_id
    ).order_by(PlantHealth.recorded_at.desc()).first()
    
    # Get latest weather
    latest_weather = db.query(WeatherData).filter(
        WeatherData.field_id == field_id
    ).order_by(WeatherData.recorded_at.desc()).first()
    
    # Get sensor data summary
    sensor_summary = db.query(SensorData).filter(
        SensorData.field_id == field_id,
        SensorData.recorded_at >= datetime.utcnow() - timedelta(hours=24)
    ).all()
    
    return {
        "field_id": field_id,
        "plant_health": PlantHealthResponse.from_orm(latest_health) if latest_health else None,
        "weather": WeatherDataResponse.from_orm(latest_weather) if latest_weather else None,
        "sensor_summary": {
            "soil_moisture": next((s.value for s in sensor_summary if s.sensor_type == "soil_moisture"), None),
            "soil_temperature": next((s.value for s in sensor_summary if s.sensor_type == "soil_temperature"), None),
            "air_temperature": next((s.value for s in sensor_summary if s.sensor_type == "air_temperature"), None),
        },
        "recommendations": [
            "Monitor soil moisture levels",
            "Check for pest activity",
            "Prepare for upcoming weather changes"
        ]
    } 
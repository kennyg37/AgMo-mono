"""Monitoring models for plant health, weather, and sensor data."""

from datetime import datetime
from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text, Float, ForeignKey, Enum
from sqlalchemy.orm import relationship
import enum

from agmo.core.database import Base


class HealthStatus(enum.Enum):
    """Plant health status enumeration."""
    EXCELLENT = "excellent"
    GOOD = "good"
    FAIR = "fair"
    POOR = "poor"
    CRITICAL = "critical"


class WeatherCondition(enum.Enum):
    """Weather condition enumeration."""
    SUNNY = "sunny"
    CLOUDY = "cloudy"
    RAINY = "rainy"
    STORMY = "stormy"
    FOGGY = "foggy"
    WINDY = "windy"


class PlantHealth(Base):
    """Plant health monitoring data."""
    
    __tablename__ = "plant_health"
    
    id = Column(Integer, primary_key=True, index=True)
    field_id = Column(Integer, ForeignKey("fields.id"), nullable=False)
    health_score = Column(Float, nullable=False)  # 0-100
    status = Column(Enum(HealthStatus), nullable=False)
    disease_detected = Column(Boolean, default=False)
    disease_type = Column(String(255))
    pest_infestation = Column(Boolean, default=False)
    pest_type = Column(String(255))
    nutrient_deficiency = Column(String(255))
    stress_factors = Column(Text)  # JSON string
    image_url = Column(String(500))
    notes = Column(Text)
    recorded_at = Column(DateTime, default=datetime.utcnow)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    field = relationship("Field", back_populates="plant_health")
    
    def __repr__(self):
        return f"<PlantHealth(id={self.id}, field_id={self.field_id}, health_score={self.health_score})>"


class WeatherData(Base):
    """Weather monitoring data."""
    
    __tablename__ = "weather_data"
    
    id = Column(Integer, primary_key=True, index=True)
    field_id = Column(Integer, ForeignKey("fields.id"), nullable=False)
    temperature = Column(Float, nullable=False)  # Celsius
    humidity = Column(Float, nullable=False)  # Percentage
    wind_speed = Column(Float)  # km/h
    wind_direction = Column(Float)  # degrees
    precipitation = Column(Float)  # mm
    pressure = Column(Float)  # hPa
    condition = Column(Enum(WeatherCondition))
    uv_index = Column(Float)
    visibility = Column(Float)  # km
    recorded_at = Column(DateTime, default=datetime.utcnow)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    field = relationship("Field", back_populates="weather_data")
    
    def __repr__(self):
        return f"<WeatherData(id={self.id}, field_id={self.field_id}, temperature={self.temperature})>"


class SensorData(Base):
    """IoT sensor data from field monitoring."""
    
    __tablename__ = "sensor_data"
    
    id = Column(Integer, primary_key=True, index=True)
    field_id = Column(Integer, ForeignKey("fields.id"), nullable=False)
    sensor_type = Column(String(100), nullable=False)  # soil_moisture, temperature, etc.
    sensor_id = Column(String(100), nullable=False)
    value = Column(Float, nullable=False)
    unit = Column(String(50), nullable=False)
    location = Column(String(255))  # GPS coordinates or description
    battery_level = Column(Float)  # Percentage
    signal_strength = Column(Float)  # dBm
    recorded_at = Column(DateTime, default=datetime.utcnow)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    field = relationship("Field", back_populates="sensor_data")
    
    def __repr__(self):
        return f"<SensorData(id={self.id}, field_id={self.field_id}, sensor_type='{self.sensor_type}', value={self.value})>" 
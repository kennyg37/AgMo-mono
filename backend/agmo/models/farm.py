"""Farm, Field, and Crop models for farm management."""

from datetime import datetime
from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text, Float, ForeignKey, Enum
from sqlalchemy.orm import relationship
import enum

from agmo.core.database import Base


class CropType(enum.Enum):
    """Crop type enumeration."""
    CORN = "corn"
    WHEAT = "wheat"
    SOYBEANS = "soybeans"
    COTTON = "cotton"
    RICE = "rice"
    POTATOES = "potatoes"
    TOMATOES = "tomatoes"
    LETTUCE = "lettuce"
    CARROTS = "carrots"
    ONIONS = "onions"
    OTHER = "other"


class GrowthStage(enum.Enum):
    """Crop growth stage enumeration."""
    SEEDING = "seeding"
    VEGETATIVE = "vegetative"
    FLOWERING = "flowering"
    FRUITING = "fruiting"
    MATURITY = "maturity"
    HARVEST = "harvest"


class Farm(Base):
    """Farm model for managing farm properties."""
    
    __tablename__ = "farms"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    description = Column(Text)
    location = Column(String(255))
    total_acres = Column(Float)
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    owner = relationship("User", back_populates="farms")
    fields = relationship("Field", back_populates="farm")
    
    def __repr__(self):
        return f"<Farm(id={self.id}, name='{self.name}', owner_id={self.owner_id})>"


class Field(Base):
    """Field model for managing individual fields within a farm."""
    
    __tablename__ = "fields"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    farm_id = Column(Integer, ForeignKey("farms.id"), nullable=False)
    acres = Column(Float, nullable=False)
    soil_type = Column(String(100))
    irrigation_type = Column(String(100))
    coordinates = Column(Text)  # JSON string for field boundaries
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    farm = relationship("Farm", back_populates="fields")
    crops = relationship("Crop", back_populates="field")
    plant_health = relationship("PlantHealth", back_populates="field")
    weather_data = relationship("WeatherData", back_populates="field")
    sensor_data = relationship("SensorData", back_populates="field")
    
    def __repr__(self):
        return f"<Field(id={self.id}, name='{self.name}', farm_id={self.farm_id})>"


class Crop(Base):
    """Crop model for managing crop plantings."""
    
    __tablename__ = "crops"
    
    id = Column(Integer, primary_key=True, index=True)
    field_id = Column(Integer, ForeignKey("fields.id"), nullable=False)
    crop_type = Column(Enum(CropType), nullable=False)
    variety = Column(String(255))
    planting_date = Column(DateTime, nullable=False)
    expected_harvest_date = Column(DateTime)
    actual_harvest_date = Column(DateTime)
    growth_stage = Column(Enum(GrowthStage), default=GrowthStage.SEEDING)
    yield_estimate = Column(Float)  # in tons/acre
    actual_yield = Column(Float)  # in tons/acre
    notes = Column(Text)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    field = relationship("Field", back_populates="crops")
    analytics = relationship("CropAnalytics", back_populates="crop")
    
    def __repr__(self):
        return f"<Crop(id={self.id}, crop_type={self.crop_type}, field_id={self.field_id})>" 
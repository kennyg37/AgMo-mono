"""Analytics models for crop analysis and decision support."""

from datetime import datetime
from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text, Float, ForeignKey, Enum
from sqlalchemy.orm import relationship
import enum

from agmo.core.database import Base


class DecisionType(enum.Enum):
    """Decision type enumeration."""
    IRRIGATION = "irrigation"
    FERTILIZATION = "fertilization"
    PEST_CONTROL = "pest_control"
    HARVEST = "harvest"
    PLANTING = "planting"
    CROP_ROTATION = "crop_rotation"
    OTHER = "other"


class DecisionStatus(enum.Enum):
    """Decision status enumeration."""
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"
    IMPLEMENTED = "implemented"
    CANCELLED = "cancelled"


class CropAnalytics(Base):
    """Crop analytics and performance data."""
    
    __tablename__ = "crop_analytics"
    
    id = Column(Integer, primary_key=True, index=True)
    crop_id = Column(Integer, ForeignKey("crops.id"), nullable=False)
    analysis_date = Column(DateTime, default=datetime.utcnow)
    
    # Growth metrics
    growth_rate = Column(Float)  # cm/day
    height = Column(Float)  # cm
    leaf_area_index = Column(Float)
    biomass_estimate = Column(Float)  # kg/acre
    
    # Health metrics
    disease_risk = Column(Float)  # 0-1
    pest_risk = Column(Float)  # 0-1
    stress_level = Column(Float)  # 0-1
    
    # Environmental factors
    soil_moisture = Column(Float)  # %
    soil_temperature = Column(Float)  # Celsius
    soil_ph = Column(Float)
    nitrogen_level = Column(Float)  # ppm
    phosphorus_level = Column(Float)  # ppm
    potassium_level = Column(Float)  # ppm
    
    # Yield predictions
    yield_prediction = Column(Float)  # tons/acre
    yield_confidence = Column(Float)  # 0-1
    harvest_readiness = Column(Float)  # 0-1
    
    # Recommendations
    recommendations = Column(Text)  # JSON string
    risk_factors = Column(Text)  # JSON string
    notes = Column(Text)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    crop = relationship("Crop", back_populates="analytics")
    
    def __repr__(self):
        return f"<CropAnalytics(id={self.id}, crop_id={self.crop_id}, analysis_date={self.analysis_date})>"


class DecisionLog(Base):
    """Decision logging for farm management decisions."""
    
    __tablename__ = "decision_logs"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    field_id = Column(Integer, ForeignKey("fields.id"), nullable=False)
    decision_type = Column(Enum(DecisionType), nullable=False)
    status = Column(Enum(DecisionStatus), default=DecisionStatus.PENDING)
    
    # Decision details
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    reasoning = Column(Text)
    ai_recommendation = Column(Boolean, default=False)
    confidence_score = Column(Float)  # 0-1
    
    # Implementation details
    planned_date = Column(DateTime)
    implemented_date = Column(DateTime)
    cost_estimate = Column(Float)
    actual_cost = Column(Float)
    
    # Outcomes
    expected_outcome = Column(Text)
    actual_outcome = Column(Text)
    success_rating = Column(Float)  # 0-5
    
    # Metadata
    tags = Column(Text)  # JSON string
    attachments = Column(Text)  # JSON string of file URLs
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    user = relationship("User", back_populates="decision_logs")
    
    def __repr__(self):
        return f"<DecisionLog(id={self.id}, user_id={self.user_id}, decision_type={self.decision_type}, status={self.status})>" 
"""Disease detection history model."""

from datetime import datetime
from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text, Float, ForeignKey, JSON
from sqlalchemy.orm import relationship

from agmo.core.database import Base


class DiseaseDetectionHistory(Base):
    """Disease detection history model."""
    
    __tablename__ = "disease_detection_history"
    
    id = Column(Integer, primary_key=True, index=True)
    field_id = Column(Integer, ForeignKey("fields.id"), nullable=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    # Prediction details
    disease_type = Column(String(100), nullable=False)
    confidence = Column(Float, nullable=False)
    is_sick = Column(Boolean, nullable=False)
    description = Column(Text)
    
    # Model information
    model_type = Column(String(100), default="CNN")
    model_version = Column(String(50), default="1.0.0")
    
    # Image information
    image_filename = Column(String(255))
    image_size = Column(Integer)  # Size in bytes
    image_dimensions = Column(String(50))  # e.g., "224x224"
    
    # Full prediction data (JSON)
    prediction_data = Column(JSON)
    
    # Health record reference
    health_record_id = Column(Integer, ForeignKey("plant_health.id"), nullable=True)
    
    # Timestamps
    detected_at = Column(DateTime, default=datetime.utcnow)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    field = relationship("Field", back_populates="disease_history")
    user = relationship("User", back_populates="disease_history")
    health_record = relationship("PlantHealth", back_populates="disease_detections")
    
    def __repr__(self):
        return f"<DiseaseDetectionHistory(id={self.id}, disease_type='{self.disease_type}', confidence={self.confidence:.3f})>"
    
    def to_dict(self):
        """Convert to dictionary for API response."""
        return {
            "id": self.id,
            "field_id": self.field_id,
            "user_id": self.user_id,
            "disease_type": self.disease_type,
            "confidence": self.confidence,
            "is_sick": self.is_sick,
            "description": self.description,
            "model_type": self.model_type,
            "model_version": self.model_version,
            "image_filename": self.image_filename,
            "image_size": self.image_size,
            "image_dimensions": self.image_dimensions,
            "prediction_data": self.prediction_data,
            "health_record_id": self.health_record_id,
            "detected_at": self.detected_at.isoformat() if self.detected_at else None,
            "created_at": self.created_at.isoformat() if self.created_at else None
        } 
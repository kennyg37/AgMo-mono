"""Session models for tracking plant detection sessions."""

from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, Float, Text, JSON
from sqlalchemy.orm import relationship

from agmo.core.database import Base


class PlantDetectionSession(Base):
    """Plant detection session data."""
    
    __tablename__ = "plant_detection_sessions"
    
    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(String(255), unique=True, nullable=False, index=True)
    plant_id = Column(String(255), nullable=False)
    label = Column(String(255), nullable=False)
    health_status = Column(String(100), nullable=False)  # healthy, diseased, etc.
    
    # Location data
    location_x = Column(Float)
    location_y = Column(Float)
    location_z = Column(Float)
    
    # Additional metadata
    metadata = Column(JSON)  # Store additional data as JSON
    notes = Column(Text)
    
    # Timestamps
    detected_at = Column(DateTime, nullable=False)  # When the detection occurred
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def __repr__(self):
        return f"<PlantDetectionSession(session_id='{self.session_id}', plant_id='{self.plant_id}', label='{self.label}')>"
    
    def to_dict(self):
        """Convert to dictionary for API response."""
        return {
            "id": self.id,
            "session_id": self.session_id,
            "plant_id": self.plant_id,
            "label": self.label,
            "health_status": self.health_status,
            "location": {
                "x": self.location_x,
                "y": self.location_y,
                "z": self.location_z
            },
            "metadata": self.metadata,
            "notes": self.notes,
            "detected_at": self.detected_at.isoformat() if self.detected_at else None,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None
        } 
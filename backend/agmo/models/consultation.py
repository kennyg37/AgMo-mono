"""Consultation models."""

from datetime import datetime
from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text, ForeignKey, Float, JSON
from sqlalchemy.orm import relationship

from agmo.core.database import Base


class Consultation(Base):
    """Consultation model."""
    
    __tablename__ = "consultations"
    
    id = Column(String(36), primary_key=True, index=True)  # UUID
    consultant_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    farmer_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    status = Column(String(20), default="pending")  # pending, active, closed
    subject = Column(String(200), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships - temporarily commented out to avoid SQLAlchemy conflicts
    # consultant = relationship("User", foreign_keys=[consultant_id])
    # farmer = relationship("User", foreign_keys=[farmer_id])
    messages = relationship("ConsultationMessage", back_populates="consultation", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<Consultation(id={self.id}, subject='{self.subject}', status='{self.status}')>"
    
    def to_dict(self):
        """Convert to dictionary for API response."""
        return {
            "id": self.id,
            "consultant_id": self.consultant_id,
            "farmer_id": self.farmer_id,
            "status": self.status,
            "subject": self.subject,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
            "messages": [message.to_dict() for message in self.messages],
            "consultant": None  # Temporarily disabled due to SQLAlchemy conflicts
        }


class ConsultationMessage(Base):
    """Consultation message model."""
    
    __tablename__ = "consultation_messages"
    
    id = Column(String(36), primary_key=True, index=True)  # UUID
    consultation_id = Column(String(36), ForeignKey("consultations.id"), nullable=False)
    sender = Column(String(20), nullable=False)  # farmer, consultant
    content = Column(Text, nullable=False)
    message_type = Column(String(20), default="text")  # text, image, file
    attachments = Column(JSON)
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    consultation = relationship("Consultation", back_populates="messages")
    
    def __repr__(self):
        return f"<ConsultationMessage(id={self.id}, sender='{self.sender}', content='{self.content[:50]}...')>"
    
    def to_dict(self):
        """Convert to dictionary for API response."""
        return {
            "id": self.id,
            "consultation_id": self.consultation_id,
            "sender": self.sender,
            "content": self.content,
            "message_type": self.message_type,
            "attachments": self.attachments,
            "is_read": self.is_read,
            "timestamp": self.created_at.isoformat() if self.created_at else None,
            "created_at": self.created_at.isoformat() if self.created_at else None
        } 
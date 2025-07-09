"""User model for authentication and profile management."""

from datetime import datetime
from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text
from sqlalchemy.orm import relationship

from agmo.core.database import Base


class User(Base):
    """User model for authentication and profile management."""
    
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    username = Column(String(100), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255))
    phone = Column(String(20))
    is_active = Column(Boolean, default=True)
    is_verified = Column(Boolean, default=False)
    role = Column(String(50), default="farmer")  # farmer, admin, consultant
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Profile fields
    bio = Column(Text)
    location = Column(String(255))
    experience_years = Column(Integer, default=0)
    farm_size = Column(Integer)  # in acres
    primary_crops = Column(String(500))  # comma-separated
    
    # Relationships
    farms = relationship("Farm", back_populates="owner")
    chat_messages = relationship("ChatMessage", back_populates="user")
    decision_logs = relationship("DecisionLog", back_populates="user")
    
    def __repr__(self):
        return f"<User(id={self.id}, email='{self.email}', username='{self.username}')>" 
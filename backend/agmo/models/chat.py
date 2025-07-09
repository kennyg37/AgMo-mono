"""Chat models for AI chatbot functionality."""

from datetime import datetime
from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text, ForeignKey, Float
from sqlalchemy.orm import relationship

from agmo.core.database import Base


class ChatMessage(Base):
    """Chat message model for AI chatbot conversations."""
    
    __tablename__ = "chat_messages"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    session_id = Column(String(255), nullable=False)
    
    # Message details
    role = Column(String(50), nullable=False)  # user, assistant, system
    content = Column(Text, nullable=False)
    message_type = Column(String(50), default="text")  # text, image, file
    
    # AI-specific fields
    model_used = Column(String(100))  # gpt-4, gpt-3.5-turbo, etc.
    tokens_used = Column(Integer)
    response_time = Column(Float)  # seconds
    
    # Context and metadata
    context = Column(Text)  # JSON string for conversation context
    intent = Column(String(255))  # detected user intent
    confidence = Column(Float)  # confidence score for intent detection
    
    # User feedback
    helpful_rating = Column(Integer)  # 1-5 rating
    feedback_comment = Column(Text)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    user = relationship("User", back_populates="chat_messages")
    
    def __repr__(self):
        return f"<ChatMessage(id={self.id}, user_id={self.user_id}, role='{self.role}', session_id='{self.session_id}')>" 
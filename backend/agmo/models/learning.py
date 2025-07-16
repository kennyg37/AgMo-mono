"""Learning and course materials models."""

from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime, Boolean, ForeignKey
from sqlalchemy.orm import relationship

from agmo.core.database import Base


class CourseMaterial(Base):
    """Course material model for learning center."""
    
    __tablename__ = "course_materials"
    
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    description = Column(Text)
    content = Column(Text, nullable=False)
    category = Column(String(100))  # e.g., "crop_management", "pest_control", "soil_health"
    difficulty_level = Column(String(50))  # "beginner", "intermediate", "advanced"
    author_id = Column(Integer, ForeignKey("users.id"))
    is_published = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    author = relationship("User", back_populates="course_materials")
    
    def __repr__(self):
        return f"<CourseMaterial(id={self.id}, title='{self.title}', category='{self.category}')>" 
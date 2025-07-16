"""Learning center routes for course materials."""

from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from pydantic import BaseModel

from agmo.core.auth import require_consultant, require_farmer, get_current_user_with_role
from agmo.core.database import get_db
from agmo.models.user import User
from agmo.models.learning import CourseMaterial

router = APIRouter(prefix="/learning", tags=["learning"])


class CourseMaterialCreate(BaseModel):
    """Course material creation model."""
    title: str
    description: Optional[str] = None
    content: str
    category: str
    difficulty_level: str = "beginner"


class CourseMaterialUpdate(BaseModel):
    """Course material update model."""
    title: Optional[str] = None
    description: Optional[str] = None
    content: Optional[str] = None
    category: Optional[str] = None
    difficulty_level: Optional[str] = None
    is_published: Optional[bool] = None


class CourseMaterialResponse(BaseModel):
    """Course material response model."""
    id: int
    title: str
    description: Optional[str]
    content: str
    category: str
    difficulty_level: str
    author_id: int
    author_name: str
    is_published: bool
    created_at: str

    class Config:
        from_attributes = True

    @classmethod
    def from_orm(cls, obj, author_name=None):
        """Convert ORM object to response model with proper datetime handling."""
        data = obj.__dict__.copy()
        # Convert datetime to string if it exists
        if 'created_at' in data and data['created_at']:
            data['created_at'] = data['created_at'].isoformat()
        # Set author_name if provided
        if author_name:
            data['author_name'] = author_name
        return cls(**data)


@router.post("/materials", response_model=CourseMaterialResponse)
async def create_course_material(
    material_data: CourseMaterialCreate,
    current_user: User = Depends(require_consultant),
    db: Session = Depends(get_db)
):
    """Create new course material (consultant only)."""
    db_material = CourseMaterial(
        title=material_data.title,
        description=material_data.description,
        content=material_data.content,
        category=material_data.category,
        difficulty_level=material_data.difficulty_level,
        author_id=current_user.id
    )
    
    db.add(db_material)
    db.commit()
    db.refresh(db_material)
    
    return CourseMaterialResponse.from_orm(
        db_material, 
        author_name=current_user.full_name or current_user.username
    )


@router.get("/materials", response_model=List[CourseMaterialResponse])
async def get_course_materials(
    category: Optional[str] = Query(None),
    difficulty_level: Optional[str] = Query(None),
    current_user: User = Depends(get_current_user_with_role),
    db: Session = Depends(get_db)
):
    """Get course materials (all users can view published materials)."""
    query = db.query(CourseMaterial).filter(CourseMaterial.is_published == True)
    
    if category:
        query = query.filter(CourseMaterial.category == category)
    if difficulty_level:
        query = query.filter(CourseMaterial.difficulty_level == difficulty_level)
    
    materials = query.all()
    
    # Get author names
    result = []
    for material in materials:
        author = db.query(User).filter(User.id == material.author_id).first()
        author_name = author.full_name or author.username if author else "Unknown"
        result.append(CourseMaterialResponse.from_orm(material, author_name=author_name))
    
    return result


@router.get("/materials/my", response_model=List[CourseMaterialResponse])
async def get_my_course_materials(
    current_user: User = Depends(require_consultant),
    db: Session = Depends(get_db)
):
    """Get consultant's own course materials."""
    materials = db.query(CourseMaterial).filter(
        CourseMaterial.author_id == current_user.id
    ).all()
    
    author_name = current_user.full_name or current_user.username
    return [CourseMaterialResponse.from_orm(material, author_name=author_name) for material in materials]


@router.put("/materials/{material_id}")
async def update_course_material(
    material_id: int,
    material_data: CourseMaterialUpdate,
    current_user: User = Depends(require_consultant),
    db: Session = Depends(get_db)
):
    """Update course material (author only)."""
    material = db.query(CourseMaterial).filter(
        CourseMaterial.id == material_id,
        CourseMaterial.author_id == current_user.id
    ).first()
    
    if not material:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Course material not found or access denied"
        )
    
    # Update only provided fields
    update_data = material_data.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(material, field, value)
    
    db.commit()
    db.refresh(material)
    
    return {"message": "Course material updated successfully"}


@router.delete("/materials/{material_id}")
async def delete_course_material(
    material_id: int,
    current_user: User = Depends(require_consultant),
    db: Session = Depends(get_db)
):
    """Delete course material (author only)."""
    material = db.query(CourseMaterial).filter(
        CourseMaterial.id == material_id,
        CourseMaterial.author_id == current_user.id
    ).first()
    
    if not material:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Course material not found or access denied"
        )
    
    db.delete(material)
    db.commit()
    
    return {"message": "Course material deleted successfully"}


@router.get("/test")
async def test_learning_endpoint():
    """Test endpoint to verify learning API is working."""
    return {"message": "Learning API is working!", "status": "success"}


@router.get("/categories")
async def get_course_categories():
    """Get available course categories."""
    return {
        "categories": [
            "crop_management",
            "pest_control", 
            "soil_health",
            "irrigation",
            "harvesting",
            "sustainable_farming",
            "technology",
            "business_management"
        ],
        "difficulty_levels": [
            "beginner",
            "intermediate", 
            "advanced"
        ]
    } 
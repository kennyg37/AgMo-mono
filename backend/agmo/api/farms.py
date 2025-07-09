"""Farm management routes."""

from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel

from agmo.core.auth import get_current_active_user
from agmo.core.database import get_db
from agmo.models import User, Farm, Field, Crop
from agmo.models.farm import CropType, GrowthStage

router = APIRouter(prefix="/farms", tags=["farms"])


# Pydantic models
class FarmCreate(BaseModel):
    """Farm creation model."""
    name: str
    description: Optional[str] = None
    location: Optional[str] = None
    total_acres: Optional[float] = None


class FarmResponse(BaseModel):
    """Farm response model."""
    id: int
    name: str
    description: Optional[str]
    location: Optional[str]
    total_acres: Optional[float]
    owner_id: int
    is_active: bool
    created_at: str
    updated_at: str

    class Config:
        from_attributes = True


class FieldCreate(BaseModel):
    """Field creation model."""
    name: str
    acres: float
    soil_type: Optional[str] = None
    irrigation_type: Optional[str] = None
    coordinates: Optional[str] = None


class FieldResponse(BaseModel):
    """Field response model."""
    id: int
    name: str
    farm_id: int
    acres: float
    soil_type: Optional[str]
    irrigation_type: Optional[str]
    coordinates: Optional[str]
    is_active: bool
    created_at: str
    updated_at: str

    class Config:
        from_attributes = True


class CropCreate(BaseModel):
    """Crop creation model."""
    crop_type: CropType
    variety: Optional[str] = None
    planting_date: datetime
    expected_harvest_date: Optional[datetime] = None
    growth_stage: GrowthStage = GrowthStage.SEEDING
    yield_estimate: Optional[float] = None
    notes: Optional[str] = None


class CropResponse(BaseModel):
    """Crop response model."""
    id: int
    field_id: int
    crop_type: CropType
    variety: Optional[str]
    planting_date: datetime
    expected_harvest_date: Optional[datetime]
    actual_harvest_date: Optional[datetime]
    growth_stage: GrowthStage
    yield_estimate: Optional[float]
    actual_yield: Optional[float]
    notes: Optional[str]
    is_active: bool
    created_at: str
    updated_at: str

    class Config:
        from_attributes = True


# Farm routes
@router.post("/", response_model=FarmResponse)
async def create_farm(
    farm_data: FarmCreate,
    current_user_id: int = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Create a new farm."""
    db_farm = Farm(
        **farm_data.dict(),
        owner_id=current_user_id
    )
    db.add(db_farm)
    db.commit()
    db.refresh(db_farm)
    return FarmResponse.from_orm(db_farm)


@router.get("/", response_model=List[FarmResponse])
async def get_farms(
    current_user_id: int = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get all farms for current user."""
    farms = db.query(Farm).filter(
        Farm.owner_id == current_user_id,
        Farm.is_active == True
    ).all()
    return [FarmResponse.from_orm(farm) for farm in farms]


@router.get("/{farm_id}", response_model=FarmResponse)
async def get_farm(
    farm_id: int,
    current_user_id: int = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get a specific farm."""
    farm = db.query(Farm).filter(
        Farm.id == farm_id,
        Farm.owner_id == current_user_id
    ).first()
    
    if not farm:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Farm not found"
        )
    
    return FarmResponse.from_orm(farm)


@router.put("/{farm_id}", response_model=FarmResponse)
async def update_farm(
    farm_id: int,
    farm_data: FarmCreate,
    current_user_id: int = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Update a farm."""
    farm = db.query(Farm).filter(
        Farm.id == farm_id,
        Farm.owner_id == current_user_id
    ).first()
    
    if not farm:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Farm not found"
        )
    
    for field, value in farm_data.dict(exclude_unset=True).items():
        setattr(farm, field, value)
    
    db.commit()
    db.refresh(farm)
    return FarmResponse.from_orm(farm)


@router.delete("/{farm_id}")
async def delete_farm(
    farm_id: int,
    current_user_id: int = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Delete a farm (soft delete)."""
    farm = db.query(Farm).filter(
        Farm.id == farm_id,
        Farm.owner_id == current_user_id
    ).first()
    
    if not farm:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Farm not found"
        )
    
    farm.is_active = False
    db.commit()
    return {"message": "Farm deleted successfully"}


# Field routes
@router.post("/{farm_id}/fields", response_model=FieldResponse)
async def create_field(
    farm_id: int,
    field_data: FieldCreate,
    current_user_id: int = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Create a new field in a farm."""
    # Verify farm ownership
    farm = db.query(Farm).filter(
        Farm.id == farm_id,
        Farm.owner_id == current_user_id
    ).first()
    
    if not farm:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Farm not found"
        )
    
    db_field = Field(
        **field_data.dict(),
        farm_id=farm_id
    )
    db.add(db_field)
    db.commit()
    db.refresh(db_field)
    return FieldResponse.from_orm(db_field)


@router.get("/{farm_id}/fields", response_model=List[FieldResponse])
async def get_fields(
    farm_id: int,
    current_user_id: int = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get all fields in a farm."""
    # Verify farm ownership
    farm = db.query(Farm).filter(
        Farm.id == farm_id,
        Farm.owner_id == current_user_id
    ).first()
    
    if not farm:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Farm not found"
        )
    
    fields = db.query(Field).filter(
        Field.farm_id == farm_id,
        Field.is_active == True
    ).all()
    return [FieldResponse.from_orm(field) for field in fields]


# Crop routes
@router.post("/fields/{field_id}/crops", response_model=CropResponse)
async def create_crop(
    field_id: int,
    crop_data: CropCreate,
    current_user_id: int = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Create a new crop in a field."""
    # Verify field ownership through farm
    field = db.query(Field).join(Farm).filter(
        Field.id == field_id,
        Farm.owner_id == current_user_id
    ).first()
    
    if not field:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Field not found"
        )
    
    db_crop = Crop(
        **crop_data.dict(),
        field_id=field_id
    )
    db.add(db_crop)
    db.commit()
    db.refresh(db_crop)
    return CropResponse.from_orm(db_crop)


@router.get("/fields/{field_id}/crops", response_model=List[CropResponse])
async def get_crops(
    field_id: int,
    current_user_id: int = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get all crops in a field."""
    # Verify field ownership through farm
    field = db.query(Field).join(Farm).filter(
        Field.id == field_id,
        Farm.owner_id == current_user_id
    ).first()
    
    if not field:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Field not found"
        )
    
    crops = db.query(Crop).filter(
        Crop.field_id == field_id,
        Crop.is_active == True
    ).all()
    return [CropResponse.from_orm(crop) for crop in crops] 
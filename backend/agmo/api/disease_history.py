"""Disease Detection History API."""

from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from datetime import datetime
from sqlalchemy.orm import Session

from agmo.core.auth import get_current_active_user
from agmo.core.database import get_db
from agmo.services.disease_history_service import disease_history_service

router = APIRouter(prefix="/disease-history", tags=["disease-history"])


@router.get("/test-stats")
async def get_test_stats(db: Session = Depends(get_db)):
    """
    Get test statistics without authentication.
    """
    try:
        stats = disease_history_service.get_detection_stats(
            db=db,
            user_id=1  # Default user ID for testing
        )
        
        return stats
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get test stats: {str(e)}")


@router.get("/public-stats")
async def get_public_stats(
    field_id: Optional[int] = Query(None, description="Filter by field ID"),
    days: int = Query(30, description="Number of days to look back"),
    db: Session = Depends(get_db)
):
    """
    Get public statistics without authentication.
    """
    try:
        stats = disease_history_service.get_detection_stats(
            db=db,
            user_id=1,  # Default user ID for testing
            field_id=field_id,
            days=days
        )
        
        return stats
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get public stats: {str(e)}")


@router.get("/public-history")
async def get_public_history(
    field_id: Optional[int] = Query(None, description="Filter by field ID"),
    disease_type: Optional[str] = Query(None, description="Filter by disease type"),
    days: int = Query(30, description="Number of days to look back"),
    limit: int = Query(100, description="Maximum number of records to return"),
    only_sick: bool = Query(False, description="Only return sick plant detections"),
    db: Session = Depends(get_db)
):
    """
    Get public disease history without authentication.
    """
    try:
        history = disease_history_service.get_detection_history(
            db=db,
            user_id=1,  # Default user ID for testing
            field_id=field_id,
            disease_type=disease_type,
            days=days,
            limit=limit,
            only_sick=only_sick
        )
        
        return [DiseaseHistoryResponse(**record.to_dict()) for record in history]
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get public history: {str(e)}")


class DiseaseHistoryResponse(BaseModel):
    """Disease history response model."""
    id: int
    field_id: Optional[int]
    user_id: int
    disease_type: str
    confidence: float
    is_sick: bool
    description: str
    model_type: str
    model_version: str
    image_filename: Optional[str]
    image_size: Optional[int]
    image_dimensions: Optional[str]
    health_record_id: Optional[int]
    detected_at: datetime
    created_at: datetime


@router.get("/", response_model=List[DiseaseHistoryResponse])
async def get_disease_history(
    field_id: Optional[int] = Query(None, description="Filter by field ID"),
    disease_type: Optional[str] = Query(None, description="Filter by disease type"),
    days: int = Query(30, description="Number of days to look back"),
    limit: int = Query(100, description="Maximum number of records to return"),
    current_user_id: int = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Get disease detection history with optional filtering.
    """
    try:
        history = disease_history_service.get_detection_history(
            db=db,
            user_id=current_user_id,
            field_id=field_id,
            disease_type=disease_type,
            days=days,
            limit=limit
        )
        
        return [DiseaseHistoryResponse(**record.to_dict()) for record in history]
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get disease history: {str(e)}")


@router.get("/recent", response_model=List[DiseaseHistoryResponse])
async def get_recent_detections(
    field_id: Optional[int] = Query(None, description="Filter by field ID"),
    limit: int = Query(10, description="Maximum number of records to return"),
    current_user_id: int = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Get recent disease detections.
    """
    try:
        history = disease_history_service.get_recent_detections(
            db=db,
            user_id=current_user_id,
            field_id=field_id,
            limit=limit
        )
        
        return [DiseaseHistoryResponse(**record.to_dict()) for record in history]
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get recent detections: {str(e)}")


@router.get("/stats")
async def get_detection_stats(
    field_id: Optional[int] = Query(None, description="Filter by field ID"),
    days: int = Query(30, description="Number of days to look back"),
    current_user_id: int = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Get statistics about disease detections.
    """
    try:
        stats = disease_history_service.get_detection_stats(
            db=db,
            user_id=current_user_id,
            field_id=field_id,
            days=days
        )
        
        return stats
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get detection stats: {str(e)}")


@router.get("/{detection_id}", response_model=DiseaseHistoryResponse)
async def get_detection_by_id(
    detection_id: int,
    current_user_id: int = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Get a specific disease detection by ID.
    """
    try:
        detection = disease_history_service.get_detection_by_id(db=db, detection_id=detection_id)
        
        if not detection:
            raise HTTPException(status_code=404, detail="Disease detection not found")
        
        return DiseaseHistoryResponse(**detection.to_dict())
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get detection: {str(e)}")


@router.get("/field/{field_id}/summary")
async def get_field_detection_summary(
    field_id: int,
    days: int = Query(30, description="Number of days to look back"),
    current_user_id: int = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Get a summary of disease detections for a specific field.
    """
    try:
        # Get stats for the field
        stats = disease_history_service.get_detection_stats(
            db=db,
            user_id=current_user_id,
            field_id=field_id,
            days=days
        )
        
        # Get recent detections for the field
        recent_detections = disease_history_service.get_recent_detections(
            db=db,
            user_id=current_user_id,
            field_id=field_id,
            limit=5
        )
        
        return {
            "field_id": field_id,
            "stats": stats,
            "recent_detections": [
                {
                    "id": d.id,
                    "disease_type": d.disease_type,
                    "confidence": d.confidence,
                    "is_sick": d.is_sick,
                    "detected_at": d.detected_at.isoformat() if d.detected_at else None
                }
                for d in recent_detections
            ]
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get field summary: {str(e)}") 
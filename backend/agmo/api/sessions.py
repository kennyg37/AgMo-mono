"""
Sessions API endpoints for plant detection data.
"""

import logging
from datetime import datetime
from typing import Dict, Any, List
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from agmo.core.database import get_db
from agmo.services.session_service import session_service

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/sessions", tags=["sessions"])


class LocationData(BaseModel):
    """Location data model."""
    x: float
    y: float
    z: float


class PlantDetectionRequest(BaseModel):
    """Plant detection session request model."""
    sessionId: str
    plantId: str
    label: str
    location: LocationData
    healthStatus: str
    timestamp: str


class PlantDetectionResponse(BaseModel):
    """Plant detection session response model."""
    success: bool
    session_id: str
    message: str
    alert_created: bool


@router.post("/plant-detection", response_model=PlantDetectionResponse)
async def create_plant_detection_session(
    request: PlantDetectionRequest,
    db: Session = Depends(get_db)
) -> PlantDetectionResponse:
    """
    Create a new plant detection session.
    
    This endpoint:
    1. Creates a database entry for the session
    2. Creates an alert for the frontend dashboard
    """
    
    try:
        # Check if session already exists
        existing_session = session_service.get_session(db, request.sessionId)
        if existing_session:
            return PlantDetectionResponse(
                success=False,
                session_id=request.sessionId,
                message="Session already exists",
                alert_created=False
            )
        
        # Create session in database
        session = session_service.create_session(
            db=db,
            session_id=request.sessionId,
            plant_id=request.plantId,
            label=request.label,
            health_status=request.healthStatus,
            location={
                "x": request.location.x,
                "y": request.location.y,
                "z": request.location.z
            },
            timestamp=request.timestamp
        )
        
        # Create alert for frontend dashboard
        session_service.create_alert_for_session(session)
        
        logger.info(f"✅ Created plant detection session: {request.sessionId}")
        
        return PlantDetectionResponse(
            success=True,
            session_id=request.sessionId,
            message="Plant detection session created successfully",
            alert_created=True
        )
        
    except Exception as e:
        logger.error(f"❌ Error creating plant detection session: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to create plant detection session: {str(e)}"
        )


@router.get("/plant-detection/{session_id}")
async def get_plant_detection_session(
    session_id: str,
    db: Session = Depends(get_db)
):
    """Get a specific plant detection session."""
    
    session = session_service.get_session(db, session_id)
    if not session:
        raise HTTPException(
            status_code=404,
            detail=f"Session {session_id} not found"
        )
    
    return session.to_dict()


@router.get("/plant-detection")
async def get_plant_detection_sessions(
    plant_id: str = None,
    health_status: str = None,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """Get plant detection sessions with optional filtering."""
    
    sessions = session_service.get_sessions(
        db=db,
        plant_id=plant_id,
        health_status=health_status,
        limit=limit
    )
    
    return [session.to_dict() for session in sessions] 
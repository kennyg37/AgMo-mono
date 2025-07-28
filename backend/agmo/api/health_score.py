"""
Health Score API

This module provides REST API endpoints for global crop health score calculations.
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from typing import Optional, List
import logging
from sqlalchemy.orm import Session

from agmo.core.database import get_db
from agmo.services.global_health_score_service import global_health_score_service

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/health-score", tags=["health-score"])


class HealthScoreResponse(BaseModel):
    """Health score response model."""
    global_score: float
    disease_impact_score: float
    confidence_weight: float
    time_window_days: int
    field_id: Optional[int]
    calculation_timestamp: str
    breakdown: dict


class HealthScoreTrendResponse(BaseModel):
    """Health score trend response model."""
    trend_data: List[dict]
    field_id: Optional[int]
    days: int


@router.get("/global", response_model=HealthScoreResponse)
async def get_global_health_score(
    field_id: Optional[int] = Query(None, description="Field ID (optional)"),
    time_window_days: int = Query(7, description="Time window in days (default: 7)"),
    db: Session = Depends(get_db)
):
    """
    Get global crop health score.
    
    Calculates a global health score using weighted disease prevalence approach:
    Global Score = 100 - (Disease Impact Score × Confidence Weight)
    
    Where:
    - Disease Impact Score = Σ(Disease Severity × Detection Count × Confidence)
    - Confidence Weight = Average confidence across all detections
    """
    
    try:
        if time_window_days < 1 or time_window_days > 365:
            raise HTTPException(
                status_code=400,
                detail="Time window must be between 1 and 365 days"
            )
        
        score_data = global_health_score_service.calculate_global_health_score(
            db=db,
            field_id=field_id,
            time_window_days=time_window_days
        )
        
        logger.info(f"🌱 Retrieved global health score: {score_data['global_score']}")
        
        return HealthScoreResponse(**score_data)
        
    except Exception as e:
        logger.error(f"❌ Error getting global health score: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to calculate health score: {str(e)}"
        )


@router.get("/trend", response_model=HealthScoreTrendResponse)
async def get_health_score_trend(
    field_id: Optional[int] = Query(None, description="Field ID (optional)"),
    days: int = Query(30, description="Number of days for trend (default: 30)"),
    db: Session = Depends(get_db)
):
    """
    Get health score trend over time.
    
    Returns daily health scores for the specified number of days.
    """
    
    try:
        if days < 1 or days > 365:
            raise HTTPException(
                status_code=400,
                detail="Days must be between 1 and 365"
            )
        
        trend_data = global_health_score_service.get_health_score_trend(
            db=db,
            field_id=field_id,
            days=days
        )
        
        logger.info(f"📈 Retrieved health score trend for {days} days")
        
        return HealthScoreTrendResponse(
            trend_data=trend_data,
            field_id=field_id,
            days=days
        )
        
    except Exception as e:
        logger.error(f"❌ Error getting health score trend: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get health score trend: {str(e)}"
        )


@router.get("/breakdown")
async def get_health_score_breakdown(
    field_id: Optional[int] = Query(None, description="Field ID (optional)"),
    time_window_days: int = Query(7, description="Time window in days (default: 7)"),
    db: Session = Depends(get_db)
):
    """
    Get detailed breakdown of health score calculation.
    
    Returns comprehensive information about how the health score was calculated,
    including disease statistics, confidence levels, and severity weights.
    """
    
    try:
        if time_window_days < 1 or time_window_days > 365:
            raise HTTPException(
                status_code=400,
                detail="Time window must be between 1 and 365 days"
            )
        
        score_data = global_health_score_service.calculate_global_health_score(
            db=db,
            field_id=field_id,
            time_window_days=time_window_days
        )
        
        # Return detailed breakdown
        breakdown = {
            "score_summary": {
                "global_score": score_data["global_score"],
                "disease_impact_score": score_data["disease_impact_score"],
                "confidence_weight": score_data["confidence_weight"],
                "time_window_days": score_data["time_window_days"]
            },
            "detailed_breakdown": score_data["breakdown"],
            "calculation_timestamp": score_data["calculation_timestamp"],
            "field_id": field_id
        }
        
        logger.info(f"📊 Retrieved health score breakdown for field {field_id}")
        
        return breakdown
        
    except Exception as e:
        logger.error(f"❌ Error getting health score breakdown: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get health score breakdown: {str(e)}"
        ) 
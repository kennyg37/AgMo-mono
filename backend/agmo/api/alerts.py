"""Alerts API for disease detection and health monitoring alerts."""

from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from datetime import datetime

from agmo.core.auth import get_current_active_user
from agmo.services.alert_service import alert_service, AlertSeverity, AlertType

router = APIRouter(prefix="/alerts", tags=["alerts"])


class AlertResponse(BaseModel):
    """Alert response model."""
    id: str
    alert_type: str
    severity: str
    title: str
    message: str
    field_id: Optional[int]
    metadata: dict
    timestamp: datetime


@router.get("/", response_model=List[AlertResponse])
async def get_alerts(
    field_id: Optional[int] = Query(None, description="Filter by field ID"),
    severity: Optional[str] = Query(None, description="Filter by severity (low, medium, high, critical)"),
    alert_type: Optional[str] = Query(None, description="Filter by alert type"),
    limit: int = Query(50, description="Maximum number of alerts to return"),
    current_user_id: int = Depends(get_current_active_user)
):
    """
    Get alerts with optional filtering.
    """
    try:
        # Parse severity filter
        severity_filter = None
        if severity:
            try:
                severity_filter = AlertSeverity(severity.lower())
            except ValueError:
                raise HTTPException(status_code=400, detail="Invalid severity level")
        
        # Parse alert type filter
        alert_type_filter = None
        if alert_type:
            try:
                alert_type_filter = AlertType(alert_type.lower())
            except ValueError:
                raise HTTPException(status_code=400, detail="Invalid alert type")
        
        # Get filtered alerts
        alerts = alert_service.get_alerts(
            field_id=field_id,
            severity=severity_filter,
            alert_type=alert_type_filter,
            limit=limit
        )
        
        # Convert to response format
        alert_responses = []
        for alert in alerts:
            alert_responses.append(AlertResponse(
                id=alert.id,
                alert_type=alert.alert_type.value,
                severity=alert.severity.value,
                title=alert.title,
                message=alert.message,
                field_id=alert.field_id,
                metadata=alert.metadata,
                timestamp=alert.timestamp
            ))
        
        return alert_responses
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get alerts: {str(e)}")


@router.get("/recent", response_model=List[AlertResponse])
async def get_recent_alerts(
    hours: int = Query(24, description="Number of hours to look back"),
    current_user_id: int = Depends(get_current_active_user)
):
    """
    Get recent alerts from the last N hours.
    """
    try:
        alerts = alert_service.get_recent_alerts(hours=hours)
        
        # Convert to response format
        alert_responses = []
        for alert in alerts:
            alert_responses.append(AlertResponse(
                id=alert.id,
                alert_type=alert.alert_type.value,
                severity=alert.severity.value,
                title=alert.title,
                message=alert.message,
                field_id=alert.field_id,
                metadata=alert.metadata,
                timestamp=alert.timestamp
            ))
        
        return alert_responses
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get recent alerts: {str(e)}")


@router.get("/disease", response_model=List[AlertResponse])
async def get_disease_alerts(
    field_id: Optional[int] = Query(None, description="Filter by field ID"),
    limit: int = Query(20, description="Maximum number of alerts to return"),
    current_user_id: int = Depends(get_current_active_user)
):
    """
    Get disease detection alerts specifically.
    """
    try:
        alerts = alert_service.get_alerts(
            field_id=field_id,
            alert_type=AlertType.DISEASE_DETECTED,
            limit=limit
        )
        
        # Convert to response format
        alert_responses = []
        for alert in alerts:
            alert_responses.append(AlertResponse(
                id=alert.id,
                alert_type=alert.alert_type.value,
                severity=alert.severity.value,
                title=alert.title,
                message=alert.message,
                field_id=alert.field_id,
                metadata=alert.metadata,
                timestamp=alert.timestamp
            ))
        
        return alert_responses
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get disease alerts: {str(e)}")


@router.get("/stats")
async def get_alert_stats(
    current_user_id: int = Depends(get_current_active_user)
):
    """
    Get alert statistics.
    """
    try:
        all_alerts = alert_service.get_alerts(limit=1000)
        recent_alerts = alert_service.get_recent_alerts(hours=24)
        
        # Count by severity
        severity_counts = {}
        for severity in AlertSeverity:
            severity_counts[severity.value] = len([
                a for a in all_alerts if a.severity == severity
            ])
        
        # Count by type
        type_counts = {}
        for alert_type in AlertType:
            type_counts[alert_type.value] = len([
                a for a in all_alerts if a.alert_type == alert_type
            ])
        
        return {
            "total_alerts": len(all_alerts),
            "recent_alerts": len(recent_alerts),
            "severity_counts": severity_counts,
            "type_counts": type_counts,
            "critical_alerts": len([
                a for a in all_alerts if a.severity == AlertSeverity.CRITICAL
            ])
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get alert stats: {str(e)}") 
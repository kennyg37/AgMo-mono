"""
Session Service for Plant Detection

This service handles plant detection session data and alerts.
"""

import logging
from datetime import datetime
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session as DBSession

from agmo.models.session import PlantDetectionSession
from agmo.services.alert_service import alert_service, AlertType, AlertSeverity

logger = logging.getLogger(__name__)


class SessionService:
    """Service for managing plant detection sessions."""
    
    def __init__(self):
        self.logger = logger
    
    def create_session(
        self,
        db: DBSession,
        session_id: str,
        plant_id: str,
        label: str,
        health_status: str,
        location: Dict[str, float],
        timestamp: Optional[datetime] = None,
        metadata: Optional[Dict[str, Any]] = None
    ) -> PlantDetectionSession:
        """Create a new plant detection session."""
        
        # Parse timestamp
        if timestamp is None:
            timestamp = datetime.utcnow()
        elif isinstance(timestamp, str):
            timestamp = datetime.fromisoformat(timestamp.replace('Z', '+00:00'))
        
        # Create session record
        session = PlantDetectionSession(
            session_id=session_id,
            plant_id=plant_id,
            label=label,
            health_status=health_status,
            location_x=location.get('x'),
            location_y=location.get('y'),
            location_z=location.get('z'),
            detected_at=timestamp,
            session_metadata=metadata or {}
        )
        
        # Save to database
        db.add(session)
        db.commit()
        db.refresh(session)
        
        self.logger.info(f"📝 Created session: {session_id} for plant {plant_id}")
        
        return session
    
    def get_session(self, db: DBSession, session_id: str) -> Optional[PlantDetectionSession]:
        """Get a session by session ID."""
        return db.query(PlantDetectionSession).filter(
            PlantDetectionSession.session_id == session_id
        ).first()
    
    def get_sessions(
        self,
        db: DBSession,
        plant_id: Optional[str] = None,
        health_status: Optional[str] = None,
        limit: int = 100
    ) -> List[PlantDetectionSession]:
        """Get filtered sessions."""
        
        query = db.query(PlantDetectionSession)
        
        if plant_id:
            query = query.filter(PlantDetectionSession.plant_id == plant_id)
        
        if health_status:
            query = query.filter(PlantDetectionSession.health_status == health_status)
        
        return query.order_by(PlantDetectionSession.created_at.desc()).limit(limit).all()
    
    def create_alert_for_session(
        self,
        session: PlantDetectionSession
    ) -> None:
        """Create an alert for a plant detection session."""
        
        # Create alert using existing alert service
        if session.health_status.lower() == 'diseased':
            alert = alert_service.create_disease_alert(
                disease_type=session.label,
                confidence=0.8,  # Default confidence for session alerts
                field_id=1,  # Default field ID
                description=f"Plant {session.plant_id} detected with {session.label}"
            )
        else:
            alert = alert_service.create_health_decline_alert(
                field_id=1,  # Default field ID
                health_score=50.0,  # Default health score
                previous_score=80.0  # Default previous score
            )
        
        self.logger.info(f"🚨 Created alert for session: {session.session_id}")


# Global session service instance
session_service = SessionService() 
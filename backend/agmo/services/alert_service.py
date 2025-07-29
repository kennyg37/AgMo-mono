"""
Alert Service for Disease Detection

This service handles alert generation and notification for disease detection events.
"""

import logging
from datetime import datetime
from typing import Dict, Any, List, Optional
from enum import Enum

logger = logging.getLogger(__name__)


class AlertSeverity(Enum):
    """Alert severity levels."""
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class AlertType(Enum):
    """Alert types."""
    DISEASE_DETECTED = "disease_detected"
    HEALTH_DECLINE = "health_decline"
    WEATHER_WARNING = "weather_warning"
    SYSTEM_ALERT = "system_alert"


class Alert:
    """Alert data structure."""
    
    def __init__(
        self,
        alert_type: AlertType,
        severity: AlertSeverity,
        title: str,
        message: str,
        field_id: Optional[int] = None,
        metadata: Optional[Dict[str, Any]] = None
    ):
        self.alert_type = alert_type
        self.severity = severity
        self.title = title
        self.message = message
        self.field_id = field_id
        self.metadata = metadata or {}
        self.timestamp = datetime.utcnow()
        self.id = f"{alert_type.value}_{self.timestamp.strftime('%Y%m%d_%H%M%S')}"


class AlertService:
    """Service for managing alerts and notifications."""
    
    def __init__(self):
        self.alerts: List[Alert] = []
    
    def create_disease_alert(
        self,
        disease_type: str,
        confidence: float,
        field_id: int,
        description: str
    ) -> Alert:
        """Create a disease detection alert."""
        
        # Determine severity based on confidence and disease type
        if confidence > 0.8:
            severity = AlertSeverity.CRITICAL
        elif confidence > 0.6:
            severity = AlertSeverity.HIGH
        else:
            severity = AlertSeverity.MEDIUM
        
        # Create alert title and message
        title = f"Disease Detected: {disease_type.title()}"
        message = f"{disease_type.upper()} detected in field {field_id}\n"
        message += f"Confidence: {confidence:.1%}\n"
        message += f"Description: {description}\n"
        message += "Immediate action recommended!"
        
        alert = Alert(
            alert_type=AlertType.DISEASE_DETECTED,
            severity=severity,
            title=title,
            message=message,
            field_id=field_id,
            metadata={
                "disease_type": disease_type,
                "confidence": confidence,
                "description": description
            }
        )
        
        self.alerts.append(alert)
        logger.info(f"Created disease alert: {disease_type} (field {field_id})")
        
        return alert
    
    def create_health_decline_alert(
        self,
        field_id: int,
        health_score: float,
        previous_score: float
    ) -> Alert:
        """Create a health decline alert."""
        
        decline = previous_score - health_score
        
        if decline > 30:
            severity = AlertSeverity.CRITICAL
        elif decline > 20:
            severity = AlertSeverity.HIGH
        elif decline > 10:
            severity = AlertSeverity.MEDIUM
        else:
            severity = AlertSeverity.LOW
        
        title = f"Health Decline Detected"
        message = f"📉 Plant health declined in field {field_id}\n"
        message += f"Current score: {health_score:.1f}\n"
        message += f"Previous score: {previous_score:.1f}\n"
        message += f"Decline: {decline:.1f} points"
        
        alert = Alert(
            alert_type=AlertType.HEALTH_DECLINE,
            severity=severity,
            title=title,
            message=message,
            field_id=field_id,
            metadata={
                "current_score": health_score,
                "previous_score": previous_score,
                "decline": decline
            }
        )
        
        self.alerts.append(alert)
        logger.info(f"📉 Created health decline alert for field {field_id}")
        
        return alert
    
    def get_alerts(
        self,
        field_id: Optional[int] = None,
        severity: Optional[AlertSeverity] = None,
        alert_type: Optional[AlertType] = None,
        limit: int = 50
    ) -> List[Alert]:
        """Get filtered alerts."""
        
        filtered_alerts = self.alerts
        
        if field_id is not None:
            filtered_alerts = [a for a in filtered_alerts if a.field_id == field_id]
        
        if severity is not None:
            filtered_alerts = [a for a in filtered_alerts if a.severity == severity]
        
        if alert_type is not None:
            filtered_alerts = [a for a in filtered_alerts if a.alert_type == alert_type]
        
        # Sort by timestamp (newest first)
        filtered_alerts.sort(key=lambda x: x.timestamp, reverse=True)
        
        return filtered_alerts[:limit]
    
    def get_recent_alerts(self, hours: int = 24) -> List[Alert]:
        """Get alerts from the last N hours."""
        from datetime import timedelta
        
        cutoff_time = datetime.utcnow() - timedelta(hours=hours)
        recent_alerts = [a for a in self.alerts if a.timestamp >= cutoff_time]
        
        # Sort by timestamp (newest first)
        recent_alerts.sort(key=lambda x: x.timestamp, reverse=True)
        
        return recent_alerts
    
    def clear_old_alerts(self, days: int = 30):
        """Clear alerts older than N days."""
        from datetime import timedelta
        
        cutoff_time = datetime.utcnow() - timedelta(days=days)
        self.alerts = [a for a in self.alerts if a.timestamp >= cutoff_time]
        
        logger.info(f"🧹 Cleared alerts older than {days} days")


# Global alert service instance
alert_service = AlertService() 
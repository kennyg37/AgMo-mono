"""
Disease Alert Service

This service integrates disease detection with the plant health monitoring system
to automatically create alerts and health records when diseases are detected.
"""

import logging
from datetime import datetime
from typing import Optional, Dict, Any
from sqlalchemy.orm import Session

from agmo.models.monitoring import PlantHealth, HealthStatus
from agmo.core.database import get_db
from agmo.services.alert_service import alert_service
from agmo.services.disease_history_service import disease_history_service

logger = logging.getLogger(__name__)


class DiseaseAlertService:
    """Service for handling disease detection alerts and health monitoring integration."""
    
    @staticmethod
    def map_disease_to_health_status(disease_type: str, confidence: float) -> HealthStatus:
        """Map disease type and confidence to health status."""
        if disease_type == "healthy":
            return HealthStatus.EXCELLENT if confidence > 0.9 else HealthStatus.GOOD
        
        # Disease detected - map to appropriate health status
        if confidence > 0.8:
            return HealthStatus.CRITICAL
        elif confidence > 0.6:
            return HealthStatus.POOR
        else:
            return HealthStatus.FAIR
    
    @staticmethod
    def calculate_health_score(disease_type: str, confidence: float) -> float:
        """Calculate health score based on disease detection."""
        if disease_type == "healthy":
            return min(100.0, 80.0 + (confidence * 20.0))
        
        # Disease detected - lower health score
        if disease_type == "blight":
            base_score = 30.0
        elif disease_type == "common rust":
            base_score = 40.0
        elif disease_type == "gray leaf spot":
            base_score = 35.0
        else:
            base_score = 50.0
        
        # Adjust based on confidence
        return max(0.0, base_score - (confidence * 20.0))
    
    @staticmethod
    def create_health_record_from_detection(
        db: Session,
        field_id: int,
        disease_prediction: Dict[str, Any],
        image_url: Optional[str] = None
    ) -> PlantHealth:
        """Create a plant health record from disease detection results."""
        
        prediction = disease_prediction.get("prediction", "healthy")
        confidence = disease_prediction.get("confidence", 0.0)
        is_sick = disease_prediction.get("is_sick", False)
        description = disease_prediction.get("description", "")
        
        # Calculate health metrics
        health_score = DiseaseAlertService.calculate_health_score(prediction, confidence)
        health_status = DiseaseAlertService.map_disease_to_health_status(prediction, confidence)
        
        # Create health record
        health_record = PlantHealth(
            field_id=field_id,
            health_score=health_score,
            status=health_status,
            disease_detected=is_sick,
            disease_type=prediction if is_sick else None,
            pest_infestation=False,  # Could be enhanced to detect pests
            pest_type=None,
            nutrient_deficiency=None,  # Could be enhanced to detect nutrient issues
            stress_factors=description if is_sick else None,
            image_url=image_url,
            notes=f"AI Disease Detection: {prediction} (confidence: {confidence:.3f})",
            recorded_at=datetime.utcnow()
        )
        
        # Save to database
        db.add(health_record)
        db.commit()
        db.refresh(health_record)
        
        # Create alert if disease is detected
        if is_sick and confidence > 0.5:
            alert_service.create_disease_alert(
                disease_type=prediction,
                confidence=confidence,
                field_id=field_id,
                description=description
            )
        
        # Save to history (assuming user_id=1 for now)
        try:
            disease_history_service.save_detection_history(
                db=db,
                user_id=1,  # Default user ID, can be enhanced with authentication
                field_id=field_id,
                prediction_data=disease_prediction,
                health_record_id=health_record.id
            )
        except Exception as e:
            logger.warning(f"⚠️ Failed to save detection history: {e}")
        
        logger.info(f"🌱 Created health record for field {field_id}: {prediction} (score: {health_score:.1f})")
        
        return health_record
    
    @staticmethod
    def generate_alert_message(disease_prediction: Dict[str, Any]) -> str:
        """Generate a human-readable alert message from disease detection."""
        
        prediction = disease_prediction.get("prediction", "healthy")
        confidence = disease_prediction.get("confidence", 0.0)
        description = disease_prediction.get("description", "")
        
        if prediction == "healthy":
            return f"✅ Plant appears healthy (confidence: {confidence:.1%})"
        
        # Disease detected
        severity = "HIGH" if confidence > 0.8 else "MEDIUM" if confidence > 0.6 else "LOW"
        
        alert_message = f"🚨 DISEASE DETECTED: {prediction.upper()}\n"
        alert_message += f"Severity: {severity}\n"
        alert_message += f"Confidence: {confidence:.1%}\n"
        alert_message += f"Description: {description}\n"
        alert_message += "⚠️ Immediate action recommended!"
        
        return alert_message
    
    @staticmethod
    def should_create_alert(disease_prediction: Dict[str, Any]) -> bool:
        """Determine if an alert should be created based on disease detection."""
        
        prediction = disease_prediction.get("prediction", "healthy")
        confidence = disease_prediction.get("confidence", 0.0)
        
        # Create alert for any disease with confidence > 0.5
        return prediction != "healthy" and confidence > 0.5


# Global service instance
disease_alert_service = DiseaseAlertService() 
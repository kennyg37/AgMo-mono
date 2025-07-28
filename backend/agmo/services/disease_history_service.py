"""
Disease Detection History Service

This service manages the history of disease detection predictions
and provides analytics on detection patterns.
"""

import logging
from datetime import datetime, timedelta
from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import desc, func

from agmo.models.disease_history import DiseaseDetectionHistory
from agmo.models.user import User
from agmo.models.farm import Field

logger = logging.getLogger(__name__)


class DiseaseHistoryService:
    """Service for managing disease detection history."""
    
    @staticmethod
    def save_detection_history(
        db: Session,
        user_id: int,
        prediction_data: Dict[str, Any],
        field_id: Optional[int] = None,
        image_filename: Optional[str] = None,
        image_size: Optional[int] = None,
        image_dimensions: Optional[str] = None,
        health_record_id: Optional[int] = None
    ) -> DiseaseDetectionHistory:
        """Save a disease detection prediction to history."""
        
        try:
            # Extract prediction details
            disease_type = prediction_data.get("prediction", "healthy")
            confidence = prediction_data.get("confidence", 0.0)
            is_sick = prediction_data.get("is_sick", False)
            description = prediction_data.get("description", "")
            
            # Convert prediction_data to JSON-serializable format
            import json
            import numpy as np
            
            def convert_to_json_serializable(obj):
                """Convert numpy types and other non-serializable objects to JSON-serializable format."""
                if isinstance(obj, np.bool_):
                    return bool(obj)
                elif isinstance(obj, np.integer):
                    return int(obj)
                elif isinstance(obj, np.floating):
                    return float(obj)
                elif isinstance(obj, np.ndarray):
                    return obj.tolist()
                elif isinstance(obj, dict):
                    return {key: convert_to_json_serializable(value) for key, value in obj.items()}
                elif isinstance(obj, list):
                    return [convert_to_json_serializable(item) for item in obj]
                else:
                    return obj
            
            serializable_prediction_data = convert_to_json_serializable(prediction_data)
            
            # Create history record
            history_record = DiseaseDetectionHistory(
                user_id=user_id,
                field_id=field_id,
                disease_type=disease_type,
                confidence=confidence,
                is_sick=is_sick,
                description=description,
                model_type="ONNX",
                model_version="1.0.0",
                image_filename=image_filename,
                image_size=image_size,
                image_dimensions=image_dimensions,
                prediction_data=serializable_prediction_data,
                health_record_id=health_record_id,
                detected_at=datetime.utcnow()
            )
            
            # Save to database
            db.add(history_record)
            db.commit()
            db.refresh(history_record)
            
            logger.info(f"📝 Saved disease detection history: {disease_type} (confidence: {confidence:.3f})")
            
            return history_record
            
        except Exception as e:
            logger.error(f"❌ Failed to save disease detection history: {e}")
            db.rollback()
            raise
    
    @staticmethod
    def get_detection_history(
        db: Session,
        user_id: Optional[int] = None,
        field_id: Optional[int] = None,
        disease_type: Optional[str] = None,
        days: int = 30,
        limit: int = 100,
        only_sick: bool = False
    ) -> List[DiseaseDetectionHistory]:
        """Get disease detection history with optional filtering."""
        
        try:
            query = db.query(DiseaseDetectionHistory)
            
            # Apply filters
            if user_id:
                query = query.filter(DiseaseDetectionHistory.user_id == user_id)
            
            if field_id:
                query = query.filter(DiseaseDetectionHistory.field_id == field_id)
            
            if disease_type:
                query = query.filter(DiseaseDetectionHistory.disease_type == disease_type)
            
            # Filter to only show sick plants if requested
            if only_sick:
                query = query.filter(DiseaseDetectionHistory.is_sick == True)
            
            # Filter by date range
            cutoff_date = datetime.utcnow() - timedelta(days=days)
            query = query.filter(DiseaseDetectionHistory.detected_at >= cutoff_date)
            
            # Order by detection time (newest first)
            query = query.order_by(desc(DiseaseDetectionHistory.detected_at))
            
            # Apply limit
            query = query.limit(limit)
            
            return query.all()
            
        except Exception as e:
            logger.error(f"❌ Failed to get disease detection history: {e}")
            return []
    
    @staticmethod
    def get_detection_stats(
        db: Session,
        user_id: Optional[int] = None,
        field_id: Optional[int] = None,
        days: int = 30
    ) -> Dict[str, Any]:
        """Get statistics about disease detections."""
        
        try:
            query = db.query(DiseaseDetectionHistory)
            
            # Apply filters
            if user_id:
                query = query.filter(DiseaseDetectionHistory.user_id == user_id)
            
            if field_id:
                query = query.filter(DiseaseDetectionHistory.field_id == field_id)
            
            # Filter by date range
            cutoff_date = datetime.utcnow() - timedelta(days=days)
            query = query.filter(DiseaseDetectionHistory.detected_at >= cutoff_date)
            
            # Get total detections
            total_detections = query.count()
            
            # Get disease type counts
            disease_counts = db.query(
                DiseaseDetectionHistory.disease_type,
                func.count(DiseaseDetectionHistory.id).label('count')
            ).filter(
                DiseaseDetectionHistory.detected_at >= cutoff_date
            ).group_by(
                DiseaseDetectionHistory.disease_type
            ).all()
            
            # Get confidence statistics
            confidence_stats = db.query(
                func.avg(DiseaseDetectionHistory.confidence).label('avg_confidence'),
                func.min(DiseaseDetectionHistory.confidence).label('min_confidence'),
                func.max(DiseaseDetectionHistory.confidence).label('max_confidence')
            ).filter(
                DiseaseDetectionHistory.detected_at >= cutoff_date
            ).first()
            
            # Get sick vs healthy counts
            sick_count = query.filter(DiseaseDetectionHistory.is_sick == True).count()
            healthy_count = query.filter(DiseaseDetectionHistory.is_sick == False).count()
            
            return {
                "total_detections": total_detections,
                "disease_counts": {disease: count for disease, count in disease_counts},
                "confidence_stats": {
                    "average": float(confidence_stats.avg_confidence) if confidence_stats.avg_confidence else 0.0,
                    "minimum": float(confidence_stats.min_confidence) if confidence_stats.min_confidence else 0.0,
                    "maximum": float(confidence_stats.max_confidence) if confidence_stats.max_confidence else 0.0
                },
                "sick_count": sick_count,
                "healthy_count": healthy_count,
                "sick_percentage": (sick_count / total_detections * 100) if total_detections > 0 else 0.0
            }
            
        except Exception as e:
            logger.error(f"❌ Failed to get detection stats: {e}")
            return {
                "total_detections": 0,
                "disease_counts": {},
                "confidence_stats": {"average": 0.0, "minimum": 0.0, "maximum": 0.0},
                "sick_count": 0,
                "healthy_count": 0,
                "sick_percentage": 0.0
            }
    
    @staticmethod
    def get_recent_detections(
        db: Session,
        user_id: Optional[int] = None,
        field_id: Optional[int] = None,
        limit: int = 10
    ) -> List[DiseaseDetectionHistory]:
        """Get recent disease detections."""
        
        try:
            query = db.query(DiseaseDetectionHistory)
            
            # Apply filters
            if user_id:
                query = query.filter(DiseaseDetectionHistory.user_id == user_id)
            
            if field_id:
                query = query.filter(DiseaseDetectionHistory.field_id == field_id)
            
            # Order by detection time (newest first) and limit
            query = query.order_by(desc(DiseaseDetectionHistory.detected_at)).limit(limit)
            
            return query.all()
            
        except Exception as e:
            logger.error(f"❌ Failed to get recent detections: {e}")
            return []
    
    @staticmethod
    def get_detection_by_id(
        db: Session,
        detection_id: int
    ) -> Optional[DiseaseDetectionHistory]:
        """Get a specific disease detection by ID."""
        
        try:
            return db.query(DiseaseDetectionHistory).filter(
                DiseaseDetectionHistory.id == detection_id
            ).first()
            
        except Exception as e:
            logger.error(f"❌ Failed to get detection by ID: {e}")
            return None


# Global service instance
disease_history_service = DiseaseHistoryService() 
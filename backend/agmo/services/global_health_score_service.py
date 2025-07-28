"""
Global Health Score Service

This service calculates a global crop health score based on disease detection data
from both CNN and drone/session sources using a weighted disease prevalence approach.
"""

import logging
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Tuple
from sqlalchemy.orm import Session
from sqlalchemy import func, and_

from agmo.models.disease_history import DiseaseDetectionHistory
from agmo.models.session import PlantDetectionSession
from agmo.models.monitoring import PlantHealth

logger = logging.getLogger(__name__)


class GlobalHealthScoreService:
    """Service for calculating global crop health scores."""
    
    # Disease severity weights (higher = more severe impact on health score)
    DISEASE_SEVERITY_WEIGHTS = {
        "blight": 40.0,
        "common rust": 30.0,
        "gray leaf spot": 35.0,
        "healthy": 0.0
    }
    
    # Default time window for calculations (7 days)
    DEFAULT_TIME_WINDOW_DAYS = 7
    
    def __init__(self):
        self.logger = logger
    
    def calculate_global_health_score(
        self,
        db: Session,
        field_id: Optional[int] = None,
        time_window_days: int = DEFAULT_TIME_WINDOW_DAYS
    ) -> Dict[str, any]:
        """
        Calculate global health score using weighted disease prevalence approach.
        
        Formula: Global Score = 100 - (Disease Impact Score × Confidence Weight)
        
        Where:
        - Disease Impact Score = Σ(Disease Severity × Detection Count × Confidence)
        - Confidence Weight = Average confidence across all detections
        """
        
        try:
            # Get time window
            end_time = datetime.utcnow()
            start_time = end_time - timedelta(days=time_window_days)
            
            # Get disease detection data from CNN
            cnn_data = self._get_cnn_disease_data(db, field_id, start_time, end_time)
            
            # Get session/drone detection data
            session_data = self._get_session_disease_data(db, field_id, start_time, end_time)
            
            # Calculate disease impact score
            disease_impact_score = self._calculate_disease_impact_score(cnn_data, session_data)
            
            # Calculate confidence weight
            confidence_weight = self._calculate_confidence_weight(cnn_data, session_data)
            
            # Calculate final global score
            global_score = max(0.0, 100.0 - (disease_impact_score * confidence_weight))
            
            # Prepare detailed breakdown
            breakdown = self._prepare_score_breakdown(
                cnn_data, session_data, disease_impact_score, confidence_weight, global_score
            )
            
            self.logger.info(f"🌱 Calculated global health score: {global_score:.1f} for field {field_id}")
            
            return {
                "global_score": round(global_score, 1),
                "disease_impact_score": round(disease_impact_score, 2),
                "confidence_weight": round(confidence_weight, 3),
                "time_window_days": time_window_days,
                "field_id": field_id,
                "calculation_timestamp": datetime.utcnow().isoformat(),
                "breakdown": breakdown
            }
            
        except Exception as e:
            self.logger.error(f"❌ Error calculating global health score: {e}")
            return {
                "global_score": 100.0,
                "disease_impact_score": 0.0,
                "confidence_weight": 0.0,
                "time_window_days": time_window_days,
                "field_id": field_id,
                "calculation_timestamp": datetime.utcnow().isoformat(),
                "error": str(e),
                "breakdown": {}
            }
    
    def _get_cnn_disease_data(
        self,
        db: Session,
        field_id: Optional[int],
        start_time: datetime,
        end_time: datetime
    ) -> List[Dict]:
        """Get disease detection data from CNN model."""
        
        query = db.query(DiseaseDetectionHistory).filter(
            and_(
                DiseaseDetectionHistory.detected_at >= start_time,
                DiseaseDetectionHistory.detected_at <= end_time
            )
        )
        
        if field_id:
            query = query.filter(DiseaseDetectionHistory.field_id == field_id)
        
        detections = query.all()
        
        # Group by disease type and calculate statistics
        disease_stats = {}
        total_confidence = 0.0
        total_detections = 0
        
        for detection in detections:
            disease_type = detection.disease_type.lower()
            confidence = detection.confidence
            
            if disease_type not in disease_stats:
                disease_stats[disease_type] = {
                    "count": 0,
                    "total_confidence": 0.0,
                    "avg_confidence": 0.0,
                    "severity_weight": self.DISEASE_SEVERITY_WEIGHTS.get(disease_type, 25.0)
                }
            
            disease_stats[disease_type]["count"] += 1
            disease_stats[disease_type]["total_confidence"] += confidence
            total_confidence += confidence
            total_detections += 1
        
        # Calculate average confidence for each disease
        for disease_type, stats in disease_stats.items():
            if stats["count"] > 0:
                stats["avg_confidence"] = stats["total_confidence"] / stats["count"]
        
        return {
            "detections": disease_stats,
            "total_detections": total_detections,
            "total_confidence": total_confidence,
            "avg_confidence": total_confidence / total_detections if total_detections > 0 else 0.0
        }
    
    def _get_session_disease_data(
        self,
        db: Session,
        field_id: Optional[int],
        start_time: datetime,
        end_time: datetime
    ) -> List[Dict]:
        """Get disease detection data from drone/session data."""
        
        query = db.query(PlantDetectionSession).filter(
            and_(
                PlantDetectionSession.created_at >= start_time,
                PlantDetectionSession.created_at <= end_time
            )
        )
        
        if field_id:
            # Note: PlantDetectionSession doesn't have field_id, so we'll use all sessions
            # This could be enhanced if field_id is added to the session model
            pass
        
        sessions = query.all()
        
        # Group by health status
        status_stats = {}
        total_sessions = len(sessions)
        
        for session in sessions:
            health_status = session.health_status.lower()
            
            if health_status not in status_stats:
                status_stats[health_status] = {
                    "count": 0,
                    "severity_weight": self._get_session_severity_weight(health_status)
                }
            
            status_stats[health_status]["count"] += 1
        
        return {
            "sessions": status_stats,
            "total_sessions": total_sessions
        }
    
    def _get_session_severity_weight(self, health_status: str) -> float:
        """Get severity weight for session health status."""
        severity_weights = {
            "healthy": 0.0,
            "diseased": 35.0,
            "unhealthy": 25.0,
            "sick": 30.0,
            "infected": 40.0
        }
        return severity_weights.get(health_status, 20.0)
    
    def _calculate_disease_impact_score(
        self,
        cnn_data: Dict,
        session_data: Dict
    ) -> float:
        """Calculate the disease impact score."""
        
        impact_score = 0.0
        
        # Add CNN disease impact
        for disease_type, stats in cnn_data["detections"].items():
            if disease_type != "healthy":
                disease_impact = (
                    stats["count"] * 
                    stats["avg_confidence"] * 
                    stats["severity_weight"]
                )
                impact_score += disease_impact
        
        # Add session disease impact
        for health_status, stats in session_data["sessions"].items():
            if health_status != "healthy":
                session_impact = (
                    stats["count"] * 
                    0.8 *  # Default confidence for session detections
                    stats["severity_weight"]
                )
                impact_score += session_impact
        
        return impact_score
    
    def _calculate_confidence_weight(
        self,
        cnn_data: Dict,
        session_data: Dict
    ) -> float:
        """Calculate the confidence weight (average confidence across all detections)."""
        
        total_confidence = cnn_data["total_confidence"]
        total_detections = cnn_data["total_detections"] + session_data["total_sessions"]
        
        if total_detections == 0:
            return 0.0
        
        # For session data, assume average confidence of 0.8
        session_confidence = session_data["total_sessions"] * 0.8
        total_confidence += session_confidence
        
        return total_confidence / total_detections
    
    def _prepare_score_breakdown(
        self,
        cnn_data: Dict,
        session_data: Dict,
        disease_impact_score: float,
        confidence_weight: float,
        global_score: float
    ) -> Dict:
        """Prepare detailed breakdown of the score calculation."""
        
        return {
            "cnn_detections": {
                "total": cnn_data["total_detections"],
                "diseases": cnn_data["detections"],
                "avg_confidence": cnn_data["avg_confidence"]
            },
            "session_detections": {
                "total": session_data["total_sessions"],
                "statuses": session_data["sessions"]
            },
            "calculation": {
                "disease_impact_score": disease_impact_score,
                "confidence_weight": confidence_weight,
                "formula": "Global Score = 100 - (Disease Impact Score × Confidence Weight)",
                "result": global_score
            },
            "severity_weights": self.DISEASE_SEVERITY_WEIGHTS
        }
    
    def get_health_score_trend(
        self,
        db: Session,
        field_id: Optional[int] = None,
        days: int = 30
    ) -> List[Dict]:
        """Get health score trend over time."""
        
        trend_data = []
        end_date = datetime.utcnow()
        
        for i in range(days):
            date = end_date - timedelta(days=i)
            start_date = date - timedelta(days=7)  # 7-day window
            
            # Calculate score for this specific period
            score_data = self._calculate_score_for_period(
                db, field_id, start_date, date
            )
            
            trend_data.append({
                "date": date.date().isoformat(),
                "score": score_data["global_score"],
                "disease_impact": score_data["disease_impact_score"],
                "confidence_weight": score_data["confidence_weight"]
            })
        
        return trend_data[::-1]  # Reverse to show oldest first

    def _calculate_score_for_period(
        self,
        db: Session,
        field_id: Optional[int],
        start_time: datetime,
        end_time: datetime
    ) -> Dict[str, any]:
        """Calculate health score for a specific time period."""
        
        try:
            # Get disease detection data from CNN for this period
            cnn_data = self._get_cnn_disease_data(db, field_id, start_time, end_time)
            
            # Get session/drone detection data for this period
            session_data = self._get_session_disease_data(db, field_id, start_time, end_time)
            
            # Calculate disease impact score
            disease_impact_score = self._calculate_disease_impact_score(cnn_data, session_data)
            
            # Calculate confidence weight
            confidence_weight = self._calculate_confidence_weight(cnn_data, session_data)
            
            # Calculate final global score
            global_score = max(0.0, 100.0 - (disease_impact_score * confidence_weight))
            
            # Prepare detailed breakdown
            breakdown = self._prepare_score_breakdown(
                cnn_data, session_data, disease_impact_score, confidence_weight, global_score
            )
            
            return {
                "global_score": global_score,
                "disease_impact_score": disease_impact_score,
                "confidence_weight": confidence_weight,
                "time_window_days": (end_time - start_time).days,
                "field_id": field_id,
                "calculation_timestamp": datetime.utcnow().isoformat(),
                "breakdown": breakdown
            }
            
        except Exception as e:
            self.logger.error(f"❌ Error calculating score for period {start_time} to {end_time}: {e}")
            # Return default healthy score if calculation fails
            return {
                "global_score": 100.0,
                "disease_impact_score": 0.0,
                "confidence_weight": 0.0,
                "time_window_days": (end_time - start_time).days,
                "field_id": field_id,
                "calculation_timestamp": datetime.utcnow().isoformat(),
                "breakdown": {}
            }


# Global instance
global_health_score_service = GlobalHealthScoreService() 
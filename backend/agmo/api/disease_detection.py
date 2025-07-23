"""
Disease Detection API

This module provides REST API endpoints for maize disease detection
using the trained CNN model.
"""

from fastapi import APIRouter, UploadFile, File, HTTPException, Depends, Query
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import Optional, List
import base64
import io
from PIL import Image
import logging
import random
from datetime import datetime
from sqlalchemy.orm import Session

from agmo.core.database import get_db
from agmo.services.disease_alert_service import disease_alert_service
from agmo.services.disease_history_service import disease_history_service
from models.maize_cnn import MaizeDiseaseCNN, get_maize_model

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/disease-detection", tags=["disease-detection"])


class DiseasePredictionResponse(BaseModel):
    prediction: str
    confidence: float
    is_sick: bool
    description: str
    class_id: int
    probabilities: List[float]
    timestamp: str
    model_loaded: bool


class BatchPredictionResponse(BaseModel):
    predictions: List[DiseasePredictionResponse]
    total_images: int
    healthy_count: int
    sick_count: int


# Real trained model instance
_model = None

async def get_maize_model_instance():
    """Get the maize model instance."""
    global _model
    if _model is None:
        # Use the real trained model from models/maize_cnn.py
        _model = await get_maize_model()
    return _model


@router.post("/predict", response_model=DiseasePredictionResponse)
async def predict_disease(
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    """
    Predict maize disease from uploaded image.
    
    Accepts image files (JPEG, PNG, etc.) and returns disease prediction.
    """
    try:
        # Validate file type
        if not file.content_type.startswith('image/'):
            raise HTTPException(status_code=400, detail="File must be an image")
        
        # Read and validate image
        image_data = await file.read()
        if len(image_data) > 10 * 1024 * 1024:  # 10MB limit
            raise HTTPException(status_code=400, detail="Image file too large (max 10MB)")
        
        # Convert to PIL Image
        image = Image.open(io.BytesIO(image_data))
        
        # Convert RGBA to RGB if necessary (JPEG doesn't support transparency)
        if image.mode == 'RGBA':
            image = image.convert('RGB')
        
        # Convert to base64 for the model
        buffer = io.BytesIO()
        image.save(buffer, format='JPEG')
        image_base64 = base64.b64encode(buffer.getvalue()).decode()
        
        # Get prediction
        model = await get_maize_model_instance()
        prediction = await model.predict_from_base64(image_base64)
        
        # Save to history
        try:
            disease_history_service.save_detection_history(
                db=db,
                user_id=1,  # Default user ID, can be enhanced with authentication
                field_id=None,  # No field ID for now, can be enhanced with parameters
                prediction_data=prediction,
                image_filename=file.filename,
                image_size=len(image_data),
                image_dimensions=f"{image.width}x{image.height}"
            )
        except Exception as e:
            logger.warning(f"⚠️ Failed to save detection history: {e}")
        
        logger.info(f"🌽 Disease prediction: {prediction['prediction']} (confidence: {prediction['confidence']:.3f})")
        
        return DiseasePredictionResponse(**prediction)
        
    except Exception as e:
        logger.error(f"❌ Disease prediction failed: {e}")
        raise HTTPException(status_code=500, detail=f"Prediction failed: {str(e)}")


@router.post("/predict-batch", response_model=BatchPredictionResponse)
async def predict_disease_batch(
    files: List[UploadFile] = File(...),
    db: Session = Depends(get_db)
):
    """
    Predict maize disease from multiple uploaded images.
    
    Accepts multiple image files and returns predictions for all.
    """
    try:
        if len(files) > 10:  # Limit batch size
            raise HTTPException(status_code=400, detail="Too many files (max 10)")
        
        predictions = []
        healthy_count = 0
        sick_count = 0
        
        model = await get_maize_model_instance()
        
        for file in files:
            # Validate file type
            if not file.content_type.startswith('image/'):
                continue
            
            # Read image
            image_data = await file.read()
            if len(image_data) > 10 * 1024 * 1024:  # 10MB limit
                continue
            
            # Convert to PIL Image
            image = Image.open(io.BytesIO(image_data))
            
            # Convert RGBA to RGB if necessary (JPEG doesn't support transparency)
            if image.mode == 'RGBA':
                image = image.convert('RGB')
            
            # Convert to base64
            buffer = io.BytesIO()
            image.save(buffer, format='JPEG')
            image_base64 = base64.b64encode(buffer.getvalue()).decode()
            
            # Get prediction
            prediction = await model.predict_from_base64(image_base64)
            predictions.append(DiseasePredictionResponse(**prediction))
            
            # Save to history
            try:
                disease_history_service.save_detection_history(
                    db=db,
                    user_id=1,  # Default user ID
                    field_id=None,  # No field ID for now
                    prediction_data=prediction,
                    image_filename=file.filename,
                    image_size=len(image_data),
                    image_dimensions=f"{image.width}x{image.height}"
                )
            except Exception as e:
                logger.warning(f"⚠️ Failed to save detection history: {e}")
            
            # Count healthy vs sick
            if prediction['is_sick']:
                sick_count += 1
            else:
                healthy_count += 1
        
        logger.info(f"🌽 Batch prediction: {len(predictions)} images, {healthy_count} healthy, {sick_count} sick")
        
        return BatchPredictionResponse(
            predictions=predictions,
            total_images=len(predictions),
            healthy_count=healthy_count,
            sick_count=sick_count
        )
        
    except Exception as e:
        logger.error(f"❌ Batch prediction failed: {e}")
        raise HTTPException(status_code=500, detail=f"Batch prediction failed: {str(e)}")


@router.get("/model-info")
async def get_model_info():
    """
    Get information about the loaded CNN model.
    """
    try:
        model = await get_maize_model_instance()
        info = model.get_model_info()
        
        return {
            "model_type": info['model_type'],
            "input_size": info['input_size'],
            "num_classes": info['num_classes'],
            "class_names": info['class_names'],
            "class_descriptions": info['class_descriptions'],
            "model_loaded": info['model_loaded'],
            "model_path": info['model_path']
        }
        
    except Exception as e:
        logger.error(f"❌ Failed to get model info: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get model info: {str(e)}")


@router.post("/predict-with-health-monitoring")
async def predict_disease_with_health_monitoring(
    field_id: int = Query(..., description="Field ID for health monitoring"),
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    """
    Predict disease and automatically create health monitoring record.
    
    This endpoint combines disease detection with automatic health monitoring
    integration. When a disease is detected, it automatically creates a
    plant health record and generates an alert.
    """
    try:
        # Validate file type
        if not file.content_type.startswith('image/'):
            raise HTTPException(status_code=400, detail="File must be an image")
        
        # Read and validate image
        image_data = await file.read()
        if len(image_data) > 10 * 1024 * 1024:  # 10MB limit
            raise HTTPException(status_code=400, detail="Image file too large (max 10MB)")
        
        # Convert to PIL Image
        image = Image.open(io.BytesIO(image_data))
        
        # Convert RGBA to RGB if necessary
        if image.mode == 'RGBA':
            image = image.convert('RGB')
        
        # Convert to base64 for the model
        buffer = io.BytesIO()
        image.save(buffer, format='JPEG')
        image_base64 = base64.b64encode(buffer.getvalue()).decode()
        
        # Get prediction
        model = await get_maize_model_instance()
        prediction = await model.predict_from_base64(image_base64)
        
        # Create health record from detection
        health_record = disease_alert_service.create_health_record_from_detection(
            db=db,
            field_id=field_id,
            disease_prediction=prediction,
            image_url=None  # Could be enhanced to save image
        )
        
        # Generate alert message
        alert_message = disease_alert_service.generate_alert_message(prediction)
        should_alert = disease_alert_service.should_create_alert(prediction)
        
        logger.info(f"🌽 Disease prediction with health monitoring: {prediction['prediction']} (field: {field_id})")
        
        return {
            "prediction": DiseasePredictionResponse(**prediction),
            "health_record": {
                "id": health_record.id,
                "health_score": health_record.health_score,
                "status": health_record.status.value,
                "disease_detected": health_record.disease_detected,
                "disease_type": health_record.disease_type,
                "recorded_at": health_record.recorded_at.isoformat()
            },
            "alert": {
                "message": alert_message,
                "should_alert": should_alert,
                "severity": "HIGH" if prediction.get("confidence", 0) > 0.8 else "MEDIUM" if prediction.get("confidence", 0) > 0.6 else "LOW"
            }
        }
        
    except Exception as e:
        logger.error(f"❌ Disease prediction with health monitoring failed: {e}")
        raise HTTPException(status_code=500, detail=f"Prediction failed: {str(e)}")





@router.get("/health")
async def health_check():
    """
    Health check endpoint for the disease detection service.
    """
    try:
        model = await get_maize_model_instance()
        info = model.get_model_info()
        
        return {
            "status": "healthy",
            "model_loaded": info['model_loaded'],
            "model_type": info['model_type'],
            "timestamp": datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        logger.error(f"❌ Health check failed: {e}")
        return {
            "status": "unhealthy",
            "error": str(e),
            "timestamp": datetime.utcnow().isoformat()
        } 
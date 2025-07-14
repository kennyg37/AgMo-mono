"""
Disease Detection API

This module provides REST API endpoints for maize disease detection
using the trained CNN model.
"""

from fastapi import APIRouter, UploadFile, File, HTTPException
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import Optional, List
import base64
import io
from PIL import Image
import logging
import random
from datetime import datetime

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


# Simulated model for testing
class SimulatedMaizeModel:
    def __init__(self):
        self.class_names = ["Healthy", "Northern Leaf Blight", "Common Rust", "Gray Leaf Spot"]
        self.class_descriptions = {
            "Healthy": "Plant appears healthy with no visible disease symptoms",
            "Northern Leaf Blight": "Caused by Exserohilum turcicum, characterized by long, elliptical lesions",
            "Common Rust": "Caused by Puccinia sorghi, shows small, circular to oval pustules",
            "Gray Leaf Spot": "Caused by Cercospora zeae-maydis, shows rectangular lesions with gray centers"
        }
    
    async def predict_from_base64(self, image_base64: str):
        """Simulate prediction from base64 image."""
        # Simulate processing time
        import asyncio
        await asyncio.sleep(0.5)
        
        # Generate random prediction for testing
        class_id = random.randint(0, 3)
        prediction = self.class_names[class_id]
        confidence = random.uniform(0.7, 0.95)
        is_sick = class_id != 0
        
        # Generate probabilities
        probabilities = [0.0] * 4
        probabilities[class_id] = confidence
        remaining = 1.0 - confidence
        for i in range(4):
            if i != class_id:
                prob = remaining / 3
                probabilities[i] = prob
                remaining -= prob
        
        return {
            "prediction": prediction,
            "confidence": confidence,
            "is_sick": is_sick,
            "description": self.class_descriptions[prediction],
            "class_id": class_id,
            "probabilities": probabilities,
            "timestamp": datetime.utcnow().isoformat(),
            "model_loaded": True
        }
    
    def get_model_info(self):
        return {
            "model_type": "CNN (Simulated)",
            "input_size": [224, 224],
            "num_classes": 4,
            "class_names": self.class_names,
            "class_descriptions": self.class_descriptions,
            "model_loaded": True,
            "model_path": "models/maize_leaf_cnn_model.keras (Simulated)"
        }


# Global model instance
_model = None

async def get_maize_model():
    """Get the maize model instance."""
    global _model
    if _model is None:
        _model = SimulatedMaizeModel()
    return _model


@router.post("/predict", response_model=DiseasePredictionResponse)
async def predict_disease(file: UploadFile = File(...)):
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
        model = await get_maize_model()
        prediction = await model.predict_from_base64(image_base64)
        
        logger.info(f"🌽 Disease prediction: {prediction['prediction']} (confidence: {prediction['confidence']:.3f})")
        
        return DiseasePredictionResponse(**prediction)
        
    except Exception as e:
        logger.error(f"❌ Disease prediction failed: {e}")
        raise HTTPException(status_code=500, detail=f"Prediction failed: {str(e)}")


@router.post("/predict-batch", response_model=BatchPredictionResponse)
async def predict_disease_batch(files: List[UploadFile] = File(...)):
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
        
        model = await get_maize_model()
        
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
        model = await get_maize_model()
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


@router.get("/health")
async def health_check():
    """
    Health check endpoint for the disease detection service.
    """
    try:
        model = await get_maize_model()
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
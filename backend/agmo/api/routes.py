"""API routes."""

import base64
import io
from typing import Dict, Any, List

from fastapi import APIRouter, HTTPException, UploadFile, File
from PIL import Image
import numpy as np

from agmo.core.config import settings
from agmo.vision.cnn_model import PlantClassifier
from agmo.rl.trainer import RLTrainer

# Import all route modules
from .auth import router as auth_router
from .farms import router as farms_router
from .monitoring import router as monitoring_router
from .chat import router as chat_router

router = APIRouter()

# Include all route modules
router.include_router(auth_router)
router.include_router(farms_router)
router.include_router(monitoring_router)
router.include_router(chat_router)

# Global references (will be set by main.py)
plant_classifier: PlantClassifier = None
rl_trainer: RLTrainer = None


@router.post("/classify")
async def classify_plant(file: UploadFile = File(...)) -> Dict[str, Any]:
    """Classify plant health from uploaded image."""
    if not plant_classifier:
        raise HTTPException(status_code=503, detail="Plant classifier not initialized")
    
    try:
        # Read and process image
        image_data = await file.read()
        image = Image.open(io.BytesIO(image_data))
        
        # Convert to RGB if necessary
        if image.mode != 'RGB':
            image = image.convert('RGB')
        
        # Classify
        prediction, confidence = await plant_classifier.predict(image)
        
        return {
            "prediction": prediction,
            "confidence": float(confidence),
            "classes": ["healthy", "sick"]
        }
        
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Classification failed: {str(e)}")


@router.post("/classify/base64")
async def classify_plant_base64(data: Dict[str, str]) -> Dict[str, Any]:
    """Classify plant health from base64 encoded image."""
    if not plant_classifier:
        raise HTTPException(status_code=503, detail="Plant classifier not initialized")
    
    try:
        # Decode base64 image
        image_data = base64.b64decode(data["image"])
        image = Image.open(io.BytesIO(image_data))
        
        # Convert to RGB if necessary
        if image.mode != 'RGB':
            image = image.convert('RGB')
        
        # Classify
        prediction, confidence = await plant_classifier.predict(image)
        
        return {
            "prediction": prediction,
            "confidence": float(confidence),
            "classes": ["healthy", "sick"]
        }
        
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Classification failed: {str(e)}")


@router.get("/training/status")
async def get_training_status() -> Dict[str, Any]:
    """Get current training status."""
    if not rl_trainer:
        raise HTTPException(status_code=503, detail="RL trainer not initialized")
    
    return {
        "is_training": rl_trainer.is_training,
        "total_timesteps": rl_trainer.total_timesteps,
        "current_timesteps": rl_trainer.current_timesteps,
        "episodes": rl_trainer.episodes,
        "mean_reward": rl_trainer.mean_reward,
        "model_name": rl_trainer.model_name
    }


@router.post("/training/start")
async def start_training() -> Dict[str, str]:
    """Start RL training."""
    if not rl_trainer:
        raise HTTPException(status_code=503, detail="RL trainer not initialized")
    
    if rl_trainer.is_training:
        raise HTTPException(status_code=400, detail="Training already in progress")
    
    try:
        await rl_trainer.start_training()
        return {"message": "Training started successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to start training: {str(e)}")


@router.post("/training/stop")
async def stop_training() -> Dict[str, str]:
    """Stop RL training."""
    if not rl_trainer:
        raise HTTPException(status_code=503, detail="RL trainer not initialized")
    
    if not rl_trainer.is_training:
        raise HTTPException(status_code=400, detail="Training not in progress")
    
    try:
        await rl_trainer.stop_training()
        return {"message": "Training stopped successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to stop training: {str(e)}")


@router.get("/models")
async def list_models() -> Dict[str, List[str]]:
    """List available models."""
    import os
    
    models = []
    checkpoints_dir = settings.CHECKPOINTS_DIR
    
    if os.path.exists(checkpoints_dir):
        for file in os.listdir(checkpoints_dir):
            if file.endswith('.zip'):
                models.append(file)
    
    return {"models": models}


@router.post("/models/{model_name}/load")
async def load_model(model_name: str) -> Dict[str, str]:
    """Load a specific model."""
    if not rl_trainer:
        raise HTTPException(status_code=503, detail="RL trainer not initialized")
    
    try:
        model_path = f"{settings.CHECKPOINTS_DIR}/{model_name}"
        await rl_trainer.load_model(model_path)
        return {"message": f"Model {model_name} loaded successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to load model: {str(e)}")


@router.get("/metrics")
async def get_metrics() -> Dict[str, Any]:
    """Get training metrics."""
    if not rl_trainer:
        raise HTTPException(status_code=503, detail="RL trainer not initialized")
    
    return {
        "training_metrics": rl_trainer.get_metrics(),
        "model_info": {
            "name": rl_trainer.model_name,
            "total_timesteps": rl_trainer.total_timesteps,
            "current_timesteps": rl_trainer.current_timesteps
        }
    }
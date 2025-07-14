"""
Maize Plant Disease Detection CNN Model

This module provides integration with the trained CNN model for detecting
maize plant diseases from drone camera images.
"""

import asyncio
import logging
import json
import base64
from pathlib import Path
from typing import Dict, List, Tuple, Optional, Any
from datetime import datetime
import numpy as np
from PIL import Image
from io import BytesIO

# TensorFlow/Keras imports
import tensorflow as tf
from tensorflow import keras
import cv2

logger = logging.getLogger(__name__)


class MaizeDiseaseCNN:
    """
    CNN model for maize plant disease detection.
    
    This class handles the trained Keras model for detecting different
    disease states in maize plants from drone camera images.
    """
    
    def __init__(self, model_path: Optional[str] = None):
        self.model_path = model_path or "models/maize_leaf_cnn_model.keras"
        self.model = None
        self.class_names = ["Healthy", "Northern Leaf Blight", "Common Rust", "Gray Leaf Spot"]
        self.class_descriptions = {
            "Healthy": "Plant shows no signs of disease",
            "Northern Leaf Blight": "Fungal disease causing brown lesions on leaves",
            "Common Rust": "Fungal disease with reddish-brown pustules",
            "Gray Leaf Spot": "Fungal disease with gray to brown lesions"
        }
        
        # Image preprocessing parameters
        self.input_size = (128, 128)
        self.normalization_factor = 255.0
        
        # Load model on initialization
        asyncio.create_task(self.load_model())
        
        logger.info("🌽 Maize disease detection model initialized")
    
    async def load_model(self) -> bool:
        """Load the trained Keras model."""
        model_path = Path(self.model_path)
        
        if not model_path.exists():
            logger.warning(f"Model file not found: {model_path}")
            logger.info("🏗️ Model not loaded - predictions will be simulated")
            return False
        
        try:
            # Load the Keras model
            self.model = keras.models.load_model(str(model_path))
            self.model.compile(optimizer='adam', loss='categorical_crossentropy', metrics=['accuracy'])
            
            logger.info(f"✅ Maize disease model loaded from {model_path}")
            return True
            
        except Exception as e:
            logger.error(f"❌ Failed to load maize disease model: {e}")
            logger.info("🏗️ Using simulated predictions")
            return False
    
    def preprocess_image(self, image: Image.Image) -> np.ndarray:
        """Preprocess image for model input."""
        try:
            # Convert to RGB if needed
            if image.mode != 'RGB':
                image = image.convert('RGB')
            
            # Resize to model input size
            image = image.resize(self.input_size)
            
            # Convert to numpy array and normalize
            img_array = np.array(image)
            img_array = img_array.astype(np.float32) / self.normalization_factor
            
            # Add batch dimension
            img_array = np.expand_dims(img_array, axis=0)
            
            return img_array
            
        except Exception as e:
            logger.error(f"Image preprocessing failed: {e}")
            raise
    
    async def predict_from_base64(self, image_base64: str) -> Dict[str, Any]:
        """Predict maize disease from base64 encoded image."""
        try:
            # Decode base64 image
            image_data = base64.b64decode(image_base64)
            image = Image.open(BytesIO(image_data)).convert('RGB')
            
            return await self.predict(image)
            
        except Exception as e:
            logger.error(f"Failed to process base64 image: {e}")
            return self._get_default_prediction()
    
    async def predict(self, image: Image.Image) -> Dict[str, Any]:
        """Predict maize disease from PIL image."""
        try:
            if self.model is None:
                logger.warning("Model not loaded, returning simulated prediction")
                return self._get_simulated_prediction()
            
            # Preprocess image
            input_array = self.preprocess_image(image)
            
            # Make prediction
            predictions = self.model.predict(input_array, verbose=0)
            
            # Get predicted class and confidence
            predicted_class = np.argmax(predictions[0])
            confidence = float(np.max(predictions[0]))
            
            # Get class name and description
            class_name = self.class_names[predicted_class]
            description = self.class_descriptions[class_name]
            
            # Determine if plant is sick
            is_sick = predicted_class != 0  # Class 0 is healthy
            
            # Prepare results
            result = {
                'prediction': class_name,
                'confidence': confidence,
                'is_sick': is_sick,
                'description': description,
                'class_id': int(predicted_class),
                'probabilities': predictions[0].tolist(),
                'timestamp': datetime.now().isoformat(),
                'model_loaded': True
            }
            
            logger.info(f"🌽 Maize prediction: {class_name} (confidence: {confidence:.3f})")
            return result
            
        except Exception as e:
            logger.error(f"Prediction failed: {e}")
            return self._get_default_prediction()
    
    async def predict_batch(self, images: List[Image.Image]) -> List[Dict[str, Any]]:
        """Predict maize disease for multiple images."""
        results = []
        
        for image in images:
            prediction = await self.predict(image)
            results.append(prediction)
        
        return results
    
    def _get_default_prediction(self) -> Dict[str, Any]:
        """Return default prediction when model fails."""
        return {
            'prediction': 'Unknown',
            'confidence': 0.0,
            'is_sick': False,
            'description': 'Unable to determine plant health',
            'class_id': -1,
            'probabilities': [0.25, 0.25, 0.25, 0.25],
            'timestamp': datetime.now().isoformat(),
            'model_loaded': False
        }
    
    def _get_simulated_prediction(self) -> Dict[str, Any]:
        """Return simulated prediction when model is not loaded."""
        # Simulate some realistic predictions
        import random
        
        # 70% chance of healthy, 30% chance of disease
        if random.random() < 0.7:
            class_id = 0  # Healthy
            confidence = random.uniform(0.8, 0.95)
        else:
            class_id = random.randint(1, 3)  # Disease classes
            confidence = random.uniform(0.6, 0.9)
        
        class_name = self.class_names[class_id]
        description = self.class_descriptions[class_name]
        is_sick = class_id != 0
        
        return {
            'prediction': class_name,
            'confidence': confidence,
            'is_sick': is_sick,
            'description': description,
            'class_id': class_id,
            'probabilities': [0.25, 0.25, 0.25, 0.25],  # Equal probabilities for simulation
            'timestamp': datetime.now().isoformat(),
            'model_loaded': False
        }
    
    def get_model_info(self) -> Dict[str, Any]:
        """Get information about the model."""
        return {
            'model_type': 'Maize Disease Detection CNN',
            'input_size': self.input_size,
            'num_classes': len(self.class_names),
            'class_names': self.class_names,
            'class_descriptions': self.class_descriptions,
            'model_loaded': self.model is not None,
            'model_path': str(self.model_path)
        }
    
    async def save_model(self, model_path: str) -> bool:
        """Save model state (not implemented for Keras models)."""
        logger.info("Saving not implemented for Keras models")
        return False


# Global model instance
_maize_model: Optional[MaizeDiseaseCNN] = None


async def get_maize_model(model_path: Optional[str] = None) -> MaizeDiseaseCNN:
    """Get or create the maize disease detection model."""
    global _maize_model
    
    if _maize_model is None:
        _maize_model = MaizeDiseaseCNN(model_path)
        await asyncio.sleep(0.1)  # Allow model to load
    
    return _maize_model


async def predict_maize_disease(image_base64: str, model_path: Optional[str] = None) -> Dict[str, Any]:
    """Predict maize disease from base64 image."""
    model = await get_maize_model(model_path)
    return await model.predict_from_base64(image_base64)


# Test function (moved to tests/test_maize_cnn.py)
async def test_maize_model():
    """Test the maize disease detection model."""
    logger.info("🧪 Testing maize disease detection model...")
    
    model = await get_maize_model()
    info = model.get_model_info()
    
    logger.info(f"Model info: {info}")
    
    # Create a test image (simple colored rectangle)
    test_image = Image.new('RGB', (128, 128), color='green')
    
    # Convert to base64
    import io
    buffer = io.BytesIO()
    test_image.save(buffer, format='JPEG')
    image_base64 = base64.b64encode(buffer.getvalue()).decode()
    
    # Test prediction
    result = await model.predict_from_base64(image_base64)
    logger.info(f"Test prediction: {result}")
    
    return result 
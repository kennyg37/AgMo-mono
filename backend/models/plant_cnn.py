"""
Plant Recognition CNN Model for Drone Simulation

This module provides a CNN model for recognizing plants and their health status
from drone camera images. The model is designed to work with the simulation
environment and can be trained on custom datasets.
"""

import asyncio
import logging
import json
import base64
from pathlib import Path
from typing import Dict, List, Tuple, Optional, Any
from datetime import datetime

import torch
import torch.nn as nn
import torch.nn.functional as F
from torchvision import transforms, models
from PIL import Image
import numpy as np
from io import BytesIO

logger = logging.getLogger(__name__)


class PlantRecognitionCNN(nn.Module):
    """
    CNN architecture for plant recognition and health classification.
    
    This model uses a pre-trained ResNet backbone with custom classification head
    for plant health detection (healthy/sick) and plant type identification.
    """
    
    def __init__(self, num_health_classes: int = 2, num_plant_types: int = 5, 
                 input_size: int = 224, pretrained: bool = True):
        super().__init__()
        
        self.input_size = input_size
        self.num_health_classes = num_health_classes
        self.num_plant_types = num_plant_types
        
        # Use pre-trained ResNet18 as backbone
        if pretrained:
            self.backbone = models.resnet18(pretrained=True)
            # Freeze early layers for transfer learning
            for param in list(self.backbone.parameters())[:-20]:
                param.requires_grad = False
        else:
            self.backbone = models.resnet18(pretrained=False)
        
        # Remove the original classification layer
        self.backbone = nn.Sequential(*list(self.backbone.children())[:-1])
        
        # Custom classification heads
        feature_size = 512  # ResNet18 feature size
        
        # Health classification head
        self.health_classifier = nn.Sequential(
            nn.Linear(feature_size, 256),
            nn.ReLU(),
            nn.Dropout(0.5),
            nn.Linear(256, 128),
            nn.ReLU(),
            nn.Dropout(0.3),
            nn.Linear(128, num_health_classes)
        )
        
        # Plant type classification head
        self.type_classifier = nn.Sequential(
            nn.Linear(feature_size, 256),
            nn.ReLU(),
            nn.Dropout(0.5),
            nn.Linear(256, 128),
            nn.ReLU(),
            nn.Dropout(0.3),
            nn.Linear(128, num_plant_types)
        )
        
        # Confidence estimation
        self.confidence_estimator = nn.Sequential(
            nn.Linear(feature_size, 64),
            nn.ReLU(),
            nn.Linear(64, 1),
            nn.Sigmoid()
        )
    
    def forward(self, x: torch.Tensor) -> Dict[str, torch.Tensor]:
        """Forward pass through the network."""
        # Extract features from backbone
        features = self.backbone(x)
        features = features.view(features.size(0), -1)
        
        # Get predictions from each head
        health_logits = self.health_classifier(features)
        type_logits = self.type_classifier(features)
        confidence = self.confidence_estimator(features)
        
        return {
            'health_logits': health_logits,
            'type_logits': type_logits,
            'confidence': confidence,
            'features': features
        }


class PlantRecognitionModel:
    """
    Plant recognition model wrapper for easy use in the simulation.
    
    This class handles model loading, image preprocessing, prediction,
    and integration with the simulation environment.
    """
    
    def __init__(self, model_path: Optional[str] = None, device: Optional[str] = None):
        self.device = device or ("cuda" if torch.cuda.is_available() else "cpu")
        self.model_path = model_path
        
        # Initialize model
        self.model = PlantRecognitionCNN()
        self.model.to(self.device)
        
        # Image preprocessing
        self.transform = transforms.Compose([
            transforms.Resize((224, 224)),
            transforms.ToTensor(),
            transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
        ])
        
        # Class labels
        self.health_labels = ["healthy", "sick"]
        self.plant_type_labels = ["corn", "wheat", "soybean", "cotton", "other"]
        
        # Load model if path provided
        if model_path:
            asyncio.create_task(self.load_model(model_path))
        
        logger.info(f"🧠 Plant recognition model initialized on {self.device}")
    
    async def load_model(self, model_path: str) -> bool:
        """Load pre-trained model weights."""
        model_path = Path(model_path)
        
        if not model_path.exists():
            logger.warning(f"Model file not found: {model_path}")
            logger.info("🏗️ Using model with random weights")
            return False
        
        try:
            # Load model state
            state_dict = torch.load(model_path, map_location=self.device)
            self.model.load_state_dict(state_dict)
            self.model.eval()
            
            logger.info(f"✅ Model loaded from {model_path}")
            return True
            
        except Exception as e:
            logger.error(f"❌ Failed to load model: {e}")
            logger.info("🏗️ Using model with random weights")
            return False
    
    async def predict_from_base64(self, image_base64: str) -> Dict[str, Any]:
        """Predict plant health and type from base64 encoded image."""
        try:
            # Decode base64 image
            image_data = base64.b64decode(image_base64)
            image = Image.open(BytesIO(image_data)).convert('RGB')
            
            return await self.predict(image)
            
        except Exception as e:
            logger.error(f"Failed to process base64 image: {e}")
            return self._get_default_prediction()
    
    async def predict(self, image: Image.Image) -> Dict[str, Any]:
        """Predict plant health and type from PIL image."""
        try:
            # Preprocess image
            input_tensor = self.transform(image).unsqueeze(0).to(self.device)
            
            # Make prediction
            with torch.no_grad():
                outputs = self.model(input_tensor)
                
                # Get health prediction
                health_probs = F.softmax(outputs['health_logits'], dim=1)
                health_confidence, health_pred = torch.max(health_probs, 1)
                
                # Get type prediction
                type_probs = F.softmax(outputs['type_logits'], dim=1)
                type_confidence, type_pred = torch.max(type_probs, 1)
                
                # Get overall confidence
                overall_confidence = outputs['confidence'].item()
                
                # Prepare results
                result = {
                    'health': {
                        'prediction': self.health_labels[health_pred.item()],
                        'confidence': health_confidence.item(),
                        'probabilities': health_probs.cpu().numpy()[0].tolist()
                    },
                    'type': {
                        'prediction': self.plant_type_labels[type_pred.item()],
                        'confidence': type_confidence.item(),
                        'probabilities': type_probs.cpu().numpy()[0].tolist()
                    },
                    'overall_confidence': overall_confidence,
                    'timestamp': datetime.now().isoformat()
                }
                
                return result
                
        except Exception as e:
            logger.error(f"Prediction failed: {e}")
            return self._get_default_prediction()
    
    async def predict_batch(self, images: List[Image.Image]) -> List[Dict[str, Any]]:
        """Predict plant health and type for multiple images."""
        results = []
        
        for image in images:
            prediction = await self.predict(image)
            results.append(prediction)
        
        return results
    
    def _get_default_prediction(self) -> Dict[str, Any]:
        """Return default prediction when model fails."""
        return {
            'health': {
                'prediction': 'unknown',
                'confidence': 0.0,
                'probabilities': [0.5, 0.5]
            },
            'type': {
                'prediction': 'other',
                'confidence': 0.0,
                'probabilities': [0.2, 0.2, 0.2, 0.2, 0.2]
            },
            'overall_confidence': 0.0,
            'timestamp': datetime.now().isoformat()
        }
    
    async def save_model(self, model_path: str) -> bool:
        """Save model state."""
        try:
            model_path = Path(model_path)
            model_path.parent.mkdir(parents=True, exist_ok=True)
            
            torch.save(self.model.state_dict(), model_path)
            logger.info(f"💾 Model saved to {model_path}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to save model: {e}")
            return False
    
    def get_model_info(self) -> Dict[str, Any]:
        """Get model information."""
        total_params = sum(p.numel() for p in self.model.parameters())
        trainable_params = sum(p.numel() for p in self.model.parameters() if p.requires_grad)
        
        return {
            'model_name': 'PlantRecognitionCNN',
            'device': str(self.device),
            'input_size': self.model.input_size,
            'health_classes': self.model.num_health_classes,
            'plant_types': self.model.num_plant_types,
            'total_parameters': total_params,
            'trainable_parameters': trainable_params,
            'health_labels': self.health_labels,
            'plant_type_labels': self.plant_type_labels
        }
    
    def set_eval_mode(self):
        """Set model to evaluation mode."""
        self.model.eval()
    
    def set_train_mode(self):
        """Set model to training mode."""
        self.model.train()


# Global model instance for use in the simulation
_plant_model: Optional[PlantRecognitionModel] = None


async def get_plant_model(model_path: Optional[str] = None) -> PlantRecognitionModel:
    """Get or create the global plant recognition model instance."""
    global _plant_model
    
    if _plant_model is None:
        _plant_model = PlantRecognitionModel(model_path)
        if model_path:
            await _plant_model.load_model(model_path)
    
    return _plant_model


async def predict_plant_health(image_base64: str, model_path: Optional[str] = None) -> Dict[str, Any]:
    """Convenience function to predict plant health from base64 image."""
    model = await get_plant_model(model_path)
    return await model.predict_from_base64(image_base64)


# Test function (moved to tests/test_plant_cnn.py)
async def test_model():
    """Test the plant recognition model."""
    model = PlantRecognitionModel()
    print("Model info:", model.get_model_info())
    
    # Create a dummy image for testing
    dummy_image = Image.new('RGB', (224, 224), color='green')
    result = await model.predict(dummy_image)
    print("Test prediction:", result)
    
    return result 
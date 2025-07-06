"""CNN model for plant health classification."""

import asyncio
import logging
from pathlib import Path
from typing import Tuple, Optional

import torch
import torch.nn as nn
import torch.nn.functional as F
from torchvision import transforms
from PIL import Image
import numpy as np

from agmo.core.config import settings

logger = logging.getLogger(__name__)


class PlantClassifierCNN(nn.Module):
    """CNN architecture for plant health classification."""
    
    def __init__(self, num_classes: int = 2, input_size: int = 224):
        super().__init__()
        
        self.input_size = input_size
        self.num_classes = num_classes
        
        # Convolutional layers
        self.conv1 = nn.Conv2d(3, 32, kernel_size=3, padding=1)
        self.conv2 = nn.Conv2d(32, 64, kernel_size=3, padding=1)
        self.conv3 = nn.Conv2d(64, 128, kernel_size=3, padding=1)
        self.conv4 = nn.Conv2d(128, 256, kernel_size=3, padding=1)
        
        # Pooling layer
        self.pool = nn.MaxPool2d(2, 2)
        
        # Dropout for regularization
        self.dropout = nn.Dropout(0.5)
        
        # Calculate the size of flattened features
        # After 4 pooling operations: input_size / (2^4) = input_size / 16
        feature_size = (input_size // 16) ** 2 * 256
        
        # Fully connected layers
        self.fc1 = nn.Linear(feature_size, 512)
        self.fc2 = nn.Linear(512, 128)
        self.fc3 = nn.Linear(128, num_classes)
        
        # Batch normalization
        self.bn1 = nn.BatchNorm2d(32)
        self.bn2 = nn.BatchNorm2d(64)
        self.bn3 = nn.BatchNorm2d(128)
        self.bn4 = nn.BatchNorm2d(256)
    
    def forward(self, x):
        """Forward pass."""
        # Convolutional layers with batch norm and pooling
        x = self.pool(F.relu(self.bn1(self.conv1(x))))
        x = self.pool(F.relu(self.bn2(self.conv2(x))))
        x = self.pool(F.relu(self.bn3(self.conv3(x))))
        x = self.pool(F.relu(self.bn4(self.conv4(x))))
        
        # Flatten for fully connected layers
        x = x.view(x.size(0), -1)
        
        # Fully connected layers with dropout
        x = F.relu(self.fc1(x))
        x = self.dropout(x)
        x = F.relu(self.fc2(x))
        x = self.dropout(x)
        x = self.fc3(x)
        
        return x


class PlantClassifier:
    """Plant health classifier using CNN."""
    
    def __init__(self, num_classes: int = 2, input_size: int = 224):
        self.num_classes = num_classes
        self.input_size = input_size
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        
        # Initialize model
        self.model = PlantClassifierCNN(num_classes, input_size)
        self.model.to(self.device)
        
        # Image preprocessing
        self.transform = transforms.Compose([
            transforms.Resize((input_size, input_size)),
            transforms.ToTensor(),
            transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
        ])
        
        # Class labels
        self.class_labels = ["healthy", "sick"]
        
        logger.info(f"🧠 Plant classifier initialized on {self.device}")
    
    async def load_model(self, model_path: str):
        """Load pre-trained model."""
        model_path = Path(model_path)
        
        if not model_path.exists():
            logger.warning(f"Model file not found: {model_path}")
            logger.info("🏗️ Creating new model with random weights")
            return
        
        try:
            # Load model state
            state_dict = torch.load(model_path, map_location=self.device)
            self.model.load_state_dict(state_dict)
            self.model.eval()
            
            logger.info(f"✅ Model loaded from {model_path}")
            
        except Exception as e:
            logger.error(f"❌ Failed to load model: {e}")
            logger.info("🏗️ Using model with random weights")
    
    async def predict(self, image: Image.Image) -> Tuple[str, float]:
        """Predict plant health from image."""
        try:
            # Preprocess image
            input_tensor = self.transform(image).unsqueeze(0).to(self.device)
            
            # Make prediction
            with torch.no_grad():
                outputs = self.model(input_tensor)
                probabilities = F.softmax(outputs, dim=1)
                confidence, predicted = torch.max(probabilities, 1)
                
                predicted_class = self.class_labels[predicted.item()]
                confidence_score = confidence.item()
            
            return predicted_class, confidence_score
            
        except Exception as e:
            logger.error(f"Prediction failed: {e}")
            return "unknown", 0.0
    
    async def predict_batch(self, images: list) -> list:
        """Predict plant health for multiple images."""
        results = []
        
        for image in images:
            prediction, confidence = await self.predict(image)
            results.append({
                "prediction": prediction,
                "confidence": confidence
            })
        
        return results
    
    def save_model(self, model_path: str):
        """Save model state."""
        try:
            model_path = Path(model_path)
            model_path.parent.mkdir(parents=True, exist_ok=True)
            
            torch.save(self.model.state_dict(), model_path)
            logger.info(f"💾 Model saved to {model_path}")
            
        except Exception as e:
            logger.error(f"Failed to save model: {e}")
    
    def train_model(self, train_loader, val_loader, epochs: int = 10):
        """Train the CNN model."""
        logger.info(f"🏋️ Starting training for {epochs} epochs")
        
        # Loss function and optimizer
        criterion = nn.CrossEntropyLoss()
        optimizer = torch.optim.Adam(self.model.parameters(), lr=0.001)
        scheduler = torch.optim.lr_scheduler.StepLR(optimizer, step_size=5, gamma=0.1)
        
        self.model.train()
        
        for epoch in range(epochs):
            running_loss = 0.0
            correct = 0
            total = 0
            
            for batch_idx, (data, targets) in enumerate(train_loader):
                data, targets = data.to(self.device), targets.to(self.device)
                
                # Zero gradients
                optimizer.zero_grad()
                
                # Forward pass
                outputs = self.model(data)
                loss = criterion(outputs, targets)
                
                # Backward pass
                loss.backward()
                optimizer.step()
                
                # Statistics
                running_loss += loss.item()
                _, predicted = torch.max(outputs.data, 1)
                total += targets.size(0)
                correct += (predicted == targets).sum().item()
                
                if batch_idx % 10 == 0:
                    logger.info(
                        f"Epoch {epoch+1}/{epochs}, Batch {batch_idx}, "
                        f"Loss: {loss.item():.4f}, Acc: {100*correct/total:.2f}%"
                    )
            
            # Validation
            val_acc = self._validate(val_loader)
            
            logger.info(
                f"Epoch {epoch+1}/{epochs} completed - "
                f"Train Loss: {running_loss/len(train_loader):.4f}, "
                f"Train Acc: {100*correct/total:.2f}%, "
                f"Val Acc: {val_acc:.2f}%"
            )
            
            scheduler.step()
        
        logger.info("✅ Training completed")
    
    def _validate(self, val_loader) -> float:
        """Validate the model."""
        self.model.eval()
        correct = 0
        total = 0
        
        with torch.no_grad():
            for data, targets in val_loader:
                data, targets = data.to(self.device), targets.to(self.device)
                outputs = self.model(data)
                _, predicted = torch.max(outputs, 1)
                total += targets.size(0)
                correct += (predicted == targets).sum().item()
        
        self.model.train()
        return 100 * correct / total
    
    def get_model_info(self) -> dict:
        """Get model information."""
        total_params = sum(p.numel() for p in self.model.parameters())
        trainable_params = sum(p.numel() for p in self.model.parameters() if p.requires_grad)
        
        return {
            "model_name": "PlantClassifierCNN",
            "num_classes": self.num_classes,
            "input_size": self.input_size,
            "total_parameters": total_params,
            "trainable_parameters": trainable_params,
            "device": str(self.device),
            "class_labels": self.class_labels
        }
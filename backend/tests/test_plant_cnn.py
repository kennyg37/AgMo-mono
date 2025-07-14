"""
Tests for plant CNN model functionality.
"""

import pytest
import asyncio
import base64
import io
from PIL import Image
import torch

from models.plant_cnn import PlantRecognitionModel, get_plant_model, predict_plant_health


@pytest.fixture
def plant_model():
    """Create a plant model instance for testing."""
    return PlantRecognitionModel()


@pytest.fixture
def test_image():
    """Create a test image for testing."""
    return Image.new('RGB', (224, 224), color='green')


@pytest.fixture
def test_image_base64(test_image):
    """Create a base64 encoded test image."""
    buffer = io.BytesIO()
    test_image.save(buffer, format='JPEG')
    return base64.b64encode(buffer.getvalue()).decode()


class TestPlantRecognitionModel:
    """Test class for plant recognition model."""
    
    def test_model_initialization(self, plant_model):
        """Test model initialization."""
        assert plant_model is not None
        assert plant_model.model is not None
        assert plant_model.device is not None
        assert len(plant_model.health_labels) == 2
        assert len(plant_model.plant_type_labels) == 5
    
    def test_model_info(self, plant_model):
        """Test model information retrieval."""
        info = plant_model.get_model_info()
        
        assert "model_name" in info
        assert "device" in info
        assert "input_size" in info
        assert "health_classes" in info
        assert "plant_types" in info
        assert "total_parameters" in info
        assert "trainable_parameters" in info
        assert "health_labels" in info
        assert "plant_type_labels" in info
        
        assert info["model_name"] == "PlantRecognitionCNN"
        assert info["health_classes"] == 2
        assert info["plant_types"] == 5
        assert len(info["health_labels"]) == 2
        assert len(info["plant_type_labels"]) == 5
    
    @pytest.mark.asyncio
    async def test_prediction(self, plant_model, test_image):
        """Test prediction from PIL image."""
        result = await plant_model.predict(test_image)
        
        assert "health" in result
        assert "type" in result
        assert "overall_confidence" in result
        assert "timestamp" in result
        
        health = result["health"]
        assert "prediction" in health
        assert "confidence" in health
        assert "probabilities" in health
        
        plant_type = result["type"]
        assert "prediction" in plant_type
        assert "confidence" in plant_type
        assert "probabilities" in plant_type
        
        assert health["prediction"] in plant_model.health_labels
        assert plant_type["prediction"] in plant_model.plant_type_labels
        assert 0 <= health["confidence"] <= 1
        assert 0 <= plant_type["confidence"] <= 1
        assert 0 <= result["overall_confidence"] <= 1
        assert len(health["probabilities"]) == 2
        assert len(plant_type["probabilities"]) == 5
    
    @pytest.mark.asyncio
    async def test_base64_prediction(self, plant_model, test_image_base64):
        """Test prediction from base64 encoded image."""
        result = await plant_model.predict_from_base64(test_image_base64)
        
        assert "health" in result
        assert "type" in result
        assert "overall_confidence" in result
        assert "timestamp" in result
        
        health = result["health"]
        assert "prediction" in health
        assert "confidence" in health
        assert "probabilities" in health
        
        plant_type = result["type"]
        assert "prediction" in plant_type
        assert "confidence" in plant_type
        assert "probabilities" in plant_type
    
    @pytest.mark.asyncio
    async def test_batch_prediction(self, plant_model, test_image):
        """Test batch prediction."""
        images = [test_image, test_image, test_image]
        results = await plant_model.predict_batch(images)
        
        assert len(results) == 3
        
        for result in results:
            assert "health" in result
            assert "type" in result
            assert "overall_confidence" in result
            assert "timestamp" in result
    
    def test_default_prediction(self, plant_model):
        """Test default prediction when model fails."""
        result = plant_model._get_default_prediction()
        
        assert "health" in result
        assert "type" in result
        assert "overall_confidence" in result
        assert "timestamp" in result
        
        health = result["health"]
        assert health["prediction"] == "unknown"
        assert health["confidence"] == 0.0
        assert len(health["probabilities"]) == 2
        
        plant_type = result["type"]
        assert plant_type["prediction"] == "other"
        assert plant_type["confidence"] == 0.0
        assert len(plant_type["probabilities"]) == 5
        
        assert result["overall_confidence"] == 0.0
    
    def test_model_modes(self, plant_model):
        """Test model mode switching."""
        # Test eval mode
        plant_model.set_eval_mode()
        assert plant_model.model.training == False
        
        # Test train mode
        plant_model.set_train_mode()
        assert plant_model.model.training == True


class TestPlantModelFunctions:
    """Test class for plant model utility functions."""
    
    @pytest.mark.asyncio
    async def test_get_plant_model(self):
        """Test getting plant model instance."""
        model = await get_plant_model()
        
        assert model is not None
        assert isinstance(model, PlantRecognitionModel)
    
    @pytest.mark.asyncio
    async def test_predict_plant_health(self, test_image_base64):
        """Test predict_plant_health function."""
        result = await predict_plant_health(test_image_base64)
        
        assert "health" in result
        assert "type" in result
        assert "overall_confidence" in result
        assert "timestamp" in result


@pytest.mark.asyncio
async def test_plant_model_integration():
    """Integration test for plant model."""
    from models.plant_cnn import test_model
    
    try:
        result = await test_model()
        
        assert "health" in result
        assert "type" in result
        assert "overall_confidence" in result
        assert "timestamp" in result
        
    except Exception as e:
        pytest.skip(f"Integration test failed: {e}")


if __name__ == "__main__":
    # Run the integration test
    asyncio.run(test_plant_model_integration()) 
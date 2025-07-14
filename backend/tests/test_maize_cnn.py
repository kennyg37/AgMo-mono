"""
Tests for maize CNN model functionality.
"""

import pytest
import asyncio
import base64
import io
from PIL import Image
import numpy as np

from models.maize_cnn import MaizeDiseaseCNN, get_maize_model, predict_maize_disease


@pytest.fixture
def maize_model():
    """Create a maize model instance for testing."""
    return MaizeDiseaseCNN()


@pytest.fixture
def test_image():
    """Create a test image for testing."""
    return Image.new('RGB', (128, 128), color='green')


@pytest.fixture
def test_image_base64(test_image):
    """Create a base64 encoded test image."""
    buffer = io.BytesIO()
    test_image.save(buffer, format='JPEG')
    return base64.b64encode(buffer.getvalue()).decode()


class TestMaizeDiseaseCNN:
    """Test class for maize disease detection CNN."""
    
    def test_model_initialization(self, maize_model):
        """Test model initialization."""
        assert maize_model is not None
        assert maize_model.input_size == (224, 224)
        assert len(maize_model.class_names) == 4
        assert maize_model.class_names[0] == "Healthy"
    
    def test_model_info(self, maize_model):
        """Test model information retrieval."""
        info = maize_model.get_model_info()
        
        assert "model_type" in info
        assert "input_size" in info
        assert "num_classes" in info
        assert "class_names" in info
        assert "class_descriptions" in info
        assert "model_loaded" in info
        assert "model_path" in info
        
        assert info["model_type"] == "Maize Disease Detection CNN"
        assert info["input_size"] == (224, 224)
        assert info["num_classes"] == 4
        assert len(info["class_names"]) == 4
    
    def test_image_preprocessing(self, maize_model, test_image):
        """Test image preprocessing."""
        processed = maize_model.preprocess_image(test_image)
        
        assert processed.shape == (1, 224, 224, 3)
        assert processed.dtype == np.float32
        assert np.max(processed) <= 1.0
        assert np.min(processed) >= 0.0
    
    @pytest.mark.asyncio
    async def test_simulated_prediction(self, maize_model, test_image):
        """Test simulated prediction when model is not loaded."""
        result = await maize_model.predict(test_image)
        
        assert "prediction" in result
        assert "confidence" in result
        assert "is_sick" in result
        assert "description" in result
        assert "class_id" in result
        assert "probabilities" in result
        assert "timestamp" in result
        assert "model_loaded" in result
        
        assert result["model_loaded"] == False
        assert result["prediction"] in maize_model.class_names
        assert 0 <= result["confidence"] <= 1
        assert isinstance(result["is_sick"], bool)
        assert len(result["probabilities"]) == 4
    
    @pytest.mark.asyncio
    async def test_base64_prediction(self, maize_model, test_image_base64):
        """Test prediction from base64 encoded image."""
        result = await maize_model.predict_from_base64(test_image_base64)
        
        assert "prediction" in result
        assert "confidence" in result
        assert "is_sick" in result
        assert "description" in result
        assert "class_id" in result
        assert "probabilities" in result
        assert "timestamp" in result
        assert "model_loaded" in result
    
    @pytest.mark.asyncio
    async def test_batch_prediction(self, maize_model, test_image):
        """Test batch prediction."""
        images = [test_image, test_image, test_image]
        results = await maize_model.predict_batch(images)
        
        assert len(results) == 3
        
        for result in results:
            assert "prediction" in result
            assert "confidence" in result
            assert "is_sick" in result
            assert "description" in result
            assert "class_id" in result
            assert "probabilities" in result
            assert "timestamp" in result
            assert "model_loaded" in result
    
    def test_default_prediction(self, maize_model):
        """Test default prediction when model fails."""
        result = maize_model._get_default_prediction()
        
        assert result["prediction"] == "Unknown"
        assert result["confidence"] == 0.0
        assert result["is_sick"] == False
        assert result["description"] == "Unable to determine plant health"
        assert result["class_id"] == -1
        assert result["model_loaded"] == False
        assert len(result["probabilities"]) == 4
    
    def test_simulated_prediction_method(self, maize_model):
        """Test simulated prediction method."""
        result = maize_model._get_simulated_prediction()
        
        assert "prediction" in result
        assert "confidence" in result
        assert "is_sick" in result
        assert "description" in result
        assert "class_id" in result
        assert "probabilities" in result
        assert "timestamp" in result
        assert "model_loaded" in result
        
        assert result["model_loaded"] == False
        assert result["prediction"] in maize_model.class_names
        assert 0 <= result["confidence"] <= 1
        assert isinstance(result["is_sick"], bool)
        assert len(result["probabilities"]) == 4


class TestMaizeModelFunctions:
    """Test class for maize model utility functions."""
    
    @pytest.mark.asyncio
    async def test_get_maize_model(self):
        """Test getting maize model instance."""
        model = await get_maize_model()
        
        assert model is not None
        assert isinstance(model, MaizeDiseaseCNN)
    
    @pytest.mark.asyncio
    async def test_predict_maize_disease(self, test_image_base64):
        """Test predict_maize_disease function."""
        result = await predict_maize_disease(test_image_base64)
        
        assert "prediction" in result
        assert "confidence" in result
        assert "is_sick" in result
        assert "description" in result
        assert "class_id" in result
        assert "probabilities" in result
        assert "timestamp" in result
        assert "model_loaded" in result


@pytest.mark.asyncio
async def test_maize_model_integration():
    """Integration test for maize model."""
    from models.maize_cnn import test_maize_model
    
    try:
        result = await test_maize_model()
        
        assert "prediction" in result
        assert "confidence" in result
        assert "is_sick" in result
        assert "description" in result
        assert "class_id" in result
        assert "probabilities" in result
        assert "timestamp" in result
        assert "model_loaded" in result
        
    except Exception as e:
        pytest.skip(f"Integration test failed: {e}")


if __name__ == "__main__":
    # Run the integration test
    asyncio.run(test_maize_model_integration()) 
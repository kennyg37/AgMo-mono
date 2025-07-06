"""Tests for CNN model."""

import pytest
import torch
from PIL import Image
import numpy as np

from agmo.vision.cnn_model import PlantClassifier, PlantClassifierCNN


@pytest.fixture
def plant_classifier():
    """Create a plant classifier instance."""
    return PlantClassifier(num_classes=2, input_size=224)


@pytest.fixture
def sample_image():
    """Create a sample RGB image."""
    # Create a random RGB image
    image_array = np.random.randint(0, 255, (224, 224, 3), dtype=np.uint8)
    return Image.fromarray(image_array)


def test_cnn_model_creation():
    """Test CNN model creation."""
    model = PlantClassifierCNN(num_classes=2, input_size=224)
    
    assert model.num_classes == 2
    assert model.input_size == 224
    
    # Test forward pass
    x = torch.randn(1, 3, 224, 224)
    output = model(x)
    
    assert output.shape == (1, 2)


def test_plant_classifier_initialization(plant_classifier):
    """Test plant classifier initialization."""
    assert plant_classifier.num_classes == 2
    assert plant_classifier.input_size == 224
    assert len(plant_classifier.class_labels) == 2
    assert plant_classifier.class_labels == ["healthy", "sick"]


@pytest.mark.asyncio
async def test_plant_classifier_prediction(plant_classifier, sample_image):
    """Test plant classification prediction."""
    prediction, confidence = await plant_classifier.predict(sample_image)
    
    assert prediction in ["healthy", "sick"]
    assert 0.0 <= confidence <= 1.0


@pytest.mark.asyncio
async def test_plant_classifier_batch_prediction(plant_classifier, sample_image):
    """Test batch prediction."""
    images = [sample_image, sample_image, sample_image]
    results = await plant_classifier.predict_batch(images)
    
    assert len(results) == 3
    
    for result in results:
        assert "prediction" in result
        assert "confidence" in result
        assert result["prediction"] in ["healthy", "sick"]
        assert 0.0 <= result["confidence"] <= 1.0


def test_model_info(plant_classifier):
    """Test model information retrieval."""
    info = plant_classifier.get_model_info()
    
    assert "model_name" in info
    assert "num_classes" in info
    assert "input_size" in info
    assert "total_parameters" in info
    assert "trainable_parameters" in info
    assert "device" in info
    assert "class_labels" in info
    
    assert info["num_classes"] == 2
    assert info["input_size"] == 224
    assert info["class_labels"] == ["healthy", "sick"]


def test_model_save_load(plant_classifier, tmp_path):
    """Test model saving and loading."""
    model_path = tmp_path / "test_model.pth"
    
    # Save model
    plant_classifier.save_model(str(model_path))
    assert model_path.exists()
    
    # Create new classifier and load model
    new_classifier = PlantClassifier(num_classes=2, input_size=224)
    
    # This would normally be async, but for testing we'll use the sync version
    state_dict = torch.load(model_path, map_location=new_classifier.device)
    new_classifier.model.load_state_dict(state_dict)
    
    # Verify models have same parameters
    original_params = list(plant_classifier.model.parameters())
    loaded_params = list(new_classifier.model.parameters())
    
    assert len(original_params) == len(loaded_params)
    
    for orig, loaded in zip(original_params, loaded_params):
        assert torch.equal(orig, loaded)
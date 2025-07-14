"""
Tests for disease detection API endpoints.

This module contains tests for the disease detection API to ensure
it works correctly with both single and batch predictions.
"""

import pytest
import asyncio
import base64
import io
import os
from PIL import Image
import numpy as np
import requests
import json
from fastapi.testclient import TestClient

from agmo.main import app

# Test server URL for integration tests
BASE_URL = "http://localhost:8000"


@pytest.fixture
def client():
    """Create a test client."""
    return TestClient(app)


@pytest.fixture
def test_image():
    """Create a test image for testing."""
    # Create a simple test image (224x224 RGB)
    img_array = np.random.randint(0, 255, (224, 224, 3), dtype=np.uint8)
    img = Image.fromarray(img_array)
    
    # Convert to base64
    buffer = io.BytesIO()
    img.save(buffer, format='JPEG')
    img_base64 = base64.b64encode(buffer.getvalue()).decode()
    
    return img, img_base64


@pytest.fixture
def test_image_file(test_image):
    """Create a test image file."""
    img, _ = test_image
    img_path = "test_image.jpg"
    img.save(img_path)
    yield img_path
    # Cleanup
    if os.path.exists(img_path):
        os.remove(img_path)


class TestDiseaseDetectionAPI:
    """Test class for disease detection API endpoints."""
    
    def test_health_check_endpoint(self, client):
        """Test the health check endpoint."""
        response = client.get("/api/disease-detection/health")
        assert response.status_code == 200
        
        data = response.json()
        assert "status" in data
        assert "model_loaded" in data
        assert "model_type" in data
        assert "timestamp" in data
    
    def test_model_info_endpoint(self, client):
        """Test the model info endpoint."""
        response = client.get("/api/disease-detection/model-info")
        assert response.status_code == 200
        
        data = response.json()
        assert "model_type" in data
        assert "input_size" in data
        assert "num_classes" in data
        assert "class_names" in data
        assert "model_loaded" in data
        assert "model_path" in data
    
    def test_single_prediction_endpoint(self, client, test_image_file):
        """Test single image prediction endpoint."""
        with open(test_image_file, "rb") as f:
            files = {"file": f}
            response = client.post("/api/disease-detection/predict", files=files)
        
        assert response.status_code == 200
        
        data = response.json()
        assert "prediction" in data
        assert "confidence" in data
        assert "is_sick" in data
        assert "description" in data
        assert "class_id" in data
        assert "probabilities" in data
        assert "timestamp" in data
        assert "model_loaded" in data
    
    def test_batch_prediction_endpoint(self, client, test_image):
        """Test batch image prediction endpoint."""
        img, _ = test_image
        
        # Create multiple test images
        files = []
        for i in range(3):
            img_path = f"test_image_{i}.jpg"
            img.save(img_path)
            files.append(("files", open(img_path, "rb")))
        
        try:
            response = client.post("/api/disease-detection/predict-batch", files=files)
            
            assert response.status_code == 200
            
            data = response.json()
            assert "predictions" in data
            assert "total_images" in data
            assert "healthy_count" in data
            assert "sick_count" in data
            
            # Verify predictions structure
            for prediction in data["predictions"]:
                assert "prediction" in prediction
                assert "confidence" in prediction
                assert "is_sick" in prediction
                assert "description" in prediction
                assert "class_id" in prediction
                assert "probabilities" in prediction
                assert "timestamp" in prediction
                assert "model_loaded" in prediction
                
        finally:
            # Cleanup test files
            for i in range(3):
                img_path = f"test_image_{i}.jpg"
                if os.path.exists(img_path):
                    os.remove(img_path)
    
    def test_invalid_file_type(self, client):
        """Test prediction with invalid file type."""
        # Create a text file instead of image
        files = {"file": ("test.txt", b"not an image", "text/plain")}
        response = client.post("/api/disease-detection/predict", files=files)
        
        assert response.status_code == 400
        data = response.json()
        assert "detail" in data
        assert "File must be an image" in data["detail"]
    
    def test_file_size_limit(self, client):
        """Test prediction with file too large."""
        # Create a large file (simulate > 10MB)
        large_data = b"x" * (11 * 1024 * 1024)  # 11MB
        files = {"file": ("large.jpg", large_data, "image/jpeg")}
        response = client.post("/api/disease-detection/predict", files=files)
        
        assert response.status_code == 400
        data = response.json()
        assert "detail" in data
        assert "Image file too large" in data["detail"]
    
    def test_batch_size_limit(self, client, test_image):
        """Test batch prediction with too many files."""
        img, _ = test_image
        
        # Create more than 10 files
        files = []
        for i in range(11):
            img_path = f"test_image_{i}.jpg"
            img.save(img_path)
            files.append(("files", open(img_path, "rb")))
        
        try:
            response = client.post("/api/disease-detection/predict-batch", files=files)
            
            assert response.status_code == 400
            data = response.json()
            assert "detail" in data
            assert "Too many files" in data["detail"]
            
        finally:
            # Cleanup test files
            for i in range(11):
                img_path = f"test_image_{i}.jpg"
                if os.path.exists(img_path):
                    os.remove(img_path)


class TestDiseaseDetectionIntegration:
    """Integration tests for disease detection API (requires running server)."""
    
    @pytest.mark.integration
    def test_health_check_integration(self):
        """Test health check endpoint with running server."""
        try:
            response = requests.get(f"{BASE_URL}/api/disease-detection/health")
            assert response.status_code == 200
            
            data = response.json()
            assert "status" in data
            assert "model_loaded" in data
            assert "model_type" in data
            assert "timestamp" in data
            
        except requests.exceptions.ConnectionError:
            pytest.skip("Backend server not running")
    
    @pytest.mark.integration
    def test_model_info_integration(self):
        """Test model info endpoint with running server."""
        try:
            response = requests.get(f"{BASE_URL}/api/disease-detection/model-info")
            assert response.status_code == 200
            
            data = response.json()
            assert "model_type" in data
            assert "input_size" in data
            assert "num_classes" in data
            assert "class_names" in data
            assert "model_loaded" in data
            assert "model_path" in data
            
        except requests.exceptions.ConnectionError:
            pytest.skip("Backend server not running")
    
    @pytest.mark.integration
    def test_single_prediction_integration(self, test_image_file):
        """Test single prediction with running server."""
        try:
            with open(test_image_file, "rb") as f:
                files = {"file": f}
                response = requests.post(f"{BASE_URL}/api/disease-detection/predict", files=files)
            
            assert response.status_code == 200
            
            data = response.json()
            assert "prediction" in data
            assert "confidence" in data
            assert "is_sick" in data
            assert "description" in data
            assert "class_id" in data
            assert "probabilities" in data
            assert "timestamp" in data
            assert "model_loaded" in data
            
        except requests.exceptions.ConnectionError:
            pytest.skip("Backend server not running")
    
    @pytest.mark.integration
    def test_batch_prediction_integration(self, test_image):
        """Test batch prediction with running server."""
        try:
            img, _ = test_image
            
            # Create multiple test images
            files = []
            for i in range(3):
                img_path = f"test_image_{i}.jpg"
                img.save(img_path)
                files.append(("files", open(img_path, "rb")))
            
            try:
                response = requests.post(f"{BASE_URL}/api/disease-detection/predict-batch", files=files)
                
                assert response.status_code == 200
                
                data = response.json()
                assert "predictions" in data
                assert "total_images" in data
                assert "healthy_count" in data
                assert "sick_count" in data
                
                # Verify predictions structure
                for prediction in data["predictions"]:
                    assert "prediction" in prediction
                    assert "confidence" in prediction
                    assert "is_sick" in prediction
                    assert "description" in prediction
                    assert "class_id" in prediction
                    assert "probabilities" in prediction
                    assert "timestamp" in prediction
                    assert "model_loaded" in prediction
                    
            finally:
                # Cleanup test files
                for i in range(3):
                    img_path = f"test_image_{i}.jpg"
                    if os.path.exists(img_path):
                        os.remove(img_path)
                        
        except requests.exceptions.ConnectionError:
            pytest.skip("Backend server not running")


def run_manual_tests():
    """Run manual tests for disease detection API (legacy function)."""
    print("🧪 Starting Disease Detection API Tests")
    print("=" * 50)
    
    def test_health_check():
        """Test the health check endpoint."""
        print("🔍 Testing health check...")
        
        try:
            response = requests.get(f"{BASE_URL}/api/disease-detection/health")
            print(f"Status: {response.status_code}")
            print(f"Response: {response.json()}")
            return response.status_code == 200
        except Exception as e:
            print(f"❌ Health check failed: {e}")
            return False

    def test_model_info():
        """Test the model info endpoint."""
        print("\n🔍 Testing model info...")
        
        try:
            response = requests.get(f"{BASE_URL}/api/disease-detection/model-info")
            print(f"Status: {response.status_code}")
            data = response.json()
            print(f"Model type: {data.get('model_type', 'N/A')}")
            print(f"Input size: {data.get('input_size', 'N/A')}")
            print(f"Classes: {data.get('num_classes', 'N/A')}")
            print(f"Model loaded: {data.get('model_loaded', 'N/A')}")
            return response.status_code == 200
        except Exception as e:
            print(f"❌ Model info failed: {e}")
            return False

    def test_single_prediction():
        """Test single image prediction."""
        print("\n🔍 Testing single prediction...")
        
        try:
            # Create test image
            img, img_base64 = test_image()
            
            # Save test image
            img.save("test_image.jpg")
            print("📸 Created test image: test_image.jpg")
            
            # Test with file upload
            with open("test_image.jpg", "rb") as f:
                files = {"file": f}
                response = requests.post(f"{BASE_URL}/api/disease-detection/predict", files=files)
            
            print(f"Status: {response.status_code}")
            if response.status_code == 200:
                data = response.json()
                print(f"Prediction: {data.get('prediction', 'N/A')}")
                print(f"Confidence: {data.get('confidence', 'N/A')}")
                print(f"Is sick: {data.get('is_sick', 'N/A')}")
                print(f"Description: {data.get('description', 'N/A')}")
            else:
                print(f"Error: {response.text}")
            
            return response.status_code == 200
        except Exception as e:
            print(f"❌ Single prediction failed: {e}")
            return False

    def test_batch_prediction():
        """Test batch image prediction."""
        print("\n🔍 Testing batch prediction...")
        
        try:
            # Create multiple test images
            files = []
            for i in range(3):
                img, _ = test_image()
                img_path = f"test_image_{i}.jpg"
                img.save(img_path)
                files.append(("files", open(img_path, "rb")))
                print(f"📸 Created test image: {img_path}")
            
            # Test batch prediction
            response = requests.post(f"{BASE_URL}/api/disease-detection/predict-batch", files=files)
            
            print(f"Status: {response.status_code}")
            if response.status_code == 200:
                data = response.json()
                print(f"Total images: {data.get('total_images', 'N/A')}")
                print(f"Healthy count: {data.get('healthy_count', 'N/A')}")
                print(f"Sick count: {data.get('sick_count', 'N/A')}")
                print(f"Predictions: {len(data.get('predictions', []))}")
            else:
                print(f"Error: {response.text}")
            
            # Clean up test files
            for i in range(3):
                if os.path.exists(f"test_image_{i}.jpg"):
                    os.remove(f"test_image_{i}.jpg")
            
            return response.status_code == 200
        except Exception as e:
            print(f"❌ Batch prediction failed: {e}")
            return False

    tests = [
        ("Health Check", test_health_check),
        ("Model Info", test_model_info),
        ("Single Prediction", test_single_prediction),
        ("Batch Prediction", test_batch_prediction),
    ]
    
    results = []
    for test_name, test_func in tests:
        print(f"\n{'='*20} {test_name} {'='*20}")
        try:
            result = test_func()
            results.append((test_name, result))
            print(f"✅ {test_name}: {'PASSED' if result else 'FAILED'}")
        except Exception as e:
            print(f"❌ {test_name}: ERROR - {e}")
            results.append((test_name, False))
    
    # Summary
    print("\n" + "=" * 50)
    print("📊 TEST SUMMARY")
    print("=" * 50)
    
    passed = sum(1 for _, result in results if result)
    total = len(results)
    
    for test_name, result in results:
        status = "✅ PASSED" if result else "❌ FAILED"
        print(f"{test_name}: {status}")
    
    print(f"\nOverall: {passed}/{total} tests passed")
    
    if passed == total:
        print("🎉 All tests passed! Disease detection API is working correctly.")
    else:
        print("⚠️  Some tests failed. Please check the implementation.")


if __name__ == "__main__":
    run_manual_tests() 
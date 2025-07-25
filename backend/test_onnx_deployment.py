#!/usr/bin/env python3
"""
Test ONNX deployment without TensorFlow
"""

import asyncio
import sys
import traceback

async def test_imports():
    """Test that all imports work without TensorFlow."""
    
    print("🧪 Testing imports without TensorFlow...")
    
    try:
        # Test ONNX model import
        print("📦 Testing ONNX model import...")
        from models.maize_onnx import get_maize_onnx_model, predict_maize_disease_onnx
        print("✅ ONNX model import successful")
        
        # Test disease detection API import
        print("📦 Testing disease detection API import...")
        from agmo.api.disease_detection import router as disease_router
        print("✅ Disease detection API import successful")
        
        # Test monitoring API import
        print("📦 Testing monitoring API import...")
        from agmo.api.monitoring import router as monitoring_router
        print("✅ Monitoring API import successful")
        
        # Test main app import
        print("📦 Testing main app import...")
        from agmo.main import app
        print("✅ Main app import successful")
        
        return True
        
    except Exception as e:
        print(f"❌ Import test failed: {e}")
        traceback.print_exc()
        return False

async def test_onnx_model():
    """Test ONNX model functionality."""
    
    print("\n🧪 Testing ONNX model functionality...")
    
    try:
        from models.maize_onnx import predict_maize_disease_onnx
        from PIL import Image
        import io
        import base64
        
        # Create test image
        test_image = Image.new('RGB', (128, 128), color='green')
        
        # Convert to base64
        buffer = io.BytesIO()
        test_image.save(buffer, format='JPEG')
        image_base64 = base64.b64encode(buffer.getvalue()).decode()
        
        # Test prediction
        result = await predict_maize_disease_onnx(image_base64)
        
        print(f"✅ ONNX prediction successful: {result['prediction']}")
        return True
        
    except Exception as e:
        print(f"❌ ONNX model test failed: {e}")
        traceback.print_exc()
        return False

def main():
    """Main test function."""
    
    print("🚀 Testing ONNX deployment without TensorFlow...")
    
    # Test imports
    import_result = asyncio.run(test_imports())
    
    if not import_result:
        print("\n❌ Import tests failed!")
        return 1
    
    # Test ONNX model
    model_result = asyncio.run(test_onnx_model())
    
    if not model_result:
        print("\n❌ ONNX model test failed!")
        return 1
    
    print("\n🎉 All tests passed!")
    print("✅ Application is ready for ONNX deployment without TensorFlow!")
    
    return 0

if __name__ == "__main__":
    exit(main()) 
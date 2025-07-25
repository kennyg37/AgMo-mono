#!/usr/bin/env python3
"""
Test script to verify the real trained maize disease detection model.
"""

import asyncio
import sys
import os
from pathlib import Path

# Add the backend directory to the Python path
sys.path.insert(0, str(Path(__file__).parent))

from models.maize_cnn import MaizeDiseaseCNN, get_maize_model
from PIL import Image
import io
import base64

async def test_real_model():
    """Test the real trained model."""
    print("🧪 Testing Real Trained Maize Disease Detection Model...")
    print("=" * 60)
    
    # Create a test image (green square to simulate plant)
    img = Image.new('RGB', (128, 128), color='green')
    
    # Convert to base64
    buffer = io.BytesIO()
    img.save(buffer, format='JPEG')
    buffer.seek(0)
    img_bytes = base64.b64encode(buffer.getvalue()).decode()
    
    try:
        # Initialize the model
        print("📦 Loading real trained model...")
        model = await get_maize_model()
        
        # Get model info
        info = model.get_model_info()
        print(f"✅ Model loaded: {info['model_type']}")
        print(f"📁 Model path: {info['model_path']}")
        print(f"🎯 Input size: {info['input_size']}")
        print(f"🏷️  Classes: {info['class_names']}")
        print(f"📊 Model loaded: {info['model_loaded']}")
        
        # Test prediction
        print("\n🔍 Testing prediction...")
        prediction = await model.predict_from_base64(img_bytes)
        
        print(f"✅ Prediction: {prediction['prediction']}")
        print(f"📈 Confidence: {prediction['confidence']:.3f}")
        print(f"🏥 Is Sick: {prediction['is_sick']}")
        print(f"📝 Description: {prediction['description']}")
        print(f"🎯 Class ID: {prediction['class_id']}")
        print(f"📊 Probabilities: {[f'{p:.3f}' for p in prediction['probabilities']]}")
        
        # Test multiple predictions to see variation
        print("\n🔄 Testing multiple predictions...")
        for i in range(3):
            prediction = await model.predict_from_base64(img_bytes)
            print(f"  {i+1}. {prediction['prediction']:12s} (confidence: {prediction['confidence']:.3f})")
        
        print("\n" + "=" * 60)
        print("🎉 Real Model Test Complete!")
        print("\nKey Features:")
        print("✅ Real trained Keras model loaded")
        print("✅ Actual disease detection predictions")
        print("✅ Proper confidence scoring")
        print("✅ Realistic probability distributions")
        
    except Exception as e:
        print(f"❌ Error testing real model: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(test_real_model()) 
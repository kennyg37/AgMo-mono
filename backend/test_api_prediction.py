#!/usr/bin/env python3
"""
Test script to test the disease detection API and verify history saving.
"""

import requests
import json
from PIL import Image
import io

def test_disease_detection_api():
    """Test the disease detection API."""
    print("🧪 Testing Disease Detection API...")
    print("=" * 50)
    
    # Create a test image
    img = Image.new('RGB', (128, 128), color='green')
    
    # Convert to bytes
    buffer = io.BytesIO()
    img.save(buffer, format='JPEG')
    buffer.seek(0)
    
    # Test the prediction endpoint
    try:
        files = {'file': ('test_image.jpg', buffer.getvalue(), 'image/jpeg')}
        response = requests.post('http://localhost:8000/api/disease-detection/predict', files=files)
        
        if response.status_code == 200:
            result = response.json()
            print("✅ API Response:")
            print(f"  Prediction: {result['prediction']}")
            print(f"  Confidence: {result['confidence']:.3f}")
            print(f"  Is Sick: {result['is_sick']}")
            print(f"  Description: {result['description']}")
            print(f"  Class ID: {result['class_id']}")
            print(f"  Model Loaded: {result['model_loaded']}")
            
            # Test history endpoint
            print("\n📊 Testing History API...")
            history_response = requests.get('http://localhost:8000/api/disease-history/history')
            
            if history_response.status_code == 200:
                history_data = history_response.json()
                print("✅ History Response:")
                print(f"  Total Detections: {history_data.get('total_detections', 0)}")
                print(f"  Healthy Count: {history_data.get('healthy_count', 0)}")
                print(f"  Sick Count: {history_data.get('sick_count', 0)}")
                print(f"  Disease Rate: {history_data.get('disease_rate', 0):.1f}%")
                
                # Show recent detections
                if 'recent_detections' in history_data:
                    print(f"  Recent Detections: {len(history_data['recent_detections'])}")
                    for detection in history_data['recent_detections'][:3]:
                        print(f"    - {detection['prediction']} (confidence: {detection['confidence']:.3f})")
            else:
                print(f"❌ History API failed: {history_response.status_code}")
                print(history_response.text)
                
        else:
            print(f"❌ API failed: {response.status_code}")
            print(response.text)
            
    except Exception as e:
        print(f"❌ Error testing API: {e}")

def test_history_stats():
    """Test the history statistics endpoint."""
    print("\n📈 Testing History Statistics...")
    print("=" * 50)
    
    try:
        response = requests.get('http://localhost:8000/api/disease-history/stats')
        
        if response.status_code == 200:
            stats = response.json()
            print("✅ Statistics Response:")
            print(f"  Total Detections: {stats.get('total_detections', 0)}")
            print(f"  Healthy Count: {stats.get('healthy_count', 0)}")
            print(f"  Sick Count: {stats.get('sick_count', 0)}")
            print(f"  Disease Rate: {stats.get('disease_rate', 0):.1f}%")
            
            if 'disease_breakdown' in stats:
                print("  Disease Breakdown:")
                for disease, count in stats['disease_breakdown'].items():
                    print(f"    - {disease}: {count}")
                    
        else:
            print(f"❌ Stats API failed: {response.status_code}")
            print(response.text)
            
    except Exception as e:
        print(f"❌ Error testing stats: {e}")

if __name__ == "__main__":
    test_disease_detection_api()
    test_history_stats() 
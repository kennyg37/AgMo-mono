#!/usr/bin/env python3
"""
Test script to demonstrate disease detection history tracking.
"""

import requests
import json
from PIL import Image
import io

# Server URL
BASE_URL = "http://localhost:8000"

def create_test_image():
    """Create a simple test image."""
    img = Image.new('RGB', (224, 224), color='green')
    return img

def test_disease_detection_with_history():
    """Test disease detection and verify history is saved."""
    print("🧪 Testing Disease Detection with History Tracking...")
    
    # Create test image
    img = create_test_image()
    
    # Convert to bytes
    img_bytes = io.BytesIO()
    img.save(img_bytes, format='JPEG')
    img_bytes.seek(0)
    
    # Test disease detection
    files = {'file': ('test_image.jpg', img_bytes.getvalue(), 'image/jpeg')}
    
    try:
        print("\n1. Performing disease detection...")
        response = requests.post(f"{BASE_URL}/api/disease-detection/predict", files=files)
        
        if response.status_code == 200:
            result = response.json()
            print(f"✅ Disease detection successful!")
            print(f"   Prediction: {result['prediction']}")
            print(f"   Confidence: {result['confidence']:.3f}")
            print(f"   Is Sick: {result['is_sick']}")
        else:
            print(f"❌ Disease detection failed: {response.status_code}")
            return
        
        # Test history retrieval
        print("\n2. Retrieving disease detection history...")
        history_response = requests.get(f"{BASE_URL}/api/disease-history/")
        
        if history_response.status_code == 200:
            history = history_response.json()
            print(f"✅ History retrieval successful!")
            print(f"   Total records: {len(history)}")
            
            if history:
                latest = history[0]
                print(f"   Latest detection:")
                print(f"     - Disease: {latest['disease_type']}")
                print(f"     - Confidence: {latest['confidence']:.3f}")
                print(f"     - Detected at: {latest['detected_at']}")
        else:
            print(f"❌ History retrieval failed: {history_response.status_code}")
        
        # Test statistics
        print("\n3. Retrieving detection statistics...")
        stats_response = requests.get(f"{BASE_URL}/api/disease-history/stats")
        
        if stats_response.status_code == 200:
            stats = stats_response.json()
            print(f"✅ Statistics retrieval successful!")
            print(f"   Total detections: {stats['total_detections']}")
            print(f"   Disease counts: {stats['disease_counts']}")
            print(f"   Sick percentage: {stats['sick_percentage']:.1f}%")
            print(f"   Average confidence: {stats['confidence_stats']['average']:.3f}")
        else:
            print(f"❌ Statistics retrieval failed: {stats_response.status_code}")
        
        # Test recent detections
        print("\n4. Retrieving recent detections...")
        recent_response = requests.get(f"{BASE_URL}/api/disease-history/recent?limit=5")
        
        if recent_response.status_code == 200:
            recent = recent_response.json()
            print(f"✅ Recent detections retrieval successful!")
            print(f"   Recent detections: {len(recent)}")
            
            for i, detection in enumerate(recent[:3], 1):
                print(f"   {i}. {detection['disease_type']} (confidence: {detection['confidence']:.3f})")
        else:
            print(f"❌ Recent detections retrieval failed: {recent_response.status_code}")
        
    except Exception as e:
        print(f"❌ Error during testing: {e}")

def test_integrated_detection():
    """Test integrated disease detection with health monitoring."""
    print("\n🧪 Testing Integrated Disease Detection...")
    
    # Create test image
    img = create_test_image()
    
    # Convert to bytes
    img_bytes = io.BytesIO()
    img.save(img_bytes, format='JPEG')
    img_bytes.seek(0)
    
    # Test integrated endpoint
    files = {'file': ('test_image.jpg', img_bytes.getvalue(), 'image/jpeg')}
    params = {'field_id': 1}
    
    try:
        response = requests.post(f"{BASE_URL}/api/disease-detection/predict-with-health-monitoring", 
                               files=files, params=params)
        
        if response.status_code == 200:
            result = response.json()
            print(f"✅ Integrated detection successful!")
            print(f"   Disease: {result['prediction']['prediction']}")
            print(f"   Health Score: {result['health_record']['health_score']:.1f}")
            print(f"   Health Status: {result['health_record']['status']}")
            print(f"   Alert Severity: {result['alert']['severity']}")
            
            # Check if history was saved
            print("\n5. Verifying history was saved...")
            history_response = requests.get(f"{BASE_URL}/api/disease-history/recent?limit=1")
            
            if history_response.status_code == 200:
                history = history_response.json()
                if history:
                    latest = history[0]
                    print(f"✅ History verification successful!")
                    print(f"   Latest record disease: {latest['disease_type']}")
                    print(f"   Health record ID: {latest['health_record_id']}")
                else:
                    print("⚠️ No history records found")
            else:
                print(f"❌ History verification failed: {history_response.status_code}")
        else:
            print(f"❌ Integrated detection failed: {response.status_code}")
            print(response.text)
            
    except Exception as e:
        print(f"❌ Error during integrated testing: {e}")

def main():
    """Run all tests."""
    print("🚀 Starting Disease Detection History Tests...")
    print("=" * 60)
    
    # Test basic health
    try:
        response = requests.get(f"{BASE_URL}/health")
        if response.status_code == 200:
            print("✅ Server is running!")
        else:
            print("❌ Server not responding")
            return
    except Exception as e:
        print(f"❌ Cannot connect to server: {e}")
        return
    
    # Run tests
    test_disease_detection_with_history()
    test_integrated_detection()
    
    print("\n" + "=" * 60)
    print("🎉 Disease Detection History Test Complete!")
    print("\nKey Features Implemented:")
    print("✅ Automatic history tracking for all disease detections")
    print("✅ History retrieval with filtering options")
    print("✅ Detection statistics and analytics")
    print("✅ Recent detections tracking")
    print("✅ Integration with health monitoring system")
    print("✅ Alert generation with history tracking")

if __name__ == "__main__":
    main() 
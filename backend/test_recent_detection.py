#!/usr/bin/env python3
"""
Test script to create a recent plant detection for testing the time window functionality
"""

import requests
import json
from datetime import datetime, timedelta

def create_recent_plant_detection():
    """Create a plant detection with a recent timestamp."""
    
    # Create a timestamp that's 30 seconds ago (within the 1-minute window)
    recent_time = datetime.utcnow() - timedelta(seconds=30)
    
    data = {
        "sessionId": f"recent_test_{int(datetime.utcnow().timestamp())}",
        "plantId": "maize_recent_blight",
        "label": "Blight",
        "location": {
            "x": 300.0,
            "y": 0.0,
            "z": 400.0
        },
        "healthStatus": "diseased",
        "timestamp": recent_time.isoformat() + "Z"
    }
    
    try:
        response = requests.post(
            "http://localhost:8000/api/sessions/plant-detection",
            json=data,
            headers={"Content-Type": "application/json"}
        )
        
        if response.status_code == 200:
            result = response.json()
            print(f"✅ Created recent detection: {data['label']} at {data['location']}")
            print(f"   Timestamp: {data['timestamp']}")
            print(f"   Session ID: {result.get('session_id')}")
            print(f"   Success: {result.get('success')}")
            return result
        else:
            print(f"❌ Failed to create recent detection: {response.text}")
            return None
            
    except Exception as e:
        print(f"❌ Error creating recent detection: {e}")
        return None

def create_old_plant_detection():
    """Create a plant detection with an old timestamp (should be ignored)."""
    
    # Create a timestamp that's 2 minutes ago (outside the 1-minute window)
    old_time = datetime.utcnow() - timedelta(minutes=2)
    
    data = {
        "sessionId": f"old_test_{int(datetime.utcnow().timestamp())}",
        "plantId": "maize_old_rust",
        "label": "Rust",
        "location": {
            "x": 500.0,
            "y": 0.0,
            "z": 600.0
        },
        "healthStatus": "diseased",
        "timestamp": old_time.isoformat() + "Z"
    }
    
    try:
        response = requests.post(
            "http://localhost:8000/api/sessions/plant-detection",
            json=data,
            headers={"Content-Type": "application/json"}
        )
        
        if response.status_code == 200:
            result = response.json()
            print(f"⏰ Created old detection: {data['label']} at {data['location']}")
            print(f"   Timestamp: {data['timestamp']}")
            print(f"   Session ID: {result.get('session_id')}")
            print(f"   Success: {result.get('success')}")
            print("   ⚠️  This should be ignored by the polling system")
            return result
        else:
            print(f"❌ Failed to create old detection: {response.text}")
            return None
            
    except Exception as e:
        print(f"❌ Error creating old detection: {e}")
        return None

def test_time_window():
    """Test the time window functionality."""
    
    print("🧪 Testing time window functionality...")
    print("📝 Creating detections with different timestamps...")
    
    # Create an old detection (should be ignored)
    print("\n1. Creating old detection (2 minutes ago):")
    old_result = create_old_plant_detection()
    
    # Create a recent detection (should trigger alert)
    print("\n2. Creating recent detection (30 seconds ago):")
    recent_result = create_recent_plant_detection()
    
    print("\n🎉 Time window test completed!")
    print("💡 Check your frontend dashboard:")
    print("   - The recent detection (Blight) should trigger an alert")
    print("   - The old detection (Rust) should be ignored")
    print("   - Use the 'Check for Detections' button to test manually")

if __name__ == "__main__":
    test_time_window() 
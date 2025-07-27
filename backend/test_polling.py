#!/usr/bin/env python3
"""
Test script to create multiple plant detections for testing the polling system
"""

import requests
import time
import json
from datetime import datetime, timedelta

def create_plant_detection(session_id, plant_id, label, location, health_status):
    """Create a plant detection session."""
    
    data = {
        "sessionId": session_id,
        "plantId": plant_id,
        "label": label,
        "location": location,
        "healthStatus": health_status,
        "timestamp": datetime.utcnow().isoformat() + "Z"
    }
    
    try:
        response = requests.post(
            "http://localhost:8000/api/sessions/plant-detection",
            json=data,
            headers={"Content-Type": "application/json"}
        )
        
        if response.status_code == 200:
            result = response.json()
            print(f"✅ Created detection: {label} at {location}")
            return result
        else:
            print(f"❌ Failed to create detection: {response.text}")
            return None
            
    except Exception as e:
        print(f"❌ Error creating detection: {e}")
        return None

def test_polling_system():
    """Create multiple plant detections to test the polling system."""
    
    print("🧪 Testing polling system with multiple plant detections...")
    
    # Test detections
    detections = [
        {
            "session_id": f"test_session_{int(time.time())}_1",
            "plant_id": "maize_blight_1",
            "label": "Blight",
            "location": {"x": 150.5, "y": 0.0, "z": 200.3},
            "health_status": "diseased"
        },
        {
            "session_id": f"test_session_{int(time.time())}_2",
            "plant_id": "maize_rust_1",
            "label": "Rust",
            "location": {"x": 250.0, "y": 0.0, "z": 300.0},
            "health_status": "diseased"
        },
        {
            "session_id": f"test_session_{int(time.time())}_3",
            "plant_id": "maize_healthy_1",
            "label": "Healthy",
            "location": {"x": 100.0, "y": 0.0, "z": 150.0},
            "health_status": "healthy"
        }
    ]
    
    print("\n📝 Creating plant detections...")
    
    for i, detection in enumerate(detections, 1):
        print(f"\n{i}. Creating detection: {detection['label']}")
        result = create_plant_detection(
            detection["session_id"],
            detection["plant_id"],
            detection["label"],
            detection["location"],
            detection["health_status"]
        )
        
        if result:
            print(f"   Session ID: {result.get('session_id')}")
            print(f"   Success: {result.get('success')}")
        
        # Wait a bit between detections
        time.sleep(2)
    
    print("\n🎉 Plant detection test completed!")
    print("💡 Check your frontend dashboard to see if the polling system detects these new detections.")
    print("   The frontend should show alerts for the diseased plants (Blight and Rust).")

if __name__ == "__main__":
    test_polling_system() 
#!/usr/bin/env python3
"""
Test the plant detection session endpoint
"""

import asyncio
import json
import requests
from datetime import datetime

def test_session_endpoint():
    """Test the plant detection session endpoint."""
    
    print("🧪 Testing plant detection session endpoint...")
    
    # Test data
    test_data = {
        "sessionId": "550e8400-e29b-41d4-a716-446655440000",
        "plantId": "maize_blight_1",
        "label": "Blight",
        "location": {
            "x": 150.5,
            "y": 0.0,
            "z": 200.3
        },
        "healthStatus": "diseased",
        "timestamp": "2024-01-15T10:30:00Z"
    }
    
    try:
        # Test the endpoint
        response = requests.post(
            "http://localhost:8000/api/sessions/plant-detection",
            json=test_data,
            headers={"Content-Type": "application/json"}
        )
        
        print(f"📊 Response Status: {response.status_code}")
        print(f"📊 Response Headers: {dict(response.headers)}")
        
        if response.status_code == 200:
            result = response.json()
            print("✅ Session endpoint test passed!")
            print(f"📋 Response: {json.dumps(result, indent=2)}")
            return True
        else:
            print(f"❌ Session endpoint test failed!")
            print(f"📋 Error Response: {response.text}")
            return False
            
    except requests.exceptions.ConnectionError:
        print("❌ Could not connect to server. Make sure the server is running on localhost:8000")
        return False
    except Exception as e:
        print(f"❌ Test failed with error: {e}")
        return False

def test_get_sessions():
    """Test getting sessions."""
    
    print("\n🧪 Testing get sessions endpoint...")
    
    try:
        response = requests.get("http://localhost:8000/api/sessions/plant-detection")
        
        print(f"📊 Response Status: {response.status_code}")
        
        if response.status_code == 200:
            result = response.json()
            print("✅ Get sessions test passed!")
            print(f"📋 Found {len(result)} sessions")
            return True
        else:
            print(f"❌ Get sessions test failed!")
            print(f"📋 Error Response: {response.text}")
            return False
            
    except requests.exceptions.ConnectionError:
        print("❌ Could not connect to server. Make sure the server is running on localhost:8000")
        return False
    except Exception as e:
        print(f"❌ Test failed with error: {e}")
        return False

def main():
    """Main test function."""
    
    print("🚀 Testing plant detection session endpoints...")
    
    # Test creating a session
    session_created = test_session_endpoint()
    
    # Test getting sessions
    sessions_retrieved = test_get_sessions()
    
    if session_created and sessions_retrieved:
        print("\n🎉 All session endpoint tests passed!")
        print("✅ The session endpoint is working correctly!")
        return 0
    else:
        print("\n❌ Some session endpoint tests failed!")
        return 1

if __name__ == "__main__":
    exit(main()) 
"""Test user registration endpoint."""

import requests
import json

def test_registration():
    """Test user registration."""
    url = "http://localhost:8000/api/auth/register"
    
    # Test data for farmer account
    data = {
        "email": "farmer2@agmo.com",
        "username": "farmer2",
        "password": "farmer123",
        "full_name": "Jane Farmer",
        "phone": "+1234567891",
        "location": "Nebraska, USA",
        "experience_years": 10,
        "farm_size": 300,
        "primary_crops": "Wheat, Corn"
    }
    
    try:
        response = requests.post(url, json=data)
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.text}")
        
        if response.status_code == 200:
            result = response.json()
            print(f"\n✅ Registration successful!")
            print(f"Access Token: {result['access_token'][:50]}...")
            print(f"User: {result['user']['username']} ({result['user']['email']})")
        else:
            print(f"\n❌ Registration failed with status {response.status_code}")
            
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    test_registration() 
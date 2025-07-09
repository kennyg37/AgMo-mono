"""Test user login endpoint."""

import requests
import json

def test_login():
    """Test user login."""
    url = "http://localhost:8000/api/auth/login"
    
    # Login data
    data = {
        "username": "farmer@agmo.com",  # Can use email or username
        "password": "farmer123"
    }
    
    try:
        response = requests.post(url, data=data)  # Note: using data, not json for form data
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.text}")
        
        if response.status_code == 200:
            result = response.json()
            print(f"\n✅ Login successful!")
            print(f"Access Token: {result['access_token'][:50]}...")
            print(f"User: {result['user']['username']} ({result['user']['email']})")
            print(f"Role: {result['user']['role']}")
            print(f"Farm Size: {result['user']['farm_size']} acres")
            print(f"Experience: {result['user']['experience_years']} years")
            
            # Save token for later use
            with open("farmer_token.txt", "w") as f:
                f.write(result['access_token'])
            print(f"\n💾 Token saved to farmer_token.txt")
            
        else:
            print(f"\n❌ Login failed with status {response.status_code}")
            
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    test_login() 
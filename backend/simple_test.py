"""Simple test to check API endpoints."""

import requests

def test_basic_endpoints():
    """Test basic API endpoints."""
    
    # Test root endpoint
    try:
        response = requests.get("http://localhost:8000/")
        print(f"Root endpoint: {response.status_code}")
        if response.status_code == 200:
            print(f"Response: {response.json()}")
    except Exception as e:
        print(f"Root endpoint error: {e}")
    
    # Test health endpoint
    try:
        response = requests.get("http://localhost:8000/health")
        print(f"Health endpoint: {response.status_code}")
        if response.status_code == 200:
            print(f"Response: {response.json()}")
    except Exception as e:
        print(f"Health endpoint error: {e}")
    
    # Test auth endpoint (should return 405 Method Not Allowed for GET)
    try:
        response = requests.get("http://localhost:8000/api/auth/register")
        print(f"Auth endpoint GET: {response.status_code}")
    except Exception as e:
        print(f"Auth endpoint error: {e}")

if __name__ == "__main__":
    test_basic_endpoints() 
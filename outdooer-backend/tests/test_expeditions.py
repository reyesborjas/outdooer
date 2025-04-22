#!/usr/bin/env python3
"""
Script to test the expedition API endpoints

This script sends requests to the expedition endpoints to verify they work correctly.
It should be run when the Flask application is running.

Usage:
    python -m scripts.test_expeditions_api
"""

import requests
import json
from datetime import datetime, timedelta

# Base URL for the API
BASE_URL = 'http://localhost:5000/api'

# Test user credentials
TEST_USER = {
    'email': 'user1@example.com',
    'password': 'password1'
}

def get_auth_token():
    """Get authentication token for API requests"""
    login_url = f"{BASE_URL}/auth/login"
    response = requests.post(login_url, json=TEST_USER)
    if response.status_code == 200:
        token = response.json().get('access_token')
        return token
    else:
        print(f"Login failed: {response.text}")
        return None

def get_user_info(token):
    """Get current user information"""
    headers = {'Authorization': f'Bearer {token}'}
    user_url = f"{BASE_URL}/auth/me"
    response = requests.get(user_url, headers=headers)
    if response.status_code == 200:
        return response.json()
    else:
        print(f"Failed to get user info: {response.text}")
        return None

def test_expedition_endpoints():
    """Test expedition API endpoints"""
    token = get_auth_token()
    if not token:
        print("Authentication failed. Cannot proceed with tests.")
        return

    user_info = get_user_info(token)
    if not user_info:
        print("Failed to get user info. Cannot proceed with tests.")
        return

    headers = {'Authorization': f'Bearer {token}'}
    
    # Helper function to print the response
    def print_response(response):
        print(f"Status code: {response.status_code}")
        try:
            pretty_json = json.dumps(response.json(), indent=2)
            print(f"Response: {pretty_json}")
        except:
            print(f"Response: {response.text}")
        print("---")

    # Get team ID for creating expeditions
    team_id = None
    if user_info.get('teams') and len(user_info['teams']) > 0:
        team_id = user_info['teams'][0]['team_id']
        print(f"Using team ID: {team_id}")
    else:
        print("Warning: User has no teams, some tests may fail.")

    print("\n=== Testing GET /expeditions ===")
    response = requests.get(f"{BASE_URL}/expeditions", headers=headers)
    print_response(response)

    print("\n=== Testing GET /expeditions/created-by/{user_id} ===")
    response = requests.get(f"{BASE_URL}/expeditions/created-by/{user_info['user_id']}", headers=headers)
    print_response(response)

    print("\n=== Testing GET /expeditions/led-by/{user_id} ===")
    response = requests.get(f"{BASE_URL}/expeditions/led-by/{user_info['user_id']}", headers=headers)
    print_response(response)

    # Create a test expedition
    print("\n=== Testing POST /expeditions (Create) ===")
    tomorrow = (datetime.now() + timedelta(days=1)).strftime('%Y-%m-%d')
    next_week = (datetime.now() + timedelta(days=7)).strftime('%Y-%m-%d')
    
    expedition_data = {
        "title": "Test Expedition",
        "description": "This is a test expedition created by the API test script",
        "start_date": tomorrow,
        "end_date": next_week,
        "min_participants": 2,
        "max_participants": 10,
        "price": 199.99,
        "team_id": team_id
    }
    
    response = requests.post(f"{BASE_URL}/expeditions", headers=headers, json=expedition_data)
    print_response(response)
    
    # Get the created expedition ID
    expedition_id = None
    if response.status_code == 201:
        expedition_id = response.json().get('expedition_id')
        print(f"Created expedition with ID: {expedition_id}")
    else:
        print("Failed to create test expedition. Skipping related tests.")
        return

    # Get expedition by ID
    print(f"\n=== Testing GET /expeditions/{expedition_id} ===")
    response = requests.get(f"{BASE_URL}/expeditions/{expedition_id}", headers=headers)
    print_response(response)
    
    # Update expedition
    print(f"\n=== Testing PUT /expeditions/{expedition_id} (Update) ===")
    update_data = {
        "title": "Updated Test Expedition",
        "description": "This expedition was updated by the API test script",
        "price": 249.99
    }
    response = requests.put(f"{BASE_URL}/expeditions/{expedition_id}", headers=headers, json=update_data)
    print_response(response)
    
    # Add activities to expedition
    print(f"\n=== Testing POST /expeditions/{expedition_id}/activities ===")
    
    # First, get some activities to add
    activities_response = requests.get(f"{BASE_URL}/activities", headers=headers)
    activities = []
    
    if activities_response.status_code == 200 and 'activities' in activities_response.json():
        activities = activities_response.json()['activities']
    
    if activities:
        activities_data = {
            "activities": [
                {
                    "activity_id": activities[0]['activity_id'],
                    "sequence_order": 1,
                    "day_number": 1,
                    "is_optional": False
                }
            ]
        }
        
        if len(activities) > 1:
            activities_data["activities"].append({
                "activity_id": activities[1]['activity_id'],
                "sequence_order": 2,
                "day_number": 2,
                "is_optional": True
            })
        
        response = requests.post(
            f"{BASE_URL}/expeditions/{expedition_id}/activities", 
            headers=headers, 
            json=activities_data
        )
        print_response(response)
    else:
        print("No activities found to add to expedition. Skipping this test.")
    
    # Get expedition activities
    print(f"\n=== Testing GET /expeditions/{expedition_id}/activities ===")
    response = requests.get(f"{BASE_URL}/expeditions/{expedition_id}/activities", headers=headers)
    print_response(response)
    
    # Delete the test expedition (cleanup)
    print(f"\n=== Testing DELETE /expeditions/{expedition_id} ===")
    response = requests.delete(f"{BASE_URL}/expeditions/{expedition_id}", headers=headers)
    print_response(response)
    
    print("\nAll expedition endpoint tests completed!")

if __name__ == "__main__":
    test_expedition_endpoints()
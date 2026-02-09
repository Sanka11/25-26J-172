# ml-service/app/services/academic_service.py
import requests
import os

FIREBASE_BASE_URL = "http://localhost:5001/demiguard-3b4e8/us-central1"

def get_academic_deadlines():
    """Fetch all deadlines from Firebase"""
    try:
        response = requests.get(f"{FIREBASE_BASE_URL}/getAllDeadlines")
        if response.status_code == 200:
            return response.json()
    except Exception as e:
        print(f"Error fetching deadlines: {e}")
    return []

def get_module_details(module_code):
    """Fetch module info including LIC details"""
    try:
        response = requests.get(
            f"{FIREBASE_BASE_URL}/getModuleInfo",
            params={"moduleCode": module_code}
        )
        if response.status_code == 200:
            return response.json()
    except Exception as e:
        print(f"Error fetching module info: {e}")
    return None

def get_upcoming_deadlines():
    """Get deadlines for next 30 days"""
    try:
        response = requests.get(f"{FIREBASE_BASE_URL}/getUpcomingDeadlines")
        if response.status_code == 200:
            return response.json()
    except Exception as e:
        print(f"Error fetching upcoming deadlines: {e}")
    return []
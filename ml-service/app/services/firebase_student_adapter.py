"""
Firebase Database Adapter (READ-ONLY) for Student Personalization
Fetches student data from team member's database without modifying it.
"""

import os
import json
import requests
from typing import Optional, Dict

class FirebaseStudentAdapter:
    """
    READ-ONLY adapter to fetch student data from Firebase.
    Uses the existing backend API endpoints to retrieve student data.
    """
    
    def __init__(self, backend_url: str = None):
        """
        Initialize Firebase adapter.
        
        Args:
            backend_url: Backend API URL (e.g., http://localhost:5001/project-id/region/api)
        """
        # Default to local backend for development
        self.backend_url = backend_url or os.getenv(
            "BACKEND_URL",
            "http://localhost:5001/academiguard-59743/us-central1/api"
        )
        
    def get_student_data(self, student_id: str) -> Optional[Dict]:
        """
        Fetch student data from Firebase (READ-ONLY).
        
        Args:
            student_id: Student identifier (e.g., "S1001")
        
        Returns:
            Dictionary with student data or None if not found
        """
        try:
            # Try to get student risk history
            response = requests.get(
                f"{self.backend_url}/students/{student_id}/risk-history",
                timeout=5
            )
            
            if response.status_code == 200:
                data = response.json()
                
                # Extract most recent data
                if isinstance(data, list) and len(data) > 0:
                    latest = data[0]  # Assuming sorted by most recent
                    
                    return {
                        "student_id": student_id,
                        "attendance_rate": latest.get("attendance_rate", 0),
                        "gpa": latest.get("gpa", 0),
                        "assignments_completed": latest.get("assignments_completed", 0),
                        "risk_probability": latest.get("risk_probability", 0),
                        "risk_trend": latest.get("risk_trend", "Unknown"),
                        "semester": latest.get("semester", 1),
                    }
                elif isinstance(data, dict):
                    # Single object response
                    return {
                        "student_id": student_id,
                        "attendance_rate": data.get("attendance_rate", 0),
                        "gpa": data.get("gpa", 0),
                        "assignments_completed": data.get("assignments_completed", 0),
                        "risk_probability": data.get("risk_probability", 0),
                        "risk_trend": data.get("risk_trend", "Unknown"),
                        "semester": data.get("semester", 1),
                    }
            
            return None
            
        except requests.exceptions.RequestException as e:
            print(f"[Firebase Adapter] Error fetching student {student_id}: {e}")
            return None
    
    def classify_student_status(self, student_data: Dict) -> str:
        """
        Classify student as excellent, good, average, or at_risk based on Firebase data.
        
        Args:
            student_data: Dictionary with student metrics
        
        Returns:
            Status string: "excellent", "good", "average", or "at_risk"
        """
        attendance_rate = student_data.get("attendance_rate", 0)
        gpa = student_data.get("gpa", 0)
        risk_prob = student_data.get("risk_probability", 0)
        
        # Convert GPA (0-4) to percentage-like score for consistency
        gpa_percent = (gpa / 4.0) * 100 if gpa else 0
        
        # Check for at-risk indicators
        if risk_prob > 0.6 or attendance_rate < 50 or gpa < 2.0:
            return "at_risk"
        
        # Check for excellent performance
        if attendance_rate >= 85 and gpa >= 3.5:
            return "excellent"
        
        # Check for good performance
        if attendance_rate >= 75 and gpa >= 3.0:
            return "good"
        
        # Default to average
        return "average"
    
    def get_risk_factors(self, student_data: Dict) -> list:
        """
        Identify risk factors from student data.
        
        Args:
            student_data: Dictionary with student metrics
        
        Returns:
            List of risk factor strings
        """
        factors = []
        
        attendance_rate = student_data.get("attendance_rate", 0)
        gpa = student_data.get("gpa", 0)
        risk_prob = student_data.get("risk_probability", 0)
        assignments = student_data.get("assignments_completed", 0)
        
        if attendance_rate < 75:
            factors.append(f"Low attendance ({attendance_rate:.0f}%)")
        
        if gpa < 2.5:
            factors.append(f"Low GPA ({gpa:.2f}/4.0)")
        
        if risk_prob > 0.6:
            factors.append(f"High risk probability ({risk_prob*100:.0f}%)")
        
        if assignments < 5:
            factors.append(f"Few assignments completed ({assignments})")
        
        return factors
    
    def is_backend_available(self) -> bool:
        """
        Check if Firebase backend is accessible.
        
        Returns:
            True if backend is available, False otherwise
        """
        try:
            response = requests.get(self.backend_url, timeout=3)
            return response.status_code == 200
        except:
            return False


# Global singleton instance
_firebase_adapter = None


def get_firebase_adapter() -> FirebaseStudentAdapter:
    """Get or create the singleton Firebase adapter instance."""
    global _firebase_adapter
    if _firebase_adapter is None:
        _firebase_adapter = FirebaseStudentAdapter()
    return _firebase_adapter

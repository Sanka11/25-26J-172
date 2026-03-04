"""Service for managing student profiles and academic performance tracking."""

import os
import json
import time
from datetime import datetime
from enum import Enum

try:
    from .firebase_student_adapter import get_firebase_adapter
    FIREBASE_AVAILABLE = True
except ImportError:
    FIREBASE_AVAILABLE = False
    print("[Student Profile] Firebase adapter not available - using manual profiles only")


class StudentStatus(Enum):
    """Student academic status."""
    EXCELLENT = "excellent"  # High marks, good attendance
    GOOD = "good"  # Above average marks, regular attendance
    AVERAGE = "average"  # Average marks, average attendance
    AT_RISK = "at_risk"  # Low marks, poor attendance, missed exams
    
    @classmethod
    def determine_status(cls, attendance_percent: float, avg_exam_marks: float, exams_missed: int) -> 'StudentStatus':
        """Determine student status based on metrics."""
        if exams_missed > 2 or attendance_percent < 50 or avg_exam_marks < 40:
            return cls.AT_RISK
        elif attendance_percent >= 85 and avg_exam_marks >= 70:
            return cls.EXCELLENT
        elif attendance_percent >= 75 and avg_exam_marks >= 60:
            return cls.GOOD
        else:
            return cls.AVERAGE


class StudentProfileManager:
    """Manages student profiles and academic performance."""

    def __init__(self, base_dir: str = None):
        if base_dir is None:
            base_dir = os.path.dirname(os.path.dirname(__file__))
        self.profiles_dir = os.path.join(base_dir, "student_profiles")
        os.makedirs(self.profiles_dir, exist_ok=True)

    def _get_profile_file(self, user_id: str) -> str:
        """Get file path for a student's profile."""
        safe_user_id = "".join(c for c in user_id if c.isalnum() or c in "-_")
        return os.path.join(self.profiles_dir, f"{safe_user_id}_profile.json")

    def _load_profile(self, user_id: str) -> dict:
        """Load student profile."""
        profile_file = self._get_profile_file(user_id)
        if not os.path.isfile(profile_file):
            return self._create_default_profile(user_id)
        
        try:
            with open(profile_file, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception as e:
            print(f"Error loading profile for {user_id}: {e}")
            return self._create_default_profile(user_id)

    def _save_profile(self, user_id: str, profile: dict) -> None:
        """Save student profile."""
        profile_file = self._get_profile_file(user_id)
        try:
            with open(profile_file, "w", encoding="utf-8") as f:
                json.dump(profile, f, ensure_ascii=False, indent=2)
        except Exception as e:
            print(f"Error saving profile for {user_id}: {e}")

    def _create_default_profile(self, user_id: str) -> dict:
        """Create default profile for new student."""
        return {
            "user_id": user_id,
            "created_at": datetime.now().isoformat(),
            "last_updated": datetime.now().isoformat(),
            "attendance_percent": 0.0,
            "exam_marks": [],
            "avg_exam_marks": 0.0,
            "exams_missed": 0,
            "total_exams": 0,
            "status": StudentStatus.AVERAGE.value,
            "risk_factors": [],
        }

    def create_profile(self, user_id: str, attendance_percent: float, exam_marks: list, exams_missed: int = 0) -> dict:
        """Create or update a student profile.
        
        Args:
            user_id: Student identifier
            attendance_percent: Attendance percentage (0-100)
            exam_marks: List of exam marks
            exams_missed: Number of exams missed
        """
        if not user_id or not user_id.strip():
            raise ValueError("user_id cannot be empty")
        
        user_id = str(user_id).strip()
        profile = self._create_default_profile(user_id)
        
        # Validate and set attendance
        attendance_percent = max(0, min(100, float(attendance_percent)))
        profile["attendance_percent"] = attendance_percent
        
        # Set exam marks
        exam_marks = [float(m) for m in exam_marks if isinstance(m, (int, float))]
        profile["exam_marks"] = exam_marks
        profile["total_exams"] = len(exam_marks)
        profile["avg_exam_marks"] = sum(exam_marks) / len(exam_marks) if exam_marks else 0.0
        
        # Set exams missed
        profile["exams_missed"] = max(0, int(exams_missed))
        
        # Determine status
        status = StudentStatus.determine_status(attendance_percent, profile["avg_exam_marks"], profile["exams_missed"])
        profile["status"] = status.value
        
        # Identify risk factors
        profile["risk_factors"] = self._identify_risk_factors(profile)
        profile["last_updated"] = datetime.now().isoformat()
        
        self._save_profile(user_id, profile)
        return profile

    def _identify_risk_factors(self, profile: dict) -> list:
        """Identify academic risk factors."""
        factors = []
        
        if profile["attendance_percent"] < 75:
            factors.append("Low attendance")
        if profile["avg_exam_marks"] < 50:
            factors.append("Low exam performance")
        if profile["exams_missed"] > 0:
            factors.append(f"Missed {profile['exams_missed']} exam(s)")
        if len(profile["exam_marks"]) > 0 and min(profile["exam_marks"]) < 40:
            factors.append("Failed at least one exam")
        
        return factors

    def get_profile(self, user_id: str) -> dict:
        """Get student profile.
        
        If Firebase adapter is available and student data exists in team member's database,
        automatically sync from Firebase (READ-ONLY - never writes to Firebase).
        Otherwise, returns local profile or creates default.
        """
        if not user_id or not user_id.strip():
            raise ValueError("user_id cannot be empty")
        
        user_id = str(user_id).strip()
        
        # Try to sync from Firebase first (READ-ONLY)
        if FIREBASE_AVAILABLE:
            try:
                firebase_profile = self.sync_from_firebase(user_id, create_if_missing=False)
                if firebase_profile:
                    print(f"[Student Profile] Synced {user_id} from Firebase database")
                    return firebase_profile
            except Exception as e:
                print(f"[Student Profile] Firebase sync failed for {user_id}: {e}")
        
        # Fall back to local profile
        return self._load_profile(user_id)
    
    def sync_from_firebase(self, user_id: str, create_if_missing: bool = True) -> dict:
        """
        Sync student profile from team member's Firebase database (READ-ONLY).
        
        This function READS data from the existing 'students' database created by your
        team member. It never writes or modifies the Firebase database.
        
        Args:
            user_id: Student identifier (e.g., "S1001")
            create_if_missing: If True, create local profile even if Firebase data not found
        
        Returns:
            Student profile dictionary or None if not found
        """
        if not FIREBASE_AVAILABLE:
            print("[Student Profile] Firebase adapter not available")
            return None
        
        try:
            firebase_adapter = get_firebase_adapter()
            
            # READ student data from Firebase (NO WRITE)
            student_data = firebase_adapter.get_student_data(user_id)
            
            if not student_data:
                print(f"[Firebase] No data found for {user_id}")
                if create_if_missing:
                    return self._load_profile(user_id)
                return None
            
            # Convert Firebase data to our profile format
            attendance_percent = student_data.get("attendance_rate", 0)
            gpa = student_data.get("gpa", 0)
            
            # Convert GPA (0-4) to exam marks format (0-100)
            # This simulates exam performance based on GPA
            avg_exam_marks = (gpa / 4.0) * 100 if gpa else 0
            exam_marks = [avg_exam_marks]  # Single mark representing GPA
            
            # Check for risk indicators (exams missed)
            risk_prob = student_data.get("risk_probability", 0)
            exams_missed = 1 if risk_prob > 0.7 else 0  # High risk suggests missed exams
            
            # Classify student
            status = firebase_adapter.classify_student_status(student_data)
            risk_factors = firebase_adapter.get_risk_factors(student_data)
            
            # Create profile with Firebase data
            profile = {
                "user_id": user_id,
                "created_at": datetime.now().isoformat(),
                "last_updated": datetime.now().isoformat(),
                "attendance_percent": attendance_percent,
                "exam_marks": exam_marks,
                "avg_exam_marks": avg_exam_marks,
                "exams_missed": exams_missed,
                "total_exams": len(exam_marks),
                "status": status,
                "risk_factors": risk_factors,
                "source": "firebase_sync",  # Mark as synced from Firebase
                "firebase_data": student_data,  # Keep original for reference
            }
            
            # Save locally for caching (doesn't affect Firebase)
            self._save_profile(user_id, profile)
            
            return profile
            
        except Exception as e:
            print(f"[Firebase Sync] Error syncing {user_id}: {e}")
            if create_if_missing:
                return self._load_profile(user_id)
            return None

    def update_attendance(self, user_id: str, new_attendance: float) -> dict:
        """Update student attendance."""
        profile = self.get_profile(user_id)
        profile["attendance_percent"] = max(0, min(100, float(new_attendance)))
        status = StudentStatus.determine_status(
            profile["attendance_percent"],
            profile["avg_exam_marks"],
            profile["exams_missed"]
        )
        profile["status"] = status.value
        profile["risk_factors"] = self._identify_risk_factors(profile)
        profile["last_updated"] = datetime.now().isoformat()
        
        self._save_profile(user_id, profile)
        return profile

    def add_exam_mark(self, user_id: str, mark: float) -> dict:
        """Add exam mark for student."""
        profile = self.get_profile(user_id)
        profile["exam_marks"].append(float(mark))
        profile["total_exams"] = len(profile["exam_marks"])
        profile["avg_exam_marks"] = sum(profile["exam_marks"]) / len(profile["exam_marks"])
        
        status = StudentStatus.determine_status(
            profile["attendance_percent"],
            profile["avg_exam_marks"],
            profile["exams_missed"]
        )
        profile["status"] = status.value
        profile["risk_factors"] = self._identify_risk_factors(profile)
        profile["last_updated"] = datetime.now().isoformat()
        
        self._save_profile(user_id, profile)
        return profile

    def mark_exam_missed(self, user_id: str) -> dict:
        """Mark an exam as missed by student."""
        profile = self.get_profile(user_id)
        profile["exams_missed"] += 1
        
        status = StudentStatus.determine_status(
            profile["attendance_percent"],
            profile["avg_exam_marks"],
            profile["exams_missed"]
        )
        profile["status"] = status.value
        profile["risk_factors"] = self._identify_risk_factors(profile)
        profile["last_updated"] = datetime.now().isoformat()
        
        self._save_profile(user_id, profile)
        return profile

    def is_at_risk(self, user_id: str) -> bool:
        """Check if student is at academic risk."""
        profile = self.get_profile(user_id)
        return profile["status"] == StudentStatus.AT_RISK.value

    def is_high_achiever(self, user_id: str) -> bool:
        """Check if student is a high achiever."""
        profile = self.get_profile(user_id)
        return profile["status"] == StudentStatus.EXCELLENT.value


# Global instance
_profile_manager = None


def get_profile_manager() -> StudentProfileManager:
    """Get or create the singleton StudentProfileManager instance."""
    global _profile_manager
    if _profile_manager is None:
        _profile_manager = StudentProfileManager()
    return _profile_manager

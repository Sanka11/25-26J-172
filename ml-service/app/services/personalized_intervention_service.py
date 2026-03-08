"""Personalized Academic Intervention service.

Fetches student academic metrics from Firebase-backed backend APIs,
evaluates performance, and generates dynamic reminder messages.
"""

from __future__ import annotations

import os
import random
from dataclasses import dataclass
from typing import Dict, List
from urllib.parse import quote

import requests


THRESHOLDS = {
    "assignment_avg": 50,
    "attendance_pct": 70,
    "midterm_score": 50,
    "projects_score": 50,
    "quizzes_avg": 50,
}

@dataclass
class PerformanceResult:
    student_id: str
    metrics: Dict[str, float]
    below_threshold: List[str]
    classification: str
    reminders: List[str]

    def as_dict(self) -> Dict:
        return {
            "student_id": self.student_id,
            "metrics": self.metrics,
            "thresholds": THRESHOLDS,
            "below_threshold_metrics": self.below_threshold,
            "classification": self.classification,
            "reminders": self.reminders,
            "reminder_message": "\n".join(f"- {msg}" for msg in self.reminders),
        }


class PersonalizedInterventionService:
    def __init__(self, backend_url: str | None = None):
        raw_url = backend_url or os.getenv(
            "BACKEND_URL",
            "http://localhost:5001/academiguard-59743/us-central1/api",
        )
        self.backend_url = raw_url.rstrip("/")

    def fetch_student_performance(self, student_id: str) -> Dict[str, float]:
        if not student_id:
            raise ValueError("student_id is required")

        url = f"{self.backend_url}/students/{quote(student_id)}/performance"
        response = requests.get(url, timeout=8)

        if response.status_code == 404:
            raise ValueError(f"Student '{student_id}' not found in Firebase students collection")
        if response.status_code >= 400:
            raise RuntimeError(f"Failed to fetch student performance: {response.text}")

        data = response.json()
        return {
            "assignment_avg": float(data.get("assignment_avg", 0) or 0),
            "attendance_pct": float(data.get("attendance_pct", 0) or 0),
            "midterm_score": float(data.get("midterm_score", 0) or 0),
            "projects_score": float(data.get("projects_score", 0) or 0),
            "quizzes_avg": float(data.get("quizzes_avg", 0) or 0),
        }

    def analyze_student_performance(self, student_id: str, metrics: Dict[str, float]) -> PerformanceResult:
        below_threshold = [
            metric for metric, threshold in THRESHOLDS.items() if metrics.get(metric, 0) < threshold
        ]

        if len(below_threshold) == 0:
            classification = "HIGH PERFORMANCE"
        elif len(below_threshold) <= 2:
            classification = "MEDIUM PERFORMANCE"
        else:
            classification = "LOW PERFORMANCE"

        if classification == "HIGH PERFORMANCE":
            reminders = [
                "Excellent work! Your academic performance is strong.",
                "Your attendance and assignment scores are very good. Keep maintaining this performance.",
                "You are doing great in your coursework. Continue your effort.",
            ]
        elif classification == "MEDIUM PERFORMANCE":
            reminders = [
                "Your academic performance is moderate.",
                "Consider improving your assignment participation and reviewing lecture materials regularly.",
            ]
        else:
            low_reminder_pool = []
            if "midterm_score" in below_threshold:
                low_reminder_pool.append(
                    "Your Midterm score is below the expected level. Consider reviewing lecture slides and contacting your lecturer for additional support."
                )
            if "attendance_pct" in below_threshold:
                low_reminder_pool.append(
                    "Your attendance percentage is currently below the recommended level. Regular attendance significantly improves academic success."
                )
            if "assignment_avg" in below_threshold:
                low_reminder_pool.append(
                    "Your assignment average is low. Please ensure future submissions are completed before deadlines."
                )
            if "projects_score" in below_threshold:
                low_reminder_pool.append(
                    "Your project score is below the expected level. Allocate more time for practical tasks."
                )
            if "quizzes_avg" in below_threshold:
                low_reminder_pool.append(
                    "Your quiz average is low. Revise weekly topics and practice more quizzes."
                )

            if not low_reminder_pool:
                low_reminder_pool.append(
                    "Some indicators need improvement. Stay consistent with lectures, coursework, and revision."
                )

            # Requirement: show one motivational reminder randomly for low performers.
            reminders = [random.choice(low_reminder_pool)]

        return PerformanceResult(
            student_id=student_id,
            metrics=metrics,
            below_threshold=below_threshold,
            classification=classification,
            reminders=reminders,
        )

    def generate_personalized_intervention(self, student_id: str) -> Dict:
        metrics = self.fetch_student_performance(student_id)
        result = self.analyze_student_performance(student_id, metrics)
        return result.as_dict()


_personalized_intervention_service = None


def get_personalized_intervention_service() -> PersonalizedInterventionService:
    global _personalized_intervention_service
    if _personalized_intervention_service is None:
        _personalized_intervention_service = PersonalizedInterventionService()
    return _personalized_intervention_service

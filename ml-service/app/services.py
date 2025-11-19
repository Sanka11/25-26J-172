from .schemas import RiskRequest

def predict_risk_score(payload: RiskRequest) -> float:
    """
    Dummy ML logic (we will replace with real ML model later).
    """
    gpa_penalty = (4.0 - payload.gpa) / 4.0 * 40
    attendance_penalty = (100 - payload.attendance_rate) / 100 * 40
    assignment_penalty = max(0, 10 - payload.assignments_completed) * 2

    score = gpa_penalty + attendance_penalty + assignment_penalty
    score = max(0, min(100, score))
    return round(score, 2)

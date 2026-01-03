# ======================================================
# RL STATE BUILDER
# Combines GRU risk + academic signals + engagement
# ======================================================

def build_state(gru_output, student_features):
    """
    Build a compact RL state that captures:
    - Behavioral disengagement
    - Academic disengagement
    - Alert fatigue
    """

    # -------------------------
    # Risk encoding
    # -------------------------
    risk_map = {
        "LOW": 0,
        "NORMAL": 1,
        "HIGH": 2
    }

    risk_level = risk_map.get(gru_output["risk"], 0)

    # -------------------------
    # Academic disengagement (🔥 CRITICAL FIX)
    # -------------------------
    reasons = gru_output.get("reasons", [])

    academic_issue = int(
        any(
            r in reasons
            for r in [
                "Late submissions",
                "Assignments not submitted regularly",
                "Abnormal assignments_due"
            ]
        )
    )

    # -------------------------
    # Behavioral features
    # -------------------------
    days_inactive = min(int(student_features["days_since_last_login"]), 14)
    alerts_sent = min(int(student_features["alerts_sent"]), 5)
    alerts_responded = min(int(student_features["alerts_responded"]), 5)

    # Alert effectiveness (fatigue proxy)
    alert_effectiveness = 0
    if alerts_sent > 0:
        alert_effectiveness = int(alerts_responded / alerts_sent >= 0.3)

    # -------------------------
    # FINAL STATE (Discrete)
    # -------------------------
    state = (
        risk_level,        # 0,1,2
        academic_issue,    # 0 or 1 🔥
        days_inactive,     # 0–14
        alerts_sent,       # 0–5
        alert_effectiveness # 0 or 1
    )

    return state

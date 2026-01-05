import pandas as pd

from app.predict_single_student import get_student_risk
from app.services.rl_service import get_rl_decision


# ======================================================
# CONFIG
# ======================================================

DATASET_PATH = "app/data/dataset.csv"
SEQ_LEN = 10

ACTION_MAP = {
    0: "DO_NOTHING",
    1: "IN_APP_REMINDER",
    2: "EMAIL_REMINDER",
    3: "MOTIVATIONAL_MESSAGE",
    4: "ESCALATE_PEER_CHEER",
}


# ======================================================
# NEXT WEEK SIMULATION SERVICE
# ======================================================

def simulate_next_week(student_id: str, new_week: dict):
    """
    Inject a hypothetical next-week record and simulate:
    GRU (risk) → RL (proposal) → constraint-based final action
    """

    # --------------------------------------------------
    # 1️⃣ LOAD DATASET
    # --------------------------------------------------
    df = pd.read_csv(DATASET_PATH)
    df = df.sort_values(["student_id", "week_start_date"]).reset_index(drop=True)

    student_df = df[df["student_id"] == student_id].copy()

    if len(student_df) < SEQ_LEN:
        raise ValueError("Not enough history for GRU prediction")

    # --------------------------------------------------
    # 2️⃣ CURRENT GRU RISK (BASELINE)
    # --------------------------------------------------
    current_gru = get_student_risk(
        student_id=student_id,
        dataset_path=DATASET_PATH,
        sequence_length=SEQ_LEN,
    )

    previous_risk = current_gru["risk_level"]

    # --------------------------------------------------
    # 3️⃣ APPEND NEW WEEK (IN MEMORY ONLY)
    # --------------------------------------------------
    last_row = student_df.iloc[-1].copy()

    for key, value in new_week.items():
        last_row[key] = value

    last_row["week_start_date"] = "SIMULATED_NEXT_WEEK"

    extended_df = pd.concat(
        [student_df, pd.DataFrame([last_row])],
        ignore_index=True,
    )

    temp_path = "app/data/_temp_next_week.csv"
    extended_df.to_csv(temp_path, index=False)

    # --------------------------------------------------
    # 4️⃣ NEW GRU RISK (AUTHORITATIVE)
    # --------------------------------------------------
    new_gru = get_student_risk(
        student_id=student_id,
        dataset_path=temp_path,
        sequence_length=SEQ_LEN,
    )

    new_risk = new_gru["risk_level"]

    # --------------------------------------------------
    # 5️⃣ BUILD RL STATE (NOW DYNAMIC)
    # --------------------------------------------------

    # Infer last action from alert history (simple, safe heuristic)
    if new_week["alerts_sent"] == 0:
        last_action = 0  # DO_NOTHING
    elif new_week["alerts_sent"] == 1:
        last_action = 1  # IN_APP_REMINDER
    elif new_week["alerts_sent"] == 2:
        last_action = 2  # EMAIL_REMINDER
    else:
        last_action = 4  # ESCALATE_PEER_CHEER

    rl_state = {
        "risk_level": {"LOW": 0, "NORMAL": 1, "HIGH": 2}[new_risk],
        "last_action": last_action,
        "engagement_score": new_week["engagement_score"],
        "alert_fatigue": new_week["alerts_sent"],
        "week_gap": new_week["days_since_last_login"],
    }

    # --------------------------------------------------
    # 6️⃣ RL PROPOSAL (LEARNED POLICY)
    # --------------------------------------------------
    rl_result = get_rl_decision(
        student_id=student_id,
        week=len(extended_df),
        state=rl_state,
    )

    proposed_action = ACTION_MAP.get(
        rl_result["action"], "DO_NOTHING"
    )

    # --------------------------------------------------
    # 7️⃣ CONSTRAINT + ESCALATION LOGIC (FINAL AUTHORITY)
    # --------------------------------------------------

    # LOW RISK → never intervene
    if new_risk == "LOW":
        final_action = "DO_NOTHING"

    # NORMAL RISK → soft nudges only
    elif new_risk == "NORMAL":
        if proposed_action in ["DO_NOTHING", "IN_APP_REMINDER"]:
            final_action = proposed_action
        else:
            final_action = "IN_APP_REMINDER"

    # HIGH RISK → progressive escalation
    else:
        if new_week["alerts_sent"] == 0:
            final_action = "IN_APP_REMINDER"
        elif new_week["alerts_sent"] < 2:
            final_action = "EMAIL_REMINDER"
        else:
            final_action = "ESCALATE_PEER_CHEER"

    # --------------------------------------------------
    # 8️⃣ FINAL RESPONSE
    # --------------------------------------------------
    return {
        "student_id": student_id,
        "previous_risk": previous_risk,
        "new_risk": new_risk,
        "recommended_action": final_action,
    }

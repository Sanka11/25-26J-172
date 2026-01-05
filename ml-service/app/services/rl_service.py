from app.rl.rl_inference import load_rl_agent

# ======================================================
# RL AGENT (LOAD ONCE)
# ======================================================

_rl_agent = load_rl_agent()

ACTIONS = {
    0: "DO_NOTHING",
    1: "IN_APP_REMINDER",
    2: "EMAIL_REMINDER",
    3: "MOTIVATIONAL_MESSAGE",
    4: "ESCALATE_PEER_CHEER",
}


def get_rl_decision(
    student_id: str,
    week: int,
    state: dict,
    gru_risk: str | None = None  # ✅ OPTIONAL (BACKWARD SAFE)
):
    """
    RL decision helper.

    - If gru_risk is NOT provided → behaves exactly like before
    - If gru_risk IS provided → applies safety constraints
    """

    # --------------------------------------------------
    # 1️⃣ LOW-LEVEL RL INFERENCE (UNCHANGED)
    # --------------------------------------------------
    state_tuple = tuple(state.values())
    action_id = _rl_agent.choose_action(state_tuple)
    q_value = _rl_agent.q_table.get((state_tuple, action_id), 0.0)

    proposed_action = ACTIONS.get(action_id, "DO_NOTHING")

    # --------------------------------------------------
    # 2️⃣ BACKWARD COMPATIBILITY MODE
    # --------------------------------------------------
    if gru_risk is None:
        return {
            "student_id": student_id,
            "week": week,
            "action": proposed_action,
            "q_value": float(q_value),
        }

    # --------------------------------------------------
    # 3️⃣ RISK-AWARE CONSTRAINT LOGIC (NEW)
    # --------------------------------------------------
    if gru_risk == "LOW":
        final_action = "DO_NOTHING"

    elif gru_risk == "NORMAL":
        if proposed_action in ["DO_NOTHING", "IN_APP_REMINDER"]:
            final_action = proposed_action
        else:
            final_action = "IN_APP_REMINDER"

    else:  # HIGH
        if proposed_action == "DO_NOTHING":
            final_action = "IN_APP_REMINDER"
        elif proposed_action in ["IN_APP_REMINDER", "EMAIL_REMINDER"]:
            final_action = proposed_action
        else:
            final_action = "ESCALATE_PEER_CHEER"

    # --------------------------------------------------
    # 4️⃣ FINAL RESPONSE
    # --------------------------------------------------
    return {
        "student_id": student_id,
        "week": week,
        "action": final_action,
        "q_value": float(q_value),
        "rl_raw_action": proposed_action,
        "gru_risk": gru_risk,
    }

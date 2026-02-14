import os
import joblib
import numpy as np

# --------------------------------------------------
# Paths
# --------------------------------------------------
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

QTABLE_PATH = os.path.join(BASE_DIR, "rl_qtable.pkl")
CONFIG_PATH = os.path.join(BASE_DIR, "rl_config.pkl")

# --------------------------------------------------
# Load artifacts
# --------------------------------------------------
Q_TABLE = joblib.load(QTABLE_PATH)   # shape: (252, 6)
CONFIG = joblib.load(CONFIG_PATH)

ACTIONS_ID_TO_NAME = CONFIG["ACTIONS"]          # {0: "DO_NOTHING", ...}
RISK_MAP = CONFIG["RISK_MAP"]                   # {"LOW":0, "NORMAL":1, "HIGH":2}
LAST_ACTION_NONE = CONFIG["LAST_ACTION_NONE"]   # 6
NO_RESP_MAX = CONFIG["NO_RESP_MAX"]             # 3
FATIGUE_MAX = CONFIG["FATIGUE_MAX"]             # 2

# Reverse lookup
ACTIONS_NAME_TO_ID = {v: k for k, v in ACTIONS_ID_TO_NAME.items()}

# --------------------------------------------------
# State indexing (CRITICAL)
# --------------------------------------------------
def state_to_index(risk_id, last_action, no_resp, fatigue):
    """
    Maps (risk, last_action, no_resp, fatigue) -> Q-table row index
    """
    return (
        risk_id * (7 * 4 * 3)
        + last_action * (4 * 3)
        + no_resp * 3
        + fatigue
    )

# --------------------------------------------------
# RL decision with guardrails
# --------------------------------------------------
def recommend_action(
    risk_level: str,
    last_action: int | None,
    no_response_streak: int,
    fatigue: int,  # 0=LOW, 1=MED, 2=HIGH
):
    # ---------- Guardrails ----------
    if fatigue == FATIGUE_MAX and risk_level != "HIGH":
        return {
            "recommended_action": "DO_NOTHING",
            "action_id": ACTIONS_NAME_TO_ID["DO_NOTHING"],
            "reason": "FATIGUE_BLOCK",
        }

    if risk_level == "HIGH" and no_response_streak >= 3:
        return {
            "recommended_action": "HUMAN_ESCALATION",
            "action_id": ACTIONS_NAME_TO_ID["HUMAN_ESCALATION"],
            "reason": "FORCED_HUMAN_ESCALATION",
        }

    if risk_level == "HIGH" and no_response_streak >= 2:
        return {
            "recommended_action": "PEER_CHEER",
            "action_id": ACTIONS_NAME_TO_ID["PEER_CHEER"],
            "reason": "FORCED_PEER_CHEER",
        }

    if risk_level == "LOW":
        return {
            "recommended_action": "DO_NOTHING",
            "action_id": ACTIONS_NAME_TO_ID["DO_NOTHING"],
            "reason": "LOW_RISK_POLICY",
        }

    # ---------- Build state ----------
    risk_id = RISK_MAP[risk_level]
    last_action = LAST_ACTION_NONE if last_action is None else last_action
    no_resp = min(no_response_streak, NO_RESP_MAX)
    fatigue = min(fatigue, FATIGUE_MAX)

    state_index = state_to_index(risk_id, last_action, no_resp, fatigue)

    # ---------- RL policy ----------
    q_values = Q_TABLE[state_index]
    best_action_id = int(np.argmax(q_values))

    return {
        "recommended_action": ACTIONS_ID_TO_NAME[best_action_id],
        "action_id": best_action_id,
        "reason": "RL_POLICY",
    }

# --------------------------------------------------
# Local test
# --------------------------------------------------
if __name__ == "__main__":
    test_cases = [
        ("HIGH", None, 0, 0),
        ("HIGH", ACTIONS_NAME_TO_ID["REMINDER"], 2, 1),
        ("HIGH", ACTIONS_NAME_TO_ID["PEER_CHEER"], 3, 0),
        ("NORMAL", ACTIONS_NAME_TO_ID["SOFT_NUDGE"], 0, 2),
        ("LOW", None, 0, 0),
    ]

    for case in test_cases:
        print(case, "→", recommend_action(*case))

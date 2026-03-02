import joblib
import numpy as np
from pathlib import Path

# =========================
# LOAD RL ARTIFACTS
# =========================
BASE_DIR = Path(__file__).resolve().parent

Q_TABLE_PATH = BASE_DIR / "rl_qtable_v2.joblib"
CONFIG_PATH = BASE_DIR / "rl_config_v2.joblib"

Q_table = joblib.load(Q_TABLE_PATH)
config = joblib.load(CONFIG_PATH)

RISK_MAP = config["RISK_MAP"]
TREND_MAP = config["TREND_MAP"]
ACTION_MAP = config["ACTION_MAP"]
INV_ACTION_MAP = config["INV_ACTION_MAP"]

# =========================
# GUARDRAILS
# =========================
def forced_action(last_action, no_resp):
    if last_action == "PEER_CHEER" and no_resp >= 3:
        return "HUMAN_ESCALATION", "FORCED_HUMAN_ESCALATION"
    if no_resp >= 2:
        return "PEER_CHEER", "FORCED_PEER_CHEER"
    return None, None


# =========================
# RL DECISION FUNCTION
# =========================
def rl_decide_action(
    current_risk: str,
    risk_trend: str,
    last_action: str,
    no_response_streak: int,
    fatigue_level: int
) -> dict:
    
    # 🔒 SAFETY NET (ADD THIS)
    if risk_trend not in TREND_MAP:
        risk_trend = "STABLE"

    # 1️⃣ Guardrails first
    forced, reason = forced_action(last_action, no_response_streak)
    if forced:
        return {
            "action": forced,
            "reason": reason,
            "trend": risk_trend,
            "q_value": None
        }

    # 2️⃣ Build RL state
    state = (
        RISK_MAP[current_risk],
        TREND_MAP[risk_trend],
        ACTION_MAP[last_action],
        min(no_response_streak, 2),
        min(fatigue_level, 2)
    )

    q_values = Q_table.get(state, np.zeros(len(ACTION_MAP)))
    action_idx = int(np.argmax(q_values))

    return {
        "action": INV_ACTION_MAP[action_idx],
        "reason": "RL_OK",
        "trend": risk_trend,
        "q_value": float(q_values[action_idx])
    }
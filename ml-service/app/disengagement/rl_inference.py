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
# ACTION ORDER (ESCALATION LADDER)
# =========================
ACTION_ORDER = [
    "SOFT_NUDGE",
    "REMINDER",
    "PEER_CHEER",
    "HUMAN_ESCALATION"
]


def escalate(action: str):
    if action not in ACTION_ORDER:
        return "SOFT_NUDGE"

    idx = ACTION_ORDER.index(action)
    return ACTION_ORDER[min(idx + 1, len(ACTION_ORDER) - 1)]


def deescalate(action: str):
    if action not in ACTION_ORDER:
        return "SOFT_NUDGE"

    idx = ACTION_ORDER.index(action)
    return ACTION_ORDER[max(idx - 1, 0)]


# =========================
# GUARDRAILS
# =========================
def forced_action(last_action: str, no_resp: int):
    """
    Hard safety rules (same as training-time behavior)
    """

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
    """
    RL v2 inference function
    (trend-aware, Q-table based, with rule-based policy layer)
    """

    # -------------------------
    # SAFETY NET
    # -------------------------
    if risk_trend not in TREND_MAP:
        risk_trend = "STABLE"

    if last_action not in ACTION_MAP:
        last_action = "SOFT_NUDGE"

    # -------------------------
    # 1️⃣ Guardrails first
    # -------------------------
    forced, reason = forced_action(last_action, no_response_streak)
    if forced:
        return {
            "action": forced,
            "reason": reason,
            "trend": risk_trend,
            "q_value": None
        }

    # =========================
    # 2️⃣ POLICY RULES
    # =========================

    # -------------------------
    # STABLE → repeat last action
    # -------------------------
    if risk_trend == "STABLE":
        return {
            "action": last_action,
            "reason": "REPEAT_LAST_ACTION",
            "trend": risk_trend,
            "q_value": None
        }

    # -------------------------
    # INCREASING → escalate
    # -------------------------
    if risk_trend == "INCREASING":

        # NEW LOGIC:
        # If already at HUMAN_ESCALATION and things still worsen,
        # keep HUMAN_ESCALATION active.
        if last_action == "HUMAN_ESCALATION":
            return {
                "action": "HUMAN_ESCALATION",
                "reason": "CONTINUE_HUMAN_SUPPORT",
                "trend": risk_trend,
                "q_value": None
            }

        next_action = escalate(last_action)

        return {
            "action": next_action,
            "reason": "ESCALATE_ACTION",
            "trend": risk_trend,
            "q_value": None
        }

    # -------------------------
    # DECREASING → reduce action
    # -------------------------
    if risk_trend == "DECREASING":

        # NEW LOGIC:
        # If student improving after HUMAN_ESCALATION
        # step down to PEER_CHEER
        if last_action == "HUMAN_ESCALATION":
            return {
                "action": "PEER_CHEER",
                "reason": "STEP_DOWN_SUPPORT",
                "trend": risk_trend,
                "q_value": None
            }

        # existing logic unchanged
        if last_action == "SOFT_NUDGE":
            return {
                "action": "DO_NOTHING",
                "reason": "RECOVERING",
                "trend": risk_trend,
                "q_value": None
            }

        if current_risk == "LOW":
            return {
                "action": "DO_NOTHING",
                "reason": "RECOVERING",
                "trend": risk_trend,
                "q_value": None
            }

        next_action = deescalate(last_action)

        return {
            "action": next_action,
            "reason": "DEESCALATE_ACTION",
            "trend": risk_trend,
            "q_value": None
        }

    # =========================
    # 3️⃣ RL Q-TABLE FALLBACK
    # =========================
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
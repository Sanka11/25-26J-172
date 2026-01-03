from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

# GRU (authoritative risk)
from app.predict_single_student import get_student_risk

# RL inference
from app.services.rl_service import get_rl_decision

app = FastAPI(
    title="AcademiGuard RL Service",
    version="1.0"
)

# ======================================================
# CORS CONFIGURATION
# ======================================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ======================================================
# RL ACTION SPACE (MUST MATCH TRAINING)
# ======================================================

ACTIONS = {
    0: "DO_NOTHING",
    1: "IN_APP_REMINDER",
    2: "EMAIL_REMINDER",
    3: "MOTIVATIONAL_MESSAGE",
    4: "ESCALATE_PEER_CHEER",
}

# ======================================================
# HEALTH CHECK
# ======================================================

@app.get("/health")
def health():
    return {"status": "rl service running"}

# ======================================================
# FINAL RL DECISION ENDPOINT
# ======================================================

@app.get("/rl/decide/{student_id}")
def decide(student_id: str):
    """
    Final adaptive intervention decision:
    GRU risk → constrained RL → action name
    """

    try:
        # --------------------------------------------------
        # 1️⃣ AUTHORITATIVE GRU RISK
        # --------------------------------------------------
        gru_output = get_student_risk(
            student_id=student_id,
            dataset_path="app/data/dataset.csv",
            sequence_length=10,
        )

        if gru_output["risk_level"] is None:
            raise Exception("GRU could not compute risk")

        gru_risk = gru_output["risk_level"]

        # --------------------------------------------------
        # 2️⃣ BUILD RL STATE (TEMP — SAME AS YOUR TESTING)
        # --------------------------------------------------
        # NOTE: This will be replaced with real features later
        state = {
            "risk_level": {"LOW": 0, "NORMAL": 1, "HIGH": 2}[gru_risk],
            "last_action": 1,
            "engagement_score": 0.3,
            "alert_fatigue": 2,
            "week_gap": 1,
        }

        # --------------------------------------------------
        # 3️⃣ RL INFERENCE (LOW-LEVEL)
        # --------------------------------------------------
        rl_result = get_rl_decision(
            student_id=student_id,
            week=5,
            state=state,
        )

        action_id = rl_result["action"]
        proposed_action = ACTIONS.get(action_id, "DO_NOTHING")

        # --------------------------------------------------
        # 4️⃣ CONSTRAINT LOGIC (FINAL AUTHORITY)
        # --------------------------------------------------
        if gru_risk == "LOW":
            final_action = "DO_NOTHING"

        elif gru_risk == "NORMAL":
            if proposed_action in ["DO_NOTHING", "IN_APP_REMINDER"]:
                final_action = proposed_action
            else:
                final_action = "IN_APP_REMINDER"

        else:  # HIGH
            final_action = "ESCALATE_PEER_CHEER"

        # --------------------------------------------------
        # 5️⃣ FINAL RESPONSE (WHAT FRONTEND EXPECTS)
        # --------------------------------------------------
        return {
            "student_id": student_id,
            "gru_risk": gru_risk,
            "recommended_action": final_action,
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

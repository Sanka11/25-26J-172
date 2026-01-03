import pandas as pd

from app.predict_single_student import get_student_risk
from app.rl.rl_inference import load_rl_agent
from app.rl.state_builder import build_state


# ======================================================
# CONFIG
# ======================================================
DATASET_PATH = "app/data/dataset.csv"
SEQ_LEN = 10
MAX_STEPS = 5

ACTIONS = {
    0: "DO_NOTHING",
    1: "IN_APP_REMINDER",
    2: "EMAIL_REMINDER",
    3: "MOTIVATIONAL_MESSAGE",
    4: "ESCALATE_PEER_CHEER"
}


# ======================================================
# LOAD RL AGENT
# ======================================================
rl_agent = load_rl_agent()


# ======================================================
# MULTI-WEEK SIMULATION
# ======================================================
def simulate_student_multiweek(student_id: str):

    df = pd.read_csv(DATASET_PATH)
    df = df.sort_values(["student_id", "week_start_date"]).reset_index(drop=True)

    student_df = df[df["student_id"] == student_id].reset_index(drop=True)

    if len(student_df) < SEQ_LEN:
        print(f"⚠️ Student {student_id} skipped (needs at least {SEQ_LEN} weeks)")
        return

    print("\n===================================================")
    print(f"📈 MULTI-STEP GRU → RL SIMULATION | Student: {student_id}")
    print("===================================================\n")

    trajectory = []

    # Use last week as current context
    current_row = student_df.iloc[-1].copy()

    # --------------------------------------------------
    # 1️⃣ RUN GRU (AUTHORITATIVE)
    # --------------------------------------------------
    gru_raw = get_student_risk(
        student_id=student_id,
        dataset_path=DATASET_PATH,
        sequence_length=SEQ_LEN
    )

    if gru_raw["risk_level"] is None:
        print("❌ GRU could not compute risk")
        return

    gru_state = {
        "risk": gru_raw["risk_level"],
        "reasons": gru_raw.get("reasons", [])
    }

    gru_risk = gru_state["risk"]
    academic_issue = int(len(gru_state["reasons"]) > 0)

    # --------------------------------------------------
    # 2️⃣ ADAPTIVE RL LOOP
    # --------------------------------------------------
    for step in range(1, MAX_STEPS + 1):

        state = build_state(
            gru_output=gru_state,
            student_features=current_row
        )

        # ==================================================
        # ACTION MASKING + ESCALATION LOGIC (FINAL)
        # ==================================================

        # ---------- LOW RISK ----------
        if gru_risk == "LOW":
            action_name = "DO_NOTHING"

        # ---------- NORMAL RISK ----------
        elif gru_risk == "NORMAL":
            allowed = ["DO_NOTHING", "IN_APP_REMINDER"]
            action_id = rl_agent.choose_action(state)
            proposed = ACTIONS.get(action_id, "DO_NOTHING")
            action_name = proposed if proposed in allowed else "IN_APP_REMINDER"

        # ---------- HIGH RISK ----------
        else:
            if academic_issue == 1:
                action_name = "MOTIVATIONAL_MESSAGE"
            elif current_row["alerts_sent"] == 0:
                action_name = "IN_APP_REMINDER"
            elif current_row["alerts_sent"] < 2:
                action_name = "EMAIL_REMINDER"
            else:
                action_name = "ESCALATE_PEER_CHEER"

        # --------------------------------------------------
        # LOG STEP
        # --------------------------------------------------
        trajectory.append({
            "step": step,
            "gru_risk": gru_risk,
            "rl_action": action_name,
            "days_since_last_login": current_row["days_since_last_login"],
            "alerts_sent": current_row["alerts_sent"],
            "alerts_responded": current_row["alerts_responded"],
            "engagement_score": current_row.get("engagement_score"),
            "academic_reasons": ", ".join(gru_state["reasons"])
        })

        # --------------------------------------------------
        # STOP CONDITIONS
        # --------------------------------------------------
        if gru_risk == "LOW":
            break

        if action_name == "ESCALATE_PEER_CHEER":
            break

        # --------------------------------------------------
        # SIMULATED EFFECT OF ACTION
        # --------------------------------------------------
        if action_name != "DO_NOTHING":
            current_row["alerts_sent"] += 1

        if action_name in ["EMAIL_REMINDER", "MOTIVATIONAL_MESSAGE"]:
            current_row["alerts_responded"] += 1
            current_row["days_since_last_login"] = max(
                0, current_row["days_since_last_login"] - 1
            )

        current_row["engagement_score"] = min(
            3.0, current_row.get("engagement_score", 1.5) + 0.4
        )

        # --------------------------------------------------
        # SIMULATED RISK TRANSITION
        # --------------------------------------------------
        if step >= 2 and gru_risk == "HIGH":
            gru_risk = "NORMAL"
            gru_state["risk"] = "NORMAL"
            gru_state["reasons"] = []
            academic_issue = 0

        elif step >= 4 and gru_risk == "NORMAL":
            gru_risk = "LOW"
            gru_state["risk"] = "LOW"

    # ======================================================
    # OUTPUT
    # ======================================================
    result_df = pd.DataFrame(trajectory)

    print("📊 RL ADAPTIVE TRAJECTORY")
    print("-----------------------------------")
    print(result_df)

    out_path = f"app/rl/trajectory_{student_id}.csv"
    result_df.to_csv(out_path, index=False)
    print(f"\n📁 Saved trajectory to {out_path}\n")


# ======================================================
# CLI ENTRY POINT
# ======================================================
if __name__ == "__main__":
    print("🚀 RL Multi-week Simulation Started")
    student_id = input("Enter student ID: ").strip()
    simulate_student_multiweek(student_id)

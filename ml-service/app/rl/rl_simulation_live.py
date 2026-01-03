import pandas as pd

from app.predict_single_student import get_student_risk
from app.rl.rl_inference import load_rl_agent
from app.rl.state_builder import build_state


# ======================================================
# CONFIG
# ======================================================
DATASET_PATH = "app/data/dataset.csv"
SEQ_LEN = 10   # exactly matches GRU sequence length

# RL ACTION SPACE (MUST MATCH TRAINING)
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
# MAIN SIMULATION
# ======================================================
def simulate_student(student_id: str):

    df = pd.read_csv(DATASET_PATH)
    df = df.sort_values(["student_id", "week_start_date"]).reset_index(drop=True)

    student_df = df[df["student_id"] == student_id].reset_index(drop=True)

    if len(student_df) < SEQ_LEN:
        print(f"⚠️ Student {student_id} skipped (needs {SEQ_LEN} weeks)")
        return

    print("\n==============================================")
    print(f"📊 GRU → RL Simulation for Student: {student_id}")
    print("==============================================\n")

    # --------------------------------------------------
    # 1️⃣ TRUE GRU OUTPUT (SINGLE SOURCE OF TRUTH)
    # --------------------------------------------------
    gru_output = get_student_risk(
        student_id=student_id,
        dataset_path=DATASET_PATH,
        sequence_length=SEQ_LEN
    )

    # Handle GRU failure safely
    if gru_output["risk_level"] is None:
        print("❌ GRU could not compute risk:")
        print(gru_output["message"])
        return

    # --------------------------------------------------
    # 2️⃣ BUILD RL STATE
    # --------------------------------------------------
    current_features = student_df.iloc[-1]

    state = build_state(
        gru_output={"risk": gru_output["risk_level"]},
        student_features=current_features
    )

    # --------------------------------------------------
    # 3️⃣ RL DECISION
    # --------------------------------------------------
    action_id = rl_agent.choose_action(state)
    action_name = ACTIONS.get(action_id, "UNKNOWN")

    # --------------------------------------------------
    # 4️⃣ DISPLAY RESULTS (THIS IS YOUR OUTPUT)
    # --------------------------------------------------
    print("🔍 GRU OUTPUT (AUTHORITATIVE)")
    print("------------------------------")
    print(f"Risk Level           : {gru_output['risk_level']}")
    print(f"Reconstruction Error : {gru_output['reconstruction_error']:.6f}")
    print(f"Low Threshold (p50)  : {gru_output['cutoff_low']:.6f}")
    print(f"High Threshold (p75) : {gru_output['cutoff_high']:.6f}")

    print("\n🤖 RL DECISION")
    print("------------------------------")
    print(f"Recommended Action   : {action_name}\n")

    print("📌 CONTEXT USED BY RL")
    print("------------------------------")
    print(f"Days Since Last Login: {current_features['days_since_last_login']}")
    print(f"Alerts Sent          : {current_features['alerts_sent']}")
    print(f"Alerts Responded     : {current_features['alerts_responded']}")
    print(f"Engagement Score     : {current_features.get('engagement_score', 'N/A')}\n")

    print("✅ Simulation completed.\n")


# ======================================================
# CLI ENTRY
# ======================================================
if __name__ == "__main__":
    student_id = input("Enter student ID: ").strip()
    simulate_student(student_id)

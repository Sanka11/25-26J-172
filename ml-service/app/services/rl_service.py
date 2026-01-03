from app.rl.rl_inference import load_rl_agent


# Load agent once (important for performance)
_rl_agent = load_rl_agent()


def get_rl_decision(student_id: str, week: int, state: dict):
    """
    Wrapper around RL inference logic.
    """

    # Convert state dict → tuple (Q-table key)
    state_tuple = tuple(state.values())

    # Choose action using trained agent
    action = _rl_agent.choose_action(state_tuple)

    # Get Q-value for explanation
    q_value = _rl_agent.q_table.get((state_tuple, action), 0.0)

    return {
        "student_id": student_id,
        "week": week,
        "action": action,
        "q_value": float(q_value)
    }

import pickle
from app.rl.q_learning import QLearningAgent


# ======================================================
# CONFIG
# ======================================================
Q_TABLE_PATH = "app/rl/q_table.pkl"

STATE_SIZE = 5
ACTION_SIZE = 5


# ======================================================
# LOAD TRAINED RL AGENT
# ======================================================
def load_rl_agent():
    """
    Load trained Q-learning agent for inference.
    """

    agent = QLearningAgent(
        state_size=STATE_SIZE,
        action_size=ACTION_SIZE,
        alpha=0.0,     # no learning during inference
        gamma=0.9,
        epsilon=0.0    # pure exploitation
    )

    with open(Q_TABLE_PATH, "rb") as f:
        agent.q_table = pickle.load(f)

    return agent

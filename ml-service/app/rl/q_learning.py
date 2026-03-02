# import numpy as np
# import random
# from collections import defaultdict


# class QLearningAgent:
#     def __init__(
#         self,
#         state_size: int,
#         action_size: int,
#         alpha: float = 0.1,
#         gamma: float = 0.9,
#         epsilon: float = 0.3
#     ):
#         """
#         Q-Learning agent with discrete state encoding.

#         state_size  : number of state dimensions (for reference / clarity)
#         action_size : number of possible actions
#         """

#         self.state_size = state_size
#         self.action_size = action_size

#         self.alpha = alpha      # learning rate
#         self.gamma = gamma      # discount factor
#         self.epsilon = epsilon  # exploration rate

#         # Q-table: key = (state_tuple, action)
#         self.q_table = defaultdict(float)

#     # --------------------------------------------------
#     # Choose action (ε-greedy)
#     # --------------------------------------------------
#     def choose_action(self, state):
#         if random.random() < self.epsilon:
#             return random.randint(0, self.action_size - 1)

#         q_values = [
#             self.q_table[(tuple(state), a)]
#             for a in range(self.action_size)
#         ]

#         return int(np.argmax(q_values))

#     # --------------------------------------------------
#     # Update Q-value
#     # --------------------------------------------------
#     def update_q_value(self, state, action, reward, next_state):
#         state = tuple(state)
#         next_state = tuple(next_state)

#         best_next_q = max(
#             self.q_table[(next_state, a)]
#             for a in range(self.action_size)
#         )

#         current_q = self.q_table[(state, action)]

#         self.q_table[(state, action)] = current_q + self.alpha * (
#             reward + self.gamma * best_next_q - current_q
#         )

#     # --------------------------------------------------
#     # Decay exploration
#     # --------------------------------------------------
#     def decay_epsilon(self, decay=0.995, min_epsilon=0.05):
#         self.epsilon = max(min_epsilon, self.epsilon * decay)

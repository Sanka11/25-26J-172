# # ======================================================
# # RL REWARD FUNCTION (FINAL, CONSISTENT)
# # ======================================================

# ACTIONS = {
#     0: "DO_NOTHING",
#     1: "IN_APP_REMINDER",
#     2: "EMAIL_REMINDER",
#     3: "MOTIVATIONAL_MESSAGE",
#     4: "ESCALATE_PEER_CHEER"
# }


# def compute_reward(prev_state, action, new_state, prev_action=None):
#     """
#     prev_state  : tuple(state)
#     new_state   : tuple(state)
#     action      : current action id
#     prev_action : previous action id (for channel fatigue)
#     """

#     reward = 0

#     prev_risk, prev_academic, _, prev_alerts, prev_effective = prev_state
#     new_risk, new_academic, _, new_alerts, new_effective = new_state

#     action_name = ACTIONS[action]
#     prev_action_name = ACTIONS.get(prev_action) if prev_action is not None else None

#     # --------------------------------------------------
#     # 1️⃣ Risk reduction (primary goal)
#     # --------------------------------------------------
#     if new_risk < prev_risk:
#         reward += 12
#     elif new_risk > prev_risk:
#         reward -= 8

#     # --------------------------------------------------
#     # 2️⃣ Academic recovery
#     # --------------------------------------------------
#     if prev_academic == 1 and new_academic == 0:
#         reward += 10

#     # --------------------------------------------------
#     # 3️⃣ Alert effectiveness
#     # --------------------------------------------------
#     if new_effective == 1:
#         reward += 4

#     # --------------------------------------------------
#     # 4️⃣ No inaction at HIGH risk
#     # --------------------------------------------------
#     if prev_risk == 2 and action_name == "DO_NOTHING":
#         reward -= 15

#     # --------------------------------------------------
#     # 5️⃣ Channel fatigue (KEY)
#     # --------------------------------------------------
#     if prev_action_name == action_name:
#         reward -= 5

#     # --------------------------------------------------
#     # 6️⃣ Email overuse penalty
#     # --------------------------------------------------
#     if action_name == "EMAIL_REMINDER" and prev_alerts >= 2:
#         reward -= 4

#     # --------------------------------------------------
#     # 7️⃣ Escalation reward
#     # --------------------------------------------------
#     if (
#         prev_risk == 2
#         and prev_alerts >= 2
#         and prev_effective == 0
#         and action_name == "ESCALATE_PEER_CHEER"
#     ):
#         reward += 8

#     # --------------------------------------------------
#     # 8️⃣ Alert fatigue hard limit
#     # --------------------------------------------------
#     if new_alerts > 4:
#         reward -= 6

#     return reward

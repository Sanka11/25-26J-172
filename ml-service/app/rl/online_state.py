# def build_online_state(gru_output, student_features):
#     """
#     gru_output: { 'risk_level': 'HIGH' | 'LOW' }
#     student_features: live LMS data
#     """

#     risk = gru_output["risk_level"]

#     days = student_features.get("days_since_last_login", 0)
#     alerts_sent = student_features.get("alerts_sent", 0)
#     alerts_responded = student_features.get("alerts_responded", 0)

#     days_bucket = min(days // 3, 3)
#     alerts_bucket = min(alerts_sent, 2)
#     responded_flag = 1 if alerts_responded > 0 else 0

#     return (risk, days_bucket, alerts_bucket, responded_flag)

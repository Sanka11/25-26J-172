from app.schemas.recommendation_schemas import RecommendationRequest


def generate_recommendations(data: RecommendationRequest) -> list[str]:
    recommendations = []

    if data.gpa < 2.5:
        recommendations.append("Consider attending tutoring to improve GPA.")
    if data.attendance_rate < 75:
        recommendations.append("Attend more classes to stay on track.")
    if data.stress_level > 6:
        recommendations.append("Try stress-relief activities or counseling.")
    if data.assignments_pending > 3:
        recommendations.append("Complete pending assignments to avoid backlog.")

    if len(recommendations) == 0:
        recommendations.append("Great work! Continue your progress.")

    return recommendations


# import joblib
# import numpy as np
# from collections import defaultdict

# MODEL_PATH = "app/models/db_struggle_model.pkl"

# model = joblib.load(MODEL_PATH)

# def calculate_level(avg_score: float) -> str:
#     if avg_score < 0.3:
#         return "Beginner"
#     elif avg_score < 0.6:
#         return "Intermediate"
#     else:
#         return "Advanced"

# def predict_struggle(data):
#     lesson_scores = defaultdict(list)

#     for attempt in data.attempts:
#         X = [[
#             attempt.correct,
#             attempt.hint_count,
#             attempt.ms_first_response,
#             attempt.overlap_time
#         ]]

#         score = float(model.predict(X)[0])
#         score = max(0.0, min(score, 1.0))

#         lesson_scores[attempt.skill].append(score)

#     results = []

#     for lesson, scores in lesson_scores.items():
#         avg_score = sum(scores) / len(scores)

#         results.append({
#             "lesson": lesson,
#             "average_struggle_score": round(avg_score, 3),
#             "level": calculate_level(avg_score)
#         })

#     return results
import joblib
from collections import defaultdict
from pathlib import Path


_BASE_DIR = Path(__file__).resolve().parent.parent
_MODEL_PATH = _BASE_DIR / "models" / "gb_struggle_model.pkl"

model = joblib.load(_MODEL_PATH)

def predict_struggle(data):
    question_scores = []
    lesson_map = defaultdict(list)
    total = 0.0

    for a in data.attempts:
        X = [[
            a.correct,
            a.hint_count,
            a.ms_first_response,
            a.overlap_time
        ]]

        score = float(model.predict(X)[0])
        score = max(0.0, min(score, 1.0))

        question_scores.append({
            "question_id": a.question_id,
            "lesson": a.skill,
            "struggle_score": round(score, 4)
        })

        lesson_map[a.skill].append(score)
        total += score

    quiz_avg = total / len(question_scores)

    lesson_averages = [
        {
            "lesson": lesson,
            "average_struggle_score": round(sum(scores) / len(scores), 4)
        }
        for lesson, scores in lesson_map.items()
    ]

    return {
        "quiz_average_struggle_score": round(quiz_avg, 4),
        "question_struggles": question_scores,
        "lesson_struggles": lesson_averages
    }


def predict_struggling_skills(data):
    """Compatibility wrapper used by older /predictStruggle endpoint.

    Accepts the same StruggleRequest-style object as predict_struggle
    and returns the full response payload including user_id.
    """
    return {
        "user_id": data.user_id,
        **predict_struggle(data),
    }

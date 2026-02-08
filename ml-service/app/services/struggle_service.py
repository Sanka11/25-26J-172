import joblib
from collections import defaultdict

# Load the trained struggle model from the models folder
model = joblib.load("app/models/db_struggle_model.pkl")

def predict_struggle(data):
    lesson_map = defaultdict(list)

    # 1️⃣ Build batch input
    X = []
    meta = []  # keep question_id & lesson

    for a in data.attempts:
        X.append([
            a.correct,
            a.hint_count,
            a.ms_first_response,
            a.overlap_time
        ])
        meta.append((a.question_id, a.skill))

    # 2️⃣ ONE model call instead of many
    predictions = model.predict(X)

    question_scores = []
    total = 0.0

    # 3️⃣ Process predictions
    for (question_id, lesson), score in zip(meta, predictions):
        score = float(max(0.0, min(score, 1.0)))

        question_scores.append({
            "question_id": question_id,
            "lesson": lesson,
            "struggle_score": round(score, 4)
        })

        lesson_map[lesson].append(score)
        total += score

    quiz_avg = total / len(predictions)

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

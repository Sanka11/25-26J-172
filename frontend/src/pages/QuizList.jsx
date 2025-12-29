import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getQuizzes } from "../services/api/quizApi";

export default function QuizList() {
  const [quizzes, setQuizzes] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    async function loadQuizzes() {
      const data = await getQuizzes();
      setQuizzes(data);
    }
    loadQuizzes();
  }, []);

  return (
    <div style={{ padding: 20 }}>
      <h2>📘 Available Quizzes</h2>

      {quizzes.length === 0 && <p>No quizzes available</p>}

      {quizzes.map((q) => (
        <div
          key={q.quiz_id}
          style={{
            border: "1px solid #ccc",
            padding: 12,
            marginTop: 10,
          }}
        >
          <p>
            <strong>Level {q.level}</strong>
          </p>
          <p>Total Questions: {q.question_count}</p>

          <button
            onClick={() => navigate(`/quiz/${q.level}`)}
            style={{ marginTop: 6 }}
          >
            Attempt Quiz
          </button>
        </div>
      ))}
    </div>
  );
}

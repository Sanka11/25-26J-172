import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getQuizzes } from "../services/api/quizApi";

export default function QuizList() {
  const [quizzes, setQuizzes] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    async function loadQuizzes() {
      try {
        const data = await getQuizzes();
        setQuizzes(data);
      } catch (err) {
        alert("Failed to load quizzes");
      }
    }

    loadQuizzes();
  }, []);

  return (
    <div className="p-6">
      <h2 className="text-xl font-bold">Available Quizzes</h2>

      {quizzes.length === 0 && <p>No quizzes available</p>}

      {quizzes.map((q) => (
        <div key={q.id} className="border p-3 mt-2">
          <p className="font-semibold">{q.title}</p>
          <p className="text-sm text-gray-600">Skill: {q.skill_name}</p>

          <button
            onClick={() => navigate(`/quiz/${q.id}`)}
            className="mt-2 bg-blue-600 text-white px-3 py-1"
          >
            Attempt
          </button>
        </div>
      ))}
    </div>
  );
}

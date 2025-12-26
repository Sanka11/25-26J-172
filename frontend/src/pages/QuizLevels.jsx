import { useEffect, useState } from "react";
import { getQuizzes } from "../services/api/quizApi";
import { getUserLevel } from "../services/api/levelApi";
import { useNavigate } from "react-router-dom";

export default function QuizLevels() {
  const userId = 70063;
  const [quizzes, setQuizzes] = useState([]);
  const [currentLevel, setCurrentLevel] = useState(1);
  const navigate = useNavigate();

  useEffect(() => {
    async function loadData() {
      const quizData = await getQuizzes();
      const levelData = await getUserLevel(userId);

      setQuizzes(quizData);
      setCurrentLevel(levelData.current_level);
    }

    loadData();
  }, []);

  return (
    <div className="p-6 max-w-2xl">
      <h2 className="text-2xl font-bold mb-4">Game Levels</h2>

      {quizzes.map((quiz, index) => {
        const level = index + 1;

        const isCompleted = level < currentLevel;
        const isPlayable = level === currentLevel;
        const isLocked = level > currentLevel;

        return (
          <div
            key={quiz.id}
            className={`p-4 mb-3 border rounded flex justify-between items-center
              ${isLocked ? "opacity-50" : ""}
            `}
          >
            <div>
              <h3 className="font-semibold">
                Level {level}: {quiz.title}
              </h3>

              {isCompleted && (
                <span className="text-green-600">✔ Completed</span>
              )}

              {isPlayable && (
                <span className="text-blue-600">▶ Ready to play</span>
              )}

              {isLocked && <span className="text-gray-500">🔒 Locked</span>}
            </div>

            <button
              disabled={isLocked}
              onClick={() => navigate(`/quiz/${quiz.id}`)}
              className={`px-4 py-2 rounded text-white
                ${isPlayable ? "bg-blue-600" : "bg-gray-400"}
              `}
            >
              Play
            </button>
          </div>
        );
      })}
    </div>
  );
}

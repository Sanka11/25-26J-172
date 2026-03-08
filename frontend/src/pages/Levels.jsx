import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { getQuizzes, fetchQuizByUser } from "../services/api/quizApi";

export default function Levels({ userId = "student_002" }) {
  const navigate = useNavigate();

  const [quizzes, setQuizzes] = useState([]);
  const [userLevel, setUserLevel] = useState(1);
  const [completedLevels, setCompletedLevels] = useState([]);
  const [quizScores, setQuizScores] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const allQuizzes = await getQuizzes();
        setQuizzes(allQuizzes);

        const userProgress = await fetchQuizByUser(userId);
        setUserLevel(userProgress.current_level);
        setCompletedLevels(userProgress.completed_levels || []);
        setQuizScores(userProgress.quiz_scores || {});
      } catch (err) {
        console.error(err);
        setError("Failed to load levels");
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [userId]);

  const groupQuizzesByLevel = (quizList) => {
    const grouped = {};
    quizList.forEach((q) => {
      if (!grouped[q.level]) grouped[q.level] = [];
      grouped[q.level].push(q);
    });
    return grouped;
  };

  const groupedQuizzes = groupQuizzesByLevel(quizzes);
  const availableLevels = Object.keys(groupedQuizzes)
    .map(Number)
    .sort((a, b) => a - b);

  const getLevelStatus = (level) => {
    if (level < userLevel) return "completed";
    if (level === userLevel) return "current";
    return "locked";
  };

  const getCompletedQuizzesCount = (level) => {
    const levelQuizzes = groupedQuizzes[level] || [];
    return levelQuizzes.filter((quiz) => quizScores[quiz.id]).length;
  };

  const handleLevelClick = (level) => {
    const status = getLevelStatus(level);
    if (status === "locked") return;
    navigate(`/quiz/${level}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-gray-300 border-t-blue-500 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading levels...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-red-500 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2">
            Learning Levels
          </h1>
          <p className="text-gray-600 mb-6">
            Progress through each level to unlock the next
          </p>

          {/* Progress Summary */}
          <div className="inline-flex items-center bg-white rounded-lg px-6 py-3 shadow-sm border border-gray-200">
            <div className="text-center px-4">
              <div className="text-sm text-gray-500">Current Level</div>
              <div className="text-2xl font-bold text-red-600">{userLevel}</div>
            </div>
            <div className="h-10 w-px bg-gray-300 mx-4"></div>
            <div className="text-center px-4">
              <div className="text-sm text-gray-500">Completed</div>
              <div className="text-2xl font-bold text-green-600">
                {userLevel - 1}/{availableLevels.length}
              </div>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-10">
          <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-green-400 to-blue-500 transition-all duration-1000 ease-out"
              style={{
                width: `${(userLevel / availableLevels.length) * 100}%`,
              }}
            ></div>
          </div>
          <div className="flex justify-between mt-1 text-xs text-gray-500">
            <span>Start</span>
            <span className="font-medium">
              Level {userLevel} of {availableLevels.length}
            </span>
            <span>End</span>
          </div>
        </div>

        {/* Levels List */}
        <div className="space-y-4">
          {availableLevels.map((level) => {
            const status = getLevelStatus(level);
            const isCompleted = status === "completed";
            const isCurrent = status === "current";
            const isLocked = status === "locked";

            const levelQuizzes = groupedQuizzes[level] || [];
            const quizCount = levelQuizzes.length;
            const completedCount = getCompletedQuizzesCount(level);
            const totalQuestions = levelQuizzes.reduce(
              (sum, q) => sum + (q.question_count || 0),
              0,
            );

            return (
              <div
                key={level}
                className={`relative transition-all duration-200 ${
                  isCompleted ? "opacity-75" : ""
                }`}
              >
                {/* Card */}
                <div
                  onClick={() =>
                    !isLocked && !isCompleted && handleLevelClick(level)
                  }
                  className={`
                    bg-white rounded-lg border p-5
                    ${isCompleted ? "border-gray-300" : ""}
                    ${
                      isCurrent ? "border-red-400 shadow-sm" : "border-gray-200"
                    }
                    ${isLocked ? "border-gray-200 opacity-50" : ""}
                    ${
                      !isCompleted && !isCurrent && !isLocked
                        ? "cursor-pointer hover:border-blue-300 hover:shadow"
                        : ""
                    }
                    ${isCompleted ? "cursor-default" : ""}
                  `}
                >
                  <div className="flex items-start justify-between">
                    {/* Left side - Level info */}
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div
                          className={`
                          w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold
                          ${isCompleted ? "bg-gray-100 text-gray-400" : ""}
                          ${isCurrent ? "bg-red-100 text-red-600" : ""}
                          ${isLocked ? "bg-gray-100 text-gray-400" : ""}
                          ${
                            !isCompleted && !isCurrent && !isLocked
                              ? "bg-blue-100 text-blue-600"
                              : ""
                          }
                        `}
                        >
                          {level}
                        </div>

                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-gray-800">
                              Level {level}
                            </h3>
                            {isCompleted && (
                              <span className="text-xs bg-green-100 text-green-600 px-2 py-0.5 rounded">
                                Completed
                              </span>
                            )}
                            {isCurrent && (
                              <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded animate-pulse">
                                Current
                              </span>
                            )}
                          </div>

                          {/* Quiz progress */}
                          <div className="text-sm text-gray-600 mt-1">
                            {quizCount} quiz{quizCount !== 1 ? "zes" : ""} •{" "}
                            {totalQuestions} questions
                            {isCurrent && completedCount > 0 && (
                              <span className="ml-2 text-blue-600 font-medium">
                                ({completedCount}/{quizCount} done)
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Progress bar for current level */}
                      {isCurrent && quizCount > 0 && (
                        <div className="mt-3">
                          <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-green-400 to-blue-400 transition-all duration-500"
                              style={{
                                width: `${(completedCount / quizCount) * 100}%`,
                              }}
                            ></div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Right side - Action button */}
                    <div className="ml-4">
                      <button
                        disabled={isLocked || isCompleted}
                        className={`
                          px-4 py-2 rounded-md text-sm font-medium whitespace-nowrap
                          transition-colors duration-200
                          ${
                            isCompleted
                              ? "bg-gray-100 text-gray-400 cursor-default"
                              : ""
                          }
                          ${
                            isCurrent
                              ? "bg-red-600 text-white hover:bg-red-700"
                              : ""
                          }
                          ${
                            isLocked
                              ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                              : ""
                          }
                          ${
                            !isCompleted && !isCurrent && !isLocked
                              ? "bg-blue-600 text-white hover:bg-blue-700"
                              : ""
                          }
                        `}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (!isLocked && !isCompleted) {
                            handleLevelClick(level);
                          }
                        }}
                      >
                        {isCompleted
                          ? "Completed"
                          : isCurrent
                            ? `Continue (${completedCount}/${quizCount})`
                            : isLocked
                              ? "Locked"
                              : "Start"}
                      </button>
                    </div>
                  </div>

                  {/* Locked message */}
                  {isLocked && (
                    <div className="mt-3 text-sm text-gray-400 flex items-center gap-1">
                      <span className="text-xs">🔒</span>
                      Complete Level {level - 1} to unlock
                    </div>
                  )}
                </div>

                {/* Current level indicator */}
                {isCurrent && (
                  <div className="absolute -left-3 top-1/2 transform -translate-y-1/2">
                    <div className="w-2 h-2 bg-red-500 rounded-full animate-ping"></div>
                    <div className="w-2 h-2 bg-red-500 rounded-full absolute top-0 left-0"></div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="mt-12 pt-8 border-t border-gray-200">
          <div className="grid grid-cols-3 gap-4 max-w-sm mx-auto">
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                <span className="text-xs text-gray-600">Locked</span>
              </div>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-1">
                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                <span className="text-xs text-gray-600">Current</span>
              </div>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-1">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-xs text-gray-600">Completed</span>
              </div>
            </div>
          </div>
        </div>

        {/* Info */}
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500">
            Complete all quizzes in a level to progress to the next one
          </p>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .space-y-4 > div {
          animation: fadeIn 0.3s ease-out forwards;
          opacity: 0;
        }

        .space-y-4 > div:nth-child(1) {
          animation-delay: 0.05s;
        }
        .space-y-4 > div:nth-child(2) {
          animation-delay: 0.1s;
        }
        .space-y-4 > div:nth-child(3) {
          animation-delay: 0.15s;
        }
        .space-y-4 > div:nth-child(4) {
          animation-delay: 0.2s;
        }
        .space-y-4 > div:nth-child(5) {
          animation-delay: 0.25s;
        }
        .space-y-4 > div:nth-child(6) {
          animation-delay: 0.3s;
        }
      `}</style>
    </div>
  );
}

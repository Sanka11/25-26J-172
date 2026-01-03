// import { useEffect, useState } from "react";
// import { getQuizzes } from "../services/api/quizApi";
// import { getUserLevel } from "../services/api/levelApi";
// import { useNavigate } from "react-router-dom";

// export default function QuizLevels() {
//   const userId = 70063;
//   const [quizzes, setQuizzes] = useState([]);
//   const [currentLevel, setCurrentLevel] = useState(1);
//   const navigate = useNavigate();

//   useEffect(() => {
//     async function loadData() {
//       const quizData = await getQuizzes();
//       const levelData = await getUserLevel(userId);

//       setQuizzes(quizData);
//       setCurrentLevel(levelData.current_level);
//     }

//     loadData();
//   }, []);

//   return (
//     <div className="p-6 max-w-2xl">
//       <h2 className="text-2xl font-bold mb-4">Game Levels</h2>

//       {quizzes.map((quiz, index) => {
//         const level = index + 1;

//         const isCompleted = level < currentLevel;
//         const isPlayable = level === currentLevel;
//         const isLocked = level > currentLevel;

//         return (
//           <div
//             key={quiz.id}
//             className={`p-4 mb-3 border rounded flex justify-between items-center
//               ${isLocked ? "opacity-50" : ""}
//             `}
//           >
//             <div>
//               <h3 className="font-semibold">
//                 Level {level}: {quiz.title}
//               </h3>

//               {isCompleted && (
//                 <span className="text-green-600">✔ Completed</span>
//               )}

//               {isPlayable && (
//                 <span className="text-blue-600">▶ Ready to play</span>
//               )}

//               {isLocked && <span className="text-gray-500">🔒 Locked</span>}
//             </div>

//             <button
//               disabled={isLocked}
//               onClick={() => navigate(`/quiz/${quiz.id}`)}
//               className={`px-4 py-2 rounded text-white
//                 ${isPlayable ? "bg-blue-600" : "bg-gray-400"}
//               `}
//             >
//               Play
//             </button>
//           </div>
//         );
//       })}
//     </div>
//   );
// }
import { useEffect, useState } from "react";
import { getQuizzes } from "../services/api/quizApi";
import { getUserLevel } from "../services/api/levelApi";
import { useNavigate } from "react-router-dom";
import { Lock, Play, CheckCircle, Star, Trophy, Zap } from "lucide-react";

export default function QuizLevels() {
  const userId = 70063;
  const [quizzes, setQuizzes] = useState([]);
  const [currentLevel, setCurrentLevel] = useState(1);
  const [previousLevel, setPreviousLevel] = useState(1);
  const [isMoving, setIsMoving] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    async function loadData() {
      const quizData = await getQuizzes();
      const levelData = await getUserLevel(userId);

      setQuizzes(quizData);

      if (levelData.current_level !== currentLevel) {
        setIsMoving(true);
        setPreviousLevel(currentLevel);
        setTimeout(() => {
          setCurrentLevel(levelData.current_level);
          setTimeout(() => setIsMoving(false), 600);
        }, 100);
      } else {
        setCurrentLevel(levelData.current_level);
      }
    }

    loadData();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-white px-6 py-3 rounded-full shadow-lg mb-4">
            <Trophy className="w-6 h-6 text-yellow-500" />
            <span className="text-lg font-bold text-gray-800">
              Level {currentLevel} of {quizzes.length}
            </span>
          </div>
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            Your Learning Journey
          </h1>
          <p className="text-gray-600">
            Complete each level to unlock the next challenge!
          </p>
        </div>

        <div className="relative">
          {quizzes.map((quiz, index) => {
            const level = index + 1;
            const isCompleted = level < currentLevel;
            const isPlayable = level === currentLevel;
            const isLocked = level > currentLevel;

            const isEven = index % 2 === 0;

            return (
              <div
                key={quiz.id}
                className={`relative mb-8 ${
                  isEven ? "md:ml-0" : "md:ml-auto"
                } md:w-[calc(50%-2rem)]`}
              >
                {index < quizzes.length - 1 && (
                  <div
                    className={`hidden md:block absolute top-full left-1/2 w-1 h-8 -translate-x-1/2 ${
                      isCompleted ? "bg-green-400" : "bg-gray-300"
                    }`}
                  />
                )}

                <div
                  className={`relative bg-white rounded-2xl shadow-lg overflow-visible transition-all duration-300 ${
                    isPlayable ? "ring-2 ring-blue-400 shadow-2xl" : ""
                  } ${
                    isLocked
                      ? "opacity-60"
                      : "hover:shadow-2xl hover:scale-105 cursor-pointer"
                  }`}
                  onClick={() => !isLocked && navigate(`/quiz/${quiz.id}`)}
                >
                  {isPlayable && (
                    <div
                      className={`absolute -top-6 -left-4 text-5xl transition-all duration-700 ${
                        isMoving && previousLevel < level
                          ? "animate-walk-right"
                          : isMoving && previousLevel > level
                          ? "animate-walk-left"
                          : ""
                      }`}
                      style={{
                        animation: isMoving
                          ? previousLevel < level
                            ? "walkRight 0.6s ease-in-out forwards"
                            : "walkLeft 0.6s ease-in-out forwards"
                          : "bounce 2s infinite",
                      }}
                    >
                      👨‍🎓
                    </div>
                  )}
                  <div
                    className={`absolute inset-0 ${
                      isCompleted
                        ? "bg-gradient-to-br from-green-400 to-green-600"
                        : isPlayable
                        ? "bg-gradient-to-br from-blue-400 to-blue-600"
                        : "bg-gradient-to-br from-gray-300 to-gray-400"
                    } opacity-10`}
                  />

                  <div className="relative p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span
                            className={`inline-flex items-center justify-center w-8 h-8 rounded-full font-bold text-white text-sm ${
                              isCompleted
                                ? "bg-green-500"
                                : isPlayable
                                ? "bg-blue-500"
                                : "bg-gray-400"
                            }`}
                          >
                            {level}
                          </span>
                          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                            Level {level}
                          </span>
                        </div>
                        <h3 className="text-xl font-bold text-gray-800 mb-2">
                          {quiz.title}
                        </h3>
                        {quiz.description && (
                          <p className="text-sm text-gray-600">
                            {quiz.description}
                          </p>
                        )}
                      </div>

                      <div
                        className={`flex-shrink-0 ml-4 w-16 h-16 rounded-full flex items-center justify-center ${
                          isCompleted
                            ? "bg-green-100"
                            : isPlayable
                            ? "bg-blue-100"
                            : "bg-gray-100"
                        }`}
                      >
                        {isCompleted && (
                          <CheckCircle className="w-8 h-8 text-green-600" />
                        )}
                        {isPlayable && (
                          <Zap className="w-8 h-8 text-blue-600 animate-pulse" />
                        )}
                        {isLocked && <Lock className="w-8 h-8 text-gray-400" />}
                      </div>
                    </div>

                    <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
                      <div className="flex items-center gap-4 text-sm">
                        {isCompleted && (
                          <span className="flex items-center gap-1 text-green-600 font-semibold">
                            <CheckCircle className="w-4 h-4" />
                            Completed
                          </span>
                        )}
                        {isPlayable && (
                          <span className="flex items-center gap-1 text-blue-600 font-semibold animate-pulse">
                            <Star className="w-4 h-4" />
                            Ready to Play
                          </span>
                        )}
                        {isLocked && (
                          <span className="flex items-center gap-1 text-gray-500 font-semibold">
                            <Lock className="w-4 h-4" />
                            Locked
                          </span>
                        )}
                      </div>

                      <button
                        disabled={isLocked}
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/quiz/${quiz.id}`);
                        }}
                        className={`flex items-center gap-2 px-6 py-2 rounded-full font-semibold transition-all duration-200 ${
                          isLocked
                            ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                            : isPlayable
                            ? "bg-blue-600 text-white hover:bg-blue-700 shadow-lg hover:shadow-xl"
                            : "bg-green-600 text-white hover:bg-green-700 shadow-lg hover:shadow-xl"
                        }`}
                      >
                        <Play className="w-4 h-4" />
                        {isCompleted ? "Replay" : "Play"}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {quizzes.length > 0 && currentLevel > quizzes.length && (
          <div className="text-center mt-12 p-8 bg-gradient-to-r from-yellow-100 to-orange-100 rounded-2xl shadow-lg">
            <Trophy className="w-16 h-16 text-yellow-600 mx-auto mb-4" />
            <h2 className="text-3xl font-bold text-gray-800 mb-2">
              Congratulations!
            </h2>
            <p className="text-gray-600">
              You've completed all available levels!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

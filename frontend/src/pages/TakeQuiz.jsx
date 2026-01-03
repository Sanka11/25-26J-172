// import { useEffect, useState } from "react";
// import { useParams, useNavigate } from "react-router-dom";
// import { getQuizById, submitQuiz } from "../services/api/quizApi";
// import { predictStruggle } from "../services/api/struggleApi";
// import { checkLevelUnlock } from "../services/api/levelApi";

// export default function TakeQuiz() {
//   const { id } = useParams();
//   const navigate = useNavigate();

//   const USER_ID = 70063; // later replace with auth user

//   const [quiz, setQuiz] = useState(null);
//   const [answers, setAnswers] = useState([]);

//   // ⏱ Time tracking
//   const [quizStartTime] = useState(Date.now());
//   const [firstAnswerTime, setFirstAnswerTime] = useState(null);
//   const [elapsedTime, setElapsedTime] = useState(0);

//   // 💡 Hint tracking
//   const [hintCount, setHintCount] = useState(0);
//   const [activeHint, setActiveHint] = useState(null);

//   /* ======================
//      Load Quiz
//   ====================== */
//   useEffect(() => {
//     getQuizById(id).then((data) => {
//       setQuiz(data);
//       setAnswers(new Array(data.questions.length).fill(null));
//     });
//   }, [id]);

//   /* ======================
//      Timer
//   ====================== */
//   useEffect(() => {
//     const timer = setInterval(() => {
//       setElapsedTime(Math.floor((Date.now() - quizStartTime) / 1000));
//     }, 1000);

//     return () => clearInterval(timer);
//   }, [quizStartTime]);

//   /* ======================
//      Answer selection
//   ====================== */
//   const selectAnswer = (qIndex, optionIndex) => {
//     if (!firstAnswerTime) {
//       setFirstAnswerTime(Date.now());
//     }

//     const updated = [...answers];
//     updated[qIndex] = optionIndex;
//     setAnswers(updated);
//   };

//   /* ======================
//      Hint handler
//   ====================== */
//   const showHint = (qIndex) => {
//     setHintCount((prev) => prev + 1);
//     setActiveHint(qIndex);
//   };

//   /* ======================
//      Submit Quiz
//   ====================== */
//   const handleSubmit = async () => {
//     if (answers.includes(null)) {
//       alert("Please answer all questions");
//       return;
//     }

//     let correctCount = 0;
//     quiz.questions.forEach((q, i) => {
//       if (answers[i] === q.correct) correctCount++;
//     });

//     const total = quiz.questions.length;

//     const ms_first_response = firstAnswerTime
//       ? firstAnswerTime - quizStartTime
//       : 0;

//     const overlap_time = Date.now() - quizStartTime;

//     try {
//       /* 1️⃣ Save quiz attempt */
//       await submitQuiz({
//         user_id: USER_ID,
//         quiz_id: quiz.id,
//         skill_name: quiz.skill_name,
//         answers,
//         score: correctCount,
//         total,
//         hint_count: hintCount,
//         ms_first_response,
//         overlap_time,
//       });

//       /* 2️⃣ Call ML struggle prediction (MODEL FEATURES ONLY) */
//       const struggleResult = await predictStruggle({
//         user_id: USER_ID,
//         skills: [
//           {
//             skill_name: quiz.skill_name,
//             correct: correctCount / total,
//             hint_count: hintCount,
//             ms_first_response,
//             overlap_time,
//             opportunity: total,
//           },
//         ],
//       });

//       if (!struggleResult || !Array.isArray(struggleResult.struggling_skills)) {
//         alert("Struggle analysis failed. Please retry.");
//         return;
//       }

//       /* 3️⃣ Level unlock logic */
//       const hasHighStruggle = struggleResult.struggling_skills.some(
//         (s) => s.level === "High"
//       );

//       if (hasHighStruggle) {
//         alert("⚠️ You are still struggling. Try this level again.");
//         return;
//       }

//       await checkLevelUnlock({
//         user_id: USER_ID,
//         skill_name: quiz.skill_name,
//       });

//       alert("🎉 Level completed! Next level unlocked.");
//       navigate("/levels");
//     } catch (error) {
//       console.error("Quiz submit error:", error);
//       alert("Something went wrong. Please try again.");
//     }
//   };

//   if (!quiz) return <p>Loading quiz...</p>;

//   /* ======================
//      UI
//   ====================== */
//   return (
//     <div className="p-6 max-w-3xl">
//       <div className="flex justify-between mb-4">
//         <h2 className="text-2xl font-bold">{quiz.title}</h2>
//         <div className="text-sm font-semibold">⏱ {elapsedTime}s</div>
//       </div>

//       {quiz.questions.map((q, qIndex) => (
//         <div key={qIndex} className="border p-4 mb-4 rounded">
//           <p className="font-semibold mb-2">{q.question}</p>

//           {q.options.map((opt, oIndex) => (
//             <label key={oIndex} className="block mt-2">
//               <input
//                 type="radio"
//                 name={`q-${qIndex}`}
//                 checked={answers[qIndex] === oIndex}
//                 onChange={() => selectAnswer(qIndex, oIndex)}
//               />
//               <span className="ml-2">{opt}</span>
//             </label>
//           ))}

//           {/* 💡 Hint */}
//           {q.hint && (
//             <div className="mt-3">
//               <button
//                 onClick={() => showHint(qIndex)}
//                 className="text-sm text-blue-600 underline"
//               >
//                 Show Hint
//               </button>

//               {activeHint === qIndex && (
//                 <p className="mt-2 text-sm text-gray-600">💡 Hint: {q.hint}</p>
//               )}
//             </div>
//           )}
//         </div>
//       ))}

//       <button
//         onClick={handleSubmit}
//         className="bg-green-600 text-white px-4 py-2 rounded"
//       >
//         Submit Quiz
//       </button>
//     </div>
//   );
// }
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getQuizById, submitQuiz } from "../services/api/quizApi";
import { predictStruggle } from "../services/api/struggleApi";
import { checkLevelUnlock } from "../services/api/levelApi";
import {
  Clock,
  Lightbulb,
  CheckCircle,
  AlertCircle,
  ArrowRight,
  Volume2,
} from "lucide-react";

export default function TakeQuiz() {
  const { id } = useParams();
  const navigate = useNavigate();

  const USER_ID = 70063;

  const [quiz, setQuiz] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [loading, setLoading] = useState(false);

  const [quizStartTime] = useState(Date.now());
  const [firstAnswerTime, setFirstAnswerTime] = useState(null);
  const [elapsedTime, setElapsedTime] = useState(0);

  const [hintCount, setHintCount] = useState(0);
  const [activeHint, setActiveHint] = useState(null);

  useEffect(() => {
    getQuizById(id).then((data) => {
      setQuiz(data);
      setAnswers(new Array(data.questions.length).fill(null));
    });
  }, [id]);

  useEffect(() => {
    const timer = setInterval(() => {
      setElapsedTime(Math.floor((Date.now() - quizStartTime) / 1000));
    }, 1000);

    return () => clearInterval(timer);
  }, [quizStartTime]);

  const selectAnswer = (qIndex, optionIndex) => {
    if (!firstAnswerTime) {
      setFirstAnswerTime(Date.now());
    }

    const updated = [...answers];
    updated[qIndex] = optionIndex;
    setAnswers(updated);
  };

  const showHint = (qIndex) => {
    setHintCount((prev) => prev + 1);
    setActiveHint(activeHint === qIndex ? null : qIndex);
  };

  const handleSubmit = async () => {
    if (answers.includes(null)) {
      alert("Please answer all questions");
      return;
    }

    setLoading(true);

    let correctCount = 0;
    quiz.questions.forEach((q, i) => {
      if (answers[i] === q.correct) correctCount++;
    });

    const total = quiz.questions.length;
    const ms_first_response = firstAnswerTime
      ? firstAnswerTime - quizStartTime
      : 0;
    const overlap_time = Date.now() - quizStartTime;

    try {
      await submitQuiz({
        user_id: USER_ID,
        quiz_id: quiz.id,
        skill_name: quiz.skill_name,
        answers,
        score: correctCount,
        total,
        hint_count: hintCount,
        ms_first_response,
        overlap_time,
      });

      const struggleResult = await predictStruggle({
        user_id: USER_ID,
        skills: [
          {
            skill_name: quiz.skill_name,
            correct: correctCount / total,
            hint_count: hintCount,
            ms_first_response,
            overlap_time,
            opportunity: total,
          },
        ],
      });

      if (!struggleResult || !Array.isArray(struggleResult.struggling_skills)) {
        alert("Struggle analysis failed. Please retry.");
        setLoading(false);
        return;
      }

      const hasHighStruggle = struggleResult.struggling_skills.some(
        (s) => s.level === "High"
      );

      if (hasHighStruggle) {
        alert("You are still struggling. Try this level again.");
        setLoading(false);
        return;
      }

      await checkLevelUnlock({
        user_id: USER_ID,
        skill_name: quiz.skill_name,
      });

      alert("Level completed! Next level unlocked.");
      navigate("/levels");
    } catch (error) {
      console.error("Quiz submit error:", error);
      alert("Something went wrong. Please try again.");
      setLoading(false);
    }
  };

  if (!quiz) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block">
            <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-4"></div>
          </div>
          <p className="text-gray-600 font-semibold">Loading quiz...</p>
        </div>
      </div>
    );
  }

  const totalQuestions = quiz.questions.length;
  const answeredCount = answers.filter((a) => a !== null).length;
  const progressPercent = (answeredCount / totalQuestions) * 100;

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 py-8 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => navigate("/levels")}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 font-semibold transition"
            >
              ← Back
            </button>
            <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-full shadow-md">
              <Clock className="w-5 h-5 text-blue-600" />
              <span className="font-semibold text-gray-800">
                {formatTime(elapsedTime)}
              </span>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">
              {quiz.title}
            </h1>
            <p className="text-gray-600 mb-6">{quiz.description}</p>

            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-semibold text-gray-600">
                Progress: {answeredCount} of {totalQuestions} answered
              </span>
              <span className="text-sm font-bold text-blue-600">
                {Math.round(progressPercent)}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
              <div
                className="bg-gradient-to-r from-blue-500 to-green-500 h-full transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {quiz.questions.map((q, qIndex) => (
            <div
              key={qIndex}
              className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300"
            >
              <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-4">
                <div className="flex items-center gap-3">
                  <span className="w-8 h-8 bg-white text-blue-600 rounded-full flex items-center justify-center font-bold">
                    {qIndex + 1}
                  </span>
                  <h3 className="text-lg font-bold text-white flex-1">
                    {q.question}
                  </h3>
                  {answers[qIndex] !== null && (
                    <CheckCircle className="w-6 h-6 text-green-300" />
                  )}
                </div>
              </div>

              <div className="p-6">
                <div className="space-y-3">
                  {q.options.map((opt, oIndex) => (
                    <label
                      key={oIndex}
                      className={`flex items-center p-4 rounded-lg border-2 cursor-pointer transition-all duration-200 ${
                        answers[qIndex] === oIndex
                          ? "border-blue-500 bg-blue-50"
                          : "border-gray-200 bg-gray-50 hover:border-blue-300 hover:bg-blue-50"
                      }`}
                    >
                      <input
                        type="radio"
                        name={`q-${qIndex}`}
                        checked={answers[qIndex] === oIndex}
                        onChange={() => selectAnswer(qIndex, oIndex)}
                        className="w-5 h-5 text-blue-600 cursor-pointer"
                      />
                      <span className="ml-4 text-gray-800 font-medium">
                        {opt}
                      </span>
                    </label>
                  ))}
                </div>

                {q.hint && (
                  <div className="mt-6 pt-6 border-t border-gray-200">
                    <button
                      onClick={() => showHint(qIndex)}
                      className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-semibold transition"
                    >
                      <Lightbulb className="w-4 h-4" />
                      {activeHint === qIndex ? "Hide Hint" : "Show Hint"}
                    </button>

                    {activeHint === qIndex && (
                      <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <p className="text-sm text-gray-700">
                          <span className="font-semibold text-yellow-700 mr-2">
                            Hint:
                          </span>
                          {q.hint}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 flex gap-4">
          <button
            onClick={() => navigate("/levels")}
            className="flex-1 px-6 py-4 rounded-xl font-semibold text-gray-700 bg-white border-2 border-gray-300 hover:border-gray-400 transition"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading || answers.includes(null)}
            className={`flex-1 flex items-center justify-center gap-2 px-6 py-4 rounded-xl font-semibold text-white transition-all duration-200 ${
              answers.includes(null) || loading
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-gradient-to-r from-green-500 to-green-600 hover:shadow-lg hover:scale-105"
            }`}
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Submitting...
              </>
            ) : (
              <>
                Submit Quiz
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}


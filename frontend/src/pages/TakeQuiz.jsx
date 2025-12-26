import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getQuizById, submitQuiz } from "../services/api/quizApi";
import { predictStruggle } from "../services/api/struggleApi";
import { checkLevelUnlock } from "../services/api/levelApi";

export default function TakeQuiz() {
  const { id } = useParams();
  const navigate = useNavigate();

  const USER_ID = 70063; // later replace with auth user

  const [quiz, setQuiz] = useState(null);
  const [answers, setAnswers] = useState([]);

  // ⏱ Time tracking
  const [quizStartTime] = useState(Date.now());
  const [firstAnswerTime, setFirstAnswerTime] = useState(null);
  const [elapsedTime, setElapsedTime] = useState(0);

  // 💡 Hint tracking
  const [hintCount, setHintCount] = useState(0);
  const [activeHint, setActiveHint] = useState(null);

  /* ======================
     Load Quiz
  ====================== */
  useEffect(() => {
    getQuizById(id).then((data) => {
      setQuiz(data);
      setAnswers(new Array(data.questions.length).fill(null));
    });
  }, [id]);

  /* ======================
     Timer
  ====================== */
  useEffect(() => {
    const timer = setInterval(() => {
      setElapsedTime(Math.floor((Date.now() - quizStartTime) / 1000));
    }, 1000);

    return () => clearInterval(timer);
  }, [quizStartTime]);

  /* ======================
     Answer selection
  ====================== */
  const selectAnswer = (qIndex, optionIndex) => {
    if (!firstAnswerTime) {
      setFirstAnswerTime(Date.now());
    }

    const updated = [...answers];
    updated[qIndex] = optionIndex;
    setAnswers(updated);
  };

  /* ======================
     Hint handler
  ====================== */
  const showHint = (qIndex) => {
    setHintCount((prev) => prev + 1);
    setActiveHint(qIndex);
  };

  /* ======================
     Submit Quiz
  ====================== */
  const handleSubmit = async () => {
    if (answers.includes(null)) {
      alert("Please answer all questions");
      return;
    }

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
      /* 1️⃣ Save quiz attempt */
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

      /* 2️⃣ Call ML struggle prediction (MODEL FEATURES ONLY) */
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
        return;
      }

      /* 3️⃣ Level unlock logic */
      const hasHighStruggle = struggleResult.struggling_skills.some(
        (s) => s.level === "High"
      );

      if (hasHighStruggle) {
        alert("⚠️ You are still struggling. Try this level again.");
        return;
      }

      await checkLevelUnlock({
        user_id: USER_ID,
        skill_name: quiz.skill_name,
      });

      alert("🎉 Level completed! Next level unlocked.");
      navigate("/levels");
    } catch (error) {
      console.error("Quiz submit error:", error);
      alert("Something went wrong. Please try again.");
    }
  };

  if (!quiz) return <p>Loading quiz...</p>;

  /* ======================
     UI
  ====================== */
  return (
    <div className="p-6 max-w-3xl">
      <div className="flex justify-between mb-4">
        <h2 className="text-2xl font-bold">{quiz.title}</h2>
        <div className="text-sm font-semibold">⏱ {elapsedTime}s</div>
      </div>

      {quiz.questions.map((q, qIndex) => (
        <div key={qIndex} className="border p-4 mb-4 rounded">
          <p className="font-semibold mb-2">{q.question}</p>

          {q.options.map((opt, oIndex) => (
            <label key={oIndex} className="block mt-2">
              <input
                type="radio"
                name={`q-${qIndex}`}
                checked={answers[qIndex] === oIndex}
                onChange={() => selectAnswer(qIndex, oIndex)}
              />
              <span className="ml-2">{opt}</span>
            </label>
          ))}

          {/* 💡 Hint */}
          {q.hint && (
            <div className="mt-3">
              <button
                onClick={() => showHint(qIndex)}
                className="text-sm text-blue-600 underline"
              >
                Show Hint
              </button>

              {activeHint === qIndex && (
                <p className="mt-2 text-sm text-gray-600">💡 Hint: {q.hint}</p>
              )}
            </div>
          )}
        </div>
      ))}

      <button
        onClick={handleSubmit}
        className="bg-green-600 text-white px-4 py-2 rounded"
      >
        Submit Quiz
      </button>
    </div>
  );
}

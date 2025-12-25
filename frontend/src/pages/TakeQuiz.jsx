import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getQuizById, submitQuiz } from "../services/api/quizApi";
import { predictStruggle } from "../services/api/struggleApi";

export default function TakeQuiz() {
  const { id } = useParams(); // quiz ID from URL
  const [quiz, setQuiz] = useState(null);
  const [answers, setAnswers] = useState([]);

  useEffect(() => {
    getQuizById(id).then((data) => {
      setQuiz(data);
      setAnswers(new Array(data.questions.length).fill(null));
    });
  }, [id]);

  const selectAnswer = (qIndex, optionIndex) => {
    const updated = [...answers];
    updated[qIndex] = optionIndex;
    setAnswers(updated);
  };

  const handleSubmit = async () => {
    let correct = 0;

    quiz.questions.forEach((q, i) => {
      if (answers[i] === q.correct) correct++;
    });

    const total = quiz.questions.length;

    // Save quiz attempt
    await submitQuiz({
      quiz_id: quiz.id,
      user_id: 70363,
      answers,
      score: correct,
      total,
    });

    // Call struggle ML
    const result = await predictStruggle({
      user_id: 70363,
      skills: [
        {
          skill_name: quiz.skill_name,
          correct: correct / total,
          attempt_count: 1,
          hint_count: 0,
          ms_first_response: 20000,
          opportunity: total,
          overlap_time: 20000,
        },
      ],
    });

    localStorage.setItem("struggle_result", JSON.stringify(result));
    alert("Quiz submitted & struggle analyzed");
  };

  if (!quiz) return <p>Loading quiz...</p>;

  return (
    <div className="p-6 max-w-3xl">
      <h2 className="text-2xl font-bold mb-4">{quiz.title}</h2>

      {quiz.questions.map((q, qIndex) => (
        <div key={qIndex} className="border p-4 mb-4">
          <p className="font-semibold">{q.question}</p>

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
        </div>
      ))}

      <button
        onClick={handleSubmit}
        className="bg-green-600 text-white px-4 py-2"
      >
        Submit Quiz
      </button>
    </div>
  );
}

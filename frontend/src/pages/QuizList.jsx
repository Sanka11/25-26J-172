import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getQuizzes } from "../services/api/quizApi";

export default function QuizList() {
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    async function loadQuizzes() {
      try {
        setLoading(true);
        setError("");
        const data = await getQuizzes();
        setQuizzes(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error(err);
        setError("Failed to load quizzes. Please try again.");
      } finally {
        setLoading(false);
      }
    }

    loadQuizzes();
  }, []);

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-sm font-semibold text-slate-900">
          Available quizzes
        </h2>
        <p className="mt-1 text-[11px] text-slate-500 max-w-xl">
          Browse the quizzes configured for this demo and jump straight into a
          specific assessment.
        </p>
      </div>

      {error && (
        <div className="rounded-md bg-red-50 px-3 py-2 text-xs text-red-700 border border-red-200">
          {error}
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4">
        <div className="flex items-center justify-between mb-2 text-[11px] text-slate-500">
          <span>
            {loading
              ? "Loading quizzes…"
              : `${quizzes.length} quiz${
                  quizzes.length === 1 ? "" : "zes"
                } found`}
          </span>
        </div>

        {quizzes.length === 0 && !loading ? (
          <div className="py-6 text-center text-xs text-slate-500">
            No quizzes are available yet. Create a quiz from the admin section
            to get started.
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {quizzes.map((q, index) => (
              <button
                key={q.id || index}
                type="button"
                onClick={() => navigate(`/quiz/${q.id}`)}
                className="text-left rounded-xl border border-slate-200 bg-slate-50/70 px-3 py-3 hover:bg-slate-50 hover:shadow-sm transition-colors flex flex-col gap-1"
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="font-semibold text-xs text-slate-900 line-clamp-2">
                    {q.title || q.skill_name || `Quiz ${index + 1}`}
                  </p>
                  {q.skill_name && (
                    <span className="inline-flex items-center rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-medium text-blue-700 border border-blue-100">
                      {q.skill_name}
                    </span>
                  )}
                </div>
                {q.description && (
                  <p className="text-[11px] text-slate-600 line-clamp-2 mt-0.5">
                    {q.description}
                  </p>
                )}
                <span className="mt-2 inline-flex items-center text-[11px] font-semibold text-blue-700">
                  Start quiz
                  <span className="ml-1">→</span>
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

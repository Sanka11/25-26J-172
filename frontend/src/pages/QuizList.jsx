import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getQuizzes } from "../services/api/quizApi";

export default function QuizList() {
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const data = await getQuizzes();
        if (Array.isArray(data)) {
          setQuizzes(data);
        } else if (data && Array.isArray(data.quizzes)) {
          setQuizzes(data.quizzes);
        } else {
          setQuizzes([]);
        }
      } catch (err) {
        console.error(err);
        setError("Failed to load quizzes. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-br from-gray-50 via-slate-50 to-blue-50 px-3 sm:px-4 md:px-6 py-4 md:py-6">
      <div className="max-w-5xl mx-auto space-y-5">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Available quizzes
          </h1>
          <p className="mt-1 text-sm text-slate-600 max-w-2xl">
            Browse all published quizzes and jump into a quiz that matches your
            current level.
          </p>
        </div>

        <div className="bg-white/90 backdrop-blur rounded-2xl shadow-2xl border border-slate-200 p-5 md:p-6 space-y-4">
          {loading && (
            <p className="text-sm text-slate-500">Loading quizzes…</p>
          )}

          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          {!loading && !error && quizzes.length === 0 && (
            <p className="text-sm text-slate-500">
              No quizzes are available yet. Check back later.
            </p>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            {quizzes.map((quiz) => (
              <button
                key={quiz.id || quiz.quiz_id}
                type="button"
                onClick={() => navigate(`/quiz/${quiz.id || quiz.quiz_id}`)}
                className="group text-left rounded-xl border border-slate-200 bg-slate-50/80 hover:bg-blue-50/80 hover:border-blue-200 hover:shadow-md transition-all px-4 py-3 flex flex-col gap-1"
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-slate-900 truncate">
                    {quiz.title || "Untitled quiz"}
                  </p>
                  <span className="inline-flex items-center rounded-full bg-blue-50 px-2 py-0.5 text-[11px] font-medium text-blue-700 border border-blue-100">
                    Start →
                  </span>
                </div>
                {quiz.description && (
                  <p className="text-[11px] text-slate-600 line-clamp-2">
                    {quiz.description}
                  </p>
                )}
                {quiz.level && (
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Level: <span className="font-medium">{quiz.level}</span>
                  </p>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

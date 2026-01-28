import { useState } from "react";
import { TrendingUp, Loader2 } from "lucide-react";
import { fetchCareerReadiness } from "../services/api/careerReadinessService";

const CareerReadiness = () => {
  const [skills, setSkills] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleAnalyze = async () => {
    if (!skills.trim() || !jobTitle.trim()) return;

    setLoading(true);
    setResult(null);
    setError(null);

    try {
      // ✅ Send ONE data object (matches service design)
      const data = await fetchCareerReadiness({
        user_skills: skills,
        job_title: jobTitle,
      });

      setResult(data);
    } catch (err) {
      console.error("Career readiness error", err);
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-3xl mx-auto bg-white rounded-xl shadow border p-6">
        {/* Header */}
        <div className="flex items-center gap-2 mb-6">
          <TrendingUp className="w-6 h-6 text-indigo-600" />
          <h1 className="text-2xl font-bold text-gray-900">
            Career Readiness Analysis
          </h1>
        </div>

        {/* Input Section */}
        <div className="space-y-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Your Skills
            </label>
            <textarea
              value={skills}
              onChange={(e) => setSkills(e.target.value)}
              rows={3}
              placeholder="e.g. Python, FastAPI, SQL"
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Target Job Title
            </label>
            <input
              value={jobTitle}
              onChange={(e) => setJobTitle(e.target.value)}
              placeholder="e.g. Backend Developer"
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <button
            onClick={handleAnalyze}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition disabled:opacity-60"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Analyzing...
              </>
            ) : (
              "Analyze Career Readiness"
            )}
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-4 bg-red-50 border-l-4 border-red-500 p-3 rounded">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {/* Result Section */}
        {result && (
          <div className="space-y-5">
            {/* Strengths */}
            <div>
              <h3 className="font-semibold text-emerald-700 mb-1">Strengths</h3>
              {result.strengths.length > 0 ? (
                <ul className="list-disc list-inside text-sm text-gray-700">
                  {result.strengths.map((s, i) => (
                    <li key={i}>{s}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-gray-500">No strengths identified</p>
              )}
            </div>

            {/* Weaknesses */}
            <div>
              <h3 className="font-semibold text-amber-700 mb-1">
                Areas to Improve
              </h3>
              {result.weaknesses.length > 0 ? (
                <ul className="list-disc list-inside text-sm text-gray-700">
                  {result.weaknesses.map((w, i) => (
                    <li key={i}>{w}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-gray-500">
                  No major gaps identified
                </p>
              )}
            </div>

            {/* Learning Topics */}
            <div>
              <h3 className="font-semibold text-blue-700 mb-1">
                Suggested Learning Topics
              </h3>
              {result.learning_topics.length > 0 ? (
                <ul className="list-disc list-inside text-sm text-gray-700">
                  {result.learning_topics.map((t, i) => (
                    <li key={i}>{t}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-gray-500">
                  No learning topics suggested
                </p>
              )}
            </div>

            {/* Recommendation */}
            <div className="bg-indigo-50 border-l-4 border-indigo-500 p-4 rounded">
              <p className="text-sm text-indigo-900">{result.recommendation}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CareerReadiness;

import React, { useState } from "react";
import {
  GraduationCap,
  TrendingUp,
  Calendar,
  Heart,
  FileText,
  Sparkles,
  AlertCircle,
  Loader2,
} from "lucide-react";

import { predictRecommendation } from "../services/api/recommendationApi";

export default function RecommendationDemo() {
  const [form, setForm] = useState({
    attendance_pct: "",
    midterm_score: "",
    final_score: "",
    assignments_avg: "",
    quizzes_avg: "",
    participation_score: "",
    projects_score: "",
    total_score: "",
    study_hours_per_week: "",
    stress_level: "",
    sleep_hours: "",
  });

  const [recommendationsData, setRecommendationsData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function update(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError("");
  }

  async function handleRecommendation() {
    // Validation
    for (const key in form) {
      if (!form[key]) {
        setError("Please fill in all fields.");
        return;
      }
    }

    setLoading(true);
    setError("");
    setRecommendationsData(null);

    try {
      const payload = {
        attendance_pct: Number(form.attendance_pct),
        midterm_score: Number(form.midterm_score),
        final_score: Number(form.final_score),
        assignments_avg: Number(form.assignments_avg),
        quizzes_avg: Number(form.quizzes_avg),
        participation_score: Number(form.participation_score),
        projects_score: Number(form.projects_score),
        total_score: Number(form.total_score),
        study_hours_per_week: Number(form.study_hours_per_week),
        stress_level: Number(form.stress_level),
        sleep_hours: Number(form.sleep_hours),
      };

      const result = await predictRecommendation(payload);

      setRecommendationsData(result);
    } catch (err) {
      console.error(err);
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Heading */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-2xl mb-4 shadow-lg">
            <GraduationCap className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-3">
            AI Student Success Engine
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Get personalized recommendations to boost your academic performance
            and well-being.
          </p>
        </div>

        {/* Form */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
          <h2 className="text-2xl font-semibold text-gray-800 mb-6 flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-blue-600" />
            Student Information
          </h2>

          <div className="grid gap-6 md:grid-cols-2">
            {Object.keys(form).map((field, idx) => (
              <div key={idx}>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {field.replace(/_/g, " ").toUpperCase()}
                </label>

                <div className="relative">
                  <input
                    name={field}
                    type="number"
                    placeholder="Enter value"
                    value={form[field]}
                    className="block w-full pl-4 pr-3 py-3 border border-gray-300 rounded-lg 
                               focus:ring-2 focus:ring-blue-500 focus:border-transparent 
                               transition-all duration-200"
                    onChange={update}
                  />
                </div>
              </div>
            ))}
          </div>

          {error && (
            <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          <button
            onClick={handleRecommendation}
            disabled={loading}
            className="mt-8 w-full bg-gradient-to-r from-blue-600 to-blue-700 
                       text-white font-semibold px-6 py-4 rounded-lg 
                       hover:from-blue-700 hover:to-blue-800 
                       transition-all duration-200 shadow-lg hover:shadow-xl 
                       disabled:opacity-50 disabled:cursor-not-allowed 
                       flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                Get Personalized Recommendations
              </>
            )}
          </button>
        </div>

        {/* Recommendations */}
        {recommendationsData && (
          <div className="mt-12 space-y-10 animate-fadeInSlow">
            {/* Academic */}
            <RecommendationCard
              color="blue"
              title="Academic Recommendation"
              icon={<GraduationCap className="w-7 h-7" />}
              recommendation={recommendationsData.academic_recommendation}
              explanation={recommendationsData.academic_explanation}
            />

            {/* Wellbeing */}
            <RecommendationCard
              color="green"
              title="Wellbeing Recommendation"
              icon={<Heart className="w-7 h-7" />}
              recommendation={recommendationsData.wellbeing_recommendation}
              explanation={recommendationsData.wellbeing_explanation}
            />

            {/* Study */}
            <RecommendationCard
              color="purple"
              title="Study Pattern Recommendation"
              icon={<TrendingUp className="w-7 h-7" />}
              recommendation={recommendationsData.study_recommendation}
              explanation={recommendationsData.study_explanation}
            />
          </div>
        )}
      </div>

      {/* Animations */}
      <style>{`
        @keyframes fadeInSlow {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeInSlow {
          animation: fadeInSlow .6s ease-out;
        }
      `}</style>
    </div>
  );
}

/* ----------------------------
   BEAUTIFUL RECOMMENDATION CARD
----------------------------- */
function RecommendationCard({
  color,
  title,
  icon,
  recommendation,
  explanation,
}) {
  return (
    <div
      className={`rounded-2xl border border-${color}-200 bg-${color}-50 shadow-sm p-6 
                  hover:shadow-lg transition-all duration-300`}
    >
      <div className="flex items-center gap-4 mb-4">
        <div
          className={`w-12 h-12 bg-${color}-600 text-white rounded-xl 
                      flex items-center justify-center shadow-md`}
        >
          {icon}
        </div>
        <div>
          <h2 className="text-2xl font-semibold text-gray-900">{title}</h2>
          <p className="text-sm text-gray-600">
            AI-powered personalized insight
          </p>
        </div>
      </div>

      <p className="text-gray-800 text-lg leading-relaxed">{recommendation}</p>

      <details className="mt-4 group cursor-pointer">
        <summary
          className={`text-${color}-700 font-medium flex items-center gap-2 cursor-pointer`}
        >
          <AlertCircle className="w-5 h-5" />
          Why this recommendation?
        </summary>
        <p
          className={`mt-2 text-gray-700 bg-white border border-${color}-100 p-4 
                      rounded-xl shadow-inner`}
        >
          {explanation}
        </p>
      </details>
    </div>
  );
}

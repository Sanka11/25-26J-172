import { useNavigate } from "react-router-dom";

/**
 * GRU Home Page
 * Purpose:
 * - Entry point for the GRU-based Student Disengagement Detection module
 * - Allows users to choose between single-student and cohort-level analysis
 */
export default function GRUMain() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center px-4">
      <div className="max-w-3xl w-full bg-white rounded-2xl shadow-lg p-8">
        {/* Title */}
        <h1 className="text-3xl font-bold text-slate-900 mb-4 text-center">
          Student Disengagement Risk Analysis
        </h1>

        {/* Description */}
        <p className="text-slate-600 text-center mb-10 leading-relaxed">
          This module uses a <strong>GRU-based deep learning model</strong> to
          analyze student learning behavior and identify disengagement risk
          levels early. You can evaluate individual students or assess risk
          patterns across an entire cohort.
        </p>

        {/* Action Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Single Student */}
          <div className="border rounded-xl p-6 hover:shadow-md transition">
            <h2 className="text-lg font-semibold text-slate-800 mb-2">
              Single Student Analysis
            </h2>
            <p className="text-sm text-slate-600 mb-4">
              Analyze disengagement risk for a specific student based on their
              recent activity patterns. Ideal for advisors and instructors who
              want to intervene early.
            </p>
            <button
              onClick={() => navigate("/gru/search")}
              className="w-full bg-blue-600 text-white py-2 rounded-lg font-medium hover:bg-blue-700 transition"
            >
              Analyze Individual Student
            </button>
          </div>

          {/* All Students */}
          <div className="border rounded-xl p-6 hover:shadow-md transition">
            <h2 className="text-lg font-semibold text-slate-800 mb-2">
              Cohort-Level Analysis
            </h2>
            <p className="text-sm text-slate-600 mb-4">
              View disengagement risk levels across all students to identify
              trends, high-risk groups, and overall engagement health within the
              course or program.
            </p>
            <button
              onClick={() => navigate("/gru/all")}
              className="w-full bg-green-600 text-white py-2 rounded-lg font-medium hover:bg-green-700 transition"
            >
              Analyze All Students
            </button>
          </div>
        </div>

        {/* Footer Note */}
        <p className="mt-10 text-xs text-slate-500 text-center">
          Risk predictions are generated using historical learning behavior and
          should be used to support, not replace, academic judgment.
        </p>
      </div>
    </div>
  );
}

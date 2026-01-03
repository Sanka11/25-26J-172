export default function StruggleDashboard() {
  const data = JSON.parse(localStorage.getItem("struggle_result"));

  if (!data) {
    return (
      <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-br from-gray-50 to-blue-50 px-2 sm:px-4 md:px-6 py-4 md:py-6">
        <div className="max-w-4xl mx-auto space-y-3">
          <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Struggling skills overview
          </h1>
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 p-4 text-xs text-slate-600">
            No struggle data is available yet. Complete at least one quiz with
            the ML pipeline enabled to see struggling skills analysis.
          </div>
        </div>
      </div>
    );
  }

  const items = Array.isArray(data.struggling_skills)
    ? data.struggling_skills
    : [];

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-br from-gray-50 to-blue-50 px-2 sm:px-4 md:px-6 py-4 md:py-6">
      <div className="max-w-4xl mx-auto space-y-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-1">
            Struggling skills
          </h1>
          <p className="text-[11px] md:text-sm text-slate-500 max-w-xl">
            This view shows skills where the model has detected high or medium
            struggle levels based on recent quiz attempts and engagement
            patterns.
          </p>
        </div>

        {items.length === 0 ? (
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 text-xs text-emerald-800">
            🎉 No struggling skills detected. Keep monitoring over time as more
            quiz data comes in.
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 p-4 text-xs">
            <div className="mb-3 text-[11px] text-slate-500">
              {items.length} skill{items.length === 1 ? "" : "s"} flagged by the
              model.
            </div>
            <div className="space-y-2">
              {items.map((s, i) => (
                <div
                  key={i}
                  className="rounded-xl border border-slate-200 bg-slate-50/60 px-3 py-2 flex flex-col gap-1"
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-semibold text-slate-900 text-xs">
                      {s.skill_name || "Unnamed skill"}
                    </p>
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium border ${
                        s.level === "High"
                          ? "bg-red-50 text-red-700 border-red-200"
                          : s.level === "Medium"
                          ? "bg-amber-50 text-amber-700 border-amber-200"
                          : "bg-emerald-50 text-emerald-700 border-emerald-200"
                      }`}
                    >
                      {s.level || "Unknown"} struggle
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600">
                    Model score:{" "}
                    <span className="font-semibold">{s.struggle_score}</span>
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function StruggleDashboard() {
  const data = JSON.parse(localStorage.getItem("struggle_result"));

  if (!data) {
    return (
      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-slate-900">
          Struggling skills overview
        </h2>
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 text-xs text-slate-600">
          No struggle data is available yet. Complete at least one quiz with the
          ML pipeline enabled to see struggling skills analysis.
        </div>
      </div>
    );
  }

  const items = Array.isArray(data.struggling_skills)
    ? data.struggling_skills
    : [];

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-sm font-semibold text-slate-900 mb-1">
          Struggling skills
        </h2>
        <p className="text-[11px] text-slate-500 max-w-xl">
          This view shows skills where the model has detected high or medium
          struggle levels based on recent quiz attempts and engagement patterns.
        </p>
      </div>

      {items.length === 0 ? (
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 text-xs text-emerald-800">
          🎉 No struggling skills detected. Keep monitoring over time as more
          quiz data comes in.
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 text-xs">
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
  );
}

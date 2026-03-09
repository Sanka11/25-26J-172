import { useState, useEffect, useRef, useCallback } from "react";
import { predictNextSemester } from "../services/api/mlApi";

// ── Alert rules — triggered by slider values ──
function getAlerts(form) {
  const alerts = [];

  if (form.Sleep_Hours_per_Night < 6)
    alerts.push({
      type: "danger",
      field: "Sleep_Hours_per_Night",
      title: "Very Low Sleep",
      msg: "Less than 6 hours of sleep impairs memory consolidation and exam performance. Aim for 7-9 hours.",
    });
  else if (form.Sleep_Hours_per_Night < 7)
    alerts.push({
      type: "warning",
      field: "Sleep_Hours_per_Night",
      title: "Low Sleep",
      msg: "7-9 hours of sleep is recommended for optimal academic performance.",
    });

  if (form.Stress_Level >= 8)
    alerts.push({
      type: "danger",
      field: "Stress_Level",
      title: "Very High Stress",
      msg: "Extreme stress significantly increases dropout risk. Consider speaking to a counsellor or reducing workload.",
    });
  else if (form.Stress_Level >= 6)
    alerts.push({
      type: "warning",
      field: "Stress_Level",
      title: "High Stress",
      msg: "High stress can hurt focus and retention. Regular breaks and exercise can help manage stress.",
    });

  if (form.Attendance_pct < 50)
    alerts.push({
      type: "danger",
      field: "Attendance_pct",
      title: "Critical Attendance",
      msg: "Below 50% attendance is a strong predictor of academic failure. This is the single biggest risk factor.",
    });
  else if (form.Attendance_pct < 75)
    alerts.push({
      type: "warning",
      field: "Attendance_pct",
      title: "Low Attendance",
      msg: "At least 75% attendance is recommended. Missing classes often leads to knowledge gaps in assessments.",
    });

  if (form.Study_Hours_per_Week < 5)
    alerts.push({
      type: "warning",
      field: "Study_Hours_per_Week",
      title: "Insufficient Study Time",
      msg: "Less than 5 hours/week is well below recommended. Most modules expect 10-15 hours of self-study weekly.",
    });

  if (form.Assignments_Avg < 40)
    alerts.push({
      type: "warning",
      field: "Assignments_Avg",
      title: "Low Assignment Average",
      msg: "Assignment scores below 40 indicate a serious gap. They directly affect your GPA and final grade.",
    });

  if (
    form.Sleep_Hours_per_Night >= 8 &&
    form.Stress_Level <= 4 &&
    form.Attendance_pct >= 80
  )
    alerts.push({
      type: "success",
      field: null,
      title: "Great Habits!",
      msg: "Good sleep, low stress, and strong attendance are the foundation of academic success. Keep it up!",
    });

  return alerts;
}

const ALERT_STYLES = {
  danger: {
    bg: "bg-red-50 border-red-300",
    icon: "!",
    iconBg: "bg-red-500",
    title: "text-red-700",
    text: "text-red-600",
  },
  warning: {
    bg: "bg-amber-50 border-amber-300",
    icon: "!",
    iconBg: "bg-amber-500",
    title: "text-amber-700",
    text: "text-amber-600",
  },
  info: {
    bg: "bg-blue-50 border-blue-200",
    icon: "i",
    iconBg: "bg-blue-500",
    title: "text-blue-700",
    text: "text-blue-600",
  },
  success: {
    bg: "bg-green-50 border-green-300",
    icon: "v",
    iconBg: "bg-green-500",
    title: "text-green-700",
    text: "text-green-600",
  },
};

// ── Animated live risk bar ──
function LiveRiskBar({ percentage, level, loading }) {
  const colorMap = {
    High: {
      bar: "bg-red-500",
      text: "text-red-600",
      badge: "bg-red-100 text-red-700",
    },
    Medium: {
      bar: "bg-amber-500",
      text: "text-amber-600",
      badge: "bg-amber-100 text-amber-700",
    },
    Low: {
      bar: "bg-green-500",
      text: "text-green-600",
      badge: "bg-green-100 text-green-700",
    },
  };
  const c = colorMap[level] || colorMap["Low"];

  const segColor = (i) => {
    const thresh = (i + 1) * 10;
    if (thresh <= 40) return "bg-green-400";
    if (thresh <= 70) return "bg-amber-400";
    return "bg-red-400";
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow p-5 mb-5">
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="text-xs text-gray-400 uppercase tracking-wide font-semibold">
            Predicted Risk Score
          </p>
          <p className="text-xs text-gray-400 mt-0.5">
            Updates as you adjust the sliders
          </p>
        </div>
        <div className="flex items-center gap-3">
          {loading && (
            <div className="flex items-center gap-1.5 text-xs text-gray-400">
              <div className="w-3 h-3 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
              Recalculating...
            </div>
          )}
          {percentage !== null && level && (
            <span
              className={`text-xs font-bold px-3 py-1 rounded-full ${c.badge}`}
            >
              {level} Risk
            </span>
          )}
        </div>
      </div>

      {percentage !== null ? (
        <>
          <div className="flex items-center gap-4 mb-2">
            <span
              className={`text-4xl font-black ${c.text}`}
              style={{ transition: "color 0.5s" }}
            >
              {percentage}%
            </span>
            <div className="flex-1">
              <div className="w-full bg-gray-100 rounded-full h-5 overflow-hidden">
                <div
                  className={`h-5 rounded-full ${c.bar}`}
                  style={{
                    width: `${percentage}%`,
                    transition: "width 0.7s cubic-bezier(0.4,0,0.2,1)",
                  }}
                />
              </div>
              <div className="flex justify-between text-xs text-gray-300 mt-1 px-0.5">
                <span>0%</span>
                <span>Low</span>
                <span>Medium</span>
                <span>High</span>
                <span>100%</span>
              </div>
            </div>
          </div>
          {/* Segment dots */}
          <div className="flex gap-1 mt-2">
            {[...Array(10)].map((_, i) => {
              const filled = percentage >= (i + 1) * 10;
              return (
                <div
                  key={i}
                  className={`flex-1 h-1.5 rounded-full transition-all duration-500 ${filled ? segColor(i) : "bg-gray-100"}`}
                />
              );
            })}
          </div>
        </>
      ) : (
        <div className="h-14 flex items-center justify-center text-gray-300 text-sm border-2 border-dashed border-gray-100 rounded-xl">
          Adjust sliders below to see your predicted risk
        </div>
      )}
    </div>
  );
}

// ── Slider with highlighted state for alerted fields ──
function SliderField({
  label,
  field,
  value,
  min,
  max,
  step = 1,
  unit = "",
  onChange,
  highlighted,
}) {
  const pct = ((value - min) / (max - min)) * 100;
  const trackColor = highlighted ? "#f59e0b" : "#6366f1";
  return (
    <div
      className={`rounded-xl p-3 transition-all duration-300 ${highlighted ? "bg-amber-50 border border-amber-200" : "bg-gray-50 border border-transparent"}`}
    >
      <div className="flex justify-between items-center mb-1.5">
        <label className="text-xs font-semibold text-gray-600">{label}</label>
        <span
          className={`text-sm font-bold tabular-nums ${highlighted ? "text-amber-600" : "text-indigo-600"}`}
        >
          {value}
          {unit}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(field, Number(e.target.value))}
        className="w-full h-2 rounded-full appearance-none cursor-pointer"
        style={{
          background: `linear-gradient(to right, ${trackColor} ${pct}%, #e2e8f0 ${pct}%)`,
        }}
      />
      <div className="flex justify-between text-xs text-gray-300 mt-0.5">
        <span>
          {min}
          {unit}
        </span>
        <span>
          {max}
          {unit}
        </span>
      </div>
    </div>
  );
}

const DEFAULTS = {
  Attendance_pct: 75,
  Midterm_Score: 65,
  Final_Score: 65,
  Assignments_Avg: 65,
  Quizzes_Avg: 65,
  Projects_Score: 65,
  Participation_Score: 60,
  Study_Hours_per_Week: 10,
  Stress_Level: 5,
  Sleep_Hours_per_Night: 7,
  Department: "Computer Science",
  Extracurricular_Activities: "Yes",
  Family_Income_Level: "Medium",
};

const SLIDERS = [
  { field: "Attendance_pct", label: "Attendance", min: 0, max: 100, unit: "%" },
  {
    field: "Midterm_Score",
    label: "Midterm Score",
    min: 0,
    max: 100,
    unit: "",
  },
  { field: "Final_Score", label: "Final Score", min: 0, max: 100, unit: "" },
  {
    field: "Assignments_Avg",
    label: "Assignments Average",
    min: 0,
    max: 100,
    unit: "",
  },
  {
    field: "Quizzes_Avg",
    label: "Quizzes Average",
    min: 0,
    max: 100,
    unit: "",
  },
  {
    field: "Projects_Score",
    label: "Projects Score",
    min: 0,
    max: 100,
    unit: "",
  },
  {
    field: "Participation_Score",
    label: "Class Participation",
    min: 0,
    max: 100,
    unit: "",
  },
  {
    field: "Study_Hours_per_Week",
    label: "Study Hours / Week",
    min: 0,
    max: 40,
    unit: "h",
  },
  { field: "Stress_Level", label: "Stress Level", min: 1, max: 10, unit: "" },
  {
    field: "Sleep_Hours_per_Night",
    label: "Sleep Hours / Night",
    min: 3,
    max: 12,
    unit: "h",
  },
];

export default function NextSemesterPredictor() {
  const [form, setForm] = useState(DEFAULTS);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [autoPredict, setAutoPredict] = useState(false);
  const debounceRef = useRef(null);

  const alerts = getAlerts(form);
  const alertedFields = new Set(
    alerts.filter((a) => a.field).map((a) => a.field),
  );

  const buildPayload = useCallback(
    (f) => ({
      Attendance_pct: Number(f.Attendance_pct),
      Midterm_Score: Number(f.Midterm_Score),
      Final_Score: Number(f.Final_Score),
      Assignments_Avg: Number(f.Assignments_Avg),
      Quizzes_Avg: Number(f.Quizzes_Avg),
      Projects_Score: Number(f.Projects_Score),
      Participation_Score: Number(f.Participation_Score),
      Study_Hours_per_Week: Number(f.Study_Hours_per_Week),
      Stress_Level: Number(f.Stress_Level),
      Sleep_Hours_per_Night: Number(f.Sleep_Hours_per_Night),
      Department: f.Department,
      Extracurricular_Activities: f.Extracurricular_Activities,
      Family_Income_Level: f.Family_Income_Level,
      Age: 21,
      Gender: "Male",
      Internet_Access_at_Home: "Yes",
      Parent_Education_Level: "Bachelor",
    }),
    [],
  );

  const runPredict = useCallback(
    async (values) => {
      setLoading(true);
      setError(null);
      try {
        const res = await predictNextSemester(buildPayload(values));
        setResult(res);
      } catch {
        setError("Prediction failed. Make sure the ML service is running.");
      } finally {
        setLoading(false);
      }
    },
    [buildPayload],
  );

  function handleChange(field, value) {
    const updated = { ...form, [field]: value };
    setForm(updated);
    if (autoPredict) {
      clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => runPredict(updated), 600);
    }
  }

  useEffect(() => () => clearTimeout(debounceRef.current), []);

  return (
    <div>
      {/* Live Risk Bar */}
      <LiveRiskBar
        percentage={result?.risk_percentage ?? null}
        level={result?.risk_level ?? null}
        loading={loading}
      />

      {/* Real-time toggle */}
      <div className="flex items-center justify-between mb-4 px-1">
        <div>
          <p className="text-sm font-semibold text-gray-700">
            Real-time Prediction
          </p>
          <p className="text-xs text-gray-400">
            Auto-recalculates as you move sliders
          </p>
        </div>
        <button
          onClick={() => setAutoPredict((p) => !p)}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-300 ${autoPredict ? "bg-indigo-600" : "bg-gray-200"}`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform duration-300 ${autoPredict ? "translate-x-6" : "translate-x-1"}`}
          />
        </button>
      </div>

      {/* Smart Alerts */}
      {alerts.length > 0 && (
        <div className="space-y-2 mb-5">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
            Health & Study Alerts
          </p>
          {alerts.map((a, i) => {
            const s = ALERT_STYLES[a.type];
            return (
              <div
                key={i}
                className={`flex gap-3 p-3 rounded-xl border ${s.bg}`}
              >
                <div
                  className={`flex-shrink-0 w-5 h-5 rounded-full ${s.iconBg} flex items-center justify-center mt-0.5`}
                >
                  <span className="text-white text-xs font-black leading-none">
                    {s.icon}
                  </span>
                </div>
                <div>
                  <p className={`text-xs font-bold ${s.title}`}>{a.title}</p>
                  <p className={`text-xs mt-0.5 leading-relaxed ${s.text}`}>
                    {a.msg}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Sliders — two columns */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-5">
        {SLIDERS.map((s) => (
          <SliderField
            key={s.field}
            {...s}
            value={form[s.field]}
            onChange={handleChange}
            highlighted={alertedFields.has(s.field)}
          />
        ))}
      </div>

      {/* Select fields */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-5">
        {[
          {
            field: "Department",
            label: "Department",
            options: [
              "Computer Science",
              "Engineering",
              "Business",
              "Medicine",
              "Arts",
              "Law",
              "Science",
            ],
          },
          {
            field: "Extracurricular_Activities",
            label: "Extracurricular Activities",
            options: ["Yes", "No"],
          },
          {
            field: "Family_Income_Level",
            label: "Family Income Level",
            options: ["Low", "Medium", "High"],
          },
        ].map(({ field, label, options }) => (
          <div key={field}>
            <label className="block text-xs font-semibold text-gray-600 mb-1">
              {label}
            </label>
            <select
              value={form[field]}
              onChange={(e) => handleChange(field, e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-300"
            >
              {options.map((o) => (
                <option key={o}>{o}</option>
              ))}
            </select>
          </div>
        ))}
      </div>

      {/* Manual predict button (shown when auto-predict is off) */}
      {!autoPredict && (
        <button
          onClick={() => runPredict(form)}
          disabled={loading}
          className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white font-bold rounded-xl shadow transition-all flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />{" "}
              Predicting...
            </>
          ) : (
            "Predict My Risk"
          )}
        </button>
      )}

      {error && (
        <p className="text-xs text-red-500 text-center mt-3">{error}</p>
      )}

      <p className="text-xs text-gray-400 text-center mt-4 italic">
        Predictions use the same hybrid ML model as your current risk score.
        Adjust sliders to simulate how changes to your habits could affect next
        semester.
      </p>
    </div>
  );
}

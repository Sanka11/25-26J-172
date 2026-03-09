import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { motion } from "framer-motion";

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 28 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] },
});

const ROLE_CONFIG = {
  student: {
    greeting: "Your Academic Risk Overview",
    primaryLink: { to: "/my-risk", label: "View My Risk Dashboard" },
    secondaryLink: { to: "/WorkloadDashboard", label: "Workload Dashboard" },
    quickLinks: [
      {
        to: "/my-risk",
        label: "🎯 My Risk",
        desc: "SHAP-powered personal risk score",
      },
      {
        to: "/recommendation",
        label: "💡 Recommendations",
        desc: "AI-curated study advice",
      },
      { to: "/levels", label: "📝 Quizzes", desc: "Test your knowledge" },
      {
        to: "/WorkloadDashboard",
        label: "📅 Workload",
        desc: "Track deadlines & tasks",
      },
      {
        to: "/announcements",
        label: "📢 Announcements",
        desc: "Latest from faculty",
      },
    ],
  },
  lecturer: {
    greeting: "Student Risk Management",
    primaryLink: { to: "/lecturer-risk", label: "View Student Risks" },
    secondaryLink: { to: "/announcements", label: "Announcements" },
    quickLinks: [
      {
        to: "/lecturer-risk",
        label: "👥 Student Risks",
        desc: "Bulk risk view with SHAP",
      },
      {
        to: "/announcements",
        label: "📢 Announcements",
        desc: "Broadcast to students",
      },
      {
        to: "/admin/adminworkload",
        label: "📊 Workload Tracker",
        desc: "Monitor class workload",
      },
    ],
  },
  admin: {
    greeting: "Admin Control Center",
    primaryLink: { to: "/admin/announcements", label: "Manage Announcements" },
    secondaryLink: { to: "/support", label: "High Risk Interventions" },
    quickLinks: [
      {
        to: "/admin/announcements",
        label: "📢 Announcements",
        desc: "Create & manage notices",
      },
      {
        to: "/support",
        label: "🚨 Interventions",
        desc: "High risk student support",
      },
      {
        to: "/admin/adminworkload",
        label: "📊 Workload",
        desc: "Admin workload tracker",
      },
    ],
  },
  super_admin: {
    greeting: "Super Admin Dashboard",
    primaryLink: { to: "/admin/disengagementhub", label: "Disengagement" },
    secondaryLink: { to: "/", label: "RL Decision Engine" },
    quickLinks: [
      // { to: "/gru", label: "🧠 GRU Model", desc: "Disengagement detection" },
      // {
      //   to: "/rl",
      //   label: "🤖 RL Engine",
      //   desc: "Reinforcement learning decisions",
      // },
      {
        to: "/admin/disengagementhub",
        label: "🎛️ Disengagement Hub",
        desc: "Full monitoring center",
      },
      {
        to: "/gru/batch",
        label: "⚡ GRU Batch",
        desc: "Batch risk processing",
      },
    ],
  },
};

const StatCard = ({ value, label, color }) => (
  <div
    className={`rounded-2xl p-5 border ${color} bg-white/60 backdrop-blur-sm`}
  >
    <p className="text-3xl font-black text-slate-800">{value}</p>
    <p className="text-xs font-semibold text-slate-500 mt-1 uppercase tracking-wide">
      {label}
    </p>
  </div>
);

export default function RiskDemo() {
  const { currentUser, userData } = useAuth();
  const role = userData?.role || "student";
  const config = ROLE_CONFIG[role] || ROLE_CONFIG.student;
  const firstName = userData?.firstName || "User";

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* ── HERO ── */}
      <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-900 px-8 py-16 md:py-24">
        {/* Background decoration */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-blue-500/10 blur-3xl" />
          <div className="absolute -bottom-20 -left-20 w-80 h-80 rounded-full bg-indigo-500/10 blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-blue-600/5 blur-3xl" />
        </div>

        <div className="relative max-w-6xl mx-auto">
          <motion.div {...fadeUp(0)}>
            {currentUser && (
              <div className="inline-flex items-center gap-2 bg-blue-500/20 border border-blue-400/30 rounded-full px-4 py-1.5 mb-6">
                <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                <span className="text-blue-200 text-sm font-medium">
                  Welcome back, {firstName} · {role.toUpperCase()}
                </span>
              </div>
            )}
          </motion.div>

          <motion.h1
            {...fadeUp(0.1)}
            className="text-4xl md:text-6xl font-black text-white tracking-tight leading-tight"
          >
            Acade<span className="text-blue-400">mi</span>Guard
          </motion.h1>

          <motion.p
            {...fadeUp(0.2)}
            className="mt-4 text-lg text-slate-300 max-w-2xl leading-relaxed"
          >
            AI-powered academic risk monitoring with explainable predictions.
            Know your risk. Understand why. Act early.
          </motion.p>

          <motion.div {...fadeUp(0.3)} className="mt-8 flex flex-wrap gap-4">
            <Link
              to={config.primaryLink.to}
              className="rounded-xl bg-blue-500 hover:bg-blue-400 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-blue-500/30 transition-all hover:-translate-y-0.5"
            >
              {config.primaryLink.label} →
            </Link>
            <Link
              to={config.secondaryLink.to}
              className="rounded-xl border border-white/20 px-6 py-3 text-sm font-semibold text-white hover:bg-white/10 transition-all"
            >
              {config.secondaryLink.label}
            </Link>
          </motion.div>

          {/* Stats row */}
          <motion.div
            {...fadeUp(0.4)}
            className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-4"
          >
            {[
              { value: "97.8%", label: "Model Accuracy" },
              { value: "99.6%", label: "ROC-AUC Score" },
              { value: "5,000+", label: "Training Samples" },
              { value: "SHAP", label: "Explainability" },
            ].map((s) => (
              <div
                key={s.label}
                className="rounded-xl bg-white/10 border border-white/10 px-4 py-3 backdrop-blur-sm"
              >
                <p className="text-2xl font-black text-white">{s.value}</p>
                <p className="text-xs text-slate-400 mt-0.5 font-medium uppercase tracking-wide">
                  {s.label}
                </p>
              </div>
            ))}
          </motion.div>
        </div>
      </div>

      {/* ── USER QUICK ACCESS ── */}
      {currentUser && (
        <div className="max-w-6xl mx-auto px-8 py-12">
          <motion.div {...fadeUp(0)}>
            <h2 className="text-xl font-bold text-slate-800 mb-6">
              {config.greeting}
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {config.quickLinks.map((link, i) => (
              <motion.div key={link.to} {...fadeUp(i * 0.07)}>
                <Link
                  to={link.to}
                  className="group flex flex-col gap-1 rounded-2xl bg-white border border-slate-200 p-5 shadow-sm hover:shadow-md hover:border-blue-300 hover:-translate-y-1 transition-all duration-200"
                >
                  <span className="text-base font-bold text-slate-800 group-hover:text-blue-600 transition-colors">
                    {link.label}
                  </span>
                  <span className="text-sm text-slate-500">{link.desc}</span>
                  <span className="mt-2 text-xs font-semibold text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity">
                    Open →
                  </span>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* ── ABOUT SECTION ── */}
      <div className="max-w-6xl mx-auto px-8 pb-8">
        <motion.div {...fadeUp(0)}>
          <h2 className="text-xl font-bold text-slate-800 mb-6">
            About AcademiGuard
          </h2>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-5">
          {[
            {
              tag: "Hybrid AI Model",
              title: "RF + XGBoost + LightGBM",
              desc: "Ensemble of three powerful models trained on 5,000 student records. Achieves 97.8% accuracy with 5-fold cross-validated AUC of 99.49%.",
              color: "border-blue-200 bg-blue-50/50",
              tagColor: "text-blue-600",
            },
            {
              tag: "Explainable AI",
              title: "SHAP-Powered Insights",
              desc: "Every prediction comes with feature-level explanations. Students and lecturers see exactly which factors drive academic risk — transparently.",
              color: "border-indigo-200 bg-indigo-50/50",
              tagColor: "text-indigo-600",
            },
            {
              tag: "What-If Analysis",
              title: "Next Semester Predictor",
              desc: "Simulate hypothetical improvements to see how changes in attendance, scores, or study hours would affect future risk — before it's too late.",
              color: "border-violet-200 bg-violet-50/50",
              tagColor: "text-violet-600",
            },
          ].map((card, i) => (
            <motion.div
              key={card.title}
              {...fadeUp(i * 0.1)}
              className={`rounded-2xl border p-6 ${card.color}`}
            >
              <p
                className={`text-xs font-bold uppercase tracking-wider ${card.tagColor}`}
              >
                {card.tag}
              </p>
              <h3 className="mt-2 text-base font-bold text-slate-800">
                {card.title}
              </h3>
              <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                {card.desc}
              </p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* ── WHO USES ── */}
      <div className="max-w-6xl mx-auto px-8 pb-12">
        <div className="rounded-3xl bg-gradient-to-br from-slate-800 to-slate-900 p-8 md:p-12">
          <h2 className="text-xl font-bold text-white mb-8 text-center">
            Designed for Everyone on Campus
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                emoji: "🎓",
                role: "Students",
                points: [
                  "Personal SHAP risk score",
                  "What-if semester predictor",
                  "Study recommendations",
                  "Workload & deadline tracker",
                ],
              },
              {
                emoji: "🧑‍🏫",
                role: "Lecturers",
                points: [
                  "Bulk student risk view",
                  "Color-coded risk table",
                  "Update marks in real-time",
                  "Auto risk recalculation",
                ],
              },
              {
                emoji: "⚙️",
                role: "Admins",
                points: [
                  "GRU disengagement model",
                  "RL intervention decisions",
                  "High-risk student support",
                  "Campus-wide monitoring",
                ],
              },
            ].map((u) => (
              <div
                key={u.role}
                className="rounded-2xl bg-white/5 border border-white/10 p-5"
              >
                <p className="text-2xl mb-2">{u.emoji}</p>
                <h3 className="text-base font-bold text-white mb-3">
                  {u.role}
                </h3>
                <ul className="space-y-1.5">
                  {u.points.map((p) => (
                    <li key={p} className="text-sm text-slate-400 flex gap-2">
                      <span className="text-blue-400 mt-0.5">✓</span>
                      {p}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── FOOTER ── */}
      <div className="text-center pb-10 text-slate-400 text-xs">
        <p>
          AcademiGuard · Research Project 25-26J-172 · AI-Based Academic Risk
          Intelligence
        </p>
        <p className="mt-1">
          Hybrid Ensemble Model · SHAP Explainability · Real-Time Predictions
        </p>
      </div>
    </div>
  );
}

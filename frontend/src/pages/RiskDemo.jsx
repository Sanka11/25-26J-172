import { Link } from "react-router-dom";

export default function RiskDemo() {
  return (
    <div className="space-y-16">
      {/* ================= HERO ================= */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-700 via-blue-700 to-sky-600 px-10 py-16 text-white shadow-xl">
        <div className="max-w-4xl">
          <h1 className="text-4xl font-extrabold tracking-tight">
            AcademiGuard
          </h1>

          <p className="mt-4 text-lg text-blue-100 leading-relaxed">
            An intelligent academic risk monitoring and early-warning platform
            designed to help universities identify, track, and reduce student
            academic risk using AI-driven insights.
          </p>

          <div className="mt-8 flex flex-wrap gap-4">
            <Link
              to="/student-risk"
              className="rounded-full bg-white px-6 py-3 text-sm font-semibold text-blue-700 shadow hover:bg-blue-50"
            >
              View My Risk Timeline
            </Link>

            <Link
              to="/live-risk"
              className="rounded-full border border-white/30 px-6 py-3 text-sm font-semibold text-white hover:bg-white/10"
            >
              Live Risk Dashboard
            </Link>
          </div>
        </div>

        {/* Decorative gradient blur */}
        <div className="absolute -right-32 -top-32 h-96 w-96 rounded-full bg-white/10 blur-3xl" />
      </section>

      {/* ================= ABOUT ================= */}
      <section className="max-w-6xl mx-auto grid gap-10 md:grid-cols-3">
        <div className="rounded-2xl bg-white border border-slate-200 p-6 shadow-sm">
          <p className="text-xs font-semibold text-blue-600 uppercase">
            Early Detection
          </p>
          <h3 className="mt-2 text-lg font-bold text-slate-800">
            Identify At-Risk Students
          </h3>
          <p className="mt-2 text-sm text-slate-600">
            AcademiGuard analyzes academic performance, attendance, engagement,
            and behavioral data to identify students who may require early
            intervention.
          </p>
        </div>

        <div className="rounded-2xl bg-white border border-slate-200 p-6 shadow-sm">
          <p className="text-xs font-semibold text-blue-600 uppercase">
            Explainable AI
          </p>
          <h3 className="mt-2 text-lg font-bold text-slate-800">
            Transparent Decisions
          </h3>
          <p className="mt-2 text-sm text-slate-600">
            Risk predictions are supported by explainable machine learning,
            allowing lecturers and administrators to understand *why* a student
            is classified as high or low risk.
          </p>
        </div>

        <div className="rounded-2xl bg-white border border-slate-200 p-6 shadow-sm">
          <p className="text-xs font-semibold text-blue-600 uppercase">
            Temporal Tracking
          </p>
          <h3 className="mt-2 text-lg font-bold text-slate-800">
            Semester-Wise Monitoring
          </h3>
          <p className="mt-2 text-sm text-slate-600">
            Track student risk progression across semesters to observe
            improvement, stability, or deterioration over time.
          </p>
        </div>
      </section>

      {/* ================= WHO USES ================= */}
      <section className="max-w-6xl mx-auto rounded-3xl bg-slate-100 px-10 py-12">
        <h2 className="text-2xl font-bold text-slate-800 text-center">
          Who Uses AcademiGuard?
        </h2>

        <div className="mt-10 grid gap-8 md:grid-cols-2">
          <div className="rounded-2xl bg-white p-6 border border-slate-200">
            <h3 className="text-lg font-semibold text-slate-800">
              🎓 Students
            </h3>
            <ul className="mt-3 space-y-2 text-sm text-slate-600 list-disc list-inside">
              <li>View personal academic risk timeline</li>
              <li>Understand risk trends across semesters</li>
              <li>Receive early warnings and guidance</li>
            </ul>
          </div>

          <div className="rounded-2xl bg-white p-6 border border-slate-200">
            <h3 className="text-lg font-semibold text-slate-800">
              🧑‍🏫 Lecturers & Admins
            </h3>
            <ul className="mt-3 space-y-2 text-sm text-slate-600 list-disc list-inside">
              <li>Monitor cohort-level academic risk</li>
              <li>Analyze explainable risk factors</li>
              <li>Design timely academic interventions</li>
            </ul>
          </div>
        </div>
      </section>

      {/* ================= FOOTER CTA ================= */}
      <section className="text-center pb-10">
        <p className="text-sm text-slate-600">
          AcademiGuard – Research-Driven Academic Risk Intelligence Platform
        </p>
        <p className="mt-1 text-xs text-slate-400">
          Developed as part of an AI-based academic performance monitoring
          system
        </p>
      </section>
    </div>
  );
}

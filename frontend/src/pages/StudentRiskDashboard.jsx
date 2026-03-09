import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import {
  getStudentRiskExplanation,
  getStudentRiskHistory,
} from "../services/api/mlApi";
import NextSemesterPredictor from "../componets/NextSemesterPredictor";

// ── PDF Generator ──
async function generateRiskReportPDF(riskData, historyData, studentId) {
  // Load jsPDF from CDN via script tag injection
  if (!window.jspdf) {
    await new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src =
        "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js";
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

  const W = 210; // A4 width mm
  const MARGIN = 18;
  const COL = W - MARGIN * 2;
  let y = 0;

  // ── Color helpers ──
  const colorMap = {
    red: [239, 68, 68],
    amber: [245, 158, 11],
    green: [34, 197, 94],
  };
  const riskColor = colorMap[riskData.risk_color] || [107, 114, 128];
  const levelBg = {
    High: [254, 242, 242],
    Medium: [255, 251, 235],
    Low: [240, 253, 244],
  };

  // ── Header banner ──
  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, W, 28, "F");

  // Shield icon (simplified)
  doc.setFillColor(37, 99, 235);
  doc.roundedRect(MARGIN, 7, 12, 14, 2, 2, "F");
  doc.setFillColor(96, 165, 250);
  doc.roundedRect(MARGIN + 2, 9, 8, 10, 1, 1, "F");
  doc.setDrawColor(255, 255, 255);
  doc.setLineWidth(0.8);
  doc.line(MARGIN + 4, 14.5, MARGIN + 6, 17);
  doc.line(MARGIN + 6, 17, MARGIN + 10, 12.5);

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text("AcademiGuard", MARGIN + 16, 16);
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(148, 163, 184);
  doc.text("Student Risk & Explainability Report", MARGIN + 16, 22);

  // Timestamp top right
  const now = new Date().toLocaleString("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  });
  doc.setFontSize(7);
  doc.text(`Generated: ${now}`, W - MARGIN, 22, { align: "right" });

  y = 38;

  // ── Student Info Row ──
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(MARGIN, y, COL, 18, 3, 3, "F");
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.3);
  doc.roundedRect(MARGIN, y, COL, 18, 3, 3, "S");

  doc.setTextColor(30, 41, 59);
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text(`Student ID: ${studentId}`, MARGIN + 5, y + 7);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text(
    `Academic Year: ${riskData.year || 2025}  |  Semester: ${riskData.semester || "Semester 1"}`,
    MARGIN + 5,
    y + 13,
  );

  y += 24;

  // ── Risk Score Section ──
  doc.setFillColor(...(levelBg[riskData.risk_level] || [248, 250, 252]));
  doc.roundedRect(MARGIN, y, COL, 32, 3, 3, "F");
  doc.setDrawColor(...riskColor);
  doc.setLineWidth(0.5);
  doc.roundedRect(MARGIN, y, COL, 32, 3, 3, "S");

  // Big percentage
  doc.setTextColor(...riskColor);
  doc.setFontSize(32);
  doc.setFont("helvetica", "bold");
  doc.text(`${riskData.risk_percentage}%`, MARGIN + 8, y + 20);

  // Risk level badge
  doc.setFillColor(...riskColor);
  doc.roundedRect(MARGIN + 38, y + 8, 28, 8, 2, 2, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.text(`${riskData.risk_level} Risk`, MARGIN + 40, y + 13.5);

  // Headline
  const headlines = {
    High: "Immediate attention needed",
    Medium: "Monitor your progress",
    Low: "You are on track!",
  };
  doc.setTextColor(30, 41, 59);
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text(headlines[riskData.risk_level] || "", MARGIN + 72, y + 13);

  // Summary bullet points
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  const summaryLines = riskData.explanation?.summary_text || [];
  summaryLines.slice(0, 3).forEach((line, i) => {
    doc.text(`• ${line}`, MARGIN + 72, y + 20 + i * 5);
  });

  y += 38;

  // ── SHAP Analysis Section ──
  doc.setTextColor(30, 41, 59);
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("SHAP Feature Impact Analysis", MARGIN, y + 6);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text("How each factor influences your risk score", MARGIN, y + 12);
  y += 17;

  // Two-column layout: Risk Factors | Protective Factors
  const halfW = (COL - 5) / 2;

  // Risk Factors column
  doc.setFillColor(254, 242, 242);
  doc.roundedRect(MARGIN, y, halfW, 6, 1.5, 1.5, "F");
  doc.setTextColor(185, 28, 28);
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.text("Factors Increasing Risk", MARGIN + 3, y + 4.2);
  y += 8;

  const riskFactors = riskData.explanation?.risk_factors || [];
  const maxRisk = Math.max(
    ...riskFactors.map((f) => Math.abs(f.impact)),
    0.001,
  );
  riskFactors.slice(0, 5).forEach((f, i) => {
    const rowY = y + i * 10;
    const barW = (Math.abs(f.impact) / maxRisk) * (halfW - 50);

    doc.setTextColor(51, 65, 85);
    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    doc.text(f.display_name, MARGIN, rowY + 4, { maxWidth: 38 });

    // Bar background
    doc.setFillColor(254, 226, 226);
    doc.roundedRect(MARGIN + 40, rowY, halfW - 50, 5, 1, 1, "F");
    // Bar fill
    doc.setFillColor(239, 68, 68);
    if (barW > 0) doc.roundedRect(MARGIN + 40, rowY, barW, 5, 1, 1, "F");
    // Percentage
    doc.setTextColor(100, 116, 139);
    doc.setFontSize(6.5);
    doc.text(
      `${(Math.abs(f.impact) * 100).toFixed(1)}%`,
      MARGIN + halfW - 6,
      rowY + 4,
      { align: "right" },
    );
  });

  // Protective Factors column
  const col2X = MARGIN + halfW + 5;
  let col2Y = y - 8;

  doc.setFillColor(240, 253, 244);
  doc.roundedRect(col2X, col2Y, halfW, 6, 1.5, 1.5, "F");
  doc.setTextColor(21, 128, 61);
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.text("Factors Reducing Risk", col2X + 3, col2Y + 4.2);
  col2Y += 8;

  const protFactors = riskData.explanation?.protective_factors || [];
  const maxProt = Math.max(
    ...protFactors.map((f) => Math.abs(f.impact)),
    0.001,
  );
  protFactors.slice(0, 5).forEach((f, i) => {
    const rowY = col2Y + i * 10;
    const barW = (Math.abs(f.impact) / maxProt) * (halfW - 50);

    doc.setTextColor(51, 65, 85);
    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    doc.text(f.display_name, col2X, rowY + 4, { maxWidth: 38 });

    doc.setFillColor(220, 252, 231);
    doc.roundedRect(col2X + 40, rowY, halfW - 50, 5, 1, 1, "F");
    doc.setFillColor(34, 197, 94);
    if (barW > 0) doc.roundedRect(col2X + 40, rowY, barW, 5, 1, 1, "F");
    doc.setTextColor(100, 116, 139);
    doc.setFontSize(6.5);
    doc.text(
      `${(Math.abs(f.impact) * 100).toFixed(1)}%`,
      col2X + halfW - 6,
      rowY + 4,
      { align: "right" },
    );
  });

  y +=
    Math.max(riskFactors.slice(0, 5).length, protFactors.slice(0, 5).length) *
      10 +
    8;

  // ── Semester History Table ──
  if (historyData?.history?.length) {
    doc.setTextColor(30, 41, 59);
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text("Semester Risk History", MARGIN, y + 6);
    y += 12;

    // Table header
    doc.setFillColor(30, 41, 59);
    doc.rect(MARGIN, y, COL, 7, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(7.5);
    doc.setFont("helvetica", "bold");
    const cols = [
      MARGIN + 3,
      MARGIN + 30,
      MARGIN + 65,
      MARGIN + 100,
      MARGIN + 140,
    ];
    const headers = ["Semester Key", "Year", "Semester", "Risk %", "Level"];
    headers.forEach((h, i) => doc.text(h, cols[i], y + 4.8));
    y += 7;

    historyData.history.forEach((entry, i) => {
      const rowBg = i % 2 === 0 ? [248, 250, 252] : [255, 255, 255];
      doc.setFillColor(...rowBg);
      doc.rect(MARGIN, y, COL, 7, "F");

      const lvlColor =
        entry.risk_level === "High"
          ? [239, 68, 68]
          : entry.risk_level === "Medium"
            ? [245, 158, 11]
            : [34, 197, 94];

      doc.setTextColor(71, 85, 105);
      doc.setFontSize(7);
      doc.setFont("helvetica", "normal");
      doc.text(entry.semester_key || "—", cols[0], y + 4.8);
      doc.text(String(entry.year || "—"), cols[1], y + 4.8);
      doc.text(entry.semester || "—", cols[2], y + 4.8);
      doc.setTextColor(...lvlColor);
      doc.setFont("helvetica", "bold");
      doc.text(`${entry.risk_percentage ?? 0}%`, cols[3], y + 4.8);
      doc.text(entry.risk_level || "—", cols[4], y + 4.8);

      // Row border
      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.2);
      doc.line(MARGIN, y + 7, MARGIN + COL, y + 7);
      y += 7;
    });
    y += 5;
  }

  // ── Counterfactual / Recommendations ──
  if (
    riskData.risk_level !== "Low" &&
    riskData.explanation?.risk_factors?.length
  ) {
    doc.setTextColor(30, 41, 59);
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text("Recommended Actions to Reduce Risk", MARGIN, y + 6);
    y += 12;

    riskData.explanation.risk_factors.slice(0, 3).forEach((f, i) => {
      const current = f.value ?? 0;
      const target = Math.min(100, Math.round(current * 1.2 + 10));
      const msg = `${i + 1}. Improve ${f.display_name} from ${current} to ${target} — estimated ~${(Math.abs(f.impact) * 150).toFixed(0)}% risk reduction`;

      doc.setFillColor(239, 246, 255);
      doc.roundedRect(MARGIN, y, COL, 8, 1.5, 1.5, "F");
      doc.setTextColor(37, 99, 235);
      doc.setFontSize(7.5);
      doc.setFont("helvetica", "normal");
      doc.text(msg, MARGIN + 3, y + 5.2);
      y += 10;
    });
    y += 3;
  }

  // ── Footer ──
  const footerY = 287;
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.3);
  doc.line(MARGIN, footerY, W - MARGIN, footerY);
  doc.setTextColor(148, 163, 184);
  doc.setFontSize(7);
  doc.setFont("helvetica", "normal");
  doc.text(
    "AcademiGuard — Explainable AI Student Risk Prediction System",
    MARGIN,
    footerY + 4,
  );
  doc.text("Confidential — For academic use only", W - MARGIN, footerY + 4, {
    align: "right",
  });
  doc.text(
    `Model: ${riskData.model_version || "v4_hybrid"} | SHAP-based explanations`,
    MARGIN,
    footerY + 8,
  );

  // Save
  doc.save(
    `AcademiGuard_Risk_Report_${studentId}_${riskData.year || 2025}_${(riskData.semester || "S1").replace(" ", "")}.pdf`,
  );
}

// ── Risk Gauge ──
function RiskGauge({ percentage, color }) {
  const radius = 80;
  const circumference = 2 * Math.PI * radius;
  const colorMap = { red: "#ef4444", amber: "#f59e0b", green: "#22c55e" };
  const stroke = colorMap[color] || "#6b7280";
  const offset = circumference - (percentage / 100) * circumference;
  return (
    <div className="flex flex-col items-center">
      <svg width="200" height="200" className="-rotate-90">
        <circle
          cx="100"
          cy="100"
          r={radius}
          fill="none"
          stroke="#e2e8f0"
          strokeWidth="16"
        />
        <circle
          cx="100"
          cy="100"
          r={radius}
          fill="none"
          stroke={stroke}
          strokeWidth="16"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 1s ease" }}
        />
      </svg>
      <div className="-mt-32 flex flex-col items-center">
        <span className="text-4xl font-bold" style={{ color: stroke }}>
          {percentage}%
        </span>
        <span className="text-sm text-gray-500 mt-1">Risk Score</span>
      </div>
      <div className="mt-28" />
    </div>
  );
}

// ── Engagement Score ──
function EngagementScore({ riskData }) {
  const attendance = riskData?.Attendance_pct ?? 0;
  const participation = riskData?.Participation_Score ?? 0;
  const studyHours = Math.min(100, (riskData?.Study_Hours_per_Week ?? 0) * 4);
  const score = Math.round((attendance + participation + studyHours) / 3);
  const level = score >= 70 ? "High" : score >= 45 ? "Moderate" : "Low";
  const color = score >= 70 ? "#22c55e" : score >= 45 ? "#f59e0b" : "#ef4444";
  const bgColor =
    score >= 70
      ? "bg-green-50 border-green-200"
      : score >= 45
        ? "bg-amber-50 border-amber-200"
        : "bg-red-50 border-red-200";
  const metrics = [
    {
      label: "Attendance",
      value: Math.round(attendance),
      color: "bg-blue-400",
    },
    {
      label: "Participation",
      value: Math.round(participation),
      color: "bg-purple-400",
    },
    {
      label: "Study Hours",
      value: Math.round(studyHours),
      color: "bg-indigo-400",
    },
  ];
  return (
    <div className={`rounded-2xl border p-5 ${bgColor}`}>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-bold text-gray-700 text-sm">
            🎯 Engagement Score
          </h3>
          <p className="text-xs text-gray-500 mt-0.5">
            Attendance + Participation + Study Hours
          </p>
        </div>
        <div className="text-right">
          <div className="text-3xl font-black" style={{ color }}>
            {score}
          </div>
          <div className="text-xs font-semibold" style={{ color }}>
            {level} Engagement
          </div>
        </div>
      </div>
      <div className="space-y-2">
        {metrics.map((m) => (
          <div key={m.label}>
            <div className="flex justify-between text-xs text-gray-500 mb-1">
              <span>{m.label}</span>
              <span>{m.value}%</span>
            </div>
            <div className="w-full bg-white bg-opacity-60 rounded-full h-2">
              <div
                className={`h-2 rounded-full ${m.color}`}
                style={{ width: `${m.value}%`, transition: "width 1s ease" }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── SHAP Waterfall ──
function SHAPWaterfall({ riskFactors, protectiveFactors }) {
  if (!riskFactors?.length && !protectiveFactors?.length) return null;
  const all = [
    ...(riskFactors || []).slice(0, 4).map((f) => ({ ...f, type: "risk" })),
    ...(protectiveFactors || [])
      .slice(0, 3)
      .map((f) => ({ ...f, type: "protect" })),
  ].sort((a, b) => Math.abs(b.impact) - Math.abs(a.impact));
  const maxImpact = Math.max(...all.map((f) => Math.abs(f.impact)));
  return (
    <div className="space-y-3">
      {all.map((f, i) => {
        const pct = (Math.abs(f.impact) / maxImpact) * 100;
        const isRisk = f.type === "risk";
        return (
          <div key={i} className="flex items-center gap-3">
            <div className="w-32 text-xs text-gray-600 text-right truncate">
              {f.display_name}
            </div>
            <div className="flex-1 flex items-center gap-2">
              <div className="flex-1 bg-gray-100 rounded-full h-4 overflow-hidden">
                <div
                  className={`h-4 rounded-full flex items-center justify-end pr-2 ${
                    isRisk
                      ? "bg-gradient-to-r from-red-400 to-red-500"
                      : "bg-gradient-to-r from-green-400 to-green-500"
                  }`}
                  style={{ width: `${pct}%`, transition: "width 0.8s ease" }}
                >
                  {pct > 20 && (
                    <span className="text-white text-xs font-bold">
                      {(Math.abs(f.impact) * 100).toFixed(1)}%
                    </span>
                  )}
                </div>
              </div>
              {pct <= 20 && (
                <span className="text-xs font-semibold text-gray-500 w-10">
                  {(Math.abs(f.impact) * 100).toFixed(1)}%
                </span>
              )}
              <span
                className={`text-xs font-bold w-4 ${isRisk ? "text-red-500" : "text-green-500"}`}
              >
                {isRisk ? "↑" : "↓"}
              </span>
            </div>
          </div>
        );
      })}
      <div className="flex gap-4 pt-2 text-xs">
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm bg-red-400 inline-block" />{" "}
          Contributing to risk
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm bg-green-400 inline-block" />{" "}
          Protecting against risk
        </span>
      </div>
    </div>
  );
}

// ── Counterfactual Panel ──
function CounterfactualPanel({ riskData }) {
  if (!riskData?.explanation?.risk_factors?.length) return null;
  if (riskData.risk_level === "Low") return null;
  const topFactors = riskData.explanation.risk_factors.slice(0, 3);
  return (
    <div className="bg-white rounded-2xl shadow p-6 mb-6">
      <h3 className="font-bold text-gray-700 mb-1">
        🔍 How to Reduce Your Risk
      </h3>
      <p className="text-xs text-gray-400 mb-4">
        Based on your SHAP analysis — specific improvements that could change
        your risk level
      </p>
      <div className="space-y-3">
        {topFactors.map((f, i) => {
          const current = f.value ?? 0;
          const target = Math.min(100, Math.round(current * 1.2 + 10));
          const improvement = target - current;
          return (
            <div
              key={i}
              className="flex gap-3 p-3 bg-blue-50 border border-blue-100 rounded-xl"
            >
              <div className="flex-shrink-0 w-7 h-7 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">
                {i + 1}
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-gray-700">
                  Improve {f.display_name} by {improvement} points ({current} →{" "}
                  {target})
                </p>
                <p className="text-xs text-blue-600 mt-0.5 font-medium">
                  → Could reduce your risk by ~
                  {(Math.abs(f.impact) * 150).toFixed(0)}%
                </p>
              </div>
              <div className="text-right flex-shrink-0">
                <div className="text-xs text-gray-400">Est. impact</div>
                <div className="text-sm font-bold text-blue-600">
                  ~{(Math.abs(f.impact) * 150).toFixed(0)}%↓
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <p className="text-xs text-gray-400 mt-3 italic">
        * Estimates based on SHAP feature importance. Actual results may vary.
      </p>
    </div>
  );
}

// ── Risk Line Chart ──
function RiskLineChart({ history }) {
  if (!history || history.length === 0) return null;
  const W = 600,
    H = 200;
  const PAD = { top: 20, right: 30, bottom: 40, left: 50 };
  const chartW = W - PAD.left - PAD.right;
  const chartH = H - PAD.top - PAD.bottom;
  const points = history.filter((h) => h.risk_percentage !== null);
  if (points.length === 0) return null;
  const xStep = chartW / Math.max(points.length - 1, 1);
  const yScale = (val) => chartH - (val / 100) * chartH;
  const pathD = points
    .map(
      (p, i) =>
        `${i === 0 ? "M" : "L"} ${PAD.left + i * xStep} ${PAD.top + yScale(p.risk_percentage)}`,
    )
    .join(" ");
  const areaD =
    pathD +
    ` L ${PAD.left + (points.length - 1) * xStep} ${PAD.top + chartH} L ${PAD.left} ${PAD.top + chartH} Z`;
  const getRiskColor = (pct) =>
    pct >= 70 ? "#ef4444" : pct >= 40 ? "#f59e0b" : "#22c55e";
  return (
    <div className="w-full overflow-x-auto">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full"
        style={{ minWidth: 300 }}
      >
        {[0, 25, 50, 75, 100].map((v) => (
          <g key={v}>
            <line
              x1={PAD.left}
              x2={W - PAD.right}
              y1={PAD.top + yScale(v)}
              y2={PAD.top + yScale(v)}
              stroke="#e2e8f0"
              strokeWidth="1"
              strokeDasharray="4 4"
            />
            <text
              x={PAD.left - 8}
              y={PAD.top + yScale(v) + 4}
              fontSize="10"
              fill="#94a3b8"
              textAnchor="end"
            >
              {v}%
            </text>
          </g>
        ))}
        <rect
          x={PAD.left}
          y={PAD.top}
          width={chartW}
          height={yScale(40) - yScale(100)}
          fill="#fef2f2"
          opacity="0.4"
        />
        <rect
          x={PAD.left}
          y={PAD.top + yScale(70)}
          width={chartW}
          height={yScale(40) - yScale(70)}
          fill="#fffbeb"
          opacity="0.4"
        />
        <rect
          x={PAD.left}
          y={PAD.top + yScale(40)}
          width={chartW}
          height={yScale(0) - yScale(40)}
          fill="#f0fdf4"
          opacity="0.4"
        />
        <defs>
          <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#6366f1" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#6366f1" stopOpacity="0.02" />
          </linearGradient>
        </defs>
        <path d={areaD} fill="url(#areaGrad)" />
        <path
          d={pathD}
          fill="none"
          stroke="#6366f1"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {points.map((p, i) => {
          const x = PAD.left + i * xStep;
          const y = PAD.top + yScale(p.risk_percentage);
          return (
            <g key={i}>
              <circle
                cx={x}
                cy={y}
                r="6"
                fill={getRiskColor(p.risk_percentage)}
                stroke="white"
                strokeWidth="2"
              />
              <text
                x={x}
                y={y - 10}
                fontSize="10"
                fill="#475569"
                textAnchor="middle"
                fontWeight="600"
              >
                {p.risk_percentage}%
              </text>
            </g>
          );
        })}
        {points.map((p, i) => (
          <text
            key={i}
            x={PAD.left + i * xStep}
            y={H - 8}
            fontSize="10"
            fill="#64748b"
            textAnchor="middle"
          >
            {p.year} {p.semester === "Semester 1" ? "S1" : "S2"}
          </text>
        ))}
      </svg>
    </div>
  );
}

// ── Semester Card ──
function SemesterCard({ entry, isCurrent }) {
  const colorMap = {
    High: {
      bg: "bg-red-50 border-red-200",
      badge: "bg-red-100 text-red-700",
      bar: "bg-red-400",
    },
    Medium: {
      bg: "bg-amber-50 border-amber-200",
      badge: "bg-amber-100 text-amber-700",
      bar: "bg-amber-400",
    },
    Low: {
      bg: "bg-green-50 border-green-200",
      badge: "bg-green-100 text-green-700",
      bar: "bg-green-400",
    },
  };
  const c = colorMap[entry.risk_level] || colorMap["Low"];
  const pct = entry.risk_percentage ?? 0;
  return (
    <div
      className={`rounded-xl border p-4 ${c.bg} ${isCurrent ? "ring-2 ring-indigo-400 ring-offset-1" : ""}`}
    >
      <div className="flex items-center justify-between mb-3">
        <div>
          <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">
            {entry.semester}
          </span>
          {isCurrent && (
            <span className="ml-2 text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full font-semibold">
              Current
            </span>
          )}
        </div>
        <span
          className={`text-xs font-semibold px-2 py-1 rounded-full ${c.badge}`}
        >
          {entry.risk_level} Risk
        </span>
      </div>
      <div className="flex items-center gap-3">
        <div className="flex-1 bg-gray-200 rounded-full h-3">
          <div
            className={`h-3 rounded-full ${c.bar}`}
            style={{ width: `${pct}%`, transition: "width 1s ease" }}
          />
        </div>
        <span className="text-lg font-bold text-gray-700">{pct}%</span>
      </div>
      {entry.explanation?.summary_text?.[0] && (
        <p className="text-xs text-gray-500 mt-2 line-clamp-2">
          {entry.explanation.summary_text[0]}
        </p>
      )}
    </div>
  );
}

// ── Past Year Accordion ──
function PastYearAccordion({ year, semesters }) {
  const [open, setOpen] = useState(false);
  const avgRisk =
    semesters.reduce((s, e) => s + (e.risk_percentage ?? 0), 0) /
    semesters.length;
  const trend =
    semesters.length >= 2
      ? semesters[1].risk_percentage - semesters[0].risk_percentage
      : 0;
  return (
    <div className="bg-white rounded-xl shadow border border-gray-100 overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-4">
          <span className="font-bold text-gray-700">{year}</span>
          <span className="text-xs text-gray-400">
            Avg Risk: {avgRisk.toFixed(0)}%
          </span>
          {trend !== 0 && (
            <span
              className={`text-xs font-semibold ${trend > 0 ? "text-red-500" : "text-green-500"}`}
            >
              {trend > 0 ? `↑ +${trend.toFixed(0)}%` : `↓ ${trend.toFixed(0)}%`}{" "}
              S1→S2
            </span>
          )}
        </div>
        <span className="text-gray-400">{open ? "▲" : "▼"}</span>
      </button>
      {open && (
        <div className="px-5 pb-5 border-t border-gray-100 pt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
          {semesters.map((s) => (
            <SemesterCard key={s.semester_key} entry={s} isCurrent={false} />
          ))}
        </div>
      )}
    </div>
  );
}

// ── Main Dashboard ──
export default function StudentRiskDashboard() {
  const { userData } = useAuth();
  const studentId = userData?.student_id || userData?.studentId || "S1000";

  const [riskData, setRiskData] = useState(null);
  const [historyData, setHistoryData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showPredictor, setShowPredictor] = useState(false);
  const [activeTab, setActiveTab] = useState("current");
  const [pdfLoading, setPdfLoading] = useState(false);

  useEffect(() => {
    async function fetchAll() {
      try {
        setLoading(true);
        const [risk, history] = await Promise.allSettled([
          getStudentRiskExplanation(studentId),
          getStudentRiskHistory(studentId),
        ]);
        if (risk.status === "fulfilled") setRiskData(risk.value);
        else if (risk.reason?.response?.status === 404) setError("no_data");
        else setError("failed");
        if (history.status === "fulfilled") setHistoryData(history.value);
      } catch {
        setError("failed");
      } finally {
        setLoading(false);
      }
    }
    fetchAll();
  }, [studentId]);

  async function handleDownloadPDF() {
    setPdfLoading(true);
    try {
      await generateRiskReportPDF(riskData, historyData, studentId);
    } catch (e) {
      console.error("PDF generation failed:", e);
      alert("PDF generation failed. Please try again.");
    } finally {
      setPdfLoading(false);
    }
  }

  if (loading)
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
          <p className="text-gray-500">Loading your risk profile...</p>
        </div>
      </div>
    );

  if (error === "no_data")
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center bg-white rounded-2xl shadow p-10 max-w-md">
          <div className="text-6xl mb-4">📊</div>
          <h2 className="text-xl font-bold text-gray-700 mb-2">
            No Risk Data Yet
          </h2>
          <p className="text-gray-500 text-sm">
            Your risk prediction hasn't been generated yet. Please contact your
            lecturer.
          </p>
        </div>
      </div>
    );

  if (error === "failed")
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center bg-white rounded-2xl shadow p-10 max-w-md">
          <div className="text-6xl mb-4">⚠️</div>
          <h2 className="text-xl font-bold text-gray-700 mb-2">
            Something went wrong
          </h2>
          <p className="text-gray-500 text-sm">
            Unable to load risk data. Please try again later.
          </p>
        </div>
      </div>
    );

  const { risk_percentage, risk_level, risk_color, explanation } = riskData;
  const colorBg = {
    red: "bg-red-50 border-red-200",
    amber: "bg-amber-50 border-amber-200",
    green: "bg-green-50 border-green-200",
  };
  const colorText = {
    red: "text-red-700",
    amber: "text-amber-700",
    green: "text-green-700",
  };
  const colorBadge = {
    red: "bg-red-100 text-red-700",
    amber: "bg-amber-100 text-amber-700",
    green: "bg-green-100 text-green-700",
  };

  const currentYear = historyData?.current_year;
  const pastYears = historyData?.past_years || [];
  const grouped = historyData?.grouped || {};
  const currentYearSemesters = currentYear ? grouped[currentYear] || [] : [];
  const allHistory = historyData?.history || [];

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header + PDF Button */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">
              My Risk Profile
            </h1>
            <p className="text-gray-500 text-sm mt-1">
              Based on your academic performance and engagement data.
            </p>
          </div>
          <button
            onClick={handleDownloadPDF}
            disabled={pdfLoading}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white text-sm font-semibold rounded-xl shadow transition-all"
          >
            {pdfLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />{" "}
                Generating...
              </>
            ) : (
              <>
                <span>📄</span> Download Report
              </>
            )}
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 bg-white rounded-xl shadow p-1 w-fit">
          {[
            { key: "current", label: "📊 Current" },
            { key: "history", label: "📈 History" },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all ${
                activeTab === tab.key
                  ? "bg-indigo-600 text-white shadow"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* ── CURRENT TAB ── */}
        {activeTab === "current" && (
          <>
            {/* Main Risk Card */}
            <div
              className={`bg-white rounded-2xl shadow border p-6 mb-6 ${colorBg[risk_color]}`}
            >
              <div className="flex flex-col md:flex-row items-center gap-8">
                <RiskGauge percentage={risk_percentage} color={risk_color} />
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3 flex-wrap">
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-semibold ${colorBadge[risk_color]}`}
                    >
                      {risk_level} Risk
                    </span>
                    {riskData.semester && (
                      <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded-full">
                        {riskData.year} · {riskData.semester}
                      </span>
                    )}
                    {riskData.model_version && (
                      <span className="text-xs text-indigo-400 bg-indigo-50 px-2 py-1 rounded-full font-mono">
                        {riskData.model_version}
                      </span>
                    )}
                  </div>
                  <h2
                    className={`text-2xl font-bold mb-3 ${colorText[risk_color]}`}
                  >
                    {risk_level === "High" && "Immediate attention needed"}
                    {risk_level === "Medium" && "Monitor your progress"}
                    {risk_level === "Low" && "You are on track! 🎉"}
                  </h2>
                  <ul className="space-y-1">
                    {explanation?.summary_text?.map((line, i) => (
                      <li
                        key={i}
                        className="text-sm text-gray-600 flex items-start gap-2"
                      >
                        <span className="mt-1">•</span> {line}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            {/* Engagement + Semester Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <EngagementScore riskData={riskData} />
              {currentYearSemesters.length > 0 && (
                <div className="bg-white rounded-2xl shadow p-5">
                  <h3 className="font-semibold text-gray-700 mb-3 text-sm">
                    📅 {currentYear} — Semester Overview
                  </h3>
                  <div className="space-y-3">
                    {currentYearSemesters.map((s) => (
                      <SemesterCard
                        key={s.semester_key}
                        entry={s}
                        isCurrent={
                          s.semester === riskData.semester &&
                          s.year === riskData.year
                        }
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* SHAP Waterfall */}
            <div className="bg-white rounded-2xl shadow p-6 mb-6">
              <h3 className="font-bold text-gray-700 mb-1">
                Feature Impact Analysis
              </h3>
              <p className="text-xs text-gray-400 mb-4">
                How each factor influences your risk score
              </p>
              <SHAPWaterfall
                riskFactors={explanation?.risk_factors}
                protectiveFactors={explanation?.protective_factors}
              />
            </div>

            {/* Counterfactual */}
            <CounterfactualPanel riskData={riskData} />

            {/* Recommendation note */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6 text-sm text-blue-700">
              💡 For personalised recommendations based on your risk profile,
              refer to the <strong>Recommendation Module</strong>.
            </div>

            {/* What If Predictor */}
            <div className="bg-white rounded-2xl shadow p-6">
              <button
                onClick={() => setShowPredictor(!showPredictor)}
                className="w-full flex justify-between items-center text-left"
              >
                <div>
                  <h3 className="font-semibold text-gray-700">
                    🔮 What If Next Semester?
                  </h3>
                  <p className="text-xs text-gray-500 mt-1">
                    Simulate how changes to your habits could affect your risk
                    score.
                  </p>
                </div>
                <span className="text-gray-400 text-xl">
                  {showPredictor ? "▲" : "▼"}
                </span>
              </button>
              {showPredictor && (
                <div className="mt-4 border-t pt-4">
                  <NextSemesterPredictor />
                </div>
              )}
            </div>
          </>
        )}

        {/* ── HISTORY TAB ── */}
        {activeTab === "history" && (
          <>
            {allHistory.length === 0 ? (
              <div className="bg-white rounded-2xl shadow p-10 text-center text-gray-400">
                <div className="text-4xl mb-3">📭</div>
                <p>No historical data available yet.</p>
              </div>
            ) : (
              <>
                <div className="bg-white rounded-2xl shadow p-6 mb-6">
                  <h3 className="font-semibold text-gray-700 mb-1">
                    📈 Risk Trend Over Time
                  </h3>
                  <p className="text-xs text-gray-400 mb-4">
                    Your academic risk journey across all semesters
                  </p>
                  <div className="flex gap-4 mb-4 text-xs">
                    <span className="flex items-center gap-1">
                      <span className="w-3 h-3 rounded-full bg-red-400 inline-block" />{" "}
                      High Risk (≥70%)
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-3 h-3 rounded-full bg-amber-400 inline-block" />{" "}
                      Medium (40–69%)
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-3 h-3 rounded-full bg-green-400 inline-block" />{" "}
                      Low (&lt;40%)
                    </span>
                  </div>
                  <RiskLineChart history={allHistory} />
                </div>

                {allHistory.length >= 2 &&
                  (() => {
                    const first = allHistory[0].risk_percentage;
                    const last =
                      allHistory[allHistory.length - 1].risk_percentage;
                    const diff = last - first;
                    const improved = diff < 0;
                    return (
                      <div
                        className={`rounded-xl p-4 mb-6 border ${improved ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"}`}
                      >
                        <p
                          className={`text-sm font-semibold ${improved ? "text-green-700" : "text-red-700"}`}
                        >
                          {improved
                            ? `📉 Overall trend: Risk improved by ${Math.abs(diff)}% since ${allHistory[0].year} ${allHistory[0].semester}`
                            : `📈 Overall trend: Risk increased by ${Math.abs(diff)}% since ${allHistory[0].year} ${allHistory[0].semester}`}
                        </p>
                      </div>
                    );
                  })()}

                {currentYear && currentYearSemesters.length > 0 && (
                  <div className="bg-white rounded-2xl shadow p-6 mb-4">
                    <div className="flex items-center gap-3 mb-4">
                      <h3 className="font-semibold text-gray-700">
                        📅 {currentYear} — Current Year
                      </h3>
                      <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full font-semibold">
                        Active
                      </span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {currentYearSemesters.map((s) => (
                        <SemesterCard
                          key={s.semester_key}
                          entry={s}
                          isCurrent={
                            s.semester === riskData.semester &&
                            s.year === riskData.year
                          }
                        />
                      ))}
                    </div>
                  </div>
                )}

                {pastYears.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-gray-600 mb-3 text-sm uppercase tracking-wide">
                      Past Years
                    </h3>
                    <div className="space-y-3">
                      {pastYears.map((year) => (
                        <PastYearAccordion
                          key={year}
                          year={year}
                          semesters={grouped[year] || []}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}

import React, { useEffect, useState } from "react";
import {
  GraduationCap,
  Calendar as CalendarIcon,
  Activity,
  BookOpen,
  Clock,
  Grid,
  AlertTriangle,
  CheckCircle,
  Circle, // Added for pending status
  X,
  Loader,
  Sparkles,
  FileDown,
  HelpCircle,
  Zap,
  Coffee,
  CalendarDays,
} from "lucide-react";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import WorkloadCalendar from "../componets/WorkloadCalendar";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

import {
  fetchWeeklyWorkload,
  fetchLectureAlerts,
  fetchStudentEnrollment,
  generateWorkloadIfNeeded,
  fetchActiveReminders,
  dismissReminder,
  generateBusyWeekReminders,
} from "../services/api/workloadService";

/* ---------------- HELPERS ---------------- */

const fetchSystemConfig = async () => {
  return new Promise((resolve) => {
    // Note: Adjust this date if you want the "Current Week" math to change
    setTimeout(() => resolve({ semesterStartDate: "2025-12-15" }), 800);
  });
};

const groupTimetableByDay = (timetable) => {
  if (!timetable || !Array.isArray(timetable)) return [];
  const grouped = timetable.reduce((acc, item) => {
    const day = item.day;
    if (!acc[day]) {
      acc[day] = {
        day: day,
        tasks: [{ subject: item.subject, task: item.task, hours: item.hours }],
      };
    } else {
      acc[day].tasks.push({
        subject: item.subject,
        task: item.task,
        hours: item.hours,
      });
    }
    return acc;
  }, {});
  return Object.values(grouped).sort((a, b) => a.day - b.day);
};

function calculateAcademicWeek(semesterStartDate, targetDate = new Date()) {
  if (!semesterStartDate) return 1;
  const start = new Date(semesterStartDate);
  const today = new Date(targetDate);
  start.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);
  const diffDays = Math.floor(
    (today.getTime() - start.getTime()) / (1000 * 60 * 60 * 24),
  );
  return Math.max(1, Math.floor(diffDays / 7) + 1);
}

function getAcademicPeriod(semesterStartDate) {
  if (!semesterStartDate) return { month: "", year: "", semester: "" };
  const start = new Date(semesterStartDate);
  const today = new Date();
  return {
    month: today.toLocaleDateString("en-US", { month: "long" }),
    year: today.getFullYear(),
    semester: `${start.getMonth() < 6 ? "Spring" : "Fall"} ${start.getFullYear()}`,
  };
}

const formatTaskType = (type) => {
  if (!type) return "Task";
  return type
    .replace(/_/g, " ")
    .replace(
      /\w\S*/g,
      (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase(),
    );
};

function calculateWorkloadStats(weeklyWorkload) {
  const stats = {
    totalWeeks: weeklyWorkload.length,
    packedWeeks: 0,
    upcomingPackedWeeks: [],
  };
  if (!Array.isArray(weeklyWorkload)) return stats;

  weeklyWorkload.forEach((week) => {
    if (["BUSY", "HEAVY", "OVERLOADED"].includes(week.status)) {
      stats.packedWeeks++;
      const weekStart = week.weekStart?._seconds
        ? new Date(week.weekStart._seconds * 1000)
        : new Date(week.weekStart);
      if (weekStart > new Date()) {
        stats.upcomingPackedWeeks.push({
          week: week.week,
          weekStart: weekStart,
          status: "PACKED",
          totalHours: week.totalHours,
          breakdown: week.breakdown || [],
        });
      }
    }
  });
  stats.upcomingPackedWeeks.sort((a, b) => a.weekStart - b.weekStart);
  return stats;
}

/* ---------------- PDF GENERATION ---------------- */
const generatePDF = (reminder, userEmail, academicPeriod) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();

  doc.setFillColor(239, 68, 68);
  doc.rect(0, 0, pageWidth, 40, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.setFont("helvetica", "bold");
  doc.text("📚 Busy Week Study Plan", pageWidth / 2, 25, { align: "center" });

  doc.setTextColor(0, 0, 0);
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text(`Week ${reminder.targetBusyWeek} Study Schedule`, 20, 55);

  doc.setFontSize(12);
  doc.setFont("helvetica", "normal");
  doc.text(`Student: ${userEmail || "Student"}`, 20, 65);

  const weekStartDateString = reminder.targetWeekStart
    ? new Date(reminder.targetWeekStart).toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "TBD";
  doc.text(`Week Starts: ${weekStartDateString}`, 20, 75);
  doc.text(`Total Hours: ${reminder.targetTotalHours} hours`, 20, 85);

  if (reminder.timetable && reminder.timetable.length > 0) {
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("Recommended Daily Timetable", 20, 100);

    const tableData = [];
    const groupedData = groupTimetableByDay(reminder.timetable);

    groupedData.forEach((group) => {
      group.tasks.forEach((t, idx) => {
        tableData.push([
          idx === 0 ? `Day ${group.day}` : "",
          t.subject,
          t.task,
          `${t.hours}h`,
        ]);
      });
    });

    autoTable(doc, {
      startY: 105,
      head: [["Day", "Subject", "Task", "Duration"]],
      body: tableData,
      theme: "striped",
      headStyles: {
        fillColor: [239, 68, 68],
        textColor: [255, 255, 255],
        fontStyle: "bold",
      },
      styles: { fontSize: 10, cellPadding: 5 },
      columnStyles: {
        0: { cellWidth: 25 },
        1: { cellWidth: 50 },
        2: { cellWidth: "auto" },
        3: { cellWidth: 25 },
      },
    });
  }

  doc.save(`Week-${reminder.targetBusyWeek}-Study-Plan.pdf`);
};

/* ---------------- DASHBOARD COMPONENT ---------------- */

const StudentDashboard = () => {
  const [studentId, setStudentId] = useState(null);
  const [userEmail, setUserEmail] = useState("");
  const [sysConfig, setSysConfig] = useState({ semesterStartDate: null });
  const [weeklyWorkload, setWeeklyWorkload] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [lectureAlerts, setLectureAlerts] = useState([]);
  const [backendReminders, setBackendReminders] = useState([]);
  const [loadingReminders, setLoadingReminders] = useState(false);
  const [hasLoadedReminders, setHasLoadedReminders] = useState(false);
  const [downloadingPdfId, setDownloadingPdfId] = useState(null);
  const [selectedWeek, setSelectedWeek] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentWeekStart, setCurrentWeekStart] = useState(new Date());
  const [calendarView, setCalendarView] = useState("week");
  const [loading, setLoading] = useState(true);
  const [workloadStats, setWorkloadStats] = useState(null);
  const [showLegend, setShowLegend] = useState(false);

  const currentWeek = calculateAcademicWeek(
    sysConfig.semesterStartDate,
    currentWeekStart,
  );
  const academicPeriod = getAcademicPeriod(sysConfig.semesterStartDate);

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setStudentId(user.uid);
        setUserEmail(user.email);
      } else {
        setStudentId(null);
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!studentId) return;
    async function loadDashboard() {
      try {
        setLoading(true);
        const config = await fetchSystemConfig();
        setSysConfig(config);
        const enrollment = await fetchStudentEnrollment(studentId);
        setSubjects(enrollment?.subjects || []);
        await generateWorkloadIfNeeded(studentId, config.semesterStartDate);
        await generateBusyWeekReminders(studentId);
        const [weeklyResponse, alertRes] = await Promise.all([
          fetchWeeklyWorkload(studentId),
          fetchLectureAlerts(),
        ]);
        const workloadData = Array.isArray(weeklyResponse?.weeks)
          ? weeklyResponse.weeks
          : [];
        setWeeklyWorkload(workloadData);
        setWorkloadStats(calculateWorkloadStats(workloadData));
        setLectureAlerts(alertRes?.alerts || []);
      } catch (err) {
        console.error("Dashboard error:", err);
      } finally {
        setLoading(false);
      }
    }
    loadDashboard();
  }, [studentId]);

  useEffect(() => {
    if (!loading && weeklyWorkload.length > 0 && !hasLoadedReminders) {
      loadBackendReminders();
    }
  }, [loading, weeklyWorkload, hasLoadedReminders]);

  const loadBackendReminders = async () => {
    if (!studentId) return;
    try {
      setLoadingReminders(true);
      const reminderData = await fetchActiveReminders(studentId);
      if (reminderData.reminders) {
        const today = new Date();
        const validReminders = reminderData.reminders
          .map((r) => ({
            ...r,
            targetWeekStart: r.targetWeekStart
              ? new Date(r.targetWeekStart)
              : new Date(),
          }))
          .filter((r) => {
            // 🌟 STRICT EXPIRATION RULE:
            // Calculate how many days have passed since the target week started
            const daysSinceStart =
              (today - r.targetWeekStart) / (1000 * 60 * 60 * 24);

            // If it has been more than 7 days, the week is over. Hide it!
            return daysSinceStart <= 7;
          });

        setBackendReminders(validReminders);
      }
      setHasLoadedReminders(true);
    } catch (error) {
      console.error("Error loading reminders:", error);
      setHasLoadedReminders(true);
    } finally {
      setLoadingReminders(false);
    }
  };

  const handleDismissReminder = async (reminderId) => {
    try {
      await dismissReminder(reminderId, studentId);
      setBackendReminders((prev) => prev.filter((r) => r.id !== reminderId));
    } catch (err) {
      console.error("Error dismissing reminder:", err);
    }
  };

  const handleDownloadPDF = (reminder) => {
    setDownloadingPdfId(reminder.id);
    setTimeout(() => {
      generatePDF(reminder, userEmail, academicPeriod);
      setDownloadingPdfId(null);
    }, 500);
  };

  const handleDayClick = (week) => {
    setSelectedWeek(week);
    setIsModalOpen(true);
  };

  const handleWeekChange = (newWeekStart) => setCurrentWeekStart(newWeekStart);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="h-24 bg-white/50 rounded-3xl animate-pulse backdrop-blur-md border border-white/40 shadow-sm"></div>
          <div className="flex gap-6 overflow-x-hidden">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-40 min-w-[340px] bg-white/40 rounded-3xl animate-pulse backdrop-blur-md shadow-sm"
              ></div>
            ))}
          </div>
          <div className="h-96 bg-white/50 rounded-3xl animate-pulse backdrop-blur-md border border-white/40 shadow-sm"></div>
        </div>
      </div>
    );
  }

  return (
    <>
      <style>{`
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        .glass-card { background: rgba(255, 255, 255, 0.7); backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px); border: 1px solid rgba(255, 255, 255, 0.5); box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.07); }
      `}</style>

      {isModalOpen && selectedWeek && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl overflow-hidden relative">
            <div
              className={`p-6 ${["BUSY", "HEAVY", "OVERLOADED"].includes(selectedWeek.status) ? "bg-red-50" : "bg-emerald-50"} border-b border-gray-100`}
            >
              <button
                onClick={() => setIsModalOpen(false)}
                className="absolute top-4 right-4 p-2 bg-white/50 hover:bg-white rounded-full transition-colors shadow-sm"
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>
              <div className="flex items-center gap-3 mb-1">
                <span className="px-3 py-1 bg-white rounded-full text-xs font-bold shadow-sm">
                  Week {selectedWeek.week || currentWeek}
                </span>
                <span className="font-bold text-gray-700">
                  {selectedWeek.totalHours || 0} Total Hours
                </span>
              </div>
              <h2 className="text-2xl font-extrabold text-gray-900">
                Weekly Breakdown
              </h2>
            </div>

            <div className="p-6 max-h-[60vh] overflow-y-auto">
              {selectedWeek.breakdown && selectedWeek.breakdown.length > 0 ? (
                <div className="space-y-3">
                  {selectedWeek.breakdown.map((task, idx) => {
                    const isDone = task.isCompleted; // Check if the task is done
                    return (
                      <div
                        key={idx}
                        className={`bg-white border p-4 rounded-2xl shadow-sm flex flex-col gap-2 transition-all duration-300 ${
                          isDone
                            ? "border-emerald-200 bg-emerald-50/30 opacity-75"
                            : "border-gray-100 hover:border-indigo-100"
                        }`}
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex items-start gap-3">
                            {/* Render CheckCircle if done, otherwise empty Circle */}
                            {isDone ? (
                              <CheckCircle className="w-6 h-6 text-emerald-500 shrink-0 mt-0.5" />
                            ) : (
                              <Circle className="w-6 h-6 text-gray-300 shrink-0 mt-0.5" />
                            )}
                            <div>
                              <h4
                                className={`font-bold text-lg leading-tight ${isDone ? "text-gray-400 line-through" : "text-gray-800"}`}
                              >
                                {task.subjectName}
                              </h4>
                              <div className="flex items-center gap-2 mt-1.5">
                                <span
                                  className={`px-2 py-0.5 rounded text-xs font-extrabold uppercase tracking-wide ${
                                    isDone
                                      ? "bg-gray-100 text-gray-400"
                                      : task.type.includes("EXAM")
                                        ? "bg-red-100 text-red-700"
                                        : task.type.includes("SUBMISSION")
                                          ? "bg-amber-100 text-amber-700"
                                          : "bg-blue-100 text-blue-700"
                                  }`}
                                >
                                  {formatTaskType(task.type)}
                                </span>

                                {/* Status Badge */}
                                {isDone ? (
                                  <span className="text-xs font-bold text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded">
                                    Done
                                  </span>
                                ) : (
                                  <span className="text-xs font-bold text-amber-600 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded">
                                    Pending
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          <span
                            className={`px-2.5 py-1 rounded-lg text-sm font-bold ml-2 shrink-0 ${isDone ? "bg-gray-100 text-gray-400" : "bg-indigo-50 text-indigo-700"}`}
                          >
                            {task.hours}h
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center p-8 bg-gray-50 rounded-2xl">
                  <Coffee className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                  <p className="text-gray-500 font-medium">
                    No specific tasks tracked for this week yet.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="min-h-screen bg-slate-50/50 text-gray-800 font-sans pb-12">
        <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-8">
          <div className="glass-card rounded-3xl p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-6">
              <div className="flex items-center gap-5 w-full sm:w-auto">
                <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-4 rounded-2xl shadow-[0_10px_20px_rgba(99,102,241,0.3)]">
                  <GraduationCap className="text-white w-7 h-7" />
                </div>
                <div>
                  <h1 className="text-3xl sm:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-700 to-purple-700 tracking-tight">
                    Overview
                  </h1>
                  <p className="text-sm font-bold text-gray-500 uppercase tracking-wider mt-1">
                    Week {currentWeek} • {academicPeriod.semester}
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowLegend(!showLegend)}
                  className="px-4 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 bg-white text-indigo-600 border border-indigo-100 hover:bg-indigo-50"
                >
                  <HelpCircle className="w-4 h-4" /> Guide
                </button>
                <div className="flex gap-1 bg-gray-200/50 p-1.5 rounded-xl backdrop-blur-sm">
                  <button
                    onClick={() => setCalendarView("week")}
                    className={`px-5 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all ${calendarView === "week" ? "bg-white text-indigo-700 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
                  >
                    <Grid className="w-4 h-4" /> Week
                  </button>
                  <button
                    onClick={() => setCalendarView("month")}
                    className={`px-5 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all ${calendarView === "month" ? "bg-white text-indigo-700 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
                  >
                    <CalendarIcon className="w-4 h-4" /> Month
                  </button>
                </div>
              </div>
            </div>
          </div>

          {backendReminders.length > 0 && (
            <div className="space-y-4">
              <h3 className="font-extrabold text-gray-800 flex items-center gap-2 text-xl px-2">
                <Sparkles className="w-6 h-6 text-amber-500" /> Action Required:
                Study Plans Ready
              </h3>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {backendReminders.map((reminder) => {
                  const isDownloading = downloadingPdfId === reminder.id;

                  // 🌟 SMARTER BADGES LOGIC
                  const daysUntil = Math.ceil(
                    (reminder.targetWeekStart - new Date()) /
                      (1000 * 60 * 60 * 24),
                  );

                  let badgeText = `In ${daysUntil} days`;
                  let badgeColor = "bg-red-100 text-red-700";

                  if (daysUntil === 0) {
                    badgeText = "Starts Today!";
                    badgeColor = "bg-orange-100 text-orange-700";
                  } else if (daysUntil < 0) {
                    badgeText = "Ongoing This Week";
                    badgeColor = "bg-emerald-100 text-emerald-700";
                  }

                  const groupedTimetable = groupTimetableByDay(
                    reminder.timetable,
                  );

                  return (
                    <div
                      key={reminder.id}
                      className="glass-card rounded-3xl p-6 relative overflow-hidden group flex flex-col h-full"
                    >
                      <div className="absolute left-0 top-0 bottom-0 w-2 bg-gradient-to-b from-red-400 to-red-600"></div>
                      <button
                        onClick={() => handleDismissReminder(reminder.id)}
                        className="absolute top-4 right-4 p-2 text-gray-400 hover:bg-red-50 hover:text-red-600 rounded-full transition-all"
                      >
                        <X className="w-5 h-5" />
                      </button>

                      <div className="pl-4 flex flex-col flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <h4 className="font-extrabold text-gray-900 text-xl">
                            Week {reminder.targetBusyWeek} Plan
                          </h4>
                          {/* 🌟 APPLIED BADGE TEXT AND COLOR */}
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-bold ${badgeColor}`}
                          >
                            {badgeText}
                          </span>
                        </div>

                        <p className="text-gray-600 font-medium text-sm mb-4">
                          {reminder.message ||
                            `You have a heavy workload of ${reminder.targetTotalHours} hours coming up.`}
                        </p>

                        {groupedTimetable.length > 0 ? (
                          <div className="flex-1 mb-5 bg-white/60 rounded-2xl p-4 border border-red-100/50 max-h-80 overflow-y-auto hide-scrollbar shadow-inner space-y-4">
                            <h5 className="text-xs font-black text-red-800 uppercase tracking-widest mb-1 flex items-center gap-2">
                              <BookOpen className="w-4 h-4" /> Recommended Daily
                              Tasks
                            </h5>

                            {groupedTimetable.map((group, gIdx) => (
                              <div
                                key={gIdx}
                                className="flex gap-3 bg-white p-3 rounded-xl shadow-sm border border-red-50 hover:border-red-200 transition-colors"
                              >
                                <div className="flex-shrink-0 flex flex-col items-center justify-center w-12 h-12 bg-gradient-to-br from-red-50 to-red-100 rounded-lg text-red-700 font-bold border border-red-100">
                                  <span className="text-[9px] uppercase tracking-wider opacity-80">
                                    Day
                                  </span>
                                  <span className="text-lg leading-none">
                                    {group.day}
                                  </span>
                                </div>
                                <div className="flex-1 space-y-3">
                                  {group.tasks.map((t, tIdx) => (
                                    <div
                                      key={tIdx}
                                      className={
                                        tIdx > 0
                                          ? "border-t pt-2 border-gray-100"
                                          : ""
                                      }
                                    >
                                      <div className="flex justify-between items-start gap-2 mb-0.5">
                                        <span className="text-xs font-bold text-gray-800 line-clamp-1">
                                          {t.subject}
                                        </span>
                                        <span className="text-[10px] font-bold bg-red-50 text-red-600 px-1.5 py-0.5 rounded shrink-0">
                                          {t.hours}h
                                        </span>
                                      </div>
                                      <p className="text-[11px] text-gray-600 font-medium leading-relaxed">
                                        {t.task}
                                      </p>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="flex-1 mb-5 bg-gray-50 rounded-2xl flex items-center justify-center p-4">
                            <p className="text-sm text-gray-400">
                              No timetable details available.
                            </p>
                          </div>
                        )}

                        <button
                          onClick={() => handleDownloadPDF(reminder)}
                          disabled={isDownloading}
                          className={`w-full mt-auto flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-bold transition-all shadow-md ${isDownloading ? "bg-gray-100 text-gray-400" : "bg-gradient-to-r from-red-500 to-red-600 text-white hover:scale-[1.02]"}`}
                        >
                          {isDownloading ? (
                            <Loader className="w-5 h-5 animate-spin" />
                          ) : (
                            <FileDown className="w-5 h-5" />
                          )}
                          {isDownloading
                            ? "Generating PDF..."
                            : "Download Study Plan (PDF)"}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {workloadStats?.upcomingPackedWeeks?.length > 0 && (
            <div className="space-y-4">
              <h3 className="font-extrabold text-gray-800 flex items-center gap-2 text-xl px-2">
                <AlertTriangle className="w-6 h-6 text-red-500" /> Upcoming
                Packed Weeks
              </h3>
              <div className="flex overflow-x-auto pb-6 pt-2 gap-6 snap-x hide-scrollbar">
                {workloadStats.upcomingPackedWeeks.map((week, idx) => {
                  const progress = Math.min((week.totalHours / 40) * 100, 100);
                  return (
                    <div
                      key={idx}
                      onClick={() => handleDayClick(week)}
                      className="snap-start min-w-[340px] bg-gradient-to-br from-white to-red-50/30 rounded-3xl p-6 border border-red-100 shadow-[0_8px_24px_rgba(239,68,68,0.1)] cursor-pointer hover:-translate-y-2 transition-transform relative overflow-hidden flex flex-col"
                    >
                      <div className="relative z-10 flex justify-between items-start mb-4">
                        <span className="bg-red-500 text-white px-4 py-1.5 rounded-full text-xs font-black shadow-md flex items-center gap-2">
                          <Clock className="w-3.5 h-3.5" /> WEEK {week.week}
                        </span>
                        <span className="font-bold text-red-700 bg-red-100 px-3 py-1.5 rounded-lg text-sm border border-red-200">
                          {week.totalHours}h Est.
                        </span>
                      </div>
                      <div className="relative z-10 flex-1 flex flex-col justify-center space-y-2 mb-4">
                        {week.breakdown?.slice(0, 2).map((task, i) => {
                          const isDone = task.isCompleted;
                          return (
                            <div
                              key={i}
                              className={`flex items-start gap-2 text-xs bg-white/80 backdrop-blur-sm p-3 rounded-xl shadow-sm border ${isDone ? "border-emerald-100" : "border-gray-100"}`}
                            >
                              {/* Display Done/Pending icon in the upcoming preview */}
                              {isDone ? (
                                <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                              ) : (
                                <Zap className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                              )}
                              <div>
                                <p
                                  className={`font-bold line-clamp-1 ${isDone ? "text-gray-400 line-through" : "text-gray-800"}`}
                                >
                                  {task.subjectName}
                                </p>
                                <p
                                  className={
                                    isDone
                                      ? "text-gray-400 font-medium"
                                      : "text-red-600 font-semibold"
                                  }
                                >
                                  {formatTaskType(task.type)} ({task.hours}h)
                                </p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                      <div className="relative z-10 mt-auto">
                        <div className="w-full bg-gray-200 rounded-full h-2 shadow-inner overflow-hidden">
                          <div
                            className="bg-gradient-to-r from-red-400 to-red-600 h-2 rounded-full"
                            style={{ width: `${progress}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="glass-card rounded-3xl overflow-hidden shadow-[0_12px_40px_rgba(0,0,0,0.06)] relative z-0">
            <WorkloadCalendar
              workload={weeklyWorkload}
              onDayClick={handleDayClick}
              currentWeekStart={currentWeekStart}
              onWeekChange={handleWeekChange}
              semesterStartDate={sysConfig.semesterStartDate}
              view={calendarView}
            />
          </div>

          {subjects.length > 0 && (
            <div className="space-y-4 pt-6">
              <h3 className="font-extrabold text-gray-800 flex items-center gap-2 text-xl px-2">
                <BookOpen className="w-6 h-6 text-indigo-500" /> My Enrolled
                Subjects
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {subjects.map((sub, idx) => (
                  <div
                    key={idx}
                    className="glass-card rounded-3xl p-6 border border-white hover:shadow-lg transition-all transform hover:-translate-y-1"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div className="bg-indigo-50 p-3 rounded-2xl">
                        <Activity className="w-6 h-6 text-indigo-600" />
                      </div>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-bold border ${sub.deliveryMode === "ONLINE" ? "bg-blue-50 text-blue-700 border-blue-200" : "bg-emerald-50 text-emerald-700 border-emerald-200"}`}
                      >
                        {sub.deliveryMode}
                      </span>
                    </div>
                    <h4 className="text-lg font-extrabold text-gray-900 mb-1 leading-tight">
                      {sub.subjectName}
                    </h4>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">
                      {sub.subjectId} • {formatTaskType(sub.type)}
                    </p>
                    <div className="bg-white/60 rounded-2xl p-4 border border-gray-100">
                      {sub.lectureDays?.length > 0 ? (
                        <div className="space-y-3">
                          <div className="flex items-start gap-2.5">
                            <CalendarDays className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" />
                            <div className="flex flex-wrap gap-1">
                              {sub.lectureDays.map((day) => (
                                <span
                                  key={day}
                                  className="bg-gray-100 text-gray-600 text-xs font-bold px-2 py-0.5 rounded"
                                >
                                  {day}
                                </span>
                              ))}
                            </div>
                          </div>
                          <div className="flex items-center gap-2.5 text-sm font-bold text-gray-700">
                            <Clock className="w-4 h-4 text-gray-400" />
                            {sub.lectureStartTime} - {sub.lectureEndTime}
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center gap-2 text-gray-500 py-2">
                          <Coffee className="w-4 h-4" />
                          <span className="text-sm font-medium">
                            No scheduled lectures
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default StudentDashboard;



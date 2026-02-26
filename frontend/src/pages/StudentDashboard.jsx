import { useEffect, useState } from "react";
import {
  GraduationCap,
  Bell,
  Calendar,
  Users,
  BookOpen,
  Clock,
  Grid,
  AlertTriangle,
  CheckCircle,
  TrendingUp,
  BarChart3,
  Lightbulb,
  X,
  Loader,
} from "lucide-react";

import WorkloadCalendar from "../componets/WorkloadCalendar";

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

function calculateAcademicWeek(semesterStartDate, targetDate = new Date()) {
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
  const start = new Date(semesterStartDate);
  const today = new Date();

  return {
    month: today.toLocaleDateString("en-US", { month: "long" }),
    year: today.getFullYear(),
    semester: `${start.getMonth() < 6 ? "Spring" : "Fall"} ${start.getFullYear()}`,
  };
}

// Enhanced status helper function
const getStatusLabel = (status = "NORMAL") => {
  const statusMap = {
    NORMAL: {
      label: "Normal",
      color: "bg-green-100 text-green-800",
      icon: CheckCircle,
    },
    BUSY: {
      label: "Busy",
      color: "bg-amber-100 text-amber-800",
      icon: AlertTriangle,
    },
    LIGHT: {
      label: "Light",
      color: "bg-blue-100 text-blue-800",
      icon: CheckCircle,
    },
    MODERATE: {
      label: "Moderate",
      color: "bg-blue-100 text-blue-800",
      icon: TrendingUp,
    },
    HEAVY: {
      label: "Heavy",
      color: "bg-amber-100 text-amber-800",
      icon: AlertTriangle,
    },
    OVERLOADED: {
      label: "Overloaded",
      color: "bg-red-100 text-red-800",
      icon: AlertTriangle,
    },
  };

  return (
    statusMap[status] || {
      label: status.charAt(0) + status.slice(1).toLowerCase(),
      color: "bg-gray-100 text-gray-800",
      icon: CheckCircle,
    }
  );
};

// Generate weeks for week selector
function generateWeekOptions(semesterStart) {
  const totalWeeks = 16; // Typical semester length
  const weeks = [];

  for (let i = 1; i <= totalWeeks; i++) {
    const weekStart = new Date(semesterStart);
    weekStart.setDate(weekStart.getDate() + (i - 1) * 7);

    weeks.push({
      weekNumber: i,
      startDate: weekStart,
      label: `Week ${i} (${weekStart.toLocaleDateString("en-US", { month: "short", day: "numeric" })})`,
    });
  }

  return weeks;
}

// Calculate workload statistics from API response
function calculateWorkloadStats(weeklyWorkload) {
  const stats = {
    totalWeeks: weeklyWorkload.length,
    flaggedWeeks: 0,
    normalWeeks: 0,
    totalHours: 0,
    maxHours: 0,
    averageHours: 0,
    statusDistribution: {},
    upcomingBusyWeeks: [],
  };

  if (!Array.isArray(weeklyWorkload)) return stats;

  weeklyWorkload.forEach((week) => {
    // Count weeks by status
    stats.statusDistribution[week.status] =
      (stats.statusDistribution[week.status] || 0) + 1;

    // Count flagged (non-normal) weeks
    if (week.status !== "NORMAL") {
      stats.flaggedWeeks++;

      // Find upcoming busy weeks (weeks after current date)
      const weekStart = new Date(week.weekStart._seconds * 1000);
      const today = new Date();
      if (weekStart > today) {
        stats.upcomingBusyWeeks.push({
          week: week.week,
          weekStart: weekStart,
          status: week.status,
          totalHours: week.totalHours,
        });
      }
    } else {
      stats.normalWeeks++;
    }

    // Calculate hours
    stats.totalHours += week.totalHours || 0;
    stats.maxHours = Math.max(stats.maxHours, week.totalHours || 0);
  });

  stats.averageHours =
    stats.totalWeeks > 0 ? (stats.totalHours / stats.totalWeeks).toFixed(1) : 0;

  // Sort upcoming busy weeks by date
  stats.upcomingBusyWeeks.sort((a, b) => a.weekStart - b.weekStart);

  return stats;
}

// Generate tips based on workload
function generateWorkloadTips(status, totalHours, breakdown = []) {
  const tips = [];

  if (status === "OVERLOADED" || totalHours > 20) {
    tips.push(
      "This is a high-intensity week. Consider breaking tasks into smaller chunks.",
    );
    tips.push("Schedule short breaks every 45-60 minutes to maintain focus.");
    tips.push(
      "Consider speaking with your academic advisor about workload management.",
    );
  } else if (status === "HEAVY" || totalHours > 15) {
    tips.push("Plan your time carefully. Start preparing materials early.");
    tips.push("Prioritize tasks based on deadlines and difficulty.");
    tips.push("Use time-blocking techniques to stay focused.");
  } else if (status === "BUSY") {
    tips.push("Create a schedule to stay on track with all assignments.");
    tips.push("Review materials in advance to save time during the busy week.");
    tips.push("Group similar tasks together to improve efficiency.");
  }

  if (breakdown.some((item) => item.type && item.type.includes("EXAM"))) {
    tips.push("Schedule dedicated study sessions for exam preparation.");
    tips.push("Create a study guide or flashcards for exam topics.");
  }

  if (breakdown.some((item) => item.type && item.type.includes("ASSIGNMENT"))) {
    tips.push("Start assignment research early to gather resources.");
    tips.push("Break assignments into smaller milestones with deadlines.");
  }

  return tips;
}

/* ---------------- COMPONENT ---------------- */

const StudentDashboard = () => {
  const studentId = "S001";
  const SEMESTER_START_DATE = "2026-01-26";

  const [weeklyWorkload, setWeeklyWorkload] = useState([]);
  const [lectureAlerts, setLectureAlerts] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);
  const [currentWeekStart, setCurrentWeekStart] = useState(new Date());
  const [calendarView, setCalendarView] = useState("week");
  const [loading, setLoading] = useState(true);
  const [weekOptions, setWeekOptions] = useState([]);
  const [workloadStats, setWorkloadStats] = useState(null);
  const [backendReminders, setBackendReminders] = useState([]);
  const [loadingReminders, setLoadingReminders] = useState(false);
  const [hasLoadedReminders, setHasLoadedReminders] = useState(false);

  const currentWeek = calculateAcademicWeek(
    SEMESTER_START_DATE,
    currentWeekStart,
  );
  const academicPeriod = getAcademicPeriod(SEMESTER_START_DATE);

  // Load backend reminders with improved logic
  const loadBackendReminders = async () => {
    try {
      console.log("🔄 [Dashboard] Starting to load backend reminders...");
      console.log(
        "📊 [Dashboard] Weekly workload count:",
        weeklyWorkload.length,
      );

      setLoadingReminders(true);

      // Step 1: Try to fetch existing reminders
      console.log(
        "🔍 [Dashboard] Step 1: Fetching existing reminders from API...",
      );
      const reminderData = await fetchActiveReminders(studentId);

      console.log("📥 [Dashboard] API Response received:", {
        count: reminderData.count,
        remindersLength: reminderData.reminders?.length || 0,
        studentId: reminderData.studentId,
      });

      if (reminderData.reminders && reminderData.reminders.length > 0) {
        console.log(
          `✅ [Dashboard] Found ${reminderData.reminders.length} reminders from API`,
        );

        // Parse date strings to Date objects
        const parsedReminders = reminderData.reminders.map((reminder) => ({
          ...reminder,
          targetWeekStart: new Date(reminder.targetWeekStart),
          createdAt: new Date(reminder.createdAt),
        }));

        setBackendReminders(parsedReminders);
        setHasLoadedReminders(true);
        return;
      }

      console.log("ℹ️ [Dashboard] No existing reminders found in API response");

      // Step 2: Check if there are upcoming busy weeks in workload
      if (weeklyWorkload.length > 0) {
        const today = new Date();
        const twoWeeksFromNow = new Date(
          today.getTime() + 14 * 24 * 60 * 60 * 1000,
        );

        const upcomingBusyWeeks = weeklyWorkload.filter((week) => {
          if (!week.weekStart?._seconds) return false;

          const weekStart = new Date(week.weekStart._seconds * 1000);
          const daysUntil = Math.floor(
            (weekStart - today) / (1000 * 60 * 60 * 24),
          );

          return (
            (week.status === "BUSY" ||
              week.status === "HEAVY" ||
              week.status === "OVERLOADED") &&
            weekStart > today &&
            daysUntil <= 14
          );
        });

        console.log(
          `📊 [Dashboard] Found ${upcomingBusyWeeks.length} upcoming busy weeks in workload`,
        );

        if (upcomingBusyWeeks.length > 0) {
          // Step 3: Generate reminders for these weeks
          console.log(
            "🔧 [Dashboard] Step 3: Generating reminders for busy weeks...",
          );
          try {
            await generateBusyWeekReminders(studentId);

            // Step 4: Fetch the newly generated reminders
            console.log(
              "🔄 [Dashboard] Step 4: Fetching newly generated reminders...",
            );
            const newReminderData = await fetchActiveReminders(studentId);

            if (
              newReminderData.reminders &&
              newReminderData.reminders.length > 0
            ) {
              console.log(
                `✅ [Dashboard] Successfully loaded ${newReminderData.reminders.length} new reminders`,
              );

              // Parse date strings to Date objects
              const parsedReminders = newReminderData.reminders.map(
                (reminder) => ({
                  ...reminder,
                  targetWeekStart: new Date(reminder.targetWeekStart),
                  createdAt: new Date(reminder.createdAt),
                }),
              );

              setBackendReminders(parsedReminders);
            } else {
              console.log(
                "⚠️ [Dashboard] No reminders generated even though busy weeks exist",
              );
              setBackendReminders([]);
            }
          } catch (genError) {
            console.error(
              "❌ [Dashboard] Failed to generate reminders:",
              genError,
            );
            setBackendReminders([]);
          }
        } else {
          console.log(
            "✅ [Dashboard] No upcoming busy weeks to generate reminders for",
          );
          setBackendReminders([]);
        }
      } else {
        console.log("⚠️ [Dashboard] No weekly workload data available yet");
        setBackendReminders([]);
      }

      setHasLoadedReminders(true);
    } catch (error) {
      console.error("❌ [Dashboard] Error in loadBackendReminders:", error);
      setBackendReminders([]);
      setHasLoadedReminders(true);
    } finally {
      console.log("🏁 [Dashboard] Reminder loading complete");
      setLoadingReminders(false);
    }
  };

  // Dismiss a reminder
  const handleDismissReminder = async (reminderId) => {
    try {
      console.log(`🗑️ [Dashboard] Dismissing reminder: ${reminderId}`);
      await dismissReminder(reminderId, studentId);

      // Remove from local state
      setBackendReminders((prev) => prev.filter((r) => r.id !== reminderId));

      console.log(
        `✅ [Dashboard] Reminder ${reminderId} dismissed successfully`,
      );
    } catch (err) {
      console.error("❌ [Dashboard] Error dismissing reminder:", err);
    }
  };

  useEffect(() => {
    async function loadDashboard() {
      try {
        console.log("▶ [Dashboard] Loading dashboard for student:", studentId);

        /* 1️⃣ Enrollment */
        const enrollment = await fetchStudentEnrollment(studentId);
        console.log(
          "✅ [Dashboard] Enrollment loaded:",
          enrollment?.subjects?.length || 0,
          "subjects",
        );
        setSubjects(enrollment?.subjects || []);

        /* 2️⃣ Generate workload */
        await generateWorkloadIfNeeded(studentId, SEMESTER_START_DATE);
        console.log("✅ [Dashboard] Workload generation completed");

        /* 3️⃣ Fetch workload + alerts */
        const [weeklyResponse, alertRes] = await Promise.all([
          fetchWeeklyWorkload(studentId),
          fetchLectureAlerts(),
        ]);

        console.log(
          "✅ [Dashboard] Weekly workload response weeks:",
          weeklyResponse?.weeks?.length || 0,
        );
        console.log(
          "✅ [Dashboard] Lecture alerts count:",
          alertRes?.alerts?.length || 0,
        );

        const weeks = Array.isArray(weeklyResponse?.weeks)
          ? weeklyResponse.weeks
          : [];

        setWeeklyWorkload(weeks);
        setLectureAlerts(alertRes?.alerts || []);

        // Calculate workload statistics
        const stats = calculateWorkloadStats(weeks);
        setWorkloadStats(stats);

        // Set selected date to first week if available
        if (weeks.length > 0) {
          const todayWeek =
            weeks.find(
              (w) =>
                calculateAcademicWeek(SEMESTER_START_DATE, new Date()) ===
                w.week,
            ) || weeks[0];
          setSelectedDate(todayWeek);
        }

        // Generate week options
        const options = generateWeekOptions(SEMESTER_START_DATE);
        setWeekOptions(options);

        // Set current week start to today's week
        const today = new Date();
        const weekStart = new Date(today);
        weekStart.setDate(today.getDate() - today.getDay() + 1); // Monday
        setCurrentWeekStart(weekStart);

        console.log("✅ [Dashboard] Dashboard data loaded successfully");
      } catch (err) {
        console.error("❌ [Dashboard] Error loading dashboard:", err);
      } finally {
        setLoading(false);
      }
    }

    loadDashboard();
  }, []);

  // Load reminders when workload is available
  useEffect(() => {
    if (!loading && weeklyWorkload.length > 0 && !hasLoadedReminders) {
      console.log("🔄 [Dashboard] Triggering reminder load...");
      loadBackendReminders();
    }
  }, [loading, weeklyWorkload, hasLoadedReminders]);

  // Set up interval to refresh reminders periodically
  useEffect(() => {
    const intervalId = setInterval(
      () => {
        if (hasLoadedReminders) {
          console.log("🔄 [Dashboard] Periodic reminder refresh triggered");
          loadBackendReminders();
        }
      },
      5 * 60 * 1000,
    ); // Refresh every 5 minutes

    return () => clearInterval(intervalId);
  }, [hasLoadedReminders]);

  const handleDayClick = (week) => setSelectedDate(week);

  const handleWeekChange = (newWeekStart) => {
    setCurrentWeekStart(newWeekStart);
  };

  const handleWeekSelect = (weekNumber) => {
    const weekOption = weekOptions.find((w) => w.weekNumber === weekNumber);
    if (weekOption) {
      setCurrentWeekStart(weekOption.startDate);
      // Find the week in workload data
      const selectedWeek = weeklyWorkload.find((w) => w.week === weekNumber);
      if (selectedWeek) {
        setSelectedDate(selectedWeek);
      }
    }
  };

  const getWeekStatus = (weekNumber) => {
    const weekData = weeklyWorkload.find((w) => w.week === weekNumber);
    return weekData ? weekData.status : "NORMAL";
  };

  // Helper to format date safely
  const formatDateSafe = (date) => {
    if (!date) return "Date not available";
    try {
      if (typeof date === "string") {
        return new Date(date).toLocaleDateString("en-US", {
          weekday: "short",
          month: "short",
          day: "numeric",
        });
      } else if (date instanceof Date) {
        return date.toLocaleDateString("en-US", {
          weekday: "short",
          month: "short",
          day: "numeric",
        });
      }
      return "Invalid date";
    } catch (error) {
      console.error("Date formatting error:", error);
      return "Date error";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-600 mt-4">Loading dashboard…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* HEADER */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div className="flex items-center gap-3">
            <GraduationCap className="text-blue-600 w-8 h-8" />
            <div>
              <h1 className="text-2xl font-bold">Student Dashboard</h1>
              <p className="text-sm text-gray-600">
                Week {currentWeek} • {academicPeriod.semester}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* View Toggle */}
            <div className="flex items-center bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setCalendarView("week")}
                className={`px-3 py-1 rounded-md transition ${
                  calendarView === "week"
                    ? "bg-white shadow"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                <Grid className="w-4 h-4 inline mr-2" />
                Week View
              </button>
              <button
                onClick={() => setCalendarView("month")}
                className={`px-3 py-1 rounded-md transition ${
                  calendarView === "month"
                    ? "bg-white shadow"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                <Calendar className="w-4 h-4 inline mr-2" />
                Month View
              </button>
            </div>

            {/* Notifications */}
            <div className="relative">
              <Bell className="w-6 h-6 text-gray-600 cursor-pointer" />
              {(lectureAlerts.length > 0 || backendReminders.length > 0) && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {lectureAlerts.length + backendReminders.length}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* DEBUG INFO - You can remove this in production */}
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="text-sm">
              <span className="font-medium">Debug Info:</span>
              <span className="ml-2">
                Workload: {weeklyWorkload.length} weeks
              </span>
              <span className="ml-2">
                • Reminders: {backendReminders.length}
              </span>
              <span className="ml-2">• Current Week: {currentWeek}</span>
            </div>
            <button
              onClick={() => {
                console.log("🔄 Manual refresh triggered");
                loadBackendReminders();
              }}
              className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
            >
              Refresh
            </button>
          </div>
        </div>

        {/* BACKEND BUSY WEEK REMINDERS */}
        {loadingReminders ? (
          <div className="mb-6 bg-white p-5 rounded-lg shadow-sm border flex items-center justify-center">
            <Loader className="w-5 h-5 text-blue-600 animate-spin mr-2" />
            <span className="text-gray-600">Loading reminders...</span>
          </div>
        ) : backendReminders.length > 0 ? (
          <div className="mb-6 space-y-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-lg text-amber-800">
                ⚠️ Busy Week Alerts ({backendReminders.length})
              </h3>
              <span className="text-xs text-gray-500">
                Updated:{" "}
                {new Date().toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </div>

            {backendReminders.map((reminder) => {
              const statusInfo = getStatusLabel(reminder.targetStatus);
              const tips = generateWorkloadTips(
                reminder.targetStatus,
                reminder.targetTotalHours,
                reminder.targetBreakdown || [],
              );

              // Calculate days until busy week
              const daysUntil = Math.floor(
                (reminder.targetWeekStart - new Date()) / (1000 * 60 * 60 * 24),
              );
              const weeksUntil = Math.ceil(daysUntil / 7);

              return (
                <div
                  key={reminder.id}
                  className="bg-gradient-to-r from-amber-50 to-orange-50 border-l-4 border-amber-500 rounded-r-lg p-5 relative"
                >
                  <button
                    onClick={() => handleDismissReminder(reminder.id)}
                    className="absolute top-3 right-3 p-1 text-amber-600 hover:text-amber-800"
                    aria-label="Dismiss reminder"
                  >
                    <X className="w-5 h-5" />
                  </button>

                  <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="w-6 h-6 text-amber-600 flex-shrink-0 mt-1" />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold text-amber-900 text-lg">
                            Week {reminder.targetBusyWeek} Alert
                          </h4>
                          <span className="text-xs px-2 py-0.5 bg-amber-200 text-amber-800 rounded">
                            {weeksUntil} week{weeksUntil !== 1 ? "s" : ""} away
                          </span>
                        </div>

                        <p className="text-amber-800">
                          {reminder.targetStatus} week starts in{" "}
                          <span className="font-bold">{daysUntil} days</span>.
                          Prepare for{" "}
                          <span className="font-bold">
                            {reminder.targetTotalHours} hours
                          </span>{" "}
                          of work.
                        </p>

                        {/* Work Breakdown */}
                        {reminder.targetBreakdown?.length > 0 && (
                          <div className="mt-3">
                            <p className="text-sm font-medium text-amber-900 mb-2">
                              📋 Work Breakdown:
                            </p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                              {reminder.targetBreakdown.map((item, idx) => (
                                <div
                                  key={idx}
                                  className="flex items-center justify-between bg-amber-100/50 p-2 rounded"
                                >
                                  <span className="text-sm text-amber-800 truncate">
                                    {item.subjectName || "Unnamed Subject"}
                                  </span>
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs px-2 py-1 bg-amber-200 text-amber-800 rounded">
                                      {(item.type || "TASK").replace(/_/g, " ")}
                                    </span>
                                    <span className="font-medium text-amber-900">
                                      {item.hours || 0}h
                                    </span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Study Tips */}
                        {tips.length > 0 && (
                          <div className="mt-4">
                            <p className="text-sm font-medium text-amber-900 mb-2 flex items-center gap-1">
                              <Lightbulb className="w-4 h-4" /> Study Tips:
                            </p>
                            <ul className="space-y-1">
                              {tips.map((tip, idx) => (
                                <li
                                  key={idx}
                                  className="flex items-start gap-2 text-sm text-amber-700"
                                >
                                  <span className="text-amber-500">•</span>
                                  <span>{tip}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col gap-2 md:w-48">
                      <button
                        onClick={() =>
                          handleWeekSelect(reminder.targetBusyWeek)
                        }
                        className="w-full px-4 py-3 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition font-medium flex items-center justify-center gap-2"
                      >
                        <Calendar className="w-4 h-4" />
                        View Week {reminder.targetBusyWeek}
                      </button>
                      <button
                        onClick={() => handleDismissReminder(reminder.id)}
                        className="w-full px-4 py-2 bg-white text-amber-700 border border-amber-300 rounded-lg hover:bg-amber-50 transition text-sm"
                      >
                        Dismiss Alert
                      </button>
                      <div className="text-xs text-amber-600 text-center mt-2">
                        Starts: {formatDateSafe(reminder.targetWeekStart)}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : hasLoadedReminders ? (
          // Show message when no reminders after loading
          <div className="mb-6 bg-green-50 border-l-4 border-green-500 rounded-r-lg p-5">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-6 h-6 text-green-600" />
              <div>
                <p className="font-semibold text-green-900">
                  No upcoming busy week alerts
                </p>
                <p className="text-sm text-green-800 mt-1">
                  You're all caught up! No busy weeks detected in the next 2
                  weeks.
                </p>
              </div>
            </div>
          </div>
        ) : null}

        {/* WORKLOAD STATISTICS */}
        {workloadStats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Flagged Weeks</p>
                  <p className="text-2xl font-bold text-amber-600 mt-1">
                    {workloadStats.flaggedWeeks}
                  </p>
                </div>
                <AlertTriangle className="w-8 h-8 text-amber-500" />
              </div>
              <p className="text-xs text-gray-500 mt-2">
                {workloadStats.totalWeeks} total weeks analyzed
              </p>
            </div>

            <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Average Weekly Hours</p>
                  <p className="text-2xl font-bold text-blue-600 mt-1">
                    {workloadStats.averageHours}h
                  </p>
                </div>
                <BarChart3 className="w-8 h-8 text-blue-500" />
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Max: {workloadStats.maxHours}h this semester
              </p>
            </div>

            <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Normal Weeks</p>
                  <p className="text-2xl font-bold text-green-600 mt-1">
                    {workloadStats.normalWeeks}
                  </p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-500" />
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Weeks with manageable workload
              </p>
            </div>

            <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Active Reminders</p>
                  <p className="text-2xl font-bold text-red-600 mt-1">
                    {backendReminders.length}
                  </p>
                </div>
                <Bell className="w-8 h-8 text-red-500" />
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Busy week alerts from system
              </p>
            </div>
          </div>
        )}

        {/* LECTURE ALERTS */}
        {lectureAlerts.length > 0 && (
          <div className="mb-6 space-y-3">
            {lectureAlerts.map((alert, i) => (
              <div
                key={i}
                className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r-lg"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-semibold text-blue-900">
                      {alert.subjectName}
                    </p>
                    <p className="text-sm text-blue-700 mt-1">
                      {alert.message}
                    </p>
                  </div>
                  {alert.joinLink && (
                    <a
                      href={alert.joinLink}
                      target="_blank"
                      rel="noreferrer"
                      className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition"
                    >
                      Join Now
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* WEEK SELECTOR WITH STATUS INDICATORS */}
        <div className="bg-white p-4 rounded-lg shadow-sm mb-6">
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-semibold">Semester Weeks Overview</h3>
            <div className="flex gap-2">
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                <span className="text-xs text-gray-600">Normal</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                <span className="text-xs text-gray-600">Busy</span>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {weekOptions.map((week) => {
              const status = getWeekStatus(week.weekNumber);
              const statusInfo = getStatusLabel(status);
              const Icon = statusInfo.icon;

              return (
                <button
                  key={week.weekNumber}
                  onClick={() => handleWeekSelect(week.weekNumber)}
                  className={`px-3 py-2 rounded-lg border text-sm transition flex items-center gap-2 ${
                    week.weekNumber === currentWeek
                      ? "ring-2 ring-blue-500 ring-offset-2"
                      : ""
                  } ${
                    status === "NORMAL"
                      ? "bg-green-50 border-green-200 text-green-700 hover:bg-green-100"
                      : "bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {week.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* UPCOMING BUSY WEEKS */}
        {workloadStats?.upcomingBusyWeeks.length > 0 && (
          <div className="bg-white p-6 rounded-lg shadow-sm mb-6">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
              All Upcoming Busy Weeks
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {workloadStats.upcomingBusyWeeks.map((busyWeek, index) => {
                const hasReminder = backendReminders.some(
                  (r) => r.targetBusyWeek === busyWeek.week,
                );

                return (
                  <div
                    key={index}
                    className={`border rounded-lg p-4 transition hover:shadow-md ${
                      hasReminder
                        ? "border-amber-300 bg-amber-50 ring-2 ring-amber-200"
                        : "border-amber-200 bg-amber-50"
                    }`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-bold text-lg">
                          Week {busyWeek.week}
                        </p>
                        <p className="text-sm text-gray-600">
                          {busyWeek.weekStart.toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </p>
                      </div>
                      <span
                        className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusLabel(busyWeek.status).color}`}
                      >
                        {getStatusLabel(busyWeek.status).label}
                      </span>
                    </div>
                    <div className="flex justify-between items-center mt-3">
                      <span className="text-gray-700">Total Hours:</span>
                      <span className="font-bold text-amber-700">
                        {busyWeek.totalHours}h
                      </span>
                    </div>
                    <div className="mt-2 text-xs text-gray-500">
                      {hasReminder ? (
                        <span className="text-amber-600 font-medium flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" /> Alert active
                        </span>
                      ) : (
                        <span>Click to view details</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* WORKLOAD CALENDAR */}
        <div className="bg-white p-6 rounded-lg shadow-sm mb-6">
          <WorkloadCalendar
            workload={weeklyWorkload}
            onDayClick={handleDayClick}
            currentWeekStart={currentWeekStart}
            onWeekChange={handleWeekChange}
            showWeekNavigation={true}
            semesterStartDate={SEMESTER_START_DATE}
          />
        </div>

        {/* SELECTED WEEK DETAILS */}
        {selectedDate && selectedDate.week && (
          <div className="bg-white p-6 rounded-lg shadow-sm mb-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold text-lg">
                Week {selectedDate.week} Details
              </h3>
              <div className="flex items-center gap-2">
                {(() => {
                  const statusInfo = getStatusLabel(selectedDate.status);
                  const StatusIcon = statusInfo.icon;
                  return (
                    <>
                      {StatusIcon && <StatusIcon className="w-5 h-5" />}
                      <span
                        className={`px-3 py-1 rounded-full text-sm font-medium ${statusInfo.color}`}
                      >
                        {statusInfo.label}
                      </span>
                    </>
                  );
                })()}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <Calendar className="w-5 h-5 text-blue-600" />
                  <div>
                    <p className="font-medium">
                      {new Date(
                        selectedDate.weekStart._seconds * 1000,
                      ).toLocaleDateString("en-US", {
                        weekday: "long",
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </p>
                    <p className="text-sm text-gray-600">
                      Week {selectedDate.week} • Semester Week{" "}
                      {calculateAcademicWeek(
                        SEMESTER_START_DATE,
                        new Date(selectedDate.weekStart._seconds * 1000),
                      )}
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <span className="text-gray-700">Total Hours</span>
                    <span className="font-bold text-lg">
                      {selectedDate.totalHours || 0}h
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <span className="text-gray-700">Workload Level</span>
                    <span className="text-gray-700 font-medium">
                      {selectedDate.status === "BUSY"
                        ? "High Intensity"
                        : "Normal"}
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-3">Work Breakdown</h4>
                {selectedDate.breakdown && selectedDate.breakdown.length > 0 ? (
                  <div className="space-y-2">
                    {selectedDate.breakdown.map((item, index) => (
                      <div
                        key={index}
                        className="p-3 border rounded-lg hover:bg-gray-50"
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium">{item.subjectName}</p>
                            <p className="text-sm text-gray-600">
                              {item.type} • {item.hours}h
                            </p>
                          </div>
                          <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded-full">
                            {item.subjectId}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500">
                    No workload items for this week
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* SUBJECTS SUMMARY */}
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold">My Subjects</h3>
            <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
              {subjects.length} subjects
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {subjects.map((subject) => (
              <div
                key={subject.subjectId}
                className="border rounded-lg p-4 hover:shadow-md transition"
              >
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <p className="font-semibold text-lg">
                      {subject.subjectName}
                    </p>
                    <p className="text-sm text-gray-600">
                      {subject.subjectCode}
                    </p>
                  </div>
                  <span
                    className={`px-2 py-1 text-xs rounded-full ${
                      subject.type === "CORE"
                        ? "bg-purple-100 text-purple-800"
                        : subject.type === "INTERNSHIP_SUBMISSION"
                          ? "bg-orange-100 text-orange-800"
                          : "bg-green-100 text-green-800"
                    }`}
                  >
                    {subject.type?.replace(/_/g, " ")}
                  </span>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <BookOpen className="w-4 h-4 text-gray-500" />
                    <span>Credits: {subject.credits || 3}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="w-4 h-4 text-gray-500" />
                    <span>Delivery: {subject.deliveryMode}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Users className="w-4 h-4 text-gray-500" />
                    <span>Instructor: {subject.instructor || "TBA"}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;

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
  ChevronRight,
  Sparkles,
  Target,
  Award,
} from "lucide-react";
import { getAuth, onAuthStateChanged } from "firebase/auth";
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

// Enhanced status helper function with user-friendly labels
const getStatusLabel = (status = "NORMAL") => {
  const statusMap = {
    NORMAL: {
      label: "Easy Week",
      description: "Light workload - perfect for catching up",
      color: "bg-emerald-50 text-emerald-700 border border-emerald-200",
      icon: CheckCircle,
      iconColor: "text-emerald-500",
      bgLight: "bg-emerald-50",
      emoji: "🌿",
    },
    BUSY: {
      label: "Packed Week",
      description: "Full schedule - plan ahead",
      color: "bg-amber-50 text-amber-700 border border-amber-200",
      icon: AlertTriangle,
      iconColor: "text-amber-500",
      bgLight: "bg-amber-50",
      emoji: "📚",
    },
    LIGHT: {
      label: "Easy Week",
      description: "Light workload - perfect for catching up",
      color: "bg-emerald-50 text-emerald-700 border border-emerald-200",
      icon: CheckCircle,
      iconColor: "text-emerald-500",
      bgLight: "bg-emerald-50",
      emoji: "🌿",
    },
    MODERATE: {
      label: "Steady Pace",
      description: "Consistent workload",
      color: "bg-indigo-50 text-indigo-700 border border-indigo-200",
      icon: TrendingUp,
      iconColor: "text-indigo-500",
      bgLight: "bg-indigo-50",
      emoji: "⚖️",
    },
    HEAVY: {
      label: "Intense Week",
      description: "Lots to do - stay focused",
      color: "bg-orange-50 text-orange-700 border border-orange-200",
      icon: AlertTriangle,
      iconColor: "text-orange-500",
      bgLight: "bg-orange-50",
      emoji: "🔥",
    },
    OVERLOADED: {
      label: "Full Plate",
      description: "Maximum capacity - prioritize",
      color: "bg-red-50 text-red-700 border border-red-200",
      icon: AlertTriangle,
      iconColor: "text-red-500",
      bgLight: "bg-red-50",
      emoji: "⚡",
    },
  };

  return (
    statusMap[status] || {
      label: status.charAt(0) + status.slice(1).toLowerCase(),
      description: "Week with activities",
      color: "bg-gray-50 text-gray-700 border border-gray-200",
      icon: CheckCircle,
      iconColor: "text-gray-500",
      bgLight: "bg-gray-50",
      emoji: "📌",
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
      label: `Week ${i}`,
      fullLabel: `Week ${i} (${weekStart.toLocaleDateString("en-US", { month: "short", day: "numeric" })})`,
    });
  }

  return weeks;
}

// Calculate workload statistics from API response
function calculateWorkloadStats(weeklyWorkload) {
  const stats = {
    totalWeeks: weeklyWorkload.length,
    flaggedWeeks: 0,
    easyWeeks: 0,
    totalHours: 0,
    maxHours: 0,
    averageHours: 0,
    statusDistribution: {},
    upcomingPackedWeeks: [],
  };

  if (!Array.isArray(weeklyWorkload)) return stats;

  weeklyWorkload.forEach((week) => {
    stats.statusDistribution[week.status] =
      (stats.statusDistribution[week.status] || 0) + 1;

    if (week.status !== "NORMAL" && week.status !== "LIGHT") {
      stats.flaggedWeeks++;

      const weekStart = new Date(week.weekStart._seconds * 1000);
      const today = new Date();
      if (weekStart > today) {
        stats.upcomingPackedWeeks.push({
          week: week.week,
          weekStart: weekStart,
          status: week.status,
          totalHours: week.totalHours,
        });
      }
    } else {
      stats.easyWeeks++;
    }

    stats.totalHours += week.totalHours || 0;
    stats.maxHours = Math.max(stats.maxHours, week.totalHours || 0);
  });

  stats.averageHours =
    stats.totalWeeks > 0 ? (stats.totalHours / stats.totalWeeks).toFixed(1) : 0;

  stats.upcomingPackedWeeks.sort((a, b) => a.weekStart - b.weekStart);

  return stats;
}

// Generate tips based on workload (Fallback if AI timetable fails)
function generateWorkloadTips(status, totalHours, breakdown = []) {
  const tips = [];

  if (status === "OVERLOADED" || totalHours > 20) {
    tips.push("Break tasks into smaller chunks and take regular breaks");
    tips.push("Consider speaking with your academic advisor");
    tips.push("Use the Pomodoro technique: 25 min work, 5 min rest");
  } else if (status === "HEAVY" || totalHours > 15) {
    tips.push("Start preparing materials early this week");
    tips.push("Prioritize tasks based on deadlines");
    tips.push("Use time-blocking to stay focused");
  } else if (status === "BUSY" || totalHours > 10) {
    tips.push("Create a schedule to track all assignments");
    tips.push("Review materials in advance");
    tips.push("Group similar tasks together for efficiency");
  }

  if (breakdown.some((item) => item.type && item.type.includes("EXAM"))) {
    tips.push("Schedule dedicated study sessions for exams");
    tips.push("Create study guides or flashcards");
  }

  if (breakdown.some((item) => item.type && item.type.includes("ASSIGNMENT"))) {
    tips.push("Start research early to gather resources");
    tips.push("Break assignments into smaller milestones");
  }

  return tips;
}

// Timetable Table Component
const TimetableTable = ({ timetable }) => {
  if (!timetable || timetable.length === 0) return null;

  // Group by day for better organization
  const groupedByDay = timetable.reduce((acc, item) => {
    if (!acc[item.day]) {
      acc[item.day] = [];
    }
    acc[item.day].push(item);
    return acc;
  }, {});

  const days = Object.keys(groupedByDay).sort(
    (a, b) => parseInt(a) - parseInt(b),
  );

  return (
    <div className="overflow-x-auto -mx-4 sm:mx-0">
      <div className="inline-block min-w-full align-middle">
        <div className="overflow-hidden border border-amber-200 rounded-xl">
          <table className="min-w-full divide-y divide-amber-200">
            <thead className="bg-amber-100">
              <tr>
                <th
                  scope="col"
                  className="px-4 py-3 text-left text-xs font-medium text-amber-800 uppercase tracking-wider"
                >
                  Day
                </th>
                <th
                  scope="col"
                  className="px-4 py-3 text-left text-xs font-medium text-amber-800 uppercase tracking-wider"
                >
                  Subject
                </th>
                <th
                  scope="col"
                  className="px-4 py-3 text-left text-xs font-medium text-amber-800 uppercase tracking-wider"
                >
                  Task
                </th>
                <th
                  scope="col"
                  className="px-4 py-3 text-left text-xs font-medium text-amber-800 uppercase tracking-wider"
                >
                  Duration
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-amber-100">
              {days.map((day) =>
                groupedByDay[day].map((item, idx) => (
                  <tr
                    key={`${day}-${idx}`}
                    className="hover:bg-amber-50 transition-colors"
                  >
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center">
                        <span className="font-medium text-gray-900">
                          Day {item.day}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="text-sm text-gray-900 font-medium">
                        {item.subject}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-gray-600 line-clamp-2">
                        {item.task}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-amber-100 text-amber-800">
                        {item.hours} {item.hours === 1 ? "hour" : "hours"}
                      </span>
                    </td>
                  </tr>
                )),
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

/* ---------------- COMPONENT ---------------- */

const StudentDashboard = () => {
  const SEMESTER_START_DATE = "2026-02-10";
  const [studentId, setStudentId] = useState(null);
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

  // Initialize week options
  useEffect(() => {
    setWeekOptions(generateWeekOptions(SEMESTER_START_DATE));
  }, []);

  // Update workload stats when data changes
  useEffect(() => {
    if (weeklyWorkload.length > 0) {
      setWorkloadStats(calculateWorkloadStats(weeklyWorkload));
    }
  }, [weeklyWorkload]);

  // Load backend reminders
  const loadBackendReminders = async () => {
    if (!studentId) return;

    try {
      setLoadingReminders(true);
      const reminderData = await fetchActiveReminders(studentId);

      if (reminderData.reminders && reminderData.reminders.length > 0) {
        const parsedReminders = reminderData.reminders.map((reminder) => ({
          ...reminder,
          targetWeekStart: new Date(reminder.targetWeekStart),
          createdAt: new Date(reminder.createdAt),
        }));
        setBackendReminders(parsedReminders);
      } else if (weeklyWorkload.length > 0) {
        // Check if there are upcoming packed weeks
        const today = new Date();
        const twoWeeksFromNow = new Date(
          today.getTime() + 14 * 24 * 60 * 60 * 1000,
        );

        const upcomingPackedWeeks = weeklyWorkload.filter((week) => {
          if (!week.weekStart?._seconds) return false;
          const weekStart = new Date(week.weekStart._seconds * 1000);
          return (
            (week.status === "BUSY" ||
              week.status === "HEAVY" ||
              week.status === "OVERLOADED") &&
            weekStart > today &&
            weekStart <= twoWeeksFromNow
          );
        });

        if (upcomingPackedWeeks.length > 0) {
          await generateBusyWeekReminders(studentId);
          const newReminderData = await fetchActiveReminders(studentId);
          if (newReminderData.reminders) {
            const parsedReminders = newReminderData.reminders.map(
              (reminder) => ({
                ...reminder,
                targetWeekStart: new Date(reminder.targetWeekStart),
                createdAt: new Date(reminder.createdAt),
              }),
            );
            setBackendReminders(parsedReminders);
          }
        }
      }

      setHasLoadedReminders(true);
    } catch (error) {
      console.error("Error loading reminders:", error);
      setBackendReminders([]);
      setHasLoadedReminders(true);
    } finally {
      setLoadingReminders(false);
    }
  };

  // Dismiss a reminder
  const handleDismissReminder = async (reminderId) => {
    try {
      await dismissReminder(reminderId, studentId);
      setBackendReminders((prev) => prev.filter((r) => r.id !== reminderId));
    } catch (err) {
      console.error("Error dismissing reminder:", err);
    }
  };

  // Auth effect
  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setStudentId(user.uid);
      } else {
        setStudentId(null);
      }
    });
    return () => unsubscribe();
  }, []);

  // Load dashboard data
  useEffect(() => {
    if (!studentId) return;

    async function loadDashboard() {
      try {
        setLoading(true);
        const enrollment = await fetchStudentEnrollment(studentId);
        setSubjects(enrollment?.subjects || []);

        await generateWorkloadIfNeeded(studentId, SEMESTER_START_DATE);

        const [weeklyResponse, alertRes] = await Promise.all([
          fetchWeeklyWorkload(studentId),
          fetchLectureAlerts(),
        ]);

        const weeks = Array.isArray(weeklyResponse?.weeks)
          ? weeklyResponse.weeks
          : [];

        setWeeklyWorkload(weeks);
        setLectureAlerts(alertRes?.alerts || []);
      } catch (err) {
        console.error("Dashboard error:", err);
      } finally {
        setLoading(false);
      }
    }

    loadDashboard();
  }, [studentId]);

  // Load reminders when workload is available
  useEffect(() => {
    if (!loading && weeklyWorkload.length > 0 && !hasLoadedReminders) {
      loadBackendReminders();
    }
  }, [loading, weeklyWorkload, hasLoadedReminders]);

  // Periodic reminder refresh
  useEffect(() => {
    const intervalId = setInterval(
      () => {
        if (hasLoadedReminders) {
          loadBackendReminders();
        }
      },
      5 * 60 * 1000,
    );

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
      return "Date error";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="relative">
            <div className="w-20 h-20 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto"></div>
            <GraduationCap className="w-8 h-8 text-blue-600 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
          </div>
          <p className="text-gray-600 mt-4 font-medium">
            Loading your dashboard...
          </p>
          <p className="text-sm text-gray-500 mt-1">
            Preparing your personalized overview
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <div className="max-w-7xl mx-auto p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-6">
        {/* HEADER */}
        <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm border border-blue-100 p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center gap-3 sm:gap-4 w-full sm:w-auto">
              <div className="bg-gradient-to-br from-blue-600 to-indigo-600 p-2 sm:p-3 rounded-xl shadow-lg shadow-blue-200 flex-shrink-0">
                <GraduationCap className="text-white w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div className="flex-1 sm:flex-none">
                <h1 className="text-xl sm:text-2xl font-bold text-gray-800">
                  Student Dashboard
                </h1>
                <div className="flex flex-wrap items-center gap-2 mt-1">
                  <span className="px-2 sm:px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs sm:text-sm font-medium">
                    Week {currentWeek}
                  </span>
                  <span className="text-xs sm:text-sm text-gray-500">•</span>
                  <span className="text-xs sm:text-sm text-gray-600">
                    {academicPeriod.semester}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto justify-end">
              {/* View Toggle */}
              <div className="flex items-center bg-blue-50 rounded-xl p-1">
                <button
                  onClick={() => setCalendarView("week")}
                  className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-all flex items-center gap-1 sm:gap-2 ${
                    calendarView === "week"
                      ? "bg-white text-blue-700 shadow-sm"
                      : "text-gray-600 hover:text-blue-700"
                  }`}
                >
                  <Grid className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span className="hidden xs:inline">Week</span>
                </button>
                <button
                  onClick={() => setCalendarView("month")}
                  className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-all flex items-center gap-1 sm:gap-2 ${
                    calendarView === "month"
                      ? "bg-white text-blue-700 shadow-sm"
                      : "text-gray-600 hover:text-blue-700"
                  }`}
                >
                  <Calendar className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span className="hidden xs:inline">Month</span>
                </button>
              </div>

              {/* Notifications */}
              <div className="relative">
                <button className="p-1.5 sm:p-2 hover:bg-blue-50 rounded-xl transition-colors relative">
                  <Bell className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" />
                  {(lectureAlerts.length > 0 ||
                    backendReminders.length > 0) && (
                    <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white"></span>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* BACKEND PACKED WEEK REMINDERS */}
        {loadingReminders ? (
          <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm border border-blue-100 p-6 sm:p-8">
            <div className="flex items-center justify-center gap-3">
              <Loader className="w-5 h-5 text-blue-600 animate-spin" />
              <span className="text-sm sm:text-base text-gray-600">
                Checking for upcoming packed weeks...
              </span>
            </div>
          </div>
        ) : backendReminders.length > 0 ? (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
              <h3 className="font-semibold text-gray-800 flex items-center gap-2 text-base sm:text-lg">
                <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-amber-500" />
                Upcoming Week Alerts ({backendReminders.length})
              </h3>
              <span className="text-xs text-gray-500 bg-white px-3 py-1 rounded-full border">
                Updated{" "}
                {new Date().toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </div>

            {backendReminders.map((reminder) => {
              const statusInfo = getStatusLabel(reminder.targetStatus);
              const StatusIcon = statusInfo.icon;
              const tips = generateWorkloadTips(
                reminder.targetStatus,
                reminder.targetTotalHours,
                reminder.targetBreakdown || [],
              );

              const daysUntil = Math.floor(
                (reminder.targetWeekStart - new Date()) / (1000 * 60 * 60 * 24),
              );

              return (
                <div
                  key={reminder.id}
                  className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl sm:rounded-2xl border-l-4 border-amber-500 p-4 sm:p-6 relative group"
                >
                  <button
                    onClick={() => handleDismissReminder(reminder.id)}
                    className="absolute top-3 right-3 p-1.5 text-amber-600 hover:text-amber-800 hover:bg-amber-100 rounded-lg transition-all"
                    aria-label="Dismiss reminder"
                  >
                    <X className="w-4 h-4" />
                  </button>

                  <div className="flex flex-col gap-4">
                    <div className="flex items-start gap-3 sm:gap-4">
                      <div className="bg-amber-100 p-2 sm:p-3 rounded-xl flex-shrink-0">
                        <StatusIcon
                          className={`w-5 h-5 sm:w-6 sm:h-6 ${statusInfo.iconColor}`}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          <h4 className="font-bold text-gray-800 text-base sm:text-lg">
                            Week {reminder.targetBusyWeek} • {statusInfo.label}
                          </h4>
                          <span className="px-2 py-0.5 sm:px-3 sm:py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-medium whitespace-nowrap">
                            {daysUntil > 0
                              ? `${daysUntil} ${daysUntil === 1 ? "day" : "days"} away`
                              : daysUntil === 0
                                ? "Starting today!"
                                : "This week!"}
                          </span>
                        </div>

                        <p className="text-sm sm:text-base text-gray-600 mb-4">
                          {reminder.message ||
                            `You have ${reminder.targetTotalHours} hours of work scheduled.`}
                        </p>

                        {/* AI TIMETABLE AS TABLE */}
                        {reminder.timetable && reminder.timetable.length > 0 ? (
                          <div className="mb-4">
                            <p className="text-sm font-medium text-gray-800 mb-3 flex items-center gap-1">
                              <Sparkles className="w-4 h-4 text-amber-500" />
                              Your Personalized Study Plan
                            </p>
                            <TimetableTable timetable={reminder.timetable} />
                          </div>
                        ) : (
                          /* Fallback to Standard Tips if AI timetable isn't present */
                          tips.length > 0 && (
                            <div className="bg-white/60 rounded-xl p-3 sm:p-4">
                              <p className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
                                <Lightbulb className="w-4 h-4 text-amber-500" />
                                Quick Tips:
                              </p>
                              <ul className="space-y-1">
                                {tips.slice(0, 3).map((tip, idx) => (
                                  <li
                                    key={idx}
                                    className="flex items-start gap-2 text-xs sm:text-sm text-gray-600"
                                  >
                                    <span className="text-amber-500 mt-1">
                                      •
                                    </span>
                                    <span>{tip}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )
                        )}

                        {/* Week start info - subtle */}
                        <p className="text-xs text-gray-400 mt-2">
                          Week starts {formatDateSafe(reminder.targetWeekStart)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          hasLoadedReminders && (
            <div className="bg-gradient-to-r from-emerald-50 to-green-50 rounded-xl sm:rounded-2xl border border-emerald-200 p-4 sm:p-6">
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="bg-emerald-100 p-2 sm:p-3 rounded-xl flex-shrink-0">
                  <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-600" />
                </div>
                <div>
                  <p className="font-semibold text-emerald-800 text-sm sm:text-base">
                    All caught up!
                  </p>
                  <p className="text-xs sm:text-sm text-emerald-700 mt-1">
                    No packed weeks detected in the next 2 weeks. Keep up the
                    good work!
                  </p>
                </div>
              </div>
            </div>
          )
        )}

        {/* WORKLOAD STATISTICS */}
        {workloadStats && (
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm border border-blue-100 p-3 sm:p-6 hover:shadow-md transition-all">
              <div className="flex items-center justify-between mb-2 sm:mb-4">
                <div className="bg-amber-100 p-1.5 sm:p-2 rounded-lg">
                  <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 text-amber-600" />
                </div>
                <span className="text-xl sm:text-2xl font-bold text-gray-800">
                  {workloadStats.flaggedWeeks}
                </span>
              </div>
              <p className="text-xs sm:text-sm font-medium text-gray-600">
                Packed Weeks
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Out of {workloadStats.totalWeeks} weeks
              </p>
            </div>

            <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm border border-blue-100 p-3 sm:p-6 hover:shadow-md transition-all">
              <div className="flex items-center justify-between mb-2 sm:mb-4">
                <div className="bg-blue-100 p-1.5 sm:p-2 rounded-lg">
                  <BarChart3 className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                </div>
                <span className="text-xl sm:text-2xl font-bold text-gray-800">
                  {workloadStats.averageHours}h
                </span>
              </div>
              <p className="text-xs sm:text-sm font-medium text-gray-600">
                Avg Weekly Hours
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Peak: {workloadStats.maxHours}h
              </p>
            </div>

            <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm border border-blue-100 p-3 sm:p-6 hover:shadow-md transition-all">
              <div className="flex items-center justify-between mb-2 sm:mb-4">
                <div className="bg-emerald-100 p-1.5 sm:p-2 rounded-lg">
                  <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600" />
                </div>
                <span className="text-xl sm:text-2xl font-bold text-gray-800">
                  {workloadStats.easyWeeks}
                </span>
              </div>
              <p className="text-xs sm:text-sm font-medium text-gray-600">
                Easy Weeks
              </p>
              <p className="text-xs text-gray-400 mt-1">Light workload</p>
            </div>

            <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm border border-blue-100 p-3 sm:p-6 hover:shadow-md transition-all">
              <div className="flex items-center justify-between mb-2 sm:mb-4">
                <div className="bg-purple-100 p-1.5 sm:p-2 rounded-lg">
                  <Target className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600" />
                </div>
                <span className="text-xl sm:text-2xl font-bold text-gray-800">
                  {backendReminders.length}
                </span>
              </div>
              <p className="text-xs sm:text-sm font-medium text-gray-600">
                Active Alerts
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Upcoming packed weeks
              </p>
            </div>
          </div>
        )}

        {/* LECTURE ALERTS */}
        {lectureAlerts.length > 0 && (
          <div className="space-y-3">
            {lectureAlerts.map((alert, i) => (
              <div
                key={i}
                className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl sm:rounded-2xl border-l-4 border-blue-500 p-3 sm:p-4"
              >
                <div className="flex flex-col sm:flex-row justify-between items-start gap-3">
                  <div className="flex items-start gap-3 w-full sm:w-auto">
                    <div className="bg-blue-100 p-1.5 sm:p-2 rounded-lg flex-shrink-0">
                      <BookOpen className="w-4 h-4 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-gray-800 text-sm sm:text-base">
                        {alert.subjectName}
                      </p>
                      <p className="text-xs sm:text-sm text-gray-600 mt-1">
                        {alert.message}
                      </p>
                    </div>
                  </div>
                  {alert.joinLink && (
                    <a
                      href={alert.joinLink}
                      target="_blank"
                      rel="noreferrer"
                      className="w-full sm:w-auto px-3 sm:px-4 py-2 bg-blue-600 text-white text-xs sm:text-sm rounded-xl hover:bg-blue-700 transition-all shadow-sm flex items-center justify-center gap-2"
                    >
                      Join Now
                      <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4" />
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* WEEK SELECTOR */}
        <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm border border-blue-100 p-4 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
            <h3 className="font-semibold text-gray-800 flex items-center gap-2 text-sm sm:text-base">
              <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
              Semester Overview
            </h3>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 text-xs">
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-emerald-500"></div>
                  <span className="text-gray-600">Easy</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-amber-500"></div>
                  <span className="text-gray-600">Packed</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-1.5 sm:gap-2">
            {weekOptions.map((week) => {
              const status = getWeekStatus(week.weekNumber);
              const isCurrentWeek = week.weekNumber === currentWeek;
              const statusInfo = getStatusLabel(status);
              const Icon = statusInfo.icon;

              return (
                <button
                  key={week.weekNumber}
                  onClick={() => handleWeekSelect(week.weekNumber)}
                  className={`px-2 sm:px-4 py-1.5 sm:py-2 rounded-lg sm:rounded-xl text-xs sm:text-sm font-medium transition-all flex items-center gap-1 sm:gap-2 border ${
                    isCurrentWeek
                      ? "ring-1 sm:ring-2 ring-blue-500 ring-offset-1 sm:ring-offset-2"
                      : ""
                  } ${
                    status === "NORMAL" || status === "LIGHT"
                      ? "bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100"
                      : "bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100"
                  }`}
                >
                  <Icon
                    className={`w-3 h-3 sm:w-4 sm:h-4 ${statusInfo.iconColor}`}
                  />
                  <span className="hidden xs:inline">{week.label}</span>
                  <span className="xs:hidden">W{week.weekNumber}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* UPCOMING PACKED WEEKS */}
        {workloadStats?.upcomingPackedWeeks.length > 0 && (
          <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm border border-blue-100 p-4 sm:p-6">
            <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2 text-sm sm:text-base">
              <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 text-amber-600" />
              Upcoming Packed Weeks
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              {workloadStats.upcomingPackedWeeks
                .slice(0, 3)
                .map((packedWeek, index) => {
                  const statusInfo = getStatusLabel(packedWeek.status);
                  const StatusIcon = statusInfo.icon;

                  return (
                    <button
                      key={index}
                      onClick={() => handleWeekSelect(packedWeek.week)}
                      className={`text-left p-3 sm:p-4 rounded-xl border-2 transition-all hover:shadow-md ${statusInfo.bgLight} border-amber-200`}
                    >
                      <div className="flex items-start justify-between mb-2 sm:mb-3">
                        <div>
                          <p className="font-bold text-gray-800 text-sm sm:text-base">
                            Week {packedWeek.week}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            {packedWeek.weekStart.toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                            })}
                          </p>
                        </div>
                        <div
                          className={`p-1.5 sm:p-2 rounded-lg ${statusInfo.color.split(" ")[0]}`}
                        >
                          <StatusIcon
                            className={`w-3 h-3 sm:w-4 sm:h-4 ${statusInfo.iconColor}`}
                          />
                        </div>
                      </div>
                      <div className="flex justify-between items-center text-xs sm:text-sm">
                        <span className="text-gray-600">Total hours:</span>
                        <span className="font-bold text-amber-700">
                          {packedWeek.totalHours}h
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        {statusInfo.description}
                      </p>
                    </button>
                  );
                })}
            </div>
          </div>
        )}

        {/* WORKLOAD CALENDAR */}
        <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm border border-blue-100 overflow-hidden">
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
          <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm border border-blue-100 p-4 sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
              <h3 className="font-semibold text-gray-800 flex items-center gap-2 text-sm sm:text-base">
                <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                Week {selectedDate.week} Details
              </h3>
              {(() => {
                const statusInfo = getStatusLabel(selectedDate.status);
                const StatusIcon = statusInfo.icon;
                return (
                  <div
                    className={`flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl ${statusInfo.color} text-xs sm:text-sm`}
                  >
                    <StatusIcon
                      className={`w-3 h-3 sm:w-4 sm:h-4 ${statusInfo.iconColor}`}
                    />
                    <span className="font-medium">{statusInfo.label}</span>
                  </div>
                );
              })()}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-4 rounded-xl">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="bg-blue-100 p-2 rounded-lg">
                      <Clock className="w-4 h-4 text-blue-600" />
                    </div>
                    <div className="text-sm sm:text-base">
                      <p className="font-medium text-gray-800">
                        {new Date(
                          selectedDate.weekStart._seconds * 1000,
                        ).toLocaleDateString("en-US", {
                          weekday: "long",
                          month: "long",
                          day: "numeric",
                        })}
                      </p>
                      <p className="text-xs sm:text-sm text-gray-600">
                        Semester Week{" "}
                        {calculateAcademicWeek(
                          SEMESTER_START_DATE,
                          new Date(selectedDate.weekStart._seconds * 1000),
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-white p-3 rounded-lg">
                      <p className="text-xs text-gray-500 mb-1">Total Hours</p>
                      <p className="text-lg sm:text-xl font-bold text-blue-600">
                        {selectedDate.totalHours || 0}h
                      </p>
                    </div>
                    <div className="bg-white p-3 rounded-lg">
                      <p className="text-xs text-gray-500 mb-1">Work Items</p>
                      <p className="text-lg sm:text-xl font-bold text-gray-800">
                        {selectedDate.breakdown?.length || 0}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-medium text-gray-800 mb-3 text-sm sm:text-base">
                  Work Breakdown
                </h4>
                {selectedDate.breakdown && selectedDate.breakdown.length > 0 ? (
                  <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
                    {selectedDate.breakdown.map((item, index) => (
                      <div
                        key={index}
                        className="p-3 border border-blue-100 rounded-xl hover:bg-blue-50 transition-all"
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-gray-800 text-sm sm:text-base truncate">
                              {item.subjectName}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              {item.type}
                            </p>
                          </div>
                          <span className="px-2 sm:px-3 py-1 bg-blue-100 text-blue-700 rounded-lg text-xs sm:text-sm font-medium ml-2 flex-shrink-0">
                            {item.hours}h
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 bg-gray-50 rounded-xl border border-dashed">
                    <BookOpen className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">
                      No workload items for this week
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* SUBJECTS SUMMARY */}
        <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm border border-blue-100 p-4 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
            <h3 className="font-semibold text-gray-800 flex items-center gap-2 text-sm sm:text-base">
              <BookOpen className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
              My Subjects
            </h3>
            <span className="px-3 sm:px-4 py-1.5 sm:py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl text-xs sm:text-sm font-medium shadow-sm">
              {subjects.length} enrolled
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {subjects.map((subject) => (
              <div
                key={subject.subjectId}
                className="border border-blue-100 rounded-xl p-4 sm:p-5 hover:shadow-md transition-all hover:border-blue-300 group"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="bg-gradient-to-br from-blue-600 to-indigo-600 w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center text-white font-bold text-base sm:text-lg shadow-sm">
                    {subject.subjectName?.charAt(0) || "?"}
                  </div>
                  <span
                    className={`px-2 sm:px-3 py-1 rounded-lg text-xs font-medium ${
                      subject.type === "CORE"
                        ? "bg-purple-100 text-purple-700"
                        : subject.type === "INTERNSHIP_SUBMISSION"
                          ? "bg-orange-100 text-orange-700"
                          : "bg-emerald-100 text-emerald-700"
                    }`}
                  >
                    {subject.type?.replace(/_/g, " ") || "ELECTIVE"}
                  </span>
                </div>

                <div className="space-y-3">
                  <div>
                    <p className="font-semibold text-gray-800 group-hover:text-blue-600 transition-colors text-sm sm:text-base">
                      {subject.subjectName}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {subject.subjectCode}
                    </p>
                  </div>

                  <div className="space-y-2 pt-2 border-t border-blue-50">
                    <div className="flex items-center justify-between text-xs sm:text-sm">
                      <span className="text-gray-500">Credits</span>
                      <span className="font-medium text-gray-800">
                        {subject.credits || 3}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs sm:text-sm">
                      <span className="text-gray-500">Delivery</span>
                      <span className="font-medium text-gray-800">
                        {subject.deliveryMode || "On Campus"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs sm:text-sm">
                      <span className="text-gray-500">Instructor</span>
                      <span className="font-medium text-gray-800 truncate max-w-[100px] sm:max-w-[120px]">
                        {subject.instructor || "TBA"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* MOTIVATIONAL FOOTER */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl sm:rounded-2xl p-4 sm:p-6 text-white">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="bg-white/20 p-2 sm:p-3 rounded-xl backdrop-blur-sm flex-shrink-0">
              <Award className="w-5 h-5 sm:w-8 sm:h-8" />
            </div>
            <div>
              <p className="font-semibold text-sm sm:text-lg">
                Keep up the great work!
              </p>
              <p className="text-blue-100 text-xs sm:text-sm mt-1">
                You're on track with {subjects.length} subjects this semester.
                Stay organized and succeed!
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;

// import { useEffect, useState } from "react";
// import {
//   GraduationCap,
//   Bell,
//   Calendar,
//   Users,
//   BookOpen,
//   Clock,
//   Grid,
//   AlertTriangle,
//   CheckCircle,
//   TrendingUp,
//   BarChart3,
//   Lightbulb,
//   X,
//   Loader,
//   ChevronRight,
//   Sparkles,
//   Target,
//   Award,
// } from "lucide-react";
// import { getAuth, onAuthStateChanged } from "firebase/auth";
// import WorkloadCalendar from "../componets/WorkloadCalendar";

// import {
//   fetchWeeklyWorkload,
//   fetchLectureAlerts,
//   fetchStudentEnrollment,
//   generateWorkloadIfNeeded,
//   fetchActiveReminders,
//   dismissReminder,
//   generateBusyWeekReminders,
// } from "../services/api/workloadService";

// /* ---------------- HELPERS ---------------- */

// function calculateAcademicWeek(semesterStartDate, targetDate = new Date()) {
//   const start = new Date(semesterStartDate);
//   const today = new Date(targetDate);
//   start.setHours(0, 0, 0, 0);
//   today.setHours(0, 0, 0, 0);

//   const diffDays = Math.floor(
//     (today.getTime() - start.getTime()) / (1000 * 60 * 60 * 24),
//   );

//   return Math.max(1, Math.floor(diffDays / 7) + 1);
// }

// function getAcademicPeriod(semesterStartDate) {
//   const start = new Date(semesterStartDate);
//   const today = new Date();

//   return {
//     month: today.toLocaleDateString("en-US", { month: "long" }),
//     year: today.getFullYear(),
//     semester: `${start.getMonth() < 6 ? "Spring" : "Fall"} ${start.getFullYear()}`,
//   };
// }

// // Enhanced status helper function with user-friendly labels
// const getStatusLabel = (status = "NORMAL") => {
//   const statusMap = {
//     NORMAL: {
//       label: "Easy Week",
//       description: "Light workload - perfect for catching up",
//       color: "bg-emerald-50 text-emerald-700 border border-emerald-200",
//       icon: CheckCircle,
//       iconColor: "text-emerald-500",
//       bgLight: "bg-emerald-50",
//       emoji: "🌿",
//     },
//     BUSY: {
//       label: "Packed Week",
//       description: "Full schedule - plan ahead",
//       color: "bg-amber-50 text-amber-700 border border-amber-200",
//       icon: AlertTriangle,
//       iconColor: "text-amber-500",
//       bgLight: "bg-amber-50",
//       emoji: "📚",
//     },
//     LIGHT: {
//       label: "Easy Week",
//       description: "Light workload - perfect for catching up",
//       color: "bg-emerald-50 text-emerald-700 border border-emerald-200",
//       icon: CheckCircle,
//       iconColor: "text-emerald-500",
//       bgLight: "bg-emerald-50",
//       emoji: "🌿",
//     },
//     MODERATE: {
//       label: "Steady Pace",
//       description: "Consistent workload",
//       color: "bg-indigo-50 text-indigo-700 border border-indigo-200",
//       icon: TrendingUp,
//       iconColor: "text-indigo-500",
//       bgLight: "bg-indigo-50",
//       emoji: "⚖️",
//     },
//     HEAVY: {
//       label: "Intense Week",
//       description: "Lots to do - stay focused",
//       color: "bg-orange-50 text-orange-700 border border-orange-200",
//       icon: AlertTriangle,
//       iconColor: "text-orange-500",
//       bgLight: "bg-orange-50",
//       emoji: "🔥",
//     },
//     OVERLOADED: {
//       label: "Full Plate",
//       description: "Maximum capacity - prioritize",
//       color: "bg-red-50 text-red-700 border border-red-200",
//       icon: AlertTriangle,
//       iconColor: "text-red-500",
//       bgLight: "bg-red-50",
//       emoji: "⚡",
//     },
//   };

//   return (
//     statusMap[status] || {
//       label: status.charAt(0) + status.slice(1).toLowerCase(),
//       description: "Week with activities",
//       color: "bg-gray-50 text-gray-700 border border-gray-200",
//       icon: CheckCircle,
//       iconColor: "text-gray-500",
//       bgLight: "bg-gray-50",
//       emoji: "📌",
//     }
//   );
// };

// // Generate weeks for week selector
// function generateWeekOptions(semesterStart) {
//   const totalWeeks = 16; // Typical semester length
//   const weeks = [];

//   for (let i = 1; i <= totalWeeks; i++) {
//     const weekStart = new Date(semesterStart);
//     weekStart.setDate(weekStart.getDate() + (i - 1) * 7);

//     weeks.push({
//       weekNumber: i,
//       startDate: weekStart,
//       label: `Week ${i}`,
//       fullLabel: `Week ${i} (${weekStart.toLocaleDateString("en-US", { month: "short", day: "numeric" })})`,
//     });
//   }

//   return weeks;
// }

// // Calculate workload statistics from API response
// function calculateWorkloadStats(weeklyWorkload) {
//   const stats = {
//     totalWeeks: weeklyWorkload.length,
//     flaggedWeeks: 0,
//     easyWeeks: 0,
//     totalHours: 0,
//     maxHours: 0,
//     averageHours: 0,
//     statusDistribution: {},
//     upcomingPackedWeeks: [],
//   };

//   if (!Array.isArray(weeklyWorkload)) return stats;

//   weeklyWorkload.forEach((week) => {
//     stats.statusDistribution[week.status] =
//       (stats.statusDistribution[week.status] || 0) + 1;

//     if (week.status !== "NORMAL" && week.status !== "LIGHT") {
//       stats.flaggedWeeks++;

//       const weekStart = new Date(week.weekStart._seconds * 1000);
//       const today = new Date();
//       if (weekStart > today) {
//         stats.upcomingPackedWeeks.push({
//           week: week.week,
//           weekStart: weekStart,
//           status: week.status,
//           totalHours: week.totalHours,
//         });
//       }
//     } else {
//       stats.easyWeeks++;
//     }

//     stats.totalHours += week.totalHours || 0;
//     stats.maxHours = Math.max(stats.maxHours, week.totalHours || 0);
//   });

//   stats.averageHours =
//     stats.totalWeeks > 0 ? (stats.totalHours / stats.totalWeeks).toFixed(1) : 0;

//   stats.upcomingPackedWeeks.sort((a, b) => a.weekStart - b.weekStart);

//   return stats;
// }

// // Generate tips based on workload (Fallback if AI timetable fails)
// function generateWorkloadTips(status, totalHours, breakdown = []) {
//   const tips = [];

//   if (status === "OVERLOADED" || totalHours > 20) {
//     tips.push("Break tasks into smaller chunks and take regular breaks");
//     tips.push("Consider speaking with your academic advisor");
//     tips.push("Use the Pomodoro technique: 25 min work, 5 min rest");
//   } else if (status === "HEAVY" || totalHours > 15) {
//     tips.push("Start preparing materials early this week");
//     tips.push("Prioritize tasks based on deadlines");
//     tips.push("Use time-blocking to stay focused");
//   } else if (status === "BUSY" || totalHours > 10) {
//     tips.push("Create a schedule to track all assignments");
//     tips.push("Review materials in advance");
//     tips.push("Group similar tasks together for efficiency");
//   }

//   if (breakdown.some((item) => item.type && item.type.includes("EXAM"))) {
//     tips.push("Schedule dedicated study sessions for exams");
//     tips.push("Create study guides or flashcards");
//   }

//   if (breakdown.some((item) => item.type && item.type.includes("ASSIGNMENT"))) {
//     tips.push("Start research early to gather resources");
//     tips.push("Break assignments into smaller milestones");
//   }

//   return tips;
// }

// // Timetable Table Component
// const TimetableTable = ({ timetable }) => {
//   if (!timetable || timetable.length === 0) return null;

//   // Group by day for better organization
//   const groupedByDay = timetable.reduce((acc, item) => {
//     if (!acc[item.day]) {
//       acc[item.day] = [];
//     }
//     acc[item.day].push(item);
//     return acc;
//   }, {});

//   const days = Object.keys(groupedByDay).sort(
//     (a, b) => parseInt(a) - parseInt(b),
//   );

//   return (
//     <div className="overflow-x-auto -mx-4 sm:mx-0 shadow-sm rounded-xl">
//       <div className="inline-block min-w-full align-middle">
//         <div className="overflow-hidden border border-amber-200/60 rounded-xl">
//           <table className="min-w-full divide-y divide-amber-200/60">
//             <thead className="bg-amber-100/50 backdrop-blur-sm">
//               <tr>
//                 <th
//                   scope="col"
//                   className="px-4 py-3 text-left text-xs font-bold text-amber-800 uppercase tracking-wider"
//                 >
//                   Day
//                 </th>
//                 <th
//                   scope="col"
//                   className="px-4 py-3 text-left text-xs font-bold text-amber-800 uppercase tracking-wider"
//                 >
//                   Subject
//                 </th>
//                 <th
//                   scope="col"
//                   className="px-4 py-3 text-left text-xs font-bold text-amber-800 uppercase tracking-wider"
//                 >
//                   Task
//                 </th>
//                 <th
//                   scope="col"
//                   className="px-4 py-3 text-left text-xs font-bold text-amber-800 uppercase tracking-wider"
//                 >
//                   Duration
//                 </th>
//               </tr>
//             </thead>
//             <tbody className="bg-white/80 divide-y divide-amber-100/50">
//               {days.map((day) =>
//                 groupedByDay[day].map((item, idx) => (
//                   <tr
//                     key={`${day}-${idx}`}
//                     className="hover:bg-amber-50/80 transition-colors duration-200"
//                   >
//                     <td className="px-4 py-3 whitespace-nowrap">
//                       <div className="flex items-center">
//                         <span className="font-semibold text-gray-900">
//                           Day {item.day}
//                         </span>
//                       </div>
//                     </td>
//                     <td className="px-4 py-3 whitespace-nowrap">
//                       <span className="text-sm text-gray-900 font-medium">
//                         {item.subject}
//                       </span>
//                     </td>
//                     <td className="px-4 py-3">
//                       <span className="text-sm text-gray-600 line-clamp-2">
//                         {item.task}
//                       </span>
//                     </td>
//                     <td className="px-4 py-3 whitespace-nowrap">
//                       <span className="px-2.5 py-1 inline-flex text-xs leading-5 font-bold rounded-full bg-amber-100 text-amber-800 shadow-sm">
//                         {item.hours} {item.hours === 1 ? "hour" : "hours"}
//                       </span>
//                     </td>
//                   </tr>
//                 )),
//               )}
//             </tbody>
//           </table>
//         </div>
//       </div>
//     </div>
//   );
// };

// /* ---------------- COMPONENT ---------------- */

// const StudentDashboard = () => {
//   const SEMESTER_START_DATE = "2026-02-10";
//   const [studentId, setStudentId] = useState(null);
//   const [weeklyWorkload, setWeeklyWorkload] = useState([]);
//   const [lectureAlerts, setLectureAlerts] = useState([]);
//   const [subjects, setSubjects] = useState([]);
//   const [selectedDate, setSelectedDate] = useState(null);
//   const [currentWeekStart, setCurrentWeekStart] = useState(new Date());
//   const [calendarView, setCalendarView] = useState("week");
//   const [loading, setLoading] = useState(true);
//   const [weekOptions, setWeekOptions] = useState([]);
//   const [workloadStats, setWorkloadStats] = useState(null);
//   const [backendReminders, setBackendReminders] = useState([]);
//   const [loadingReminders, setLoadingReminders] = useState(false);
//   const [hasLoadedReminders, setHasLoadedReminders] = useState(false);
//   const currentWeek = calculateAcademicWeek(
//     SEMESTER_START_DATE,
//     currentWeekStart,
//   );
//   const academicPeriod = getAcademicPeriod(SEMESTER_START_DATE);

//   // Initialize week options
//   useEffect(() => {
//     setWeekOptions(generateWeekOptions(SEMESTER_START_DATE));
//   }, []);

//   // Update workload stats when data changes
//   useEffect(() => {
//     if (weeklyWorkload.length > 0) {
//       setWorkloadStats(calculateWorkloadStats(weeklyWorkload));
//     }
//   }, [weeklyWorkload]);

//   // Load backend reminders
//   const loadBackendReminders = async () => {
//     if (!studentId) return;

//     try {
//       setLoadingReminders(true);
//       const reminderData = await fetchActiveReminders(studentId);

//       if (reminderData.reminders && reminderData.reminders.length > 0) {
//         const parsedReminders = reminderData.reminders.map((reminder) => ({
//           ...reminder,
//           targetWeekStart: new Date(reminder.targetWeekStart),
//           createdAt: new Date(reminder.createdAt),
//         }));
//         setBackendReminders(parsedReminders);
//       } else if (weeklyWorkload.length > 0) {
//         // Check if there are upcoming packed weeks
//         const today = new Date();
//         const twoWeeksFromNow = new Date(
//           today.getTime() + 14 * 24 * 60 * 60 * 1000,
//         );

//         const upcomingPackedWeeks = weeklyWorkload.filter((week) => {
//           if (!week.weekStart?._seconds) return false;
//           const weekStart = new Date(week.weekStart._seconds * 1000);
//           return (
//             (week.status === "BUSY" ||
//               week.status === "HEAVY" ||
//               week.status === "OVERLOADED") &&
//             weekStart > today &&
//             weekStart <= twoWeeksFromNow
//           );
//         });

//         if (upcomingPackedWeeks.length > 0) {
//           await generateBusyWeekReminders(studentId);
//           const newReminderData = await fetchActiveReminders(studentId);
//           if (newReminderData.reminders) {
//             const parsedReminders = newReminderData.reminders.map(
//               (reminder) => ({
//                 ...reminder,
//                 targetWeekStart: new Date(reminder.targetWeekStart),
//                 createdAt: new Date(reminder.createdAt),
//               }),
//             );
//             setBackendReminders(parsedReminders);
//           }
//         }
//       }

//       setHasLoadedReminders(true);
//     } catch (error) {
//       console.error("Error loading reminders:", error);
//       setBackendReminders([]);
//       setHasLoadedReminders(true);
//     } finally {
//       setLoadingReminders(false);
//     }
//   };

//   // Dismiss a reminder
//   const handleDismissReminder = async (reminderId) => {
//     try {
//       await dismissReminder(reminderId, studentId);
//       setBackendReminders((prev) => prev.filter((r) => r.id !== reminderId));
//     } catch (err) {
//       console.error("Error dismissing reminder:", err);
//     }
//   };

//   // Auth effect
//   useEffect(() => {
//     const auth = getAuth();
//     const unsubscribe = onAuthStateChanged(auth, (user) => {
//       if (user) {
//         setStudentId(user.uid);
//       } else {
//         setStudentId(null);
//       }
//     });
//     return () => unsubscribe();
//   }, []);

//   // Load dashboard data
//   useEffect(() => {
//     if (!studentId) return;

//     async function loadDashboard() {
//       try {
//         setLoading(true);
//         const enrollment = await fetchStudentEnrollment(studentId);
//         setSubjects(enrollment?.subjects || []);

//         await generateWorkloadIfNeeded(studentId, SEMESTER_START_DATE);

//         const [weeklyResponse, alertRes] = await Promise.all([
//           fetchWeeklyWorkload(studentId),
//           fetchLectureAlerts(),
//         ]);

//         const weeks = Array.isArray(weeklyResponse?.weeks)
//           ? weeklyResponse.weeks
//           : [];

//         setWeeklyWorkload(weeks);
//         setLectureAlerts(alertRes?.alerts || []);
//       } catch (err) {
//         console.error("Dashboard error:", err);
//       } finally {
//         setLoading(false);
//       }
//     }

//     loadDashboard();
//   }, [studentId]);

//   // Load reminders when workload is available
//   useEffect(() => {
//     if (!loading && weeklyWorkload.length > 0 && !hasLoadedReminders) {
//       loadBackendReminders();
//     }
//   }, [loading, weeklyWorkload, hasLoadedReminders]);

//   // Periodic reminder refresh
//   useEffect(() => {
//     const intervalId = setInterval(
//       () => {
//         if (hasLoadedReminders) {
//           loadBackendReminders();
//         }
//       },
//       5 * 60 * 1000,
//     );

//     return () => clearInterval(intervalId);
//   }, [hasLoadedReminders]);

//   const handleDayClick = (week) => setSelectedDate(week);

//   const handleWeekChange = (newWeekStart) => {
//     setCurrentWeekStart(newWeekStart);
//   };

//   const handleWeekSelect = (weekNumber) => {
//     const weekOption = weekOptions.find((w) => w.weekNumber === weekNumber);
//     if (weekOption) {
//       setCurrentWeekStart(weekOption.startDate);
//       const selectedWeek = weeklyWorkload.find((w) => w.week === weekNumber);
//       if (selectedWeek) {
//         setSelectedDate(selectedWeek);
//       }
//     }
//   };

//   const getWeekStatus = (weekNumber) => {
//     const weekData = weeklyWorkload.find((w) => w.week === weekNumber);
//     return weekData ? weekData.status : "NORMAL";
//   };

//   // Helper to format date safely
//   const formatDateSafe = (date) => {
//     if (!date) return "Date not available";
//     try {
//       if (typeof date === "string") {
//         return new Date(date).toLocaleDateString("en-US", {
//           weekday: "short",
//           month: "short",
//           day: "numeric",
//         });
//       } else if (date instanceof Date) {
//         return date.toLocaleDateString("en-US", {
//           weekday: "short",
//           month: "short",
//           day: "numeric",
//         });
//       }
//       return "Invalid date";
//     } catch (error) {
//       return "Date error";
//     }
//   };

//   if (loading) {
//     return (
//       <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-blue-50 flex items-center justify-center p-4">
//         <div className="text-center animate-pulse">
//           <div className="relative mb-6">
//             <div className="w-24 h-24 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin mx-auto shadow-lg"></div>
//             <GraduationCap className="w-10 h-10 text-indigo-600 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
//           </div>
//           <p className="text-gray-800 text-lg font-bold">
//             Loading your academic hub...
//           </p>
//           <p className="text-sm text-gray-500 mt-2 font-medium">
//             Syncing workload & schedules
//           </p>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <>
//       <style>{`
//         @keyframes fadeInUp {
//           from { opacity: 0; transform: translateY(20px); }
//           to { opacity: 1; transform: translateY(0); }
//         }
//         .animate-fade-in-up {
//           animation: fadeInUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
//           opacity: 0;
//         }
//         .delay-100 { animation-delay: 100ms; }
//         .delay-200 { animation-delay: 200ms; }
//         .delay-300 { animation-delay: 300ms; }
//         .delay-400 { animation-delay: 400ms; }
//         .delay-500 { animation-delay: 500ms; }
//       `}</style>

//       <div className="min-h-screen bg-slate-50 text-gray-800 font-sans">
//         <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6 lg:space-y-8">
//           {/* HEADER */}
//           <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 sm:p-6 animate-fade-in-up transition-shadow hover:shadow-md">
//             <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-5">
//               <div className="flex items-center gap-4 w-full sm:w-auto">
//                 <div className="bg-gradient-to-br from-blue-600 to-indigo-600 p-3 sm:p-4 rounded-xl shadow-lg shadow-indigo-200 flex-shrink-0 transform transition-transform hover:scale-105">
//                   <GraduationCap className="text-white w-6 h-6 sm:w-7 sm:h-7" />
//                 </div>
//                 <div className="flex-1 sm:flex-none">
//                   <h1 className="text-2xl sm:text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-700 to-indigo-600">
//                     Student Dashboard
//                   </h1>
//                   <div className="flex flex-wrap items-center gap-2 mt-1.5">
//                     <span className="px-3 py-1 bg-indigo-50 text-indigo-700 rounded-lg text-xs sm:text-sm font-bold shadow-sm">
//                       Week {currentWeek}
//                     </span>
//                     <span className="text-gray-300">•</span>
//                     <span className="text-xs sm:text-sm font-medium text-gray-500 uppercase tracking-wide">
//                       {academicPeriod.semester}
//                     </span>
//                   </div>
//                 </div>
//               </div>

//               <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
//                 {/* View Toggle */}
//                 <div className="flex items-center bg-gray-100 rounded-xl p-1 shadow-inner">
//                   <button
//                     onClick={() => setCalendarView("week")}
//                     className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all duration-300 flex items-center gap-2 ${
//                       calendarView === "week"
//                         ? "bg-white text-indigo-700 shadow-sm"
//                         : "text-gray-500 hover:text-indigo-600"
//                     }`}
//                   >
//                     <Grid className="w-4 h-4" />
//                     <span className="hidden xs:inline">Week</span>
//                   </button>
//                   <button
//                     onClick={() => setCalendarView("month")}
//                     className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all duration-300 flex items-center gap-2 ${
//                       calendarView === "month"
//                         ? "bg-white text-indigo-700 shadow-sm"
//                         : "text-gray-500 hover:text-indigo-600"
//                     }`}
//                   >
//                     <Calendar className="w-4 h-4" />
//                     <span className="hidden xs:inline">Month</span>
//                   </button>
//                 </div>

//                 {/* Notifications */}
//                 <div className="relative group">
//                   <button className="p-2.5 bg-white border border-gray-200 hover:border-indigo-300 hover:bg-indigo-50 rounded-xl transition-all shadow-sm group-hover:shadow relative">
//                     <Bell className="w-5 h-5 text-gray-600 group-hover:text-indigo-600 transition-colors" />
//                     {(lectureAlerts.length > 0 ||
//                       backendReminders.length > 0) && (
//                       <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full ring-2 ring-white animate-pulse"></span>
//                     )}
//                   </button>
//                 </div>
//               </div>
//             </div>
//           </div>

//           {/* BACKEND PACKED WEEK REMINDERS */}
//           {loadingReminders ? (
//             <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 animate-pulse">
//               <div className="flex items-center justify-center gap-3">
//                 <Loader className="w-6 h-6 text-indigo-500 animate-spin" />
//                 <span className="text-sm font-semibold text-gray-500">
//                   Analyzing upcoming schedules...
//                 </span>
//               </div>
//             </div>
//           ) : backendReminders.length > 0 ? (
//             <div className="space-y-4 animate-fade-in-up delay-100">
//               <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-2">
//                 <h3 className="font-bold text-gray-800 flex items-center gap-2 text-lg">
//                   <Sparkles className="w-5 h-5 text-amber-500" />
//                   Smart Alerts ({backendReminders.length})
//                 </h3>
//                 <span className="text-xs font-semibold text-gray-400 bg-white px-3 py-1 rounded-lg border border-gray-100 shadow-sm">
//                   Updated{" "}
//                   {new Date().toLocaleTimeString([], {
//                     hour: "2-digit",
//                     minute: "2-digit",
//                   })}
//                 </span>
//               </div>

//               {backendReminders.map((reminder) => {
//                 const statusInfo = getStatusLabel(reminder.targetStatus);
//                 const StatusIcon = statusInfo.icon;
//                 const tips = generateWorkloadTips(
//                   reminder.targetStatus,
//                   reminder.targetTotalHours,
//                   reminder.targetBreakdown || [],
//                 );

//                 const daysUntil = Math.floor(
//                   (reminder.targetWeekStart - new Date()) /
//                     (1000 * 60 * 60 * 24),
//                 );

//                 return (
//                   <div
//                     key={reminder.id}
//                     className="bg-gradient-to-br from-white to-amber-50/50 rounded-2xl shadow-sm border border-amber-200/60 p-5 sm:p-6 relative group overflow-hidden transition-all hover:shadow-md"
//                   >
//                     {/* Decorative left bar */}
//                     <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-gradient-to-b from-amber-400 to-orange-500"></div>

//                     <button
//                       onClick={() => handleDismissReminder(reminder.id)}
//                       className="absolute top-4 right-4 p-2 text-gray-400 hover:text-amber-700 hover:bg-amber-100/80 rounded-full transition-all duration-300 hover:rotate-90"
//                       aria-label="Dismiss reminder"
//                     >
//                       <X className="w-5 h-5" />
//                     </button>

//                     <div className="flex flex-col gap-5 pl-2">
//                       <div className="flex items-start gap-4">
//                         <div className="bg-gradient-to-br from-amber-100 to-orange-100 p-3.5 rounded-2xl shadow-inner flex-shrink-0">
//                           <StatusIcon
//                             className={`w-6 h-6 ${statusInfo.iconColor}`}
//                           />
//                         </div>
//                         <div className="flex-1 min-w-0 pr-8">
//                           <div className="flex flex-wrap items-center gap-3 mb-2">
//                             <h4 className="font-extrabold text-gray-800 text-lg">
//                               Week {reminder.targetBusyWeek} •{" "}
//                               {statusInfo.label}
//                             </h4>
//                             <span className="px-3 py-1 bg-amber-500 text-white rounded-lg text-xs font-bold uppercase tracking-wider shadow-sm">
//                               {daysUntil > 0
//                                 ? `In ${daysUntil} ${daysUntil === 1 ? "day" : "days"}`
//                                 : daysUntil === 0
//                                   ? "Starting today!"
//                                   : "This week!"}
//                             </span>
//                           </div>

//                           <p className="text-gray-600 font-medium leading-relaxed mb-5">
//                             {reminder.message ||
//                               `You have ${reminder.targetTotalHours} hours of work scheduled.`}
//                           </p>

//                           {/* AI TIMETABLE AS TABLE */}
//                           {reminder.timetable &&
//                           reminder.timetable.length > 0 ? (
//                             <div className="mb-4">
//                               <p className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
//                                 <Sparkles className="w-4 h-4 text-amber-500" />
//                                 Recommended Study Plan
//                               </p>
//                               <TimetableTable timetable={reminder.timetable} />
//                             </div>
//                           ) : (
//                             /* Fallback to Standard Tips */
//                             tips.length > 0 && (
//                               <div className="bg-white/80 rounded-xl p-4 border border-gray-100 shadow-sm">
//                                 <p className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
//                                   <Lightbulb className="w-4 h-4 text-amber-500" />
//                                   Actionable Tips:
//                                 </p>
//                                 <ul className="space-y-2">
//                                   {tips.slice(0, 3).map((tip, idx) => (
//                                     <li
//                                       key={idx}
//                                       className="flex items-start gap-3 text-sm text-gray-600 font-medium"
//                                     >
//                                       <span className="text-amber-500 mt-0.5">
//                                         <CheckCircle className="w-4 h-4" />
//                                       </span>
//                                       <span>{tip}</span>
//                                     </li>
//                                   ))}
//                                 </ul>
//                               </div>
//                             )
//                           )}

//                           <p className="text-xs font-bold text-gray-400 mt-4 uppercase tracking-wider">
//                             Plan starts •{" "}
//                             {formatDateSafe(reminder.targetWeekStart)}
//                           </p>
//                         </div>
//                       </div>
//                     </div>
//                   </div>
//                 );
//               })}
//             </div>
//           ) : (
//             hasLoadedReminders && (
//               <div className="animate-fade-in-up delay-100 bg-gradient-to-br from-emerald-50 to-green-50/30 rounded-2xl border border-emerald-100 p-5 sm:p-6 shadow-sm flex items-center gap-4">
//                 <div className="bg-emerald-100 p-3 rounded-2xl flex-shrink-0">
//                   <CheckCircle className="w-6 h-6 text-emerald-600" />
//                 </div>
//                 <div>
//                   <p className="font-bold text-emerald-800 text-lg">
//                     Smooth Sailing Ahead!
//                   </p>
//                   <p className="text-sm text-emerald-600 mt-1 font-medium">
//                     Your next two weeks look highly manageable. Great time to
//                     catch up on reading or start long-term projects.
//                   </p>
//                 </div>
//               </div>
//             )
//           )}

//           {/* WORKLOAD STATISTICS */}
//           {workloadStats && (
//             <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 animate-fade-in-up delay-200">
//               {[
//                 {
//                   label: "Packed Weeks",
//                   value: workloadStats.flaggedWeeks,
//                   sub: `Out of ${workloadStats.totalWeeks} weeks`,
//                   icon: AlertTriangle,
//                   color: "text-amber-600",
//                   bg: "bg-amber-100",
//                   border: "border-amber-100",
//                   hover: "hover:border-amber-300",
//                 },
//                 {
//                   label: "Avg Weekly",
//                   value: `${workloadStats.averageHours}h`,
//                   sub: `Peak: ${workloadStats.maxHours}h`,
//                   icon: BarChart3,
//                   color: "text-blue-600",
//                   bg: "bg-blue-100",
//                   border: "border-blue-100",
//                   hover: "hover:border-blue-300",
//                 },
//                 {
//                   label: "Easy Weeks",
//                   value: workloadStats.easyWeeks,
//                   sub: "Light workload ahead",
//                   icon: CheckCircle,
//                   color: "text-emerald-600",
//                   bg: "bg-emerald-100",
//                   border: "border-emerald-100",
//                   hover: "hover:border-emerald-300",
//                 },
//                 {
//                   label: "Active Alerts",
//                   value: backendReminders.length,
//                   sub: "Items needing attention",
//                   icon: Target,
//                   color: "text-indigo-600",
//                   bg: "bg-indigo-100",
//                   border: "border-indigo-100",
//                   hover: "hover:border-indigo-300",
//                 },
//               ].map((stat, i) => (
//                 <div
//                   key={i}
//                   className={`bg-white rounded-2xl shadow-sm border ${stat.border} p-5 sm:p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg ${stat.hover}`}
//                 >
//                   <div className="flex items-center justify-between mb-4">
//                     <div className={`${stat.bg} p-2.5 rounded-xl`}>
//                       <stat.icon className={`w-5 h-5 ${stat.color}`} />
//                     </div>
//                     <span className="text-3xl font-black text-gray-800 tracking-tight">
//                       {stat.value}
//                     </span>
//                   </div>
//                   <p className="font-bold text-gray-600">{stat.label}</p>
//                   <p className="text-xs font-semibold text-gray-400 mt-1 uppercase tracking-wider">
//                     {stat.sub}
//                   </p>
//                 </div>
//               ))}
//             </div>
//           )}

//           {/* LECTURE ALERTS */}
//           {lectureAlerts.length > 0 && (
//             <div className="space-y-4 animate-fade-in-up delay-300">
//               {lectureAlerts.map((alert, i) => (
//                 <div
//                   key={i}
//                   className="bg-white rounded-2xl border border-blue-100 shadow-sm p-4 sm:p-5 flex flex-col sm:flex-row justify-between items-start gap-4 transition-all hover:shadow-md hover:border-blue-300 relative overflow-hidden"
//                 >
//                   <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-blue-500"></div>
//                   <div className="flex items-start gap-4 w-full sm:w-auto pl-2">
//                     <div className="bg-blue-50 p-2.5 rounded-xl flex-shrink-0 border border-blue-100">
//                       <BookOpen className="w-5 h-5 text-blue-600" />
//                     </div>
//                     <div className="flex-1">
//                       <p className="font-bold text-gray-800 text-base">
//                         {alert.subjectName}
//                       </p>
//                       <p className="text-sm font-medium text-gray-500 mt-1">
//                         {alert.message}
//                       </p>
//                     </div>
//                   </div>
//                   {alert.joinLink && (
//                     <a
//                       href={alert.joinLink}
//                       target="_blank"
//                       rel="noreferrer"
//                       className="w-full sm:w-auto px-5 py-2.5 bg-blue-600 text-white font-bold text-sm rounded-xl hover:bg-blue-700 hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 transition-all flex items-center justify-center gap-2"
//                     >
//                       Join Session
//                       <ChevronRight className="w-4 h-4" />
//                     </a>
//                   )}
//                 </div>
//               ))}
//             </div>
//           )}

//           {/* WEEK SELECTOR */}
//           <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 sm:p-6 animate-fade-in-up delay-400 hover:shadow-md transition-shadow">
//             <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
//               <h3 className="font-extrabold text-gray-800 flex items-center gap-2 text-lg">
//                 <Calendar className="w-5 h-5 text-indigo-600" />
//                 Semester Timeline
//               </h3>
//               <div className="flex items-center gap-4 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100">
//                 <div className="flex items-center gap-1.5 text-xs font-bold text-gray-500 uppercase tracking-wide">
//                   <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-sm"></div>
//                   <span>Easy</span>
//                 </div>
//                 <div className="flex items-center gap-1.5 text-xs font-bold text-gray-500 uppercase tracking-wide">
//                   <div className="w-2.5 h-2.5 rounded-full bg-amber-500 shadow-sm"></div>
//                   <span>Packed</span>
//                 </div>
//               </div>
//             </div>

//             <div className="flex flex-wrap gap-2.5">
//               {weekOptions.map((week) => {
//                 const status = getWeekStatus(week.weekNumber);
//                 const isCurrentWeek = week.weekNumber === currentWeek;
//                 const statusInfo = getStatusLabel(status);
//                 const Icon = statusInfo.icon;

//                 return (
//                   <button
//                     key={week.weekNumber}
//                     onClick={() => handleWeekSelect(week.weekNumber)}
//                     className={`px-3 sm:px-4 py-2 rounded-xl text-sm font-bold transition-all duration-300 flex items-center gap-2 border ${
//                       isCurrentWeek
//                         ? "ring-2 ring-indigo-500 ring-offset-2 scale-105 shadow-md"
//                         : "hover:-translate-y-0.5 hover:shadow"
//                     } ${
//                       status === "NORMAL" || status === "LIGHT"
//                         ? "bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100"
//                         : "bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100"
//                     }`}
//                   >
//                     <Icon className={`w-4 h-4 ${statusInfo.iconColor}`} />
//                     <span className="hidden xs:inline">{week.label}</span>
//                     <span className="xs:hidden">W{week.weekNumber}</span>
//                   </button>
//                 );
//               })}
//             </div>
//           </div>

//           {/* UPCOMING PACKED WEEKS */}
//           {workloadStats?.upcomingPackedWeeks.length > 0 && (
//             <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 sm:p-6 animate-fade-in-up delay-400">
//               <h3 className="font-extrabold text-gray-800 mb-5 flex items-center gap-2 text-lg">
//                 <AlertTriangle className="w-5 h-5 text-amber-500" />
//                 Upcoming Packed Weeks
//               </h3>
//               <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
//                 {workloadStats.upcomingPackedWeeks
//                   .slice(0, 3)
//                   .map((packedWeek, index) => {
//                     const statusInfo = getStatusLabel(packedWeek.status);
//                     const StatusIcon = statusInfo.icon;

//                     return (
//                       <button
//                         key={index}
//                         onClick={() => handleWeekSelect(packedWeek.week)}
//                         className={`text-left p-5 rounded-2xl border-2 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg ${statusInfo.bgLight} border-amber-200`}
//                       >
//                         <div className="flex items-start justify-between mb-4">
//                           <div>
//                             <p className="font-black text-gray-800 text-lg">
//                               Week {packedWeek.week}
//                             </p>
//                             <p className="text-xs font-bold text-gray-500 mt-1 uppercase tracking-wider">
//                               {packedWeek.weekStart.toLocaleDateString(
//                                 "en-US",
//                                 {
//                                   month: "short",
//                                   day: "numeric",
//                                 },
//                               )}
//                             </p>
//                           </div>
//                           <div
//                             className={`p-2 rounded-xl shadow-sm ${statusInfo.color.split(" ")[0]} bg-white`}
//                           >
//                             <StatusIcon
//                               className={`w-5 h-5 ${statusInfo.iconColor}`}
//                             />
//                           </div>
//                         </div>
//                         <div className="flex justify-between items-center bg-white/50 px-3 py-2 rounded-lg text-sm mb-2">
//                           <span className="font-semibold text-gray-600">
//                             Total workload:
//                           </span>
//                           <span className="font-black text-amber-700">
//                             {packedWeek.totalHours}h
//                           </span>
//                         </div>
//                         <p className="text-sm font-medium text-gray-600 pl-1">
//                           {statusInfo.description}
//                         </p>
//                       </button>
//                     );
//                   })}
//               </div>
//             </div>
//           )}

//           {/* WORKLOAD CALENDAR */}
//           <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden animate-fade-in-up delay-400 hover:shadow-md transition-shadow">
//             <WorkloadCalendar
//               workload={weeklyWorkload}
//               onDayClick={handleDayClick}
//               currentWeekStart={currentWeekStart}
//               onWeekChange={handleWeekChange}
//               showWeekNavigation={true}
//               semesterStartDate={SEMESTER_START_DATE}
//             />
//           </div>

//           {/* SELECTED WEEK DETAILS */}
//           {selectedDate && selectedDate.week && (
//             <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 sm:p-6 animate-fade-in-up transition-all">
//               <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
//                 <h3 className="font-extrabold text-gray-800 flex items-center gap-2 text-xl">
//                   <Calendar className="w-6 h-6 text-indigo-600" />
//                   Week {selectedDate.week} Insights
//                 </h3>
//                 {(() => {
//                   const statusInfo = getStatusLabel(selectedDate.status);
//                   const StatusIcon = statusInfo.icon;
//                   return (
//                     <div
//                       className={`flex items-center gap-2 px-4 py-2 rounded-xl border ${statusInfo.color} font-bold text-sm shadow-sm`}
//                     >
//                       <StatusIcon
//                         className={`w-4 h-4 ${statusInfo.iconColor}`}
//                       />
//                       <span>{statusInfo.label}</span>
//                     </div>
//                   );
//                 })()}
//               </div>

//               <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
//                 <div className="space-y-4">
//                   <div className="bg-gradient-to-br from-indigo-50 to-blue-50/50 p-5 rounded-2xl border border-indigo-100">
//                     <div className="flex items-center gap-4 mb-5">
//                       <div className="bg-indigo-100 p-3 rounded-xl shadow-sm">
//                         <Clock className="w-5 h-5 text-indigo-600" />
//                       </div>
//                       <div>
//                         <p className="font-bold text-gray-800 text-lg">
//                           {new Date(
//                             selectedDate.weekStart._seconds * 1000,
//                           ).toLocaleDateString("en-US", {
//                             weekday: "long",
//                             month: "long",
//                             day: "numeric",
//                           })}
//                         </p>
//                         <p className="text-sm font-semibold text-gray-500 uppercase tracking-wider mt-0.5">
//                           Semester Week{" "}
//                           {calculateAcademicWeek(
//                             SEMESTER_START_DATE,
//                             new Date(selectedDate.weekStart._seconds * 1000),
//                           )}
//                         </p>
//                       </div>
//                     </div>

//                     <div className="grid grid-cols-2 gap-4">
//                       <div className="bg-white p-4 rounded-xl shadow-sm border border-indigo-50">
//                         <p className="text-xs font-bold text-gray-400 mb-1 uppercase tracking-wider">
//                           Total Hours
//                         </p>
//                         <p className="text-2xl font-black text-indigo-600">
//                           {selectedDate.totalHours || 0}h
//                         </p>
//                       </div>
//                       <div className="bg-white p-4 rounded-xl shadow-sm border border-indigo-50">
//                         <p className="text-xs font-bold text-gray-400 mb-1 uppercase tracking-wider">
//                           Work Items
//                         </p>
//                         <p className="text-2xl font-black text-gray-800">
//                           {selectedDate.breakdown?.length || 0}
//                         </p>
//                       </div>
//                     </div>
//                   </div>
//                 </div>

//                 <div>
//                   <h4 className="font-extrabold text-gray-800 mb-4 text-lg">
//                     Work Breakdown
//                   </h4>
//                   {selectedDate.breakdown &&
//                   selectedDate.breakdown.length > 0 ? (
//                     <div className="space-y-3 max-h-[300px] overflow-y-auto pr-3 custom-scrollbar">
//                       {selectedDate.breakdown.map((item, index) => (
//                         <div
//                           key={index}
//                           className="p-4 bg-white border border-gray-100 rounded-xl shadow-sm hover:shadow-md hover:border-indigo-200 transition-all group"
//                         >
//                           <div className="flex justify-between items-center">
//                             <div className="flex-1 min-w-0 pr-4">
//                               <p className="font-bold text-gray-800 text-base truncate group-hover:text-indigo-600 transition-colors">
//                                 {item.subjectName}
//                               </p>
//                               <p className="text-xs font-bold text-gray-400 mt-1 uppercase tracking-wider">
//                                 {item.type}
//                               </p>
//                             </div>
//                             <span className="px-3 py-1.5 bg-indigo-50 border border-indigo-100 text-indigo-700 rounded-lg text-sm font-bold shadow-sm">
//                               {item.hours}h
//                             </span>
//                           </div>
//                         </div>
//                       ))}
//                     </div>
//                   ) : (
//                     <div className="text-center py-12 bg-gray-50/50 rounded-2xl border-2 border-dashed border-gray-200">
//                       <BookOpen className="w-10 h-10 text-gray-300 mx-auto mb-3" />
//                       <p className="font-bold text-gray-500">Clear schedule!</p>
//                       <p className="text-sm font-medium text-gray-400 mt-1">
//                         No workload items for this week
//                       </p>
//                     </div>
//                   )}
//                 </div>
//               </div>
//             </div>
//           )}

//           {/* SUBJECTS SUMMARY */}
//           <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 sm:p-6 animate-fade-in-up delay-500">
//             <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
//               <h3 className="font-extrabold text-gray-800 flex items-center gap-2 text-xl">
//                 <BookOpen className="w-6 h-6 text-indigo-600" />
//                 Enrolled Subjects
//               </h3>
//               <span className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl text-sm font-bold shadow-md">
//                 {subjects.length} Active Courses
//               </span>
//             </div>

//             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
//               {subjects.map((subject) => (
//                 <div
//                   key={subject.subjectId}
//                   className="bg-white border border-gray-100 rounded-2xl p-5 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group hover:border-indigo-200"
//                 >
//                   <div className="flex justify-between items-start mb-5">
//                     <div className="bg-gradient-to-br from-blue-100 to-indigo-100 w-12 h-12 rounded-xl flex items-center justify-center text-indigo-700 font-black text-xl shadow-inner group-hover:scale-110 transition-transform">
//                       {subject.subjectName?.charAt(0) || "?"}
//                     </div>
//                     <span
//                       className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider shadow-sm border ${
//                         subject.type === "CORE"
//                           ? "bg-purple-50 text-purple-700 border-purple-100"
//                           : subject.type === "INTERNSHIP_SUBMISSION"
//                             ? "bg-orange-50 text-orange-700 border-orange-100"
//                             : "bg-emerald-50 text-emerald-700 border-emerald-100"
//                       }`}
//                     >
//                       {subject.type?.replace(/_/g, " ") || "ELECTIVE"}
//                     </span>
//                   </div>

//                   <div className="space-y-4">
//                     <div>
//                       <p className="font-extrabold text-gray-800 text-lg group-hover:text-indigo-600 transition-colors leading-tight">
//                         {subject.subjectName}
//                       </p>
//                       <p className="text-sm font-semibold text-gray-400 mt-1">
//                         {subject.subjectCode}
//                       </p>
//                     </div>

//                     <div className="space-y-2.5 pt-4 border-t border-gray-100">
//                       <div className="flex items-center justify-between text-sm">
//                         <span className="font-semibold text-gray-400">
//                           Credits
//                         </span>
//                         <span className="font-bold text-gray-800 bg-gray-50 px-2 py-0.5 rounded border border-gray-100">
//                           {subject.credits || 3}
//                         </span>
//                       </div>
//                       <div className="flex items-center justify-between text-sm">
//                         <span className="font-semibold text-gray-400">
//                           Delivery
//                         </span>
//                         <span className="font-bold text-gray-800">
//                           {subject.deliveryMode || "On Campus"}
//                         </span>
//                       </div>
//                       <div className="flex items-center justify-between text-sm">
//                         <span className="font-semibold text-gray-400">
//                           Instructor
//                         </span>
//                         <span className="font-bold text-gray-800 truncate max-w-[120px]">
//                           {subject.instructor || "TBA"}
//                         </span>
//                       </div>
//                     </div>
//                   </div>
//                 </div>
//               ))}
//             </div>
//           </div>

//         </div>
//       </div>
//     </>
//   );
// };

// export default StudentDashboard;
import React, { useEffect, useState } from "react";
import {
  GraduationCap,
  Bell,
  Calendar,
  Activity,
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
  Mail,
  Send,
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

const getStatusLabel = (status = "NORMAL") => {
  const statusMap = {
    NORMAL: {
      label: "Easy Week",
      description: "Light workload",
      color: "bg-emerald-50 text-emerald-700",
      icon: CheckCircle,
      iconColor: "text-emerald-500",
      bgLight: "bg-emerald-50",
    },
    BUSY: {
      label: "Packed Week",
      description: "Full schedule",
      color: "bg-amber-50 text-amber-700",
      icon: AlertTriangle,
      iconColor: "text-amber-500",
      bgLight: "bg-amber-50",
    },
    LIGHT: {
      label: "Easy Week",
      description: "Light workload",
      color: "bg-emerald-50 text-emerald-700",
      icon: CheckCircle,
      iconColor: "text-emerald-500",
      bgLight: "bg-emerald-50",
    },
    MODERATE: {
      label: "Steady Pace",
      description: "Consistent workload",
      color: "bg-indigo-50 text-indigo-700",
      icon: TrendingUp,
      iconColor: "text-indigo-500",
      bgLight: "bg-indigo-50",
    },
    HEAVY: {
      label: "Intense Week",
      description: "Lots to do",
      color: "bg-orange-50 text-orange-700",
      icon: AlertTriangle,
      iconColor: "text-orange-500",
      bgLight: "bg-orange-50",
    },
    OVERLOADED: {
      label: "Full Plate",
      description: "Maximum capacity",
      color: "bg-red-50 text-red-700",
      icon: AlertTriangle,
      iconColor: "text-red-500",
      bgLight: "bg-red-50",
    },
  };
  return (
    statusMap[status] || {
      label: status,
      description: "Activities planned",
      color: "bg-gray-50 text-gray-700",
      icon: CheckCircle,
      iconColor: "text-gray-500",
      bgLight: "bg-gray-50",
    }
  );
};

function generateWeekOptions(semesterStart) {
  const totalWeeks = 16;
  const weeks = [];
  for (let i = 1; i <= totalWeeks; i++) {
    const weekStart = new Date(semesterStart);
    weekStart.setDate(weekStart.getDate() + (i - 1) * 7);
    weeks.push({
      weekNumber: i,
      startDate: weekStart,
      label: `Week ${i}`,
    });
  }
  return weeks;
}

function calculateWorkloadStats(weeklyWorkload) {
  const stats = {
    totalWeeks: weeklyWorkload.length,
    flaggedWeeks: 0,
    easyWeeks: 0,
    totalHours: 0,
    maxHours: 0,
    averageHours: 0,
    upcomingPackedWeeks: [],
  };
  if (!Array.isArray(weeklyWorkload)) return stats;

  weeklyWorkload.forEach((week) => {
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

function generateWorkloadTips(status, totalHours, breakdown = []) {
  const tips = [];
  if (status === "OVERLOADED" || totalHours > 20) {
    tips.push("Break tasks into smaller chunks and take regular breaks");
    tips.push("Use the Pomodoro technique: 25 min work, 5 min rest");
  } else if (status === "HEAVY" || totalHours > 15) {
    tips.push("Start preparing materials early this week");
    tips.push("Prioritize tasks based on deadlines");
  } else if (status === "BUSY" || totalHours > 10) {
    tips.push("Create a schedule to track all assignments");
    tips.push("Group similar tasks together for efficiency");
  }
  return tips;
}

const TimetableTable = ({ timetable }) => {
  if (!timetable || timetable.length === 0) return null;
  const groupedByDay = timetable.reduce((acc, item) => {
    if (!acc[item.day]) acc[item.day] = [];
    acc[item.day].push(item);
    return acc;
  }, {});
  const days = Object.keys(groupedByDay).sort(
    (a, b) => parseInt(a) - parseInt(b),
  );

  return (
    <div className="overflow-x-auto -mx-4 sm:mx-0 shadow-sm rounded-xl">
      <div className="inline-block min-w-full align-middle">
        <div className="overflow-hidden border border-amber-200/60 rounded-xl">
          <table className="min-w-full divide-y divide-amber-200/60">
            <thead className="bg-amber-100/50 backdrop-blur-sm">
              <tr>
                <th
                  scope="col"
                  className="px-4 py-3 text-left text-xs font-bold text-amber-800 uppercase tracking-wider"
                >
                  Day
                </th>
                <th
                  scope="col"
                  className="px-4 py-3 text-left text-xs font-bold text-amber-800 uppercase tracking-wider"
                >
                  Subject
                </th>
                <th
                  scope="col"
                  className="px-4 py-3 text-left text-xs font-bold text-amber-800 uppercase tracking-wider"
                >
                  Task
                </th>
                <th
                  scope="col"
                  className="px-4 py-3 text-left text-xs font-bold text-amber-800 uppercase tracking-wider"
                >
                  Duration
                </th>
              </tr>
            </thead>
            <tbody className="bg-white/80 divide-y divide-amber-100/50">
              {days.map((day) =>
                groupedByDay[day].map((item, idx) => (
                  <tr
                    key={`${day}-${idx}`}
                    className="hover:bg-amber-50/80 transition-colors duration-200"
                  >
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="font-semibold text-gray-900">
                        Day {item.day}
                      </span>
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
                      <span className="px-2.5 py-1 inline-flex text-xs font-bold rounded-full bg-amber-100 text-amber-800 shadow-sm">
                        {item.hours}h
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
  const [userEmail, setUserEmail] = useState("");
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

  // State for the email sending animation
  const [sendingEmailId, setSendingEmailId] = useState(null);
  const [sentEmailId, setSentEmailId] = useState(null);

  const currentWeek = calculateAcademicWeek(
    SEMESTER_START_DATE,
    currentWeekStart,
  );
  const academicPeriod = getAcademicPeriod(SEMESTER_START_DATE);

  useEffect(() => {
    setWeekOptions(generateWeekOptions(SEMESTER_START_DATE));
  }, []);

  useEffect(() => {
    if (weeklyWorkload.length > 0)
      setWorkloadStats(calculateWorkloadStats(weeklyWorkload));
  }, [weeklyWorkload]);

  const loadBackendReminders = async () => {
    if (!studentId) return;
    try {
      setLoadingReminders(true);
      const reminderData = await fetchActiveReminders(studentId);
      if (reminderData.reminders && reminderData.reminders.length > 0) {
        setBackendReminders(
          reminderData.reminders.map((r) => ({
            ...r,
            targetWeekStart: new Date(r.targetWeekStart),
          })),
        );
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

  // --- NEW EMAIL FUNCTION ---
  const handleSendReminderEmail = async (reminder) => {
    if (!userEmail) {
      alert("We need your email address to send a reminder.");
      return;
    }

    setSendingEmailId(reminder.id);

    try {
      // TODO: Replace this setTimeout with your actual API call
      // Example: await axios.post('/api/send-reminder', { email: userEmail, reminderData: reminder });
      await new Promise((resolve) => setTimeout(resolve, 1500)); // Mocking network request

      setSentEmailId(reminder.id);

      // Reset success state after 3 seconds
      setTimeout(() => {
        setSentEmailId(null);
      }, 3000);
    } catch (error) {
      console.error("Failed to send email:", error);
      alert("Failed to send the email. Please try again.");
    } finally {
      setSendingEmailId(null);
    }
  };

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setStudentId(user.uid);
        setUserEmail(user.email); // Capture email for the reminder function
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
        const enrollment = await fetchStudentEnrollment(studentId);
        setSubjects(enrollment?.subjects || []);
        await generateWorkloadIfNeeded(studentId, SEMESTER_START_DATE);
        const [weeklyResponse, alertRes] = await Promise.all([
          fetchWeeklyWorkload(studentId),
          fetchLectureAlerts(),
        ]);
        setWeeklyWorkload(
          Array.isArray(weeklyResponse?.weeks) ? weeklyResponse.weeks : [],
        );
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
    if (!loading && weeklyWorkload.length > 0 && !hasLoadedReminders)
      loadBackendReminders();
  }, [loading, weeklyWorkload, hasLoadedReminders]);

  const handleDayClick = (week) => setSelectedDate(week);
  const handleWeekChange = (newWeekStart) => setCurrentWeekStart(newWeekStart);
  const handleWeekSelect = (weekNumber) => {
    const weekOption = weekOptions.find((w) => w.weekNumber === weekNumber);
    if (weekOption) {
      setCurrentWeekStart(weekOption.startDate);
      const selectedWeek = weeklyWorkload.find((w) => w.week === weekNumber);
      if (selectedWeek) setSelectedDate(selectedWeek);
    }
  };

  const getWeekStatus = (weekNumber) => {
    const weekData = weeklyWorkload.find((w) => w.week === weekNumber);
    return weekData ? weekData.status : "NORMAL";
  };

  const formatDateSafe = (date) => {
    if (!date) return "Date not available";
    try {
      return new Date(date).toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
      });
    } catch {
      return "Date error";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-blue-50 flex items-center justify-center p-4">
        <div className="text-center animate-pulse">
          <div className="relative mb-6">
            <div className="w-24 h-24 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin mx-auto shadow-lg"></div>
            <GraduationCap className="w-10 h-10 text-indigo-600 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
          </div>
          <p className="text-gray-800 text-lg font-bold">
            Loading your academic hub...
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <style>{`
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes flyAway { 0% { transform: translateX(0) scale(1); opacity: 1; } 100% { transform: translateX(20px) scale(0.5) translateY(-20px); opacity: 0; } }
        .animate-fade-in-up { animation: fadeInUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards; opacity: 0; }
        .delay-100 { animation-delay: 100ms; }
        .delay-200 { animation-delay: 200ms; }
        .delay-300 { animation-delay: 300ms; }
        .animate-fly { animation: flyAway 0.5s ease-in forwards; }
      `}</style>

      <div className="min-h-screen bg-slate-50 text-gray-800 font-sans">
        <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6 lg:space-y-8">
          {/* HEADER */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 sm:p-6 animate-fade-in-up">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-5">
              <div className="flex items-center gap-4 w-full sm:w-auto">
                <div className="bg-gradient-to-br from-blue-600 to-indigo-600 p-3 rounded-xl shadow-lg shadow-indigo-200">
                  <GraduationCap className="text-white w-6 h-6" />
                </div>
                <div>
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-700 to-indigo-600">
                    Student Dashboard
                  </h1>
                  <p className="text-xs sm:text-sm font-medium text-gray-500 uppercase">
                    Week {currentWeek} • {academicPeriod.semester}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setCalendarView("week")}
                  className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 ${calendarView === "week" ? "bg-indigo-50 text-indigo-700" : "text-gray-500"}`}
                >
                  <Grid className="w-4 h-4" /> Week
                </button>
                <button
                  onClick={() => setCalendarView("month")}
                  className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 ${calendarView === "month" ? "bg-indigo-50 text-indigo-700" : "text-gray-500"}`}
                >
                  <Calendar className="w-4 h-4" /> Month
                </button>
              </div>
            </div>
          </div>

          {/* BACKEND PACKED WEEK REMINDERS */}
          {loadingReminders ? (
            <div className="bg-white rounded-2xl shadow-sm p-8 text-center">
              <Loader className="w-6 h-6 text-indigo-500 animate-spin mx-auto" />
            </div>
          ) : (
            backendReminders.length > 0 && (
              <div className="space-y-4 animate-fade-in-up delay-100">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-bold text-gray-800 flex items-center gap-2 text-lg">
                    <Sparkles className="w-5 h-5 text-amber-500" /> Smart Alerts
                  </h3>
                </div>

                {backendReminders.map((reminder) => {
                  const statusInfo = getStatusLabel(reminder.targetStatus);
                  const isSending = sendingEmailId === reminder.id;
                  const isSent = sentEmailId === reminder.id;

                  return (
                    <div
                      key={reminder.id}
                      className="bg-gradient-to-br from-white to-amber-50/50 rounded-2xl shadow-sm border border-amber-200/60 p-5 sm:p-6 relative group overflow-hidden transition-all hover:shadow-md"
                    >
                      <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-gradient-to-b from-amber-400 to-orange-500"></div>

                      <button
                        onClick={() => handleDismissReminder(reminder.id)}
                        className="absolute top-4 right-4 p-2 text-gray-400 hover:text-amber-700 hover:bg-amber-100/80 rounded-full transition-all duration-300 hover:rotate-90"
                      >
                        <X className="w-5 h-5" />
                      </button>

                      <div className="flex flex-col gap-4 pl-2">
                        <div className="flex items-start gap-4">
                          <div className="bg-gradient-to-br from-amber-100 to-orange-100 p-3.5 rounded-2xl flex-shrink-0">
                            <statusInfo.icon
                              className={`w-6 h-6 ${statusInfo.iconColor}`}
                            />
                          </div>
                          <div className="flex-1 pr-8">
                            <h4 className="font-extrabold text-gray-800 text-lg mb-1">
                              Week {reminder.targetBusyWeek} •{" "}
                              {statusInfo.label}
                            </h4>
                            <p className="text-gray-600 font-medium leading-relaxed mb-4">
                              {reminder.message ||
                                `You have ${reminder.targetTotalHours} hours of work scheduled.`}
                            </p>

                            {reminder.timetable?.length > 0 ? (
                              <TimetableTable timetable={reminder.timetable} />
                            ) : (
                              <div className="bg-white/80 rounded-xl p-4 border border-gray-100">
                                <p className="text-sm font-bold text-gray-800 mb-2 flex items-center gap-2">
                                  <Lightbulb className="w-4 h-4 text-amber-500" />{" "}
                                  Actionable Tips:
                                </p>
                                <ul className="space-y-1">
                                  {generateWorkloadTips(
                                    reminder.targetStatus,
                                    reminder.targetTotalHours,
                                  ).map((tip, idx) => (
                                    <li
                                      key={idx}
                                      className="flex items-start gap-2 text-sm text-gray-600 font-medium"
                                    >
                                      <CheckCircle className="w-4 h-4 text-amber-500 mt-0.5" />{" "}
                                      {tip}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}

                            {/* EMAIL BUTTON ADDED HERE */}
                            <div className="mt-5 flex items-center justify-between border-t border-amber-200/50 pt-4">
                              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                                Plan starts •{" "}
                                {formatDateSafe(reminder.targetWeekStart)}
                              </p>

                              <button
                                onClick={() =>
                                  handleSendReminderEmail(reminder)
                                }
                                disabled={isSending || isSent}
                                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all duration-300 shadow-sm
                                ${
                                  isSent
                                    ? "bg-emerald-100 text-emerald-700 border border-emerald-200"
                                    : "bg-white border border-amber-200 text-amber-700 hover:bg-amber-50 hover:shadow-md active:scale-95"
                                }`}
                              >
                                {isSending ? (
                                  <>
                                    <Loader className="w-4 h-4 animate-spin" />
                                    Sending...
                                  </>
                                ) : isSent ? (
                                  <>
                                    <CheckCircle className="w-4 h-4" />
                                    Sent to Email
                                  </>
                                ) : (
                                  <>
                                    <Mail className="w-4 h-4 group-hover:text-amber-500" />
                                    Send Reminder Email
                                  </>
                                )}
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )
          )}

          {/* ... The rest of your dashboard components stay exactly the same (Stats, Calendar, Subjects) ... */}
          {/* Workload Calendar integration */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden animate-fade-in-up delay-200">
            <WorkloadCalendar
              workload={weeklyWorkload}
              onDayClick={handleDayClick}
              currentWeekStart={currentWeekStart}
              onWeekChange={handleWeekChange}
              showWeekNavigation={true}
              semesterStartDate={SEMESTER_START_DATE}
            />
          </div>
        </div>
      </div>
    </>
  );
};

export default StudentDashboard;
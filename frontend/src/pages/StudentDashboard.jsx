// import React, { useEffect, useState } from "react";
// import {
//   GraduationCap,
//   Bell,
//   Calendar,
//   Activity,
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
//   Mail,
//   Send,
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

// const getStatusLabel = (status = "NORMAL") => {
//   const statusMap = {
//     NORMAL: {
//       label: "Easy Week",
//       description: "Light workload",
//       color: "bg-emerald-50 text-emerald-700",
//       icon: CheckCircle,
//       iconColor: "text-emerald-500",
//       bgLight: "bg-emerald-50",
//     },
//     BUSY: {
//       label: "Packed Week",
//       description: "Full schedule",
//       color: "bg-amber-50 text-amber-700",
//       icon: AlertTriangle,
//       iconColor: "text-amber-500",
//       bgLight: "bg-amber-50",
//     },
//     LIGHT: {
//       label: "Easy Week",
//       description: "Light workload",
//       color: "bg-emerald-50 text-emerald-700",
//       icon: CheckCircle,
//       iconColor: "text-emerald-500",
//       bgLight: "bg-emerald-50",
//     },
//     MODERATE: {
//       label: "Steady Pace",
//       description: "Consistent workload",
//       color: "bg-indigo-50 text-indigo-700",
//       icon: TrendingUp,
//       iconColor: "text-indigo-500",
//       bgLight: "bg-indigo-50",
//     },
//     HEAVY: {
//       label: "Intense Week",
//       description: "Lots to do",
//       color: "bg-orange-50 text-orange-700",
//       icon: AlertTriangle,
//       iconColor: "text-orange-500",
//       bgLight: "bg-orange-50",
//     },
//     OVERLOADED: {
//       label: "Full Plate",
//       description: "Maximum capacity",
//       color: "bg-red-50 text-red-700",
//       icon: AlertTriangle,
//       iconColor: "text-red-500",
//       bgLight: "bg-red-50",
//     },
//   };
//   return (
//     statusMap[status] || {
//       label: status,
//       description: "Activities planned",
//       color: "bg-gray-50 text-gray-700",
//       icon: CheckCircle,
//       iconColor: "text-gray-500",
//       bgLight: "bg-gray-50",
//     }
//   );
// };

// function generateWeekOptions(semesterStart) {
//   const totalWeeks = 16;
//   const weeks = [];
//   for (let i = 1; i <= totalWeeks; i++) {
//     const weekStart = new Date(semesterStart);
//     weekStart.setDate(weekStart.getDate() + (i - 1) * 7);
//     weeks.push({
//       weekNumber: i,
//       startDate: weekStart,
//       label: `Week ${i}`,
//     });
//   }
//   return weeks;
// }

// function calculateWorkloadStats(weeklyWorkload) {
//   const stats = {
//     totalWeeks: weeklyWorkload.length,
//     flaggedWeeks: 0,
//     easyWeeks: 0,
//     totalHours: 0,
//     maxHours: 0,
//     averageHours: 0,
//     upcomingPackedWeeks: [],
//   };
//   if (!Array.isArray(weeklyWorkload)) return stats;

//   weeklyWorkload.forEach((week) => {
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

// function generateWorkloadTips(status, totalHours, breakdown = []) {
//   const tips = [];
//   if (status === "OVERLOADED" || totalHours > 20) {
//     tips.push("Break tasks into smaller chunks and take regular breaks");
//     tips.push("Use the Pomodoro technique: 25 min work, 5 min rest");
//   } else if (status === "HEAVY" || totalHours > 15) {
//     tips.push("Start preparing materials early this week");
//     tips.push("Prioritize tasks based on deadlines");
//   } else if (status === "BUSY" || totalHours > 10) {
//     tips.push("Create a schedule to track all assignments");
//     tips.push("Group similar tasks together for efficiency");
//   }
//   return tips;
// }

// /* ---------------- TIMETABLE COMPONENT ---------------- */
// const TimetableTable = ({ timetable }) => {
//   if (!timetable || timetable.length === 0) return null;

//   // 1. Group tasks by day
//   const groupedByDay = timetable.reduce((acc, item) => {
//     if (!acc[item.day]) acc[item.day] = [];
//     acc[item.day].push(item);
//     return acc;
//   }, {});

//   // 2. Sort the days numerically
//   const days = Object.keys(groupedByDay).sort(
//     (a, b) => parseInt(a) - parseInt(b),
//   );

//   // 3. Sort tasks within each day (longest tasks first for better structure)
//   days.forEach((day) => {
//     groupedByDay[day].sort((a, b) => b.hours - a.hours);
//   });

//   return (
//     <div className="overflow-x-auto -mx-4 sm:mx-0 shadow-sm rounded-xl mt-4">
//       <div className="inline-block min-w-full align-middle">
//         <div className="overflow-hidden border border-amber-200/60 rounded-xl bg-white">
//           <table className="min-w-full divide-y divide-amber-200/60">
//             <thead className="bg-amber-50/80 backdrop-blur-sm">
//               <tr>
//                 <th
//                   scope="col"
//                   className="px-5 py-3.5 text-left text-xs font-bold text-amber-900 uppercase tracking-wider border-b border-amber-200/60"
//                 >
//                   Day
//                 </th>
//                 <th
//                   scope="col"
//                   className="px-5 py-3.5 text-left text-xs font-bold text-amber-900 uppercase tracking-wider border-b border-amber-200/60"
//                 >
//                   Subject
//                 </th>
//                 <th
//                   scope="col"
//                   className="px-5 py-3.5 text-left text-xs font-bold text-amber-900 uppercase tracking-wider border-b border-amber-200/60"
//                 >
//                   Task
//                 </th>
//                 <th
//                   scope="col"
//                   className="px-5 py-3.5 text-left text-xs font-bold text-amber-900 uppercase tracking-wider border-b border-amber-200/60"
//                 >
//                   Duration
//                 </th>
//               </tr>
//             </thead>
//             <tbody className="divide-y divide-amber-100/40">
//               {days.map((day) =>
//                 groupedByDay[day].map((item, idx) => (
//                   <tr
//                     key={`${day}-${idx}`}
//                     className="hover:bg-amber-50/50 transition-colors duration-150"
//                   >
//                     {/* 🌟 CONDITIONAL RENDERING FOR ROWSPAN 🌟 */}
//                     {idx === 0 && (
//                       <td
//                         rowSpan={groupedByDay[day].length}
//                         className="px-5 py-4 whitespace-nowrap align-top bg-amber-50/30 border-r border-amber-100/50"
//                       >
//                         <div className="flex items-center gap-2">
//                           <div className="w-1.5 h-1.5 rounded-full bg-amber-400"></div>
//                           <span className="font-bold text-amber-900">
//                             Day {item.day}
//                           </span>
//                         </div>
//                       </td>
//                     )}

//                     <td className="px-5 py-4 whitespace-nowrap">
//                       <span className="text-sm font-semibold text-gray-800">
//                         {item.subject}
//                       </span>
//                     </td>
//                     <td className="px-5 py-4">
//                       <span className="text-sm text-gray-600 leading-relaxed block max-w-md">
//                         {item.task}
//                       </span>
//                     </td>
//                     <td className="px-5 py-4 whitespace-nowrap">
//                       <span className="px-3 py-1 inline-flex text-xs font-bold rounded-md bg-amber-100/80 text-amber-800 border border-amber-200/50">
//                         <Clock className="w-3.5 h-3.5 mr-1" />
//                         {item.hours}h
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
//   const [userEmail, setUserEmail] = useState("");
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

//   // State for the email sending animation
//   const [sendingEmailId, setSendingEmailId] = useState(null);
//   const [sentEmailId, setSentEmailId] = useState(null);

//   const currentWeek = calculateAcademicWeek(
//     SEMESTER_START_DATE,
//     currentWeekStart,
//   );
//   const academicPeriod = getAcademicPeriod(SEMESTER_START_DATE);

//   useEffect(() => {
//     setWeekOptions(generateWeekOptions(SEMESTER_START_DATE));
//   }, []);

//   useEffect(() => {
//     if (weeklyWorkload.length > 0)
//       setWorkloadStats(calculateWorkloadStats(weeklyWorkload));
//   }, [weeklyWorkload]);

//   const loadBackendReminders = async () => {
//     if (!studentId) return;
//     try {
//       setLoadingReminders(true);
//       const reminderData = await fetchActiveReminders(studentId);
//       if (reminderData.reminders && reminderData.reminders.length > 0) {
//         setBackendReminders(
//           reminderData.reminders.map((r) => ({
//             ...r,
//             targetWeekStart: new Date(r.targetWeekStart),
//           })),
//         );
//       }
//       setHasLoadedReminders(true);
//     } catch (error) {
//       console.error("Error loading reminders:", error);
//       setHasLoadedReminders(true);
//     } finally {
//       setLoadingReminders(false);
//     }
//   };

//   const handleDismissReminder = async (reminderId) => {
//     try {
//       await dismissReminder(reminderId, studentId);
//       setBackendReminders((prev) => prev.filter((r) => r.id !== reminderId));
//     } catch (err) {
//       console.error("Error dismissing reminder:", err);
//     }
//   };

//   const handleSendReminderEmail = async (reminder) => {
//     if (!userEmail) {
//       alert("We need your email address to send a reminder.");
//       return;
//     }

//     setSendingEmailId(reminder.id);

//     try {
//       // TODO: Replace with actual API call
//       await new Promise((resolve) => setTimeout(resolve, 1500));

//       setSentEmailId(reminder.id);

//       setTimeout(() => {
//         setSentEmailId(null);
//       }, 3000);
//     } catch (error) {
//       console.error("Failed to send email:", error);
//       alert("Failed to send the email. Please try again.");
//     } finally {
//       setSendingEmailId(null);
//     }
//   };

//   useEffect(() => {
//     const auth = getAuth();
//     const unsubscribe = onAuthStateChanged(auth, (user) => {
//       if (user) {
//         setStudentId(user.uid);
//         setUserEmail(user.email);
//       } else {
//         setStudentId(null);
//       }
//     });
//     return () => unsubscribe();
//   }, []);

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
//         setWeeklyWorkload(
//           Array.isArray(weeklyResponse?.weeks) ? weeklyResponse.weeks : [],
//         );
//         setLectureAlerts(alertRes?.alerts || []);
//       } catch (err) {
//         console.error("Dashboard error:", err);
//       } finally {
//         setLoading(false);
//       }
//     }
//     loadDashboard();
//   }, [studentId]);

//   useEffect(() => {
//     if (!loading && weeklyWorkload.length > 0 && !hasLoadedReminders)
//       loadBackendReminders();
//   }, [loading, weeklyWorkload, hasLoadedReminders]);

//   const handleDayClick = (week) => setSelectedDate(week);
//   const handleWeekChange = (newWeekStart) => setCurrentWeekStart(newWeekStart);

//   const formatDateSafe = (date) => {
//     if (!date) return "Date not available";
//     try {
//       return new Date(date).toLocaleDateString("en-US", {
//         weekday: "short",
//         month: "short",
//         day: "numeric",
//       });
//     } catch {
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
//         </div>
//       </div>
//     );
//   }

//   return (
//     <>
//       <style>{`
//         @keyframes fadeInUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
//         .animate-fade-in-up { animation: fadeInUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards; opacity: 0; }
//         .delay-100 { animation-delay: 100ms; }
//         .delay-200 { animation-delay: 200ms; }
//       `}</style>

//       <div className="min-h-screen bg-slate-50 text-gray-800 font-sans">
//         <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6 lg:space-y-8">
//           {/* HEADER */}
//           <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 sm:p-6 animate-fade-in-up">
//             <div className="flex flex-col sm:flex-row justify-between items-center gap-5">
//               <div className="flex items-center gap-4 w-full sm:w-auto">
//                 <div className="bg-gradient-to-br from-blue-600 to-indigo-600 p-3 rounded-xl shadow-lg shadow-indigo-200">
//                   <GraduationCap className="text-white w-6 h-6" />
//                 </div>
//                 <div>
//                   <h1 className="text-2xl sm:text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-700 to-indigo-600">
//                     Student Dashboard
//                   </h1>
//                   <p className="text-xs sm:text-sm font-medium text-gray-500 uppercase">
//                     Week {currentWeek} • {academicPeriod.semester}
//                   </p>
//                 </div>
//               </div>
//               <div className="flex gap-2 bg-gray-50 p-1 rounded-xl border border-gray-100">
//                 <button
//                   onClick={() => setCalendarView("week")}
//                   className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all ${calendarView === "week" ? "bg-white text-indigo-700 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
//                 >
//                   <Grid className="w-4 h-4" /> Week
//                 </button>
//                 <button
//                   onClick={() => setCalendarView("month")}
//                   className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all ${calendarView === "month" ? "bg-white text-indigo-700 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
//                 >
//                   <Calendar className="w-4 h-4" /> Month
//                 </button>
//               </div>
//             </div>
//           </div>

//           {/* BACKEND PACKED WEEK REMINDERS */}
//           {loadingReminders ? (
//             <div className="bg-white rounded-2xl shadow-sm p-8 text-center">
//               <Loader className="w-6 h-6 text-indigo-500 animate-spin mx-auto" />
//             </div>
//           ) : (
//             backendReminders.length > 0 && (
//               <div className="space-y-4 animate-fade-in-up delay-100">
//                 <div className="flex items-center justify-between mb-2 px-1">
//                   <h3 className="font-bold text-gray-800 flex items-center gap-2 text-lg">
//                     <Sparkles className="w-5 h-5 text-amber-500" /> Smart Action
//                     Plans
//                   </h3>
//                 </div>

//                 {backendReminders.map((reminder) => {
//                   const statusInfo = getStatusLabel(reminder.targetStatus);
//                   const isSending = sendingEmailId === reminder.id;
//                   const isSent = sentEmailId === reminder.id;

//                   return (
//                     <div
//                       key={reminder.id}
//                       className="bg-white rounded-2xl shadow-sm border border-amber-200/60 p-5 sm:p-7 relative group overflow-hidden transition-all hover:shadow-md"
//                     >
//                       <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-gradient-to-b from-amber-400 to-orange-500"></div>

//                       <button
//                         onClick={() => handleDismissReminder(reminder.id)}
//                         className="absolute top-4 right-4 p-2 text-gray-400 hover:text-amber-700 hover:bg-amber-100/80 rounded-full transition-all duration-300 hover:rotate-90"
//                       >
//                         <X className="w-5 h-5" />
//                       </button>

//                       <div className="flex flex-col gap-4 pl-2">
//                         <div className="flex items-start gap-4">
//                           <div className="bg-gradient-to-br from-amber-50 to-orange-50 p-3.5 rounded-2xl border border-amber-100 flex-shrink-0">
//                             <statusInfo.icon
//                               className={`w-6 h-6 ${statusInfo.iconColor}`}
//                             />
//                           </div>
//                           <div className="flex-1 pr-8">
//                             <h4 className="font-extrabold text-gray-900 text-xl mb-1 tracking-tight">
//                               Prepare for Week {reminder.targetBusyWeek}:{" "}
//                               {statusInfo.label}
//                             </h4>
//                             <p className="text-gray-600 font-medium leading-relaxed mb-4">
//                               {reminder.message ||
//                                 `You have a heavy workload of ${reminder.targetTotalHours} hours approaching. Here is your AI-generated study timetable to keep you on track.`}
//                             </p>

//                             {/* TIMETABLE RENDERING */}
//                             {reminder.timetable?.length > 0 ? (
//                               <TimetableTable timetable={reminder.timetable} />
//                             ) : (
//                               <div className="bg-amber-50/50 rounded-xl p-4 border border-amber-100/50">
//                                 <p className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
//                                   <Lightbulb className="w-4 h-4 text-amber-500" />{" "}
//                                   Quick Tips:
//                                 </p>
//                                 <ul className="space-y-2">
//                                   {generateWorkloadTips(
//                                     reminder.targetStatus,
//                                     reminder.targetTotalHours,
//                                   ).map((tip, idx) => (
//                                     <li
//                                       key={idx}
//                                       className="flex items-start gap-2 text-sm text-gray-700 font-medium bg-white p-2 rounded-lg border border-gray-100 shadow-sm"
//                                     >
//                                       <CheckCircle className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />{" "}
//                                       {tip}
//                                     </li>
//                                   ))}
//                                 </ul>
//                               </div>
//                             )}

//                             {/* EMAIL BUTTON ADDED HERE */}
//                             <div className="mt-6 flex items-center justify-between border-t border-amber-100 pt-4">
//                               <p className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
//                                 <Calendar className="w-3.5 h-3.5" />
//                                 Week Starts:{" "}
//                                 {formatDateSafe(reminder.targetWeekStart)}
//                               </p>

//                               <button
//                                 onClick={() =>
//                                   handleSendReminderEmail(reminder)
//                                 }
//                                 disabled={isSending || isSent}
//                                 className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all duration-300 shadow-sm
//                                 ${
//                                   isSent
//                                     ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
//                                     : "bg-white border border-amber-200 text-amber-700 hover:bg-amber-50 hover:border-amber-300 active:scale-95"
//                                 }`}
//                               >
//                                 {isSending ? (
//                                   <>
//                                     <Loader className="w-4 h-4 animate-spin" />
//                                     Sending Plan...
//                                   </>
//                                 ) : isSent ? (
//                                   <>
//                                     <CheckCircle className="w-4 h-4" />
//                                     Sent to {userEmail}
//                                   </>
//                                 ) : (
//                                   <>
//                                     <Send className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
//                                     Email this Plan
//                                   </>
//                                 )}
//                               </button>
//                             </div>
//                           </div>
//                         </div>
//                       </div>
//                     </div>
//                   );
//                 })}
//               </div>
//             )
//           )}

//           {/* Workload Calendar integration */}
//           <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden animate-fade-in-up delay-200">
//             <WorkloadCalendar
//               workload={weeklyWorkload}
//               onDayClick={handleDayClick}
//               currentWeekStart={currentWeekStart}
//               onWeekChange={handleWeekChange}
//               showWeekNavigation={true}
//               semesterStartDate={SEMESTER_START_DATE}
//             />
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
  Download,
  FileText,
  HelpCircle,
  Eye,
  Zap,
  Coffee,
  Brain,
  FileDown,
  FileCheck,
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
  // Simplified to just PACKED and NORMAL
  const statusMap = {
    NORMAL: {
      label: "Easy Week",
      description: "Light workload - perfect for catching up!",
      color: "bg-emerald-50 text-emerald-700 border-emerald-200",
      icon: CheckCircle,
      iconColor: "text-emerald-500",
      bgLight: "bg-emerald-50",
      emoji: "😌",
      badgeColor: "bg-emerald-500",
    },
    LIGHT: {
      label: "Easy Week",
      description: "Light workload - perfect for catching up!",
      color: "bg-emerald-50 text-emerald-700 border-emerald-200",
      icon: CheckCircle,
      iconColor: "text-emerald-500",
      bgLight: "bg-emerald-50",
      emoji: "😌",
      badgeColor: "bg-emerald-500",
    },
    BUSY: {
      label: "Packed Week",
      description: "Busy week ahead - time to focus!",
      color: "bg-red-50 text-red-700 border-red-200",
      icon: AlertTriangle,
      iconColor: "text-red-500",
      bgLight: "bg-red-50",
      emoji: "📚",
      badgeColor: "bg-red-500",
    },
    MODERATE: {
      label: "Easy Week",
      description: "Light workload - perfect for catching up!",
      color: "bg-emerald-50 text-emerald-700 border-emerald-200",
      icon: CheckCircle,
      iconColor: "text-emerald-500",
      bgLight: "bg-emerald-50",
      emoji: "😌",
      badgeColor: "bg-emerald-500",
    },
    HEAVY: {
      label: "Packed Week",
      description: "Busy week ahead - time to focus!",
      color: "bg-red-50 text-red-700 border-red-200",
      icon: AlertTriangle,
      iconColor: "text-red-500",
      bgLight: "bg-red-50",
      emoji: "📚",
      badgeColor: "bg-red-500",
    },
    OVERLOADED: {
      label: "Packed Week",
      description: "Busy week ahead - time to focus!",
      color: "bg-red-50 text-red-700 border-red-200",
      icon: AlertTriangle,
      iconColor: "text-red-500",
      bgLight: "bg-red-50",
      emoji: "📚",
      badgeColor: "bg-red-500",
    },
  };
  return (
    statusMap[status] || {
      label: "Easy Week",
      description: "Regular week",
      color: "bg-emerald-50 text-emerald-700 border-emerald-200",
      icon: CheckCircle,
      iconColor: "text-emerald-500",
      bgLight: "bg-emerald-50",
      emoji: "😌",
      badgeColor: "bg-emerald-500",
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
    packedWeeks: 0,
    easyWeeks: 0,
    totalHours: 0,
    maxHours: 0,
    averageHours: 0,
    upcomingPackedWeeks: [],
  };
  if (!Array.isArray(weeklyWorkload)) return stats;

  weeklyWorkload.forEach((week) => {
    // Check if it's a packed week (BUSY, HEAVY, OVERLOADED)
    if (
      week.status === "BUSY" ||
      week.status === "HEAVY" ||
      week.status === "OVERLOADED"
    ) {
      stats.packedWeeks++;
      const weekStart = new Date(week.weekStart._seconds * 1000);
      const today = new Date();
      if (weekStart > today) {
        stats.upcomingPackedWeeks.push({
          week: week.week,
          weekStart: weekStart,
          status: "PACKED",
          totalHours: week.totalHours,
          events: week.events || [], // Events from backend
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
  if (status === "PACKED" || totalHours > 15) {
    tips.push("🧠 Break tasks into smaller chunks (25 min work, 5 min rest)");
    tips.push("📝 Use the Pomodoro technique to stay focused");
    tips.push("🎯 Prioritize tasks based on deadlines");
    tips.push("💤 Don't forget to sleep! 7-8 hours is crucial");
  } else {
    tips.push("📅 Stay organized - plan your week ahead");
    tips.push("📚 Review materials regularly");
    tips.push("☕ Take breaks between study sessions");
  }
  return tips;
}

/* ---------------- DAY DETAILS MODAL COMPONENT ---------------- */
const DayDetailsModal = ({ isOpen, onClose, weekData, weekNumber }) => {
  if (!isOpen || !weekData) return null;

  const statusInfo = getStatusLabel(weekData.status);
  const isPacked =
    weekData.status === "BUSY" ||
    weekData.status === "HEAVY" ||
    weekData.status === "OVERLOADED";

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto shadow-2xl animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className={`sticky top-0 p-6 ${isPacked ? "bg-red-50" : "bg-emerald-50"} border-b ${isPacked ? "border-red-100" : "border-emerald-100"}`}
        >
          <div className="flex justify-between items-start">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span
                  className={`px-3 py-1 rounded-full text-xs font-bold ${isPacked ? "bg-red-100 text-red-700" : "bg-emerald-100 text-emerald-700"}`}
                >
                  Week {weekNumber}
                </span>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 ${isPacked ? "bg-red-100 text-red-700" : "bg-emerald-100 text-emerald-700"}`}
                >
                  {statusInfo.emoji} {statusInfo.label}
                </span>
              </div>
              <h2 className="text-2xl font-bold text-gray-800">
                {weekData.weekStart
                  ? new Date(
                      weekData.weekStart._seconds * 1000,
                    ).toLocaleDateString("en-US", {
                      weekday: "long",
                      month: "long",
                      day: "numeric",
                    })
                  : "Week Details"}
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/50 rounded-full transition-all"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Summary Stats */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-50 p-4 rounded-xl">
              <p className="text-sm text-gray-500 mb-1">Total Hours</p>
              <p className="text-2xl font-bold text-gray-800">
                {weekData.totalHours || 0}h
              </p>
            </div>
            <div className="bg-gray-50 p-4 rounded-xl">
              <p className="text-sm text-gray-500 mb-1">Tasks</p>
              <p className="text-2xl font-bold text-gray-800">
                {weekData.breakdown?.length || 0}
              </p>
            </div>
          </div>

          {/* Events Section */}
          {weekData.events && weekData.events.length > 0 && (
            <div>
              <h3 className="font-bold text-gray-700 mb-3 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-red-500" />
                Important Events ({weekData.events.length})
              </h3>
              <div className="space-y-2">
                {weekData.events.map((event, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-3 p-3 bg-red-50 rounded-lg border border-red-100"
                  >
                    <span className="text-xl">
                      {event.includes("Exam")
                        ? "📝"
                        : event.includes("Submission")
                          ? "📤"
                          : "📌"}
                    </span>
                    <span className="text-sm font-medium text-gray-700">
                      {event}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tasks Breakdown */}
          {weekData.breakdown && weekData.breakdown.length > 0 ? (
            <div>
              <h3 className="font-bold text-gray-700 mb-3 flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-indigo-500" />
                Daily Tasks
              </h3>
              <div className="space-y-4">
                {weekData.breakdown.map((task, idx) => (
                  <div
                    key={idx}
                    className="border border-gray-100 rounded-lg p-4 hover:shadow-md transition-all"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-bold text-indigo-600">
                        Day {task.day}
                      </span>
                      <span className="px-2 py-1 bg-indigo-50 text-indigo-600 rounded-md text-xs font-bold">
                        {task.hours}h
                      </span>
                    </div>
                    <p className="text-sm font-medium text-gray-800 mb-1">
                      {task.subject}
                    </p>
                    <p className="text-xs text-gray-500">{task.task}</p>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-8 bg-gray-50 rounded-lg">
              <p className="text-gray-500">No tasks scheduled for this week</p>
            </div>
          )}

          {/* Tips */}
          <div className="bg-indigo-50 p-4 rounded-xl">
            <h3 className="font-bold text-indigo-700 mb-2 flex items-center gap-2">
              <Lightbulb className="w-4 h-4" />
              Tips for this week
            </h3>
            <ul className="space-y-2">
              {generateWorkloadTips(
                isPacked ? "PACKED" : "NORMAL",
                weekData.totalHours || 0,
              ).map((tip, idx) => (
                <li
                  key={idx}
                  className="text-sm text-gray-600 flex items-start gap-2"
                >
                  <CheckCircle className="w-4 h-4 text-indigo-400 mt-0.5 flex-shrink-0" />
                  {tip}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ---------------- PDF GENERATION FUNCTION ---------------- */
const generatePDF = (reminder, userEmail, academicPeriod) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();

  // Header
  doc.setFillColor(239, 68, 68); // Red for packed week
  doc.rect(0, 0, pageWidth, 40, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.setFont("helvetica", "bold");
  doc.text("📚 Busy Week Study Plan", pageWidth / 2, 25, { align: "center" });

  // Week info
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text(`Week ${reminder.targetBusyWeek} Study Schedule`, 20, 55);

  doc.setFontSize(12);
  doc.setFont("helvetica", "normal");
  doc.text(`Student: ${userEmail || "Student"}`, 20, 65);
  doc.text(
    `Week Starts: ${new Date(reminder.targetWeekStart).toLocaleDateString(
      "en-US",
      {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      },
    )}`,
    20,
    75,
  );
  doc.text(`Total Hours: ${reminder.targetTotalHours} hours`, 20, 85);

  // Events/Deadlines section
  if (reminder.events && reminder.events.length > 0) {
    doc.setFillColor(254, 226, 226); // Light red
    doc.rect(20, 95, pageWidth - 40, 10, "F");
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(185, 28, 28);
    doc.text("📅 Important This Week:", 25, 102);

    let yPos = 112;
    reminder.events.forEach((event, index) => {
      doc.setFont("helvetica", "normal");
      doc.setTextColor(0, 0, 0);
      doc.text(`• ${event}`, 25, yPos);
      yPos += 7;
    });
  }

  // Timetable
  if (reminder.timetable && reminder.timetable.length > 0) {
    const tableData = reminder.timetable.map((item) => [
      `Day ${item.day}`,
      item.subject,
      item.task,
      `${item.hours}h`,
    ]);

    autoTable(doc, {
      startY: reminder.events?.length > 0 ? 140 : 100,
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
        0: { cellWidth: 30 },
        1: { cellWidth: 40 },
        2: { cellWidth: "auto" },
        3: { cellWidth: 25 },
      },
    });
  } else {
    // Tips if no timetable
    const tips = generateWorkloadTips("PACKED", reminder.targetTotalHours);
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("💡 Quick Tips for This Week:", 20, 110);

    let yPos = 120;
    tips.forEach((tip, index) => {
      doc.setFont("helvetica", "normal");
      doc.text(tip, 25, yPos);
      yPos += 7;
    });
  }

  // Footer
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(
      `Generated on ${new Date().toLocaleDateString()} • ${academicPeriod.semester}`,
      pageWidth / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: "center" },
    );
  }

  // Save PDF
  doc.save(`Week-${reminder.targetBusyWeek}-Study-Plan.pdf`);
};

/* ---------------- TIMETABLE COMPONENT ---------------- */
const TimetableTable = ({ timetable, events = [] }) => {
  if (!timetable || timetable.length === 0) return null;

  // Group tasks by day
  const groupedByDay = timetable.reduce((acc, item) => {
    if (!acc[item.day]) acc[item.day] = [];
    acc[item.day].push(item);
    return acc;
  }, {});

  // Sort the days numerically
  const days = Object.keys(groupedByDay).sort(
    (a, b) => parseInt(a) - parseInt(b),
  );

  // Sort tasks within each day
  days.forEach((day) => {
    groupedByDay[day].sort((a, b) => b.hours - a.hours);
  });

  return (
    <div className="overflow-x-auto -mx-4 sm:mx-0 shadow-sm rounded-xl mt-4">
      <div className="inline-block min-w-full align-middle">
        <div className="overflow-hidden border border-red-200/60 rounded-xl bg-white">
          <table className="min-w-full divide-y divide-red-200/60">
            <thead className="bg-red-50/80 backdrop-blur-sm">
              <tr>
                <th
                  scope="col"
                  className="px-5 py-3.5 text-left text-xs font-bold text-red-900 uppercase tracking-wider border-b border-red-200/60"
                >
                  Day
                </th>
                <th
                  scope="col"
                  className="px-5 py-3.5 text-left text-xs font-bold text-red-900 uppercase tracking-wider border-b border-red-200/60"
                >
                  Subject
                </th>
                <th
                  scope="col"
                  className="px-5 py-3.5 text-left text-xs font-bold text-red-900 uppercase tracking-wider border-b border-red-200/60"
                >
                  Task
                </th>
                <th
                  scope="col"
                  className="px-5 py-3.5 text-left text-xs font-bold text-red-900 uppercase tracking-wider border-b border-red-200/60"
                >
                  Duration
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-red-100/40">
              {days.map((day) =>
                groupedByDay[day].map((item, idx) => (
                  <tr
                    key={`${day}-${idx}`}
                    className="hover:bg-red-50/50 transition-colors duration-150"
                  >
                    {idx === 0 && (
                      <td
                        rowSpan={groupedByDay[day].length}
                        className="px-5 py-4 whitespace-nowrap align-top bg-red-50/30 border-r border-red-100/50"
                      >
                        <div className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-red-400"></div>
                          <span className="font-bold text-red-900">
                            Day {item.day}
                          </span>
                        </div>
                      </td>
                    )}

                    <td className="px-5 py-4 whitespace-nowrap">
                      <span className="text-sm font-semibold text-gray-800">
                        {item.subject}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span className="text-sm text-gray-600 leading-relaxed block max-w-md">
                        {item.task}
                      </span>
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      <span className="px-3 py-1 inline-flex text-xs font-bold rounded-md bg-red-100/80 text-red-800 border border-red-200/50">
                        <Clock className="w-3.5 h-3.5 mr-1" />
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

/* ---------------- ONBOARDING TOUR COMPONENT ---------------- */
const OnboardingTour = ({ onDismiss }) => {
  const [step, setStep] = useState(0);

  const steps = [
    {
      title: "👋 Welcome to Your Smart Dashboard!",
      description:
        "This is your personal academic assistant that helps you prepare for busy weeks ahead. Let's take a quick 30-second tour!",
      icon: <Brain className="w-12 h-12 text-indigo-600" />,
    },
    {
      title: "📊 Spot Busy Weeks at a Glance",
      description:
        "The colored calendar shows your workload: 🔴 Red = Busy week ahead, 🟢 Green = Easy week. The icons show how many events you have that week!",
      icon: <Eye className="w-12 h-12 text-amber-500" />,
    },
    {
      title: "👆 Click Any Day for Details",
      description:
        "Click on any day in the calendar to see a detailed breakdown of your tasks, events, and study tips for that week!",
      icon: <Zap className="w-12 h-12 text-blue-500" />,
    },
    {
      title: "⚡ Smart Action Plans",
      description:
        "When a busy week approaches, we automatically create study timetables and tips to help you prepare. You can download them as PDF!",
      icon: <Target className="w-12 h-12 text-green-500" />,
    },
    {
      title: "🎯 Ready to Succeed!",
      description:
        "That's it! Now you can see upcoming busy weeks and prepare in advance. Good luck with your studies! 🍀",
      icon: <GraduationCap className="w-12 h-12 text-purple-500" />,
    },
  ];

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl overflow-hidden animate-scale-in">
        <div className="p-8">
          <div className="flex justify-center mb-6">
            <div className="w-24 h-24 bg-gradient-to-br from-indigo-100 to-blue-100 rounded-full flex items-center justify-center">
              {steps[step].icon}
            </div>
          </div>

          <h2 className="text-2xl font-bold text-center mb-3 text-gray-800">
            {steps[step].title}
          </h2>

          <p className="text-gray-600 text-center mb-8 leading-relaxed">
            {steps[step].description}
          </p>

          <div className="flex items-center justify-between">
            <div className="flex gap-1.5">
              {steps.map((_, i) => (
                <div
                  key={i}
                  className={`w-2 h-2 rounded-full transition-all ${
                    i === step ? "bg-indigo-600 w-4" : "bg-gray-300"
                  }`}
                />
              ))}
            </div>

            <div className="flex gap-3">
              {step < steps.length - 1 ? (
                <>
                  <button
                    onClick={onDismiss}
                    className="px-4 py-2 text-gray-500 hover:text-gray-700 font-medium"
                  >
                    Skip
                  </button>
                  <button
                    onClick={() => setStep(step + 1)}
                    className="px-6 py-2 bg-gradient-to-r from-indigo-600 to-blue-600 text-white rounded-xl font-bold hover:shadow-lg transition-all"
                  >
                    Next
                  </button>
                </>
              ) : (
                <button
                  onClick={onDismiss}
                  className="px-8 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-bold hover:shadow-lg transition-all"
                >
                  Get Started!
                </button>
              )}
            </div>
          </div>
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
  const [selectedWeek, setSelectedWeek] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentWeekStart, setCurrentWeekStart] = useState(new Date());
  const [calendarView, setCalendarView] = useState("week");
  const [loading, setLoading] = useState(true);
  const [weekOptions, setWeekOptions] = useState([]);
  const [workloadStats, setWorkloadStats] = useState(null);
  const [backendReminders, setBackendReminders] = useState([]);
  const [loadingReminders, setLoadingReminders] = useState(false);
  const [hasLoadedReminders, setHasLoadedReminders] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showLegend, setShowLegend] = useState(true);

  // State for PDF download
  const [downloadingPdfId, setDownloadingPdfId] = useState(null);

  const currentWeek = calculateAcademicWeek(
    SEMESTER_START_DATE,
    currentWeekStart,
  );
  const academicPeriod = getAcademicPeriod(SEMESTER_START_DATE);

  // Check if user is new (first visit)
  useEffect(() => {
    const hasSeenOnboarding = localStorage.getItem("hasSeenOnboarding");
    if (!hasSeenOnboarding) {
      setShowOnboarding(true);
      localStorage.setItem("hasSeenOnboarding", "true");
    }
  }, []);

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

  const handleDownloadPDF = (reminder) => {
    setDownloadingPdfId(reminder.id);

    // Small delay to show loading state
    setTimeout(() => {
      generatePDF(reminder, userEmail, academicPeriod);
      setDownloadingPdfId(null);
    }, 500);
  };

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

  // FIXED: handleDayClick now opens the modal with selected week data
  const handleDayClick = (week) => {
    console.log("Day clicked:", week); // For debugging
    setSelectedWeek(week);
    setIsModalOpen(true);
  };

  const handleWeekChange = (newWeekStart) => setCurrentWeekStart(newWeekStart);

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
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes scaleIn { from { opacity: 0; transform: scale(0.9); } to { opacity: 1; transform: scale(1); } }
        .animate-fade-in-up { animation: fadeInUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards; opacity: 0; }
        .animate-fade-in { animation: fadeIn 0.3s ease forwards; }
        .animate-scale-in { animation: scaleIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .delay-100 { animation-delay: 100ms; }
        .delay-200 { animation-delay: 200ms; }
      `}</style>

      {/* Onboarding Tour */}
      {showOnboarding && (
        <OnboardingTour onDismiss={() => setShowOnboarding(false)} />
      )}

      {/* Day Details Modal */}
      <DayDetailsModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        weekData={selectedWeek}
        weekNumber={selectedWeek?.week || currentWeek}
      />

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
                  onClick={() => setShowLegend(!showLegend)}
                  className="px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition-all"
                >
                  <HelpCircle className="w-4 h-4" />
                  {showLegend ? "Hide Guide" : "Show Guide"}
                </button>
                <div className="flex gap-2 bg-gray-50 p-1 rounded-xl border border-gray-100">
                  <button
                    onClick={() => setCalendarView("week")}
                    className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all ${calendarView === "week" ? "bg-white text-indigo-700 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
                  >
                    <Grid className="w-4 h-4" /> Week
                  </button>
                  <button
                    onClick={() => setCalendarView("month")}
                    className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all ${calendarView === "month" ? "bg-white text-indigo-700 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
                  >
                    <Calendar className="w-4 h-4" /> Month
                  </button>
                </div>
              </div>
            </div>

            {/* Quick Guide Banner */}
            {showLegend && (
              <div className="mt-6 p-4 bg-gradient-to-r from-indigo-50 to-blue-50 rounded-xl border border-indigo-100 animate-fade-in">
                <div className="flex items-start gap-3">
                  <div className="bg-indigo-100 p-2 rounded-lg">
                    <Eye className="w-5 h-5 text-indigo-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-indigo-900 mb-2">
                      📅 How to use this dashboard:
                    </h3>
                    <div className="flex flex-wrap gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                        <span>😌 Easy Week</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-red-500"></div>
                        <span>📚 Packed Week (Prepare!)</span>
                      </div>
                      <div className="flex items-center gap-2 bg-white px-3 py-1 rounded-full">
                        <span className="text-xs">
                          👆 Click any day for details
                        </span>
                      </div>
                    </div>
                    <p className="text-xs text-indigo-600 mt-3 flex items-center gap-1">
                      <Zap className="w-3 h-3" />
                      <span>
                        Icons on calendar show events/exams. Click any day to
                        see full breakdown!
                      </span>
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* BACKEND PACKED WEEK REMINDERS */}
          {loadingReminders ? (
            <div className="bg-white rounded-2xl shadow-sm p-8 text-center">
              <Loader className="w-6 h-6 text-indigo-500 animate-spin mx-auto" />
              <p className="text-sm text-gray-500 mt-2">
                Checking for upcoming busy weeks...
              </p>
            </div>
          ) : (
            backendReminders.length > 0 && (
              <div className="space-y-4 animate-fade-in-up delay-100">
                <div className="flex items-center justify-between mb-2 px-1">
                  <h3 className="font-bold text-gray-800 flex items-center gap-2 text-lg">
                    <Sparkles className="w-5 h-5 text-amber-500" />⚡ Prepare
                    for These Busy Weeks
                    <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full">
                      {backendReminders.length}{" "}
                      {backendReminders.length === 1 ? "week" : "weeks"} ahead
                    </span>
                  </h3>
                </div>

                {backendReminders.map((reminder) => {
                  const statusInfo = getStatusLabel("BUSY"); // Force packed week styling
                  const isDownloading = downloadingPdfId === reminder.id;
                  const daysUntil = Math.ceil(
                    (reminder.targetWeekStart - new Date()) /
                      (1000 * 60 * 60 * 24),
                  );

                  return (
                    <div
                      key={reminder.id}
                      className="bg-white rounded-2xl shadow-sm border border-red-200/60 p-5 sm:p-7 relative group overflow-hidden transition-all hover:shadow-md"
                    >
                      <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-gradient-to-b from-red-400 to-red-600"></div>

                      <button
                        onClick={() => handleDismissReminder(reminder.id)}
                        className="absolute top-4 right-4 p-2 text-gray-400 hover:text-red-700 hover:bg-red-100/80 rounded-full transition-all duration-300 hover:rotate-90"
                      >
                        <X className="w-5 h-5" />
                      </button>

                      <div className="flex flex-col gap-4 pl-2">
                        <div className="flex items-start gap-4">
                          <div className="bg-gradient-to-br from-red-50 to-orange-50 p-3.5 rounded-2xl border border-red-100 flex-shrink-0">
                            <AlertTriangle className="w-6 h-6 text-red-500" />
                          </div>
                          <div className="flex-1 pr-8">
                            <div className="flex items-center gap-3 mb-2 flex-wrap">
                              <h4 className="font-extrabold text-gray-900 text-xl tracking-tight">
                                Week {reminder.targetBusyWeek}: Packed Week 📚
                              </h4>
                              <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-bold">
                                {daysUntil} {daysUntil === 1 ? "day" : "days"}{" "}
                                away
                              </span>
                            </div>

                            <p className="text-gray-600 font-medium leading-relaxed mb-4">
                              {reminder.message ||
                                `You have a ${reminder.targetTotalHours}-hour workload coming up. Here's your personalized study plan to stay on track!`}
                            </p>

                            {/* Events Section - Shows icons from backend */}
                            {reminder.events && reminder.events.length > 0 && (
                              <div className="mb-4 p-3 bg-red-50 rounded-xl border border-red-100">
                                <p className="text-sm font-bold text-red-700 mb-2 flex items-center gap-2">
                                  <Calendar className="w-4 h-4" />
                                  Important this week ({
                                    reminder.events.length
                                  }{" "}
                                  {reminder.events.length === 1
                                    ? "event"
                                    : "events"}
                                  ):
                                </p>
                                <div className="flex flex-wrap gap-2">
                                  {reminder.events.map((event, idx) => (
                                    <span
                                      key={idx}
                                      className="px-3 py-1 bg-white text-red-600 rounded-full text-xs font-bold border border-red-200 flex items-center gap-1"
                                    >
                                      {event.includes("Exam")
                                        ? "📝"
                                        : event.includes("Submission")
                                          ? "📤"
                                          : "📌"}{" "}
                                      {event}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* TIMETABLE RENDERING */}
                            {reminder.timetable?.length > 0 ? (
                              <>
                                <p className="text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                                  <BookOpen className="w-4 h-4 text-red-500" />
                                  Your Recommended Schedule:
                                </p>
                                <TimetableTable
                                  timetable={reminder.timetable}
                                  events={reminder.events}
                                />
                              </>
                            ) : (
                              <div className="bg-red-50/50 rounded-xl p-4 border border-red-100/50">
                                <p className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
                                  <Lightbulb className="w-4 h-4 text-red-500" />
                                  Quick Tips for This Week:
                                </p>
                                <ul className="space-y-2">
                                  {generateWorkloadTips(
                                    "PACKED",
                                    reminder.targetTotalHours,
                                  ).map((tip, idx) => (
                                    <li
                                      key={idx}
                                      className="flex items-start gap-2 text-sm text-gray-700 font-medium bg-white p-2 rounded-lg border border-gray-100 shadow-sm"
                                    >
                                      <CheckCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                                      {tip}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}

                            {/* PDF DOWNLOAD BUTTON */}
                            <div className="mt-6 flex items-center justify-between border-t border-red-100 pt-4">
                              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                                <Calendar className="w-3.5 h-3.5" />
                                Week Starts:{" "}
                                {formatDateSafe(reminder.targetWeekStart)}
                              </p>

                              <button
                                onClick={() => handleDownloadPDF(reminder)}
                                disabled={isDownloading}
                                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all duration-300 shadow-sm
                                ${
                                  isDownloading
                                    ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                                    : "bg-gradient-to-r from-red-500 to-red-600 text-white hover:from-red-600 hover:to-red-700 active:scale-95"
                                }`}
                              >
                                {isDownloading ? (
                                  <>
                                    <Loader className="w-4 h-4 animate-spin" />
                                    Generating PDF...
                                  </>
                                ) : (
                                  <>
                                    <FileDown className="w-4 h-4" />
                                    Download Study Plan (PDF)
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

          {/* Footer tip */}
          {backendReminders.length === 0 && (
            <div className="text-center p-6 bg-white rounded-2xl border border-gray-100 animate-fade-in-up">
              <Coffee className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-500">
                No packed weeks ahead! Use this time to get ahead on your
                studies. 😊
              </p>
              <p className="text-sm text-gray-400 mt-1">
                The calendar above shows your weekly workload. 👆 Click any day
                for details!
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default StudentDashboard;
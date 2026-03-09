// frontend/src/pages/AdminWorkloadTracker.jsx
// import React, { useState, useEffect } from "react";
// import { Users, Calendar, CheckCircle, Circle, Mail, Loader, AlertCircle, Search, Clock, ChevronDown, ChevronUp, X, Filter, Send, BellRing, Lock } from "lucide-react";
// import { fetchAllStudentsWorkloads, updateTaskCompletion, triggerManualWarningEmail } from "../services/api/workloadAdminService";

// const AdminWorkloadTracker = () => {
//   const [workloads, setWorkloads] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [searchTerm, setSearchTerm] = useState("");
//   const [weekFilter, setWeekFilter] = useState("All");
//   const [processingId, setProcessingId] = useState(null);
//   const [processingBulk, setProcessingBulk] = useState(false);
//   const [expandedStudents, setExpandedStudents] = useState({});
//   const [toast, setToast] = useState({
//     show: false,
//     message: "",
//     type: "success",
//   });

//   useEffect(() => {
//     loadData();
//   }, []);

//   const loadData = async () => {
//     setLoading(true);
//     const data = await fetchAllStudentsWorkloads();
//     setWorkloads(data || []);
//     if (data) {
//       const initialExpanded = {};
//       data.forEach((w) => (initialExpanded[w.studentId] = true));
//       setExpandedStudents(initialExpanded);
//     }
//     setLoading(false);
//   };

//   const showToast = (message, type = "success") => {
//     setToast({ show: true, message, type });
//     setTimeout(
//       () => setToast({ show: false, message: "", type: "success" }),
//       4000,
//     );
//   };

//   const toggleStudent = (studentId) =>
//     setExpandedStudents((prev) => ({ ...prev, [studentId]: !prev[studentId] }));

//   const handleToggleCompletion = async (docId, taskIndex, currentStatus) => {
//     const newStatus = !currentStatus;
//     setProcessingId(`task-${docId}-${taskIndex}`);
//     try {
//       await updateTaskCompletion(docId, taskIndex, newStatus);
//       setWorkloads((prev) =>
//         prev.map((w) => {
//           if (w.id === docId) {
//             const newBreakdown = [...w.breakdown];
//             newBreakdown[taskIndex] = {
//               ...newBreakdown[taskIndex],
//               isCompleted: newStatus,
//             };
//             return { ...w, breakdown: newBreakdown };
//           }
//           return w;
//         }),
//       );
//     } catch (error) {
//       showToast("Failed to update status.", "error");
//     } finally {
//       setProcessingId(null);
//     }
//   };

//   const handleSendEmail = async (studentId, week) => {
//     setProcessingId(`email-${studentId}-${week}`);
//     try {
//       const response = await triggerManualWarningEmail(studentId, week);
//       showToast(response.message || `Email sent!`);
//       loadData();
//     } catch (error) {
//       showToast(
//         error.response?.data?.error || "Failed to send email.",
//         "error",
//       );
//     } finally {
//       setProcessingId(null);
//     }
//   };

//   const handleBulkEmail = async () => {
//     if (pendingActions.length === 0) return;
//     setProcessingBulk(true);
//     try {
//       const promises = pendingActions.map((action) =>
//         triggerManualWarningEmail(action.studentId, action.week),
//       );
//       await Promise.all(promises);
//       showToast(`Successfully sent ${promises.length} emails!`);
//       loadData();
//     } catch (error) {
//       showToast("Some emails failed. Check logs.", "error");
//     } finally {
//       setProcessingBulk(false);
//     }
//   };

//   const parseFirestoreDate = (dateObj) => {
//     if (!dateObj) return new Date();
//     if (dateObj._seconds) return new Date(dateObj._seconds * 1000);
//     return new Date(dateObj);
//   };

//   // 🌟 STRICT TIME WINDOW LOGIC
//   // const getEmailButtonConfig = (workload) => {
//   //   const today = new Date();
//   //   today.setHours(0, 0, 0, 0);
//   //   const weekStart = parseFirestoreDate(workload.weekStart);
//   //   weekStart.setHours(0, 0, 0, 0);
//   //   const diffDays = Math.round((weekStart.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
//   //   const hasIncompleteTasks = workload.breakdown?.some(task => !task.isCompleted);

//   //   // 1. Way too far in the future (More than 7 days away) -> LOCK
//   //   if (diffDays > 7) {
//   //     return { text: "Too Early", disabled: true, colorClass: "bg-gray-100 text-gray-400 opacity-60", Icon: Lock };
//   //   }

//   //   // 2. Early Warning Window (Between 2 and 7 days away) -> ACTION REQUIRED
//   //   else if (diffDays > 1 && diffDays <= 7) {
//   //     if (workload.earlyWarningSent) return { text: "Early Warning Sent", disabled: true, colorClass: "bg-gray-100 text-gray-400", Icon: CheckCircle };
//   //     return { text: "Send Timetable (Due)", disabled: false, colorClass: "bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border-indigo-200 shadow-sm", Icon: Mail };
//   //   }

//   //   // 3. Tomorrow Reminder (Exactly 1 day away) -> ACTION REQUIRED
//   //   else if (diffDays === 1) {
//   //     if (workload.dayBeforeReminderSent) return { text: "Reminder Sent", disabled: true, colorClass: "bg-gray-100 text-gray-400", Icon: CheckCircle };
//   //     return { text: "Send Reminder (Due)", disabled: false, colorClass: "bg-amber-50 text-amber-700 hover:bg-amber-100 border-amber-200 shadow-sm", Icon: Clock };
//   //   }

//   //   // 4. Current/Past Week (Missing Submissions) -> ACTION REQUIRED
//   //   else {
//   //     if (!hasIncompleteTasks) return { text: "All Completed", disabled: true, colorClass: "bg-emerald-50 text-emerald-700 border-emerald-200 opacity-60", Icon: CheckCircle };
//   //     if (workload.missingSubmissionWarningSent) return { text: "Warning Sent", disabled: true, colorClass: "bg-gray-100 text-gray-400", Icon: CheckCircle };
//   //     return { text: "Send Warning (Due)", disabled: false, colorClass: "bg-red-50 text-red-700 hover:bg-red-100 border-red-200 shadow-sm", Icon: AlertCircle };
//   //   }
//   // };

//   // 🌟 STRICT TIME WINDOW LOGIC
//   const getEmailButtonConfig = (workload) => {
//     const today = new Date();
//     today.setHours(0, 0, 0, 0);
//     const weekStart = parseFirestoreDate(workload.weekStart);
//     weekStart.setHours(0, 0, 0, 0);

//     // Calculate days between today and the start of that workload's week
//     const diffDays = Math.round(
//       (weekStart.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
//     );

//     // STRICT TASK COUNTING (Fixes the bug where students with 1 submission were marked as fully complete)
//     const totalTasks = workload.breakdown?.length || 0;
//     const completedTasks =
//       workload.breakdown?.filter((task) => task.isCompleted === true)?.length ||
//       0;
//     const isFullyCompleted = totalTasks > 0 && completedTasks === totalTasks;

//     // 1. Way too far in the future (More than 14 days / 2 Weeks away) -> LOCK
//     if (diffDays > 14) {
//       return {
//         text: "Too Early",
//         disabled: true,
//         colorClass: "bg-gray-100 text-gray-400 opacity-60",
//         Icon: Lock,
//       };
//     }

//     // 2. Early Warning / Study Plan Window (Between 2 and 14 days away) -> ACTION REQUIRED
//     // This allows Week 8 to be active while you are in Week 6!
//     else if (diffDays > 1 && diffDays <= 14) {
//       if (workload.earlyWarningSent)
//         return {
//           text: "Timetable Sent",
//           disabled: true,
//           colorClass: "bg-gray-100 text-gray-400",
//           Icon: CheckCircle,
//         };
//       return {
//         text: "Send Timetable (Due)",
//         disabled: false,
//         colorClass:
//           "bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border-indigo-200 shadow-sm",
//         Icon: Mail,
//       };
//     }

//     // 3. Tomorrow Reminder (Exactly 1 day away) -> ACTION REQUIRED
//     else if (diffDays === 1) {
//       if (workload.dayBeforeReminderSent)
//         return {
//           text: "Reminder Sent",
//           disabled: true,
//           colorClass: "bg-gray-100 text-gray-400",
//           Icon: CheckCircle,
//         };
//       return {
//         text: "Send Reminder (Due)",
//         disabled: false,
//         colorClass:
//           "bg-amber-50 text-amber-700 hover:bg-amber-100 border-amber-200 shadow-sm",
//         Icon: Clock,
//       };
//     }

//     // 4. Current/Past Week (Missing Submissions) -> ACTION REQUIRED
//     else {
//       // If they did ALL tasks, lock it. Otherwise, they need a warning!
//       if (isFullyCompleted)
//         return {
//           text: "All Completed",
//           disabled: true,
//           colorClass:
//             "bg-emerald-50 text-emerald-700 border-emerald-200 opacity-60",
//           Icon: CheckCircle,
//         };

//       if (workload.missingSubmissionWarningSent)
//         return {
//           text: "Warning Sent",
//           disabled: true,
//           colorClass: "bg-gray-100 text-gray-400",
//           Icon: CheckCircle,
//         };
//       return {
//         text: "Send Warning (Due)",
//         disabled: false,
//         colorClass:
//           "bg-red-50 text-red-700 hover:bg-red-100 border-red-200 shadow-sm",
//         Icon: AlertCircle,
//       };
//     }
//   };

//   // Calculate Action Center (Only active buttons that are strictly DUE right now)
//   const pendingActions = workloads
//     .map((w) => ({ ...w, btnConfig: getEmailButtonConfig(w) }))
//     .filter((w) => !w.btnConfig.disabled);

//   let filteredWorkloadsByWeek = workloads;
//   // if (weekFilter !== "All")
//   //   filteredWorkloadsByWeek = workloads.filter(
//   //     (w) => w.week.toString() === weekFilter,
//   //   );
//   if (weekFilter !== "All") {
//     filteredWorkloadsByWeek = workloads.filter(
//       (w) => w.week?.toString() === weekFilter,
//     );
//   }

//   const groupedWorkloads = filteredWorkloadsByWeek.reduce((acc, curr) => {
//     if (!acc[curr.studentId])
//       acc[curr.studentId] = {
//         name: curr.studentName || "Unknown",
//         workloads: [],
//       };
//     acc[curr.studentId].workloads.push(curr);
//     return acc;
//   }, {});

//   const filteredStudentIds = Object.keys(groupedWorkloads).filter((id) => {
//     const matchId = id.toLowerCase().includes(searchTerm.toLowerCase());
//     const matchName = groupedWorkloads[id].name
//       .toLowerCase()
//       .includes(searchTerm.toLowerCase());
//     return matchId || matchName;
//   });

//   const uniqueWeeks = [...new Set(workloads.map((w) => w.week))].sort(
//     (a, b) => a - b,
//   );

//   if (loading)
//     return (
//       <div className="flex justify-center items-center h-screen bg-slate-50">
//         <Loader className="w-12 h-12 animate-spin text-indigo-600" />
//       </div>
//     );

//   return (
//     <div className="min-h-screen bg-slate-50 p-4 sm:p-10 font-sans text-gray-800 relative">
//       <div
//         className={`fixed bottom-6 right-6 z-[100] transition-all duration-500 transform ${toast.show ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0 pointer-events-none"}`}
//       >
//         <div
//           className={`flex items-center gap-3 px-6 py-4 rounded-xl shadow-2xl border ${toast.type === "error" ? "bg-red-50 border-red-200 text-red-800" : "bg-emerald-50 border-emerald-200 text-emerald-800"}`}
//         >
//           {toast.type === "error" ? (
//             <AlertCircle className="w-5 h-5" />
//           ) : (
//             <CheckCircle className="w-5 h-5" />
//           )}
//           <p className="font-medium text-sm">{toast.message}</p>
//           <button
//             onClick={() =>
//               setToast({ show: false, message: "", type: "success" })
//             }
//             className="ml-4 opacity-60 hover:opacity-100"
//           >
//             <X className="w-4 h-4" />
//           </button>
//         </div>
//       </div>

//       <div className="max-w-6xl mx-auto space-y-6">
//         {/* 🌟 ACTION CENTER */}
//         {pendingActions.length > 0 ? (
//           <div className="bg-gradient-to-r from-indigo-900 to-purple-900 rounded-2xl p-6 shadow-lg text-white flex flex-col sm:flex-row justify-between items-center gap-6 animate-in slide-in-from-top-4">
//             <div className="flex items-center gap-4">
//               <div className="p-3 bg-white/20 rounded-full animate-pulse">
//                 <BellRing className="w-8 h-8 text-white" />
//               </div>
//               <div>
//                 <h2 className="text-xl font-bold">Emails Due Today</h2>
//                 <p className="text-indigo-200 text-sm mt-1">
//                   You have{" "}
//                   <strong className="text-white">
//                     {pendingActions.length} strictly scheduled emails
//                   </strong>{" "}
//                   that need to be sent today.
//                 </p>
//               </div>
//             </div>
//             <button
//               onClick={handleBulkEmail}
//               disabled={processingBulk}
//               className="px-6 py-3 bg-white text-indigo-900 rounded-xl font-bold shadow-md hover:bg-indigo-50 hover:scale-105 transition-all w-full sm:w-auto flex items-center justify-center gap-2"
//             >
//               {processingBulk ? (
//                 <Loader className="w-5 h-5 animate-spin" />
//               ) : (
//                 <Send className="w-5 h-5" />
//               )}
//               Send All {pendingActions.length} Due Emails
//             </button>
//           </div>
//         ) : (
//           <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 flex items-center gap-4 text-emerald-800">
//             <div className="p-3 bg-emerald-100 rounded-full">
//               <CheckCircle className="w-6 h-6 text-emerald-600" />
//             </div>
//             <div>
//               <h2 className="text-lg font-bold">You are all caught up!</h2>
//               <p className="text-sm">
//                 There are no emails scheduled to be sent today. Check back
//                 tomorrow.
//               </p>
//             </div>
//           </div>
//         )}

//         {/* Header Controls */}
//         <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
//           <div className="flex-1">
//             <h1 className="text-2xl sm:text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600 flex items-center gap-3">
//               <Users className="text-indigo-600 w-8 h-8" /> Submission Tracker
//             </h1>
//           </div>
//           <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto">
//             <div className="relative w-full sm:w-64 group">
//               <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
//               <input
//                 type="text"
//                 placeholder="Search Name or ID..."
//                 value={searchTerm}
//                 onChange={(e) => setSearchTerm(e.target.value)}
//                 className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500"
//               />
//             </div>
//             <div className="relative w-full sm:w-40">
//               <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
//               {/* <select
//                 value={weekFilter}
//                 onChange={(e) => setWeekFilter(e.target.value)}
//                 className="w-full pl-9 pr-8 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm appearance-none font-medium"
//               >
//                 <option value="All">All Weeks</option>
//                 {uniqueWeeks.map((week) => (
//                   <option key={week} value={week}>
//                     Week {week}
//                   </option>
//                 ))}
//               </select> */}

//               <select
//                 value={weekFilter}
//                 onChange={(e) => setWeekFilter(e.target.value)}
//                 className="w-full pl-9 pr-8 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm appearance-none font-medium"
//               >
//                 <option value="All">All Weeks</option>

//                 {/* 👇 Updated mapping logic with a guaranteed unique key */}
//                 {uniqueWeeks
//                   .filter((week) => week !== undefined && week !== null) // Safety check: remove empty weeks
//                   .map((week, index) => (
//                     <option key={`week-filter-${week}-${index}`} value={week}>
//                       Week {week}
//                     </option>
//                   ))}
//               </select>
//               <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
//             </div>
//           </div>
//         </div>

//         {/* Student List */}
//         {filteredStudentIds.length === 0 ? (
//           <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-gray-200">
//             <Search className="w-10 h-10 text-gray-400 mb-4" />
//             <h3 className="text-lg font-bold text-gray-700">
//               No students found
//             </h3>
//           </div>
//         ) : (
//           <div className="space-y-6">
//             {filteredStudentIds.map((studentId) => {
//               const studentData = groupedWorkloads[studentId];
//               const isExpanded = expandedStudents[studentId];

//               return (
//                 <div
//                   key={studentId}
//                   className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden"
//                 >
//                   <div
//                     onClick={() => toggleStudent(studentId)}
//                     className="bg-gradient-to-r from-slate-50 to-white px-6 py-5 border-b border-gray-100 flex justify-between items-center cursor-pointer group"
//                   >
//                     {/* <div className="flex items-center gap-4">
//                       <span className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-black">
//                         {studentData.name.substring(0, 2).toUpperCase()}
//                       </span>
//                       <div>
//                         <h2 className="text-xl font-bold text-slate-800">
//                           {studentData.name}
//                         </h2>
//                         <p className="text-sm text-gray-500">ID: {studentId}</p>
//                       </div>
//                     </div> */}

//                     <div className="flex items-center gap-4">
//                       <span className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-black">
//                         {/* Uses the first 2 letters of the ID for the avatar icon */}
//                         {studentId.substring(0, 2).toUpperCase()}
//                       </span>
//                       <div>
//                         {/* Only displays the ID in large bold text */}
//                         <h2 className="text-xl font-bold text-slate-800">
//                           ID: {studentId}
//                         </h2>
//                       </div>
//                     </div>
//                     <button className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500">
//                       {isExpanded ? (
//                         <ChevronUp className="w-5 h-5" />
//                       ) : (
//                         <ChevronDown className="w-5 h-5" />
//                       )}
//                     </button>
//                   </div>

//                   <div
//                     className={`transition-all duration-500 ease-in-out ${isExpanded ? "max-h-[5000px] opacity-100" : "max-h-0 opacity-0 overflow-hidden"}`}
//                   >
//                     <div className="p-6 space-y-6">
//                       {studentData.workloads
//                         .sort((a, b) => b.week - a.week)
//                         .map((workload) => {
//                           const btnConfig = getEmailButtonConfig(workload);
//                           const isProcessingThisEmail =
//                             processingId ===
//                             `email-${studentId}-${workload.week}`;
//                           const totalTasks = workload.breakdown?.length || 0;
//                           const completedTasks =
//                             workload.breakdown?.filter((t) => t.isCompleted)
//                               .length || 0;
//                           const progress =
//                             totalTasks === 0
//                               ? 0
//                               : Math.round((completedTasks / totalTasks) * 100);

//                           return (
//                             <div
//                               key={workload.id}
//                               className="border border-gray-100 rounded-xl overflow-hidden shadow-sm"
//                             >
//                               <div className="bg-white px-5 py-4 flex flex-col sm:flex-row justify-between items-center gap-4 border-b border-gray-100">
//                                 <div className="flex-1 w-full">
//                                   <div className="flex items-center gap-3 mb-2">
//                                     <Calendar className="w-5 h-5 text-indigo-600" />
//                                     <span className="text-lg font-bold">
//                                       Week {workload.week}
//                                     </span>
//                                     <span
//                                       className={`px-2.5 py-1 rounded-md text-xs font-bold uppercase ${workload.status === "NORMAL" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}
//                                     >
//                                       {workload.status}
//                                     </span>
//                                   </div>
//                                   <div className="flex items-center gap-3">
//                                     <div className="w-48 h-2 bg-gray-100 rounded-full">
//                                       <div
//                                         className="h-full bg-indigo-500"
//                                         style={{ width: `${progress}%` }}
//                                       />
//                                     </div>
//                                     <span className="text-xs font-semibold text-gray-500">
//                                       {completedTasks}/{totalTasks} Done
//                                     </span>
//                                   </div>
//                                 </div>
//                                 <button
//                                   onClick={() =>
//                                     handleSendEmail(studentId, workload.week)
//                                   }
//                                   disabled={
//                                     btnConfig.disabled || isProcessingThisEmail
//                                   }
//                                   className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold border ${btnConfig.disabled ? "cursor-not-allowed opacity-80" : "active:scale-95"} ${btnConfig.colorClass}`}
//                                 >
//                                   {isProcessingThisEmail ? (
//                                     <Loader className="w-4 h-4 animate-spin" />
//                                   ) : (
//                                     <btnConfig.Icon className="w-4 h-4" />
//                                   )}
//                                   {isProcessingThisEmail
//                                     ? "Processing..."
//                                     : btnConfig.text}
//                                 </button>
//                               </div>
//                               <div className="divide-y divide-gray-50 bg-slate-50/50">
//                                 {workload.breakdown?.map((task, index) => {
//                                   const isCompleted = task.isCompleted || false;
//                                   const isProcessingTask =
//                                     processingId ===
//                                     `task-${workload.id}-${index}`;
//                                   return (
//                                     <div
//                                       key={index}
//                                       className="flex items-center justify-between p-4"
//                                     >
//                                       <div className="flex items-center gap-4">
//                                         <button
//                                           onClick={() =>
//                                             handleToggleCompletion(
//                                               workload.id,
//                                               index,
//                                               isCompleted,
//                                             )
//                                           }
//                                           disabled={isProcessingTask}
//                                           className="active:scale-75 transition-transform"
//                                         >
//                                           {isProcessingTask ? (
//                                             <Loader className="w-6 h-6 animate-spin text-indigo-400" />
//                                           ) : isCompleted ? (
//                                             <CheckCircle className="w-6 h-6 text-emerald-500" />
//                                           ) : (
//                                             <Circle className="w-6 h-6 text-gray-300" />
//                                           )}
//                                         </button>
//                                         <div>
//                                           <p
//                                             className={`font-semibold ${isCompleted ? "text-gray-400 line-through" : "text-gray-800"}`}
//                                           >
//                                             {task.subjectName}
//                                           </p>
//                                           <p className="text-xs text-gray-500">
//                                             {task.type} • {task.hours} Hours
//                                           </p>
//                                         </div>
//                                       </div>
//                                       {!isCompleted && (
//                                         <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2 py-1 rounded-md border border-amber-200">
//                                           <AlertCircle className="w-3 h-3 inline mr-1" />{" "}
//                                           Pending
//                                         </span>
//                                       )}
//                                     </div>
//                                   );
//                                 })}
//                               </div>
//                             </div>
//                           );
//                         })}
//                     </div>
//                   </div>
//                 </div>
//               );
//             })}
//           </div>
//         )}
//       </div>
//     </div>
//   );
// };;

// export default AdminWorkloadTracker;
import React, { useState, useEffect } from "react";
import {
  Users,
  Calendar,
  CheckCircle,
  Circle,
  Mail,
  Loader,
  AlertCircle,
  Search,
  Clock,
  ChevronDown,
  ChevronUp,
  X,
  Filter,
  Send,
  BellRing,
  Lock,
  RefreshCw,
} from "lucide-react";
import {
  fetchAllStudentsWorkloads,
  updateTaskCompletion,
  triggerManualWarningEmail,
} from "../services/api/workloadAdminService";

const AdminWorkloadTracker = () => {
  const [workloads, setWorkloads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [weekFilter, setWeekFilter] = useState("All");
  const [processingId, setProcessingId] = useState(null);
  const [processingBulk, setProcessingBulk] = useState(false);
  const [expandedStudents, setExpandedStudents] = useState({});
  const [toast, setToast] = useState({
    show: false,
    message: "",
    type: "success",
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const data = await fetchAllStudentsWorkloads();
    setWorkloads(data || []);
    if (data) {
      const initialExpanded = {};
      data.forEach((w) => (initialExpanded[w.studentId] = true));
      setExpandedStudents(initialExpanded);
    }
    setLoading(false);
  };

  const showToast = (message, type = "success") => {
    setToast({ show: true, message, type });
    setTimeout(
      () => setToast({ show: false, message: "", type: "success" }),
      4000,
    );
  };

  const toggleStudent = (studentId) =>
    setExpandedStudents((prev) => ({ ...prev, [studentId]: !prev[studentId] }));

  const handleToggleCompletion = async (docId, taskIndex, currentStatus) => {
    const newStatus = !currentStatus;
    setProcessingId(`task-${docId}-${taskIndex}`);
    try {
      await updateTaskCompletion(docId, taskIndex, newStatus);
      setWorkloads((prev) =>
        prev.map((w) => {
          if (w.id === docId) {
            const newBreakdown = [...w.breakdown];
            newBreakdown[taskIndex] = {
              ...newBreakdown[taskIndex],
              isCompleted: newStatus,
            };
            return { ...w, breakdown: newBreakdown };
          }
          return w;
        }),
      );
    } catch (error) {
      showToast("Failed to update status.", "error");
    } finally {
      setProcessingId(null);
    }
  };

  const handleSendEmail = async (studentId, week) => {
    setProcessingId(`email-${studentId}-${week}`);
    try {
      const response = await triggerManualWarningEmail(studentId, week);
      showToast(response.message || `Email sent!`);
      loadData();
    } catch (error) {
      showToast(
        error.response?.data?.error || "Failed to send email.",
        "error",
      );
    } finally {
      setProcessingId(null);
    }
  };

  const handleBulkEmail = async () => {
    if (pendingActions.length === 0) return;
    setProcessingBulk(true);
    try {
      const promises = pendingActions.map((action) =>
        triggerManualWarningEmail(action.studentId, action.week),
      );
      await Promise.all(promises);
      showToast(`Successfully sent ${promises.length} emails!`);
      loadData();
    } catch (error) {
      showToast("Some emails failed. Check logs.", "error");
    } finally {
      setProcessingBulk(false);
    }
  };

  const parseFirestoreDate = (dateObj) => {
    if (!dateObj) return new Date();
    if (dateObj._seconds) return new Date(dateObj._seconds * 1000);
    return new Date(dateObj);
  };

  // 🌟 STRICT TIME WINDOW LOGIC
  const getEmailButtonConfig = (workload) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const weekStart = parseFirestoreDate(workload.weekStart);
    weekStart.setHours(0, 0, 0, 0);

    // Calculate days between today and the start of that workload's week
    const diffDays = Math.round(
      (weekStart.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
    );

    // STRICT TASK COUNTING (Fixes the bug where students with 1 submission were marked as fully complete)
    const totalTasks = workload.breakdown?.length || 0;
    const completedTasks =
      workload.breakdown?.filter((task) => task.isCompleted === true)?.length ||
      0;
    const isFullyCompleted = totalTasks > 0 && completedTasks === totalTasks;

    // 1. Way too far in the future (More than 14 days / 2 Weeks away) -> LOCK
    if (diffDays > 14) {
      return {
        text: "Too Early",
        disabled: true,
        colorClass: "bg-gray-100 text-gray-400 opacity-60",
        Icon: Lock,
      };
    }

    // 2. Early Warning / Study Plan Window (Between 2 and 14 days away) -> ACTION REQUIRED
    // This allows Week 8 to be active while you are in Week 6!
    else if (diffDays > 1 && diffDays <= 14) {
      if (workload.earlyWarningSent)
        return {
          text: "Timetable Sent",
          disabled: true,
          colorClass: "bg-gray-100 text-gray-400",
          Icon: CheckCircle,
        };
      return {
        text: "Send Timetable (Due)",
        disabled: false,
        colorClass:
          "bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border-indigo-200 shadow-sm",
        Icon: Mail,
      };
    }

    // 3. Tomorrow Reminder (Exactly 1 day away) -> ACTION REQUIRED
    else if (diffDays === 1) {
      if (workload.dayBeforeReminderSent)
        return {
          text: "Reminder Sent",
          disabled: true,
          colorClass: "bg-gray-100 text-gray-400",
          Icon: CheckCircle,
        };
      return {
        text: "Send Reminder (Due)",
        disabled: false,
        colorClass:
          "bg-amber-50 text-amber-700 hover:bg-amber-100 border-amber-200 shadow-sm",
        Icon: Clock,
      };
    }

    // 4. Current/Past Week (Missing Submissions) -> ACTION REQUIRED
    else {
      // If they did ALL tasks, lock it. Otherwise, they need a warning!
      if (isFullyCompleted)
        return {
          text: "All Completed",
          disabled: true,
          colorClass:
            "bg-emerald-50 text-emerald-700 border-emerald-200 opacity-60",
          Icon: CheckCircle,
        };

      if (workload.missingSubmissionWarningSent)
        return {
          text: "Warning Sent",
          disabled: true,
          colorClass: "bg-gray-100 text-gray-400",
          Icon: CheckCircle,
        };
      return {
        text: "Send Warning (Due)",
        disabled: false,
        colorClass:
          "bg-red-50 text-red-700 hover:bg-red-100 border-red-200 shadow-sm",
        Icon: AlertCircle,
      };
    }
  };

  // Calculate Action Center (Only active buttons that are strictly DUE right now)
  const pendingActions = workloads
    .map((w) => ({ ...w, btnConfig: getEmailButtonConfig(w) }))
    .filter((w) => !w.btnConfig.disabled);

  let filteredWorkloadsByWeek = workloads;
  if (weekFilter !== "All") {
    filteredWorkloadsByWeek = workloads.filter(
      (w) => w.week?.toString() === weekFilter,
    );
  }

  const groupedWorkloads = filteredWorkloadsByWeek.reduce((acc, curr) => {
    if (!acc[curr.studentId])
      acc[curr.studentId] = {
        name: curr.studentName || "Unknown",
        workloads: [],
      };
    acc[curr.studentId].workloads.push(curr);
    return acc;
  }, {});

  const filteredStudentIds = Object.keys(groupedWorkloads).filter((id) => {
    const matchId = id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchName = groupedWorkloads[id].name
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    return matchId || matchName;
  });

  const uniqueWeeks = [...new Set(workloads.map((w) => w.week))].sort(
    (a, b) => a - b,
  );

  if (loading && workloads.length === 0)
    return (
      <div className="flex justify-center items-center h-screen bg-slate-50">
        <Loader className="w-12 h-12 animate-spin text-indigo-600" />
      </div>
    );

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-10 font-sans text-gray-800 relative">
      <div
        className={`fixed bottom-6 right-6 z-[100] transition-all duration-500 transform ${toast.show ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0 pointer-events-none"}`}
      >
        <div
          className={`flex items-center gap-3 px-6 py-4 rounded-xl shadow-2xl border ${toast.type === "error" ? "bg-red-50 border-red-200 text-red-800" : "bg-emerald-50 border-emerald-200 text-emerald-800"}`}
        >
          {toast.type === "error" ? (
            <AlertCircle className="w-5 h-5" />
          ) : (
            <CheckCircle className="w-5 h-5" />
          )}
          <p className="font-medium text-sm">{toast.message}</p>
          <button
            onClick={() =>
              setToast({ show: false, message: "", type: "success" })
            }
            className="ml-4 opacity-60 hover:opacity-100"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto space-y-6">
        {/* 🌟 ACTION CENTER */}
        {pendingActions.length > 0 ? (
          <div className="bg-gradient-to-r from-indigo-900 to-purple-900 rounded-2xl p-6 shadow-lg text-white flex flex-col sm:flex-row justify-between items-center gap-6 animate-in slide-in-from-top-4">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white/20 rounded-full animate-pulse">
                <BellRing className="w-8 h-8 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold">Emails Due Today</h2>
                <p className="text-indigo-200 text-sm mt-1">
                  You have{" "}
                  <strong className="text-white">
                    {pendingActions.length} strictly scheduled emails
                  </strong>{" "}
                  that need to be sent today.
                </p>
              </div>
            </div>
            <button
              onClick={handleBulkEmail}
              disabled={processingBulk}
              className="px-6 py-3 bg-white text-indigo-900 rounded-xl font-bold shadow-md hover:bg-indigo-50 hover:scale-105 transition-all w-full sm:w-auto flex items-center justify-center gap-2"
            >
              {processingBulk ? (
                <Loader className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
              Send All {pendingActions.length} Due Emails
            </button>
          </div>
        ) : (
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 flex items-center gap-4 text-emerald-800">
            <div className="p-3 bg-emerald-100 rounded-full">
              <CheckCircle className="w-6 h-6 text-emerald-600" />
            </div>
            <div>
              <h2 className="text-lg font-bold">You are all caught up!</h2>
              <p className="text-sm">
                There are no emails scheduled to be sent today. Check back
                tomorrow.
              </p>
            </div>
          </div>
        )}

        {/* Header Controls */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          <div className="flex-1">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600 flex items-center gap-3">
              <Users className="text-indigo-600 w-8 h-8" /> Submission Tracker
            </h1>
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto">
            {/* 👇 Refresh Button */}
            <button
              onClick={loadData}
              disabled={loading}
              title="Refresh Data"
              className="flex items-center justify-center p-2.5 bg-indigo-50 text-indigo-600 rounded-xl hover:bg-indigo-100 border border-indigo-200 transition-colors active:scale-95 disabled:opacity-50"
            >
              <RefreshCw
                className={`w-5 h-5 ${loading ? "animate-spin" : ""}`}
              />
            </button>

            <div className="relative w-full sm:w-64 group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search Name or ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div className="relative w-full sm:w-40">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <select
                value={weekFilter}
                onChange={(e) => setWeekFilter(e.target.value)}
                className="w-full pl-9 pr-8 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm appearance-none font-medium"
              >
                <option value="All">All Weeks</option>
                {uniqueWeeks
                  .filter((week) => week !== undefined && week !== null)
                  .map((week, index) => (
                    <option key={`week-filter-${week}-${index}`} value={week}>
                      Week {week}
                    </option>
                  ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Student List */}
        {filteredStudentIds.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-gray-200">
            <Search className="w-10 h-10 text-gray-400 mb-4" />
            <h3 className="text-lg font-bold text-gray-700">
              No students found
            </h3>
          </div>
        ) : (
          <div className="space-y-6">
            {filteredStudentIds.map((studentId) => {
              const studentData = groupedWorkloads[studentId];
              const isExpanded = expandedStudents[studentId];

              return (
                <div
                  key={studentId}
                  className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden"
                >
                  <div
                    onClick={() => toggleStudent(studentId)}
                    className="bg-gradient-to-r from-slate-50 to-white px-6 py-5 border-b border-gray-100 flex justify-between items-center cursor-pointer group"
                  >
                    <div className="flex items-center gap-4">
                      <span className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-black">
                        {studentId.substring(0, 2).toUpperCase()}
                      </span>
                      <div>
                        <h2 className="text-xl font-bold text-slate-800">
                          ID: {studentId}
                        </h2>
                      </div>
                    </div>
                    <button className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500">
                      {isExpanded ? (
                        <ChevronUp className="w-5 h-5" />
                      ) : (
                        <ChevronDown className="w-5 h-5" />
                      )}
                    </button>
                  </div>

                  <div
                    className={`transition-all duration-500 ease-in-out ${isExpanded ? "max-h-[5000px] opacity-100" : "max-h-0 opacity-0 overflow-hidden"}`}
                  >
                    <div className="p-6 space-y-6">
                      {studentData.workloads
                        .sort((a, b) => b.week - a.week)
                        .map((workload) => {
                          const btnConfig = getEmailButtonConfig(workload);
                          const isProcessingThisEmail =
                            processingId ===
                            `email-${studentId}-${workload.week}`;
                          const totalTasks = workload.breakdown?.length || 0;
                          const completedTasks =
                            workload.breakdown?.filter((t) => t.isCompleted)
                              .length || 0;
                          const progress =
                            totalTasks === 0
                              ? 0
                              : Math.round((completedTasks / totalTasks) * 100);

                          return (
                            <div
                              key={workload.id}
                              className="border border-gray-100 rounded-xl overflow-hidden shadow-sm"
                            >
                              <div className="bg-white px-5 py-4 flex flex-col sm:flex-row justify-between items-center gap-4 border-b border-gray-100">
                                <div className="flex-1 w-full">
                                  <div className="flex items-center gap-3 mb-2">
                                    <Calendar className="w-5 h-5 text-indigo-600" />
                                    <span className="text-lg font-bold">
                                      Week {workload.week}
                                    </span>
                                    <span
                                      className={`px-2.5 py-1 rounded-md text-xs font-bold uppercase ${workload.status === "NORMAL" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}
                                    >
                                      {workload.status}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-3">
                                    <div className="w-48 h-2 bg-gray-100 rounded-full">
                                      <div
                                        className="h-full bg-indigo-500"
                                        style={{ width: `${progress}%` }}
                                      />
                                    </div>
                                    <span className="text-xs font-semibold text-gray-500">
                                      {completedTasks}/{totalTasks} Done
                                    </span>
                                  </div>
                                </div>
                                <button
                                  onClick={() =>
                                    handleSendEmail(studentId, workload.week)
                                  }
                                  disabled={
                                    btnConfig.disabled || isProcessingThisEmail
                                  }
                                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold border ${btnConfig.disabled ? "cursor-not-allowed opacity-80" : "active:scale-95"} ${btnConfig.colorClass}`}
                                >
                                  {isProcessingThisEmail ? (
                                    <Loader className="w-4 h-4 animate-spin" />
                                  ) : (
                                    <btnConfig.Icon className="w-4 h-4" />
                                  )}
                                  {isProcessingThisEmail
                                    ? "Processing..."
                                    : btnConfig.text}
                                </button>
                              </div>
                              <div className="divide-y divide-gray-50 bg-slate-50/50">
                                {workload.breakdown?.map((task, index) => {
                                  const isCompleted = task.isCompleted || false;
                                  const isProcessingTask =
                                    processingId ===
                                    `task-${workload.id}-${index}`;
                                  return (
                                    <div
                                      key={index}
                                      className="flex items-center justify-between p-4"
                                    >
                                      <div className="flex items-center gap-4">
                                        <button
                                          onClick={() =>
                                            handleToggleCompletion(
                                              workload.id,
                                              index,
                                              isCompleted,
                                            )
                                          }
                                          disabled={isProcessingTask}
                                          className="active:scale-75 transition-transform"
                                        >
                                          {isProcessingTask ? (
                                            <Loader className="w-6 h-6 animate-spin text-indigo-400" />
                                          ) : isCompleted ? (
                                            <CheckCircle className="w-6 h-6 text-emerald-500" />
                                          ) : (
                                            <Circle className="w-6 h-6 text-gray-300" />
                                          )}
                                        </button>
                                        <div>
                                          <p
                                            className={`font-semibold ${isCompleted ? "text-gray-400 line-through" : "text-gray-800"}`}
                                          >
                                            {task.subjectName}
                                          </p>
                                          <p className="text-xs text-gray-500">
                                            {task.type} • {task.hours} Hours
                                          </p>
                                        </div>
                                      </div>
                                      {!isCompleted && (
                                        <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2 py-1 rounded-md border border-amber-200">
                                          <AlertCircle className="w-3 h-3 inline mr-1" />{" "}
                                          Pending
                                        </span>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminWorkloadTracker;
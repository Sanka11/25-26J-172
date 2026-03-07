// const functions = require("firebase-functions");
// const admin = require("../firebase");
// require("dotenv").config();
// const db = admin.firestore();
// const Groq = require("groq-sdk");

// // Initialize Firebase Admin if not already initialized
// if (!admin.apps.length) {
//   admin.initializeApp();
// }

// // Initialize Groq as a constant
// const groq = new Groq({
//   apiKey: process.env.GROQ_API_KEY,
// });

// /**
//  * Generate Weekly Workload purely from SUBJECT data
//  * Method: POST
//  * Body: { studentId, semesterStartDate }
//  */
// const generateWorkload = functions.https.onRequest(async (req, res) => {
//   try {
//     if (req.method !== "POST") {
//       return res.status(405).send("Method Not Allowed");
//     }

//     const { studentId, semesterStartDate } = req.body;

//     if (!studentId || !semesterStartDate) {
//       return res.status(400).json({ error: "Missing fields" });
//     }

//     const semesterStart = new Date(semesterStartDate);

//     /* 1️⃣ Get enrolled subjects */
//     const enrollSnap = await db
//       .collection("student_enrollments")
//       .doc(studentId)
//       .get();

//     if (!enrollSnap.exists) {
//       return res.status(404).json({ error: "Student not enrolled" });
//     }

//     const subjectIds = enrollSnap.data().subjects || [];

//     /* 2️⃣ Load subject details */
//     const subjects = await Promise.all(
//       subjectIds.map(async (id) => {
//         const snap = await db.collection("subjects").doc(id).get();
//         return snap.exists ? snap.data() : null;
//       }),
//     );

//     /* 3️⃣ Weekly workload map (EXPLAINABLE) */
//     const weeklyLoad = {};
//     // week -> { totalHours, breakdown[] }

//     const addLoad = (week, entry) => {
//       if (!weeklyLoad[week]) {
//         weeklyLoad[week] = {
//           totalHours: 0,
//           breakdown: [],
//         };
//       }

//       weeklyLoad[week].totalHours += entry.hours;
//       weeklyLoad[week].breakdown.push(entry);
//     };

//     /* 4️⃣ Process subjects */
//     subjects.forEach((sub) => {
//       if (!sub) return;

//       // 🎓 Academic subjects
//       if (sub.type === "ACADEMIC") {
//         const t = sub.assessmentTimeline || {};
//         const h = sub.estimatedHours || {};

//         // Assignments
//         t.assignments?.forEach((week) =>
//           addLoad(week, {
//             subjectId: sub.subjectId,
//             subjectName: sub.subjectName,
//             type: "ASSIGNMENT",
//             hours: h.assignment || 6,
//           }),
//         );

//         // Mid exam
//         if (t.midExamWeek) {
//           addLoad(t.midExamWeek, {
//             subjectId: sub.subjectId,
//             subjectName: sub.subjectName,
//             type: "MID_EXAM",
//             hours: h.midExam || 10,
//           });
//         }

//         // Final exam
//         if (t.finalExamWeek) {
//           addLoad(t.finalExamWeek, {
//             subjectId: sub.subjectId,
//             subjectName: sub.subjectName,
//             type: "FINAL_EXAM",
//             hours: h.finalExam || 15,
//           });
//         }
//       }

//       // 🏭 Internship subject
//       if (sub.type === "INTERNSHIP") {
//         sub.submissionWeeks?.forEach((week) =>
//           addLoad(week, {
//             subjectId: sub.subjectId,
//             subjectName: sub.subjectName,
//             type: "INTERNSHIP_SUBMISSION",
//             hours: sub.estimatedHoursPerSubmission || 8,
//           }),
//         );
//       }
//     });

//     /* 5️⃣ Save weekly workload with explanation */
//     const batch = db.batch();

//     Object.entries(weeklyLoad).forEach(([week, data]) => {
//       let status = "NORMAL";

//       if (data.totalHours >= 20) status = "OVERLOADED";
//       else if (data.totalHours >= 12) status = "BUSY";

//       const weekStart = new Date(
//         semesterStart.getTime() + (Number(week) - 1) * 7 * 86400000,
//       );

//       const ref = db.collection("weekly_workload").doc(`${studentId}_W${week}`);

//       batch.set(ref, {
//         studentId,
//         week: Number(week),
//         weekStart,
//         totalHours: data.totalHours,
//         status,
//         breakdown: data.breakdown, // ⭐ EXPLAINABLE PART
//         createdAt: new Date(),
//       });
//     });

//     await batch.commit();

//     return res.json({
//       message: "Weekly workload generated (with explanations)",
//       weeksAnalyzed: Object.keys(weeklyLoad).length,
//     });
//   } catch (err) {
//     console.error("generateWorkload error:", err);
//     res.status(500).json({ error: "Workload generation failed" });
//   }
// });

// /**
//  * Generate lecture alerts (manual trigger)
//  */
// const generateLectureAlerts = functions.https.onRequest(async (req, res) => {
//   try {
//     const now = new Date(
//       new Date().toLocaleString("en-US", { timeZone: "Asia/Colombo" }),
//     );
//     const todayName = now.toLocaleDateString("en-US", {
//       weekday: "long",
//     });

//     const subjectsSnap = await db.collection("subjects").get();
//     const alerts = [];

//     subjectsSnap.forEach((doc) => {
//       const sub = doc.data();

//       if (!sub.lectureDays?.includes(todayName)) return;

//       const lectureStart = new Date(
//         `${now.toDateString()} ${sub.lectureStartTime}`,
//       );

//       const diffMinutes = (lectureStart - now) / 60000;

//       // 🔔 Lecture starting soon
//       if (diffMinutes > 0 && diffMinutes <= 15) {
//         alerts.push({
//           type: "LECTURE_STARTING_SOON",
//           subjectId: sub.subjectId,
//           subjectName: sub.subjectName,
//           message: `Lecture starts in ${Math.round(diffMinutes)} minutes`,
//           deliveryMode: sub.deliveryMode,
//           joinLink: sub.deliveryMode === "ONLINE" ? sub.onlinePlatform : null,
//         });
//       }

//       // 🔔 Lecture live
//       if (diffMinutes <= 0 && diffMinutes >= -5) {
//         alerts.push({
//           type: "LECTURE_NOW",
//           subjectId: sub.subjectId,
//           subjectName: sub.subjectName,
//           message:
//             sub.deliveryMode === "ONLINE"
//               ? "Lecture is live now. Join using the link."
//               : "Lecture is happening now.",
//           deliveryMode: sub.deliveryMode,
//           joinLink: sub.deliveryMode === "ONLINE" ? sub.onlinePlatform : null,
//         });
//       }
//     });

//     return res.json({
//       timestamp: now,
//       alerts,
//     });
//   } catch (err) {
//     console.error("generateLectureAlerts error:", err);
//     res.status(500).json({ error: "Failed to generate lecture alerts" });
//   }
// });
// const getWeeklyWorkload = functions.https.onRequest(async (req, res) => {
//   try {
//     if (req.method !== "GET") {
//       return res.status(405).send("Method Not Allowed");
//     }

//     const { studentId } = req.query;
//     if (!studentId) {
//       return res.status(400).json({ error: "Missing studentId" });
//     }

//     const snap = await db
//       .collection("weekly_workload")
//       .where("studentId", "==", studentId)
//       .get();

//     // 🔴 FILTER ONLY BUSY / OVERLOADED
//     const weeks = snap.docs
//       .map((doc) => ({ id: doc.id, ...doc.data() }))
//       .filter((w) => w.status == "NORMAL" || w.status == "BUSY");

//     return res.json({
//       studentId,
//       totalFlaggedWeeks: weeks.length,
//       weeks,
//     });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ error: "Failed to fetch weekly workload" });
//   }
// });
// const generateOverloadReminders = functions.https.onRequest(
//   async (req, res) => {
//     try {
//       const { studentId } = req.body;

//       if (!studentId) {
//         return res.status(400).json({ error: "Missing studentId" });
//       }

//       // 1️⃣ Fetch overloaded weeks
//       const snap = await db
//         .collection("weekly_workload")
//         .where("studentId", "==", studentId)
//         .where("status", "==", "OVERLOADED")
//         .get();

//       if (snap.empty) {
//         return res.json({
//           message: "No overloaded weeks detected",
//           remindersCreated: 0,
//         });
//       }

//       const batch = db.batch();
//       let reminderCount = 0;

//       snap.docs.forEach((doc) => {
//         const data = doc.data();
//         const overloadedWeek = Number(data.week);

//         // 2️⃣ Weeks BEFORE overload
//         const reminderWeeks = [overloadedWeek - 2, overloadedWeek - 1];

//         reminderWeeks.forEach((week) => {
//           if (week <= 0) return;

//           const ref = db
//             .collection("reminders")
//             .doc(`${studentId}_OVERLOAD_W${overloadedWeek}_REM_W${week}`);

//           batch.set(ref, {
//             studentId,
//             reminderWeek: week,
//             targetOverloadedWeek: overloadedWeek,
//             type: "OVERLOAD_EARLY_WARNING",
//             message: `Week ${overloadedWeek} will be overloaded. Start preparation early.`,
//             createdAt: new Date(),
//           });

//           reminderCount++;
//         });
//       });

//       await batch.commit();

//       return res.json({
//         message: "Overload reminders generated",
//         remindersCreated: reminderCount,
//       });
//     } catch (err) {
//       console.error(err);
//       res.status(500).json({ error: "Failed to generate overload reminders" });
//     }
//   },
// );
// /**
//  * Cloud Function to generate AI-powered study reminders for busy weeks.
//  * Uses Groq (Llama 3.3 70B) for high-speed, structured JSON output.
//  */

// const generateBusyWeekReminders = functions.https.onRequest(
//   async (req, res) => {
//     try {
//       const { studentId } = req.body;

//       if (!studentId) {
//         return res.status(400).json({ error: "Missing studentId" });
//       }

//       // Fetch upcoming workload that is flagged as high-intensity
//       const snap = await db
//         .collection("weekly_workload")
//         .where("studentId", "==", studentId)
//         .where("status", "in", ["BUSY", "HEAVY", "OVERLOADED"])
//         .get();

//       if (snap.empty) {
//         return res.json({
//           message: "No busy weeks detected",
//           remindersCreated: 0,
//         });
//       }

//       const batch = db.batch();
//       let reminderCount = 0;
//       const today = new Date();

//       for (const doc of snap.docs) {
//         const data = doc.data();
//         const busyWeek = Number(data.week);
//         const weekStart = data.weekStart.toDate();

//         // Only create reminders for future weeks
//         if (weekStart <= today) continue;

//         // Create warnings for 2 weeks and 1 week before the busy period
//         const reminderWeeks = [busyWeek - 2, busyWeek - 1];

//         for (const week of reminderWeeks) {
//           if (week <= 0) continue;

//           // Extract subject details for AI context
//           const subjectDetails = data.breakdown
//             .map((b) => `${b.hours} hours of ${b.subjectName} (${b.type})`)
//             .join(", ");

//           // Enhanced Prompt for specific, unique distribution
//           const prompt = `
//             You are an expert academic advisor.
//             A student has an upcoming week labeled as "${data.status}" with ${data.totalHours} total hours.
//             Workload breakdown: ${subjectDetails}

//             TASK: Create a realistic 5-day study timetable (Day 1 to Day 5).

//             RULES:
//             1. Distribute the ${data.totalHours} hours logically across 5 days.
//             2. Be highly specific: Use tasks like "Draft intro for ${data.breakdown[0]?.subjectName || "Subject"}" instead of just "Study".
//             3. Ensure no single day is excessively overloaded.
//             4. You MUST return ONLY a valid JSON array of objects.

//             JSON format:
//             [
//               { "day": 1, "subject": "Name", "hours": 2, "task": "Specific actionable task" },
//               { "day": 2, "subject": "Name", "hours": 3, "task": "Another task" }
//             ]
//           `;

//           let aiTimetable = [];

//           try {
//             // Call Groq with Llama 3.3 and force JSON output
//             const chatCompletion = await groq.chat.completions.create({
//               messages: [
//                 {
//                   role: "system",
//                   content:
//                     "You are a helpful academic assistant that outputs strictly JSON arrays.",
//                 },
//                 { role: "user", content: prompt },
//               ],
//               model: "llama-3.3-70b-versatile",
//               response_format: { type: "json_object" },
//               temperature: 0.7, // Adds uniqueness to tasks
//             });

//             const content = chatCompletion.choices[0].message.content;
//             const parsedData = JSON.parse(content);

//             // Handle cases where AI might wrap array in an object (e.g., { "timetable": [] })
//             aiTimetable = Array.isArray(parsedData)
//               ? parsedData
//               : parsedData.timetable || parsedData.schedule || [];
//           } catch (aiError) {
//             console.error("Groq AI failed:", aiError);
//             // Fallback content if AI fails
//             aiTimetable = [
//               {
//                 day: 1,
//                 subject: "Preparation",
//                 hours: 2,
//                 task: `Begin early prep for your upcoming ${data.status} week.`,
//               },
//             ];
//           }

//           const reminderId = `${studentId}_W${busyWeek}_REM_W${week}`;
//           const ref = db.collection("busy_week_reminders").doc(reminderId);

//           batch.set(ref, {
//             studentId,
//             reminderWeek: week,
//             targetBusyWeek: busyWeek,
//             targetWeekStart: weekStart,
//             targetStatus: data.status,
//             targetTotalHours: data.totalHours,
//             type: "BUSY_WEEK_WARNING",
//             timetable: aiTimetable,
//             createdAt: new Date(),
//             isActive: true,
//             isDismissed: false,
//           });

//           reminderCount++;
//         }
//       }

//       await batch.commit();

//       return res.json({
//         message: "Dynamic Groq-powered timetables generated",
//         remindersCreated: reminderCount,
//       });
//     } catch (err) {
//       console.error("Main Function Error:", err);
//       res.status(500).json({ error: "Failed to generate reminders" });
//     }
//   },
// );

// const getActiveReminders = functions.https.onRequest(async (req, res) => {
//   try {
//     if (req.method !== "GET") {
//       return res.status(405).send("Method Not Allowed");
//     }

//     const { studentId } = req.query;
//     if (!studentId) {
//       return res.status(400).json({ error: "Missing studentId" });
//     }

//     const today = new Date();
//     // Look ahead 14 days so we can catch upcoming weeks properly
//     const twoWeeksFromNow = new Date(
//       today.getTime() + 14 * 24 * 60 * 60 * 1000,
//     );

//     const snap = await db
//       .collection("busy_week_reminders")
//       .where("studentId", "==", studentId)
//       .get();

//     // 1️⃣ Filter the active reminders
//     const allActiveReminders = snap.docs
//       .map((doc) => ({
//         id: doc.id,
//         ...doc.data(),
//         targetWeekStart: doc.data().targetWeekStart.toDate(),
//         createdAt: doc.data().createdAt.toDate(),
//       }))
//       .filter(
//         (reminder) =>
//           reminder.isActive === true &&
//           reminder.isDismissed === false &&
//           reminder.targetWeekStart > today &&
//           reminder.targetWeekStart <= twoWeeksFromNow,
//       );

//     // 2️⃣ DEDUPLICATE: Only keep ONE reminder per target busy week
//     const uniqueRemindersMap = new Map();

//     allActiveReminders.forEach((reminder) => {
//       const targetWeek = reminder.targetBusyWeek;

//       if (!uniqueRemindersMap.has(targetWeek)) {
//         uniqueRemindersMap.set(targetWeek, reminder);
//       } else {
//         // If we already have a reminder for this week, keep the latest one
//         // (e.g., keep the W3 reminder instead of the W2 reminder for a Week 4 target)
//         const existingReminder = uniqueRemindersMap.get(targetWeek);
//         if (reminder.reminderWeek > existingReminder.reminderWeek) {
//           uniqueRemindersMap.set(targetWeek, reminder);
//         }
//       }
//     });

//     // Convert the Map back into an array
//     const finalReminders = Array.from(uniqueRemindersMap.values());

//     return res.json({
//       studentId,
//       count: finalReminders.length,
//       reminders: finalReminders, // 🌟 Now it only returns 1 alert per busy week!
//     });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ error: "Failed to fetch reminders" });
//   }
// });

// /**
//  * Get Enrolled Subjects for a student
//  * Method: GET
//  * Query: ?studentId=UID
//  */
// const getEnrolledSubjects = functions.https.onRequest(async (req, res) => {
//   try {
//     if (req.method !== "GET") {
//       return res.status(405).send("Method Not Allowed");
//     }

//     const { studentId } = req.query;

//     if (!studentId) {
//       return res.status(400).json({ error: "Missing studentId" });
//     }

//     // 1️⃣ Get enrollment document
//     const enrollSnap = await db
//       .collection("student_enrollments")
//       .doc(studentId)
//       .get();

//     if (!enrollSnap.exists) {
//       return res.status(404).json({ error: "Student not enrolled" });
//     }

//     const subjectIds = enrollSnap.data().subjects || [];

//     // 2️⃣ Load subject details
//     const subjects = await Promise.all(
//       subjectIds.map(async (id) => {
//         const snap = await db.collection("subjects").doc(id).get();
//         if (!snap.exists) return null;

//         const data = snap.data();

//         return {
//           subjectId: data.subjectId,
//           subjectName: data.subjectName, // ✅ display name
//           type: data.type,
//           deliveryMode: data.deliveryMode || "PHYSICAL",
//           lectureDays: data.lectureDays || [],
//           lectureStartTime: data.lectureStartTime || null,
//           lectureEndTime: data.lectureEndTime || null,

//           // ✅ ADD THIS
//           onlinePlatform: data.onlinePlatform || null,
//         };
//       }),
//     );

//     return res.json({
//       studentId,
//       subjects: subjects.filter(Boolean),
//     });
//   } catch (err) {
//     console.error("getEnrolledSubjects error:", err);
//     res.status(500).json({ error: "Failed to fetch enrolled subjects" });
//   }
// });
// // Add this function to dismiss a reminder
// const dismissReminder = functions.https.onRequest(async (req, res) => {
//   try {
//     if (req.method !== "POST") {
//       return res.status(405).send("Method Not Allowed");
//     }

//     const { reminderId, studentId } = req.body;
//     if (!reminderId || !studentId) {
//       return res.status(400).json({ error: "Missing fields" });
//     }

//     const ref = db.collection("busy_week_reminders").doc(reminderId);
//     const doc = await ref.get();

//     if (!doc.exists) {
//       return res.status(404).json({ error: "Reminder not found" });
//     }

//     if (doc.data().studentId !== studentId) {
//       return res.status(403).json({ error: "Unauthorized" });
//     }

//     await ref.update({
//       isDismissed: true,
//       dismissedAt: new Date(),
//     });

//     return res.json({
//       message: "Reminder dismissed successfully",
//       reminderId,
//     });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ error: "Failed to dismiss reminder" });
//   }
// });
// module.exports = {
//   generateWorkload,
//   generateLectureAlerts,
//   generateOverloadReminders,
//   getWeeklyWorkload,
//   dismissReminder,
//   getActiveReminders,
//   generateBusyWeekReminders,
//   getEnrolledSubjects,
// };

const functions = require("firebase-functions");
const admin = require("../firebase");
require("dotenv").config();
const db = admin.firestore();
const Groq = require("groq-sdk");
const cors = require("cors")({ origin: true }); // 🌟 ADDED CORS FOR REACT

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
  admin.initializeApp();
}

// Initialize Groq as a constant (with fallback if API key not set)
const groq = process.env.GROQ_API_KEY
  ? new Groq({
      apiKey: process.env.GROQ_API_KEY,
    })
  : null;

/**
 * Generate Weekly Workload purely from SUBJECT data
 * Method: POST
 * Body: { studentId, semesterStartDate }
 */
// const generateWorkload = functions.https.onRequest((req, res) => {
//   cors(req, res, async () => {
//     try {
//       if (req.method !== "POST" && req.method !== "OPTIONS") {
//         return res.status(405).send("Method Not Allowed");
//       }

//       const { studentId, semesterStartDate } = req.body;

//       if (!studentId || !semesterStartDate) {
//         return res.status(400).json({ error: "Missing fields" });
//       }

//       const semesterStart = new Date(semesterStartDate);

//       /* 1️⃣ Get enrolled subjects */
//       const enrollSnap = await db
//         .collection("student_enrollments")
//         .doc(studentId)
//         .get();

//       if (!enrollSnap.exists) {
//         return res.status(404).json({ error: "Student not enrolled" });
//       }

//       const subjectIds = enrollSnap.data().subjects || [];

//       /* 2️⃣ Load subject details */
//       const subjects = await Promise.all(
//         subjectIds.map(async (id) => {
//           const snap = await db.collection("subjects").doc(id).get();
//           return snap.exists ? snap.data() : null;
//         }),
//       );

//       /* 3️⃣ Weekly workload map (EXPLAINABLE) */
//       const weeklyLoad = {};

//       const addLoad = (week, entry) => {
//         if (!weeklyLoad[week]) {
//           weeklyLoad[week] = {
//             totalHours: 0,
//             breakdown: [],
//           };
//         }

//         weeklyLoad[week].totalHours += entry.hours;
//         weeklyLoad[week].breakdown.push(entry);
//       };

//       /* 4️⃣ Process subjects */
//       subjects.forEach((sub) => {
//         if (!sub) return;

//         // 🎓 Academic subjects
//         if (sub.type === "ACADEMIC") {
//           const t = sub.assessmentTimeline || {};
//           const h = sub.estimatedHours || {};

//           // Assignments
//           t.assignments?.forEach((week) =>
//             addLoad(week, {
//               subjectId: sub.subjectId,
//               subjectName: sub.subjectName,
//               type: "ASSIGNMENT",
//               hours: h.assignment || 6,
//               isCompleted: false, // 🌟 ADDED DEFAULT PENDING STATUS
//             }),
//           );

//           // Mid exam
//           if (t.midExamWeek) {
//             addLoad(t.midExamWeek, {
//               subjectId: sub.subjectId,
//               subjectName: sub.subjectName,
//               type: "MID_EXAM",
//               hours: h.midExam || 10,
//               isCompleted: false, // 🌟 ADDED DEFAULT PENDING STATUS
//             });
//           }

//           // Final exam
//           if (t.finalExamWeek) {
//             addLoad(t.finalExamWeek, {
//               subjectId: sub.subjectId,
//               subjectName: sub.subjectName,
//               type: "FINAL_EXAM",
//               hours: h.finalExam || 15,
//               isCompleted: false, // 🌟 ADDED DEFAULT PENDING STATUS
//             });
//           }
//         }

//         // 🏭 Internship subject
//         if (sub.type === "INTERNSHIP") {
//           sub.submissionWeeks?.forEach((week) =>
//             addLoad(week, {
//               subjectId: sub.subjectId,
//               subjectName: sub.subjectName,
//               type: "INTERNSHIP_SUBMISSION",
//               hours: sub.estimatedHoursPerSubmission || 8,
//               isCompleted: false, // 🌟 ADDED DEFAULT PENDING STATUS
//             }),
//           );
//         }
//       });

//       /* 5️⃣ Save weekly workload with explanation */
//       const batch = db.batch();

//       Object.entries(weeklyLoad).forEach(([week, data]) => {
//         let status = "NORMAL";

//         if (data.totalHours >= 20) status = "OVERLOADED";
//         else if (data.totalHours >= 12) status = "BUSY";

//         const weekStart = new Date(
//           semesterStart.getTime() + (Number(week) - 1) * 7 * 86400000,
//         );

//         const ref = db
//           .collection("weekly_workload")
//           .doc(`${studentId}_W${week}`);

//         batch.set(ref, {
//           studentId,
//           week: Number(week),
//           weekStart,
//           totalHours: data.totalHours,
//           status,
//           breakdown: data.breakdown,
//           createdAt: new Date(),
//         });
//       });

//       await batch.commit();

//       return res.json({
//         message: "Weekly workload generated (with explanations)",
//         weeksAnalyzed: Object.keys(weeklyLoad).length,
//       });
//     } catch (err) {
//       console.error("generateWorkload error:", err);
//       res.status(500).json({ error: "Workload generation failed" });
//     }
//   });
// });
/**
 * Generate Weekly Workload purely from SUBJECT data
 * Method: POST
 * Body: { studentId, semesterStartDate }
 */
const generateWorkload = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    try {
      if (req.method !== "POST" && req.method !== "OPTIONS") {
        return res.status(405).send("Method Not Allowed");
      }

      const { studentId, semesterStartDate } = req.body;

      if (!studentId || !semesterStartDate) {
        return res.status(400).json({ error: "Missing fields" });
      }

      const semesterStart = new Date(semesterStartDate);

      /* 1️⃣ Get enrolled subjects */
      const enrollSnap = await db
        .collection("student_enrollments")
        .doc(studentId)
        .get();

      if (!enrollSnap.exists) {
        return res.status(404).json({ error: "Student not enrolled" });
      }

      const subjectIds = enrollSnap.data().subjects || [];

      /* 2️⃣ Load subject details */
      const subjects = await Promise.all(
        subjectIds.map(async (id) => {
          const snap = await db.collection("subjects").doc(id).get();
          return snap.exists ? snap.data() : null;
        }),
      );

      /* 3️⃣ Weekly workload map */
      const weeklyLoad = {};

      const addLoad = (week, entry) => {
        if (!weeklyLoad[week]) {
          weeklyLoad[week] = {
            totalHours: 0,
            breakdown: [],
          };
        }

        weeklyLoad[week].totalHours += entry.hours;
        weeklyLoad[week].breakdown.push(entry);
      };

      /* 4️⃣ Process subjects */
      subjects.forEach((sub) => {
        if (!sub) return;

        if (sub.type === "ACADEMIC") {
          const t = sub.assessmentTimeline || {};
          const h = sub.estimatedHours || {};

          t.assignments?.forEach((week) =>
            addLoad(week, {
              subjectId: sub.subjectId,
              subjectName: sub.subjectName,
              type: "ASSIGNMENT",
              hours: h.assignment || 6,
              isCompleted: false, 
            }),
          );

          if (t.midExamWeek) {
            addLoad(t.midExamWeek, {
              subjectId: sub.subjectId,
              subjectName: sub.subjectName,
              type: "MID_EXAM",
              hours: h.midExam || 10,
              isCompleted: false, 
            });
          }

          if (t.finalExamWeek) {
            addLoad(t.finalExamWeek, {
              subjectId: sub.subjectId,
              subjectName: sub.subjectName,
              type: "FINAL_EXAM",
              hours: h.finalExam || 15,
              isCompleted: false, 
            });
          }
        }

        if (sub.type === "INTERNSHIP") {
          sub.submissionWeeks?.forEach((week) =>
            addLoad(week, {
              subjectId: sub.subjectId,
              subjectName: sub.subjectName,
              type: "INTERNSHIP_SUBMISSION",
              hours: sub.estimatedHoursPerSubmission || 8,
              isCompleted: false, 
            }),
          );
        }
      });

      /* 🌟 NEW: Check existing workloads to prevent overwriting checkmarks! */
      const existingSnap = await db
        .collection("weekly_workload")
        .where("studentId", "==", studentId)
        .get();
        
      const existingWeeks = new Set();
      existingSnap.forEach((doc) => existingWeeks.add(doc.data().week));

      /* 5️⃣ Save weekly workload (Only if it doesn't already exist) */
      const batch = db.batch();
      let weeksAdded = 0;

      Object.entries(weeklyLoad).forEach(([week, data]) => {
        const weekNum = Number(week);

        // 🚨 THE FIX: If this week is already in the database, skip it!
        if (existingWeeks.has(weekNum)) return;

        let status = "NORMAL";

        if (data.totalHours >= 20) status = "OVERLOADED";
        else if (data.totalHours >= 12) status = "BUSY";

        const weekStart = new Date(
          semesterStart.getTime() + (weekNum - 1) * 7 * 86400000,
        );

        const ref = db.collection("weekly_workload").doc(`${studentId}_W${week}`);

        batch.set(ref, {
          studentId,
          week: weekNum,
          weekStart,
          totalHours: data.totalHours,
          status,
          breakdown: data.breakdown, 
          createdAt: new Date(),
        });
        
        weeksAdded++;
      });

      if (weeksAdded > 0) {
        await batch.commit();
      }

      return res.json({
        message: "Weekly workload generated",
        weeksAdded: weeksAdded,
      });
    } catch (err) {
      console.error("generateWorkload error:", err);
      res.status(500).json({ error: "Workload generation failed" });
    }
  });
});

/**
 * Generate lecture alerts (manual trigger)
 */
const generateLectureAlerts = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    try {
      const now = new Date(
        new Date().toLocaleString("en-US", { timeZone: "Asia/Colombo" }),
      );
      const todayName = now.toLocaleDateString("en-US", {
        weekday: "long",
      });

      const subjectsSnap = await db.collection("subjects").get();
      const alerts = [];

      subjectsSnap.forEach((doc) => {
        const sub = doc.data();

        if (!sub.lectureDays?.includes(todayName)) return;

        const lectureStart = new Date(
          `${now.toDateString()} ${sub.lectureStartTime}`,
        );

        const diffMinutes = (lectureStart - now) / 60000;

        // 🔔 Lecture starting soon
        if (diffMinutes > 0 && diffMinutes <= 15) {
          alerts.push({
            type: "LECTURE_STARTING_SOON",
            subjectId: sub.subjectId,
            subjectName: sub.subjectName,
            message: `Lecture starts in ${Math.round(diffMinutes)} minutes`,
            deliveryMode: sub.deliveryMode,
            joinLink: sub.deliveryMode === "ONLINE" ? sub.onlinePlatform : null,
          });
        }

        // 🔔 Lecture live
        if (diffMinutes <= 0 && diffMinutes >= -5) {
          alerts.push({
            type: "LECTURE_NOW",
            subjectId: sub.subjectId,
            subjectName: sub.subjectName,
            message:
              sub.deliveryMode === "ONLINE"
                ? "Lecture is live now. Join using the link."
                : "Lecture is happening now.",
            deliveryMode: sub.deliveryMode,
            joinLink: sub.deliveryMode === "ONLINE" ? sub.onlinePlatform : null,
          });
        }
      });

      return res.json({
        timestamp: now,
        alerts,
      });
    } catch (err) {
      console.error("generateLectureAlerts error:", err);
      res.status(500).json({ error: "Failed to generate lecture alerts" });
    }
  });
});

/**
 * 🌟 FIXED: Get Weekly Workload
 * Removed the .filter() bug so ALL weeks load properly, and added CORS!
 */
const getWeeklyWorkload = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    try {
      if (req.method !== "GET" && req.method !== "OPTIONS") {
        return res.status(405).send("Method Not Allowed");
      }

      const { studentId } = req.query;
      if (!studentId) {
        return res.status(400).json({ error: "Missing studentId" });
      }

      const snap = await db
        .collection("weekly_workload")
        .where("studentId", "==", studentId)
        .get();

      // 🌟 REMOVED THE FILTER - Now it sends the entire workload, including HEAVY and OVERLOADED weeks!
      const weeks = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

      return res.json({
        studentId,
        totalFlaggedWeeks: weeks.length,
        weeks,
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to fetch weekly workload" });
    }
  });
});

const generateOverloadReminders = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    try {
      const { studentId } = req.body;

      if (!studentId) {
        return res.status(400).json({ error: "Missing studentId" });
      }

      const snap = await db
        .collection("weekly_workload")
        .where("studentId", "==", studentId)
        .where("status", "==", "OVERLOADED")
        .get();

      if (snap.empty) {
        return res.json({
          message: "No overloaded weeks detected",
          remindersCreated: 0,
        });
      }

      const batch = db.batch();
      let reminderCount = 0;

      snap.docs.forEach((doc) => {
        const data = doc.data();
        const overloadedWeek = Number(data.week);

        const reminderWeeks = [overloadedWeek - 2, overloadedWeek - 1];

        reminderWeeks.forEach((week) => {
          if (week <= 0) return;

          const ref = db
            .collection("reminders")
            .doc(`${studentId}_OVERLOAD_W${overloadedWeek}_REM_W${week}`);

          batch.set(ref, {
            studentId,
            reminderWeek: week,
            targetOverloadedWeek: overloadedWeek,
            type: "OVERLOAD_EARLY_WARNING",
            message: `Week ${overloadedWeek} will be overloaded. Start preparation early.`,
            createdAt: new Date(),
          });

          reminderCount++;
        });
      });

      await batch.commit();

      return res.json({
        message: "Overload reminders generated",
        remindersCreated: reminderCount,
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to generate overload reminders" });
    }
  });
});

const generateBusyWeekReminders = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    try {
      const { studentId } = req.body;

      if (!studentId) {
        return res.status(400).json({ error: "Missing studentId" });
      }

      const snap = await db
        .collection("weekly_workload")
        .where("studentId", "==", studentId)
        .where("status", "in", ["BUSY", "HEAVY", "OVERLOADED"])
        .get();

      if (snap.empty) {
        return res.json({
          message: "No busy weeks detected",
          remindersCreated: 0,
        });
      }

      const batch = db.batch();
      let reminderCount = 0;
      const today = new Date();

      for (const doc of snap.docs) {
        const data = doc.data();
        const busyWeek = Number(data.week);
        const weekStart = data.weekStart.toDate();

        if (weekStart <= today) continue;

        const reminderWeeks = [busyWeek - 2, busyWeek - 1];

        for (const week of reminderWeeks) {
          if (week <= 0) continue;

          const subjectDetails = data.breakdown
            .map((b) => `${b.hours} hours of ${b.subjectName} (${b.type})`)
            .join(", ");

          const prompt = `
            You are an expert academic advisor. 
            A student has an upcoming week labeled as "${data.status}" with ${data.totalHours} total hours.
            Workload breakdown: ${subjectDetails}

            TASK: Create a realistic 5-day study timetable (Day 1 to Day 5).
            
            RULES:
            1. Distribute the ${data.totalHours} hours logically across 5 days.
            2. Be highly specific: Use tasks like "Draft intro for ${data.breakdown[0]?.subjectName || "Subject"}" instead of just "Study".
            3. Ensure no single day is excessively overloaded.
            4. You MUST return ONLY a valid JSON array of objects.

            JSON format:
            [
              { "day": 1, "subject": "Name", "hours": 2, "task": "Specific actionable task" },
              { "day": 2, "subject": "Name", "hours": 3, "task": "Another task" }
            ]
          `;

          let aiTimetable = [];

          try {
            const chatCompletion = await groq.chat.completions.create({
              messages: [
                {
                  role: "system",
                  content:
                    "You are a helpful academic assistant that outputs strictly JSON arrays.",
                },
                { role: "user", content: prompt },
              ],
              model: "llama-3.3-70b-versatile",
              response_format: { type: "json_object" },
              temperature: 0.7,
            });

            const content = chatCompletion.choices[0].message.content;
            const parsedData = JSON.parse(content);

            aiTimetable = Array.isArray(parsedData)
              ? parsedData
              : parsedData.timetable || parsedData.schedule || [];
          } catch (aiError) {
            console.error("Groq AI failed:", aiError);
            aiTimetable = [
              {
                day: 1,
                subject: "Preparation",
                hours: 2,
                task: `Begin early prep for your upcoming ${data.status} week.`,
              },
            ];
          }

          const reminderId = `${studentId}_W${busyWeek}_REM_W${week}`;
          const ref = db.collection("busy_week_reminders").doc(reminderId);

          batch.set(ref, {
            studentId,
            reminderWeek: week,
            targetBusyWeek: busyWeek,
            targetWeekStart: weekStart,
            targetStatus: data.status,
            targetTotalHours: data.totalHours,
            type: "BUSY_WEEK_WARNING",
            timetable: aiTimetable,
            createdAt: new Date(),
            isActive: true,
            isDismissed: false,
          });

          reminderCount++;
        }
      }

      await batch.commit();

      return res.json({
        message: "Dynamic Groq-powered timetables generated",
        remindersCreated: reminderCount,
      });
    } catch (err) {
      console.error("Main Function Error:", err);
      res.status(500).json({ error: "Failed to generate reminders" });
    }
  });
});

const getActiveReminders = functions.https.onRequest(async (req, res) => {
  try {
    if (req.method !== "GET") {
      return res.status(405).send("Method Not Allowed");
    }

//       const snap = await db
//         .collection("busy_week_reminders")
//         .where("studentId", "==", studentId)
//         .get();

//       const allActiveReminders = snap.docs
//         .map((doc) => ({
//           id: doc.id,
//           ...doc.data(),
//           targetWeekStart: doc.data().targetWeekStart.toDate(),
//           createdAt: doc.data().createdAt.toDate(),
//         }))
//         .filter(
//           (reminder) =>
//             reminder.isActive === true &&
//             reminder.isDismissed === false &&
//             reminder.targetWeekStart > today &&
//             reminder.targetWeekStart <= twoWeeksFromNow,
//         );

//       const uniqueRemindersMap = new Map();

//       allActiveReminders.forEach((reminder) => {
//         const targetWeek = reminder.targetBusyWeek;

//         if (!uniqueRemindersMap.has(targetWeek)) {
//           uniqueRemindersMap.set(targetWeek, reminder);
//         } else {
//           const existingReminder = uniqueRemindersMap.get(targetWeek);
//           if (reminder.reminderWeek > existingReminder.reminderWeek) {
//             uniqueRemindersMap.set(targetWeek, reminder);
//           }
//         }
//       });

//       const finalReminders = Array.from(uniqueRemindersMap.values());

//       return res.json({
//         studentId,
//         count: finalReminders.length,
//         reminders: finalReminders,
//       });
//     } catch (err) {
//       console.error(err);
//       res.status(500).json({ error: "Failed to fetch reminders" });
//     }
//   });
// });
const getActiveReminders = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    try {
      if (req.method !== "GET" && req.method !== "OPTIONS") {
        return res.status(405).send("Method Not Allowed");
      }

      const { studentId } = req.query;
      if (!studentId) {
        return res.status(400).json({ error: "Missing studentId" });
      }

      const today = new Date();
      const twoWeeksFromNow = new Date(
        today.getTime() + 14 * 24 * 60 * 60 * 1000,
      );

      const snap = await db
        .collection("busy_week_reminders")
        .where("studentId", "==", studentId)
        .get();

      const allActiveReminders = snap.docs
        .map((doc) => ({
          id: doc.id,
          ...doc.data(),
          targetWeekStart: doc.data().targetWeekStart.toDate(),
          createdAt: doc.data().createdAt.toDate(),
        }))
        .filter((reminder) => {
          // Hide dismissed or inactive reminders
          if (reminder.isActive !== true || reminder.isDismissed === true) {
            return false;
          }

          const weekStart = reminder.targetWeekStart;
          // 🌟 THE FIX: A week lasts 7 days. Calculate the exact end date of the week.
          const weekEnd = new Date(
            weekStart.getTime() + 7 * 24 * 60 * 60 * 1000,
          );

          // Show the reminder IF the week hasn't finished yet AND it's not too far in the future
          return weekEnd >= today && weekStart <= twoWeeksFromNow;
        });

      const uniqueRemindersMap = new Map();

      allActiveReminders.forEach((reminder) => {
        const targetWeek = reminder.targetBusyWeek;

        if (!uniqueRemindersMap.has(targetWeek)) {
          uniqueRemindersMap.set(targetWeek, reminder);
        } else {
          const existingReminder = uniqueRemindersMap.get(targetWeek);
          if (reminder.reminderWeek > existingReminder.reminderWeek) {
            uniqueRemindersMap.set(targetWeek, reminder);
          }
        }
      });

      const finalReminders = Array.from(uniqueRemindersMap.values());

      return res.json({
        studentId,
        count: finalReminders.length,
        reminders: finalReminders,
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to fetch reminders" });
    }
  });
});

const getEnrolledSubjects = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    try {
      if (req.method !== "GET" && req.method !== "OPTIONS") {
        return res.status(405).send("Method Not Allowed");
      }

      const { studentId } = req.query;

      if (!studentId) {
        return res.status(400).json({ error: "Missing studentId" });
      }

      const enrollSnap = await db
        .collection("student_enrollments")
        .doc(studentId)
        .get();

      if (!enrollSnap.exists) {
        return res.status(404).json({ error: "Student not enrolled" });
      }

      const subjectIds = enrollSnap.data().subjects || [];

      const subjects = await Promise.all(
        subjectIds.map(async (id) => {
          const snap = await db.collection("subjects").doc(id).get();
          if (!snap.exists) return null;

          const data = snap.data();

          return {
            subjectId: data.subjectId,
            subjectName: data.subjectName,
            type: data.type,
            deliveryMode: data.deliveryMode || "PHYSICAL",
            lectureDays: data.lectureDays || [],
            lectureStartTime: data.lectureStartTime || null,
            lectureEndTime: data.lectureEndTime || null,
            onlinePlatform: data.onlinePlatform || null,
          };
        }),
      );

      return res.json({
        studentId,
        subjects: subjects.filter(Boolean),
      });
    } catch (err) {
      console.error("getEnrolledSubjects error:", err);
      res.status(500).json({ error: "Failed to fetch enrolled subjects" });
    }
  });
});

const dismissReminder = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    try {
      if (req.method !== "POST" && req.method !== "OPTIONS") {
        return res.status(405).send("Method Not Allowed");
      }

      const { reminderId, studentId } = req.body;
      if (!reminderId || !studentId) {
        return res.status(400).json({ error: "Missing fields" });
      }

      const ref = db.collection("busy_week_reminders").doc(reminderId);
      const doc = await ref.get();

      if (!doc.exists) {
        return res.status(404).json({ error: "Reminder not found" });
      }

      if (doc.data().studentId !== studentId) {
        return res.status(403).json({ error: "Unauthorized" });
      }

      await ref.update({
        isDismissed: true,
        dismissedAt: new Date(),
      });

      return res.json({
        message: "Reminder dismissed successfully",
        reminderId,
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to dismiss reminder" });
    }
  });
});

module.exports = {
  generateWorkload,
  generateLectureAlerts,
  generateOverloadReminders,
  getWeeklyWorkload,
  dismissReminder,
  getActiveReminders,
  generateBusyWeekReminders,
  getEnrolledSubjects,
};

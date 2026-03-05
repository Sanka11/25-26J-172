// // backend/functions/src/http/emailScheduler.js
// require("dotenv").config();
// const { onSchedule } = require("firebase-functions/v2/scheduler");
// const admin = require("firebase-admin");
// const nodemailer = require("nodemailer");

// // Initialize Firebase Admin if not already initialized
// if (!admin.apps.length) {
//   admin.initializeApp();
// }
// const db = admin.firestore();

// // Configure the Nodemailer transporter
// const transporter = nodemailer.createTransport({
//   service: "gmail",
//   auth: {
//     user: process.env.EMAIL_USER,
//     pass: process.env.EMAIL_PASS,
//   },
// });

// // Helper function to convert the AI JSON timetable into an HTML table
// const formatTimetableToHTML = (timetable) => {
//   if (!timetable || timetable.length === 0) {
//     return "<p>No specific tasks scheduled.</p>";
//   }

//   let html = `
//     <table border="1" cellpadding="10" style="border-collapse: collapse; width: 100%; text-align: left; font-family: sans-serif;">
//       <tr style="background-color: #fef3c7; color: #78350f;">
//         <th>Day</th><th>Subject</th><th>Task</th><th>Duration</th>
//       </tr>`;

//   timetable.forEach((item) => {
//     html += `
//       <tr>
//         <td><strong>Day ${item.day}</strong></td>
//         <td>${item.subject}</td>
//         <td>${item.task}</td>
//         <td><span style="background-color: #fef3c7; padding: 4px 8px; border-radius: 4px; font-weight: bold; font-size: 12px;">${item.hours}h</span></td>
//       </tr>`;
//   });

//   html += `</table>`;
//   return html;
// };

// // Production Cron Job: Runs every day at 8:00 AM Sri Lanka time
// const dailyWorkloadEmailScheduler = onSchedule(
//   {
//     schedule: "every day 08:00",
//     timeZone: "Asia/Colombo",
//   },
//   async (event) => {
//     try {
//       console.log("Starting daily email scheduler...");

//       const today = new Date();
//       today.setHours(0, 0, 0, 0); // Normalize to midnight

//       // ==========================================
//       // SCENARIO 1 & 2: PRE-WEEK TIMETABLE EMAILS
//       // ==========================================
//       const remindersSnap = await db
//         .collection("busy_week_reminders")
//         .where("isActive", "==", true)
//         .get();

//       for (const doc of remindersSnap.docs) {
//         const reminder = doc.data();

//         // Get user email from Firebase Auth
//         const userRecord = await admin
//           .auth()
//           .getUser(reminder.studentId)
//           .catch(() => null);

//         if (!userRecord || !userRecord.email) continue;

//         const targetStart = reminder.targetWeekStart.toDate();
//         targetStart.setHours(0, 0, 0, 0);

//         // Calculate exact difference in days
//         const diffTime = targetStart.getTime() - today.getTime();
//         const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

//         const timetableHTML = formatTimetableToHTML(reminder.timetable);
//         let shouldSend = false;
//         let emailOptions = {
//           from: `"Academic Support" <${process.env.EMAIL_USER}>`,
//           to: userRecord.email,
//           subject: "",
//           html: "",
//         };

//         // SCENARIO 1: Exactly 7 days before
//         if (diffDays === 7) {
//           shouldSend = true;
//           emailOptions.subject = `Action Required: Heavy Workload Approaching (Week ${reminder.targetBusyWeek})`;
//           emailOptions.html = `
//             <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px;">
//               <h2 style="color: #1e40af;">Hi Student,</h2>
//               <p>Next week (Week ${reminder.targetBusyWeek}) is marked as <strong>${reminder.targetStatus}</strong> with ${reminder.targetTotalHours} hours of work.</p>
//               <h3 style="color: #d97706;">Your AI-Generated Study Plan:</h3>
//               ${timetableHTML}
//               <p>Start preparing now so you don't fall behind!</p>
//             </div>
//           `;
//         }
//         // SCENARIO 2: Exactly 1 day before
//         else if (diffDays === 1) {
//           shouldSend = true;
//           emailOptions.subject = `Tomorrow: Week ${reminder.targetBusyWeek} Starts!`;
//           emailOptions.html = `
//             <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px;">
//               <h2 style="color: #1e40af;">Hi Student,</h2>
//               <p>Your highly demanding week starts tomorrow. Stick to this study schedule to manage your workload effectively:</p>
//               ${timetableHTML}
//               <p>Good luck!</p>
//             </div>
//           `;
//         }

//         if (shouldSend) {
//           await transporter.sendMail(emailOptions);
//           console.log(
//             `Sent pre-week plan to ${userRecord.email} for Week ${reminder.targetBusyWeek}`,
//           );
//         }
//       }

//       // ==========================================
//       // SCENARIO 3: POST-WEEK MISSING SUBMISSIONS
//       // ==========================================

//       // Calculate the date exactly 7 days ago
//       const pastWeekDate = new Date(today);
//       pastWeekDate.setDate(today.getDate() - 7);

//       const startOfDay = new Date(pastWeekDate);
//       startOfDay.setHours(0, 0, 0, 0);
//       const endOfDay = new Date(pastWeekDate);
//       endOfDay.setHours(23, 59, 59, 999);

//       // Fetch workloads that started exactly one week ago
//       const workloadSnap = await db
//         .collection("weekly_workload")
//         .where(
//           "weekStart",
//           ">=",
//           admin.firestore.Timestamp.fromDate(startOfDay),
//         )
//         .where("weekStart", "<=", admin.firestore.Timestamp.fromDate(endOfDay))
//         .where("status", "in", ["BUSY", "HEAVY", "OVERLOADED"])
//         .get();

//       for (const doc of workloadSnap.docs) {
//         const workload = doc.data();

//         // Validate the breakdown array exists
//         if (!workload.breakdown || !Array.isArray(workload.breakdown)) continue;

//         // Filter for specific tasks marked incomplete
//         const incompleteTasks = workload.breakdown.filter(
//           (task) => task.isCompleted === false,
//         );

//         if (incompleteTasks.length > 0) {
//           const userRecord = await admin
//             .auth()
//             .getUser(workload.studentId)
//             .catch(() => null);

//           if (!userRecord || !userRecord.email) continue;

//           // Build HTML list of exactly what they missed
//           let missedTasksHtml = `<ul style="color: #b91c1c; font-weight: bold; background-color: #fee2e2; padding: 15px 30px; border-radius: 8px;">`;
//           incompleteTasks.forEach((task) => {
//             missedTasksHtml += `<li>${task.subjectName} - ${task.type} (${task.hours}h)</li>`;
//           });
//           missedTasksHtml += `</ul>`;

//           await transporter.sendMail({
//             from: `"Academic Support" <${process.env.EMAIL_USER}>`,
//             to: userRecord.email,
//             subject: `Action Required: Missing Submissions for Week ${workload.week}`,
//             html: `
//               <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px;">
//                 <h2 style="color: #1f2937;">Hi Student,</h2>
//                 <p>Week ${workload.week} has ended, but our records show you have <strong>not submitted</strong> the following assignments:</p>
//                 ${missedTasksHtml}
//                 <p>It is critical that you complete these as soon as possible. If you are struggling with these specific subjects, please reach out to your lecturer immediately.</p>
//               </div>
//             `,
//           });
//           console.log(
//             `Sent specific missing submission email to ${userRecord.email} for Week ${workload.week}`,
//           );
//         }
//       }

//       console.log("Daily email scheduler finished successfully.");
//     } catch (error) {
//       console.error("Error in email scheduler:", error);
//     }
//   },
// );

// module.exports = { dailyWorkloadEmailScheduler };
// backend/functions/src/http/emailScheduler.js
// backend/functions/src/http/emailScheduler.js
require("dotenv").config();

const { onSchedule } = require("firebase-functions/v2/scheduler");
const { onRequest } = require("firebase-functions/v2/https");
const admin = require("firebase-admin");
const nodemailer = require("nodemailer");

// ============================
// Firebase Init
// ============================
if (!admin.apps.length) {
  console.log("Initializing Firebase Admin...");
  admin.initializeApp();
}

const db = admin.firestore();

// ============================
// Email Transporter
// ============================
console.log("Configuring email transporter...");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

console.log("Email transporter configured for:", process.env.EMAIL_USER);

// ============================
// Helper Function
// ============================
function formatTimetableToHTML(timetable) {
  console.log("Formatting timetable...");

  if (!timetable || timetable.length === 0) {
    return "<p>No specific tasks scheduled.</p>";
  }

  const grouped = timetable.reduce((acc, item) => {
    const day = item.day;
    if (!acc[day]) acc[day] = [];
    acc[day].push(item);
    return acc;
  }, {});

  const sortedDays = Object.keys(grouped).sort((a, b) => a - b);

  let html = `
  <table border="1" cellpadding="10" 
  style="border-collapse: collapse; width: 100%; font-family: sans-serif;">
  <tr style="background-color:#fef3c7">
  <th>Day</th>
  <th>Subject</th>
  <th>Task</th>
  <th>Duration</th>
  </tr>
  `;

  sortedDays.forEach((day) => {
    grouped[day].forEach((item, index) => {
      html += `
      <tr>
      <td>${index === 0 ? `Day ${day}` : ""}</td>
      <td>${item.subject}</td>
      <td>${item.task}</td>
      <td>${item.hours}h</td>
      </tr>
      `;
    });
  });

  html += "</table>";

  return html;
}

// =====================================================
// MAIN EMAIL LOGIC FUNCTION
// =====================================================
async function runEmailSchedulerLogic() {
  console.log("===================================");
  console.log("Running Email Scheduler Logic");
  console.log("Time:", new Date().toISOString());

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  console.log("Today's date:", today);

  // ==========================================
  // PRE-WEEK REMINDERS
  // ==========================================

  console.log("Fetching busy week reminders...");

  const remindersSnap = await db
    .collection("busy_week_reminders")
    .where("isActive", "==", true)
    .get();

  console.log("Reminders found:", remindersSnap.size);

  for (const doc of remindersSnap.docs) {
    const reminder = doc.data();

    console.log("Processing reminder:", doc.id);
    console.log("Student ID:", reminder.studentId);

    const userRecord = await admin
      .auth()
      .getUser(reminder.studentId)
      .catch((err) => {
        console.error("User fetch error:", err);
        return null;
      });

    if (!userRecord || !userRecord.email) {
      console.log("User email not found. Skipping.");
      continue;
    }

    console.log("User email:", userRecord.email);

    const targetStart = reminder.targetWeekStart.toDate();
    targetStart.setHours(0, 0, 0, 0);

    const diffDays = Math.round(
      (targetStart.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
    );

    console.log("Days difference:", diffDays);

    const timetableHTML = formatTimetableToHTML(reminder.timetable);

    let subject = "";
    let html = "";

    if (diffDays === 7) {
      console.log("Sending 7-day warning email");

      subject = `Heavy Workload Approaching (Week ${reminder.targetBusyWeek})`;

      html = `
      <h2>Hi Student</h2>
      <p>Next week will be busy.</p>
      ${timetableHTML}
      <p>Please start preparing early.</p>
      `;
    }

    if (diffDays === 1) {
      console.log("Sending 1-day warning email");

      subject = `Tomorrow Busy Week Starts`;

      html = `
      <h2>Hi Student</h2>
      <p>Your heavy workload week starts tomorrow.</p>
      ${timetableHTML}
      `;
    }

    if (subject) {
      console.log("Sending email to:", userRecord.email);

      const info = await transporter.sendMail({
        from: `"Academic Support" <${process.env.EMAIL_USER}>`,
        to: userRecord.email,
        subject,
        html,
      });

      console.log("Email sent:", info.messageId);
    }
  }

  // ==========================================
  // POST WEEK CHECK
  // ==========================================

  console.log("Checking incomplete workloads...");

  const pastWeek = new Date(today);
  pastWeek.setDate(today.getDate() - 7);

  const startOfDay = new Date(pastWeek);
  startOfDay.setHours(0, 0, 0, 0);

  const endOfDay = new Date(pastWeek);
  endOfDay.setHours(23, 59, 59, 999);

  const workloadSnap = await db
    .collection("weekly_workload")
    .where("weekStart", ">=", startOfDay)
    .where("weekStart", "<=", endOfDay)
    .where("status", "in", ["BUSY", "HEAVY", "OVERLOADED"])
    .get();

  console.log("Workloads found:", workloadSnap.size);

  for (const doc of workloadSnap.docs) {
    const workload = doc.data();

    console.log("Processing workload:", doc.id);

    if (!Array.isArray(workload.breakdown)) continue;

    const incomplete = workload.breakdown.filter(
      (task) => task.isCompleted === false,
    );

    console.log("Incomplete tasks:", incomplete.length);

    if (incomplete.length === 0) continue;

    const userRecord = await admin
      .auth()
      .getUser(workload.studentId)
      .catch(() => null);

    if (!userRecord || !userRecord.email) continue;

    let missedList = "<ul>";

    incomplete.forEach((task) => {
      missedList += `<li>${task.subjectName} - ${task.type}</li>`;
    });

    missedList += "</ul>";

    console.log("Sending missing task email to:", userRecord.email);

    const info = await transporter.sendMail({
      from: `"Academic Support" <${process.env.EMAIL_USER}>`,
      to: userRecord.email,
      subject: "Missing Submissions",
      html: `
      <h2>Hi Student</h2>
      <p>You missed these tasks:</p>
      ${missedList}
      `,
    });

    console.log("Missing submission email sent:", info.messageId);
  }

  console.log("Scheduler logic finished");
  console.log("===================================");
}

// =====================================================
// SCHEDULED FUNCTION (PRODUCTION)
// =====================================================
exports.dailyWorkloadEmailScheduler = onSchedule(
  {
    schedule: "every day 08:00",
    timeZone: "Asia/Colombo",
  },
  async () => {
    console.log("Scheduled job triggered");
    await runEmailSchedulerLogic();
  },
);

// =====================================================
// MANUAL TEST FUNCTION (LOCAL DEBUG)
// =====================================================
exports.testEmailScheduler = onRequest(async (req, res) => {
  console.log("Manual test endpoint triggered");

  try {
    await runEmailSchedulerLogic();
    res.send("Email scheduler executed successfully");
  } catch (error) {
    console.error("Test execution error:", error);
    res.status(500).send(error.message);
  }
});
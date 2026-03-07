
// backend/functions/src/http/adminWorkloadController.js
// require("dotenv").config();
// const functions = require("firebase-functions");
// const admin = require("firebase-admin");
// const nodemailer = require("nodemailer");
// const cors = require("cors")({ origin: true }); // Crucial for connecting to React

// if (!admin.apps.length) {
//   admin.initializeApp();
// }
// const db = admin.firestore();

// const transporter = nodemailer.createTransport({
//   service: "gmail",
//   auth: {
//     user: process.env.EMAIL_USER,
//     pass: process.env.EMAIL_PASS,
//   },
// });

// /**
//  * GET /getAllWorkloads
//  */
// const getAllWorkloads = functions.https.onRequest((req, res) => {
//   cors(req, res, async () => {
//     try {
//       const snap = await db.collection("weekly_workload").get();
//       const workloads = snap.docs.map((doc) => ({
//         id: doc.id,
//         ...doc.data(),
//       }));
//       return res.status(200).json(workloads);
//     } catch (error) {
//       console.error("Error fetching all workloads:", error);
//       return res.status(500).json({ error: "Failed to fetch workloads" });
//     }
//   });
// });

// /**
//  * PATCH /updateTaskCompletion
//  */
// const updateTaskCompletion = functions.https.onRequest((req, res) => {
//   cors(req, res, async () => {
//     try {
//       if (req.method !== "PATCH" && req.method !== "OPTIONS") {
//         return res.status(405).json({ error: "Method not allowed" });
//       }

//       const { docId, taskIndex, isCompleted } = req.body;

//       if (!docId || typeof taskIndex !== "number" || typeof isCompleted !== "boolean") {
//         return res.status(400).json({ error: "Missing required fields" });
//       }

//       const docRef = db.collection("weekly_workload").doc(docId);
//       const docSnap = await docRef.get();

//       if (!docSnap.exists) {
//         return res.status(404).json({ error: "Workload document not found" });
//       }

//       const data = docSnap.data();
//       const breakdown = data.breakdown || [];

//       if (taskIndex >= 0 && taskIndex < breakdown.length) {
//         breakdown[taskIndex].isCompleted = isCompleted;
//         await docRef.update({ breakdown });
//         return res.status(200).json({ success: true, message: "Task updated" });
//       } else {
//         return res.status(400).json({ error: "Invalid task index" });
//       }
//     } catch (error) {
//       console.error("Error updating task completion:", error);
//       return res.status(500).json({ error: "Failed to update task completion" });
//     }
//   });
// });

// /**
//  * POST /triggerManualWarningEmail
//  */
// const triggerManualWarningEmail = functions.https.onRequest((req, res) => {
//   cors(req, res, async () => {
//     try {
//       if (req.method !== "POST" && req.method !== "OPTIONS") {
//         return res.status(405).json({ error: "Method not allowed" });
//       }

//       const { studentId, week } = req.body;

//       if (!studentId || !week) {
//         return res.status(400).json({ error: "Missing studentId or week" });
//       }

//       const snap = await db.collection("weekly_workload")
//         .where("studentId", "==", studentId)
//         .where("week", "==", Number(week))
//         .limit(1)
//         .get();

//       if (snap.empty) {
//         return res.status(404).json({ error: "Workload not found" });
//       }

//       const workload = snap.docs[0].data();
//       const breakdown = workload.breakdown || [];
//       const incompleteTasks = breakdown.filter((t) => t.isCompleted === false);

//       if (incompleteTasks.length === 0) {
//         return res.status(400).json({ error: "Student has no incomplete tasks!" });
//       }

//       const userRecord = await admin.auth().getUser(studentId).catch(() => null);
      
//       if (!userRecord || !userRecord.email) {
//         return res.status(404).json({ error: "Could not find student's email" });
//       }

//       let missedTasksHtml = `<ul style="color: #b91c1c; font-weight: bold; background-color: #fee2e2; padding: 15px 30px; border-radius: 8px;">`;
//       incompleteTasks.forEach((task) => {
//         missedTasksHtml += `<li>${task.subjectName} - ${task.type} (${task.hours}h)</li>`;
//       });
//       missedTasksHtml += `</ul>`;

//       await transporter.sendMail({
//         from: `"Academic Support Admin" <${process.env.EMAIL_USER}>`,
//         to: userRecord.email,
//         subject: `URGENT ALERT: Missing Submissions for Week ${workload.week}`,
//         html: `
//           <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px;">
//             <h2 style="color: #1f2937;">Hi Student,</h2>
//             <p>Your lecturer/admin has manually flagged that you have <strong>not submitted</strong> the following required assignments for Week ${workload.week}:</p>
//             ${missedTasksHtml}
//             <p>Please complete these immediately to avoid losing marks, and contact your lecturer if you need assistance.</p>
//           </div>
//         `,
//       });

//       console.log(`Manual admin warning sent to ${userRecord.email} for Week ${week}`);
//       return res.status(200).json({ success: true, message: "Email sent successfully!" });

//     } catch (error) {
//       console.error("Error triggering manual email:", error);
//       return res.status(500).json({ error: "Failed to send warning email" });
//     }
//   });
// });

// module.exports = {
//   getAllWorkloads,
//   updateTaskCompletion,
//   triggerManualWarningEmail
// };


// backend/functions/src/http/adminWorkloadController.js
require("dotenv").config();
const functions = require("firebase-functions");
const admin = require("firebase-admin");
const nodemailer = require("nodemailer");
const cors = require("cors")({ origin: true }); 

if (!admin.apps.length) {
  admin.initializeApp();
}
const db = admin.firestore();

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Helper function for the timetable emails
const formatTimetableToHTML = (timetable) => {
  if (!timetable || timetable.length === 0)
    return "<p>No specific tasks scheduled.</p>";

  let html = `
    <table border="1" cellpadding="10" style="border-collapse: collapse; width: 100%; text-align: left; font-family: sans-serif;">
      <tr style="background-color: #fef3c7; color: #78350f;">
        <th>Day</th><th>Subject</th><th>Task</th><th>Duration</th>
      </tr>`;

  timetable.forEach((item) => {
    html += `
      <tr>
        <td><strong>Day ${item.day}</strong></td>
        <td>${item.subject}</td>
        <td>${item.task}</td>
        <td><span style="background-color: #fef3c7; padding: 4px 8px; border-radius: 4px; font-weight: bold; font-size: 12px;">${item.hours}h</span></td>
      </tr>`;
  });

  html += `</table>`;
  return html;
};

/**
 * GET /getAllWorkloads
 */
const getAllWorkloads = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    try {
      const snap = await db.collection("weekly_workload").get();
      const workloads = snap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      return res.status(200).json(workloads);
    } catch (error) {
      console.error("Error fetching all workloads:", error);
      return res.status(500).json({ error: "Failed to fetch workloads" });
    }
  });
});

/**
 * PATCH /updateTaskCompletion
 */
const updateTaskCompletion = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    try {
      if (req.method !== "PATCH" && req.method !== "OPTIONS") {
        return res.status(405).json({ error: "Method not allowed" });
      }

      const { docId, taskIndex, isCompleted } = req.body;

      if (!docId || typeof taskIndex !== "number" || typeof isCompleted !== "boolean") {
        return res.status(400).json({ error: "Missing required fields" });
      }

      const docRef = db.collection("weekly_workload").doc(docId);
      const docSnap = await docRef.get();

      if (!docSnap.exists) {
        return res.status(404).json({ error: "Workload document not found" });
      }

      const data = docSnap.data();
      const breakdown = data.breakdown || [];

      if (taskIndex >= 0 && taskIndex < breakdown.length) {
        breakdown[taskIndex].isCompleted = isCompleted;
        await docRef.update({ breakdown });
        return res.status(200).json({ success: true, message: "Task updated" });
      } else {
        return res.status(400).json({ error: "Invalid task index" });
      }
    } catch (error) {
      console.error("Error updating task completion:", error);
      return res.status(500).json({ error: "Failed to update task completion" });
    }
  });
});

/**
 * POST /triggerManualWarningEmail
 * Smart function: Determines WHICH email to send based on the current date
 */
// const triggerManualWarningEmail = functions.https.onRequest((req, res) => {
//   cors(req, res, async () => {
//     try {
//       if (req.method !== "POST" && req.method !== "OPTIONS") {
//         return res.status(405).json({ error: "Method not allowed" });
//       }

//       const { studentId, week } = req.body;

//       if (!studentId || !week) {
//         return res.status(400).json({ error: "Missing studentId or week" });
//       }

//       // 1. Fetch the Workload
//       const snap = await db.collection("weekly_workload")
//         .where("studentId", "==", studentId)
//         .where("week", "==", Number(week))
//         .limit(1)
//         .get();

//       if (snap.empty) {
//         return res.status(404).json({ error: "Workload not found" });
//       }

//       const workload = snap.docs[0].data();
      
//       // 2. Calculate Dates to figure out what type of email this is
//       const today = new Date();
//       today.setHours(0, 0, 0, 0);
      
//       const weekStart = workload.weekStart.toDate();
//       weekStart.setHours(0, 0, 0, 0);

//       const diffTime = weekStart.getTime() - today.getTime();
//       const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

//       // 3. Get User Email
//       const userRecord = await admin.auth().getUser(studentId).catch(() => null);
//       if (!userRecord || !userRecord.email) {
//         return res.status(404).json({ error: "Could not find student's email" });
//       }

//       let emailSubject = "";
//       let emailHtml = "";

//       // ==============================================
//       // SCENARIO A: FUTURE WEEK (Send Early Timetable)
//       // ==============================================
//       if (diffDays >= 1) {
//         // Fetch the AI timetable from the reminders collection
//         const reminderSnap = await db.collection("busy_week_reminders")
//           .where("studentId", "==", studentId)
//           .where("targetBusyWeek", "==", Number(week))
//           .limit(1)
//           .get();

//         let timetableHTML = "<p>No AI timetable was generated for this week.</p>";
//         if (!reminderSnap.empty) {
//           timetableHTML = formatTimetableToHTML(reminderSnap.docs[0].data().timetable);
//         }

//         if (diffDays > 1) {
//           // Sending > 1 day early (e.g., in Week 4 for Week 5)
//           emailSubject = `Action Required: Heavy Workload Approaching (Week ${week})`;
//           emailHtml = `
//             <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px;">
//               <h2 style="color: #1e40af;">Hi Student,</h2>
//               <p>Next week (Week ${week}) is marked as <strong>${workload.status}</strong> with ${workload.totalHours} hours of work.</p>
//               <h3 style="color: #d97706;">Your AI-Generated Study Plan:</h3>
//               ${timetableHTML}
//               <p>Start preparing now so you don't fall behind!</p>
//             </div>
//           `;
//         } else if (diffDays === 1) {
//           // Sending exactly 1 day before (Tomorrow)
//           emailSubject = `Tomorrow: Week ${week} Starts!`;
//           emailHtml = `
//             <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px;">
//               <h2 style="color: #1e40af;">Hi Student,</h2>
//               <p>Your highly demanding week starts tomorrow. Stick to this study schedule to manage your workload effectively:</p>
//               ${timetableHTML}
//               <p>Good luck!</p>
//             </div>
//           `;
//         }
//       } 
//       // ==============================================
//       // SCENARIO B: PAST WEEK (Send Missing Warning)
//       // ==============================================
//       else {
//         const breakdown = workload.breakdown || [];
//         const incompleteTasks = breakdown.filter((t) => t.isCompleted === false);

//         // If they did everything, block the email!
//         if (incompleteTasks.length === 0) {
//           return res.status(400).json({ error: "Student has completed all tasks. No email needed!" });
//         }

//         let missedTasksHtml = `<ul style="color: #b91c1c; font-weight: bold; background-color: #fee2e2; padding: 15px 30px; border-radius: 8px;">`;
//         incompleteTasks.forEach((task) => {
//           missedTasksHtml += `<li>${task.subjectName} - ${task.type} </li>`;
//         });
//         missedTasksHtml += `</ul>`;

//         emailSubject = `URGENT ALERT: Missing Submissions for Week ${workload.week}`;
//         emailHtml = `
//           <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px;">
//             <h2 style="color: #1f2937;">Hi Student,</h2>
//             <p>Your lecturer/admin has manually flagged that you have <strong>not submitted</strong> the following required assignments for Week ${workload.week}:</p>
//             ${missedTasksHtml}
//             <p>Please complete these immediately to avoid losing marks, and contact your lecturer if you need assistance.</p>
//           </div>
//         `;
//       }

//       // 4. Send the calculated email
//       await transporter.sendMail({
//         from: `"Academic Support Admin" <${process.env.EMAIL_USER}>`,
//         to: userRecord.email,
//         subject: emailSubject,
//         html: emailHtml,
//       });

//       console.log(`Manual admin email sent to ${userRecord.email} for Week ${week} (diffDays: ${diffDays})`);
//       return res.status(200).json({ success: true, message: "Email sent successfully based on schedule!" });

//     } catch (error) {
//       console.error("Error triggering manual email:", error);
//       return res.status(500).json({ error: "Failed to send warning email" });
//     }
//   });
// });
/**
 * POST /triggerManualWarningEmail
 * Smart function with SPAM PROTECTION
 */
const triggerManualWarningEmail = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    try {
      if (req.method !== "POST" && req.method !== "OPTIONS") return res.status(405).json({ error: "Method not allowed" });

      const { studentId, week } = req.body;
      if (!studentId || !week) return res.status(400).json({ error: "Missing studentId or week" });

      const snap = await db.collection("weekly_workload")
        .where("studentId", "==", studentId)
        .where("week", "==", Number(week))
        .limit(1)
        .get();

      if (snap.empty) return res.status(404).json({ error: "Workload not found" });

      const workloadDoc = snap.docs[0];
      const workload = workloadDoc.data();
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const weekStart = workload.weekStart.toDate();
      weekStart.setHours(0, 0, 0, 0);

      const diffTime = weekStart.getTime() - today.getTime();
      const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

      const userRecord = await admin.auth().getUser(studentId).catch(() => null);
      if (!userRecord || !userRecord.email) return res.status(404).json({ error: "Could not find student's email" });

      let emailSubject = "";
      let emailHtml = "";
      let fieldToUpdate = ""; // Tracks which phase we are sending

      if (diffDays > 1) {
        if (workload.earlyWarningSent) return res.status(400).json({ error: "Early warning already sent!" });
        
        // ... (Fetch AI Timetable logic remains exactly the same) ...
        const reminderSnap = await db.collection("busy_week_reminders")
          .where("studentId", "==", studentId).where("targetBusyWeek", "==", Number(week)).limit(1).get();
        let timetableHTML = "<p>No AI timetable was generated for this week.</p>";
        if (!reminderSnap.empty) timetableHTML = formatTimetableToHTML(reminderSnap.docs[0].data().timetable);

        emailSubject = `Action Required: Heavy Workload Approaching (Week ${week})`;
        emailHtml = `<h2>Hi Student,</h2><p>Next week (Week ${week}) is marked as <strong>${workload.status}</strong>.</p> ${timetableHTML}`;
        fieldToUpdate = "earlyWarningSent";

      } else if (diffDays === 1) {
        if (workload.dayBeforeReminderSent) return res.status(400).json({ error: "1-Day reminder already sent!" });
        
        // ... (Fetch AI Timetable logic remains exactly the same) ...
        const reminderSnap = await db.collection("busy_week_reminders")
          .where("studentId", "==", studentId).where("targetBusyWeek", "==", Number(week)).limit(1).get();
        let timetableHTML = "<p>No AI timetable was generated for this week.</p>";
        if (!reminderSnap.empty) timetableHTML = formatTimetableToHTML(reminderSnap.docs[0].data().timetable);

        emailSubject = `Tomorrow: Week ${week} Starts!`;
        emailHtml = `<h2>Hi Student,</h2><p>Your highly demanding week starts tomorrow.</p> ${timetableHTML}`;
        fieldToUpdate = "dayBeforeReminderSent";

      } else {
        if (workload.missingSubmissionWarningSent) return res.status(400).json({ error: "Missing submission warning already sent!" });
        
        const incompleteTasks = (workload.breakdown || []).filter((t) => t.isCompleted === false);
        if (incompleteTasks.length === 0) return res.status(400).json({ error: "Student completed all tasks." });

        let missedTasksHtml = `<ul>`;
        incompleteTasks.forEach((task) => missedTasksHtml += `<li>${task.subjectName}</li>`);
        missedTasksHtml += `</ul>`;

        emailSubject = `URGENT ALERT: Missing Submissions for Week ${workload.week}`;
        emailHtml = `<h2>Hi Student,</h2><p>You missed these submissions:</p> ${missedTasksHtml}`;
        fieldToUpdate = "missingSubmissionWarningSent";
      }

      // Send the calculated email
      await transporter.sendMail({
        from: `"Academic Support Admin" <${process.env.EMAIL_USER}>`,
        to: userRecord.email,
        subject: emailSubject,
        html: emailHtml,
      });

      // 🌟 NEW: Save to database that we sent it so the button locks!
      await workloadDoc.ref.update({ [fieldToUpdate]: true });

      console.log(`Manual admin email sent to ${userRecord.email} for Week ${week}`);
      return res.status(200).json({ success: true, message: "Email sent and logged successfully!" });

    } catch (error) {
      console.error("Error triggering manual email:", error);
      return res.status(500).json({ error: "Failed to send warning email" });
    }
  });
});
module.exports = {
  getAllWorkloads,
  updateTaskCompletion,
  triggerManualWarningEmail
};
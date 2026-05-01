
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


// // backend/functions/src/http/adminWorkloadController.js
// require("dotenv").config();
// const functions = require("firebase-functions");
// const admin = require("firebase-admin");
// const nodemailer = require("nodemailer");
// const cors = require("cors")({ origin: true });

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


// const formatTimetableToHTML = (timetable) => {
//   if (!timetable || timetable.length === 0)
//     return "<p>No specific tasks scheduled.</p>";

//   let html = `
//     <table border="1" cellpadding="10" style="border-collapse: collapse; width: 100%; text-align: left; font-family: sans-serif;">
//       <tr style="background-color: #fef3c7; color: #78350f;">
//         <th>Day</th><th>Subject</th><th>Task</th><th>Duration</th>
//       </tr>`;

//   // 1. Group the timetable items by their 'day' property
//   const groupedTimetable = timetable.reduce((acc, item) => {
//     if (!acc[item.day]) {
//       acc[item.day] = [];
//     }
//     acc[item.day].push(item);
//     return acc;
//   }, {});

//   // 2. Loop through each grouped day
//   for (const [day, tasks] of Object.entries(groupedTimetable)) {
//     tasks.forEach((item, index) => {
//       html += `<tr>`;

//       // ONLY print the "Day" cell if it is the very first task of that day.
//       // Use rowspan to stretch it down to match the number of tasks for this day.
//       if (index === 0) {
//         html += `<td rowspan="${tasks.length}" style="vertical-align: middle;"><strong>Day ${day}</strong></td>`;
//       }

//       // Print the rest of the columns normally for every row
//       html += `
//         <td>${item.subject}</td>
//         <td>${item.task}</td>
//         <td><span style="background-color: #fef3c7; padding: 4px 8px; border-radius: 4px; font-weight: bold; font-size: 12px; color: #78350f;">${item.hours}h</span></td>
//       </tr>`;
//     });
//   }

//   html += `</table>`;
//   return html;
// };

// /**
//  * GET /getAllWorkloads
//  * 🌟 FIXED: Maps BOTH Firebase UID and custom student_id to the email!
//  */
// /**
//  * GET /getAllWorkloads
//  * With detailed console logs to debug email mapping!
//  */
// const getAllWorkloads = functions.https.onRequest((req, res) => {
//   cors(req, res, async () => {
//     try {
//       console.log("=== STARTING WORKLOAD FETCH ===");
      
//       const snap = await db.collection("weekly_workload").get();
//       console.log(`Found ${snap.size} workload documents.`);
      
//       const usersSnap = await db.collection("users").get();
//       console.log(`Found ${usersSnap.size} user documents in the 'users' collection.`);
      
//       const emailMap = {};
      
//       usersSnap.forEach((doc) => {
//         const userData = doc.data();
        
//         if (userData.email) {
//           // 1. Map the long Firebase Document ID
//           emailMap[doc.id] = userData.email;
          
//           // 2. Map the custom student ID (if it exists)
//           if (userData.student_id) {
//             emailMap[userData.student_id] = userData.email;
//           }
//         } else {
//           console.log(`⚠️ Warning: User document ${doc.id} has no email field!`);
//         }
//       });

//       // Print the entire dictionary to the terminal so we can see what was mapped
//       console.log("✅ Final Email Dictionary Map:", emailMap);

//       const workloads = snap.docs.map((doc) => {
//         const data = doc.data();
//         const foundEmail = emailMap[data.studentId] || "Email not found";
        
//         // Print the matching process for every single workload
//         console.log(`-> Workload Doc: ${doc.id} | Searching for studentId: "${data.studentId}" | Result: ${foundEmail}`);

//         return {
//           id: doc.id,
//           ...data,
//           studentEmail: foundEmail,
//         };
//       });

//       console.log("=== FINISHED WORKLOAD FETCH ===");
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
//  * Smart function with SPAM PROTECTION
//  */
// const triggerManualWarningEmail = functions.https.onRequest((req, res) => {
//   cors(req, res, async () => {
//     try {
//       if (req.method !== "POST" && req.method !== "OPTIONS") return res.status(405).json({ error: "Method not allowed" });

//       const { studentId, week } = req.body;
//       if (!studentId || !week) return res.status(400).json({ error: "Missing studentId or week" });

//       const snap = await db.collection("weekly_workload")
//         .where("studentId", "==", studentId)
//         .where("week", "==", Number(week))
//         .limit(1)
//         .get();

//       if (snap.empty) return res.status(404).json({ error: "Workload not found" });

//       const workloadDoc = snap.docs[0];
//       const workload = workloadDoc.data();
      
//       const today = new Date();
//       today.setHours(0, 0, 0, 0);
//       const weekStart = workload.weekStart.toDate();
//       weekStart.setHours(0, 0, 0, 0);

//       const diffTime = weekStart.getTime() - today.getTime();
//       const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

//       const userRecord = await admin.auth().getUser(studentId).catch(() => null);
//       if (!userRecord || !userRecord.email) return res.status(404).json({ error: "Could not find student's email" });

//       let emailSubject = "";
//       let emailHtml = "";
//       let fieldToUpdate = ""; // Tracks which phase we are sending

//       if (diffDays > 1) {
//         if (workload.earlyWarningSent)
//           return res.status(400).json({ error: "Early warning already sent!" });

//         // ... (Fetch AI Timetable logic remains exactly the same) ...
//         const reminderSnap = await db
//           .collection("busy_week_reminders")
//           .where("studentId", "==", studentId)
//           .where("targetBusyWeek", "==", Number(week))
//           .limit(1)
//           .get();
//         let timetableHTML =
//           "<p>No AI timetable was generated for this week.</p>";
//         if (!reminderSnap.empty)
//           timetableHTML = formatTimetableToHTML(
//             reminderSnap.docs[0].data().timetable,
//           );

//         emailSubject = `Action Required: Heavy Workload Approaching (Week ${week})`;
//         emailHtml = `<h2>Hi Student,</h2><p>Next week (Week ${week}) is marked as <strong>${workload.status}</strong>.</p> ${timetableHTML}`;
//         fieldToUpdate = "earlyWarningSent";
//       } else if (diffDays === 1) {
//         if (workload.dayBeforeReminderSent)
//           return res
//             .status(400)
//             .json({ error: "1-Day reminder already sent!" });

//         // ... (Fetch AI Timetable logic remains exactly the same) ...
//         const reminderSnap = await db
//           .collection("busy_week_reminders")
//           .where("studentId", "==", studentId)
//           .where("targetBusyWeek", "==", Number(week))
//           .limit(1)
//           .get();
//         let timetableHTML =
//           "<p>No AI timetable was generated for this week.</p>";
//         if (!reminderSnap.empty)
//           timetableHTML = formatTimetableToHTML(
//             reminderSnap.docs[0].data().timetable,
//           );

//         emailSubject = `Tomorrow: Week ${week} Starts!`;
//         emailHtml = `<h2>Hi Student,</h2><p>Your highly demanding week starts tomorrow.</p> ${timetableHTML}`;
//         fieldToUpdate = "dayBeforeReminderSent";

//         // } else {
//         //   if (workload.missingSubmissionWarningSent) return res.status(400).json({ error: "Missing submission warning already sent!" });

//         //   const incompleteTasks = (workload.breakdown || []).filter((t) => t.isCompleted === false);
//         //   if (incompleteTasks.length === 0) return res.status(400).json({ error: "Student completed all tasks." });

//         //   let missedTasksHtml = `<ul>`;
//         //   incompleteTasks.forEach((task) => missedTasksHtml += `<li>${task.subjectName}</li>`);
//         //   missedTasksHtml += `</ul>`;

//         //   emailSubject = `URGENT ALERT: Missing Submissions for Week ${workload.week}`;
//         //   emailHtml = `<h2>Hi Student,</h2><p>You missed these submissions:</p> ${missedTasksHtml}`;
//         //   fieldToUpdate = "missingSubmissionWarningSent";
//         // }
//       } else {
//         if (workload.missingSubmissionWarningSent)
//           return res
//             .status(400)
//             .json({ error: "Missing submission warning already sent!" });

//         // 👇 FIX: Use !== true (or !t.isCompleted) so it catches 'undefined' tasks too!
//         const incompleteTasks = (workload.breakdown || []).filter(
//           (t) => t.isCompleted !== true,
//         );

//         if (incompleteTasks.length === 0)
//           return res
//             .status(400)
//             .json({ error: "Student completed all tasks." });

//         let missedTasksHtml = `<ul>`;
//         incompleteTasks.forEach(
//           (task) => (missedTasksHtml += `<li>${task.subjectName}</li>`),
//         );
//         missedTasksHtml += `</ul>`;

//         emailSubject = `URGENT ALERT: Missing Submissions for Week ${workload.week}`;
//         emailHtml = `<h2>Hi Student,</h2><p>You missed these submissions:</p> ${missedTasksHtml}`;
//         fieldToUpdate = "missingSubmissionWarningSent";
//       }

//       // Send the calculated email
//       await transporter.sendMail({
//         from: `"Academic Support Admin" <${process.env.EMAIL_USER}>`,
//         to: userRecord.email,
//         subject: emailSubject,
//         html: emailHtml,
//       });

//       // 🌟 NEW: Save to database that we sent it so the button locks!
//       await workloadDoc.ref.update({ [fieldToUpdate]: true });

//       console.log(`Manual admin email sent to ${userRecord.email} for Week ${week}`);
//       return res.status(200).json({ success: true, message: "Email sent and logged successfully!" });

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

const formatTimetableToHTML = (timetable) => {
  if (!timetable || timetable.length === 0)
    return "<p>No specific tasks scheduled.</p>";

  let html = `
    <table border="1" cellpadding="10" style="border-collapse: collapse; width: 100%; text-align: left; font-family: sans-serif;">
      <tr style="background-color: #fef3c7; color: #78350f;">
        <th>Day</th><th>Subject</th><th>Task</th><th>Duration</th>
      </tr>`;

  // 1. Group the timetable items by their 'day' property
  const groupedTimetable = timetable.reduce((acc, item) => {
    if (!acc[item.day]) {
      acc[item.day] = [];
    }
    acc[item.day].push(item);
    return acc;
  }, {});

  // 2. Loop through each grouped day
  for (const [day, tasks] of Object.entries(groupedTimetable)) {
    tasks.forEach((item, index) => {
      html += `<tr>`;

      // ONLY print the "Day" cell if it is the very first task of that day.
      // Use rowspan to stretch it down to match the number of tasks for this day.
      if (index === 0) {
        html += `<td rowspan="${tasks.length}" style="vertical-align: middle;"><strong>Day ${day}</strong></td>`;
      }

      // Print the rest of the columns normally for every row
      html += `
        <td>${item.subject}</td>
        <td>${item.task}</td>
        <td><span style="background-color: #fef3c7; padding: 4px 8px; border-radius: 4px; font-weight: bold; font-size: 12px; color: #78350f;">${item.hours}h</span></td>
      </tr>`;
    });
  }

  html += `</table>`;
  return html;
};

/**
 * GET /getAllWorkloads
 * 🌟 FIXED: Maps BOTH Firebase UID and custom student_id to the email!
 * With detailed console logs to debug email mapping!
 */
const getAllWorkloads = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    try {
      console.log("=== STARTING WORKLOAD FETCH ===");
      
      const snap = await db.collection("weekly_workload").get();
      console.log(`Found ${snap.size} workload documents.`);
      
      const usersSnap = await db.collection("users").get();
      console.log(`Found ${usersSnap.size} user documents in the 'users' collection.`);
      
      const emailMap = {};
      
      usersSnap.forEach((doc) => {
        const userData = doc.data();
        
        if (userData.email) {
          // 1. Map the long Firebase Document ID
          emailMap[doc.id] = userData.email;
          
          // 2. Map the custom student ID (if it exists)
          if (userData.student_id) {
            emailMap[userData.student_id] = userData.email;
          }
        } else {
          console.log(`⚠️ Warning: User document ${doc.id} has no email field!`);
        }
      });

      console.log("✅ Final Email Dictionary Map:", emailMap);

      const workloads = snap.docs.map((doc) => {
        const data = doc.data();
        const foundEmail = emailMap[data.studentId] || "Email not found";
        
        console.log(`-> Workload Doc: ${doc.id} | Searching for studentId: "${data.studentId}" | Result: ${foundEmail}`);

        return {
          id: doc.id,
          ...data,
          studentEmail: foundEmail, 
        };
      });

      console.log("=== FINISHED WORKLOAD FETCH ===");
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
 * Smart function with SPAM PROTECTION and custom studentId email lookup
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

      // 🌟 THE FIX: Look up email from Firestore, NOT just Firebase Auth!
      let recipientEmail = null;

      // 1. Try treating studentId as the Firebase Document UID
      const userDoc = await db.collection("users").doc(studentId).get();
      if (userDoc.exists && userDoc.data().email) {
        recipientEmail = userDoc.data().email;
      } else {
        // 2. If that fails, query by the custom "student_id" field (e.g., "S6000")
        const userQuery = await db.collection("users").where("student_id", "==", studentId).limit(1).get();
        if (!userQuery.empty && userQuery.docs[0].data().email) {
          recipientEmail = userQuery.docs[0].data().email;
        }
      }

      // If we still can't find it, abort
      if (!recipientEmail) {
        return res.status(404).json({ error: `Could not find email for student: ${studentId}` });
      }

      let emailSubject = "";
      let emailHtml = "";
      let fieldToUpdate = ""; // Tracks which phase we are sending

      if (diffDays > 1) {
        if (workload.earlyWarningSent)
          return res.status(400).json({ error: "Early warning already sent!" });

        const reminderSnap = await db
          .collection("busy_week_reminders")
          .where("studentId", "==", studentId)
          .where("targetBusyWeek", "==", Number(week))
          .limit(1)
          .get();
        let timetableHTML =
          "<p>No AI timetable was generated for this week.</p>";
        if (!reminderSnap.empty)
          timetableHTML = formatTimetableToHTML(
            reminderSnap.docs[0].data().timetable,
          );

        emailSubject = `Action Required: Heavy Workload Approaching (Week ${week})`;
        emailHtml = `<h2>Hi Student,</h2><p>Next week (Week ${week}) is marked as <strong>${workload.status}</strong>.</p> ${timetableHTML}`;
        fieldToUpdate = "earlyWarningSent";
        
      } else if (diffDays === 1) {
        if (workload.dayBeforeReminderSent)
          return res
            .status(400)
            .json({ error: "1-Day reminder already sent!" });

        const reminderSnap = await db
          .collection("busy_week_reminders")
          .where("studentId", "==", studentId)
          .where("targetBusyWeek", "==", Number(week))
          .limit(1)
          .get();
        let timetableHTML =
          "<p>No AI timetable was generated for this week.</p>";
        if (!reminderSnap.empty)
          timetableHTML = formatTimetableToHTML(
            reminderSnap.docs[0].data().timetable,
          );

        emailSubject = `Tomorrow: Week ${week} Starts!`;
        emailHtml = `<h2>Hi Student,</h2><p>Your highly demanding week starts tomorrow.</p> ${timetableHTML}`;
        fieldToUpdate = "dayBeforeReminderSent";

      } else {
        if (workload.missingSubmissionWarningSent)
          return res
            .status(400)
            .json({ error: "Missing submission warning already sent!" });

        // Use !== true (or !t.isCompleted) so it catches 'undefined' tasks too!
        const incompleteTasks = (workload.breakdown || []).filter(
          (t) => t.isCompleted !== true,
        );

        if (incompleteTasks.length === 0)
          return res
            .status(400)
            .json({ error: "Student completed all tasks." });

        let missedTasksHtml = `<ul>`;
        incompleteTasks.forEach(
          (task) => (missedTasksHtml += `<li>${task.subjectName}</li>`),
        );
        missedTasksHtml += `</ul>`;

        emailSubject = `URGENT ALERT: Missing Submissions for Week ${workload.week}`;
        emailHtml = `<h2>Hi Student,</h2><p>You missed these submissions:</p> ${missedTasksHtml}`;
        fieldToUpdate = "missingSubmissionWarningSent";
      }

      // Send the calculated email to the successfully found recipientEmail
      await transporter.sendMail({
        from: `"Academic Support Admin" <${process.env.EMAIL_USER}>`,
        to: recipientEmail,
        subject: emailSubject,
        html: emailHtml,
      });

      // 🌟 NEW: Save to database that we sent it so the button locks!
      await workloadDoc.ref.update({ [fieldToUpdate]: true });

      console.log(`Manual admin email sent to ${recipientEmail} for Week ${week}`);
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
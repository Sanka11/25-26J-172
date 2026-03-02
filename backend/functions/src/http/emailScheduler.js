// backend/functions/src/http/emailScheduler.js
require("dotenv").config();
const { onSchedule } = require("firebase-functions/v2/scheduler");
const admin = require("firebase-admin");
const nodemailer = require("nodemailer");

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
  admin.initializeApp();
}
const db = admin.firestore();

// Configure the Nodemailer transporter
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Helper function to convert the AI JSON timetable into an HTML table
const formatTimetableToHTML = (timetable) => {
  if (!timetable || timetable.length === 0) {
    return "<p>No specific tasks scheduled.</p>";
  }

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

// Production Cron Job: Runs every day at 8:00 AM Sri Lanka time
const dailyWorkloadEmailScheduler = onSchedule(
  {
    schedule: "every day 08:00",
    timeZone: "Asia/Colombo",
  },
  async (event) => {
    try {
      console.log("Starting daily email scheduler...");

      const today = new Date();
      today.setHours(0, 0, 0, 0); // Normalize to midnight

      // ==========================================
      // SCENARIO 1 & 2: PRE-WEEK TIMETABLE EMAILS
      // ==========================================
      const remindersSnap = await db
        .collection("busy_week_reminders")
        .where("isActive", "==", true)
        .get();

      for (const doc of remindersSnap.docs) {
        const reminder = doc.data();

        // Get user email from Firebase Auth
        const userRecord = await admin
          .auth()
          .getUser(reminder.studentId)
          .catch(() => null);

        if (!userRecord || !userRecord.email) continue;

        const targetStart = reminder.targetWeekStart.toDate();
        targetStart.setHours(0, 0, 0, 0);

        // Calculate exact difference in days
        const diffTime = targetStart.getTime() - today.getTime();
        const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

        const timetableHTML = formatTimetableToHTML(reminder.timetable);
        let shouldSend = false;
        let emailOptions = {
          from: `"Academic Support" <${process.env.EMAIL_USER}>`,
          to: userRecord.email,
          subject: "",
          html: "",
        };

        // SCENARIO 1: Exactly 7 days before
        if (diffDays === 7) {
          shouldSend = true;
          emailOptions.subject = `Action Required: Heavy Workload Approaching (Week ${reminder.targetBusyWeek})`;
          emailOptions.html = `
            <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px;">
              <h2 style="color: #1e40af;">Hi Student,</h2>
              <p>Next week (Week ${reminder.targetBusyWeek}) is marked as <strong>${reminder.targetStatus}</strong> with ${reminder.targetTotalHours} hours of work.</p>
              <h3 style="color: #d97706;">Your AI-Generated Study Plan:</h3>
              ${timetableHTML}
              <p>Start preparing now so you don't fall behind!</p>
            </div>
          `;
        }
        // SCENARIO 2: Exactly 1 day before
        else if (diffDays === 1) {
          shouldSend = true;
          emailOptions.subject = `Tomorrow: Week ${reminder.targetBusyWeek} Starts!`;
          emailOptions.html = `
            <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px;">
              <h2 style="color: #1e40af;">Hi Student,</h2>
              <p>Your highly demanding week starts tomorrow. Stick to this study schedule to manage your workload effectively:</p>
              ${timetableHTML}
              <p>Good luck!</p>
            </div>
          `;
        }

        if (shouldSend) {
          await transporter.sendMail(emailOptions);
          console.log(
            `Sent pre-week plan to ${userRecord.email} for Week ${reminder.targetBusyWeek}`,
          );
        }
      }

      // ==========================================
      // SCENARIO 3: POST-WEEK MISSING SUBMISSIONS
      // ==========================================

      // Calculate the date exactly 7 days ago
      const pastWeekDate = new Date(today);
      pastWeekDate.setDate(today.getDate() - 7);

      const startOfDay = new Date(pastWeekDate);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(pastWeekDate);
      endOfDay.setHours(23, 59, 59, 999);

      // Fetch workloads that started exactly one week ago
      const workloadSnap = await db
        .collection("weekly_workload")
        .where(
          "weekStart",
          ">=",
          admin.firestore.Timestamp.fromDate(startOfDay),
        )
        .where("weekStart", "<=", admin.firestore.Timestamp.fromDate(endOfDay))
        .where("status", "in", ["BUSY", "HEAVY", "OVERLOADED"])
        .get();

      for (const doc of workloadSnap.docs) {
        const workload = doc.data();

        // Validate the breakdown array exists
        if (!workload.breakdown || !Array.isArray(workload.breakdown)) continue;

        // Filter for specific tasks marked incomplete
        const incompleteTasks = workload.breakdown.filter(
          (task) => task.isCompleted === false,
        );

        if (incompleteTasks.length > 0) {
          const userRecord = await admin
            .auth()
            .getUser(workload.studentId)
            .catch(() => null);

          if (!userRecord || !userRecord.email) continue;

          // Build HTML list of exactly what they missed
          let missedTasksHtml = `<ul style="color: #b91c1c; font-weight: bold; background-color: #fee2e2; padding: 15px 30px; border-radius: 8px;">`;
          incompleteTasks.forEach((task) => {
            missedTasksHtml += `<li>${task.subjectName} - ${task.type} (${task.hours}h)</li>`;
          });
          missedTasksHtml += `</ul>`;

          await transporter.sendMail({
            from: `"Academic Support" <${process.env.EMAIL_USER}>`,
            to: userRecord.email,
            subject: `Action Required: Missing Submissions for Week ${workload.week}`,
            html: `
              <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px;">
                <h2 style="color: #1f2937;">Hi Student,</h2>
                <p>Week ${workload.week} has ended, but our records show you have <strong>not submitted</strong> the following assignments:</p>
                ${missedTasksHtml}
                <p>It is critical that you complete these as soon as possible. If you are struggling with these specific subjects, please reach out to your lecturer immediately.</p>
              </div>
            `,
          });
          console.log(
            `Sent specific missing submission email to ${userRecord.email} for Week ${workload.week}`,
          );
        }
      }

      console.log("Daily email scheduler finished successfully.");
    } catch (error) {
      console.error("Error in email scheduler:", error);
    }
  },
);

module.exports = { dailyWorkloadEmailScheduler };

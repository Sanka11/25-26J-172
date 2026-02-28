const functions = require("firebase-functions");
const admin = require("../firebase");

const db = admin.firestore();
const { GoogleGenAI } = require("@google/genai");
// const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const apiKey = process.env.GEMINI_API_KEY;

let ai = null;

if (apiKey) {
  ai = new GoogleGenAI({ apiKey });
  console.log("✅ Gemini AI initialized");
} else {
  console.error("❌ GEMINI_API_KEY missing — AI disabled");
}
/**
 * Generate Weekly Workload purely from SUBJECT data
 * Method: POST
 * Body: { studentId, semesterStartDate }
 */
const generateWorkload = functions.https.onRequest(async (req, res) => {
  try {
    if (req.method !== "POST") {
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

    /* 3️⃣ Weekly workload map (EXPLAINABLE) */
    const weeklyLoad = {};
    // week -> { totalHours, breakdown[] }

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

      // 🎓 Academic subjects
      if (sub.type === "ACADEMIC") {
        const t = sub.assessmentTimeline || {};
        const h = sub.estimatedHours || {};

        // Assignments
        t.assignments?.forEach((week) =>
          addLoad(week, {
            subjectId: sub.subjectId,
            subjectName: sub.subjectName,
            type: "ASSIGNMENT",
            hours: h.assignment || 6,
          }),
        );

        // Mid exam
        if (t.midExamWeek) {
          addLoad(t.midExamWeek, {
            subjectId: sub.subjectId,
            subjectName: sub.subjectName,
            type: "MID_EXAM",
            hours: h.midExam || 10,
          });
        }

        // Final exam
        if (t.finalExamWeek) {
          addLoad(t.finalExamWeek, {
            subjectId: sub.subjectId,
            subjectName: sub.subjectName,
            type: "FINAL_EXAM",
            hours: h.finalExam || 15,
          });
        }
      }

      // 🏭 Internship subject
      if (sub.type === "INTERNSHIP") {
        sub.submissionWeeks?.forEach((week) =>
          addLoad(week, {
            subjectId: sub.subjectId,
            subjectName: sub.subjectName,
            type: "INTERNSHIP_SUBMISSION",
            hours: sub.estimatedHoursPerSubmission || 8,
          }),
        );
      }
    });

    /* 5️⃣ Save weekly workload with explanation */
    const batch = db.batch();

    Object.entries(weeklyLoad).forEach(([week, data]) => {
      let status = "NORMAL";

      if (data.totalHours >= 20) status = "OVERLOADED";
      else if (data.totalHours >= 12) status = "BUSY";

      const weekStart = new Date(
        semesterStart.getTime() + (Number(week) - 1) * 7 * 86400000,
      );

      const ref = db.collection("weekly_workload").doc(`${studentId}_W${week}`);

      batch.set(ref, {
        studentId,
        week: Number(week),
        weekStart,
        totalHours: data.totalHours,
        status,
        breakdown: data.breakdown, // ⭐ EXPLAINABLE PART
        createdAt: new Date(),
      });
    });

    await batch.commit();

    return res.json({
      message: "Weekly workload generated (with explanations)",
      weeksAnalyzed: Object.keys(weeklyLoad).length,
    });
  } catch (err) {
    console.error("generateWorkload error:", err);
    res.status(500).json({ error: "Workload generation failed" });
  }
});

/**
 * Generate lecture alerts (manual trigger)
 */
const generateLectureAlerts = functions.https.onRequest(async (req, res) => {
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
const getWeeklyWorkload = functions.https.onRequest(async (req, res) => {
  try {
    if (req.method !== "GET") {
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

    // 🔴 FILTER ONLY BUSY / OVERLOADED
    const weeks = snap.docs
      .map((doc) => ({ id: doc.id, ...doc.data() }))
      .filter((w) => w.status == "NORMAL" || w.status == "BUSY");

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
const generateOverloadReminders = functions.https.onRequest(
  async (req, res) => {
    try {
      const { studentId } = req.body;

      if (!studentId) {
        return res.status(400).json({ error: "Missing studentId" });
      }

      // 1️⃣ Fetch overloaded weeks
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

        // 2️⃣ Weeks BEFORE overload
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
  },
);

// const generateBusyWeekReminders = functions.https.onRequest(
//   async (req, res) => {
//     try {
//       const { studentId } = req.body;

//       if (!studentId) {
//         return res.status(400).json({ error: "Missing studentId" });
//       }

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

//       // 3️⃣ Switched to a for...of loop to handle async await properly!
//       for (const doc of snap.docs) {
//         const data = doc.data();
//         const busyWeek = Number(data.week);
//         const weekStart = data.weekStart.toDate();

//         if (weekStart <= today) continue;

//         const reminderWeeks = [busyWeek - 2, busyWeek - 1];

//         for (const week of reminderWeeks) {
//           if (week <= 0) continue;

//           // 4️⃣ Extract the subject names from the breakdown to give the AI context
//           const subjectNames = data.breakdown
//             .map((b) => b.subjectName)
//             .join(" and ");

//           // 5️⃣ Create a prompt for the LLM
//           const prompt = `
//           Act as an encouraging academic advisor.
//           A student has an upcoming week labeled as "${data.status}".
//           They have ${data.totalHours} hours of expected work mostly involving: ${subjectNames}.
//           Write a short, empathetic 1 to 2 sentence push notification reminding them to start preparing in advance.
//           Keep it supportive, conversational, and actionable. Do not use hashtags.
//         `;

//           let aiMessage = `Week ${busyWeek} will be ${data.status.toLowerCase()}. Start preparation early.`; // Fallback message

//           try {
//             // 6️⃣ Call the LLM to generate the dynamic message
//             const response = await ai.models.generateContent({
//               model: "gemini-2.5-flash",
//               contents: prompt,
//             });
//             aiMessage = response.text.trim();
//           } catch (aiError) {
//             console.error("LLM failed, using fallback message:", aiError);
//           }

//           const reminderId = `${studentId}_${data.status}_W${busyWeek}_REM_W${week}`;
//           const ref = db.collection("busy_week_reminders").doc(reminderId);

//           batch.set(ref, {
//             studentId,
//             reminderWeek: week,
//             targetBusyWeek: busyWeek,
//             targetWeekStart: weekStart,
//             targetStatus: data.status,
//             targetTotalHours: data.totalHours,
//             targetBreakdown: data.breakdown,
//             type: "BUSY_WEEK_WARNING",
//             message: aiMessage, // 🌟 Save the AI-generated message here!
//             createdAt: new Date(),
//             isActive: true,
//             isDismissed: false,
//             dismissedAt: null,
//           });

//           reminderCount++;
//         }
//       }

//       await batch.commit();

//       return res.json({
//         message: "Dynamic AI busy week reminders generated",
//         remindersCreated: reminderCount,
//       });
//     } catch (err) {
//       console.error(err);
//       res.status(500).json({ error: "Failed to generate dynamic reminders" });
//     }
//   },
// );
const generateBusyWeekReminders = functions.https.onRequest(
  async (req, res) => {
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

          // 1️⃣ Extract subject names, hours, and types for accurate AI context
          const subjectDetails = data.breakdown
            .map((b) => `${b.hours} hours of ${b.subjectName} (${b.type})`)
            .join(", ");

          // 2️⃣ Create the prompt specifically asking for a JSON array
          const prompt = `
            You are an expert academic advisor. 
            A student has an upcoming week labeled as "${data.status}".
            They have a heavy workload of ${data.totalHours} hours.
            
            Here is the exact breakdown of their tasks:
            ${subjectDetails}

            Your job is to create a realistic 5-day study timetable (Day 1 to Day 5) to help them manage this specific workload.
            Distribute the total hours logically across the 5 days.
            Make the tasks highly specific to the subject names provided.
            
            You MUST return ONLY a valid JSON array. Do not include markdown formatting or extra text.
            
            Use this exact JSON format:
            [
              { "day": 1, "subject": "Name of Subject", "hours": 2, "task": "Specific actionable study task based on the subject" },
              { "day": 2, "subject": "Name of Subject", "hours": 3, "task": "Another specific task" }
            ]
          `;

          let aiTimetable = []; // Fallback empty array

          try {
            // 3️⃣ Call the LLM and FORCE the response to be application/json
            const response = await ai.models.generateContent({
              model: "gemini-2.5-flash",
              contents: prompt,
              config: {
                responseMimeType: "application/json",
              },
            });

            // 4️⃣ Parse the JSON string into a JavaScript array
            aiTimetable = JSON.parse(response.text.trim());
          } catch (aiError) {
            console.error("LLM failed or returned invalid JSON:", aiError);
            // Optional fallback if the AI fails
            aiTimetable = [
              {
                day: 1,
                subject: "Preparation",
                hours: 2,
                task: `Start preparing early for your ${data.status} week.`,
              },
            ];
          }

          const reminderId = `${studentId}_${data.status}_W${busyWeek}_REM_W${week}`;
          const ref = db.collection("busy_week_reminders").doc(reminderId);

          // 5️⃣ Save the array to Firestore
          batch.set(ref, {
            studentId,
            reminderWeek: week,
            targetBusyWeek: busyWeek,
            targetWeekStart: weekStart,
            targetStatus: data.status,
            targetTotalHours: data.totalHours,
            targetBreakdown: data.breakdown,
            type: "BUSY_WEEK_WARNING",
            timetable: aiTimetable, // 🌟 Save the structured JSON here!
            createdAt: new Date(),
            isActive: true,
            isDismissed: false,
            dismissedAt: null,
          });

          reminderCount++;
        }
      }

      await batch.commit();

      return res.json({
        message: "Dynamic AI busy week timetables generated",
        remindersCreated: reminderCount,
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to generate dynamic reminders" });
    }
  },
);


// Add this function to get active reminders
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
//     const oneWeekFromNow = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);

//     // SIMPLIFIED QUERY - Remove multiple where conditions temporarily
//     const snap = await db
//       .collection("busy_week_reminders")
//       .where("studentId", "==", studentId)
//       .get();

//     // Filter in JavaScript instead of Firestore query
//     const reminders = snap.docs
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
//           reminder.targetWeekStart <= oneWeekFromNow,
//       );

//     return res.json({
//       studentId,
//       count: reminders.length,
//       reminders,
//     });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ error: "Failed to fetch reminders" });
//   }
// });
const getActiveReminders = functions.https.onRequest(async (req, res) => {
  try {
    if (req.method !== "GET") {
      return res.status(405).send("Method Not Allowed");
    }

    const { studentId } = req.query;
    if (!studentId) {
      return res.status(400).json({ error: "Missing studentId" });
    }

    const today = new Date();
    // Look ahead 14 days so we can catch upcoming weeks properly
    const twoWeeksFromNow = new Date(
      today.getTime() + 14 * 24 * 60 * 60 * 1000,
    );

    const snap = await db
      .collection("busy_week_reminders")
      .where("studentId", "==", studentId)
      .get();

    // 1️⃣ Filter the active reminders
    const allActiveReminders = snap.docs
      .map((doc) => ({
        id: doc.id,
        ...doc.data(),
        targetWeekStart: doc.data().targetWeekStart.toDate(),
        createdAt: doc.data().createdAt.toDate(),
      }))
      .filter(
        (reminder) =>
          reminder.isActive === true &&
          reminder.isDismissed === false &&
          reminder.targetWeekStart > today &&
          reminder.targetWeekStart <= twoWeeksFromNow,
      );

    // 2️⃣ DEDUPLICATE: Only keep ONE reminder per target busy week
    const uniqueRemindersMap = new Map();

    allActiveReminders.forEach((reminder) => {
      const targetWeek = reminder.targetBusyWeek;

      if (!uniqueRemindersMap.has(targetWeek)) {
        uniqueRemindersMap.set(targetWeek, reminder);
      } else {
        // If we already have a reminder for this week, keep the latest one
        // (e.g., keep the W3 reminder instead of the W2 reminder for a Week 4 target)
        const existingReminder = uniqueRemindersMap.get(targetWeek);
        if (reminder.reminderWeek > existingReminder.reminderWeek) {
          uniqueRemindersMap.set(targetWeek, reminder);
        }
      }
    });

    // Convert the Map back into an array
    const finalReminders = Array.from(uniqueRemindersMap.values());

    return res.json({
      studentId,
      count: finalReminders.length,
      reminders: finalReminders, // 🌟 Now it only returns 1 alert per busy week!
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch reminders" });
  }
});

/**
 * Get Enrolled Subjects for a student
 * Method: GET
 * Query: ?studentId=UID
 */
const getEnrolledSubjects = functions.https.onRequest(async (req, res) => {
  try {
    if (req.method !== "GET") {
      return res.status(405).send("Method Not Allowed");
    }

    const { studentId } = req.query;

    if (!studentId) {
      return res.status(400).json({ error: "Missing studentId" });
    }

    // 1️⃣ Get enrollment document
    const enrollSnap = await db
      .collection("student_enrollments")
      .doc(studentId)
      .get();

    if (!enrollSnap.exists) {
      return res.status(404).json({ error: "Student not enrolled" });
    }

    const subjectIds = enrollSnap.data().subjects || [];

    // 2️⃣ Load subject details
    const subjects = await Promise.all(
      subjectIds.map(async (id) => {
        const snap = await db.collection("subjects").doc(id).get();
        if (!snap.exists) return null;

        const data = snap.data();

        return {
          subjectId: data.subjectId,
          subjectName: data.subjectName, // ✅ display name
          type: data.type,
          deliveryMode: data.deliveryMode || "PHYSICAL",
          lectureDays: data.lectureDays || [],
          lectureStartTime: data.lectureStartTime || null,
          lectureEndTime: data.lectureEndTime || null,

          // ✅ ADD THIS
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
// Add this function to dismiss a reminder
const dismissReminder = functions.https.onRequest(async (req, res) => {
  try {
    if (req.method !== "POST") {
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


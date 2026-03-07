const functions = require("firebase-functions");
const admin = require("../firebase");
require("dotenv").config();
const db = admin.firestore();
const Groq = require("groq-sdk");

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
  admin.initializeApp();
}

// Initialize Groq as a constant
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

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

    const weeks = snap.docs
      .map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }))
      .sort((a, b) => a.week - b.week);

    return res.json({
      studentId,
      totalWeeks: weeks.length,
      weeks,
    });
  } catch (err) {
    console.error("getWeeklyWorkload error:", err);
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
/**
 * Cloud Function to generate AI-powered study reminders for busy weeks.
 * Uses Groq (Llama 3.3 70B) for high-speed, structured JSON output.
 */

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

          // --- 1. UPDATED: Clearer Subject Breakdown for the AI ---
          const subjectDetails = data.breakdown
            .map(
              (b) =>
                `- Subject: "${b.subjectName}" | Required Study: ${b.hours} hours | Assessment Type: ${b.type}`,
            )
            .join("\n");

          // --- 1. THE ENHANCED PROMPT WITH KNOWLEDGE INJECTION ---
          const prompt = `
You are an expert academic tutor and study planner.

A student has a BUSY week approaching with a total workload of ${data.totalHours} hours.

Here is the EXACT breakdown of their subjects:
${subjectDetails}

Your task is to create a highly personalized, balanced 5-day study timetable. 

CRITICAL PERSONALIZATION RULES:
1. 100% COVERAGE: Include study sessions for EVERY single subject listed above. Do not skip any.
2. PROPORTIONAL HOURS: Allocate the total hours for each subject across the 5 days to match the required hours.
3. KNOWLEDGE INJECTION (IDENTIFY DIFFICULTIES): For every subject, use your knowledge of university curricula to identify 2-3 commonly difficult or core concepts. 
   - Example: If the subject is "Data Structures", identify "Trees, Graphs, Pointers". 
   - Example: If the subject is "OOP", identify "Polymorphism, Inheritance, Interfaces".
4. CONTEXTUAL TASKS: Integrate those difficult concepts into actionable tasks based on the assessment type (e.g., "Draft code focusing on Polymorphism for the OOP assignment", or "Revise Graph traversal algorithms for the final exam").
5. DAILY BALANCE: Distribute the total ${data.totalHours} hours evenly across the 5 days.

OUTPUT FORMAT:
Return ONLY a valid JSON object with a single key called "timetable" containing an array. 
You MUST include a "focusTopics" field that lists the difficult concepts you identified.

Example:
{
  "timetable": [
    { 
      "day": 1, 
      "subject": "Object Oriented Programming", 
      "hours": 2, 
      "task": "Review core concepts and practice implementing interfaces. Focus on understanding how memory allocation works.",
      "focusTopics": "Interfaces, Memory Allocation, Polymorphism" 
    },
    { 
      "day": 1, 
      "subject": "Data Structures", 
      "hours": 1.5, 
      "task": "Solve practice problems involving nested loops and array manipulation for the midterm.",
      "focusTopics": "Nested Loops, Multi-dimensional Arrays" 
    }
  ]
}
`;

          let aiTimetable = [];

          try {
            console.log("Calling Groq API for advanced timetable...");

            const completion = await groq.chat.completions.create({
              model: "llama-3.3-70b-versatile",
              messages: [
                {
                  role: "system",
                  content:
                    "You are an expert tutor. You generate structured study plans and return ONLY JSON objects. Never return conversational text.",
                },
                {
                  role: "user",
                  content: prompt,
                },
              ],
              response_format: { type: "json_object" },
              temperature: 0.7, // 0.7 gives the AI enough creativity to think of good topics
            });

            let content = completion.choices[0].message.content;
            console.log("AI raw response:", content);

            // Clean up potential markdown backticks
            content = content
              .replace(/```json/gi, "")
              .replace(/```/g, "")
              .trim();

            let parsed;
            parsed = JSON.parse(content);

            // Extract the timetable array from the object
            if (parsed && parsed.timetable && Array.isArray(parsed.timetable)) {
              aiTimetable = parsed.timetable;
            } else {
              throw new Error("AI did not return a 'timetable' array");
            }

            if (aiTimetable.length === 0) {
              throw new Error("AI returned an empty timetable");
            }

            console.log(
              "Successfully generated AI timetable with focus topics!",
            );
          } catch (aiError) {
            console.error(
              "AI generation failed! Using fallback. Error:",
              aiError.message,
            );

            // Advanced Fallback timetable just in case
            aiTimetable = [
              {
                day: 1,
                subject: "Planning",
                hours: 2,
                task: "Review upcoming assignments and deadlines",
                focusTopics: "Time Management",
              },
              {
                day: 2,
                subject: "Study",
                hours: 3,
                task: "Revise lecture notes and important concepts",
                focusTopics: "Core Concepts",
              },
              {
                day: 3,
                subject: "Practice",
                hours: 2,
                task: "Solve practice exercises",
                focusTopics: "Problem Solving",
              },
              {
                day: 4,
                subject: "Assignments",
                hours: 3,
                task: "Work on assignment draft",
                focusTopics: "Drafting, Formatting",
              },
              {
                day: 5,
                subject: "Preparation",
                hours: 2,
                task: "Prepare for upcoming assessments",
                focusTopics: "Exam Prep",
              },
            ];
          }
          console.log("Final timetable:", aiTimetable);

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
        message: "AI study plans generated successfully",
        remindersCreated: reminderCount,
      });
    } catch (err) {
      console.error("generateBusyWeekReminders error:", err);

      res.status(500).json({
        error: "Failed to generate reminders",
      });
    }
  },
);

const getActiveReminders = functions.https.onRequest(async (req, res) => {
  try {
    if (req.method !== "GET") {
      return res.status(405).send("Method Not Allowed");
    }

    const { studentId, currentWeek } = req.query;

    if (!studentId) {
      return res.status(400).json({ error: "Missing studentId" });
    }

    if (!currentWeek) {
      return res.status(400).json({ error: "Missing currentWeek" });
    }

    const currentWeekNum = Number(currentWeek);

    console.log("📥 getActiveReminders request");
    console.log("Student:", studentId);
    console.log("Current Week:", currentWeekNum);

    const snap = await db
      .collection("busy_week_reminders")
      .where("studentId", "==", studentId)
      .get();

    if (snap.empty) {
      return res.json({
        studentId,
        count: 0,
        reminders: [],
      });
    }

    // Convert firestore docs
    const reminders = snap.docs.map((doc) => {
      const data = doc.data();

      return {
        id: doc.id,
        ...data,
        reminderWeek: Number(data.reminderWeek),
        targetBusyWeek: Number(data.targetBusyWeek),
        targetWeekStart: data.targetWeekStart?.toDate?.() || null,
        createdAt: data.createdAt?.toDate?.() || null,
      };
    });

    console.log("Total reminders in DB:", reminders.length);

    /*
      RULE:
      show reminder when

      reminderWeek <= currentWeek
      AND
      targetBusyWeek > currentWeek
    */

    const validReminders = reminders.filter((reminder) => {
      return (
        reminder.isActive === true &&
        reminder.isDismissed === false &&
        reminder.reminderWeek <= currentWeekNum &&
        reminder.targetBusyWeek > currentWeekNum
      );
    });

    console.log("Valid reminders after filter:", validReminders.length);

    /*
      If multiple reminders exist for same busy week
      keep the closest reminder week
    */

    const reminderMap = new Map();

    validReminders.forEach((reminder) => {
      const busyWeek = reminder.targetBusyWeek;

      if (!reminderMap.has(busyWeek)) {
        reminderMap.set(busyWeek, reminder);
      } else {
        const existing = reminderMap.get(busyWeek);

        if (reminder.reminderWeek > existing.reminderWeek) {
          reminderMap.set(busyWeek, reminder);
        }
      }
    });

    const finalReminders = Array.from(reminderMap.values());

    console.log("Final reminders returned:", finalReminders.length);

    return res.json({
      studentId,
      currentWeek: currentWeekNum,
      count: finalReminders.length,
      reminders: finalReminders,
    });
  } catch (err) {
    console.error("❌ getActiveReminders error:", err);

    res.status(500).json({
      error: "Failed to fetch reminders",
    });
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

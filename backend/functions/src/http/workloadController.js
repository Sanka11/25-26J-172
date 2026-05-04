const functions = require("firebase-functions");
const admin = require("../firebase");
require("dotenv").config();
const db = admin.firestore();
const Groq = require("groq-sdk");

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
  admin.initializeApp();
}

// Initialize Groq conditionally (only if API key is available)
let groq = null;
if (process.env.GROQ_API_KEY) {
  groq = new Groq({
    apiKey: process.env.GROQ_API_KEY,
  });
} else {
  console.warn(
    "GROQ_API_KEY not found - AI timetable generation will be unavailable",
  );
}

// 🌟 ADDED: Helper function to convert Firebase Auth UID into custom student_id (e.g., "S5004")
const resolveStudentId = async (providedId) => {
  if (!providedId) return null;
  try {
    const userDoc = await db.collection("users").doc(providedId).get();
    if (userDoc.exists && userDoc.data().student_id) {
      return userDoc.data().student_id; // Successfully found S5004, S5003, etc.
    }
  } catch (err) {
    console.error("Error resolving student ID:", err);
  }
  // If it's already "S5004" or not found, just return it as-is
  return providedId;
};

const generateWorkload = functions.https.onRequest(async (req, res) => {
  try {
    if (req.method !== "POST") {
      return res.status(405).send("Method Not Allowed");
    }

    const { studentId, semesterStartDate } = req.body;

    if (!studentId || !semesterStartDate) {
      return res.status(400).json({ error: "Missing fields" });
    }

    // 🌟 FIX: Convert the incoming ID to the custom student_id
    const actualStudentId = await resolveStudentId(studentId);
    const semesterStart = new Date(semesterStartDate);

    /* 1️⃣ Get enrolled subjects using the custom ID (e.g., S5004) */
    const enrollSnap = await db
      .collection("student_enrollments")
      .doc(actualStudentId)
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

    const addLoad = (week, entry) => {
      if (!weeklyLoad[week]) {
        weeklyLoad[week] = {
          totalHours: 0,
          breakdown: [],
        };
      }

      weeklyLoad[week].totalHours += entry.hours;

      weeklyLoad[week].breakdown.push({
        ...entry,
        isCompleted: false,
      });
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
          }),
        );

        if (t.midExamWeek) {
          addLoad(t.midExamWeek, {
            subjectId: sub.subjectId,
            subjectName: sub.subjectName,
            type: "MID_EXAM",
            hours: h.midExam || 10,
          });
        }

        if (t.finalExamWeek) {
          addLoad(t.finalExamWeek, {
            subjectId: sub.subjectId,
            subjectName: sub.subjectName,
            type: "FINAL_EXAM",
            hours: h.finalExam || 15,
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
          }),
        );
      }
    });

    /* 5️⃣ Save weekly workload using actualStudentId */
    const batch = db.batch();

    Object.entries(weeklyLoad).forEach(([week, data]) => {
      let status = "NORMAL";

      if (data.totalHours >= 20) status = "OVERLOADED";
      else if (data.totalHours >= 12) status = "BUSY";

      const weekStart = new Date(
        semesterStart.getTime() + (Number(week) - 1) * 7 * 86400000,
      );

      // Save it under S5004_W1, etc.
      const ref = db
        .collection("weekly_workload")
        .doc(`${actualStudentId}_W${week}`);

      batch.set(ref, {
        studentId: actualStudentId, // Save the S5004 ID inside the document
        week: Number(week),
        weekStart,
        totalHours: data.totalHours,
        status,
        breakdown: data.breakdown,
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

    // 🌟 FIX: Convert to custom student_id
    const actualStudentId = await resolveStudentId(studentId);

    const snap = await db
      .collection("weekly_workload")
      .where("studentId", "==", actualStudentId)
      .get();

    const weeks = snap.docs
      .map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }))
      .sort((a, b) => a.week - b.week);

    return res.json({
      studentId: actualStudentId,
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

      // 🌟 FIX: Convert to custom student_id
      const actualStudentId = await resolveStudentId(studentId);

      const snap = await db
        .collection("weekly_workload")
        .where("studentId", "==", actualStudentId)
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
            .doc(`${actualStudentId}_OVERLOAD_W${overloadedWeek}_REM_W${week}`);

          batch.set(ref, {
            studentId: actualStudentId,
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


const generateBusyWeekReminders = functions.https.onRequest(
  async (req, res) => {
    try {
      const { studentId } = req.body;

      if (!studentId) {
        return res.status(400).json({ error: "Missing studentId" });
      }

      const actualStudentId = await resolveStudentId(studentId);

      const snap = await db
        .collection("weekly_workload")
        .where("studentId", "==", actualStudentId)
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

      // Loop through the busy weeks
      for (const doc of snap.docs) {
        const data = doc.data();
        const busyWeek = Number(data.week);
        const weekStart = data.weekStart.toDate();

        if (weekStart <= today) continue;

        // 🌟 FIX: Move the prompt generation OUTSIDE the reminder loop.
        // We only need to generate the timetable ONCE per busy week!
        const subjectDetails = data.breakdown
          .map(
            (b) =>
              `- Subject: "${b.subjectName}" | Required Study: ${b.hours} hours | Assessment Type: ${b.type}`,
          )
          .join("\n");

        // 🌟 THE NEW STRICT PROMPT (Replace the old prompt in your backend with this)
        const prompt = `
You are an expert academic tutor and study planner.

A student has a BUSY week approaching with a total workload of ${data.totalHours} hours.

Here is the EXACT breakdown of their subjects:
${subjectDetails}

Your task is to create a highly personalized, balanced 5-day study timetable. 

CRITICAL PERSONALIZATION RULES:
1. 100% COVERAGE: Include study sessions for EVERY single subject listed above. Do not skip any.
2. PROPORTIONAL HOURS: Allocate the total hours for each subject across the 5 days to match the required hours. Use clean numbers (e.g., 2, 3, or 1.5).
3. KNOWLEDGE INJECTION: Identify 2-3 commonly difficult or core concepts for each subject.
4. CONTEXTUAL TASKS: Integrate those difficult concepts into detailed, actionable sentences (e.g., "Review the syllabus and practice writing sample code...").
5. DAILY BALANCE: Distribute the total ${data.totalHours} hours evenly across the 5 days.

STRICT OUTPUT FORMAT:
You MUST return ONLY a JSON object with a single key "timetable". The value MUST be a FLAT array of objects matching this EXACT schema. Do NOT nest tasks or subjects.

Example:
{
  "timetable": [
    { 
      "day": "Day 1", 
      "subject": "Programming Fundamentals", 
      "hours": 3, 
      "task": "Review the syllabus, create a list of key terms, and practice writing sample code.",
      "focusTopics": "Variables, Data Types, Control Flow" 
    },
    { 
      "day": "Day 1", 
      "subject": "Industry Internship", 
      "hours": 2, 
      "task": "Research companies for potential summer internships and draft a cover letter.",
      "focusTopics": "Research, Communication" 
    }
  ]
}
`;
        let aiTimetable = [];

        try {
          console.log(`Calling Groq API ONCE for Week ${busyWeek} workload...`);

          if (!groq) {
            throw new Error(
              "Groq API not configured - GROQ_API_KEY is missing",
            );
          }

          const completion = await groq.chat.completions.create({
            model: "llama-3.1-8b-instant", //llama-3.1-8b-instant   llama-3.3-70b-versatile
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
            temperature: 0.7,
          });

          let content = completion.choices[0].message.content;

          content = content
            .replace(/```json/gi, "")
            .replace(/```/g, "")
            .trim();

          let parsed = JSON.parse(content);

          if (parsed && parsed.timetable && Array.isArray(parsed.timetable)) {
            aiTimetable = parsed.timetable;
          } else {
            throw new Error("AI did not return a 'timetable' array");
          }

          if (aiTimetable.length === 0) {
            throw new Error("AI returned an empty timetable");
          }

          console.log(
            `Successfully generated AI timetable for Week ${busyWeek}!`,
          );
        } catch (aiError) {
          console.error(
            `AI generation failed for Week ${busyWeek}! Using fallback. Error:`,
            aiError.message,
          );

          aiTimetable = [
            {
              day: 1,
              subject: "Planning",
              hours: 2,
              task: "Review upcoming assignments and deadlines",
              focusTopics: "Time Management",
            },
          ];
        }

        // 🌟 NOW loop through the reminder weeks and attach the ALREADY GENERATED timetable
        const reminderWeeks = [busyWeek - 2, busyWeek - 1];

        for (const week of reminderWeeks) {
          if (week <= 0) continue;

          const reminderId = `${actualStudentId}_W${busyWeek}_REM_W${week}`;
          const ref = db.collection("busy_week_reminders").doc(reminderId);

          batch.set(ref, {
            studentId: actualStudentId,
            reminderWeek: week,
            targetBusyWeek: busyWeek,
            targetWeekStart: weekStart,
            targetStatus: data.status,
            targetTotalHours: data.totalHours,
            type: "BUSY_WEEK_WARNING",
            timetable: aiTimetable, // Both reminders get the same timetable!
            createdAt: new Date(),
            isActive: true,
            isDismissed: false,
          });

          reminderCount++;
        }

        // Optional: Small delay between processing different busy weeks to completely prevent rate limits
        if (snap.docs.length > 1) {
          await new Promise((resolve) => setTimeout(resolve, 500));
        }
      }

      await batch.commit();

      return res.json({
        message: "AI study plans generated successfully",
        remindersCreated: reminderCount,
      });
    } catch (err) {
      console.error("generateBusyWeekReminders error:", err);
      res.status(500).json({ error: "Failed to generate reminders" });
    }
  },
);
const getActiveReminders = functions.https.onRequest(async (req, res) => {
  try {
    if (req.method !== "GET") {
      return res.status(405).send("Method Not Allowed");
    }

    const { studentId, currentWeek } = req.query;

    if (!studentId || !currentWeek) {
      return res.status(400).json({ error: "Missing parameters" });
    }

    // 🌟 FIX: Convert to custom student_id
    const actualStudentId = await resolveStudentId(studentId);
    const currentWeekNum = Number(currentWeek);

    const snap = await db
      .collection("busy_week_reminders")
      .where("studentId", "==", actualStudentId)
      .get();

    if (snap.empty) {
      return res.json({
        studentId: actualStudentId,
        count: 0,
        reminders: [],
      });
    }

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

    const validReminders = reminders.filter((reminder) => {
      return (
        reminder.isActive === true &&
        reminder.isDismissed === false &&
        reminder.reminderWeek <= currentWeekNum &&
        reminder.targetBusyWeek > currentWeekNum
      );
    });

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

    return res.json({
      studentId: actualStudentId,
      currentWeek: currentWeekNum,
      count: finalReminders.length,
      reminders: finalReminders,
    });
  } catch (err) {
    console.error("❌ getActiveReminders error:", err);
    res.status(500).json({ error: "Failed to fetch reminders" });
  }
});

const getEnrolledSubjects = functions.https.onRequest(async (req, res) => {
  try {
    if (req.method !== "GET") {
      return res.status(405).send("Method Not Allowed");
    }

    const { studentId } = req.query;

    if (!studentId) {
      return res.status(400).json({ error: "Missing studentId" });
    }

    // 🌟 FIX: Convert to custom student_id
    const actualStudentId = await resolveStudentId(studentId);

    const enrollSnap = await db
      .collection("student_enrollments")
      .doc(actualStudentId)
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
      studentId: actualStudentId,
      subjects: subjects.filter(Boolean),
    });
  } catch (err) {
    console.error("getEnrolledSubjects error:", err);
    res.status(500).json({ error: "Failed to fetch enrolled subjects" });
  }
});

const dismissReminder = functions.https.onRequest(async (req, res) => {
  try {
    if (req.method !== "POST") {
      return res.status(405).send("Method Not Allowed");
    }

    const { reminderId, studentId } = req.body;
    if (!reminderId || !studentId) {
      return res.status(400).json({ error: "Missing fields" });
    }

    // 🌟 FIX: Convert to custom student_id
    const actualStudentId = await resolveStudentId(studentId);

    const ref = db.collection("busy_week_reminders").doc(reminderId);
    const doc = await ref.get();

    if (!doc.exists) {
      return res.status(404).json({ error: "Reminder not found" });
    }

    if (doc.data().studentId !== actualStudentId) {
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
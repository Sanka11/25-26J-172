const functions = require("firebase-functions");
const admin = require("../firebase");

const db = admin.firestore();

/**
 * Generate Daily & Weekly Workload for a Student
 * Method: POST
 * Body: { studentId: string, startDate: string, endDate: string }
 */
const generateWorkload = functions.https.onRequest(async (req, res) => {
  try {
    if (req.method !== "POST") {
      return res.status(405).send("Method Not Allowed");
    }

    const { studentId, startDate, endDate } = req.body || {};

    if (!studentId || !startDate || !endDate) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // ---------- Helper ----------
    const formatDate = (date) => date.toISOString().split("T")[0];

    // ---------- Fetch internship ----------
    const internshipSnap = await db
      .collection("internships")
      .doc(studentId)
      .get();

    const internship = internshipSnap.exists ? internshipSnap.data() : null;

    // ---------- Fetch academic events ----------
    const eventsSnap = await db
      .collection("academic_events")
      .where("studentId", "==", studentId)
      .get();

    const events = eventsSnap.docs.map((doc) => doc.data());

    // ---------- Iterate days ----------
    let current = new Date(startDate);
    const end = new Date(endDate);

    const batch = db.batch();
    let weeklyLoad = 0;
    let overloadedDays = 0;

    while (current <= end) {
      let dailyLoad = 0;
      const dayName = current.toLocaleDateString("en-US", {
        weekday: "long",
      });
      const dateStr = formatDate(current);

      // 1️⃣ Internship load
      if (
        internship &&
        internship.workingDays &&
        internship.workingDays.includes(dayName)
      ) {
        dailyLoad += 8; // internship full day
      }

      // 2️⃣ Academic events load
      events.forEach((event) => {
        const eventDate = formatDate(event.date.toDate());
        if (eventDate === dateStr) {
          dailyLoad += event.estimatedHours;
        }
      });

      // 3️⃣ Load status
      let loadStatus = "NORMAL";
      if (dailyLoad >= 10) {
        loadStatus = "OVERLOADED";
        overloadedDays++;
      } else if (dailyLoad >= 6) {
        loadStatus = "BUSY";
      }

      weeklyLoad += dailyLoad;

      // 4️⃣ Save daily workload
      const docRef = db
        .collection("daily_workload")
        .doc(`${studentId}_${dateStr}`);

      batch.set(docRef, {
        studentId,
        date: dateStr,
        totalLoad: dailyLoad,
        loadStatus,
        created_at: new Date(),
      });

      current.setDate(current.getDate() + 1);
    }

    // ---------- Commit batch ----------
    await batch.commit();

    return res.status(200).json({
      message: "Workload generated successfully",
      studentId,
      totalWeeklyLoad: weeklyLoad,
      overloadedDays,
    });
  } catch (error) {
    console.error("Generate workload error:", error);
    return res.status(500).json({ error: "Failed to generate workload" });
  }
});
/**
 * Get Daily Workload for a Student
 * Method: GET
 * Query: ?studentId=S001
 */



const getDailyWorkload = functions.https.onRequest(async (req, res) => {
  try {
    if (req.method !== "GET") {
      return res.status(405).send("Method Not Allowed");
    }

    const { studentId } = req.query;

    if (!studentId) {
      return res.status(400).json({ error: "Missing studentId" });
    }

    const snapshot = await db
      .collection("daily_workload")
      .where("studentId", "==", studentId)
      .get(); // ❗ NO orderBy for now

    const data = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return res.status(200).json(data);
  } catch (error) {
    console.error("getDailyWorkload error:", error);
    return res.status(500).json({ error: "Failed to fetch workload" });
  }
});


const generateAcademicEvents = functions.https.onRequest(async (req, res) => {
  const { studentId, semesterStartDate } = req.body;

  const enrollSnap = await db
    .collection("student_enrollments")
    .doc(studentId)
    .get();

  const subjects = enrollSnap.data().subjects;

  subjects.forEach(async (subjectId) => {
    const sub = await db.collection("subjects").doc(subjectId).get();
    const t = sub.data().assessmentTimeline;

    const base = new Date(semesterStartDate);

    const makeDate = (w) => new Date(base.getTime() + (w - 1) * 7 * 86400000);

    await db.collection("academic_events").add({
      studentId,
      subjectId,
      type: "final_exam",
      date: makeDate(t.finalExamWeek),
      estimatedHours: 8,
    });
  });

  res.json({ success: true });
});

module.exports = {
  generateWorkload,
  getDailyWorkload,
  generateAcademicEvents,
};

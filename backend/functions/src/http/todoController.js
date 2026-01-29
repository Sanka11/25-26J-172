const functions = require("firebase-functions");
const admin = require("firebase-admin");
const db = admin.firestore();

const generateStudentTodos = functions.https.onRequest(async (req, res) => {
  try {
    const { studentId, semesterStartDate } = req.body;

    const today = new Date();
    const twoWeeksLater = new Date();
    twoWeeksLater.setDate(today.getDate() + 14);

    // 1️⃣ Get academic events
    const eventsSnap = await db
      .collection("academic_events")
      .where("studentId", "==", studentId)
      .get();

    // 2️⃣ Get internship submissions
    const enrollSnap = await db
      .collection("student_enrollments")
      .doc(studentId)
      .get();

    const enrollment = enrollSnap.data();

    let todos = [];

    // ---------- Academic tasks ----------
    eventsSnap.docs.forEach((doc) => {
      const event = doc.data();
      const dueDate = event.date.toDate();

      if (dueDate >= today && dueDate <= twoWeeksLater) {
        const daysRemaining = Math.ceil(
          (dueDate - today) / (1000 * 60 * 60 * 24),
        );

        todos.push({
          studentId,
          type: event.type,
          title: `${event.subjectId} ${event.type.replace("_", " ")}`,
          subjectId: event.subjectId,
          dueDate,
          daysRemaining,
          priority: daysRemaining <= 7 ? "HIGH" : "MEDIUM",
          createdAt: new Date(),
        });
      }
    });

    // ---------- Internship weekly submissions ----------
    if (enrollment.internshipId) {
      const internSnap = await db
        .collection("internship_modules")
        .doc(enrollment.internshipId)
        .get();

      internSnap.data().submissionWeeks.forEach((week) => {
        const dueDate = new Date(
          new Date(semesterStartDate).getTime() + (week - 1) * 7 * 86400000,
        );

        if (dueDate >= today && dueDate <= twoWeeksLater) {
          todos.push({
            studentId,
            type: "internship_submission",
            title: "Internship Weekly Report",
            dueDate,
            priority: "HIGH",
            createdAt: new Date(),
          });
        }
      });
    }

    // ---------- Save todos ----------
    const batch = db.batch();
    todos.forEach((t) => {
      const ref = db.collection("student_todos").doc();
      batch.set(ref, t);
    });

    await batch.commit();

    res.json({ success: true, count: todos.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = { generateStudentTodos };

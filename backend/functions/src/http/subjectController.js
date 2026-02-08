const functions = require("firebase-functions");
const admin = require("../firebase");
const db = admin.firestore();

/**
 * Create Subject (admin/lecturer)
 */
const createSubject = functions.https.onRequest(async (req, res) => {
  try {
    if (req.method !== "POST") {
      return res.status(405).send("Method Not Allowed");
    }

    const {
      subjectId,
      subjectName,
      semester,
      enrollPassword,
      lectureDays,
      lectureHoursPerDay,
      lessons,
      assessmentTimeline,
      assessmentCoverage,
    } = req.body;

    // ---------- VALIDATION ----------
    if (!subjectId || !subjectName || !enrollPassword) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    if (!Array.isArray(lessons) || lessons.length === 0) {
      return res.status(400).json({ error: "Lessons are required" });
    }

    if (!assessmentTimeline || !assessmentCoverage) {
      return res
        .status(400)
        .json({ error: "Assessment timeline and coverage required" });
    }

    // ---------- SAVE SUBJECT ----------
    await db.collection("subjects").doc(subjectId).set({
      subjectId,
      subjectName,
      semester,
      enrollPassword,
      lectureDays,
      lectureHoursPerDay,

      // ✅ NEW FIELDS
      lessons,
      assessmentTimeline,
      assessmentCoverage,

      created_at: new Date(),
    });

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error("Create subject error:", err);
    return res.status(500).json({ error: err.message });
  }
});
const getAllSubjects = functions.https.onRequest(async (req, res) => {
  try {
    const { studentId } = req.query;

    if (!studentId) {
      return res.status(400).json({ error: "Missing studentId" });
    }

    // 1️⃣ Get student enrollment doc
    const enrollSnap = await db
      .collection("student_enrollments")
      .doc(studentId)
      .get();

    if (!enrollSnap.exists) {
      return res.json({ subjects: [], internship: null });
    }

    const enrollData = enrollSnap.data();

    // 2️⃣ Get enrolled subjects details
    const subjectIds = enrollData.subjects || [];

    const subjectDocs = await Promise.all(
      subjectIds.map((id) => db.collection("subjects").doc(id).get()),
    );

    const subjects = subjectDocs
      .filter((doc) => doc.exists)
      .map((doc) => doc.data());

    // 3️⃣ Get internship details (if enrolled)
    let internship = null;

    if (enrollData.internshipEnrolled && enrollData.internshipId) {
      const internSnap = await db
        .collection("internship_modules")
        .doc(enrollData.internshipId)
        .get();

      if (internSnap.exists) {
        internship = internSnap.data();
      }
    }

    // 4️⃣ Final response
    res.json({
      studentId,
      subjects,
      internship,
    });
  } catch (err) {
    console.error("getStudentEnrollment error:", err);
    res.status(500).json({ error: err.message });
  }
});


module.exports = { createSubject, getAllSubjects };

const functions = require("firebase-functions");
const admin = require("../firebase");
const db = admin.firestore();

/**
 * Enroll Subject (student)
 */
/**
 * Enroll Subject (student)
 */
const enrollSubject = functions.https.onRequest(async (req, res) => {
  try {
    if (req.method !== "POST") {
      return res.status(405).send("Method Not Allowed");
    }

    const { studentId, subjectId, password } = req.body;

    if (!studentId || !subjectId || !password) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const subjectSnap = await db.collection("subjects").doc(subjectId).get();

    if (!subjectSnap.exists) {
      return res.status(404).json({ error: "Subject not found" });
    }

    if (subjectSnap.data().enrollPassword !== password) {
      return res.status(401).json({ error: "Invalid password" });
    }

    // ✅ Manual subject array update (NO arrayUnion)
    const enrollRef = db.collection("student_enrollments").doc(studentId);
    const enrollSnap = await enrollRef.get();

    let subjects = [];
    if (enrollSnap.exists && Array.isArray(enrollSnap.data().subjects)) {
      subjects = enrollSnap.data().subjects;
    }

    if (!subjects.includes(subjectId)) {
      subjects.push(subjectId);
    }

    await enrollRef.set({ subjects }, { merge: true });

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error("Enroll subject error:", err);
    return res.status(500).json({ error: err.message });
  }
});


/**
 * Get Student Enrollment
 * GET ?studentId=S001
 */
// const getStudentEnrollment = functions.https.onRequest(async (req, res) => {
//   try {
//     const { studentId } = req.query;

//     const enrollSnap = await db
//       .collection("student_enrollments")
//       .doc(studentId)
//       .get();

//     if (!enrollSnap.exists) return res.json({ subjects: [] });

//     const enrollData = enrollSnap.data();

//     // Fetch subject details
//     const subjectDocs = await Promise.all(
//       (enrollData.subjects || []).map((id) =>
//         db.collection("subjects").doc(id).get()
//       )
//     );

//     const subjects = subjectDocs.map((doc) => doc.data());

//     let internship = null;
//     if (enrollData.internshipId) {
//       const internSnap = await db
//         .collection("internship_modules")
//         .doc(enrollData.internshipId)
//         .get();
//       internship = internSnap.data();
//     }

//     res.json({ subjects, internship });
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// });
const getStudentEnrollment = functions.https.onRequest(async (req, res) => {
  try {
    const { studentId } = req.query;

    const enrollSnap = await db
      .collection("student_enrollments")
      .doc(studentId)
      .get();

    if (!enrollSnap.exists) {
      return res.json({ subjects: [], internship: null });
    }

    const enrollData = enrollSnap.data();

    // ---- SUBJECTS ----
    const subjectDocs = await Promise.all(
      (enrollData.subjects || []).map((id) =>
        db.collection("subjects").doc(id).get(),
      ),
    );
    const subjects = subjectDocs
      .filter((doc) => doc.exists)
      .map((doc) => doc.data());

    // ---- INTERNSHIP ----
    let internship = null;

    if (enrollData.internshipEnrolled && enrollData.internshipId) {
      const internSnap = await db
        .collection("internship_modules")
        .doc(enrollData.internshipId)
        .get();

      if (internSnap.exists) {
        internship = {
          internshipId: enrollData.internshipId,
          ...internSnap.data(),
        };
      }
    }

    return res.json({ subjects, internship });
  } catch (err) {
    console.error("getStudentEnrollment error:", err);
    return res.status(500).json({ error: err.message });
  }
});


module.exports = { enrollSubject, getStudentEnrollment };

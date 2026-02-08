const functions = require("firebase-functions");
const admin = require("../firebase");
const db = admin.firestore();

/**
 * Enroll Internship
 */
const enrollInternship = functions.https.onRequest(async (req, res) => {
  try {
    if (req.method !== "POST")
      return res.status(405).send("Method Not Allowed");

    const { studentId, internshipId } = req.body;

    await db.collection("student_enrollments").doc(studentId).set(
      {
        internshipEnrolled: true,
        internshipId,
      },
      { merge: true },
    );

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = { enrollInternship };

const admin = require("../firebase");

const db = admin.firestore();

/**
 * Fetch student risk prediction and explanation
 * GET /getStudentRiskExplanation?studentId=XXXX
 */
exports.getStudentRiskExplanation = async (req, res) => {
  try {
    const { studentId } = req.query;

    if (!studentId) {
      return res.status(400).json({
        error: "studentId query parameter is required",
      });
    }

    const docRef = db.collection("student_risk_predictions").doc(studentId);

    const docSnap = await docRef.get();

    if (!docSnap.exists) {
      return res.status(404).json({
        error: "Student risk record not found",
      });
    }

    return res.status(200).json(docSnap.data());
  } catch (error) {
    console.error("Error fetching student risk explanation:", error);
    return res.status(500).json({
      error: "Internal server error",
    });
  }
};

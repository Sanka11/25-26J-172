const admin = require("../firebase");

const THRESHOLDS = {
  assignment_avg: 50,
  attendance_pct: 70,
  midterm_score: 50,
  projects_score: 50,
  quizzes_avg: 50,
};

function toNumber(value) {
  const num = Number(value);
  return Number.isFinite(num) ? num : 0;
}

function normalizeStudentPerformance(data = {}) {
  return {
    assignment_avg: toNumber(data.assignment_avg),
    attendance_pct: toNumber(data.attendance_pct),
    midterm_score: toNumber(data.midterm_score),
    projects_score: toNumber(data.projects_score),
    quizzes_avg: toNumber(data.quizzes_avg),
  };
}

function classifyPerformance(performance) {
  const belowThreshold = Object.entries(THRESHOLDS)
    .filter(([metric, threshold]) => toNumber(performance[metric]) < threshold)
    .map(([metric]) => metric);

  let classification = "LOW PERFORMANCE";
  if (belowThreshold.length === 0) {
    classification = "HIGH PERFORMANCE";
  } else if (belowThreshold.length <= 2) {
    classification = "MEDIUM PERFORMANCE";
  }

  return {
    classification,
    below_threshold_metrics: belowThreshold,
  };
}

async function findStudentDocument(studentId) {
  const db = admin.firestore();

  const input = String(studentId || "").trim();
  if (!input) return null;

  const inputLower = input.toLowerCase();
  const localPart = inputLower.includes("@")
    ? inputLower.split("@")[0]
    : inputLower;

  // Candidate keys checked with exact indexed queries first.
  const candidates = Array.from(new Set([input, inputLower, localPart]));
  const fields = ["student_id", "studentId", "email", "uid", "email_lowercase"];

  // 1) Try direct document IDs.
  for (const candidate of candidates) {
    const byId = await db.collection("students").doc(candidate).get();
    if (byId.exists) {
      return byId;
    }
  }

  // 2) Try exact field queries.
  for (const candidate of candidates) {
    for (const field of fields) {
      const snap = await db
        .collection("students")
        .where(field, "==", candidate)
        .limit(1)
        .get();
      if (!snap.empty) {
        return snap.docs[0];
      }
    }
  }

  // 3) Last fallback: scan a small batch and match email local-part loosely
  // to handle near matches like aravind@gmail.com vs aravinda@gmail.com.
  const scan = await db.collection("students").limit(300).get();
  for (const docSnap of scan.docs) {
    const raw = docSnap.data() || {};
    const email = String(raw.email || "")
      .trim()
      .toLowerCase();
    const docStudentId = String(raw.student_id || raw.studentId || "")
      .trim()
      .toLowerCase();
    const docUid = String(raw.uid || "")
      .trim()
      .toLowerCase();
    const emailLocal = email.includes("@") ? email.split("@")[0] : "";

    if (email && (email === inputLower || emailLocal === localPart)) {
      return docSnap;
    }
    if (
      docStudentId &&
      (docStudentId === inputLower || docStudentId === localPart)
    ) {
      return docSnap;
    }
    if (docUid && docUid === inputLower) {
      return docSnap;
    }

    // Accept simple one-side prefix similarity for local-part only.
    if (
      emailLocal &&
      localPart &&
      (emailLocal.startsWith(localPart) || localPart.startsWith(emailLocal))
    ) {
      return docSnap;
    }
  }

  return null;
}

exports.getStudentPerformance = async (req, res) => {
  try {
    const { studentId } = req.params;

    if (!studentId) {
      return res.status(400).json({ error: "studentId is required" });
    }

    const studentDoc = await findStudentDocument(studentId);
    if (!studentDoc) {
      return res.status(404).json({
        error: "Student not found",
        student_id: studentId,
      });
    }

    const raw = studentDoc.data() || {};
    const performance = normalizeStudentPerformance(raw);

    return res.status(200).json({
      student_id: raw.student_id || studentDoc.id,
      source_document_id: studentDoc.id,
      thresholds: THRESHOLDS,
      ...performance,
    });
  } catch (error) {
    console.error("Failed to fetch student performance:", error);
    return res.status(500).json({
      error: "Failed to fetch student performance",
      details: error.message,
    });
  }
};

exports.getStudentsByPerformance = async (req, res) => {
  try {
    const { classification = "all", limit = "100" } = req.query;
    const normalizedClassification = String(classification).toUpperCase();
    const maxRows = Math.max(1, Math.min(500, Number(limit) || 100));

    if (!["ALL", "HIGH", "MEDIUM", "LOW"].includes(normalizedClassification)) {
      return res.status(400).json({
        error: "classification must be one of: all, high, medium, low",
      });
    }

    const snapshot = await admin
      .firestore()
      .collection("students")
      .limit(maxRows)
      .get();

    const highPerformanceStudents = [];
    const mediumPerformanceStudents = [];
    const lowPerformanceStudents = [];

    snapshot.forEach((studentDoc) => {
      const raw = studentDoc.data() || {};
      const performance = normalizeStudentPerformance(raw);
      const { classification: label, below_threshold_metrics } =
        classifyPerformance(performance);

      const studentInfo = {
        student_id: raw.student_id || raw.studentId || studentDoc.id,
        email: raw.email || null,
        source_document_id: studentDoc.id,
        classification: label,
        below_threshold_metrics,
        ...performance,
      };

      if (label === "HIGH PERFORMANCE") {
        highPerformanceStudents.push(studentInfo);
      } else if (label === "MEDIUM PERFORMANCE") {
        mediumPerformanceStudents.push(studentInfo);
      } else {
        lowPerformanceStudents.push(studentInfo);
      }
    });

    if (normalizedClassification === "HIGH") {
      return res.status(200).json({
        thresholds: THRESHOLDS,
        classification: "HIGH PERFORMANCE",
        count: highPerformanceStudents.length,
        students: highPerformanceStudents,
      });
    }

    if (normalizedClassification === "LOW") {
      return res.status(200).json({
        thresholds: THRESHOLDS,
        classification: "LOW PERFORMANCE",
        count: lowPerformanceStudents.length,
        students: lowPerformanceStudents,
      });
    }

    if (normalizedClassification === "MEDIUM") {
      return res.status(200).json({
        thresholds: THRESHOLDS,
        classification: "MEDIUM PERFORMANCE",
        count: mediumPerformanceStudents.length,
        students: mediumPerformanceStudents,
      });
    }

    return res.status(200).json({
      thresholds: THRESHOLDS,
      total_scanned: snapshot.size,
      high_performance_count: highPerformanceStudents.length,
      medium_performance_count: mediumPerformanceStudents.length,
      low_performance_count: lowPerformanceStudents.length,
      high_performance_students: highPerformanceStudents,
      medium_performance_students: mediumPerformanceStudents,
      low_performance_students: lowPerformanceStudents,
    });
  } catch (error) {
    console.error("Failed to classify students by performance:", error);
    return res.status(500).json({
      error: "Failed to classify students by performance",
      details: error.message,
    });
  }
};

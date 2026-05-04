/**
 * One-time fix: set current_year to a correct academic year for a student.
 * Usage: node scripts/fix-student-year.js <studentId> <academicYear>
 * Example: node scripts/fix-student-year.js S6000 2
 */
const admin = require("firebase-admin");

if (!admin.apps.length) {
  try {
    admin.initializeApp();
  } catch {
    admin.initializeApp({ projectId: "demiguard-3b4e8" });
  }
}

const [, , studentId, yearArg] = process.argv;
const year = Number(yearArg);

if (!studentId || !year || year < 1 || year > 4) {
  console.error("Usage: node fix-student-year.js <studentId> <1-4>");
  process.exit(1);
}

admin
  .firestore()
  .collection("student_acc")
  .doc(studentId)
  .update({ current_year: year, updated_at: admin.firestore.FieldValue.serverTimestamp() })
  .then(() => {
    console.log(`✅ ${studentId} current_year updated to ${year}`);
    process.exit(0);
  })
  .catch((err) => {
    console.error("❌ Failed:", err.message);
    process.exit(1);
  });

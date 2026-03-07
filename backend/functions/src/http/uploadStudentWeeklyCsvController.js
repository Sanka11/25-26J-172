// backend/functions/src/http/uploadStudentWeeklyCsvController.js

const admin = require("firebase-admin");
const { getFirestore, FieldValue } = require("firebase-admin/firestore");
const csv = require("csv-parser");
const fs = require("fs");
const os = require("os");
const path = require("path");
const Busboy = require("busboy");

if (!admin.apps.length) {
  admin.initializeApp();
}

const db = getFirestore();

exports.uploadStudentWeeklyCsv = async (req, res) => {
  try {
    const busboy = Busboy({ headers: req.headers });

    let filePath = null;
    let recordsAdded = 0;
    const batch = db.batch();

    busboy.on("file", (fieldname, file, info) => {
      const { filename } = info;
      filePath = path.join(os.tmpdir(), filename);
      file.pipe(fs.createWriteStream(filePath));
    });

    busboy.on("finish", () => {
      if (!filePath) {
        return res.status(400).json({ error: "CSV file missing" });
      }

      fs.createReadStream(filePath)
        .pipe(csv())
        .on("data", row => {
          if (!row.student_id || !row.week) return;

          const studentId = row.student_id.toString().padStart(4, "0");
          const week = row.week.trim();

          const year = week.substring(2, 4);
          const weekPart = week.substring(5);
          const docId = `${studentId}-${year}-${weekPart}`;

          const ref = db
            .collection("student_weekly_records")
            .doc(docId);

          batch.set(ref, {
            student_id: studentId,
            week,

            // ✅ EXACT GRU TRAINING FIELDS
            login_count: Number(row.login_count) || 0,
            avg_session_duration_min: Number(row.avg_session_duration_min) || 0,
            total_active_time_min: Number(row.total_active_time_min) || 0,
            days_since_last_login: Number(row.days_since_last_login) || 0,
            page_views: Number(row.page_views) || 0,
            assignments_submitted: Number(row.assignments_submitted) || 0,
            on_time_submissions: Number(row.on_time_submissions) || 0,
            late_submissions: Number(row.late_submissions) || 0,
            alerts_responded: Number(row.alerts_responded) || 0,
            response_rate: Number(row.response_rate) || 0,

            updatedAt: FieldValue.serverTimestamp(),
          });

          recordsAdded++;
        })
        .on("end", async () => {
          await batch.commit();
          fs.unlinkSync(filePath);

          res.json({
            message: "Student weekly records uploaded",
            records_added: recordsAdded,
          });
        });
    });

    busboy.end(req.rawBody);
  } catch (err) {
    console.error("CSV upload error:", err);
    res.status(500).json({ error: err.message });
  }
};
// backend/functions/src/http/weeklyUploadController.js

const admin = require("../firebase");
const csv = require("csv-parser");
const fs = require("fs");
const os = require("os");
const path = require("path");

async function uploadWeeklyCSV(req, res) {
  try {
    if (!req.files || !req.files.file) {
      return res.status(400).json({ error: "CSV file is required" });
    }

    const file = req.files.file;
    const tempPath = path.join(os.tmpdir(), file.name);
    await file.mv(tempPath);

    const db = admin.firestore();
    const batch = db.batch();
    let rowCount = 0;

    fs.createReadStream(tempPath)
      .pipe(csv())
      .on("data", (row) => {
        const docRef = db.collection("student_activity_weekly").doc();

        batch.set(docRef, {
          student_id: row.student_id,
          week: row.week,
          login_freq: Number(row.login_freq),
          session_duration: Number(row.session_duration),
          inactivity_days: Number(row.inactivity_days),
          assignment_completion: Number(row.assignment_completion),
          quiz_score: Number(row.quiz_score),
          forum_posts: Number(row.forum_posts),
          video_watch_ratio: Number(row.video_watch_ratio),
          late_submissions: Number(row.late_submissions),
          alert_interactions: Number(row.alert_interactions),
          help_requests: Number(row.help_requests),
          created_at: admin.firestore.FieldValue.serverTimestamp(),
        });

        rowCount++;
      })
      .on("end", async () => {
        await batch.commit();
        fs.unlinkSync(tempPath);

        return res.json({
          status: "Weekly CSV uploaded",
          records_added: rowCount,
        });
      });
  } catch (err) {
    console.error("CSV upload error:", err);
    return res.status(500).json({ error: err.message });
  }
}

module.exports = { uploadWeeklyCSV };
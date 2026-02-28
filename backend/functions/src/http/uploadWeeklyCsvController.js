const admin = require("../firebase");
const csv = require("csv-parser");
const { Readable } = require("stream");

const db = admin.firestore();

const REQUIRED_FIELDS = [
  "student_id",
  "week",
  "login_freq",
  "session_duration",
  "inactivity_days",
  "assignment_completion",
  "quiz_score",
  "forum_posts",
  "video_watch_ratio",
  "late_submissions",
  "alert_interactions",
  "help_requests",
];

async function uploadWeeklyCsv(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "CSV file is required" });
    }

    const rows = [];
    const stream = Readable.from(req.file.buffer);

    stream
      .pipe(csv())
      .on("data", (data) => rows.push(data))
      .on("end", async () => {
        let processed = 0;

        for (const row of rows) {
          // validate required fields
          for (const field of REQUIRED_FIELDS) {
            if (row[field] === undefined) {
              throw new Error(`Missing required field: ${field}`);
            }
          }

          // clean record (ignore extra fields)
          const record = {};
          REQUIRED_FIELDS.forEach((f) => {
            record[f] =
              f === "student_id" || f === "week"
                ? row[f]
                : Number(row[f]);
          });

          await db.collection("student_activity_weekly").add(record);
          processed++;
        }

        return res.json({
          status: "CSV upload successful",
          rows_processed: processed,
        });
      });
  } catch (err) {
    console.error("CSV upload error:", err);
    res.status(500).json({ error: err.message });
  }
}

module.exports = {
  uploadWeeklyCsv,
};
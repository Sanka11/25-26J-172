const admin = require("../firebase");
const csv = require("csv-parser");
const Busboy = require("busboy");
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
    const busboy = Busboy({ headers: req.headers });
    const rows = [];

    let fileFound = false;

    busboy.on("file", (fieldname, file) => {
      fileFound = true;

      file
        .pipe(csv({
          mapHeaders: ({ header }) => header?.trim(),
        }))
        .on("data", (data) => rows.push(data));
    });

    busboy.on("finish", async () => {
      if (!fileFound) {
        return res.status(400).json({ error: "CSV file is required" });
      }

      let processed = 0;

      for (const row of rows) {
        for (const field of REQUIRED_FIELDS) {
          if (row[field] === undefined || row[field] === "") {
            return res.status(400).json({
              error: `Missing required field '${field}' in row`,
              row,
            });
          }
        }

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

    busboy.end(req.rawBody);
  } catch (err) {
    console.error("CSV upload error:", err);
    res.status(500).json({ error: err.message });
  }
}

module.exports = { uploadWeeklyCsv };
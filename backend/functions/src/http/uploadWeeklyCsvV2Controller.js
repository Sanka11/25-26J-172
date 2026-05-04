const admin = require("firebase-admin");
const { FieldValue } = require("firebase-admin/firestore");
const Papa = require("papaparse");

const db = admin.firestore();

/**
 * FINAL V2 CSV Upload Controller
 * - Inserts weekly student activity
 * - Prevents duplicate (student_id + week)
 * - Auto-creates Firestore collection
 */
exports.uploadWeeklyCsvV2 = async (req, res) => {
    console.log("DEBUG req.file:", req.file);
    console.log("DEBUG req.body:", req.body);
  try {
    // 1️⃣ Check file
    if (!req.file) {
      return res.status(400).json({
        status: "ERROR",
        message: "CSV file is required (form-data: file)"
      });
    }

    // 2️⃣ Parse CSV
    const csvText = req.file.buffer.toString("utf8");
    const parsed = Papa.parse(csvText, {
      header: true,
      skipEmptyLines: true
    });

    if (parsed.errors.length > 0) {
      return res.status(400).json({
        status: "ERROR",
        message: "CSV parsing failed",
        errors: parsed.errors
      });
    }

    const rows = parsed.data;

    // 3️⃣ Firestore batch setup
    let batch = db.batch();
    let batchCount = 0;

    let inserted = 0;
    let skipped = 0;

    for (const row of rows) {
      const {
        student_id,
        week,
        login_freq,
        session_duration,
        inactivity_days,
        assignment_completion,
        quiz_score,
        forum_posts,
        video_watch_ratio,
        late_submissions,
        alert_interactions,
        help_requests
      } = row;

      // 4️⃣ Basic validation
      if (!student_id || !week) {
        skipped++;
        continue;
      }

      // 5️⃣ Document ID (prevents duplicates)
      const docId = `${student_id}_${week}`;
      const docRef = db
        .collection("student_weekly_activity")
        .doc(docId);

      const docSnap = await docRef.get();
      if (docSnap.exists) {
        skipped++;
        continue;
      }

      // 6️⃣ Prepare document
      batch.set(docRef, {
        student_id,
        week,
        login_freq: Number(login_freq),
        session_duration: Number(session_duration),
        inactivity_days: Number(inactivity_days),
        assignment_completion: Number(assignment_completion),
        quiz_score: Number(quiz_score),
        forum_posts: Number(forum_posts),
        video_watch_ratio: Number(video_watch_ratio),
        late_submissions: Number(late_submissions),
        alert_interactions: Number(alert_interactions),
        help_requests: Number(help_requests),
        created_at: FieldValue.serverTimestamp()
      });

      inserted++;
      batchCount++;

      // 7️⃣ Commit batch every 400 writes
      if (batchCount === 400) {
        await batch.commit();
        batch = db.batch();
        batchCount = 0;
      }
    }

    // 8️⃣ Commit remaining batch
    if (batchCount > 0) {
      await batch.commit();
    }

    // 9️⃣ Final response
    return res.status(200).json({
      status: "SUCCESS",
      inserted,
      skipped,
      total_rows: rows.length
    });

  } catch (error) {
    console.error("CSV V2 Upload Error:", error);
    return res.status(500).json({
      status: "ERROR",
      message: error.message
    });
  }
};
const admin = require("firebase-admin");
const { getFirestore, FieldValue } = require("firebase-admin/firestore");
const csv = require("csv-parser");
const fs = require("fs");
const os = require("os");
const path = require("path");
const Busboy = require("busboy");

// ✅ Initialize Firebase Admin safely
if (!admin.apps.length) {
  admin.initializeApp();
}

const db = getFirestore();

exports.uploadStudentCsv = async (req, res) => {
  try {
    const busboy = Busboy({ headers: req.headers });

    let filePath = null;
    let studentsAdded = 0;
    const batch = db.batch();

    // ---- Handle file upload ----
    busboy.on("file", (fieldname, file, info) => {
      const { filename } = info;
      filePath = path.join(os.tmpdir(), filename);
      const writeStream = fs.createWriteStream(filePath);
      file.pipe(writeStream);
    });

    // ---- After upload finished ----
    busboy.on("finish", () => {
      if (!filePath) {
        return res.status(400).json({ error: "No CSV file uploaded" });
      }

      fs.createReadStream(filePath)
        .pipe(csv())
        .on("data", (row) => {
          // Handle BOM + normal header
          const rawId =
            row.student_id ||
            row["\uFEFFstudent_id"] ||
            row["ï»¿student_id"];

          if (!rawId) return;

          const studentId = rawId.trim().padStart(4, "0");
          if (!studentId) return;

          const docRef = db
            .collection("Student_data")
            .doc(studentId);

          batch.set(docRef, {
            studentId,
            name: row.student_name || "",
            email: row.student_email || "",
            mobile: row.student_mobile || "",
            status: "Active",
            peers: row.student_peers
              ? row.student_peers.split("|")
              : [],
            createdAt: FieldValue.serverTimestamp(),
          });

          studentsAdded++;
        })
        .on("end", async () => {
          await batch.commit();
          fs.unlinkSync(filePath);

          res.json({
            message: "Student_data collection updated",
            students_added: studentsAdded,
          });
        });
    });

    // REQUIRED for Firebase Functions v2
    busboy.end(req.rawBody);
  } catch (err) {
    console.error("Student CSV upload error:", err);
    res.status(500).json({ error: err.message });
  }
};
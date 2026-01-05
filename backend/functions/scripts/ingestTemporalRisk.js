const fs = require("fs");
const path = require("path");
const admin = require("firebase-admin");

// 🔐 Load service account
const serviceAccount = require("../serviceAccountKey.json");

// ✅ Initialize Firebase Admin with credentials
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

// Load temporal prediction file
const dataPath = path.join(
  __dirname,
  "../../data/temporal_risk_predictions.json"
);

const data = JSON.parse(fs.readFileSync(dataPath, "utf-8"));

async function ingest() {
  const batch = db.batch();

  data.forEach((row) => {
    const docId = `${row.Student_ID}_S${row.Semester}`;
    const ref = db.collection("student_risk_history").doc(docId);

    batch.set(ref, {
      student_id: row.Student_ID,
      semester: row.Semester,
      risk_probability: row.risk_probability,
      risk_trend: row.risk_trend,
      updated_at: admin.firestore.FieldValue.serverTimestamp(),
    });
  });

  await batch.commit();
  console.log("✅ Temporal risk data ingested successfully");
}

ingest().catch(console.error);

// const functions = require("firebase-functions");
// const fetch = require("node-fetch");
// const admin = require("firebase-admin");
// const { ML_STRUGGLE_URL } = require("../config");

// admin.initializeApp();
// const db = admin.firestore();

// const predictStruggle = functions.https.onRequest(async (req, res) => {
//   try {
//     if (req.method !== "POST") {
//       return res.status(405).send("Method Not Allowed");
//     }

//     const payload = req.body;

//     // 1️⃣ Call ML service
//     const response = await fetch(ML_STRUGGLE_URL, {
//       method: "POST",
//       headers: { "Content-Type": "application/json" },
//       body: JSON.stringify(payload),
//     });

//     if (!response.ok) {
//       throw new Error("ML service error");
//     }

//     const mlResult = await response.json();

//     // 2️⃣ Save result in Firestore
//     await db
//       .collection("struggle_predictions")
//       .doc(String(mlResult.user_id))
//       .set(
//         {
//           user_id: mlResult.user_id,
//           predictions: mlResult.struggling_skills,
//           created_at: FieldValue.serverTimestamp(),
//         },
//         { merge: true }
//       );

//     // 3️⃣ Return result
//     return res.status(200).json(mlResult);
//   } catch (error) {
//     console.error("Struggle prediction error:", error.message);
//     return res.status(500).json({ error: "Struggle prediction failed" });
//   }
// });

// module.exports = { predictStruggle };

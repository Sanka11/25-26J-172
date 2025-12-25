const functions = require("firebase-functions");
const axios = require("axios");
const admin = require("../firebase");
const { ML_STRUGGLE_URL } = require("../config");

const db = admin.firestore();

const predictStruggle = functions.https.onRequest(async (req, res) => {
  try {
    // Allow only POST
    if (req.method !== "POST") {
      return res.status(405).send("Method Not Allowed");
    }

    const payload = req.body;

    // 🔹 Call ML service (same pattern as recommendation)
    const response = await axios.post(ML_STRUGGLE_URL, payload);

    const mlResult = response.data;

    // 🔹 OPTIONAL: Save to Firestore
    await db
      .collection("struggle_predictions")
      .doc(String(mlResult.user_id))
      .set(
        {
          user_id: mlResult.user_id,
          predictions: mlResult.struggling_skills,
          created_at: new Date(),
        },
        { merge: true }
      );

    // 🔹 Return ML response
    return res.status(200).json(mlResult);
  } catch (error) {
    console.error("Struggle ML error:", error.message);
    return res.status(500).json({
      error: "Struggle ML service error",
    });
  }
});

module.exports = { predictStruggle };

// const functions = require("firebase-functions");
// const fetch = require("node-fetch");
// const admin = require("firebase-admin");
// const { ML_STRUGGLE_URL } = require("../config");

// admin.initializeApp();
// const db = admin.firestore();

// const predictStruggle = functions.https.onRequest(async (req, res) => {
//   try {
//     console.log("🚀 predictStruggle called");

//     // 1️⃣ Method check
//     console.log("➡️ Request method:", req.method);
//     if (req.method !== "POST") {
//       console.log("❌ Invalid method");
//       return res.status(405).send("Method Not Allowed");
//     }

//     // 2️⃣ Payload log
//     const payload = req.body;
//     console.log("📦 Payload received:", JSON.stringify(payload, null, 2));

//     // 3️⃣ ML URL log
//     console.log("🌐 Calling ML URL:", ML_STRUGGLE_URL);

//     // 4️⃣ Call ML service
//     const response = await fetch(ML_STRUGGLE_URL, {
//       method: "POST",
//       headers: { "Content-Type": "application/json" },
//       body: JSON.stringify(payload),
//     });

//     console.log("📡 ML response status:", response.status);

//     const responseText = await response.text();
//     console.log("📡 ML raw response:", responseText);

//     if (!response.ok) {
//       console.error("❌ ML service returned error");
//       throw new Error(`ML service error: ${responseText}`);
//     }

//     // 5️⃣ Parse ML response
//     const mlResult = JSON.parse(responseText);
//     console.log("✅ ML parsed result:", mlResult);

//     // 6️⃣ Save to Firestore
//     console.log("💾 Saving to Firestore for user:", mlResult.user_id);

//     await db
//       .collection("struggle_predictions")
//       .doc(String(mlResult.user_id))
//       .set(
//         {
//           user_id: mlResult.user_id,
//           predictions: mlResult.struggling_skills,
//           created_at: admin.firestore.FieldValue.serverTimestamp(),
//         },
//         { merge: true }
//       );

//     console.log("✅ Firestore save successful");

//     // 7️⃣ Return response
//     return res.status(200).json(mlResult);
//   } catch (error) {
//     console.error("🔥 Struggle prediction error FULL:", error);
//     return res.status(500).json({
//       error: "Struggle prediction failed",
//       details: error.message,
//     });
//   }
// });

// module.exports = { predictStruggle };

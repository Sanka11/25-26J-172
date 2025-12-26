const functions = require("firebase-functions");
const axios = require("axios");
const admin = require("../firebase");
const { ML_STRUGGLE_URL } = require("../config");

const db = admin.firestore();
const { FieldValue } = admin.firestore;

const predictStruggle = functions.https.onRequest(async (req, res) => {
  try {
    // Allow only POST
    if (req.method !== "POST") {
      return res.status(405).send("Method Not Allowed");
    }

    const payload = req.body;

    // 1️⃣ Call ML service
    const response = await axios.post(ML_STRUGGLE_URL, payload);
    const mlResult = response.data;

    // 2️⃣ Convert array → skill map
    const skillMap = {};
    mlResult.struggling_skills.forEach((skill) => {
      skillMap[skill.skill_name] = {
        struggle_score: skill.struggle_score,
        level: skill.level,
        updated_at: new Date(),
      };
    });

    // 3️⃣ Save / update Firestore (per user, per skill)
    await db
      .collection("struggle_predictions")
      .doc(String(mlResult.user_id))
      .set(
        {
          user_id: mlResult.user_id,
          skills: skillMap,
          last_updated: new Date(),
        },
        { merge: true }
      );

    // 4️⃣ Return ML result
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
// const axios = require("axios");
// const admin = require("../firebase");
// const { ML_STRUGGLE_URL } = require("../config");

// const db = admin.firestore();

// const predictStruggle = functions.https.onRequest(async (req, res) => {
//   try {
//     if (req.method !== "POST") {
//       return res.status(405).send("Method Not Allowed");
//     }

//     const { user_id, skills } = req.body;

//     if (!user_id || !skills || !skills.length) {
//       return res.status(400).json({ error: "Invalid payload" });
//     }

//     const enrichedSkills = [];

//     for (const skill of skills) {
//       // 1️⃣ Calculate attempt_count from DB
//       const attemptSnap = await db
//         .collection("quiz_attempts")
//         .where("user_id", "==", user_id)
//         .where("skill_name", "==", skill.skill_name)
//         .get();

//       const attempt_count = attemptSnap.size;

//       enrichedSkills.push({
//         skill_name: skill.skill_name,
//         correct: skill.correct,
//         attempt_count,
//         hint_count: skill.hint_count,
//         ms_first_response: skill.ms_first_response,
//         opportunity: skill.opportunity,
//         overlap_time: skill.overlap_time,
//       });
//     }

//     // 2️⃣ Call ML service
//     const response = await axios.post(ML_STRUGGLE_URL, {
//       user_id,
//       skills: enrichedSkills,
//     });

//     const mlResult = response.data;

//     // 3️⃣ Save result
//     await db.collection("struggle_predictions").doc(String(user_id)).set(
//       {
//         user_id,
//         predictions: mlResult.struggling_skills,
//         created_at: admin.firestore.FieldValue.serverTimestamp(),
//       },
//       { merge: true }
//     );

//     return res.status(200).json(mlResult);
//   } catch (error) {
//     console.error("Struggle ML error:", error.message);
//     return res.status(500).json({ error: "Struggle prediction failed" });
//   }
// });

// module.exports = { predictStruggle };

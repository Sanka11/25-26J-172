// const functions = require("firebase-functions");
// const admin = require("../firebase");
// const cors = require("cors")({ origin: true });

// const db = admin.firestore();

// const checkLevelUnlock = functions.https.onRequest((req, res) => {
//   cors(req, res, async () => {
//     try {
//       if (req.method !== "POST") {
//         return res.status(405).send("Method Not Allowed");
//       }

//       const { user_id, skill_name } = req.body;

//       if (!user_id || !skill_name) {
//         return res.status(400).json({
//           error: "Missing user_id or skill_name",
//         });
//       }

//       const snap = await db
//         .collection("struggle_predictions")
//         .doc(String(user_id))
//         .get();

//       if (!snap.exists) {
//         return res.status(200).json({
//           unlocked: false,
//           reason: "No struggle data found",
//         });
//       }

//       const predictions = snap.data().predictions || [];

//       const skillPrediction = predictions.find(
//         (s) => s.skill_name === skill_name
//       );

//       if (!skillPrediction) {
//         return res.status(200).json({
//           unlocked: true,
//           reason: "No struggle for this skill",
//         });
//       }

//       if (skillPrediction.level !== "Low") {
//         return res.status(200).json({
//           unlocked: false,
//           level: skillPrediction.level,
//           reason: "Student still struggling",
//         });
//       }

//       return res.status(200).json({
//         unlocked: true,
//         reason: "Level unlocked",
//       });
//     } catch (error) {
//       console.error("Level unlock error:", error);
//       return res.status(500).json({ error: "Level check failed" });
//     }
//   });
// });

// module.exports = { checkLevelUnlock };
const functions = require("firebase-functions");
const admin = require("../firebase");

const db = admin.firestore();
const { FieldValue } = admin.firestore;

/**
 * Check if user can unlock next level
 */
const checkLevelUnlock = functions.https.onRequest(async (req, res) => {
  try {
    if (req.method !== "POST") {
      return res.status(405).send("Method Not Allowed");
    }

    const { user_id, skill_name } = req.body;

    if (!user_id || !skill_name) {
      return res.status(400).json({
        error: "Missing user_id or skill_name",
      });
    }

    // 1️⃣ Get struggle prediction
    const struggleDoc = await db
      .collection("struggle_predictions")
      .doc(String(user_id))
      .get();

    if (!struggleDoc.exists) {
      return res.status(404).json({
        error: "No struggle data found",
      });
    }

    const predictions = struggleDoc.data().predictions || [];

    const skillPrediction = predictions.find(
      (p) => p.skill_name === skill_name
    );

    if (!skillPrediction) {
      return res.status(404).json({
        error: "No struggle data for this skill",
      });
    }

    // ❌ Block if High struggle
    if (skillPrediction.level === "High") {
      return res.status(200).json({
        unlocked: false,
        level: skillPrediction.level,
        reason: "High struggle detected",
      });
    }

    // 2️⃣ Read current level
    const levelRef = db.collection("user_levels").doc(String(user_id));
    const levelDoc = await levelRef.get();

    let nextLevel = 1;

    if (levelDoc.exists) {
      const current = levelDoc.data().skills?.[skill_name]?.level ?? 1;
      nextLevel = current + 1;
    }

    // 3️⃣ Save new level
    await levelRef.set(
      {
        user_id,
        skills: {
          [skill_name]: {
            level: nextLevel,
            last_updated: new Date(),
          },
        },
      },
      { merge: true }
    );

    return res.status(200).json({
      unlocked: true,
      skill_name,
      new_level: nextLevel,
      message: "Next level unlocked",
    });
  } catch (error) {
    console.error("CheckLevelUnlock error:", error);
    return res.status(500).json({
      error: "Failed to check level unlock",
    });
  }
});
const getUserLevel = functions.https.onRequest(async (req, res) => {
  try {
    const user_id = req.query.user_id;

    if (!user_id) {
      return res.status(400).json({ error: "Missing user_id" });
    }

    const doc = await db.collection("user_levels").doc(String(user_id)).get();

    if (!doc.exists) {
      return res.status(200).json({
        user_id,
        skills: {},
      });
    }

    return res.status(200).json(doc.data());
  } catch (error) {
    console.error("GetUserLevel error:", error);
    return res.status(500).json({
      error: "Failed to fetch user level",
    });
  }
});


module.exports = {
  checkLevelUnlock,
  getUserLevel,
};

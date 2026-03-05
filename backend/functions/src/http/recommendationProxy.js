// const functions = require("firebase-functions");
// const admin = require("firebase-admin");
// const axios = require("axios");
// const cors = require("cors")({ origin: true }); // Automatically handles CORS!

// // 👇 The exact variable exported from your config.js
// const { ML_RECOMMENDATION } = require("../config");

// // Initialize Firebase Admin to talk to Firestore (only if not already initialized)
// if (!admin.apps.length) {
//   admin.initializeApp();
// }
// const db = admin.firestore();

// const getRecommendations = functions.https.onRequest((req, res) => {
//   // Wrap your entire function in CORS so React can communicate with it
//   cors(req, res, async () => {
//     try {
//       // Only allow POST requests
//       if (req.method !== "POST") {
//         return res.status(405).send("Method Not Allowed");
//       }

//       console.log("1. Received payload from React UI");
//       const payload = req.body;

//       // Safety Check: Ensure the payload is formatted correctly
//       if (!payload || !payload.students || payload.students.length === 0) {
//         throw new Error("Invalid payload: Missing student data.");
//       }

//       const studentData = payload.students[0];
//       const studentId = studentData.student_id;

//       if (!studentId) {
//         throw new Error("Invalid payload: student_id is missing.");
//       }

//       console.log(`2. Forwarding to ML Service: ${ML_RECOMMENDATION}`);

//       // Call the Python ML service using your config variable
//       const response = await axios.post(ML_RECOMMENDATION, payload);

//       console.log("3. Successfully received response from Python ML Model");
//       const aiResult = response.data.student_recommendations[0];

//       console.log(
//         `4. Saving historical progress to Firestore for ${studentId}`,
//       );
//       const historyRef = db
//         .collection("students")
//         .doc(studentId)
//         .collection("history");

//       // Save the week's progress to the database
//       await historyRef.add({
//         timestamp: new Date(),
//         study_hours_per_week: studentData.study_hours_per_week,
//         stress_level: studentData.stress_level,
//         sleep_hours: studentData.sleep_hours,
//         status: aiResult.status,
//         recommendation_index: aiResult.recommendation_index,
//         ai_summary: aiResult.ai_insights.summary,
//         academic_tip: aiResult.ai_insights.academic_tip,
//         wellness_tip: aiResult.ai_insights.wellness_tip,

//         // 👇 UPDATED: Automatically save the action items and initialize their checkbox states
//         action_items: aiResult.ai_insights.action_items || [],
//         completed_tasks: aiResult.ai_insights.action_items
//           ? new Array(aiResult.ai_insights.action_items.length).fill(false)
//           : [],
//       });

//       console.log("5. Success! Sending data back to React UI");
//       return res.status(200).json(response.data);
//     } catch (error) {
//       console.error("\n🔥 ML PROXY ERROR DEEP DIVE 🔥");

//       // This will tell you exactly what is broken in your Firebase terminal!
//       if (error.response) {
//         // FastAPI received the request but rejected it (e.g., validation error)
//         console.error(
//           "The Python FastAPI server returned an error:",
//           error.response.data,
//         );
//       } else if (error.request) {
//         // FastAPI never responded (e.g., server is off)
//         console.error(
//           "Could not reach Python FastAPI. Is the Uvicorn server running?",
//           error.message,
//         );
//       } else {
//         // Something broke inside this Firebase code
//         console.error("Firebase Code Error:", error.message);
//       }

//       return res
//         .status(500)
//         .json({ error: error.message || "Internal Server Error" });
//     }
//   });
// });

// module.exports = { getRecommendations };

const functions = require("firebase-functions");
const admin = require("firebase-admin");
const axios = require("axios");
const cors = require("cors")({ origin: true }); // Automatically handles CORS!

// 👇 The exact variable exported from your config.js
const { ML_RECOMMENDATION } = require("../config");

// Initialize Firebase Admin to talk to Firestore (only if not already initialized)
if (!admin.apps.length) {
  admin.initializeApp();
}
const db = admin.firestore();

const getRecommendations = functions.https.onRequest((req, res) => {
  // Wrap your entire function in CORS so React can communicate with it
  cors(req, res, async () => {
    try {
      // Only allow POST requests
      if (req.method !== "POST") {
        return res.status(405).send("Method Not Allowed");
      }

      console.log("1. Received payload from React UI");
      const payload = req.body;

      // Safety Check: Ensure the payload is formatted correctly
      if (!payload || !payload.students || payload.students.length === 0) {
        throw new Error("Invalid payload: Missing student data.");
      }

      const studentData = payload.students[0];
      const studentId = studentData.student_id;

      if (!studentId) {
        throw new Error("Invalid payload: student_id is missing.");
      }

      console.log(`2. Forwarding to ML Service: ${ML_RECOMMENDATION}`);

      // Call the Python ML service using your config variable
      const response = await axios.post(ML_RECOMMENDATION, payload);

      console.log("3. Successfully received response from Python ML Model");
      const aiResult = response.data.student_recommendations[0];

      console.log(
        `4. Saving historical progress to Firestore for ${studentId}`,
      );
      const historyRef = db
        .collection("students")
        .doc(studentId)
        .collection("history");

      // Save the week's progress to the database
      await historyRef.add({
        timestamp: new Date(),
        study_hours_per_week: studentData.study_hours_per_week,
        stress_level: studentData.stress_level,
        sleep_hours: studentData.sleep_hours,
        status: aiResult.status,
        recommendation_index: aiResult.recommendation_index,

        // 👇 FIX: Updated to match the NEW Python JSON keys perfectly 👇
        ai_summary: aiResult.ai_insights.summary || "",
        wellness_summary: aiResult.ai_insights.wellness_summary || "", // Added this!
        academic_tips: aiResult.ai_insights.academic_tips || [], // Changed to plural/array
        wellness_tips: aiResult.ai_insights.wellness_tips || [], // Changed to plural/array

        // Action items and checkboxes
        action_items: aiResult.ai_insights.action_items || [],
        completed_tasks: aiResult.ai_insights.action_items
          ? new Array(aiResult.ai_insights.action_items.length).fill(false)
          : [],
      });

      console.log("5. Success! Sending data back to React UI");
      return res.status(200).json(response.data);
    } catch (error) {
      console.error("\n🔥 ML PROXY ERROR DEEP DIVE 🔥");

      if (error.response) {
        console.error(
          "The Python FastAPI server returned an error:",
          error.response.data,
        );
      } else if (error.request) {
        console.error(
          "Could not reach Python FastAPI. Is the Uvicorn server running?",
          error.message,
        );
      } else {
        console.error("Firebase Code Error:", error.message);
      }

      return res
        .status(500)
        .json({ error: error.message || "Internal Server Error" });
    }
  });
});

module.exports = { getRecommendations };
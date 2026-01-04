const functions = require("firebase-functions");
const admin = require("../firebase");

const db = admin.firestore();

/**
 * Submit chatbot feedback
 * Method: POST
 * Body: { rating: number (1-5), comment?: string, created_at?: number (seconds), last_question?: string, last_answer?: string }
 */
const submitChatFeedback = functions.https.onRequest(async (req, res) => {
  try {
    if (req.method !== "POST") {
      return res.status(405).send("Method Not Allowed");
    }

    const { rating, comment, created_at, last_question, last_answer } =
      req.body || {};

    const numericRating = Number(rating);
    if (
      !Number.isFinite(numericRating) ||
      numericRating < 1 ||
      numericRating > 5
    ) {
      return res
        .status(400)
        .json({ error: "Invalid rating. Must be a number between 1 and 5." });
    }

    const doc = {
      rating: numericRating,
      comment: typeof comment === "string" ? comment.trim() : "",
      last_question:
        typeof last_question === "string" ? last_question.trim() : null,
      last_answer: typeof last_answer === "string" ? last_answer.trim() : null,
      created_at:
        typeof created_at === "number"
          ? new Date(created_at * 1000)
          : new Date(),
    };

    await db.collection("chatFeedback").add(doc);

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error("submitChatFeedback error:", error);
    return res
      .status(500)
      .json({ error: "Failed to record feedback for chatbot" });
  }
});

/**
 * Get chatbot feedback stats
 * Method: GET
 * Returns: { average_rating: number, total_ratings: number }
 */
const getChatFeedbackStats = functions.https.onRequest(async (req, res) => {
  try {
    if (req.method !== "GET") {
      return res.status(405).send("Method Not Allowed");
    }

    const snapshot = await db.collection("chatFeedback").get();
    if (snapshot.empty) {
      return res.status(200).json({ average_rating: 0, total_ratings: 0 });
    }

    let sum = 0;
    let count = 0;
    snapshot.forEach((doc) => {
      const data = doc.data();
      const r = Number(data.rating);
      if (Number.isFinite(r)) {
        sum += r;
        count += 1;
      }
    });

    if (count === 0) {
      return res.status(200).json({ average_rating: 0, total_ratings: 0 });
    }

    const average = sum / count;
    return res.status(200).json({
      average_rating: Number(average.toFixed(2)),
      total_ratings: count,
    });
  } catch (error) {
    console.error("getChatFeedbackStats error:", error);
    return res
      .status(500)
      .json({ error: "Failed to load chatbot feedback statistics" });
  }
});

/**
 * List chatbot feedback documents
 * Method: GET
 */
const listChatFeedback = functions.https.onRequest(async (req, res) => {
  try {
    if (req.method !== "GET") {
      return res.status(405).send("Method Not Allowed");
    }

    const snapshot = await db
      .collection("chatFeedback")
      .orderBy("created_at", "desc")
      .limit(200)
      .get();

    const items = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    return res.status(200).json(items);
  } catch (error) {
    console.error("listChatFeedback error:", error);
    return res
      .status(500)
      .json({ error: "Failed to load chatbot feedback list" });
  }
});

/**
 * Delete a single chatbot feedback document
 * Method: POST
 * Body: { id: string }
 */
const deleteChatFeedback = functions.https.onRequest(async (req, res) => {
  try {
    if (req.method !== "POST") {
      return res.status(405).send("Method Not Allowed");
    }

    const { id } = req.body || {};
    if (!id) {
      return res.status(400).json({ error: "Missing feedback id" });
    }

    await db.collection("chatFeedback").doc(id).delete();
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error("deleteChatFeedback error:", error);
    return res.status(500).json({ error: "Failed to delete chatbot feedback" });
  }
});

module.exports = {
  submitChatFeedback,
  getChatFeedbackStats,
  listChatFeedback,
  deleteChatFeedback,
};
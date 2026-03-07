const functions = require("firebase-functions");
const admin = require("../firebase");

const db = admin.firestore();

// CORS and OPTIONS handler helper
const setCorsHeaders = (res) => {
  res.set("Access-Control-Allow-Origin", "*");
  res.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
};

/**
 * Create Announcement (admin)
 * Body: { title: string, message: string, remind?: boolean, remind_until?: string, attachments?: Array<{ label?: string, url: string }> }
 */
const createAnnouncement = functions.https.onRequest(async (req, res) => {
  setCorsHeaders(res);

  if (req.method === "OPTIONS") {
    return res.status(204).send("");
  }

  try {
    if (req.method !== "POST") {
      return res.status(405).send("Method Not Allowed");
    }

    const { title, message, remind, remind_until, attachments } =
      req.body || {};

    if (!title || !message) {
      return res.status(400).json({ error: "Missing title or message" });
    }

    let safeAttachments = [];
    if (Array.isArray(attachments)) {
      safeAttachments = attachments
        .filter((a) => a && typeof a.url === "string" && a.url.trim())
        .map((a) => ({
          label:
            typeof a.label === "string" && a.label.trim()
              ? a.label.trim()
              : null,
          url: a.url.trim(),
        }));
    }

    const docRef = await db.collection("announcements").add({
      title,
      message,
      remind: Boolean(remind),
      remind_until: remind_until ? new Date(remind_until) : null,
      attachments: safeAttachments,
      created_at: new Date(),
    });

    const doc = await docRef.get();

    return res.status(200).json({
      id: docRef.id,
      ...doc.data(),
    });
  } catch (error) {
    console.error("Create announcement error:", error);
    return res.status(500).json({ error: "Failed to create announcement" });
  }
});

/**
 * Get Announcements (user/admin)
 * Method: GET
 */
const getAnnouncements = functions.https.onRequest(async (req, res) => {
  setCorsHeaders(res);

  if (req.method === "OPTIONS") {
    return res.status(204).send("");
  }

  try {
    if (req.method !== "GET") {
      return res.status(405).send("Method Not Allowed");
    }

    const snapshot = await db
      .collection("announcements")
      .orderBy("created_at", "desc")
      .get();

    const items = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

    return res.status(200).json(items);
  } catch (error) {
    console.error("Get announcements error:", error);
    return res.status(500).json({ error: "Failed to fetch announcements" });
  }
});
/**
 * Update Announcement (admin)
 * Body: { id: string, title?: string, message?: string, remind?: boolean, remind_until?: string | null, attachments?: Array<{ label?: string, url: string }> }
 */
const updateAnnouncement = functions.https.onRequest(async (req, res) => {
  setCorsHeaders(res);

  if (req.method === "OPTIONS") {
    return res.status(204).send("");
  }

  try {
    if (req.method !== "POST") {
      return res.status(405).send("Method Not Allowed");
    }

    const { id, title, message, remind, remind_until, attachments } =
      req.body || {};

    if (!id) {
      return res.status(400).json({ error: "Missing announcement id" });
    }

    const update = { updated_at: new Date() };
    if (typeof title === "string") update.title = title;
    if (typeof message === "string") update.message = message;
    if (typeof remind !== "undefined") update.remind = Boolean(remind);
    if (typeof remind_until !== "undefined") {
      update.remind_until = remind_until ? new Date(remind_until) : null;
    }

    if (typeof attachments !== "undefined") {
      if (Array.isArray(attachments)) {
        update.attachments = attachments
          .filter((a) => a && typeof a.url === "string" && a.url.trim())
          .map((a) => ({
            label:
              typeof a.label === "string" && a.label.trim()
                ? a.label.trim()
                : null,
            url: a.url.trim(),
          }));
      } else {
        update.attachments = [];
      }
    }

    await db.collection("announcements").doc(id).update(update);

    const doc = await db.collection("announcements").doc(id).get();
    return res.status(200).json({ id: doc.id, ...doc.data() });
  } catch (error) {
    console.error("Update announcement error:", error);
    return res.status(500).json({ error: "Failed to update announcement" });
  }
});

/**
 * Delete Announcement (admin)
 * Body: { id: string }
 */
const deleteAnnouncement = functions.https.onRequest(async (req, res) => {
  setCorsHeaders(res);

  if (req.method === "OPTIONS") {
    return res.status(204).send("");
  }

  try {
    if (req.method !== "POST") {
      return res.status(405).send("Method Not Allowed");
    }

    const { id } = req.body || {};

    if (!id) {
      return res.status(400).json({ error: "Missing announcement id" });
    }

    await db.collection("announcements").doc(id).delete();

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error("Delete announcement error:", error);
    return res.status(500).json({ error: "Failed to delete announcement" });
  }
});

module.exports = {
  createAnnouncement,
  getAnnouncements,
  updateAnnouncement,
  deleteAnnouncement,
};

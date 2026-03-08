const admin = require("../firebase");

exports.addTenWeeks = async (req, res) => {
  try {
    const db = admin.firestore();

    const { student_id, weeks } = req.body;

    if (!student_id) {
      return res.status(400).json({ error: "student_id required" });
    }

    if (!weeks || weeks.length !== 10) {
      return res.status(400).json({
        error: "Provide exactly 10 weeks"
      });
    }

    // find latest existing week
    const snapshot = await db
      .collection("student_weekly_records")
      .where("student_id", "==", student_id)
      .orderBy("week", "desc")
      .limit(1)
      .get();

    let startWeek = 1;

    if (!snapshot.empty) {
      const latestWeek = snapshot.docs[0].data().week;
      const weekNumber = parseInt(latestWeek.split("W")[1]);
      startWeek = weekNumber + 1;
    }

    const batch = db.batch();
    const createdDocs = [];

    for (let i = 0; i < weeks.length; i++) {

      const weekNumber = startWeek + i;

      const weekStr = `2026-W${String(weekNumber).padStart(2, "0")}`;

      const docId = `${student_id}-26-W${String(weekNumber).padStart(2, "0")}`;

      const record = {
        student_id,
        week: weekStr,
        ...weeks[i],
        createdAt: new Date()
      };

      const ref = db.collection("student_weekly_records").doc(docId);

      batch.set(ref, record);

      createdDocs.push(docId);
    }

    await batch.commit();

    res.json({
      status: "10 weeks added",
      created: createdDocs
    });

  } catch (error) {

    console.error("Add 10 weeks error:", error);

    res.status(500).json({
      error: error.message
    });
  }
};
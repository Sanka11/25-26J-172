const admin = require("../firebase");

exports.getRiskHistoryByStudent = async (req, res) => {
  try {
    const snapshot = await admin
      .firestore()
      .collection("student_risk_history")
      .get();

    const history = snapshot.docs.map((doc) => doc.data());

    res.json({ history });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed" });
  }
};

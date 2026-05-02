const admin = require("../firebase");
const { findStudentById } = require("./studentDataLookup");
const db = admin.firestore();

async function getPeerCheerStudents(req, res) {
  try {

    // Get RL records where PEER_CHEER triggered
    const rlSnapshot = await db
      .collection("student_rl_intervention_history")
      .where("action", "==", "PEER_CHEER")
      .get();

    const results = [];

    for (const doc of rlSnapshot.docs) {

      const rl = doc.data();
      const studentId = rl.student_id;

      const student = await findStudentById(db, studentId);
      const studentData = student.data;

      const peersList = studentData.peers;
      
      // If peers exist, fetch peer student details
      const peerDetails = [];
      if (peersList.length > 0) {
        for (const peerId of peersList) {
          const peer = await findStudentById(db, peerId);
          const peerData = peer.data;

          if (peer.collectionName) {
            peerDetails.push({
              peer_id: peerId.trim(),
              peer_name: peerData.name || peerId,
              peer_email: peerData.email,
              peer_mobile: peerData.mobile,
            });
          } else {
            peerDetails.push({
              peer_id: peerId.trim(),
              peer_name: peerId.trim(),
              peer_email: "",
              peer_mobile: "",
            });
          }
        }
      }

      results.push({
        student_id: studentId,
        week: rl.week,
        risk_level: rl.risk_level,
        risk_trend: rl.risk_trend || "STABLE",
        reconstruction_error: rl.reconstruction_error || null,
        // At-risk student contact details
        name: studentData.name || "Unknown",
        email: studentData.email,
        mobile: studentData.mobile,
        // Peers assigned to this at-risk student
        peers: peersList,
        peer_details: peerDetails,
        // Additional student info
        department: studentData.department,
        year: studentData.year,
        status: studentData.status
      });

    }

    res.json({
      count: results.length,
      data: results,
    });

  } catch (error) {

    console.error("Peer cheer fetch error:", error);

    res.status(500).json({
      error: "Failed to fetch peer cheer students",
    });

  }
}

module.exports = { getPeerCheerStudents };

const { getFirestore } = require("firebase-admin/firestore");

const db = getFirestore();

async function getOrInitInterventionState(studentId) {
  const ref = db
    .collection("student_intervention_state")
    .doc(studentId);

  const snap = await ref.get();

  // FIRST RUN → bootstrap defaults
  if (!snap.exists) {
    const initState = {
      student_id: studentId,
      last_action: "DO_NOTHING",
      no_response_streak: 0,
      fatigue_level: 0,
      updated_at: new Date()
    };

    await ref.set(initState);
    return initState;
  }

  return snap.data();
}

module.exports = { getOrInitInterventionState };
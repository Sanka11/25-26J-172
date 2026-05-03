import { db } from "../config/firebase";
import { collection, query, where, getDocs } from "firebase/firestore";

export const getRlHistory = async (studentId = null) => {
  try {
    const colRef = collection(db, "student_rl_intervention_history");
    const q = studentId
      ? query(colRef, where("student_id", "==", studentId))
      : colRef;

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error("RL history fetch error:", error);
    return [];
  }
};

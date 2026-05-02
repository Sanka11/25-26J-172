import { db } from "../config/firebase";
import { collection, query, where, getDocs, doc, getDoc } from "firebase/firestore";

function buildCandidates(studentId) {
  const raw = String(studentId || "").trim();
  if (!raw) return [];
  const set = new Set([raw]);
  const withoutPrefix = raw.replace(/^S/i, "");
  const numeric = withoutPrefix.replace(/^0+/, "") || withoutPrefix;
  if (/^\d+$/.test(withoutPrefix)) {
    set.add(withoutPrefix);
    set.add(withoutPrefix.padStart(4, "0"));
    set.add(numeric);
    set.add(numeric.padStart(4, "0"));
    set.add(`S${numeric.padStart(3, "0")}`);
    set.add(`S${numeric.padStart(4, "0")}`);
  }
  return [...set].filter(Boolean);
}

function extractStudentData(data) {
  const peers = Array.isArray(data.peers)
    ? data.peers.map(p => String(p).trim()).filter(Boolean)
    : typeof data.peers === "string"
      ? data.peers.split("|").map(p => p.trim()).filter(Boolean)
      : [];
  return {
    name: data.name || data.student_name || [data.firstName, data.lastName].filter(Boolean).join(" ") || "Unknown",
    email: data.email || data.student_email || "",
    mobile: data.mobile || data.student_mobile || data.contactNo || data.contact_no || data.phone || "",
    peers,
    department: data.department || "",
    year: data.year || "",
    status: data.status || "Active",
  };
}

async function findStudentData(studentId) {
  const candidates = buildCandidates(studentId);
  const colNames = ["student_data", "Student_data"];

  for (const colName of colNames) {
    for (const candidate of candidates) {
      const snap = await getDoc(doc(db, colName, candidate));
      if (snap.exists()) return extractStudentData(snap.data());
    }
  }

  for (const colName of colNames) {
    for (const field of ["student_id", "studentId"]) {
      for (const candidate of candidates) {
        const snap = await getDocs(
          query(collection(db, colName), where(field, "==", candidate))
        );
        if (!snap.empty) return extractStudentData(snap.docs[0].data());
      }
    }
  }

  return { name: "Unknown", email: "", mobile: "", peers: [], department: "", year: "", status: "Active" };
}

export const getPeerCheerStudents = async () => {
  try {
    const snapshot = await getDocs(
      query(
        collection(db, "student_rl_intervention_history"),
        where("action", "==", "PEER_CHEER")
      )
    );

    const results = await Promise.all(
      snapshot.docs.map(async docSnap => {
        const rl = docSnap.data();
        const student = await findStudentData(rl.student_id);

        // Fetch peer details for each peer ID
        const peerDetails = await Promise.all(
          student.peers.map(async peerId => {
            const peer = await findStudentData(peerId);
            return {
              peer_id: peerId.trim(),
              peer_name: peer.name !== "Unknown" ? peer.name : peerId.trim(),
              peer_email: peer.email,
              peer_mobile: peer.mobile,
            };
          })
        );

        return {
          student_id: rl.student_id,
          week: rl.week,
          risk_level: rl.risk_level,
          risk_trend: rl.risk_trend || "STABLE",
          reconstruction_error: rl.reconstruction_error || null,
          name: student.name,
          email: student.email,
          mobile: student.mobile,
          peers: student.peers,
          peer_details: peerDetails,
          department: student.department,
          year: student.year,
          status: student.status,
        };
      })
    );

    return results;
  } catch (error) {
    console.error("Peer cheer fetch error:", error);
    return [];
  }
};

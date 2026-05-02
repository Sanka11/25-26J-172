const STUDENT_DATA_COLLECTIONS = ["student_data", "Student_data"];

function buildStudentIdCandidates(studentId) {
  const raw = String(studentId || "").trim();
  if (!raw) return [];

  const candidates = new Set([raw]);
  const withoutPrefix = raw.replace(/^S/i, "");
  const numeric = withoutPrefix.replace(/^0+/, "") || withoutPrefix;

  if (/^\d+$/.test(withoutPrefix)) {
    candidates.add(withoutPrefix);
    candidates.add(withoutPrefix.padStart(4, "0"));
    candidates.add(numeric);
    candidates.add(numeric.padStart(4, "0"));
    candidates.add(`S${numeric.padStart(3, "0")}`);
    candidates.add(`S${numeric.padStart(4, "0")}`);
  }

  return [...candidates].filter(Boolean);
}

function normalizePeers(peers) {
  if (Array.isArray(peers)) {
    return peers.map((peer) => String(peer).trim()).filter(Boolean);
  }

  if (typeof peers === "string") {
    return peers
      .split("|")
      .map((peer) => peer.trim())
      .filter(Boolean);
  }

  return [];
}

function getStudentDisplayData(doc, fallbackId) {
  const data = doc || {};

  return {
    student_id: data.student_id || data.studentId || fallbackId,
    name:
      data.name ||
      data.student_name ||
      [data.firstName, data.lastName].filter(Boolean).join(" ") ||
      "",
    email: data.email || data.student_email || "",
    mobile:
      data.mobile ||
      data.student_mobile ||
      data.contactNo ||
      data.contact_no ||
      data.phone ||
      "",
    peers: normalizePeers(data.peers || data.student_peers),
    department: data.department || "",
    year: data.year || "",
    status: data.status || "Active",
  };
}

async function findStudentById(db, studentId) {
  const candidates = buildStudentIdCandidates(studentId);

  for (const collectionName of STUDENT_DATA_COLLECTIONS) {
    for (const candidate of candidates) {
      const doc = await db.collection(collectionName).doc(candidate).get();
      if (doc.exists) {
        return {
          id: doc.id,
          collectionName,
          data: getStudentDisplayData(doc.data(), studentId),
        };
      }
    }
  }

  for (const collectionName of STUDENT_DATA_COLLECTIONS) {
    for (const field of ["student_id", "studentId"]) {
      for (const candidate of candidates) {
        const snapshot = await db
          .collection(collectionName)
          .where(field, "==", candidate)
          .limit(1)
          .get();

        if (!snapshot.empty) {
          const doc = snapshot.docs[0];
          return {
            id: doc.id,
            collectionName,
            data: getStudentDisplayData(doc.data(), studentId),
          };
        }
      }
    }
  }

  return {
    id: String(studentId || "").trim(),
    collectionName: null,
    data: getStudentDisplayData(null, studentId),
  };
}

module.exports = {
  findStudentById,
};

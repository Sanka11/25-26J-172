const fetch = require("node-fetch");

const ML_BASE_URL = "http://127.0.0.1:8000";

async function callDisengagementML(payload) {
  const res = await fetch(`${ML_BASE_URL}/disengagement/predict`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text);
  }

  return res.json();
}

module.exports = { callDisengagementML };
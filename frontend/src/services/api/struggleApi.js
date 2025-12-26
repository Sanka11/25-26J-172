// import { appConfig } from "../../config/env";

// export async function predictStruggle(data) {
//   try {
//     const response = await fetch(appConfig.PREDICT_STRUGGLE_URL, {
//       method: "POST",
//       headers: { "Content-Type": "application/json" },
//       body: JSON.stringify(data),
//     });

//     return await response.json();
//   } catch (error) {
//     console.error("struggle error :", error);
//     return { error: true };
//   }
// }
import { appConfig } from "../../config/env";

/**
 * Predict struggling skills (SAFE version)
 */
export async function predictStruggle(payload) {
  try {
    const res = await fetch(appConfig.PREDICT_STRUGGLE_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await res.json();

    if (!res.ok) {
      console.error("Struggle API error:", {
        url: appConfig.PREDICT_STRUGGLE_URL,
        status: res.status,
        response: data,
        payload,
      });
      return null; // ✅ IMPORTANT
    }

    return data;
  } catch (error) {
    console.error("Struggle API fetch error:", error);
    return null; // ✅ IMPORTANT
  }
}

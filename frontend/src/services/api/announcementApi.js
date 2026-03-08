import { appConfig } from "../../config/env";

function getAnnouncementCandidateUrls(url) {
  const candidates = new Set([url]);

  // Switch localhost <-> 127.0.0.1
  candidates.add(url.replace("127.0.0.1", "localhost"));
  candidates.add(url.replace("localhost", "127.0.0.1"));

  // Switch 5001 <-> 5002
  candidates.add(url.replace(":5001", ":5002"));
  candidates.add(url.replace(":5002", ":5001"));

  // Combine host + port fallbacks
  const current = Array.from(candidates);
  current.forEach((candidate) => {
    candidates.add(
      candidate.replace("127.0.0.1", "localhost").replace(":5001", ":5002"),
    );
    candidates.add(
      candidate.replace("localhost", "127.0.0.1").replace(":5002", ":5001"),
    );
  });

  return Array.from(candidates);
}

async function fetchWithAnnouncementFallback(baseUrl, options) {
  const urls = getAnnouncementCandidateUrls(baseUrl);
  let lastError = null;

  for (const url of urls) {
    try {
      const res = await fetch(url, options);
      if (!res.ok) {
        const text = await res.text();
        console.error("Announcements API error", {
          url,
          status: res.status,
          response: text,
        });
        continue;
      }
      return res;
    } catch (err) {
      lastError = err;
    }
  }

  if (lastError) throw lastError;
  throw new Error("Announcements API request failed for all fallback URLs");
}

export async function createAnnouncement(data) {
  const res = await fetchWithAnnouncementFallback(
    appConfig.CREATE_ANNOUNCEMENT_URL,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    },
  );

  return res.json();
}

export async function getAnnouncements() {
  try {
    const res = await fetchWithAnnouncementFallback(
      appConfig.GET_ANNOUNCEMENTS_URL,
    );

    return res.json();
  } catch (err) {
    console.error("GetAnnouncements network error", err);
    return []; // Return empty array on network failure
  }
}

export async function updateAnnouncement(id, data) {
  const res = await fetchWithAnnouncementFallback(
    appConfig.UPDATE_ANNOUNCEMENT_URL,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, ...data }),
    },
  );

  return res.json();
}

export async function deleteAnnouncement(id) {
  const res = await fetchWithAnnouncementFallback(
    appConfig.DELETE_ANNOUNCEMENT_URL,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    },
  );

  return res.json();
}

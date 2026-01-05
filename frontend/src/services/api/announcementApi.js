import { appConfig } from "../../config/env";

export async function createAnnouncement(data) {
  const res = await fetch(appConfig.CREATE_ANNOUNCEMENT_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const text = await res.text();
    console.error("CreateAnnouncement API error", {
      status: res.status,
      response: text,
    });
    throw new Error(`Create announcement failed (${res.status})`);
  }

  return res.json();
}

export async function getAnnouncements() {
  const res = await fetch(appConfig.GET_ANNOUNCEMENTS_URL);

  if (!res.ok) {
    const text = await res.text();
    console.error("GetAnnouncements API error", {
      status: res.status,
      response: text,
    });
    throw new Error(`Get announcements failed (${res.status})`);
  }

  return res.json();
}

export async function updateAnnouncement(id, data) {
  const res = await fetch(appConfig.UPDATE_ANNOUNCEMENT_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id, ...data }),
  });

  if (!res.ok) {
    const text = await res.text();
    console.error("UpdateAnnouncement API error", {
      status: res.status,
      response: text,
    });
    throw new Error(`Update announcement failed (${res.status})`);
  }

  return res.json();
}

export async function deleteAnnouncement(id) {
  const res = await fetch(appConfig.DELETE_ANNOUNCEMENT_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id }),
  });

  if (!res.ok) {
    const text = await res.text();
    console.error("DeleteAnnouncement API error", {
      status: res.status,
      response: text,
    });
    throw new Error(`Delete announcement failed (${res.status})`);
  }

  return res.json();
}
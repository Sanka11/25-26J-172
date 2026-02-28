import { appConfig } from "../../config/env";

/* ---------------- WORKLOAD ---------------- */

export async function generateWorkloadIfNeeded(studentId, semesterStartDate) {
  console.log("➡️ [API] generateWorkloadIfNeeded called");
  console.log("   studentId:", studentId);
  console.log("   semesterStartDate:", semesterStartDate);
  console.log("   URL:", appConfig.GENERATE_WORKLOAD_URL);

  const res = await fetch(appConfig.GENERATE_WORKLOAD_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      studentId,
      semesterStartDate,
    }),
  });

  console.log("⬅️ [API] generateWorkload response status:", res.status);

  if (!res.ok) {
    let err = {};
    try {
      err = await res.json();
    } catch (e) {
      console.error("❌ Failed to parse error JSON");
    }

    console.error("❌ Generate workload backend error:", err);
    throw new Error("Generate workload failed");
  }

  const data = await res.json();
  console.log("✅ Generate workload success response:", data);

  return data;
}

export async function fetchWeeklyWorkload(studentId) {
  const url = `${appConfig.GET_WEEKLY_WORKLOAD_URL}?studentId=${studentId}`;

  console.log("➡️ [API] fetchWeeklyWorkload called");
  console.log("   studentId:", studentId);
  console.log("   URL:", url);

  const res = await fetch(url);

  console.log("⬅️ [API] fetchWeeklyWorkload response status:", res.status);

  if (!res.ok) {
    console.error("❌ Fetch weekly workload failed");
    throw new Error("Fetch weekly workload failed");
  }

  const data = await res.json();
  console.log("✅ Weekly workload response:", data);
  console.log("   Is array?", Array.isArray(data));

  return data;
}

/* ---------------- ALERTS ---------------- */

export async function fetchLectureAlerts() {
  console.log("➡️ [API] fetchLectureAlerts called");
  console.log("   URL:", appConfig.GENERATE_LECTURE_ALERTS_URL);

  const res = await fetch(appConfig.GENERATE_LECTURE_ALERTS_URL);

  console.log("⬅️ [API] fetchLectureAlerts response status:", res.status);

  if (!res.ok) {
    console.error("❌ Fetch lecture alerts failed");
    throw new Error("Fetch lecture alerts failed");
  }

  const data = await res.json();
  console.log("✅ Lecture alerts response:", data);
  console.log("   alerts exists?", Array.isArray(data?.alerts));

  return data;
}

/* ---------------- STUDENT ---------------- */

export async function fetchStudentEnrollment(studentId) {
  const url = `${appConfig.GET_STUDENT_ENROLLMENT_URL}?studentId=${studentId}`;

  console.log("➡️ [API] fetchStudentEnrollment called");
  console.log("   studentId:", studentId);
  console.log("   URL:", url);

  const res = await fetch(url);

  console.log("⬅️ [API] fetchStudentEnrollment response status:", res.status);

  if (!res.ok) {
    console.error("❌ Fetch enrollment failed");
    throw new Error("Fetch enrollment failed");
  }

  const data = await res.json();
  console.log("✅ Enrollment response:", data);
  console.log("   subjects:", data?.subjects);
  console.log("   semesterStartDate:", data?.semesterStartDate);

  return data;
}

// In your frontend services/api/workloadService.js
export async function generateBusyWeekReminders(studentId) {
  const url = appConfig.GENERATE_BUSY_WEEK_REMINDERS_URL;

  console.log("➡️ [API] generateBusyWeekReminders called");
  console.log("   studentId:", studentId);
  console.log("   URL:", url);

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ studentId }),
  });

  console.log(
    "⬅️ [API] generateBusyWeekReminders response status:",
    res.status,
  );

  if (!res.ok) {
    console.error("❌ Generate busy week reminders failed");
    const errorText = await res.text();
    console.error("   Error details:", errorText);
    throw new Error("Generate busy week reminders failed");
  }

  const data = await res.json();
  console.log("✅ Generate busy week reminders response:", data);
  console.log("   Reminders created:", data.remindersCreated || 0);
  console.log("   Message:", data.message);

  return data;
}

// Fetch active reminders
// export async function fetchActiveReminders(studentId) {
//   const url = `${appConfig.GET_ACTIVE_REMINDERS_URL}?studentId=${studentId}`;

//   console.log("➡️ [API] fetchActiveReminders called");
//   console.log("   studentId:", studentId);
//   console.log("   URL:", url);

//   const res = await fetch(url);

//   console.log("⬅️ [API] fetchActiveReminders response status:", res.status);

//   if (!res.ok) {
//     console.error("❌ Fetch active reminders failed");
//     const errorText = await res.text();
//     console.error("   Error details:", errorText);

//     // Return empty array instead of throwing to prevent UI crash
//     return { reminders: [], count: 0, studentId };
//   }

//   const data = await res.json();
//   console.log("✅ Fetch active reminders response:", data);
//   console.log("   Total reminders count:", data.count || 0);
//   console.log("   Reminders array length:", data.reminders?.length || 0);

//   // Log each reminder details for debugging
//   if (data.reminders && data.reminders.length > 0) {
//     console.log("📋 Reminder details:");
//     data.reminders.forEach((reminder, index) => {
//       console.log(`   ${index + 1}. ID: ${reminder.id}`);
//       console.log(`      Target Week: ${reminder.targetBusyWeek}`);
//       console.log(`      Status: ${reminder.targetStatus}`);
//       console.log(`      Hours: ${reminder.targetTotalHours}h`);
//       console.log(`      Week Start: ${reminder.targetWeekStart}`);
//       console.log(
//         `      Active: ${reminder.isActive}, Dismissed: ${reminder.isDismissed}`,
//       );
//     });
//   } else {
//     console.log("ℹ️ No reminders found in response");
//   }

//   return data;
// }
export async function fetchActiveReminders(studentId) {
  const url = `${appConfig.GET_ACTIVE_REMINDERS_URL}?studentId=${studentId}`;

  console.log("➡️ [API] fetchActiveReminders called");
  console.log("   studentId:", studentId);
  console.log("   URL:", url);

  const res = await fetch(url);

  console.log("⬅️ [API] fetchActiveReminders response status:", res.status);

  if (!res.ok) {
    console.error("❌ Fetch active reminders failed");
    const errorText = await res.text();
    console.error("   Error details:", errorText);

    // Return empty array instead of throwing to prevent UI crash
    return { reminders: [], count: 0, studentId };
  }

  const data = await res.json();

  // 🌟 NEW FRONTEND FILTERING LOGIC 🌟
  if (data.reminders && data.reminders.length > 0) {
    const uniqueRemindersMap = new Map();

    data.reminders.forEach((reminder) => {
      const targetWeek = reminder.targetBusyWeek;
      const existingReminder = uniqueRemindersMap.get(targetWeek);

      if (!existingReminder) {
        // If we haven't seen this target week yet, add it to the map
        uniqueRemindersMap.set(targetWeek, reminder);
      } else {
        // If we already have a reminder for this week, keep the one with the highest reminderWeek
        if (reminder.reminderWeek > existingReminder.reminderWeek) {
          uniqueRemindersMap.set(targetWeek, reminder);
        }
      }
    });

    // Replace the original array with our clean, deduplicated array
    data.reminders = Array.from(uniqueRemindersMap.values());
    data.count = data.reminders.length; // Update the count to match
  }
  // 🌟 END FILTERING LOGIC 🌟

  console.log("✅ Fetch active reminders response:", data);
  console.log("   Total reminders count:", data.count || 0);
  console.log("   Reminders array length:", data.reminders?.length || 0);

  // Log each reminder details for debugging
  if (data.reminders && data.reminders.length > 0) {
    console.log("📋 Reminder details:");
    data.reminders.forEach((reminder, index) => {
      console.log(`   ${index + 1}. ID: ${reminder.id}`);
      console.log(`      Target Week: ${reminder.targetBusyWeek}`);
      console.log(`      Status: ${reminder.targetStatus}`);
      console.log(`      Hours: ${reminder.targetTotalHours}h`);
      console.log(`      Week Start: ${reminder.targetWeekStart}`);
      console.log(
        `      Active: ${reminder.isActive}, Dismissed: ${reminder.isDismissed}`,
      );
    });
  } else {
    console.log("ℹ️ No reminders found in response");
  }

  return data;
}

// Dismiss a reminder
export async function dismissReminder(reminderId, studentId) {
  const url = appConfig.DISMISS_REMINDER_URL;

  console.log("➡️ [API] dismissReminder called");
  console.log("   reminderId:", reminderId);
  console.log("   studentId:", studentId);
  console.log("   URL:", url);

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ reminderId, studentId }),
  });

  console.log("⬅️ [API] dismissReminder response status:", res.status);

  if (!res.ok) {
    console.error("❌ Dismiss reminder failed");
    const errorText = await res.text();
    console.error("   Error details:", errorText);
    throw new Error("Dismiss reminder failed");
  }

  const data = await res.json();
  console.log("✅ Dismiss reminder response:", data);
  console.log("   Message:", data.message);

  return data;
}

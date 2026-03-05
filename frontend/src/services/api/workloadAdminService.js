import axios from "axios";
import { appConfig } from "../../config/env";

/**
 * Fetches all weekly workloads for all students
 */
export async function fetchAllStudentsWorkloads() {
  const response = await axios.get(appConfig.GET_ALL_WORKLOADS_URL);
  return response.data;
}

/**
 * Updates the completion status of a specific task in the breakdown array
 */
export async function updateTaskCompletion(docId, taskIndex, isCompleted) {
  const response = await axios.patch(appConfig.UPDATE_TASK_COMPLETION_URL, {
    docId,
    taskIndex,
    isCompleted,
  });
  return response.data;
}

/**
 * Manually triggers the warning email for a specific student's missed tasks
 */
export async function triggerManualWarningEmail(studentId, week) {
  const response = await axios.post(appConfig.TRIGGER_WARNING_EMAIL_URL, {
    studentId,
    week,
  });
  return response.data;
}

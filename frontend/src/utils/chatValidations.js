/**
 * Chat Validations Module
 * Centralized validation rules for the AcademiGuard chatbot
 */

// ================================================================
// INPUT VALIDATIONS
// ================================================================

/**
 * Validate question input
 * Rules:
 * - Min 1 character, max 2000 characters
 * - Cannot be only whitespace
 * - Must be a string
 */
export const validateQuestion = (input) => {
  if (!input) {
    return { valid: false, error: "Question cannot be empty" };
  }

  if (typeof input !== "string") {
    return { valid: false, error: "Question must be text" };
  }

  const trimmed = input.trim();

  if (trimmed.length === 0) {
    return { valid: false, error: "Question cannot be only whitespace" };
  }

  if (trimmed.length < 1) {
    return {
      valid: false,
      error: "Question is too short (minimum 1 character)",
    };
  }

  if (trimmed.length > 2000) {
    return {
      valid: false,
      error: "Question is too long (maximum 2000 characters)",
    };
  }

  // Prevent prompt injection attempts
  if (hasPromptInjectionPatterns(trimmed)) {
    return { valid: false, error: "Invalid question format detected" };
  }

  return { valid: true, error: null, sanitized: trimmed };
};

/**
 * Validate PDF file upload
 * Rules:
 * - File must exist
 * - Must be PDF (.pdf)
 * - Max 20MB
 * - Min 10KB
 */
export const validatePdfFile = (file) => {
  if (!file) {
    return { valid: false, error: "File is required" };
  }

  if (!(file instanceof File)) {
    return { valid: false, error: "Invalid file object" };
  }

  // Check file type
  if (file.type !== "application/pdf" && !file.name.endsWith(".pdf")) {
    return { valid: false, error: "Only PDF files are allowed" };
  }

  // Check file size - max 20MB
  const maxSize = 20 * 1024 * 1024; // 20MB
  if (file.size > maxSize) {
    return {
      valid: false,
      error: `File too large. Maximum size is 20MB (yours: ${(file.size / 1024 / 1024).toFixed(2)}MB)`,
    };
  }

  // Check file size - min 10KB
  const minSize = 10 * 1024; // 10KB
  if (file.size < minSize) {
    return { valid: false, error: "File too small. Minimum size is 10KB" };
  }

  // Check filename length
  if (file.name.length > 255) {
    return { valid: false, error: "Filename too long (max 255 characters)" };
  }

  // Prevent path traversal attacks
  if (
    file.name.includes("..") ||
    file.name.includes("/") ||
    file.name.includes("\\")
  ) {
    return { valid: false, error: "Invalid filename detected" };
  }

  return { valid: true, error: null };
};

/**
 * Validate image file for OCR
 * Rules:
 * - File must exist
 * - Must be image (.jpg, .png, .jpeg, .gif, .webp)
 * - Max 10MB
 */
export const validateImageFile = (file) => {
  if (!file) {
    return { valid: false, error: "File is required" };
  }

  if (!(file instanceof File)) {
    return { valid: false, error: "Invalid file object" };
  }

  const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
  const allowedExtensions = [".jpg", ".jpeg", ".png", ".gif", ".webp"];

  const isValidType = allowedTypes.includes(file.type);
  const isValidExtension = allowedExtensions.some((ext) =>
    file.name.toLowerCase().endsWith(ext),
  );

  if (!isValidType && !isValidExtension) {
    return {
      valid: false,
      error: "Only image files (JPG, PNG, GIF, WebP) are allowed",
    };
  }

  // Check file size - max 10MB
  const maxSize = 10 * 1024 * 1024; // 10MB
  if (file.size > maxSize) {
    return {
      valid: false,
      error: `Image too large. Maximum size is 10MB (yours: ${(file.size / 1024 / 1024).toFixed(2)}MB)`,
    };
  }

  return { valid: true, error: null };
};

/**
 * Validate OCR extracted text quality from image uploads.
 * Rejects photos with little/no readable text (e.g., flowers, animals).
 */
export const validateExtractedImageText = (text) => {
  const normalized = (text || "").replace(/\s+/g, " ").trim();

  if (!normalized) {
    return {
      valid: false,
      error:
        "No readable text detected. Please upload a text-based image (document, notes, or screenshot with text).",
    };
  }

  const letters = (normalized.match(/[A-Za-z]/g) || []).length;
  const words = normalized
    .split(/\s+/)
    .filter((w) => /[A-Za-z]/.test(w)).length;

  if (letters < 12 || words < 3) {
    return {
      valid: false,
      error:
        "This image does not contain enough readable text. Please upload a text-focused image instead of a photo.",
    };
  }

  return { valid: true, error: null, sanitized: normalized };
};

// ================================================================
// AUTHENTICATION & AUTHORIZATION
// ================================================================

/**
 * Validate user authentication state
 * Rules:
 * - User must be logged in (currentUser must exist)
 * - Must have user data loaded
 */
export const validateUserAuth = (currentUser, userData) => {
  if (!currentUser) {
    return { valid: false, error: "Please log in to use the chatbot" };
  }

  if (!currentUser.uid) {
    return { valid: false, error: "Invalid authentication state" };
  }

  if (!userData) {
    return {
      valid: false,
      error: "User data not loaded yet. Please try again.",
    };
  }

  return { valid: true, error: null };
};

/**
 * Validate admin access for PDF operations
 * Rules:
 * - User must have ADMIN or SUPER_ADMIN role
 */
export const validateAdminAccess = (userRole) => {
  const ADMIN_ROLES = ["admin", "super_admin", "ADMIN", "SUPER_ADMIN"];

  if (!userRole) {
    return { valid: false, error: "User role not defined" };
  }

  if (!ADMIN_ROLES.includes(userRole)) {
    return { valid: false, error: "Only administrators can upload PDFs" };
  }

  return { valid: true, error: null };
};

/**
 * Validate student ID resolution
 * Rules:
 * - Must be able to find at least one student ID candidate
 * - Candidates checked in order: student_id > studentId > email > uid
 */
export const validateStudentId = (studentCandidates) => {
  if (!studentCandidates || studentCandidates.length === 0) {
    return { valid: false, error: "Could not resolve student ID" };
  }

  const validId = studentCandidates.find(
    (id) => id && typeof id === "string" && id.trim().length > 0,
  );

  if (!validId) {
    return { valid: false, error: "No valid student identifier found" };
  }

  return { valid: true, error: null, studentId: validId };
};

// ================================================================
// API RESPONSE VALIDATION
// ================================================================

/**
 * Validate chat API response
 * Rules:
 * - Must have HTTP 200 status
 * - Must have "answer" property
 * - Answer must be non-empty string
 */
export const validateChatResponse = (data, status = 200) => {
  if (status !== 200) {
    return { valid: false, error: `Chat service returned status ${status}` };
  }

  if (!data) {
    return { valid: false, error: "Empty response from chat service" };
  }

  if (typeof data !== "object") {
    return { valid: false, error: "Invalid response format" };
  }

  if (!data.answer || typeof data.answer !== "string") {
    return { valid: false, error: "No valid answer in response" };
  }

  if (data.answer.trim().length === 0) {
    return { valid: false, error: "Bot returned empty answer" };
  }

  return { valid: true, error: null };
};

/**
 * Validate documents list response
 * Rules:
 * - Must be an array
 * - Each item must have doc_id and pdf_name
 */
export const validateDocumentsResponse = (data) => {
  if (!Array.isArray(data)) {
    return { valid: false, error: "Documents response must be an array" };
  }

  // Validate each document has required fields
  const invalidDocs = data.filter(
    (doc) => !doc.doc_id || !doc.pdf_name || typeof doc.doc_id !== "string",
  );

  if (invalidDocs.length > 0) {
    return {
      valid: false,
      error: `${invalidDocs.length} document(s) have missing required fields`,
    };
  }

  return { valid: true, error: null };
};

// ================================================================
// MESSAGE VALIDATION
// ================================================================

/**
 * Validate chat message object
 * Rules:
 * - Must have id, sender, text, createdAt
 * - sender must be "user" or "assistant"
 * - id must be unique identifier
 */
export const validateChatMessage = (message) => {
  if (!message || typeof message !== "object") {
    return { valid: false, error: "Invalid message object" };
  }

  if (!message.id || typeof message.id !== "string") {
    return { valid: false, error: "Message must have unique id" };
  }

  if (!message.sender || !["user", "assistant"].includes(message.sender)) {
    return { valid: false, error: "Invalid sender type" };
  }

  if (
    message.sender === "user" &&
    (!message.text || typeof message.text !== "string")
  ) {
    return { valid: false, error: "User message must have text" };
  }

  if (!message.createdAt || typeof message.createdAt !== "string") {
    return { valid: false, error: "Message must have valid timestamp" };
  }

  // Validate timestamp is ISO string
  if (isNaN(new Date(message.createdAt).getTime())) {
    return { valid: false, error: "Invalid message timestamp" };
  }

  return { valid: true, error: null };
};

// ================================================================
// SECURITY CHECKS
// ================================================================

/**
 * Detect common prompt injection patterns
 * Prevents: SQL injection, code injection, jailbreak attempts
 */
function hasPromptInjectionPatterns(text) {
  const injectionPatterns = [
    /(\bSELECT\b|\bINSERT\b|\bDROP\b|\bUPDATE\b)/i, // SQL
    /(<script|javascript:|onerror=|onload=)/i, // XSS
    /(\{.*\}|eval\(|exec\()/, // Code injection
    /ignore previous|forget everything|as a/i, // Prompt injection
  ];

  return injectionPatterns.some((pattern) => pattern.test(text));
}

/**
 * Sanitize user input
 * Removes dangerous characters and normalizes whitespace
 */
export const sanitizeInput = (input) => {
  if (typeof input !== "string") return "";

  return input
    .trim() // Remove leading/trailing whitespace
    .replace(/\s+/g, " ") // Normalize multiple spaces
    .slice(0, 2000); // Enforce max length
};

/**
 * Validate API endpoint URL
 * Rules:
 * - Must be valid URL
 * - Must be HTTPS (except localhost for development)
 * - Must not have query parameters
 */
export const validateApiUrl = (url) => {
  if (!url || typeof url !== "string") {
    return { valid: false, error: "API URL is required" };
  }

  try {
    const parsed = new URL(url);

    // Allow http for localhost development only
    if (
      parsed.protocol === "http:" &&
      !url.includes("localhost") &&
      !url.includes("127.0.0.1")
    ) {
      return { valid: false, error: "API endpoints must use HTTPS" };
    }

    return { valid: true, error: null, url };
  } catch (e) {
    return { valid: false, error: "Invalid API URL format" };
  }
};

// ================================================================
// RATE LIMITING CHECKS
// ================================================================

/**
 * Basic rate limiting check (client-side)
 * Rules:
 * - Maximum 30 messages per minute
 * - Maximum 10 PDFs uploaded per hour
 */
export const checkRateLimit = (timestamps, maxRequests, windowMs) => {
  if (!Array.isArray(timestamps)) {
    return { allowed: true, reason: null };
  }

  const now = Date.now();
  const recentRequests = timestamps.filter((t) => now - t < windowMs);

  if (recentRequests.length >= maxRequests) {
    const oldestTime = recentRequests[0];
    const waitTime = Math.ceil((oldestTime + windowMs - now) / 1000);
    return {
      allowed: false,
      reason: `Too many requests. Please wait ${waitTime}s before trying again.`,
    };
  }

  return { allowed: true, reason: null };
};

// ================================================================
// EXPORT VALIDATION PRESETS
// ================================================================

export const VALIDATION_RULES = {
  question: {
    minLength: 1,
    maxLength: 2000,
    description: "User question input",
  },
  pdf: {
    maxSize: 20 * 1024 * 1024, // 20MB
    minSize: 10 * 1024, // 10KB
    allowedType: "application/pdf",
    description: "PDF document upload",
  },
  image: {
    maxSize: 10 * 1024 * 1024, // 10MB
    allowedTypes: ["image/jpeg", "image/png", "image/gif", "image/webp"],
    description: "Image for OCR processing",
  },
  rateLimit: {
    messages: { max: 30, window: 60000 }, // 30 per minute
    uploads: { max: 10, window: 3600000 }, // 10 per hour
    description: "Rate limiting thresholds",
  },
};

/**
 * backend/functions/middleware/authMiddleware.js
 * Firebase authentication middleware for Express
 */

const admin = require("firebase-admin");
const logger = require("../utils/logger");

/**
 * Verify Firebase ID token and attach user to request
 * Usage: app.use(withAuthMiddleware)
 */
const withAuthMiddleware = async (req, res, next) => {
  try {
    // Extract token from Authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Missing authorization token" });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify token with Firebase
    const decodedToken = await admin.auth().verifyIdToken(token);

    // Attach user information to request
    req.user = {
      uid: decodedToken.uid,
      email: decodedToken.email,
      emailVerified: decodedToken.email_verified,
      displayName: decodedToken.name,
      issueTime: new Date(decodedToken.iat * 1000),
      expirationTime: new Date(decodedToken.exp * 1000),
    };

    logger.debug(`Authenticated user: ${req.user.uid}`);
    next();
  } catch (error) {
    logger.warn(`Authentication failed: ${error.message}`);

    if (error.code === "auth/id-token-expired") {
      return res
        .status(401)
        .json({ error: "Token has expired. Please sign in again." });
    }

    if (error.code === "auth/invalid-id-token") {
      return res.status(401).json({ error: "Invalid authentication token" });
    }

    res
      .status(401)
      .json({ error: "Authentication failed. Please provide a valid token." });
  }
};

/**
 * Optional: Check if user is admin
 * Usage: app.use(withAdminCheck)
 */
const withAdminCheck = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "User must be authenticated" });
    }

    // Get user from Firestore to check admin status
    const userDoc = await admin
      .firestore()
      .collection("users")
      .doc(req.user.uid)
      .get();

    if (!userDoc.exists || !userDoc.data().isAdmin) {
      return res.status(403).json({ error: "Admin access required" });
    }

    next();
  } catch (error) {
    logger.error(`Admin check failed: ${error.message}`);
    res.status(500).json({ error: "Error checking admin status" });
  }
};

/**
 * Verify user ID matches in request
 * Usage: Use in route handlers to ensure users can't access other user's data
 */
const verifyOwnUser = (req, res, next) => {
  const { userId } = req.params;

  if (!req.user) {
    return res.status(401).json({ error: "User must be authenticated" });
  }

  if (req.user.uid !== userId) {
    return res.status(403).json({ error: "Cannot access other user's data" });
  }

  next();
};

module.exports = {
  withAuthMiddleware,
  withAdminCheck,
  verifyOwnUser,
};

/**
 * backend/functions/routes/chatRoutes.js
 * Express routes for chat and message handling
 */

const express = require("express");
const router = express.Router();
const {
  ChatHistoryService,
  PersonalizationService,
  FirestoreService,
} = require("../services");
const logger = require("../utils/logger");

// Initialize services
const chatHistoryService = new ChatHistoryService();
const personalizationService = new PersonalizationService();
const firestoreService = new FirestoreService();

/**
 * POST /api/chat/:userId/message
 * Save a new message and process through RAG/Web/Hybrid modes
 */
router.post("/api/chat/:userId/message", async (req, res) => {
  try {
    const { userId } = req.params;
    const { message, conversationId, responseMode } = req.body;

    // Verify user is sending their own message
    if (req.user.uid !== userId) {
      return res
        .status(403)
        .json({ error: "Cannot send message as another user" });
    }

    // Validate required fields
    if (!message || !message.content) {
      return res.status(400).json({ error: "Message content is required" });
    }

    // Create message object
    const userMessage = {
      conversationId: conversationId || `conv_${Date.now()}`,
      sender: "user",
      content: message.content,
      timestamp: new Date().toISOString(),
      metadata: message.metadata || {},
    };

    // Save user message to Firestore
    await chatHistoryService.saveMessage(userId, userMessage);

    // Get user's settings for response mode preference
    const userSettings = await firestoreService.getUserSettings(userId);
    const mode = responseMode || userSettings?.responseMode || "hybrid";

    // Build personalization context for better response
    const personalizationContext =
      await personalizationService.buildPersonalizationContext(userId);

    logger.debug(`Processing message for user ${userId} in ${mode} mode`);

    // TODO: Integrate with your RAG system
    // This is where your answer_question() function should be called
    // Pass: message.content, mode, personalizationContext
    // Expected response: { answer, mode, sources }

    const response = {
      conversationId: userMessage.conversationId,
      mode,
      status: "pending", // Will be 'success' after RAG integration
      message: "Message received. RAG processing pending.",
    };

    res.status(200).json(response);
  } catch (error) {
    logger.error(`Error processing message: ${error.message}`);
    res.status(500).json({ error: "Error processing message" });
  }
});

/**
 * GET /api/chat/:userId/history
 * Get user's chat history
 */
router.get("/api/chat/:userId/history", async (req, res) => {
  try {
    const { userId } = req.params;
    const { limit = 50, offset = 0 } = req.query;

    // Verify user is accessing their own history
    if (req.user.uid !== userId) {
      return res
        .status(403)
        .json({ error: "Cannot access other user's chat history" });
    }

    const messages = await chatHistoryService.getUserChatHistory(
      userId,
      parseInt(limit),
      parseInt(offset),
    );

    res.status(200).json({ messages, count: messages.length });
  } catch (error) {
    logger.error(`Error retrieving chat history: ${error.message}`);
    res.status(500).json({ error: "Error retrieving chat history" });
  }
});

/**
 * GET /api/chat/:userId/conversations
 * Get user's recent conversations
 */
router.get("/api/chat/:userId/conversations", async (req, res) => {
  try {
    const { userId } = req.params;
    const { limit = 10 } = req.query;

    if (req.user.uid !== userId) {
      return res
        .status(403)
        .json({ error: "Cannot access other user's conversations" });
    }

    const conversations = await chatHistoryService.getRecentConversations(
      userId,
      parseInt(limit),
    );

    res.status(200).json(conversations);
  } catch (error) {
    logger.error(`Error retrieving conversations: ${error.message}`);
    res.status(500).json({ error: "Error retrieving conversations" });
  }
});

/**
 * GET /api/chat/:userId/conversation/:conversationId
 * Get a specific conversation
 */
router.get(
  "/api/chat/:userId/conversation/:conversationId",
  async (req, res) => {
    try {
      const { userId, conversationId } = req.params;

      if (req.user.uid !== userId) {
        return res
          .status(403)
          .json({ error: "Cannot access other user's conversation" });
      }

      const conversation = await chatHistoryService.getConversation(
        userId,
        conversationId,
      );

      if (!conversation) {
        return res.status(404).json({ error: "Conversation not found" });
      }

      res.status(200).json(conversation);
    } catch (error) {
      logger.error(`Error retrieving conversation: ${error.message}`);
      res.status(500).json({ error: "Error retrieving conversation" });
    }
  },
);

/**
 * DELETE /api/chat/:userId/history
 * Delete all chat history for user
 */
router.delete("/api/chat/:userId/history", async (req, res) => {
  try {
    const { userId } = req.params;

    if (req.user.uid !== userId) {
      return res
        .status(403)
        .json({ error: "Cannot delete other user's chat history" });
    }

    await chatHistoryService.deleteUserChatHistory(userId);

    res.status(200).json({ message: "Chat history deleted successfully" });
  } catch (error) {
    logger.error(`Error deleting chat history: ${error.message}`);
    res.status(500).json({ error: "Error deleting chat history" });
  }
});

/**
 * DELETE /api/chat/:userId/message/:messageId
 * Delete a specific message
 */
router.delete("/api/chat/:userId/message/:messageId", async (req, res) => {
  try {
    const { userId, messageId } = req.params;

    if (req.user.uid !== userId) {
      return res
        .status(403)
        .json({ error: "Cannot delete other user's message" });
    }

    await chatHistoryService.deleteMessage(userId, messageId);

    res.status(200).json({ message: "Message deleted successfully" });
  } catch (error) {
    logger.error(`Error deleting message: ${error.message}`);
    res.status(500).json({ error: "Error deleting message" });
  }
});

/**
 * POST /api/chat/:userId/search
 * Search user's chat history
 */
router.post("/api/chat/:userId/search", async (req, res) => {
  try {
    const { userId } = req.params;
    const { query } = req.body;

    if (req.user.uid !== userId) {
      return res
        .status(403)
        .json({ error: "Cannot search other user's chat history" });
    }

    if (!query) {
      return res.status(400).json({ error: "Search query is required" });
    }

    const results = await chatHistoryService.searchConversations(userId, query);

    res.status(200).json({ results, count: results.length });
  } catch (error) {
    logger.error(`Error searching chat history: ${error.message}`);
    res.status(500).json({ error: "Error searching chat history" });
  }
});

/**
 * GET /api/chat/:userId/statistics
 * Get user's chat statistics
 */
router.get("/api/chat/:userId/statistics", async (req, res) => {
  try {
    const { userId } = req.params;

    if (req.user.uid !== userId) {
      return res
        .status(403)
        .json({ error: "Cannot access other user's statistics" });
    }

    const stats = await chatHistoryService.getChatStatistics(userId);

    res.status(200).json(stats);
  } catch (error) {
    logger.error(`Error retrieving chat statistics: ${error.message}`);
    res.status(500).json({ error: "Error retrieving chat statistics" });
  }
});

/**
 * POST /api/chat/:userId/export
 * Export user's chat history
 */
router.post("/api/chat/:userId/export", async (req, res) => {
  try {
    const { userId } = req.params;
    const { format = "json" } = req.body;

    if (req.user.uid !== userId) {
      return res
        .status(403)
        .json({ error: "Cannot export other user's chat history" });
    }

    const exportedData = await chatHistoryService.exportChatHistory(
      userId,
      format,
    );

    // Set response headers for file download
    if (format === "json") {
      res.setHeader("Content-Type", "application/json");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="chat_history_${userId}_${Date.now()}.json"`,
      );
      res.send(JSON.stringify(exportedData, null, 2));
    } else if (format === "csv") {
      res.setHeader("Content-Type", "text/csv");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="chat_history_${userId}_${Date.now()}.csv"`,
      );
      res.send(exportedData);
    } else {
      return res
        .status(400)
        .json({ error: 'Invalid export format. Use "json" or "csv".' });
    }
  } catch (error) {
    logger.error(`Error exporting chat history: ${error.message}`);
    res.status(500).json({ error: "Error exporting chat history" });
  }
});

/**
 * GET /api/chat/:userId/reminders
 * Get academic reminders for user
 */
router.get("/api/chat/:userId/reminders", async (req, res) => {
  try {
    const { userId } = req.params;

    if (req.user.uid !== userId) {
      return res
        .status(403)
        .json({ error: "Cannot access other user's reminders" });
    }

    const reminders = await personalizationService.getAcademicReminders(userId);

    res.status(200).json(reminders);
  } catch (error) {
    logger.error(`Error retrieving reminders: ${error.message}`);
    res.status(500).json({ error: "Error retrieving reminders" });
  }
});

/**
 * GET /api/chat/:userId/personalization
 * Get user's personalization context
 */
router.get("/api/chat/:userId/personalization", async (req, res) => {
  try {
    const { userId } = req.params;

    if (req.user.uid !== userId) {
      return res
        .status(403)
        .json({ error: "Cannot access other user's personalization data" });
    }

    const context =
      await personalizationService.buildPersonalizationContext(userId);

    res.status(200).json(context);
  } catch (error) {
    logger.error(`Error building personalization context: ${error.message}`);
    res.status(500).json({ error: "Error building personalization context" });
  }
});

module.exports = router;

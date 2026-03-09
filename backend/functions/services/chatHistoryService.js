/**
 * backend/functions/services/chatHistoryService.js
 * Chat history management service for storing and retrieving conversations
 */

const admin = require("firebase-admin");
const logger = require("../utils/logger");

class ChatHistoryService {
  constructor() {
    this.db = admin.firestore();
    this.historyCollection = "chat_history";
    this.messageRetentionDays = 90;
    logger.info("ChatHistoryService initialized");
  }

  /**
   * Save a chat message to history
   * @param {Object} message - Message data containing userId, question, answer, etc.
   * @returns {Promise<string>} Document ID of saved message
   */
  async saveMessage(message) {
    try {
      // Prepare message data
      const messageData = {
        userId: message.userId,
        question: message.question,
        answer: message.answer,
        answer_source: message.answer_source || "document",
        responseMode: message.responseMode || "hybrid",
        sources: message.sources || [],
        web_sources: message.web_sources || [],
        confidence: message.confidence || 0.0,
        responseTime: message.responseTime || 0,
        userProfile: message.userProfile || "unknown",
        timestamp: message.timestamp || new Date().toISOString(),
        conversationId: message.conversationId,
        ttl: new Date(
          Date.now() + this.messageRetentionDays * 24 * 60 * 60 * 1000,
        ).toISOString(),
      };

      // Save to Firestore
      const userId = messageData.userId;
      const docRef = await this.db
        .collection(this.historyCollection)
        .doc(userId)
        .collection("messages")
        .add(messageData);

      logger.info(`Message saved for user ${userId} with ID ${docRef.id}`);
      return docRef.id;
    } catch (error) {
      logger.error(`Error saving message: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get all chat history for user
   * @param {string} userId - The user's ID
   * @param {number} limit - Maximum number of messages to return
   * @returns {Promise<Array>} List of messages ordered by timestamp (newest first)
   */
  async getUserChatHistory(userId, limit = null) {
    try {
      let query = this.db
        .collection(this.historyCollection)
        .doc(userId)
        .collection("messages")
        .orderBy("timestamp", "desc");

      if (limit) {
        query = query.limit(limit);
      }

      const snapshot = await query.get();
      const messages = [];

      snapshot.forEach((doc) => {
        const msg = doc.data();
        msg.id = doc.id;
        messages.push(msg);
      });

      logger.info(`Retrieved ${messages.length} messages for user ${userId}`);
      return messages;
    } catch (error) {
      logger.error(
        `Error retrieving chat history for user ${userId}: ${error.message}`,
      );
      throw error;
    }
  }

  /**
   * Get recent conversations (grouped by conversation ID)
   * @param {string} userId - The user's ID
   * @param {number} limit - Maximum number of conversations
   * @returns {Promise<Array>} List of recent conversation messages
   */
  async getRecentConversations(userId, limit = 10) {
    try {
      const messages = await this.getUserChatHistory(userId, limit * 10);

      // Group by conversation ID
      const conversations = {};
      messages.forEach((msg) => {
        const convId = msg.conversationId || "default";
        if (!conversations[convId]) {
          conversations[convId] = [];
        }
        conversations[convId].push(msg);
      });

      // Return most recent conversations
      const recent = Object.values(conversations).slice(0, limit);
      logger.info(
        `Retrieved ${recent.length} recent conversations for user ${userId}`,
      );
      return recent;
    } catch (error) {
      logger.error(
        `Error retrieving recent conversations for user ${userId}: ${error.message}`,
      );
      throw error;
    }
  }

  /**
   * Get specific conversation by ID
   * @param {string} conversationId - The conversation ID
   * @param {string} userId - The user's ID (for authorization)
   * @returns {Promise<Object|null>} Conversation data or null if not found
   */
  async getConversation(conversationId, userId) {
    try {
      const messages = await this.getUserChatHistory(userId);

      // Filter by conversation ID
      const conversationMessages = messages.filter(
        (msg) => msg.conversationId === conversationId,
      );

      if (conversationMessages.length === 0) {
        logger.warning(
          `Conversation ${conversationId} not found for user ${userId}`,
        );
        return null;
      }

      return {
        id: conversationId,
        userId,
        messages: conversationMessages,
        messageCount: conversationMessages.length,
        startTime:
          conversationMessages[conversationMessages.length - 1].timestamp,
        lastUpdate: conversationMessages[0].timestamp,
      };
    } catch (error) {
      logger.error(
        `Error retrieving conversation ${conversationId}: ${error.message}`,
      );
      throw error;
    }
  }

  /**
   * Delete all chat history for user
   * @param {string} userId - The user's ID
   * @returns {Promise<number>} Number of messages deleted
   */
  async deleteUserChatHistory(userId) {
    try {
      const messagesRef = this.db
        .collection(this.historyCollection)
        .doc(userId)
        .collection("messages");

      const snapshot = await messagesRef.get();
      let count = 0;
      const batch = this.db.batch();

      snapshot.forEach((doc) => {
        batch.delete(doc.ref);
        count++;

        // Commit in batches of 500 (Firestore limit)
        if (count % 500 === 0) {
          batch.commit();
        }
      });

      // Final commit
      if (count % 500 !== 0) {
        await batch.commit();
      }

      logger.info(`Deleted ${count} messages for user ${userId}`);
      return count;
    } catch (error) {
      logger.error(
        `Error deleting chat history for user ${userId}: ${error.message}`,
      );
      throw error;
    }
  }

  /**
   * Delete a specific message
   * @param {string} userId - The user's ID
   * @param {string} messageId - The message ID to delete
   * @returns {Promise<boolean>} True if successful
   */
  async deleteMessage(userId, messageId) {
    try {
      await this.db
        .collection(this.historyCollection)
        .doc(userId)
        .collection("messages")
        .doc(messageId)
        .delete();

      logger.info(`Deleted message ${messageId} for user ${userId}`);
      return true;
    } catch (error) {
      logger.error(`Error deleting message ${messageId}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Search through user's chat history
   * @param {string} userId - The user's ID
   * @param {string} queryText - Search query text
   * @returns {Promise<Array>} Messages matching search query
   */
  async searchConversations(userId, queryText) {
    try {
      const messages = await this.getUserChatHistory(userId, 1000);

      const queryLower = queryText.toLowerCase();
      const results = messages.filter(
        (msg) =>
          queryLower.includes(msg.question?.toLowerCase() || "") ||
          queryLower.includes(msg.answer?.toLowerCase() || ""),
      );

      logger.info(
        `Found ${results.length} messages matching '${queryText}' for user ${userId}`,
      );
      return results;
    } catch (error) {
      logger.error(
        `Error searching conversations for user ${userId}: ${error.message}`,
      );
      throw error;
    }
  }

  /**
   * Get chat statistics for user
   * @param {string} userId - The user's ID
   * @returns {Promise<Object>} Statistics including message count, avg response time, top topics
   */
  async getChatStatistics(userId) {
    try {
      const messages = await this.getUserChatHistory(userId, 1000);

      if (messages.length === 0) {
        return {
          total_messages: 0,
          total_conversations: 0,
          avg_response_time: 0,
          avg_confidence: 0,
          last_activity: null,
          joined_date: null,
          top_topics: [],
          message_sources: {},
        };
      }

      // Calculate statistics
      const totalMessages = messages.length;
      const avgResponseTime =
        messages.reduce((sum, m) => sum + (m.responseTime || 0), 0) /
        totalMessages;

      const conversationIds = new Set(messages.map((m) => m.conversationId));
      const totalConversations = conversationIds.size;

      // Get source distribution
      const sourceCounts = {};
      messages.forEach((m) => {
        const source = m.answer_source || "unknown";
        sourceCounts[source] = (sourceCounts[source] || 0) + 1;
      });

      // Extract top topics
      const topTopics = this._extractTopTopics(
        messages.map((m) => m.question || ""),
        5,
      );

      // Get average confidence
      const avgConfidence =
        messages.reduce((sum, m) => sum + (m.confidence || 0), 0) /
        totalMessages;

      const stats = {
        total_messages: totalMessages,
        total_conversations: totalConversations,
        avg_response_time: Math.round(avgResponseTime * 100) / 100,
        avg_confidence: Math.round(avgConfidence * 100) / 100,
        last_activity: messages[0].timestamp,
        joined_date: messages[messages.length - 1].timestamp,
        top_topics: topTopics,
        message_sources: sourceCounts,
      };

      logger.info(
        `Generated statistics for user ${userId}: ${totalMessages} messages`,
      );
      return stats;
    } catch (error) {
      logger.error(
        `Error calculating statistics for user ${userId}: ${error.message}`,
      );
      throw error;
    }
  }

  /**
   * Extract most common topics/keywords from questions
   * @private
   * @param {Array<string>} questions - List of question strings
   * @param {number} limit - Maximum number of topics to return
   * @returns {Array<string>} Top topics/keywords
   */
  _extractTopTopics(questions, limit = 5) {
    const stopWords = new Set([
      "what",
      "when",
      "where",
      "how",
      "why",
      "is",
      "the",
      "a",
      "an",
      "and",
      "or",
      "in",
      "on",
      "at",
      "to",
      "for",
      "of",
      "with",
      "by",
    ]);

    const keywords = [];
    questions.forEach((question) => {
      const words = question.toLowerCase().split(/\s+/);
      words.forEach((w) => {
        if (!stopWords.has(w) && w.length > 3) {
          keywords.push(w);
        }
      });
    });

    if (keywords.length === 0) return [];

    // Count occurrences
    const counts = {};
    keywords.forEach((k) => {
      counts[k] = (counts[k] || 0) + 1;
    });

    // Get most common
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([word]) => word);
  }

  /**
   * Export complete chat history for user
   * @param {string} userId - The user's ID
   * @returns {Promise<Object>} Exportable chat history data
   */
  async exportChatHistory(userId) {
    try {
      const messages = await this.getUserChatHistory(userId);

      const exportData = {
        userId,
        exportDate: new Date().toISOString(),
        totalMessages: messages.length,
        messages,
      };

      logger.info(
        `Prepared export of ${messages.length} messages for user ${userId}`,
      );
      return exportData;
    } catch (error) {
      logger.error(
        `Error exporting chat history for user ${userId}: ${error.message}`,
      );
      throw error;
    }
  }
}

module.exports = ChatHistoryService;

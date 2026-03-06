import { db } from "../config/firebase";
import {
  collection,
  addDoc,
  getDocs,
  query,
  orderBy,
  limit,
  deleteDoc,
  doc,
  serverTimestamp,
} from "firebase/firestore";

/**
 * Service for managing chat history in Firestore
 */
class ChatHistoryService {
  constructor() {
    this.collectionName = "chatHistory";
  }

  /**
   * Get or create a user ID (stored in localStorage)
   */
  getUserId() {
    let userId = localStorage.getItem("chatUserId");
    if (!userId) {
      userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem("chatUserId", userId);
    }
    return userId;
  }

  /**
   * Save a message to Firestore
   * @param {Object} message - Message object with id, sender, text, createdAt
   */
  async saveMessage(message) {
    try {
      const userId = this.getUserId();
      const messagesRef = collection(
        db,
        this.collectionName,
        userId,
        "messages",
      );

      await addDoc(messagesRef, {
        ...message,
        timestamp: serverTimestamp(),
        savedAt: new Date().toISOString(),
      });

      console.log("Message saved to Firebase:", message.id);
    } catch (error) {
      console.error("Error saving message to Firebase:", error);
      throw error;
    }
  }

  /**
   * Load all messages for the current user
   * @param {number} maxMessages - Maximum number of messages to load (default: 100)
   */
  async loadMessages(maxMessages = 100) {
    try {
      const userId = this.getUserId();
      const messagesRef = collection(
        db,
        this.collectionName,
        userId,
        "messages",
      );
      const q = query(
        messagesRef,
        orderBy("savedAt", "asc"),
        limit(maxMessages),
      );

      const querySnapshot = await getDocs(q);
      const messages = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        messages.push({
          id: data.id,
          sender: data.sender,
          text: data.text,
          createdAt: data.createdAt,
          downloadable_pdf: data.downloadable_pdf || null,
          download_url: data.download_url || null,
          is_pdf_request: data.is_pdf_request || false,
        });
      });

      console.log(`Loaded ${messages.length} messages from Firebase`);
      return messages;
    } catch (error) {
      console.error("Error loading messages from Firebase:", error);
      return [];
    }
  }

  /**
   * Clear all chat history for the current user
   */
  async clearHistory() {
    try {
      const userId = this.getUserId();
      const messagesRef = collection(
        db,
        this.collectionName,
        userId,
        "messages",
      );
      const querySnapshot = await getDocs(messagesRef);

      const deletePromises = [];
      querySnapshot.forEach((document) => {
        deletePromises.push(
          deleteDoc(
            doc(db, this.collectionName, userId, "messages", document.id),
          ),
        );
      });

      await Promise.all(deletePromises);
      console.log("Chat history cleared from Firebase");
    } catch (error) {
      console.error("Error clearing chat history from Firebase:", error);
      throw error;
    }
  }
}

export const chatHistoryService = new ChatHistoryService();

// frontend/src/services/settingsService.js
/**
 * Settings Service
 * Handles all settings-related API calls and local storage operations
 */

import { API_URL } from '../config/api';

class SettingsService {
  /**
   * Get user settings from backend
   */
  async getUserSettings(userId) {
    try {
      const response = await fetch(`${API_URL}/api/settings/${userId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching user settings:', error);
      // Return defaults if fetch fails
      return this.getDefaultSettings();
    }
  }

  /**
   * Save user settings to backend
   */
  async saveUserSettings(userId, settings) {
    try {
      const response = await fetch(`${API_URL}/api/settings/${userId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settings),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Also save to local storage for offline access
      this.saveToLocalStorage(userId, settings);

      return await response.json();
    } catch (error) {
      console.error('Error saving user settings:', error);
      // Save to local storage as fallback
      this.saveToLocalStorage(userId, settings);
      throw error;
    }
  }

  /**
   * Update response mode
   */
  async updateResponseMode(userId, mode) {
    try {
      const response = await fetch(`${API_URL}/api/settings/${userId}/mode`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ mode }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error updating response mode:', error);
      throw error;
    }
  }

  /**
   * Export chat history
   */
  async exportChatHistory(userId) {
    try {
      const response = await fetch(`${API_URL}/api/chat-history/${userId}/export`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error exporting chat history:', error);
      throw error;
    }
  }

  /**
   * Clear chat history
   */
  async clearChatHistory(userId) {
    try {
      const response = await fetch(`${API_URL}/api/chat-history/${userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error clearing chat history:', error);
      throw error;
    }
  }

  /**
   * Get default settings
   */
  getDefaultSettings() {
    return {
      responseMode: 'hybrid',
      notifications: {
        examReminders: true,
        attendanceWarnings: true,
        assignmentDeadlines: true,
        paymentNotifications: true,
      },
      theme: 'dark',
      responseLength: 'balanced',
      includeWebResults: true,
      autoSuggest: true,
    };
  }

  /**
   * Save settings to local storage
   */
  saveToLocalStorage(userId, settings) {
    try {
      localStorage.setItem(`chatbot-settings-${userId}`, JSON.stringify(settings));
    } catch (error) {
      console.error('Error saving to local storage:', error);
    }
  }

  /**
   * Get settings from local storage
   */
  getFromLocalStorage(userId) {
    try {
      const stored = localStorage.getItem(`chatbot-settings-${userId}`);
      return stored ? JSON.parse(stored) : this.getDefaultSettings();
    } catch (error) {
      console.error('Error reading from local storage:', error);
      return this.getDefaultSettings();
    }
  }

  /**
   * Sync theme with system preference
   */
  syncThemeWithSystem() {
    const theme = localStorage.getItem('chatbot-theme') || 'system';
    const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    if (theme === 'system') {
      if (isDark) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
  }
}

export const settingsService = new SettingsService();

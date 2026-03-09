// frontend/src/context/SettingsContext.jsx
/**
 * Settings Context
 * Global state management for chatbot settings
 */

import React, { createContext, useContext, useState, useEffect } from "react";
import { useUserContext } from "./UserContext";
import { settingsService } from "../services/settingsService";

const SettingsContext = createContext();

export const SettingsProvider = ({ children }) => {
  const { user } = useUserContext();
  const [settings, setSettings] = useState(
    settingsService.getDefaultSettings(),
  );
  const [loading, setLoading] = useState(false);

  // Load settings on user change
  useEffect(() => {
    if (user) {
      loadSettings();
    }
  }, [user]);

  const loadSettings = async () => {
    setLoading(true);
    try {
      const userSettings = await settingsService.getUserSettings(user.uid);
      if (userSettings) {
        setSettings(userSettings);
      }
    } catch (error) {
      console.error("Error loading settings:", error);
      // Fall back to local storage
      const localSettings = settingsService.getFromLocalStorage(user.uid);
      setSettings(localSettings);
    } finally {
      setLoading(false);
    }
  };

  const updateSettings = async (newSettings) => {
    try {
      const updated = await settingsService.saveUserSettings(
        user.uid,
        newSettings,
      );
      setSettings(updated || newSettings);
      return true;
    } catch (error) {
      console.error("Error updating settings:", error);
      return false;
    }
  };

  const updateResponseMode = async (mode) => {
    const newSettings = { ...settings, responseMode: mode };
    return updateSettings(newSettings);
  };

  const updateNotifications = async (notifications) => {
    const newSettings = { ...settings, notifications };
    return updateSettings(newSettings);
  };

  const updateTheme = async (theme) => {
    const newSettings = { ...settings, theme };
    await updateSettings(newSettings);
    // Apply theme immediately
    applyTheme(theme);
  };

  const applyTheme = (theme) => {
    const root = document.documentElement;
    if (theme === "light") {
      root.classList.remove("dark");
    } else if (theme === "dark") {
      root.classList.add("dark");
    } else {
      const prefersDark = window.matchMedia(
        "(prefers-color-scheme: dark)",
      ).matches;
      if (prefersDark) {
        root.classList.add("dark");
      } else {
        root.classList.remove("dark");
      }
    }
    localStorage.setItem("chatbot-theme", theme);
  };

  const resetToDefaults = async () => {
    return updateSettings(settingsService.getDefaultSettings());
  };

  const value = {
    settings,
    loading,
    updateSettings,
    updateResponseMode,
    updateNotifications,
    updateTheme,
    applyTheme,
    resetToDefaults,
  };

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error("useSettings must be used within SettingsProvider");
  }
  return context;
};

import React from "react";
import {DEFAULT_DREAM_TAB_SETTINGS, DEFAULT_MAIN_PANEL_SETTINGS} from "./Constants";

const MAIN_PANEL_SETTINGS_KEY = "MAIN_PANEL_SETTINGS"
const DREAM_TAB_SETTINGS_KEY = "DREAM_TAB_SETTINGS"
const RESULTS_TAB_SETTINGS_KEY = "RESULTS_TAB_SETTINGS"
const PROMPTS_TAB_SETTINGS_KEY = "PROMPTS_TAB_SETTINGS"

// To frequent seems redundant, too infrequent is bad for UX as latest changes won't be remembered
const DREAM_SETTINGS_WRITE_FREQUENCY_MS = 3000;

const DEFAULT_RESULTS_TAB_SETTINGS = {
  collapsedResultsMap: {},
}

const DEFAULT_PROMPTS_TAB_SETTINGS = {
  showInstructions: true,
  showAsText: false,
}

const areObjectsEqual = (obj1, obj2) => {
  const keys1 = Object.keys(obj1);
  const keys2 = Object.keys(obj2);

  return keys1.length === keys2.length && Object.keys(obj1).every(key => obj1[key] === obj2[key]);
}


class SettingsStorage {
  dreamSettingsPendingWrite;

  constructor() {
    this.dreamSettingsPendingWrite = {}
    setInterval(this.writePendingDreamSettingsToLocalStorage, DREAM_SETTINGS_WRITE_FREQUENCY_MS);
  }

  getDreamSettings() {
    const storedSettings = localStorage.getItem(DREAM_TAB_SETTINGS_KEY);
    if (!storedSettings) {
      return DEFAULT_DREAM_TAB_SETTINGS;
    }
    try {
      const parsed = JSON.parse(storedSettings);
      // console.log('Loading settings', JSON.stringify(parsed, null, 2))
      return parsed;
    } catch (e) {
      console.error("Failed to parse Dream settings", storedSettings)
      return DEFAULT_DREAM_TAB_SETTINGS
    }
  }

  saveDreamSettingsBatched(settings) {
    this.dreamSettingsPendingWrite = {
      ...this.dreamSettingsPendingWrite,
      ...settings,
    }
  }

  writePendingDreamSettingsToLocalStorage = () => {
    // Batching settings writes is good because otherwise we will write them e.g. with every button press when user
    // types the prompt
    const currentSettings = this.getDreamSettings()
    const updatedSettings = {
      ...currentSettings,
      ...this.dreamSettingsPendingWrite,
    }
    if (areObjectsEqual(currentSettings, updatedSettings)) {
      return;
    }

    this.dreamSettingsPendingWrite = {};
    console.log('Saving Dream settings', JSON.stringify(updatedSettings, null, 2))
    localStorage.setItem(DREAM_TAB_SETTINGS_KEY, JSON.stringify(updatedSettings));
  }

  getResultsSettings() {
    const storedSettings = localStorage.getItem(RESULTS_TAB_SETTINGS_KEY);
    if (!storedSettings) {
      return DEFAULT_RESULTS_TAB_SETTINGS;
    }
    try {
      return JSON.parse(storedSettings);
    } catch (e) {
      console.error("Failed to parse Results settings", storedSettings)
      return DEFAULT_RESULTS_TAB_SETTINGS
    }
  }

  saveResultsSettingsSync(updatedSettings) {
    // Results panel does not expect us to merge with the previous state
    console.log('Saving Results settings', JSON.stringify(updatedSettings, null, 2))
    localStorage.setItem(RESULTS_TAB_SETTINGS_KEY, JSON.stringify(updatedSettings));
  }

  getPromptsSettings() {
    const storedSettings = localStorage.getItem(PROMPTS_TAB_SETTINGS_KEY);
    if (!storedSettings) {
      return DEFAULT_PROMPTS_TAB_SETTINGS;
    }
    try {
      return JSON.parse(storedSettings);
    } catch (e) {
      console.error("Failed to parse Prompts settings", storedSettings)
      return DEFAULT_PROMPTS_TAB_SETTINGS
    }
  }

  updatePromptsSettingsSync(settings) {
    // Prompts panel has few settings, so it should be ok to save them synchronously
    const currentSettings = this.getPromptsSettings()
    const updatedSettings = {
      ...currentSettings,
      ...settings,
    }
    console.log('Saving Prompts settings', JSON.stringify(updatedSettings, null, 2))
    localStorage.setItem(PROMPTS_TAB_SETTINGS_KEY, JSON.stringify(updatedSettings));
  }

  getMainPanelSettings() {
    const storedSettings = localStorage.getItem(MAIN_PANEL_SETTINGS_KEY);
    if (!storedSettings) {
      return DEFAULT_MAIN_PANEL_SETTINGS;
    }
    try {
      return JSON.parse(storedSettings);
    } catch (e) {
      console.error("Failed to parse Main Panel settings", storedSettings)
      return DEFAULT_MAIN_PANEL_SETTINGS
    }
  }

  updateMainPanelSettingsSync(settings) {
    // Main panel has few settings, so it should be ok to save them synchronously
    const currentSettings = this.getMainPanelSettings()
    const updatedSettings = {
      ...currentSettings,
      ...settings,
    }
    console.log('Saving main panel settings', JSON.stringify(updatedSettings, null, 2))
    localStorage.setItem(MAIN_PANEL_SETTINGS_KEY, JSON.stringify(updatedSettings));
  }
}

export const settingsStorage = new SettingsStorage();

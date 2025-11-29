/**
 * Storage utilities for persisting user preferences
 * Uses localStorage with fallback for UXP compatibility
 */

const STORAGE_KEYS = {
  MAIN_TAB: 'mysquad_active_tab',
  GENERATOR_SUB_TAB: 'mysquad_generator_sub_tab',
};

/**
 * Get a value from localStorage
 * @param {string} key - Storage key
 * @param {*} defaultValue - Default value if not found
 * @returns {*} Stored value or default
 */
export const getStoredValue = (key, defaultValue) => {
  try {
    const stored = localStorage.getItem(key);
    return stored !== null ? stored : defaultValue;
  } catch (e) {
    // localStorage may not be available in some UXP contexts
    return defaultValue;
  }
};

/**
 * Set a value in localStorage
 * @param {string} key - Storage key
 * @param {*} value - Value to store
 */
export const setStoredValue = (key, value) => {
  try {
    localStorage.setItem(key, value);
  } catch (e) {
    // Silently fail if localStorage not available
  }
};

/**
 * Get the stored main tab
 * @param {string} defaultTab - Default tab id
 * @returns {string} Tab id
 */
export const getStoredMainTab = (defaultTab = 'task') => {
  return getStoredValue(STORAGE_KEYS.MAIN_TAB, defaultTab);
};

/**
 * Set the stored main tab
 * @param {string} tabId - Tab id to store
 */
export const setStoredMainTab = (tabId) => {
  setStoredValue(STORAGE_KEYS.MAIN_TAB, tabId);
};

/**
 * Get the stored generator sub-tab
 * @param {string} defaultTab - Default tab id
 * @returns {string} Tab id
 */
export const getStoredGeneratorSubTab = (defaultTab = 'sources') => {
  return getStoredValue(STORAGE_KEYS.GENERATOR_SUB_TAB, defaultTab);
};

/**
 * Set the stored generator sub-tab
 * @param {string} tabId - Tab id to store
 */
export const setStoredGeneratorSubTab = (tabId) => {
  setStoredValue(STORAGE_KEYS.GENERATOR_SUB_TAB, tabId);
};

export { STORAGE_KEYS };

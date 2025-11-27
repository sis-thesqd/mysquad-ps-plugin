/**
 * Shell utility functions for UXP
 * Handles opening external URLs and other shell operations
 */

const { shell } = require('uxp');

/**
 * Opens a URL in the system's default browser
 * @param {string} url - The URL to open
 * @returns {Promise<boolean>} True if successful, false otherwise
 */
export const openExternalUrl = async (url) => {
  try {
    await shell.openExternal(url);
    return true;
  } catch (e) {
    console.error('Failed to open URL:', e);
    return false;
  }
};

/**
 * Opens a ClickUp task in the browser
 * @param {string} taskId - The ClickUp task ID
 * @returns {Promise<boolean>} True if successful, false otherwise
 */
export const openClickUpTask = async (taskId) => {
  if (!taskId) return false;
  const url = `https://app.clickup.com/t/${taskId}`;
  return openExternalUrl(url);
};

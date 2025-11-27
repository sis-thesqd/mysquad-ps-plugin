/**
 * Clipboard utility functions for UXP with toast notifications
 */

const uxp = require('uxp');
const clipboard = uxp.host?.clipboard || uxp.clipboard;

let toastElement = null;
let toastTimeout = null;

/**
 * Shows a toast notification
 * @param {string} message - The message to display
 * @param {string} variant - Toast variant (positive, negative, info)
 * @param {number} duration - How long to show the toast in ms
 */
const showToast = (message, variant = 'positive', duration = 2000) => {
  // Clear any existing timeout
  if (toastTimeout) {
    clearTimeout(toastTimeout);
  }

  // Create toast if it doesn't exist
  if (!toastElement) {
    toastElement = document.createElement('div');
    toastElement.className = 'clipboard-toast';
    document.body.appendChild(toastElement);
  }

  // Set variant class
  toastElement.className = `clipboard-toast clipboard-toast--${variant}`;

  // Update toast content and show it
  toastElement.textContent = message;
  toastElement.classList.add('clipboard-toast--visible');

  // Auto-hide after duration
  toastTimeout = setTimeout(() => {
    toastElement.classList.remove('clipboard-toast--visible');
  }, duration);
};

/**
 * Copies text to the system clipboard
 * @param {string} text - The text to copy
 * @returns {Promise<boolean>} True if successful, false otherwise
 */
export const copyToClipboard = async (text) => {
  try {
    // Try different clipboard access methods
    if (clipboard && clipboard.copyText) {
      await clipboard.copyText(text);
    } else if (uxp.host && uxp.host.clipboard && uxp.host.clipboard.copyText) {
      await uxp.host.clipboard.copyText(text);
    } else if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text);
    } else {
      console.error('No clipboard API available');
      return false;
    }
    return true;
  } catch (e) {
    console.error('Failed to copy to clipboard:', e);
    return false;
  }
};

/**
 * Copies text to clipboard and shows a toast notification
 * @param {string} text - The text to copy
 * @param {string} label - Label for the toast message (e.g., "Task ID")
 * @returns {Promise<boolean>} True if successful, false otherwise
 */
export const copyWithToast = async (text, label = 'Text') => {
  const success = await copyToClipboard(text);
  if (success) {
    showToast(`${label} copied to clipboard`);
  } else {
    showToast('Failed to copy to clipboard', 'negative');
  }
  return success;
};

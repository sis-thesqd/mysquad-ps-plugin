/**
 * Date utility functions for formatting and relative date calculations
 */

/**
 * Formats a date string into readable format
 * @param {string|number} dateStr - ISO date string or Unix timestamp (milliseconds)
 * @returns {string|null} Formatted date string (e.g., "Jan 15, 2024")
 */
export const formatDate = (dateStr) => {
  if (!dateStr) return null;
  // Handle Unix timestamp (milliseconds) from ClickUp
  const date = typeof dateStr === 'number' || /^\d+$/.test(dateStr)
    ? new Date(parseInt(dateStr, 10))
    : new Date(dateStr);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

/**
 * Gets relative date label (e.g., "today", "yesterday", "2 days ago", "in 3 days")
 * @param {string|number} dateStr - ISO date string or Unix timestamp (milliseconds)
 * @returns {string|null} Relative date string
 */
export const getRelativeDate = (dateStr) => {
  if (!dateStr) return null;

  // Handle Unix timestamp (milliseconds) from ClickUp
  const date = typeof dateStr === 'number' || /^\d+$/.test(dateStr)
    ? new Date(parseInt(dateStr, 10))
    : new Date(dateStr);

  const now = new Date();
  // Reset time to compare dates only
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const compareDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());

  const diffTime = compareDate.getTime() - today.getTime();
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'today';
  if (diffDays === 1) return 'tomorrow';
  if (diffDays === -1) return 'yesterday';
  if (diffDays > 1) return `in ${diffDays} days`;
  if (diffDays < -1) return `${Math.abs(diffDays)} days ago`;

  return null;
};

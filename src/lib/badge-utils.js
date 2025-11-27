/**
 * Badge utility functions for styling and color management
 */

/**
 * Generates inline style object for a badge with custom background color
 * @param {string} hexColor - Hex color code (e.g., "#ff0000")
 * @param {string} fallbackColor - Fallback color if hexColor is not provided
 * @returns {Object} Style object with backgroundColor
 */
export const getBadgeStyle = (hexColor, fallbackColor = '#666') => {
  return {
    backgroundColor: hexColor || fallbackColor
  };
};

/**
 * Determines if text should be light or dark based on background color
 * Uses relative luminance calculation for accessibility
 * @param {string} hexColor - Hex color code (e.g., "#ff0000")
 * @returns {string} Either 'light' or 'dark' for text color
 */
export const getContrastTextColor = (hexColor) => {
  if (!hexColor) return 'light';

  // Remove # if present
  const hex = hexColor.replace('#', '');

  // Convert to RGB
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);

  // Calculate relative luminance
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

  return luminance > 0.5 ? 'dark' : 'light';
};

/**
 * Generates complete badge style with background and appropriate text color
 * @param {string} hexColor - Hex color code for background
 * @param {string} fallbackColor - Fallback background color
 * @returns {Object} Style object with backgroundColor and color
 */
export const getStatusBadgeStyle = (hexColor, fallbackColor = '#666') => {
  const bgColor = hexColor || fallbackColor;
  const textColorType = getContrastTextColor(bgColor);

  return {
    backgroundColor: bgColor,
    color: textColorType === 'dark' ? '#000' : '#fff'
  };
};

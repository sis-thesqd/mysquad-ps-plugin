/**
 * API functions for fetching artboard size configurations
 */

/**
 * Fetch artboard sizes from an API endpoint
 * @param {string} endpoint - The API endpoint URL
 * @returns {Promise<Array>} Array of size configurations
 */
export const fetchSizes = async (endpoint) => {
  if (!endpoint) {
    throw new Error('API endpoint URL is required');
  }

  try {
    const response = await fetch(endpoint, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    // Validate the response format
    if (!Array.isArray(data)) {
      throw new Error('Invalid response format: expected an array');
    }

    // Validate each size object
    return data.map((size, index) => {
      if (typeof size.width !== 'number' || typeof size.height !== 'number') {
        throw new Error(`Invalid size at index ${index}: width and height must be numbers`);
      }

      return {
        width: size.width,
        height: size.height,
        name: size.name || `${size.type || 'size'}_${size.width}x${size.height}`,
        type: size.type || 'other',
        requiresBleed: size.requiresBleed || false,
        bleed: size.bleed || 0.125,
        bleedUnit: size.bleedUnit || 'inches',
      };
    });
  } catch (error) {
    console.error('Error fetching sizes:', error);
    throw error;
  }
};

/**
 * Default size presets organized by category
 */
export const DEFAULT_SIZES = [
  // Social Media - Landscape
  { width: 1200, height: 628, name: 'FB_Link_Preview', type: 'social' },
  { width: 1200, height: 630, name: 'FB_Shared_Image', type: 'social' },
  { width: 1920, height: 1080, name: 'YouTube_Thumbnail', type: 'social' },
  { width: 1500, height: 500, name: 'Twitter_Header', type: 'social' },
  { width: 1584, height: 396, name: 'LinkedIn_Cover', type: 'social' },
  
  // Social Media - Square
  { width: 1080, height: 1080, name: 'IG_Square', type: 'social' },
  { width: 1200, height: 1200, name: 'FB_Square', type: 'social' },
  
  // Social Media - Portrait
  { width: 1080, height: 1920, name: 'IG_Story', type: 'social' },
  { width: 1080, height: 1350, name: 'IG_Portrait', type: 'social' },
  { width: 1000, height: 1500, name: 'Pinterest_Pin', type: 'social' },
  
  // Display Ads - Standard IAB
  { width: 300, height: 250, name: 'Medium_Rectangle', type: 'display' },
  { width: 336, height: 280, name: 'Large_Rectangle', type: 'display' },
  { width: 728, height: 90, name: 'Leaderboard', type: 'display' },
  { width: 970, height: 90, name: 'Large_Leaderboard', type: 'display' },
  { width: 970, height: 250, name: 'Billboard', type: 'display' },
  { width: 160, height: 600, name: 'Wide_Skyscraper', type: 'display' },
  { width: 300, height: 600, name: 'Half_Page', type: 'display' },
  { width: 320, height: 50, name: 'Mobile_Leaderboard', type: 'display' },
  { width: 320, height: 100, name: 'Large_Mobile_Banner', type: 'display' },
  { width: 300, height: 50, name: 'Mobile_Banner', type: 'display' },
  
  // Video
  { width: 1920, height: 1080, name: 'HD_1080p', type: 'video' },
  { width: 1280, height: 720, name: 'HD_720p', type: 'video' },
  { width: 3840, height: 2160, name: '4K_UHD', type: 'video' },
  
  // Email
  { width: 600, height: 200, name: 'Email_Header', type: 'email' },
  { width: 600, height: 400, name: 'Email_Hero', type: 'email' },
  { width: 600, height: 300, name: 'Email_Banner', type: 'email' },
  
  // Print (300 DPI) - with bleed
  { width: 2550, height: 3300, name: 'Letter_8.5x11', type: 'print', requiresBleed: true, bleed: 0.125, bleedUnit: 'inches' },
  { width: 3300, height: 2550, name: 'Letter_11x8.5_Landscape', type: 'print', requiresBleed: true, bleed: 0.125, bleedUnit: 'inches' },
  { width: 1275, height: 1875, name: 'Postcard_4.25x6.25', type: 'print', requiresBleed: true, bleed: 0.125, bleedUnit: 'inches' },
  { width: 1050, height: 600, name: 'Business_Card_3.5x2', type: 'print', requiresBleed: true, bleed: 0.125, bleedUnit: 'inches' },
  { width: 2400, height: 3600, name: 'Poster_8x12', type: 'print', requiresBleed: true, bleed: 0.125, bleedUnit: 'inches' },
  { width: 3600, height: 5400, name: 'Poster_12x18', type: 'print', requiresBleed: true, bleed: 0.125, bleedUnit: 'inches' },
  
  // Web
  { width: 1440, height: 900, name: 'Web_Desktop', type: 'web' },
  { width: 1920, height: 1080, name: 'Web_Full_HD', type: 'web' },
  { width: 375, height: 812, name: 'Web_Mobile_iPhone', type: 'web' },
  { width: 768, height: 1024, name: 'Web_Tablet', type: 'web' },
];

export default {
  fetchSizes,
  DEFAULT_SIZES,
};

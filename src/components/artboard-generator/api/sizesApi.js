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
  // Social Media
  { width: 1080, height: 1350, name: '4x5 Social (1080x1350)', type: 'social' },
  { width: 1920, height: 1080, name: 'High Definition (1920x1080)', type: 'video' },
  { width: 1080, height: 1440, name: 'Instagram Post (1080x1440)', type: 'social' },
  { width: 1080, height: 1080, name: 'Square (1080x1080)', type: 'social' },
  { width: 1080, height: 1920, name: 'Story (1080x1920)', type: 'social' },
  
  // Print (300 DPI)
  { width: 1800, height: 1200, name: 'Small Vertical Postcard (6x4")', type: 'print', requiresBleed: true, bleed: 0.125, bleedUnit: 'inches' },
];

export default {
  fetchSizes,
  DEFAULT_SIZES,
};

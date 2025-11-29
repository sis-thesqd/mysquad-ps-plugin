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

export default {
  fetchSizes,
};

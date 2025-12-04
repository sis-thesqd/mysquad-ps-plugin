/**
 * API functions for fetching artboard size configurations
 */
import { config } from '../../../config';
import { getCachedTaskSizes, setCachedTaskSizes, clearCachedTaskSizes } from '../../../utils/storage';

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
 * Fetch artboard sizes from the linked ClickUp task
 * @param {string} taskId - The ClickUp task ID
 * @param {Object} options - Fetch options
 * @param {boolean} options.forceRefresh - Skip cache and fetch fresh data
 * @returns {Promise<Object>} Object with sizes array, task name, cachedAt timestamp, and fromCache flag
 */
export const fetchSizesByTaskId = async (taskId, { forceRefresh = false } = {}) => {
  console.log('[fetchSizesByTaskId] Called with taskId:', taskId, 'forceRefresh:', forceRefresh);
  
  if (!taskId) {
    throw new Error('Task ID is required');
  }

  // Check cache first (unless force refresh)
  if (!forceRefresh) {
    const cached = getCachedTaskSizes(taskId);
    if (cached) {
      console.log('[fetchSizesByTaskId] Returning cached data from:', new Date(cached.cachedAt).toLocaleTimeString());
      return {
        sizes: cached.sizes,
        taskName: cached.taskName,
        cachedAt: cached.cachedAt,
        fromCache: true,
      };
    }
  }

  const endpoint = `${config.api.sizesWebhook}?taskid=${encodeURIComponent(taskId)}`;
  console.log('[fetchSizesByTaskId] Fetching from:', endpoint);
  
  try {
    const response = await fetch(endpoint, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    console.log('[fetchSizesByTaskId] Response status:', response.status);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    // Validate the response has sizes array
    if (!data.sizes || !Array.isArray(data.sizes)) {
      throw new Error('Invalid response format: expected sizes array');
    }

    // Transform and validate each size object
    const sizes = data.sizes.map((size, index) => {
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
        contents: size.contents || '',
      };
    });

    const taskName = data.name || '';
    const cachedAt = Date.now();

    // Store in cache
    setCachedTaskSizes(taskId, { sizes, taskName });

    console.log('[fetchSizesByTaskId] Success! Got', sizes.length, 'sizes:', sizes);
    return {
      sizes,
      taskName,
      cachedAt,
      fromCache: false,
    };
  } catch (error) {
    console.error('[fetchSizesByTaskId] Error:', error);
    throw error;
  }
};

/**
 * Clear cached sizes for a specific task
 * @param {string} taskId - The ClickUp task ID
 */
export const clearSizesCache = (taskId) => {
  clearCachedTaskSizes(taskId);
};

export default {
  fetchSizes,
  fetchSizesByTaskId,
  clearSizesCache,
};

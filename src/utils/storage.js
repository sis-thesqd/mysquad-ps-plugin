/**
 * Storage utilities for persisting user preferences
 * Uses localStorage with fallback for UXP compatibility
 */

const STORAGE_KEYS = {
  MAIN_TAB: 'mysquad_active_tab',
  GENERATOR_SUB_TAB: 'mysquad_generator_sub_tab',
  TASK_SIZES_CACHE: 'mysquad_task_sizes_cache',
};

// Cache duration in milliseconds (15 minutes)
const CACHE_DURATION_MS = 15 * 60 * 1000;

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

/**
 * Get cached task sizes
 * @param {string} taskId - The task ID to get cache for
 * @returns {Object|null} Cached data with sizes, taskName, and cachedAt, or null if not found/expired
 */
export const getCachedTaskSizes = (taskId) => {
  try {
    const cacheJson = localStorage.getItem(STORAGE_KEYS.TASK_SIZES_CACHE);
    if (!cacheJson) return null;
    
    const cache = JSON.parse(cacheJson);
    const taskCache = cache[taskId];
    
    if (!taskCache) return null;
    
    // Check if cache is expired
    const age = Date.now() - taskCache.cachedAt;
    if (age > CACHE_DURATION_MS) {
      return null;
    }
    
    return taskCache;
  } catch (e) {
    console.error('[getCachedTaskSizes] Error reading cache:', e);
    return null;
  }
};

/**
 * Set cached task sizes
 * @param {string} taskId - The task ID to cache for
 * @param {Object} data - Object with sizes array and taskName
 */
export const setCachedTaskSizes = (taskId, data) => {
  try {
    let cache = {};
    const existingJson = localStorage.getItem(STORAGE_KEYS.TASK_SIZES_CACHE);
    if (existingJson) {
      cache = JSON.parse(existingJson);
    }
    
    cache[taskId] = {
      ...data,
      cachedAt: Date.now(),
    };
    
    localStorage.setItem(STORAGE_KEYS.TASK_SIZES_CACHE, JSON.stringify(cache));
  } catch (e) {
    console.error('[setCachedTaskSizes] Error writing cache:', e);
  }
};

/**
 * Clear cached task sizes for a specific task
 * @param {string} taskId - The task ID to clear cache for
 */
export const clearCachedTaskSizes = (taskId) => {
  try {
    const existingJson = localStorage.getItem(STORAGE_KEYS.TASK_SIZES_CACHE);
    if (!existingJson) return;
    
    const cache = JSON.parse(existingJson);
    delete cache[taskId];
    
    localStorage.setItem(STORAGE_KEYS.TASK_SIZES_CACHE, JSON.stringify(cache));
  } catch (e) {
    console.error('[clearCachedTaskSizes] Error clearing cache:', e);
  }
};

/**
 * Get the age of cached task sizes in human-readable format
 * @param {number} cachedAt - Timestamp when data was cached
 * @returns {string} Human-readable age string
 */
export const getCacheAgeString = (cachedAt) => {
  if (!cachedAt) return '';
  
  const ageMs = Date.now() - cachedAt;
  const seconds = Math.floor(ageMs / 1000);
  const minutes = Math.floor(seconds / 60);
  
  if (minutes < 1) return 'just now';
  if (minutes === 1) return '1 min ago';
  if (minutes < 60) return `${minutes} mins ago`;
  
  const hours = Math.floor(minutes / 60);
  if (hours === 1) return '1 hour ago';
  return `${hours} hours ago`;
};

export { STORAGE_KEYS, CACHE_DURATION_MS };

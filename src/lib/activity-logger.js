/**
 * User Activity Logger for tracking plugin usage
 * Logs events to Supabase psp_user_activity table
 */
import { config } from '../config';

const { url: supabaseUrl, anonKey: supabaseKey, isConfigured } = config.api.supabase;

/**
 * Extract system username from a file path
 * @param {string} filePath - Full file path (e.g., /Users/jacobvendramin/projects/...)
 * @returns {string} The username or 'unknown' if not extractable
 */
export const extractUsername = (filePath) => {
  if (!filePath) return 'unknown';

  // Match /Users/{username}/ pattern (macOS)
  const macMatch = filePath.match(/\/Users\/([^/]+)\//);
  if (macMatch) return macMatch[1];

  // Match C:\Users\{username}\ pattern (Windows)
  const winMatch = filePath.match(/[Cc]:\\Users\\([^\\]+)\\/);
  if (winMatch) return winMatch[1];

  // Match /home/{username}/ pattern (Linux)
  const linuxMatch = filePath.match(/\/home\/([^/]+)\//);
  if (linuxMatch) return linuxMatch[1];

  return 'unknown';
};

/**
 * Get the current document path from Photoshop
 * @returns {Promise<string|null>} The document path or null
 */
const getCurrentDocumentPath = async () => {
  try {
    const photoshop = require('photoshop');
    const doc = photoshop.app.activeDocument;

    if (!doc || !doc.saved) return null;

    if (doc.fullName?.fsName) {
      return doc.fullName.fsName;
    }
    if (doc.fullName?.nativePath) {
      return doc.fullName.nativePath;
    }
    if (typeof doc.fullName === 'string') {
      return doc.fullName;
    }

    return null;
  } catch (e) {
    return null;
  }
};

/**
 * Extract task ID from a file path
 * @param {string} filePath - Full file path
 * @returns {string|null} The task ID or null
 */
const extractTaskIdFromPath = (filePath) => {
  if (!filePath) return null;

  const pathParts = filePath.split('/').filter(part => part.trim() !== '');
  if (pathParts.length < 3) return null;

  // Remove filename and subfolder to get task folder
  const taskFolderName = pathParts[pathParts.length - 3];
  if (!taskFolderName) return null;

  // Extract task ID after last " - "
  const lastDashIndex = taskFolderName.lastIndexOf(' - ');
  if (lastDashIndex === -1) return null;

  return taskFolderName.substring(lastDashIndex + 3);
};

/**
 * Log a user activity event to Supabase
 * @param {string} activityType - Type of activity (plugin_load, tab_switch, task_fetch, generator_use)
 * @param {Object} options - Additional options
 * @param {string} [options.taskId] - Task ID if known
 * @param {string} [options.filePath] - File path if known
 * @returns {Promise<void>}
 */
export const logActivity = async (activityType, options = {}) => {
  // Check feature flag
  if (!config.features?.activityLogging) {
    return;
  }

  // Check Supabase config
  if (!isConfigured) {
    console.warn('Activity logging skipped: Supabase not configured');
    return;
  }

  try {
    // Get document path if not provided
    const filePath = options.filePath ?? await getCurrentDocumentPath();

    // Extract user and task ID
    const user = extractUsername(filePath);
    const taskId = options.taskId ?? extractTaskIdFromPath(filePath);

    // Insert activity record
    const url = `${supabaseUrl}/rest/v1/psp_user_activity`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Prefer': 'return=minimal',
      },
      body: JSON.stringify({
        user,
        activity_type: activityType,
        task_id: taskId,
        file_path: filePath,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.warn(`Activity log failed: ${response.status} - ${errorText}`);
    }
  } catch (error) {
    // Silently fail - don't interrupt user workflow
    console.warn('Activity logging error:', error.message);
  }
};

// Activity type constants
export const ACTIVITY_TYPES = {
  PLUGIN_LOAD: 'plugin_load',
  TAB_SWITCH: 'tab_switch',
  TASK_FETCH: 'task_fetch',
  GENERATOR_USE: 'generator_use',
};

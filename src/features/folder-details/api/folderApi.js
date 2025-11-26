import { callRpc, isSupabaseConfigured } from '../../../lib/supabase-api';

/**
 * Gets the Photoshop app instance
 */
const getPhotoshopApp = () => {
  try {
    if (typeof window !== 'undefined' && window.require) {
      try {
        const photoshop = window.require('photoshop');
        if (photoshop && photoshop.app) {
          return photoshop.app;
        }
      } catch (e) {
        // Method 1 failed
      }
    }

    if (typeof window !== 'undefined' && window.photoshop && window.photoshop.app) {
      return window.photoshop.app;
    }

    if (typeof photoshop !== 'undefined' && photoshop.app) {
      return photoshop.app;
    }
  } catch (error) {
    // Failed to get Photoshop app
  }
  return null;
};

/**
 * Extracts the task ID from a file path by:
 * 1. Removing the filename
 * 2. Removing the next directory item (e.g., "1. Source Files")
 * 3. Extracting the task ID substring from the remaining folder name
 */
export const extractTaskIdFromPath = (currentPath) => {
  if (!currentPath) {
    return null;
  }

  const pathParts = currentPath.split('/').filter(part => part.trim() !== '');

  // We need at least 3 parts: .../<task folder>/<subfolder>/<filename>
  if (pathParts.length < 3) {
    return null;
  }

  // Remove the filename (last part)
  const pathWithoutFile = pathParts.slice(0, -1);

  // Remove the next item (e.g., "1. Source Files")
  const pathWithoutSubfolder = pathWithoutFile.slice(0, -1);

  // Get the task folder name (last remaining part)
  const taskFolderName = pathWithoutSubfolder[pathWithoutSubfolder.length - 1];

  if (!taskFolderName) {
    return null;
  }

  // Extract the task ID - it's the part after the last " - " in the folder name
  const lastDashIndex = taskFolderName.lastIndexOf(' - ');

  if (lastDashIndex === -1) {
    return null;
  }

  const taskId = taskFolderName.substring(lastDashIndex + 3); // +3 to skip " - "
  return taskId;
};

/**
 * Gets task details from Supabase using get_task_details_v3 RPC
 */
export const getTaskDetails = async (taskId) => {
  if (!isSupabaseConfigured) {
    throw new Error('Supabase credentials not configured');
  }

  if (!taskId) {
    return null;
  }

  const data = await callRpc('get_task_details_v3', { p_task_id: taskId });

  if (data && data.length > 0) {
    return data[0];
  }

  return null;
};

/**
 * Gets the current document path from Photoshop
 */
export const getCurrentDocumentPath = async () => {
  try {
    const photoshopApp = getPhotoshopApp();

    if (!photoshopApp) {
      return null;
    }

    const doc = photoshopApp.activeDocument;

    if (!doc) {
      return null;
    }

    let documentPath = null;

    if (doc.saved && doc.fullName) {
      if (doc.fullName.fsName) {
        documentPath = doc.fullName.fsName;
      } else if (typeof doc.fullName.toString === 'function') {
        documentPath = doc.fullName.toString();
      } else {
        documentPath = String(doc.fullName);
      }
    }

    if (!documentPath && doc.fullName) {
      try {
        documentPath = doc.fullName.nativePath || doc.fullName.path || doc.fullName;
      } catch (e) {
        // Alternative fullName access failed
      }
    }

    if (!documentPath && doc.path) {
      documentPath = doc.path;
    }

    return documentPath;

  } catch (error) {
    return null;
  }
};

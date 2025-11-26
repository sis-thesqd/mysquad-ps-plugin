import { callRpc, isSupabaseConfigured } from '../../../lib';

const WEBHOOK_BASE_URL = 'https://sisx.thesqd.com/webhook';

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
 * Gets task details from webhook endpoint
 * Uses cu_data for most fields, sb_data for responsible_dept
 * @param {string} taskId - The ClickUp task ID
 * @returns {Promise<Object|null>} Normalized task details
 */
export const getTaskDetails = async (taskId) => {
  if (!taskId) {
    return null;
  }

  const url = `${WEBHOOK_BASE_URL}/ps-plugin-get-task-details-RtxGes0HnrYEDIk8?taskid=${encodeURIComponent(taskId)}`;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to fetch task details: ${response.status} - ${errorText}`);
  }

  const data = await response.json();

  if (!data || !data.cu_data) {
    return null;
  }

  const { cu_data, sb_data } = data;

  // Normalize response to match expected format
  // Use cu_data where possible, sb_data for responsible_dept
  return {
    task_id: cu_data.id,
    name: cu_data.name,
    account: sb_data?.account || cu_data.folder?.name?.split(' - ')[0],
    church_name: sb_data?.church_name || cu_data.folder?.name?.split(' - ').slice(1).join(' - '),
    status_after: cu_data.status?.status,
    estimate_mins_after: cu_data.time_estimate,
    due_date_after: cu_data.due_date,
    responsible_dept: sb_data?.responsible_dept,
    // Additional fields from cu_data
    assignees: cu_data.assignees,
    tags: cu_data.tags,
    url: cu_data.url,
    project_files: cu_data.custom_fields?.find(f => f.name === ' 📁 Project Files')?.value,
    markdown_description: cu_data.markdown_description,
  };
};

/**
 * Gets task details from Supabase using get_task_details_v3 RPC (legacy)
 * @deprecated Use getTaskDetails instead
 */
export const getTaskDetailsFromSupabase = async (taskId) => {
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

import { useState, useEffect, useCallback } from 'react';
import { extractTaskIdFromPath, getTaskDetails, getCurrentDocumentPath } from '../api/folderApi';
import { logActivity, ACTIVITY_TYPES } from '../../../lib';
import { config } from '../../../config';

/**
 * Custom hook to manage folder/task details from Photoshop document path
 * Extracts task ID from file path and fetches details from webhook API
 */
export const useFolderDetails = () => {
  const [taskDetails, setTaskDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchTaskDetails = useCallback(async () => {
    if (!config.features.folderDetails) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Get current document path from Photoshop
      const currentPath = await getCurrentDocumentPath();

      if (!currentPath) {
        setTaskDetails(null);
        return;
      }

      // Extract task ID from the path
      const taskId = extractTaskIdFromPath(currentPath);

      if (!taskId) {
        setTaskDetails(null);
        return;
      }

      // Get task details from webhook API
      const details = await getTaskDetails(taskId);
      setTaskDetails(details);

      // Log task fetch activity
      logActivity(ACTIVITY_TYPES.TASK_FETCH, { taskId, filePath: currentPath });

    } catch (err) {
      setError(err.message || 'Failed to fetch task details');
    } finally {
      setLoading(false);
    }
  }, []);

  const refetch = useCallback(() => {
    fetchTaskDetails();
  }, [fetchTaskDetails]);

  useEffect(() => {
    fetchTaskDetails();
  }, [fetchTaskDetails]);

  return {
    taskDetails,
    loading,
    error,
    refetch
  };
};

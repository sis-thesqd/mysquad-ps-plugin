import { useState, useEffect, useCallback } from 'react';
import { extractTaskIdFromPath, getTaskDetails, getCurrentDocumentPath } from '../api/folderApi';
import { config } from '../../../config';

const MIN_LOADING_TIME = 3000; // 3 seconds minimum loading time

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

      const startTime = Date.now();

      // Get current document path from Photoshop
      const currentPath = await getCurrentDocumentPath();

      if (!currentPath) {
        // Wait for minimum loading time
        const elapsed = Date.now() - startTime;
        if (elapsed < MIN_LOADING_TIME) {
          await new Promise(resolve => setTimeout(resolve, MIN_LOADING_TIME - elapsed));
        }
        setTaskDetails(null);
        return;
      }

      // Extract task ID from the path
      const taskId = extractTaskIdFromPath(currentPath);

      if (!taskId) {
        const elapsed = Date.now() - startTime;
        if (elapsed < MIN_LOADING_TIME) {
          await new Promise(resolve => setTimeout(resolve, MIN_LOADING_TIME - elapsed));
        }
        setTaskDetails(null);
        return;
      }

      // Get task details from webhook API
      const details = await getTaskDetails(taskId);

      // Ensure minimum loading time for smooth UX
      const elapsed = Date.now() - startTime;
      if (elapsed < MIN_LOADING_TIME) {
        await new Promise(resolve => setTimeout(resolve, MIN_LOADING_TIME - elapsed));
      }

      setTaskDetails(details);

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

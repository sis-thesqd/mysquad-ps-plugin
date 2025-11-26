import { useState, useEffect } from 'react';
import { extractTaskIdFromPath, getTaskDetails, getCurrentDocumentPath } from '../api/folderApi';
import { globalConfig } from '../../../config/global';

/**
 * Custom hook to manage task details
 */
export const useFolderDetails = () => {
  const [taskDetails, setTaskDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchTaskDetails = async () => {
    if (!globalConfig.features.folderDetails) {
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

      // Get task details from Supabase RPC
      const details = await getTaskDetails(taskId);
      setTaskDetails(details);

    } catch (err) {
      setError(err.message || 'Failed to fetch task details');
    } finally {
      setLoading(false);
    }
  };

  const refetch = () => {
    fetchTaskDetails();
  };

  useEffect(() => {
    fetchTaskDetails();
  }, []);

  return {
    taskDetails,
    loading,
    error,
    refetch
  };
};

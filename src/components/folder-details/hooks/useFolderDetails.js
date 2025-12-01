import { useState, useEffect, useCallback } from 'react';
import { extractTaskIdFromPath, getTaskDetails, getCurrentDocumentPath } from '../api/folderApi';
import { logActivity, ACTIVITY_TYPES } from '../../../lib';
import { config } from '../../../config';
import { useTaskSearch } from './useTaskSearch';

/**
 * Custom hook to manage folder/task details from Photoshop document path
 * Extracts task ID from file path and fetches details from webhook API
 * Falls back to task search when ID cannot be extracted or task not found
 */
export const useFolderDetails = () => {
  const [taskDetails, setTaskDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isFirstFetch, setIsFirstFetch] = useState(true);
  const [currentFilePath, setCurrentFilePath] = useState(null);

  // Task search fallback hook
  const {
    searchResults,
    searchLoading,
    searchError,
    isSearchMode,
    confirming,
    searchTasks,
    confirmTaskSelection,
    cancelSearch,
    resetSearch,
  } = useTaskSearch();

  const fetchTaskDetails = useCallback(async () => {
    if (!config.features.folderDetails) {
      setLoading(false);
      return;
    }

    const isInitialLoad = isFirstFetch;
    if (isFirstFetch) {
      setIsFirstFetch(false);
    }

    // Reset search state on new fetch
    resetSearch();

    try {
      setLoading(true);
      setError(null);

      // Get current document path from Photoshop
      const currentPath = await getCurrentDocumentPath();
      setCurrentFilePath(currentPath);

      if (!currentPath) {
        setTaskDetails(null);
        return;
      }

      // Extract task ID from the path
      const taskId = extractTaskIdFromPath(currentPath);

      let details = null;

      if (taskId) {
        // Try to get task details with extracted ID
        details = await getTaskDetails(taskId);
      }

      if (details) {
        // Task found successfully
        setTaskDetails(details);

        // Log activity - plugin_load on first fetch, task_fetch on subsequent
        if (isInitialLoad) {
          logActivity(ACTIVITY_TYPES.PLUGIN_LOAD, {
            taskId,
            filePath: currentPath,
            narrative: 'Plugin loaded and task details fetched',
          });
        } else {
          logActivity(ACTIVITY_TYPES.TASK_FETCH, {
            taskId,
            filePath: currentPath,
            narrative: 'Refreshed task details',
          });
        }
      } else {
        // No task ID found or task details returned null - trigger search fallback
        setTaskDetails(null);
        await searchTasks(currentPath);
      }

    } catch (err) {
      setError(err.message || 'Failed to fetch task details');
    } finally {
      setLoading(false);
    }
  }, [isFirstFetch, resetSearch, searchTasks]);

  /**
   * Handle task selection from search results
   * Updates folder mapping and fetches full task details
   */
  const handleTaskSelection = useCallback(async (taskId) => {
    const details = await confirmTaskSelection(taskId);
    if (details) {
      setTaskDetails(details);

      // Log activity for task selection
      logActivity(ACTIVITY_TYPES.TASK_FETCH, {
        taskId,
        filePath: currentFilePath,
        narrative: 'Task selected from search results and folder mapping updated',
      });
    }
  }, [confirmTaskSelection, currentFilePath]);

  /**
   * Handle cancellation of search mode
   */
  const handleCancelSearch = useCallback(() => {
    cancelSearch();
    setTaskDetails(null);
  }, [cancelSearch]);

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
    refetch,
    currentFilePath,
    // Search fallback state
    isSearchMode,
    searchResults,
    searchLoading,
    searchError,
    confirming,
    handleTaskSelection,
    handleCancelSearch,
  };
};

import { useState, useCallback } from 'react';
import { searchTasksByFolderPath, updateMissingFolder, getTaskDetails } from '../api/folderApi';

/**
 * Hook for handling task search fallback when task ID cannot be extracted from path
 * @returns {Object} Task search state and handlers
 */
export const useTaskSearch = () => {
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState(null);
  const [isSearchMode, setIsSearchMode] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [currentFolderPath, setCurrentFolderPath] = useState(null);

  /**
   * Initiates a task search using the folder path
   * @param {string} folderPath - The folder path to search with
   */
  const searchTasks = useCallback(async (folderPath) => {
    if (!folderPath) {
      setSearchError('No folder path provided');
      return;
    }

    setSearchLoading(true);
    setSearchError(null);
    setIsSearchMode(true);
    setCurrentFolderPath(folderPath);

    try {
      const results = await searchTasksByFolderPath(folderPath);
      setSearchResults(results);

      if (results.length === 0) {
        setSearchError('No matching tasks found for this folder path');
      }
    } catch (err) {
      setSearchError(err.message || 'Failed to search for tasks');
      setSearchResults([]);
    } finally {
      setSearchLoading(false);
    }
  }, []);

  /**
   * Confirms the selected task and updates the folder mapping
   * @param {string} taskId - The selected task ID
   * @returns {Promise<Object|null>} The task details if successful
   */
  const confirmTaskSelection = useCallback(async (taskId) => {
    if (!taskId || !currentFolderPath) {
      setSearchError('Missing task ID or folder path');
      return null;
    }

    setConfirming(true);
    setSearchError(null);

    try {
      // Update the folder mapping in the backend
      await updateMissingFolder(taskId, currentFolderPath);

      // Fetch the full task details
      const taskDetails = await getTaskDetails(taskId);

      // Exit search mode on success
      setIsSearchMode(false);
      setSearchResults([]);
      setCurrentFolderPath(null);

      return taskDetails;
    } catch (err) {
      setSearchError(err.message || 'Failed to confirm task selection');
      return null;
    } finally {
      setConfirming(false);
    }
  }, [currentFolderPath]);

  /**
   * Cancels the search mode and resets state
   */
  const cancelSearch = useCallback(() => {
    setIsSearchMode(false);
    setSearchResults([]);
    setSearchError(null);
    setCurrentFolderPath(null);
    setConfirming(false);
  }, []);

  /**
   * Resets all search state
   */
  const resetSearch = useCallback(() => {
    setSearchResults([]);
    setSearchLoading(false);
    setSearchError(null);
    setIsSearchMode(false);
    setConfirming(false);
    setCurrentFolderPath(null);
  }, []);

  return {
    searchResults,
    searchLoading,
    searchError,
    isSearchMode,
    confirming,
    currentFolderPath,
    searchTasks,
    confirmTaskSelection,
    cancelSearch,
    resetSearch,
  };
};

export default useTaskSearch;

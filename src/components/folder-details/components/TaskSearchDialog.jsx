import React, { useRef, useEffect, useState } from 'react';

/**
 * Dialog component for task selection when task ID cannot be extracted from path
 * @param {Object} props - Component props
 * @param {boolean} props.open - Whether the dialog is open
 * @param {Array} props.searchResults - Array of task search results
 * @param {boolean} props.loading - Loading state for search
 * @param {boolean} props.confirming - Loading state for confirmation
 * @param {Function} props.onSelectTask - Callback when user selects and confirms a task
 * @param {Function} props.onCancel - Callback when user cancels selection
 * @param {string} props.error - Error message if any
 */
const TaskSearchDialog = ({
  open,
  searchResults,
  loading,
  confirming,
  onSelectTask,
  onCancel,
  error,
}) => {
  const [selectedTaskId, setSelectedTaskId] = useState(null);
  const dialogRef = useRef(null);
  const confirmButtonRef = useRef(null);
  const cancelButtonRef = useRef(null);

  // Reset selection when dialog opens
  useEffect(() => {
    if (open) {
      setSelectedTaskId(null);
    }
  }, [open]);

  // Handle dialog close event
  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog) {
      const handleClose = () => {
        if (onCancel) {
          onCancel();
        }
      };
      dialog.addEventListener('close', handleClose);
      return () => dialog.removeEventListener('close', handleClose);
    }
  }, [onCancel]);

  // Handle confirm button click
  useEffect(() => {
    const button = confirmButtonRef.current;
    if (button) {
      const handleClick = () => {
        if (selectedTaskId && onSelectTask) {
          onSelectTask(selectedTaskId);
        }
      };
      button.addEventListener('click', handleClick);
      return () => button.removeEventListener('click', handleClick);
    }
  }, [selectedTaskId, onSelectTask]);

  // Handle cancel button click
  useEffect(() => {
    const button = cancelButtonRef.current;
    if (button) {
      const handleClick = () => {
        if (onCancel) {
          onCancel();
        }
      };
      button.addEventListener('click', handleClick);
      return () => button.removeEventListener('click', handleClick);
    }
  }, [onCancel]);

  // Handle task item click for selection
  const handleTaskClick = (taskId) => {
    setSelectedTaskId(taskId);
  };

  if (!open) {
    return null;
  }

  const renderContent = () => {
    if (loading) {
      return (
        <div class="dialog-content-center">
          <sp-progress-circle size="m" indeterminate></sp-progress-circle>
          <p style={{ marginTop: '12px' }}>Searching for matching tasks...</p>
        </div>
      );
    }

    if (error) {
      return (
        <div class="dialog-content-center">
          <p style={{ color: 'var(--spectrum-negative-color-900)' }}>{error}</p>
        </div>
      );
    }

    if (!searchResults || searchResults.length === 0) {
      return (
        <div class="dialog-content-center">
          <p>No matching tasks found for this folder path.</p>
        </div>
      );
    }

    return (
      <div class="task-search-list">
        {searchResults.map((task) => (
          <div
            key={task.task_id}
            class={`task-search-item ${selectedTaskId === task.task_id ? 'selected' : ''}`}
            onClick={() => handleTaskClick(task.task_id)}
          >
            <div class="task-search-item-account">{task.account} - {task.church_name}</div>
            <div class="task-search-item-name">{task.name}</div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <sp-dialog-wrapper
      ref={dialogRef}
      open={open}
      headline="Select Task"
      dismissable
      underlay
      size="m"
    >
      <div class="task-search-dialog-content">
        <p class="task-search-description">
          Task ID not found in folder path. Please select the correct task from the list below:
        </p>
        {renderContent()}
        {searchResults && searchResults.length > 0 && !loading && !error && (
          <div class="task-search-dialog-actions">
            <sp-button
              ref={cancelButtonRef}
              variant="secondary"
              disabled={confirming}
            >
              Cancel
            </sp-button>
            <sp-button
              ref={confirmButtonRef}
              variant="accent"
              disabled={!selectedTaskId || confirming}
              style={{ marginLeft: '8px' }}
            >
              {confirming ? 'Confirming...' : 'Confirm Selection'}
            </sp-button>
          </div>
        )}
      </div>
    </sp-dialog-wrapper>
  );
};

export default TaskSearchDialog;

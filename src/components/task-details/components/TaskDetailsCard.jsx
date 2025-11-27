import React from 'react';

/**
 * Formats minutes into hours and minutes display
 * @param {number} mins - Total minutes
 * @returns {string|null} Formatted time string
 */
const formatEstimate = (mins) => {
  if (!mins) return null;
  const hours = Math.floor(mins / 60);
  const minutes = mins % 60;
  if (hours > 0) {
    return `${hours}h ${minutes > 0 ? `${minutes}m` : ''}`;
  }
  return `${minutes}m`;
};

/**
 * Formats a date string into readable format
 * @param {string} dateStr - ISO date string
 * @returns {string|null} Formatted date string
 */
const formatDate = (dateStr) => {
  if (!dateStr) return null;
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

/**
 * Displays task metadata like estimate, due date, and department
 * @param {Object} props - Component props
 * @param {Object} props.taskDetails - Task details from Supabase
 * @param {boolean} props.loading - Loading state
 */
const TaskDetailsCard = ({ taskDetails, loading }) => {
  const responsibleDept = taskDetails?.responsible_dept
    ? taskDetails.responsible_dept
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ')
    : null;

  if (loading) {
    return (
      <sp-card heading="Task Details">
        <div slot="description" class="card-description">
          <span class="description-text">Task details loading...</span>
        </div>
      </sp-card>
    );
  }

  if (!taskDetails) {
    return null;
  }

  return (
    <sp-card heading="Task Details">
      <div slot="description" class="card-meta">
        {taskDetails?.estimate_mins_after > 0 && (
          <span class="description-text">
            Estimate: {formatEstimate(taskDetails.estimate_mins_after)}
          </span>
        )}
        {taskDetails?.due_date_after && (
          <span class="description-text">
            Draft: {formatDate(taskDetails.due_date_after)}
          </span>
        )}
        {responsibleDept && (
          <sp-badge size="s" variant="informative">{responsibleDept}</sp-badge>
        )}
      </div>
    </sp-card>
  );
};

export default TaskDetailsCard;

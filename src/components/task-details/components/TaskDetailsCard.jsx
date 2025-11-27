import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { formatDate, getRelativeDate, getStatusBadgeStyle } from '../../../lib';

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
 * Displays task metadata like estimate, due date, and department
 * @param {Object} props - Component props
 * @param {Object} props.taskDetails - Task details from Supabase
 * @param {boolean} props.loading - Loading state
 */
const TaskDetailsCard = ({ taskDetails, loading }) => {
  const [descriptionExpanded, setDescriptionExpanded] = useState(false);
  const toggleButtonRef = useRef(null);

  const responsibleDept = taskDetails?.responsible_dept
    ? taskDetails.responsible_dept
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ')
    : null;

  useEffect(() => {
    const button = toggleButtonRef.current;
    if (button) {
      const handleClick = () => {
        setDescriptionExpanded(prev => !prev);
      };
      button.addEventListener('click', handleClick);
      return () => button.removeEventListener('click', handleClick);
    }
  }, []);

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

  const hasDescription = taskDetails?.markdown_description?.trim();

  return (
    <sp-card heading="Task Details">
      <div slot="description" class="card-description">
        <div class="card-meta">
          <div class="meta-row">
            {responsibleDept && (
              <div class="meta-field">
                <span class="meta-label">Department</span>
                <sp-badge size="s" variant="informative">{responsibleDept}</sp-badge>
              </div>
            )}
            {taskDetails?.status && (
              <div class="meta-field">
                <span class="meta-label">Status</span>
                <sp-badge
                  size="s"
                  style={getStatusBadgeStyle(taskDetails.status.color)}
                >
                  {taskDetails.status.status}
                </sp-badge>
              </div>
            )}
          </div>
          <div class="meta-row">
            {taskDetails?.estimate_mins_after > 0 && (
              <div class="meta-field">
                <span class="meta-label">Estimate</span>
                <span class="meta-value">{formatEstimate(taskDetails.estimate_mins_after)}</span>
              </div>
            )}
            {taskDetails?.due_date_after && (
              <div class="meta-field">
                <span class="meta-label">Draft Due</span>
                <span class="meta-value">
                  {formatDate(taskDetails.due_date_after)}
                  {getRelativeDate(taskDetails.due_date_after) && (
                    <span class="meta-relative"> ({getRelativeDate(taskDetails.due_date_after)})</span>
                  )}
                </span>
              </div>
            )}
            {taskDetails?.date_created && (
              <div class="meta-field">
                <span class="meta-label">Created</span>
                <span class="meta-value">
                  {formatDate(taskDetails.date_created)}
                  {getRelativeDate(taskDetails.date_created) && (
                    <span class="meta-relative"> ({getRelativeDate(taskDetails.date_created)})</span>
                  )}
                </span>
              </div>
            )}
          </div>
        </div>
        {hasDescription && (
          <div class="description-section">
            <div class={`description-toggle ${descriptionExpanded ? 'expanded' : ''}`}>
              <sp-action-button
                ref={toggleButtonRef}
                size="s"
                quiet
              >
                {descriptionExpanded ? '▼ Hide Description' : '▶ Show Description'}
              </sp-action-button>
            </div>
            {descriptionExpanded && (
              <div class="description-content">
                <div class="markdown-content">
                  <ReactMarkdown>{taskDetails.markdown_description}</ReactMarkdown>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </sp-card>
  );
};

export default TaskDetailsCard;

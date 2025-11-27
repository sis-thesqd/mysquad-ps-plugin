import React, { useRef, useEffect } from 'react';
import { copyWithToast, openClickUpTask } from '../../../lib';

/**
 * Displays folder/task info in a card format with action menu
 * @param {Object} props - Component props
 * @param {Object} props.taskDetails - Task details from Supabase
 * @param {boolean} props.loading - Loading state
 * @param {Function} props.onRefresh - Callback to refresh task data
 */
const FolderDetailsCard = ({ taskDetails, loading, onRefresh }) => {
  const menuRef = useRef(null);

  useEffect(() => {
    const menu = menuRef.current;
    if (menu) {
      const handleChange = (e) => {
        const selected = e.target.value;
        if (selected === 'refresh') {
          if (onRefresh) onRefresh();
        } else if (selected === 'open-task' && taskDetails?.task_id) {
          openClickUpTask(taskDetails.task_id);
        }
      };

      // Fix for menu not sizing correctly on first open
      let hasOpened = false;
      const handleOpened = () => {
        if (!hasOpened) {
          hasOpened = true;
          const popover = menu.shadowRoot?.querySelector('sp-popover') ||
                          menu.querySelector('sp-popover');
          if (popover) {
            popover.style.width = 'auto';
            void popover.offsetWidth;
          }
        }
      };

      menu.addEventListener('change', handleChange);
      menu.addEventListener('sp-opened', handleOpened);
      return () => {
        menu.removeEventListener('change', handleChange);
        menu.removeEventListener('sp-opened', handleOpened);
      };
    }
  }, [onRefresh, taskDetails?.task_id]);

  const churchAccount = taskDetails?.church_name && taskDetails?.account
    ? `${taskDetails.account} - ${taskDetails.church_name}`
    : (loading ? 'Loading...' : '');

  const taskName = taskDetails?.name || (loading ? 'Loading...' : 'No task found');

  return (
    <sp-card>
      <div slot="heading" class="card-heading">
        {taskDetails?.task_id && (
          <sp-badge
            size="s"
            variant="neutral"
            class="clickable-badge"
            onClick={() => copyWithToast(taskDetails.task_id, 'Task ID')}
          >
            {taskDetails.task_id}
          </sp-badge>
        )}
        {taskDetails?.name ? (
          <overlay-trigger type="hint" placement="bottom">
            <span
              class="task-name clickable"
              slot="trigger"
              onClick={() => copyWithToast(taskDetails.name, 'Task name')}
            >
              {taskName}
            </span>
            <sp-tooltip slot="hover-content">{taskDetails.name}</sp-tooltip>
          </overlay-trigger>
        ) : (
          <span class="task-name">{taskName}</span>
        )}
      </div>
      <div slot="description" class="card-description">
        <div class="card-subheading">{churchAccount}</div>
      </div>
      <sp-action-menu
        ref={menuRef}
        slot="actions"
        placement="bottom-start"
        quiet
        label="More Actions"
      >
        <sp-menu-item value="refresh">Refresh Data</sp-menu-item>
        {taskDetails?.task_id && (
          <sp-menu-item value="open-task">Open in ClickUp</sp-menu-item>
        )}
      </sp-action-menu>
    </sp-card>
  );
};

export default FolderDetailsCard;

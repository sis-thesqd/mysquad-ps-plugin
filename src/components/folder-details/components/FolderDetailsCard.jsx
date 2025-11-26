import React, { useRef, useEffect } from 'react';

/**
 * Opens a URL in the system's default browser via UXP shell API
 * @param {string} url - The URL to open
 */
const openExternalUrl = async (url) => {
  try {
    const uxp = require('uxp');
    if (uxp.shell && uxp.shell.openExternal) {
      await uxp.shell.openExternal(url);
    } else if (uxp.host && uxp.host.shell && uxp.host.shell.openExternal) {
      await uxp.host.shell.openExternal(url);
    } else {
      const { shell } = uxp;
      if (shell && shell.openExternal) {
        await shell.openExternal(url);
      } else {
        console.log('Shell API not available, URL:', url);
      }
    }
  } catch (e) {
    console.error('Failed to open URL:', e);
  }
};

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
          const url = `https://app.clickup.com/t/${taskDetails.task_id}`;
          openExternalUrl(url);
        }
      };
      menu.addEventListener('change', handleChange);
      return () => menu.removeEventListener('change', handleChange);
    }
  }, [onRefresh, taskDetails?.task_id]);

  const churchAccount = taskDetails?.church_name && taskDetails?.account
    ? `${taskDetails.church_name} - ${taskDetails.account}`
    : (loading ? 'Loading...' : '');

  const taskName = taskDetails?.name || (loading ? 'Loading...' : 'No task found');

  return (
    <sp-card>
      <div slot="heading" class="card-heading">
        {taskDetails?.task_id && (
          <sp-badge size="s" variant="neutral">{taskDetails.task_id}</sp-badge>
        )}
        <span>{taskName}</span>
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
      </sp-action-menu>
    </sp-card>
  );
};

export default FolderDetailsCard;

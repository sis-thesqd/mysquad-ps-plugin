import React from 'react';
import SizesPreview from './SizesPreview';

/**
 * Sizes selection panel - Step 2 of the wizard
 * Allows users to load and select sizes for artboard generation
 */
const SizesPanel = ({
  sizes,
  sizesLoading,
  sizesError,
  loadSizes,
  loadSizesFromTask,
  refreshSizesFromTask,
  loadDefaultSizes,
  clearSizes,
  onGenerateSingle,
  sourceConfig,
  options,
  taskId,
  taskName,
  sizesCachedAt,
  sizesFromCache,
  getCacheAge,
  disabled
}) => {
  const hasApiEndpoint = options?.apiEndpoint?.trim();
  const hasCachedSizes = sizes && sizes.length > 0 && sizesCachedAt;

  return (
    <div className="sizes-panel">
      {/* Linked task info */}
      {taskId ? (
        <sp-body size="xs" class="linked-task-hint">
          🔗 Task linked: <strong>{taskId}</strong>
        </sp-body>
      ) : (
        <sp-body size="xs" class="no-task-hint">
          ⚠️ No task linked - open a file in a task folder to enable
        </sp-body>
      )}

      {/* Load Sizes Actions */}
      <div className="sizes-load-row">
        {taskId && (
          <sp-action-button
            size="s"
            onClick={() => loadSizesFromTask()}
            {...(sizesLoading ? { disabled: true } : {})}
          >
            {sizesLoading ? 'Fetching...' : '📥 From Task'}
          </sp-action-button>
        )}
        
        {/* Refresh button - only show when we have cached sizes */}
        {taskId && hasCachedSizes && (
          <sp-action-button
            size="s"
            quiet
            onClick={refreshSizesFromTask}
            {...(sizesLoading ? { disabled: true } : {})}
            title="Force refresh from server"
          >
            🔄
          </sp-action-button>
        )}
        
        <sp-action-button
          size="s"
          quiet
          onClick={loadDefaultSizes}
          {...(sizesLoading ? { disabled: true } : {})}
        >
          Defaults
        </sp-action-button>
        
        {hasApiEndpoint && (
          <sp-action-button
            size="s"
            quiet
            onClick={loadSizes}
            {...(sizesLoading ? { disabled: true } : {})}
          >
            Fetch API
          </sp-action-button>
        )}
      </div>
      
      {/* Loading indicator */}
      {sizesLoading && (
        <sp-progressbar indeterminate size="s" label="Fetching sizes from task..."></sp-progressbar>
      )}
      
      {/* Task name and cache status display after fetch */}
      {taskName && !sizesLoading && (
        <div className="task-info-row">
          <sp-body size="xs" class="task-name-hint">📋 {taskName}</sp-body>
          {sizesCachedAt && (
            <sp-body size="xs" class="cache-status-hint">
              {sizesFromCache ? '📦 cached' : '✨ fresh'} · {getCacheAge()}
            </sp-body>
          )}
        </div>
      )}
      
      {sizesError && (
        <sp-body size="xs" class="error-text">❌ {sizesError}</sp-body>
      )}

      {/* Sizes Preview */}
      <SizesPreview 
        sizes={sizes} 
        onClear={clearSizes} 
        onGenerateSingle={onGenerateSingle}
        sourceConfig={sourceConfig}
        disabled={disabled}
      />

      {/* Quick tip */}
      {sizes && sizes.length > 0 && (
        <sp-body size="xs" class="field-hint">
          Click a size to generate it, or go to Generate for all {sizes.length}.
        </sp-body>
      )}
    </div>
  );
};

export default SizesPanel;


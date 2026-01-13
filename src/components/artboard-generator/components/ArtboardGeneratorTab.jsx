import React, { useEffect, useRef, useCallback, useState } from 'react';
import SourceConfigPanel from './SourceConfigPanel';
import SizesPreview from './SizesPreview';
import ConfigurationStatus from './ConfigurationStatus';
import SettingsPanel from './SettingsPanel';
import QuickGeneratePanel from './QuickGeneratePanel';
import { usePhotoshopDocument } from '../hooks/usePhotoshopDocument';
import { useArtboardGenerator } from '../hooks/useArtboardGenerator';

/**
 * Main artboard generator tab component
 * Simplified UI with settings in collapsible panel and generate button in sizes section
 */
const ArtboardGeneratorTab = ({ taskDetails }) => {
  // Document data
  const { artboards, layers, loading: docLoading, refresh: refreshDoc } = usePhotoshopDocument();

  // Get task ID from taskDetails
  const taskId = taskDetails?.task_id;

  // Generator state - pass taskId to hook
  const {
    sourceConfig,
    setSourceConfig,
    options,
    setOptions,
    printSettings,
    setPrintSettings,
    sizes,
    sizesLoading,
    sizesError,
    loadSizes,
    loadSizesFromTask,
    refreshSizesFromTask,
    loadDefaultSizes,
    clearSizes,
    generating,
    progress,
    generationError,
    generate,
    generateSingle,
    validateConfig,
    canGenerateSize,
    taskName,
    sizesFromCache,
    getCacheAge,
  } = useArtboardGenerator({ taskId });

  // Track the last task ID we auto-loaded for
  const lastAutoLoadedTaskId = useRef(null);

  // Track whether to show quick mode or customized mode
  const [showQuickMode, setShowQuickMode] = useState(true);

  // Track if generation just completed (for undo reminder)
  const [showUndoReminder, setShowUndoReminder] = useState(false);

  // Auto-load sizes from task when task is linked
  useEffect(() => {
    // Only auto-load if:
    // 1. We have a task ID
    // 2. We haven't already loaded for this task
    // 3. We're not currently loading
    if (taskId && taskId !== lastAutoLoadedTaskId.current && !sizesLoading) {
      console.log('[ArtboardGeneratorTab] Auto-loading sizes for task:', taskId);
      lastAutoLoadedTaskId.current = taskId;
      loadSizesFromTask();
    }
  }, [taskId, sizesLoading, loadSizesFromTask]);

  // Reset when task is unlinked
  useEffect(() => {
    if (!taskId) {
      lastAutoLoadedTaskId.current = null;
    }
  }, [taskId]);

  // Show undo reminder when generation completes
  const prevGenerating = useRef(generating);
  useEffect(() => {
    // If was generating and now stopped (completed or errored)
    if (prevGenerating.current && !generating && !generationError) {
      setShowUndoReminder(true);
      // Hide reminder after 10 seconds
      const timer = setTimeout(() => {
        setShowUndoReminder(false);
      }, 10000);
      return () => clearTimeout(timer);
    }
    prevGenerating.current = generating;
  }, [generating, generationError]);

  // Fail-fast validation checks for document state
  const documentErrors = [];
  if (!docLoading) {
    if (artboards.length === 0) {
      documentErrors.push('No artboards in document - create source artboards first');
    }
    if (layers.length === 0) {
      documentErrors.push('No layers detected in document');
    }
  }

  const validationErrors = validateConfig();

  // Count how many sizes can actually be generated
  const generatableSizesCount = sizes.filter(size => canGenerateSize(size)).length;
  const canGenerate = documentErrors.length === 0 && validationErrors.length === 0 && !generating && !docLoading && generatableSizesCount > 0;

  // Debug logging
  console.log('[ArtboardGeneratorTab] Button state debug:', {
    canGenerate,
    validationErrors,
    validationErrorsCount: validationErrors.length,
    generating,
    docLoading,
    sizesCount: sizes.length,
    generatableSizesCount,
    sourceConfig: {
      landscape: sourceConfig.landscape?.artboard || 'not set',
      portrait: sourceConfig.portrait?.artboard || 'not set',
      square: sourceConfig.square?.artboard || 'not set',
    },
    sizes: sizes.map(s => ({ name: s.name, width: s.width, height: s.height, ratio: (s.width / s.height).toFixed(2) })),
  });

  // Refs for buttons - needed for UXP web component event handling
  const generateButtonRef = useRef(null);
  const refreshSizesButtonRef = useRef(null);
  const loadSizesButtonRef = useRef(null);

  // Handle generate button click
  const handleGenerate = useCallback(() => {
    console.log('[ArtboardGeneratorTab] Generate button clicked, canGenerate:', canGenerate);
    if (canGenerate) {
      generate();
    }
  }, [canGenerate, generate]);

  // Handle refresh sizes button click
  const handleRefreshSizes = useCallback(() => {
    console.log('[ArtboardGeneratorTab] Refresh sizes button clicked, sizesLoading:', sizesLoading);
    if (!sizesLoading) {
      refreshSizesFromTask();
    }
  }, [sizesLoading, refreshSizesFromTask]);

  // Handle load sizes button click (for initial load)
  const handleLoadSizes = useCallback(() => {
    console.log('[ArtboardGeneratorTab] Load sizes button clicked, sizesLoading:', sizesLoading);
    if (!sizesLoading) {
      loadSizesFromTask();
    }
  }, [sizesLoading, loadSizesFromTask]);

  // Attach event listener to generate button (UXP web components need addEventListener)
  useEffect(() => {
    const button = generateButtonRef.current;
    if (button) {
      button.addEventListener('click', handleGenerate);
      return () => {
        button.removeEventListener('click', handleGenerate);
      };
    }
  }, [handleGenerate]);

  // Attach event listener to refresh sizes button
  useEffect(() => {
    const button = refreshSizesButtonRef.current;
    if (button) {
      button.addEventListener('click', handleRefreshSizes);
      return () => {
        button.removeEventListener('click', handleRefreshSizes);
      };
    }
  }, [handleRefreshSizes]);

  // Update disabled state on generate button (UXP needs direct property setting)
  useEffect(() => {
    const button = generateButtonRef.current;
    if (button) {
      button.disabled = !canGenerate;
      console.log('[ArtboardGeneratorTab] Setting button disabled:', !canGenerate);
    }
  }, [canGenerate]);

  // Update disabled state on refresh sizes button
  useEffect(() => {
    const button = refreshSizesButtonRef.current;
    if (button) {
      button.disabled = sizesLoading;
    }
  }, [sizesLoading]);

  // Attach event listener to load sizes button
  useEffect(() => {
    const button = loadSizesButtonRef.current;
    if (button) {
      button.addEventListener('click', handleLoadSizes);
      return () => {
        button.removeEventListener('click', handleLoadSizes);
      };
    }
  }, [handleLoadSizes]);

  // Update disabled state on load sizes button
  useEffect(() => {
    const button = loadSizesButtonRef.current;
    if (button) {
      button.disabled = sizesLoading;
    }
  }, [sizesLoading]);

  return (
    <div className="artboard-generator-tab">
      {/* Header Section */}
      <div className="generator-header">
        <div className="header-title">
          <sp-label size="l">Artboard Generator</sp-label>
          <sp-action-button size="s" quiet onClick={refreshDoc} disabled={docLoading}>
            {docLoading ? 'Refreshing...' : 'Refresh'}
          </sp-action-button>
        </div>

        {docLoading && (
          <sp-progress-bar indeterminate size="s" label="Loading document..."></sp-progress-bar>
        )}

        {!docLoading && artboards.length === 0 && (
          <div className="empty-state-inline">
            <sp-body size="s" class="warning-text">
              ⚠️ No artboards found in document
            </sp-body>
            <sp-body size="xs" class="hint-text">
              Create at least one artboard in Photoshop to use as a source template
            </sp-body>
          </div>
        )}

        {/* Fail-fast document errors */}
        {documentErrors.length > 0 && (
          <div className="document-errors">
            {documentErrors.map((error, index) => (
              <div key={index} className="error-item">
                <sp-icon name="ui:AlertMedium" size="s" class="error-icon"></sp-icon>
                <sp-body size="s" class="error-text">{error}</sp-body>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Generate Mode - shown when fully auto-configured */}
      {showQuickMode && validationErrors.length === 0 && sizes.length > 0 && (
        <QuickGeneratePanel
          sourceConfig={sourceConfig}
          sizes={sizes}
          onGenerate={handleGenerate}
          onCustomize={() => setShowQuickMode(false)}
          generating={generating}
          generatableSizesCount={generatableSizesCount}
          canGenerate={canGenerate}
        />
      )}

      {/* Configuration Status Summary - shown when not in quick mode or has errors */}
      {(!showQuickMode || validationErrors.length > 0 || sizes.length === 0) && (
        <ConfigurationStatus
          sourceConfig={sourceConfig}
          sizes={sizes}
          options={options}
          printSettings={printSettings}
        />
      )}

      {/* Source Configuration - shown when not in quick mode */}
      {!showQuickMode && (
        <SourceConfigPanel
          artboards={artboards}
          layers={layers}
          sourceConfig={sourceConfig}
          onConfigChange={setSourceConfig}
          sizes={sizes}
        />
      )}

      {/* Sizes Section with Generate Button */}
      <div className="sizes-section">
        <div className="sizes-section-header">
          <div className="sizes-title">
            <sp-label size="m">Sizes</sp-label>
            {taskName && (
              <sp-body size="xs" class="task-name-badge">
                from: {taskName}
              </sp-body>
            )}
            {sizesFromCache && (
              <sp-body size="xs" class="cache-badge">
                (cached {getCacheAge()})
              </sp-body>
            )}
          </div>
          <div className="sizes-actions">
            {taskId ? (
              <sp-action-button
                ref={refreshSizesButtonRef}
                size="s"
                quiet
              >
                {sizesLoading ? 'Loading...' : 'Refresh'}
              </sp-action-button>
            ) : (
              <>
                {options.apiEndpoint && (
                  <sp-action-button
                    size="s"
                    quiet
                    onClick={loadSizes}
                    disabled={sizesLoading}
                  >
                    {sizesLoading ? 'Loading...' : 'Fetch from API'}
                  </sp-action-button>
                )}
                <sp-action-button
                  size="s"
                  quiet
                  onClick={loadDefaultSizes}
                  disabled={sizesLoading}
                >
                  Load Defaults
                </sp-action-button>
              </>
            )}
          </div>
        </div>

        {sizesError && (
          <sp-body size="s" class="error-text">
            {sizesError}
          </sp-body>
        )}

        {/* Show empty state with Load Sizes button when no sizes */}
        {sizes.length === 0 && !sizesLoading && (
          <div className="sizes-empty-state">
            <div className="empty-state-icon">📐</div>
            <sp-label size="m">Get Started</sp-label>
            {taskId ? (
              <>
                <sp-body size="s">Load artboard sizes from your ClickUp task to begin</sp-body>
                <sp-button
                  ref={loadSizesButtonRef}
                  variant="primary"
                  size="l"
                >
                  {sizesLoading ? 'Loading...' : 'Load Sizes from Task'}
                </sp-button>
                <sp-body size="xs" class="hint-text">
                  Sizes will be automatically cached for 15 minutes
                </sp-body>
              </>
            ) : (
              <>
                <sp-body size="s">To use the artboard generator:</sp-body>
                <div className="empty-state-steps">
                  <sp-body size="xs">1. Open a Photoshop file linked to a ClickUp task</sp-body>
                  <sp-body size="xs">2. Load sizes from the task</sp-body>
                  <sp-body size="xs">3. Select source artboards (or let auto-detect)</sp-body>
                  <sp-body size="xs">4. Click Generate</sp-body>
                </div>
              </>
            )}
          </div>
        )}

        {sizesLoading && sizes.length === 0 && (
          <div className="sizes-loading-state">
            <sp-progress-bar indeterminate size="s" label="Loading sizes..."></sp-progress-bar>
          </div>
        )}

        {sizes.length > 0 && (
          <SizesPreview
            sizes={sizes}
            onClear={clearSizes}
            onGenerateSingle={generateSingle}
            sourceConfig={sourceConfig}
            disabled={generating || docLoading}
          />
        )}

        {/* Generation Section - only shown when not in quick mode */}
        {sizes.length > 0 && !showQuickMode && (
          <div className="generation-section-inline">
            {generating && (
              <div className="generation-progress">
                <sp-body size="s">
                  Generating: {progress.name} ({progress.current}/{progress.total})
                </sp-body>
                <sp-progress-bar
                  value={(progress.current / progress.total) * 100}
                  size="s"
                ></sp-progress-bar>
              </div>
            )}

            {generationError && (
              <sp-body size="s" class="error-text">
                {generationError}
              </sp-body>
            )}

            {validationErrors.length > 0 && !generating && (
              <div className="validation-warnings-inline">
                {validationErrors.map((error, index) => (
                  <sp-body key={index} size="xs" class="warning-text">
                    • {error}
                  </sp-body>
                ))}
              </div>
            )}

            <sp-button
              ref={generateButtonRef}
              variant="cta"
            >
              {generating
                ? 'Generating...'
                : `Generate All (${generatableSizesCount})`
              }
            </sp-button>
          </div>
        )}

        {/* Progress indicator for quick mode */}
        {sizes.length > 0 && showQuickMode && generating && (
          <div className="generation-progress">
            <sp-body size="s">
              Generating: {progress.name} ({progress.current}/{progress.total})
            </sp-body>
            <sp-progress-bar
              value={(progress.current / progress.total) * 100}
              size="s"
            ></sp-progress-bar>
          </div>
        )}

        {/* Undo reminder after generation */}
        {showUndoReminder && (
          <div className="undo-reminder">
            <sp-icon name="ui:Undo" size="s" class="undo-icon"></sp-icon>
            <sp-body size="s" class="success-text">
              ✓ Generation complete! Use <strong>Cmd+Z</strong> (Mac) or <strong>Ctrl+Z</strong> (Win) to undo all changes if needed.
            </sp-body>
            <sp-action-button
              size="xs"
              quiet
              onClick={() => setShowUndoReminder(false)}
            >
              ✕
            </sp-action-button>
          </div>
        )}
      </div>

      {/* Settings Panel - Collapsed by default */}
      <SettingsPanel
        options={options}
        onOptionsChange={setOptions}
        printSettings={printSettings}
        onPrintSettingsChange={setPrintSettings}
      />
    </div>
  );
};

export default ArtboardGeneratorTab;

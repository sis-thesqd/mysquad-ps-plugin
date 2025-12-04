import React, { useEffect, useRef, useCallback } from 'react';
import SourceConfigPanel from './SourceConfigPanel';
import SizesPreview from './SizesPreview';
import ConfigurationStatus from './ConfigurationStatus';
import SettingsPanel from './SettingsPanel';
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

  const validationErrors = validateConfig();

  // Count how many sizes can actually be generated
  const generatableSizesCount = sizes.filter(size => canGenerateSize(size)).length;
  const canGenerate = validationErrors.length === 0 && !generating && !docLoading && generatableSizesCount > 0;

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

  // Ref for Generate All button - needed for UXP web component event handling
  const generateButtonRef = useRef(null);

  // Handle generate button click
  const handleGenerate = useCallback(() => {
    console.log('[ArtboardGeneratorTab] Generate button clicked, canGenerate:', canGenerate);
    if (canGenerate) {
      generate();
    }
  }, [canGenerate, generate]);

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

  // Update disabled state on button (UXP needs direct property setting)
  useEffect(() => {
    const button = generateButtonRef.current;
    if (button) {
      button.disabled = !canGenerate;
      console.log('[ArtboardGeneratorTab] Setting button disabled:', !canGenerate);
    }
  }, [canGenerate]);

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
          <sp-body size="s" class="warning-text">
            No artboards found. Create source artboards first.
          </sp-body>
        )}
      </div>

      {/* Configuration Status Summary */}
      <ConfigurationStatus
        sourceConfig={sourceConfig}
        sizes={sizes}
        options={options}
        printSettings={printSettings}
      />

      {/* Source Configuration */}
      <SourceConfigPanel
        artboards={artboards}
        layers={layers}
        sourceConfig={sourceConfig}
        onConfigChange={setSourceConfig}
        sizes={sizes}
      />

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
                size="s"
                quiet
                onClick={refreshSizesFromTask}
                disabled={sizesLoading}
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

        <SizesPreview
          sizes={sizes}
          onClear={clearSizes}
          onGenerateSingle={generateSingle}
          sourceConfig={sourceConfig}
          disabled={generating || docLoading}
        />

        {/* Generation Section - now inside sizes */}
        {sizes.length > 0 && (
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

import React from 'react';
import { SOURCE_TYPES } from '../../../config';

/**
 * Generate panel - Final step of the wizard
 * Shows configuration summary, validation, and generate button
 */
const GeneratePanel = ({
  sourceConfig,
  options,
  sizes,
  validationErrors,
  generating,
  progress,
  generationError,
  onGenerate,
  canGenerate
}) => {
  // Count configured sources
  const configuredSources = SOURCE_TYPES.filter(
    source => sourceConfig[source.id]?.artboard
  );

  // Count sizes by type
  const sizesByType = sizes?.reduce((acc, size) => {
    const type = size.type || 'other';
    acc[type] = (acc[type] || 0) + 1;
    return acc;
  }, {}) || {};

  return (
    <div className="generate-panel">
      {/* Configuration Summary */}
      <div className="config-summary">
        {/* Sources Summary */}
        <div className="summary-section">
          <sp-detail>SOURCES</sp-detail>
          {configuredSources.length > 0 ? (
            <div className="summary-items">
              {configuredSources.map(source => (
                <div key={source.id} className="summary-item summary-item--success">
                  <span className="summary-icon">{source.icon}</span>
                  <span>{source.label}</span>
                </div>
              ))}
            </div>
          ) : (
            <sp-body size="xs" class="warning-text">No sources configured</sp-body>
          )}
        </div>

        {/* Sizes Summary */}
        <div className="summary-section">
          <sp-detail>SIZES</sp-detail>
          {sizes && sizes.length > 0 ? (
            <div className="summary-items">
              <div className="summary-item">
                <span className="summary-value">{sizes.length} total</span>
              </div>
              {Object.entries(sizesByType).slice(0, 3).map(([type, count]) => (
                <div key={type} className="summary-item summary-item--detail">
                  <span className="summary-label">{type}:</span>
                  <span className="summary-value">{count}</span>
                </div>
              ))}
            </div>
          ) : (
            <sp-body size="xs" class="warning-text">No sizes loaded</sp-body>
          )}
        </div>

        {/* Layout Settings */}
        <div className="summary-section">
          <sp-detail>LAYOUT</sp-detail>
          <div className="summary-items summary-items--compact">
            <span>{options?.columns || 4} cols</span>
            <span>{options?.gap || 100}px gap</span>
          </div>
        </div>
      </div>

      {/* Validation Status */}
      {validationErrors.length > 0 && !generating && (
        <div className="validation-box">
          {validationErrors.map((error, index) => (
            <div key={index} className="validation-item">
              <span>⚠️</span>
              <span>{error}</span>
            </div>
          ))}
        </div>
      )}

      {/* Generation Progress */}
      {generating && (
        <div className="progress-box">
          <sp-body size="s">{progress.name} ({progress.current}/{progress.total})</sp-body>
          <sp-progress-bar
            value={(progress.current / progress.total) * 100}
            size="s"
          ></sp-progress-bar>
        </div>
      )}

      {/* Generation Error */}
      {generationError && (
        <sp-body size="s" class="error-text">{generationError}</sp-body>
      )}

      {/* Generate Button */}
      <div className="generate-action">
        <sp-button
          variant="cta"
          onClick={onGenerate}
          disabled={!canGenerate}
        >
          {generating ? `${progress.current}/${progress.total}...` : `Generate ${sizes?.length || 0} Artboards`}
        </sp-button>
      </div>
    </div>
  );
};

export default GeneratePanel;


import React, { useMemo } from 'react';
import { SOURCE_TYPES, ASPECT_RATIO_THRESHOLDS } from '../../../config';

/**
 * Quick Generate Panel - Smart mode for when configuration is auto-detected
 * Shows a simplified checklist view with prominent generate button
 */
const QuickGeneratePanel = ({
  sourceConfig,
  sizes,
  onGenerate,
  onCustomize,
  generating,
  generatableSizesCount,
  canGenerate,
}) => {
  // Calculate what was detected
  const detectionStatus = useMemo(() => {
    if (!sizes || sizes.length === 0) return null;

    const neededOrientations = new Set();
    sizes.forEach(size => {
      const ratio = size.width / size.height;
      if (ratio < ASPECT_RATIO_THRESHOLDS.PORTRAIT_MAX) {
        neededOrientations.add('portrait');
      } else if (ratio > ASPECT_RATIO_THRESHOLDS.SQUARE_MAX) {
        neededOrientations.add('landscape');
      } else {
        neededOrientations.add('square');
      }
    });

    const configuredSources = [];
    const missingSources = [];

    SOURCE_TYPES.forEach(source => {
      if (neededOrientations.has(source.id)) {
        if (sourceConfig[source.id]?.artboard) {
          configuredSources.push({
            ...source,
            artboardName: sourceConfig[source.id].artboard,
          });
        } else {
          missingSources.push(source);
        }
      }
    });

    const totalLayersDetected = SOURCE_TYPES.reduce((count, source) => {
      if (!sourceConfig[source.id]?.artboard) return count;
      const layers = sourceConfig[source.id]?.layers || {};
      return count + Object.values(layers).filter(v => v !== null && v !== '').length;
    }, 0);

    return {
      configured: configuredSources,
      missing: missingSources,
      allConfigured: missingSources.length === 0 && configuredSources.length > 0,
      totalLayersDetected,
    };
  }, [sourceConfig, sizes]);

  if (!detectionStatus || !detectionStatus.allConfigured) {
    return null; // Don't show quick mode if not fully configured
  }

  return (
    <div className="quick-generate-panel">
      <div className="quick-header">
        <sp-icon name="ui:CheckmarkCircle" size="m" class="quick-icon-success"></sp-icon>
        <sp-label size="l">🚀 Ready to Generate</sp-label>
      </div>

      <div className="quick-checklist">
        <div className="checklist-item checklist-item-complete">
          <span className="checklist-check">✓</span>
          <sp-body size="s">
            <strong>{detectionStatus.configured.length} source artboard{detectionStatus.configured.length !== 1 ? 's' : ''} detected</strong>
            <div className="checklist-details">
              {detectionStatus.configured.map((source, index) => (
                <span key={source.id} className="source-detail">
                  {source.icon} {source.artboardName}
                  {index < detectionStatus.configured.length - 1 && ', '}
                </span>
              ))}
            </div>
          </sp-body>
        </div>

        <div className="checklist-item checklist-item-complete">
          <span className="checklist-check">✓</span>
          <sp-body size="s">
            <strong>{sizes.length} size{sizes.length !== 1 ? 's' : ''} loaded from task</strong>
          </sp-body>
        </div>

        <div className="checklist-item checklist-item-complete">
          <span className="checklist-check">✓</span>
          <sp-body size="s">
            <strong>
              {detectionStatus.totalLayersDetected > 0
                ? `${detectionStatus.totalLayersDetected} layer role${detectionStatus.totalLayersDetected !== 1 ? 's' : ''} auto-assigned`
                : 'Layer roles ready (will use defaults)'}
            </strong>
          </sp-body>
        </div>
      </div>

      <div className="quick-actions">
        <sp-button
          variant="cta"
          size="l"
          onClick={onGenerate}
          disabled={!canGenerate}
        >
          {generating
            ? 'Generating...'
            : `Generate All Artboards (${generatableSizesCount})`
          }
        </sp-button>
        <sp-button
          variant="secondary"
          size="m"
          onClick={onCustomize}
          quiet
        >
          Customize Settings ▼
        </sp-button>
      </div>
    </div>
  );
};

export default QuickGeneratePanel;

import React, { useMemo } from 'react';
import { SOURCE_TYPES, ASPECT_RATIO_THRESHOLDS } from '../../../config';

/**
 * Determines what orientations are needed based on loaded sizes
 * @param {Array} sizes - Loaded sizes
 * @returns {Set<string>} Set of needed orientation types
 */
const getNeededOrientations = (sizes) => {
  const needed = new Set();
  sizes.forEach(size => {
    const ratio = size.width / size.height;
    if (ratio < ASPECT_RATIO_THRESHOLDS.PORTRAIT_MAX) {
      needed.add('portrait');
    } else if (ratio > ASPECT_RATIO_THRESHOLDS.SQUARE_MAX) {
      needed.add('landscape');
    } else {
      needed.add('square');
    }
  });
  return needed;
};

/**
 * Configuration status summary component with traffic light indicators
 * Shows progress of source configuration at a glance
 * 🟢 = Ready, 🟡 = Warning/Partial, 🔴 = Error/Missing
 */
const ConfigurationStatus = ({ sourceConfig, sizes, options, printSettings }) => {
  const status = useMemo(() => {
    const neededOrientations = getNeededOrientations(sizes);
    const configured = [];
    const missing = [];

    SOURCE_TYPES.forEach(source => {
      const isConfigured = !!sourceConfig[source.id]?.artboard;
      const isNeeded = neededOrientations.has(source.id);

      if (isNeeded) {
        if (isConfigured) {
          configured.push(source);
        } else {
          missing.push(source);
        }
      }
    });

    // Calculate layer assignment status
    const layerCounts = SOURCE_TYPES.map(source => {
      if (!sourceConfig[source.id]?.artboard) return 0;
      const layers = sourceConfig[source.id]?.layers || {};
      return Object.values(layers).filter(v => v !== null && v !== '').length;
    });
    const totalLayersAssigned = layerCounts.reduce((sum, count) => sum + count, 0);

    return {
      configured,
      missing,
      total: configured.length + missing.length,
      isComplete: missing.length === 0 && configured.length > 0,
      neededOrientations,
      totalLayersAssigned,
    };
  }, [sourceConfig, sizes]);

  const optionsSummary = useMemo(() => {
    const parts = [];
    if (options.columns !== 4) parts.push(`${options.columns} cols`);
    if (options.gap !== 100) parts.push(`${options.gap}px gap`);
    if (options.useBatchMethod === false) parts.push('Legacy mode');
    return parts.length > 0 ? parts.join(', ') : 'Default';
  }, [options]);

  const printSummary = useMemo(() => {
    if (!printSettings.bleed || printSettings.bleed === 0) return 'No bleed';
    return `${printSettings.bleed}" bleed`;
  }, [printSettings]);

  // Traffic light status indicators
  const sourcesLight = status.isComplete ? '🟢' : (status.configured.length > 0 ? '🟡' : '🔴');
  const sizesLight = sizes.length > 0 ? '🟢' : '🔴';
  const layersLight = status.totalLayersAssigned > 0 ? '🟢' : '🟡';

  // Don't show if no sizes loaded
  if (sizes.length === 0) {
    return (
      <div className="config-status config-status-empty">
        <div className="config-status-compact">
          <div className="status-item">
            <span className="traffic-light">🔴</span>
            <sp-body size="s">Sources: Not configured</sp-body>
          </div>
          <div className="status-item">
            <span className="traffic-light">🔴</span>
            <sp-body size="s">Sizes: None loaded</sp-body>
          </div>
          <div className="status-item">
            <span className="traffic-light">🟡</span>
            <sp-body size="s">Layers: Auto-detect ready</sp-body>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`config-status ${status.isComplete ? 'config-status-complete' : 'config-status-incomplete'}`}>
      <div className="config-status-compact">
        {/* Sources status */}
        <div className="status-item">
          <span className="traffic-light">{sourcesLight}</span>
          <sp-body size="s">
            Sources: {status.isComplete ? 'Ready' : `${status.configured.length}/${status.total}`}
            {status.missing.length > 0 && (
              <span className="missing-hint">
                {' '}(need {status.missing.map(s => s.label.split(' ')[0]).join(', ')})
              </span>
            )}
          </sp-body>
        </div>

        {/* Sizes status */}
        <div className="status-item">
          <span className="traffic-light">{sizesLight}</span>
          <sp-body size="s">
            Sizes: {sizes.length} loaded
          </sp-body>
        </div>

        {/* Layers status */}
        <div className="status-item">
          <span className="traffic-light">{layersLight}</span>
          <sp-body size="s">
            Layers: {status.totalLayersAssigned > 0
              ? `${status.totalLayersAssigned} assigned`
              : 'Auto-detected'}
          </sp-body>
        </div>
      </div>
    </div>
  );
};

export default ConfigurationStatus;

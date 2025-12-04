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
 * Configuration status summary component
 * Shows progress of source configuration at a glance
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

    return {
      configured,
      missing,
      total: configured.length + missing.length,
      isComplete: missing.length === 0 && configured.length > 0,
      neededOrientations,
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

  // Don't show if no sizes loaded
  if (sizes.length === 0) {
    return (
      <div className="config-status config-status-empty">
        <sp-icon name="ui:InfoMedium" size="s"></sp-icon>
        <sp-body size="s">Load sizes to see configuration requirements</sp-body>
      </div>
    );
  }

  return (
    <div className={`config-status ${status.isComplete ? 'config-status-complete' : 'config-status-incomplete'}`}>
      <div className="config-status-main">
        <div className="config-status-sources">
          {status.isComplete ? (
            <>
              <span className="status-icon status-icon-success">✓</span>
              <sp-body size="s">
                {status.configured.length} of {status.total} sources configured
              </sp-body>
            </>
          ) : (
            <>
              <span className="status-icon status-icon-warning">!</span>
              <sp-body size="s">
                {status.configured.length} of {status.total} sources configured
                {status.missing.length > 0 && (
                  <span className="missing-sources">
                    — need {status.missing.map(s => s.label.split(' ')[0]).join(', ')}
                  </span>
                )}
              </sp-body>
            </>
          )}
        </div>

        <div className="config-status-badges">
          <span className="config-badge" title="Layout options">
            {optionsSummary}
          </span>
          <span className="config-badge" title="Print settings">
            {printSummary}
          </span>
        </div>
      </div>
    </div>
  );
};

export default ConfigurationStatus;

import React, { useCallback, useState, useMemo, useEffect } from 'react';
import ArtboardPicker from './ArtboardPicker';
import LayerRoleSelectors from './LayerRoleSelectors';
import { autoDetectLayerRoles } from '../utils/layerDetection';
import { SOURCE_TYPES, ASPECT_RATIO_THRESHOLDS } from '../../../config';

/**
 * Determines what orientations are needed based on loaded sizes
 * @param {Array} sizes - Loaded sizes
 * @returns {Set<string>} Set of needed orientation types
 */
const getNeededOrientations = (sizes) => {
  if (!sizes || sizes.length === 0) {
    // Show all orientations if no sizes loaded yet
    return new Set(['landscape', 'portrait', 'square']);
  }
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
 * Count how many layers were auto-detected
 */
const countDetectedLayers = (detectedLayers) => {
  return Object.values(detectedLayers).filter(v => v !== null && v !== '').length;
};

/**
 * Source configuration panel for selecting source artboards and layer roles
 * @param {Object} props - Component props
 * @param {Array} props.artboards - Available artboards in the document
 * @param {Array} props.layers - Available layers in the document
 * @param {Object} props.sourceConfig - Current source configuration
 * @param {Function} props.onConfigChange - Callback when configuration changes
 * @param {Array} props.sizes - Loaded sizes (to determine which orientations are needed)
 */
const SourceConfigPanel = ({ artboards, layers, sourceConfig, onConfigChange, sizes = [] }) => {
  // Track which source sections have expanded layer roles
  const [expandedSources, setExpandedSources] = useState({});
  // Track auto-detection feedback messages
  const [detectionMessages, setDetectionMessages] = useState({});
  // Track which artboards were auto-selected to avoid re-selecting
  const [autoSelectedSources, setAutoSelectedSources] = useState({});

  const neededOrientations = useMemo(() => getNeededOrientations(sizes), [sizes]);

  // Auto-select single artboards when only one matches each orientation
  useEffect(() => {
    if (!artboards || artboards.length === 0 || sizes.length === 0) return;

    const updates = {};
    let hasUpdates = false;

    SOURCE_TYPES.forEach(sourceType => {
      const orientation = sourceType.id;
      // Skip if already configured or already auto-selected
      if (sourceConfig[orientation]?.artboard || autoSelectedSources[orientation]) return;
      // Skip if not needed
      if (!neededOrientations.has(orientation)) return;

      // Find artboards matching this orientation
      const matchingArtboards = artboards.filter(ab => {
        const ratio = ab.width / ab.height;
        if (orientation === 'portrait') {
          return ratio < ASPECT_RATIO_THRESHOLDS.PORTRAIT_MAX;
        } else if (orientation === 'landscape') {
          return ratio > ASPECT_RATIO_THRESHOLDS.SQUARE_MAX;
        } else { // square
          return ratio >= ASPECT_RATIO_THRESHOLDS.PORTRAIT_MAX &&
                 ratio <= ASPECT_RATIO_THRESHOLDS.SQUARE_MAX;
        }
      });

      // If exactly one matching artboard, auto-select it
      if (matchingArtboards.length === 1) {
        const artboardName = matchingArtboards[0].name;
        const detectedLayers = autoDetectLayerRoles(layers, artboardName);
        const detectedCount = countDetectedLayers(detectedLayers);

        updates[orientation] = {
          ...sourceConfig[orientation],
          artboard: artboardName,
          layers: {
            ...sourceConfig[orientation]?.layers,
            ...detectedLayers,
          },
        };

        hasUpdates = true;

        // Show feedback message
        setDetectionMessages(prev => ({
          ...prev,
          [orientation]: `Auto-selected "${artboardName}" (only ${orientation} source)${detectedCount > 0 ? ` + detected ${detectedCount} layer${detectedCount !== 1 ? 's' : ''}` : ''}`
        }));

        // Mark as auto-selected
        setAutoSelectedSources(prev => ({ ...prev, [orientation]: true }));

        // Clear message after 5 seconds
        setTimeout(() => {
          setDetectionMessages(prev => ({
            ...prev,
            [orientation]: null
          }));
        }, 5000);
      }
    });

    if (hasUpdates) {
      onConfigChange({
        ...sourceConfig,
        ...updates,
      });
    }
  }, [artboards, layers, sizes, sourceConfig, onConfigChange, neededOrientations, autoSelectedSources]);

  const toggleLayerRoles = useCallback((sourceId) => {
    setExpandedSources(prev => ({
      ...prev,
      [sourceId]: !prev[sourceId]
    }));
  }, []);

  const handleArtboardChange = useCallback((sourceType, artboardName) => {
    // Auto-detect layer roles when artboard is selected
    let detectedLayers = {};
    let detectedCount = 0;

    if (artboardName) {
      detectedLayers = autoDetectLayerRoles(layers, artboardName);
      detectedCount = countDetectedLayers(detectedLayers);

      // Show feedback message
      if (detectedCount > 0) {
        setDetectionMessages(prev => ({
          ...prev,
          [sourceType]: `Auto-detected ${detectedCount} layer${detectedCount !== 1 ? 's' : ''}`
        }));
        // Clear message after 3 seconds
        setTimeout(() => {
          setDetectionMessages(prev => ({
            ...prev,
            [sourceType]: null
          }));
        }, 3000);
      }
    } else {
      // Clear message when artboard is deselected
      setDetectionMessages(prev => ({
        ...prev,
        [sourceType]: null
      }));
    }

    onConfigChange({
      ...sourceConfig,
      [sourceType]: {
        ...sourceConfig[sourceType],
        artboard: artboardName,
        layers: {
          ...sourceConfig[sourceType]?.layers,
          ...detectedLayers,
        },
      },
    });
  }, [onConfigChange, sourceConfig, layers]);

  const handleSourceChange = useCallback((sourceType, config) => {
    onConfigChange({
      ...sourceConfig,
      [sourceType]: config,
    });
  }, [onConfigChange, sourceConfig]);

  // Count configured layers for a source
  const getConfiguredLayerCount = useCallback((sourceType) => {
    const layerConfig = sourceConfig[sourceType]?.layers || {};
    return Object.values(layerConfig).filter(v => v !== null && v !== '').length;
  }, [sourceConfig]);

  // Filter sources to only show needed orientations
  const visibleSources = useMemo(() => {
    return SOURCE_TYPES.filter(source => neededOrientations.has(source.id));
  }, [neededOrientations]);

  return (
    <div className="source-config-panel">
      <div className="panel-header">
        <sp-label size="l">Source Configuration</sp-label>
        <sp-body size="s" class="panel-description">
          Select source artboards for each orientation. Layer roles auto-detect based on naming.
        </sp-body>
      </div>

      {visibleSources.length === 0 && (
        <div className="empty-state">
          <sp-body size="s">Load sizes to see which orientations are needed.</sp-body>
        </div>
      )}

      {visibleSources.map((source) => {
        const isConfigured = !!sourceConfig[source.id]?.artboard;
        const isExpanded = expandedSources[source.id];
        const configuredLayerCount = getConfiguredLayerCount(source.id);
        const detectionMessage = detectionMessages[source.id];

        // Count sizes that need this orientation
        const sizesNeedingThis = sizes.filter(size => {
          const ratio = size.width / size.height;
          if (source.id === 'portrait') {
            return ratio < ASPECT_RATIO_THRESHOLDS.PORTRAIT_MAX;
          } else if (source.id === 'landscape') {
            return ratio > ASPECT_RATIO_THRESHOLDS.SQUARE_MAX;
          } else { // square
            return ratio >= ASPECT_RATIO_THRESHOLDS.PORTRAIT_MAX &&
                   ratio <= ASPECT_RATIO_THRESHOLDS.SQUARE_MAX;
          }
        });

        return (
          <div
            key={source.id}
            className={`source-section ${isConfigured ? 'source-section-configured' : 'source-section-incomplete'}`}
          >
            <div className="source-header">
              <span className="source-icon">{source.icon}</span>
              <sp-label size="m">{source.label}</sp-label>
              {isConfigured && (
                <span className="source-status-badge source-status-configured">✓</span>
              )}
              {!isConfigured && (
                <span className="source-status-badge source-status-needed">Required</span>
              )}
            </div>

            {/* Inline warning when source is missing */}
            {!isConfigured && sizesNeedingThis.length > 0 && (
              <div className="inline-warning">
                <sp-body size="xs" class="warning-text">
                  ⚠️ {source.label.split(' ')[0]} source needed for {sizesNeedingThis.length} size{sizesNeedingThis.length !== 1 ? 's' : ''}
                  {sizesNeedingThis.length <= 3 && (
                    <span className="size-examples">
                      : {sizesNeedingThis.map(s => s.name).join(', ')}
                    </span>
                  )}
                </sp-body>
              </div>
            )}

            <ArtboardPicker
              sourceId={source.id}
              value={sourceConfig[source.id]?.artboard || ''}
              artboards={artboards}
              onChange={handleArtboardChange}
            />

            {/* Auto-detection feedback */}
            {detectionMessage && (
              <div className="detection-message">
                <span className="detection-icon">✓</span>
                <sp-body size="xs">{detectionMessage}</sp-body>
              </div>
            )}

            {/* Collapsible layer roles */}
            {isConfigured && (
              <div className="layer-roles-section">
                <button
                  className="layer-roles-toggle"
                  onClick={() => toggleLayerRoles(source.id)}
                  type="button"
                >
                  <span className={`toggle-icon ${isExpanded ? 'toggle-icon-expanded' : ''}`}>▶</span>
                  <span className="toggle-label">
                    Layer Roles
                    {configuredLayerCount > 0 && (
                      <span className="layer-count-badge">{configuredLayerCount} assigned</span>
                    )}
                  </span>
                </button>

                {isExpanded && (
                  <LayerRoleSelectors
                    sourceType={source.id}
                    config={sourceConfig[source.id]}
                    layers={layers}
                    onChange={handleSourceChange}
                  />
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default SourceConfigPanel;

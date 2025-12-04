import React, { useCallback, useState, useMemo } from 'react';
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

  const neededOrientations = useMemo(() => getNeededOrientations(sizes), [sizes]);

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

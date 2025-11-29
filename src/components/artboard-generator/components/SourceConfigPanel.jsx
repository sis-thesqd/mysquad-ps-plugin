import React, { useCallback } from 'react';
import ArtboardPicker from './ArtboardPicker';
import LayerRoleSelectors from './LayerRoleSelectors';
import { autoDetectLayerRoles } from '../utils/layerDetection';
import { SOURCE_TYPES } from '../../../config';

/**
 * Source configuration panel for selecting source artboards and layer roles
 * @param {Object} props - Component props
 * @param {Array} props.artboards - Available artboards in the document
 * @param {Array} props.layers - Available layers in the document
 * @param {Object} props.sourceConfig - Current source configuration
 * @param {Function} props.onConfigChange - Callback when configuration changes
 */
const SourceConfigPanel = ({ artboards, layers, sourceConfig, onConfigChange }) => {
  const handleArtboardChange = useCallback((sourceType, artboardName) => {
    // Auto-detect layer roles when artboard is selected
    let detectedLayers = {};
    if (artboardName) {
      detectedLayers = autoDetectLayerRoles(layers, artboardName);
      console.log('Auto-detected layers for', artboardName, ':', detectedLayers);
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

  return (
    <div className="source-config-panel">
      <div className="panel-header">
        <sp-label size="l">Source Configuration</sp-label>
        <sp-body size="s" class="panel-description">
          Configure the source artboards and assign layer roles for automatic scaling.
        </sp-body>
      </div>

      {SOURCE_TYPES.map((source) => (
        <div key={source.id} className="source-section">
          <div className="source-header">
            <span className="source-icon">{source.icon}</span>
            <sp-label size="m">{source.label}</sp-label>
          </div>

          <ArtboardPicker
            sourceId={source.id}
            value={sourceConfig[source.id]?.artboard || ''}
            artboards={artboards}
            onChange={handleArtboardChange}
          />

          {sourceConfig[source.id]?.artboard && (
            <LayerRoleSelectors
              sourceType={source.id}
              config={sourceConfig[source.id]}
              layers={layers}
              onChange={handleSourceChange}
            />
          )}
        </div>
      ))}
    </div>
  );
};

export default SourceConfigPanel;

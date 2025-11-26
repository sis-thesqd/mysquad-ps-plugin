import React, { useMemo, useRef, useEffect, useCallback } from 'react';

/**
 * Layer name patterns for auto-detection
 * Each role has an array of patterns (case-insensitive) to match against layer names
 */
const LAYER_NAME_PATTERNS = {
  background: ['bkg', 'background', 'bg', 'back'],
  title: ['text', 'title', 'headline', 'heading', 'copy', 'txt', 'main'],
  overlays: ['adjust', 'overlay', 'overlays', 'effects', 'gradient', 'vignette'],
  cornerTopLeft: ['corner-tl', 'corner_tl', 'top-left', 'top_left', 'tl', 'logo-tl'],
  cornerTopRight: ['corner-tr', 'corner_tr', 'top-right', 'top_right', 'tr', 'logo-tr', 'logo'],
  cornerBottomLeft: ['corner-bl', 'corner_bl', 'bottom-left', 'bottom_left', 'bl', 'logo-bl'],
  cornerBottomRight: ['corner-br', 'corner_br', 'bottom-right', 'bottom_right', 'br', 'logo-br', 'cta', 'button'],
};

/**
 * Auto-detect layer roles based on layer names
 * @param {Array} layers - Available layers
 * @param {string} artboardName - Current artboard name to filter layers
 * @returns {Object} Detected layer roles { roleId: layerName }
 */
const autoDetectLayerRoles = (layers, artboardName) => {
  const detectedRoles = {};
  
  // Filter layers for this artboard
  const artboardLayers = layers.filter(
    (l) => l.artboardName === artboardName || l.artboardId === null
  );
  
  // For each role, find the best matching layer
  Object.entries(LAYER_NAME_PATTERNS).forEach(([roleId, patterns]) => {
    for (const layer of artboardLayers) {
      const layerNameLower = layer.name.toLowerCase();
      const fullPathLower = (layer.fullPath || layer.name).toLowerCase();
      
      // Check if any pattern matches
      const matches = patterns.some((pattern) => 
        layerNameLower.includes(pattern) || fullPathLower.includes(pattern)
      );
      
      if (matches) {
        detectedRoles[roleId] = layer.name;
        break; // Use first match for this role
      }
    }
  });
  
  return detectedRoles;
};

/**
 * Single layer role picker with proper event handling
 */
const LayerRolePicker = ({ role, value, layerOptions, onChange }) => {
  const pickerRef = useRef(null);

  // Set up change listener
  useEffect(() => {
    const picker = pickerRef.current;
    if (picker) {
      const handleChange = (e) => {
        onChange(role.id, e.target.value);
      };
      picker.addEventListener('change', handleChange);
      return () => picker.removeEventListener('change', handleChange);
    }
  }, [role.id, onChange]);

  // Display text for the picker
  const displayText = value || 'None';

  return (
    <div className="form-field form-field-inline">
      <sp-field-label size="s">{role.label}</sp-field-label>
      <div className="picker-wrapper">
        <span className="picker-value">{displayText}</span>
        <sp-picker ref={pickerRef} size="s">
          <sp-menu slot="options">
            <sp-menu-item value="">None</sp-menu-item>
            {layerOptions.map((layer) => (
              <sp-menu-item key={layer.id} value={layer.name}>
                {layer.fullPath || layer.name}
              </sp-menu-item>
            ))}
          </sp-menu>
        </sp-picker>
      </div>
    </div>
  );
};

/**
 * Layer role configuration for a single source artboard
 */
const LayerRoleSelectors = ({ sourceType, config, layers, onChange }) => {
  const layerOptions = useMemo(() => {
    const artboardLayers = layers.filter(
      (l) => l.artboardName === config.artboard || l.artboardId === null
    );
    return artboardLayers;
  }, [layers, config.artboard]);

  const handleLayerChange = useCallback((roleId, value) => {
    onChange(sourceType, {
      ...config,
      layers: {
        ...config.layers,
        [roleId]: value || null,
      },
    });
  }, [onChange, sourceType, config]);

  const roles = [
    { id: 'background', label: 'Background', required: false },
    { id: 'title', label: 'Title / Main Content', required: false },
    { id: 'overlays', label: 'Overlays', required: false },
    { id: 'cornerTopLeft', label: 'Corner: Top Left', required: false },
    { id: 'cornerTopRight', label: 'Corner: Top Right', required: false },
    { id: 'cornerBottomLeft', label: 'Corner: Bottom Left', required: false },
    { id: 'cornerBottomRight', label: 'Corner: Bottom Right', required: false },
  ];

  return (
    <div className="layer-roles">
      {roles.map((role) => (
        <LayerRolePicker
          key={role.id}
          role={role}
          value={config.layers?.[role.id] || ''}
          layerOptions={layerOptions}
          onChange={handleLayerChange}
        />
      ))}
    </div>
  );
};

/**
 * Artboard picker with proper event handling
 */
const ArtboardPicker = ({ sourceId, value, artboards, onChange }) => {
  const pickerRef = useRef(null);

  // Set up change listener
  useEffect(() => {
    const picker = pickerRef.current;
    if (picker) {
      const handleChange = (e) => {
        onChange(sourceId, e.target.value);
      };
      picker.addEventListener('change', handleChange);
      return () => picker.removeEventListener('change', handleChange);
    }
  }, [sourceId, onChange]);

  // Find display text
  const selectedArtboard = artboards.find((ab) => ab.name === value);
  const displayText = selectedArtboard 
    ? `${selectedArtboard.name} (${selectedArtboard.bounds?.width}×${selectedArtboard.bounds?.height})`
    : 'Select artboard...';

  return (
    <div className="form-field">
      <sp-field-label size="s">Source Artboard</sp-field-label>
      <div className="picker-wrapper">
        <span className="picker-value">{displayText}</span>
        <sp-picker ref={pickerRef} size="s">
          <sp-menu slot="options">
            <sp-menu-item value="">Select artboard...</sp-menu-item>
            {artboards.map((ab) => (
              <sp-menu-item key={ab.id} value={ab.name}>
                {ab.name} ({ab.bounds?.width}×{ab.bounds?.height})
              </sp-menu-item>
            ))}
          </sp-menu>
        </sp-picker>
      </div>
    </div>
  );
};

/**
 * Source configuration panel for selecting source artboards and layer roles
 */
const SourceConfigPanel = ({ artboards, layers, sourceConfig, onConfigChange }) => {
  const sourceTypes = [
    { id: 'landscape', label: 'Landscape (16:9)', icon: '▭' },
    { id: 'portrait', label: 'Portrait (9:16)', icon: '▯' },
    { id: 'square', label: 'Square (1:1)', icon: '□' },
  ];

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
          ...detectedLayers, // Merge detected layers (won't overwrite manually set ones if we preserve existing)
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

      {sourceTypes.map((source) => (
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


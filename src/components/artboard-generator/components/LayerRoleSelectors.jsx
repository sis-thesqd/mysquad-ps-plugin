import React, { useMemo, useCallback } from 'react';
import LayerRolePicker from './LayerRolePicker';
import { LAYER_ROLES } from '../../../config';

/**
 * Layer role configuration for a single source artboard
 * @param {Object} props - Component props
 * @param {string} props.sourceType - Source type identifier (landscape, portrait, square)
 * @param {Object} props.config - Current configuration for this source
 * @param {Array} props.layers - Available layers
 * @param {Function} props.onChange - Callback when configuration changes
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

  return (
    <div className="layer-roles">
      {LAYER_ROLES.map((role) => (
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

export default LayerRoleSelectors;

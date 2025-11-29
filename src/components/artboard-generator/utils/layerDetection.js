import { LAYER_NAME_PATTERNS } from '../../../config';

/**
 * Auto-detect layer roles based on layer names
 * @param {Array} layers - Available layers
 * @param {string} artboardName - Current artboard name to filter layers
 * @returns {Object} Detected layer roles { roleId: layerName }
 */
export const autoDetectLayerRoles = (layers, artboardName) => {
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

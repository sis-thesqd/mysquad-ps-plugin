/**
 * Core artboard generation service using Photoshop batchPlay
 */
import { logActivity, ACTIVITY_TYPES } from '../../../lib';

// Photoshop APIs are loaded lazily to avoid errors during module initialization
const getPhotoshop = () => require('photoshop');
const getApp = () => getPhotoshop().app;
const getCore = () => getPhotoshop().core;
const getBatchPlay = () => getPhotoshop().action.batchPlay;

// ============================================================================
// Constants
// ============================================================================

const ASPECT_RATIO_THRESHOLDS = {
  PORTRAIT_MAX: 0.85,
  SQUARE_MAX: 1.15,
};

export const LAYER_ROLES = {
  BACKGROUND: 'background',
  TITLE: 'title',
  OVERLAYS: 'overlays',
  CORNER_TOP_LEFT: 'cornerTopLeft',
  CORNER_TOP_RIGHT: 'cornerTopRight',
  CORNER_BOTTOM_LEFT: 'cornerBottomLeft',
  CORNER_BOTTOM_RIGHT: 'cornerBottomRight',
};

export const DEFAULT_PRINT_SETTINGS = {
  bleed: 0.125,
  bleedUnit: 'inches',
  cropMarkLength: 0.25,
  cropMarkWeight: 1,
  cropMarkColor: { r: 0, g: 0, b: 0 },
  cropMarkOffset: 0.0625,
};

export const DEFAULT_LAYOUT_OPTIONS = {
  columns: 4,
  gap: 100,
  groupGap: 300,
  startX: 2500,
  startY: 0,
  typeOrder: ['social', 'display', 'video', 'email', 'print', 'web', 'other'],
};

// ============================================================================
// Unit Conversion
// ============================================================================

/**
 * Convert units to pixels
 * @param {number} value - The value to convert
 * @param {string} unit - Unit type: inches, mm, pixels
 * @param {number} resolution - Document PPI (default 300)
 * @returns {number} Value in pixels
 */
export const unitsToPixels = (value, unit, resolution = 300) => {
  switch (unit) {
    case 'inches':
      return value * resolution;
    case 'mm':
      return (value / 25.4) * resolution;
    case 'pixels':
    default:
      return value;
  }
};

// ============================================================================
// Scaling Calculations
// ============================================================================

/**
 * Calculate scale factor for cover mode (fill entire target)
 * @param {Object} source - Source dimensions { width, height }
 * @param {Object} target - Target dimensions { width, height }
 * @returns {number} Scale factor
 */
export const calculateCoverScale = (source, target) => {
  const widthScale = target.width / source.width;
  const heightScale = target.height / source.height;
  return Math.max(widthScale, heightScale);
};

/**
 * Calculate scale factor for contain mode (fit inside target)
 * @param {Object} source - Source dimensions { width, height }
 * @param {Object} target - Target dimensions { width, height }
 * @returns {number} Scale factor
 */
export const calculateContainScale = (source, target) => {
  const widthScale = target.width / source.width;
  const heightScale = target.height / source.height;
  return Math.min(widthScale, heightScale);
};

/**
 * Calculate scale factor for relative mode (diagonal ratio)
 * @param {Object} source - Source dimensions { width, height }
 * @param {Object} target - Target dimensions { width, height }
 * @returns {number} Scale factor
 */
export const calculateRelativeScale = (source, target) => {
  const sourceDiagonal = Math.sqrt(source.width ** 2 + source.height ** 2);
  const targetDiagonal = Math.sqrt(target.width ** 2 + target.height ** 2);
  return targetDiagonal / sourceDiagonal;
};

/**
 * Determine which source to use based on aspect ratio
 * @param {number} aspectRatio - Target aspect ratio (width/height)
 * @returns {string} Source type: landscape, portrait, or square
 */
export const determineSourceType = (aspectRatio) => {
  if (aspectRatio < ASPECT_RATIO_THRESHOLDS.PORTRAIT_MAX) {
    return 'portrait';
  } else if (aspectRatio > ASPECT_RATIO_THRESHOLDS.SQUARE_MAX) {
    return 'landscape';
  }
  return 'square';
};

// ============================================================================
// Position Calculations
// ============================================================================

/**
 * Get relative position as percentage of artboard
 * @param {Object} position - Layer position { x, y }
 * @param {Object} artboardSize - Artboard dimensions { width, height }
 * @returns {Object} Percentage position { xPercent, yPercent }
 */
export const getRelativePosition = (position, artboardSize) => ({
  xPercent: position.x / artboardSize.width,
  yPercent: position.y / artboardSize.height,
});

/**
 * Calculate position for anchor-based placement
 * @param {string} anchor - Anchor point (center, top-left, etc.)
 * @param {Object} layerSize - Layer dimensions { width, height }
 * @param {Object} targetSize - Target artboard dimensions { width, height }
 * @param {Object} relativePosition - Percentage position for corner elements
 * @returns {Object} Final position { x, y }
 */
export const calculatePosition = (anchor, layerSize, targetSize, relativePosition = null) => {
  switch (anchor) {
    case 'center':
      return {
        x: (targetSize.width - layerSize.width) / 2,
        y: (targetSize.height - layerSize.height) / 2,
      };
    case 'top-left':
      return {
        x: relativePosition ? relativePosition.xPercent * targetSize.width : 0,
        y: relativePosition ? relativePosition.yPercent * targetSize.height : 0,
      };
    case 'top-right':
      return {
        x: targetSize.width - layerSize.width - (relativePosition ? relativePosition.xPercent * targetSize.width : 0),
        y: relativePosition ? relativePosition.yPercent * targetSize.height : 0,
      };
    case 'bottom-left':
      return {
        x: relativePosition ? relativePosition.xPercent * targetSize.width : 0,
        y: targetSize.height - layerSize.height - (relativePosition ? relativePosition.yPercent * targetSize.height : 0),
      };
    case 'bottom-right':
      return {
        x: targetSize.width - layerSize.width - (relativePosition ? relativePosition.xPercent * targetSize.width : 0),
        y: targetSize.height - layerSize.height - (relativePosition ? relativePosition.yPercent * targetSize.height : 0),
      };
    default:
      return { x: 0, y: 0 };
  }
};

// ============================================================================
// Layer Role Configuration
// ============================================================================

/**
 * Get scale mode and anchor for a layer role
 * @param {string} role - Layer role
 * @returns {Object} { scaleMode, anchor }
 */
export const getLayerRoleConfig = (role) => {
  const configs = {
    [LAYER_ROLES.BACKGROUND]: { scaleMode: 'cover', anchor: 'center' },
    [LAYER_ROLES.TITLE]: { scaleMode: 'contain', anchor: 'center' },
    [LAYER_ROLES.OVERLAYS]: { scaleMode: 'cover', anchor: 'center' },
    [LAYER_ROLES.CORNER_TOP_LEFT]: { scaleMode: 'relative', anchor: 'top-left' },
    [LAYER_ROLES.CORNER_TOP_RIGHT]: { scaleMode: 'relative', anchor: 'top-right' },
    [LAYER_ROLES.CORNER_BOTTOM_LEFT]: { scaleMode: 'relative', anchor: 'bottom-left' },
    [LAYER_ROLES.CORNER_BOTTOM_RIGHT]: { scaleMode: 'relative', anchor: 'bottom-right' },
  };
  return configs[role] || { scaleMode: 'contain', anchor: 'center' };
};

// ============================================================================
// Grid Layout Calculations
// ============================================================================

/**
 * Group sizes by type category
 * @param {Array} sizes - Array of size configurations
 * @param {Array} typeOrder - Order of type categories
 * @returns {Object} Sizes grouped by type
 */
export const groupByType = (sizes, typeOrder = DEFAULT_LAYOUT_OPTIONS.typeOrder) => {
  const groups = {};
  
  // Initialize groups in order
  typeOrder.forEach((type) => {
    groups[type] = [];
  });
  
  // Sort sizes into groups
  sizes.forEach((size) => {
    const type = size.type || 'other';
    if (!groups[type]) {
      groups[type] = [];
    }
    groups[type].push(size);
  });
  
  // Sort each group by aspect ratio (landscape first)
  Object.keys(groups).forEach((type) => {
    groups[type].sort((a, b) => {
      const ratioA = a.width / a.height;
      const ratioB = b.width / b.height;
      return ratioB - ratioA; // Descending (landscape first)
    });
  });
  
  return groups;
};

/**
 * Get all existing artboards from the document with their bounds
 * @returns {Promise<Array>} Array of artboard bounds { name, left, top, right, bottom }
 */
export const getExistingArtboardBounds = async () => {
  console.log('[getExistingArtboardBounds] Scanning document for existing artboards...');
  const app = getApp();
  const batchPlay = getBatchPlay();
  const doc = app.activeDocument;
  
  if (!doc) {
    console.log('[getExistingArtboardBounds] No active document');
    return [];
  }
  
  const artboardBounds = [];
  
  for (const layer of doc.layers) {
    try {
      const result = await batchPlay([
        {
          _obj: 'get',
          _target: [{ _ref: 'layer', _id: layer.id }],
          _options: { dialogOptions: 'dontDisplay' },
        },
      ], { synchronousExecution: false });
      
      const layerDesc = result[0];
      if (layerDesc?.artboardEnabled === true) {
        const rect = layerDesc?.artboard?.artboardRect;
        if (rect) {
          const bounds = {
            name: layer.name,
            id: layer.id,
            left: rect.left,
            top: rect.top,
            right: rect.right,
            bottom: rect.bottom,
            width: rect.right - rect.left,
            height: rect.bottom - rect.top,
          };
          artboardBounds.push(bounds);
          console.log(`[getExistingArtboardBounds] Found artboard "${layer.name}":`, bounds);
        }
      }
    } catch (e) {
      console.warn('[getExistingArtboardBounds] Error checking artboard:', e);
    }
  }
  
  console.log(`[getExistingArtboardBounds] Found ${artboardBounds.length} existing artboards`);
  return artboardBounds;
};

/**
 * Find the best position for a new artboard based on existing artboards
 * Places new artboard to the right of all existing artboards
 * @param {number} width - Width of new artboard
 * @param {number} height - Height of new artboard
 * @param {number} gap - Gap between artboards
 * @returns {Promise<Object>} Position { x, y }
 */
export const findNextArtboardPosition = async (width, height, gap = DEFAULT_LAYOUT_OPTIONS.gap) => {
  console.log(`[findNextArtboardPosition] Finding position for artboard ${width}x${height}, gap: ${gap}`);
  const existingArtboards = await getExistingArtboardBounds();
  
  if (existingArtboards.length === 0) {
    // No existing artboards, use default start position
    const defaultPos = { x: DEFAULT_LAYOUT_OPTIONS.startX, y: DEFAULT_LAYOUT_OPTIONS.startY };
    console.log('[findNextArtboardPosition] No existing artboards, using default position:', defaultPos);
    return defaultPos;
  }
  
  // Find the rightmost edge of all artboards
  let maxRight = -Infinity;
  let alignY = Infinity;
  
  for (const ab of existingArtboards) {
    if (ab.right > maxRight) {
      maxRight = ab.right;
    }
    if (ab.top < alignY) {
      alignY = ab.top;
    }
  }
  
  // Place new artboard to the right with gap, aligned to the top of existing artboards
  const position = {
    x: maxRight + gap,
    y: alignY,
  };
  
  console.log(`[findNextArtboardPosition] Calculated position: x=${position.x}, y=${position.y} (maxRight: ${maxRight}, alignY: ${alignY})`);
  return position;
};

/**
 * Calculate grid positions for artboards
 * @param {Array} sizes - Array of size configurations
 * @param {Object} options - Layout options
 * @returns {Array} Sizes with calculated positions
 */
export const calculateGridPositions = (sizes, options = {}) => {
  const opts = { ...DEFAULT_LAYOUT_OPTIONS, ...options };
  const grouped = groupByType(sizes, opts.typeOrder);
  const positions = [];
  
  let currentY = opts.startY;
  
  opts.typeOrder.forEach((type) => {
    const group = grouped[type];
    if (!group || group.length === 0) return;
    
    let currentX = opts.startX;
    let rowHeight = 0;
    let column = 0;
    
    group.forEach((size) => {
      // Calculate actual artboard size (including bleed for print)
      let actualWidth = size.width;
      let actualHeight = size.height;
      
      if (size.requiresBleed && size.bleed) {
        const bleedPx = unitsToPixels(size.bleed, size.bleedUnit || 'inches');
        actualWidth += bleedPx * 2;
        actualHeight += bleedPx * 2;
      }
      
      // Check if we need to wrap to next row
      if (column >= opts.columns) {
        currentX = opts.startX;
        currentY += rowHeight + opts.gap;
        rowHeight = 0;
        column = 0;
      }
      
      positions.push({
        ...size,
        position: { x: currentX, y: currentY },
        actualWidth,
        actualHeight,
      });
      
      currentX += actualWidth + opts.gap;
      rowHeight = Math.max(rowHeight, actualHeight);
      column++;
    });
    
    // Add group gap after each type
    currentY += rowHeight + opts.groupGap;
  });
  
  return positions;
};

// ============================================================================
// Photoshop Operations (batchPlay)
// ============================================================================

/**
 * Create an artboard via batchPlay
 * @param {string} name - Artboard name
 * @param {Object} bounds - Artboard bounds { x, y, width, height }
 * @returns {Promise<Object>} Created artboard info
 */
export const createArtboard = async (name, bounds) => {
  console.log(`[createArtboard] Creating artboard "${name}" at position:`, bounds);
  const batchPlay = getBatchPlay();
  const app = getApp();
  
  // Create the artboard
  const result = await batchPlay([
    {
      _obj: 'make',
      _target: [{ _ref: 'artboardSection' }],
      layerSectionStart: 145,
      layerSectionEnd: 146,
      name: name,
      artboardRect: {
        _obj: 'classFloatRect',
        top: bounds.y,
        left: bounds.x,
        bottom: bounds.y + bounds.height,
        right: bounds.x + bounds.width,
      },
      _options: { dialogOptions: 'dontDisplay' },
    },
  ], { synchronousExecution: true });
  
  console.log(`[createArtboard] Artboard created, result:`, result);
  
  // Get the newly created artboard (should be the active layer) and rename it explicitly
  const doc = app.activeDocument;
  const activeLayer = doc.activeLayers[0];
  
  if (activeLayer) {
    console.log(`[createArtboard] Active layer after creation: "${activeLayer.name}" (id: ${activeLayer.id})`);
    
    // If the name doesn't match, rename it
    if (activeLayer.name !== name) {
      console.log(`[createArtboard] Renaming artboard from "${activeLayer.name}" to "${name}"`);
      await batchPlay([
        {
          _obj: 'set',
          _target: [{ _ref: 'layer', _enum: 'ordinal', _value: 'targetEnum' }],
          to: {
            _obj: 'layer',
            name: name,
          },
          _options: { dialogOptions: 'dontDisplay' },
        },
      ], { synchronousExecution: true });
      console.log(`[createArtboard] Artboard renamed to "${name}"`);
    }
  }
  
  console.log(`[createArtboard] ✓ Artboard "${name}" created successfully`);
  return result;
};

/**
 * Duplicate a layer to a target artboard
 * @param {number} sourceLayerId - Source layer ID
 * @param {number} targetArtboardId - Target artboard ID
 * @returns {Promise<Object>} Duplicated layer info
 */
export const duplicateLayerToArtboard = async (sourceLayerId, targetArtboardId) => {
  const batchPlay = getBatchPlay();
  const result = await batchPlay([
    {
      _obj: 'duplicate',
      _target: [{ _ref: 'layer', _id: sourceLayerId }],
      to: { _ref: 'layer', _id: targetArtboardId },
      _options: { dialogOptions: 'dontDisplay' },
    },
  ], { synchronousExecution: true });
  
  return result;
};

/**
 * Scale a layer uniformly
 * @param {number} layerId - Layer ID
 * @param {number} scale - Scale factor (1 = 100%)
 * @returns {Promise<Object>} Result
 */
export const scaleLayer = async (layerId, scale) => {
  const batchPlay = getBatchPlay();
  const scalePercent = scale * 100;
  
  const result = await batchPlay([
    {
      _obj: 'select',
      _target: [{ _ref: 'layer', _id: layerId }],
      _options: { dialogOptions: 'dontDisplay' },
    },
    {
      _obj: 'transform',
      freeTransformCenterState: { _enum: 'quadCenterState', _value: 'QCSAverage' },
      width: { _unit: 'percentUnit', _value: scalePercent },
      height: { _unit: 'percentUnit', _value: scalePercent },
      linked: true,
      _options: { dialogOptions: 'dontDisplay' },
    },
  ], { synchronousExecution: true });
  
  return result;
};

/**
 * Move a layer to a specific position
 * @param {number} layerId - Layer ID
 * @param {Object} position - Target position { x, y }
 * @returns {Promise<Object>} Result
 */
export const moveLayer = async (layerId, position) => {
  const app = getApp();
  const batchPlay = getBatchPlay();
  // First get current layer bounds
  const doc = app.activeDocument;
  const layer = doc.layers.find((l) => l.id === layerId);
  
  if (!layer || !layer.bounds) {
    throw new Error(`Layer ${layerId} not found or has no bounds`);
  }
  
  const currentX = layer.bounds.left;
  const currentY = layer.bounds.top;
  const deltaX = position.x - currentX;
  const deltaY = position.y - currentY;
  
  const result = await batchPlay([
    {
      _obj: 'select',
      _target: [{ _ref: 'layer', _id: layerId }],
      _options: { dialogOptions: 'dontDisplay' },
    },
    {
      _obj: 'move',
      _target: [{ _ref: 'layer', _enum: 'ordinal', _value: 'targetEnum' }],
      to: {
        _obj: 'offset',
        horizontal: { _unit: 'pixelsUnit', _value: deltaX },
        vertical: { _unit: 'pixelsUnit', _value: deltaY },
      },
      _options: { dialogOptions: 'dontDisplay' },
    },
  ], { synchronousExecution: true });
  
  return result;
};

/**
 * Create a layer group
 * @param {string} name - Group name
 * @returns {Promise<Object>} Created group info
 */
export const createLayerGroup = async (name) => {
  const batchPlay = getBatchPlay();
  const result = await batchPlay([
    {
      _obj: 'make',
      _target: [{ _ref: 'layerSection' }],
      from: { _ref: 'layer', _enum: 'ordinal', _value: 'targetEnum' },
      name: name,
      _options: { dialogOptions: 'dontDisplay' },
    },
  ], { synchronousExecution: true });
  
  return result;
};

/**
 * Get the layer index of a layer by its ID
 * @param {number} layerId - Layer ID
 * @returns {Promise<number>} Layer index
 */
const getLayerIndex = async (layerId) => {
  const batchPlay = getBatchPlay();
  const result = await batchPlay([
    {
      _obj: 'get',
      _target: [{ _ref: 'layer', _id: layerId }],
      _options: { dialogOptions: 'dontDisplay' },
    },
  ], { synchronousExecution: false });
  
  return result[0]?.itemIndex;
};

/**
 * Collect all layer IDs recursively from a layer (including nested layers in groups)
 * @param {Object} layer - Layer object
 * @returns {Array<number>} Array of layer IDs
 */
const collectAllLayerIds = (layer) => {
  const ids = [layer.id];
  if (layer.layers && layer.layers.length > 0) {
    for (const child of layer.layers) {
      ids.push(...collectAllLayerIds(child));
    }
  }
  return ids;
};

/**
 * Duplicate all layers from source artboard to target artboard
 * Uses move with duplicate:true for proper placement
 * @param {number} sourceArtboardId - Source artboard layer ID
 * @param {number} targetArtboardId - Target artboard layer ID
 * @returns {Promise<Array>} Array of duplicated layer IDs
 */
export const duplicateArtboardContents = async (sourceArtboardId, targetArtboardId) => {
  console.log(`[duplicateArtboardContents] Duplicating from artboard ${sourceArtboardId} to ${targetArtboardId}`);
  const app = getApp();
  const batchPlay = getBatchPlay();
  const doc = app.activeDocument;
  
  // Find the source and target artboards
  const sourceArtboard = doc.layers.find((l) => l.id === sourceArtboardId);
  const targetArtboard = doc.layers.find((l) => l.id === targetArtboardId);
  
  if (!sourceArtboard || !sourceArtboard.layers) {
    console.warn('[duplicateArtboardContents] Source artboard not found or has no layers');
    return [];
  }
  
  if (!targetArtboard) {
    console.warn('[duplicateArtboardContents] Target artboard not found');
    return [];
  }
  
  console.log(`[duplicateArtboardContents] Source artboard "${sourceArtboard.name}" has ${sourceArtboard.layers.length} top-level items`);
  console.log(`[duplicateArtboardContents] Target artboard "${targetArtboard.name}" (id: ${targetArtboard.id})`);
  
  // Get the target artboard's layer index
  const targetIndex = await getLayerIndex(targetArtboardId);
  console.log(`[duplicateArtboardContents] Target artboard index: ${targetIndex}`);
  
  // Get all top-level items from source artboard
  const topLevelItems = [...sourceArtboard.layers];
  console.log(`[duplicateArtboardContents] Top-level items to duplicate:`, topLevelItems.map((l) => `${l.name} (${l.kind || 'layer'})`));
  
  if (topLevelItems.length === 0) {
    console.warn('[duplicateArtboardContents] No child layers to duplicate');
    return [];
  }
  
  // Collect ALL layer IDs (including nested) for selection
  let allLayerIds = [];
  for (const item of topLevelItems) {
    allLayerIds.push(...collectAllLayerIds(item));
  }
  
  console.log(`[duplicateArtboardContents] Total layers to duplicate (including nested): ${allLayerIds.length}`);
  
  try {
    // Step 1: Select all layers from source artboard
    // First select the first layer
    await batchPlay([
      {
        _obj: 'select',
        _target: [{ _ref: 'layer', _id: topLevelItems[0].id }],
        makeVisible: false,
        _options: { dialogOptions: 'dontDisplay' },
      },
    ], { synchronousExecution: true });
    
    // Then add remaining top-level items to selection (with continuous to include children)
    if (topLevelItems.length > 1) {
      const lastItem = topLevelItems[topLevelItems.length - 1];
      await batchPlay([
        {
          _obj: 'select',
          _target: [{ _ref: 'layer', _id: lastItem.id }],
          layerID: allLayerIds,
          makeVisible: false,
          selectionModifier: {
            _enum: 'selectionModifierType',
            _value: 'addToSelectionContinuous',
          },
          _options: { dialogOptions: 'dontDisplay' },
        },
      ], { synchronousExecution: true });
    }
    
    console.log(`[duplicateArtboardContents] Selected ${doc.activeLayers.length} layers`);
    
    // Step 2: Move with duplicate:true to copy layers into target artboard
    console.log(`[duplicateArtboardContents] Moving (duplicate) to target artboard index ${targetIndex}...`);
    
    await batchPlay([
      {
        _obj: 'move',
        _target: [{ _ref: 'layer', _enum: 'ordinal', _value: 'targetEnum' }],
        adjustment: false,
        duplicate: true,
        to: { _ref: 'layer', _index: targetIndex },
        version: 5,
        _options: { dialogOptions: 'dontDisplay' },
      },
    ], { synchronousExecution: true });
    
    // Get the duplicated layers (should be selected now)
    const duplicatedLayers = [...doc.activeLayers];
    const duplicatedIds = duplicatedLayers.map((l) => l.id);
    
    console.log(`[duplicateArtboardContents] ✓ Duplicated ${duplicatedIds.length} layers:`, duplicatedLayers.map((l) => l.name));
    
    return duplicatedIds;
  } catch (e) {
    console.error(`[duplicateArtboardContents] Error during duplication:`, e);
    return [];
  }
};

/**
 * Scale and center duplicated content on the target artboard
 * @param {Array} layerIds - IDs of layers to transform
 * @param {Object} sourceBounds - Source artboard bounds { x, y, width, height }
 * @param {Object} targetBounds - Target artboard bounds { x, y, width, height }
 * @returns {Promise<void>}
 */
export const transformDuplicatedContent = async (layerIds, sourceBounds, targetBounds) => {
  console.log(`[transformDuplicatedContent] Transforming ${layerIds.length} layers`);
  console.log('[transformDuplicatedContent] Source bounds:', sourceBounds);
  console.log('[transformDuplicatedContent] Target bounds:', targetBounds);
  
  const app = getApp();
  const batchPlay = getBatchPlay();
  const doc = app.activeDocument;
  
  if (layerIds.length === 0) {
    console.log('[transformDuplicatedContent] No layers to transform');
    return;
  }
  
  // Calculate scale factor using cover mode (fill the target)
  const scale = calculateCoverScale(
    { width: sourceBounds.width, height: sourceBounds.height },
    { width: targetBounds.width, height: targetBounds.height }
  );
  const scalePercent = scale * 100;
  
  console.log(`[transformDuplicatedContent] Scale factor: ${scale} (${scalePercent}%)`);
  
  // Target artboard center
  const targetCenterX = targetBounds.x + targetBounds.width / 2;
  const targetCenterY = targetBounds.y + targetBounds.height / 2;
  
  console.log(`[transformDuplicatedContent] Target artboard center: ${targetCenterX}, ${targetCenterY}`);
  
  // Select all duplicated layers
  const selectTargets = layerIds.map((id) => ({ _ref: 'layer', _id: id }));
  
  try {
    // Select all layers
    await batchPlay([
      {
        _obj: 'select',
        _target: selectTargets,
        makeVisible: false,
        _options: { dialogOptions: 'dontDisplay' },
      },
    ], { synchronousExecution: true });
    
    const selectedLayers = doc.activeLayers;
    console.log(`[transformDuplicatedContent] Selected ${selectedLayers.length} layers`);
    
    if (selectedLayers.length === 0) {
      console.log('[transformDuplicatedContent] No layers selected');
      return;
    }
    
    // Get current content bounds
    let minLeft = Infinity, minTop = Infinity;
    let maxRight = -Infinity, maxBottom = -Infinity;
    
    for (const layer of selectedLayers) {
      if (layer.bounds) {
        minLeft = Math.min(minLeft, layer.bounds.left);
        minTop = Math.min(minTop, layer.bounds.top);
        maxRight = Math.max(maxRight, layer.bounds.right);
        maxBottom = Math.max(maxBottom, layer.bounds.bottom);
      }
    }
    
    const contentCenterX = minLeft + (maxRight - minLeft) / 2;
    const contentCenterY = minTop + (maxBottom - minTop) / 2;
    
    console.log(`[transformDuplicatedContent] Current content bounds: ${minLeft},${minTop} to ${maxRight},${maxBottom}`);
    console.log(`[transformDuplicatedContent] Current content center: ${contentCenterX}, ${contentCenterY}`);
    
    // Step 1: Scale the content around its current center
    console.log(`[transformDuplicatedContent] Step 1: Scaling content by ${scalePercent}%...`);
    
    await batchPlay([
      {
        _obj: 'transform',
        freeTransformCenterState: { _enum: 'quadCenterState', _value: 'QCSAverage' },
        width: { _unit: 'percentUnit', _value: scalePercent },
        height: { _unit: 'percentUnit', _value: scalePercent },
        linked: true,
        interfaceIconFrameDimmed: { _enum: 'interpolationType', _value: 'bicubic' },
        _options: { dialogOptions: 'dontDisplay' },
      },
    ], { synchronousExecution: true });
    
    // Step 2: Get new bounds after scaling and center on target artboard
    let newMinLeft = Infinity, newMinTop = Infinity;
    let newMaxRight = -Infinity, newMaxBottom = -Infinity;
    
    for (const layer of doc.activeLayers) {
      if (layer.bounds) {
        newMinLeft = Math.min(newMinLeft, layer.bounds.left);
        newMinTop = Math.min(newMinTop, layer.bounds.top);
        newMaxRight = Math.max(newMaxRight, layer.bounds.right);
        newMaxBottom = Math.max(newMaxBottom, layer.bounds.bottom);
      }
    }
    
    const newCenterX = newMinLeft + (newMaxRight - newMinLeft) / 2;
    const newCenterY = newMinTop + (newMaxBottom - newMinTop) / 2;
    
    console.log(`[transformDuplicatedContent] After scale - content center: ${newCenterX}, ${newCenterY}`);
    
    // Calculate offset to center on target artboard
    const moveX = targetCenterX - newCenterX;
    const moveY = targetCenterY - newCenterY;
    
    console.log(`[transformDuplicatedContent] Step 2: Moving to center - offset: ${moveX}, ${moveY}`);
    
    await batchPlay([
      {
        _obj: 'move',
        _target: [{ _ref: 'layer', _enum: 'ordinal', _value: 'targetEnum' }],
        to: {
          _obj: 'offset',
          horizontal: { _unit: 'pixelsUnit', _value: moveX },
          vertical: { _unit: 'pixelsUnit', _value: moveY },
        },
        _options: { dialogOptions: 'dontDisplay' },
      },
    ], { synchronousExecution: true });
    
    console.log('[transformDuplicatedContent] ✓ Transform complete - content scaled and centered on target artboard');
  } catch (e) {
    console.error('[transformDuplicatedContent] Error transforming duplicated content:', e);
  }
};

/**
 * Draw a crop mark line
 * @param {Object} start - Start point { x, y }
 * @param {Object} end - End point { x, y }
 * @param {number} weight - Line weight in pixels
 * @param {Object} color - Line color { r, g, b }
 * @returns {Promise<Object>} Result
 */
export const drawCropMarkLine = async (start, end, weight, color) => {
  const batchPlay = getBatchPlay();
  const result = await batchPlay([
    {
      _obj: 'make',
      _target: [{ _ref: 'contentLayer' }],
      using: {
        _obj: 'contentLayer',
        type: {
          _obj: 'solidColorLayer',
          color: {
            _obj: 'RGBColor',
            red: color.r,
            green: color.g,
            blue: color.b,
          },
        },
        shape: {
          _obj: 'line',
          startPoint: {
            _obj: 'paint',
            horizontal: { _unit: 'pixelsUnit', _value: start.x },
            vertical: { _unit: 'pixelsUnit', _value: start.y },
          },
          endPoint: {
            _obj: 'paint',
            horizontal: { _unit: 'pixelsUnit', _value: end.x },
            vertical: { _unit: 'pixelsUnit', _value: end.y },
          },
          strokeWidth: { _unit: 'pixelsUnit', _value: weight },
        },
      },
      _options: { dialogOptions: 'dontDisplay' },
    },
  ], { synchronousExecution: true });
  
  return result;
};

// ============================================================================
// Crop Marks Generation
// ============================================================================

/**
 * Create crop marks for a print artboard
 * @param {Object} trimBounds - Trim area bounds { x, y, width, height }
 * @param {Object} settings - Print settings
 * @returns {Promise<void>}
 */
export const createCropMarks = async (trimBounds, settings = DEFAULT_PRINT_SETTINGS) => {
  const markLength = unitsToPixels(settings.cropMarkLength, settings.bleedUnit);
  const markOffset = unitsToPixels(settings.cropMarkOffset, settings.bleedUnit);
  const bleedPx = unitsToPixels(settings.bleed, settings.bleedUnit);
  
  const marks = [
    // Top-left corner
    { start: { x: trimBounds.x - markOffset - markLength, y: trimBounds.y }, end: { x: trimBounds.x - markOffset, y: trimBounds.y } },
    { start: { x: trimBounds.x, y: trimBounds.y - markOffset - markLength }, end: { x: trimBounds.x, y: trimBounds.y - markOffset } },
    // Top-right corner
    { start: { x: trimBounds.x + trimBounds.width + markOffset, y: trimBounds.y }, end: { x: trimBounds.x + trimBounds.width + markOffset + markLength, y: trimBounds.y } },
    { start: { x: trimBounds.x + trimBounds.width, y: trimBounds.y - markOffset - markLength }, end: { x: trimBounds.x + trimBounds.width, y: trimBounds.y - markOffset } },
    // Bottom-left corner
    { start: { x: trimBounds.x - markOffset - markLength, y: trimBounds.y + trimBounds.height }, end: { x: trimBounds.x - markOffset, y: trimBounds.y + trimBounds.height } },
    { start: { x: trimBounds.x, y: trimBounds.y + trimBounds.height + markOffset }, end: { x: trimBounds.x, y: trimBounds.y + trimBounds.height + markOffset + markLength } },
    // Bottom-right corner
    { start: { x: trimBounds.x + trimBounds.width + markOffset, y: trimBounds.y + trimBounds.height }, end: { x: trimBounds.x + trimBounds.width + markOffset + markLength, y: trimBounds.y + trimBounds.height } },
    { start: { x: trimBounds.x + trimBounds.width, y: trimBounds.y + trimBounds.height + markOffset }, end: { x: trimBounds.x + trimBounds.width, y: trimBounds.y + trimBounds.height + markOffset + markLength } },
  ];
  
  // Create crop marks group
  await createLayerGroup('Crop Marks');
  
  // Draw each mark
  for (const mark of marks) {
    await drawCropMarkLine(mark.start, mark.end, settings.cropMarkWeight, settings.cropMarkColor);
  }
};

// ============================================================================
// Main Generation Functions
// ============================================================================

/**
 * Process a single layer role - duplicate, scale, and position
 * @param {Object} params - Processing parameters
 * @returns {Promise<void>}
 */
export const processLayerRole = async ({
  sourceLayer,
  sourceArtboardBounds,
  targetArtboardBounds,
  role,
  trimBounds = null, // For print artboards
}) => {
  const config = getLayerRoleConfig(role);
  const targetBounds = trimBounds || targetArtboardBounds;
  
  // Calculate scale based on mode
  let scale;
  switch (config.scaleMode) {
    case 'cover':
      scale = calculateCoverScale(
        { width: sourceLayer.bounds.width, height: sourceLayer.bounds.height },
        { width: targetBounds.width, height: targetBounds.height }
      );
      break;
    case 'contain':
      scale = calculateContainScale(
        { width: sourceLayer.bounds.width, height: sourceLayer.bounds.height },
        { width: targetBounds.width, height: targetBounds.height }
      );
      break;
    case 'relative':
      scale = calculateRelativeScale(
        { width: sourceArtboardBounds.width, height: sourceArtboardBounds.height },
        { width: targetBounds.width, height: targetBounds.height }
      );
      break;
    default:
      scale = 1;
  }
  
  // Get relative position for corner elements
  let relativePosition = null;
  if (config.anchor !== 'center') {
    const layerPos = {
      x: sourceLayer.bounds.left - sourceArtboardBounds.x,
      y: sourceLayer.bounds.top - sourceArtboardBounds.y,
    };
    relativePosition = getRelativePosition(layerPos, {
      width: sourceArtboardBounds.width,
      height: sourceArtboardBounds.height,
    });
  }
  
  // Calculate scaled layer size
  const scaledLayerSize = {
    width: sourceLayer.bounds.width * scale,
    height: sourceLayer.bounds.height * scale,
  };
  
  // Calculate final position
  const position = calculatePosition(
    config.anchor,
    scaledLayerSize,
    { width: targetBounds.width, height: targetBounds.height },
    relativePosition
  );
  
  // Adjust position for artboard offset
  const finalPosition = {
    x: targetArtboardBounds.x + position.x,
    y: targetArtboardBounds.y + position.y,
  };
  
  // Scale and move the layer
  await scaleLayer(sourceLayer.id, scale);
  await moveLayer(sourceLayer.id, finalPosition);
};

/**
 * Create a single artboard with all role layers
 * @param {Object} params - Creation parameters
 * @returns {Promise<Object>} Created artboard info
 */
export const createArtboardWithRoles = async ({
  sizeConfig,
  position,
  sourceConfig,
  printSettings = DEFAULT_PRINT_SETTINGS,
}) => {
  console.log('='.repeat(60));
  console.log('[createArtboardWithRoles] Starting artboard creation');
  console.log('[createArtboardWithRoles] Size config:', sizeConfig);
  console.log('[createArtboardWithRoles] Position:', position);
  console.log('[createArtboardWithRoles] Source config:', sourceConfig);
  
  const app = getApp();
  const batchPlay = getBatchPlay();
  
  // Determine which source to use
  const aspectRatio = sizeConfig.width / sizeConfig.height;
  const sourceType = determineSourceType(aspectRatio);
  const source = sourceConfig[sourceType];
  
  console.log(`[createArtboardWithRoles] Aspect ratio: ${aspectRatio}, source type: ${sourceType}`);
  console.log(`[createArtboardWithRoles] Using source:`, source);
  
  if (!source || !source.artboard) {
    console.error(`[createArtboardWithRoles] No ${sourceType} source configured`);
    throw new Error(`No ${sourceType} source configured`);
  }
  
  // Calculate actual artboard size (with bleed for print)
  let artboardWidth = sizeConfig.width;
  let artboardHeight = sizeConfig.height;
  let trimBounds = null;
  
  if (sizeConfig.requiresBleed && sizeConfig.bleed) {
    const bleedPx = unitsToPixels(sizeConfig.bleed, sizeConfig.bleedUnit || 'inches');
    artboardWidth += bleedPx * 2;
    artboardHeight += bleedPx * 2;
    
    trimBounds = {
      x: position.x + bleedPx,
      y: position.y + bleedPx,
      width: sizeConfig.width,
      height: sizeConfig.height,
    };
    console.log(`[createArtboardWithRoles] Print artboard with bleed: ${bleedPx}px`);
  }
  
  // Create the artboard
  const artboardBounds = {
    x: position.x,
    y: position.y,
    width: artboardWidth,
    height: artboardHeight,
  };
  
  console.log('[createArtboardWithRoles] Creating artboard with bounds:', artboardBounds);
  await createArtboard(sizeConfig.name, artboardBounds);
  
  // Get the newly created artboard (it should be selected/active)
  const doc = app.activeDocument;
  
  // Find the source artboard by name
  const sourceArtboard = doc.layers.find((l) => l.name === source.artboard);
  
  if (!sourceArtboard) {
    console.error(`[createArtboardWithRoles] Source artboard "${source.artboard}" not found in document`);
    console.log('[createArtboardWithRoles] Available layers:', doc.layers.map((l) => l.name));
    throw new Error(`Source artboard "${source.artboard}" not found`);
  }
  
  console.log(`[createArtboardWithRoles] Found source artboard: "${sourceArtboard.name}" (id: ${sourceArtboard.id})`);
  
  // Get source artboard bounds via batchPlay for accuracy
  let sourceArtboardBounds;
  try {
    const result = await batchPlay([
      {
        _obj: 'get',
        _target: [{ _ref: 'layer', _id: sourceArtboard.id }],
        _options: { dialogOptions: 'dontDisplay' },
      },
    ], { synchronousExecution: false });
    
    const rect = result[0]?.artboard?.artboardRect;
    if (rect) {
      sourceArtboardBounds = {
        x: rect.left,
        y: rect.top,
        width: rect.right - rect.left,
        height: rect.bottom - rect.top,
      };
      console.log('[createArtboardWithRoles] Source artboard bounds (from batchPlay):', sourceArtboardBounds);
    } else {
      // Fallback to layer bounds
      sourceArtboardBounds = {
        x: sourceArtboard.bounds.left,
        y: sourceArtboard.bounds.top,
        width: sourceArtboard.bounds.right - sourceArtboard.bounds.left,
        height: sourceArtboard.bounds.bottom - sourceArtboard.bounds.top,
      };
      console.log('[createArtboardWithRoles] Source artboard bounds (from layer bounds):', sourceArtboardBounds);
    }
  } catch (e) {
    console.warn('[createArtboardWithRoles] Error getting source artboard bounds:', e);
    sourceArtboardBounds = {
      x: sourceArtboard.bounds.left,
      y: sourceArtboard.bounds.top,
      width: sourceArtboard.bounds.right - sourceArtboard.bounds.left,
      height: sourceArtboard.bounds.bottom - sourceArtboard.bounds.top,
    };
  }
  
  // Find the new artboard we just created
  const newArtboard = doc.layers.find((l) => l.name === sizeConfig.name);
  if (!newArtboard) {
    console.error(`[createArtboardWithRoles] Could not find newly created artboard "${sizeConfig.name}"`);
    console.log('[createArtboardWithRoles] Available layers:', doc.layers.map((l) => l.name));
    throw new Error(`Could not find newly created artboard "${sizeConfig.name}"`);
  }
  
  console.log(`[createArtboardWithRoles] Found new artboard: "${newArtboard.name}" (id: ${newArtboard.id})`);
  
  // For now, always copy ALL contents from source artboard
  // Layer role-based handling is complex and can be added later as an enhancement
  console.log('[createArtboardWithRoles] Copying ALL contents from source artboard');
  console.log(`[createArtboardWithRoles] Source artboard id: ${sourceArtboard.id}, name: "${sourceArtboard.name}"`);
  console.log(`[createArtboardWithRoles] Target artboard id: ${newArtboard.id}, name: "${newArtboard.name}"`);
  
  const duplicatedIds = await duplicateArtboardContents(sourceArtboard.id, newArtboard.id);
  console.log(`[createArtboardWithRoles] Duplicated ${duplicatedIds.length} layers:`, duplicatedIds);
  
  if (duplicatedIds.length > 0) {
    // Transform the duplicated content to fit the new artboard
    console.log('[createArtboardWithRoles] Transforming duplicated content...');
    await transformDuplicatedContent(duplicatedIds, sourceArtboardBounds, artboardBounds);
  } else {
    console.warn('[createArtboardWithRoles] No layers were duplicated!');
  }
  
  // Create crop marks for print artboards
  if (sizeConfig.requiresBleed && trimBounds) {
    console.log('[createArtboardWithRoles] Creating crop marks for print artboard');
    await createCropMarks(trimBounds, printSettings);
  }
  
  console.log(`[createArtboardWithRoles] ✓ Artboard "${sizeConfig.name}" created successfully`);
  console.log('='.repeat(60));
  return { name: sizeConfig.name, bounds: artboardBounds };
};

// ============================================================================
// Main Entry Point
// ============================================================================

/**
 * Generate all artboards from size configurations
 * @param {Array} sizes - Array of size configurations from API
 * @param {Object} sourceConfig - Source artboard and layer configuration
 * @param {Object} options - Layout and print options
 * @param {Function} onProgress - Progress callback (current, total, name)
 * @returns {Promise<Array>} Array of created artboard info
 */
export const generateArtboards = async (sizes, sourceConfig, options = {}, onProgress = null) => {
  // Log generator usage
  logActivity(ACTIVITY_TYPES.GENERATOR_USE);

  console.log('*'.repeat(60));
  console.log('[generateArtboards] Starting artboard generation');
  console.log(`[generateArtboards] Sizes to generate: ${sizes.length}`, sizes.map((s) => s.name));
  console.log('[generateArtboards] Source config:', sourceConfig);
  console.log('[generateArtboards] Options:', options);
  
  const layoutOptions = { ...DEFAULT_LAYOUT_OPTIONS, ...options };
  const printSettings = { ...DEFAULT_PRINT_SETTINGS, ...options.printSettings };
  
  // Execute within modal scope with history suspension
  const core = getCore();
  const app = getApp();
  return await core.executeAsModal(
    async (executionContext) => {
      const doc = app.activeDocument;
      console.log(`[generateArtboards] Active document: "${doc.name}"`);
      
      // Suspend history for single undo
      const suspensionID = await executionContext.hostControl.suspendHistory({
        documentID: doc.id,
        name: 'Generate Artboards',
      });
      
      const createdArtboards = [];
      
      try {
        // For single artboard generation, use smart positioning
        // For batch generation, use grid layout
        const isSingleGeneration = sizes.length === 1;
        console.log(`[generateArtboards] Single generation mode: ${isSingleGeneration}`);
        
        if (isSingleGeneration) {
          // Find position based on existing artboards
          const sizeConfig = sizes[0];
          console.log(`[generateArtboards] Generating single artboard: "${sizeConfig.name}" (${sizeConfig.width}x${sizeConfig.height})`);
          
          // Calculate actual size (with bleed if needed)
          let actualWidth = sizeConfig.width;
          let actualHeight = sizeConfig.height;
          
          if (sizeConfig.requiresBleed && sizeConfig.bleed) {
            const bleedPx = unitsToPixels(sizeConfig.bleed, sizeConfig.bleedUnit || 'inches');
            actualWidth += bleedPx * 2;
            actualHeight += bleedPx * 2;
          }
          
          // Find smart position based on existing artboards
          console.log(`[generateArtboards] Finding position for ${actualWidth}x${actualHeight} artboard...`);
          const position = await findNextArtboardPosition(actualWidth, actualHeight, layoutOptions.gap);
          console.log('[generateArtboards] Position determined:', position);
          
          if (onProgress) {
            onProgress(1, 1, sizeConfig.name);
          }
          
          const artboard = await createArtboardWithRoles({
            sizeConfig,
            position,
            sourceConfig,
            printSettings,
          });
          
          createdArtboards.push(artboard);
        } else {
          // Batch generation - use grid layout starting after existing artboards
          // First, find where existing artboards end
          const existingArtboards = await getExistingArtboardBounds();
          
          let startX = layoutOptions.startX;
          let startY = layoutOptions.startY;
          
          if (existingArtboards.length > 0) {
            // Find the rightmost edge
            let maxRight = -Infinity;
            let minTop = Infinity;
            
            for (const ab of existingArtboards) {
              if (ab.right > maxRight) maxRight = ab.right;
              if (ab.top < minTop) minTop = ab.top;
            }
            
            startX = maxRight + layoutOptions.gap;
            startY = minTop;
          }
          
          // Calculate grid positions with updated start position
          const positionedSizes = calculateGridPositions(sizes, {
            ...layoutOptions,
            startX,
            startY,
          });
          
          for (let i = 0; i < positionedSizes.length; i++) {
            const sizeConfig = positionedSizes[i];
            
            if (onProgress) {
              onProgress(i + 1, positionedSizes.length, sizeConfig.name);
            }
            
            const artboard = await createArtboardWithRoles({
              sizeConfig,
              position: sizeConfig.position,
              sourceConfig,
              printSettings,
            });
            
            createdArtboards.push(artboard);
          }
        }
      } finally {
        // Resume history
        await executionContext.hostControl.resumeHistory(suspensionID);
      }
      
      console.log(`[generateArtboards] ✓ Generation complete. Created ${createdArtboards.length} artboards`);
      console.log('*'.repeat(60));
      return createdArtboards;
    },
    { commandName: 'Generate Artboards' }
  );
};

export default {
  generateArtboards,
  calculateGridPositions,
  groupByType,
  determineSourceType,
  unitsToPixels,
  getExistingArtboardBounds,
  findNextArtboardPosition,
  duplicateArtboardContents,
  transformDuplicatedContent,
  LAYER_ROLES,
  DEFAULT_PRINT_SETTINGS,
  DEFAULT_LAYOUT_OPTIONS,
};


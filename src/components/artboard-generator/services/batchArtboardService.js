/**
 * Batch artboard generation service using the duplicate + resize + transform pattern
 * This follows the Photoshop action recording pattern for more reliable results
 * 
 * IMPORTANT: After duplicating an artboard, we must get the NEW layer IDs from the
 * duplicate before transforming. Selecting by name alone would affect the source layers.
 */

// Photoshop APIs are loaded lazily to avoid errors during module initialization
const getPhotoshop = () => require('photoshop');
const getApp = () => getPhotoshop().app;
const getCore = () => getPhotoshop().core;
const getBatchPlay = () => getPhotoshop().action.batchPlay;

// ============================================================================
// Constants
// ============================================================================

export const LAYER_NAMES = {
  OVERLAY: 'Overlay',
  TEXT: 'TEXT',
  BACKGROUND: 'BKG',
};

export const DEFAULT_ARTBOARD_BACKGROUND = {
  _obj: 'RGBColor',
  blue: 255.0,
  grain: 255.0, // Note: Photoshop uses 'grain' for green in some contexts
  red: 255.0,
};

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Collect all layer IDs from an artboard (including nested layers)
 * @param {Object} layer - Layer object
 * @returns {Array<number>} Array of layer IDs
 */
const collectLayerIds = (layer) => {
  const ids = [layer.id];
  if (layer.layers && layer.layers.length > 0) {
    for (const child of layer.layers) {
      ids.push(...collectLayerIds(child));
    }
  }
  return ids;
};

/**
 * Calculate scale percentage for layer transformation
 * @param {Object} sourceSize - Source artboard dimensions { width, height }
 * @param {Object} targetSize - Target artboard dimensions { width, height }
 * @param {string} scaleMode - Scale mode: 'cover', 'contain', or 'relative'
 * @returns {number} Scale percentage (e.g., 85.79 for 85.79%)
 */
export const calculateScalePercent = (sourceSize, targetSize, scaleMode = 'cover') => {
  const widthScale = targetSize.width / sourceSize.width;
  const heightScale = targetSize.height / sourceSize.height;
  
  let scale;
  switch (scaleMode) {
    case 'cover':
      // Use max to ensure full coverage (may crop edges)
      scale = Math.max(widthScale, heightScale);
      break;
    case 'contain':
      // Use min to fit entirely within target (may have margins)
      scale = Math.min(widthScale, heightScale);
      break;
    case 'relative':
      // Use diagonal ratio for consistent visual scaling
      const sourceDiagonal = Math.sqrt(sourceSize.width ** 2 + sourceSize.height ** 2);
      const targetDiagonal = Math.sqrt(targetSize.width ** 2 + targetSize.height ** 2);
      scale = targetDiagonal / sourceDiagonal;
      break;
    default:
      scale = 1;
  }
  
  return scale * 100; // Convert to percentage
};

/**
 * Get layer configuration based on layer name
 * @param {string} layerName - Name of the layer
 * @returns {Object} Configuration { scaleMode, shouldAlign }
 */
export const getLayerConfig = (layerName) => {
  const configs = {
    [LAYER_NAMES.OVERLAY]: { scaleMode: 'cover', shouldAlign: true },
    [LAYER_NAMES.TEXT]: { scaleMode: 'contain', shouldAlign: true },
    [LAYER_NAMES.BACKGROUND]: { scaleMode: 'cover', shouldAlign: true },
  };
  
  // Check for exact match first
  if (configs[layerName]) {
    return configs[layerName];
  }
  
  // Check for partial match (case-insensitive)
  const lowerName = layerName.toLowerCase();
  if (lowerName.includes('overlay')) return configs[LAYER_NAMES.OVERLAY];
  if (lowerName.includes('text') || lowerName.includes('title')) return configs[LAYER_NAMES.TEXT];
  if (lowerName.includes('bkg') || lowerName.includes('background')) return configs[LAYER_NAMES.BACKGROUND];
  
  // Default config
  return { scaleMode: 'relative', shouldAlign: true };
};

// ============================================================================
// BatchPlay Command Generators
// ============================================================================

/**
 * Generate duplicate command for the currently selected layer/artboard
 * When duplicating an artboard, all its contents are automatically duplicated
 * @returns {Object} BatchPlay command
 */
export const generateDuplicateCommand = () => ({
  _obj: 'duplicate',
  _target: [
    {
      _enum: 'ordinal',
      _ref: 'layer',
      _value: 'targetEnum',
    },
  ],
  _options: { dialogOptions: 'dontDisplay' },
});

/**
 * Generate edit artboard command to resize
 * @param {Object} bounds - New artboard bounds { left, top, right, bottom }
 * @param {string} presetName - Artboard preset name (optional)
 * @param {Object} backgroundColor - Background color (optional)
 * @returns {Object} BatchPlay command
 */
export const generateEditArtboardCommand = (bounds, presetName = 'Custom', backgroundColor = DEFAULT_ARTBOARD_BACKGROUND) => ({
  _obj: 'editArtboardEvent',
  _target: [
    {
      _enum: 'ordinal',
      _ref: 'layer',
      _value: 'targetEnum',
    },
  ],
  artboard: {
    _obj: 'artboard',
    artboardBackgroundType: 1,
    artboardPresetName: presetName,
    artboardRect: {
      _obj: 'classFloatRect',
      left: bounds.left,
      top: bounds.top,
      right: bounds.right,
      bottom: bounds.bottom,
    },
    color: backgroundColor,
    guideIDs: [],
  },
  changeSizes: 1,
});

/**
 * Generate select layer command by ID (REQUIRED for duplicated artboards)
 * IMPORTANT: Always use layer ID to avoid selecting layers from source artboard
 * @param {string} layerName - Name of layer (for logging only)
 * @param {number} layerId - Layer ID (REQUIRED for accurate selection)
 * @returns {Object} BatchPlay command
 */
export const generateSelectLayerCommand = (layerName, layerId) => {
  // MUST select by ID to get the correct layer when there are duplicates
  if (layerId) {
    console.log(`[generateSelectLayerCommand] Selecting layer by ID: ${layerId} (name: "${layerName}")`);
    return {
      _obj: 'select',
      _target: [
        {
          _ref: 'layer',
          _id: layerId,  // Select by ID directly in target
        },
      ],
      makeVisible: false,
      _options: { dialogOptions: 'dontDisplay' },
    };
  }
  
  // Fallback to name selection (NOT RECOMMENDED - will likely select wrong layer)
  console.warn(`[generateSelectLayerCommand] ⚠ WARNING: No layer ID for "${layerName}" - selecting by name may fail!`);
  return {
    _obj: 'select',
    _target: [
      {
        _ref: 'layer',
        _name: layerName,
      },
    ],
    makeVisible: false,
    _options: { dialogOptions: 'dontDisplay' },
  };
};

/**
 * Generate rename layer command
 * @param {string} newName - New name for the layer
 * @returns {Object} BatchPlay command
 */
export const generateRenameCommand = (newName) => ({
  _obj: 'set',
  _target: [
    {
      _ref: 'layer',
      _enum: 'ordinal',
      _value: 'targetEnum',
    },
  ],
  to: {
    _obj: 'layer',
    name: newName,
  },
  _options: { dialogOptions: 'dontDisplay' },
});

/**
 * Generate align command - centers layer within artboard
 * @param {string} alignType - Alignment type: 'horizontal' or 'vertical'
 * @returns {Object} BatchPlay command
 */
export const generateAlignCommand = (alignType) => ({
  _obj: 'align',
  _target: [
    {
      _enum: 'ordinal',
      _ref: 'layer',
      _value: 'targetEnum',
    },
  ],
  alignToCanvas: false,
  using: {
    _enum: 'alignDistributeSelector',
    _value: alignType === 'horizontal' ? 'ADSCentersH' : 'ADSCentersV',
  },
});

/**
 * Generate transform command with scale and offset for proportional positioning
 * @param {number} widthPercent - Width scale percentage
 * @param {number} heightPercent - Height scale percentage
 * @param {Object} offset - Offset { horizontal, vertical } in pixels (optional)
 * @returns {Object} BatchPlay command
 */
export const generateTransformCommand = (widthPercent, heightPercent, offset = { horizontal: 0, vertical: 0 }) => ({
  _obj: 'transform',
  _target: [
    {
      _enum: 'ordinal',
      _ref: 'layer',
      _value: 'targetEnum',
    },
  ],
  freeTransformCenterState: {
    _enum: 'quadCenterState',
    _value: 'QCSAverage',
  },
  width: {
    _unit: 'percentUnit',
    _value: widthPercent,
  },
  height: {
    _unit: 'percentUnit',
    _value: heightPercent,
  },
  interfaceIconFrameDimmed: {
    _enum: 'interpolationType',
    _value: 'bicubic',
  },
  linked: true,
  offset: {
    _obj: 'offset',
    horizontal: {
      _unit: 'pixelsUnit',
      _value: offset.horizontal,
    },
    vertical: {
      _unit: 'pixelsUnit',
      _value: offset.vertical,
    },
  },
});

/**
 * Calculate proportional offset for a layer when resizing artboards
 * If a layer is offset from center on the source, it maintains that proportional offset on target
 * @param {Object} layerBounds - Layer bounds { left, top, right, bottom }
 * @param {Object} sourceArtboard - Source artboard bounds { left, top, width, height }
 * @param {Object} targetArtboard - Target artboard bounds { left, top, width, height }
 * @param {number} scaleFactor - Scale factor (0-1)
 * @returns {Object} Offset { horizontal, vertical } in pixels
 */
export const calculateProportionalOffset = (layerBounds, sourceArtboard, targetArtboard, scaleFactor) => {
  // Calculate layer center
  const layerCenterX = (layerBounds.left + layerBounds.right) / 2;
  const layerCenterY = (layerBounds.top + layerBounds.bottom) / 2;
  
  // Calculate source artboard center (the duplicated artboard before resize)
  // Note: The layer is in the duplicated artboard which has same dimensions as source
  const sourceArtboardCenterX = sourceArtboard.left + sourceArtboard.width / 2;
  const sourceArtboardCenterY = sourceArtboard.top + sourceArtboard.height / 2;
  
  // Calculate layer's offset from source artboard center
  const offsetFromCenterX = layerCenterX - sourceArtboardCenterX;
  const offsetFromCenterY = layerCenterY - sourceArtboardCenterY;
  
  // Scale the offset proportionally
  const scaledOffsetX = offsetFromCenterX * scaleFactor;
  const scaledOffsetY = offsetFromCenterY * scaleFactor;
  
  // Calculate target artboard center
  const targetCenterX = targetArtboard.left + targetArtboard.width / 2;
  const targetCenterY = targetArtboard.top + targetArtboard.height / 2;
  
  // Where the layer center should be on the target (proportional position)
  const targetLayerCenterX = targetCenterX + scaledOffsetX;
  const targetLayerCenterY = targetCenterY + scaledOffsetY;
  
  // After scaling, the layer will still be centered at its current position
  // We need to move it from current center to target center
  // The transform offset moves the layer during the scale operation
  const moveX = targetLayerCenterX - layerCenterX;
  const moveY = targetLayerCenterY - layerCenterY;
  
  console.log(`[calculateProportionalOffset] Layer center: (${layerCenterX.toFixed(1)}, ${layerCenterY.toFixed(1)})`);
  console.log(`[calculateProportionalOffset] Source artboard center: (${sourceArtboardCenterX.toFixed(1)}, ${sourceArtboardCenterY.toFixed(1)})`);
  console.log(`[calculateProportionalOffset] Offset from center: (${offsetFromCenterX.toFixed(1)}, ${offsetFromCenterY.toFixed(1)})`);
  console.log(`[calculateProportionalOffset] Scaled offset: (${scaledOffsetX.toFixed(1)}, ${scaledOffsetY.toFixed(1)})`);
  console.log(`[calculateProportionalOffset] Target center: (${targetCenterX.toFixed(1)}, ${targetCenterY.toFixed(1)})`);
  console.log(`[calculateProportionalOffset] Target layer center: (${targetLayerCenterX.toFixed(1)}, ${targetLayerCenterY.toFixed(1)})`);
  console.log(`[calculateProportionalOffset] Move offset: (${moveX.toFixed(1)}, ${moveY.toFixed(1)})`);
  
  return {
    horizontal: moveX,
    vertical: moveY,
  };
};

// ============================================================================
// High-Level Operations
// ============================================================================

/**
 * Get the source artboard and its bounds
 * @param {string} artboardName - Name of the source artboard
 * @returns {Promise<Object>} Artboard info { layer, bounds, layerIds }
 */
export const getSourceArtboard = async (artboardName) => {
  console.log(`[getSourceArtboard] Looking for artboard: "${artboardName}"`);
  const app = getApp();
  const batchPlay = getBatchPlay();
  const doc = app.activeDocument;
  
  if (!doc) {
    console.error('[getSourceArtboard] ✗ No active document');
    throw new Error('No active document');
  }
  
  console.log(`[getSourceArtboard] Document: "${doc.name}"`);
  console.log(`[getSourceArtboard] Available layers:`, doc.layers.map((l) => `"${l.name}"`));
  
  // Find the source artboard
  const artboardLayer = doc.layers.find((l) => l.name === artboardName);
  if (!artboardLayer) {
    console.error(`[getSourceArtboard] ✗ Artboard "${artboardName}" not found`);
    throw new Error(`Source artboard "${artboardName}" not found`);
  }
  
  console.log(`[getSourceArtboard] Found artboard: "${artboardLayer.name}" (id: ${artboardLayer.id})`);
  
  // Get artboard bounds via batchPlay
  console.log(`[getSourceArtboard] Fetching artboard bounds via batchPlay...`);
  const result = await batchPlay([
    {
      _obj: 'get',
      _target: [{ _ref: 'layer', _id: artboardLayer.id }],
      _options: { dialogOptions: 'dontDisplay' },
    },
  ], { synchronousExecution: false });
  
  const rect = result[0]?.artboard?.artboardRect;
  console.log(`[getSourceArtboard] Artboard rect from batchPlay:`, rect);
  
  if (!rect) {
    console.error(`[getSourceArtboard] ✗ "${artboardName}" is not an artboard`);
    throw new Error(`"${artboardName}" is not an artboard`);
  }
  
  const bounds = {
    left: rect.left,
    top: rect.top,
    right: rect.right,
    bottom: rect.bottom,
    width: rect.right - rect.left,
    height: rect.bottom - rect.top,
  };
  
  console.log(`[getSourceArtboard] Calculated bounds:`, JSON.stringify(bounds));
  
  // Collect all layer IDs
  const layerIds = collectLayerIds(artboardLayer);
  console.log(`[getSourceArtboard] Collected ${layerIds.length} layer IDs (including nested)`);
  
  // Get child layer names for transformation
  const childLayers = [];
  if (artboardLayer.layers) {
    console.log(`[getSourceArtboard] Found ${artboardLayer.layers.length} top-level child layers:`);
    for (const child of artboardLayer.layers) {
      childLayers.push({
        id: child.id,
        name: child.name,
        kind: child.kind,
      });
      console.log(`[getSourceArtboard]   - "${child.name}" (id: ${child.id}, kind: ${child.kind})`);
    }
  } else {
    console.log(`[getSourceArtboard] No child layers found`);
  }
  
  return {
    layer: artboardLayer,
    bounds,
    layerIds,
    childLayers,
  };
};

/**
 * Build the complete batch commands for duplicating and resizing an artboard
 * @param {Object} params - Parameters
 * @param {Array<number>} params.sourceLayerIds - Source artboard layer IDs
 * @param {Object} params.sourceBounds - Source artboard bounds
 * @param {Object} params.targetSize - Target size { width, height }
 * @param {Array<Object>} params.layersToTransform - Layers that need transformation
 * @param {Object} params.position - Position for new artboard { x, y } (optional)
 * @returns {Array<Object>} Array of batchPlay commands
 */
export const buildBatchCommands = ({ sourceLayerIds, sourceBounds, targetSize, layersToTransform, position }) => {
  const commands = [];
  
  // Calculate new artboard bounds
  // If position is provided, use it; otherwise place relative to source
  const newLeft = position?.x ?? (sourceBounds.right + 100);
  const newTop = position?.y ?? sourceBounds.top;
  const newRight = newLeft + targetSize.width;
  const newBottom = newTop + targetSize.height;
  
  // Step 1: Duplicate the artboard (contents come with it automatically)
  commands.push(generateDuplicateCommand());
  
  // Step 2: Resize the duplicated artboard
  // Note: We might need two resize commands like in the recorded action
  // First resize to intermediate size, then to final size
  commands.push(generateEditArtboardCommand({
    left: newLeft,
    top: newTop,
    right: newRight,
    bottom: newBottom,
  }));
  
  // Step 3: Transform each layer (select, align, scale)
  const sourceSize = {
    width: sourceBounds.width,
    height: sourceBounds.height,
  };
  
  for (const layer of layersToTransform) {
    const config = getLayerConfig(layer.name);
    const scalePercent = calculateScalePercent(sourceSize, targetSize, config.scaleMode);
    
    // Select the layer
    commands.push(generateSelectLayerCommand(layer.name));
    
    // Align horizontally and vertically
    if (config.shouldAlign) {
      commands.push(generateAlignCommand('horizontal'));
      commands.push(generateAlignCommand('vertical'));
    }
    
    // Transform/scale the layer
    commands.push(generateTransformCommand(scalePercent, scalePercent));
  }
  
  return commands;
};

/**
 * Execute batch commands within modal scope
 * @param {Array<Object>} commands - BatchPlay commands
 * @param {string} commandName - Name for the command (for undo history)
 * @returns {Promise<Array>} Results from batchPlay
 */
export const executeBatchCommands = async (commands, commandName = 'Create Artboard') => {
  const core = getCore();
  const batchPlay = getBatchPlay();
  
  return await core.executeAsModal(
    async () => {
      console.log(`[executeBatchCommands] Executing ${commands.length} commands...`);
      const results = await batchPlay(commands, {});
      console.log('[executeBatchCommands] Commands executed successfully');
      return results;
    },
    { commandName }
  );
};

/**
 * Find a layer by name within an artboard
 * IMPORTANT: Search TOP-LEVEL first to avoid finding nested duplicates
 * @param {Object} artboard - Artboard layer object
 * @param {string} layerName - Name to search for
 * @param {boolean} topLevelOnly - Only search top-level (default true for artboards)
 * @returns {Object|null} Found layer or null
 */
const findLayerByName = (artboard, layerName, topLevelOnly = true) => {
  console.log(`[findLayerByName] Searching for "${layerName}" in "${artboard?.name || 'unknown'}" (topLevelOnly: ${topLevelOnly})`);
  
  if (!artboard || !artboard.layers) {
    console.log(`[findLayerByName] Artboard has no layers`);
    return null;
  }
  
  const lowerName = layerName.toLowerCase();
  console.log(`[findLayerByName] Checking ${artboard.layers.length} layers`);
  
  // FIRST PASS: Check top-level layers only (exact match preferred)
  for (const layer of artboard.layers) {
    const exactMatch = layer.name === layerName;
    const partialMatch = layer.name.toLowerCase().includes(lowerName);
    
    console.log(`[findLayerByName]   - "${layer.name}" (id: ${layer.id}) - exact: ${exactMatch}, partial: ${partialMatch}`);
    
    if (exactMatch) {
      console.log(`[findLayerByName] ✓ Found EXACT match "${layer.name}" (id: ${layer.id}) at top level`);
      return layer;
    }
  }
  
  // SECOND PASS: Check top-level for partial matches
  for (const layer of artboard.layers) {
    const partialMatch = layer.name.toLowerCase().includes(lowerName);
    if (partialMatch) {
      console.log(`[findLayerByName] ✓ Found PARTIAL match "${layer.name}" (id: ${layer.id}) at top level`);
      return layer;
    }
  }
  
  // If topLevelOnly, don't recurse
  if (topLevelOnly) {
    console.log(`[findLayerByName] ✗ Layer "${layerName}" not found at top level (not recursing)`);
    return null;
  }
  
  // THIRD PASS: Recurse into groups (only if topLevelOnly is false)
  console.log(`[findLayerByName] Recursing into child groups...`);
  for (const layer of artboard.layers) {
    if (layer.layers) {
      const found = findLayerByName(layer, layerName, false);
      if (found) {
        return found;
      }
    }
  }
  
  console.log(`[findLayerByName] ✗ Layer "${layerName}" not found`);
  return null;
};

/**
 * Get the newly duplicated artboard after a duplication operation
 * After duplication, the new artboard should be selected/active
 * @param {string} originalName - Original artboard name (duplicate will have similar name)
 * @returns {Promise<Object>} New artboard info with layers
 */
const getNewlyDuplicatedArtboard = async (originalName) => {
  console.log(`[getNewlyDuplicatedArtboard] Getting duplicated artboard after duplicating "${originalName}"`);
  const app = getApp();
  const batchPlay = getBatchPlay();
  const doc = app.activeDocument;
  
  // After duplication, the new artboard should be the active layer
  const activeLayers = doc.activeLayers;
  console.log(`[getNewlyDuplicatedArtboard] Active layers count: ${activeLayers.length}`);
  
  if (activeLayers.length === 0) {
    console.error('[getNewlyDuplicatedArtboard] ✗ ERROR: No active layer after duplication');
    throw new Error('No active layer after duplication');
  }
  
  console.log(`[getNewlyDuplicatedArtboard] Active layers:`, activeLayers.map((l) => `"${l.name}" (id: ${l.id}, kind: ${l.kind})`));
  
  // The active layer should be the duplicated artboard (or one of its children)
  // Find the top-level artboard
  let newArtboard = activeLayers[0];
  console.log(`[getNewlyDuplicatedArtboard] Starting from active layer: "${newArtboard.name}" (id: ${newArtboard.id})`);
  
  // Walk up to find the artboard if we selected a child layer
  let walkCount = 0;
  while (newArtboard.parent && newArtboard.parent.name !== doc.name) {
    console.log(`[getNewlyDuplicatedArtboard]   Walking up: "${newArtboard.name}" -> "${newArtboard.parent.name}"`);
    newArtboard = newArtboard.parent;
    walkCount++;
    if (walkCount > 10) {
      console.warn('[getNewlyDuplicatedArtboard] ⚠ Too many parent walks, stopping');
      break;
    }
  }
  
  console.log(`[getNewlyDuplicatedArtboard] Found artboard: "${newArtboard.name}" (id: ${newArtboard.id})`);
  
  // Get artboard bounds
  console.log(`[getNewlyDuplicatedArtboard] Fetching artboard bounds via batchPlay...`);
  const result = await batchPlay([
    {
      _obj: 'get',
      _target: [{ _ref: 'layer', _id: newArtboard.id }],
      _options: { dialogOptions: 'dontDisplay' },
    },
  ], { synchronousExecution: false });
  
  const rect = result[0]?.artboard?.artboardRect;
  console.log(`[getNewlyDuplicatedArtboard] Artboard rect from batchPlay:`, rect);
  
  const bounds = rect ? {
    left: rect.left,
    top: rect.top,
    right: rect.right,
    bottom: rect.bottom,
    width: rect.right - rect.left,
    height: rect.bottom - rect.top,
  } : null;
  
  console.log(`[getNewlyDuplicatedArtboard] Calculated bounds:`, bounds);
  
  // Get child layers with their IDs
  const childLayers = [];
  if (newArtboard.layers) {
    console.log(`[getNewlyDuplicatedArtboard] Found ${newArtboard.layers.length} child layers:`);
    for (const child of newArtboard.layers) {
      childLayers.push({
        id: child.id,
        name: child.name,
        kind: child.kind,
      });
      console.log(`[getNewlyDuplicatedArtboard]   - "${child.name}" (id: ${child.id}, kind: ${child.kind})`);
    }
  } else {
    console.log(`[getNewlyDuplicatedArtboard] No child layers found`);
  }
  
  return {
    layer: newArtboard,
    id: newArtboard.id,
    name: newArtboard.name,
    bounds,
    childLayers,
  };
};

/**
 * Create a new artboard by duplicating source and resizing
 * This is the main entry point for single artboard generation
 * 
 * TWO-PHASE APPROACH:
 * 1. Duplicate the source artboard
 * 2. Get the NEW artboard's layer IDs
 * 3. Resize and transform using those specific IDs
 * 
 * @param {Object} params - Parameters
 * @param {string} params.sourceArtboardName - Name of source artboard to duplicate
 * @param {Object} params.targetSize - Target size { width, height, name }
 * @param {Array<string>} params.layerNames - Names of layers to transform (optional)
 * @param {Object} params.position - Position for new artboard { x, y } (optional)
 * @returns {Promise<Object>} Created artboard info
 */
export const createArtboardByDuplication = async ({
  sourceArtboardName,
  targetSize,
  layerNames = [LAYER_NAMES.OVERLAY, LAYER_NAMES.TEXT, LAYER_NAMES.BACKGROUND],
  position = null,
}) => {
  console.log('='.repeat(60));
  console.log('[createArtboardByDuplication] Starting...');
  console.log('[createArtboardByDuplication] Source:', sourceArtboardName);
  console.log('[createArtboardByDuplication] Target size:', targetSize);
  console.log('[createArtboardByDuplication] Layers to transform:', layerNames);
  
  const core = getCore();
  const app = getApp();
  
  return await core.executeAsModal(
    async (executionContext) => {
      const doc = app.activeDocument;
      
      // Suspend history for single undo
      const suspensionID = await executionContext.hostControl.suspendHistory({
        documentID: doc.id,
        name: `Create ${targetSize.name || 'Artboard'}`,
      });
      
      try {
        const result = await createArtboardByDuplicationInternal({
          sourceArtboardName,
          targetSize,
          layerNames,
          position,
        });
        
        console.log('[createArtboardByDuplication] ✓ Artboard created successfully');
        console.log('='.repeat(60));
        
        return result;
      } finally {
        await executionContext.hostControl.resumeHistory(suspensionID);
      }
    },
    { commandName: `Create ${targetSize.name || 'Artboard'}` }
  );
};

/**
 * Create artboard by duplication - internal version that runs within an existing modal context
 * @param {Object} params - Same as createArtboardByDuplication
 * @returns {Promise<Object>} Created artboard info
 */
const createArtboardByDuplicationInternal = async ({
  sourceArtboardName,
  targetSize,
  layerNames,
  position,
}) => {
  console.log('─'.repeat(60));
  console.log('[createArtboardByDuplicationInternal] === STARTING ===');
  console.log('[createArtboardByDuplicationInternal] Source artboard:', sourceArtboardName);
  console.log('[createArtboardByDuplicationInternal] Target size:', JSON.stringify(targetSize));
  console.log('[createArtboardByDuplicationInternal] Layer names to transform:', layerNames);
  console.log('[createArtboardByDuplicationInternal] Position:', position);
  
  const batchPlay = getBatchPlay();
  const app = getApp();
  
  // PHASE 1: Get source artboard info and duplicate it
  console.log('\n[createArtboardByDuplicationInternal] === PHASE 1: Get Source Artboard ===');
  const source = await getSourceArtboard(sourceArtboardName);
  console.log('[createArtboardByDuplicationInternal] Source artboard info:');
  console.log('  - Name:', source.layer.name);
  console.log('  - ID:', source.layer.id);
  console.log('  - Bounds:', JSON.stringify(source.bounds));
  console.log('  - Layer IDs count:', source.layerIds.length);
  console.log('  - Child layers:', source.childLayers.map((l) => `"${l.name}" (${l.id})`));
  
  console.log('\n[createArtboardByDuplicationInternal] Selecting source artboard...');
  await batchPlay([
    {
      _obj: 'select',
      _target: [{ _ref: 'layer', _id: source.layer.id }],
      makeVisible: false,
      _options: { dialogOptions: 'dontDisplay' },
    },
  ], { synchronousExecution: true });
  
  const docBefore = app.activeDocument;
  const activeBefore = docBefore.activeLayers.map((l) => `"${l.name}" (${l.id})`);
  console.log('[createArtboardByDuplicationInternal] Active layers after select:', activeBefore);
  
  console.log('\n[createArtboardByDuplicationInternal] Duplicating artboard (contents included automatically)...');
  await batchPlay([
    generateDuplicateCommand(),
  ], { synchronousExecution: true });
  
  const docAfter = app.activeDocument;
  const activeAfter = docAfter.activeLayers.map((l) => `"${l.name}" (${l.id})`);
  console.log('[createArtboardByDuplicationInternal] Active layers after duplicate:', activeAfter);
  
  // PHASE 2: Get the newly duplicated artboard
  console.log('\n[createArtboardByDuplicationInternal] === PHASE 2: Get New Artboard ===');
  const newArtboard = await getNewlyDuplicatedArtboard(sourceArtboardName);
  console.log('[createArtboardByDuplicationInternal] New artboard info:');
  console.log('  - Name:', newArtboard.name);
  console.log('  - ID:', newArtboard.id);
  console.log('  - Bounds:', JSON.stringify(newArtboard.bounds));
  console.log('  - Child layers:', newArtboard.childLayers.map((l) => `"${l.name}" (${l.id})`));
  
  // Calculate new artboard position
  const newLeft = position?.x ?? (source.bounds.right + 100);
  const newTop = position?.y ?? source.bounds.top;
  const newRight = newLeft + targetSize.width;
  const newBottom = newTop + targetSize.height;
  
  console.log('\n[createArtboardByDuplicationInternal] Calculated new artboard bounds:');
  console.log('  - Left:', newLeft, 'Top:', newTop);
  console.log('  - Right:', newRight, 'Bottom:', newBottom);
  console.log('  - Width:', targetSize.width, 'Height:', targetSize.height);
  
  // PHASE 3: Select, resize, and rename the new artboard
  console.log('\n[createArtboardByDuplicationInternal] === PHASE 3: Resize & Rename Artboard ===');
  console.log('[createArtboardByDuplicationInternal] Selecting new artboard (id:', newArtboard.id, ')...');
  console.log('[createArtboardByDuplicationInternal] New name:', targetSize.name || 'unnamed');
  
  const resizeAndRenameCommands = [
    // Select the artboard by ID
    {
      _obj: 'select',
      _target: [{ _ref: 'layer', _id: newArtboard.id }],
      makeVisible: false,
      _options: { dialogOptions: 'dontDisplay' },
    },
    // Resize the artboard
    generateEditArtboardCommand({
      left: newLeft,
      top: newTop,
      right: newRight,
      bottom: newBottom,
    }),
  ];
  
  // Add rename command if a name is provided
  if (targetSize.name) {
    resizeAndRenameCommands.push(generateRenameCommand(targetSize.name));
  }
  
  await batchPlay(resizeAndRenameCommands, { synchronousExecution: true });
  
  console.log('[createArtboardByDuplicationInternal] ✓ Artboard resized and renamed to:', targetSize.name || newArtboard.name);
  
  // PHASE 4: Transform each layer
  console.log('\n[createArtboardByDuplicationInternal] === PHASE 4: Transform Layers ===');
  const sourceSize = { width: source.bounds.width, height: source.bounds.height };
  const targetSizeObj = { width: targetSize.width, height: targetSize.height };
  
  console.log('[createArtboardByDuplicationInternal] Size calculations:');
  console.log('  - Source size:', JSON.stringify(sourceSize));
  console.log('  - Target size:', JSON.stringify(targetSizeObj));
  
  // Re-fetch the artboard to get fresh layer references after resize
  const doc = app.activeDocument;
  const refreshedArtboard = doc.layers.find((l) => l.id === newArtboard.id);
  
  if (!refreshedArtboard) {
    console.error('[createArtboardByDuplicationInternal] ✗ ERROR: Could not find refreshed artboard with id:', newArtboard.id);
    console.log('[createArtboardByDuplicationInternal] Available layers:', doc.layers.map((l) => `"${l.name}" (${l.id})`));
  } else {
    console.log(`[createArtboardByDuplicationInternal] Found refreshed artboard: "${refreshedArtboard.name}" (id: ${refreshedArtboard.id})`);
    console.log(`[createArtboardByDuplicationInternal] Refreshed artboard has ${refreshedArtboard.layers?.length || 0} child layers:`);
    if (refreshedArtboard.layers) {
      refreshedArtboard.layers.forEach((l) => {
        console.log(`[createArtboardByDuplicationInternal]   - "${l.name}" (id: ${l.id}, kind: ${l.kind})`);
      });
    }
  }
  
  // Use the ORIGINAL newArtboard.childLayers info we captured right after duplication
  // since the refreshed artboard might have stale/incomplete layer refs
  const artboardToSearch = refreshedArtboard || newArtboard.layer;
  
  console.log(`[createArtboardByDuplicationInternal] Will transform layers in: "${artboardToSearch.name}" with ${artboardToSearch.layers?.length || 0} layers`);
  
  for (let i = 0; i < layerNames.length; i++) {
    const layerName = layerNames[i];
    console.log(`\n[createArtboardByDuplicationInternal] --- Layer ${i + 1}/${layerNames.length}: "${layerName}" ---`);
    
    // Search in the DOM (refreshed artboard after resize)
    console.log(`[createArtboardByDuplicationInternal] Searching in refreshed artboard for "${layerName}"...`);
    const layer = findLayerByName(artboardToSearch, layerName, true);
    
    if (!layer) {
      console.log(`[createArtboardByDuplicationInternal] ⚠ Skipping "${layerName}" - not found in artboard after resize`);
      continue;
    }
    
    console.log(`[createArtboardByDuplicationInternal] ✓ Found: "${layer.name}" (id: ${layer.id})`);
    
    const config = getLayerConfig(layerName);
    console.log(`[createArtboardByDuplicationInternal] Layer config:`, JSON.stringify(config));
    
    const scalePercent = calculateScalePercent(sourceSize, targetSizeObj, config.scaleMode);
    console.log(`[createArtboardByDuplicationInternal] Scale: ${scalePercent.toFixed(2)}%`);
    
    // Step 1: Select BOTH the artboard AND the layer (artboard as reference for alignment)
    console.log(`[createArtboardByDuplicationInternal] Selecting artboard (${newArtboard.id}) + layer (${layer.id}) for alignment...`);
    await batchPlay([
      {
        _obj: 'select',
        _target: [{ _ref: 'layer', _id: newArtboard.id }],
        makeVisible: false,
        _options: { dialogOptions: 'dontDisplay' },
      },
      {
        _obj: 'select',
        _target: [{ _ref: 'layer', _id: layer.id }],
        selectionModifier: { _enum: 'selectionModifierType', _value: 'addToSelection' },
        makeVisible: false,
        _options: { dialogOptions: 'dontDisplay' },
      },
    ], { synchronousExecution: true });
    
    // Step 2: Align the layer to the artboard (centers horizontally and vertically)
    console.log(`[createArtboardByDuplicationInternal] Aligning to artboard center...`);
    await batchPlay([
      generateAlignCommand('horizontal'),
      generateAlignCommand('vertical'),
    ], { synchronousExecution: true });
    
    // Step 3: Select just the layer and scale it
    console.log(`[createArtboardByDuplicationInternal] Scaling layer by ${scalePercent.toFixed(2)}%...`);
    await batchPlay([
      generateSelectLayerCommand(layer.name, layer.id),
      generateTransformCommand(scalePercent, scalePercent),
    ], { synchronousExecution: true });
    
    console.log(`[createArtboardByDuplicationInternal] ✓ Completed transformation for "${layer.name}"`);
    
    // Step 4: Rename layer to remove " copy" suffix
    const cleanName = layer.name.replace(/ copy\d*$/i, '').replace(/ copy$/i, '');
    if (cleanName !== layer.name) {
      console.log(`[createArtboardByDuplicationInternal] Renaming "${layer.name}" → "${cleanName}"`);
      await batchPlay([
        generateRenameCommand(cleanName),
      ], { synchronousExecution: true });
    }
  }
  
  console.log('\n[createArtboardByDuplicationInternal] === COMPLETE ===');
  console.log('─'.repeat(60));
  
  return {
    name: targetSize.name,
    width: targetSize.width,
    height: targetSize.height,
    position: { x: newLeft, y: newTop },
  };
};

/**
 * Generate multiple artboards using the batch duplication method
 * @param {Array<Object>} sizes - Array of size configurations
 * @param {Object} sourceConfig - Source artboard configuration
 * @param {Object} options - Layout and generation options
 * @param {Function} onProgress - Progress callback
 * @returns {Promise<Array>} Array of created artboard info
 */
export const generateArtboardsBatch = async (sizes, sourceConfig, options = {}, onProgress = null) => {
  console.log('*'.repeat(60));
  console.log('[generateArtboardsBatch] Starting batch generation');
  console.log(`[generateArtboardsBatch] Sizes: ${sizes.length}`);
  
  const core = getCore();
  const app = getApp();
  const gap = options.gap || 100;
  
  // Get layer names from options or use defaults
  const layerNames = [
    options.overlayLayerName || LAYER_NAMES.OVERLAY,
    options.textLayerName || LAYER_NAMES.TEXT,
    options.backgroundLayerName || LAYER_NAMES.BACKGROUND,
  ];
  
  console.log('[generateArtboardsBatch] Layer names to transform:', layerNames);
  
  const createdArtboards = [];
  
  return await core.executeAsModal(
    async (executionContext) => {
      const doc = app.activeDocument;
      
      // Suspend history for single undo
      const suspensionID = await executionContext.hostControl.suspendHistory({
        documentID: doc.id,
        name: 'Generate Artboards (Batch)',
      });
      
      try {
        // Track position for placing artboards
        let currentX = null;
        let currentY = null;
        
        for (let i = 0; i < sizes.length; i++) {
          const sizeConfig = sizes[i];
          
          if (onProgress) {
            onProgress(i + 1, sizes.length, sizeConfig.name);
          }
          
          // Determine which source to use based on aspect ratio
          const aspectRatio = sizeConfig.width / sizeConfig.height;
          let sourceType;
          if (aspectRatio < 0.85) {
            sourceType = 'portrait';
          } else if (aspectRatio > 1.15) {
            sourceType = 'landscape';
          } else {
            sourceType = 'square';
          }
          
          const source = sourceConfig[sourceType];
          if (!source || !source.artboard) {
            console.warn(`[generateArtboardsBatch] No ${sourceType} source configured, skipping ${sizeConfig.name}`);
            continue;
          }
          
          // Get source artboard to determine initial position
          if (currentX === null) {
            const sourceInfo = await getSourceArtboard(source.artboard);
            currentX = sourceInfo.bounds.right + gap;
            currentY = sourceInfo.bounds.top;
          }
          
          // Create the artboard using internal function (already in modal context)
          const result = await createArtboardByDuplicationInternal({
            sourceArtboardName: source.artboard,
            targetSize: sizeConfig,
            layerNames,
            position: { x: currentX, y: currentY },
          });
          
          createdArtboards.push(result);
          
          // Update position for next artboard
          currentX += sizeConfig.width + gap;
        }
      } finally {
        await executionContext.hostControl.resumeHistory(suspensionID);
      }
      
      console.log(`[generateArtboardsBatch] ✓ Created ${createdArtboards.length} artboards`);
      console.log('*'.repeat(60));
      
      return createdArtboards;
    },
    { commandName: 'Generate Artboards (Batch)' }
  );
};

export default {
  createArtboardByDuplication,
  generateArtboardsBatch,
  buildBatchCommands,
  executeBatchCommands,
  getSourceArtboard,
  calculateScalePercent,
  getLayerConfig,
  LAYER_NAMES,
};


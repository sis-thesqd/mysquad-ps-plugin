/**
 * Batch artboard generation service using the duplicate + resize + transform pattern
 * This follows the Photoshop action recording pattern for more reliable results
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
 * Generate duplicate command for artboard with all layer IDs
 * @param {Array<number>} layerIds - Array of layer IDs to duplicate
 * @returns {Object} BatchPlay command
 */
export const generateDuplicateCommand = (layerIds) => ({
  _obj: 'duplicate',
  _target: [
    {
      _enum: 'ordinal',
      _ref: 'layer',
      _value: 'targetEnum',
    },
  ],
  ID: layerIds,
  version: 5,
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
 * Generate select layer command by name
 * @param {string} layerName - Name of layer to select
 * @param {number} layerId - Layer ID (optional, for more precise selection)
 * @returns {Object} BatchPlay command
 */
export const generateSelectLayerCommand = (layerName, layerId = null) => {
  const cmd = {
    _obj: 'select',
    _target: [
      {
        _name: layerName,
        _ref: 'layer',
      },
    ],
    makeVisible: false,
  };
  
  if (layerId) {
    cmd.layerID = [layerId];
  }
  
  return cmd;
};

/**
 * Generate align command
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
 * Generate transform command with scale and optional offset
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

// ============================================================================
// High-Level Operations
// ============================================================================

/**
 * Get the source artboard and its bounds
 * @param {string} artboardName - Name of the source artboard
 * @returns {Promise<Object>} Artboard info { layer, bounds, layerIds }
 */
export const getSourceArtboard = async (artboardName) => {
  const app = getApp();
  const batchPlay = getBatchPlay();
  const doc = app.activeDocument;
  
  if (!doc) {
    throw new Error('No active document');
  }
  
  // Find the source artboard
  const artboardLayer = doc.layers.find((l) => l.name === artboardName);
  if (!artboardLayer) {
    throw new Error(`Source artboard "${artboardName}" not found`);
  }
  
  // Get artboard bounds via batchPlay
  const result = await batchPlay([
    {
      _obj: 'get',
      _target: [{ _ref: 'layer', _id: artboardLayer.id }],
      _options: { dialogOptions: 'dontDisplay' },
    },
  ], { synchronousExecution: false });
  
  const rect = result[0]?.artboard?.artboardRect;
  if (!rect) {
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
  
  // Collect all layer IDs
  const layerIds = collectLayerIds(artboardLayer);
  
  // Get child layer names for transformation
  const childLayers = [];
  if (artboardLayer.layers) {
    for (const child of artboardLayer.layers) {
      childLayers.push({
        id: child.id,
        name: child.name,
        kind: child.kind,
      });
    }
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
  
  // Step 1: Duplicate the artboard with all layer IDs
  commands.push(generateDuplicateCommand(sourceLayerIds));
  
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
 * Create a new artboard by duplicating source and resizing
 * This is the main entry point for single artboard generation
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
  
  // Get source artboard info
  const source = await getSourceArtboard(sourceArtboardName);
  console.log('[createArtboardByDuplication] Source bounds:', source.bounds);
  console.log('[createArtboardByDuplication] Layer IDs:', source.layerIds);
  console.log('[createArtboardByDuplication] Child layers:', source.childLayers.map((l) => l.name));
  
  // Determine which layers to transform
  // Use provided layer names or fall back to child layers that exist
  const layersToTransform = layerNames
    .map((name) => {
      const found = source.childLayers.find((l) => 
        l.name === name || 
        l.name.toLowerCase().includes(name.toLowerCase())
      );
      return found || { name, id: null };
    })
    .filter((l) => {
      // Only include layers that exist in the source
      const exists = source.childLayers.some((child) => 
        child.name === l.name || 
        child.name.toLowerCase().includes(l.name.toLowerCase())
      );
      if (!exists) {
        console.log(`[createArtboardByDuplication] Layer "${l.name}" not found, skipping`);
      }
      return exists;
    });
  
  console.log('[createArtboardByDuplication] Layers to transform:', layersToTransform.map((l) => l.name));
  
  // Build batch commands
  const commands = buildBatchCommands({
    sourceLayerIds: source.layerIds,
    sourceBounds: source.bounds,
    targetSize: {
      width: targetSize.width,
      height: targetSize.height,
    },
    layersToTransform,
    position,
  });
  
  console.log(`[createArtboardByDuplication] Built ${commands.length} commands`);
  
  // Execute commands
  const results = await executeBatchCommands(commands, `Create ${targetSize.name || 'Artboard'}`);
  
  console.log('[createArtboardByDuplication] ✓ Artboard created successfully');
  console.log('='.repeat(60));
  
  return {
    name: targetSize.name,
    width: targetSize.width,
    height: targetSize.height,
    position: position || {
      x: source.bounds.right + 100,
      y: source.bounds.top,
    },
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
          
          // Create the artboard
          const result = await createArtboardByDuplication({
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


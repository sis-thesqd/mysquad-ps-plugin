/**
 * Artboard Generator module exports
 */

// Components
export { default as ArtboardGeneratorTab } from './components/ArtboardGeneratorTab';
export { default as SourceConfigPanel } from './components/SourceConfigPanel';
export { default as GenerationOptionsPanel } from './components/GenerationOptionsPanel';
export { default as PrintSettingsPanel } from './components/PrintSettingsPanel';
export { default as SizesPreview } from './components/SizesPreview';

// Hooks
export { usePhotoshopDocument } from './hooks/usePhotoshopDocument';
export { useArtboardGenerator } from './hooks/useArtboardGenerator';

// Services
export {
  generateArtboards,
  calculateGridPositions,
  groupByType,
  determineSourceType,
  unitsToPixels,
  LAYER_ROLES,
  DEFAULT_PRINT_SETTINGS,
  DEFAULT_LAYOUT_OPTIONS,
} from './services/artboardGenerator';

// Batch Artboard Service (duplicate + resize approach)
export {
  createArtboardByDuplication,
  generateArtboardsBatch,
  buildBatchCommands,
  executeBatchCommands,
  getSourceArtboard,
  calculateScalePercent,
  getLayerConfig,
  LAYER_NAMES,
} from './services/batchArtboardService';

// API
export { fetchSizes } from './api/sizesApi';

// Re-export DEFAULT_SIZES from config for convenience
export { DEFAULT_SIZES } from '../../config';


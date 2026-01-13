/**
 * Application Configuration
 * Centralizes all app configuration and environment variables
 */

/**
 * Layer role definitions for artboard generator
 */
export const LAYER_ROLES = [
  { id: 'background', label: 'Background', required: false },
  { id: 'title', label: 'Title / Main Content', required: false },
  { id: 'overlays', label: 'Overlays', required: false },
  // Corner pinning not yet supported
  // { id: 'cornerTopLeft', label: 'Corner: Top Left', required: false },
  // { id: 'cornerTopRight', label: 'Corner: Top Right', required: false },
  // { id: 'cornerBottomLeft', label: 'Corner: Bottom Left', required: false },
  // { id: 'cornerBottomRight', label: 'Corner: Bottom Right', required: false },
];

/**
 * Layer name patterns for auto-detection
 * Each role has an array of patterns (case-insensitive) to match against layer names
 * STANDARDIZED: Only BKG, TEXT, and ADJUST patterns are used
 */
export const LAYER_NAME_PATTERNS = {
  background: ['bkg'],
  title: ['text'],
  overlays: ['adjust'],
  // Corner pinning not yet supported
  // cornerTopLeft: [],
  // cornerTopRight: [],
  // cornerBottomLeft: [],
  // cornerBottomRight: [],
};

/**
 * Source type configurations for artboard generator
 */
export const SOURCE_TYPES = [
  { id: 'landscape', label: 'Landscape (16:9)', icon: '▭' },
  { id: 'portrait', label: 'Portrait (9:16)', icon: '▯' },
  { id: 'square', label: 'Square (1:1)', icon: '□' },
];

/**
 * Source type icons for visual identification
 */
export const SOURCE_TYPE_ICONS = {
  landscape: '▭ ',
  portrait: '▯ ',
  square: '□ ',
};

/**
 * Aspect ratio thresholds for determining source type
 */
export const ASPECT_RATIO_THRESHOLDS = {
  PORTRAIT_MAX: 0.85,
  SQUARE_MAX: 1.15,
};

/**
 * Default source configuration template
 */
export const DEFAULT_SOURCE_CONFIG = {
  landscape: {
    artboard: '',
    layers: {
      background: null,
      title: null,
      overlays: null,
      // Corner pinning not yet supported
      // cornerTopLeft: null,
      // cornerTopRight: null,
      // cornerBottomLeft: null,
      // cornerBottomRight: null,
    },
  },
  portrait: {
    artboard: '',
    layers: {
      background: null,
      title: null,
      overlays: null,
      // Corner pinning not yet supported
      // cornerTopLeft: null,
      // cornerTopRight: null,
      // cornerBottomLeft: null,
      // cornerBottomRight: null,
    },
  },
  square: {
    artboard: '',
    layers: {
      background: null,
      title: null,
      overlays: null,
      // Corner pinning not yet supported
      // cornerTopLeft: null,
      // cornerTopRight: null,
      // cornerBottomLeft: null,
      // cornerBottomRight: null,
    },
  },
};

/**
 * Default artboard size presets organized by category
 */
export const DEFAULT_SIZES = [
  // Social Media
  { width: 1080, height: 1350, name: '4x5 Social ➡️ ', type: 'social' },
  { width: 1920, height: 1080, name: 'High Definition ➡️ ', type: 'video' },
  { width: 1080, height: 1440, name: 'Instagram Post ➡️ ', type: 'social' },
  { width: 1080, height: 1080, name: 'Square ➡️ ', type: 'social' },
  { width: 1080, height: 1920, name: 'Story ➡️ ', type: 'social' },

  // Print (300 DPI)
  { width: 1800, height: 1200, name: 'Small Vertical Postcard ➡️ ', type: 'print', requiresBleed: true, bleed: 0.125, bleedUnit: 'inches' },
];

export const config = {
  // App metadata
  app: {
    name: 'mySquad.ps',
    version: '1.0.0',
  },

  // API configuration
  api: {
    supabase: {
      url: process.env.REACT_APP_SUPABASE_URL,
      anonKey: process.env.REACT_APP_SUPABASE_ANON_KEY,
      isConfigured: !!(process.env.REACT_APP_SUPABASE_URL && process.env.REACT_APP_SUPABASE_ANON_KEY),
    },
    sizesWebhook: 'https://sisx.thesqd.com/webhook/f676633c-95c7-4893-ac6f-bb3a56bfefae',
  },

  // Feature flags
  features: {
    folderDetails: true,
    actionsCard: false,
    activityLogging: true,
    // Activity types to log (empty array = log nothing)
    // Valid types: 'plugin_load', 'tab_switch', 'task_fetch', 'generator_use'
    activityTypesToLog: ['plugin_load', 'tab_switch', 'task_fetch', 'generator_use'],
  },

  // Navigation tabs
  tabs: [
    { id: 'task', label: 'Task Details' },
    { id: 'generator', label: 'Generator' },
  ],

  // UI timing
  ui: {
    minLoadingDisplayTime: 3000, // 3 seconds minimum loading display
  },
};

export default config;

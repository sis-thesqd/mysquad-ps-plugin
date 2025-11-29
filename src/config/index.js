/**
 * Application Configuration
 * Centralizes all app configuration and environment variables
 */

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

  // Generator sub-tabs
  generatorSubTabs: [
    { id: 'sources', label: 'Sources' },
    { id: 'options', label: 'Options' },
    { id: 'print', label: 'Print' },
  ],

  // UI timing
  ui: {
    minLoadingDisplayTime: 3000, // 3 seconds minimum loading display
  },
};

export default config;

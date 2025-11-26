/**
 * Application Configuration
 * Centralizes all app configuration and environment variables
 */

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
    actions: true,
  },
};

export default config;

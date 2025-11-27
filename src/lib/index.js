/**
 * Library exports
 */
export { callRpc, isSupabaseConfigured } from './supabase-api';
export { logActivity, extractUsername, ACTIVITY_TYPES } from './activity-logger';

// Re-export utils for backwards compatibility
export * from '../utils';

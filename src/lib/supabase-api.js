/**
 * Supabase REST API client for UXP
 * Note: UXP's fetch doesn't support full browser APIs, so we use direct REST calls
 */
import { config } from '../config';

const { url: supabaseUrl, anonKey: supabaseKey, isConfigured } = config.api.supabase;

/**
 * Check if Supabase is properly configured
 */
export const isSupabaseConfigured = isConfigured;

/**
 * Call a Supabase RPC function using REST API
 * @param {string} functionName - The RPC function name to call
 * @param {Object} params - Parameters to pass to the RPC function
 * @returns {Promise<any>} The response data from the RPC call
 * @throws {Error} If Supabase is not configured or the RPC call fails
 */
export const callRpc = async (functionName, params = {}) => {
  if (!isSupabaseConfigured) {
    throw new Error('Supabase credentials not configured');
  }

  const url = `${supabaseUrl}/rest/v1/rpc/${functionName}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': supabaseKey,
      'Authorization': `Bearer ${supabaseKey}`,
    },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`RPC error: ${response.status} - ${errorText}`);
  }

  return response.json();
};

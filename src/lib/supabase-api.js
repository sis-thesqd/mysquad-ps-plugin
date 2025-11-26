/**
 * Supabase REST API client for UXP
 * Note: UXP's fetch doesn't support full browser APIs, so we use direct REST calls
 */

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = !!(supabaseUrl && supabaseKey);

/**
 * Call a Supabase RPC function using REST API
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
      'Authorization': `Bearer ${supabaseKey}`
    },
    body: JSON.stringify(params)
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`RPC error: ${response.status} - ${errorText}`);
  }

  return response.json();
};

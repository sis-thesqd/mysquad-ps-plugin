/**
 * Generic Supabase REST API client
 */

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

/**
 * Make a direct HTTP request to Supabase REST API
 */
export const makeSupabaseRequest = async (endpoint, options = {}) => {
  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Supabase credentials not configured');
  }

  const url = `${supabaseUrl}/rest/v1/${endpoint}`;

  const requestOptions = {
    method: options.method || 'GET',
    headers: {
      'Content-Type': 'application/json',
      'apikey': supabaseKey,
      'Authorization': `Bearer ${supabaseKey}`,
      ...options.headers
    },
    ...options
  };

  const response = await fetch(url, requestOptions);

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`HTTP ${response.status}: ${errorText}`);
  }

  return await response.json();
};

/**
 * Call a Supabase RPC function
 */
export const callRpc = async (functionName, params = {}) => {
  return await makeSupabaseRequest(`rpc/${functionName}`, {
    method: 'POST',
    body: JSON.stringify(params)
  });
};

export const isSupabaseConfigured = !!(supabaseUrl && supabaseKey);

/**
 * Grafana Authentication Utility
 * 
 * Generates the appropriate Authorization header for Grafana API requests.
 * Prefers Basic Authentication (server admin) over API Key authentication.
 * 
 * Basic Auth works across ALL organizations.
 * API Keys are typically scoped to a single organization.
 */

const GRAFANA_USERNAME = process.env.GRAFANA_USERNAME || process.env.GRAFANA_ADMIN_USER;
const GRAFANA_PASSWORD = process.env.GRAFANA_PASSWORD || process.env.GRAFANA_ADMIN_PASSWORD;
const GRAFANA_API_KEY = process.env.GRAFANA_API_KEY;

export interface GrafanaAuthHeaders {
  'Authorization': string;
  'Content-Type': string;
  'X-Grafana-Org-Id'?: string;
  [key: string]: string | undefined; // Index signature for Axios compatibility
}

/**
 * Generate Grafana authorization header
 * @param orgId - Optional organization ID for org context
 * @returns Headers object with authorization
 */
export function getGrafanaAuthHeaders(orgId?: number | string): GrafanaAuthHeaders {
  let authHeader: string;
  
  if (GRAFANA_USERNAME && GRAFANA_PASSWORD) {
    // Use Basic Authentication (server admin credentials)
    // This works across all organizations
    const credentials = Buffer.from(`${GRAFANA_USERNAME}:${GRAFANA_PASSWORD}`).toString('base64');
    authHeader = `Basic ${credentials}`;
    console.log('🔐 Using Basic Authentication (server admin)');
  } else if (GRAFANA_API_KEY) {
    // Fall back to API Key (may be org-scoped)
    authHeader = `Bearer ${GRAFANA_API_KEY}`;
    console.log('🔐 Using API Key authentication (org-scoped)');
  } else {
    throw new Error('No authentication credentials configured. Set either GRAFANA_USERNAME/GRAFANA_PASSWORD or GRAFANA_API_KEY');
  }
  
  const headers: GrafanaAuthHeaders = {
    'Authorization': authHeader,
    'Content-Type': 'application/json',
  };
  
  // Set organization context if provided
  if (orgId) {
    headers['X-Grafana-Org-Id'] = orgId.toString();
    console.log(`📋 Using organization context: ${orgId}`);
  }
  
  return headers;
}

/**
 * Check if Basic Authentication is configured
 */
export function hasBasicAuth(): boolean {
  return !!(GRAFANA_USERNAME && GRAFANA_PASSWORD);
}

/**
 * Check if API Key authentication is configured
 */
export function hasApiKey(): boolean {
  return !!GRAFANA_API_KEY;
}

/**
 * Get authentication method being used
 */
export function getAuthMethod(): 'basic' | 'apikey' | 'none' {
  if (GRAFANA_USERNAME && GRAFANA_PASSWORD) return 'basic';
  if (GRAFANA_API_KEY) return 'apikey';
  return 'none';
}


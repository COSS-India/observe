const GRAFANA_URL = process.env.NEXT_PUBLIC_GRAFANA_URL;
const GRAFANA_USERNAME = process.env.GRAFANA_USERNAME;
const GRAFANA_PASSWORD = process.env.GRAFANA_PASSWORD;
const GRAFANA_API_KEY = process.env.GRAFANA_API_KEY;

export interface GrafanaAuthHeaders {
  [key: string]: string | undefined;
  'Authorization': string;
  'Content-Type': string;
  'X-Grafana-Org-Id'?: string;
}

/**
 * Get authentication headers for Grafana API requests
 * Supports dual authentication with automatic fallback:
 * 1. Basic Auth (Preferred) - Works across all organizations with server admin privileges
 * 2. API Key (Fallback) - May be organization-scoped with limited permissions
 */
export function getGrafanaAuthHeaders(orgId?: number | string): GrafanaAuthHeaders {
  let authHeader: string;
  
  if (GRAFANA_USERNAME && GRAFANA_PASSWORD) {
    // Basic Auth - works across all organizations
    const credentials = Buffer.from(`${GRAFANA_USERNAME}:${GRAFANA_PASSWORD}`).toString('base64');
    authHeader = `Basic ${credentials}`;
  } else if (GRAFANA_API_KEY) {
    // API Key - may be org-scoped
    authHeader = `Bearer ${GRAFANA_API_KEY}`;
  } else {
    throw new Error('No authentication credentials configured. Please set GRAFANA_USERNAME/GRAFANA_PASSWORD or GRAFANA_API_KEY');
  }
  
  const headers: GrafanaAuthHeaders = {
    'Authorization': authHeader,
    'Content-Type': 'application/json',
  };
  
  // Set organization context if provided
  if (orgId) {
    headers['X-Grafana-Org-Id'] = orgId.toString();
  }
  
  return headers;
}

/**
 * Get Grafana configuration details for debugging
 */
export function getGrafanaConfig() {
  return {
    GRAFANA_URL,
    HAS_USERNAME: !!GRAFANA_USERNAME,
    HAS_PASSWORD: !!GRAFANA_PASSWORD,
    HAS_API_KEY: !!GRAFANA_API_KEY,
    AUTH_METHOD: GRAFANA_USERNAME && GRAFANA_PASSWORD ? 'Basic Auth' : GRAFANA_API_KEY ? 'API Key' : 'None',
    API_KEY_PREVIEW: GRAFANA_API_KEY ? `${GRAFANA_API_KEY.substring(0, 10)}...` : 'Not set'
  };
}

/**
 * Validate that required Grafana environment variables are configured
 */
export function validateGrafanaConfig(): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (!GRAFANA_URL) {
    errors.push('NEXT_PUBLIC_GRAFANA_URL is not configured');
  }
  
  if (!GRAFANA_USERNAME || !GRAFANA_PASSWORD) {
    if (!GRAFANA_API_KEY) {
      errors.push('Either GRAFANA_USERNAME/GRAFANA_PASSWORD or GRAFANA_API_KEY must be configured');
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

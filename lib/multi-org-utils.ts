import grafanaClient from './grafana-client';

/**
 * Utility to fetch data from all organizations by switching context
 * This is a workaround for organization-scoped APIs in Grafana
 */
export async function fetchFromAllOrganizations<T>(
  fetchFunction: (orgId: number, orgName: string) => Promise<T[]>,
  options: {
    logResults?: boolean;
    continueOnError?: boolean;
  } = {}
): Promise<T[]> {
  const { logResults = true, continueOnError = true } = options;
  
  try {
    // Step 1: Get all organizations
    const orgsResponse = await grafanaClient.get('/api/orgs');
    const organizations = orgsResponse.data;
    
    if (logResults) {
      console.log(`Found ${organizations.length} organizations`);
    }
    
    // Step 2: Collect data from all organizations
    const allData: T[] = [];
    
    for (const org of organizations) {
      try {
        // Switch to organization context
        await grafanaClient.post(`/api/user/using/${org.id}`);
        
        if (logResults) {
          console.log(`Switched to organization: ${org.name} (ID: ${org.id})`);
        }
        
        // Fetch data from this organization
        const orgData = await fetchFunction(org.id, org.name);
        
        if (orgData.length > 0) {
          allData.push(...orgData);
          if (logResults) {
            console.log(`Found ${orgData.length} items in ${org.name}`);
          }
        }
      } catch (orgError) {
        console.error(`Error fetching data from org ${org.name}:`, orgError);
        if (!continueOnError) {
          throw orgError;
        }
        // Continue with other organizations even if one fails
      }
    }
    
    if (logResults) {
      console.log(`Total items found across all organizations: ${allData.length}`);
    }
    
    return allData;
  } catch (error) {
    console.error('Error in fetchFromAllOrganizations:', error);
    throw error;
  }
}

/**
 * Adds organization context to data items
 */
export function addOrganizationContext<T extends Record<string, unknown>>(
  data: T[],
  orgId: number,
  orgName: string
): Array<T & { organizationId: number; organizationName: string }> {
  return data.map(item => ({
    ...item,
    organizationId: orgId,
    organizationName: orgName
  }));
}

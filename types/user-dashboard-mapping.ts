/**
 * User-Organization-Team-Dashboard Mapping Types
 * 
 * Flow:
 * 1. User logs in with credentials
 * 2. Application authenticates and gets organization from Bhashini API (mocked for now)
 * 3. Organization is mapped to Grafana Team(s) (teams act as roles)
 * 4. Grafana Teams have permissions to specific folders/dashboards
 * 5. User sees only dashboards their team(s) can access
 */

export interface OrganizationMapping {
  /** Organization ID from Bhashini/Application */
  orgId: string;
  /** Organization name */
  orgName: string;
  /** Grafana Team IDs that this organization maps to */
  grafanaTeamIds: number[];
  /** Description of the organization */
  description?: string;
  /** Dashboard and folder mappings for this organization */
  dashboardMappings?: {
    teamId: number;
    accessibleFolderUids: string[];
    accessibleDashboardUids: string[];
  };
  /** Metadata for additional org info */
  metadata?: Record<string, unknown>;
}

export interface UserOrganizationMapping {
  /** Application user ID */
  userId: string;
  /** Application username/email */
  username: string;
  /** Organization ID from Bhashini API */
  organizationId: string;
  /** Organization name */
  organizationName: string;
  /** Role within the organization (optional, for future use) */
  roleInOrg?: string;
  /** Additional user metadata from Bhashini */
  userMetadata?: Record<string, unknown>;
}

export interface TeamDashboardAccess {
  /** Grafana Team ID */
  teamId: number;
  /** Team name */
  teamName: string;
  /** Accessible folder UIDs */
  folderUids: string[];
  /** Accessible dashboard UIDs */
  dashboardUids: string[];
  /** Permission level: 1=View, 2=Edit, 4=Admin */
  permissionLevel: 1 | 2 | 4;
}

export interface UserDashboardContext {
  /** Application user information */
  user: {
    id: string;
    username: string;
    email: string;
  };
  /** Organization information */
  organization: {
    id: string;
    name: string;
  };
  /** Grafana teams user belongs to */
  teams: {
    id: number;
    name: string;
  }[];
  /** Dashboards accessible to user */
  accessibleDashboards: {
    uid: string;
    title: string;
    folderTitle?: string;
    permissionLevel: 1 | 2 | 4;
  }[];
  /** Folders accessible to user */
  accessibleFolders: {
    uid: string;
    title: string;
    permissionLevel: 1 | 2 | 4;
  }[];
}

/**
 * Mock Bhashini API Response Structure
 * Replace with actual Bhashini API response when integrating
 */
export interface BhashiniUserDetails {
  userId: string;
  username: string;
  email: string;
  organizationId: string;
  organizationName: string;
  role?: string;
  additionalData?: Record<string, unknown>;
}

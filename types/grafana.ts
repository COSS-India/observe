export interface GrafanaUser {
  id: number;
  email: string;
  name: string;
  login: string;
  theme: string;
  orgId: number;
  isGrafanaAdmin: boolean;
  isDisabled: boolean;
  isExternal: boolean;
  authLabels: string[];
  updatedAt: string;
  createdAt: string;
  avatarUrl: string;
  role?: string; // Added for org user role (Admin, Editor, Viewer)
}

export interface CreateGrafanaUserPayload {
  name: string;
  email: string;
  login: string;
  password: string;
  OrgId?: number;
}

export interface UpdateGrafanaUserPayload {
  email?: string;
  name?: string;
  login?: string;
  theme?: string;
  role?: string;
}

export interface Organization {
  id: number;
  name: string;
  address?: {
    address1?: string;
    address2?: string;
    city?: string;
    zipCode?: string;
    state?: string;
    country?: string;
  };
}

export interface CreateOrganizationPayload {
  name: string;
}

export interface Team {
  id: number;
  orgId: number;
  name: string;
  email: string;
  avatarUrl: string;
  memberCount: number;
  permission: number;
}

export interface CreateTeamPayload {
  name: string;
  email?: string;
  orgId?: number;
}

// Dashboard Folders
export interface DashboardFolder {
  id: number;
  uid: string;
  title: string;
  url: string;
  hasAcl: boolean;
  canSave: boolean;
  canEdit: boolean;
  canAdmin: boolean;
  createdBy?: string;
  created?: string;
  updatedBy?: string;
  updated?: string;
  version?: number;
}

export interface CreateFolderPayload {
  title: string;
}

export interface UpdateFolderPayload {
  title?: string;
  version?: number;
  overwrite?: boolean;
}

// Dashboards
export interface Dashboard {
  id: number;
  uid: string;
  title: string;
  uri: string;
  url: string;
  slug: string;
  type: string;
  tags: string[];
  isStarred: boolean;
  folderId: number;
  folderUid: string;
  folderTitle: string;
  folderUrl: string;
}

export interface DashboardDetail {
  dashboard: {
    id: number;
    uid: string;
    title: string;
    tags: string[];
    timezone: string;
    schemaVersion: number;
    version: number;
    refresh: string;
  };
  meta: {
    slug: string;
    url: string;
    version: number;
    folderId?: number;
    folderUid?: string;
    folderTitle?: string;
    canSave: boolean;
    canEdit: boolean;
    canAdmin: boolean;
  };
}

// Dashboard Embedding
export interface DashboardEmbedConfig {
  uid: string;
  panelId?: number;
  theme?: 'light' | 'dark';
  from?: string;
  to?: string;
  refresh?: string;
  kiosk?: boolean;
  orgId?: number;
}

// Permissions
export interface Permission {
  id: number;
  folderId?: number;
  dashboardId?: number;
  userId?: number;
  userLogin?: string;
  userEmail?: string;
  teamId?: number;
  team?: string;
  role?: 'Viewer' | 'Editor' | 'Admin';
  permission: 1 | 2 | 4; // 1=View, 2=Edit, 4=Admin
  permissionName?: string;
  uid?: string;
  title?: string;
  slug?: string;
  isFolder?: boolean;
  url?: string;
}

export interface UpdatePermissionPayload {
  items: {
    teamId?: number;
    userId?: number;
    role?: string;
    permission: 1 | 2 | 4;
  }[];
}

export interface TimeRange {
  from: string;
  to: string;
}

export interface TeamMember {
  orgId: number;
  teamId: number;
  userId: number;
  email: string;
  login: string;
  avatarUrl: string;
  permission: number;
}

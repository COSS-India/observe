import axios, { AxiosInstance } from 'axios';
import type {
  GrafanaUser,
  CreateGrafanaUserPayload,
  UpdateGrafanaUserPayload,
  Organization,
  CreateOrganizationPayload,
  Team,
  CreateTeamPayload,
  Dashboard,
  DashboardDetail,
  DashboardFolder,
  CreateFolderPayload,
  UpdateFolderPayload,
  Permission,
  UpdatePermissionPayload,
  DashboardEmbedConfig,
  TeamMember,
} from '@/types/grafana';

class GrafanaAPIClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: '/api/grafana',
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  // User Management
  async listUsers(): Promise<GrafanaUser[]> {
    const response = await this.client.get<GrafanaUser[]>('/users');
    return response.data;
  }

  async lookupUser(loginOrEmail: string, orgId?: number): Promise<GrafanaUser> {
    const params: Record<string, string> = { loginOrEmail };
    if (orgId) {
      params.orgId = orgId.toString();
    }
    const response = await this.client.get<GrafanaUser>('/users/lookup', { params });
    return response.data;
  }

  async createUser(userData: CreateGrafanaUserPayload): Promise<{ id: number; message: string }> {
    const response = await this.client.post('/users', userData);
    return response.data;
  }

  async getUser(id: number): Promise<GrafanaUser> {
    const response = await this.client.get<GrafanaUser>(`/users/${id}`);
    return response.data;
  }

  async updateUser(id: number, userData: UpdateGrafanaUserPayload): Promise<{ message: string }> {
    const response = await this.client.put(`/users/${id}`, userData);
    return response.data;
  }

  async deleteUser(id: number): Promise<{ message: string }> {
    const response = await this.client.delete(`/users/${id}`);
    return response.data;
  }

  async disableUser(id: number): Promise<{ message: string }> {
    const response = await this.client.post(`/users/${id}/disable`);
    return response.data;
  }

  async enableUser(id: number): Promise<{ message: string }> {
    const response = await this.client.post(`/users/${id}/enable`);
    return response.data;
  }

  // Get teams for a specific user
  // Uses Grafana API: GET /api/users/:id/teams
  async getUserTeams(userId: number, orgId?: number): Promise<Team[]> {
    const params = orgId ? { orgId: orgId.toString() } : {};
    const response = await this.client.get<Team[]>(`/users/${userId}/teams`, { params });
    return response.data;
  }

  async getUserDashboards(userId: number, orgId?: number): Promise<Dashboard[]> {
    const params = orgId ? { orgId: orgId.toString() } : {};
    const response = await this.client.get<Dashboard[]>(`/users/${userId}/dashboards`, { params });
    return response.data;
  }

  async getUserFolders(userId: number, orgId?: number): Promise<DashboardFolder[]> {
    const params = orgId ? { orgId: orgId.toString() } : {};
    console.log(`🔍 Calling API: /users/${userId}/folders`, params);
    const response = await this.client.get<DashboardFolder[]>(`/users/${userId}/folders`, { params });
    console.log(`📡 Raw API response for user folders:`, JSON.stringify(response.data, null, 2));
    
    // Filter out the "General" folder (uid is empty string or "general")
    const folders = Array.isArray(response.data)
      ? response.data.filter((folder) =>
          folder.uid !== '' &&
          folder.uid !== 'general' &&
          folder.title?.toLowerCase() !== 'general'
        )
      : [];
    
    console.log(`📁 Filtered folders:`, JSON.stringify(folders, null, 2));
    return folders;
  }

  // Organization Management
  async listOrganizations(): Promise<Organization[]> {
    const response = await this.client.get<Organization[]>('/orgs');
    return response.data;
  }

  async createOrganization(orgData: CreateOrganizationPayload): Promise<{ orgId: number; message: string }> {
    const response = await this.client.post('/orgs', orgData);
    return response.data;
  }

  async getOrganization(id: number): Promise<Organization> {
    const response = await this.client.get<Organization>(`/orgs/${id}`);
    return response.data;
  }

  async updateOrganization(id: number, orgData: Partial<Organization>): Promise<{ message: string }> {
    const response = await this.client.put(`/orgs/${id}`, orgData);
    return response.data;
  }

  async deleteOrganization(id: number): Promise<{ message: string }> {
    const response = await this.client.delete(`/orgs/${id}`);
    return response.data;
  }

  async getOrganizationUsers(orgId: number): Promise<GrafanaUser[]> {
    const response = await this.client.get<GrafanaUser[]>(`/orgs/${orgId}/users`);
    return response.data;
  }

  async addUserToOrganization(orgId: number, data: { loginOrEmail: string; role: string }): Promise<{ message: string }> {
    const response = await this.client.post(`/orgs/${orgId}/users`, data);
    return response.data;
  }

  async removeUserFromOrganization(orgId: number, userId: number): Promise<{ message: string }> {
    const response = await this.client.delete(`/orgs/${orgId}/users/${userId}`);
    return response.data;
  }

  async updateOrganizationUserRole(orgId: number, userId: number, role: string): Promise<{ message: string }> {
    const response = await this.client.patch(`/orgs/${orgId}/users/${userId}`, { role });
    return response.data;
  }

  // Team Management
  async listTeams(orgId?: number): Promise<Team[]> {
    const url = orgId ? `/teams?orgId=${orgId}` : '/teams';
    const response = await this.client.get<{ teams: Team[] }>(url);
    return response.data.teams || response.data;
  }

  async createTeam(teamData: CreateTeamPayload): Promise<{ teamId: number; message: string }> {
    const response = await this.client.post('/teams', teamData);
    return response.data;
  }

  async getTeam(id: number): Promise<Team> {
    const response = await this.client.get<Team>(`/teams/${id}`);
    return response.data;
  }

  async updateTeam(id: number, teamData: Partial<Team>): Promise<{ message: string }> {
    const response = await this.client.put(`/teams/${id}`, teamData);
    return response.data;
  }

  async deleteTeam(id: number): Promise<{ message: string }> {
    const response = await this.client.delete(`/teams/${id}`);
    return response.data;
  }

  async addUserToTeam(teamId: number, userId: number): Promise<{ message: string }> {
    const response = await this.client.post(`/teams/${teamId}/members`, { userId });
    return response.data;
  }

  async removeUserFromTeam(teamId: number, userId: number): Promise<{ message: string }> {
    const response = await this.client.delete(`/teams/${teamId}/members/${userId}`);
    return response.data;
  }

  async getTeamMembers(teamId: number): Promise<TeamMember[]> {
    const response = await this.client.get<TeamMember[]>(`/teams/${teamId}/members`);
    return response.data;
  }

  // Get dashboards accessible by a specific team
  async getTeamDashboards(teamId: number): Promise<Dashboard[]> {
    try {
      // Try to get folders with team permissions
      const folders = await this.listFolders();
      const accessibleDashboards: Dashboard[] = [];

      // For each folder, check if team has access and get dashboards
      for (const folder of folders) {
        try {
          const permissions = await this.getFolderPermissions(folder.uid);
          const hasTeamAccess = permissions.some(
            (perm) => perm.teamId === teamId || perm.team === teamId.toString()
          );

          if (hasTeamAccess) {
            const folderDashboards = await this.getDashboardsByFolder(folder.uid);
            accessibleDashboards.push(...folderDashboards);
          }
        } catch (error) {
          // Skip folders where we can't check permissions
          console.warn(`Could not check permissions for folder ${folder.uid}:`, error);
        }
      }

      return accessibleDashboards;
    } catch (error) {
      console.error('Error fetching team dashboards:', error);
      // Fallback: return all dashboards if permissions check fails
      return this.listDashboards();
    }
  }

  // Get folders accessible by a specific team
  async getTeamFolders(teamId: number): Promise<DashboardFolder[]> {
    try {
      const folders = await this.listFolders();
      const accessibleFolders: DashboardFolder[] = [];

      for (const folder of folders) {
        try {
          const permissions = await this.getFolderPermissions(folder.uid);
          const hasTeamAccess = permissions.some(
            (perm) => perm.teamId === teamId || perm.team === teamId.toString()
          );

          if (hasTeamAccess) {
            accessibleFolders.push(folder);
          }
        } catch (error) {
          console.warn(`Could not check permissions for folder ${folder.uid}:`, error);
        }
      }

      return accessibleFolders;
    } catch (error) {
      console.error('Error fetching team folders:', error);
      return [];
    }
  }

  // Folder Management
  async listFolders(): Promise<DashboardFolder[]> {
    const response = await this.client.get<DashboardFolder[]>('/folders');
    // Filter out the "General" folder (uid is empty string or "general")
    const folders = Array.isArray(response.data)
      ? response.data.filter((folder) =>
          folder.uid !== '' &&
          folder.uid !== 'general' &&
          folder.title?.toLowerCase() !== 'general'
        )
      : [];
    return folders;
  }

  async createFolder(folderData: CreateFolderPayload): Promise<DashboardFolder> {
    const response = await this.client.post<DashboardFolder>('/folders', folderData);
    return response.data;
  }

  async getFolder(uid: string): Promise<DashboardFolder> {
    const response = await this.client.get<DashboardFolder>(`/folders/${uid}`);
    return response.data;
  }

  async updateFolder(uid: string, folderData: UpdateFolderPayload): Promise<DashboardFolder> {
    const response = await this.client.put<DashboardFolder>(`/folders/${uid}`, folderData);
    return response.data;
  }

  async deleteFolder(uid: string): Promise<{ message: string }> {
    const response = await this.client.delete(`/folders/${uid}`);
    return response.data;
  }

  // Folder Permissions
  async getFolderPermissions(uid: string, orgId?: number): Promise<Permission[]> {
    const params = orgId ? { orgId: orgId.toString() } : {};
    const response = await this.client.get<Permission[]>(`/folders/${uid}/permissions`, { params });
    return response.data;
  }

  async updateFolderPermissions(uid: string, permissions: UpdatePermissionPayload): Promise<{ message: string }> {
    const response = await this.client.post(`/folders/${uid}/permissions`, permissions);
    return response.data;
  }

  // Dashboard Management
  async listDashboards(): Promise<Dashboard[]> {
    const response = await this.client.get<Dashboard[]>('/dashboards');
    return response.data;
  }

  async getDashboard(uid: string, orgId?: number): Promise<DashboardDetail> {
    const params = orgId ? { orgId: orgId.toString() } : {};
    const response = await this.client.get<DashboardDetail>(`/dashboards/${uid}`, { params });
    return response.data;
  }

  async searchDashboards(query?: string, tag?: string, folderIds?: number[]): Promise<Dashboard[]> {
    const params = new URLSearchParams();
    if (query) params.append('query', query);
    if (tag) params.append('tag', tag);
    if (folderIds && folderIds.length > 0) {
      folderIds.forEach(id => params.append('folderIds', id.toString()));
    }
    
    const response = await this.client.get<Dashboard[]>(`/dashboards?${params.toString()}`);
    return response.data;
  }

  async getDashboardsByFolder(folderUid: string): Promise<Dashboard[]> {
    const params = new URLSearchParams();
    params.append('folderUids', folderUid);
    params.append('type', 'dash-db');
    
    const response = await this.client.get<Dashboard[]>(`/dashboards?${params.toString()}`);
    return response.data;
  }

  async deleteDashboard(uid: string): Promise<{ message: string }> {
    const response = await this.client.delete(`/dashboards/${uid}`);
    return response.data;
  }

  async moveDashboard(uid: string, folderUid: string): Promise<{ message: string }> {
    const response = await this.client.post(`/dashboards/${uid}/move`, { folderUid });
    return response.data;
  }

  // Dashboard Embed URL Generation
  generateEmbedUrl(config: DashboardEmbedConfig): string {
    const baseUrl = process.env.NEXT_PUBLIC_GRAFANA_URL || '';
    const params = new URLSearchParams();
    
    if (config.panelId) params.append('viewPanel', config.panelId.toString());
    if (config.theme) params.append('theme', config.theme);
    if (config.from) params.append('from', config.from);
    if (config.to) params.append('to', config.to);
    if (config.refresh) params.append('refresh', config.refresh);
    if (config.orgId) params.append('orgId', config.orgId.toString());
    if (config.kiosk) params.append('kiosk', 'tv');
    
    return `${baseUrl}/d/${config.uid}?${params.toString()}`;
  }
}

export const grafanaAPI = new GrafanaAPIClient();

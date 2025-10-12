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
  async listUsers(orgId?: number | null): Promise<GrafanaUser[]> {
    const url = orgId ? `/users?orgId=${orgId}` : '/users';
    const response = await this.client.get<GrafanaUser[]>(url);
    return response.data;
  }

  async createUser(userData: CreateGrafanaUserPayload, orgId?: number | null): Promise<{ id: number; message: string }> {
    const url = orgId ? `/users?orgId=${orgId}` : '/users';
    const response = await this.client.post(url, userData);
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

  async disableUser(id: number, orgId?: number | null): Promise<{ message: string }> {
    const url = orgId ? `/users/${id}/disable?orgId=${orgId}` : `/users/${id}/disable`;
    const response = await this.client.post(url);
    return response.data;
  }

  async enableUser(id: number, orgId?: number | null): Promise<{ message: string }> {
    const url = orgId ? `/users/${id}/enable?orgId=${orgId}` : `/users/${id}/enable`;
    const response = await this.client.post(url);
    return response.data;
  }

  async getUserTeams(userId: number): Promise<Team[]> {
    const response = await this.client.get<Team[]>(`/users/${userId}/teams`);
    return response.data;
  }

  async getUserDashboards(userId: number): Promise<Dashboard[]> {
    const response = await this.client.get<Dashboard[]>(`/users/${userId}/dashboards`);
    return response.data;
  }

  async getUserFolders(userId: number): Promise<DashboardFolder[]> {
    const response = await this.client.get<DashboardFolder[]>(`/users/${userId}/folders`);
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
  async listTeams(orgId?: number | null): Promise<Team[]> {
    const url = orgId ? `/teams?orgId=${orgId}` : '/teams';
    const response = await this.client.get<{ teams: Team[] }>(url);
    return response.data.teams || response.data;
  }

  async createTeam(teamData: CreateTeamPayload, orgId?: number | null): Promise<{ teamId: number; message: string }> {
    const payload = { ...teamData, orgId };
    const response = await this.client.post('/teams', payload);
    return response.data;
  }

  async getTeam(id: number): Promise<Team> {
    const response = await this.client.get<Team>(`/teams/${id}`);
    return response.data;
  }

  async updateTeam(id: number, teamData: Partial<Team>, orgId?: number | null): Promise<{ message: string }> {
    const url = orgId ? `/teams/${id}?orgId=${orgId}` : `/teams/${id}`;
    const response = await this.client.put(url, teamData);
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

  // Folder Management
  async listFolders(orgId?: number | null): Promise<DashboardFolder[]> {
    const url = orgId ? `/folders?orgId=${orgId}` : '/folders';
    const response = await this.client.get<DashboardFolder[]>(url);
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

  async createFolder(folderData: CreateFolderPayload, orgId?: number | null): Promise<DashboardFolder> {
    const url = orgId ? `/folders?orgId=${orgId}` : '/folders';
    const response = await this.client.post<DashboardFolder>(url, folderData);
    return response.data;
  }

  async getFolder(uid: string): Promise<DashboardFolder> {
    const response = await this.client.get<DashboardFolder>(`/folders/${uid}`);
    return response.data;
  }

  async updateFolder(uid: string, folderData: UpdateFolderPayload, orgId?: number | null): Promise<DashboardFolder> {
    const url = orgId ? `/folders/${uid}?orgId=${orgId}` : `/folders/${uid}`;
    const response = await this.client.put<DashboardFolder>(url, folderData);
    return response.data;
  }

  async deleteFolder(uid: string): Promise<{ message: string }> {
    const response = await this.client.delete(`/folders/${uid}`);
    return response.data;
  }

  // Folder Permissions
  async getFolderPermissions(uid: string, orgId?: number | null): Promise<Permission[]> {
    const url = orgId ? `/folders/${uid}/permissions?orgId=${orgId}` : `/folders/${uid}/permissions`;
    const response = await this.client.get<Permission[]>(url);
    return response.data;
  }

  async updateFolderPermissions(uid: string, permissions: UpdatePermissionPayload, orgId?: number | null): Promise<{ message: string }> {
    const url = orgId ? `/folders/${uid}/permissions?orgId=${orgId}` : `/folders/${uid}/permissions`;
    const response = await this.client.post(url, permissions);
    return response.data;
  }

  // Dashboard Management
  async listDashboards(orgId?: number | null): Promise<Dashboard[]> {
    const url = orgId ? `/dashboards?orgId=${orgId}` : '/dashboards';
    const response = await this.client.get<Dashboard[]>(url);
    return response.data;
  }

  async getDashboard(uid: string): Promise<DashboardDetail> {
    const response = await this.client.get<DashboardDetail>(`/dashboards/${uid}`);
    return response.data;
  }

  async searchDashboards(query?: string, tag?: string, folderIds?: number[], orgId?: number | null): Promise<Dashboard[]> {
    const params = new URLSearchParams();
    if (query) params.append('query', query);
    if (tag) params.append('tag', tag);
    if (folderIds && folderIds.length > 0) {
      folderIds.forEach(id => params.append('folderIds', id.toString()));
    }
    if (orgId) params.append('orgId', orgId.toString());
    
    const response = await this.client.get<Dashboard[]>(`/dashboards?${params.toString()}`);
    return response.data;
  }

  async getDashboardsByFolder(folderUid: string, orgId?: number | null): Promise<Dashboard[]> {
    const params = new URLSearchParams();
    params.append('folderUids', folderUid);
    params.append('type', 'dash-db');
    if (orgId) params.append('orgId', orgId.toString());
    
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

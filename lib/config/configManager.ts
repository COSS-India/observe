import fs from 'fs/promises';
import path from 'path';

export interface DashboardMapping {
  teamId: number;
  accessibleFolderUids: string[];
  accessibleDashboardUids: string[];
}

export interface OrganizationMappingConfig {
  orgId: string;
  orgName: string;
  grafanaTeamIds: number[];
  description?: string;
  dashboardMappings: DashboardMapping;
}

export interface MappingConfig {
  version: string;
  lastUpdated: string;
  organizationMappings: OrganizationMappingConfig[];
  superAdmins: string[];
  auditLog: Array<{
    timestamp: string;
    action: string;
    user: string;
    details: Record<string, unknown>;
  }>;
}

const CONFIG_PATH = path.join(process.cwd(), 'config', 'user-dashboard-mappings.json');
const BACKUP_PATH = path.join(process.cwd(), 'config', 'user-dashboard-mappings.backup.json');

/**
 * Configuration Manager for User-Dashboard Mappings
 * Handles reading/writing config file with atomic operations and backups
 */
class ConfigManager {
  private config: MappingConfig | null = null;
  private isLoading = false;

  /**
   * Load configuration from file
   */
  async loadConfig(): Promise<MappingConfig> {
    if (this.config && !this.isLoading) {
      return this.config;
    }

    this.isLoading = true;
    try {
      const data = await fs.readFile(CONFIG_PATH, 'utf-8');
      this.config = JSON.parse(data);
      this.isLoading = false;
      return this.config!;
    } catch (error) {
      console.error('Error loading config:', error);
      // Return default config if file doesn't exist
      this.config = this.getDefaultConfig();
      await this.saveConfig(this.config);
      this.isLoading = false;
      return this.config;
    }
  }

  /**
   * Save configuration to file with backup
   */
  async saveConfig(config: MappingConfig): Promise<void> {
    try {
      // Create backup of current config
      if (this.config) {
        await fs.writeFile(BACKUP_PATH, JSON.stringify(this.config, null, 2));
      }

      // Update timestamp
      config.lastUpdated = new Date().toISOString();

      // Write new config atomically
      const tempPath = `${CONFIG_PATH}.tmp`;
      await fs.writeFile(tempPath, JSON.stringify(config, null, 2));
      await fs.rename(tempPath, CONFIG_PATH);

      this.config = config;
      console.log('✅ Config saved successfully');
    } catch (error) {
      console.error('❌ Error saving config:', error);
      throw error;
    }
  }

  /**
   * Get organization mappings
   */
  async getOrganizationMappings(): Promise<OrganizationMappingConfig[]> {
    const config = await this.loadConfig();
    return config.organizationMappings;
  }

  /**
   * Get organization mapping by ID
   */
  async getOrganizationMapping(orgId: string): Promise<OrganizationMappingConfig | undefined> {
    const config = await this.loadConfig();
    return config.organizationMappings.find(om => om.orgId === orgId);
  }

  /**
   * Add organization mapping
   */
  async addOrganizationMapping(
    mapping: OrganizationMappingConfig,
    adminEmail: string
  ): Promise<void> {
    const config = await this.loadConfig();
    
    // Check if already exists
    const exists = config.organizationMappings.find(om => om.orgId === mapping.orgId);
    if (exists) {
      throw new Error(`Organization mapping already exists: ${mapping.orgId}`);
    }

    config.organizationMappings.push(mapping);
    
    // Add audit log entry
    config.auditLog.push({
      timestamp: new Date().toISOString(),
      action: 'ADD_ORG_MAPPING',
      user: adminEmail,
      details: { orgId: mapping.orgId, orgName: mapping.orgName },
    });

    await this.saveConfig(config);
  }

  /**
   * Update organization mapping
   */
  async updateOrganizationMapping(
    orgId: string,
    updates: Partial<OrganizationMappingConfig>,
    adminEmail: string
  ): Promise<void> {
    const config = await this.loadConfig();
    
    const index = config.organizationMappings.findIndex(om => om.orgId === orgId);
    if (index === -1) {
      throw new Error(`Organization mapping not found: ${orgId}`);
    }

    config.organizationMappings[index] = {
      ...config.organizationMappings[index],
      ...updates,
      orgId, // Ensure orgId cannot be changed
    };

    // Add audit log entry
    config.auditLog.push({
      timestamp: new Date().toISOString(),
      action: 'UPDATE_ORG_MAPPING',
      user: adminEmail,
      details: { orgId, updates },
    });

    await this.saveConfig(config);
  }

  /**
   * Delete organization mapping
   */
  async deleteOrganizationMapping(orgId: string, adminEmail: string): Promise<void> {
    const config = await this.loadConfig();
    
    const initialLength = config.organizationMappings.length;
    config.organizationMappings = config.organizationMappings.filter(om => om.orgId !== orgId);

    if (config.organizationMappings.length === initialLength) {
      throw new Error(`Organization mapping not found: ${orgId}`);
    }

    // Add audit log entry
    config.auditLog.push({
      timestamp: new Date().toISOString(),
      action: 'DELETE_ORG_MAPPING',
      user: adminEmail,
      details: { orgId },
    });

    await this.saveConfig(config);
  }

  /**
   * Assign dashboard to organization's team
   */
  async assignDashboardToOrg(
    orgId: string,
    dashboardUid: string,
    adminEmail: string
  ): Promise<void> {
    const config = await this.loadConfig();
    
    const mapping = config.organizationMappings.find(om => om.orgId === orgId);
    if (!mapping) {
      throw new Error(`Organization mapping not found: ${orgId}`);
    }

    // Add dashboard UID if not already present
    if (!mapping.dashboardMappings.accessibleDashboardUids.includes(dashboardUid)) {
      mapping.dashboardMappings.accessibleDashboardUids.push(dashboardUid);
      
      // Add audit log entry
      config.auditLog.push({
        timestamp: new Date().toISOString(),
        action: 'ASSIGN_DASHBOARD',
        user: adminEmail,
        details: { orgId, dashboardUid },
      });

      await this.saveConfig(config);
    }
  }

  /**
   * Remove dashboard from organization's team
   */
  async removeDashboardFromOrg(
    orgId: string,
    dashboardUid: string,
    adminEmail: string
  ): Promise<void> {
    const config = await this.loadConfig();
    
    const mapping = config.organizationMappings.find(om => om.orgId === orgId);
    if (!mapping) {
      throw new Error(`Organization mapping not found: ${orgId}`);
    }

    const initialLength = mapping.dashboardMappings.accessibleDashboardUids.length;
    mapping.dashboardMappings.accessibleDashboardUids = 
      mapping.dashboardMappings.accessibleDashboardUids.filter(uid => uid !== dashboardUid);

    if (mapping.dashboardMappings.accessibleDashboardUids.length < initialLength) {
      // Add audit log entry
      config.auditLog.push({
        timestamp: new Date().toISOString(),
        action: 'REMOVE_DASHBOARD',
        user: adminEmail,
        details: { orgId, dashboardUid },
      });

      await this.saveConfig(config);
    }
  }

  /**
   * Assign folder to organization's team
   */
  async assignFolderToOrg(
    orgId: string,
    folderUid: string,
    adminEmail: string
  ): Promise<void> {
    const config = await this.loadConfig();
    
    const mapping = config.organizationMappings.find(om => om.orgId === orgId);
    if (!mapping) {
      throw new Error(`Organization mapping not found: ${orgId}`);
    }

    // Add folder UID if not already present
    if (!mapping.dashboardMappings.accessibleFolderUids.includes(folderUid)) {
      mapping.dashboardMappings.accessibleFolderUids.push(folderUid);
      
      // Add audit log entry
      config.auditLog.push({
        timestamp: new Date().toISOString(),
        action: 'ASSIGN_FOLDER',
        user: adminEmail,
        details: { orgId, folderUid },
      });

      await this.saveConfig(config);
    }
  }

  /**
   * Remove folder from organization's team
   */
  async removeFolderFromOrg(
    orgId: string,
    folderUid: string,
    adminEmail: string
  ): Promise<void> {
    const config = await this.loadConfig();
    
    const mapping = config.organizationMappings.find(om => om.orgId === orgId);
    if (!mapping) {
      throw new Error(`Organization mapping not found: ${orgId}`);
    }

    const initialLength = mapping.dashboardMappings.accessibleFolderUids.length;
    mapping.dashboardMappings.accessibleFolderUids = 
      mapping.dashboardMappings.accessibleFolderUids.filter(uid => uid !== folderUid);

    if (mapping.dashboardMappings.accessibleFolderUids.length < initialLength) {
      // Add audit log entry
      config.auditLog.push({
        timestamp: new Date().toISOString(),
        action: 'REMOVE_FOLDER',
        user: adminEmail,
        details: { orgId, folderUid },
      });

      await this.saveConfig(config);
    }
  }

  /**
   * Check if user is super admin
   */
  async isSuperAdmin(email: string): Promise<boolean> {
    const config = await this.loadConfig();
    return config.superAdmins.includes(email);
  }

  /**
   * Add super admin
   */
  async addSuperAdmin(email: string, adminEmail: string): Promise<void> {
    const config = await this.loadConfig();
    
    if (!config.superAdmins.includes(email)) {
      config.superAdmins.push(email);
      
      config.auditLog.push({
        timestamp: new Date().toISOString(),
        action: 'ADD_SUPER_ADMIN',
        user: adminEmail,
        details: { email },
      });

      await this.saveConfig(config);
    }
  }

  /**
   * Remove super admin
   */
  async removeSuperAdmin(email: string, adminEmail: string): Promise<void> {
    const config = await this.loadConfig();
    
    const initialLength = config.superAdmins.length;
    config.superAdmins = config.superAdmins.filter(e => e !== email);

    if (config.superAdmins.length < initialLength) {
      config.auditLog.push({
        timestamp: new Date().toISOString(),
        action: 'REMOVE_SUPER_ADMIN',
        user: adminEmail,
        details: { email },
      });

      await this.saveConfig(config);
    }
  }

  /**
   * Get audit log
   */
  async getAuditLog(limit = 100): Promise<MappingConfig['auditLog']> {
    const config = await this.loadConfig();
    return config.auditLog.slice(-limit);
  }

  /**
   * Get default configuration
   */
  private getDefaultConfig(): MappingConfig {
    return {
      version: '1.0.0',
      lastUpdated: new Date().toISOString(),
      organizationMappings: [
        {
          orgId: 'org-karmayogi',
          orgName: 'Karmayogi Bharat',
          grafanaTeamIds: [1],
          description: 'Karmayogi Bharat organization',
          dashboardMappings: {
            teamId: 1,
            accessibleFolderUids: [],
            accessibleDashboardUids: [],
          },
        },
      ],
      superAdmins: ['admin@example.com'],
      auditLog: [],
    };
  }
}

// Export singleton instance
export const configManager = new ConfigManager();

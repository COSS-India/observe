import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  OrganizationMapping,
  UserOrganizationMapping,
  UserDashboardContext,
  BhashiniUserDetails,
} from '@/types/user-dashboard-mapping';
import type { Dashboard, DashboardFolder } from '@/types/grafana';

/**
 * Load organization mappings
 * For regular users: Use MOCK_ORG_MAPPINGS (org → team mapping)
 * For admins: Can optionally fetch from config file API
 * Dashboard access is determined dynamically from Grafana folder permissions
 */
async function loadOrganizationMappingsFromConfig(): Promise<OrganizationMapping[]> {
  try {
    // In client-side, try to fetch from API (only works for admins)
    if (typeof window !== 'undefined') {
      const response = await fetch('/api/admin/dashboard-assignments');
      if (response.ok) {
        const data = await response.json();
        console.log('✓ Loaded org mappings from admin API:', data.data);
        return data.data || MOCK_ORG_MAPPINGS;
      } else if (response.status === 403) {
        // Expected for non-admin users - use default mappings
        console.log('Using MOCK_ORG_MAPPINGS (user is not admin, dashboards will be filtered by Grafana permissions)');
        return MOCK_ORG_MAPPINGS;
      }
    }
    
    // Fallback to default mappings
    return MOCK_ORG_MAPPINGS;
  } catch (error) {
    console.warn('Using MOCK_ORG_MAPPINGS (error loading from config):', error);
    return MOCK_ORG_MAPPINGS;
  }
}

/**
 * Default mock data for organization to Grafana team mapping
 * Used as fallback when config file is not available
 */
const MOCK_ORG_MAPPINGS: OrganizationMapping[] = [
  {
    orgId: 'org-karmayogi',
    orgName: 'Karmayogi Bharat',
    grafanaTeamIds: [1], // Maps to Grafana Team ID 1
    description: 'Karmayogi Bharat organization',
  },
  {
    orgId: 'org-ministry-education',
    orgName: 'Ministry of Education',
    grafanaTeamIds: [2], // Maps to Grafana Team ID 2
    description: 'Ministry of Education organization',
  },
  {
    orgId: 'org-ministry-health',
    orgName: 'Ministry of Health',
    grafanaTeamIds: [3], // Maps to Grafana Team ID 3
    description: 'Ministry of Health organization',
  },
];

/**
 * Mock Bhashini API call
 * Replace this with actual Bhashini API integration
 */
async function mockBhashiniGetUserDetails(username: string): Promise<BhashiniUserDetails> {
  // Simulate API call
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // Mock response based on username
  const mockUsers: Record<string, BhashiniUserDetails> = {
    'admin@example.com': {
      userId: '1',
      username: 'admin',
      email: 'admin@example.com',
      organizationId: 'org-karmayogi',
      organizationName: 'Karmayogi Bharat',
      role: 'admin',
    },
    'karmayogi@karmayogi.com': {
      userId: '3',
      username: 'Karmayogi Bharat',
      email: 'karmayogi@karmayogi.com',
      organizationId: 'org-karmayogi',
      organizationName: 'Karmayogi Bharat',
      role: 'admin',
    },
    'viewer@example.com': {
      userId: '2',
      username: 'viewer',
      email: 'viewer@example.com',
      organizationId: 'org-ministry-education',
      organizationName: 'Ministry of Education',
      role: 'viewer',
    },
    'health@example.com': {
      userId: '4',
      username: 'health_user',
      email: 'health@example.com',
      organizationId: 'org-ministry-health',
      organizationName: 'Ministry of Health',
      role: 'editor',
    },
  };
  
  return mockUsers[username] || mockUsers['viewer@example.com'];
}

interface UserMappingState {
  // Current user's organization mapping
  userOrgMapping: UserOrganizationMapping | null;
  
  // Current user's dashboard context (teams, accessible dashboards, etc.)
  dashboardContext: UserDashboardContext | null;
  
  // All organization mappings (for admin use)
  orgMappings: OrganizationMapping[];
  
  // Loading states
  isLoadingContext: boolean;
  
  // Actions
  initializeUserContext: (username: string, email: string) => Promise<void>;
  loadDashboardContext: (teams: { id: number; name: string }[], allDashboards: Dashboard[], allFolders: DashboardFolder[]) => Promise<void>;
  loadOrganizationMappings: () => Promise<void>;
  clearContext: () => void;
  getAccessibleDashboards: () => UserDashboardContext['accessibleDashboards'];
  getAccessibleFolders: () => UserDashboardContext['accessibleFolders'];
  
  // Admin actions
  addOrganizationMapping: (mapping: OrganizationMapping) => void;
  updateOrganizationMapping: (orgId: string, updates: Partial<OrganizationMapping>) => void;
  removeOrganizationMapping: (orgId: string) => void;
}

export const useUserMappingStore = create<UserMappingState>()(
  persist(
    (set, get) => ({
      userOrgMapping: null,
      dashboardContext: null,
      orgMappings: MOCK_ORG_MAPPINGS,
      isLoadingContext: false,

      /**
       * Load organization mappings from config file/API
       */
      loadOrganizationMappings: async () => {
        try {
          const mappings = await loadOrganizationMappingsFromConfig();
          set({ orgMappings: mappings });
        } catch (error) {
          console.error('Failed to load organization mappings:', error);
        }
      },

      /**
       * Initialize user context by fetching organization from Bhashini API (mocked)
       * and mapping it to Grafana teams
       */
      initializeUserContext: async (username: string, email: string) => {
        set({ isLoadingContext: true });
        
        try {
          // Step 0: Load organization mappings from config file first
          await get().loadOrganizationMappings();
          
          // Step 1: Get user details from Bhashini API (mocked)
          const bhashiniUser = await mockBhashiniGetUserDetails(email);
          
          // Step 2: Create user-organization mapping
          const userOrgMapping: UserOrganizationMapping = {
            userId: bhashiniUser.userId,
            username: bhashiniUser.username,
            organizationId: bhashiniUser.organizationId,
            organizationName: bhashiniUser.organizationName,
            roleInOrg: bhashiniUser.role,
            userMetadata: bhashiniUser.additionalData,
          };
          
          // Step 3: Find Grafana teams for this organization
          const orgMapping = get().orgMappings.find(
            (om) => om.orgId === bhashiniUser.organizationId
          );
          
          set({
            userOrgMapping,
            isLoadingContext: false,
          });
          
          console.log('User context initialized:', {
            user: bhashiniUser,
            mapping: orgMapping,
          });
        } catch (error) {
          console.error('Failed to initialize user context:', error);
          set({ isLoadingContext: false });
          throw error;
        }
      },

      /**
       * Load dashboard context by filtering dashboards based on team permissions from Grafana
       */
      loadDashboardContext: async (
        teams: { id: number; name: string }[],
        allDashboards: Dashboard[],
        allFolders: DashboardFolder[]
      ) => {
        const { userOrgMapping } = get();
        
        console.log('🔍 loadDashboardContext called with:', {
          teamsCount: teams.length,
          dashboardsCount: allDashboards.length,
          foldersCount: allFolders.length,
          userOrgMapping
        });
        
        if (!userOrgMapping) {
          console.warn('No user organization mapping found');
          return;
        }

        try {
          // Get team IDs for user's organization
          const orgMapping = get().orgMappings.find(
            (om) => om.orgId === userOrgMapping.organizationId
          );
          
          if (!orgMapping) {
            console.warn('No organization mapping found for:', userOrgMapping.organizationId);
            return;
          }

          // Filter teams that belong to user's organization
          const userTeams = teams.filter(team => 
            orgMapping.grafanaTeamIds.includes(team.id)
          );
          
          console.log('👥 User teams:', userTeams);
          console.log('📊 All dashboards:', allDashboards.map(d => ({ uid: d.uid, title: d.title, folderUid: d.folderUid })));
          
          // Get accessible dashboards by checking each dashboard's folder permissions
          const accessibleDashboards: UserDashboardContext['accessibleDashboards'] = [];
          const accessibleFolderUids = new Set<string>();
          
          // For each folder, check if any of user's teams have access
          for (const folder of allFolders) {
            try {
              console.log(`\n📁 Checking permissions for folder: ${folder.title} (${folder.uid})`);
              
              // Fetch folder permissions from Grafana API
              const response = await fetch(`/api/grafana/folders/${folder.uid}/permissions`);
              if (response.ok) {
                const permissions = await response.json();
                console.log(`  📋 Permissions for ${folder.title}:`, permissions.map((p: { teamId?: number; team?: string }) => ({ teamId: p.teamId, team: p.team })));
                
                // Check if any of the user's teams have access to this folder
                const hasTeamAccess = permissions.some((perm: { teamId?: number; team?: string }) => 
                  userTeams.some(team => {
                    const matches = perm.teamId === team.id || perm.team === team.id.toString();
                    if (matches) {
                      console.log(`  ✅ Team ${team.name} (ID: ${team.id}) has access to ${folder.title}`);
                    }
                    return matches;
                  })
                );
                
                console.log(`  🔐 hasTeamAccess for ${folder.title}: ${hasTeamAccess}`);
                
                if (hasTeamAccess) {
                  accessibleFolderUids.add(folder.uid);
                  
                  // Get all dashboards in this accessible folder
                  const folderDashboards = allDashboards.filter(
                    d => d.folderUid === folder.uid
                  );
                  
                  console.log(`  📊 Dashboards in ${folder.title}:`, folderDashboards.map(d => ({ uid: d.uid, title: d.title, folderUid: d.folderUid })));
                  
                  folderDashboards.forEach(dashboard => {
                    console.log(`    ➕ Adding dashboard: ${dashboard.title} (${dashboard.uid})`);
                    accessibleDashboards.push({
                      uid: dashboard.uid,
                      title: dashboard.title,
                      folderTitle: dashboard.folderTitle,
                      permissionLevel: 1 as const, // View permission
                    });
                  });
                }
              } else {
                console.warn(`  ❌ Failed to fetch permissions for folder ${folder.uid}: ${response.status}`);
              }
            } catch (error) {
              console.warn(`❌ Could not check permissions for folder ${folder.uid}:`, error);
            }
          }
          
          // Also check dashboards in General folder (no folder)
          const generalDashboards = allDashboards.filter(d => !d.folderUid || d.folderUid === '');
          console.log(`\n📁 General folder dashboards:`, generalDashboards.map(d => ({ uid: d.uid, title: d.title })));
          generalDashboards.forEach(dashboard => {
            console.log(`  ➕ Adding general dashboard: ${dashboard.title} (${dashboard.uid})`);
            accessibleDashboards.push({
              uid: dashboard.uid,
              title: dashboard.title,
              folderTitle: dashboard.folderTitle || 'General',
              permissionLevel: 1 as const,
            });
          });
          
          const accessibleFolders = allFolders
            .filter(folder => accessibleFolderUids.has(folder.uid))
            .map(folder => ({
              uid: folder.uid,
              title: folder.title,
              permissionLevel: 1 as const,
            }));
          
          const dashboardContext: UserDashboardContext = {
            user: {
              id: userOrgMapping.userId,
              username: userOrgMapping.username,
              email: userOrgMapping.username,
            },
            organization: {
              id: userOrgMapping.organizationId,
              name: userOrgMapping.organizationName,
            },
            teams: userTeams,
            accessibleDashboards,
            accessibleFolders,
          };
          
          set({ dashboardContext });
          
          console.log('\n✅ Dashboard context loaded from Grafana permissions:', dashboardContext);
          console.log('📊 Accessible dashboards count:', accessibleDashboards.length);
          console.log('📁 Accessible folders:', accessibleFolders.map(f => f.title));
        } catch (error) {
          console.error('❌ Failed to load dashboard context:', error);
          throw error;
        }
      },

      /**
       * Clear all user context (on logout)
       */
      clearContext: () => {
        set({
          userOrgMapping: null,
          dashboardContext: null,
        });
      },

      /**
       * Get accessible dashboards for current user
       */
      getAccessibleDashboards: () => {
        const { dashboardContext } = get();
        return dashboardContext?.accessibleDashboards || [];
      },

      /**
       * Get accessible folders for current user
       */
      getAccessibleFolders: () => {
        const { dashboardContext } = get();
        return dashboardContext?.accessibleFolders || [];
      },

      // Admin actions for managing organization mappings
      addOrganizationMapping: (mapping: OrganizationMapping) => {
        set((state) => ({
          orgMappings: [...state.orgMappings, mapping],
        }));
      },

      updateOrganizationMapping: (orgId: string, updates: Partial<OrganizationMapping>) => {
        set((state) => ({
          orgMappings: state.orgMappings.map((om) =>
            om.orgId === orgId ? { ...om, ...updates } : om
          ),
        }));
      },

      removeOrganizationMapping: (orgId: string) => {
        set((state) => ({
          orgMappings: state.orgMappings.filter((om) => om.orgId !== orgId),
        }));
      },
    }),
    {
      name: 'user-mapping-storage',
      // Only persist org mappings, not user context (for security)
      partialize: (state) => ({
        orgMappings: state.orgMappings,
      }),
    }
  )
);

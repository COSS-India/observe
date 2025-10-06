import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { GrafanaUser } from '@/types/grafana';
import { grafanaAPI } from '@/lib/api/grafana';
import { toast } from 'sonner';

interface OrganizationUsersState {
  organizationUsers: GrafanaUser[];
  loading: boolean;
  error: string | null;
  lastSyncTime: number | null;
  fetchAndFilterUsers: (userOrganization: string) => Promise<void>;
  clearUsers: () => void;
  refreshUsers: (userOrganization: string) => Promise<void>;
}

export const useOrganizationUsersStore = create<OrganizationUsersState>()(
  persist(
    (set, get) => ({
      organizationUsers: [],
      loading: false,
      error: null,
      lastSyncTime: null,
      
      fetchAndFilterUsers: async (userOrganization: string) => {
        set({ loading: true, error: null });
        
        try {
          // Fetch all users from Grafana
          const allGrafanaUsers = await grafanaAPI.listUsers();
          
          // Filter users by organization
          // We'll check if the Grafana user's login/username contains the organization name
          // or if there's an organization field in the user data
          const filteredUsers = allGrafanaUsers.filter(grafanaUser => {
            const orgLower = userOrganization.toLowerCase();
            
            // Check if the login contains the organization name (case-insensitive)
            // const loginMatches = grafanaUser.login.toLowerCase().includes(orgLower);
            
            // Check if the name contains the organization name (case-insensitive)
            const nameMatches = grafanaUser.name?.toLowerCase().includes(orgLower);
            
            // Check if the email domain contains the organization name (case-insensitive)
            // const emailMatches = grafanaUser.email.toLowerCase().includes(orgLower);
            
            // Check if the email domain matches the organization
            // const emailDomain = grafanaUser.email.split('@')[1]?.toLowerCase();
            // const domainMatches = emailDomain?.includes(orgLower);
            
            return  nameMatches ;
          });
          
          set({
            organizationUsers: filteredUsers,
            loading: false,
            error: null,
            lastSyncTime: Date.now()
          });
          
          toast.success(`Found ${filteredUsers.length} users for organization "${userOrganization}"`);
          
        } catch (err: unknown) {
          let message = 'Failed to fetch and filter users';
          
          // Handle axios error response
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const error = err as any;
          if (error.response?.data) {
            message = error.response.data.error || error.response.data.message || message;
            
            // Show hint for permission errors
            if (error.response.data.hint) {
              toast.error(message, {
                description: error.response.data.hint,
                duration: 10000,
              });
            } else {
              toast.error(message);
            }
          } else if (err instanceof Error) {
            message = err.message;
            toast.error(message);
          } else {
            toast.error(message);
          }
          
          set({
            loading: false,
            error: message,
            organizationUsers: []
          });
        }
      },
      
      refreshUsers: async (userOrganization: string) => {
        // Force refresh by calling fetchAndFilterUsers
        await get().fetchAndFilterUsers(userOrganization);
      },
      
      clearUsers: () => {
        set({
          organizationUsers: [],
          error: null,
          lastSyncTime: null
        });
      }
    }),
    {
      name: 'organization-users-storage',
      // Only persist the users data, not the loading/error states
      partialize: (state) => ({
        organizationUsers: state.organizationUsers,
        lastSyncTime: state.lastSyncTime
      })
    }
  )
);

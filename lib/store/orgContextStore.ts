import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface OrgContextState {
  selectedOrgId: number | null;
  selectedOrgName: string | null;
  setSelectedOrg: (orgId: number | null, orgName: string | null) => void;
  clearSelectedOrg: () => void;
}

export const useOrgContextStore = create<OrgContextState>()(
  persist(
    (set) => ({
      selectedOrgId: null,
      selectedOrgName: null,
      
      setSelectedOrg: (orgId: number | null, orgName: string | null) => {
        set({
          selectedOrgId: orgId,
          selectedOrgName: orgName,
        });
      },

      clearSelectedOrg: () => {
        set({
          selectedOrgId: null,
          selectedOrgName: null,
        });
      },
    }),
    {
      name: 'org-context-storage',
      onRehydrateStorage: () => (state) => {
        if (state) {
          console.log('Organization context rehydrated successfully');
        }
      },
    }
  )
);

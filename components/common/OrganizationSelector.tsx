'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useOrgContextStore } from '@/lib/store/orgContextStore';
import { isSuperAdmin } from '@/lib/utils/permissions';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Building2, Loader2 } from 'lucide-react';
import type { Organization } from '@/types/grafana';

interface OrganizationSelectorProps {
  onOrganizationChange?: (orgId: number | null) => void;
  className?: string;
}

export function OrganizationSelector({ onOrganizationChange, className }: OrganizationSelectorProps) {
  const { user } = useAuth();
  const { selectedOrgId, setSelectedOrg } = useOrgContextStore();
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(false);
  const isUserSuperAdmin = isSuperAdmin(user);

  const fetchOrganizations = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/grafana/orgs');
      if (!response.ok) {
        throw new Error('Failed to fetch organizations');
      }
      const data = await response.json();
      setOrganizations(data);

      // If no org selected and we have orgs, select the first one
      if (!selectedOrgId && data.length > 0) {
        setSelectedOrg(data[0].id, data[0].name);
        onOrganizationChange?.(data[0].id);
      }
    } catch (error) {
      console.error('Error fetching organizations:', error);
    } finally {
      setLoading(false);
    }
  }, [selectedOrgId, setSelectedOrg, onOrganizationChange]);

  useEffect(() => {
    if (isUserSuperAdmin) {
      fetchOrganizations();
    }
  }, [isUserSuperAdmin, fetchOrganizations]);

  const handleOrgChange = (value: string) => {
    if (value === 'all') {
      setSelectedOrg(null, 'All Organizations');
      onOrganizationChange?.(null);
    } else {
      const orgId = parseInt(value);
      const org = organizations.find((o) => o.id === orgId);
      if (org) {
        setSelectedOrg(org.id, org.name);
        onOrganizationChange?.(org.id);
      }
    }
  };

  // Only show for super admins
  if (!isUserSuperAdmin) {
    return null;
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 border border-input rounded-lg bg-background">
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        <span className="text-sm text-muted-foreground">Loading organizations...</span>
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-2 text-muted  ${className || ''}`}>
      {/* <Building2 className="h-4 w-4 text-muted-foreground" /> */}
      <p className='font-light text-base text-muted-foreground'>Choose the organization
</p>
      <Select
        value={selectedOrgId?.toString() || 'all' }
        onValueChange={handleOrgChange}
      >
        <SelectTrigger className="w-56 h-10 text-black dark:text-white">
          <SelectValue placeholder="Select organization" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all" className='!text-black dark:text-white'>All Organizations</SelectItem>
          {organizations.map((org) => (
            <SelectItem key={org.id} value={org.id.toString()} className='text-black dark:text-white'>
              {org.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

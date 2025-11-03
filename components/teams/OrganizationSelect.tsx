'use client';

import { useEffect, useState } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import axios from 'axios';

interface Organization {
  id: number;
  org_name: string;
  org_type: string;
}

interface OrganizationSelectProps {
  value: string;
  onValueChange: (value: string) => void;
  error?: string;
}

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:9010';

export function OrganizationSelect({ value, onValueChange, error }: OrganizationSelectProps) {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrganizations = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`${BACKEND_URL}/v1/organizations`);
        setOrganizations(response.data || []);
      } catch (error) {
        console.error('Failed to fetch organizations:', error);
        setOrganizations([]);
      } finally {
        setLoading(false);
      }
    };

    fetchOrganizations();
  }, []);

  return (
    <div className="space-y-2">
      <Label htmlFor="organization">
        Organization <span className="text-red-500">*</span>
      </Label>
      <Select value={value} onValueChange={onValueChange} disabled={loading}>
        <SelectTrigger id="organization">
          <SelectValue placeholder={loading ? 'Loading organizations...' : 'Select an organization'} />
        </SelectTrigger>
        <SelectContent>
          {organizations.length === 0 && !loading && (
            <div className="p-2 text-sm text-muted-foreground">No organizations found</div>
          )}
          {organizations.map((org) => (
            <SelectItem key={org.id} value={org.id.toString()}>
              {org.org_name} ({org.org_type})
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  );
}

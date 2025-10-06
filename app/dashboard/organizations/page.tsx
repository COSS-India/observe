'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Search, Loader2, AlertCircle } from 'lucide-react';
import { useGrafanaOrganizations } from '@/hooks/useGrafanaOrganizations';
import { OrganizationTable } from '@/components/organizations/OrganizationTable';
import { OrganizationFormDialog } from '@/components/organizations/OrganizationFormDialog';
import type { Organization } from '@/types/grafana';
import { GrafanaSetupError } from '@/components/GrafanaSetupError';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export default function OrganizationsPage() {
  const { organizations, loading, error, fetchOrganizations, createOrganization, updateOrganization, deleteOrganization } = useGrafanaOrganizations();
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedOrg, setSelectedOrg] = useState<Organization | null>(null);

  useEffect(() => {
    fetchOrganizations();
  }, [fetchOrganizations]);

  const filteredOrganizations = organizations.filter((org) =>
    org.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCreate = async (data: { name: string }) => {
    await createOrganization(data);
  };

  const handleEdit = (org: Organization) => {
    setSelectedOrg(org);
    setIsEditDialogOpen(true);
  };

  const handleUpdate = async (data: { name: string }) => {
    if (selectedOrg) {
      await updateOrganization(selectedOrg.id, data);
      setSelectedOrg(null);
    }
  };

  const handleDelete = async (id: number) => {
    await deleteOrganization(id);
  };

  // Show error component if there's a setup issue
  if (error && error.includes('configuration')) {
    return <GrafanaSetupError error={error} />;
  }

  const isOrgAdmin = organizations.length === 1; // If only 1 org returned, likely Org Admin not Server Admin

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Organization Management</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-2">
            Manage organizations and their settings
          </p>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Create Organization
        </Button>
      </div>

      {isOrgAdmin && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Limited Access</AlertTitle>
          <AlertDescription>
            You are viewing your current organization only. Creating or managing multiple organizations requires Server Admin permissions.
          </AlertDescription>
        </Alert>
      )}

      {error && !error.includes('configuration') && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
        </div>
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>
                {isOrgAdmin ? 'Current Organization' : 'All Organizations'}
              </CardTitle>
              <CardDescription>
                {isOrgAdmin 
                  ? 'Details of your current organization'
                  : 'A list of all organizations in your Grafana instance'
                }
              </CardDescription>
            </div>
            {!isOrgAdmin && (
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
                  <Input
                    placeholder="Search organizations..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-8 w-64"
                  />
                </div>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
            </div>
          ) : (
            <OrganizationTable
              organizations={filteredOrganizations}
              onDelete={handleDelete}
              onEdit={handleEdit}
              loading={loading}
            />
          )}
        </CardContent>
      </Card>

      <OrganizationFormDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        onSubmit={handleCreate}
        title="Create Organization"
        description="Add a new organization to your Grafana instance"
      />

      <OrganizationFormDialog
        open={isEditDialogOpen}
        onOpenChange={(open) => {
          setIsEditDialogOpen(open);
          if (!open) setSelectedOrg(null);
        }}
        onSubmit={handleUpdate}
        organization={selectedOrg}
        title="Edit Organization"
        description="Update organization details"
      />
    </div>
  );
}

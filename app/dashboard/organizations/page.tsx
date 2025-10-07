'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PlusCircle, Search, AlertCircle } from 'lucide-react';
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
    <div className="space-y-4 sm:space-y-6 lg:space-y-8 w-full overflow-hidden">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
        <div className="space-y-1 sm:space-y-2">
          <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-foreground">Organization Management</h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Manage organizations and their settings
          </p>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)} className="w-full sm:w-auto h-9 sm:h-10 md:h-11 px-4 sm:px-5 md:px-6 text-xs sm:text-sm rounded-lg whitespace-nowrap">
          <PlusCircle className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4 font-black" />
          Create Organization
        </Button>
      </div>

      {/* {isOrgAdmin && (
        <Alert className="p-3 sm:p-4">
          <AlertCircle className="h-3 w-3 sm:h-4 sm:w-4" />
          <AlertTitle className="text-xs sm:text-sm">Limited Access</AlertTitle>
          <AlertDescription className="text-xs sm:text-sm">
            You are viewing your current organization only. Creating or managing multiple organizations requires Server Admin permissions.
          </AlertDescription>
        </Alert>
      )} */}

      {error && !error.includes('configuration') && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 sm:p-4">
          <p className="text-xs sm:text-sm text-red-800 dark:text-red-200">{error}</p>
        </div>
      )}

      <Card className=" border-gray-200 dark:border-gray-800 border-0 shadow-none">
        <CardContent className="!p-0">
          {error && organizations.length === 0 && (
            <GrafanaSetupError error={error} />
          )}

          {!error && (
            <>
              {!isOrgAdmin && (
                <div className="mb-4 sm:mb-6">
                  <div className="relative w-full sm:max-w-md">
                    <Search className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 h-3 w-3 sm:h-4 sm:w-4 text-gray-400" />
                    <Input
                      placeholder="Search organizations..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9 sm:pl-12 h-10 sm:h-11 md:h-12 text-xs sm:text-sm border-input rounded-lg w-full"
                    />
                  </div>
                </div>
              )}

              {loading && organizations.length === 0 ? (
                <div className="text-center py-12 sm:py-16 text-muted-foreground">
                  <div className="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-xs sm:text-sm">Loading organizations...</p>
                </div>
              ) : (
                <OrganizationTable
                  organizations={filteredOrganizations}
                  onDelete={handleDelete}
                  onEdit={handleEdit}
                  loading={loading}
                />
              )}
            </>
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

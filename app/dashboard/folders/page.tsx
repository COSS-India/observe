'use client';

import { useEffect, useState } from 'react';
import { Plus, RefreshCw } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FolderTable } from '@/components/folders/FolderTable';
import { FolderFormDialog } from '@/components/folders/FolderFormDialog';
import { FolderTeamsManager } from '@/components/folders/FolderTeamsManager';
import { FolderDashboardsManager } from '@/components/folders/FolderDashboardsManager';
import { Pagination } from '@/components/ui/pagination';
import { useGrafanaFolders } from '@/hooks/useGrafanaFolders';
import { useAuthStore } from '@/lib/store/authStore';
import type { DashboardFolder } from '@/types/grafana';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

type ViewMode = 'list' | 'manage-teams' | 'manage-dashboards';

export default function FoldersPage() {
  const { user } = useAuthStore();
  const {
    folders,
    loading,
    fetchFolders,
    createFolder,
    updateFolder,
    deleteFolder,
  } = useGrafanaFolders();

  const [searchQuery, setSearchQuery] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedFolder, setSelectedFolder] = useState<DashboardFolder | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [folderToDelete, setFolderToDelete] = useState<DashboardFolder | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [managingFolder, setManagingFolder] = useState<DashboardFolder | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(9);

  
  useEffect(() => {
    fetchFolders();
  }, [fetchFolders]);

  // Determine if user is admin or superadmin
  const isAdmin = user?.role === 'admin' || user?.role === 'superadmin';

  // All users can see all folders now (no user mapping filtering)
  const displayFolders = folders;

  const handleCreateOrUpdate = async (data: { title: string }) => {
    if (selectedFolder) {
      await updateFolder(selectedFolder.uid, {
        title: data.title,
        version: selectedFolder.version,
      });
    } else {
      await createFolder(data);
    }
    setIsDialogOpen(false);
    setSelectedFolder(null);
  };

  const handleEdit = (folder: DashboardFolder) => {
    setSelectedFolder(folder);
    setIsDialogOpen(true);
  };

  const handleDeleteClick = (folder: DashboardFolder) => {
    setFolderToDelete(folder);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (folderToDelete) {
      await deleteFolder(folderToDelete.uid);
      setIsDeleteDialogOpen(false);
      setFolderToDelete(null);
    }
  };

  const handleManageTeams = (folder: DashboardFolder) => {
    setManagingFolder(folder);
    setViewMode('manage-teams');
  };

  const handleManageDashboards = (folder: DashboardFolder) => {
    setManagingFolder(folder);
    setViewMode('manage-dashboards');
  };

  const handleBackToList = () => {
    setViewMode('list');
    setManagingFolder(null);
    fetchFolders(); // Refresh the list
  };

  // Apply search filter to the folders
  const filteredFolders = displayFolders.filter((folder: DashboardFolder) =>
    folder.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Pagination logic
  const totalItems = filteredFolders.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedFolders = filteredFolders.slice(startIndex, endIndex);

  // Reset to first page when search query changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  // Show loading indicator
  const isLoading = loading;

  // Show team manager if in that mode
  if (viewMode === 'manage-teams' && managingFolder) {
    return <FolderTeamsManager folder={managingFolder} onBack={handleBackToList} />;
  }

  // Show dashboard manager if in that mode
  if (viewMode === 'manage-dashboards' && managingFolder) {
    return <FolderDashboardsManager folder={managingFolder} onBack={handleBackToList} />;
  }

  return (
    <div className="space-y-4 sm:space-y-6 lg:space-y-8 w-full overflow-hidden">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
        <div className="space-y-1 sm:space-y-2">
          <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-foreground">Folders</h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Manage your Grafana Folders
          </p>
        </div>
        <div className="flex gap-2 sm:gap-3 w-full sm:w-auto">
          {/* <Button
            variant="outline"
            size="icon"
            onClick={fetchFolders}
            disabled={isLoading}
            className="h-9 w-9 sm:h-10 sm:w-10 md:h-11 md:w-11 border-input hover:bg-accent rounded-lg flex-shrink-0"
          >
            <RefreshCw className={`h-3 w-3 sm:h-4 sm:w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button> */}
          {isAdmin && (
            <Button
              onClick={() => {
                setSelectedFolder(null);
                setIsDialogOpen(true);
              }}
              className="h-9 sm:h-10 md:h-11 px-4 sm:px-5 md:px-6 text-xs sm:text-sm bg-primary hover:bg-blue-700 text-white font-medium rounded-lg flex-1 sm:flex-initial whitespace-nowrap"
            >
              <Plus className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
              New Folder
            </Button>
          )}
        </div>
      </div>

      <Card className=" border-gray-200 dark:border-gray-800 dark:bg-transparent border-0 shadow-none">
        <CardContent className="!p-0">
          <div className="mb-4 sm:mb-6">
            <Input
              placeholder="Search folders..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full sm:max-w-md h-10 sm:h-11 md:h-12 text-xs sm:text-sm border-input rounded-lg"
            />
          </div>

          {isLoading && displayFolders.length === 0 ? (
            <div className="text-center py-12 sm:py-16 text-muted-foreground">
              <div className="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-xs sm:text-sm">Loading folders...</p>
            </div>
          ) : filteredFolders.length === 0 ? (
            <div className="text-center py-12 sm:py-16 text-muted-foreground">
              {searchQuery ? 'No folders found matching your search.' : 'No folders available.'}
            </div>
          ) : (
            <>
              <FolderTable
                folders={paginatedFolders}
                onEdit={isAdmin ? handleEdit : undefined}
                onDelete={isAdmin ? handleDeleteClick : undefined}
                onManageTeams={handleManageTeams}
                onManageDashboards={handleManageDashboards}
              />
              {totalPages > 1 && (
                <div className="mt-6 px-4 sm:px-6">
                  <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={setCurrentPage}
                    itemsPerPage={itemsPerPage}
                    totalItems={totalItems}
                    onItemsPerPageChange={setItemsPerPage}
                  />
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {isAdmin && (
        <>
          <FolderFormDialog
            open={isDialogOpen}
            onOpenChange={setIsDialogOpen}
            onSubmit={handleCreateOrUpdate}
            folder={selectedFolder}
          />

          <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete the folder &quot;{folderToDelete?.title}&quot;.
                  This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDeleteConfirm}>
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </>
      )}
    </div>
  );
}

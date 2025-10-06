'use client';

import { useEffect, useState } from 'react';
import { Plus, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FolderTable } from '@/components/folders/FolderTable';
import { FolderFormDialog } from '@/components/folders/FolderFormDialog';
import { useGrafanaFolders } from '@/hooks/useGrafanaFolders';
import { useUserDashboardMapping } from '@/hooks/useUserDashboardMapping';
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

  // Get user-filtered folders
  const {
    filteredFolders: userAccessibleFolders,
    isReady: isMappingReady,
  } = useUserDashboardMapping();

  const [searchQuery, setSearchQuery] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedFolder, setSelectedFolder] = useState<DashboardFolder | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [folderToDelete, setFolderToDelete] = useState<DashboardFolder | null>(null);

  useEffect(() => {
    fetchFolders();
  }, [fetchFolders]);

  // Determine if user is admin
  const isAdmin = user?.role === 'admin';

  // Get folders filtered by user permissions (admins see all folders)
  const displayFolders = isAdmin ? folders : userAccessibleFolders;

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

  // Apply search filter to the folders the user can access
  const filteredFolders = displayFolders.filter((folder) =>
    folder.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Show loading indicator if either folders or mapping is not ready
  const isLoading = loading || !isMappingReady;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard Folders</h1>
          <p className="text-muted-foreground">
            {isAdmin 
              ? 'Manage your Grafana dashboard folders' 
              : 'Your accessible dashboard folders'}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={fetchFolders}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
          {isAdmin && (
            <Button
              onClick={() => {
                setSelectedFolder(null);
                setIsDialogOpen(true);
              }}
            >
              <Plus className="mr-2 h-4 w-4" />
              New Folder
            </Button>
          )}
        </div>
      </div>

      <div className="flex items-center gap-4">
        <Input
          placeholder="Search folders..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="max-w-sm"
        />
      </div>

      {isLoading && displayFolders.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          Loading folders...
        </div>
      ) : filteredFolders.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          {searchQuery ? 'No folders found matching your search.' : 'No folders available.'}
        </div>
      ) : (
        <FolderTable
          folders={filteredFolders}
          onEdit={isAdmin ? handleEdit : undefined}
          onDelete={isAdmin ? handleDeleteClick : undefined}
        />
      )}

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

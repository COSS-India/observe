"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useGrafanaDashboards } from "@/hooks/useGrafanaDashboards";
import { isSuperAdmin } from "@/lib/utils/permissions";
import { DashboardGrid } from "@/components/dashboards/DashboardGrid";
import { DashboardViewer } from "@/components/dashboards/DashboardViewer";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Search, ArrowLeft, Grid3x3, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { Dashboard } from "@/types/grafana";

export default function AllDashboardsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const {
    dashboards,
    loading: dashboardsLoading,
    error,
    fetchDashboards,
  } = useGrafanaDashboards();

  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "viewer">("grid");
  const [selectedDashboard, setSelectedDashboard] = useState<Dashboard | null>(
    null
  );
  const [dashboardToDelete, setDashboardToDelete] = useState<Dashboard | null>(
    null
  );
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [deleteMessage, setDeleteMessage] = useState("");

  // Check if user is superadmin
  const isUserSuperAdmin = isSuperAdmin(user);

  // Redirect non-superadmin users
  useEffect(() => {
    if (user && !isUserSuperAdmin) {
      router.push("/dashboard/my-dashboards");
    }
  }, [user, isUserSuperAdmin, router]);

  // Fetch all dashboards on mount
  useEffect(() => {
    if (isUserSuperAdmin) {
      console.log("🔄 Fetching all dashboards for superadmin");
      fetchDashboards();
    }
  }, [isUserSuperAdmin, fetchDashboards]);

  // Filter and deduplicate dashboards
  const filteredDashboards = dashboards
    .filter((dashboard: Dashboard) =>
      dashboard.title.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .filter(
      (dashboard: Dashboard, index: number, self: Dashboard[]) =>
        index === self.findIndex((d) => d.uid === dashboard.uid)
    );

  const handleView = (dashboard: Dashboard) => {
    setSelectedDashboard(dashboard);
    setViewMode("viewer");
  };

  const handleDelete = (dashboard: Dashboard) => {
    setDashboardToDelete(dashboard);
    setShowDeleteDialog(true);
  };

  const confirmDelete = async () => {
    if (!dashboardToDelete) return;

    try {
      const response = await fetch(
        `/api/grafana/dashboards/${dashboardToDelete.uid}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        throw new Error("Failed to delete dashboard");
      }

      // Refresh the dashboards list
      fetchDashboards();

      // Show success message
      setDeleteMessage(
        `Dashboard "${dashboardToDelete.title}" has been deleted successfully`
      );
      setShowSuccessDialog(true);
    } catch (error) {
      console.error("Error deleting dashboard:", error);
      setDeleteMessage(
        `Failed to delete dashboard: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
      setShowSuccessDialog(true);
    } finally {
      setShowDeleteDialog(false);
      setDashboardToDelete(null);
    }
  };

  const handleBackToGrid = () => {
    setViewMode("grid");
    setSelectedDashboard(null);
  };

  // If not superadmin, don't render anything (will redirect)
  if (!user || !isUserSuperAdmin) {
    return null;
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex-shrink-0 border-b border-border bg-background mb-4 lg:mb-4">
        <div className="">
          <div className="flex items-center justify-between">
            <div className="flex items-center w-full ">
              {viewMode === "viewer" ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleBackToGrid}
                  className="gap-2 text-xs border-0 shadow-none"
                >
                  <ArrowLeft className="h-3 w-3" />
                  Back to Grid
                </Button>
              ) : (
                <div className="mb-4">
                  <h1 className="text-xl sm:text-2xl font-bold text-foreground mb-1">
                    All Dashboards
                  </h1>
                  {/* <p className="text-sm text-muted-foreground mt-1">
                    View all dashboards across the entire Grafana instance
                  </p> */}
                </div>
              )}
            </div>
            {/* {viewMode === "grid" && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Grid3x3 className="h-4 w-4" />
                <span className="font-medium">
                  {filteredDashboards.length} dashboard
                  {filteredDashboards.length !== 1 ? "s" : ""}
                </span>
              </div>
            )} */}
          </div>

          {/* Search Bar - Only show in grid mode */}
          {viewMode === "grid" && (
            <div className="relative mb-3">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search dashboards..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 text-sm"
              />
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        {viewMode === "grid" ? (
          <div className="">
            {dashboardsLoading ? (
              <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : error ? (
              <div className="text-center py-12">
                <p className="text-red-600 dark:text-red-400">{error}</p>
              </div>
            ) : filteredDashboards.length === 0 ? (
              <div className="text-center py-12">
                <Grid3x3 className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-2 text-sm font-semibold text-foreground">
                  No dashboards found
                </h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  {searchQuery
                    ? "Try adjusting your search query"
                    : "No dashboards available in the system"}
                </p>
              </div>
            ) : (
              <DashboardGrid
                dashboards={filteredDashboards}
                onView={handleView}
                onDelete={handleDelete}
              />
            )}
          </div>
        ) : (
          selectedDashboard && (
            <DashboardViewer
              dashboardUid={selectedDashboard.uid}
              title={selectedDashboard.title}
            />
          )
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Dashboard</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{dashboardToDelete?.title}
              &quot;? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDashboardToDelete(null)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Success/Error Message Dialog */}
      <AlertDialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {deleteMessage.includes("successfully") ? "Success" : "Error"}
            </AlertDialogTitle>
            <AlertDialogDescription>{deleteMessage}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setShowSuccessDialog(false)}>
              OK
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

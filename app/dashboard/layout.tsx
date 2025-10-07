'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Sidebar } from '@/components/layout/Sidebar';
import { TopBar } from '@/components/layout/TopBar';
import { Toaster } from '@/components/ui/sonner';
import { hasAccessToRoute } from '@/lib/utils/permissions';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAuthenticated, user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    // Add a small delay to allow Zustand to rehydrate from localStorage
    const checkAuth = setTimeout(() => {
      if (!isAuthenticated) {
        console.warn('User not authenticated, redirecting to login');
        router.push('/login');
        return;
      }

      // Check if user has access to current route
      if (!hasAccessToRoute(user, pathname)) {
        console.log('User does not have access to route:', pathname);
        router.push('/dashboard/my-dashboards');
      }
    }, 100); // Small delay to allow hydration

    return () => clearTimeout(checkAuth);
  }, [isAuthenticated, user, pathname, router]);

  // Show loading state while checking authentication
  if (!isAuthenticated) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-gray-100 mx-auto"></div>
          <p className="mt-2 text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex overflow-hidden">
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <TopBar setSidebarOpen={setSidebarOpen} />
        <main className="flex-1 overflow-y-auto overflow-x-hidden bg-white dark:bg-gray-950">
          <div className="px-3 py-3 sm:px-4 sm:py-4 md:px-6 md:py-4 lg:px-8 lg:py-6 max-w-full">
            {children}
          </div>
        </main>
      </div>
      <Toaster />
    </div>
  );
}

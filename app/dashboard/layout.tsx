'use client';

import { useEffect } from 'react';
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
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar />
        <main className="flex-1 overflow-y-auto bg-gray-100 dark:bg-gray-950">
          <div className="container mx-auto px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
            {children}
          </div>
        </main>
      </div>
      <Toaster />
    </div>
  );
}

'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Building2, UsersRound, Layout } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { isSuperAdmin } from '@/lib/utils/permissions';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

const stats = [
  {
    title: 'Total Users',
    value: '0',
    icon: Users,
    href: '/dashboard/users',
    description: 'Manage Grafana users',
    requiresSuperAdmin: true,
  },
  {
    title: 'Organizations',
    value: '0',
    icon: Building2,
    href: '/dashboard/organizations',
    description: 'Manage organizations',
    requiresSuperAdmin: true,
  },
  {
    title: 'Teams',
    value: '0',
    icon: UsersRound,
    href: '/dashboard/teams',
    description: 'Manage teams',
    requiresSuperAdmin: true,
  },
  {
    title: 'Dashboards',
    value: '0',
    icon: Layout,
    href: '/dashboard/my-dashboards',
    description: 'View dashboards',
    requiresSuperAdmin: false,
  },
];

export default function DashboardPage() {
  const { user } = useAuth();
  const router = useRouter();
  const isUserSuperAdmin = isSuperAdmin(user);

  // Redirect non-superadmin users to My Dashboards
  useEffect(() => {
    if (!isUserSuperAdmin) {
      router.push('/dashboard/my-dashboards');
    }
  }, [isUserSuperAdmin, router]);

  // Filter stats based on permissions
  const visibleStats = stats.filter(stat => {
    if (stat.requiresSuperAdmin) {
      return isUserSuperAdmin;
    }
    return true;
  });

  // If not superadmin, don't render (they'll be redirected)
  if (!isUserSuperAdmin) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-2">
          Overview of your Grafana management system
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {visibleStats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title} className="hover:shadow-lg transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  {stat.title}
                </CardTitle>
                <Icon className="h-4 w-4 text-gray-500 dark:text-gray-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {stat.description}
                </p>
                <Link href={stat.href}>
                  <Button variant="link" className="px-0 mt-2">
                    View all →
                  </Button>
                </Link>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common tasks and operations</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Link href="/dashboard/users/create">
              <Button variant="outline" className="w-full justify-start">
                <Users className="mr-2 h-4 w-4" />
                Create New User
              </Button>
            </Link>
            <Link href="/dashboard/organization-users">
              <Button variant="outline" className="w-full justify-start">
                <Users className="mr-2 h-4 w-4" />
                View Organization Users
              </Button>
            </Link>
            <Link href="/dashboard/organizations/create">
              <Button variant="outline" className="w-full justify-start">
                <Building2 className="mr-2 h-4 w-4" />
                Create Organization
              </Button>
            </Link>
            <Link href="/dashboard/teams/create">
              <Button variant="outline" className="w-full justify-start">
                <UsersRound className="mr-2 h-4 w-4" />
                Create Team
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest actions and updates</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              No recent activity to display
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

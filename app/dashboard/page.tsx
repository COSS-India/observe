'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Building2, UsersRound, Layout } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { isSuperAdmin } from '@/lib/utils/permissions';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { MetricCard } from '@/components/MetricCard';

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
    <div className="space-normal">
      <div className="space-tight">
        <h1 className="text-heading-1 text-foreground">Dashboard</h1>
        <p className="text-body text-gray-600">
          Overview of your Grafana management system
        </p>
      </div>

      <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
        {visibleStats.map((stat) => (
          <MetricCard
            key={stat.title}
            sectionLabel={stat.title}
            primaryMetric={stat.value}
            metricLabel={stat.description}
            actionButtons={[
              {
                label: 'View all →',
                href: stat.href,
                variant: 'outline',
              },
            ]}
          />
        ))}
      </div>

      <div className="grid gap-8 md:grid-cols-2">
        <Card className="card-widget">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common tasks and operations</CardDescription>
          </CardHeader>
          <CardContent className="p-12 space-normal">
            <Link href="/dashboard/users/create">
              <Button variant="outline" className="w-full justify-start h-12 px-6 border-border hover:bg-accent rounded-lg">
                <span className="truncate">Create New User</span>
                <Users className="ml-2 h-4 w-4 flex-shrink-0" />
              </Button>
            </Link>
            <Link href="/dashboard/organization-users">
              <Button variant="outline" className="w-full justify-start h-12 px-6 border-border hover:bg-accent rounded-lg">
                <span className="truncate">View Organization Users</span>
                <Users className="ml-2 h-4 w-4 flex-shrink-0" />
              </Button>
            </Link>
            <Link href="/dashboard/organizations/create">
              <Button variant="outline" className="w-full justify-start h-12 px-6 border-border hover:bg-accent rounded-lg">
                <span className="truncate">Create Organization</span>
                <Building2 className="ml-2 h-4 w-4 flex-shrink-0" />
              </Button>
            </Link>
            <Link href="/dashboard/teams/create">
              <Button variant="outline" className="w-full justify-start h-12 px-6 border-border hover:bg-accent rounded-lg">
                <span className="truncate">Create Team</span>
                <UsersRound className="ml-2 h-4 w-4 flex-shrink-0" />
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="card-widget">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest actions and updates</CardDescription>
          </CardHeader>
          <CardContent className="p-12">
            <p className="text-body text-muted-foreground">
              No recent activity to display
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

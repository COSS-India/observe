'use client';

import { useRouter } from 'next/navigation';
import { useGrafanaUsers } from '@/hooks/useGrafanaUsers';
import { UserForm } from '@/components/users/UserForm';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Building2 } from 'lucide-react';
import Link from 'next/link';
import type { CreateUserFormData } from '@/lib/utils/validators';
import { useOrgContextStore } from '@/lib/store/orgContextStore';
import { useAuth } from '@/hooks/useAuth';
import { isSuperAdmin } from '@/lib/utils/permissions';

export default function CreateUserPage() {
  const router = useRouter();
  const { createUser, loading } = useGrafanaUsers();
  const { selectedOrgId, selectedOrgName } = useOrgContextStore();
  const { user } = useAuth();
  const isUserSuperAdmin = isSuperAdmin(user);

  const handleSubmit = async (data: CreateUserFormData) => {
    try {
      await createUser(data);
      router.push('/dashboard/users');
    } catch (error) {
      console.error('Failed to create user:', error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="">

        <Link href="/dashboard/users" className='flex items-center '>

          <Button variant="ghost" size="sm" className="px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-800">
            <ArrowLeft className="ml-2 h-4 w-4" />

            Back to Users
          </Button>
        </Link>
      </div>
      <Card className="border-0 !shadow-none  ">
        <CardHeader className="pb-6">
          <CardTitle className="text-lg font-medium">Create New User</CardTitle>
          <CardDescription className="text-sm text-muted-foreground">
          Add a new user to your Grafana instance
          </CardDescription>
          {/* Show organization context for super admins */}
          {isUserSuperAdmin && (
            <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900 rounded-lg">
              <div className="flex items-center gap-2 text-sm">
                <Building2 className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                <span className="font-medium text-blue-900 dark:text-blue-100">
                  {selectedOrgId 
                    ? `User will be created in: ${selectedOrgName}` 
                    : 'User will be created globally'}
                </span>
              </div>
            </div>
          )}
        </CardHeader>
        <CardContent className="pt-0">
          <UserForm onSubmit={handleSubmit} loading={loading} />
        </CardContent>
      </Card>
    </div>
  );
}

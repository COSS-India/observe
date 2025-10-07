'use client';

import { useRouter } from 'next/navigation';
import { useGrafanaUsers } from '@/hooks/useGrafanaUsers';
import { UserForm } from '@/components/users/UserForm';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import type { CreateUserFormData } from '@/lib/utils/validators';

export default function CreateUserPage() {
  const router = useRouter();
  const { createUser, loading } = useGrafanaUsers();

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
        </CardHeader>
        <CardContent className="pt-0">
          <UserForm onSubmit={handleSubmit} loading={loading} />
        </CardContent>
      </Card>
    </div>
  );
}

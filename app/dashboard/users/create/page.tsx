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
    <div className="space-y-6 max-w-2xl">
      <div>
        <Link href="/dashboard/users">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Users
          </Button>
        </Link>
      </div>

      <div>
        <h1 className="text-3xl font-bold">Create New User</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-2">
          Add a new user to your Grafana instance
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>User Details</CardTitle>
          <CardDescription>
            Fill in the details below to create a new Grafana user
          </CardDescription>
        </CardHeader>
        <CardContent>
          <UserForm onSubmit={handleSubmit} loading={loading} />
        </CardContent>
      </Card>
    </div>
  );
}

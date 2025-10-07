'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { createUserSchema, type CreateUserFormData } from '@/lib/utils/validators';

interface UserFormProps {
  onSubmit: (data: CreateUserFormData) => Promise<void>;
  loading?: boolean;
  defaultValues?: Partial<CreateUserFormData>;
}

export function UserForm({ onSubmit, loading = false, defaultValues }: UserFormProps) {
  const form = useForm<CreateUserFormData>({
    resolver: zodResolver(createUserSchema),
    defaultValues: {
      name: '',
      email: '',
      login: '',
      password: '',
      ...defaultValues,
    },
  });

  const handleSubmit = async (data: CreateUserFormData) => {
    await onSubmit(data);
    form.reset();
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm font-medium text-foreground px-0">Name</FormLabel>
              <FormDescription className="text-xs text-muted-foreground">Full name of the user</FormDescription>
              <FormControl>
                <Input
                  placeholder="John Doe"
                  {...field}
                  disabled={loading}
                  className="h-11 border-input rounded-lg focus:ring-2 focus:ring-ring"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm font-medium text-foreground px-0">Email</FormLabel>
              <FormDescription className="text-xs text-muted-foreground">Email address for the user</FormDescription>
              <FormControl>
                <Input
                  type="email"
                  placeholder="john.doe@example.com"
                  {...field}
                  disabled={loading}
                  className="h-11 border-input rounded-lg focus:ring-2 focus:ring-ring"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="login"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm font-medium text-foreground px-0">Login Username</FormLabel>
              <FormDescription className="text-xs text-muted-foreground">Username for logging into Grafana</FormDescription>
              <FormControl>
                <Input
                  placeholder="johndoe"
                  {...field}
                  disabled={loading}
                  className="h-11 border-input rounded-lg focus:ring-2 focus:ring-ring"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm font-medium text-foreground px-0">Password</FormLabel>
              <FormDescription className="text-xs text-muted-foreground">Minimum 8 characters</FormDescription>
              <FormControl>
                <Input
                  type="password"
                  placeholder="••••••••"
                  {...field}
                  disabled={loading}
                  className="h-11 border-input rounded-lg focus:ring-2 focus:ring-ring"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button
          type="submit"
          disabled={loading}
          className="w-full h-11 rounded-lg"
        >
          {loading ? 'Creating...' : 'Create User'}
        </Button>
      </form>
    </Form>
  );
}

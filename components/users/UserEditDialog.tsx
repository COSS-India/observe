'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import type { GrafanaUser } from '@/types/grafana';

const userEditSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email address'),
  login: z.string().min(1, 'Login is required'),
  role: z.enum(['Admin', 'Editor', 'Viewer']),
});

type UserEditFormData = z.infer<typeof userEditSchema>;

interface UserEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: UserEditFormData) => Promise<void>;
  user: GrafanaUser | null;
}

export function UserEditDialog({
  open,
  onOpenChange,
  onSubmit,
  user,
}: UserEditDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<UserEditFormData>({
    resolver: zodResolver(userEditSchema),
    defaultValues: {
      name: '',
      email: '',
      login: '',
      role: 'Viewer',
    },
  });

  // Reset form when user changes
  useEffect(() => {
    if (open && user) {
      form.reset({
        name: user.name,
        email: user.email,
        login: user.login,
        role: (user.role || 'Viewer') as 'Admin' | 'Editor' | 'Viewer',
      });
    }
  }, [open, user, form]);

  const handleSubmit = async (data: UserEditFormData) => {
    try {
      setIsSubmitting(true);
      await onSubmit(data);
      onOpenChange(false);
    } catch (error) {
      console.error('Form submission error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit User</DialogTitle>
          <DialogDescription>
            Update user information and role
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium text-foreground">Full Name</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="John Doe"
                      {...field}
                      disabled={isSubmitting}
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
                  <FormLabel className="text-sm font-medium text-foreground">Email</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="john@example.com"
                      {...field}
                      disabled={isSubmitting}
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
                  <FormLabel className="text-sm font-medium text-foreground">Login/Username</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="johndoe"
                      {...field}
                      disabled={isSubmitting}
                      className="h-11 border-input rounded-lg focus:ring-2 focus:ring-ring"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium text-foreground">Role</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isSubmitting}>
                    <FormControl>
                      <SelectTrigger className="w-full h-11 border-input rounded-lg focus:ring-2 focus:ring-ring">
                        <SelectValue placeholder="Select a role" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Admin">Admin</SelectItem>
                      <SelectItem value="Editor">Editor</SelectItem>
                      <SelectItem value="Viewer">Viewer</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
                className="h-11 px-6 border-input hover:bg-accent rounded-lg"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="h-11 px-6 font-medium rounded-lg"
              >
                {isSubmitting ? 'Updating...' : 'Update User'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

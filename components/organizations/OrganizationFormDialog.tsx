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
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import type { Organization } from '@/types/grafana';

const orgSchema = z.object({
  name: z.string().min(1, 'Organization name is required'),
});

type OrgFormData = z.infer<typeof orgSchema>;

interface OrganizationFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: OrgFormData) => Promise<void>;
  organization?: Organization | null;
  title?: string;
  description?: string;
}

export function OrganizationFormDialog({
  open,
  onOpenChange,
  onSubmit,
  organization,
  title = 'Create Organization',
  description = 'Add a new organization',
}: OrganizationFormDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<OrgFormData>({
    resolver: zodResolver(orgSchema),
    defaultValues: {
      name: '',
    },
  });

  // Reset form when dialog opens/closes or organization changes
  useEffect(() => {
    if (open) {
      if (organization) {
        form.reset({
          name: organization.name,
        });
      } else {
        form.reset({
          name: '',
        });
      }
    }
  }, [open, organization, form]);

  const handleSubmit = async (data: OrgFormData) => {
    try {
      setIsSubmitting(true);
      await onSubmit(data);
      form.reset();
      onOpenChange(false);
    } catch (error) {
      // Error handling is done in the parent component
      console.error('Form submission error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium text-foreground">Organization Name</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="My Organization"
                      {...field}
                      disabled={isSubmitting}
                      className="h-11 border-input rounded-lg focus:ring-2 focus:ring-ring"
                    />
                  </FormControl>
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
                className="h-11 px-6 bg-primary hover:bg-blue-700 text-white font-medium rounded-lg"
              >
                {isSubmitting ? 'Saving...' : organization ? 'Update Organization' : 'Create Organization'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

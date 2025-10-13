'use client';

import { useEffect } from 'react';
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
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import type { DashboardFolder } from '@/types/grafana';

const folderFormSchema = z.object({
  title: z.string().min(1, 'Title is required'),
});

type FolderFormValues = z.infer<typeof folderFormSchema>;

interface FolderFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: FolderFormValues) => Promise<void>;
  folder?: DashboardFolder | null;
}

export function FolderFormDialog({
  open,
  onOpenChange,
  onSubmit,
  folder,
}: FolderFormDialogProps) {
  const form = useForm<FolderFormValues>({
    resolver: zodResolver(folderFormSchema),
    defaultValues: {
      title: folder?.title || '',
    },
  });

  // Reset form when folder changes
  useEffect(() => {
    form.reset({
      title: folder?.title || '',
    });
  }, [folder, form]);

  const handleSubmit = async (data: FolderFormValues) => {
    await onSubmit(data);
    form.reset();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{folder ? 'Edit Folder' : 'Create Folder'}</DialogTitle>
          <DialogDescription>
            {folder
              ? 'Update the folder details below.'
              : 'Create a new dashboard folder.'}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium text-foreground">Title</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="My Dashboard Folder"
                      {...field}
                      disabled={form.formState.isSubmitting}
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
                onClick={() => {
                  form.reset();
                  onOpenChange(false);
                }}
                disabled={form.formState.isSubmitting}
                className="h-11 px-6 border-input hover:bg-accent rounded-lg"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={form.formState.isSubmitting}
                className="h-11 px-6 bg-primary hover:bg-blue-700 text-white font-medium rounded-lg"
              >
                {form.formState.isSubmitting
                  ? 'Saving...'
                  : folder
                  ? 'Update'
                  : 'Create'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

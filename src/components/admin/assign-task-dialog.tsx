'use client';

import { useMemo, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  SearchablePicker,
  type SearchablePickerOption,
} from '@/components/admin/shared/searchable-picker';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useAdminUsers } from '@/queries/platform';
import { useAssignTask } from '@/queries/notifications';
import { assignTaskSchema, type AssignTaskInput } from '@/schemas/tasks';

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

/**
 * Assign a task with a deadline to a named colleague — e.g. "Scorah, follow up on the
 * Twara EV batch, due Friday." There was no such concept anywhere before this; it rides
 * on the notification system rather than a new model (see NotificationsService.assignTask
 * in uza-mobility-bn).
 */
export function AssignTaskDialog({ open, onOpenChange }: Props) {
  const users = useAdminUsers();
  const assign = useAssignTask();
  const [search, setSearch] = useState('');

  const { register, handleSubmit, formState, setValue, control, reset } =
    useForm<AssignTaskInput>({ resolver: zodResolver(assignTaskSchema) });
  const errors = formState.errors;
  const assigneeUserId = useWatch({ control, name: 'assigneeUserId' });

  const options = useMemo<SearchablePickerOption[]>(() => {
    if (!users.data) return [];
    const needle = search.trim().toLowerCase();
    return users.data
      .filter((u) => {
        if (!needle) return true;
        const name = [u.firstName, u.lastName, u.email].filter(Boolean).join(' ').toLowerCase();
        return name.includes(needle);
      })
      .slice(0, 30)
      .map((u) => ({
        value: u.id,
        label: [u.firstName, u.lastName].filter(Boolean).join(' ') || u.email,
        hint: u.email,
      }));
  }, [users.data, search]);

  const selected = users.data?.find((u) => u.id === assigneeUserId);

  const close = () => {
    onOpenChange(false);
    reset();
    setSearch('');
  };

  const submit = handleSubmit(async (values) => {
    // The <input type="datetime-local"> value has no timezone offset — convert it to a
    // real ISO instant in the browser's own timezone before it leaves the client, so the
    // API (and whoever reads dueAt back) sees the deadline the person actually picked,
    // not that same wall-clock time reinterpreted in the server's timezone.
    await assign.mutateAsync({
      ...values,
      dueAt: new Date(values.dueAt).toISOString(),
    });
    close();
  });

  return (
    <Dialog open={open} onOpenChange={(next) => (next ? onOpenChange(true) : close())}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Assign a task</DialogTitle>
          <DialogDescription>
            They&apos;ll see it in their own task box, soonest deadline first.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={submit} className="space-y-4">
          <SearchablePicker
            label="Assign to *"
            value={assigneeUserId ?? ''}
            onValueChange={(value) =>
              setValue('assigneeUserId', value, { shouldValidate: true })
            }
            options={options}
            selectedOption={
              selected
                ? {
                    value: selected.id,
                    label: [selected.firstName, selected.lastName].filter(Boolean).join(' ') || selected.email,
                    hint: selected.email,
                  }
                : null
            }
            search={search}
            onSearchChange={setSearch}
            isLoading={users.isLoading}
            placeholder="Search by name or email…"
            error={errors.assigneeUserId?.message}
          />

          <div className="space-y-1.5">
            <Label htmlFor="task-title">Title *</Label>
            <Input
              id="task-title"
              placeholder="Follow up: Twara EV batch 1"
              {...register('title')}
            />
            {errors.title ? <p className="text-xs text-destructive">{errors.title.message}</p> : null}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="task-body">What needs to happen *</Label>
            <Textarea id="task-body" rows={3} {...register('body')} />
            {errors.body ? <p className="text-xs text-destructive">{errors.body.message}</p> : null}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="task-due">Deadline *</Label>
              <Input id="task-due" type="datetime-local" {...register('dueAt')} />
              {errors.dueAt ? <p className="text-xs text-destructive">{errors.dueAt.message}</p> : null}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="task-ref">Related to (optional)</Label>
              <Input id="task-ref" placeholder="e.g. batch:twara-ev-1" {...register('entityRef')} />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={close}>
              Cancel
            </Button>
            <Button type="submit" disabled={assign.isPending}>
              {assign.isPending ? 'Assigning…' : 'Assign task'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

'use client';

import { useState } from 'react';
import { AssignTaskDialog } from '@/components/admin/assign-task-dialog';
import { PageHeader } from '@/components/shared/page-header';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDateTime } from '@/lib/admin/format';
import { cn } from '@/lib/utils';
import { useCompleteTask, useMyTasks } from '@/queries/notifications';

/**
 * My task box. There was no "assign a work item with a deadline" concept anywhere before
 * this — see NotificationsService.assignTask in uza-mobility-bn. Anyone can assign a task
 * to a colleague (Assign task); this page shows only what was assigned to ME.
 */
export function AdminTasksPanel() {
  const [includeCompleted, setIncludeCompleted] = useState(false);
  const [assigning, setAssigning] = useState(false);
  const tasks = useMyTasks(includeCompleted);
  const complete = useCompleteTask();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <PageHeader
          title="My tasks"
          description="Work assigned to you, soonest deadline first."
        />
        <Button onClick={() => setAssigning(true)}>Assign task</Button>
      </div>

      <label className="flex w-fit cursor-pointer items-center gap-2 text-sm">
        <Checkbox
          checked={includeCompleted}
          onCheckedChange={(v) => setIncludeCompleted(v === true)}
        />
        Show completed
      </label>

      {tasks.isError ? (
        <p className="text-sm text-destructive">Failed to load tasks.</p>
      ) : null}

      {tasks.isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      ) : tasks.data && tasks.data.length > 0 ? (
        <ul className="space-y-3">
          {tasks.data.map((task) => (
            <li
              key={task.id}
              className={cn(
                'space-y-2 rounded-lg border p-4',
                task.isOverdue && 'border-destructive/50 bg-destructive/5',
              )}
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-medium">{task.title}</p>
                  <p className="text-sm text-muted-foreground">{task.body}</p>
                </div>
                <span
                  className={cn(
                    'shrink-0 text-xs font-medium',
                    task.isOverdue ? 'text-destructive' : 'text-muted-foreground',
                  )}
                >
                  {task.isOverdue ? 'Overdue — ' : 'Due '}
                  {formatDateTime(task.dueAt)}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Assigned by {task.assignedByName}</span>
                {task.completedAt ? (
                  <span>Done {formatDateTime(task.completedAt)}</span>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={complete.isPending}
                    onClick={() => complete.mutate(task.id)}
                  >
                    Mark done
                  </Button>
                )}
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="rounded-lg border py-10 text-center text-sm text-muted-foreground">
          No tasks assigned to you right now.
        </p>
      )}

      <AssignTaskDialog open={assigning} onOpenChange={setAssigning} />
    </div>
  );
}

'use client';

import { useState } from 'react';
import { TrainingCourseFormDialog } from '@/components/admin/training-course-form-dialog';
import { PageHeader } from '@/components/shared/page-header';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  useDeactivateTrainingCourse,
  useTrainingCourses,
} from '@/queries/training-courses';

/**
 * The technician-training catalog — Section 05. Shipped empty on purpose; entries come
 * from a real scouting pass or a real garage partner, never invented to look populated.
 */
export function AdminTrainingCoursesPanel() {
  const [creating, setCreating] = useState(false);
  const courses = useTrainingCourses();
  const deactivate = useDeactivateTrainingCourse();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <PageHeader
          title="Training courses"
          description="The technician-training catalog garages see on their own portal — Chinese OEM and locally-produced content, side by side."
        />
        <Button onClick={() => setCreating(true)}>Add course</Button>
      </div>

      <div className="overflow-x-auto rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Provider</TableHead>
              <TableHead>Source</TableHead>
              <TableHead>Language</TableHead>
              <TableHead>Category</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {courses.isLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 6 }).map((__, j) => (
                    <TableCell key={j}>
                      <Skeleton className="h-4 w-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : courses.data && courses.data.length > 0 ? (
              courses.data.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium">
                    {c.url ? (
                      <a href={c.url} target="_blank" rel="noreferrer" className="underline">
                        {c.title}
                      </a>
                    ) : (
                      c.title
                    )}
                  </TableCell>
                  <TableCell>{c.provider}</TableCell>
                  <TableCell className="text-sm">
                    {c.source === 'CHINESE_OEM' ? 'Chinese OEM' : 'Local Rwandan'}
                  </TableCell>
                  <TableCell className="text-sm">{c.language}</TableCell>
                  <TableCell className="text-sm">{c.category.replaceAll('_', ' ')}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={deactivate.isPending}
                      onClick={() => deactivate.mutate(c.id)}
                    >
                      Remove
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="py-10 text-center text-sm text-muted-foreground">
                  No courses yet. Add one, or wait on a real scouting pass to populate this
                  for real rather than guessing at content.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <TrainingCourseFormDialog open={creating} onOpenChange={setCreating} />
    </div>
  );
}

'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
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
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select';
import { Textarea } from '@/components/ui/textarea';
import { useCreateTrainingCourse } from '@/queries/training-courses';
import {
  createTrainingCourseSchema,
  type CreateTrainingCourseInput,
} from '@/schemas/training-courses';
import { trainingCourseSources } from '@/types/admin/training-courses';
import { workCategories } from '@/types/admin/mechanics';

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

/**
 * Manual entry into the technician-training catalog — see CreateTrainingCourseDto's doc
 * comment in uza-mobility-bn for why this is manual today rather than agent-populated.
 */
export function TrainingCourseFormDialog({ open, onOpenChange }: Props) {
  const create = useCreateTrainingCourse();
  const { register, handleSubmit, formState, reset } = useForm<CreateTrainingCourseInput>({
    resolver: zodResolver(createTrainingCourseSchema),
    defaultValues: { source: 'CHINESE_OEM', category: 'GENERAL' },
  });
  const errors = formState.errors;

  const close = () => {
    onOpenChange(false);
    reset();
  };

  const submit = handleSubmit(async (values) => {
    await create.mutateAsync(values);
    close();
  });

  return (
    <Dialog open={open} onOpenChange={(next) => (next ? onOpenChange(true) : close())}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Add a training course</DialogTitle>
          <DialogDescription>
            Surfaced to garages holding the matching category on their own portal.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="tc-title">Title *</Label>
            <Input id="tc-title" {...register('title')} />
            {errors.title ? <p className="text-xs text-destructive">{errors.title.message}</p> : null}
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="tc-provider">Provider *</Label>
              <Input id="tc-provider" placeholder="e.g. BYD Auto Academy" {...register('provider')} />
              {errors.provider ? (
                <p className="text-xs text-destructive">{errors.provider.message}</p>
              ) : null}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="tc-language">Language *</Label>
              <Input id="tc-language" placeholder="e.g. zh, with English subtitles" {...register('language')} />
              {errors.language ? (
                <p className="text-xs text-destructive">{errors.language.message}</p>
              ) : null}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="tc-source">Source *</Label>
              <NativeSelect id="tc-source" {...register('source')}>
                {trainingCourseSources.map((s) => (
                  <NativeSelectOption key={s} value={s}>
                    {s === 'CHINESE_OEM' ? 'Chinese OEM' : 'Local Rwandan'}
                  </NativeSelectOption>
                ))}
              </NativeSelect>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="tc-category">Category *</Label>
              <NativeSelect id="tc-category" {...register('category')}>
                {workCategories.map((c) => (
                  <NativeSelectOption key={c} value={c}>
                    {c.replaceAll('_', ' ')}
                  </NativeSelectOption>
                ))}
              </NativeSelect>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="tc-url">Link</Label>
            <Input id="tc-url" placeholder="https://…" {...register('url')} />
            {errors.url ? <p className="text-xs text-destructive">{errors.url.message}</p> : null}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="tc-notes">Notes</Label>
            <Textarea id="tc-notes" rows={2} {...register('notes')} />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={close}>
              Cancel
            </Button>
            <Button type="submit" disabled={create.isPending}>
              {create.isPending ? 'Adding…' : 'Add course'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

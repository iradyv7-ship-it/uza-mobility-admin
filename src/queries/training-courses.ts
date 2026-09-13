import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ApiClientError } from '@/lib/api/error';
import {
  createTrainingCourse,
  deactivateTrainingCourse,
  listTrainingCourses,
} from '@/lib/api/training-courses';
import type { CreateTrainingCourseInput } from '@/schemas/training-courses';

export const trainingCourseKeys = {
  all: ['training-courses'] as const,
  list: () => [...trainingCourseKeys.all, 'list'] as const,
};

function mutationError(error: unknown, fallback: string) {
  return error instanceof ApiClientError ? error.message : fallback;
}

export function useTrainingCourses() {
  return useQuery({
    queryKey: trainingCourseKeys.list(),
    queryFn: listTrainingCourses,
  });
}

export function useCreateTrainingCourse() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateTrainingCourseInput) => createTrainingCourse(body),
    onSuccess: () => {
      toast.success('Course added');
      void queryClient.invalidateQueries({ queryKey: trainingCourseKeys.all });
    },
    onError: (error) => toast.error(mutationError(error, 'Failed to add the course')),
  });
}

export function useDeactivateTrainingCourse() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deactivateTrainingCourse(id),
    onSuccess: () => {
      toast.success('Course removed from the active catalog');
      void queryClient.invalidateQueries({ queryKey: trainingCourseKeys.all });
    },
    onError: (error) => toast.error(mutationError(error, 'Failed to remove the course')),
  });
}

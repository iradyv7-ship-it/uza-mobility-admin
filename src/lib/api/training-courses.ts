import { authenticatedFetch } from '@/lib/api/authenticated';
import type { CreateTrainingCourseInput } from '@/schemas/training-courses';
import type { TrainingCourse } from '@/types/admin/training-courses';

export function listTrainingCourses() {
  return authenticatedFetch<TrainingCourse[]>('/workshop/training-courses');
}

export function createTrainingCourse(body: CreateTrainingCourseInput) {
  return authenticatedFetch<TrainingCourse>('/admin/training-courses', {
    method: 'POST',
    body: JSON.stringify({ ...body, url: body.url || undefined }),
  });
}

export function deactivateTrainingCourse(id: string) {
  return authenticatedFetch<TrainingCourse>(`/admin/training-courses/${id}/deactivate`, {
    method: 'PATCH',
  });
}

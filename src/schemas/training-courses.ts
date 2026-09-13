import { z } from 'zod';
import { trainingCourseSources } from '@/types/admin/training-courses';
import { workCategories } from '@/types/admin/mechanics';

export const createTrainingCourseSchema = z.object({
  title: z.string().min(3, 'Enter a title'),
  provider: z.string().min(2, 'Enter the provider'),
  source: z.enum(trainingCourseSources),
  language: z.string().min(1, 'Enter the language'),
  category: z.enum(workCategories),
  url: z.string().url('Enter a valid URL').optional().or(z.literal('')),
  notes: z.string().optional(),
});

export type CreateTrainingCourseInput = z.infer<typeof createTrainingCourseSchema>;

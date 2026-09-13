import { workCategories } from '@/types/admin/mechanics';

export const trainingCourseSources = ['CHINESE_OEM', 'LOCAL_RWANDAN'] as const;
export type TrainingCourseSource = (typeof trainingCourseSources)[number];

export { workCategories };

export type TrainingCourse = {
  id: string;
  title: string;
  provider: string;
  source: TrainingCourseSource;
  language: string;
  category: (typeof workCategories)[number];
  url: string | null;
  notes: string | null;
  addedByRef: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

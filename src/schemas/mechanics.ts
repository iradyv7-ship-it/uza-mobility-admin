import { z } from 'zod';
import {
  mechanicEngagements,
  mechanicLevels,
  workCategories,
} from '@/types/admin/mechanics';

export const registerMechanicSchema = z.object({
  name: z.string().min(2, 'Enter the partner/technician name'),
  engagement: z.enum(mechanicEngagements),
  level: z.enum(mechanicLevels),
  certifiedFor: z.array(z.enum(workCategories)).min(1, 'Select at least one category'),
  certifiedUntil: z.string().min(1, 'Set a certification expiry'),
  userId: z.string().optional(),
});

export type RegisterMechanicInput = z.infer<typeof registerMechanicSchema>;

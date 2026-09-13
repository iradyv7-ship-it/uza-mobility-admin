import { z } from 'zod';
import { assignableRoleNames } from '@/types/admin/platform';

export const createAdminAccountSchema = z.object({
  email: z.string().email('Enter a valid email'),
  firstName: z.string().min(1, 'Enter a first name'),
  lastName: z.string().min(1, 'Enter a last name'),
  phone: z.string().optional(),
  roles: z.array(z.enum(assignableRoleNames)).min(1, 'Select at least one role'),
});

export type CreateAdminAccountInput = z.infer<typeof createAdminAccountSchema>;

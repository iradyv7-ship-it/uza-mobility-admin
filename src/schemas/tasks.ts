import { z } from 'zod';

export const assignTaskSchema = z.object({
  assigneeUserId: z.string().min(1, 'Select who this is for'),
  title: z.string().min(3, 'Enter a short title').max(200),
  body: z.string().min(3, 'Say what needs to happen').max(2000),
  dueAt: z.string().min(1, 'Set a deadline'),
  entityRef: z.string().max(200).optional(),
});

export type AssignTaskInput = z.infer<typeof assignTaskSchema>;

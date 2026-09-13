import { z } from 'zod';
import { loanChangeTypes } from '@/types/admin/loans';

export const createLoanSchema = z
  .object({
    borrowerUserId: z.string().min(1, 'Select the borrower'),
    lenderKey: z.string().min(1, 'Select the lender'),
    vehiclePriceRwf: z.number().int().positive('Enter the vehicle price'),
    clientContributionRwf: z.number().int().min(0),
    tenorMonths: z.number().int().positive(),
    vehicle: z.object({
      chassisNumber: z.string().min(3, 'Enter the chassis / VIN'),
      make: z.string().optional(),
      model: z.string().optional(),
      year: z.number().int().min(1990).optional(),
      color: z.string().optional(),
      plate: z.string().optional(),
    }),
  })
  .refine((v) => v.clientContributionRwf < v.vehiclePriceRwf, {
    message: 'The contribution must be less than the vehicle price',
    path: ['clientContributionRwf'],
  });

export type CreateLoanInput = z.infer<typeof createLoanSchema>;

export const changeTenorSchema = z.object({
  newTenorMonths: z.number().int().positive(),
  reason: z.string().max(500).optional(),
});

export type ChangeTenorInput = z.infer<typeof changeTenorSchema>;

export const reviewLoanChangeSchema = z.object({
  approve: z.boolean(),
  reviewNote: z.string().max(1000).optional(),
});

export type ReviewLoanChangeInput = z.infer<typeof reviewLoanChangeSchema>;

export const requestLoanChangeSchema = z.object({
  changeType: z.enum(loanChangeTypes),
  payload: z.record(z.string(), z.unknown()),
  note: z.string().max(1000).optional(),
});

export type RequestLoanChangeInput = z.infer<typeof requestLoanChangeSchema>;

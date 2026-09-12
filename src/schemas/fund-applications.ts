import { z } from 'zod';
import {
  completionModes,
  genders,
  savingsLocations,
  vehicleRelationships,
} from '@/types/admin/fund-applications';

/**
 * The intake form as a staff member keys it in from the paper original (UZA-EMP-F01).
 *
 * Almost everything is optional on purpose — this mirrors the API's create DTO. A driver at
 * the table must never be blocked from starting because they cannot remember a licence
 * expiry; the form saves as a DRAFT with whatever is known, and the API decides separately
 * what must be present before it can be signed.
 *
 * Empty strings from an untouched input are turned into `undefined` so they are not sent,
 * and whole-RWF amounts are coerced from the text the input holds.
 */

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .transform((v) => (v ? v : undefined));

const optionalWholeRwf = z
  .union([z.string(), z.number()])
  .optional()
  .transform((v) => {
    if (v === undefined || v === '') return undefined;
    const n = typeof v === 'number' ? v : Number(String(v).replace(/[,\s]/g, ''));
    return Number.isFinite(n) && n >= 0 ? Math.round(n) : undefined;
  });

const optionalInt = (min: number, max: number) =>
  z
    .union([z.string(), z.number()])
    .optional()
    .transform((v) => {
      if (v === undefined || v === '') return undefined;
      const n = typeof v === 'number' ? v : Number(v);
      return Number.isInteger(n) && n >= min && n <= max ? n : undefined;
    });

const optionalDate = z
  .string()
  .optional()
  .transform((v) => (v ? v : undefined));

const optionalEnum = <T extends readonly [string, ...string[]]>(values: T) =>
  z
    .enum(values)
    .or(z.literal(''))
    .optional()
    .transform((v) => (v ? (v as T[number]) : undefined));

export const fundApplicationSchema = z.object({
  // Identity — the three the API requires to open a draft, plus district
  fullName: z.string().trim().min(2, 'Full name is required').max(120),
  nationalId: z.string().trim().min(8, 'National ID is required').max(32),
  phone: z.string().trim().min(8, 'Telephone is required').max(24),
  alternatePhone: optionalText(24),
  dateOfBirth: optionalDate,
  gender: optionalEnum(genders),
  district: z.string().trim().min(2, 'District is required').max(60),
  sector: optionalText(60),
  cell: optionalText(60),

  // Driving
  licenceNumber: optionalText(40),
  licenceCategory: optionalText(16),
  licenceExpiry: optionalDate,
  yearsDriving: optionalInt(0, 60),
  currentVehicle: optionalEnum(vehicleRelationships),
  currentPlate: optionalText(16),
  associationName: optionalText(120),

  // Income
  averageDailyTakingsRwf: optionalWholeRwf,
  workingDaysPerWeek: optionalInt(0, 7),
  currentDailyRentalRwf: optionalWholeRwf,
  otherMonthlyIncomeRwf: optionalWholeRwf,
  dependants: optionalInt(0, 30),

  // Savings and banking
  currentSavingsRwf: optionalWholeRwf,
  savingsHeldAt: optionalEnum(savingsLocations),
  monthlySavingCapacityRwf: optionalWholeRwf,
  hasBankAccount: z.boolean().optional(),
  bankName: optionalText(80),
  mobileMoneyNumber: optionalText(24),
  hasBorrowedBefore: z.boolean().optional(),
  currentlyRepayingLoan: z.boolean().optional(),
  currentLoanDetail: optionalText(240),

  // What they are applying for
  preferredTenorMonths: optionalInt(12, 60),
  depositAvailableRwf: optionalWholeRwf,
  preferredLenderKey: optionalText(40),

  // How the form was completed
  completionMode: optionalEnum(completionModes),
  assistedByRef: optionalText(60),
});

export type FundApplicationInput = z.infer<typeof fundApplicationSchema>;
/** What the form fields hold before transformation — strings from inputs. */
export type FundApplicationFormValues = z.input<typeof fundApplicationSchema>;

/**
 * The three declarations, ticked separately. Bundling them into one box is what makes a
 * consent unenforceable, so the UI keeps them apart exactly as the paper form does.
 */
export const declarationsSchema = z.object({
  declarationAccepted: z.boolean(),
  dataProcessingConsentGiven: z.boolean(),
  lenderConsentGiven: z.boolean(),
  preferredLenderKey: optionalText(40),
});
export type DeclarationsInput = z.infer<typeof declarationsSchema>;

export const signatureSchema = z.object({
  signatureRef: z
    .string()
    .trim()
    .min(3, 'Enter the reference of the scanned, signed form')
    .max(200),
  witnessName: optionalText(120),
  witnessRef: optionalText(60),
});
export type SignatureInput = z.infer<typeof signatureSchema>;
export type SignatureFormValues = z.input<typeof signatureSchema>;

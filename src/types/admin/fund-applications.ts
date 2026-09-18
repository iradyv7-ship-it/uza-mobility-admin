/**
 * The UZA Empower fund application as the API returns it.
 *
 * Mirrors `FundApplication` in uza-mobility-bn. Amounts are whole RWF; dates are ISO
 * strings. Nullable fields are nullable because a form saved as a draft is allowed to be
 * incomplete — see `assertSubmittable` on the API for what must be present before signing.
 */

export const fundApplicationStatuses = [
  'DRAFT',
  'SUBMITTED',
  'SCREENING',
  'ACCEPTED',
  'DECLINED',
  'WITHDRAWN',
] as const;
export type FundApplicationStatus = (typeof fundApplicationStatuses)[number];

export const vehicleRelationships = [
  'OWNS',
  'RENTS',
  'DRIVES_FOR_EMPLOYER',
  'NONE',
] as const;
export const savingsLocations = [
  'BANK',
  'SACCO',
  'MOBILE_MONEY',
  'CASH_AT_HOME',
  'NONE',
] as const;
export const genders = ['FEMALE', 'MALE', 'PREFER_NOT_TO_SAY'] as const;
export const completionModes = ['SELF_SERVICE', 'ASSISTED'] as const;

/** The lenders an applicant may name in section C of the paper form. */
export const preferredLenders = [
  { key: 'unguka', label: 'Unguka Bank (LOLC)' },
  { key: 'ncba', label: 'NCBA Rwanda' },
] as const;

export type FundApplication = {
  id: string;
  ref: string;
  uzaId: string | null;
  status: FundApplicationStatus;

  fullName: string;
  nationalId: string;
  dateOfBirth: string | null;
  gender: (typeof genders)[number] | null;
  phone: string;
  alternatePhone: string | null;
  district: string;
  sector: string | null;
  cell: string | null;

  licenceNumber: string | null;
  licenceCategory: string | null;
  licenceExpiry: string | null;
  yearsDriving: number | null;
  currentVehicle: (typeof vehicleRelationships)[number] | null;
  currentPlate: string | null;
  associationName: string | null;

  averageDailyTakingsRwf: number | null;
  workingDaysPerWeek: number | null;
  currentDailyRentalRwf: number | null;
  otherMonthlyIncomeRwf: number | null;
  dependants: number | null;

  currentSavingsRwf: number | null;
  savingsHeldAt: (typeof savingsLocations)[number] | null;
  monthlySavingCapacityRwf: number | null;
  hasBankAccount: boolean | null;
  bankName: string | null;
  mobileMoneyNumber: string | null;
  hasBorrowedBefore: boolean | null;
  currentlyRepayingLoan: boolean;
  currentLoanDetail: string | null;

  cohortId: string | null;
  preferredTenorMonths: number | null;
  depositAvailableRwf: number | null;
  preferredLenderKey: string | null;

  declarationAccepted: boolean;
  dataProcessingConsentGiven: boolean;
  lenderConsentGiven: boolean;
  completionMode: (typeof completionModes)[number] | null;
  assistedByRef: string | null;

  signedAt: string | null;
  signatureRef: string | null;
  witnessName: string | null;
  witnessRef: string | null;
  submittedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

/**
 * What stands between this applicant and a loan. A list of things to close, never a
 * verdict — see the API's `fund-application.rules.ts`.
 */
export type ScreeningGapKind =
  | 'LICENCE_OR_PERMIT'
  | 'DOCUMENTS_INCOMPLETE'
  | 'CONTRIBUTION_SHORT'
  | 'NO_VERIFIABLE_INCOME'
  | 'NO_BANK_FARE_SETTLEMENT'
  | 'THIN_CREDIT_FILE';

export type ScreeningGap = {
  kind: ScreeningGapKind;
  detail: string;
  shortfallRwf?: number;
};

export type FundApplicationScreening = {
  ref: string;
  gaps: ScreeningGap[];
  blockedAtIntake: boolean;
};

export const screeningGapLabels: Record<ScreeningGapKind, string> = {
  LICENCE_OR_PERMIT: 'Licence or permit',
  DOCUMENTS_INCOMPLETE: 'Documents incomplete',
  CONTRIBUTION_SHORT: 'Contribution short',
  NO_VERIFIABLE_INCOME: 'Income not yet verified',
  NO_BANK_FARE_SETTLEMENT: 'No bank fare settlement',
  THIN_CREDIT_FILE: 'Thin credit file',
};

/** The two gaps that actually stop somebody at the door. Everything else is work to do. */
export const blockingGapKinds: readonly ScreeningGapKind[] = [
  'LICENCE_OR_PERMIT',
  'DOCUMENTS_INCOMPLETE',
];

export const fundApplicationDocumentKinds = [
  'SIGNED_FORM',
  'NATIONAL_ID',
  'DRIVING_LICENCE',
  'PROOF_OF_SAVINGS',
  'OTHER',
] as const;
export type FundApplicationDocumentKind = (typeof fundApplicationDocumentKinds)[number];

/**
 * A paper filed against the application, engraved against the employee who filed it. The
 * API never updates or deletes one of these; a replacement carries `supersedesId`.
 */
export type FundApplicationDocument = {
  id: string;
  kind: FundApplicationDocumentKind;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  sha256: string;
  filedBy: { userId: string; uzaId: string | null; name: string };
  filedAt: string;
  note: string | null;
  supersedesId: string | null;
};


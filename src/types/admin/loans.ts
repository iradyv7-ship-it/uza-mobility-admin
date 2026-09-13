/**
 * A Twara EV / UZA Empower loan, as the API returns it. Mirrors `Loan` (+ its `vehicle`
 * and `tenorChanges` relations) in uza-mobility-bn. Amounts are whole RWF; dates are ISO
 * strings.
 */

export const loanStatuses = [
  'PENDING',
  'IN_REVIEW',
  'APPROVED',
  'DECLINED',
  'DISBURSED',
  'ACTIVE',
  'IN_ARREARS',
  'CLOSED',
] as const;
export type LoanStatus = (typeof loanStatuses)[number];

export const vehicleUnitConditions = ['NEW', 'USED'] as const;
export type VehicleUnitCondition = (typeof vehicleUnitConditions)[number];

export type LoanVehicle = {
  id: string;
  chassisNumber: string;
  make: string | null;
  model: string | null;
  year: number | null;
  color: string | null;
  plate: string | null;
  condition: VehicleUnitCondition;
};

/** Mirrors inspectionEconomicsFor() in uza-mobility-bn's inspection-economics.ts. The
 * contracted rate and split are an explicit, overridable ASSUMPTION — not yet negotiated
 * with a real garage — surfaced here as-is rather than hidden behind a settled-looking UI. */
export type LoanInspectionEconomics = {
  condition: VehicleUnitCondition;
  inspectionsPerYear: number;
  cycleDays: number;
  contractedRateRwf: number;
  dailyReserveRwf: number;
  garageTakeHomeRwf: number;
  uzaPlatformFeeRwf: number;
};

export type LoanBorrower = {
  id: string;
  uzaId: string | null;
  firstName: string;
  lastName: string;
};

export type LoanBank = {
  name: string;
  lenderKey: string | null;
};

export type LoanTenorChange = {
  id: string;
  fromTenorMonths: number;
  toTenorMonths: number;
  fromMonthlyRwf: number;
  toMonthlyRwf: number;
  fromDailyRwf: number;
  toDailyRwf: number;
  reason: string | null;
  changedByUserId: string;
  createdAt: string;
};

export type Loan = {
  id: string;
  reference: string;
  bankId: string;
  borrowerUserId: string;
  vehiclePriceRwf: number | null;
  clientContributionRwf: number | null;
  principalRwf: number;
  tenorMonths: number;
  annualRateBps: number;
  monthlyRwf: number;
  dailyRwf: number;
  totalRepayableRwf: number;
  outstandingRwf: number;
  arrearsRwf: number;
  status: LoanStatus;
  disbursedAt: string | null;
  createdAt: string;
  updatedAt: string;
  vehicle: LoanVehicle | null;
  borrower?: LoanBorrower;
  bank?: LoanBank;
};

export type LoanDetail = Loan & {
  borrower: LoanBorrower;
  tenorChanges: LoanTenorChange[];
  inspectionEconomics: LoanInspectionEconomics;
};

export const loanChangeTypes = ['TENOR', 'CONTRIBUTION', 'VEHICLE_PRICE'] as const;
export type LoanChangeType = (typeof loanChangeTypes)[number];

export const loanChangeRequestStatuses = [
  'PENDING',
  'APPROVED',
  'REJECTED',
  'APPLIED',
] as const;
export type LoanChangeRequestStatus = (typeof loanChangeRequestStatuses)[number];

export type LoanChangeRequest = {
  id: string;
  loanId: string;
  requestedByUserId: string;
  changeType: LoanChangeType;
  payload: Record<string, unknown>;
  note: string | null;
  status: LoanChangeRequestStatus;
  reviewedByUserId: string | null;
  reviewedAt: string | null;
  reviewNote: string | null;
  appliedAt: string | null;
  createdAt: string;
};

/** The lenders a loan can be originated with — mirrors uza-mobility-bn's lenders.registry.ts. */
export const lenderOptions = [
  { key: 'unguka', label: 'Unguka Bank (LOLC)' },
  { key: 'equity', label: 'Equity Bank Rwanda' },
  { key: 'ncba', label: 'NCBA Rwanda' },
] as const;

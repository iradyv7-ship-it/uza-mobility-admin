/**
 * Mirrors ImpactService in uza-mobility-bn exactly — a read-projection over facts that
 * already live in their own real tables (Loan, Enrolment, VehicleInspection,
 * CollateralEntry), not a new ledger. `gaps` names, plainly, whatever this pass could not
 * honestly compute rather than presenting a plausible-looking zero.
 */

export type FunderSummary = {
  cohortsCount: number;
  traineesEnrolled: number;
  traineesCompleted: number;
  womenPct: number | null;
  youthPct: number | null;
  evsFinanced: number;
  techniciansCertified: number;
  collateralBridgedRwf: number;
  totalKmRecorded: number;
  gaps: Record<string, string>;
};

export type GarageNetworkRevenue = {
  garageTakeHomeRwf: number;
  uzaPlatformFeeRwf: number;
  totalCollectedRwf: number;
};

export type InvestorSummary = {
  loansOriginated: number;
  loansActiveOrDisbursed: number;
  totalPrincipalRwf: number;
  averagePrincipalRwf: number;
  outstandingRwf: number;
  arrearsRwf: number;
  inspectionsFiled: number;
  garageNetworkRevenue: GarageNetworkRevenue;
  gaps: Record<string, string>;
};

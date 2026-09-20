/** Mirrors uza-mobility-bn `scenario.rules.ts`. The formulas live there; this is the shape. */

export interface ScenarioInput {
  vehiclePriceRwf: number;
  clientContributionRwf: number;
  tenorMonths: number;
  lenderKey?: string;
  contributionPct?: number;
  annualRateBps?: number;
  uzaCollateralRwf?: number;
  bankLoanRwf?: number;
  grandfatheredMinimumRwf?: number;
}

export type CheckSeverity = 'info' | 'warn' | 'block';
export interface ScenarioCheck {
  code: string;
  severity: CheckSeverity;
  message: string;
}

export interface LoanQuote {
  financedRwf: number;
  tenorMonths: number;
  monthlyRwf: number;
  dailyRwf: number;
  totalRepayableRwf: number;
  totalInterestRwf: number;
  annualRateBps: number;
}

export interface Scenario {
  lender: { key: string; name: string; confidence: 'VERIFIED' | 'PARTIAL' | 'UNVERIFIED' } | null;
  inputs: { vehiclePriceRwf: number; clientContributionRwf: number; tenorMonths: number };
  rule: {
    contributionPct: number;
    contributionPctSource: 'lender' | 'override' | 'default';
    requiredContributionRwf: number;
    suggestedClientMinimumRwf: number;
    appliedClientMinimumRwf: number;
    annualRateBps: number | null;
    rateSource: 'lender' | 'override' | 'missing';
    uzaSource: 'rule' | 'override' | 'derivedFromBank';
    bankSource: 'rule' | 'override';
  };
  split: {
    clientContributionRwf: number;
    uzaCollateralRwf: number;
    bankLoanRwf: number;
    coverRwf: number;
    coverPctOfPrice: number;
    bankPctOfPrice: number;
    sellerReceivesRwf: number;
    clientShortfallToMinimumRwf: number;
  };
  schedule: LoanQuote | null;
  checks: ScenarioCheck[];
  bookable: boolean;
}

export interface StudyPoint {
  label: string;
  input: Partial<ScenarioInput>;
  scenario: Scenario;
  dailyDeltaRwf: number | null;
  totalInterestDeltaRwf: number | null;
}

export interface Study {
  base: Scenario;
  byLender: StudyPoint[];
  byTenor: StudyPoint[];
  byRate: StudyPoint[];
  byClientContribution: StudyPoint[];
}

export interface LenderTermsSummary {
  key: string;
  name: string;
  contributionPct: number;
  tenorsMonths: number[];
  uzaCollateralAvailable: boolean;
  rateOnFile: boolean;
  rateBands?: { maxTenorMonths: number; annualRateBps: number }[];
  evidence: { source: string; date: string; confidence: 'VERIFIED' | 'PARTIAL' | 'UNVERIFIED'; note?: string };
}

export interface ApplyScenarioBody extends ScenarioInput {
  note?: string;
  acceptWarnings?: boolean;
}

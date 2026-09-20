import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ApiClientError } from '@/lib/api/error';
import {
  changeLoanTenor,
  createLoan,
  getLoan,
  listLoanChangeRequests,
  listLoans,
  reviewLoanChange,
  type LoanFilters,
  closeLoan,
  disburseLoan,
  importLoanRepayments,
  listLoanRepayments,
  recordLoanRepayment,
  applyLoanScenario,
  getLoanScenario,
  listLenderTerms,
  studyScenario,
} from '@/lib/api/loans';
import type { ApplyScenarioBody, ScenarioInput } from '@/types/admin/scenario';
import type {
  ChangeTenorInput,
  CreateLoanInput,
  ReviewLoanChangeInput,
} from '@/schemas/loans';

export const loanKeys = {
  all: ['loans'] as const,
  list: (filters: LoanFilters) => [...loanKeys.all, 'list', filters] as const,
  one: (id: string) => [...loanKeys.all, 'one', id] as const,
  changeRequests: (id: string) =>
    [...loanKeys.all, 'change-requests', id] as const,
  repayments: (id: string) => [...loanKeys.all, 'repayments', id] as const,
  scenario: (id: string) => [...loanKeys.all, 'scenario', id] as const,
  study: (input: ScenarioInput | null) => [...loanKeys.all, 'study', input] as const,
  lenderTerms: () => [...loanKeys.all, 'lender-terms'] as const,
};

function mutationError(error: unknown, fallback: string) {
  return error instanceof ApiClientError ? error.message : fallback;
}

export function useLoans(filters: LoanFilters) {
  return useQuery({
    queryKey: loanKeys.list(filters),
    queryFn: () => listLoans(filters),
  });
}

export function useLoan(id: string | null) {
  return useQuery({
    queryKey: loanKeys.one(id ?? ''),
    queryFn: () => getLoan(id!),
    enabled: !!id,
  });
}

export function useLoanChangeRequests(id: string | null) {
  return useQuery({
    queryKey: loanKeys.changeRequests(id ?? ''),
    queryFn: () => listLoanChangeRequests(id!),
    enabled: !!id,
  });
}

export function useCreateLoan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateLoanInput) => createLoan(body),
    onSuccess: () => {
      toast.success('Loan originated');
      void queryClient.invalidateQueries({ queryKey: loanKeys.all });
    },
    onError: (error) =>
      toast.error(mutationError(error, 'Failed to originate the loan')),
  });
}

export function useChangeLoanTenor(loanId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: ChangeTenorInput) => changeLoanTenor(loanId, body),
    onSuccess: () => {
      toast.success('Tenor changed — the loan has been recalculated');
      void queryClient.invalidateQueries({ queryKey: loanKeys.all });
    },
    onError: (error) =>
      toast.error(mutationError(error, 'Failed to change the tenor')),
  });
}

export function useReviewLoanChange(loanId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      changeRequestId,
      body,
    }: {
      changeRequestId: string;
      body: ReviewLoanChangeInput;
    }) => reviewLoanChange(changeRequestId, body),
    onSuccess: (_, variables) => {
      toast.success(
        variables.body.approve
          ? 'Change approved and applied'
          : 'Change rejected',
      );
      void queryClient.invalidateQueries({
        queryKey: loanKeys.changeRequests(loanId),
      });
      void queryClient.invalidateQueries({ queryKey: loanKeys.all });
    },
    onError: (error) =>
      toast.error(mutationError(error, 'Failed to review the change')),
  });
}

export function useLoanRepayments(id: string | null) {
  return useQuery({
    queryKey: loanKeys.repayments(id ?? ''),
    queryFn: () => listLoanRepayments(id ?? ''),
    enabled: !!id,
  });
}

export function useDisburseLoan(loanId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: { disbursedAt?: string; reference?: string }) => disburseLoan(loanId, body),
    onSuccess: (l) => {
      toast.success(`${l.reference} disbursed — daily target RWF ${l.dailyRwf.toLocaleString('en-RW')}`);
      void queryClient.invalidateQueries({ queryKey: loanKeys.all });
    },
    onError: (error) => toast.error(mutationError(error, 'Could not record the disbursement.')),
  });
}

export function useRecordLoanRepayment(loanId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: Parameters<typeof recordLoanRepayment>[1]) => recordLoanRepayment(loanId, body),
    onSuccess: (r) => {
      toast[r.duplicate ? 'info' : 'success'](
        r.duplicate ? `Reference ${r.repayment.reference} was already on file — nothing recorded twice.` : `Repayment recorded. Arrears now RWF ${r.loan.arrearsRwf.toLocaleString('en-RW')}.`,
      );
      void queryClient.invalidateQueries({ queryKey: loanKeys.all });
    },
    onError: (error) => toast.error(mutationError(error, 'Could not record the repayment.')),
  });
}

export function useImportLoanRepayments() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (file: File) => importLoanRepayments(file),
    onSuccess: (r) => {
      toast.success(`${r.imported} recorded, ${r.duplicates} already on file, ${r.failed.length + r.parseErrors.length} to look at`);
      void queryClient.invalidateQueries({ queryKey: loanKeys.all });
    },
    onError: (error) => toast.error(mutationError(error, 'Could not import the file.')),
  });
}

export function useCloseLoan(loanId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: { note?: string }) => closeLoan(loanId, body),
    onSuccess: (r) => {
      toast.success(
        r.reserveReturnedRwf > 0
          ? `${r.loan.reference} closed. Reserve of RWF ${r.reserveReturnedRwf.toLocaleString('en-RW')} returned to the driver.`
          : `${r.loan.reference} closed.`,
      );
      void queryClient.invalidateQueries({ queryKey: loanKeys.all });
    },
    onError: (error) => toast.error(mutationError(error, 'Could not close the loan.')),
  });
}


// ── Scenarios ───────────────────────────────────────────────────────────────────────────

export function useLoanScenario(loanId: string | null) {
  return useQuery({
    queryKey: loanKeys.scenario(loanId ?? ''),
    queryFn: () => getLoanScenario(loanId!),
    enabled: !!loanId,
  });
}

/** A free study: re-runs whenever the input changes (the studio debounces the input). */
export function useScenarioStudy(input: ScenarioInput | null) {
  return useQuery({
    queryKey: loanKeys.study(input),
    queryFn: () => studyScenario(input!),
    enabled: !!input && input.vehiclePriceRwf > 0 && input.tenorMonths > 0,
    placeholderData: (prev) => prev,
    staleTime: 60_000,
  });
}

export function useLenderTerms() {
  return useQuery({ queryKey: loanKeys.lenderTerms(), queryFn: listLenderTerms, staleTime: 10 * 60_000 });
}

export function useApplyLoanScenario(loanId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: ApplyScenarioBody) => applyLoanScenario(loanId, body),
    onSuccess: ({ loan, scenario }) => {
      toast.success(
        `${loan.reference} booked — bank ${scenario.split.bankLoanRwf.toLocaleString('en-RW')}, UZA ${scenario.split.uzaCollateralRwf.toLocaleString('en-RW')}, daily ${loan.dailyRwf.toLocaleString('en-RW')}`,
      );
      void queryClient.invalidateQueries({ queryKey: loanKeys.all });
    },
    onError: (error) => toast.error(mutationError(error, 'Could not book these numbers.')),
  });
}

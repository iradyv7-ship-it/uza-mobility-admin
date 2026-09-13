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
} from '@/lib/api/loans';
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

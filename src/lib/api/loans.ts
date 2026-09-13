import {
  authenticatedFetch,
  authenticatedPaginatedFetch,
} from '@/lib/api/authenticated';
import { toSearchParams } from '@/lib/api/query-params';
import type {
  ChangeTenorInput,
  CreateLoanInput,
  ReviewLoanChangeInput,
} from '@/schemas/loans';
import type {
  Loan,
  LoanChangeRequest,
  LoanDetail,
  LoanStatus,
} from '@/types/admin/loans';

/**
 * Loan origination, tenor changes, and lender change-request review — against
 * `/admin/loans` on the API. Staff-only (FINANCE_ADMIN, SUPER_ADMIN); see
 * AdminLoanLifecycleController in uza-mobility-bn.
 */

const BASE = '/admin/loans';

export type LoanFilters = {
  status?: LoanStatus | '';
  search?: string;
  page?: number;
  limit?: number;
};

export function listLoans(filters: LoanFilters = {}) {
  const params = toSearchParams({
    status: filters.status || undefined,
    search: filters.search || undefined,
    page: filters.page,
    limit: filters.limit,
  });
  const qs = params.toString();
  return authenticatedPaginatedFetch<Loan>(qs ? `${BASE}?${qs}` : BASE);
}

export function getLoan(id: string) {
  return authenticatedFetch<LoanDetail>(`${BASE}/${id}`);
}

export function createLoan(body: CreateLoanInput) {
  return authenticatedFetch<LoanDetail>(BASE, {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export function changeLoanTenor(id: string, body: ChangeTenorInput) {
  return authenticatedFetch<{ loan: Loan }>(`${BASE}/${id}/tenor`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  });
}

export function listLoanChangeRequests(loanId: string) {
  return authenticatedFetch<LoanChangeRequest[]>(
    `${BASE}/${loanId}/change-requests`,
  );
}

export function reviewLoanChange(
  changeRequestId: string,
  body: ReviewLoanChangeInput,
) {
  return authenticatedFetch<LoanChangeRequest>(
    `${BASE}/change-requests/${changeRequestId}/review`,
    { method: 'PATCH', body: JSON.stringify(body) },
  );
}

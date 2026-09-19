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
import { authenticatedMultipartFetch } from '@/lib/api/multipart';
import type {
  Loan,
  LoanRepayment,
  LoanRepaymentSource,
  RepaymentImportResult,
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

// ── Servicing: what happens after the bank says yes ─────────────────────────────────────

export function disburseLoan(id: string, body: { disbursedAt?: string; reference?: string }) {
  return authenticatedFetch<Loan>(`/admin/loans/${id}/disburse`, {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export function listLoanRepayments(id: string) {
  return authenticatedFetch<LoanRepayment[]>(`/admin/loans/${id}/repayments`);
}

export function recordLoanRepayment(
  id: string,
  body: { amountRwf: number; paidAt: string; reference: string; source: LoanRepaymentSource; note?: string },
) {
  return authenticatedFetch<{ repayment: LoanRepayment; duplicate: boolean; loan: Loan }>(
    `/admin/loans/${id}/repayments`,
    { method: 'POST', body: JSON.stringify(body) },
  );
}

export function importLoanRepayments(file: File) {
  const form = new FormData();
  form.append('file', file);
  return authenticatedMultipartFetch<RepaymentImportResult>('/admin/loans/repayments/import', form);
}

export function closeLoan(id: string, body: { note?: string }) {
  return authenticatedFetch<{ loan: Loan; reserveReturnedRwf: number }>(`/admin/loans/${id}/close`, {
    method: 'POST',
    body: JSON.stringify(body),
  });
}


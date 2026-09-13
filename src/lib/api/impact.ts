import { authenticatedFetch } from '@/lib/api/authenticated';
import type { FunderSummary, InvestorSummary } from '@/types/admin/impact';

/** The one shared impact ledger, read two ways — against /admin/impact on the API. */

export function getFunderImpact() {
  return authenticatedFetch<FunderSummary>('/admin/impact/funder');
}

export function getInvestorImpact() {
  return authenticatedFetch<InvestorSummary>('/admin/impact/investor');
}

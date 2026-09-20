import { siteConfig } from '@/config/site';
import {
  authenticatedFetch,
  authenticatedPaginatedFetch,
} from '@/lib/api/authenticated';
import { toSearchParams } from '@/lib/api/query-params';
import type {
  ActivityLog,
  ActivityLogsFilters,
  AdminUser,
  PricingRule,
} from '@/types/admin/platform';
import type {
  DiscountSalesFilters,
  DiscountSalesMeta,
  DiscountSaleRow,
} from '@/types/admin/discount-sales';
import type {
  AssignUserRolesInput,
  CreatePricingRuleInput,
  UpdatePricingRuleInput,
} from '@/schemas/platform';
import type { CreateAdminAccountInput } from '@/schemas/admin-accounts';

export function getAdminUsers() {
  return authenticatedFetch<AdminUser[]>('/admin/users');
}

/**
 * Create an account on someone else's behalf — a driver, a bank officer, a workshop
 * partner — with a temporary password the API generates. Returned exactly once; the API
 * never stores it in cleartext and this app never persists it either (see
 * CreateAccountDialog, which shows it only in the dialog that made the call).
 */
export function createAdminAccount(body: CreateAdminAccountInput) {
  return authenticatedFetch<{ user: AdminUser; temporaryPassword: string }>(
    '/admin/users',
    { method: 'POST', body: JSON.stringify(body) },
  );
}

export function updateAdminUserRoles(id: string, body: AssignUserRolesInput) {
  return authenticatedFetch<AdminUser>(`/admin/users/${id}/roles`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  });
}

export function deactivateAdminUser(id: string) {
  return authenticatedFetch<AdminUser>(`/admin/users/${id}/deactivate`, {
    method: 'PATCH',
  });
}

export function activateAdminUser(id: string) {
  return authenticatedFetch<AdminUser>(`/admin/users/${id}/activate`, {
    method: 'PATCH',
  });
}

export function getAdminActivityLogs(filters: ActivityLogsFilters = {}) {
  return authenticatedPaginatedFetch<ActivityLog>('/admin/activity-logs', {
    searchParams: toSearchParams(filters),
  });
}

export function calculateAdminPricing(body: {
  sellerType: string;
  originCountry?: string;
  pricingRuleId?: string;
  basePriceRwf?: number;
  fobPriceRwf?: number;
  discountRwf?: number;
}) {
  return authenticatedFetch<import('@/types/pricing').PriceBreakdown>(
    '/admin/pricing-rules/calculate',
    {
      method: 'POST',
      body: JSON.stringify(body),
    },
  );
}

export function getAdminPricingRules() {
  return authenticatedFetch<PricingRule[]>('/admin/pricing-rules');
}

export function createPricingRule(body: CreatePricingRuleInput) {
  return authenticatedFetch<PricingRule>('/admin/pricing-rules', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export function updatePricingRule(id: string, body: UpdatePricingRuleInput) {
  return authenticatedFetch<PricingRule>(`/admin/pricing-rules/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  });
}

export function deactivatePricingRule(id: string) {
  return authenticatedFetch<PricingRule>(`/admin/pricing-rules/${id}`, {
    method: 'DELETE',
  });
}

export function getDiscountSalesReport(filters: DiscountSalesFilters = {}) {
  return authenticatedPaginatedFetch<DiscountSaleRow, DiscountSalesMeta>(
    '/admin/reports/discount-sales',
    {
      searchParams: toSearchParams(filters),
    },
  );
}

export async function downloadDiscountSalesPdf(
  accessToken: string,
  filters: DiscountSalesFilters = {},
): Promise<Blob> {
  const params = toSearchParams(filters);
  const qs = params.toString();
  const url = `${siteConfig.apiUrl}/admin/reports/discount-sales/export${qs ? `?${qs}` : ''}`;
  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!response.ok) {
    throw new Error('Could not export discount sales report');
  }
  return response.blob();
}

// ── Staff invites: the only way a self-registered account becomes staff ─────────────────

export type StaffInviteStatus = 'OPEN' | 'USED' | 'REVOKED' | 'EXPIRED';
export type StaffInvite = {
  id: string;
  email: string;
  roles: string[];
  note: string | null;
  createdAt: string;
  expiresAt: string;
  usedAt: string | null;
  revokedAt: string | null;
  status: StaffInviteStatus;
};
export type IssuedStaffInvite = {
  id: string;
  email: string;
  roles: string[];
  expiresAt: string;
  emailed: boolean;
  /** Shown once; never stored by the API in clear. */
  code: string;
};

export function listStaffInvites() {
  return authenticatedFetch<StaffInvite[]>('/admin/staff-invites');
}
export function createStaffInvite(body: { email: string; roles: string[]; note?: string }) {
  return authenticatedFetch<IssuedStaffInvite>('/admin/staff-invites', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}
export function revokeStaffInvite(id: string) {
  return authenticatedFetch<{ revoked: boolean }>(`/admin/staff-invites/${id}`, { method: 'DELETE' });
}

// ── Access recovery: the layers under the password and the emailed code ─────────────────

export function issueRecoveryCode(userId: string, body: { reason: string }) {
  return authenticatedFetch<{ code: string; expiresAt: string; howToUse: string }>(
    `/admin/staff-invites/recovery-code/${userId}`,
    { method: 'POST', body: JSON.stringify(body) },
  );
}
export function resetUserAccess(userId: string, body: { reason: string }) {
  return authenticatedFetch<{ temporaryPassword: string; mustChangePassword: true }>(
    `/admin/staff-invites/reset-access/${userId}`,
    { method: 'POST', body: JSON.stringify(body) },
  );
}

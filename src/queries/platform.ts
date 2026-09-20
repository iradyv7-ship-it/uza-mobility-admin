'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ApiClientError } from '@/lib/api';
import {
  createPricingRule,
  activateAdminUser,
  createAdminAccount,
  deactivateAdminUser,
  deactivatePricingRule,
  getAdminActivityLogs,
  getAdminPricingRules,
  getAdminUsers,
  getDiscountSalesReport,
  updateAdminUserRoles,
  updatePricingRule,
  createStaffInvite,
  listStaffInvites,
  revokeStaffInvite,
  issueRecoveryCode,
  resetUserAccess,
} from '@/lib/api/platform';
import type { ActivityLogsFilters } from '@/types/admin/platform';
import type { DiscountSalesFilters } from '@/types/admin/discount-sales';
import type {
  AssignUserRolesInput,
  CreatePricingRuleInput,
  UpdatePricingRuleInput,
} from '@/schemas/platform';
import type { CreateAdminAccountInput } from '@/schemas/admin-accounts';

export const platformKeys = {
  all: ['platform'] as const,
  users: () => [...platformKeys.all, 'users'] as const,
  staffInvites: () => [...platformKeys.all, 'staff-invites'] as const,
  activityLogs: (filters: ActivityLogsFilters) =>
    [...platformKeys.all, 'activity-logs', filters] as const,
  pricingRules: () => [...platformKeys.all, 'pricing-rules'] as const,
  discountSales: (filters: DiscountSalesFilters) =>
    [...platformKeys.all, 'discount-sales', filters] as const,
};

function toastError(error: unknown, fallback: string) {
  toast.error(error instanceof ApiClientError ? error.message : fallback);
}

export function useAdminUsers() {
  return useQuery({
    queryKey: platformKeys.users(),
    queryFn: getAdminUsers,
  });
}

/**
 * No success toast carrying the password — a toast can be missed or dismissed before it's
 * read. The caller (CreateAccountDialog) keeps the returned `temporaryPassword` on screen
 * itself until the admin closes the dialog.
 */
export function useCreateAdminAccount() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateAdminAccountInput) => createAdminAccount(body),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: platformKeys.users() });
    },
    onError: (error) => toastError(error, 'Failed to create the account'),
  });
}

export function useUpdateAdminUserRoles() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: AssignUserRolesInput }) =>
      updateAdminUserRoles(id, body),
    onSuccess: () => {
      toast.success('Roles updated');
      void queryClient.invalidateQueries({ queryKey: platformKeys.users() });
    },
    onError: (error) => toastError(error, 'Failed to update roles'),
  });
}

export function useDeactivateAdminUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deactivateAdminUser(id),
    onSuccess: () => {
      toast.success('User deactivated');
      void queryClient.invalidateQueries({ queryKey: platformKeys.users() });
    },
    onError: (error) => toastError(error, 'Failed to deactivate user'),
  });
}

export function useActivateAdminUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => activateAdminUser(id),
    onSuccess: () => {
      toast.success('User reactivated');
      void queryClient.invalidateQueries({ queryKey: platformKeys.users() });
    },
    onError: (error) => toastError(error, 'Failed to reactivate user'),
  });
}

export function useAdminActivityLogs(filters: ActivityLogsFilters) {
  return useQuery({
    queryKey: platformKeys.activityLogs(filters),
    queryFn: () => getAdminActivityLogs(filters),
  });
}

export function useAdminPricingRules(enabled = true) {
  return useQuery({
    queryKey: platformKeys.pricingRules(),
    queryFn: getAdminPricingRules,
    enabled,
  });
}

export function useCreatePricingRule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: CreatePricingRuleInput) => createPricingRule(body),
    onSuccess: () => {
      toast.success('Pricing rule created');
      void queryClient.invalidateQueries({
        queryKey: platformKeys.pricingRules(),
      });
    },
    onError: (error) => toastError(error, 'Failed to create pricing rule'),
  });
}

export function useUpdatePricingRule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: UpdatePricingRuleInput }) =>
      updatePricingRule(id, body),
    onSuccess: () => {
      toast.success('Pricing rule updated');
      void queryClient.invalidateQueries({
        queryKey: platformKeys.pricingRules(),
      });
    },
    onError: (error) => toastError(error, 'Failed to update pricing rule'),
  });
}

export function useDeactivatePricingRule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deactivatePricingRule(id),
    onSuccess: () => {
      toast.success('Pricing rule deactivated');
      void queryClient.invalidateQueries({
        queryKey: platformKeys.pricingRules(),
      });
    },
    onError: (error) => toastError(error, 'Failed to deactivate pricing rule'),
  });
}

export function useDiscountSalesReport(filters: DiscountSalesFilters = {}) {
  return useQuery({
    queryKey: platformKeys.discountSales(filters),
    queryFn: () => getDiscountSalesReport(filters),
  });
}

// ── Staff invites ───────────────────────────────────────────────────────────────────────

export function useStaffInvites() {
  return useQuery({ queryKey: platformKeys.staffInvites(), queryFn: listStaffInvites });
}

/** No toast with the code — the dialog keeps it on screen until the admin closes it. */
export function useCreateStaffInvite() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: { email: string; roles: string[]; note?: string }) => createStaffInvite(body),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: platformKeys.staffInvites() }),
    onError: (e) => toastError(e, 'Could not issue the invite.'),
  });
}

export function useRevokeStaffInvite() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => revokeStaffInvite(id),
    onSuccess: () => {
      toast.success('Invite revoked.');
      void queryClient.invalidateQueries({ queryKey: platformKeys.staffInvites() });
    },
    onError: (e) => toastError(e, 'Could not revoke the invite.'),
  });
}

// ── Access recovery ─────────────────────────────────────────────────────────────────────
// No toasts with secrets: the panel keeps the code / temporary password on screen itself.

export function useIssueRecoveryCode() {
  return useMutation({
    mutationFn: ({ userId, reason }: { userId: string; reason: string }) => issueRecoveryCode(userId, { reason }),
    onError: (e) => toastError(e, 'Could not issue a recovery code.'),
  });
}
export function useResetUserAccess() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, reason }: { userId: string; reason: string }) => resetUserAccess(userId, { reason }),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: platformKeys.users() }),
    onError: (e) => toastError(e, 'Could not reset access.'),
  });
}

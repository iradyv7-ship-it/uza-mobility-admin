import type { PlatformRole } from '@/types/auth/role';

/** Staff roles that use the /admin workspace. */
export const PLATFORM_STAFF_ROLES: PlatformRole[] = [
  'SUPER_ADMIN',
  'MARKETPLACE_ADMIN',
  'FINANCE_ADMIN',
  'LOGISTICS_ADMIN',
  'FLEET_ADMIN',
  'SUSTAINABILITY_ADMIN',
  'ADVERTISING_ADMIN',
  'SALES_AGENT',
  'INTAKE_OFFICER',
];

/** Permissions that only platform staff hold. */
const ADMIN_PERMISSION_MARKERS = [
  'listings:approve',
  'listings:reject',
  'listings:feature',
  'listings:delete',
  'payments:verify',
  'payments:reject',
  'payments:refund',
  'invoices:send',
  'invoices:cancel',
  'financing:read',
  'financing:send-to-bank',
  'fleet:read',
  'fleet:update-status',
  'promotions:create',
  'promotions:manage',
  'sustainability:read',
  'sustainability:manage',
  'sellers:verify',
  'sellers:suspend',
  'users:manage-roles',
  'users:read',
  'orders:update-status',
  'invoices:read',
  'parts:manage',
  'stations:read-all',
  'stations:approve',
  'stations:reject',
  'stations:suspend',
] as const;

export function can(permissions: string[], action: string): boolean {
  if (permissions.includes('*')) return true;
  return permissions.includes(action);
}

export function canAny(permissions: string[], actions: string[]): boolean {
  return actions.some((action) => can(permissions, action));
}

export function isSuperAdmin(permissions: string[]): boolean {
  return permissions.includes('*');
}

export function hasAdminAccess(
  permissions: string[],
  roles?: readonly string[] | null,
): boolean {
  if (isSuperAdmin(permissions)) return true;

  if (
    roles?.some((role) =>
      (PLATFORM_STAFF_ROLES as readonly string[]).includes(role),
    )
  ) {
    return true;
  }

  return permissions.some((permission) =>
    (ADMIN_PERMISSION_MARKERS as readonly string[]).includes(permission),
  );
}

/**
 * Every role a SUPER_ADMIN can grant from the user sheet.
 *
 * This list is the UI's allow-list, not the API's — `PATCH /admin/users/:id/roles` accepts
 * any role that exists. Until 11 September 2026 the lender and workshop roles were missing
 * here, which meant a bank officer or a mechanic could only be onboarded with a raw API call
 * or SQL against production. The sheet initialises from the user's current roles, so a role
 * absent from this list was preserved on save rather than stripped — but it could never be
 * granted or removed from the panel, and that is the day-one operation for a new lender.
 */
export const assignableRoleNames = [
  'SUPER_ADMIN',
  'MARKETPLACE_ADMIN',
  'FINANCE_ADMIN',
  'LOGISTICS_ADMIN',
  'FLEET_ADMIN',
  'SUSTAINABILITY_ADMIN',
  'ADVERTISING_ADMIN',
  'SALES_AGENT',
  // Intake table only: fund-applications:manage and nothing else.
  'INTAKE_OFFICER',
  'SELLER',
  'BUYER',
  'CHARGING_OPERATOR',
  // Workshop
  'MECHANIC',
  'WORKSHOP_ADMIN',
  // Lender portals — one role per bank, checked by name in the API's LenderAccessGuard.
  // Granting LENDER_UNGUKA is also what makes the cash-collateral view reachable for that
  // account; every other lender role never sees it, by construction on the API side.
  'LENDER_UNGUKA',
  'LENDER_EQUITY',
  'LENDER_NCBA',
] as const;

export type AssignableRoleName = (typeof assignableRoleNames)[number];

export type AdminUser = {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
  isActive: boolean;
  deletedAt: string | null;
  roles: string[];
  createdAt: string;
  updatedAt: string;
};

export type ActivityLog = {
  id: string;
  action: string;
  entity: string;
  ipAddress: string | null;
  userAgent: string | null;
  metadata: Record<string, unknown> | null;
  occurredAt: string;
};

export type ActivityLogsFilters = {
  email?: string;
  action?: string;
  entity?: string;
  from?: string;
  to?: string;
  page?: number;
  limit?: number;
};

export const pricingSellerTypes = [
  'UZA_RWANDA_STOCK',
  'UZA_CHINA_SOURCING',
  'LOCAL_SELLER',
  'INTERNATIONAL_SELLER',
] as const;

export type PricingSellerType = (typeof pricingSellerTypes)[number];

export type PricingRule = {
  id: string;
  sellerType: PricingSellerType;
  originCountry: string | null;
  destinationCountry: string | null;
  shippingCostRwf: number | null;
  localChargesRwf: number | null;
  taxRatePercent: number | null;
  insuranceRatePercent: number | null;
  storagePerDayRwf: number | null;
  clearingFeeRwf: number | null;
  platformMarginPercent: number | null;
  commissionRate: number | null;
  discountRatePercent: number | null;
  deliveryDaysMin: number | null;
  deliveryDaysMax: number | null;
  isActive: boolean;
  validFrom: string;
  validUntil: string | null;
  createdAt: string;
  updatedAt: string;
};

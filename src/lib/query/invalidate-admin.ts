import type { QueryClient } from '@tanstack/react-query';
import { adminKeys } from '@/queries/admin';
import { commerceKeys } from '@/queries/commerce';

type AdminSegment =
  'listings' | 'parts' | 'sellers' | 'categories' | 'operators' | 'stations';

type CommerceSegment =
  'payments' | 'invoices' | 'orders' | 'financing' | 'buyers';

function invalidateAdminSegment(
  queryClient: QueryClient,
  segment: AdminSegment,
) {
  void queryClient.invalidateQueries({
    predicate: (query) =>
      query.queryKey[0] === adminKeys.all[0] && query.queryKey[1] === segment,
  });
}

function invalidateCommerceSegment(
  queryClient: QueryClient,
  segment: CommerceSegment,
) {
  void queryClient.invalidateQueries({
    predicate: (query) =>
      query.queryKey[0] === commerceKeys.all[0] &&
      query.queryKey[1] === segment,
  });
}

export function invalidateAdminDashboard(queryClient: QueryClient) {
  void queryClient.invalidateQueries({ queryKey: adminKeys.dashboard() });
}

/** Refetch listing tables and dashboard counts — not the entire admin cache. */
export function invalidateListingQueries(queryClient: QueryClient) {
  invalidateAdminSegment(queryClient, 'listings');
  invalidateAdminDashboard(queryClient);
}

export function invalidatePartQueries(queryClient: QueryClient) {
  invalidateAdminSegment(queryClient, 'parts');
  invalidateAdminDashboard(queryClient);
}

export function invalidateSellerQueries(queryClient: QueryClient) {
  invalidateAdminSegment(queryClient, 'sellers');
  invalidateAdminDashboard(queryClient);
}

export function invalidateCategoryQueries(queryClient: QueryClient) {
  invalidateAdminSegment(queryClient, 'categories');
}

export function invalidateStationQueries(queryClient: QueryClient) {
  invalidateAdminSegment(queryClient, 'operators');
  invalidateAdminSegment(queryClient, 'stations');
  invalidateAdminDashboard(queryClient);
}

export function invalidateCommercePayments(queryClient: QueryClient) {
  invalidateCommerceSegment(queryClient, 'payments');
  invalidateCommerceSegment(queryClient, 'invoices');
  invalidateAdminDashboard(queryClient);
}

export function invalidateCommerceInvoices(queryClient: QueryClient) {
  invalidateCommerceSegment(queryClient, 'invoices');
  invalidateAdminDashboard(queryClient);
}

export function invalidateCommerceOrders(queryClient: QueryClient) {
  invalidateCommerceSegment(queryClient, 'orders');
  invalidateAdminDashboard(queryClient);
}

export function invalidateCommerceFinancing(queryClient: QueryClient) {
  invalidateCommerceSegment(queryClient, 'financing');
  invalidateAdminDashboard(queryClient);
}

export function invalidateCommerceFleetInvoice(queryClient: QueryClient) {
  invalidateCommerceInvoices(queryClient);
  invalidateCommerceSegment(queryClient, 'buyers');
}

/** Refetch admin booking tables and dashboard — not guest mine caches or fee quote. */
export function invalidateAdminBookings(queryClient: QueryClient) {
  void queryClient.invalidateQueries({
    predicate: (query) =>
      query.queryKey[0] === 'bookings' && query.queryKey[1] === 'admin',
  });
  invalidateAdminDashboard(queryClient);
}

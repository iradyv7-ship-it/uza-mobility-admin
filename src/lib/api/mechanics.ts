import { authenticatedFetch } from '@/lib/api/authenticated';
import type { RegisterMechanicInput } from '@/schemas/mechanics';
import type { MechanicListRow } from '@/types/admin/mechanics';

export function listMechanics() {
  return authenticatedFetch<MechanicListRow[]>('/workshop/mechanics');
}

/**
 * Onboard a garage/workshop partner — there was no code path to create a Mechanic row at
 * all before this (see WorkshopService.registerMechanic in uza-mobility-bn). A
 * WORKSHOP_ADMIN/MECHANIC role alone granted portal access but no inspection could
 * actually be filed without this record existing too.
 */
export function registerMechanic(body: RegisterMechanicInput) {
  return authenticatedFetch<{ id: string }>('/admin/mechanics', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

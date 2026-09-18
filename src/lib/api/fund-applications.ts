import { authenticatedFetch } from '@/lib/api/authenticated';
import { authenticatedMultipartFetch } from '@/lib/api/multipart';
import { siteConfig } from '@/config/site';
import type {
  DeclarationsInput,
  FundApplicationInput,
  SignatureInput,
} from '@/schemas/fund-applications';
import type {
  FundApplication,
  FundApplicationDocument,
  FundApplicationDocumentKind,
  FundApplicationScreening,
  FundApplicationStatus,
} from '@/types/admin/fund-applications';

/**
 * The UZA Empower fund application, against `/financing/fund-applications` on the API.
 *
 * Staff-only on the API side (SUPER_ADMIN, FINANCE_ADMIN, MARKETPLACE_ADMIN,
 * INTAKE_OFFICER); the panel gates on the `fund-applications:manage` permission.
 */

const BASE = '/financing/fund-applications';

export type FundApplicationFilters = {
  status?: FundApplicationStatus | '';
  cohortId?: string;
};

export function listFundApplications(filters: FundApplicationFilters = {}) {
  const params = new URLSearchParams();
  if (filters.status) params.set('status', filters.status);
  if (filters.cohortId) params.set('cohortId', filters.cohortId);
  const qs = params.toString();
  return authenticatedFetch<FundApplication[]>(qs ? `${BASE}?${qs}` : BASE);
}

export function getFundApplication(id: string) {
  return authenticatedFetch<FundApplication>(`${BASE}/${id}`);
}

export function createFundApplication(body: FundApplicationInput) {
  return authenticatedFetch<FundApplication>(BASE, {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

/** A partial amendment. The API refuses this once the form has been signed. */
export function updateFundApplication(
  id: string,
  body: Partial<FundApplicationInput> | DeclarationsInput,
) {
  return authenticatedFetch<FundApplication>(`${BASE}/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  });
}

/**
 * Sign and submit. The API checks completeness — including each declaration separately —
 * BEFORE recording the signature, so an applicant is never asked to sign a form that is
 * then rejected.
 */
export function signFundApplication(id: string, body: SignatureInput) {
  return authenticatedFetch<FundApplication>(`${BASE}/${id}/signature`, {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export function getFundApplicationScreening(id: string) {
  return authenticatedFetch<FundApplicationScreening>(`${BASE}/${id}/screening`);
}

/** Every paper filed against the application, oldest first within each kind. */
export function listFundApplicationDocuments(id: string) {
  return authenticatedFetch<FundApplicationDocument[]>(`${BASE}/${id}/documents`);
}

/**
 * File the signed form (or another paper). Multipart: the file plus `kind` and, when it
 * replaces an earlier file of the same kind, a `note` saying why — the API refuses a
 * silent replacement, and keeps the earlier file either way.
 */
export function fileFundApplicationDocument(
  id: string,
  kind: FundApplicationDocumentKind,
  file: File,
  note?: string,
) {
  const form = new FormData();
  form.append('file', file);
  form.append('kind', kind);
  if (note?.trim()) form.append('note', note.trim());
  return authenticatedMultipartFetch<FundApplicationDocument>(`${BASE}/${id}/documents`, form);
}

/** The authenticated URL of the bytes — opened with the session's token, never a public link. */
export function fundApplicationDocumentFileUrl(id: string, documentId: string) {
  return `${siteConfig.apiUrl}${BASE}/${id}/documents/${documentId}/file`;
}


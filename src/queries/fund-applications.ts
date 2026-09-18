import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import type { FundApplicationDocumentKind } from '@/types/admin/fund-applications';
import { ApiClientError } from '@/lib/api/error';
import {
  createFundApplication,
  getFundApplication,
  getFundApplicationScreening,
  listFundApplications,
  signFundApplication,
  updateFundApplication,
  type FundApplicationFilters,
  fileFundApplicationDocument,
  listFundApplicationDocuments,
} from '@/lib/api/fund-applications';
import type {
  DeclarationsInput,
  FundApplicationInput,
  SignatureInput,
} from '@/schemas/fund-applications';

export const fundApplicationKeys = {
  all: ['fund-applications'] as const,
  list: (filters: FundApplicationFilters) =>
    [...fundApplicationKeys.all, 'list', filters] as const,
  one: (id: string) => [...fundApplicationKeys.all, 'one', id] as const,
  documents: (id: string) => [...fundApplicationKeys.all, 'documents', id] as const,
  screening: (id: string) =>
    [...fundApplicationKeys.all, 'screening', id] as const,
};

function mutationError(error: unknown) {
  // The API's messages here are written to be read aloud at the intake table —
  // "The applicant must confirm that the answers given are true…" — so they are shown as-is.
  return error instanceof ApiClientError
    ? error.message
    : 'Something went wrong. Please try again.';
}

export function useFundApplications(
  filters: FundApplicationFilters,
  enabled = true,
) {
  return useQuery({
    queryKey: fundApplicationKeys.list(filters),
    queryFn: () => listFundApplications(filters),
    enabled,
  });
}

export function useFundApplication(id: string | null) {
  return useQuery({
    queryKey: fundApplicationKeys.one(id ?? ''),
    queryFn: () => getFundApplication(id!),
    enabled: !!id,
  });
}

export function useFundApplicationScreening(id: string | null, enabled = true) {
  return useQuery({
    queryKey: fundApplicationKeys.screening(id ?? ''),
    queryFn: () => getFundApplicationScreening(id!),
    enabled: !!id && enabled,
  });
}

export function useCreateFundApplication() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: FundApplicationInput) => createFundApplication(body),
    onSuccess: (created) => {
      toast.success(`Application ${created.ref} saved as a draft`);
      void queryClient.invalidateQueries({ queryKey: fundApplicationKeys.all });
    },
    onError: (error) => toast.error(mutationError(error)),
  });
}

export function useUpdateFundApplication() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      body,
    }: {
      id: string;
      body: Partial<FundApplicationInput> | DeclarationsInput;
    }) => updateFundApplication(id, body),
    onSuccess: (updated) => {
      toast.success('Saved');
      void queryClient.invalidateQueries({ queryKey: fundApplicationKeys.all });
      void queryClient.invalidateQueries({
        queryKey: fundApplicationKeys.one(updated.id),
      });
    },
    onError: (error) => toast.error(mutationError(error)),
  });
}

export function useSignFundApplication() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: SignatureInput }) =>
      signFundApplication(id, body),
    onSuccess: (signed) => {
      toast.success(`${signed.ref} signed and submitted`);
      void queryClient.invalidateQueries({ queryKey: fundApplicationKeys.all });
    },
    onError: (error) => toast.error(mutationError(error)),
  });
}

export function useFundApplicationDocuments(id: string | null) {
  return useQuery({
    queryKey: fundApplicationKeys.documents(id ?? ''),
    queryFn: () => listFundApplicationDocuments(id ?? ''),
    enabled: !!id,
  });
}

export function useFileFundApplicationDocument(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      kind,
      file,
      note,
    }: {
      kind: FundApplicationDocumentKind;
      file: File;
      note?: string;
    }) => fileFundApplicationDocument(id, kind, file, note),
    onSuccess: (doc) => {
      toast.success(`${doc.kind.replaceAll('_', ' ').toLowerCase()} filed by ${doc.filedBy.name}`);
      void queryClient.invalidateQueries({ queryKey: fundApplicationKeys.documents(id) });
    },
    onError: (error) => toast.error(mutationError(error)),
  });
}


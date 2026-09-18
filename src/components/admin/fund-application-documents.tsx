'use client';

import { useRef, useState } from 'react';
import { useSession } from 'next-auth/react';
import { FileText, ShieldCheck, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDateTime } from '@/lib/admin/format';
import { fundApplicationDocumentFileUrl } from '@/lib/api/fund-applications';
import {
  useFileFundApplicationDocument,
  useFundApplicationDocuments,
} from '@/queries/fund-applications';
import {
  fundApplicationDocumentKinds,
  type FundApplicationDocument,
  type FundApplicationDocumentKind,
} from '@/types/admin/fund-applications';

const kindLabel: Record<FundApplicationDocumentKind, string> = {
  SIGNED_FORM: 'Signed application form (UZA-EMP-F01)',
  NATIONAL_ID: 'National ID',
  DRIVING_LICENCE: 'Driving licence',
  PROOF_OF_SAVINGS: 'Proof of savings',
  OTHER: 'Other',
};

/**
 * The papers filed against an application — above all the signed form, uploaded by the
 * head of UZA Mobility or an assigned employee once the applicant has signed.
 *
 * Nothing here can be edited or removed, and the screen does not pretend otherwise: there
 * is no delete button. Every row shows who filed it, when, and the SHA-256 of the exact
 * bytes, because that is what makes the record worth anything to a bank or a court years
 * later. Filing a second copy of the same kind requires a reason, and the first copy stays.
 */
export function FundApplicationDocuments({
  applicationId,
  signed,
}: {
  applicationId: string;
  signed: boolean;
}) {
  const docs = useFundApplicationDocuments(applicationId);
  const file = useFileFundApplicationDocument(applicationId);
  const { data: session } = useSession();
  const inputRef = useRef<HTMLInputElement>(null);
  const [kind, setKind] = useState<FundApplicationDocumentKind>('SIGNED_FORM');
  const [note, setNote] = useState('');
  const [chosen, setChosen] = useState<File | null>(null);

  const existingOfKind = (docs.data ?? []).some((d) => d.kind === kind && !isSuperseded(d, docs.data ?? []));
  const needsNote = existingOfKind && !note.trim();
  const blockedSignedForm = kind === 'SIGNED_FORM' && !signed;

  const submit = async () => {
    if (!chosen) return;
    await file.mutateAsync({ kind, file: chosen, note: note || undefined });
    setChosen(null);
    setNote('');
    if (inputRef.current) inputRef.current.value = '';
  };

  const open = async (d: FundApplicationDocument) => {
    // The bytes are behind an authenticated route, so a plain <a href> would 401. Fetch with
    // the session token and open the blob; nothing is left at a guessable URL.
    const res = await fetch(fundApplicationDocumentFileUrl(applicationId, d.id), {
      headers: { Authorization: `Bearer ${session?.accessToken ?? ''}` },
    });
    if (!res.ok) return;
    const url = URL.createObjectURL(await res.blob());
    window.open(url, '_blank', 'noopener');
    setTimeout(() => URL.revokeObjectURL(url), 60_000);
  };

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Documents on file</h3>
        <span className="text-xs text-muted-foreground">Append-only · engraved against the filing employee</span>
      </div>

      {docs.isLoading ? (
        <Skeleton className="h-16 w-full" />
      ) : docs.data && docs.data.length > 0 ? (
        <ul className="space-y-2">
          {docs.data.map((d) => {
            const superseded = isSuperseded(d, docs.data ?? []);
            return (
              <li
                key={d.id}
                className={`rounded-md border p-3 text-sm ${superseded ? 'opacity-60' : ''}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-2">
                    <FileText className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden />
                    <div>
                      <div className="font-medium">
                        {kindLabel[d.kind]}
                        {superseded ? <span className="ml-2 text-xs font-normal text-muted-foreground">superseded</span> : null}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {d.originalName} · {(d.sizeBytes / 1024).toFixed(0)} KB
                      </div>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => void open(d)}>
                    Open
                  </Button>
                </div>
                <dl className="mt-2 grid gap-x-6 gap-y-1 text-xs sm:grid-cols-2">
                  <div className="flex gap-2">
                    <dt className="text-muted-foreground">Filed by</dt>
                    <dd>
                      {d.filedBy.name}
                      {d.filedBy.uzaId ? <span className="ml-1 font-mono">{d.filedBy.uzaId}</span> : null}
                    </dd>
                  </div>
                  <div className="flex gap-2">
                    <dt className="text-muted-foreground">Filed at</dt>
                    <dd>{formatDateTime(d.filedAt)}</dd>
                  </div>
                  <div className="flex gap-2 sm:col-span-2">
                    <dt className="flex items-center gap-1 text-muted-foreground">
                      <ShieldCheck className="size-3" aria-hidden /> SHA-256
                    </dt>
                    <dd className="break-all font-mono">{d.sha256}</dd>
                  </div>
                  {d.note ? (
                    <div className="flex gap-2 sm:col-span-2">
                      <dt className="text-muted-foreground">Why re-filed</dt>
                      <dd>{d.note}</dd>
                    </div>
                  ) : null}
                </dl>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="text-sm text-muted-foreground">Nothing filed yet.</p>
      )}

      <div className="space-y-3 rounded-md border border-dashed p-3">
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="doc-kind">What is being filed</Label>
            <NativeSelect
              id="doc-kind"
              value={kind}
              onChange={(e) => setKind(e.target.value as FundApplicationDocumentKind)}
            >
              {fundApplicationDocumentKinds.map((k) => (
                <NativeSelectOption key={k} value={k}>
                  {kindLabel[k]}
                </NativeSelectOption>
              ))}
            </NativeSelect>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="doc-file">File (PDF or image)</Label>
            <Input
              id="doc-file"
              ref={inputRef}
              type="file"
              accept="application/pdf,image/*"
              onChange={(e) => setChosen(e.target.files?.[0] ?? null)}
            />
          </div>
        </div>
        {existingOfKind ? (
          <div className="space-y-1.5">
            <Label htmlFor="doc-note">
              A {kindLabel[kind].toLowerCase()} is already on file — why file another? (kept alongside, never replaced)
            </Label>
            <Input
              id="doc-note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. page 2 was missing on the first scan"
            />
          </div>
        ) : null}
        {blockedSignedForm ? (
          <p className="text-xs text-destructive">
            Record the signature first (above); then file the signed form.
          </p>
        ) : null}
        <Button
          type="button"
          size="sm"
          disabled={!chosen || needsNote || blockedSignedForm || file.isPending}
          onClick={() => void submit()}
        >
          <Upload className="size-4" aria-hidden />
          {file.isPending ? 'Filing…' : 'File against this application'}
        </Button>
      </div>
    </section>
  );
}

function isSuperseded(d: FundApplicationDocument, all: FundApplicationDocument[]) {
  return all.some((x) => x.supersedesId === d.id);
}

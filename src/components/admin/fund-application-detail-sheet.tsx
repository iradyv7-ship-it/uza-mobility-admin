'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { StatusBadge } from '@/components/admin/shared/status-badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select';
import { Separator } from '@/components/ui/separator';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDate, formatDateTime, formatRwf } from '@/lib/admin/format';
import {
  useFundApplication,
  useFundApplicationScreening,
  useSignFundApplication,
  useUpdateFundApplication,
} from '@/queries/fund-applications';
import {
  signatureSchema,
  type SignatureFormValues,
  type SignatureInput,
} from '@/schemas/fund-applications';
import {
  blockingGapKinds,
  preferredLenders,
  screeningGapLabels,
  type FundApplication,
} from '@/types/admin/fund-applications';

type Props = {
  id: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function FundApplicationDetailSheet({ id, open, onOpenChange }: Props) {
  const app = useFundApplication(id);
  const a = app.data;
  const signed = !!a?.signedAt;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-2xl">
        <SheetHeader>
          <SheetTitle className="font-mono text-base">{a?.ref ?? 'Application'}</SheetTitle>
          <SheetDescription>
            {a ? (
              <span className="flex items-center gap-2">
                <StatusBadge status={a.status} />
                <span>{a.fullName} · {a.phone}</span>
              </span>
            ) : (
              'Loading…'
            )}
          </SheetDescription>
        </SheetHeader>

        {app.isLoading || !a ? (
          <div className="space-y-3 py-6">
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-24 w-full" />
          </div>
        ) : (
          <div className="space-y-8 py-6">
            <Summary a={a} />
            <Separator />
            {/* Keyed on updatedAt so a saved change re-initialises the local state without
                an effect-driven setState. */}
            <Declarations key={`${a.id}:${a.updatedAt}`} a={a} locked={signed} />
            <Separator />
            {signed ? <SignedBlock a={a} /> : <SignatureForm a={a} />}
            <Separator />
            <Screening id={a.id} />
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[40%_1fr] gap-2 text-sm">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="tabular-nums">{value ?? '—'}</dd>
    </div>
  );
}

function Summary({ a }: { a: FundApplication }) {
  return (
    <dl className="grid gap-x-8 gap-y-1.5 sm:grid-cols-2">
      <Row label="National ID" value={a.nationalId} />
      <Row label="District" value={[a.district, a.sector, a.cell].filter(Boolean).join(' · ')} />
      <Row label="Licence" value={a.licenceNumber ? `${a.licenceNumber}${a.licenceCategory ? ` (${a.licenceCategory})` : ''}` : null} />
      <Row label="Licence expiry" value={a.licenceExpiry ? formatDate(a.licenceExpiry) : null} />
      <Row label="Years driving" value={a.yearsDriving} />
      <Row label="Vehicle" value={a.currentVehicle?.replaceAll('_', ' ').toLowerCase()} />
      <Row label="Daily takings" value={formatRwf(a.averageDailyTakingsRwf)} />
      <Row label="Days / week" value={a.workingDaysPerWeek} />
      <Row label="Savings" value={`${formatRwf(a.currentSavingsRwf)}${a.savingsHeldAt ? ` · ${a.savingsHeldAt.replaceAll('_', ' ').toLowerCase()}` : ''}`} />
      <Row label="Bank account" value={a.hasBankAccount ? (a.bankName ?? 'yes') : 'no'} />
      <Row label="MoMo" value={a.mobileMoneyNumber} />
      <Row label="Preferred term" value={a.preferredTenorMonths ? `${a.preferredTenorMonths} months` : null} />
      <Row label="Completion" value={a.completionMode === 'ASSISTED' ? `Assisted${a.assistedByRef ? ` · ${a.assistedByRef}` : ''}` : a.completionMode?.toLowerCase()} />
      <Row label="Created" value={formatDateTime(a.createdAt)} />
    </dl>
  );
}

/**
 * Section 6 of the paper form. Three boxes, ticked separately, and the third names one
 * institution. Locked once signed — changing a declaration after the signature rewrites what
 * was signed, and the API refuses it anyway.
 */
function Declarations({ a, locked }: { a: FundApplication; locked: boolean }) {
  const update = useUpdateFundApplication();
  const [state, setState] = useState({
    declarationAccepted: a.declarationAccepted,
    dataProcessingConsentGiven: a.dataProcessingConsentGiven,
    lenderConsentGiven: a.lenderConsentGiven,
    preferredLenderKey: a.preferredLenderKey ?? '',
  });
  const dirty =
    state.declarationAccepted !== a.declarationAccepted ||
    state.dataProcessingConsentGiven !== a.dataProcessingConsentGiven ||
    state.lenderConsentGiven !== a.lenderConsentGiven ||
    state.preferredLenderKey !== (a.preferredLenderKey ?? '');

  const box = (
    key: 'declarationAccepted' | 'dataProcessingConsentGiven' | 'lenderConsentGiven',
    letter: string,
    title: string,
    text: string,
  ) => (
    <label className="flex items-start gap-3 rounded-md border p-3 text-sm">
      <Checkbox
        className="mt-0.5"
        disabled={locked}
        checked={state[key]}
        onCheckedChange={(v) => setState((s) => ({ ...s, [key]: v === true }))}
      />
      <span>
        <span className="font-medium">{letter}. {title}</span>
        <span className="block text-muted-foreground">{text}</span>
      </span>
    </label>
  );

  return (
    <section className="space-y-3">
      <h3 className="text-sm font-semibold">Declarations (section 6)</h3>
      {box('declarationAccepted', 'A', 'The answers are true', 'Required before signing.')}
      {box('dataProcessingConsentGiven', 'B', 'UZA may keep and use the record', 'Under Law N° 058/2021. Required before signing.')}
      {box('lenderConsentGiven', 'C', 'One named institution may read the file', 'Optional. Not signing C does not prevent joining the programme.')}
      {state.lenderConsentGiven ? (
        <div className="space-y-1.5 pl-9">
          <Label htmlFor="fa-lender">Institution named in C</Label>
          <NativeSelect
            id="fa-lender"
            disabled={locked}
            value={state.preferredLenderKey}
            onChange={(e) => setState((s) => ({ ...s, preferredLenderKey: e.target.value }))}
            className="w-64"
          >
            <NativeSelectOption value="">— choose —</NativeSelectOption>
            {preferredLenders.map((l) => (
              <NativeSelectOption key={l.key} value={l.key}>{l.label}</NativeSelectOption>
            ))}
          </NativeSelect>
          {!state.preferredLenderKey ? (
            <p className="text-xs text-muted-foreground">
              Consent needs a recipient. With no institution named, nothing is recorded.
            </p>
          ) : null}
        </div>
      ) : null}
      {!locked ? (
        <Button
          size="sm"
          disabled={!dirty || update.isPending}
          onClick={() =>
            update.mutate({
              id: a.id,
              body: {
                declarationAccepted: state.declarationAccepted,
                dataProcessingConsentGiven: state.dataProcessingConsentGiven,
                lenderConsentGiven: state.lenderConsentGiven,
                preferredLenderKey: state.preferredLenderKey || undefined,
              },
            })
          }
        >
          {update.isPending ? 'Saving…' : 'Save declarations'}
        </Button>
      ) : (
        <p className="text-xs text-muted-foreground">Locked — this application has been signed.</p>
      )}
    </section>
  );
}

function SignatureForm({ a }: { a: FundApplication }) {
  const sign = useSignFundApplication();
  const { register, handleSubmit, formState } = useForm<
    SignatureFormValues,
    unknown,
    SignatureInput
  >({
    resolver: zodResolver(signatureSchema),
    defaultValues: { signatureRef: '', witnessName: '', witnessRef: '' },
  });
  const ready = a.declarationAccepted && a.dataProcessingConsentGiven;

  return (
    <section className="space-y-3">
      <h3 className="text-sm font-semibold">Signature</h3>
      {!ready ? (
        <p className="rounded-md border border-dashed p-3 text-sm text-muted-foreground">
          Declarations A and B must be saved before the form can be signed. The API checks
          this before recording anything, so nobody is asked to sign a form that is then refused.
        </p>
      ) : null}
      <form
        className="grid gap-3 sm:grid-cols-2"
        onSubmit={handleSubmit((v) => sign.mutate({ id: a.id, body: v }))}
      >
        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="sig-ref">Reference of the scanned, signed form</Label>
          <Input id="sig-ref" placeholder="e.g. scan/2026/09/UZM-APP-2026-000012.pdf" {...register('signatureRef')} />
          {formState.errors.signatureRef ? (
            <p className="text-xs text-destructive">{formState.errors.signatureRef.message}</p>
          ) : null}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="sig-witness">Witness name</Label>
          <Input id="sig-witness" {...register('witnessName')} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="sig-witness-ref">Witness reference</Label>
          <Input id="sig-witness-ref" {...register('witnessRef')} />
        </div>
        <div className="sm:col-span-2">
          <Button type="submit" disabled={!ready || sign.isPending}>
            {sign.isPending ? 'Recording…' : 'Record signature and submit'}
          </Button>
        </div>
      </form>
    </section>
  );
}

function SignedBlock({ a }: { a: FundApplication }) {
  return (
    <section className="space-y-2">
      <h3 className="text-sm font-semibold">Signature</h3>
      <dl className="space-y-1.5">
        <Row label="Signed" value={formatDateTime(a.signedAt)} />
        <Row label="Signature reference" value={<span className="font-mono text-xs">{a.signatureRef}</span>} />
        <Row label="Witness" value={[a.witnessName, a.witnessRef].filter(Boolean).join(' · ') || null} />
        <Row label="Submitted" value={formatDateTime(a.submittedAt)} />
      </dl>
      <p className="text-xs text-muted-foreground">
        A signed application cannot be changed. A correction is a new application that references this one.
      </p>
    </section>
  );
}

/** Gaps to close, never a verdict. Only two kinds block intake. */
function Screening({ id }: { id: string }) {
  const screening = useFundApplicationScreening(id);
  const s = screening.data;
  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Screening</h3>
        {s ? (
          <span className={`text-xs font-medium ${s.blockedAtIntake ? 'text-destructive' : 'text-emerald-700 dark:text-emerald-400'}`}>
            {s.blockedAtIntake ? 'Blocked at intake' : 'Not blocked — gaps to close'}
          </span>
        ) : null}
      </div>
      {screening.isLoading ? (
        <Skeleton className="h-16 w-full" />
      ) : s && s.gaps.length > 0 ? (
        <ul className="space-y-2">
          {s.gaps.map((g) => {
            const blocking = blockingGapKinds.includes(g.kind);
            return (
              <li key={g.kind} className={`rounded-md border p-3 text-sm ${blocking ? 'border-destructive/50' : ''}`}>
                <div className="flex items-center justify-between">
                  <span className="font-medium">{screeningGapLabels[g.kind]}</span>
                  {blocking ? <span className="text-xs text-destructive">blocks intake</span> : null}
                </div>
                <p className="text-muted-foreground">{g.detail}</p>
              </li>
            );
          })}
        </ul>
      ) : s ? (
        <p className="rounded-md border p-3 text-sm text-muted-foreground">
          No gaps. This applicant is already bankable on the answers given.
        </p>
      ) : null}
      <p className="text-xs text-muted-foreground">
        Nobody is refused for being poor or unbanked — that is who the programme is for. Only a
        missing licence or missing identity documents stop somebody at the door.
      </p>
    </section>
  );
}

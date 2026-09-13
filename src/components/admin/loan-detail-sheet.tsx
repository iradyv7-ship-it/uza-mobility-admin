'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { StatusBadge } from '@/components/admin/shared/status-badge';
import { Button } from '@/components/ui/button';
import { NumberInput, numberRegisterOptions } from '@/components/ui/number-input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { formatDateTime, formatRwf } from '@/lib/admin/format';
import {
  useChangeLoanTenor,
  useLoan,
  useLoanChangeRequests,
  useReviewLoanChange,
} from '@/queries/loans';
import { changeTenorSchema, type ChangeTenorInput } from '@/schemas/loans';
import type { LoanChangeRequest, LoanDetail } from '@/types/admin/loans';

type Props = {
  id: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

/**
 * A loan's full file for staff: what it is, its tenor-change history, and any change a
 * lender has proposed that needs review — the permission gate the lender side did not
 * have before this (see LoanChangeRequest's doc comment in schema.prisma).
 */
export function LoanDetailSheet({ id, open, onOpenChange }: Props) {
  const loan = useLoan(id);
  const l = loan.data;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-2xl">
        <SheetHeader>
          <SheetTitle className="font-mono text-base">
            {l?.reference ?? 'Loan'}
          </SheetTitle>
          <SheetDescription>
            {l ? (
              <span className="flex items-center gap-2">
                <StatusBadge status={l.status} />
                <span>
                  {[l.borrower.firstName, l.borrower.lastName].filter(Boolean).join(' ')}
                  {l.borrower.uzaId ? ` · ${l.borrower.uzaId}` : ''}
                </span>
              </span>
            ) : (
              'Loading…'
            )}
          </SheetDescription>
        </SheetHeader>

        {loan.isLoading || !l ? (
          <div className="space-y-3 py-6">
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-24 w-full" />
          </div>
        ) : (
          <div className="space-y-8 py-6">
            <Summary l={l} />
            <Separator />
            <InspectionReserve l={l} />
            <Separator />
            <TenorChange l={l} />
            {l.tenorChanges.length > 0 ? (
              <>
                <Separator />
                <TenorHistory l={l} />
              </>
            ) : null}
            <Separator />
            <ChangeRequests loanId={l.id} />
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[45%_1fr] gap-2 text-sm">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="tabular-nums">{value ?? '—'}</dd>
    </div>
  );
}

function Summary({ l }: { l: LoanDetail }) {
  return (
    <dl className="grid gap-x-8 gap-y-1.5 sm:grid-cols-2">
      <Row label="Vehicle price" value={formatRwf(l.vehiclePriceRwf)} />
      <Row label="Contribution" value={formatRwf(l.clientContributionRwf)} />
      <Row label="Principal financed" value={formatRwf(l.principalRwf)} />
      <Row label="Outstanding" value={formatRwf(l.outstandingRwf)} />
      <Row label="Tenor" value={`${l.tenorMonths} months`} />
      <Row label="Rate" value={`${(l.annualRateBps / 100).toFixed(1)}% p.a.`} />
      <Row label="Monthly payment" value={formatRwf(l.monthlyRwf)} />
      <Row label="Daily target" value={formatRwf(l.dailyRwf)} />
      <Row label="Total repayable" value={formatRwf(l.totalRepayableRwf)} />
      <Row label="Vehicle" value={vehicleLine(l)} />
      <Row label="Chassis / VIN" value={<span className="font-mono text-xs">{l.vehicle?.chassisNumber}</span>} />
      <Row label="Created" value={formatDateTime(l.createdAt)} />
    </dl>
  );
}

function vehicleLine(l: LoanDetail) {
  return [l.vehicle?.year, l.vehicle?.make, l.vehicle?.model, l.vehicle?.color]
    .filter(Boolean)
    .join(' ');
}

/** Mobility Ecosystem Blueprint, Section 06 — the daily set-aside so the next inspection
 * is never a surprise bill. The 15,000 RWF rate is an explicit, unnegotiated ASSUMPTION,
 * shown as such rather than presented as settled. */
function InspectionReserve({ l }: { l: LoanDetail }) {
  const e = l.inspectionEconomics;
  return (
    <section className="space-y-2">
      <h3 className="text-sm font-semibold">Inspection reserve</h3>
      <p className="text-xs text-muted-foreground">
        {e.condition === 'NEW' ? 'New' : 'Used'} vehicle — {e.inspectionsPerYear} inspections/year,
        every {e.cycleDays} days. Rate ({formatRwf(e.contractedRateRwf)}) is a proposed structure,
        not yet negotiated with a real garage partner.
      </p>
      <dl className="grid gap-x-8 gap-y-1.5 text-sm sm:grid-cols-2">
        <Row label="Daily reserve" value={formatRwf(e.dailyReserveRwf)} />
        <Row label="Garage take-home" value={formatRwf(e.garageTakeHomeRwf)} />
        <Row label="UZA platform fee" value={formatRwf(e.uzaPlatformFeeRwf)} />
      </dl>
    </section>
  );
}

/** Staff changing tenor directly — a UZA decision, distinct from a lender's change request. */
function TenorChange({ l }: { l: LoanDetail }) {
  const changeTenor = useChangeLoanTenor(l.id);
  const { register, handleSubmit, formState, reset } = useForm<ChangeTenorInput>({
    resolver: zodResolver(changeTenorSchema),
    defaultValues: { newTenorMonths: l.tenorMonths },
  });

  return (
    <section className="space-y-3">
      <h3 className="text-sm font-semibold">Change tenor</h3>
      <p className="text-xs text-muted-foreground">
        Re-quotes the outstanding balance ({formatRwf(l.outstandingRwf)}) at the new
        tenor&apos;s own rate band — never a discount on the current figures — and notifies
        the borrower and staff.
      </p>
      <form
        className="grid gap-3 sm:grid-cols-[auto_1fr_auto] sm:items-end"
        onSubmit={handleSubmit(async (values) => {
          await changeTenor.mutateAsync(values);
          reset({ newTenorMonths: values.newTenorMonths, reason: '' });
        })}
      >
        <div className="space-y-1.5">
          <Label htmlFor="tenor-new">New tenor (months)</Label>
          <NumberInput
            id="tenor-new"
            className="w-32"
            {...register('newTenorMonths', numberRegisterOptions())}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="tenor-reason">Reason</Label>
          <Textarea id="tenor-reason" rows={1} {...register('reason')} />
        </div>
        <Button type="submit" disabled={changeTenor.isPending}>
          {changeTenor.isPending ? 'Applying…' : 'Apply'}
        </Button>
        {formState.errors.newTenorMonths ? (
          <p className="text-xs text-destructive sm:col-span-3">
            {formState.errors.newTenorMonths.message}
          </p>
        ) : null}
      </form>
    </section>
  );
}

function TenorHistory({ l }: { l: LoanDetail }) {
  return (
    <section className="space-y-2">
      <h3 className="text-sm font-semibold">Tenor history</h3>
      <ul className="space-y-2">
        {l.tenorChanges.map((c) => (
          <li key={c.id} className="rounded-md border p-3 text-sm">
            <div className="flex items-center justify-between">
              <span>
                {c.fromTenorMonths} → {c.toTenorMonths} months
              </span>
              <span className="text-xs text-muted-foreground">
                {formatDateTime(c.createdAt)}
              </span>
            </div>
            <p className="text-muted-foreground">
              {formatRwf(c.fromMonthlyRwf)} → {formatRwf(c.toMonthlyRwf)} / month
            </p>
            {c.reason ? <p className="mt-1 text-muted-foreground">{c.reason}</p> : null}
          </li>
        ))}
      </ul>
    </section>
  );
}

/** The lender's proposed changes on this loan, waiting for a UZA decision. */
function ChangeRequests({ loanId }: { loanId: string }) {
  const requests = useLoanChangeRequests(loanId);
  const review = useReviewLoanChange(loanId);
  const [notes, setNotes] = useState<Record<string, string>>({});

  const pending = requests.data?.filter((r) => r.status === 'PENDING') ?? [];
  const decided = requests.data?.filter((r) => r.status !== 'PENDING') ?? [];

  return (
    <section className="space-y-3">
      <h3 className="text-sm font-semibold">Lender change requests</h3>
      {requests.isLoading ? <Skeleton className="h-16 w-full" /> : null}
      {!requests.isLoading && (requests.data?.length ?? 0) === 0 ? (
        <p className="text-sm text-muted-foreground">
          No changes proposed by the lender on this loan.
        </p>
      ) : null}
      {pending.map((r) => (
        <div key={r.id} className="space-y-2 rounded-md border border-amber-500/40 p-3 text-sm">
          <ChangeRequestSummary r={r} />
          <Textarea
            placeholder="Review note (optional)"
            rows={2}
            value={notes[r.id] ?? ''}
            onChange={(e) => setNotes((n) => ({ ...n, [r.id]: e.target.value }))}
          />
          <div className="flex gap-2">
            <Button
              size="sm"
              disabled={review.isPending}
              onClick={() =>
                review.mutate({
                  changeRequestId: r.id,
                  body: { approve: true, reviewNote: notes[r.id] },
                })
              }
            >
              Approve and apply
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={review.isPending}
              onClick={() =>
                review.mutate({
                  changeRequestId: r.id,
                  body: { approve: false, reviewNote: notes[r.id] },
                })
              }
            >
              Reject
            </Button>
          </div>
        </div>
      ))}
      {decided.map((r) => (
        <div key={r.id} className="rounded-md border p-3 text-sm text-muted-foreground">
          <div className="flex items-center justify-between">
            <ChangeRequestSummary r={r} />
            <StatusBadge status={r.status} />
          </div>
          {r.reviewNote ? <p className="mt-1">{r.reviewNote}</p> : null}
        </div>
      ))}
    </section>
  );
}

function ChangeRequestSummary({ r }: { r: LoanChangeRequest }) {
  return (
    <div>
      <span className="font-medium">{r.changeType.replaceAll('_', ' ').toLowerCase()}</span>
      <span className="ml-2 text-muted-foreground">{JSON.stringify(r.payload)}</span>
      {r.note ? <p className="text-muted-foreground">{r.note}</p> : null}
    </div>
  );
}

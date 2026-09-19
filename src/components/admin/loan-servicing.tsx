'use client';

import { useRef, useState } from 'react';
import { Banknote, FileUp, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { formatDate, formatDateTime, formatRwf } from '@/lib/admin/format';
import {
  useCloseLoan,
  useDisburseLoan,
  useImportLoanRepayments,
  useLoanRepayments,
  useRecordLoanRepayment,
} from '@/queries/loans';
import {
  loanRepaymentSources,
  type LoanDetail,
  type LoanRepaymentSource,
} from '@/types/admin/loans';

/**
 * What happens to the loan after the bank says yes: disbursement, every repayment, arrears,
 * and closure. This is the only screen that moves a loan's balance; everything else on the
 * platform — the lender's portal, the covenant engine, the impact views — reads what is
 * recorded here.
 *
 * The figures shown are the serviced ones: balance is what remains to be repaid, interest
 * included, from the day of disbursement; arrears is instalments due and unpaid, recomputed
 * nightly and on every repayment.
 */
export function LoanServicing({ l }: { l: LoanDetail }) {
  const disbursed = !!l.disbursedAt;
  const closed = !!l.closedAt;
  return (
    <section className="space-y-5">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Servicing</h3>
        <span className="text-xs text-muted-foreground">
          {closed
            ? `Closed ${formatDate(l.closedAt!)}`
            : disbursed
              ? `Disbursed ${formatDate(l.disbursedAt!)} · first instalment 30 days later`
              : 'Not yet disbursed'}
        </span>
      </div>

      <dl className="grid grid-cols-2 gap-x-6 gap-y-1 text-sm sm:grid-cols-4">
        <Stat label="Total repayable" value={formatRwf(l.totalRepayableRwf)} />
        <Stat label="Paid" value={formatRwf(l.paidRwf)} />
        <Stat label="Balance" value={formatRwf(l.outstandingRwf)} />
        <Stat
          label="Arrears"
          value={formatRwf(l.arrearsRwf)}
          tone={l.arrearsRwf > 0 ? 'bad' : 'good'}
          hint={
            l.arrearsRwf > 0 && l.monthlyRwf > 0
              ? `${Math.floor(l.arrearsRwf / l.monthlyRwf)} instalment(s) behind`
              : undefined
          }
        />
      </dl>

      {!disbursed ? <Disburse l={l} /> : null}
      {disbursed ? <Repayments l={l} /> : null}
      {disbursed && !closed ? <Close l={l} /> : null}
    </section>
  );
}

function Stat({
  label,
  value,
  tone,
  hint,
}: {
  label: string;
  value: string;
  tone?: 'good' | 'bad';
  hint?: string;
}) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd
        className={`font-medium tabular-nums ${tone === 'bad' ? 'text-destructive' : tone === 'good' ? 'text-emerald-700 dark:text-emerald-400' : ''}`}
      >
        {value}
      </dd>
      {hint ? <dd className="text-xs text-muted-foreground">{hint}</dd> : null}
    </div>
  );
}

function Disburse({ l }: { l: LoanDetail }) {
  const disburse = useDisburseLoan(l.id);
  const [date, setDate] = useState('');
  const [ref, setRef] = useState('');
  const approved = l.status === 'APPROVED';
  return (
    <div className="space-y-3 rounded-md border border-dashed p-3">
      <p className="text-sm">
        {approved
          ? `Record the bank's payout. The balance becomes ${formatRwf(l.totalRepayableRwf)} and the driver's daily target ${formatRwf(l.dailyRwf)}.`
          : `Only an APPROVED loan can be disbursed; this one is ${l.status}.`}
      </p>
      {approved ? (
        <>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="disb-date">Disbursed on</Label>
              <Input id="disb-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="disb-ref">Bank reference</Label>
              <Input id="disb-ref" value={ref} onChange={(e) => setRef(e.target.value)} placeholder="UNG-DISB-…" />
            </div>
          </div>
          <Button
            size="sm"
            disabled={disburse.isPending}
            onClick={() =>
              disburse.mutate({
                disbursedAt: date || undefined,
                reference: ref || undefined,
              })
            }
          >
            <Banknote className="size-4" aria-hidden />
            {disburse.isPending ? 'Recording…' : 'Record disbursement'}
          </Button>
        </>
      ) : null}
    </div>
  );
}

function Repayments({ l }: { l: LoanDetail }) {
  const repayments = useLoanRepayments(l.id);
  const record = useRecordLoanRepayment(l.id);
  const importFile = useImportLoanRepayments();
  const fileRef = useRef<HTMLInputElement>(null);
  const [amount, setAmount] = useState('');
  const [paidAt, setPaidAt] = useState('');
  const [reference, setReference] = useState('');
  const [source, setSource] = useState<LoanRepaymentSource>('MANUAL');
  const [note, setNote] = useState('');
  const closed = !!l.closedAt;

  const submit = async () => {
    await record.mutateAsync({
      amountRwf: Math.round(Number(amount)),
      paidAt,
      reference: reference.trim(),
      source,
      note: note.trim() || undefined,
    });
    setAmount('');
    setReference('');
    setNote('');
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <h4 className="text-sm font-medium">Repayments</h4>
        {repayments.isLoading ? (
          <Skeleton className="h-12 w-full" />
        ) : repayments.data && repayments.data.length > 0 ? (
          <div className="overflow-x-auto rounded-md border">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-3 py-2">Paid on</th>
                  <th className="px-3 py-2">Reference</th>
                  <th className="px-3 py-2">Source</th>
                  <th className="px-3 py-2 text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                {repayments.data.map((r) => (
                  <tr key={r.id} className="border-t">
                    <td className="px-3 py-2">{formatDate(r.paidAt)}</td>
                    <td className="px-3 py-2 font-mono text-xs">{r.reference}</td>
                    <td className="px-3 py-2 text-xs">{r.source.replaceAll('_', ' ').toLowerCase()}</td>
                    <td className="px-3 py-2 text-right tabular-nums">{formatRwf(r.amountRwf)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No repayment recorded yet.</p>
        )}
      </div>

      {!closed ? (
        <>
          <div className="space-y-3 rounded-md border border-dashed p-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="rp-amount">Amount (RWF)</Label>
                <Input id="rp-amount" inputMode="numeric" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder={String(l.monthlyRwf)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="rp-date">Paid on</Label>
                <Input id="rp-date" type="date" value={paidAt} onChange={(e) => setPaidAt(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="rp-ref">Bank reference (never recorded twice)</Label>
                <Input id="rp-ref" value={reference} onChange={(e) => setReference(e.target.value)} placeholder="UNG-R-…" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="rp-source">Source</Label>
                <NativeSelect id="rp-source" value={source} onChange={(e) => setSource(e.target.value as LoanRepaymentSource)}>
                  {loanRepaymentSources.map((s) => (
                    <NativeSelectOption key={s} value={s}>
                      {s === 'LENDER_FILE' ? "Bank's file" : s === 'MANUAL' ? 'Receipt (typed)' : 'Standing order'}
                    </NativeSelectOption>
                  ))}
                </NativeSelect>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="rp-note">Note</Label>
              <Input id="rp-note" value={note} onChange={(e) => setNote(e.target.value)} />
            </div>
            <Button
              size="sm"
              disabled={!amount || !paidAt || !reference.trim() || record.isPending}
              onClick={() => void submit()}
            >
              {record.isPending ? 'Recording…' : 'Record repayment'}
            </Button>
          </div>

          <div className="flex flex-wrap items-center gap-3 rounded-md border border-dashed p-3">
            <FileUp className="size-4 text-muted-foreground" aria-hidden />
            <div className="text-sm">
              <div className="font-medium">Import the bank&apos;s repayment file</div>
              <div className="text-xs text-muted-foreground">
                .csv or .xlsx — columns Loan / Amount / Date / Reference, any order. Rows already on file are skipped, never doubled. Applies to every loan in the file.
              </div>
            </div>
            <Input
              ref={fileRef}
              type="file"
              accept=".csv,.xlsx,text/csv"
              className="max-w-xs"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) importFile.mutate(f, { onSettled: () => { if (fileRef.current) fileRef.current.value = ''; } });
              }}
            />
          </div>
          {importFile.data && (importFile.data.failed.length > 0 || importFile.data.parseErrors.length > 0) ? (
            <ul className="space-y-1 rounded-md border border-amber-500/50 bg-amber-500/5 p-3 text-xs">
              {importFile.data.parseErrors.map((e) => (
                <li key={`p${e.row}`}>Row {e.row}: {e.problem}</li>
              ))}
              {importFile.data.failed.map((f, i) => (
                <li key={`f${i}`}>{f.row.loanRef} · {f.row.reference}: {f.problem}</li>
              ))}
            </ul>
          ) : null}
        </>
      ) : null}
    </div>
  );
}

function Close({ l }: { l: LoanDetail }) {
  const close = useCloseLoan(l.id);
  const [note, setNote] = useState('');
  const balance = l.outstandingRwf > 0;
  return (
    <div className="space-y-3 rounded-md border border-dashed p-3">
      <div className="flex items-start gap-2 text-sm">
        <Lock className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden />
        <p>
          {balance
            ? `${formatRwf(l.outstandingRwf)} is still outstanding. Closing needs a written reason — settlement, write-off, or a restructure into a new loan.`
            : 'Fully repaid. Closing returns the driver’s reserve to their own savings and tells them the car is theirs.'}
        </p>
      </div>
      {balance ? (
        <Textarea rows={2} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Why the loan is being closed with a balance" />
      ) : null}
      <Button
        size="sm"
        variant={balance ? 'destructive' : 'default'}
        disabled={(balance && !note.trim()) || close.isPending}
        onClick={() => close.mutate({ note: note.trim() || undefined })}
      >
        {close.isPending ? 'Closing…' : 'Close loan'}
      </Button>
      <p className="text-xs text-muted-foreground">Last change {formatDateTime(l.updatedAt)}.</p>
    </div>
  );
}

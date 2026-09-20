'use client';

import { useEffect, useMemo, useState } from 'react';
import { Calculator, Lock, RotateCcw, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { formatRwf } from '@/lib/admin/format';
import {
  useApplyLoanScenario,
  useLenderTerms,
  useLoanScenario,
  useScenarioStudy,
} from '@/queries/loans';
import type {
  Scenario,
  ScenarioCheck,
  ScenarioInput,
  Study,
  StudyPoint,
} from '@/types/admin/scenario';

/**
 * The scenario studio. Every formula lives in the API (`scenario.rules.ts`); this screen
 * only edits the inputs and shows what comes back, so a number can never disagree with the
 * one the loan was booked on.
 *
 * Rules the studio follows:
 *  - Price, client money, tenor and lender are the honest inputs. Contribution %, rate,
 *    UZA and bank are OVERRIDES: leaving them blank means "apply the rule", and the result
 *    says which it did. Typing over the bank figure re-derives UZA; typing over UZA
 *    re-derives the bank.
 *  - Nothing is saved until "Book these numbers" is pressed, and only onto an undisbursed
 *    loan. Warnings must be accepted explicitly; blocks cannot be booked at all.
 */
export function ScenarioStudio({
  loanId,
  initial,
  disbursed,
}: {
  loanId?: string;
  initial?: ScenarioInput;
  disbursed?: boolean;
}) {
  const fromLoan = useLoanScenario(loanId && !initial ? loanId : null);
  const seed = initial ?? (fromLoan.data?.base ? inputFrom(fromLoan.data.base) : undefined);

  return seed ? (
    <Studio loanId={loanId} seed={seed} disbursed={!!disbursed} />
  ) : (
    <div className="space-y-3">
      <Skeleton className="h-4 w-1/3" />
      <Skeleton className="h-32 w-full" />
    </div>
  );
}

/** The booked numbers as a pinned input: what is on file, whether or not it follows the rule. */
function inputFrom(s: Scenario): ScenarioInput {
  return {
    vehiclePriceRwf: s.inputs.vehiclePriceRwf,
    clientContributionRwf: s.inputs.clientContributionRwf,
    tenorMonths: s.inputs.tenorMonths,
    lenderKey: s.lender?.key,
    uzaCollateralRwf: s.rule.uzaSource === 'rule' ? undefined : s.split.uzaCollateralRwf,
    bankLoanRwf: s.rule.bankSource === 'rule' ? undefined : s.split.bankLoanRwf,
    grandfatheredMinimumRwf:
      s.rule.appliedClientMinimumRwf !== s.rule.suggestedClientMinimumRwf
        ? s.rule.appliedClientMinimumRwf
        : undefined,
  };
}

function useDebounced<T>(value: T, ms: number): T {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return v;
}

function Studio({ loanId, seed, disbursed }: { loanId?: string; seed: ScenarioInput; disbursed: boolean }) {
  const [input, setInput] = useState<ScenarioInput>(seed);
  const [note, setNote] = useState('');
  const [acceptWarnings, setAcceptWarnings] = useState(false);
  const debounced = useDebounced(input, 350);
  const study = useScenarioStudy(debounced);
  const lenders = useLenderTerms();
  const apply = useApplyLoanScenario(loanId ?? '');

  const s = study.data?.base;
  const lender = lenders.data?.find((l) => l.key === input.lenderKey);
  const tenorOptions = useMemo(() => {
    const set = new Set<number>([12, 24, 36, 48, 60, ...(lender?.tenorsMonths ?? []), input.tenorMonths]);
    return Array.from(set).sort((a, b) => a - b);
  }, [lender, input.tenorMonths]);

  const set = <K extends keyof ScenarioInput>(k: K, v: ScenarioInput[K]) =>
    setInput((p) => ({ ...p, [k]: v }));
  const num = (v: string): number | undefined => (v.trim() === '' ? undefined : Math.round(Number(v)));

  const warns = s?.checks.filter((c) => c.severity === 'warn') ?? [];
  const blocks = s?.checks.filter((c) => c.severity === 'block') ?? [];
  const canBook = !!loanId && !disbursed && !!s && blocks.length === 0 && (warns.length === 0 || acceptWarnings);

  return (
    <section className="space-y-5">
      <div className="flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-sm font-semibold">
          <Calculator className="h-4 w-4" /> Scenario studio
        </h3>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setInput((p) => ({ ...p, uzaCollateralRwf: undefined, bankLoanRwf: undefined, contributionPct: undefined, annualRateBps: undefined }))}
            title="Clear every override and apply the rule"
          >
            <RotateCcw className="mr-1 h-3.5 w-3.5" /> Back to the rule
          </Button>
          {loanId ? (
            <Button variant="ghost" size="sm" onClick={() => setInput(seed)} title="Reload the numbers as booked">
              As booked
            </Button>
          ) : null}
        </div>
      </div>

      {/* ── Inputs ─────────────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Field label="Lender">
          <NativeSelect value={input.lenderKey ?? ''} onChange={(e) => set('lenderKey', e.target.value || undefined)}>
            <NativeSelectOption value="">— generic —</NativeSelectOption>
            {(lenders.data ?? []).map((l) => (
              <NativeSelectOption key={l.key} value={l.key}>
                {l.name}
                {l.rateOnFile ? '' : ' (no rate on file)'}
              </NativeSelectOption>
            ))}
          </NativeSelect>
        </Field>
        <Field label="Vehicle price (RWF)">
          <Input type="number" inputMode="numeric" value={input.vehiclePriceRwf} onChange={(e) => set('vehiclePriceRwf', num(e.target.value) ?? 0)} />
        </Field>
        <Field label="Client's own money (RWF)">
          <Input type="number" inputMode="numeric" value={input.clientContributionRwf} onChange={(e) => set('clientContributionRwf', num(e.target.value) ?? 0)} />
        </Field>
        <Field label="Tenor (months)">
          <NativeSelect value={String(input.tenorMonths)} onChange={(e) => set('tenorMonths', Number(e.target.value))}>
            {tenorOptions.map((t) => (
              <NativeSelectOption key={t} value={String(t)}>
                {t} months{lender && !lender.tenorsMonths.includes(t) ? ' (not offered)' : ''}
              </NativeSelectOption>
            ))}
          </NativeSelect>
        </Field>

        <Field label="Contribution expected" hint={s ? sourceLabel(s.rule.contributionPctSource, `${s.rule.contributionPct}%`) : undefined}>
          <Input type="number" inputMode="decimal" step="0.5" placeholder={s ? `${s.rule.contributionPct}` : '10'} value={input.contributionPct ?? ''} onChange={(e) => set('contributionPct', e.target.value === '' ? undefined : Number(e.target.value))} />
        </Field>
        <Field label="Interest, % a year" hint={s ? sourceLabel(s.rule.rateSource, s.rule.annualRateBps === null ? 'no rate' : `${s.rule.annualRateBps / 100}%`) : undefined}>
          <Input type="number" inputMode="decimal" step="0.25" placeholder={s?.rule.annualRateBps != null ? String(s.rule.annualRateBps / 100) : 'type a rate'} value={input.annualRateBps === undefined ? '' : input.annualRateBps / 100} onChange={(e) => set('annualRateBps', e.target.value === '' ? undefined : Math.round(Number(e.target.value) * 100))} />
        </Field>
        <Field label="UZA cash collateral (RWF)" hint={s ? sourceLabel(s.rule.uzaSource, formatRwf(s.split.uzaCollateralRwf)) : undefined}>
          <Input type="number" inputMode="numeric" placeholder={s ? String(s.split.uzaCollateralRwf) : ''} value={input.uzaCollateralRwf ?? ''} onChange={(e) => set('uzaCollateralRwf', num(e.target.value))} />
        </Field>
        <Field label="Bank lends (RWF)" hint={s ? sourceLabel(s.rule.bankSource, formatRwf(s.split.bankLoanRwf)) : undefined}>
          <Input type="number" inputMode="numeric" placeholder={s ? String(s.split.bankLoanRwf) : ''} value={input.bankLoanRwf ?? ''} onChange={(e) => set('bankLoanRwf', num(e.target.value))} />
        </Field>
      </div>

      {/* ── The result ─────────────────────────────────────────────────────────────── */}
      {!s ? (
        <Skeleton className="h-24 w-full" />
      ) : (
        <>
          <div className={cn('rounded-lg border p-4', study.isFetching && 'opacity-70')}>
            <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm sm:grid-cols-4">
              <Stat label={`${s.rule.contributionPct}% of the price`} value={formatRwf(s.rule.requiredContributionRwf)} hint="what the bank expects, client + UZA" />
              <Stat label="Suggested client minimum" value={formatRwf(s.rule.suggestedClientMinimumRwf)} hint={s.rule.appliedClientMinimumRwf !== s.rule.suggestedClientMinimumRwf ? `applied here: ${formatRwf(s.rule.appliedClientMinimumRwf)}` : 'by vehicle price'} tone={s.split.clientShortfallToMinimumRwf > 0 ? 'bad' : undefined} />
              <Stat label="Client + UZA" value={`${formatRwf(s.split.coverRwf)} · ${s.split.coverPctOfPrice}%`} tone={s.split.coverPctOfPrice < s.rule.contributionPct ? 'bad' : 'good'} />
              <Stat label="Bank lends" value={`${formatRwf(s.split.bankLoanRwf)} · ${s.split.bankPctOfPrice}%`} />
              <Stat label="Client brings" value={formatRwf(s.split.clientContributionRwf)} />
              <Stat label="UZA pledges" value={formatRwf(s.split.uzaCollateralRwf)} hint="sits at the bank until release" />
              <Stat label="Seller receives" value={formatRwf(s.split.sellerReceivesRwf)} hint="client + bank, at disbursement" />
              <Stat label="Per working day" value={s.schedule ? formatRwf(s.schedule.dailyRwf) : '—'} hint={s.schedule ? `${formatRwf(s.schedule.monthlyRwf)} a month · ${s.schedule.tenorMonths} months` : 'no rate'} tone="good" />
              <Stat label="Total interest" value={s.schedule ? formatRwf(s.schedule.totalInterestRwf) : '—'} />
              <Stat label="Total repayable" value={s.schedule ? formatRwf(s.schedule.totalRepayableRwf) : '—'} />
            </div>
          </div>

          {s.checks.length ? (
            <ul className="space-y-1.5">
              {s.checks.map((c) => (
                <Check key={c.code + c.message} c={c} />
              ))}
            </ul>
          ) : (
            <p className="text-xs text-muted-foreground">On the rule: client + UZA = {s.rule.contributionPct}% of the price, the bank lends the rest.</p>
          )}

          {/* ── Studies ─────────────────────────────────────────────────────────────── */}
          {study.data ? <Studies st={study.data} /> : null}

          {/* ── Book ────────────────────────────────────────────────────────────────── */}
          {loanId ? (
            disbursed ? (
              <p className="flex items-center gap-2 text-xs text-muted-foreground">
                <Lock className="h-3.5 w-3.5" /> Disbursed — the schedule is the bank's now. Studying is free; booking goes through servicing or a tenor change.
              </p>
            ) : (
              <div className="space-y-3 rounded-lg border border-dashed p-4">
                <Label htmlFor="scenario-note">Why these numbers</Label>
                <Textarea id="scenario-note" rows={2} placeholder="e.g. Analyst held the NETA at 22.5M; client paid 1.5M on 18 Sept" value={note} onChange={(e) => setNote(e.target.value)} />
                {warns.length ? (
                  <label className="flex items-center gap-2 text-xs">
                    <input type="checkbox" checked={acceptWarnings} onChange={(e) => setAcceptWarnings(e.target.checked)} />
                    I have read the {warns.length} warning{warns.length > 1 ? 's' : ''} above and want to book anyway
                  </label>
                ) : null}
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">
                    {blocks.length ? 'Cannot be booked — see the blocks above.' : 'Writes price, contribution, principal, schedule, UZA pledge and wallet targets. Audited with before and after.'}
                  </span>
                  <Button size="sm" disabled={!canBook || apply.isPending} onClick={() => apply.mutate({ ...input, note: note.trim() || undefined, acceptWarnings })}>
                    <Save className="mr-1 h-3.5 w-3.5" /> Book these numbers
                  </Button>
                </div>
              </div>
            )
          ) : null}
        </>
      )}
    </section>
  );
}

function Studies({ st }: { st: Study }) {
  const [tab, setTab] = useState<'tenor' | 'rate' | 'client' | 'lender'>('tenor');
  const rows: StudyPoint[] =
    tab === 'tenor' ? st.byTenor : tab === 'rate' ? st.byRate : tab === 'client' ? st.byClientContribution : st.byLender;
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1">
        {(
          [
            ['tenor', 'If the years change'],
            ['rate', 'If the interest changes'],
            ['client', 'If the client brings more'],
            ['lender', 'By bank'],
          ] as const
        ).map(([k, label]) => (
          <button key={k} type="button" onClick={() => setTab(k)} className={cn('rounded-md border px-2.5 py-1 text-xs', tab === k ? 'bg-foreground text-background' : 'text-muted-foreground hover:bg-muted')}>
            {label}
          </button>
        ))}
      </div>
      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full text-xs">
          <thead className="bg-muted/50 text-left">
            <tr>
              <th className="px-3 py-2 font-medium">Scenario</th>
              <th className="px-3 py-2 text-right font-medium">Client</th>
              <th className="px-3 py-2 text-right font-medium">UZA</th>
              <th className="px-3 py-2 text-right font-medium">Bank</th>
              <th className="px-3 py-2 text-right font-medium">Per day</th>
              <th className="px-3 py-2 text-right font-medium">Δ / day</th>
              <th className="px-3 py-2 text-right font-medium">Total interest</th>
              <th className="px-3 py-2 text-right font-medium">Δ interest</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((p) => {
              const x = p.scenario;
              const blocked = !x.bookable;
              return (
                <tr key={p.label} className={cn('border-t', p.dailyDeltaRwf === 0 && 'bg-muted/30 font-medium')}>
                  <td className="px-3 py-1.5">
                    {p.label}
                    {blocked ? <span className="ml-2 rounded bg-amber-100 px-1 text-[10px] text-amber-800 dark:bg-amber-900/40 dark:text-amber-200">{x.checks.find((c) => c.severity === 'block')?.code.toLowerCase().replace(/_/g, ' ')}</span> : null}
                  </td>
                  <td className="px-3 py-1.5 text-right tabular-nums">{formatRwf(x.split.clientContributionRwf)}</td>
                  <td className="px-3 py-1.5 text-right tabular-nums">{formatRwf(x.split.uzaCollateralRwf)}</td>
                  <td className="px-3 py-1.5 text-right tabular-nums">{formatRwf(x.split.bankLoanRwf)}</td>
                  <td className="px-3 py-1.5 text-right tabular-nums">{x.schedule ? formatRwf(x.schedule.dailyRwf) : '—'}</td>
                  <td className={cn('px-3 py-1.5 text-right tabular-nums', delta(p.dailyDeltaRwf))}>{fmtDelta(p.dailyDeltaRwf)}</td>
                  <td className="px-3 py-1.5 text-right tabular-nums">{x.schedule ? formatRwf(x.schedule.totalInterestRwf) : '—'}</td>
                  <td className={cn('px-3 py-1.5 text-right tabular-nums', delta(p.totalInterestDeltaRwf))}>{fmtDelta(p.totalInterestDeltaRwf)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {tab === 'client' ? (
        <p className="text-[11px] text-muted-foreground">
          Below the bank&apos;s percentage, more client money only reduces what UZA pledges — the daily figure does not move. Above it, every franc the client brings lowers the loan and the daily figure.
        </p>
      ) : null}
    </div>
  );
}

function sourceLabel(src: string, value: string) {
  const word = src === 'rule' || src === 'lender' ? 'rule' : src === 'override' ? 'typed' : src === 'derivedFromBank' ? 'from bank figure' : src === 'default' ? 'default' : src;
  return `${value} · ${word}`;
}
const delta = (d: number | null) => (d === null || d === 0 ? 'text-muted-foreground' : d > 0 ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400');
const fmtDelta = (d: number | null) => (d === null ? '—' : d === 0 ? '·' : `${d > 0 ? '+' : '−'}${Math.abs(d).toLocaleString('en-US')}`);

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <Label className="text-xs">{label}</Label>
      {children}
      {hint ? <p className="text-[11px] text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

function Stat({ label, value, hint, tone }: { label: string; value: string; hint?: string; tone?: 'good' | 'bad' }) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className={cn('font-medium tabular-nums', tone === 'bad' && 'text-red-600 dark:text-red-400', tone === 'good' && 'text-emerald-700 dark:text-emerald-400')}>{value}</dd>
      {hint ? <p className="text-[11px] text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

function Check({ c }: { c: ScenarioCheck }) {
  const cls =
    c.severity === 'block'
      ? 'border-red-200 bg-red-50 text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200'
      : c.severity === 'warn'
        ? 'border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200'
        : 'border-border bg-muted/40 text-muted-foreground';
  return (
    <li className={cn('rounded-md border px-3 py-1.5 text-xs', cls)}>
      <span className="mr-2 font-semibold uppercase tracking-wide">{c.severity}</span>
      {c.message}
    </li>
  );
}

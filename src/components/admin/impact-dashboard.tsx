'use client';

import { PageHeader } from '@/components/shared/page-header';
import { Skeleton } from '@/components/ui/skeleton';
import { formatRwf } from '@/lib/admin/format';
import { useFunderImpact, useInvestorImpact } from '@/queries/impact';

type Card = { label: string; value: string };

function CardGrid({ cards }: { cards: Card[] }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => (
        <div key={card.label} className="rounded-lg border p-4">
          <p className="text-sm text-muted-foreground">{card.label}</p>
          <p className="mt-1 text-2xl font-semibold">{card.value}</p>
        </div>
      ))}
    </div>
  );
}

function Gaps({ gaps }: { gaps: Record<string, string> }) {
  const entries = Object.entries(gaps);
  if (entries.length === 0) return null;
  return (
    <div className="space-y-2 rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
      <p className="font-medium text-foreground">Not computed, on purpose</p>
      {entries.map(([key, note]) => (
        <p key={key}>
          <span className="font-medium">{key}:</span> {note}
        </p>
      ))}
    </div>
  );
}

/**
 * The Mobility Ecosystem Blueprint's Section 10: "the same underlying facts, not three
 * separate reports that can quietly drift apart." Both sections below read from the same
 * ImpactService in uza-mobility-bn as the funder and investor views — never a separately
 * maintained deck.
 */
export function AdminImpactDashboard() {
  const funder = useFunderImpact();
  const investor = useInvestorImpact();

  return (
    <div className="space-y-10">
      <PageHeader
        title="Impact"
        description="One shared ledger, read two ways — the funder's programme story and the investor's commercial one, built from the same facts."
      />

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Funder / DFI view</h2>
        {funder.isLoading ? (
          <Skeleton className="h-32 w-full" />
        ) : funder.isError ? (
          <p className="text-sm text-destructive">Failed to load.</p>
        ) : funder.data ? (
          <>
            <CardGrid
              cards={[
                { label: 'Cohorts', value: String(funder.data.cohortsCount) },
                { label: 'Trainees enrolled', value: String(funder.data.traineesEnrolled) },
                { label: 'Trainees completed', value: String(funder.data.traineesCompleted) },
                {
                  label: 'Women',
                  value: funder.data.womenPct != null ? `${funder.data.womenPct}%` : '—',
                },
                {
                  label: 'Youth (≤35)',
                  value: funder.data.youthPct != null ? `${funder.data.youthPct}%` : '—',
                },
                { label: 'EVs financed', value: String(funder.data.evsFinanced) },
                {
                  label: 'Technicians certified',
                  value: String(funder.data.techniciansCertified),
                },
                {
                  label: 'Collateral bridged',
                  value: formatRwf(funder.data.collateralBridgedRwf),
                },
                { label: 'Km recorded', value: funder.data.totalKmRecorded.toLocaleString() },
              ]}
            />
            <Gaps gaps={funder.data.gaps} />
          </>
        ) : null}
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Investor view</h2>
        {investor.isLoading ? (
          <Skeleton className="h-32 w-full" />
        ) : investor.isError ? (
          <p className="text-sm text-destructive">Failed to load.</p>
        ) : investor.data ? (
          <>
            <CardGrid
              cards={[
                { label: 'Loans originated', value: String(investor.data.loansOriginated) },
                {
                  label: 'Active / disbursed',
                  value: String(investor.data.loansActiveOrDisbursed),
                },
                {
                  label: 'Total principal',
                  value: formatRwf(investor.data.totalPrincipalRwf),
                },
                {
                  label: 'Average principal',
                  value: formatRwf(investor.data.averagePrincipalRwf),
                },
                { label: 'Outstanding', value: formatRwf(investor.data.outstandingRwf) },
                { label: 'Arrears', value: formatRwf(investor.data.arrearsRwf) },
                { label: 'Inspections filed', value: String(investor.data.inspectionsFiled) },
                {
                  label: 'Garage-network revenue (UZA)',
                  value: formatRwf(investor.data.garageNetworkRevenue.uzaPlatformFeeRwf),
                },
              ]}
            />
            <Gaps gaps={investor.data.gaps} />
          </>
        ) : null}
      </section>
    </div>
  );
}

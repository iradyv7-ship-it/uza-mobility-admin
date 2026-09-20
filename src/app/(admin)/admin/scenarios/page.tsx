import { ScenarioStudio } from '@/components/admin/scenario-studio';

/**
 * A free study, not tied to a loan: the same engine the loan sheet books with, opened on a
 * typical batch-1 car so the first screen already says something.
 */
export default function AdminScenariosPage() {
  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-xl font-semibold">Financing scenarios</h1>
        <p className="text-sm text-muted-foreground">
          The 10% rule, UZA&apos;s support and what the bank funds, live. Move any number and
          the others follow; the studies show what the years, the interest, the client&apos;s
          own money and the choice of bank do to the daily figure.
        </p>
      </div>
      <ScenarioStudio
        initial={{
          vehiclePriceRwf: 22_500_000,
          clientContributionRwf: 1_500_000,
          tenorMonths: 60,
          lenderKey: 'unguka',
        }}
      />
    </div>
  );
}

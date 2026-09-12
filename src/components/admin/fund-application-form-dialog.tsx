'use client';

import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select';
import { Textarea } from '@/components/ui/textarea';
import {
  fundApplicationSchema,
  type FundApplicationFormValues,
  type FundApplicationInput,
} from '@/schemas/fund-applications';
import { useCreateFundApplication } from '@/queries/fund-applications';
import {
  completionModes,
  genders,
  preferredLenders,
  savingsLocations,
  vehicleRelationships,
} from '@/types/admin/fund-applications';

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: (id: string) => void;
};

/**
 * The intake form, in the paper form's section order (UZA-EMP-F01 §1–5 and the office-use
 * "how it was completed" box). Declarations and signature are NOT here: they happen on the
 * detail sheet after the draft exists, because a signature is an event with a time, not a
 * field on a form.
 */
export function FundApplicationFormDialog({ open, onOpenChange, onCreated }: Props) {
  const create = useCreateFundApplication();
  const form = useForm<FundApplicationFormValues, unknown, FundApplicationInput>({
    resolver: zodResolver(fundApplicationSchema),
    defaultValues: {
      completionMode: 'ASSISTED',
      hasBankAccount: false,
      hasBorrowedBefore: false,
      currentlyRepayingLoan: false,
    },
  });
  const { register, handleSubmit, formState, setValue, control, reset } = form;
  const errors = formState.errors;
  const [hasBankAccount, hasBorrowedBefore, currentlyRepayingLoan] = useWatch({
    control,
    name: ['hasBankAccount', 'hasBorrowedBefore', 'currentlyRepayingLoan'],
  });
  const flags = { hasBankAccount, hasBorrowedBefore, currentlyRepayingLoan };

  const submit = handleSubmit(async (values) => {
    const created = await create.mutateAsync(values);
    reset();
    onCreated(created.id);
  });

  const field = (
    name: keyof FundApplicationFormValues,
    label: string,
    props: React.ComponentProps<typeof Input> = {},
  ) => (
    <div className="space-y-1.5">
      <Label htmlFor={`fa-${name}`}>{label}</Label>
      <Input id={`fa-${name}`} {...props} {...register(name as never)} />
      {errors[name] ? (
        <p className="text-xs text-destructive">{String(errors[name]?.message ?? '')}</p>
      ) : null}
    </div>
  );

  const select = (
    name: keyof FundApplicationFormValues,
    label: string,
    options: readonly { value: string; label: string }[],
  ) => (
    <div className="space-y-1.5">
      <Label htmlFor={`fa-${name}`}>{label}</Label>
      <NativeSelect id={`fa-${name}`} {...register(name as never)}>
        <NativeSelectOption value="">—</NativeSelectOption>
        {options.map((o) => (
          <NativeSelectOption key={o.value} value={o.value}>
            {o.label}
          </NativeSelectOption>
        ))}
      </NativeSelect>
    </div>
  );

  const bool = (name: 'hasBankAccount' | 'hasBorrowedBefore' | 'currentlyRepayingLoan', label: string) => (
    <label className="flex items-center gap-2 text-sm">
      <Checkbox
        checked={!!flags[name]}
        onCheckedChange={(v) => setValue(name, v === true, { shouldDirty: true })}
      />
      {label}
    </label>
  );

  const enumOptions = (values: readonly string[]) =>
    values.map((v) => ({ value: v, label: v.replaceAll('_', ' ').toLowerCase() }));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>New UZA Empower application</DialogTitle>
          <DialogDescription>
            Key in from the signed paper form, section by section. Only name, national ID,
            telephone and district are needed to save a draft; everything else can be added
            later. Declarations and the signature are recorded after saving.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={submit} className="space-y-8">
          <Section n="1" title="Identity">
            <Grid>
              {field('fullName', 'Full name *')}
              {field('nationalId', 'National ID *')}
              {field('phone', 'Telephone *', { placeholder: '+2507…' })}
              {field('alternatePhone', 'Alternative telephone')}
              {field('dateOfBirth', 'Date of birth', { type: 'date' })}
              {select('gender', 'Gender', enumOptions(genders))}
              {field('district', 'District *')}
              {field('sector', 'Sector')}
              {field('cell', 'Cell')}
            </Grid>
          </Section>

          <Section n="2" title="Driving">
            <Grid>
              {field('licenceNumber', 'Driving licence number')}
              {field('licenceCategory', 'Licence category')}
              {field('licenceExpiry', 'Licence expiry', { type: 'date' })}
              {field('yearsDriving', 'Years driving for a living', { type: 'number', min: 0, max: 60 })}
              {select('currentVehicle', 'Vehicle currently driven', enumOptions(vehicleRelationships))}
              {field('currentPlate', 'Plate number')}
              {field('associationName', 'Cooperative or association')}
            </Grid>
          </Section>

          <Section n="3" title="Income (whole RWF, self-declared)">
            <Grid>
              {field('averageDailyTakingsRwf', 'Average daily takings', { inputMode: 'numeric' })}
              {field('workingDaysPerWeek', 'Working days per week', { type: 'number', min: 0, max: 7 })}
              {field('currentDailyRentalRwf', 'Current daily rental paid', { inputMode: 'numeric' })}
              {field('otherMonthlyIncomeRwf', 'Other monthly income', { inputMode: 'numeric' })}
              {field('dependants', 'Dependants', { type: 'number', min: 0, max: 30 })}
            </Grid>
          </Section>

          <Section n="4" title="Savings and banking">
            <Grid>
              {field('currentSavingsRwf', 'Current savings', { inputMode: 'numeric' })}
              {select('savingsHeldAt', 'Held at', enumOptions(savingsLocations))}
              {field('monthlySavingCapacityRwf', 'Monthly saving capacity', { inputMode: 'numeric' })}
              {field('bankName', 'Bank name')}
              {field('mobileMoneyNumber', 'Mobile money number')}
            </Grid>
            <div className="flex flex-wrap gap-6 pt-2">
              {bool('hasBankAccount', 'Has a bank account')}
              {bool('hasBorrowedBefore', 'Has borrowed before')}
              {bool('currentlyRepayingLoan', 'Currently repaying a loan')}
            </div>
            {currentlyRepayingLoan ? (
              <div className="space-y-1.5 pt-2">
                <Label htmlFor="fa-currentLoanDetail">Current loan — details</Label>
                <Textarea id="fa-currentLoanDetail" rows={2} {...register('currentLoanDetail')} />
              </div>
            ) : null}
          </Section>

          <Section n="5" title="What they are applying for">
            <Grid>
              {field('preferredTenorMonths', 'Preferred term (months, 12–60)', { type: 'number', min: 12, max: 60 })}
              {field('depositAvailableRwf', 'Deposit available now', { inputMode: 'numeric' })}
              {select(
                'preferredLenderKey',
                'Preferred institution (section C of the form)',
                preferredLenders.map((l) => ({ value: l.key, label: l.label })),
              )}
            </Grid>
          </Section>

          <Section n="Office" title="How the form was completed">
            <Grid>
              {select(
                'completionMode',
                'Completion',
                completionModes.map((m) => ({
                  value: m,
                  label: m === 'ASSISTED' ? 'Read aloud in Kinyarwanda by staff' : 'Self-service',
                })),
              )}
              {field('assistedByRef', 'Assisting staff reference')}
            </Grid>
          </Section>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={create.isPending}>
              {create.isPending ? 'Saving…' : 'Save draft'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function Section({ n, title, children }: { n: string; title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
        {n}. {title}
      </h3>
      {children}
    </section>
  );
}

function Grid({ children }: { children: React.ReactNode }) {
  return <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{children}</div>;
}

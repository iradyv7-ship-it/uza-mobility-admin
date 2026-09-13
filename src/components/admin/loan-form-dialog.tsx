'use client';

import { useMemo, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  SearchablePicker,
  type SearchablePickerOption,
} from '@/components/admin/shared/searchable-picker';
import { Button } from '@/components/ui/button';
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
import { NumberInput, numberRegisterOptions } from '@/components/ui/number-input';
import { useAdminUsers } from '@/queries/platform';
import { useCreateLoan } from '@/queries/loans';
import { createLoanSchema, type CreateLoanInput } from '@/schemas/loans';
import { lenderOptions } from '@/types/admin/loans';

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: (id: string) => void;
};

/**
 * Originating a loan — the screen behind `POST /admin/loans`, which had no UI (or any
 * code path at all) before this. Vehicle price and the driver's own contribution decide
 * the financed amount; tenor and lender decide the rate band. See LoanLifecycleService in
 * uza-mobility-bn for what happens on submit: a Loan + LoanVehicle are created, and a
 * STAFF_RECORDED LenderConsent is set so the bank's portal can actually see this loan.
 */
export function LoanFormDialog({ open, onOpenChange, onCreated }: Props) {
  const create = useCreateLoan();
  const users = useAdminUsers();
  const [borrowerSearch, setBorrowerSearch] = useState('');

  const { register, handleSubmit, formState, setValue, control, reset } =
    useForm<CreateLoanInput>({
      resolver: zodResolver(createLoanSchema),
      defaultValues: {
        lenderKey: 'unguka',
        tenorMonths: 60,
        vehicle: {},
      },
    });
  const errors = formState.errors;
  const borrowerUserId = useWatch({ control, name: 'borrowerUserId' });

  const borrowerOptions = useMemo<SearchablePickerOption[]>(() => {
    if (!users.data) return [];
    const needle = borrowerSearch.trim().toLowerCase();
    return users.data
      .filter((u) => {
        if (!needle) return true;
        const name = [u.firstName, u.lastName, u.email, u.uzaId]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        return name.includes(needle);
      })
      .slice(0, 30)
      .map((u) => ({
        value: u.id,
        label: [u.firstName, u.lastName].filter(Boolean).join(' ') || u.email,
        hint: [u.uzaId, u.email].filter(Boolean).join(' · '),
      }));
  }, [users.data, borrowerSearch]);

  const selectedBorrower = users.data?.find((u) => u.id === borrowerUserId);

  const submit = handleSubmit(async (values) => {
    const created = await create.mutateAsync(values);
    reset();
    setBorrowerSearch('');
    onCreated(created.id);
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Originate a loan</DialogTitle>
          <DialogDescription>
            UZA has selected this person for the programme — the bank&apos;s own decision is
            recorded separately, on its own timeline, once the lender acts on it.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={submit} className="space-y-6">
          <SearchablePicker
            label="Borrower *"
            value={borrowerUserId ?? ''}
            onValueChange={(value) =>
              setValue('borrowerUserId', value, { shouldValidate: true })
            }
            options={borrowerOptions}
            selectedOption={
              selectedBorrower
                ? {
                    value: selectedBorrower.id,
                    label:
                      [selectedBorrower.firstName, selectedBorrower.lastName]
                        .filter(Boolean)
                        .join(' ') || selectedBorrower.email,
                    hint: selectedBorrower.uzaId ?? selectedBorrower.email,
                  }
                : null
            }
            search={borrowerSearch}
            onSearchChange={setBorrowerSearch}
            isLoading={users.isLoading}
            placeholder="Search by name, email or UZA id…"
            helperText="Needs a UZA id already — create their account first from Users if they don't have one yet."
            error={errors.borrowerUserId?.message}
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="loan-lender">Lender *</Label>
              <NativeSelect id="loan-lender" {...register('lenderKey')}>
                {lenderOptions.map((l) => (
                  <NativeSelectOption key={l.key} value={l.key}>
                    {l.label}
                  </NativeSelectOption>
                ))}
              </NativeSelect>
              <p className="text-xs text-muted-foreground">
                Only Unguka has agreed interest-rate bands on file today.
              </p>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="loan-tenor">Tenor (months) *</Label>
              <NumberInput
                id="loan-tenor"
                {...register('tenorMonths', numberRegisterOptions())}
              />
              {errors.tenorMonths ? (
                <p className="text-xs text-destructive">{errors.tenorMonths.message}</p>
              ) : null}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="loan-price">Vehicle price (RWF) *</Label>
              <NumberInput
                id="loan-price"
                {...register('vehiclePriceRwf', numberRegisterOptions())}
              />
              {errors.vehiclePriceRwf ? (
                <p className="text-xs text-destructive">
                  {errors.vehiclePriceRwf.message}
                </p>
              ) : null}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="loan-contribution">Driver&apos;s contribution (RWF) *</Label>
              <NumberInput
                id="loan-contribution"
                {...register('clientContributionRwf', numberRegisterOptions())}
              />
              {errors.clientContributionRwf ? (
                <p className="text-xs text-destructive">
                  {errors.clientContributionRwf.message}
                </p>
              ) : null}
            </div>
          </div>

          <fieldset className="space-y-4 rounded-lg border p-4">
            <legend className="px-1 text-sm font-semibold">Vehicle</legend>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="loan-chassis">Chassis / VIN *</Label>
                <Input id="loan-chassis" {...register('vehicle.chassisNumber')} />
                {errors.vehicle?.chassisNumber ? (
                  <p className="text-xs text-destructive">
                    {errors.vehicle.chassisNumber.message}
                  </p>
                ) : null}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="loan-make">Make</Label>
                <Input id="loan-make" {...register('vehicle.make')} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="loan-model">Model</Label>
                <Input id="loan-model" {...register('vehicle.model')} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="loan-year">Year</Label>
                <NumberInput
                  id="loan-year"
                  {...register('vehicle.year', numberRegisterOptions())}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="loan-color">Color</Label>
                <Input id="loan-color" {...register('vehicle.color')} />
              </div>
            </div>
          </fieldset>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={create.isPending}>
              {create.isPending ? 'Originating…' : 'Originate loan'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

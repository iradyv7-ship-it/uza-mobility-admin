'use client';

import { useMemo, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  SearchablePicker,
  type SearchablePickerOption,
} from '@/components/admin/shared/searchable-picker';
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
import { useAdminUsers } from '@/queries/platform';
import { useRegisterMechanic } from '@/queries/mechanics';
import {
  registerMechanicSchema,
  type RegisterMechanicInput,
} from '@/schemas/mechanics';
import {
  mechanicEngagements,
  mechanicLevels,
  workCategories,
} from '@/types/admin/mechanics';

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

/**
 * Onboard a garage/workshop partner. Nothing wrote a Mechanic row anywhere before this —
 * a WORKSHOP_ADMIN/MECHANIC role granted portal access, but no inspection could actually
 * be filed without this record existing too (see WorkshopService.registerMechanic).
 */
export function MechanicFormDialog({ open, onOpenChange }: Props) {
  const register_ = useRegisterMechanic();
  const users = useAdminUsers();
  const [userSearch, setUserSearch] = useState('');

  const { register, handleSubmit, formState, setValue, control, reset } =
    useForm<RegisterMechanicInput>({
      resolver: zodResolver(registerMechanicSchema),
      defaultValues: { engagement: 'CERTIFIED', level: 'TECHNICIAN', certifiedFor: [] },
    });
  const errors = formState.errors;
  const [certifiedFor = [], userId] = useWatch({
    control,
    name: ['certifiedFor', 'userId'],
  });

  const userOptions = useMemo<SearchablePickerOption[]>(() => {
    if (!users.data) return [];
    const needle = userSearch.trim().toLowerCase();
    return users.data
      .filter((u) => {
        if (!needle) return true;
        const name = [u.firstName, u.lastName, u.email].filter(Boolean).join(' ').toLowerCase();
        return name.includes(needle);
      })
      .slice(0, 30)
      .map((u) => ({
        value: u.id,
        label: [u.firstName, u.lastName].filter(Boolean).join(' ') || u.email,
        hint: u.roles.join(', '),
      }));
  }, [users.data, userSearch]);

  const selectedUser = users.data?.find((u) => u.id === userId);

  const toggleCategory = (category: (typeof workCategories)[number]) => {
    const next = certifiedFor.includes(category)
      ? certifiedFor.filter((c) => c !== category)
      : [...certifiedFor, category];
    setValue('certifiedFor', next, { shouldValidate: true });
  };

  const close = () => {
    onOpenChange(false);
    reset({ engagement: 'CERTIFIED', level: 'TECHNICIAN', certifiedFor: [] });
    setUserSearch('');
  };

  const submit = handleSubmit(async (values) => {
    await register_.mutateAsync({
      ...values,
      certifiedUntil: new Date(values.certifiedUntil).toISOString(),
    });
    close();
  });

  return (
    <Dialog open={open} onOpenChange={(next) => (next ? onOpenChange(true) : close())}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Register a garage partner</DialogTitle>
          <DialogDescription>
            For a workshop or technician who will file vehicle inspections on financed
            Twara EV vehicles.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="mech-name">Name *</Label>
            <Input id="mech-name" {...register('name')} />
            {errors.name ? <p className="text-xs text-destructive">{errors.name.message}</p> : null}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="mech-engagement">Engagement *</Label>
              <NativeSelect id="mech-engagement" {...register('engagement')}>
                {mechanicEngagements.map((e) => (
                  <NativeSelectOption key={e} value={e}>
                    {e === 'EMPLOYED' ? 'UZA employee' : 'Independent partner'}
                  </NativeSelectOption>
                ))}
              </NativeSelect>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="mech-level">Level *</Label>
              <NativeSelect id="mech-level" {...register('level')}>
                {mechanicLevels.map((l) => (
                  <NativeSelectOption key={l} value={l}>
                    {l}
                  </NativeSelectOption>
                ))}
              </NativeSelect>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Certified for *</Label>
            <div className="grid grid-cols-2 gap-2">
              {workCategories.map((category) => (
                <label
                  key={category}
                  className="flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-sm"
                >
                  <Checkbox
                    checked={certifiedFor.includes(category)}
                    onCheckedChange={() => toggleCategory(category)}
                  />
                  {category.replaceAll('_', ' ')}
                </label>
              ))}
            </div>
            {errors.certifiedFor ? (
              <p className="text-xs text-destructive">{errors.certifiedFor.message}</p>
            ) : null}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="mech-until">Certified until *</Label>
            <Input id="mech-until" type="date" {...register('certifiedUntil')} />
            {errors.certifiedUntil ? (
              <p className="text-xs text-destructive">{errors.certifiedUntil.message}</p>
            ) : null}
          </div>

          <SearchablePicker
            label="Linked UZA account (optional)"
            value={userId ?? ''}
            onValueChange={(value) => setValue('userId', value || undefined)}
            options={userOptions}
            selectedOption={
              selectedUser
                ? {
                    value: selectedUser.id,
                    label: [selectedUser.firstName, selectedUser.lastName].filter(Boolean).join(' ') || selectedUser.email,
                    hint: selectedUser.roles.join(', '),
                  }
                : null
            }
            search={userSearch}
            onSearchChange={setUserSearch}
            isLoading={users.isLoading}
            allowClear
            placeholder="Only for an employed technician who also logs in…"
            helperText="Grant them the WORKSHOP_ADMIN or MECHANIC role from Users first."
          />

          <DialogFooter>
            <Button type="button" variant="outline" onClick={close}>
              Cancel
            </Button>
            <Button type="submit" disabled={register_.isPending}>
              {register_.isPending ? 'Registering…' : 'Register partner'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

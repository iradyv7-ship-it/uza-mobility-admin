'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
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
import { useCreateAdminAccount } from '@/queries/platform';
import {
  createAdminAccountSchema,
  type CreateAdminAccountInput,
} from '@/schemas/admin-accounts';
import { assignableRoleNames } from '@/types/admin/platform';

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

/**
 * Create an account on someone else's behalf — a driver, a bank officer, a workshop
 * partner — with a temporary password. Before this, the only path was self-registration
 * with a self-chosen password; there was no way for UZA to originate an account and hand
 * someone a credential to change on first login.
 *
 * The password is shown exactly once, in this dialog, after creation — never logged,
 * never re-fetchable, and this component holds it only in local state that unmounts when
 * the dialog closes.
 */
export function CreateAccountDialog({ open, onOpenChange }: Props) {
  const create = useCreateAdminAccount();
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [result, setResult] = useState<{ email: string; temporaryPassword: string } | null>(
    null,
  );

  const { register, handleSubmit, formState, reset, setValue } =
    useForm<CreateAdminAccountInput>({
      resolver: zodResolver(createAdminAccountSchema),
      defaultValues: { roles: [] },
    });
  const errors = formState.errors;

  const toggleRole = (role: string) => {
    const next = selectedRoles.includes(role)
      ? selectedRoles.filter((r) => r !== role)
      : [...selectedRoles, role];
    setSelectedRoles(next);
    setValue('roles', next as CreateAdminAccountInput['roles'], {
      shouldValidate: true,
    });
  };

  const close = () => {
    onOpenChange(false);
    // Reset only once the dialog has closed, so the just-created password doesn't flash
    // away before the admin has copied it.
    setTimeout(() => {
      reset({ roles: [] });
      setSelectedRoles([]);
      setResult(null);
    }, 200);
  };

  const submit = handleSubmit(async (values) => {
    const created = await create.mutateAsync(values);
    setResult({ email: created.user.email, temporaryPassword: created.temporaryPassword });
  });

  return (
    <Dialog open={open} onOpenChange={(next) => (next ? onOpenChange(true) : close())}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        {result ? (
          <>
            <DialogHeader>
              <DialogTitle>Account created</DialogTitle>
              <DialogDescription>
                This password is shown once and is not stored anywhere retrievable — copy it
                now and relay it to {result.email} yourself. They must change it on first
                login.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-1.5 rounded-md border bg-muted/40 p-4">
              <Label className="text-xs text-muted-foreground">Temporary password</Label>
              <p className="select-all break-all font-mono text-lg">
                {result.temporaryPassword}
              </p>
            </div>
            <DialogFooter>
              <Button onClick={close}>Done</Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Create an account</DialogTitle>
              <DialogDescription>
                For someone who won&apos;t self-register — a driver, a bank officer, a workshop
                partner. They get a temporary password and must change it on first login.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={submit} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="ca-first">First name *</Label>
                  <Input id="ca-first" {...register('firstName')} />
                  {errors.firstName ? (
                    <p className="text-xs text-destructive">{errors.firstName.message}</p>
                  ) : null}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="ca-last">Last name *</Label>
                  <Input id="ca-last" {...register('lastName')} />
                  {errors.lastName ? (
                    <p className="text-xs text-destructive">{errors.lastName.message}</p>
                  ) : null}
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <Label htmlFor="ca-email">Email *</Label>
                  <Input id="ca-email" type="email" {...register('email')} />
                  {errors.email ? (
                    <p className="text-xs text-destructive">{errors.email.message}</p>
                  ) : null}
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <Label htmlFor="ca-phone">Phone</Label>
                  <Input id="ca-phone" {...register('phone')} />
                </div>
              </div>

              <div className="space-y-3">
                <Label>Roles *</Label>
                <div className="grid gap-2 sm:grid-cols-2">
                  {assignableRoleNames.map((role) => (
                    <label
                      key={role}
                      className="flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-sm"
                    >
                      <Checkbox
                        checked={selectedRoles.includes(role)}
                        onCheckedChange={() => toggleRole(role)}
                      />
                      {role.replaceAll('_', ' ')}
                    </label>
                  ))}
                </div>
                {errors.roles ? (
                  <p className="text-xs text-destructive">{errors.roles.message}</p>
                ) : null}
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={close}>
                  Cancel
                </Button>
                <Button type="submit" disabled={create.isPending}>
                  {create.isPending ? 'Creating…' : 'Create account'}
                </Button>
              </DialogFooter>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

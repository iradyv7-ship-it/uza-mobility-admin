'use client';

import { useState } from 'react';
import { Copy, KeyRound, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatDateTime } from '@/lib/admin/format';
import { PLATFORM_STAFF_ROLES } from '@/lib/permissions';
import { cn } from '@/lib/utils';
import type { IssuedStaffInvite, StaffInviteStatus } from '@/lib/api/platform';
import {
  useAdminUsers,
  useCreateStaffInvite,
  useIssueRecoveryCode,
  useResetUserAccess,
  useRevokeStaffInvite,
  useStaffInvites,
} from '@/queries/platform';
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select';
import { LifeBuoy } from 'lucide-react';

const LENDER_ROLES = ['LENDER_UNGUKA', 'LENDER_EQUITY', 'LENDER_NCBA'];
const ROLE_CHOICES = [...PLATFORM_STAFF_ROLES.filter((r) => r !== 'SUPER_ADMIN'), ...LENDER_ROLES];

/**
 * Staff access codes. Nobody becomes staff by signing up: they sign in (Google or password)
 * as a client, and the code you issue here — to their exact email, once, within 72 hours —
 * is what attaches the roles. Revoke here; remove roles on the Users page.
 */
export function StaffInvitesPanel() {
  const invites = useStaffInvites();
  const create = useCreateStaffInvite();
  const revoke = useRevokeStaffInvite();
  const [email, setEmail] = useState('');
  const [note, setNote] = useState('');
  const [roles, setRoles] = useState<string[]>(['INTAKE_OFFICER']);
  const [issued, setIssued] = useState<IssuedStaffInvite | null>(null);

  const toggle = (r: string) => setRoles((p) => (p.includes(r) ? p.filter((x) => x !== r) : [...p, r]));

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="flex items-center gap-2 text-xl font-semibold">
          <ShieldCheck className="h-5 w-5" /> Staff access
        </h1>
        <p className="text-sm text-muted-foreground">
          A role is never self-assigned. Issue a one-time code to an employee&apos;s or a bank officer&apos;s email; they sign in
          however they like, then enter the code once. Super-admin is granted on the Users page only.
        </p>
      </div>

      <div className="flex flex-col gap-6 xl:flex-row xl:items-start">
        <form
          className="w-full shrink-0 space-y-4 rounded-lg border p-4 xl:w-[420px]"
          onSubmit={(e) => {
            e.preventDefault();
            create.mutate(
              { email: email.trim(), roles, note: note.trim() || undefined },
              { onSuccess: (r) => { setIssued(r); setEmail(''); setNote(''); } },
            );
          }}
        >
          <div className="space-y-1">
            <Label htmlFor="inv-email">Email</Label>
            <Input id="inv-email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@uzasolutions.com" />
          </div>
          <div className="space-y-1">
            <Label>Roles</Label>
            <div className="flex flex-wrap gap-1.5">
              {ROLE_CHOICES.map((r) => (
                <button key={r} type="button" onClick={() => toggle(r)} className={cn('rounded-md border px-2 py-1 text-xs', roles.includes(r) ? 'bg-foreground text-background' : 'hover:bg-muted')}>
                  {r.replace(/_/g, ' ').toLowerCase()}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-1">
            <Label htmlFor="inv-note">Note (who, why)</Label>
            <Input id="inv-note" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Scorah — head of UZA Mobility" />
          </div>
          <Button type="submit" disabled={create.isPending || !roles.length || !email.trim()}>
            <KeyRound className="mr-1 h-4 w-4" /> Issue code
          </Button>

          {issued ? (
            <div className="space-y-2 rounded-md border border-emerald-300 bg-emerald-50 p-3 text-sm dark:border-emerald-900 dark:bg-emerald-950/40">
              <div className="text-xs text-muted-foreground">
                Code for <b>{issued.email}</b> · {issued.roles.join(', ')} · expires {formatDateTime(issued.expiresAt)}
                {issued.emailed ? ' · emailed' : ' · mail is off: pass it on yourself'}
              </div>
              <div className="flex items-center justify-between gap-2">
                <code className="text-xl tracking-widest">{issued.code}</code>
                <Button type="button" size="sm" variant="outline" onClick={() => { void navigator.clipboard.writeText(issued.code); toast.success('Copied'); }}>
                  <Copy className="mr-1 h-3.5 w-3.5" /> Copy
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">Shown once. It is not stored in clear and cannot be shown again — issue a new one if lost.</p>
            </div>
          ) : null}
        </form>

        <div className="min-w-0 flex-1 overflow-x-auto rounded-lg border">
          {invites.isLoading ? (
            <div className="space-y-2 p-4"><Skeleton className="h-4 w-1/2" /><Skeleton className="h-4 w-2/3" /></div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Roles</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Issued</TableHead>
                  <TableHead>Expires / used</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {(invites.data ?? []).map((i) => (
                  <TableRow key={i.id}>
                    <TableCell>
                      <div>{i.email}</div>
                      {i.note ? <div className="text-xs text-muted-foreground">{i.note}</div> : null}
                    </TableCell>
                    <TableCell className="text-xs">{i.roles.join(', ')}</TableCell>
                    <TableCell><StatusPill s={i.status} /></TableCell>
                    <TableCell className="text-xs">{formatDateTime(i.createdAt)}</TableCell>
                    <TableCell className="text-xs">{i.usedAt ? `used ${formatDateTime(i.usedAt)}` : formatDateTime(i.expiresAt)}</TableCell>
                    <TableCell className="text-right">
                      {i.status === 'OPEN' ? (
                        <Button size="sm" variant="ghost" onClick={() => revoke.mutate(i.id)} disabled={revoke.isPending}>Revoke</Button>
                      ) : null}
                    </TableCell>
                  </TableRow>
                ))}
                {invites.data && invites.data.length === 0 ? (
                  <TableRow><TableCell colSpan={6} className="text-center text-sm text-muted-foreground">No invites yet.</TableCell></TableRow>
                ) : null}
              </TableBody>
            </Table>
          )}
        </div>
      </div>

      <RecoveryPanel />
    </div>
  );
}

/**
 * When the normal doors are shut: a forgotten password, a mailbox that cannot be reached.
 * Layer 1 is self-serve (Forgot password). These are layers 2 and 3, super admin only, each
 * with a written reason, each audited, each shown once and never emailed.
 */
function RecoveryPanel() {
  const users = useAdminUsers();
  const issue = useIssueRecoveryCode();
  const reset = useResetUserAccess();
  const [userId, setUserId] = useState('');
  const [reason, setReason] = useState('');
  const [shown, setShown] = useState<{ kind: 'code' | 'password'; value: string; expiresAt?: string } | null>(null);
  const staffOrLender = (users.data ?? []).filter((u) =>
    (u.roles ?? []).some((r: string) => r.startsWith('LENDER_') || (PLATFORM_STAFF_ROLES as readonly string[]).includes(r)),
  );
  const ready = !!userId && reason.trim().length >= 8;

  return (
    <div className="space-y-4 rounded-lg border p-4">
      <h2 className="flex items-center gap-2 text-sm font-semibold">
        <LifeBuoy className="h-4 w-4" /> Access recovery
      </h2>
      <p className="text-xs text-muted-foreground">
        Forgot password → they use <b>Forgot password</b> themselves (email). If email is the problem: <b>Recovery code</b> stands in
        for one emailed sign-in code for 30 minutes. If the password is lost too: <b>Reset access</b> gives a temporary password,
        forces a change at first sign-in and signs out every session. Read codes and passwords to the person on a call <i>you</i>
        placed. Never email or message them. Every action is audited with your reason.
      </p>
      <div className="grid gap-3 sm:grid-cols-[minmax(0,320px)_1fr]">
        <div className="space-y-1">
          <Label htmlFor="rec-user">Person</Label>
          <NativeSelect id="rec-user" value={userId} onChange={(e) => { setUserId(e.target.value); setShown(null); }}>
            <NativeSelectOption value="">— choose a staff or bank account —</NativeSelectOption>
            {staffOrLender.map((u) => (
              <NativeSelectOption key={u.id} value={u.id}>
                {u.email} · {(u.roles ?? []).join(', ').toLowerCase()}
              </NativeSelectOption>
            ))}
          </NativeSelect>
        </div>
        <div className="space-y-1">
          <Label htmlFor="rec-reason">Reason (audited)</Label>
          <Input id="rec-reason" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. Paulin locked out — Unguka mailbox migration; identity confirmed by call-back to his desk line" />
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button size="sm" variant="outline" disabled={!ready || issue.isPending} onClick={() => issue.mutate({ userId, reason }, { onSuccess: (r) => setShown({ kind: 'code', value: r.code, expiresAt: r.expiresAt }) })}>
          Issue recovery code
        </Button>
        <Button size="sm" variant="outline" disabled={!ready || reset.isPending} onClick={() => { if (window.confirm('Reset this person\'s access? Their password stops working and every session is signed out.')) reset.mutate({ userId, reason }, { onSuccess: (r) => setShown({ kind: 'password', value: r.temporaryPassword }) }); }}>
          Reset access
        </Button>
      </div>
      {shown ? (
        <div className="space-y-1 rounded-md border border-amber-300 bg-amber-50 p-3 text-sm dark:border-amber-900 dark:bg-amber-950/40">
          <div className="text-xs text-muted-foreground">
            {shown.kind === 'code' ? `Recovery code · expires ${formatDateTime(shown.expiresAt!)} · they type it at the code step instead of the emailed digits` : 'Temporary password · must be changed at first sign-in · all sessions signed out'}
          </div>
          <div className="flex items-center justify-between gap-2">
            <code className="text-lg tracking-widest">{shown.value}</code>
            <Button type="button" size="sm" variant="ghost" onClick={() => { void navigator.clipboard.writeText(shown.value); toast.success('Copied'); }}>
              <Copy className="mr-1 h-3.5 w-3.5" /> Copy
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">Shown once. Read it out; do not send it.</p>
        </div>
      ) : null}
    </div>
  );
}

function StatusPill({ s }: { s: StaffInviteStatus }) {
  const cls =
    s === 'OPEN' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200'
    : s === 'USED' ? 'bg-muted text-muted-foreground'
    : 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200';
  return <Badge variant="outline" className={cn('border-transparent', cls)}>{s.toLowerCase()}</Badge>;
}

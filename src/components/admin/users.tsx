'use client';

import { useMemo, useState } from 'react';
import { CreateAccountDialog } from '@/components/admin/create-account-dialog';
import { UserDetailSheet } from '@/components/admin/user-detail-sheet';
import { SuperAdminGate } from '@/components/admin/super-admin-gate';
import { PageHeader } from '@/components/shared/page-header';
import { StatusBadge } from '@/components/admin/shared/status-badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { formatDate } from '@/lib/admin/format';
import { useAdminUsers } from '@/queries/platform';
import type { AdminUser } from '@/types/admin/platform';

export function AdminUsersPanel() {
  const { data, isLoading, isError, error } = useAdminUsers();
  const [q, setQ] = useState('');
  const [selected, setSelected] = useState<AdminUser | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [creating, setCreating] = useState(false);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle || !data) return data ?? [];
    return data.filter((user) => {
      const name = [user.firstName, user.lastName, user.email]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return (
        name.includes(needle) ||
        user.roles.some((r) => r.toLowerCase().includes(needle))
      );
    });
  }, [data, q]);

  const openDetail = (user: AdminUser) => {
    setSelected(user);
    setDetailOpen(true);
  };

  return (
    <SuperAdminGate>
      <div className="space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <PageHeader
            title="Users"
            description="View accounts, assign roles, and deactivate users. Administrator access only."
          />
          <Button onClick={() => setCreating(true)}>New account</Button>
        </div>

        <div className="max-w-md space-y-1.5">
          <Label htmlFor="users-q">Search</Label>
          <Input
            id="users-q"
            placeholder="Name, email, or role…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>

        {isError ? (
          <p className="text-sm text-destructive">
            {error instanceof Error ? error.message : 'Failed to load users.'}
          </p>
        ) : null}

        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Roles</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading
                ? Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell colSpan={5}>
                        <Skeleton className="h-8 w-full" />
                      </TableCell>
                    </TableRow>
                  ))
                : null}
              {!isLoading && filtered.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="py-8 text-center text-muted-foreground"
                  >
                    No users found.
                  </TableCell>
                </TableRow>
              ) : null}
              {filtered.map((user) => {
                const inactive = !user.isActive || user.deletedAt;
                return (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="font-medium">
                        {[user.firstName, user.lastName]
                          .filter(Boolean)
                          .join(' ') || '—'}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {user.email}
                      </div>
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate text-sm">
                      {user.roles.join(', ').replaceAll('_', ' ')}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={inactive ? 'CANCELLED' : 'ACTIVE'} />
                    </TableCell>
                    <TableCell>{formatDate(user.createdAt)}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openDetail(user)}
                      >
                        Manage
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>

        <UserDetailSheet
          user={selected}
          open={detailOpen}
          onOpenChange={setDetailOpen}
        />
        <CreateAccountDialog open={creating} onOpenChange={setCreating} />
      </div>
    </SuperAdminGate>
  );
}

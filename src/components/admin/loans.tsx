'use client';

import { useState } from 'react';
import { LoanDetailSheet } from '@/components/admin/loan-detail-sheet';
import { LoanFormDialog } from '@/components/admin/loan-form-dialog';
import { PaginationBar } from '@/components/admin/shared/pagination-bar';
import { StatusBadge } from '@/components/admin/shared/status-badge';
import { PageHeader } from '@/components/shared/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { formatRwf } from '@/lib/admin/format';
import { useLoans } from '@/queries/loans';
import { loanStatuses, type LoanStatus } from '@/types/admin/loans';

/**
 * Loans — origination, tenor changes, and lender change-request review, none of which
 * had any screen (or backend code path) before this. See LoanLifecycleService in
 * uza-mobility-bn.
 */
export function AdminLoansPanel() {
  const [status, setStatus] = useState<LoanStatus | ''>('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [creating, setCreating] = useState(false);
  const [viewingId, setViewingId] = useState<string | null>(null);

  const list = useLoans({ status, search, page, limit: 25 });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <PageHeader
          title="Loans"
          description="Twara EV / UZA Empower loans — origination, tenor changes, and lender change-request review."
        />
        <Button onClick={() => setCreating(true)}>New loan</Button>
      </div>

      <div className="flex flex-wrap items-end gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="loans-status">Status</Label>
          <NativeSelect
            id="loans-status"
            value={status}
            onChange={(e) => {
              setStatus(e.target.value as LoanStatus | '');
              setPage(1);
            }}
            className="w-48"
          >
            <NativeSelectOption value="">All</NativeSelectOption>
            {loanStatuses.map((s) => (
              <NativeSelectOption key={s} value={s}>
                {s.replaceAll('_', ' ')}
              </NativeSelectOption>
            ))}
          </NativeSelect>
        </div>
        <div className="max-w-xs flex-1 space-y-1.5">
          <Label htmlFor="loans-search">Search</Label>
          <Input
            id="loans-search"
            placeholder="Name, UZA id, or reference…"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </div>
      </div>

      {list.isError ? (
        <p className="text-sm text-destructive">
          {list.error instanceof Error ? list.error.message : 'Failed to load loans.'}
        </p>
      ) : null}

      <div className="overflow-x-auto rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Reference</TableHead>
              <TableHead>Borrower</TableHead>
              <TableHead>Vehicle</TableHead>
              <TableHead>Lender</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Monthly</TableHead>
              <TableHead className="text-right">Outstanding</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {list.isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 8 }).map((__, j) => (
                    <TableCell key={j}>
                      <Skeleton className="h-4 w-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : list.data && list.data.items.length > 0 ? (
              list.data.items.map((loan) => (
                <TableRow key={loan.id}>
                  <TableCell className="font-mono text-xs">{loan.reference}</TableCell>
                  <TableCell>
                    <div className="font-medium">
                      {[loan.borrower?.firstName, loan.borrower?.lastName]
                        .filter(Boolean)
                        .join(' ')}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {loan.borrower?.uzaId}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">
                    {[loan.vehicle?.make, loan.vehicle?.model].filter(Boolean).join(' ') ||
                      '—'}
                  </TableCell>
                  <TableCell className="text-sm">{loan.bank?.name ?? '—'}</TableCell>
                  <TableCell>
                    <StatusBadge status={loan.status} />
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatRwf(loan.monthlyRwf)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatRwf(loan.outstandingRwf)}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" onClick={() => setViewingId(loan.id)}>
                      Open
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={8} className="py-10 text-center text-sm text-muted-foreground">
                  No loans yet. Originate the first one.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {list.data && list.data.meta.total > 0 ? (
        <PaginationBar meta={list.data.meta} onPageChange={setPage} />
      ) : null}

      <LoanFormDialog
        open={creating}
        onOpenChange={setCreating}
        onCreated={(id) => {
          setCreating(false);
          setViewingId(id);
        }}
      />
      <LoanDetailSheet
        id={viewingId}
        open={!!viewingId}
        onOpenChange={(open) => {
          if (!open) setViewingId(null);
        }}
      />
    </div>
  );
}

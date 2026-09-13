'use client';

import { useState } from 'react';
import { PageHeader } from '@/components/shared/page-header';
import { StatusBadge } from '@/components/admin/shared/status-badge';
import { FundApplicationDetailSheet } from '@/components/admin/fund-application-detail-sheet';
import { FundApplicationFormDialog } from '@/components/admin/fund-application-form-dialog';
import { Button } from '@/components/ui/button';
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
import { formatDate, formatRwf } from '@/lib/admin/format';
import { useFundApplications } from '@/queries/fund-applications';
import {
  fundApplicationStatuses,
  type FundApplicationStatus,
} from '@/types/admin/fund-applications';

/**
 * UZA Empower intake.
 *
 * Until 12 September 2026 there was no screen for this anywhere: a staff member keying in a
 * signed paper form (UZA-EMP-F01) had Swagger or curl. This is the screen. It follows the
 * paper form's section order exactly, so entering one is transcription, not interpretation.
 *
 * Three rules from the API surface here rather than being hidden behind it:
 *  - a draft may be incomplete; only signing requires completeness;
 *  - the three declarations are separate tickboxes, never one;
 *  - screening returns gaps to close, never a verdict.
 */
export function FundApplicationsPanel() {
  const [status, setStatus] = useState<FundApplicationStatus | ''>('');
  const [creating, setCreating] = useState(false);
  const [viewingId, setViewingId] = useState<string | null>(null);

  const list = useFundApplications({ status });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <PageHeader
          title="Twara EV applications"
          description="UZA Empower fund applications from taxi drivers for the Twara EV product, keyed in from the signed paper form. A draft may be incomplete; signing requires the declarations."
        />
        <Button onClick={() => setCreating(true)}>New application</Button>
      </div>

      <div className="flex flex-wrap items-end gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="fa-status">Status</Label>
          <NativeSelect
            id="fa-status"
            value={status}
            onChange={(e) => setStatus(e.target.value as FundApplicationStatus | '')}
            className="w-48"
          >
            <NativeSelectOption value="">All</NativeSelectOption>
            {fundApplicationStatuses.map((s) => (
              <NativeSelectOption key={s} value={s}>
                {s.replaceAll('_', ' ')}
              </NativeSelectOption>
            ))}
          </NativeSelect>
        </div>
        <p className="text-sm text-muted-foreground">
          {list.data ? `${list.data.length} application${list.data.length === 1 ? '' : 's'}` : null}
        </p>
      </div>

      <div className="overflow-x-auto rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Reference</TableHead>
              <TableHead>Applicant</TableHead>
              <TableHead>District</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Savings</TableHead>
              <TableHead>Lender named</TableHead>
              <TableHead>Signed</TableHead>
              <TableHead>Created</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {list.isLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 9 }).map((__, j) => (
                    <TableCell key={j}>
                      <Skeleton className="h-4 w-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : list.data && list.data.length > 0 ? (
              list.data.map((a) => (
                <TableRow key={a.id}>
                  <TableCell className="font-mono text-xs">{a.ref}</TableCell>
                  <TableCell>
                    <div className="font-medium">{a.fullName}</div>
                    <div className="text-xs text-muted-foreground">{a.phone}</div>
                  </TableCell>
                  <TableCell>{a.district}</TableCell>
                  <TableCell>
                    <StatusBadge status={a.status} />
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatRwf(a.currentSavingsRwf)}
                  </TableCell>
                  <TableCell className="capitalize">
                    {a.preferredLenderKey ?? '—'}
                    {a.preferredLenderKey && !a.lenderConsentGiven ? (
                      <span className="ml-1 text-xs text-muted-foreground">(no consent)</span>
                    ) : null}
                  </TableCell>
                  <TableCell>{a.signedAt ? formatDate(a.signedAt) : '—'}</TableCell>
                  <TableCell>{formatDate(a.createdAt)}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" onClick={() => setViewingId(a.id)}>
                      Open
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={9} className="py-10 text-center text-sm text-muted-foreground">
                  No applications yet. Start one from the signed paper form.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <FundApplicationFormDialog
        open={creating}
        onOpenChange={setCreating}
        onCreated={(id) => {
          setCreating(false);
          setViewingId(id);
        }}
      />
      <FundApplicationDetailSheet
        id={viewingId}
        open={!!viewingId}
        onOpenChange={(open) => {
          if (!open) setViewingId(null);
        }}
      />
    </div>
  );
}

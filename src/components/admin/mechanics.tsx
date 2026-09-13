'use client';

import { useState } from 'react';
import { MechanicFormDialog } from '@/components/admin/mechanic-form-dialog';
import { PageHeader } from '@/components/shared/page-header';
import { Button } from '@/components/ui/button';
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
import { useMechanics } from '@/queries/mechanics';

/**
 * Garage/workshop partners. Registering one here is what makes it possible for their
 * WORKSHOP_ADMIN/MECHANIC account to actually file a vehicle inspection — see
 * MechanicFormDialog's doc comment for why that wasn't possible before.
 */
export function AdminMechanicsPanel() {
  const [creating, setCreating] = useState(false);
  const mechanics = useMechanics();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <PageHeader
          title="Garage partners"
          description="Workshops and technicians certified to inspect financed Twara EV vehicles."
        />
        <Button onClick={() => setCreating(true)}>Register partner</Button>
      </div>

      <div className="overflow-x-auto rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Level</TableHead>
              <TableHead>High-voltage certificate</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {mechanics.isLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 3 }).map((__, j) => (
                    <TableCell key={j}>
                      <Skeleton className="h-4 w-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : mechanics.data && mechanics.data.length > 0 ? (
              mechanics.data.map((m) => (
                <TableRow key={m.id}>
                  <TableCell className="font-medium">{m.name}</TableCell>
                  <TableCell>{m.grade}</TableCell>
                  <TableCell className="text-sm">
                    {m.hvCertificateStatus
                      ? `${m.hvCertificateStatus}${m.hvCertificateExpiresAt ? ` · until ${formatDate(m.hvCertificateExpiresAt)}` : ''}`
                      : 'Not certified for high-voltage work'}
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={3} className="py-10 text-center text-sm text-muted-foreground">
                  No garage partners registered yet.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <MechanicFormDialog open={creating} onOpenChange={setCreating} />
    </div>
  );
}

'use client';

import Image from 'next/image';
import { useState } from 'react';
import { ConfirmDialog } from '@/components/admin/shared/confirm-dialog';
import { StatusBadge } from '@/components/admin/shared/status-badge';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { usePermissions } from '@/hooks/permissions';
import {
  formatDate,
  formatDateTime,
  formatBookingFee,
  formatSettledAmount,
} from '@/lib/admin/format';
import { adminDetailSheetClassName } from '@/lib/admin/detail-sheet';
import { formatSellerChannel } from '@/lib/auth/seller-profiles';
import { useConfirmBooking, useRejectBooking } from '@/queries/bookings';
import type { AdminVehicleBooking } from '@/types/admin/bookings';

function getAttachmentType(fileName: string) {
  const extension = fileName.split('.').pop()?.toUpperCase() ?? '';
  return extension;
}

function isImageProof(fileName: string) {
  return ['JPG', 'JPEG', 'PNG', 'WEBP', 'GIF'].includes(
    getAttachmentType(fileName),
  );
}

type BookingDetailSheetProps = {
  booking: AdminVehicleBooking | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function BookingDetailSheet({
  booking,
  open,
  onOpenChange,
}: BookingDetailSheetProps) {
  const { can } = usePermissions();
  const confirm = useConfirmBooking();
  const reject = useRejectBooking();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState(
    'Payment could not be verified',
  );

  const busy = confirm.isPending || reject.isPending;
  const canVerify =
    booking?.status === 'UNDER_VERIFICATION' ||
    booking?.status === 'PAYMENT_SUBMITTED';
  const proofs = booking?.proofs ?? [];

  const handleConfirm = () => {
    if (!booking) return;
    confirm.mutate(booking.id, {
      onSuccess: () => {
        setConfirmOpen(false);
        onOpenChange(false);
      },
    });
  };

  const handleReject = () => {
    if (!booking) return;
    reject.mutate(
      {
        id: booking.id,
        reason: rejectReason.trim() || 'Payment could not be verified',
      },
      {
        onSuccess: () => {
          setRejectOpen(false);
          onOpenChange(false);
        },
      },
    );
  };

  if (!booking && !open) return null;

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className={adminDetailSheetClassName}>
          {!booking ? (
            <div className="space-y-4 px-6 py-6">
              <Skeleton className="h-8 w-2/3" />
              <Skeleton className="h-24 w-full" />
            </div>
          ) : (
            <>
              <SheetHeader className="border-b px-6 py-5">
                <SheetTitle className="text-xl">
                  Booking · {booking.bookingNumber}
                </SheetTitle>
                <SheetDescription>
                  {booking.listing?.listingTitle ?? 'Vehicle booking'} · Ref{' '}
                  {booking.paymentReference}
                </SheetDescription>
              </SheetHeader>

              <div className="space-y-6 px-6 py-6">
                <StatusBadge status={booking.status} />

                <dl className="grid gap-3 text-sm sm:grid-cols-2">
                  <div className="flex justify-between gap-4 sm:flex-col sm:gap-1">
                    <dt className="text-muted-foreground">Booking fee</dt>
                    <dd className="font-medium">{formatBookingFee(booking)}</dd>
                  </div>
                  <div className="flex justify-between gap-4 sm:flex-col sm:gap-1">
                    <dt className="text-muted-foreground">Paid to account</dt>
                    <dd className="font-medium">
                      {booking.amountPaid != null
                        ? booking.currency === 'RWF'
                          ? 'Rwf'
                          : 'USD'
                        : '—'}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-4 sm:flex-col sm:gap-1">
                    <dt className="text-muted-foreground">Amount paid</dt>
                    <dd>
                      {booking.amountPaid != null
                        ? formatSettledAmount(
                            booking.amountPaid,
                            booking.currency,
                          )
                        : '—'}
                    </dd>
                  </div>
                  {booking.exchangeRateUsed != null ? (
                    <div className="flex justify-between gap-4 sm:flex-col sm:gap-1">
                      <dt className="text-muted-foreground">
                        Exchange rate used
                      </dt>
                      <dd>
                        1 USD ≈{' '}
                        {booking.exchangeRateUsed.toLocaleString('en-US', {
                          maximumFractionDigits: 2,
                        })}{' '}
                        Rwf
                      </dd>
                    </div>
                  ) : null}
                  <div className="flex justify-between gap-4 sm:flex-col sm:gap-1">
                    <dt className="text-muted-foreground">Buyer</dt>
                    <dd>
                      {booking.user
                        ? `${booking.user.firstName} ${booking.user.lastName}`.trim()
                        : '—'}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-4 sm:flex-col sm:gap-1">
                    <dt className="text-muted-foreground">Email</dt>
                    <dd>{booking.user?.email ?? '—'}</dd>
                  </div>
                  <div className="flex justify-between gap-4 sm:flex-col sm:gap-1">
                    <dt className="text-muted-foreground">Phone</dt>
                    <dd>{booking.user?.phone ?? '—'}</dd>
                  </div>
                  <div className="flex justify-between gap-4 sm:flex-col sm:gap-1">
                    <dt className="text-muted-foreground">Sender</dt>
                    <dd>{booking.senderName ?? '—'}</dd>
                  </div>
                  <div className="flex justify-between gap-4 sm:flex-col sm:gap-1">
                    <dt className="text-muted-foreground">Bank</dt>
                    <dd>{booking.bankName ?? '—'}</dd>
                  </div>
                  <div className="flex justify-between gap-4 sm:flex-col sm:gap-1">
                    <dt className="text-muted-foreground">Transfer ref</dt>
                    <dd>
                      {booking.transferReference ?? booking.paymentReference}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-4 sm:flex-col sm:gap-1">
                    <dt className="text-muted-foreground">Payment date</dt>
                    <dd>{formatDate(booking.paymentDate)}</dd>
                  </div>
                  <div className="flex justify-between gap-4 sm:flex-col sm:gap-1">
                    <dt className="text-muted-foreground">Valid until</dt>
                    <dd>{formatDate(booking.validUntil)}</dd>
                  </div>
                  <div className="flex justify-between gap-4 sm:flex-col sm:gap-1">
                    <dt className="text-muted-foreground">Confirmed</dt>
                    <dd>{formatDateTime(booking.confirmedAt)}</dd>
                  </div>
                  <div className="flex justify-between gap-4 sm:flex-col sm:gap-1">
                    <dt className="text-muted-foreground">Created</dt>
                    <dd>{formatDateTime(booking.createdAt)}</dd>
                  </div>
                  <div className="flex justify-between gap-4 sm:flex-col sm:gap-1">
                    <dt className="text-muted-foreground">Submitted</dt>
                    <dd>{formatDateTime(booking.updatedAt)}</dd>
                  </div>
                </dl>

                {booking.listing ? (
                  <dl className="grid gap-3 text-sm sm:grid-cols-2">
                    <p className="col-span-full text-sm font-medium">Vehicle</p>
                    <div className="flex justify-between gap-4 sm:flex-col sm:gap-1">
                      <dt className="text-muted-foreground">Title</dt>
                      <dd>{booking.listing.listingTitle}</dd>
                    </div>
                    <div className="flex justify-between gap-4 sm:flex-col sm:gap-1">
                      <dt className="text-muted-foreground">Make / model</dt>
                      <dd>
                        {booking.listing.brand} {booking.listing.model}
                      </dd>
                    </div>
                    {booking.listing.sellerType ? (
                      <div className="flex justify-between gap-4 sm:flex-col sm:gap-1">
                        <dt className="text-muted-foreground">Channel</dt>
                        <dd>
                          {formatSellerChannel(booking.listing.sellerType)}
                        </dd>
                      </div>
                    ) : null}
                    <div className="flex justify-between gap-4 sm:flex-col sm:gap-1">
                      <dt className="text-muted-foreground">Slug</dt>
                      <dd className="font-mono text-xs">
                        {booking.listing.slug}
                      </dd>
                    </div>
                  </dl>
                ) : null}

                {booking.notes ? (
                  <div className="space-y-1 text-sm">
                    <p className="font-medium">Buyer notes</p>
                    <p className="whitespace-pre-wrap text-muted-foreground">
                      {booking.notes}
                    </p>
                  </div>
                ) : null}

                {booking.rejectionReason ? (
                  <div className="rounded-md border border-destructive/30 bg-destructive/5 p-4 text-sm">
                    <p className="font-medium text-destructive">
                      Rejection reason
                    </p>
                    <p className="mt-1">{booking.rejectionReason}</p>
                  </div>
                ) : null}

                <div className="space-y-3">
                  <p className="text-sm font-medium">Payment proofs</p>
                  {proofs.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      No proof files attached yet.
                    </p>
                  ) : (
                    <ul className="grid grid-cols-2 gap-3">
                      {proofs.map((proof) => (
                        <li
                          key={proof.id}
                          className="relative aspect-[4/3] overflow-hidden rounded-md border bg-muted"
                        >
                          {isImageProof(proof.fileName) ? (
                            <a
                              href={proof.fileUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="block size-full"
                            >
                              <Image
                                src={proof.fileUrl}
                                alt={proof.fileName}
                                fill
                                className="object-cover"
                                sizes="200px"
                                unoptimized
                              />
                            </a>
                          ) : (
                            <a
                              href={proof.fileUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex size-full flex-col items-center justify-center gap-1 p-3 text-center text-xs text-primary underline"
                            >
                              <span className="font-medium">
                                {getAttachmentType(proof.fileName)}
                              </span>
                              <span className="line-clamp-2">
                                {proof.fileName}
                              </span>
                              <span>Open PDF</span>
                            </a>
                          )}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                {canVerify && can('bookings:verify') ? (
                  <div className="flex flex-wrap gap-2 rounded-lg border bg-muted/30 p-4">
                    <Button
                      type="button"
                      size="sm"
                      disabled={busy || proofs.length === 0}
                      onClick={() => setConfirmOpen(true)}
                    >
                      Confirm booking
                    </Button>
                    {can('bookings:reject') ? (
                      <Button
                        type="button"
                        size="sm"
                        variant="destructive"
                        disabled={busy}
                        onClick={() => setRejectOpen(true)}
                      >
                        Reject
                      </Button>
                    ) : null}
                  </div>
                ) : null}
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Confirm booking payment?"
        description={
          booking
            ? `Confirm that booking ${booking.bookingNumber} payment proof is valid. The vehicle will be marked as booked.`
            : ''
        }
        confirmLabel="Confirm booking"
        loading={confirm.isPending}
        onConfirm={handleConfirm}
      />

      <ConfirmDialog
        open={rejectOpen}
        onOpenChange={setRejectOpen}
        title="Reject booking payment?"
        description={
          booking
            ? `Reject the payment proof for booking ${booking.bookingNumber}. The buyer will be notified and can resubmit payment.`
            : ''
        }
        confirmLabel="Reject booking"
        variant="destructive"
        loading={reject.isPending}
        onConfirm={handleReject}
      >
        <div className="space-y-1.5">
          <Label htmlFor="booking-reject-reason">Reason</Label>
          <Textarea
            id="booking-reject-reason"
            rows={3}
            value={rejectReason}
            onChange={(event) => setRejectReason(event.target.value)}
          />
        </div>
      </ConfirmDialog>
    </>
  );
}

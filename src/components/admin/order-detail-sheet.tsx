'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { StatusBadge } from '@/components/admin/shared/status-badge';
import { ConfirmDialog } from '@/components/admin/shared/confirm-dialog';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
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
  formatInvoiceTotal,
} from '@/lib/admin/format';
import { adminDetailSheetClassName } from '@/lib/admin/detail-sheet';
import { formatSellerChannel } from '@/lib/auth/seller-profiles';
import {
  useAdminOrder,
  useAdvanceOrder,
  useAssignOrderFulfillment,
  useCancelOrder,
  useNotifyOrderPortArrival,
} from '@/queries/commerce';
import { advanceOrderSchema, type AdvanceOrderInput } from '@/schemas/commerce';
import {
  formatOrderStage,
  getNextOrderStatus,
  getOrderPipeline,
} from '@/lib/admin/order-stages';

type OrderDetailSheetProps = {
  orderId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function OrderDetailSheet({
  orderId,
  open,
  onOpenChange,
}: OrderDetailSheetProps) {
  const { can, isSuperAdmin } = usePermissions();
  const {
    data: order,
    isLoading,
    isError,
    error,
  } = useAdminOrder(open ? orderId : null);
  const advance = useAdvanceOrder();
  const cancel = useCancelOrder();
  const assignFulfillment = useAssignOrderFulfillment();
  const notifyPort = useNotifyOrderPortArrival();
  const [advanceOpen, setAdvanceOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [fulfillOpen, setFulfillOpen] = useState(false);
  const [vin, setVin] = useState('');
  const [containerNumber, setContainerNumber] = useState('');
  const [documentNumber, setDocumentNumber] = useState('');
  const [vesselName, setVesselName] = useState('');
  const [voyageNumber, setVoyageNumber] = useState('');
  const [etaAt, setEtaAt] = useState('');
  const [portOfDischarge, setPortOfDischarge] = useState('');
  const [terminalOfPickup, setTerminalOfPickup] = useState('');
  const [arrivalNotice, setArrivalNotice] = useState<File | null>(null);

  const form = useForm<AdvanceOrderInput>({
    resolver: zodResolver(advanceOrderSchema),
    defaultValues: { description: '', location: '' },
  });

  const busy =
    advance.isPending ||
    cancel.isPending ||
    assignFulfillment.isPending ||
    notifyPort.isPending;
  const canAdvance =
    order &&
    order.status !== 'DELIVERED' &&
    order.status !== 'CANCELLED' &&
    can('orders:update-status');
  const canFulfill = order && can('orders:update-status');
  const nextStatus = order
    ? getNextOrderStatus(order.sellerType, order.status)
    : null;
  const pipeline = order ? getOrderPipeline(order.sellerType) : [];
  const currentStageIndex = order ? pipeline.indexOf(order.status) : -1;

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className={adminDetailSheetClassName}>
          <SheetHeader
            className={order && !isLoading ? 'border-b px-6 py-5' : 'sr-only'}
          >
            <SheetTitle className="text-xl">
              {order?.orderNumber ?? 'Order details'}
            </SheetTitle>
            {order && !isLoading ? (
              <SheetDescription>
                {order.listing.listingTitle} ·{' '}
                {formatSellerChannel(order.sellerType)}
              </SheetDescription>
            ) : null}
          </SheetHeader>

          {isLoading ? (
            <div className="space-y-4 px-6 py-6">
              <Skeleton className="h-8 w-2/3" />
              <Skeleton className="h-24 w-full" />
            </div>
          ) : null}

          {isError ? (
            <p className="px-6 py-6 text-sm text-destructive">
              {error instanceof Error ? error.message : 'Failed to load order.'}
            </p>
          ) : null}

          {order && !isLoading ? (
            <>
              <div className="space-y-6 px-6 py-6">
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusBadge status={order.status} />
                    {nextStatus ? (
                      <p className="text-sm text-muted-foreground">
                        Next:{' '}
                        <span className="font-medium text-foreground">
                          {formatOrderStage(nextStatus)}
                        </span>
                      </p>
                    ) : order.status !== 'CANCELLED' ? (
                      <p className="text-sm text-muted-foreground">
                        Final stage reached
                      </p>
                    ) : null}
                  </div>

                  {pipeline.length > 0 && order.status !== 'CANCELLED' ? (
                    <ol className="flex flex-wrap gap-1.5">
                      {pipeline.map((stage, index) => {
                        const isCurrent = stage === order.status;
                        const isDone =
                          currentStageIndex >= 0 && index < currentStageIndex;
                        return (
                          <li
                            key={stage}
                            className={
                              isCurrent
                                ? 'rounded-md bg-primary px-2 py-1 text-xs font-medium text-primary-foreground'
                                : isDone
                                  ? 'rounded-md bg-muted px-2 py-1 text-xs text-muted-foreground line-through'
                                  : 'rounded-md border px-2 py-1 text-xs text-muted-foreground'
                            }
                          >
                            {formatOrderStage(stage)}
                          </li>
                        );
                      })}
                    </ol>
                  ) : null}
                </div>

                <dl className="grid gap-3 text-sm sm:grid-cols-2">
                  <div className="flex justify-between gap-4 sm:flex-col sm:gap-1">
                    <dt className="text-muted-foreground">Vehicle</dt>
                    <dd>
                      {order.listing.brand} {order.listing.model} ·{' '}
                      {order.listing.manufacturingYear}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-4 sm:flex-col sm:gap-1">
                    <dt className="text-muted-foreground">Invoice</dt>
                    <dd>{order.invoice.invoiceNumber}</dd>
                  </div>
                  <div className="flex justify-between gap-4 sm:flex-col sm:gap-1">
                    <dt className="text-muted-foreground">Payment ref</dt>
                    <dd className="font-mono text-xs">
                      {order.invoice.paymentReference}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-4 sm:flex-col sm:gap-1">
                    <dt className="text-muted-foreground">Listing slug</dt>
                    <dd className="font-mono text-xs">{order.listing.slug}</dd>
                  </div>
                  <div className="flex justify-between gap-4 sm:flex-col sm:gap-1">
                    <dt className="text-muted-foreground">Amount</dt>
                    <dd className="font-medium">
                      {formatInvoiceTotal(order.invoice)}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-4 sm:flex-col sm:gap-1">
                    <dt className="text-muted-foreground">Delivery city</dt>
                    <dd>
                      {[order.deliveryCity, order.deliveryCountry]
                        .filter(Boolean)
                        .join(', ') || '—'}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-4 sm:col-span-2 sm:flex-col sm:gap-1">
                    <dt className="text-muted-foreground">Delivery address</dt>
                    <dd>{order.deliveryAddress ?? '—'}</dd>
                  </div>
                  <div className="flex justify-between gap-4 sm:flex-col sm:gap-1">
                    <dt className="text-muted-foreground">VIN / chassis</dt>
                    <dd className="font-mono text-xs">{order.vin ?? '—'}</dd>
                  </div>
                  <div className="flex justify-between gap-4 sm:flex-col sm:gap-1">
                    <dt className="text-muted-foreground">Container</dt>
                    <dd className="font-mono text-xs">
                      {order.shipment?.containerNumber ?? '—'}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-4 sm:flex-col sm:gap-1">
                    <dt className="text-muted-foreground">Vessel / voyage</dt>
                    <dd>
                      {[
                        order.shipment?.vesselName,
                        order.shipment?.voyageNumber,
                      ]
                        .filter(Boolean)
                        .join(' · ') || '—'}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-4 sm:flex-col sm:gap-1">
                    <dt className="text-muted-foreground">ETA / port</dt>
                    <dd>
                      {[
                        order.shipment?.etaAt
                          ? formatDate(order.shipment.etaAt)
                          : null,
                        order.shipment?.portOfDischarge,
                      ]
                        .filter(Boolean)
                        .join(' · ') || '—'}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-4 sm:flex-col sm:gap-1">
                    <dt className="text-muted-foreground">Est. delivery</dt>
                    <dd>{formatDate(order.estimatedDeliveryDate)}</dd>
                  </div>
                  <div className="flex justify-between gap-4 sm:flex-col sm:gap-1">
                    <dt className="text-muted-foreground">Actual delivery</dt>
                    <dd>{formatDate(order.actualDeliveryDate)}</dd>
                  </div>
                  <div className="flex justify-between gap-4 sm:flex-col sm:gap-1">
                    <dt className="text-muted-foreground">Created</dt>
                    <dd>{formatDateTime(order.createdAt)}</dd>
                  </div>
                  <div className="flex justify-between gap-4 sm:flex-col sm:gap-1">
                    <dt className="text-muted-foreground">Updated</dt>
                    <dd>{formatDateTime(order.updatedAt)}</dd>
                  </div>
                </dl>

                {order.handoverNotes ? (
                  <div className="space-y-1 text-sm">
                    <p className="font-medium">Handover notes</p>
                    <p className="whitespace-pre-wrap text-muted-foreground">
                      {order.handoverNotes}
                    </p>
                  </div>
                ) : null}

                <div className="space-y-3">
                  <p className="text-sm font-medium">Tracking timeline</p>
                  {order.trackingEvents.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      No tracking events yet.
                    </p>
                  ) : (
                    <ol className="space-y-3 border-l pl-4">
                      {order.trackingEvents.map((event) => (
                        <li key={event.id} className="relative text-sm">
                          <span className="absolute top-1.5 -left-[21px] size-2.5 rounded-full bg-primary" />
                          <p className="font-medium">{event.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {event.stage.replaceAll('_', ' ')} ·{' '}
                            {formatDateTime(event.occurredAt)}
                            {event.location ? ` · ${event.location}` : ''}
                          </p>
                          {event.description ? (
                            <p className="mt-1 text-muted-foreground">
                              {event.description}
                            </p>
                          ) : null}
                        </li>
                      ))}
                    </ol>
                  )}
                </div>

                <div className="flex flex-wrap gap-2 rounded-lg border bg-muted/30 p-4">
                  {canFulfill ? (
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={busy}
                      onClick={() => {
                        setVin(order.vin ?? '');
                        setContainerNumber(
                          order.shipment?.containerNumber ?? '',
                        );
                        setDocumentNumber(order.shipment?.documentNumber ?? '');
                        setVesselName(order.shipment?.vesselName ?? '');
                        setVoyageNumber(order.shipment?.voyageNumber ?? '');
                        setEtaAt(
                          order.shipment?.etaAt
                            ? order.shipment.etaAt.slice(0, 10)
                            : '',
                        );
                        setPortOfDischarge(
                          order.shipment?.portOfDischarge ?? '',
                        );
                        setTerminalOfPickup(
                          order.shipment?.terminalOfPickup ?? '',
                        );
                        setArrivalNotice(null);
                        setFulfillOpen(true);
                      }}
                    >
                      Assign VIN / shipment
                    </Button>
                  ) : null}
                  {canFulfill && order.shipment ? (
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={busy}
                      onClick={() => notifyPort.mutate(order.id)}
                    >
                      Notify port arrival
                    </Button>
                  ) : null}
                  {canAdvance ? (
                    <Button
                      size="sm"
                      disabled={busy || !nextStatus}
                      onClick={() => setAdvanceOpen(true)}
                    >
                      {nextStatus
                        ? `Advance to ${formatOrderStage(nextStatus)}`
                        : 'Advance status'}
                    </Button>
                  ) : null}
                  {isSuperAdmin && order.status !== 'CANCELLED' ? (
                    <Button
                      size="sm"
                      variant="destructive"
                      disabled={busy}
                      onClick={() => setCancelOpen(true)}
                    >
                      Cancel order
                    </Button>
                  ) : null}
                </div>
              </div>
            </>
          ) : null}
        </SheetContent>
      </Sheet>

      <Dialog open={advanceOpen} onOpenChange={setAdvanceOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Advance order</DialogTitle>
          </DialogHeader>
          {order && nextStatus ? (
            <div className="rounded-lg border bg-muted/40 px-3 py-3 text-sm">
              <p className="text-muted-foreground">Status change</p>
              <p className="mt-1 font-medium">
                {formatOrderStage(order.status)}
                <span className="mx-2 text-muted-foreground">→</span>
                {formatOrderStage(nextStatus)}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Pipeline: {formatSellerChannel(order.sellerType)}
              </p>
            </div>
          ) : null}
          <form
            onSubmit={form.handleSubmit((values) => {
              if (!order) return;
              advance.mutate(
                { id: order.id, body: values },
                {
                  onSuccess: () => {
                    setAdvanceOpen(false);
                    form.reset();
                  },
                },
              );
            })}
            className="space-y-4"
          >
            <div className="space-y-1.5">
              <Label htmlFor="advance-location">Location (optional)</Label>
              <Input id="advance-location" {...form.register('location')} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="advance-desc">Note (optional)</Label>
              <Textarea
                id="advance-desc"
                rows={3}
                {...form.register('description')}
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setAdvanceOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={busy || !nextStatus}>
                {nextStatus
                  ? `Advance to ${formatOrderStage(nextStatus)}`
                  : 'Advance'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={fulfillOpen} onOpenChange={setFulfillOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Assign VIN & arrival notice</DialogTitle>
          </DialogHeader>
          <form
            className="space-y-3"
            onSubmit={(event) => {
              event.preventDefault();
              if (!order) return;
              const trimmedVin = vin.trim();
              if (trimmedVin.length < 5) {
                toast.error('VIN must be at least 5 characters');
                return;
              }
              assignFulfillment.mutate(
                {
                  id: order.id,
                  body: {
                    vin: trimmedVin,
                    shipment: {
                      documentNumber: documentNumber.trim() || undefined,
                      vesselName: vesselName.trim() || undefined,
                      voyageNumber: voyageNumber.trim() || undefined,
                      etaAt: etaAt || undefined,
                      portOfDischarge: portOfDischarge.trim() || undefined,
                      terminalOfPickup: terminalOfPickup.trim() || undefined,
                      containerNumber: containerNumber.trim() || undefined,
                    },
                  },
                  arrivalNotice,
                },
                {
                  onSuccess: () => setFulfillOpen(false),
                },
              );
            }}
          >
            <div className="space-y-1.5">
              <Label htmlFor="fulfill-vin">VIN / chassis</Label>
              <Input
                id="fulfill-vin"
                value={vin}
                onChange={(e) => setVin(e.target.value)}
                minLength={5}
                required
              />
              <p className="text-xs text-muted-foreground">
                At least 5 characters (full VIN preferred).
              </p>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="fulfill-container">Container number</Label>
              <Input
                id="fulfill-container"
                value={containerNumber}
                onChange={(e) => setContainerNumber(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="fulfill-doc">Document / BL number</Label>
              <Input
                id="fulfill-doc"
                value={documentNumber}
                onChange={(e) => setDocumentNumber(e.target.value)}
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="fulfill-vessel">Vessel</Label>
                <Input
                  id="fulfill-vessel"
                  value={vesselName}
                  onChange={(e) => setVesselName(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="fulfill-voyage">Voyage</Label>
                <Input
                  id="fulfill-voyage"
                  value={voyageNumber}
                  onChange={(e) => setVoyageNumber(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="fulfill-eta">ETA</Label>
              <Input
                id="fulfill-eta"
                type="date"
                value={etaAt}
                onChange={(e) => setEtaAt(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="fulfill-port">Port of discharge</Label>
              <Input
                id="fulfill-port"
                value={portOfDischarge}
                onChange={(e) => setPortOfDischarge(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="fulfill-terminal">Terminal / depot</Label>
              <Input
                id="fulfill-terminal"
                value={terminalOfPickup}
                onChange={(e) => setTerminalOfPickup(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="fulfill-pdf">Arrival notice PDF (optional)</Label>
              <Input
                id="fulfill-pdf"
                type="file"
                accept="application/pdf,image/*"
                onChange={(e) => setArrivalNotice(e.target.files?.[0] ?? null)}
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setFulfillOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={busy || !vin.trim()}>
                Save fulfillment
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={cancelOpen}
        onOpenChange={setCancelOpen}
        title="Cancel order?"
        description={
          order
            ? `${order.orderNumber} will be cancelled. This is restricted to administrators.`
            : ''
        }
        confirmLabel="Cancel order"
        variant="destructive"
        loading={cancel.isPending}
        onConfirm={() => {
          if (!order) return;
          cancel.mutate(order.id, {
            onSuccess: () => {
              setCancelOpen(false);
              onOpenChange(false);
            },
          });
        }}
      />
    </>
  );
}

'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  ExistingPhotosGrid,
  type ExistingPhoto,
} from '@/components/shared/existing-photos-grid';
import { PendingPhotoPicker } from '@/components/shared/pending-photo-picker';
import { PricingBreakdown } from '@/components/shared/pricing-breakdown';
import {
  pendingPhotoFiles,
  revokePendingPhotos,
  type PendingPhoto,
} from '@/lib/pending-photos';
import { adminListingToFormValues } from '@/lib/admin/listing-form';
import { formatRwf } from '@/lib/admin/format';
import {
  formatPricingRuleLabel,
  selectableListingPricingRules,
} from '@/lib/admin/listing-pricing';
import { calculateAdminPricing } from '@/lib/api/platform';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import {
  NumberInput,
  numberRegisterOptions,
} from '@/components/ui/number-input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  useAdminCategories,
  useCreateAdminListing,
  useUpdateAdminListing,
} from '@/queries/admin';
import { useAdminPricingRules } from '@/queries/platform';
import {
  adminCreateListingSchema,
  adminListingFormSchema,
  adminListingInitialStatuses,
  adminListingStatusEditOptions,
  adminUpdateListingSchema,
  CHINA_SOURCING_DELIVERY_DAYS,
  formatListingEnumLabel,
  LISTING_DESCRIPTION_MAX_WORDS,
  listingBodyTypes,
  listingConditions,
  listingDrivetrains,
  listingPowertrainTypes,
  listingRegistrationStatuses,
  listingRegistrationStatusLabels,
  listingSteeringPositions,
  listingUseCases,
  MAX_LISTING_PHOTOS,
  RWANDA_STOCK_DELIVERY_DAYS,
  type AdminListingFormInput,
} from '@/schemas/admin';
import type { PriceBreakdown } from '@/types/pricing';
import type { AdminListing } from '@/types/admin/marketplace';

function countWords(value: string): number {
  return value.trim().split(/\s+/).filter(Boolean).length;
}

type ListingFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  listing?: AdminListing | null;
};

export function ListingFormDialog({
  open,
  onOpenChange,
  listing = null,
}: ListingFormDialogProps) {
  const isEdit = Boolean(listing);
  const create = useCreateAdminListing();
  const update = useUpdateAdminListing();
  const { data: categories } = useAdminCategories({ isActive: true }, open);
  const { data: pricingRules } = useAdminPricingRules(open);
  const [priceBreakdown, setPriceBreakdown] = useState<PriceBreakdown | null>(
    null,
  );
  const [priceLoading, setPriceLoading] = useState(false);
  const [photos, setPhotos] = useState<PendingPhoto[]>([]);
  const [orderedExistingPhotos, setOrderedExistingPhotos] = useState<
    ExistingPhoto[]
  >([]);
  const [removedPhotoIds, setRemovedPhotoIds] = useState<string[]>([]);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [brochureFile, setBrochureFile] = useState<File | null>(null);
  const [removeVideo, setRemoveVideo] = useState(false);
  const [removeBrochure, setRemoveBrochure] = useState(false);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const brochureInputRef = useRef<HTMLInputElement>(null);
  const existingPhotos = useMemo(() => {
    const photos = listing?.photos ?? [];
    return [...photos].sort((a, b) => a.displayOrder - b.displayOrder);
  }, [listing?.photos]);
  const keptExistingPhotos = orderedExistingPhotos;
  const remainingPhotoSlots = Math.max(
    0,
    MAX_LISTING_PHOTOS - keptExistingPhotos.length - photos.length,
  );
  const originalPhotoIds = useMemo(
    () => existingPhotos.map((photo) => photo.id),
    [existingPhotos],
  );
  const originalPrimaryPhotoId = useMemo(
    () => existingPhotos.find((photo) => photo.isPrimary)?.id ?? null,
    [existingPhotos],
  );
  const photoOrderChanged =
    keptExistingPhotos.length !== originalPhotoIds.length ||
    keptExistingPhotos.some(
      (photo, index) => photo.id !== originalPhotoIds[index],
    );
  const primaryPhotoId =
    keptExistingPhotos.find((photo) => photo.isPrimary)?.id ??
    keptExistingPhotos[0]?.id ??
    null;
  const primaryChanged =
    primaryPhotoId != null && primaryPhotoId !== originalPrimaryPhotoId;
  const mediaDirty =
    removedPhotoIds.length > 0 ||
    photos.length > 0 ||
    videoFile != null ||
    brochureFile != null ||
    removeVideo ||
    removeBrochure ||
    photoOrderChanged ||
    primaryChanged;
  const busy = create.isPending || update.isPending;

  const form = useForm<AdminListingFormInput>({
    resolver: zodResolver(adminListingFormSchema),
    defaultValues: {
      sellerType: 'UZA_RWANDA_STOCK',
      initialStatus: 'PENDING_REVIEW',
      listingTitle: '',
      categoryId: '',
      brand: '',
      model: '',
      trim: '',
      manufacturingYear: new Date().getFullYear(),
      condition: 'NEW',
      city: 'Kigali',
      country: 'RW',
      color: '#1a1a1a',
      deliveryEstimateDays: RWANDA_STOCK_DELIVERY_DAYS.min,
      pricingRuleId: '',
      description: '',
      isFullOption: false,
    },
  });
  const { isDirty } = form.formState;

  const sellerType = form.watch('sellerType');
  const categoryId = form.watch('categoryId');
  const pricingRuleId = form.watch('pricingRuleId');
  const basePriceRwf = form.watch('basePriceRwf');
  const fobPriceRwf = form.watch('fobPriceRwf');
  const country = form.watch('country');
  const description = form.watch('description') ?? '';
  const descriptionWordCount = countWords(description);
  const selectablePricingRules = useMemo(
    () =>
      selectableListingPricingRules(
        pricingRules,
        pricingRuleId || undefined,
        sellerType,
      ),
    [pricingRules, pricingRuleId, sellerType],
  );
  const statusOptions = listing
    ? adminListingStatusEditOptions(listing.status)
    : [];
  const canEditStatus = isEdit && statusOptions.length > 1;

  useEffect(() => {
    if (!open) return;

    if (sellerType === 'UZA_RWANDA_STOCK') {
      form.setValue('country', 'RW', { shouldDirty: false });
      if (!isEdit) {
        form.setValue('deliveryEstimateDays', RWANDA_STOCK_DELIVERY_DAYS.min, {
          shouldDirty: false,
        });
      }
    } else {
      form.setValue('country', 'CN', { shouldDirty: false });
      if (!isEdit) {
        form.setValue(
          'deliveryEstimateDays',
          CHINA_SOURCING_DELIVERY_DAYS.min,
          {
            shouldDirty: false,
          },
        );
      }
    }
  }, [sellerType, open, isEdit, form]);

  useEffect(() => {
    if (!open || !pricingRuleId) {
      setPriceBreakdown(null);
      return;
    }

    const hasPriceInput =
      sellerType === 'UZA_RWANDA_STOCK'
        ? (basePriceRwf ?? 0) > 0
        : (fobPriceRwf ?? 0) > 0;

    if (!hasPriceInput) {
      setPriceBreakdown(null);
      return;
    }

    const timer = window.setTimeout(() => {
      setPriceLoading(true);
      void calculateAdminPricing({
        sellerType,
        originCountry: country,
        pricingRuleId,
        basePriceRwf,
        fobPriceRwf,
      })
        .then(setPriceBreakdown)
        .catch(() => setPriceBreakdown(null))
        .finally(() => setPriceLoading(false));
    }, 400);

    return () => window.clearTimeout(timer);
  }, [open, sellerType, country, pricingRuleId, basePriceRwf, fobPriceRwf]);

  useEffect(() => {
    if (!open) return;
    setPhotos((current) => {
      revokePendingPhotos(current);
      return [];
    });
    setRemovedPhotoIds([]);
    setOrderedExistingPhotos(
      listing
        ? [...listing.photos]
            .sort((a, b) => a.displayOrder - b.displayOrder)
            .map((photo) => ({
              id: photo.id,
              url: photo.url,
              isPrimary: photo.isPrimary,
            }))
        : [],
    );
    setVideoFile(null);
    setBrochureFile(null);
    setRemoveVideo(false);
    setRemoveBrochure(false);
    if (videoInputRef.current) {
      videoInputRef.current.value = '';
    }
    if (brochureInputRef.current) {
      brochureInputRef.current.value = '';
    }
    if (listing) {
      form.reset(adminListingToFormValues(listing));
    } else {
      form.reset({
        sellerType: 'UZA_RWANDA_STOCK',
        initialStatus: 'PENDING_REVIEW',
        listingTitle: '',
        categoryId: '',
        brand: '',
        model: '',
        trim: '',
        manufacturingYear: new Date().getFullYear(),
        condition: 'NEW',
        city: 'Kigali',
        country: 'RW',
        color: '#1a1a1a',
        deliveryEstimateDays: RWANDA_STOCK_DELIVERY_DAYS.min,
        pricingRuleId: '',
        description: '',
        isFullOption: false,
      });
    }
  }, [open, listing, form]);

  const onSubmit = form.handleSubmit((values) => {
    const payload = { ...values };
    const newPhotos = pendingPhotoFiles(photos);
    const formDirty = isDirty;

    if (isEdit && listing) {
      if (!formDirty && !mediaDirty) {
        toast.message('No changes to save');
        return;
      }

      const totalPhotosAfterSave = keptExistingPhotos.length + newPhotos.length;
      if (totalPhotosAfterSave < 1) {
        toast.error('Keep at least one photo, or upload a replacement.');
        return;
      }

      const body = adminUpdateListingSchema.parse({
        ...payload,
        removePhotoIds:
          removedPhotoIds.length > 0 ? removedPhotoIds : undefined,
        photoOrder:
          photoOrderChanged || primaryChanged
            ? keptExistingPhotos.map((photo) => photo.id)
            : undefined,
        primaryPhotoId:
          primaryChanged && primaryPhotoId ? primaryPhotoId : undefined,
        removeVideo: removeVideo || undefined,
        removeBrochure: removeBrochure || undefined,
      });

      update.mutate(
        {
          id: listing.id,
          body,
          photos: newPhotos,
          video: videoFile,
          brochure: brochureFile,
        },
        {
          onSuccess: () => {
            revokePendingPhotos(photos);
            setPhotos([]);
            onOpenChange(false);
          },
        },
      );
      return;
    }

    create.mutate(
      {
        body: adminCreateListingSchema.parse(payload),
        photos: newPhotos,
        video: videoFile,
        brochure: brochureFile,
      },
      {
        onSuccess: () => {
          revokePendingPhotos(photos);
          setPhotos([]);
          onOpenChange(false);
        },
      },
    );
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl lg:max-w-5xl">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? 'Edit platform listing' : 'New platform listing'}
          </DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          {isEdit
            ? 'Update your UZA stock or sourcing listing. Reorder existing photos, set a cover, remove, or add more.'
            : 'Each inventory channel uses its own seller profile on your account (e.g. Rwanda stock vs China sourcing).'}
        </p>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Inventory channel</Label>
              <Select
                value={sellerType}
                disabled={isEdit}
                onValueChange={(value) => {
                  form.setValue(
                    'sellerType',
                    value as AdminListingFormInput['sellerType'],
                  );
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="UZA_RWANDA_STOCK">
                    UZA Rwanda stock
                  </SelectItem>
                  <SelectItem value="UZA_CHINA_SOURCING">
                    UZA China sourcing
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            {!isEdit ? (
              <div className="space-y-1.5">
                <Label>Initial status</Label>
                <Select
                  value={form.watch('initialStatus')}
                  onValueChange={(value) =>
                    form.setValue(
                      'initialStatus',
                      value as AdminListingFormInput['initialStatus'],
                    )
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {adminListingInitialStatuses.map((status) => (
                      <SelectItem key={status} value={status}>
                        {status.replaceAll('_', ' ')}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : canEditStatus ? (
              <div className="space-y-1.5">
                <Label>Status</Label>
                <Select
                  value={form.watch('status') ?? listing?.status}
                  onValueChange={(value) =>
                    form.setValue(
                      'status',
                      value as AdminListingFormInput['status'],
                    )
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {statusOptions.map((status) => (
                      <SelectItem key={status} value={status}>
                        {status.replaceAll('_', ' ')}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : isEdit && listing ? (
              <div className="space-y-1.5">
                <Label>Status</Label>
                <p className="text-sm">{listing.status.replaceAll('_', ' ')}</p>
              </div>
            ) : null}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="listing-title">Title</Label>
            <Input id="listing-title" {...form.register('listingTitle')} />
          </div>

          <div className="space-y-1.5">
            <Label>Category</Label>
            <Select
              value={categoryId}
              onValueChange={(value) => {
                form.setValue('categoryId', value);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {categories?.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-1.5">
              <Label htmlFor="brand">Brand</Label>
              <Input id="brand" {...form.register('brand')} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="model">Model</Label>
              <Input id="model" {...form.register('model')} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="trim">Trim</Label>
              <Input id="trim" {...form.register('trim')} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="year">Year</Label>
              <NumberInput
                id="year"
                {...form.register('manufacturingYear', numberRegisterOptions())}
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Condition</Label>
              <Select
                value={form.watch('condition')}
                onValueChange={(value) =>
                  form.setValue(
                    'condition',
                    value as AdminListingFormInput['condition'],
                  )
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {listingConditions.map((condition) => (
                    <SelectItem key={condition} value={condition}>
                      {condition.replaceAll('_', ' ')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="mileage">Mileage (km)</Label>
              <NumberInput
                id="mileage"
                min={0}
                {...form.register('mileageKm', numberRegisterOptions())}
              />
            </div>
          </div>

          <div className="space-y-3 rounded-lg border p-4">
            <p className="text-sm font-medium">Vehicle details (optional)</p>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div className="space-y-1.5">
                <Label>Body type</Label>
                <Select
                  value={form.watch('bodyType') ?? ''}
                  onValueChange={(value) =>
                    form.setValue(
                      'bodyType',
                      value === 'none'
                        ? undefined
                        : (value as AdminListingFormInput['bodyType']),
                    )
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Optional" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {listingBodyTypes.map((type) => (
                      <SelectItem key={type} value={type}>
                        {formatListingEnumLabel(type)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Powertrain</Label>
                <Select
                  value={form.watch('powertrainType') ?? ''}
                  onValueChange={(value) =>
                    form.setValue(
                      'powertrainType',
                      value === 'none'
                        ? undefined
                        : (value as AdminListingFormInput['powertrainType']),
                    )
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Optional" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {listingPowertrainTypes.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="color">Color</Label>
                <div className="flex items-center gap-3">
                  <Input
                    id="color"
                    type="color"
                    className="h-10 w-14 cursor-pointer p-1"
                    value={form.watch('color') ?? '#1a1a1a'}
                    onChange={(event) =>
                      form.setValue('color', event.target.value)
                    }
                  />
                  <Input
                    value={form.watch('color') ?? '#1a1a1a'}
                    onChange={(event) =>
                      form.setValue('color', event.target.value)
                    }
                    className="font-mono uppercase"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="seats">Seats</Label>
                <NumberInput
                  id="seats"
                  min={1}
                  {...form.register('seats', numberRegisterOptions())}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Steering</Label>
                <Select
                  value={form.watch('steeringPosition') ?? ''}
                  onValueChange={(value) =>
                    form.setValue(
                      'steeringPosition',
                      value === 'none'
                        ? undefined
                        : (value as AdminListingFormInput['steeringPosition']),
                    )
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Optional" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {listingSteeringPositions.map((type) => (
                      <SelectItem key={type} value={type}>
                        {formatListingEnumLabel(type)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Drivetrain</Label>
                <Select
                  value={form.watch('drivetrain') ?? ''}
                  onValueChange={(value) =>
                    form.setValue(
                      'drivetrain',
                      value === 'none'
                        ? undefined
                        : (value as AdminListingFormInput['drivetrain']),
                    )
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Optional" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {listingDrivetrains.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="ownership-count">Ownership count</Label>
                <NumberInput
                  id="ownership-count"
                  min={0}
                  {...form.register('ownershipCount', numberRegisterOptions())}
                />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label>Registration status</Label>
                <Select
                  value={form.watch('registrationStatus') ?? ''}
                  onValueChange={(value) =>
                    form.setValue(
                      'registrationStatus',
                      value === 'none'
                        ? undefined
                        : (value as AdminListingFormInput['registrationStatus']),
                    )
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Optional" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {listingRegistrationStatuses.map((status) => (
                      <SelectItem key={status} value={status}>
                        {listingRegistrationStatusLabels[status]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end gap-2 pb-2">
                <input
                  id="has-warranty"
                  type="checkbox"
                  className="size-4 rounded border"
                  checked={form.watch('hasWarranty') ?? false}
                  onChange={(event) =>
                    form.setValue('hasWarranty', event.target.checked)
                  }
                />
                <Label htmlFor="has-warranty">Has warranty</Label>
              </div>
              <div className="flex items-end gap-2 pb-2">
                <input
                  id="has-accident"
                  type="checkbox"
                  className="size-4 rounded border"
                  checked={form.watch('hasAccidentHistory') ?? false}
                  onChange={(event) =>
                    form.setValue('hasAccidentHistory', event.target.checked)
                  }
                />
                <Label htmlFor="has-accident">Accident history</Label>
              </div>
            </div>
            {form.watch('hasWarranty') ? (
              <div className="space-y-1.5">
                <Label htmlFor="warranty-details">Warranty details</Label>
                <Textarea
                  id="warranty-details"
                  rows={2}
                  {...form.register('warrantyDetails')}
                />
              </div>
            ) : null}
            <div className="space-y-2">
              <Label>Use cases (optional)</Label>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {listingUseCases.map((useCase) => {
                  const selected = form.watch('useCases') ?? [];
                  const checked = selected.includes(useCase);
                  return (
                    <label
                      key={useCase}
                      className="flex items-center gap-2 text-sm"
                    >
                      <input
                        type="checkbox"
                        className="size-4 rounded border"
                        checked={checked}
                        onChange={(event) => {
                          const next = event.target.checked
                            ? [...selected, useCase]
                            : selected.filter((value) => value !== useCase);
                          form.setValue(
                            'useCases',
                            next.length ? next : undefined,
                          );
                        }}
                      />
                      {formatListingEnumLabel(useCase)}
                    </label>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="space-y-3 rounded-lg border p-4">
            <p className="text-sm font-medium">EV specifications</p>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div className="space-y-1.5">
                <Label htmlFor="range">Electric range (km)</Label>
                <NumberInput
                  id="range"
                  min={1}
                  {...form.register('rangeKm', numberRegisterOptions())}
                />
              </div>
              {form.watch('condition') !== 'NEW' ? (
                <div className="space-y-1.5">
                  <Label htmlFor="battery-health">Battery health (%)</Label>
                  <NumberInput
                    id="battery-health"
                    min={0}
                    max={100}
                    {...form.register(
                      'batteryHealthPercent',
                      numberRegisterOptions(),
                    )}
                  />
                </div>
              ) : null}
              <div className="space-y-1.5">
                <Label htmlFor="battery-capacity">Battery capacity (kWh)</Label>
                <NumberInput
                  id="battery-capacity"
                  min={0}
                  {...form.register(
                    'batteryCapacityKwh',
                    numberRegisterOptions(),
                  )}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="charging-time">Charging time (hours)</Label>
                <NumberInput
                  id="charging-time"
                  min={0}
                  {...form.register(
                    'chargingTimeHours',
                    numberRegisterOptions(),
                  )}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="motor-power">Motor power (kW)</Label>
                <NumberInput
                  id="motor-power"
                  min={0}
                  {...form.register('motorPowerKw', numberRegisterOptions())}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="top-speed">Top speed (km/h)</Label>
                <NumberInput
                  id="top-speed"
                  min={0}
                  {...form.register('topSpeedKmh', numberRegisterOptions())}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="payload">Payload (kg)</Label>
                <NumberInput
                  id="payload"
                  min={0}
                  {...form.register(
                    'payloadCapacityKg',
                    numberRegisterOptions(),
                  )}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="gvwr">Gross vehicle weight (kg)</Label>
                <NumberInput
                  id="gvwr"
                  min={0}
                  {...form.register(
                    'grossVehicleWeightKg',
                    numberRegisterOptions(),
                  )}
                />
              </div>
              <div className="flex items-end gap-2 pb-2">
                <input
                  id="battery-health-report"
                  type="checkbox"
                  className="size-4 rounded border"
                  checked={form.watch('batteryHealthReport') ?? false}
                  onChange={(event) =>
                    form.setValue('batteryHealthReport', event.target.checked)
                  }
                />
                <Label htmlFor="battery-health-report">
                  Battery health report
                </Label>
              </div>
              <div className="flex items-end gap-2 pb-2">
                <input
                  id="fast-charging"
                  type="checkbox"
                  className="size-4 rounded border"
                  checked={form.watch('fastChargingSupported') ?? false}
                  onChange={(event) =>
                    form.setValue('fastChargingSupported', event.target.checked)
                  }
                />
                <Label htmlFor="fast-charging">Fast charging supported</Label>
              </div>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="city">City</Label>
              <Input
                id="city"
                placeholder={
                  sellerType === 'UZA_RWANDA_STOCK'
                    ? 'e.g. Kigali'
                    : 'e.g. Shanghai'
                }
                {...form.register('city')}
              />
              <p className="text-xs text-muted-foreground">
                {sellerType === 'UZA_RWANDA_STOCK'
                  ? 'Rwanda stock — city in Rwanda only.'
                  : 'China sourcing — city in China only.'}
              </p>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="delivery-days">Delivery estimate (days)</Label>
              <NumberInput
                id="delivery-days"
                min={
                  sellerType === 'UZA_RWANDA_STOCK'
                    ? RWANDA_STOCK_DELIVERY_DAYS.min
                    : CHINA_SOURCING_DELIVERY_DAYS.min
                }
                max={
                  sellerType === 'UZA_RWANDA_STOCK'
                    ? RWANDA_STOCK_DELIVERY_DAYS.max
                    : CHINA_SOURCING_DELIVERY_DAYS.max
                }
                {...form.register(
                  'deliveryEstimateDays',
                  numberRegisterOptions(),
                )}
              />
              <p className="text-xs text-muted-foreground">
                {sellerType === 'UZA_RWANDA_STOCK'
                  ? `${RWANDA_STOCK_DELIVERY_DAYS.min}–${RWANDA_STOCK_DELIVERY_DAYS.max} days for Rwanda stock`
                  : `${CHINA_SOURCING_DELIVERY_DAYS.min}–${CHINA_SOURCING_DELIVERY_DAYS.max} days for China sourcing`}
              </p>
            </div>
          </div>

          <div className="space-y-3 rounded-lg border p-4">
            <p className="text-sm font-medium">Pricing rule</p>
            <div className="space-y-1.5">
              <Label>Rule to apply</Label>
              <p className="text-xs text-muted-foreground">
                {selectablePricingRules.length === 0
                  ? 'No pricing rules yet — add them under Pricing rules.'
                  : 'Choose any pricing rule. Rules for this inventory channel are listed first.'}
              </p>
              <Select
                value={pricingRuleId || undefined}
                onValueChange={(value) => form.setValue('pricingRuleId', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select pricing rule" />
                </SelectTrigger>
                <SelectContent>
                  {selectablePricingRules.map((rule) => (
                    <SelectItem key={rule.id} value={rule.id}>
                      {formatPricingRuleLabel(rule)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {form.formState.errors.pricingRuleId ? (
                <p className="text-sm text-destructive">
                  {form.formState.errors.pricingRuleId.message}
                </p>
              ) : null}
            </div>
            <PricingBreakdown
              breakdown={priceBreakdown}
              loading={priceLoading}
              sellerType={sellerType}
            />
          </div>

          {sellerType === 'UZA_RWANDA_STOCK' ? (
            <div className="space-y-1.5">
              <Label htmlFor="base-price">Base price (Rwf)</Label>
              <NumberInput
                id="base-price"
                min={0}
                step="1"
                {...form.register('basePriceRwf', numberRegisterOptions())}
              />
              {form.formState.errors.basePriceRwf ? (
                <p className="text-sm text-destructive">
                  {form.formState.errors.basePriceRwf.message}
                </p>
              ) : null}
            </div>
          ) : (
            <div className="space-y-1.5">
              <Label htmlFor="fob-price">FOB price (Rwf)</Label>
              <NumberInput
                id="fob-price"
                min={0}
                step="1"
                {...form.register('fobPriceRwf', numberRegisterOptions())}
              />
              {form.formState.errors.fobPriceRwf ? (
                <p className="text-sm text-destructive">
                  {form.formState.errors.fobPriceRwf.message}
                </p>
              ) : null}
            </div>
          )}
          {priceBreakdown?.finalPriceRwf != null ? (
            <p className="text-xs text-muted-foreground">
              Calculated customer price{' '}
              {formatRwf(priceBreakdown.finalPriceRwf)}
            </p>
          ) : null}

          <div className="space-y-1.5">
            <Label htmlFor="listing-desc">Description</Label>
            <Textarea
              id="listing-desc"
              rows={3}
              {...form.register('description')}
            />
            <p className="text-xs text-muted-foreground">
              {descriptionWordCount} / {LISTING_DESCRIPTION_MAX_WORDS} words
            </p>
          </div>

          {isEdit ? (
            <ExistingPhotosGrid
              photos={keptExistingPhotos}
              hint="Use arrows to reorder, star to set cover, × to remove. At least one photo is required."
              onRemovePhoto={(photoId) => {
                setRemovedPhotoIds((current) =>
                  current.includes(photoId) ? current : [...current, photoId],
                );
                setOrderedExistingPhotos((current) => {
                  const next = current.filter((photo) => photo.id !== photoId);
                  if (next.length === 0) return next;
                  if (next.some((photo) => photo.isPrimary)) return next;
                  return next.map((photo, index) => ({
                    ...photo,
                    isPrimary: index === 0,
                  }));
                });
              }}
              onMovePhoto={(photoId, direction) => {
                setOrderedExistingPhotos((current) => {
                  const index = current.findIndex(
                    (photo) => photo.id === photoId,
                  );
                  if (index < 0) return current;
                  const targetIndex =
                    direction === 'left' ? index - 1 : index + 1;
                  if (targetIndex < 0 || targetIndex >= current.length) {
                    return current;
                  }
                  const next = [...current];
                  const [item] = next.splice(index, 1);
                  next.splice(targetIndex, 0, item);
                  return next;
                });
              }}
              onSetPrimaryPhoto={(photoId) => {
                setOrderedExistingPhotos((current) =>
                  current.map((photo) => ({
                    ...photo,
                    isPrimary: photo.id === photoId,
                  })),
                );
              }}
            />
          ) : null}

          {isEdit &&
          existingPhotos.length > 0 &&
          keptExistingPhotos.length === 0 ? (
            <p className="text-xs text-muted-foreground">
              All current photos marked for removal. Upload at least one new
              photo before saving.
            </p>
          ) : null}

          <PendingPhotoPicker
            photos={photos}
            onChange={setPhotos}
            maxPhotos={isEdit ? remainingPhotoSlots : MAX_LISTING_PHOTOS}
            label={isEdit ? 'Add photos' : 'Listing photos'}
          />

          <div className="space-y-2 rounded-lg border p-4">
            <Label htmlFor="listing-video">Hero video (optional)</Label>
            <p className="text-xs text-muted-foreground">
              MP4, WebM, or MOV. Shown on the vehicle page after the primary
              photo loads, like the homepage hero.
            </p>
            {isEdit && listing?.videoUrl && !removeVideo ? (
              <p className="text-sm text-muted-foreground">
                Current video is attached to this listing.
              </p>
            ) : null}
            {isEdit && listing?.videoUrl ? (
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  className="size-4 rounded border"
                  checked={removeVideo}
                  onChange={(event) => {
                    setRemoveVideo(event.target.checked);
                    if (event.target.checked) {
                      setVideoFile(null);
                      if (videoInputRef.current) {
                        videoInputRef.current.value = '';
                      }
                    }
                  }}
                />
                Remove existing video
              </label>
            ) : null}
            <Input
              id="listing-video"
              ref={videoInputRef}
              type="file"
              accept="video/mp4,video/webm,video/quicktime"
              disabled={removeVideo}
              onChange={(event) => {
                const file = event.target.files?.[0] ?? null;
                setVideoFile(file);
                if (file) setRemoveVideo(false);
              }}
            />
            {videoFile ? (
              <p className="text-xs text-muted-foreground">
                Selected: {videoFile.name}
              </p>
            ) : null}
          </div>

          <div className="space-y-2 rounded-lg border p-4">
            <Label htmlFor="listing-brochure">
              Vehicle brochure (optional)
            </Label>
            <p className="text-xs text-muted-foreground">
              PDF buyers can download from the vehicle page.
            </p>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                className="size-4 rounded border"
                {...form.register('isFullOption')}
              />
              Full option / fully loaded trim
            </label>
            {isEdit && listing?.brochureUrl && !removeBrochure ? (
              <p className="text-sm text-muted-foreground">
                Current brochure is attached to this listing.
              </p>
            ) : null}
            {isEdit && listing?.brochureUrl ? (
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  className="size-4 rounded border"
                  checked={removeBrochure}
                  onChange={(event) => {
                    setRemoveBrochure(event.target.checked);
                    if (event.target.checked) {
                      setBrochureFile(null);
                      if (brochureInputRef.current) {
                        brochureInputRef.current.value = '';
                      }
                    }
                  }}
                />
                Remove existing brochure
              </label>
            ) : null}
            <Input
              id="listing-brochure"
              ref={brochureInputRef}
              type="file"
              accept="application/pdf,image/jpeg,image/png,image/webp"
              disabled={removeBrochure}
              onChange={(event) => {
                const file = event.target.files?.[0] ?? null;
                setBrochureFile(file);
                if (file) setRemoveBrochure(false);
              }}
            />
            {brochureFile ? (
              <p className="text-xs text-muted-foreground">
                Selected: {brochureFile.name}
              </p>
            ) : null}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={busy || (isEdit && !isDirty && !mediaDirty)}
            >
              {busy ? 'Saving…' : isEdit ? 'Save changes' : 'Create listing'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

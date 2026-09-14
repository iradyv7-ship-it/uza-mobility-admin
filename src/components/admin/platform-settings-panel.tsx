'use client';

import { useEffect, useState } from 'react';
import { PageHeader } from '@/components/shared/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { NumberInput } from '@/components/ui/number-input';
import { Spinner } from '@/components/ui/spinner';
import { usePermissions } from '@/hooks/permissions';
import { formatRwf } from '@/lib/admin/format';
import {
  useAdminPlatformSettings,
  useUpdatePlatformSettings,
} from '@/queries/platform-settings';

type FormState = {
  bookingFeeRwf: string;
  inspectionRateRwf: string;
  usdToRwfEffective: string;
  companyLegalName: string;
  companyBankNameRwf: string;
  companyAccountNumberRwf: string;
  companyWhatsappNumber: string;
};

export function AdminPlatformSettingsPanel() {
  const { can } = usePermissions();
  const canManage = can('platform-settings:manage');
  const { data, isLoading } = useAdminPlatformSettings(canManage);
  const update = useUpdatePlatformSettings();
  const [form, setForm] = useState<FormState>({
    bookingFeeRwf: '',
    inspectionRateRwf: '',
    usdToRwfEffective: '',
    companyLegalName: '',
    companyBankNameRwf: '',
    companyAccountNumberRwf: '',
    companyWhatsappNumber: '',
  });

  useEffect(() => {
    if (!data) return;
    setForm({
      bookingFeeRwf: String(data.bookingFeeRwf ?? ''),
      inspectionRateRwf: String(data.inspectionRateRwf ?? ''),
      usdToRwfEffective: String(data.exchangeRate?.usdToRwfEffective ?? ''),
      companyLegalName: data.companyLegalName,
      companyBankNameRwf: data.companyBankNameRwf ?? '',
      companyAccountNumberRwf: data.companyAccountNumberRwf ?? '',
      companyWhatsappNumber: data.companyWhatsappNumber,
    });
  }, [data]);

  if (!canManage) {
    return (
      <div className="space-y-4">
        <PageHeader
          title="Platform settings"
          description="Payment defaults for bookings and invoices."
        />
        <p className="text-sm text-muted-foreground">
          You do not have permission to manage platform settings.
        </p>
      </div>
    );
  }

  const parsedFee = Number(form.bookingFeeRwf);
  const parsedInspectionRate = Number(form.inspectionRateRwf);
  const parsedRate = Number(form.usdToRwfEffective);
  const isValid =
    Number.isFinite(parsedFee) &&
    parsedFee > 0 &&
    Number.isInteger(parsedInspectionRate) &&
    parsedInspectionRate >= 1_000 &&
    parsedInspectionRate <= 500_000 &&
    Number.isFinite(parsedRate) &&
    parsedRate > 0 &&
    form.companyLegalName.trim().length > 0 &&
    form.companyBankNameRwf.trim().length > 0 &&
    form.companyAccountNumberRwf.trim().length > 0 &&
    form.companyWhatsappNumber.replace(/\D/g, '').length >= 8;

  const isDirty =
    data &&
    (parsedFee !== data.bookingFeeRwf ||
      parsedInspectionRate !== data.inspectionRateRwf ||
      parsedRate !== data.exchangeRate.usdToRwfEffective ||
      form.companyLegalName.trim() !== data.companyLegalName ||
      form.companyBankNameRwf.trim() !== (data.companyBankNameRwf ?? '') ||
      form.companyAccountNumberRwf.trim() !==
        (data.companyAccountNumberRwf ?? '') ||
      form.companyWhatsappNumber.replace(/\D/g, '') !==
        data.companyWhatsappNumber.replace(/\D/g, ''));

  const onSave = () => {
    if (!isValid || !isDirty) return;
    update.mutate({
      bookingFeeRwf: Math.round(parsedFee),
      inspectionRateRwf: Math.round(parsedInspectionRate),
      usdToRwfEffective: parsedRate,
      companyLegalName: form.companyLegalName.trim(),
      companyBankNameRwf: form.companyBankNameRwf.trim(),
      companyAccountNumberRwf: form.companyAccountNumberRwf.trim(),
      companyWhatsappNumber: form.companyWhatsappNumber.replace(/\D/g, ''),
    });
  };

  const rate = data?.exchangeRate;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Platform settings"
        description="Default booking fee, Rwf receiving account, WhatsApp, and frozen leftover-USD display rate."
      />

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Spinner className="size-6" />
        </div>
      ) : (
        <div className="max-w-xl space-y-6 rounded-lg border p-4">
          <div className="space-y-1.5">
            <Label htmlFor="booking-fee">Default booking fee (Rwf)</Label>
            <NumberInput
              id="booking-fee"
              min={1}
              step="1"
              value={form.bookingFeeRwf}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  bookingFeeRwf: event.target.value,
                }))
              }
              disabled={update.isPending}
            />
            {data ? (
              <p className="text-xs text-muted-foreground">
                Current fee for new bookings: {formatRwf(data.bookingFeeRwf)}
              </p>
            ) : null}
          </div>

          <div className="space-y-1.5 rounded-md border p-3">
            <Label htmlFor="inspection-rate">
              Contracted inspection fee (Rwf)
            </Label>
            <NumberInput
              id="inspection-rate"
              min={1_000}
              max={500_000}
              step="1"
              value={form.inspectionRateRwf}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  inspectionRateRwf: event.target.value,
                }))
              }
              disabled={update.isPending}
            />
            <p className="text-xs text-muted-foreground">
              What UZA pays a certified garage per scheduled inspection —
              currently{' '}
              {data ? formatRwf(data.inspectionRateRwf) : '—'}, split 85%
              garage / 15% UZA. This was the Mobility Ecosystem Blueprint&rsquo;s
              proposed starting point, not yet a rate negotiated with any real
              garage — change it here the moment one is agreed, and every
              driver&rsquo;s daily reserve target and the funder/investor
              Impact Ledger pick up the new number immediately, with no
              deploy.
            </p>
          </div>

          <div className="space-y-3 rounded-md border bg-muted/30 p-3">
            <p className="text-sm font-medium">
              Frozen leftover USD → Rwf rate
            </p>
            <div className="space-y-1.5">
              <Label htmlFor="frozen-rate">USD to Rwf</Label>
              <NumberInput
                id="frozen-rate"
                min={0.0001}
                step="0.0001"
                value={form.usdToRwfEffective}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    usdToRwfEffective: event.target.value,
                  }))
                }
                disabled={update.isPending}
              />
              <p className="text-xs text-muted-foreground">
                Used only to display untouched USD listings in Rwf. New listings
                are entered and stored in Rwf.
              </p>
            </div>
            {rate ? (
              <p className="text-xs text-muted-foreground">
                Example 1,000 USD →{' '}
                <span className="font-medium text-foreground">
                  {formatRwf(Math.round(1000 * rate.usdToRwfEffective))}
                </span>
              </p>
            ) : null}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="company-legal-name">Company legal name</Label>
            <Input
              id="company-legal-name"
              value={form.companyLegalName}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  companyLegalName: event.target.value,
                }))
              }
              disabled={update.isPending}
            />
          </div>

          <div className="space-y-3 rounded-md border p-3">
            <p className="text-sm font-medium">Rwf receiving account</p>
            <div className="space-y-1.5">
              <Label htmlFor="company-bank-name-rwf">Bank name</Label>
              <Input
                id="company-bank-name-rwf"
                value={form.companyBankNameRwf}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    companyBankNameRwf: event.target.value,
                  }))
                }
                disabled={update.isPending}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="company-account-number-rwf">Account number</Label>
              <Input
                id="company-account-number-rwf"
                value={form.companyAccountNumberRwf}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    companyAccountNumberRwf: event.target.value,
                  }))
                }
                disabled={update.isPending}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="company-whatsapp-number">WhatsApp number</Label>
            <Input
              id="company-whatsapp-number"
              inputMode="tel"
              placeholder="250788000000"
              value={form.companyWhatsappNumber}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  companyWhatsappNumber: event.target.value,
                }))
              }
              disabled={update.isPending}
            />
            <p className="text-xs text-muted-foreground">
              International format without + — used on quote PDFs and inquiry
              emails.
            </p>
          </div>

          <Button
            type="button"
            disabled={!isValid || !isDirty || update.isPending}
            onClick={onSave}
          >
            {update.isPending ? 'Saving…' : 'Save settings'}
          </Button>
        </div>
      )}
    </div>
  );
}

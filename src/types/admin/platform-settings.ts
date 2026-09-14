export type ExchangeRateSnapshot = {
  usdToRwfApi: number;
  usdToRwfEffective: number;
  markupPercent: number;
  rateFetchedAt: string | null;
  baseCurrency: 'USDT';
  quoteCurrency: 'RWF';
  frozen?: boolean;
};

export type PlatformSettings = {
  bookingFeeUsd: number;
  bookingFeeRwf: number;
  inspectionRateRwf: number;
  companyLegalName: string;
  companyBankName: string;
  companyAccountNumber: string;
  companyBankNameRwf: string;
  companyAccountNumberRwf: string;
  companyWhatsappNumber: string;
  currency: 'RWF' | 'USDT' | 'USD';
  rwfMarkupPercent: number;
  exchangeRate: ExchangeRateSnapshot;
};

export type UpdatePlatformSettingsInput = {
  bookingFeeUsd?: number;
  bookingFeeRwf?: number;
  inspectionRateRwf?: number;
  usdToRwfEffective?: number;
  companyLegalName?: string;
  companyBankName?: string;
  companyAccountNumber?: string;
  companyBankNameRwf?: string;
  companyAccountNumberRwf?: string;
  companyWhatsappNumber?: string;
};

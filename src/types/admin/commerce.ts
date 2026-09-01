export type PaymentStatus =
  'SUBMITTED' | 'UNDER_VERIFICATION' | 'CONFIRMED' | 'REJECTED' | 'REFUNDED';

export type InvoiceStatus =
  | 'DRAFT'
  | 'SENT'
  | 'AWAITING_PAYMENT'
  | 'PAYMENT_SUBMITTED'
  | 'UNDER_VERIFICATION'
  | 'PAYMENT_CONFIRMED'
  | 'PARTIALLY_PAID'
  | 'FULLY_PAID'
  | 'EXPIRED'
  | 'REJECTED'
  | 'REFUNDED'
  | 'CANCELLED';

export type OrderStatus =
  | 'INVOICE_ISSUED'
  | 'PAYMENT_SUBMITTED'
  | 'PAYMENT_CONFIRMED'
  | 'VEHICLE_RESERVED'
  | 'PROCESSING'
  | 'IN_TRANSIT'
  | 'ARRIVED'
  | 'CLEARANCE'
  | 'READY_FOR_HANDOVER'
  | 'DELIVERED'
  | 'CANCELLED';

export type FinancingStatus =
  | 'SUBMITTED'
  | 'UNDER_REVIEW'
  | 'SENT_TO_BANK'
  | 'BANK_APPROVED'
  | 'BANK_REJECTED'
  | 'CANCELLED';

export type SellerType =
  | 'UZA_RWANDA_STOCK'
  | 'UZA_CHINA_SOURCING'
  | 'LOCAL_SELLER'
  | 'INTERNATIONAL_SELLER'
  | string;

export type PaymentProof = {
  id: string;
  fileUrl: string;
  fileType: string;
  fileName: string;
  uploadedAt: string;
};

export type AdminPayment = {
  id: string;
  invoiceId: string;
  amountPaid: number;
  currency: string;
  exchangeRateUsed?: number | null;
  bankName: string | null;
  transferReference: string | null;
  paymentDate: string | null;
  senderName: string | null;
  notes: string | null;
  status: PaymentStatus;
  verifiedBy: string | null;
  verifiedByName: string | null;
  verifiedAt: string | null;
  rejectionReason: string | null;
  bankStatementRef: string | null;
  createdAt: string;
  updatedAt: string;
  invoice: {
    invoiceNumber: string;
    paymentReference: string;
    totalAmountUsd: number;
    totalAmountRwf?: number | null;
    currency?: string;
    status: InvoiceStatus;
    buyerName: string;
    buyerEmail: string | null;
  };
  proofs: PaymentProof[];
};

export type AdminPaymentsFilters = {
  status?: PaymentStatus;
  invoiceId?: string;
  page?: number;
  limit?: number;
};

export type AdminInvoice = {
  id: string;
  invoiceNumber: string;
  paymentReference: string;
  userId: string;
  listingId: string | null;
  status: InvoiceStatus;
  buyerName: string;
  buyerEmail: string | null;
  vehicleBrand: string | null;
  vehicleModel: string | null;
  listingTitle?: string | null;
  totalAmountUsd: number;
  totalAmountRwf?: number | null;
  currency: string;
  paymentDeadline: string | null;
  validUntil: string | null;
  issuedAt: string | null;
  beneficiaryName?: string | null;
  bankName?: string | null;
  accountNumber?: string | null;
  rwfBankName?: string | null;
  rwfAccountNumber?: string | null;
  exchangeRateUsed?: number | null;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
  listing?: { slug: string; listingTitle: string } | null;
  payments?: AdminPayment[];
};

export type AdminBuyer = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  displayName: string;
  buyerProfile: {
    buyerType: string;
    organizationName: string | null;
    address: string | null;
    city: string | null;
    country: string;
  } | null;
};

export type AdminBuyersFilters = {
  q?: string;
};

export type AdminInvoicesFilters = {
  status?: InvoiceStatus;
  q?: string;
  page?: number;
  limit?: number;
};

export type OrderTrackingEvent = {
  id: string;
  stage: string;
  title: string;
  description: string | null;
  location: string | null;
  occurredAt: string;
};

export type OrderShipment = {
  id: string;
  documentNumber?: string | null;
  vesselName?: string | null;
  voyageNumber?: string | null;
  etaAt?: string | null;
  portOfLoading?: string | null;
  portOfDischarge?: string | null;
  terminalOfPickup?: string | null;
  finalPlaceOfDelivery?: string | null;
  containerNumber?: string | null;
  sealNumber?: string | null;
  carrierTrackUrl?: string | null;
  arrivalNoticeFileUrl?: string | null;
};

export type AdminOrder = {
  id: string;
  orderNumber: string;
  userId: string;
  listingId: string;
  invoiceId: string;
  status: OrderStatus;
  sellerType: SellerType;
  vin?: string | null;
  shipmentId?: string | null;
  shipment?: OrderShipment | null;
  deliveryAddress: string | null;
  deliveryCity: string | null;
  deliveryCountry: string;
  estimatedDeliveryDate: string | null;
  actualDeliveryDate: string | null;
  handoverNotes: string | null;
  createdAt: string;
  updatedAt: string;
  listing: {
    id: string;
    slug: string;
    listingTitle: string;
    brand: string;
    model: string;
    manufacturingYear: number;
    inventoryStage?: string | null;
  };
  invoice: {
    id: string;
    invoiceNumber: string;
    paymentReference: string;
    totalAmountUsd: number;
    totalAmountRwf?: number | null;
    currency?: string;
  };
  user?: {
    id: string;
    email: string;
    firstName?: string | null;
    lastName?: string | null;
    phone?: string | null;
  } | null;
  trackingEvents: OrderTrackingEvent[];
};

export type AdminOrdersFilters = {
  status?: OrderStatus;
  sellerType?: SellerType;
  q?: string;
  page?: number;
  limit?: number;
};

export type Bank = {
  id: string;
  name: string;
  country: string;
  contactEmail: string | null;
  contactPhone: string | null;
  isActive: boolean;
  createdAt: string;
};

export type AdminFinancingRequest = {
  id: string;
  userId: string;
  invoiceId: string | null;
  listingId: string | null;
  status: FinancingStatus;
  buyerName: string;
  phone: string;
  organizationName: string | null;
  preferredDepositUsd: number | null;
  preferredBankName: string | null;
  notes: string | null;
  assignedBankId: string | null;
  reviewNotes: string | null;
  createdAt: string;
  updatedAt: string;
  assignedBank: Bank | null;
  invoice: {
    id: string;
    invoiceNumber: string;
    totalAmountUsd: number;
    totalAmountRwf?: number | null;
    currency?: string;
    status: InvoiceStatus;
  } | null;
  user: {
    id: string;
    email: string;
    firstName: string | null;
    lastName: string | null;
  };
};

export type AdminFinancingFilters = {
  status?: FinancingStatus;
  search?: string;
  page?: number;
  limit?: number;
};

export const paymentStatuses: PaymentStatus[] = [
  'SUBMITTED',
  'UNDER_VERIFICATION',
  'CONFIRMED',
  'REJECTED',
  'REFUNDED',
];

export const invoiceStatuses: InvoiceStatus[] = [
  'DRAFT',
  'SENT',
  'AWAITING_PAYMENT',
  'PAYMENT_SUBMITTED',
  'UNDER_VERIFICATION',
  'PAYMENT_CONFIRMED',
  'PARTIALLY_PAID',
  'FULLY_PAID',
  'EXPIRED',
  'REJECTED',
  'REFUNDED',
  'CANCELLED',
];

export const orderStatuses: OrderStatus[] = [
  'INVOICE_ISSUED',
  'PAYMENT_SUBMITTED',
  'PAYMENT_CONFIRMED',
  'VEHICLE_RESERVED',
  'PROCESSING',
  'IN_TRANSIT',
  'ARRIVED',
  'CLEARANCE',
  'READY_FOR_HANDOVER',
  'DELIVERED',
  'CANCELLED',
];

export const financingStatuses: FinancingStatus[] = [
  'SUBMITTED',
  'UNDER_REVIEW',
  'SENT_TO_BANK',
  'BANK_APPROVED',
  'BANK_REJECTED',
  'CANCELLED',
];

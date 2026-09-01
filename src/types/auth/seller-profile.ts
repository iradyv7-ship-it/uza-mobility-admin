export type SellerType =
  | 'UZA_RWANDA_STOCK'
  | 'UZA_CHINA_SOURCING'
  | 'LOCAL_SELLER'
  | 'INTERNATIONAL_SELLER'
  | string;

export type SellerStatus =
  'PENDING' | 'ACTIVE' | 'SUSPENDED' | 'REJECTED' | string;

export type MeSellerProfile = {
  id: string;
  /** Absent until the seller uploads one. */
  logoUrl: string | null;
  sellerType: SellerType;
  status: SellerStatus;
  businessName: string;
  contactPerson?: string | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  city: string | null;
  country: string;
  description?: string | null;
  isVerified: boolean;
  verifiedAt: string | null;
};

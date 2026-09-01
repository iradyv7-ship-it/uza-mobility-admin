export type InquiryStatus =
  'RECEIVED' | 'CONTACTED' | 'QUOTED' | 'CONVERTED' | 'CLOSED';

export type AdminInquiry = {
  id: string;
  quoteNumber: string;
  userId: string | null;
  listingId: string | null;
  name: string;
  phone: string;
  email: string;
  country: string;
  buyerType: string;
  message: string | null;
  status: InquiryStatus;
  quotePdfUrl: string | null;
  internalNotes: string | null;
  createdAt: string;
  listing?: {
    id: string;
    slug: string;
    listingTitle: string;
    brand: string;
    model: string;
    manufacturingYear: number;
  } | null;
};

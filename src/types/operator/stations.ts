import type { PaginatedResult } from '@/types/api/pagination';

export type OperatorStatus = 'PENDING' | 'ACTIVE' | 'SUSPENDED' | 'REJECTED';
export type StationStatus =
  | 'DRAFT'
  | 'PENDING_REVIEW'
  | 'APPROVED'
  | 'ACTIVE'
  | 'SUSPENDED'
  | 'REJECTED'
  | 'CLOSED';
export type LocationType = 'PUBLIC' | 'PRIVATE' | 'SEMI_PUBLIC' | 'FLEET_ONLY';
export type StationOperationalStatus =
  'OPERATIONAL' | 'PARTIALLY_OPERATIONAL' | 'OFFLINE' | 'MAINTENANCE';
export type ChargerType =
  'AC_TYPE2' | 'DC_CCS' | 'DC_CHADEMO' | 'DC_GBDC' | 'AC_TYPE1' | 'TESLA_WALL';
export type SpeedCategory = 'SLOW' | 'FAST' | 'RAPID' | 'ULTRA_RAPID';
export type CurrentType = 'AC' | 'DC';
export type PortStatus = 'AVAILABLE' | 'IN_USE' | 'FAULTED' | 'OUT_OF_SERVICE';
export type StationPricingModel =
  'PER_KWH' | 'PER_MINUTE' | 'PER_SESSION' | 'FREE';
export type VehicleCategory =
  'PASSENGER_EV' | 'TWO_THREE_WHEEL' | 'COMMERCIAL_EV';

export type OperatorProfile = {
  id: string;
  userId: string;
  businessName: string;
  businessRegNumber: string | null;
  contactPerson: string;
  phone: string;
  email: string;
  country: string;
  city: string;
  address: string | null;
  logoUrl: string | null;
  description: string | null;
  status: OperatorStatus;
  isVerified: boolean;
  adminNotes?: string | null;
  verifiedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ChargingPort = {
  id: string;
  stationId: string;
  portNumber: string | null;
  chargerType: ChargerType;
  speedCategory: SpeedCategory;
  powerKw: number;
  voltage: number | null;
  amperage: number | null;
  currentType: CurrentType;
  status: PortStatus;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type StationPricing = {
  id: string;
  stationId: string;
  pricingModel: StationPricingModel;
  rateAmount: number | null;
  currency: string;
  notes: string | null;
  isActive: boolean;
  validFrom: string;
  validUntil: string | null;
  createdAt: string;
  updatedAt: string;
};

export type VehicleCompatibility = {
  id: string;
  stationId: string;
  vehicleCategory: VehicleCategory;
  brand: string | null;
  model: string | null;
  isVerified: boolean;
  createdAt: string;
  updatedAt: string;
};

export type StationPhoto = {
  id: string;
  stationId: string;
  url: string;
  isPrimary: boolean;
  displayOrder: number;
  uploadedAt: string;
};

export type ChargingStation = {
  id: string;
  operatorId: string;
  name: string;
  slug: string;
  status: StationStatus;
  description: string | null;
  address: string;
  city: string;
  country: string;
  latitude: number | null;
  longitude: number | null;
  locationType: LocationType;
  isOpen24h: boolean;
  openingHours: Record<string, unknown> | null;
  totalPorts: number;
  availablePorts: number | null;
  hasParking: boolean;
  hasWifi: boolean;
  hasRestroom: boolean;
  hasCCTV: boolean;
  hasRoofCover: boolean;
  operationalStatus: StationOperationalStatus;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
  ports: ChargingPort[];
  pricing: StationPricing[];
  compatibleVehicles: VehicleCompatibility[];
  photos: StationPhoto[];
  operator?: {
    id: string;
    businessName: string;
    city: string;
    country: string;
    status: OperatorStatus;
  };
};

export type ChargingStationFilters = {
  q?: string;
  status?: StationStatus;
  page?: number;
  limit?: number;
};

export type ChargingStationPage = PaginatedResult<ChargingStation>;

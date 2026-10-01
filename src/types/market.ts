/**
 * Local Market and Shop Types
 */

import { BillingMode, SubscriptionStatus } from './financial.ts';

export interface MarketCoordinates {
  lat: number;
  lng: number;
}

export interface LocalMarket {
  id: string;
  name: string;
  code: string;
  area: string;
  city: string;
  state: string;
  pincode: string;
  coordinates: MarketCoordinates;
  radiusKm: number;
  imageUrl?: string;
  description?: string;
  totalShopsCount: number;
  isActive: boolean;
  createdAt: string;
}

export interface OperatingHours {
  openTime: string;  // e.g. "08:00"
  closeTime: string; // e.g. "21:00"
  closedOnDays?: number[]; // 0 = Sunday, 1 = Monday, etc.
  openDays?: string[];
}

export type ShopManagementMode = 'ADMIN_MANAGED' | 'SELLER_MANAGED' | 'HYBRID';

export interface ShopFinancialSettings {
  billingMode?: BillingMode; // 'COMMISSION' | 'SUBSCRIPTION' | 'COMMISSION_PLUS_SUBSCRIPTION'
  subscriptionPlanId?: string;
  subscriptionPlanName?: string;
  subscriptionStatus?: SubscriptionStatus; // ACTIVE, TRIAL, PAST_DUE, etc.
  subscriptionStartDate?: string;
  subscriptionNextDueDate?: string;
  subscriptionAmount?: number;
  customCommissionPercentage?: number; // Override admin default if present
  deductSubscriptionFromSettlement?: boolean; // Default false
  payoutUpiId?: string;
  bankAccountNumber?: string;
  bankIfsc?: string;
  gstNumber?: string;
}

export interface ShopFulfillmentSettings {
  pickupEnabled: boolean;
  deliveryEnabled: boolean;
  minOrderValueForDelivery: number;
  deliveryFee: number;
  freeDeliveryThreshold: number;
  maxDeliveryRadiusKm: number;
  deliveryRadiusKm?: number;
  estimatedPreparationTimeMinutes: number;
  pickupInstructions?: string;
  sellerCanManageFulfillment?: boolean; // When false, locked by admin; seller cannot modify
  adminOverrideActive?: boolean;
}

export type ShopVerificationStatus =
  | 'PENDING_VERIFICATION'
  | 'VERIFIED'
  | 'CHANGE_REQUEST_PENDING'
  | 'REJECTED';

export type LocationSource = 'gps' | 'pin_adjusted' | 'manual';

export interface PostalAddressMetadata {
  pincode?: string;
  state?: string;
  district?: string;
  tehsil?: string;
  postOffice?: string;
  locality?: string;
}

export interface ShopLocationMetadata {
  coordinates: MarketCoordinates;
  accuracy?: number; // In meters, e.g. 12.4
  locationSource?: LocationSource;
  detectedAt?: string;
  notes?: string;
}

export interface ShopChangeRequest {
  id: string;
  shopId: string;
  sellerId: string;
  sellerName?: string;
  shopName?: string;
  requestedAt: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  reason: string;
  requestedChanges: {
    name?: string;
    category?: string;
    description?: string;
    phone?: string;
    email?: string;
    whatsapp?: string;
    address?: string;
    pincode?: string;
    postalData?: PostalAddressMetadata;
    coordinates?: MarketCoordinates;
    locationAccuracy?: number;
    locationSource?: LocationSource;
    photoUrl?: string;
    profilePhotoUrl?: string;
    coverPhotoUrl?: string;
    bannerUrl?: string;
    upiPayoutId?: string;
    paymentName?: string;
  };
  currentSnapshot?: {
    name?: string;
    category?: string;
    description?: string;
    phone?: string;
    email?: string;
    whatsapp?: string;
    address?: string;
    pincode?: string;
    postalData?: PostalAddressMetadata;
    coordinates?: MarketCoordinates;
    locationAccuracy?: number;
    locationSource?: LocationSource;
    photoUrl?: string;
    profilePhotoUrl?: string;
    coverPhotoUrl?: string;
    upiPayoutId?: string;
    paymentName?: string;
  };
  reviewedAt?: string;
  reviewedBy?: string;
  rejectionReason?: string;
  adminNotes?: string;
}

export interface Shop {
  id: string;
  sellerId: string; // Owner User ID
  marketId: string; // Associated Market ID
  name: string;
  description?: string;
  category: string; // e.g. 'Grocery & Kirana', 'Fresh Produce', 'Dairy & Sweets', 'Meat & Fish'
  tagline?: string;
  shopNumber?: string;
  landmark?: string;
  gstin?: string;
  upiPayoutId?: string;
  paymentName?: string;
  whatsapp?: string;
  managementMode?: ShopManagementMode;
  onboardedByAdminId?: string;
  bannerUrl?: string;
  bannerImageUrl?: string;
  coverPhotoUrl?: string; // Dedicated Shop Cover Photo
  coverPhotos?: (string | null)[]; // Dedicated Shop Cover Photos Gallery (Multi-photo array)
  photoUrl?: string;
  logoImageUrl?: string;
  profilePhotoUrl?: string; // Dedicated Shop Profile Photo
  phone: string;
  email?: string;
  address: string;
  pincode?: string;
  postalData?: PostalAddressMetadata;
  coordinates: MarketCoordinates;
  locationAccuracy?: number; // in meters (e.g. 14.5)
  locationSource?: LocationSource;
  locationUpdatedAt?: string;
  verificationStatus?: ShopVerificationStatus;
  verifiedAt?: string;
  verifiedBy?: string;
  verifiedByName?: string;
  rejectionReason?: string;
  activeChangeRequest?: ShopChangeRequest;
  operatingHours: OperatingHours;
  fulfillment: ShopFulfillmentSettings;
  financials: ShopFinancialSettings;
  isOpen?: boolean;
  isOpenNow?: boolean;
  isAcceptingOrders?: boolean;
  closedReason?: string;
  reopenTime?: string;
  isVerifiedByAdmin: boolean;
  isActive: boolean;
  averageRating: number;
  totalReviewsCount: number;
  distanceKm?: number;
  distanceText?: string;
  createdAt: string;
  updatedAt: string;
}

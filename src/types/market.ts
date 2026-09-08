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
  managementMode?: ShopManagementMode;
  onboardedByAdminId?: string;
  bannerUrl?: string;
  bannerImageUrl?: string;
  photoUrl?: string;
  logoImageUrl?: string;
  phone: string;
  email?: string;
  address: string;
  coordinates: MarketCoordinates;
  operatingHours: OperatingHours;
  fulfillment: ShopFulfillmentSettings;
  financials: ShopFinancialSettings;
  isOpen?: boolean;
  isOpenNow?: boolean;
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

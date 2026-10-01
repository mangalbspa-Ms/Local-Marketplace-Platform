/**
 * Market and Shop Management Service
 */

import { LocalMarket, Shop } from '../../types/market.ts';
import { db } from '../storage/db.ts';
import { NotFoundError, ForbiddenError } from '../utils/errors.ts';

function isValueEmpty(val: any): boolean {
  if (val === undefined || val === null) return true;
  if (typeof val === 'string' && val.trim() === '') return true;
  if (typeof val === 'object') {
    if (Array.isArray(val)) return val.length === 0;
    return Object.values(val).every((v) => isValueEmpty(v));
  }
  return false;
}

function areFieldValuesEquivalent(field: string, newVal: any, shop: Shop): boolean {
  if (newVal === undefined) return true;

  let currentVal = (shop as any)[field];

  // Check aliases and fallback properties
  if (field === 'description' && currentVal === undefined) {
    currentVal = shop.tagline;
  } else if (field === 'upiPayoutId' && currentVal === undefined) {
    currentVal = shop.financials?.payoutUpiId || (shop as any).upiId;
  } else if (field === 'paymentName' && currentVal === undefined) {
    currentVal = shop.name;
  } else if (field === 'whatsapp' && currentVal === undefined) {
    currentVal = shop.phone;
  } else if (field === 'bannerUrl' && currentVal === undefined) {
    currentVal = shop.bannerImageUrl;
  } else if (field === 'pincode' && currentVal === undefined && shop.postalData?.pincode) {
    currentVal = shop.postalData.pincode;
  }

  // Both empty/unset
  if (isValueEmpty(newVal) && isValueEmpty(currentVal)) {
    return true;
  }

  if (field === 'coordinates' && newVal) {
    if (!shop.coordinates) return isValueEmpty(newVal);
    const latDiff = Math.abs(Number(newVal.lat) - Number(shop.coordinates.lat));
    const lngDiff = Math.abs(Number(newVal.lng) - Number(shop.coordinates.lng));
    return latDiff < 0.0001 && lngDiff < 0.0001;
  }

  if (field === 'postalData') {
    if (isValueEmpty(newVal) && isValueEmpty(currentVal)) return true;
    if (newVal && typeof newVal === 'object') {
      const keys = ['state', 'district', 'tehsil', 'postOffice', 'locality'];
      const hasRealChange = keys.some((k) => {
        const subNew = newVal[k];
        const subCur = currentVal ? currentVal[k] : undefined;
        if (isValueEmpty(subNew) && isValueEmpty(subCur)) return false;
        return String(subNew || '').trim().toLowerCase() !== String(subCur || '').trim().toLowerCase();
      });
      return !hasRealChange;
    }
  }

  if (typeof newVal === 'string' && typeof currentVal === 'string') {
    return newVal.trim().toLowerCase() === currentVal.trim().toLowerCase();
  }

  return JSON.stringify(newVal) === JSON.stringify(currentVal);
}

export class MarketService {
  public static getAllMarkets(): LocalMarket[] {
    return db.getMarkets();
  }

  public static getMarketById(marketId: string): LocalMarket {
    const market = db.getMarketById(marketId);
    if (!market) {
      throw new NotFoundError('Market', marketId);
    }
    return market;
  }

  public static getShopsInMarket(marketId?: string): Shop[] {
    return db.getShops(marketId);
  }

  public static getShopById(shopId: string): Shop {
    const shop = db.getShopById(shopId);
    if (!shop) {
      throw new NotFoundError('Shop', shopId);
    }
    return shop;
  }

  public static updateShopOperationalStatus(
    shopId: string,
    sellerId: string,
    updates: Partial<Shop> & { profileUpdates?: Partial<Shop>; isOpen?: boolean },
    isAdmin: boolean = false
  ): Shop {
    const shop = this.getShopById(shopId);

    // Ensure only owning seller or admin can update
    if (!isAdmin && shop.sellerId !== sellerId) {
      throw new ForbiddenError('You can only update operational settings for your own shop.');
    }

    const effectiveUpdates = updates.profileUpdates ? { ...updates, ...updates.profileUpdates } : updates;

    // Backend Verification Lock Enforcement (PART 4 & PART 6)
    // If shop is VERIFIED and caller is not an admin, locked identity/location fields cannot be directly modified
    if (shop.verificationStatus === 'VERIFIED' && !isAdmin) {
      const lockedFields = [
        'name',
        'category',
        'description',
        'phone',
        'email',
        'whatsapp',
        'address',
        'pincode',
        'postalData',
        'coordinates',
        'upiPayoutId',
        'paymentName',
      ];

      const attemptedLockedFields = lockedFields.filter((field) => {
        const val = (effectiveUpdates as any)[field];
        if (val === undefined) return false;
        return !areFieldValuesEquivalent(field, val, shop);
      });

      if (attemptedLockedFields.length > 0) {
        throw new ForbiddenError(
          `यह दुकान Admin द्वारा सत्यापित (Verified) है। सुरक्षित फ़ील्ड (${attemptedLockedFields.join(', ')}) सीधे नहीं बदले जा सकते। विवरण बदलने के लिए कृपया "बदलाव का अनुरोध" (Change Request) सबमिट करें।`
        );
      }
    }

    if (updates.isOpenNow !== undefined) {
      shop.isOpenNow = updates.isOpenNow;
    }
    if (updates.isOpen !== undefined) {
      shop.isOpen = updates.isOpen;
      shop.isOpenNow = updates.isOpen;
    }
    if (updates.closedReason !== undefined) {
      shop.closedReason = updates.closedReason;
    }
    if (updates.isAcceptingOrders !== undefined) {
      shop.isAcceptingOrders = updates.isAcceptingOrders;
    }

    if (effectiveUpdates.name) shop.name = effectiveUpdates.name;
    if (effectiveUpdates.description !== undefined) shop.description = effectiveUpdates.description;
    if (effectiveUpdates.category) shop.category = effectiveUpdates.category;
    if (effectiveUpdates.phone) shop.phone = effectiveUpdates.phone;
    if (effectiveUpdates.email !== undefined) shop.email = effectiveUpdates.email;
    if (effectiveUpdates.address !== undefined) shop.address = effectiveUpdates.address;
    if (effectiveUpdates.photoUrl !== undefined) shop.photoUrl = effectiveUpdates.photoUrl;
    if (effectiveUpdates.profilePhotoUrl !== undefined) shop.profilePhotoUrl = effectiveUpdates.profilePhotoUrl;
    if (effectiveUpdates.coverPhotoUrl !== undefined) shop.coverPhotoUrl = effectiveUpdates.coverPhotoUrl;
    if ((effectiveUpdates as any).coverPhotos !== undefined) (shop as any).coverPhotos = (effectiveUpdates as any).coverPhotos;
    if (effectiveUpdates.bannerUrl !== undefined) shop.bannerUrl = effectiveUpdates.bannerUrl;
    if (effectiveUpdates.bannerImageUrl !== undefined) shop.bannerImageUrl = effectiveUpdates.bannerImageUrl;
    if (effectiveUpdates.coordinates !== undefined) shop.coordinates = effectiveUpdates.coordinates;
    if ((effectiveUpdates as any).locationAccuracy !== undefined) (shop as any).locationAccuracy = (effectiveUpdates as any).locationAccuracy;
    if ((effectiveUpdates as any).locationSource !== undefined) (shop as any).locationSource = (effectiveUpdates as any).locationSource;
    if ((effectiveUpdates as any).pincode !== undefined) (shop as any).pincode = (effectiveUpdates as any).pincode;
    if ((effectiveUpdates as any).postalData !== undefined) (shop as any).postalData = (effectiveUpdates as any).postalData;
    if ((effectiveUpdates as any).whatsapp !== undefined) (shop as any).whatsapp = (effectiveUpdates as any).whatsapp;
    if ((effectiveUpdates as any).upiPayoutId !== undefined) {
      shop.upiPayoutId = (effectiveUpdates as any).upiPayoutId;
      if (!shop.financials) shop.financials = {};
      shop.financials.payoutUpiId = (effectiveUpdates as any).upiPayoutId;
    }
    if ((effectiveUpdates as any).paymentName !== undefined) (shop as any).paymentName = (effectiveUpdates as any).paymentName;
    if ((effectiveUpdates as any).upiQrUrl !== undefined) (shop as any).upiQrUrl = (effectiveUpdates as any).upiQrUrl;

    if (effectiveUpdates.operatingHours) {
      shop.operatingHours = { ...shop.operatingHours, ...effectiveUpdates.operatingHours };
    }

    if (effectiveUpdates.fulfillment) {
      // If seller tries to update fulfillment but sellerCanManageFulfillment is false, deny
      if (!isAdmin && shop.fulfillment?.sellerCanManageFulfillment === false) {
        throw new ForbiddenError('Fulfillment controls for this shop are locked and managed by platform administrator.');
      }

      shop.fulfillment = {
        pickupEnabled: true,
        deliveryEnabled: true,
        minOrderValueForDelivery: 0,
        deliveryFee: 25,
        freeDeliveryThreshold: 499,
        maxDeliveryRadiusKm: 5.0,
        estimatedPreparationTimeMinutes: 20,
        sellerCanManageFulfillment: true,
        ...shop.fulfillment,
        ...effectiveUpdates.fulfillment,
      };
    }

    if (effectiveUpdates.financials?.payoutUpiId) {
      shop.financials.payoutUpiId = effectiveUpdates.financials.payoutUpiId;
    }
    if (effectiveUpdates.financials?.gstNumber !== undefined) {
      shop.financials.gstNumber = effectiveUpdates.financials.gstNumber;
    }

    return db.saveShop(shop);
  }
}

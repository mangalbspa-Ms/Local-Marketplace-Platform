/**
 * Market and Shop Management Service
 */

import { LocalMarket, Shop } from '../../types/market.ts';
import { db } from '../storage/db.ts';
import { NotFoundError, ForbiddenError } from '../utils/errors.ts';

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

    const effectiveUpdates = updates.profileUpdates ? { ...updates, ...updates.profileUpdates } : updates;

    if (effectiveUpdates.name) shop.name = effectiveUpdates.name;
    if (effectiveUpdates.description !== undefined) shop.description = effectiveUpdates.description;
    if (effectiveUpdates.category) shop.category = effectiveUpdates.category;
    if (effectiveUpdates.phone) shop.phone = effectiveUpdates.phone;
    if (effectiveUpdates.email !== undefined) shop.email = effectiveUpdates.email;
    if (effectiveUpdates.address !== undefined) shop.address = effectiveUpdates.address;
    if (effectiveUpdates.photoUrl !== undefined) shop.photoUrl = effectiveUpdates.photoUrl;
    if (effectiveUpdates.bannerUrl !== undefined) shop.bannerUrl = effectiveUpdates.bannerUrl;
    if (effectiveUpdates.bannerImageUrl !== undefined) shop.bannerImageUrl = effectiveUpdates.bannerImageUrl;

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

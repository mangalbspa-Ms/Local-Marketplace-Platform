/**
 * Centralized Pricing Engine & Order Calculation Service
 * 
 * Centralized and consistent calculation logic across Customer and Seller portals.
 * Ensures strict unit calculations, fractional portion conversions, fee handling,
 * and order total evaluations.
 */

import { BaseUnit, ProductUnitType, Product } from '../types/product.ts';
import { Order, OrderFinancialBreakdown, OrderItem, FulfillmentType } from '../types/order.ts';
import { PricingEngine as CorePricingEngine, CalculatedItemPrice } from '../core/pricingEngine.ts';

export interface CalculateOrderTotalOptions {
  deliveryFee?: number;
  platformFee?: number;
  discount?: number;
  tax?: number;
  taxRatePercentage?: number;
  commissionPercentage?: number;
  commissionOnDeliveryFee?: boolean;
  commissionOnPlatformFee?: boolean;
  filterUnavailableItems?: boolean; // defaults to true: exclude items marked unavailable
  items?: OrderItem[];
}

/**
 * Calculates the total payable amount for an order.
 * Works seamlessly with:
 * - Order objects
 * - Partial Order objects
 * - Arrays of OrderItem
 * 
 * Automatically applies active item availability filtering,
 * delivery fee handling (Store Pickup = ₹0), platform fee, discount, and tax.
 *
 * @param orderOrItems Order, Partial<Order>, or OrderItem[]
 * @param options Calculation options and fee overrides
 * @returns Rounded total amount payable (to 2 decimal places)
 */
export function calculateOrderTotal(
  orderOrItems?: Order | Partial<Order> | OrderItem[] | null,
  options?: CalculateOrderTotalOptions
): number {
  if (!orderOrItems) {
    return 0;
  }

  // 1. Resolve raw items list and parent order reference
  let rawItems: OrderItem[] = [];
  let isOrderObject = false;
  let orderRef: Partial<Order> | undefined;

  if (Array.isArray(orderOrItems)) {
    rawItems = orderOrItems;
  } else if (typeof orderOrItems === 'object') {
    isOrderObject = true;
    orderRef = orderOrItems;
    rawItems = options?.items ?? orderOrItems.items ?? [];
  }

  // 2. Filter available items if enabled (defaults to true)
  const shouldFilterUnavailable = options?.filterUnavailableItems !== false;
  const activeItems = shouldFilterUnavailable
    ? rawItems.filter((item) => item && item.isAvailable !== false)
    : rawItems;

  const hasActiveItems = activeItems.length > 0;

  // 3. Calculate item subtotal
  let calculatedSubtotal = 0;
  if (hasActiveItems) {
    calculatedSubtotal = activeItems.reduce((sum, item) => {
      if (!item) return sum;
      if (typeof item.lineItemTotal === 'number' && !isNaN(item.lineItemTotal)) {
        return sum + item.lineItemTotal;
      }
      const unitPrice = Number(item.unitItemPriceCalculated) || Number(item.basePriceAtOrderTime) || 0;
      const count = Math.max(1, Number(item.quantityCount) || 1);
      const mult = Number(item.orderedQuantityMultiplier) || 1;
      return sum + (unitPrice * count * (item.unitItemPriceCalculated ? 1 : mult));
    }, 0);
  } else if (isOrderObject && orderRef?.financials?.itemSubtotal !== undefined) {
    calculatedSubtotal = Number(orderRef.financials.itemSubtotal) || 0;
  }

  const roundedSubtotal = Math.round(calculatedSubtotal * 100) / 100;

  // 4. Resolve delivery fee
  let deliveryFee = 0;
  if (options?.deliveryFee !== undefined) {
    deliveryFee = Math.max(0, Number(options.deliveryFee) || 0);
  } else if (isOrderObject && orderRef) {
    if (orderRef.fulfillmentType === FulfillmentType.STORE_PICKUP) {
      deliveryFee = 0;
    } else if (orderRef.financials?.deliveryFee !== undefined) {
      deliveryFee = Math.max(0, Number(orderRef.financials.deliveryFee) || 0);
    }
  }

  // 5. Resolve platform fee
  let platformFee = 0;
  if (options?.platformFee !== undefined) {
    platformFee = Math.max(0, Number(options.platformFee) || 0);
  } else if (isOrderObject && orderRef?.financials?.platformFee !== undefined) {
    platformFee = Math.max(0, Number(orderRef.financials.platformFee) || 0);
  } else if (hasActiveItems || (isOrderObject && orderRef?.financials)) {
    platformFee = 2.0;
  }

  // 6. Resolve discount
  let discount = 0;
  if (options?.discount !== undefined) {
    discount = Math.max(0, Number(options.discount) || 0);
  } else if (isOrderObject && orderRef?.financials?.discount !== undefined) {
    discount = Math.max(0, Number(orderRef.financials.discount) || 0);
  }
  discount = Math.min(discount, roundedSubtotal);

  // 7. Resolve taxes
  let tax = 0;
  if (options?.tax !== undefined) {
    tax = Math.max(0, Number(options.tax) || 0);
  } else if (isOrderObject && orderRef?.financials?.tax !== undefined) {
    tax = Math.max(0, Number(orderRef.financials.tax) || 0);
  } else if (options?.taxRatePercentage) {
    const rate = Math.max(0, Number(options.taxRatePercentage) || 0);
    tax = Math.round((Math.max(0, roundedSubtotal - discount) * (rate / 100)) * 100) / 100;
  }

  // 8. Base merchandise after discount
  const merchandiseBase = Math.max(0, roundedSubtotal - discount);

  // 9. Fast path if original order financials exist, no items were filtered out, and no options were passed
  if (
    isOrderObject &&
    orderRef?.financials?.customerTotal !== undefined &&
    !options &&
    rawItems.length === activeItems.length &&
    rawItems.length > 0
  ) {
    return orderRef.financials.customerTotal;
  }

  // If there are no items and no financials, return 0
  if (!hasActiveItems && (!isOrderObject || !orderRef?.financials)) {
    return 0;
  }

  const finalTotal = Math.round((merchandiseBase + deliveryFee + platformFee + tax) * 100) / 100;
  return Math.max(0, finalTotal);
}

/**
 * Computes complete financial breakdown for an order.
 */
export function calculateOrderFinancials(
  orderOrItems?: Order | Partial<Order> | OrderItem[] | null,
  options?: CalculateOrderTotalOptions
): OrderFinancialBreakdown {
  if (!orderOrItems) {
    return {
      itemSubtotal: 0,
      discount: 0,
      deliveryFee: 0,
      platformFee: 0,
      tax: 0,
      customerTotal: 0,
      commissionBase: 0,
      commissionPercentage: options?.commissionPercentage ?? 5,
      commissionAmount: 0,
      sellerNetAmount: 0,
    };
  }

  let rawItems: OrderItem[] = [];
  let isOrderObject = false;
  let orderRef: Partial<Order> | undefined;

  if (Array.isArray(orderOrItems)) {
    rawItems = orderOrItems;
  } else if (typeof orderOrItems === 'object') {
    isOrderObject = true;
    orderRef = orderOrItems;
    rawItems = options?.items ?? orderOrItems.items ?? [];
  }

  const shouldFilterUnavailable = options?.filterUnavailableItems !== false;
  const activeItems = shouldFilterUnavailable
    ? rawItems.filter((item) => item && item.isAvailable !== false)
    : rawItems;

  const itemSubtotal = Math.round(
    activeItems.reduce((sum, item) => {
      if (!item) return sum;
      if (typeof item.lineItemTotal === 'number' && !isNaN(item.lineItemTotal)) {
        return sum + item.lineItemTotal;
      }
      const unitPrice = Number(item.unitItemPriceCalculated) || Number(item.basePriceAtOrderTime) || 0;
      const count = Math.max(1, Number(item.quantityCount) || 1);
      const mult = Number(item.orderedQuantityMultiplier) || 1;
      return sum + (unitPrice * count * (item.unitItemPriceCalculated ? 1 : mult));
    }, 0) * 100
  ) / 100;

  let deliveryFee = 0;
  if (options?.deliveryFee !== undefined) {
    deliveryFee = Math.max(0, Number(options.deliveryFee) || 0);
  } else if (isOrderObject && orderRef) {
    if (orderRef.fulfillmentType === FulfillmentType.STORE_PICKUP) {
      deliveryFee = 0;
    } else if (orderRef.financials?.deliveryFee !== undefined) {
      deliveryFee = Math.max(0, Number(orderRef.financials.deliveryFee) || 0);
    }
  }

  let platformFee = 0;
  if (options?.platformFee !== undefined) {
    platformFee = Math.max(0, Number(options.platformFee) || 0);
  } else if (isOrderObject && orderRef?.financials?.platformFee !== undefined) {
    platformFee = Math.max(0, Number(orderRef.financials.platformFee) || 0);
  } else if (activeItems.length > 0 || (isOrderObject && orderRef?.financials)) {
    platformFee = 2.0;
  }

  let discount = 0;
  if (options?.discount !== undefined) {
    discount = Math.max(0, Number(options.discount) || 0);
  } else if (isOrderObject && orderRef?.financials?.discount !== undefined) {
    discount = Math.max(0, Number(orderRef.financials.discount) || 0);
  }
  discount = Math.min(discount, itemSubtotal);

  const merchandiseBase = Math.max(0, itemSubtotal - discount);

  let tax = 0;
  if (options?.tax !== undefined) {
    tax = Math.max(0, Number(options.tax) || 0);
  } else if (isOrderObject && orderRef?.financials?.tax !== undefined) {
    tax = Math.max(0, Number(orderRef.financials.tax) || 0);
  } else if (options?.taxRatePercentage) {
    const rate = Math.max(0, Number(options.taxRatePercentage) || 0);
    tax = Math.round((merchandiseBase * (rate / 100)) * 100) / 100;
  }

  const customerTotal = Math.round((merchandiseBase + deliveryFee + platformFee + tax) * 100) / 100;

  const commissionPercentage =
    options?.commissionPercentage ??
    (isOrderObject && orderRef?.financials?.commissionPercentage !== undefined
      ? orderRef.financials.commissionPercentage
      : 5);

  let commissionBase = merchandiseBase;
  if (options?.commissionOnDeliveryFee) {
    commissionBase += deliveryFee;
  }
  if (options?.commissionOnPlatformFee) {
    commissionBase += platformFee;
  }
  commissionBase = Math.round(commissionBase * 100) / 100;

  const commissionAmount = Math.round((commissionBase * (commissionPercentage / 100)) * 100) / 100;
  const sellerNetAmount = Math.round((merchandiseBase + deliveryFee - commissionAmount) * 100) / 100;

  return {
    itemSubtotal,
    discount,
    deliveryFee,
    platformFee,
    tax,
    customerTotal,
    commissionBase,
    commissionPercentage,
    commissionAmount,
    sellerNetAmount,
  };
}

export const calculateOrderBreakdown = calculateOrderFinancials;

// Extended PricingEngine with calculateOrderTotal
export class PricingEngine extends CorePricingEngine {
  public static calculateOrderTotal(
    orderOrItems?: Order | Partial<Order> | OrderItem[] | null,
    options?: CalculateOrderTotalOptions
  ): number {
    return calculateOrderTotal(orderOrItems, options);
  }

  public static calculateOrderFinancials(
    itemsOrOrder: any,
    options?: any
  ): OrderFinancialBreakdown {
    if (Array.isArray(itemsOrOrder) && options && 'deliveryFee' in options && 'commissionPercentage' in options) {
      return CorePricingEngine.calculateOrderFinancials(itemsOrOrder, options);
    }
    return calculateOrderFinancials(itemsOrOrder, options);
  }
}

export * from '../core/pricingEngine.ts';

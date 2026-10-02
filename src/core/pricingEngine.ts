/**
 * Core Pricing & Unit Conversion Engine
 * 
 * Strict fractional pricing calculations.
 * Never trust client prices: always compute and validate server-side from base price.
 */

import { BaseUnit, ProductUnitType, Product } from '../types/product.ts';
import { OrderFinancialBreakdown, OrderItem } from '../types/order.ts';

export interface CalculatedItemPrice {
  basePrice: number;
  baseUnit: BaseUnit;
  quantityMultiplier: number;
  quantityInBaseUnits: number;
  unitPrice: number;
  lineTotal: number;
  formattedDisplay: string;
}

export class PricingEngine {
  /**
   * Convert any given quantity and unit to multiplier against the base unit.
   * e.g., 250 grams against 'kg' => 0.25
   * e.g., 500 ml against 'L' => 0.5
   * e.g., 1 dozen against 'piece' => 12
   */
  public static normalizeMultiplier(
    unitType: ProductUnitType,
    baseUnit: BaseUnit,
    requestedQuantity: number,
    requestedUnit: string
  ): { multiplier: number; quantityInBaseUnits: number; displayLabel: string } {
    const cleanUnit = (requestedUnit || '').toLowerCase().trim();

    if (unitType === ProductUnitType.WEIGHT) {
      if (cleanUnit === 'g' || cleanUnit === 'gram' || cleanUnit === 'grams') {
        const multiplier = requestedQuantity / 1000;
        return {
          multiplier,
          quantityInBaseUnits: multiplier,
          displayLabel: `${requestedQuantity} grams`,
        };
      }
      if (cleanUnit === 'kg' || cleanUnit === 'kilogram' || cleanUnit === 'kilograms') {
        return {
          multiplier: requestedQuantity,
          quantityInBaseUnits: requestedQuantity,
          displayLabel: `${requestedQuantity} kg`,
        };
      }
    }

    if (unitType === ProductUnitType.VOLUME) {
      if (cleanUnit === 'ml' || cleanUnit === 'milliliter' || cleanUnit === 'milliliters') {
        const multiplier = requestedQuantity / 1000;
        return {
          multiplier,
          quantityInBaseUnits: multiplier,
          displayLabel: `${requestedQuantity} ml`,
        };
      }
      if (cleanUnit === 'l' || cleanUnit === 'liter' || cleanUnit === 'liters' || cleanUnit === 'litre' || cleanUnit === 'litres') {
        return {
          multiplier: requestedQuantity,
          quantityInBaseUnits: requestedQuantity,
          displayLabel: `${requestedQuantity} L`,
        };
      }
    }

    if (unitType === ProductUnitType.PIECE) {
      if (cleanUnit === 'dozen') {
        return {
          multiplier: requestedQuantity * 12,
          quantityInBaseUnits: requestedQuantity * 12,
          displayLabel: `${requestedQuantity} dozen (${requestedQuantity * 12} pcs)`,
        };
      }
      return {
        multiplier: requestedQuantity,
        quantityInBaseUnits: requestedQuantity,
        displayLabel: `${requestedQuantity} ${baseUnit}${requestedQuantity > 1 ? 's' : ''}`,
      };
    }

    // Default 1:1 fallback with safety
    return {
      multiplier: requestedQuantity,
      quantityInBaseUnits: requestedQuantity,
      displayLabel: `${requestedQuantity} ${cleanUnit}`,
    };
  }

  /**
   * Calculates portion quantity and multiplier when a customer specifies a rupee budget
   * Example 1: Customer wants ₹50 worth of Sugar (at ₹100/kg) => 0.5 kg (500g)
   * Example 2: Customer wants ₹100 worth of Cashews (at ₹900/kg) => 111.11g
   */
  public static calculateQuantityFromAmount(
    product: Product,
    amountInRupees: number
  ): {
    multiplier: number;
    quantityInBaseUnits: number;
    exactPrice: number;
    displayQuantity: string;
    displayLabel: string;
  } {
    const basePrice = product.fractionalConfig.basePrice;
    if (!basePrice || basePrice <= 0 || amountInRupees <= 0) {
      return {
        multiplier: 1.0,
        quantityInBaseUnits: 1.0,
        exactPrice: basePrice,
        displayQuantity: `1 ${product.fractionalConfig.baseUnit}`,
        displayLabel: `1 ${product.fractionalConfig.baseUnit} (₹${basePrice})`,
      };
    }

    // Precise multiplier = amount / basePrice
    const rawMultiplier = amountInRupees / basePrice;
    const multiplier = Math.round(rawMultiplier * 10000) / 10000;
    const exactPrice = Math.round(multiplier * basePrice * 100) / 100;

    let displayQuantity = '';
    const unitType = product.fractionalConfig.unitType;
    const baseUnit = product.fractionalConfig.baseUnit;

    if (unitType === ProductUnitType.WEIGHT) {
      if (baseUnit === 'kg') {
        const grams = Math.round(rawMultiplier * 1000 * 100) / 100;
        if (grams < 1000) {
          displayQuantity = grams % 1 === 0 ? `${grams} g` : `${grams.toFixed(2)} g`;
        } else {
          const kgs = Math.round((grams / 1000) * 100) / 100;
          displayQuantity = kgs % 1 === 0 ? `${kgs} kg` : `${kgs.toFixed(2)} kg`;
        }
      } else {
        displayQuantity = `${multiplier} ${baseUnit}`;
      }
    } else if (unitType === ProductUnitType.VOLUME) {
      if (baseUnit === 'L') {
        const ml = Math.round(rawMultiplier * 1000 * 100) / 100;
        if (ml < 1000) {
          displayQuantity = ml % 1 === 0 ? `${ml} ml` : `${ml.toFixed(2)} ml`;
        } else {
          const ltrs = Math.round((ml / 1000) * 100) / 100;
          displayQuantity = ltrs % 1 === 0 ? `${ltrs} L` : `${ltrs.toFixed(2)} L`;
        }
      } else {
        displayQuantity = `${multiplier} ${baseUnit}`;
      }
    } else {
      displayQuantity = `${multiplier} ${baseUnit}`;
    }

    return {
      multiplier,
      quantityInBaseUnits: multiplier,
      exactPrice,
      displayQuantity,
      displayLabel: `${displayQuantity} • ₹${exactPrice}`,
    };
  }

  /**
   * Normalizes a product price into a standard reference unit rate for fair market comparison
   * e.g. Normalized to ₹/kg for weight, ₹/L for volume, ₹/piece for piece items.
   */
  public static normalizeStandardRate(product: Product): {
    standardPrice: number;
    standardUnit: string;
  } {
    const basePrice = product.fractionalConfig?.basePrice ?? product.basePricePerUnit;
    const baseUnit = product.fractionalConfig?.baseUnit ?? product.baseUnit;

    if (baseUnit === 'g' || baseUnit === 'gram') {
      return { standardPrice: Math.round(basePrice * 1000 * 100) / 100, standardUnit: 'kg' };
    }
    if (baseUnit === 'ml') {
      return { standardPrice: Math.round(basePrice * 1000 * 100) / 100, standardUnit: 'L' };
    }
    if (baseUnit === 'L' || baseUnit === 'litre') {
      return { standardPrice: basePrice, standardUnit: 'L' };
    }
    if (baseUnit === 'dozen') {
      return { standardPrice: Math.round((basePrice / 12) * 100) / 100, standardUnit: 'piece' };
    }

    return { standardPrice: basePrice, standardUnit: baseUnit };
  }

  /**
   * Calculates the exact line item price for a product using its stored base price.
   */
  public static calculateItemPrice(
    product: Product,
    multiplier: number,
    count: number = 1,
    customDisplay?: string
  ): CalculatedItemPrice {
    const basePrice = product.fractionalConfig.basePrice;
    // Round to 2 decimal places to avoid floating point math errors
    const unitPrice = Math.round(basePrice * multiplier * 100) / 100;
    const lineTotal = Math.round(unitPrice * count * 100) / 100;

    return {
      basePrice,
      baseUnit: product.fractionalConfig.baseUnit,
      quantityMultiplier: multiplier,
      quantityInBaseUnits: multiplier * count,
      unitPrice,
      lineTotal,
      formattedDisplay: customDisplay || `${multiplier} ${product.fractionalConfig.baseUnit}`,
    };
  }

  /**
   * Computes the complete, strictly separated financial breakdown for an order.
   */
  public static calculateOrderFinancials(
    items: OrderItem[],
    options: {
      deliveryFee: number;
      platformFee?: number;
      discount?: number;
      taxRatePercentage?: number;
      commissionPercentage: number;
      commissionOnDeliveryFee?: boolean;
      commissionOnPlatformFee?: boolean;
    }
  ): OrderFinancialBreakdown {
    const itemSubtotal = items.reduce((sum, item) => sum + item.lineItemTotal, 0);
    const roundedSubtotal = Math.round(itemSubtotal * 100) / 100;

    const discount = Math.min(options.discount || 0, roundedSubtotal);
    const deliveryFee = Math.max(0, options.deliveryFee);
    const platformFee = Math.max(0, options.platformFee ?? 2.0);

    const merchandiseBase = Math.max(0, roundedSubtotal - discount);
    
    // Commission base is merchandise subtotal minus discount.
    // Delivery fee or platform fee are ONLY included if explicitly configured.
    let commissionEligibleBase = merchandiseBase;
    if (options.commissionOnDeliveryFee) {
      commissionEligibleBase += deliveryFee;
    }
    if (options.commissionOnPlatformFee) {
      commissionEligibleBase += platformFee;
    }
    commissionEligibleBase = Math.round(commissionEligibleBase * 100) / 100;

    const commissionPercentage = options.commissionPercentage;
    const commissionAmount = Math.round((commissionEligibleBase * (commissionPercentage / 100)) * 100) / 100;

    const taxRate = options.taxRatePercentage || 0;
    const tax = Math.round((merchandiseBase * (taxRate / 100)) * 100) / 100;

    const customerTotal = Math.round((merchandiseBase + deliveryFee + platformFee + tax) * 100) / 100;

    // Seller Net Earnings: (merchandise revenue + delivery fee - platform commission)
    const sellerNetAmount = Math.round((merchandiseBase + deliveryFee - commissionAmount) * 100) / 100;

    return {
      itemSubtotal: roundedSubtotal,
      discount: Math.round(discount * 100) / 100,
      deliveryFee: Math.round(deliveryFee * 100) / 100,
      platformFee: Math.round(platformFee * 100) / 100,
      tax,
      customerTotal,
      commissionBase: commissionEligibleBase,
      commissionPercentage,
      commissionAmount,
      sellerNetAmount,
    };
  }
}

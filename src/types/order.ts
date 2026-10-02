/**
 * Order, Fulfillment, and Strict State Machine Types
 */

import { BaseUnit, ProductUnitType } from './product.ts';
import { UserAddress } from './auth.ts';

export enum FulfillmentType {
  STORE_PICKUP = 'STORE_PICKUP',
  HOME_DELIVERY = 'HOME_DELIVERY',
}

export enum OrderStatus {
  PAYMENT_PENDING = 'PAYMENT_PENDING',
  CONFIRMED = 'CONFIRMED',
  ACCEPTED = 'ACCEPTED',
  PREPARING = 'PREPARING',
  READY_FOR_PICKUP = 'READY_FOR_PICKUP',
  OUT_FOR_DELIVERY = 'OUT_FOR_DELIVERY',
  ARRIVED = 'ARRIVED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  REFUND_PENDING = 'REFUND_PENDING',
  REFUNDED = 'REFUNDED',
  PAYMENT_FAILED = 'PAYMENT_FAILED',
}

export interface OrderItem {
  productId: string;
  productName: string;
  productImage?: string;
  unitType: ProductUnitType;
  baseUnit: BaseUnit;
  basePriceAtOrderTime: number;         // e.g. ₹100/kg
  orderedQuantityMultiplier: number;    // e.g. 0.25 (for 250 grams)
  orderedQuantityDisplay: string;       // e.g. "250 grams"
  quantityInBaseUnits: number;          // e.g. 0.25 kg to deduct from stock
  unitItemPriceCalculated: number;      // e.g. ₹25.00
  quantityCount: number;                // Multiplier count (e.g. 1 unit of 250g = 1, 2 packs of 250g = 2)
  lineItemTotal: number;                // e.g. ₹25.00
  notes?: string;
  isAvailable?: boolean;                // Item availability check by seller (defaults to true)
  isPacked?: boolean;                   // Item packed status in checklist
  unavailableReason?: string;           // Out of stock or damaged reason
}

export interface OrderFinancialBreakdown {
  itemSubtotal: number;                 // Sum of line items (e.g. ₹25.00)
  discount: number;                     // Applied coupon/promotional discount
  deliveryFee: number;                  // Delivery fee (₹0 if Store Pickup)
  platformFee: number;                  // Fixed or tiered platform convenience fee
  tax: number;                          // GST or local sales tax
  customerTotal: number;                // Final payable by customer: (itemSubtotal - discount + deliveryFee + platformFee + tax)
  commissionBase: number;               // Value eligible for platform commission (typically itemSubtotal - discount)
  commissionPercentage: number;         // e.g. 5.0%
  commissionAmount: number;             // e.g. ₹1.25
  sellerNetAmount: number;              // Amount due to seller: (itemSubtotal - discount + deliveryFee (if fulfilled by seller) - commissionAmount)
}

export interface OrderStatusHistoryEntry {
  status: OrderStatus;
  timestamp: string;
  updatedByUserId: string;
  note?: string;
}

export interface Order {
  id: string;
  orderNumber: string;                  // Human friendly: e.g. "ORD-2026-0042"
  customerId: string;
  customerName: string;
  customerPhone: string;
  customerAvatar?: string;              // Customer profile image URL if uploaded
  shopId: string;
  shopName: string;
  shopPhone: string;
  sellerId: string;
  marketId: string;
  fulfillmentType: FulfillmentType;
  pickupCode?: string;                  // 4-digit code for Store Pickup verification
  deliveryAddress?: UserAddress;
  deliveryPartnerId?: string;           // If assigned to a delivery person
  items: OrderItem[];
  financials: OrderFinancialBreakdown;
  status: OrderStatus;
  paymentId?: string;
  paymentMethod?: string;
  isPaid: boolean;
  statusHistory: OrderStatusHistoryEntry[];
  customerNotes?: string;
  sellerNotes?: string;
  createdAt: string;
  updatedAt: string;
}

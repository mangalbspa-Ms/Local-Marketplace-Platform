/**
 * Voice Shopping Request & Seller Final Bill Types
 * 
 * Manages the raw customer voice order parsing, unpriced custom items,
 * draft shopping requests (कच्चा पर्चा), seller bill finalization,
 * customer approval & payment transition into confirmed Orders.
 */

import { FulfillmentType, OrderItem } from './order.ts';
import { UserAddress } from './auth.ts';

export enum ShoppingRequestStatus {
  PENDING_SELLER_REVIEW = 'PENDING_SELLER_REVIEW', // Customer submitted voice list / shopping request
  BILL_FINALIZED = 'BILL_FINALIZED',               // Seller set prices & sent bill to customer
  PAYMENT_COMPLETED = 'PAYMENT_COMPLETED',         // Customer approved & paid, converted to Order
  REJECTED = 'REJECTED',                           // Seller cannot fulfill
  CANCELLED = 'CANCELLED',                         // Customer cancelled request
}

export interface RequestedVoiceItem {
  id: string;
  originalText: string;              // Customer's exact words (e.g. "छोटा वाला निरमा पाउडर", "छोटू बिस्किट 2 पैकेट")
  rawItemName: string;               // Normalized name (e.g. "निरमा पाउडर", "छोटू बिस्किट")
  requestedPortion?: string;         // e.g. "छोटा वाला", "250g", "2 पैकेट"
  matchedProductId?: string;         // If matched to catalog
  matchedProductName?: string;       // Catalog product name (e.g. "Nirma Detergent Powder Small")
  matchedProductImage?: string;      // Product photo URL
  unitPrice?: number;                // null/undefined if unknown, or shopkeeper set price
  isPriceEstimated?: boolean;        // true if unknown price initially
  quantityCount: number;             // e.g. 2
  quantityMultiplier: number;        // e.g. 0.25 (for 250g) or 1.0
  unitDisplay: string;               // e.g. "250g", "2 packets", "1 kg"
  baseUnit: string;                  // "kg", "packet", "piece", "L", etc.
  lineTotal?: number;                // (unitPrice * quantityCount) if priced
  isAvailable: boolean;              // defaults to true
  sellerNote?: string;               // Optional note from seller
}

export interface FinalBillBreakdown {
  itemSubtotal: number;
  deliveryFee: number;
  platformFee: number;
  customerTotal: number;
  items: OrderItem[];
  finalizedAt: string;
  sellerNotes?: string;
  expiresAt?: string;
}

export interface ShoppingRequest {
  id: string;
  requestNumber: string;             // e.g. "REQ-2026-0012"
  customerId: string;
  customerName: string;
  customerPhone: string;
  customerAvatar?: string;
  shopId: string;
  shopName: string;
  shopPhone?: string;
  sellerId?: string;
  rawVoiceTranscript: string;        // Exact transcribed speech
  items: RequestedVoiceItem[];
  fulfillmentType: FulfillmentType;
  deliveryAddress?: UserAddress;
  customerNotes?: string;
  sellerNotes?: string;
  status: ShoppingRequestStatus;
  
  // Final bill fields populated by seller
  finalBill?: FinalBillBreakdown;

  // Associated order once paid
  convertedOrderId?: string;

  createdAt: string;
  updatedAt: string;
}

export interface CreateShoppingRequestDTO {
  shopId: string;
  rawVoiceTranscript: string;
  fulfillmentType: FulfillmentType;
  deliveryAddressId?: string;
  customerNotes?: string;
  items: Array<{
    originalText: string;
    rawItemName: string;
    requestedPortion?: string;
    matchedProductId?: string;
    matchedProductName?: string;
    matchedProductImage?: string;
    unitPrice?: number;
    isPriceEstimated?: boolean;
    quantityCount?: number;
    quantityMultiplier?: number;
    unitDisplay: string;
    baseUnit?: string;
    lineTotal?: number;
  }>;
}

export interface FinalizeBillDTO {
  deliveryFee?: number;
  sellerNotes?: string;
  items: Array<{
    id: string;
    productId?: string;
    productName: string;
    productImage?: string;
    unitPrice: number;
    quantityCount: number;
    quantityMultiplier: number;
    unitDisplay: string;
    baseUnit: string;
    isAvailable: boolean;
    sellerNote?: string;
  }>;
}

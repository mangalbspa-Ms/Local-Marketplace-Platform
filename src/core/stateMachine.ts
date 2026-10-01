/**
 * Strict Order State Machine
 * 
 * Enforces valid state transitions across the order lifecycle.
 */

import { OrderStatus, FulfillmentType } from '../types/order.ts';

export const ALLOWED_STATUS_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  [OrderStatus.PAYMENT_PENDING]: [
    OrderStatus.CONFIRMED,       // When payment verification succeeds
    OrderStatus.PAYMENT_FAILED,  // When payment verification fails or expires
    OrderStatus.CANCELLED,       // Customer drops or cancels checkout
  ],
  [OrderStatus.CONFIRMED]: [
    OrderStatus.ACCEPTED,        // Seller accepts order
    OrderStatus.PREPARING,       // Seller directly starts packing
    OrderStatus.CANCELLED,       // Seller rejects or out of stock
    OrderStatus.REFUND_PENDING,  // Cancelled after payment requires refund
  ],
  [OrderStatus.ACCEPTED]: [
    OrderStatus.PREPARING,        // Seller starts packing items
    OrderStatus.READY_FOR_PICKUP, // Seller completes packing for Store Pickup
    OrderStatus.OUT_FOR_DELIVERY, // Seller completes packing for Home Delivery
    OrderStatus.CANCELLED,        // Emergency shop issue
    OrderStatus.REFUND_PENDING,
  ],
  [OrderStatus.PREPARING]: [
    OrderStatus.READY_FOR_PICKUP, // For STORE_PICKUP
    OrderStatus.OUT_FOR_DELIVERY, // For HOME_DELIVERY
    OrderStatus.CANCELLED,
    OrderStatus.REFUND_PENDING,
  ],
  [OrderStatus.READY_FOR_PICKUP]: [
    OrderStatus.ARRIVED,          // Customer arrived at pickup counter
    OrderStatus.COMPLETED,        // Customer picked up & verified PIN
    OrderStatus.CANCELLED,        // No-show or expired
    OrderStatus.REFUND_PENDING,
  ],
  [OrderStatus.OUT_FOR_DELIVERY]: [
    OrderStatus.ARRIVED,          // Delivery partner arrived at doorstep
    OrderStatus.COMPLETED,        // Delivered successfully
    OrderStatus.CANCELLED,        // Delivery failed / customer unreachable
    OrderStatus.REFUND_PENDING,
  ],
  [OrderStatus.ARRIVED]: [
    OrderStatus.COMPLETED,        // Handover completed & verified
    OrderStatus.CANCELLED,
    OrderStatus.REFUND_PENDING,
  ],
  [OrderStatus.COMPLETED]: [],   // Terminal successful state
  [OrderStatus.PAYMENT_FAILED]: [
    OrderStatus.PAYMENT_PENDING, // Customer retries payment
    OrderStatus.CANCELLED,
  ],
  [OrderStatus.CANCELLED]: [
    OrderStatus.REFUND_PENDING,  // If already paid
  ],
  [OrderStatus.REFUND_PENDING]: [
    OrderStatus.REFUNDED,        // Gateway processes refund
  ],
  [OrderStatus.REFUNDED]: [],    // Terminal refunded state
};

export class OrderStateMachine {
  /**
   * Validate if a status transition is permitted
   */
  public static canTransition(
    currentStatus: OrderStatus,
    targetStatus: OrderStatus,
    fulfillmentType?: FulfillmentType
  ): { allowed: boolean; reason?: string } {
    if (currentStatus === targetStatus) {
      return { allowed: true };
    }

    const validTargets = ALLOWED_STATUS_TRANSITIONS[currentStatus] || [];
    if (!validTargets.includes(targetStatus)) {
      return {
        allowed: false,
        reason: `Invalid state transition: Cannot change order from ${currentStatus} to ${targetStatus}.`,
      };
    }

    // Special validation for fulfillment specific states
    if (fulfillmentType === FulfillmentType.STORE_PICKUP && targetStatus === OrderStatus.OUT_FOR_DELIVERY) {
      return {
        allowed: false,
        reason: `Store Pickup orders cannot transition to OUT_FOR_DELIVERY. Use READY_FOR_PICKUP instead.`,
      };
    }

    if (fulfillmentType === FulfillmentType.HOME_DELIVERY && targetStatus === OrderStatus.READY_FOR_PICKUP) {
      return {
        allowed: false,
        reason: `Home Delivery orders cannot transition to READY_FOR_PICKUP. Use OUT_FOR_DELIVERY instead.`,
      };
    }

    return { allowed: true };
  }
}

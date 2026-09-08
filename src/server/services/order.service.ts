/**
 * Order Lifecycle & Fulfillment Service
 * 
 * Implements:
 * - Strict server-side recalculation of fractional units (Rule C)
 * - Exact financial breakdown calculation (Rule G)
 * - Order State Machine Enforcement (Rule H)
 * - Server-controlled inventory verification (Rule I)
 * - Full audit logs (Rule J)
 */

import { Order, OrderItem, OrderStatus, FulfillmentType } from '../../types/order.ts';
import { User, UserRole } from '../../types/auth.ts';
import { db } from '../storage/db.ts';
import { PricingEngine } from '../../core/pricingEngine.ts';
import { OrderStateMachine } from '../../core/stateMachine.ts';
import { NotFoundError, ValidationError, InvalidStateTransitionError, ShopIsolationError, ForbiddenError } from '../utils/errors.ts';
import { AuditEventType } from '../../types/financial.ts';

export interface CreateOrderInput {
  shopId: string;
  fulfillmentType: FulfillmentType;
  items: Array<{
    productId: string;
    requestedMultiplier?: number;
    requestedQuantity?: number;
    requestedUnit?: string;
    quantityCount?: number;
    notes?: string;
  }>;
  deliveryAddressId?: string;
  customerNotes?: string;
}

export class OrderService {
  /**
   * Creates an order in PAYMENT_PENDING state with full server recalculation.
   */
  public static createOrder(customer: User, input: CreateOrderInput): Order {
    const shop = db.getShopById(input.shopId);
    if (!shop || !shop.isActive) {
      throw new NotFoundError('Shop', input.shopId);
    }

    if (!input.items || input.items.length === 0) {
      throw new ValidationError('Order must contain at least one item.');
    }

    // Process and strictly calculate every item server-side
    const validatedOrderItems: OrderItem[] = [];

    for (const itemInput of input.items) {
      const product = db.getProductById(itemInput.productId);
      if (!product) {
        throw new NotFoundError('Product', itemInput.productId);
      }

      // Ensure product strictly belongs to the shop
      if (product.shopId !== input.shopId) {
        throw new ValidationError(`Product '${product.name}' does not belong to shop '${shop.name}'. Mixed shop carts are forbidden.`);
      }

      if (!product.isAvailable) {
        throw new ValidationError(`Product '${product.name}' is currently unavailable.`);
      }

      // Determine fractional multiplier
      let multiplier = itemInput.requestedMultiplier;
      let displayLabel = '';

      if (multiplier === undefined && itemInput.requestedQuantity && itemInput.requestedUnit) {
        const normalized = PricingEngine.normalizeMultiplier(
          product.fractionalConfig.unitType,
          product.fractionalConfig.baseUnit,
          itemInput.requestedQuantity,
          itemInput.requestedUnit
        );
        multiplier = normalized.multiplier;
        displayLabel = normalized.displayLabel;
      } else if (multiplier !== undefined) {
        displayLabel = `${multiplier} ${product.fractionalConfig.baseUnit}`;
      } else {
        // Default to base unit
        multiplier = 1.0;
        displayLabel = `1 ${product.fractionalConfig.baseUnit}`;
      }

      const count = Math.max(1, itemInput.quantityCount || 1);
      const calculated = PricingEngine.calculateItemPrice(product, multiplier, count, displayLabel);

      // Verify stock availability
      if (product.currentStockInBaseUnits < calculated.quantityInBaseUnits) {
        throw new ValidationError(
          `Insufficient stock for '${product.name}'. Available: ${product.currentStockInBaseUnits} ${product.fractionalConfig.baseUnit}, Requested: ${calculated.quantityInBaseUnits} ${product.fractionalConfig.baseUnit}`
        );
      }

      validatedOrderItems.push({
        productId: product.id,
        productName: product.name,
        productImage: product.imageUrl,
        unitType: product.fractionalConfig.unitType,
        baseUnit: product.fractionalConfig.baseUnit,
        basePriceAtOrderTime: calculated.basePrice,
        orderedQuantityMultiplier: multiplier,
        orderedQuantityDisplay: displayLabel,
        quantityInBaseUnits: calculated.quantityInBaseUnits,
        unitItemPriceCalculated: calculated.unitPrice,
        quantityCount: count,
        lineItemTotal: calculated.lineTotal,
        notes: itemInput.notes,
      });
    }

    // Determine delivery fee and validate fulfillment availability based on shop settings
    let deliveryFee = 0;
    let deliveryAddress = undefined;

    const fulfillment = shop.fulfillment || {
      pickupEnabled: true,
      deliveryEnabled: true,
      minOrderValueForDelivery: 0,
      deliveryFee: 25,
      freeDeliveryThreshold: 499,
      maxDeliveryRadiusKm: 5,
      estimatedPreparationTimeMinutes: 20,
    };

    if (!fulfillment.deliveryEnabled && !fulfillment.pickupEnabled) {
      throw new ValidationError(`'${shop.name}' is currently not accepting orders (both Delivery and Pickup are currently disabled).`);
    }

    if (input.fulfillmentType === FulfillmentType.HOME_DELIVERY) {
      if (!fulfillment.deliveryEnabled) {
        throw new ValidationError(`Home Delivery is not supported by '${shop.name}'. Please choose Store Pickup.`);
      }

      const itemSubtotal = validatedOrderItems.reduce((sum, item) => sum + item.lineItemTotal, 0);
      if (fulfillment.minOrderValueForDelivery && itemSubtotal < fulfillment.minOrderValueForDelivery) {
        throw new ValidationError(
          `Minimum order amount for Home Delivery from '${shop.name}' is ₹${fulfillment.minOrderValueForDelivery}. Current subtotal is ₹${itemSubtotal}.`
        );
      }

      deliveryFee = (fulfillment.freeDeliveryThreshold && itemSubtotal >= fulfillment.freeDeliveryThreshold)
        ? 0
        : (fulfillment.deliveryFee || 25);

      if (input.deliveryAddressId) {
        deliveryAddress = customer.addresses.find((a) => a.id === input.deliveryAddressId);
      }
      if (!deliveryAddress && customer.addresses.length > 0) {
        deliveryAddress = customer.addresses[0];
      }
      if (!deliveryAddress) {
        throw new ValidationError('A valid delivery address is required for Home Delivery.');
      }
    } else {
      if (!fulfillment.pickupEnabled) {
        throw new ValidationError(`Store Pickup is not enabled for '${shop.name}'. Please choose Home Delivery.`);
      }
    }

    // Commission calculation based on Shop Billing Mode (Phase 9)
    const platformConfig = db.getCommissionConfig();
    const billingMode = shop.financials.billingMode || 'COMMISSION';
    
    let commissionPercentage = 0;
    if (billingMode === 'SUBSCRIPTION') {
      // Pure Subscription mode: 0% commission
      commissionPercentage = 0;
    } else if (billingMode === 'COMMISSION_PLUS_SUBSCRIPTION') {
      // Commission + Subscription mode
      if (shop.financials.customCommissionPercentage !== undefined) {
        commissionPercentage = shop.financials.customCommissionPercentage;
      } else if (shop.financials.subscriptionPlanId) {
        const plan = db.getSubscriptionPlanById(shop.financials.subscriptionPlanId);
        commissionPercentage = plan ? plan.commissionPercentage : (platformConfig.defaultPercentage || 2.0);
      } else {
        commissionPercentage = 2.0;
      }
    } else {
      // Default: Pure COMMISSION mode
      commissionPercentage = shop.financials.customCommissionPercentage ?? platformConfig.defaultPercentage;
    }

    const financials = PricingEngine.calculateOrderFinancials(validatedOrderItems, {
      deliveryFee,
      platformFee: platformConfig.platformFeePerOrder,
      commissionPercentage,
      commissionOnDeliveryFee: platformConfig.commissionOnDeliveryFee ?? false,
      commissionOnPlatformFee: platformConfig.commissionOnPlatformFee ?? false,
    });

    const orderId = `ord_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const pickupCode = input.fulfillmentType === FulfillmentType.STORE_PICKUP 
      ? Math.floor(1000 + Math.random() * 9000).toString() 
      : undefined;

    const newOrder: Order = {
      id: orderId,
      orderNumber: `ORD-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
      customerId: customer.id,
      customerName: customer.fullName,
      customerPhone: customer.phone,
      customerAvatar: customer.avatarUrl,
      shopId: shop.id,
      shopName: shop.name,
      shopPhone: shop.phone,
      sellerId: shop.sellerId,
      marketId: shop.marketId,
      fulfillmentType: input.fulfillmentType,
      pickupCode,
      deliveryAddress,
      items: validatedOrderItems,
      financials,
      status: OrderStatus.PAYMENT_PENDING,
      isPaid: false,
      statusHistory: [
        {
          status: OrderStatus.PAYMENT_PENDING,
          timestamp: new Date().toISOString(),
          updatedByUserId: customer.id,
          note: 'Order created, awaiting payment verification.',
        },
      ],
      customerNotes: input.customerNotes,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const saved = db.saveOrder(newOrder);

    db.recordAuditLog({
      eventType: AuditEventType.ORDER_CREATED,
      orderId: saved.id,
      shopId: saved.shopId,
      sellerId: saved.sellerId,
      customerId: saved.customerId,
      performedByUserId: customer.id,
      amount: saved.financials.customerTotal,
      commission: saved.financials.commissionAmount,
      details: {
        itemCount: saved.items.length,
        fulfillmentType: saved.fulfillmentType,
      },
    });

    return saved;
  }

  /**
   * State Machine Status Transition Controller (Rule H)
   */
  public static updateOrderStatus(
    orderId: string,
    targetStatus: OrderStatus,
    performedByUser: { userId: string; role: UserRole; shopId?: string },
    note?: string
  ): Order {
    const order = db.getOrderById(orderId);
    if (!order) {
      throw new NotFoundError('Order', orderId);
    }

    // Role and Shop isolation checks
    if (performedByUser.role === UserRole.SELLER) {
      if (order.shopId !== performedByUser.shopId) {
        throw new ShopIsolationError('Cannot update status of an order belonging to another shop.');
      }
    }

    // Validate state machine transition
    const transitionCheck = OrderStateMachine.canTransition(order.status, targetStatus, order.fulfillmentType);
    if (!transitionCheck.allowed) {
      throw new InvalidStateTransitionError(transitionCheck.reason || 'Invalid order transition.');
    }

    order.status = targetStatus;
    order.statusHistory.push({
      status: targetStatus,
      timestamp: new Date().toISOString(),
      updatedByUserId: performedByUser.userId,
      note,
    });

    const updated = db.saveOrder(order);

    db.recordAuditLog({
      eventType: AuditEventType.ORDER_STATUS_CHANGED,
      orderId: order.id,
      shopId: order.shopId,
      sellerId: order.sellerId,
      customerId: order.customerId,
      performedByUserId: performedByUser.userId,
      details: { fromStatus: order.status, toStatus: targetStatus, note },
    });

    return updated;
  }

  public static verifyPickupCodeAndComplete(
    orderId: string,
    pickupCode: string,
    performedByUser: { userId: string; role: UserRole; shopId?: string }
  ): Order {
    const order = db.getOrderById(orderId);
    if (!order) {
      throw new NotFoundError('Order', orderId);
    }
    if (performedByUser.role === UserRole.SELLER && order.shopId !== performedByUser.shopId) {
      throw new ShopIsolationError('Cannot complete order belonging to another shop.');
    }
    if (!order.pickupCode || order.pickupCode.trim() !== pickupCode.trim()) {
      throw new ValidationError('Invalid pickup PIN code.');
    }
    return this.updateOrderStatus(orderId, OrderStatus.COMPLETED, performedByUser, `Pickup verified with PIN ${pickupCode}`);
  }

  public static getOrderById(orderId: string, user: { userId: string; role: UserRole; shopId?: string }): Order {
    const order = db.getOrderById(orderId);
    if (!order) {
      throw new NotFoundError('Order', orderId);
    }

    if (user.role === UserRole.SELLER && order.shopId !== user.shopId) {
      throw new ShopIsolationError('Cannot access another seller\'s order.');
    }

    if (user.role === UserRole.CUSTOMER && order.customerId !== user.userId) {
      throw new ForbiddenError('Cannot access another customer\'s order.');
    }

    return order;
  }

  public static listOrdersForUser(user: { userId: string; role: UserRole; shopId?: string }, status?: OrderStatus): Order[] {
    if (user.role === UserRole.ADMIN) {
      return db.getOrders({ status });
    }
    if (user.role === UserRole.SELLER) {
      return db.getOrders({ shopId: user.shopId, status });
    }
    return db.getOrders({ customerId: user.userId, status });
  }
}

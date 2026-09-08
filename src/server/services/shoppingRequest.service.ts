/**
 * Shopping Request (Voice Order & Unpriced Custom List) Service
 * 
 * Manages customer voice shopping lists, unpriced custom goods,
 * seller bill review & price finalization, and conversion to paid orders.
 */

import {
  ShoppingRequest,
  ShoppingRequestStatus,
  CreateShoppingRequestDTO,
  FinalizeBillDTO,
  RequestedVoiceItem,
} from '../../types/shoppingRequest.ts';
import { Order, OrderItem, OrderStatus, FulfillmentType } from '../../types/order.ts';
import { BaseUnit, ProductUnitType } from '../../types/product.ts';
import { User, UserRole } from '../../types/auth.ts';
import { db } from '../storage/db.ts';
import { PricingEngine } from '../../core/pricingEngine.ts';
import { NotFoundError, ValidationError, ShopIsolationError, ForbiddenError } from '../utils/errors.ts';
import { NotificationType } from '../../types/notification.ts';
import { AuditEventType } from '../../types/financial.ts';

export class ShoppingRequestService {
  /**
   * Customer submits a voice/custom shopping list (draft request).
   * Status: PENDING_SELLER_REVIEW.
   * Payment does NOT happen yet.
   */
  public static createShoppingRequest(customer: User, input: CreateShoppingRequestDTO): ShoppingRequest {
    let shop = db.getShopById(input.shopId);
    if (!shop || !shop.isActive) {
      // Graceful fallback to primary active grocery store if specific shopId is stale/not found
      const activeShops = db.getShops().filter((s) => s.isActive);
      if (activeShops.length > 0) {
        shop = activeShops.find((s) => s.id === 'shp_krishna_grocers') || activeShops[0];
      } else {
        throw new NotFoundError('Shop', input.shopId);
      }
    }

    if (!input.items || input.items.length === 0) {
      throw new ValidationError('Shopping request must contain at least one item.');
    }

    // Process each item, preserving customer's natural speech & catalog matching
    const processedItems: RequestedVoiceItem[] = input.items.map((item, index) => {
      const isCustomUnpriced = item.unitPrice === undefined || item.unitPrice === null || item.isPriceEstimated;
      
      let catalogImage = item.matchedProductImage;
      let catalogName = item.matchedProductName;
      
      if (item.matchedProductId) {
        const prod = db.getProductById(item.matchedProductId);
        if (prod) {
          catalogImage = prod.imageUrl || catalogImage;
          catalogName = prod.name || catalogName;
        }
      }

      const quantityCount = item.quantityCount && item.quantityCount > 0 ? item.quantityCount : 1;
      const quantityMultiplier = item.quantityMultiplier && item.quantityMultiplier > 0 ? item.quantityMultiplier : 1.0;
      const unitPrice = isCustomUnpriced ? undefined : item.unitPrice;
      const lineTotal = unitPrice !== undefined ? Math.round(unitPrice * quantityMultiplier * quantityCount * 100) / 100 : undefined;

      return {
        id: `req_item_${Date.now()}_${index}_${Math.random().toString(36).substring(2, 5)}`,
        originalText: item.originalText || item.rawItemName,
        rawItemName: item.rawItemName,
        requestedPortion: item.requestedPortion,
        matchedProductId: item.matchedProductId,
        matchedProductName: catalogName,
        matchedProductImage: catalogImage,
        unitPrice,
        isPriceEstimated: isCustomUnpriced,
        quantityCount,
        quantityMultiplier,
        unitDisplay: item.unitDisplay || `${quantityCount} item`,
        baseUnit: item.baseUnit || 'piece',
        lineTotal,
        isAvailable: true,
      };
    });

    let deliveryAddress = undefined;
    if (input.fulfillmentType === FulfillmentType.HOME_DELIVERY) {
      if (input.deliveryAddressId) {
        deliveryAddress = customer.addresses?.find((a) => a.id === input.deliveryAddressId);
      }
      if (!deliveryAddress && customer.addresses?.length > 0) {
        deliveryAddress = customer.addresses.find((a) => a.isDefault) || customer.addresses[0];
      }
    }

    const requestId = `req_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const requestNumber = `REQ-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const newRequest: ShoppingRequest = {
      id: requestId,
      requestNumber,
      customerId: customer.id,
      customerName: customer.fullName,
      customerPhone: customer.phone,
      customerAvatar: customer.avatarUrl,
      shopId: shop.id,
      shopName: shop.name,
      shopPhone: shop.phone,
      sellerId: shop.sellerId,
      rawVoiceTranscript: input.rawVoiceTranscript || 'Voice shopping list',
      items: processedItems,
      fulfillmentType: input.fulfillmentType,
      deliveryAddress,
      customerNotes: input.customerNotes,
      status: ShoppingRequestStatus.PENDING_SELLER_REVIEW,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const saved = db.saveShoppingRequest(newRequest);

    // Notify seller of incoming request
    if (shop.sellerId) {
      db.addNotification({
        id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        recipientUserId: shop.sellerId,
        shopId: shop.id,
        type: NotificationType.NEW_ORDER,
        title: '📥 नई ग्राहक पर्ची मिली (Voice Request)',
        message: `${customer.fullName} ने ${saved.items.length} सामान की पर्ची भेजी है। बिल बनाएं व भाव भेजें।`,
        actionUrl: `/seller/requests/${saved.id}`,
        isRead: false,
        createdAt: new Date().toISOString(),
      });
    }

    // Notify customer that request was received by seller
    db.addNotification({
      id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      recipientUserId: customer.id,
      type: NotificationType.ORDER_STATUS_CHANGED,
      title: '🛒 पर्ची दुकानदार को भेजी गई',
      message: `${shop.name} आपकी लिस्ट देख रहे हैं। भाव फाइनल होते ही आपको पेमेंट लिंक मिलेगा।`,
      actionUrl: `/requests/${saved.id}`,
      isRead: false,
      createdAt: new Date().toISOString(),
    });

    db.recordAuditLog({
      eventType: AuditEventType.ORDER_CREATED,
      orderId: saved.id,
      shopId: saved.shopId,
      sellerId: saved.sellerId,
      customerId: saved.customerId,
      performedByUserId: customer.id,
      details: {
        type: 'VOICE_SHOPPING_REQUEST',
        requestNumber: saved.requestNumber,
        itemCount: saved.items.length,
      },
    });

    return saved;
  }

  /**
   * List shopping requests based on user role (seller sees their shop's, customer sees theirs)
   */
  public static listShoppingRequests(
    user: { userId: string; role: UserRole; shopId?: string },
    status?: ShoppingRequestStatus
  ): ShoppingRequest[] {
    if (user.role === UserRole.ADMIN) {
      return db.getShoppingRequests({ status });
    }
    if (user.role === UserRole.SELLER) {
      return db.getShoppingRequests({ shopId: user.shopId, status });
    }
    return db.getShoppingRequests({ customerId: user.userId, status });
  }

  /**
   * Get single shopping request with authorization
   */
  public static getShoppingRequestById(
    requestId: string,
    user: { userId: string; role: UserRole; shopId?: string }
  ): ShoppingRequest {
    const req = db.getShoppingRequestById(requestId);
    if (!req) {
      throw new NotFoundError('ShoppingRequest', requestId);
    }

    if (user.role === UserRole.SELLER && req.shopId !== user.shopId) {
      throw new ShopIsolationError('Cannot access shopping request for another shop.');
    }

    if (user.role === UserRole.CUSTOMER && req.customerId !== user.userId) {
      throw new ForbiddenError('Cannot access another customer\'s shopping request.');
    }

    return req;
  }

  /**
   * Seller reviews customer list, sets prices for unpriced items,
   * toggles availability, adds notes & finalizes bill.
   * Status -> BILL_FINALIZED. Customer receives notification to pay.
   */
  public static finalizeBill(
    requestId: string,
    seller: { userId: string; role: UserRole; shopId?: string },
    input: FinalizeBillDTO
  ): ShoppingRequest {
    const req = db.getShoppingRequestById(requestId);
    if (!req) {
      throw new NotFoundError('ShoppingRequest', requestId);
    }

    if (seller.role === UserRole.SELLER && req.shopId !== seller.shopId) {
      throw new ShopIsolationError('Cannot finalize bill for another shop\'s request.');
    }

    if (req.status !== ShoppingRequestStatus.PENDING_SELLER_REVIEW) {
      throw new ValidationError(`Cannot finalize bill for request in status: ${req.status}`);
    }

    const shop = db.getShopById(req.shopId);
    if (!shop) {
      throw new NotFoundError('Shop', req.shopId);
    }

    // Build finalized order items
    const finalizedOrderItems: OrderItem[] = [];
    const updatedRequestedItems: RequestedVoiceItem[] = [];
    let itemSubtotal = 0;

    for (const itemInput of input.items) {
      const existingReqItem = req.items.find((i) => i.id === itemInput.id);
      const isAvailable = itemInput.isAvailable !== false;
      const unitPrice = itemInput.unitPrice > 0 ? itemInput.unitPrice : (existingReqItem?.unitPrice || 0);
      const quantityCount = itemInput.quantityCount || 1;
      const quantityMultiplier = itemInput.quantityMultiplier || 1.0;
      const lineTotal = isAvailable ? Math.round(unitPrice * quantityMultiplier * quantityCount * 100) / 100 : 0;

      if (isAvailable) {
        itemSubtotal += lineTotal;
        finalizedOrderItems.push({
          productId: itemInput.productId || existingReqItem?.matchedProductId || `custom_${Date.now()}_${itemInput.id}`,
          productName: itemInput.productName || existingReqItem?.matchedProductName || existingReqItem?.rawItemName || 'Custom Item',
          productImage: itemInput.productImage || existingReqItem?.matchedProductImage || '',
          unitType: ProductUnitType.PIECE,
          baseUnit: (itemInput.baseUnit as BaseUnit) || 'piece',
          basePriceAtOrderTime: unitPrice,
          orderedQuantityMultiplier: quantityMultiplier,
          orderedQuantityDisplay: itemInput.unitDisplay || existingReqItem?.unitDisplay || `${quantityCount} unit`,
          quantityInBaseUnits: quantityMultiplier * quantityCount,
          unitItemPriceCalculated: unitPrice,
          quantityCount,
          lineItemTotal: lineTotal,
          notes: itemInput.sellerNote || existingReqItem?.originalText,
          isAvailable: true,
          isPacked: false,
        });
      }

      updatedRequestedItems.push({
        id: itemInput.id,
        originalText: existingReqItem?.originalText || itemInput.productName,
        rawItemName: itemInput.productName || existingReqItem?.rawItemName || '',
        requestedPortion: existingReqItem?.requestedPortion,
        matchedProductId: itemInput.productId || existingReqItem?.matchedProductId,
        matchedProductName: itemInput.productName,
        matchedProductImage: itemInput.productImage || existingReqItem?.matchedProductImage,
        unitPrice,
        isPriceEstimated: false,
        quantityCount,
        quantityMultiplier,
        unitDisplay: itemInput.unitDisplay || `${quantityCount} unit`,
        baseUnit: (itemInput.baseUnit as BaseUnit) || 'piece',
        lineTotal,
        isAvailable,
        sellerNote: itemInput.sellerNote,
      });
    }

    itemSubtotal = Math.round(itemSubtotal * 100) / 100;
    const deliveryFee = req.fulfillmentType === FulfillmentType.HOME_DELIVERY ? (input.deliveryFee ?? shop.fulfillment?.deliveryFee ?? 20) : 0;
    const platformFee = 0;
    const customerTotal = Math.round((itemSubtotal + deliveryFee + platformFee) * 100) / 100;

    req.items = updatedRequestedItems;
    req.sellerNotes = input.sellerNotes;
    req.status = ShoppingRequestStatus.BILL_FINALIZED;
    req.finalBill = {
      itemSubtotal,
      deliveryFee,
      platformFee,
      customerTotal,
      items: finalizedOrderItems,
      finalizedAt: new Date().toISOString(),
      sellerNotes: input.sellerNotes,
    };
    req.updatedAt = new Date().toISOString();

    const saved = db.saveShoppingRequest(req);

    // Send high-priority notification to customer with the finalized amount
    db.addNotification({
      id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      recipientUserId: req.customerId,
      type: NotificationType.ORDER_STATUS_CHANGED,
      title: `🎉 ${req.shopName} ने बिल फाइनल किया`,
      message: `कुल राशि ₹${customerTotal}। बिल चेक करें और भुगतान करके ऑर्डर कन्फर्म करें।`,
      actionUrl: `/requests/${saved.id}`,
      isRead: false,
      createdAt: new Date().toISOString(),
    });

    db.recordAuditLog({
      eventType: AuditEventType.ORDER_STATUS_CHANGED,
      orderId: saved.id,
      shopId: saved.shopId,
      sellerId: saved.sellerId,
      customerId: saved.customerId,
      performedByUserId: seller.userId,
      amount: customerTotal,
      details: {
        action: 'BILL_FINALIZED',
        itemSubtotal,
        deliveryFee,
        customerTotal,
        itemCount: finalizedOrderItems.length,
      },
    });

    return saved;
  }

  /**
   * Customer pays the finalized bill.
   * Converts the ShoppingRequest into a confirmed Order (status: CONFIRMED).
   * Packing can now begin in Seller App.
   */
  public static payAndConvertToOrder(
    requestId: string,
    customer: User,
    paymentDetails?: { method?: string; transactionRef?: string }
  ): { order: Order; shoppingRequest: ShoppingRequest } {
    const req = db.getShoppingRequestById(requestId);
    if (!req) {
      throw new NotFoundError('ShoppingRequest', requestId);
    }

    if (req.customerId !== customer.id) {
      throw new ForbiddenError('Cannot pay for another customer\'s request.');
    }

    if (req.status !== ShoppingRequestStatus.BILL_FINALIZED || !req.finalBill) {
      throw new ValidationError('Bill must be finalized by seller before payment can be made.');
    }

    const shop = db.getShopById(req.shopId);
    if (!shop) {
      throw new NotFoundError('Shop', req.shopId);
    }

    const commissionConfig = db.getCommissionConfig();
    const effectiveCommissionRate = shop.financials?.customCommissionPercentage ?? (commissionConfig as any)?.defaultRate ?? 5.0;
    const commissionAmount = Math.round(((req.finalBill.itemSubtotal * effectiveCommissionRate) / 100) * 100) / 100;
    const sellerNetPayout = Math.round((req.finalBill.itemSubtotal - commissionAmount + (req.finalBill.deliveryFee || 0)) * 100) / 100;

    const orderId = `ord_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const pickupCode = req.fulfillmentType === FulfillmentType.STORE_PICKUP
      ? Math.floor(1000 + Math.random() * 9000).toString()
      : undefined;

    const confirmedOrder: Order = {
      id: orderId,
      orderNumber: `ORD-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
      customerId: customer.id,
      customerName: customer.fullName,
      customerPhone: customer.phone,
      customerAvatar: customer.avatarUrl || req.customerAvatar,
      shopId: shop.id,
      shopName: shop.name,
      shopPhone: shop.phone,
      sellerId: shop.sellerId,
      marketId: shop.marketId,
      fulfillmentType: req.fulfillmentType,
      pickupCode,
      deliveryAddress: req.deliveryAddress,
      items: req.finalBill.items,
      financials: {
        itemSubtotal: req.finalBill.itemSubtotal,
        discount: 0,
        deliveryFee: req.finalBill.deliveryFee,
        platformFee: req.finalBill.platformFee,
        tax: 0,
        customerTotal: req.finalBill.customerTotal,
        commissionBase: req.finalBill.itemSubtotal,
        commissionPercentage: effectiveCommissionRate,
        commissionAmount,
        sellerNetAmount: sellerNetPayout,
      },
      status: OrderStatus.CONFIRMED,
      isPaid: true,
      paymentId: paymentDetails?.transactionRef || `pay_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      statusHistory: [
        {
          status: OrderStatus.PAYMENT_PENDING,
          timestamp: req.createdAt,
          updatedByUserId: customer.id,
          note: `Created from Voice Request ${req.requestNumber}`,
        },
        {
          status: OrderStatus.CONFIRMED,
          timestamp: new Date().toISOString(),
          updatedByUserId: customer.id,
          note: `Final bill of ₹${req.finalBill.customerTotal} paid via ${paymentDetails?.method || 'UPI'}`,
        },
      ],
      customerNotes: req.customerNotes,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const savedOrder = db.saveOrder(confirmedOrder);

    // Update shopping request to PAYMENT_COMPLETED and link order
    req.status = ShoppingRequestStatus.PAYMENT_COMPLETED;
    req.convertedOrderId = savedOrder.id;
    req.updatedAt = new Date().toISOString();
    const savedRequest = db.saveShoppingRequest(req);

    // Deduct stock for items that have matching catalog products
    try {
      db.deductInventoryForOrder(savedOrder);
    } catch {
      // Non-blocking if custom item
    }

    // Notify seller: Order paid, ready to pack
    if (shop.sellerId) {
      db.addNotification({
        id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        recipientUserId: shop.sellerId,
        shopId: shop.id,
        type: NotificationType.NEW_ORDER_PAID,
        title: '💰 ऑर्डर कन्फर्म & भुगतान प्राप्त!',
        message: `${customer.fullName} का ₹${savedOrder.financials.customerTotal} का ऑर्डर प्राप्त हुआ। तुरंत पैक करें।`,
        actionUrl: `/seller/orders/${savedOrder.id}`,
        isRead: false,
        createdAt: new Date().toISOString(),
      });
    }

    // Notify customer: Confirmation and pickup PIN
    db.addNotification({
      id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      recipientUserId: customer.id,
      type: NotificationType.ORDER_STATUS_CHANGED,
      title: '✅ ऑर्डर सफलतापूर्वक कन्फर्म हुआ',
      message: `ऑर्डर #${savedOrder.orderNumber}। ${pickupCode ? `पिकअप पिन: ${pickupCode}` : 'दुकानदार डिलीवरी की तैयारी कर रहे हैं।'}`,
      actionUrl: `/orders/${savedOrder.id}`,
      isRead: false,
      createdAt: new Date().toISOString(),
    });

    db.recordAuditLog({
      eventType: AuditEventType.PAYMENT_VERIFIED,
      orderId: savedOrder.id,
      shopId: savedOrder.shopId,
      sellerId: savedOrder.sellerId,
      customerId: savedOrder.customerId,
      performedByUserId: customer.id,
      amount: savedOrder.financials.customerTotal,
      details: {
        convertedFromRequestId: req.id,
        requestNumber: req.requestNumber,
      },
    });

    return { order: savedOrder, shoppingRequest: savedRequest };
  }

  /**
   * Reject request if seller cannot fulfill
   */
  public static rejectShoppingRequest(
    requestId: string,
    seller: { userId: string; role: UserRole; shopId?: string },
    reason?: string
  ): ShoppingRequest {
    const req = db.getShoppingRequestById(requestId);
    if (!req) {
      throw new NotFoundError('ShoppingRequest', requestId);
    }

    if (seller.role === UserRole.SELLER && req.shopId !== seller.shopId) {
      throw new ShopIsolationError('Cannot reject request for another shop.');
    }

    req.status = ShoppingRequestStatus.REJECTED;
    req.sellerNotes = reason || 'Shopkeeper is currently unable to fulfill this request.';
    req.updatedAt = new Date().toISOString();

    const saved = db.saveShoppingRequest(req);

    db.addNotification({
      id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      recipientUserId: req.customerId,
      type: NotificationType.ORDER_STATUS_CHANGED,
      title: '❌ पर्ची स्वीकार नहीं हो सकी',
      message: `${req.shopName}: ${req.sellerNotes}`,
      actionUrl: `/requests/${saved.id}`,
      isRead: false,
      createdAt: new Date().toISOString(),
    });

    return saved;
  }

  /**
   * Cancel request by customer
   */
  public static cancelShoppingRequest(
    requestId: string,
    customer: User,
    reason?: string
  ): ShoppingRequest {
    const req = db.getShoppingRequestById(requestId);
    if (!req) {
      throw new NotFoundError('ShoppingRequest', requestId);
    }

    if (req.customerId !== customer.id) {
      throw new ForbiddenError('Cannot cancel another customer\'s request.');
    }

    if (req.status === ShoppingRequestStatus.PAYMENT_COMPLETED) {
      throw new ValidationError('Cannot cancel request that has already been paid and converted to an order.');
    }

    req.status = ShoppingRequestStatus.CANCELLED;
    req.customerNotes = reason || 'Cancelled by customer';
    req.updatedAt = new Date().toISOString();

    const saved = db.saveShoppingRequest(req);

    if (req.sellerId) {
      db.addNotification({
        id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        recipientUserId: req.sellerId,
        shopId: req.shopId,
        type: NotificationType.ORDER_STATUS_CHANGED,
        title: '⚠️ पर्ची रद्द की गई',
        message: `${customer.fullName} ने अपनी पर्ची रद्द कर दी।`,
        actionUrl: `/seller/requests/${saved.id}`,
        isRead: false,
        createdAt: new Date().toISOString(),
      });
    }

    return saved;
  }
}

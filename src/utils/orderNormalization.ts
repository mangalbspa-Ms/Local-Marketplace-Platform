import { Order, OrderStatus, FulfillmentType, OrderItem } from '../types/order.ts';
import { ProductUnitType } from '../types/product.ts';
import { calculateOrderTotal } from '../services/pricingEngine.ts';

/**
 * Normalizes customer orders data to enforce strict "ONE SHOP ORDER = ONE SHOP CARD" architecture.
 *
 * Data Hierarchy:
 * Customer (customerId)
 *   ↓
 * Shop Orders (orderId, shopId, items[], status, financials, fulfillmentType)
 *   ↓
 * Order Items (individual products inside this specific shop order)
 *
 * Guarantees:
 * 1. An order with 10 products from one shop produces EXACTLY ONE Order object with 10 items in its items array.
 * 2. Never creates a separate order or card per item.
 * 3. Preserves distinct order transactions (e.g. Cancelled Order #1 and New Reorder #2 are 2 separate orders).
 * 4. Deduplicates any duplicate order instances by unique orderId.
 * 5. Sanitizes missing financial or item properties safely.
 */
export function normalizeCustomerShopOrders(
  rawOrders: Order[] | null | undefined,
  currentCustomerId?: string
): Order[] {
  if (!rawOrders || !Array.isArray(rawOrders)) {
    return [];
  }

  // 1. Resolve effective customer ID strictly
  const effectiveCustomerId =
    currentCustomerId ||
    (typeof localStorage !== 'undefined' ? localStorage.getItem('customer_user_id') : null) ||
    'usr_cust_01';

  // Strict filtering: only include orders belonging to the active customer
  const customerFiltered = rawOrders.filter((o) => {
    if (!o.customerId) return true;
    return o.customerId === effectiveCustomerId;
  });

  // 2. Map to deduplicate by unique order id and ensure items is a single unified array
  const orderMap = new Map<string, Order>();

  for (const raw of customerFiltered) {
    if (!raw || !raw.id) continue;

    // Sanitize order items array
    const rawItems: OrderItem[] = Array.isArray(raw.items) ? raw.items : [];
    
    // Ensure every item has valid numbers
    const sanitizedItems: OrderItem[] = rawItems.map((item, idx) => ({
      productId: item.productId || `prd_${idx}`,
      productName: item.productName || 'Grocery Item',
      productImage: item.productImage,
      unitType: item.unitType || ProductUnitType.PIECE,
      baseUnit: (item.baseUnit as any) || 'piece',
      basePriceAtOrderTime: Number(item.basePriceAtOrderTime) || 0,
      orderedQuantityMultiplier: Number(item.orderedQuantityMultiplier) || 1,
      orderedQuantityDisplay: item.orderedQuantityDisplay || '1 unit',
      quantityInBaseUnits: Number(item.quantityInBaseUnits) || 1,
      unitItemPriceCalculated: Number(item.unitItemPriceCalculated) || 0,
      quantityCount: Math.max(1, Number(item.quantityCount) || 1),
      lineItemTotal: Number(item.lineItemTotal) || 0,
      notes: item.notes,
    }));

    const itemSubtotal =
      raw.financials?.itemSubtotal ??
      sanitizedItems.reduce((sum, item) => sum + (item.lineItemTotal || 0), 0);

    const deliveryFee = raw.financials?.deliveryFee ?? (raw.fulfillmentType === FulfillmentType.HOME_DELIVERY ? 20 : 0);
    const platformFee = raw.financials?.platformFee ?? 2;
    const discount = raw.financials?.discount ?? 0;
    const customerTotal =
      raw.financials?.customerTotal !== undefined && raw.financials.customerTotal > 0
        ? raw.financials.customerTotal
        : calculateOrderTotal(
            { ...raw, items: sanitizedItems },
            { deliveryFee, platformFee, discount }
          );

    const normalizedOrder: Order = {
      ...raw,
      items: sanitizedItems,
      total: customerTotal,
      financials: {
        itemSubtotal,
        discount,
        deliveryFee,
        platformFee,
        tax: raw.financials?.tax ?? 0,
        customerTotal,
        commissionBase: raw.financials?.commissionBase ?? itemSubtotal,
        commissionPercentage: raw.financials?.commissionPercentage ?? 5,
        commissionAmount: raw.financials?.commissionAmount ?? 0,
        sellerNetAmount: raw.financials?.sellerNetAmount ?? itemSubtotal,
      },
    };

    // If order already exists in map, keep the one with the latest updatedAt timestamp
    if (orderMap.has(raw.id)) {
      const existing = orderMap.get(raw.id)!;
      const existingTime = new Date(existing.updatedAt || existing.createdAt || 0).getTime();
      const newTime = new Date(normalizedOrder.updatedAt || normalizedOrder.createdAt || 0).getTime();
      if (newTime >= existingTime) {
        orderMap.set(raw.id, normalizedOrder);
      }
    } else {
      orderMap.set(raw.id, normalizedOrder);
    }
  }

  // 3. Return sorted by creation date descending (newest order first)
  return Array.from(orderMap.values()).sort(
    (a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
  );
}

/**
 * Splits normalized orders into Active and Past categories.
 * Active: In-progress orders (PAYMENT_PENDING, CONFIRMED, ACCEPTED, PREPARING, READY_FOR_PICKUP, OUT_FOR_DELIVERY)
 * Past: Terminal orders (COMPLETED, CANCELLED, REFUNDED)
 */
export function partitionCustomerOrders(orders: Order[]): {
  activeOrders: Order[];
  pastOrders: Order[];
} {
  const activeOrders: Order[] = [];
  const pastOrders: Order[] = [];

  for (const order of orders) {
    if (order.status === OrderStatus.COMPLETED || order.status === OrderStatus.CANCELLED || order.status === OrderStatus.REFUNDED) {
      pastOrders.push(order);
    } else {
      activeOrders.push(order);
    }
  }

  return { activeOrders, pastOrders };
}

/**
 * Customer Cart Context
 * 
 * Enforces strict single-shop cart isolation, fractional portion calculations,
 * fulfillment configuration, and multi-shop replacement confirmation modal.
 */

import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { Product } from '../types/product.ts';
import { Shop } from '../types/market.ts';
import { FulfillmentType } from '../types/order.ts';

export interface CartItem {
  product: Product;
  multiplier: number; // e.g. 0.25 (250g), 0.5 (500g), 1 (1kg/1pc), 2 (2 packs)
  quantityCount: number; // e.g. 1 unit of 250g, 2 units of 500g
  displayLabel: string; // e.g. '250 g' or '1 kg' or 'Pack of 6'
  unitPrice: number; // price for 1 multiplier unit: basePrice * multiplier
  lineTotal: number; // unitPrice * quantityCount
  quantityInBaseUnits: number; // multiplier * quantityCount
  notes?: string;
}

export interface CartConflictState {
  isOpen: boolean;
  pendingItem: {
    product: Product;
    shop: Shop;
    multiplier: number;
    quantityCount: number;
    displayLabel: string;
    notes?: string;
  } | null;
  existingShopName: string;
  newShopName: string;
}

interface CustomerCartContextType {
  shopId: string | null;
  shop: Shop | null;
  items: CartItem[];
  fulfillmentType: FulfillmentType;
  customerNotes: string;
  conflictState: CartConflictState;
  
  // Cart Actions
  addToCart: (product: Product, shop: Shop, multiplier: number, quantityCount?: number, displayLabel?: string, notes?: string) => boolean;
  updateItemQuantity: (productId: string, multiplier: number, quantityCount: number) => void;
  removeItem: (productId: string, multiplier: number) => void;
  clearCart: () => void;
  setFulfillmentType: (type: FulfillmentType) => void;
  setCustomerNotes: (notes: string) => void;
  resolveConflict: (confirmReplace: boolean) => void;
  
  // Computed Bill Breakdowns
  itemCount: number;
  itemSubtotal: number;
  deliveryFee: number;
  platformFee: number;
  finalPayableAmount: number;
  isDeliveryFree: boolean;
  freeDeliveryThresholdMet: boolean;
  amountNeededForFreeDelivery: number;
  meetsMinOrderValueForDelivery: boolean;
  minOrderValueDifference: number;
}

const CustomerCartContext = createContext<CustomerCartContextType>({
  shopId: null,
  shop: null,
  items: [],
  fulfillmentType: FulfillmentType.HOME_DELIVERY,
  customerNotes: '',
  conflictState: { isOpen: false, pendingItem: null, existingShopName: '', newShopName: '' },
  addToCart: () => false,
  updateItemQuantity: () => {},
  removeItem: () => {},
  clearCart: () => {},
  setFulfillmentType: () => {},
  setCustomerNotes: () => {},
  resolveConflict: () => {},
  itemCount: 0,
  itemSubtotal: 0,
  deliveryFee: 0,
  platformFee: 2,
  finalPayableAmount: 0,
  isDeliveryFree: false,
  freeDeliveryThresholdMet: false,
  amountNeededForFreeDelivery: 0,
  meetsMinOrderValueForDelivery: true,
  minOrderValueDifference: 0,
});

export const CustomerCartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [shopId, setShopId] = useState<string | null>(() => {
    return localStorage.getItem('cust_cart_shop_id') || null;
  });
  const [shop, setShop] = useState<Shop | null>(() => {
    const saved = localStorage.getItem('cust_cart_shop');
    return saved ? JSON.parse(saved) : null;
  });
  const [items, setItems] = useState<CartItem[]>(() => {
    const saved = localStorage.getItem('cust_cart_items');
    return saved ? JSON.parse(saved) : [];
  });
  const [fulfillmentType, setFulfillmentType] = useState<FulfillmentType>(() => {
    const saved = localStorage.getItem('cust_cart_fulfillment');
    return (saved as FulfillmentType) || FulfillmentType.HOME_DELIVERY;
  });
  const [customerNotes, setCustomerNotes] = useState<string>('');

  const [conflictState, setConflictState] = useState<CartConflictState>({
    isOpen: false,
    pendingItem: null,
    existingShopName: '',
    newShopName: '',
  });

  // Sync cart to localStorage
  useEffect(() => {
    if (items.length > 0 && shopId && shop) {
      localStorage.setItem('cust_cart_shop_id', shopId);
      localStorage.setItem('cust_cart_shop', JSON.stringify(shop));
      localStorage.setItem('cust_cart_items', JSON.stringify(items));
      localStorage.setItem('cust_cart_fulfillment', fulfillmentType);
    } else {
      localStorage.removeItem('cust_cart_shop_id');
      localStorage.removeItem('cust_cart_shop');
      localStorage.removeItem('cust_cart_items');
    }
  }, [items, shopId, shop, fulfillmentType]);

  // Add To Cart with Strict Single-Shop enforcement
  const addToCart = (
    product: Product,
    targetShop: Shop,
    multiplier: number,
    quantityCount = 1,
    displayLabel = '',
    notes = ''
  ): boolean => {
    if (quantityCount <= 0) return false;

    // Check if cart already belongs to a different shop
    if (shopId && items.length > 0 && shopId !== targetShop.id) {
      setConflictState({
        isOpen: true,
        pendingItem: {
          product,
          shop: targetShop,
          multiplier,
          quantityCount,
          displayLabel: displayLabel || `${multiplier} ${product.fractionalConfig.baseUnit}`,
          notes,
        },
        existingShopName: shop?.name || 'Current Shop',
        newShopName: targetShop.name,
      });
      return false;
    }

    const unitPrice = Math.round(product.fractionalConfig.basePrice * multiplier * 100) / 100;
    const resolvedLabel = displayLabel || (
      product.fractionalConfig.predefinedOptions?.find((o) => Math.abs(o.multiplier - multiplier) < 0.001)?.label ||
      `${multiplier} ${product.fractionalConfig.baseUnit}`
    );

    setShopId(targetShop.id);
    setShop(targetShop);

    setItems((prev) => {
      const existingIndex = prev.findIndex(
        (i) => i.product.id === product.id && Math.abs(i.multiplier - multiplier) < 0.001
      );

      if (existingIndex > -1) {
        const existing = prev[existingIndex];
        const newCount = existing.quantityCount + quantityCount;
        const updated = [...prev];
        updated[existingIndex] = {
          ...existing,
          quantityCount: newCount,
          lineTotal: Math.round(unitPrice * newCount * 100) / 100,
          quantityInBaseUnits: multiplier * newCount,
          notes: notes || existing.notes,
        };
        return updated;
      } else {
        const newItem: CartItem = {
          product,
          multiplier,
          quantityCount,
          displayLabel: resolvedLabel,
          unitPrice,
          lineTotal: Math.round(unitPrice * quantityCount * 100) / 100,
          quantityInBaseUnits: multiplier * quantityCount,
          notes,
        };
        return [...prev, newItem];
      }
    });

    return true;
  };

  const resolveConflict = (confirmReplace: boolean) => {
    if (confirmReplace && conflictState.pendingItem) {
      const { product, shop: newShop, multiplier, quantityCount, displayLabel, notes } = conflictState.pendingItem;
      const unitPrice = Math.round(product.fractionalConfig.basePrice * multiplier * 100) / 100;
      
      setShopId(newShop.id);
      setShop(newShop);
      setItems([
        {
          product,
          multiplier,
          quantityCount,
          displayLabel,
          unitPrice,
          lineTotal: Math.round(unitPrice * quantityCount * 100) / 100,
          quantityInBaseUnits: multiplier * quantityCount,
          notes,
        },
      ]);
    }
    setConflictState({
      isOpen: false,
      pendingItem: null,
      existingShopName: '',
      newShopName: '',
    });
  };

  const updateItemQuantity = (productId: string, multiplier: number, quantityCount: number) => {
    if (quantityCount <= 0) {
      removeItem(productId, multiplier);
      return;
    }

    setItems((prev) =>
      prev.map((item) => {
        if (item.product.id === productId && Math.abs(item.multiplier - multiplier) < 0.001) {
          const lineTotal = Math.round(item.unitPrice * quantityCount * 100) / 100;
          return {
            ...item,
            quantityCount,
            lineTotal,
            quantityInBaseUnits: item.multiplier * quantityCount,
          };
        }
        return item;
      })
    );
  };

  const removeItem = (productId: string, multiplier: number) => {
    setItems((prev) => {
      const filtered = prev.filter(
        (i) => !(i.product.id === productId && Math.abs(i.multiplier - multiplier) < 0.001)
      );
      if (filtered.length === 0) {
        setShopId(null);
        setShop(null);
      }
      return filtered;
    });
  };

  const clearCart = () => {
    setItems([]);
    setShopId(null);
    setShop(null);
    setCustomerNotes('');
    localStorage.removeItem('cust_cart_shop_id');
    localStorage.removeItem('cust_cart_shop');
    localStorage.removeItem('cust_cart_items');
  };

  // Calculations
  const itemCount = useMemo(() => {
    return items.reduce((sum, item) => sum + item.quantityCount, 0);
  }, [items]);

  const itemSubtotal = useMemo(() => {
    return Math.round(items.reduce((sum, item) => sum + item.lineTotal, 0) * 100) / 100;
  }, [items]);

  const platformFee = 2.0; // ₹2.00 fixed platform facilitation fee

  const deliveryFee = useMemo(() => {
    if (fulfillmentType === FulfillmentType.STORE_PICKUP || !shop) {
      return 0;
    }
    const fulfillment = shop.fulfillment;
    if (!fulfillment?.deliveryEnabled) return 0;
    if (fulfillment.freeDeliveryThreshold && itemSubtotal >= fulfillment.freeDeliveryThreshold) {
      return 0;
    }
    return fulfillment.deliveryFee || 25;
  }, [fulfillmentType, shop, itemSubtotal]);

  const isDeliveryFree = deliveryFee === 0 && fulfillmentType === FulfillmentType.HOME_DELIVERY;

  const freeDeliveryThresholdMet = useMemo(() => {
    if (!shop?.fulfillment?.freeDeliveryThreshold) return false;
    return itemSubtotal >= shop.fulfillment.freeDeliveryThreshold;
  }, [shop, itemSubtotal]);

  const amountNeededForFreeDelivery = useMemo(() => {
    if (!shop?.fulfillment?.freeDeliveryThreshold) return 0;
    const diff = shop.fulfillment.freeDeliveryThreshold - itemSubtotal;
    return diff > 0 ? Math.round(diff * 100) / 100 : 0;
  }, [shop, itemSubtotal]);

  const meetsMinOrderValueForDelivery = useMemo(() => {
    if (fulfillmentType === FulfillmentType.STORE_PICKUP || !shop?.fulfillment?.minOrderValueForDelivery) {
      return true;
    }
    return itemSubtotal >= shop.fulfillment.minOrderValueForDelivery;
  }, [fulfillmentType, shop, itemSubtotal]);

  const minOrderValueDifference = useMemo(() => {
    if (fulfillmentType === FulfillmentType.STORE_PICKUP || !shop?.fulfillment?.minOrderValueForDelivery) {
      return 0;
    }
    const diff = shop.fulfillment.minOrderValueForDelivery - itemSubtotal;
    return diff > 0 ? Math.round(diff * 100) / 100 : 0;
  }, [fulfillmentType, shop, itemSubtotal]);

  const finalPayableAmount = useMemo(() => {
    if (items.length === 0) return 0;
    return Math.round((itemSubtotal + deliveryFee + platformFee) * 100) / 100;
  }, [items, itemSubtotal, deliveryFee, platformFee]);

  return (
    <CustomerCartContext.Provider
      value={{
        shopId,
        shop,
        items,
        fulfillmentType,
        customerNotes,
        conflictState,
        addToCart,
        updateItemQuantity,
        removeItem,
        clearCart,
        setFulfillmentType,
        setCustomerNotes,
        resolveConflict,
        itemCount,
        itemSubtotal,
        deliveryFee,
        platformFee,
        finalPayableAmount,
        isDeliveryFree,
        freeDeliveryThresholdMet,
        amountNeededForFreeDelivery,
        meetsMinOrderValueForDelivery,
        minOrderValueDifference,
      }}
    >
      {children}
    </CustomerCartContext.Provider>
  );
};

export const useCustomerCart = () => useContext(CustomerCartContext);

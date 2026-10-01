/**
 * Packing Screen / Checklist (Screen 7)
 * Counter packing checklist with clean, light styling, explicit weights,
 * item-by-item availability controls, and progress tracking.
 */

import React, { useState } from 'react';
import {
  PackageCheck,
  CheckCircle2,
  Check,
  ShoppingBag,
  Truck,
  Building2,
  AlertCircle,
  X,
} from 'lucide-react';
import { Order, OrderStatus, FulfillmentType } from '../../../types/order.ts';
import { useSellerLanguage } from '../../../context/SellerLanguageContext.tsx';
import { calculateOrderTotal } from '../../../services/pricingEngine.ts';
import confetti from 'canvas-confetti';

interface PackingScreenProps {
  orders: Order[];
  onCompletePacking: (orderId: string, isPickup: boolean) => Promise<void>;
  onViewOrderDetails: (order: Order) => void;
}

export const PackingScreen: React.FC<PackingScreenProps> = ({
  orders,
  onCompletePacking,
  onViewOrderDetails,
}) => {
  const { language, t } = useSellerLanguage();

  // Orders that are currently ACCEPTED or PREPARING
  const packingOrders = orders.filter(
    (o) => o.status === OrderStatus.ACCEPTED || o.status === OrderStatus.PREPARING
  );

  const [selectedOrderId, setSelectedOrderId] = useState<string>(
    packingOrders[0]?.id || ''
  );

  // Local state for checked items: { [orderId]: { [productId]: boolean } }
  const [checkedItems, setCheckedItems] = useState<Record<string, Record<string, boolean>>>({});
  // Local state for available items: { [orderId]: { [productId]: boolean } }
  const [availableMap, setAvailableMap] = useState<Record<string, Record<string, boolean>>>({});
  const [isFinishing, setIsFinishing] = useState(false);

  const currentOrder = packingOrders.find((o) => o.id === selectedOrderId) || packingOrders[0];

  const handleToggleItem = (orderId: string, productId: string) => {
    setCheckedItems((prev) => ({
      ...prev,
      [orderId]: {
        ...prev[orderId],
        [productId]: !prev[orderId]?.[productId],
      },
    }));
  };

  const handleToggleAvailability = (orderId: string, productId: string) => {
    setAvailableMap((prev) => {
      const currentVal = prev[orderId]?.[productId] !== false; // defaults to true
      return {
        ...prev,
        [orderId]: {
          ...prev[orderId],
          [productId]: !currentVal,
        },
      };
    });
  };

  const isItemAvailable = (orderId: string, productId: string) => {
    return availableMap[orderId]?.[productId] !== false;
  };

  const isAllChecked = (order: Order) => {
    if (!order || !order.items.length) return false;
    const orderChecks = checkedItems[order.id] || {};
    // Only available items need to be packed
    const availItems = order.items.filter((item) => isItemAvailable(order.id, item.productId));
    if (availItems.length === 0) return true;
    return availItems.every((item) => orderChecks[item.productId]);
  };

  const handleCheckAll = (order: Order) => {
    const allCheckedMap: Record<string, boolean> = {};
    order.items.forEach((item) => {
      if (isItemAvailable(order.id, item.productId)) {
        allCheckedMap[item.productId] = true;
      }
    });
    setCheckedItems((prev) => ({
      ...prev,
      [order.id]: allCheckedMap,
    }));
  };

  const handleFinishPacking = async (order: Order) => {
    setIsFinishing(true);
    try {
      const isPickup = order.fulfillmentType === FulfillmentType.STORE_PICKUP;
      await onCompletePacking(order.id, isPickup);
      confetti({ particleCount: 70, spread: 50, origin: { y: 0.7 } });
    } catch (err) {
      console.error('Failed to complete packing', err);
    } finally {
      setIsFinishing(false);
    }
  };

  if (packingOrders.length === 0) {
    return (
      <div className="p-6 text-center py-16 space-y-4 max-w-lg mx-auto">
        <div className="w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center mx-auto shadow-xs">
          <PackageCheck className="w-7 h-7" />
        </div>
        <div>
          <h2 className="font-extrabold text-base text-slate-900">
            {language === 'hi' ? 'कोई भी आर्डर पैकिंग हेतु लंबित नहीं है' : 'All Orders Packed & Ready!'}
          </h2>
          <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
            {language === 'hi'
              ? 'जैसे ही नया आर्डर स्वीकार करेंगे, उसकी पैकिंग सूची यहाँ दिखेगी'
              : 'Accepted orders waiting to be packed will appear here.'}
          </p>
        </div>
      </div>
    );
  }

  const isPickup = currentOrder?.fulfillmentType === FulfillmentType.STORE_PICKUP;
  const orderChecks = currentOrder ? (checkedItems[currentOrder.id] || {}) : {};
  const availItems = currentOrder?.items.filter((it) => isItemAvailable(currentOrder.id, it.productId)) || [];
  const packedCount = availItems.filter((it) => orderChecks[it.productId]).length;
  const totalAvailCount = availItems.length;
  const progressPercent = totalAvailCount > 0 ? Math.round((packedCount / totalAvailCount) * 100) : 100;
  const readyToDispatch = currentOrder && isAllChecked(currentOrder);

  return (
    <div className="p-3 sm:p-4 space-y-3.5 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-black text-lg text-slate-900 tracking-tight flex items-center space-x-2">
            <PackageCheck className="w-5 h-5 text-purple-700" />
            <span>{t('packing.title')}</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            {language === 'hi' ? 'सामान देखकर पैक करें और टिक लगाएं' : 'Verify items, pack and check off each item'}
          </p>
        </div>

        <span className="px-2.5 py-0.5 rounded-full bg-purple-50 border border-purple-200 text-purple-800 text-xs font-bold font-mono">
          {packingOrders.length} {packingOrders.length === 1 ? 'Order' : 'Orders'}
        </span>
      </div>

      {/* Multiple Order Selector Tabs if > 1 */}
      {packingOrders.length > 1 && (
        <div className="flex space-x-2 overflow-x-auto pb-1 scrollbar-none">
          {packingOrders.map((ord) => {
            const isSelected = ord.id === currentOrder?.id;
            const isOrdDone = isAllChecked(ord);
            return (
              <button
                key={ord.id}
                onClick={() => setSelectedOrderId(ord.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold border shrink-0 transition-all flex items-center space-x-1.5 cursor-pointer ${
                  isSelected
                    ? 'bg-purple-600 border-purple-600 text-white shadow-xs'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                <span>{ord.orderNumber}</span>
                <span className={isSelected ? 'text-purple-100 text-[11px]' : 'text-slate-400 text-[11px]'}>
                  ({ord.customerName})
                </span>
                {isOrdDone && <CheckCircle2 className={`w-3.5 h-3.5 ${isSelected ? 'text-white' : 'text-emerald-600'}`} />}
              </button>
            );
          })}
        </div>
      )}

      {/* Active Packing Container */}
      {currentOrder && (
        <div className="space-y-3">
          {/* Customer & Order Header Card */}
          <div className="bg-white border border-slate-200 rounded-2xl p-3.5 shadow-2xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3 min-w-0">
                {/* Real Customer Profile Photo */}
                {currentOrder.customerAvatar && currentOrder.customerAvatar.trim() !== '' ? (
                  <img
                    src={currentOrder.customerAvatar}
                    alt={currentOrder.customerName}
                    className="w-12 h-12 rounded-full object-cover shrink-0 border border-slate-200 shadow-2xs"
                    referrerPolicy="no-referrer"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full flex items-center justify-center font-black text-sm shrink-0 border bg-purple-100 text-purple-800 border-purple-300">
                    {currentOrder.customerName
                      .split(' ')
                      .filter(Boolean)
                      .map((n) => n[0])
                      .slice(0, 2)
                      .join('')
                      .toUpperCase() || 'CU'}
                  </div>
                )}

                <div className="min-w-0">
                  <div className="flex items-center space-x-2">
                    <h2 className="font-extrabold text-sm sm:text-base text-slate-900 truncate">
                      {currentOrder.customerName}
                    </h2>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold border shrink-0 ${
                        isPickup
                          ? 'bg-blue-50 border-blue-200 text-blue-800'
                          : 'bg-purple-50 border-purple-200 text-purple-800'
                      }`}
                    >
                      {isPickup ? (
                        <span className="flex items-center space-x-0.5">
                          <Building2 className="w-2.5 h-2.5 inline mr-0.5" />
                          {language === 'hi' ? 'दुकान पिकअप' : 'Pickup'}
                        </span>
                      ) : (
                        <span className="flex items-center space-x-0.5">
                          <Truck className="w-2.5 h-2.5 inline mr-0.5" />
                          {language === 'hi' ? 'होम डिलीवरी' : 'Home Delivery'}
                        </span>
                      )}
                    </span>
                  </div>

                  <div className="flex items-center flex-wrap gap-x-1.5 gap-y-0.5 text-xs text-slate-600 mt-0.5">
                    <span className="font-mono font-bold text-slate-800">{currentOrder.orderNumber}</span>
                    <span className="text-slate-300">•</span>
                    <span className="font-bold text-slate-800">
                      {currentOrder.items.length} {language === 'hi' ? 'सामान' : 'items'}
                    </span>
                    <span className="text-slate-300">•</span>
                    <span className="font-mono font-black text-slate-900">
                      ₹{calculateOrderTotal(currentOrder).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                    </span>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="flex items-center space-x-1.5 shrink-0 ml-2">
                <button
                  type="button"
                  onClick={() => handleCheckAll(currentOrder)}
                  className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700 border border-slate-200 transition-colors cursor-pointer"
                >
                  {language === 'hi' ? 'सब पैक करें' : 'Pack All'}
                </button>
              </div>
            </div>
          </div>

          {/* Live Packing Progress Bar */}
          <div className="bg-white border border-slate-200 rounded-2xl p-3.5 space-y-2 shadow-2xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="text-lg">📦</span>
                <div>
                  <div className="font-extrabold text-xs text-slate-900">
                    {language === 'hi' ? 'पैकिंग' : 'Packing Progress'}
                  </div>
                  <div className="font-black text-xs sm:text-sm text-emerald-800 font-mono">
                    {packedCount}/{totalAvailCount} {language === 'hi' ? 'सामान पैक' : 'items packed'}
                  </div>
                </div>
              </div>

              <div>
                {readyToDispatch ? (
                  <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full bg-emerald-100 border border-emerald-300 text-emerald-800 text-xs font-black">
                    <span>✓</span>
                    <span>{language === 'hi' ? 'पैकिंग पूरी हुई' : 'Packing Complete'}</span>
                  </span>
                ) : (
                  <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                    {totalAvailCount - packedCount} {language === 'hi' ? 'बाकी' : 'left'}
                  </span>
                )}
              </div>
            </div>

            {/* Subtle Animated Progress Track */}
            <div className="relative w-full h-2.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200 shadow-inner">
              <div
                className={`h-full transition-all duration-500 ease-out rounded-full ${
                  readyToDispatch
                    ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 shadow-xs'
                    : 'bg-gradient-to-r from-purple-500 to-indigo-600'
                }`}
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            
            {/* Subtle percentage & ratio note */}
            <div className="flex items-center justify-between text-[11px] text-slate-500 px-0.5">
              <span className="font-medium">
                {language === 'hi' ? `${progressPercent}% पूर्ण` : `${progressPercent}% Completed`}
              </span>
              <span className="font-mono font-semibold text-slate-600">
                {packedCount} / {totalAvailCount} {language === 'hi' ? 'सामान' : 'items'}
              </span>
            </div>
          </div>

          {/* Compact Product Checklist Container */}
          <div className="bg-white rounded-2xl border border-slate-200 divide-y divide-slate-100 overflow-hidden shadow-2xs">
            <div className="px-3.5 py-2 bg-slate-50/90 border-b border-slate-200 flex items-center justify-between text-[11px] font-bold text-slate-600 uppercase tracking-wider">
              <span>{language === 'hi' ? 'सामान सूची (चेकलिस्ट)' : 'Packing Checklist'}</span>
              <span className="font-mono text-slate-500 font-semibold">{currentOrder.items.length} items</span>
            </div>

            {currentOrder.items.map((item, idx) => {
              const isChecked = !!orderChecks[item.productId];
              const isAvail = isItemAvailable(currentOrder.id, item.productId);

              return (
                <div
                  key={idx}
                  onClick={() => isAvail && handleToggleItem(currentOrder.id, item.productId)}
                  className={`p-2.5 sm:p-3 transition-all flex items-center justify-between gap-2.5 cursor-pointer ${
                    !isAvail
                      ? 'bg-red-50/40 opacity-75'
                      : isChecked
                      ? 'bg-emerald-50/50'
                      : 'hover:bg-slate-50/80 bg-white'
                  }`}
                >
                  {/* Left: 40px Product Thumbnail + Name + Unit Price */}
                  <div className="flex items-center space-x-2.5 min-w-0 flex-1">
                    {/* 40px Product Photo */}
                    {item.productImage && item.productImage.trim() !== '' ? (
                      <img
                        src={item.productImage}
                        alt={item.productName}
                        className="w-10 h-10 rounded-lg object-cover bg-slate-100 border border-slate-200/90 shrink-0 shadow-2xs"
                        referrerPolicy="no-referrer"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-lg bg-slate-100 border border-slate-200/90 flex items-center justify-center text-slate-400 shrink-0">
                        <ShoppingBag className="w-4 h-4 text-slate-400" />
                      </div>
                    )}

                    {/* Product Name & Measurement */}
                    <div className="min-w-0 flex-1">
                      <div
                        className={`font-bold text-xs sm:text-sm truncate ${
                          !isAvail
                            ? 'line-through text-slate-400'
                            : isChecked
                            ? 'text-slate-800'
                            : 'text-slate-900'
                        }`}
                      >
                        {item.productName}
                      </div>

                      <div className="flex items-center flex-wrap gap-1.5 text-xs text-slate-500 mt-0.5">
                        <span className="font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-1.5 py-0.2 rounded text-[10px]">
                          {item.orderedQuantityDisplay}
                        </span>
                        {item.quantityCount && item.quantityCount > 1 && (
                          <span className="text-slate-500 text-[10px]">× {item.quantityCount}</span>
                        )}
                        <span className="text-slate-300">•</span>
                        <span className="font-mono text-[10px] text-slate-500">
                          ₹{item.basePriceAtOrderTime}/{item.baseUnit}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Line Total & One-Tap Packing Button */}
                  <div className="flex items-center space-x-2 shrink-0">
                    <div className="text-right">
                      <div className="font-mono font-black text-slate-900 text-xs sm:text-sm">
                        ₹{item.lineItemTotal.toFixed(0)}
                      </div>
                    </div>

                    {/* One-Tap Pack / Packed Button */}
                    {isAvail ? (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleItem(currentOrder.id, item.productId);
                        }}
                        className={`py-1.5 px-2.5 rounded-xl font-bold text-xs flex items-center space-x-1.5 transition-all cursor-pointer shadow-2xs shrink-0 select-none ${
                          isChecked
                            ? 'bg-emerald-600 border border-emerald-600 text-white hover:bg-emerald-700 shadow-emerald-700/20'
                            : 'bg-white border border-slate-300 text-slate-700 hover:border-emerald-500 hover:bg-emerald-50/40'
                        }`}
                      >
                        {isChecked ? (
                          <>
                            <div className="w-4 h-4 rounded-md bg-white text-emerald-700 flex items-center justify-center shrink-0 shadow-2xs">
                              <Check className="w-3.5 h-3.5 stroke-[3.5px]" />
                            </div>
                            <span className="font-extrabold whitespace-nowrap text-[11px] sm:text-xs">
                              {language === 'hi' ? '✓ पैक हो गया' : '✓ Packed'}
                            </span>
                          </>
                        ) : (
                          <>
                            <div className="w-4 h-4 rounded-md border-2 border-slate-400 bg-white shrink-0" />
                            <span className="font-bold whitespace-nowrap text-[11px] sm:text-xs">
                              {language === 'hi' ? '☐ पैक करें' : '☐ Pack'}
                            </span>
                          </>
                        )}
                      </button>
                    ) : (
                      <div className="py-1.5 px-2 rounded-xl bg-red-100 border border-red-200 text-red-800 font-bold text-[11px] flex items-center space-x-1 shrink-0">
                        <X className="w-3.5 h-3.5 text-red-600 stroke-[3px]" />
                        <span className="whitespace-nowrap">{language === 'hi' ? '❌ उपलब्ध नहीं' : 'Unavailable'}</span>
                      </div>
                    )}

                    {/* Small Availability Toggle */}
                    <button
                      type="button"
                      title={isAvail ? 'Mark as Out of Stock' : 'Mark as Available'}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleAvailability(currentOrder.id, item.productId);
                      }}
                      className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
                    >
                      <span className="text-[10px] text-slate-400">
                        {isAvail ? '⋮' : '↺'}
                      </span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Action Footer Button */}
          <div className="pt-2 space-y-2">
            <button
              type="button"
              disabled={isFinishing || !readyToDispatch}
              onClick={() => handleFinishPacking(currentOrder)}
              className={`w-full py-3.5 px-4 rounded-xl font-black text-xs sm:text-sm shadow-sm flex items-center justify-center space-x-2 transition-all cursor-pointer ${
                readyToDispatch
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-700/20 shadow-md'
                  : 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
              }`}
            >
              {isFinishing ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>
                    {readyToDispatch
                      ? isPickup
                        ? (language === 'hi' ? '✓ पैकिंग पूरी करें • पिकअप कोड तैयार करें' : '✓ Complete Packing • Ready for Pickup')
                        : (language === 'hi' ? '✓ पैकिंग पूरी करें • डिलीवरी के लिए भेजें' : '✓ Complete Packing • Dispatch for Delivery')
                      : `${language === 'hi' ? 'सामान पैक करें' : 'Pack all items'} (${totalAvailCount - packedCount} ${language === 'hi' ? 'बाकी' : 'left'})`}
                  </span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => onViewOrderDetails(currentOrder)}
              className="w-full text-center text-xs font-bold text-slate-600 hover:text-emerald-700 py-1 cursor-pointer"
            >
              {language === 'hi' ? 'पूरा आर्डर व बिल विवरण देखें →' : 'View Full Bill & Customer Details →'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

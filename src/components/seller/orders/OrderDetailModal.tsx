/**
 * Order Detail & State Progression Modal (Screens 5 & 6)
 * Clean, compact bill layout with item-by-item availability check,
 * transparent refund calculation, and state progression.
 */

import React, { useState, useMemo } from 'react';
import {
  X,
  User,
  Phone,
  MapPin,
  Clock,
  ShoppingBag,
  Truck,
  CheckCircle2,
  XCircle,
  AlertCircle,
  IndianRupee,
  ShieldCheck,
  PackageCheck,
  ArrowRight,
  KeyRound,
  FileText,
  Check,
  RotateCcw,
} from 'lucide-react';
import { Order, OrderStatus, FulfillmentType, OrderItem } from '../../../types/order.ts';
import { OrderStatusBadge } from '../../common/OrderStatusBadge.tsx';
import { useSellerLanguage } from '../../../context/SellerLanguageContext.tsx';
import confetti from 'canvas-confetti';

interface OrderDetailModalProps {
  order: Order | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdateStatus: (orderId: string, targetStatus: OrderStatus, note?: string) => Promise<void>;
  onOpenPacking?: (order: Order) => void;
  onOpenPickupVerification?: (order: Order) => void;
}

export const OrderDetailModal: React.FC<OrderDetailModalProps> = ({
  order,
  isOpen,
  onClose,
  onUpdateStatus,
  onOpenPacking,
  onOpenPickupVerification,
}) => {
  const { language, t } = useSellerLanguage();
  const [isUpdating, setIsUpdating] = useState(false);
  const [customNote, setCustomNote] = useState('');

  // Item availability state map: { [productId]: boolean }
  const [itemAvailability, setItemAvailability] = useState<Record<string, boolean>>({});
  // Item packed state map: { [productId]: boolean }
  const [itemPacked, setItemPacked] = useState<Record<string, boolean>>({});

  // Reset local item states when order changes
  React.useEffect(() => {
    if (order) {
      const availMap: Record<string, boolean> = {};
      const packedMap: Record<string, boolean> = {};
      order.items.forEach((item) => {
        availMap[item.productId] = item.isAvailable !== false;
        packedMap[item.productId] = item.isPacked === true;
      });
      setItemAvailability(availMap);
      setItemPacked(packedMap);
    }
  }, [order?.id]);

  // Calculate financials based on availability (hook called unconditionally)
  const {
    availableItems,
    unavailableItems,
    originalSubtotal,
    refundAmount,
    adjustedSubtotal,
    adjustedCustomerTotal,
    adjustedCommission,
    adjustedSellerNet,
  } = useMemo(() => {
    if (!order) {
      return {
        availableItems: [],
        unavailableItems: [],
        originalSubtotal: 0,
        refundAmount: 0,
        adjustedSubtotal: 0,
        adjustedCustomerTotal: 0,
        adjustedCommission: 0,
        adjustedSellerNet: 0,
      };
    }

    const origSubtotal = order.financials.itemSubtotal;
    let refund = 0;

    const avail: OrderItem[] = [];
    const unavail: OrderItem[] = [];

    order.items.forEach((item) => {
      const isAvail = itemAvailability[item.productId] !== false;
      if (isAvail) {
        avail.push(item);
      } else {
        unavail.push(item);
        refund += item.lineItemTotal;
      }
    });

    const adjSubtotal = Math.max(0, origSubtotal - refund);
    const adjCustomerTotal = Math.max(
      0,
      adjSubtotal + (order.financials.deliveryFee || 0) + (order.financials.platformFee || 0)
    );
    const commissionPercent = order.financials.commissionPercentage || 5;
    const adjCommission = (adjSubtotal * commissionPercent) / 100;
    const adjSellerNet = Math.max(0, adjSubtotal - adjCommission);

    return {
      availableItems: avail,
      unavailableItems: unavail,
      originalSubtotal: origSubtotal,
      refundAmount: refund,
      adjustedSubtotal: adjSubtotal,
      adjustedCustomerTotal: adjCustomerTotal,
      adjustedCommission: adjCommission,
      adjustedSellerNet: adjSellerNet,
    };
  }, [order, itemAvailability]);

  if (!isOpen || !order) return null;

  const handleToggleAvailability = (productId: string) => {
    setItemAvailability((prev) => ({
      ...prev,
      [productId]: !prev[productId],
    }));
  };

  const handleTogglePacked = (productId: string) => {
    setItemPacked((prev) => ({
      ...prev,
      [productId]: !prev[productId],
    }));
  };

  const handleStatusChange = async (targetStatus: OrderStatus, note?: string) => {
    setIsUpdating(true);
    try {
      let finalNote = note || customNote;
      if (unavailableItems.length > 0) {
        finalNote += ` [${unavailableItems.length} items unavailable, refund ₹${refundAmount.toFixed(2)}]`;
      }
      await onUpdateStatus(order.id, targetStatus, finalNote);
      if (targetStatus === OrderStatus.COMPLETED) {
        confetti({ particleCount: 80, spread: 60, origin: { y: 0.6 } });
      }
    } catch (err) {
      console.error('Failed to transition order status', err);
    } finally {
      setIsUpdating(false);
    }
  };

  const getStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case OrderStatus.CONFIRMED:
        return { bg: 'bg-amber-50 border-amber-200 text-amber-800', text: t('status.CONFIRMED') };
      case OrderStatus.ACCEPTED:
        return { bg: 'bg-blue-50 border-blue-200 text-blue-800', text: t('status.ACCEPTED') };
      case OrderStatus.PREPARING:
        return { bg: 'bg-purple-50 border-purple-200 text-purple-800', text: t('status.PREPARING') };
      case OrderStatus.READY_FOR_PICKUP:
        return { bg: 'bg-teal-50 border-teal-200 text-teal-800', text: t('status.READY_FOR_PICKUP') };
      case OrderStatus.OUT_FOR_DELIVERY:
        return { bg: 'bg-indigo-50 border-indigo-200 text-indigo-800', text: t('status.OUT_FOR_DELIVERY') };
      case OrderStatus.ARRIVED:
        return { bg: 'bg-purple-50 border-purple-200 text-purple-800', text: language === 'hi' ? 'पहुंच गया' : 'Arrived' };
      case OrderStatus.COMPLETED:
        return { bg: 'bg-emerald-50 border-emerald-200 text-emerald-800', text: t('status.COMPLETED') };
      case OrderStatus.CANCELLED:
        return { bg: 'bg-red-50 border-red-200 text-red-800', text: t('status.CANCELLED') };
      default:
        return { bg: 'bg-slate-100 border-slate-200 text-slate-700', text: status };
    }
  };

  const statusBadge = getStatusBadge(order.status);
  const isPickup = order.fulfillmentType === FulfillmentType.STORE_PICKUP;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div
        className="bg-white border border-slate-200 rounded-t-3xl sm:rounded-3xl w-full max-w-lg max-h-[92vh] overflow-y-auto shadow-2xl text-slate-900 flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white/95 backdrop-blur-sm z-10">
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-mono font-black text-base text-slate-900">{order.orderNumber}</span>
              <OrderStatusBadge
                status={order.status}
                variant="light"
                size="sm"
                customLabel={statusBadge.text}
              />
            </div>
            <div className="text-xs text-slate-500 mt-0.5">
              {new Date(order.createdAt).toLocaleString([], {
                dateStyle: 'medium',
                timeStyle: 'short',
              })}
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 space-y-4">
          {/* Customer Header Card */}
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
            <div className="flex items-center space-x-3">
              {/* Customer Profile Photo */}
              {order.customerAvatar && order.customerAvatar.trim() !== '' ? (
                <img
                  src={order.customerAvatar}
                  alt={order.customerName}
                  className="w-12 h-12 rounded-full object-cover shrink-0 border border-slate-200 shadow-2xs"
                  referrerPolicy="no-referrer"
                  loading="lazy"
                />
              ) : (
                <div className="w-12 h-12 rounded-full flex items-center justify-center font-black text-sm shrink-0 border bg-emerald-100 text-emerald-800 border-emerald-300">
                  {order.customerName
                    .split(' ')
                    .filter(Boolean)
                    .map((n) => n[0])
                    .slice(0, 2)
                    .join('')
                    .toUpperCase() || 'CU'}
                </div>
              )}

              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <h2 className="font-extrabold text-sm sm:text-base text-slate-900 truncate">
                    {order.customerName}
                  </h2>
                  <a
                    href={`tel:${order.customerPhone}`}
                    className="flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold hover:bg-emerald-100 transition-colors shrink-0"
                  >
                    <Phone className="w-3 h-3" />
                    <span>Call</span>
                  </a>
                </div>
                <div className="flex items-center flex-wrap gap-x-1.5 gap-y-0.5 text-xs text-slate-500 mt-0.5">
                  <span className="font-mono font-bold text-slate-700">{order.orderNumber}</span>
                  <span>•</span>
                  <span>
                    {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  <span>•</span>
                  <span className={isPickup ? 'text-blue-700 font-semibold' : 'text-purple-700 font-semibold'}>
                    {isPickup ? '🏪 Store Pickup' : '🏠 Home Delivery'}
                  </span>
                </div>
              </div>
            </div>

            {/* Pickup PIN or Delivery Address */}
            {isPickup && order.pickupCode ? (
              <div className="mt-2.5 pt-2 border-t border-slate-200/80 flex items-center justify-between text-xs">
                <span className="font-bold text-blue-900 flex items-center space-x-1">
                  <KeyRound className="w-3.5 h-3.5 text-blue-600" />
                  <span>Pickup PIN:</span>
                </span>
                <span className="font-mono font-black text-sm text-blue-900 tracking-wider bg-blue-100/70 border border-blue-200 px-2 py-0.5 rounded-md">
                  {order.pickupCode}
                </span>
              </div>
            ) : !isPickup && order.deliveryAddress ? (
              <div className="mt-2.5 pt-2 border-t border-slate-200/80 text-xs text-slate-700 flex items-start space-x-1.5">
                <MapPin className="w-3.5 h-3.5 text-purple-600 shrink-0 mt-0.5" />
                <div>
                  <div className="font-medium">{order.deliveryAddress.addressLine1}</div>
                  {order.deliveryAddress.landmark && (
                    <div className="text-slate-500 text-[11px]">
                      Landmark: {order.deliveryAddress.landmark} ({order.deliveryAddress.pincode})
                    </div>
                  )}
                </div>
              </div>
            ) : null}
          </div>

          {/* 🛍️ ORDERED ITEMS List (Compact Grocery Shopping List / Invoice Style) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between px-0.5">
              <h3 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center space-x-1.5">
                <ShoppingBag className="w-3.5 h-3.5 text-emerald-700" />
                <span>{language === 'hi' ? 'ऑर्डर किए गए सामान' : 'ORDERED ITEMS'}</span>
              </h3>
              <span className="text-xs font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full font-mono">
                {order.items.length} {order.items.length === 1 ? 'item' : 'items'}
              </span>
            </div>

            {/* Compact Rows Card */}
            <div className="bg-white rounded-2xl border border-slate-200 divide-y divide-slate-100 overflow-hidden shadow-2xs">
              {order.items.map((item, idx) => {
                const isAvail = itemAvailability[item.productId] !== false;
                const isPacked = itemPacked[item.productId] === true;

                return (
                  <div
                    key={idx}
                    className={`p-3 transition-colors ${
                      isAvail ? 'hover:bg-slate-50/70' : 'bg-red-50/50'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      {/* Left: Product Photo & Details */}
                      <div className="flex items-center space-x-3 min-w-0 flex-1">
                        {item.productImage && item.productImage.trim() !== '' ? (
                          <img
                            src={item.productImage}
                            alt={item.productName}
                            className="w-11 h-11 rounded-xl object-cover bg-slate-100 border border-slate-200/80 shrink-0 shadow-2xs"
                            referrerPolicy="no-referrer"
                            loading="lazy"
                          />
                        ) : (
                          <div className="w-11 h-11 rounded-xl bg-slate-100 border border-slate-200/80 flex items-center justify-center text-slate-400 shrink-0">
                            <ShoppingBag className="w-5 h-5 text-slate-400" />
                          </div>
                        )}

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center space-x-2">
                            <span className={`font-bold text-xs sm:text-sm truncate ${
                              isAvail ? 'text-slate-900' : 'text-slate-500 line-through'
                            }`}>
                              {item.productName}
                            </span>
                          </div>

                          <div className="flex items-center flex-wrap gap-1.5 text-xs text-slate-500 mt-0.5">
                            <span className="font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-1.5 py-0.2 rounded text-[11px]">
                              {item.orderedQuantityDisplay}
                            </span>
                            {item.quantityCount && item.quantityCount > 1 && (
                              <span className="text-slate-500 text-[11px]">× {item.quantityCount}</span>
                            )}
                            <span className="text-slate-300">•</span>
                            <span className="font-mono text-slate-500 text-[11px]">
                              ₹{item.basePriceAtOrderTime}/{item.baseUnit}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Right: Line Price & Availability Check Action */}
                      <div className="flex flex-col items-end space-y-1.5 shrink-0">
                        <div className={`font-mono font-black text-sm ${isAvail ? 'text-slate-900' : 'text-red-600 line-through'}`}>
                          ₹{item.lineItemTotal.toFixed(2)}
                        </div>

                        {/* Availability Toggle Button */}
                        <div className="flex items-center space-x-1.5">
                          <button
                            type="button"
                            onClick={() => handleToggleAvailability(item.productId)}
                            className={`px-2 py-0.5 rounded-lg text-[10px] sm:text-[11px] font-bold border transition-all flex items-center space-x-1 cursor-pointer ${
                              isAvail
                                ? 'bg-emerald-50 border-emerald-200 text-emerald-800 hover:bg-emerald-100'
                                : 'bg-red-100 border-red-300 text-red-800'
                            }`}
                          >
                            {isAvail ? (
                              <>
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                <span>{language === 'hi' ? 'उपलब्ध ✅' : 'Available ✅'}</span>
                              </>
                            ) : (
                              <>
                                <XCircle className="w-3 h-3 text-red-600" />
                                <span>{language === 'hi' ? 'अनुपलब्ध ❌' : 'Out of Stock ❌'}</span>
                              </>
                            )}
                          </button>

                          {/* Packed badge / toggle if order is ACCEPTED or PREPARING */}
                          {(order.status === OrderStatus.ACCEPTED || order.status === OrderStatus.PREPARING) && isAvail && (
                            <button
                              type="button"
                              onClick={() => handleTogglePacked(item.productId)}
                              className={`px-1.5 py-0.5 rounded-lg text-[10px] font-bold border transition-all flex items-center space-x-0.5 cursor-pointer ${
                                isPacked
                                  ? 'bg-purple-100 border-purple-300 text-purple-900'
                                  : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                              }`}
                            >
                              {isPacked ? (
                                <>
                                  <Check className="w-2.5 h-2.5 text-purple-700" />
                                  <span>{language === 'hi' ? 'पैक' : 'Packed'}</span>
                                </>
                              ) : (
                                <span>{language === 'hi' ? 'पैक?' : 'Pack?'}</span>
                              )}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

              {/* Unavailable Items Refund Banner if any */}
            {unavailableItems.length > 0 && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-900 space-y-1">
                <div className="font-bold flex items-center space-x-1.5 text-red-800">
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                  <span>
                    {unavailableItems.length} {language === 'hi' ? 'सामान अनुपलब्ध मार्क किया गया' : 'item(s) marked unavailable'}
                  </span>
                </div>
                <p className="text-[11px] text-red-700">
                  {language === 'hi'
                    ? `ग्राहक को ₹${refundAmount.toFixed(2)} का रिफंड उनके मूल UPI/खाते में स्वतः वापस होगा। बिल को नीचे समायोजित किया गया है।`
                    : `₹${refundAmount.toFixed(2)} will be refunded to customer's UPI/account. Bill adjusted below.`}
                </p>
              </div>
            )}
          </div>

          {/* Financial Breakdown & Receipt Card */}
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
            <h3 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center space-x-1.5">
              <IndianRupee className="w-3.5 h-3.5 text-emerald-700" />
              <span>{language === 'hi' ? 'बिल व हिसाब विवरण' : 'Financial Breakdown'}</span>
            </h3>

            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>{t('order.subtotal')} ({order.items.length} items)</span>
                <span className="font-mono font-medium">₹{originalSubtotal.toFixed(2)}</span>
              </div>

              {refundAmount > 0 && (
                <div className="flex justify-between text-red-600 font-bold bg-red-50/80 px-2 py-1 rounded-lg border border-red-100">
                  <span>{language === 'hi' ? 'अनुपलब्ध सामान कटौती (रिफंड)' : 'Unavailable Item Deduction (Refund)'}</span>
                  <span className="font-mono">- ₹{refundAmount.toFixed(2)}</span>
                </div>
              )}

              {order.financials.deliveryFee > 0 && (
                <div className="flex justify-between text-slate-600">
                  <span>{t('order.delivery_fee')}</span>
                  <span className="font-mono font-medium">₹{order.financials.deliveryFee.toFixed(2)}</span>
                </div>
              )}

              <div className="flex justify-between text-slate-500 text-[11px]">
                <span>{t('order.platform_fee')}</span>
                <span className="font-mono">₹{order.financials.platformFee.toFixed(2)}</span>
              </div>

              <div className="pt-2 border-t border-slate-200 flex justify-between text-slate-900 font-bold">
                <span className="flex items-center space-x-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>{refundAmount > 0 ? (language === 'hi' ? 'संशोधित ग्राहक भुगतान' : 'Adjusted Paid Amount') : t('order.customer_paid')}</span>
                </span>
                <span className="font-mono text-sm text-slate-900 font-black">
                  ₹{adjustedCustomerTotal.toFixed(2)}
                </span>
              </div>

              {/* Commission deduction transparency */}
              <div className="p-2.5 rounded-xl bg-white border border-slate-200 space-y-1 text-[11px] mt-2">
                <div className="flex justify-between text-slate-500">
                  <span>Platform Fee ({order.financials.commissionPercentage}%)</span>
                  <span className="font-mono">- ₹{adjustedCommission.toFixed(2)}</span>
                </div>
                <div className="pt-1 border-t border-slate-100 flex justify-between text-emerald-800 font-black text-xs">
                  <span>{t('order.seller_receivable')}</span>
                  <span className="font-mono text-sm text-emerald-700">₹{adjustedSellerNet.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Timeline History */}
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
            <h3 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center space-x-1.5">
              <Clock className="w-3.5 h-3.5 text-slate-500" />
              <span>{language === 'hi' ? 'आर्डर टाइमलाइन' : 'Order Timeline'}</span>
            </h3>

            <div className="space-y-1.5">
              {order.statusHistory.map((history, idx) => (
                <div key={idx} className="flex items-start space-x-2 text-xs">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                  <div>
                    <div className="font-semibold text-slate-800">
                      {history.status}
                      {history.note && <span className="font-normal text-slate-500 ml-1.5">- {history.note}</span>}
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono">
                      {new Date(history.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* State Machine Action Controls Footer */}
        <div className="p-4 border-t border-slate-100 bg-white sticky bottom-0 z-10 space-y-2 shadow-xs">
          {order.status === OrderStatus.CONFIRMED && (
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                disabled={isUpdating}
                onClick={() => handleStatusChange(OrderStatus.CANCELLED, 'Seller rejected order')}
                className="py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-red-50 border border-slate-300 hover:border-red-300 text-slate-700 hover:text-red-700 text-xs font-bold transition-colors"
              >
                {t('order.reject')}
              </button>
              <button
                type="button"
                disabled={isUpdating}
                onClick={() => handleStatusChange(OrderStatus.ACCEPTED, 'Order accepted by seller')}
                className="py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black shadow-sm flex items-center justify-center space-x-1.5 transition-all"
              >
                {isUpdating ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{t('order.accept')}</span>
                  </>
                )}
              </button>
            </div>
          )}

          {order.status === OrderStatus.ACCEPTED && (
            <div className="flex space-x-2">
              {onOpenPacking && (
                <button
                  type="button"
                  onClick={() => onOpenPacking(order)}
                  className="flex-1 py-2.5 px-3 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-xs flex items-center justify-center space-x-1.5 transition-all"
                >
                  <PackageCheck className="w-4 h-4" />
                  <span>{language === 'hi' ? 'पैकिंग चेकलिस्ट खोलें' : 'Open Packing Checklist'}</span>
                </button>
              )}
              <button
                type="button"
                disabled={isUpdating}
                onClick={() => handleStatusChange(OrderStatus.PREPARING, 'Packing started')}
                className="py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold border border-slate-200"
              >
                {t('order.start_packing')}
              </button>
            </div>
          )}

          {order.status === OrderStatus.PREPARING && (
            <div className="space-y-2">
              <button
                type="button"
                disabled={isUpdating}
                onClick={() =>
                  handleStatusChange(
                    isPickup ? OrderStatus.READY_FOR_PICKUP : OrderStatus.OUT_FOR_DELIVERY,
                    'Items packed and ready'
                  )
                }
                className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black shadow-sm flex items-center justify-center space-x-1.5 transition-all"
              >
                {isUpdating ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>
                      {isPickup
                        ? (language === 'hi' ? 'पैकिंग पूर्ण • पिकअप हेतु तैयार (Ready for Pickup)' : 'Mark Ready for Pickup')
                        : (language === 'hi' ? 'पैकिंग पूर्ण • डिलीवरी हेतु रवाना (Dispatch Delivery)' : 'Dispatch for Delivery')}
                    </span>
                  </>
                )}
              </button>
            </div>
          )}

          {order.status === OrderStatus.READY_FOR_PICKUP && (
            <div className="space-y-2">
              {onOpenPickupVerification ? (
                <button
                  type="button"
                  onClick={() => onOpenPickupVerification(order)}
                  className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-black shadow-sm flex items-center justify-center space-x-2 transition-all"
                >
                  <KeyRound className="w-4 h-4" />
                  <span>{t('order.verify_pickup_pin', 'Verify 4-Digit Pickup PIN')}</span>
                </button>
              ) : (
                <button
                  type="button"
                  disabled={isUpdating}
                  onClick={() => handleStatusChange(OrderStatus.COMPLETED, 'Handed over at store counter')}
                  className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black shadow-sm"
                >
                  {language === 'hi' ? 'हैंडओवर पूर्ण (Complete Handover)' : 'Complete Handover'}
                </button>
              )}
            </div>
          )}

          {order.status === OrderStatus.OUT_FOR_DELIVERY && (
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                disabled={isUpdating}
                onClick={() => handleStatusChange(OrderStatus.ARRIVED, 'Delivery partner arrived at doorstep')}
                className="py-2.5 px-3 rounded-xl bg-purple-50 hover:bg-purple-100 border border-purple-200 text-purple-800 text-xs font-bold flex items-center justify-center space-x-1 transition-all"
              >
                <MapPin className="w-4 h-4" />
                <span>{language === 'hi' ? 'पते पर पहुंचे (Arrived)' : 'Arrived at Address'}</span>
              </button>
              <button
                type="button"
                disabled={isUpdating}
                onClick={() => handleStatusChange(OrderStatus.COMPLETED, 'Delivered to customer address')}
                className="py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black shadow-sm flex items-center justify-center space-x-1 transition-all"
              >
                {isUpdating ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{language === 'hi' ? 'डिलीवर हुआ (Delivered)' : 'Delivered'}</span>
                  </>
                )}
              </button>
            </div>
          )}

          {order.status === OrderStatus.ARRIVED && (
            <button
              type="button"
              disabled={isUpdating}
              onClick={() => handleStatusChange(OrderStatus.COMPLETED, 'Handover completed successfully')}
              className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black shadow-sm flex items-center justify-center space-x-1.5 transition-all"
            >
              {isUpdating ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{language === 'hi' ? 'हैंडओवर / डिलीवरी पूर्ण करें (Complete Order)' : 'Complete Order Handover'}</span>
                </>
              )}
            </button>
          )}

          {order.status === OrderStatus.COMPLETED && (
            <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-center text-xs text-emerald-800 font-bold flex items-center justify-center space-x-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>{language === 'hi' ? 'यह आर्डर सफलतापूर्वक पूरा हो चुका है' : 'Order successfully completed'}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

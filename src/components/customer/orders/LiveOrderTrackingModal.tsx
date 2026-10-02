/**
 * Screen 8 — Customer Live Order Tracking Modal & View
 * 
 * 1. Top Header: "← मेरा ऑर्डर", Order ID (#ORD123456), Close button & Live Status refresh
 * 2. Shop Details & Fulfillment Badge (🏠 Home Delivery / 🏪 Store Pickup)
 * 3. Timeline Progress:
 *    ✓ ऑर्डर कन्फर्म हुआ (Payment Verified)
 *    ✓ दुकान ने स्वीकार किया (Accepted by Shop)
 *    ✓ सामान तैयार हो रहा है (Weighing & Packing)
 *    ○ सामान तैयार है (Ready at Counter / Out for Delivery)
 *    ○ पूरा हुआ (Delivered / Completed)
 * 4. Prominent 4-Digit Pickup PIN Card for Store Pickup:
 *    "🏪 दुकान से पिकअप करें"
 *    "आपका Pickup PIN: [ 1 2 3 4 ]"
 *    "दुकान पर यह PIN दिखाएँ"
 * 5. Delivery details for Home Delivery (Address, Estimated ETA, Call button)
 */

import React, { useState, useEffect } from 'react';
import { Order, OrderStatus, FulfillmentType } from '../../../types/order.ts';
import { useCustomerLanguage } from '../../../context/CustomerLanguageContext.tsx';
import { customerApi } from '../../../services/customerApi.ts';
import { OrderStatusBadge } from '../../common/OrderStatusBadge.tsx';
import {
  Package,
  Store,
  Bike,
  ShieldCheck,
  RefreshCw,
  AlertCircle,
  Copy,
  Check,
  Clock,
  MapPin,
  Phone,
  ArrowLeft,
  Sparkles,
} from 'lucide-react';

interface LiveOrderTrackingModalProps {
  order: Order | null;
  isOpen: boolean;
  onClose: () => void;
}

export const LiveOrderTrackingModal: React.FC<LiveOrderTrackingModalProps> = ({
  order: initialOrder,
  isOpen,
  onClose,
}) => {
  const { language, t } = useCustomerLanguage();
  const [order, setOrder] = useState<Order | null>(initialOrder);
  const [isCopiedPin, setIsCopiedPin] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    setOrder(initialOrder);
  }, [initialOrder]);

  // Auto-polling every 5 seconds for live seller status updates
  useEffect(() => {
    if (!isOpen || !order?.id) return;
    if (order.status === OrderStatus.COMPLETED || order.status === OrderStatus.CANCELLED) return;

    let isPolling = true;

    const interval = setInterval(async () => {
      if (!isPolling) return;
      try {
        const latest = await customerApi.getOrderDetails(order.id);
        if (latest && isPolling) {
          setOrder(latest);
          if (latest.status === OrderStatus.COMPLETED || latest.status === OrderStatus.CANCELLED) {
            isPolling = false;
            clearInterval(interval);
          }
        }
      } catch (err: any) {
        if (err?.message?.includes('not found') || err?.message?.includes('404')) {
          isPolling = false;
          clearInterval(interval);
        }
      }
    }, 5000);

    return () => {
      isPolling = false;
      clearInterval(interval);
    };
  }, [isOpen, order?.id, order?.status]);

  const handleManualRefresh = async () => {
    if (!order?.id) return;
    setIsRefreshing(true);
    try {
      const latest = await customerApi.getOrderDetails(order.id);
      if (latest) setOrder(latest);
    } catch {
      // Gracefully ignore refresh errors
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleCopyPin = () => {
    const pin = order?.pickupCode;
    if (pin) {
      navigator.clipboard?.writeText(pin);
      setIsCopiedPin(true);
      setTimeout(() => setIsCopiedPin(false), 2000);
    }
  };

  if (!isOpen || !order) return null;

  const isPickup = order.fulfillmentType === FulfillmentType.STORE_PICKUP;
  const isTerminal = order.status === OrderStatus.COMPLETED || order.status === OrderStatus.CANCELLED;
  const pickupPin = order.pickupCode;
  const totalPayable = order.financials?.customerTotal ?? 0;
  const orderIdShort = `#ORD${order.id.slice(-6).toUpperCase()}`;

  // Timeline Steps
  const timelineSteps = [
    {
      status: OrderStatus.CONFIRMED,
      titleEn: 'Order Confirmed',
      titleHi: 'ऑर्डर कन्फर्म हुआ',
      descEn: 'Payment verified & sent to shop',
      descHi: 'भुगतान सफल • दुकान को भेजा गया',
    },
    {
      status: OrderStatus.ACCEPTED,
      titleEn: 'Accepted by Shopkeeper',
      titleHi: 'दुकानदार ने स्वीकार किया',
      descEn: `${order.shopName || 'Shopkeeper'} reviewed & accepted`,
      descHi: 'दुकानदार ने ऑर्डर स्वीकार कर लिया',
    },
    {
      status: OrderStatus.PREPARING,
      titleEn: 'Weighing & Packing',
      titleHi: 'सामान तैयार हो रहा है',
      descEn: 'Portions weighed and packed',
      descHi: 'सामग्री तौली और पैक की जा रही है',
    },
    {
      status: isPickup ? OrderStatus.READY_FOR_PICKUP : OrderStatus.OUT_FOR_DELIVERY,
      titleEn: isPickup ? 'Ready at Counter' : 'Out for Delivery',
      titleHi: isPickup ? 'सामान तैयार है (पिकअप)' : 'डिलीवरी के लिए रवाना',
      descEn: isPickup ? 'Show 4-digit PIN at shop counter' : 'Rider arriving at your doorstep',
      descHi: isPickup ? 'काउंटर पर ४-अंकों का पिन दिखाकर प्राप्त करें' : 'डिलीवरी पार्टनर रास्ते में है',
    },
    {
      status: OrderStatus.COMPLETED,
      titleEn: 'Completed',
      titleHi: 'ऑर्डर पूरा हुआ',
      descEn: 'Handover verified and completed',
      descHi: 'सामान सफलतापूर्वक प्राप्त हुआ',
    },
  ];

  const getStepIndex = (status: OrderStatus): number => {
    switch (status) {
      case OrderStatus.PAYMENT_PENDING:
      case OrderStatus.CONFIRMED:
        return 0;
      case OrderStatus.ACCEPTED:
        return 1;
      case OrderStatus.PREPARING:
        return 2;
      case OrderStatus.READY_FOR_PICKUP:
      case OrderStatus.OUT_FOR_DELIVERY:
        return 3;
      case OrderStatus.COMPLETED:
        return 4;
      case OrderStatus.CANCELLED:
        return -1;
      default:
        return 0;
    }
  };

  const currentStepIdx = getStepIndex(order.status);

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="bg-white border border-slate-200 rounded-t-3xl sm:rounded-3xl w-full max-w-md p-4 space-y-4 shadow-2xl max-h-[92vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 1. Header with Back/Close, Order ID & Live Pulse */}
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <div className="flex items-center gap-1.5">
                <h2 className="text-sm font-black text-slate-900">
                  {language === 'hi' ? 'मेरा ऑर्डर' : 'My Order'}
                </h2>
                {!isTerminal && (
                  <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
                )}
              </div>
              <p className="text-[10px] text-slate-500 font-mono">{orderIdShort}</p>
            </div>
          </div>

          <button
            onClick={handleManualRefresh}
            className={`p-1.5 rounded-xl bg-slate-100 text-slate-600 hover:text-slate-900 transition-all ${
              isRefreshing ? 'animate-spin' : ''
            }`}
            title="Refresh Status"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* 2. Shop Details & Fulfillment Badge */}
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 space-y-2">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs font-bold text-slate-900 flex items-center gap-1">
                <span>{order.shopName || 'Local Mandi Merchant'}</span>
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">
                {order.items.length} {language === 'hi' ? 'सामान' : 'items'} • ₹{totalPayable}
              </div>
            </div>

            {/* Badges: Fulfillment & Status */}
            <div className="flex flex-col items-end gap-1.5 shrink-0">
              <div
                className={`px-2.5 py-0.5 rounded-lg text-[10px] font-bold flex items-center gap-1 ${
                  isPickup
                    ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                    : 'bg-indigo-100 text-indigo-900 border border-indigo-300'
                }`}
              >
                {isPickup ? <Store className="w-3 h-3" /> : <Bike className="w-3 h-3" />}
                <span>{isPickup ? 'Store Pickup' : 'Home Delivery'}</span>
              </div>
              <OrderStatusBadge
                status={order.status}
                language={language}
                variant="customer"
                size="sm"
              />
            </div>
          </div>
        </div>

        {/* 3. Prominent 4-Digit Pickup PIN Card (For Store Pickup Orders) */}
        {isPickup && pickupPin && order.status !== OrderStatus.COMPLETED && (
          <div className="bg-emerald-50 border-2 border-emerald-500 rounded-3xl p-4 text-center space-y-2 shadow-xs">
            <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-emerald-900 uppercase tracking-wider">
              <Store className="w-4 h-4 text-emerald-700" />
              <span>{language === 'hi' ? 'दुकान से पिकअप करें' : 'Store Pickup PIN'}</span>
            </div>

            <div className="text-[11px] text-slate-600">
              {language === 'hi' ? 'आपका Pickup PIN:' : 'Your Pickup PIN:'}
            </div>

            {/* Giant 4-digit PIN numbers */}
            <div className="flex items-center justify-center gap-2.5 py-1">
              {pickupPin.split('').map((digit, i) => (
                <div
                  key={i}
                  className="w-12 h-14 rounded-2xl bg-white border-2 border-emerald-400 flex items-center justify-center text-2xl font-black text-emerald-900 shadow-sm"
                >
                  {digit}
                </div>
              ))}
            </div>

            <p className="text-[11px] font-bold text-emerald-800">
              {language === 'hi' ? 'दुकान पर यह PIN दिखाएँ' : 'Show this PIN at shop counter'}
            </p>

            <button
              onClick={handleCopyPin}
              className="inline-flex items-center gap-1 px-3 py-1 rounded-xl bg-white border border-emerald-300 hover:bg-emerald-100 text-emerald-800 text-[11px] font-bold transition-all shadow-2xs"
            >
              {isCopiedPin ? (
                <>
                  <Check className="w-3 h-3 text-emerald-700" />
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3" />
                  <span>Copy PIN</span>
                </>
              )}
            </button>
          </div>
        )}

        {/* 4. Home Delivery Address Info (For Delivery Orders) */}
        {!isPickup && order.deliveryAddress && (
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 text-xs space-y-1.5">
            <div className="flex items-center gap-1.5 font-bold text-slate-900">
              <MapPin className="w-3.5 h-3.5 text-emerald-600" />
              <span>{language === 'hi' ? 'डिलीवरी पता' : 'Delivery Address'}</span>
            </div>
            <p className="text-slate-600 leading-relaxed text-[11px]">
              {order.deliveryAddress.streetAddress}, {order.deliveryAddress.area}, Mumbai
            </p>
            <div className="flex items-center gap-1 text-[11px] text-emerald-700 font-bold pt-1">
              <Clock className="w-3 h-3" />
              <span>{language === 'hi' ? 'अनुमानित समय: 20–25 मिनट' : 'Estimated: 20–25 min'}</span>
            </div>
          </div>
        )}

        {/* 5. Live State Machine Timeline */}
        {order.status === OrderStatus.CANCELLED ? (
          <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 text-center space-y-1 text-rose-800 text-xs">
            <AlertCircle className="w-6 h-6 text-rose-600 mx-auto" />
            <div className="font-bold">ऑर्डर रद्द कर दिया गया • Order Cancelled</div>
          </div>
        ) : (
          <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-3 shadow-2xs">
            <div className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              {language === 'hi' ? 'ऑर्डर की स्थिति' : 'Order Status Timeline'}
            </div>

            <div className="space-y-4 relative pl-6">
              {/* Vertical connecting line */}
              <div className="absolute left-2.5 top-2 bottom-2 w-0.5 bg-slate-200" />

              {timelineSteps.map((step, idx) => {
                const isPassed = currentStepIdx > idx || order.status === OrderStatus.COMPLETED;
                const isCurrent = currentStepIdx === idx && order.status !== OrderStatus.COMPLETED;

                return (
                  <div key={step.status} className="relative flex items-start gap-3">
                    {/* Circle Node */}
                    <div
                      className={`absolute -left-6 top-0.5 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold transition-all ${
                        isPassed
                          ? 'bg-emerald-600 text-white shadow-2xs'
                          : isCurrent
                          ? 'bg-amber-500 text-white animate-pulse ring-4 ring-amber-100'
                          : 'bg-white border-2 border-slate-300 text-slate-400'
                      }`}
                    >
                      {isPassed ? <Check className="w-3 h-3" /> : idx + 1}
                    </div>

                    {/* Step Title & Details */}
                    <div>
                      <div
                        className={`text-xs font-bold ${
                          isPassed || isCurrent ? 'text-slate-900' : 'text-slate-400'
                        }`}
                      >
                        {language === 'hi' ? step.titleHi : step.titleEn}
                      </div>
                      <div className="text-[10px] text-slate-500">
                        {language === 'hi' ? step.descHi : step.descEn}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 6. Itemized Order Summary */}
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 space-y-2">
          <div className="text-xs font-bold text-slate-900">
            {language === 'hi' ? 'सामान विवरण' : 'Ordered Items'}
          </div>

          <div className="space-y-1.5 divide-y divide-slate-200/60 text-xs">
            {order.items.map((item, i) => (
              <div key={i} className="pt-1 flex items-center justify-between">
                <div className="min-w-0">
                  <div className="font-bold text-slate-900 truncate">{item.name}</div>
                  <div className="text-[10px] text-slate-500">{item.portionLabel}</div>
                </div>
                <div className="font-bold text-slate-900 shrink-0">₹{item.totalPrice}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="w-full py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-colors"
        >
          {language === 'hi' ? 'बंद करें' : 'Close'}
        </button>
      </div>
    </div>
  );
};

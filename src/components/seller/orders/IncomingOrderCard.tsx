/**
 * Incoming New Order Card (Screen 4)
 * High-priority, compact, and clean order card for the Seller Home dashboard.
 */

import React from 'react';
import {
  BellRing,
  Clock,
  User,
  ShoppingBag,
  Truck,
  Check,
  X,
  ChevronRight,
  ShieldCheck,
  Phone,
} from 'lucide-react';
import { Order, OrderStatus, FulfillmentType } from '../../../types/order.ts';
import { useSellerLanguage } from '../../../context/SellerLanguageContext.tsx';
import { calculateOrderTotal } from '../../../services/pricingEngine.ts';

interface IncomingOrderCardProps {
  order: Order;
  onAccept: (orderId: string) => void;
  onReject: (orderId: string) => void;
  onViewDetails: (order: Order) => void;
  isAccepting?: boolean;
}

export const IncomingOrderCard: React.FC<IncomingOrderCardProps> = ({
  order,
  onAccept,
  onReject,
  onViewDetails,
  isAccepting,
}) => {
  const { language, t } = useSellerLanguage();
  const isPickup = order.fulfillmentType === FulfillmentType.STORE_PICKUP;

  return (
    <div className="rounded-2xl bg-white border-2 border-emerald-500/80 shadow-md p-4 space-y-3 relative overflow-hidden">
      {/* Alert Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="w-7 h-7 rounded-lg bg-emerald-100 border border-emerald-300 flex items-center justify-center text-emerald-800">
            <BellRing className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center space-x-1.5">
              <span className="font-extrabold text-[11px] text-emerald-700 uppercase tracking-wider">
                {language === 'hi' ? 'नया भुगतान प्राप्त आर्डर' : 'New Paid Order'}
              </span>
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            </div>
            <span className="font-mono font-black text-slate-900 text-sm">{order.orderNumber}</span>
          </div>
        </div>

        <div className="text-right flex items-center space-x-2">
          <span className="inline-flex items-center space-x-1 text-[11px] text-emerald-800 font-bold bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
            <ShieldCheck className="w-3 h-3" />
            <span>UPI Paid</span>
          </span>
          <span className="text-[11px] text-slate-500 font-mono">
            {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
      </div>

      {/* Customer & Fulfillment Info */}
      <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
        <div className="flex items-center space-x-2.5 min-w-0">
          {order.customerAvatar && order.customerAvatar.trim() !== '' ? (
            <img
              src={order.customerAvatar}
              alt={order.customerName}
              className="w-9 h-9 rounded-full object-cover shrink-0 border border-slate-200 shadow-2xs"
              referrerPolicy="no-referrer"
              loading="lazy"
            />
          ) : (
            <div className="w-9 h-9 rounded-full bg-emerald-100 border border-emerald-300 flex items-center justify-center text-emerald-800 font-bold text-xs shrink-0">
              {order.customerName
                .split(' ')
                .filter(Boolean)
                .map((n) => n[0])
                .slice(0, 2)
                .join('')
                .toUpperCase() || 'CU'}
            </div>
          )}
          <div className="min-w-0">
            <div className="font-bold text-xs text-slate-900 truncate">{order.customerName}</div>
            <a
              href={`tel:${order.customerPhone}`}
              onClick={(e) => e.stopPropagation()}
              className="text-[11px] text-emerald-700 hover:underline flex items-center space-x-1 font-medium"
            >
              <Phone className="w-2.5 h-2.5" />
              <span>{order.customerPhone}</span>
            </a>
          </div>
        </div>

        <div className={`flex items-center space-x-1 px-2.5 py-1 rounded-lg border text-[11px] font-bold ${
          isPickup
            ? 'bg-blue-50 border-blue-200 text-blue-800'
            : 'bg-purple-50 border-purple-200 text-purple-800'
        }`}>
          {isPickup ? <ShoppingBag className="w-3 h-3" /> : <Truck className="w-3 h-3" />}
          <span>{isPickup ? (language === 'hi' ? 'दुकान पिकअप' : 'Store Pickup') : (language === 'hi' ? 'होम डिलीवरी' : 'Home Delivery')}</span>
        </div>
      </div>

      {/* Items Breakdown (Compact invoice shopping list style) */}
      <div className="space-y-1.5 bg-slate-50/80 p-2.5 rounded-xl border border-slate-200">
        <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center justify-between">
          <span className="flex items-center space-x-1">
            <ShoppingBag className="w-3 h-3 text-emerald-700" />
            <span>{language === 'hi' ? 'ऑर्डर किए गए सामान:' : 'Ordered Items:'}</span>
          </span>
          <span className="font-mono text-slate-600 font-semibold">{order.items.length} items</span>
        </div>

        <div className="space-y-1.5 max-h-40 overflow-y-auto pr-0.5 scrollbar-thin">
          {order.items.map((item, idx) => (
            <div
              key={idx}
              className="p-2 rounded-xl bg-white border border-slate-200/80 flex items-center justify-between gap-2.5 text-xs shadow-2xs"
            >
              <div className="flex items-center space-x-2.5 min-w-0 flex-1">
                {item.productImage && item.productImage.trim() !== '' ? (
                  <img
                    src={item.productImage}
                    alt={item.productName}
                    className="w-10 h-10 rounded-lg object-cover bg-slate-100 border border-slate-200/80 shrink-0"
                    referrerPolicy="no-referrer"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-lg bg-slate-100 border border-slate-200/80 flex items-center justify-center text-slate-400 shrink-0">
                    <ShoppingBag className="w-4 h-4 text-slate-400" />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <div className="font-bold text-slate-900 truncate text-xs sm:text-[13px]">{item.productName}</div>
                  <div className="flex items-center space-x-1.5 text-slate-500 text-[11px] mt-0.5">
                    <span className="font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-1.5 py-0.2 rounded text-[10px]">
                      {item.orderedQuantityDisplay}
                    </span>
                    {item.quantityCount && item.quantityCount > 1 && (
                      <span>× {item.quantityCount}</span>
                    )}
                    <span className="text-slate-300">•</span>
                    <span className="font-mono text-[10px]">₹{item.basePriceAtOrderTime}/{item.baseUnit}</span>
                  </div>
                </div>
              </div>

              <div className="font-mono font-black text-slate-900 text-xs sm:text-sm shrink-0">
                ₹{item.lineItemTotal.toFixed(2)}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Amount & Receivables Summary */}
      <div className="p-2.5 rounded-xl bg-emerald-50/60 border border-emerald-200 flex items-center justify-between">
        <div>
          <span className="text-[10px] text-slate-500 uppercase font-bold block">{t('order.customer_paid')}</span>
          <span className="font-mono text-sm font-black text-slate-900">
            ₹{calculateOrderTotal(order).toFixed(2)}
          </span>
        </div>

        <div className="text-right">
          <span className="text-[10px] text-emerald-800 uppercase font-bold block">{t('order.seller_receivable')}</span>
          <span className="font-mono text-base font-black text-emerald-700">
            ₹{order.financials.sellerNetAmount.toFixed(2)}
          </span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-2 gap-2.5 pt-0.5">
        <button
          type="button"
          onClick={() => onReject(order.id)}
          className="py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-red-50 border border-slate-300 hover:border-red-300 text-slate-700 hover:text-red-700 font-bold text-xs transition-colors flex items-center justify-center space-x-1"
        >
          <X className="w-3.5 h-3.5" />
          <span>{t('order.reject')}</span>
        </button>

        <button
          type="button"
          disabled={isAccepting}
          onClick={() => onAccept(order.id)}
          className="py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs shadow-sm flex items-center justify-center space-x-1.5 transition-all"
        >
          {isAccepting ? (
            <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <>
              <Check className="w-3.5 h-3.5 stroke-[3px]" />
              <span>{t('order.accept')}</span>
            </>
          )}
        </button>
      </div>

      {/* View full details button */}
      <button
        type="button"
        onClick={() => onViewDetails(order)}
        className="w-full text-center text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center justify-center space-x-1 py-1"
      >
        <span>{language === 'hi' ? 'पूरा आर्डर व ग्राहक का पता देखें' : 'View Full Details & Customer Address'}</span>
        <ChevronRight className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};

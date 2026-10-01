/**
 * Admin Order Detail Modal
 * 
 * Compact, professional layout organized into clear small sections:
 * Customer → Shop → Items → Payment → Fees → Order Status.
 */

import React, { useState, useEffect } from 'react';
import { adminApi } from '../../../services/adminApi.ts';
import { Order, OrderStatus } from '../../../types/order.ts';
import { OrderStatusBadge } from '../../common/OrderStatusBadge.tsx';
import { useAdminPreferences } from '../../../context/AdminPreferencesContext.tsx';
import {
  ShoppingBag,
  Store,
  User,
  Phone,
  CreditCard,
  CheckCircle2,
  Clock,
  MapPin,
  X,
  IndianRupee,
  ShieldCheck,
  Package,
  FileText,
  Truck,
  Hash,
} from 'lucide-react';

interface AdminOrderDetailModalProps {
  orderId: string | null;
  onClose: () => void;
}

export const AdminOrderDetailModal: React.FC<AdminOrderDetailModalProps> = ({
  orderId,
  onClose,
}) => {
  const { t, language } = useAdminPreferences();
  const [details, setDetails] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!orderId) return;
    setIsLoading(true);
    adminApi
      .getOrderDetails(orderId)
      .then((data) => setDetails(data))
      .catch((err) => console.error('Failed to load order details', err))
      .finally(() => setIsLoading(false));
  }, [orderId]);

  if (!orderId) return null;

  const order: Order | undefined = details?.order;
  const payment = details?.payment;
  const isDelivery = order?.fulfillmentType === 'HOME_DELIVERY';

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-xs flex items-center justify-center p-2.5 sm:p-4 animate-fade-in text-xs">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl shadow-2xl p-3.5 sm:p-4 relative max-h-[92vh] flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-2.5 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-7 h-7 rounded-lg bg-indigo-600/20 text-indigo-400 flex items-center justify-center border border-indigo-500/30 shrink-0">
              <ShoppingBag className="w-3.5 h-3.5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <h3 className="text-xs sm:text-sm font-black text-white font-mono truncate">
                  #{order ? order.id?.slice(-8).toUpperCase() : orderId}
                </h3>
                {order && (
                  <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-400 uppercase tracking-wider shrink-0 flex items-center gap-0.5">
                    {isDelivery ? <Truck className="w-2.5 h-2.5" /> : <Store className="w-2.5 h-2.5" />}
                    <span>{isDelivery ? 'Delivery' : 'Pickup'}</span>
                  </span>
                )}
              </div>
              <p className="text-[10px] text-slate-400 truncate">
                {order ? new Date(order.createdAt).toLocaleString() : 'Loading details...'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition active:scale-95 shrink-0 border border-slate-700/60"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {isLoading || !order ? (
          <div className="p-8 text-center text-xs text-slate-400 font-bold flex-1 flex items-center justify-center">
            <Clock className="w-4 h-4 text-indigo-400 animate-spin mr-2" />
            Loading order breakdown...
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto space-y-3 py-2.5 pr-1 text-xs">
            {/* 1. SECTION: Customer */}
            <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-2.5 space-y-1.5">
              <div className="text-[10px] font-extrabold uppercase text-sky-400 tracking-wider flex items-center justify-between">
                <span className="flex items-center gap-1">
                  <User className="w-3 h-3" />
                  <span>1. Customer</span>
                </span>
                {order.pickupCode && (
                  <span className="text-[10px] font-mono text-amber-400 bg-amber-950/50 px-1.5 py-0.2 rounded border border-amber-800/50">
                    Pickup OTP: {order.pickupCode}
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-300">
                <div>
                  <div className="font-bold text-white text-[11px]">{order.customerName}</div>
                  <div className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                    <Phone className="w-2.5 h-2.5 text-slate-500" />
                    <span>{order.customerPhone}</span>
                  </div>
                </div>

                {order.deliveryAddress ? (
                  <div className="text-[10px] text-slate-400 flex items-start gap-1">
                    <MapPin className="w-3 h-3 text-slate-500 shrink-0 mt-0.5" />
                    <span>
                      {order.deliveryAddress.addressLine1}, {order.deliveryAddress.city} {order.deliveryAddress.pincode ? `- ${order.deliveryAddress.pincode}` : ''}
                    </span>
                  </div>
                ) : (
                  <div className="text-[10px] text-slate-500 italic">
                    Store Pickup Order (No delivery address required)
                  </div>
                )}
              </div>
            </div>

            {/* 2. SECTION: Shop */}
            <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-2.5 space-y-1.5">
              <div className="text-[10px] font-extrabold uppercase text-indigo-400 tracking-wider flex items-center justify-between">
                <span className="flex items-center gap-1">
                  <Store className="w-3 h-3" />
                  <span>2. Shop</span>
                </span>
                <span className="text-[10px] text-slate-400 font-normal">
                  ID: {order.shopId?.slice(-6).toUpperCase()}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-300">
                <div>
                  <div className="font-bold text-white text-[11px]">{order.shopName}</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">
                    {details.shop?.address?.area || 'Local Mandi / Market'}
                  </div>
                </div>

                <div>
                  <div className="text-[10px] text-slate-300">
                    Seller: <span className="font-semibold text-white">{details.seller?.fullName || 'Merchant'}</span>
                  </div>
                  <div className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                    <Phone className="w-2.5 h-2.5 text-slate-500" />
                    <span>{details.seller?.phone || details.shop?.phone || 'N/A'}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* 3. SECTION: Items */}
            <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-2.5 space-y-1.5">
              <div className="text-[10px] font-extrabold uppercase text-emerald-400 tracking-wider flex items-center justify-between">
                <span className="flex items-center gap-1">
                  <Package className="w-3 h-3" />
                  <span>3. Items ({order.items?.length || 0})</span>
                </span>
              </div>

              <div className="rounded-lg border border-slate-800 overflow-hidden bg-slate-900/60">
                <div className="p-1.5 bg-slate-950 text-[9px] font-extrabold uppercase tracking-wider text-slate-400 grid grid-cols-12">
                  <div className="col-span-6">Product</div>
                  <div className="col-span-3 text-center">Qty / Rate</div>
                  <div className="col-span-3 text-right">Total</div>
                </div>

                <div className="divide-y divide-slate-800/60 text-[11px]">
                  {order.items?.map((item, idx) => (
                    <div key={idx} className="p-1.5 grid grid-cols-12 items-center">
                      <div className="col-span-6 min-w-0 pr-1">
                        <div className="font-bold text-white truncate">{item.productName}</div>
                      </div>
                      <div className="col-span-3 text-center text-slate-300 font-mono text-[10px]">
                        {item.orderedQuantityDisplay || `${item.quantityCount} ${(item as any).unit || item.baseUnit || 'units'}`}
                      </div>
                      <div className="col-span-3 text-right font-bold text-white font-mono">
                        ₹{item.lineItemTotal}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* 4. SECTION: Payment */}
            <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-2.5 space-y-1.5">
              <div className="text-[10px] font-extrabold uppercase text-purple-400 tracking-wider flex items-center justify-between">
                <span className="flex items-center gap-1">
                  <CreditCard className="w-3 h-3" />
                  <span>4. Payment</span>
                </span>
                <span className="text-[10px] font-bold text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>{(order as any).paymentStatus || (order.paymentId ? 'PAID' : 'PENDING')}</span>
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[10px] font-mono bg-slate-900/50 p-2 rounded-lg border border-slate-800/50">
                <div>
                  <span className="text-slate-500 block text-[9px]">Gateway</span>
                  <span className="text-slate-200 font-bold">{payment?.gateway || 'UPI / Gateway'}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[9px]">Payment ID</span>
                  <span className="text-slate-200 truncate block">{payment?.gatewayPaymentId || order.paymentId || 'Verified'}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[9px]">Order Ref</span>
                  <span className="text-slate-200 truncate block">{payment?.gatewayOrderId || 'Direct'}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[9px]">Verified</span>
                  <span className="text-slate-200">
                    {payment?.verifiedAt ? new Date(payment.verifiedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Instant'}
                  </span>
                </div>
              </div>
            </div>

            {/* 5. SECTION: Fees */}
            <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-2.5 space-y-1.5">
              <div className="text-[10px] font-extrabold uppercase text-amber-400 tracking-wider flex items-center gap-1">
                <IndianRupee className="w-3 h-3" />
                <span>5. Fees & Financial Settlement</span>
              </div>

              <div className="space-y-1 text-[11px]">
                <div className="flex items-center justify-between text-slate-400">
                  <span>Items Subtotal</span>
                  <span className="font-mono text-white">₹{order.financials?.itemSubtotal || 0}</span>
                </div>
                <div className="flex items-center justify-between text-slate-400">
                  <span>Delivery Fee</span>
                  <span className="font-mono text-white">₹{order.financials?.deliveryFee || 0}</span>
                </div>
                <div className="flex items-center justify-between text-slate-400">
                  <span>Platform Fee</span>
                  <span className="font-mono text-white">₹{order.financials?.platformFee || 0}</span>
                </div>
                {order.financials?.tax > 0 && (
                  <div className="flex items-center justify-between text-slate-400">
                    <span>Taxes</span>
                    <span className="font-mono text-white">₹{order.financials.tax}</span>
                  </div>
                )}

                <div className="pt-1 border-t border-slate-800 flex items-center justify-between font-black">
                  <span className="text-white text-xs">Customer Paid Total</span>
                  <span className="text-emerald-400 font-mono text-xs">
                    ₹{order.financials?.customerTotal || (order as any).totalAmount || 0}
                  </span>
                </div>

                <div className="pt-1 border-t border-dashed border-slate-800 flex items-center justify-between text-[10px]">
                  <span className="text-indigo-400 font-bold">
                    Platform Commission ({order.financials?.commissionPercentage || 5}%)
                  </span>
                  <span className="text-indigo-400 font-mono font-bold">
                    + ₹{order.financials?.commissionAmount || 0}
                  </span>
                </div>

                <div className="flex items-center justify-between text-[10px]">
                  <span className="text-slate-300 font-bold">Seller Net Payable</span>
                  <span className="text-emerald-300 font-mono font-bold">
                    = ₹{order.financials?.sellerNetAmount || 0}
                  </span>
                </div>
              </div>
            </div>

            {/* 6. SECTION: Order Status */}
            <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-2.5 space-y-2">
              <div className="text-[10px] font-extrabold uppercase text-teal-400 tracking-wider flex items-center justify-between">
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  <span>6. Order Status & Progression</span>
                </span>
                <OrderStatusBadge
                  status={order.status}
                  variant="dark"
                  size="sm"
                  language={language}
                />
              </div>

              {/* Status Timeline History */}
              {order.statusHistory && order.statusHistory.length > 0 ? (
                <div className="space-y-1 text-[10px]">
                  {order.statusHistory.map((step, idx) => (
                    <div key={idx} className="flex items-center justify-between py-0.5 border-b border-slate-900 last:border-0">
                      <div className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                        <span className="font-bold text-white">{step.status}</span>
                        {step.note && <span className="text-slate-400">• {step.note}</span>}
                      </div>
                      <span className="text-slate-500 font-mono text-[9px]">
                        {new Date(step.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-[10px] text-slate-500">
                  Current state: <span className="text-slate-300 font-semibold">{order.status}</span> recorded at{' '}
                  {new Date(order.createdAt).toLocaleTimeString()}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Modal Footer */}
        <div className="pt-2.5 border-t border-slate-800 flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-lg transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

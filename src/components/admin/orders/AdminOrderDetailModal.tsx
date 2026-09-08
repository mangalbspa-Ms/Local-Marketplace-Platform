/**
 * Admin Order Detail Modal
 * 
 * Comprehensive audit & financial breakdown of a marketplace order,
 * including itemized fractional units, financial split, and verified payment gateway ledger.
 */

import React, { useState, useEffect } from 'react';
import { adminApi } from '../../../services/adminApi.ts';
import { Order, OrderStatus } from '../../../types/order.ts';
import {
  ShoppingBag,
  Store,
  User,
  Phone,
  CreditCard,
  CheckCircle2,
  AlertCircle,
  Clock,
  MapPin,
  FileText,
  X,
  IndianRupee,
  ShieldCheck,
  Package,
} from 'lucide-react';

interface AdminOrderDetailModalProps {
  orderId: string | null;
  onClose: () => void;
}

export const AdminOrderDetailModal: React.FC<AdminOrderDetailModalProps> = ({
  orderId,
  onClose,
}) => {
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

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-2xl shadow-2xl p-6 relative max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600/20 text-indigo-400 flex items-center justify-center border border-indigo-500/30">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black text-white font-mono">
                  {order ? order.id : orderId}
                </h3>
                {order && (
                  <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-400 uppercase">
                    {order.fulfillmentType}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-400">
                {order ? new Date(order.createdAt).toLocaleString() : 'Loading...'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {isLoading || !order ? (
          <div className="p-8 text-center text-xs text-slate-400 font-bold">
            Fetching order audit details...
          </div>
        ) : (
          <div className="space-y-6 text-xs">
            {/* Status Strip */}
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between">
              <div>
                <div className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">
                  Order Status
                </div>
                <div className="text-sm font-black text-white mt-0.5">{order.status}</div>
              </div>

              <div className="text-right">
                <div className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">
                  Payment Status
                </div>
                <div className="text-sm font-black text-emerald-400 mt-0.5 flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{(order as any).paymentStatus || (order.paymentId ? 'PAID' : 'PENDING')}</span>
                </div>
              </div>
            </div>

            {/* Merchant & Customer Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-1.5">
                <div className="text-[10px] font-extrabold uppercase text-indigo-400 tracking-wider flex items-center gap-1.5">
                  <Store className="w-3.5 h-3.5" />
                  <span>Fulfilling Mandi Shop</span>
                </div>
                <div className="font-black text-white text-sm">{order.shopName}</div>
                <div className="text-slate-400">{details.shop?.address?.area || 'Local Mandi'}</div>
                <div className="text-slate-400 flex items-center gap-1">
                  <Phone className="w-3 h-3 text-slate-500" />
                  <span>{details.seller?.phone || details.shop?.phone}</span>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-1.5">
                <div className="text-[10px] font-extrabold uppercase text-teal-400 tracking-wider flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5" />
                  <span>Customer Destination</span>
                </div>
                <div className="font-black text-white text-sm">{order.customerName}</div>
                <div className="text-slate-400 flex items-center gap-1">
                  <Phone className="w-3 h-3 text-slate-500" />
                  <span>{order.customerPhone}</span>
                </div>
                {order.deliveryAddress && (
                  <div className="text-slate-400 truncate">
                    {order.deliveryAddress.addressLine1}, {order.deliveryAddress.city}
                  </div>
                )}
                {order.pickupCode && (
                  <div className="text-amber-400 font-mono font-bold">
                    Pickup OTP: {order.pickupCode}
                  </div>
                )}
              </div>
            </div>

            {/* Items Purchased Table */}
            <div className="space-y-2">
              <div className="text-xs font-black text-white flex items-center gap-2">
                <Package className="w-4 h-4 text-indigo-400" />
                <span>Purchased Items ({order.items.length})</span>
              </div>

              <div className="rounded-2xl border border-slate-800 overflow-hidden bg-slate-950/60">
                <div className="p-3 bg-slate-900 text-[10px] font-extrabold uppercase tracking-wider text-slate-400 grid grid-cols-12">
                  <div className="col-span-6">Item & Unit</div>
                  <div className="col-span-3 text-center">Unit Price</div>
                  <div className="col-span-3 text-right">Line Total</div>
                </div>

                <div className="divide-y divide-slate-800/80">
                  {order.items.map((item, idx) => (
                    <div key={idx} className="p-3 grid grid-cols-12 items-center text-xs">
                      <div className="col-span-6">
                        <div className="font-bold text-white">{item.productName}</div>
                        <div className="text-[11px] text-indigo-400 font-mono">
                          {item.orderedQuantityDisplay || `${item.quantityCount} units`}
                        </div>
                      </div>
                      <div className="col-span-3 text-center text-slate-300 font-mono">
                        ₹{item.unitItemPriceCalculated || item.basePriceAtOrderTime}
                      </div>
                      <div className="col-span-3 text-right font-black text-white font-mono">
                        ₹{item.lineItemTotal}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Financial Reconciliation Split */}
            <div className="space-y-2">
              <div className="text-xs font-black text-white flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Financial Engine Reconciliation</span>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-slate-400">
                  <span>Items Subtotal</span>
                  <span className="font-mono text-white">₹{order.financials.itemSubtotal}</span>
                </div>
                <div className="flex items-center justify-between text-slate-400">
                  <span>Delivery Fee</span>
                  <span className="font-mono text-white">₹{order.financials.deliveryFee}</span>
                </div>
                <div className="flex items-center justify-between text-slate-400">
                  <span>Platform Processing Fee</span>
                  <span className="font-mono text-white">₹{order.financials.platformFee}</span>
                </div>
                {order.financials.tax > 0 && (
                  <div className="flex items-center justify-between text-slate-400">
                    <span>Taxes</span>
                    <span className="font-mono text-white">₹{order.financials.tax}</span>
                  </div>
                )}

                <div className="pt-2 border-t border-slate-800 flex items-center justify-between font-black text-sm">
                  <span className="text-white">Customer Total Paid</span>
                  <span className="text-emerald-400 font-mono">₹{order.financials.customerTotal}</span>
                </div>

                <div className="pt-2 border-t border-dashed border-slate-800 flex items-center justify-between text-xs">
                  <span className="text-indigo-400 font-bold">
                    Platform Commission ({order.financials.commissionPercentage}%)
                  </span>
                  <span className="text-indigo-400 font-mono font-bold">
                    + ₹{order.financials.commissionAmount}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-300 font-bold">Seller Net Payable Payout</span>
                  <span className="text-emerald-300 font-mono font-bold">
                    = ₹{order.financials.sellerNetAmount}
                  </span>
                </div>
              </div>
            </div>

            {/* Payment Record & Gateway Logs */}
            {payment && (
              <div className="p-4 rounded-2xl bg-indigo-950/30 border border-indigo-800/50 space-y-2">
                <div className="text-[10px] font-extrabold uppercase text-indigo-400 tracking-wider flex items-center gap-1.5">
                  <CreditCard className="w-3.5 h-3.5" />
                  <span>Gateway Transaction Log</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
                  <div>
                    <span className="text-slate-500">Gateway: </span>
                    <span className="text-slate-200 font-bold">{payment.gateway}</span>
                  </div>
                  <div>
                    <span className="text-slate-500">Payment ID: </span>
                    <span className="text-slate-200">{payment.gatewayPaymentId}</span>
                  </div>
                  <div>
                    <span className="text-slate-500">Verified At: </span>
                    <span className="text-slate-200">
                      {payment.verifiedAt ? new Date(payment.verifiedAt).toLocaleTimeString() : 'Verified'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500">Gateway Order: </span>
                    <span className="text-slate-200">{payment.gatewayOrderId || 'N/A'}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Timeline logs */}
            {order.statusHistory && order.statusHistory.length > 0 && (
              <div className="space-y-1.5">
                <div className="text-xs font-black text-white flex items-center gap-2">
                  <Clock className="w-4 h-4 text-slate-400" />
                  <span>Status State Progression Timeline</span>
                </div>
                <div className="p-3 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-1.5">
                  {order.statusHistory.map((step, idx) => (
                    <div key={idx} className="flex items-center justify-between text-[11px]">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-indigo-400" />
                        <span className="font-bold text-white">{step.status}</span>
                        {step.note && <span className="text-slate-400">• {step.note}</span>}
                      </div>
                      <span className="text-slate-500 font-mono">
                        {new Date(step.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

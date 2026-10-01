/**
 * Customer Shopping Request & Final Bill Review Modal
 * 
 * Allows customers to:
 * 1. Check status of their voice shopping request
 * 2. View seller-finalized line-by-line item prices and notes
 * 3. Make 1-tap payment (UPI / Cash / Card) after bill is finalized
 * 4. Receive instant order confirmation & pickup PIN
 */

import React, { useState } from 'react';
import { ShoppingRequest, ShoppingRequestStatus } from '../../../types/shoppingRequest.ts';
import { Order, FulfillmentType } from '../../../types/order.ts';
import { customerApi } from '../../../services/customerApi.ts';
import { useCustomerLanguage } from '../../../context/CustomerLanguageContext.tsx';
import {
  ShoppingBag,
  Store,
  Clock,
  CheckCircle2,
  AlertCircle,
  MapPin,
  Phone,
  IndianRupee,
  ShieldCheck,
  CreditCard,
  QrCode,
  Loader2,
  Sparkles,
  ArrowRight,
  Info,
  Check,
  X,
} from 'lucide-react';

interface ShoppingRequestDetailModalProps {
  isOpen: boolean;
  request: ShoppingRequest | null;
  onClose: () => void;
  onOrderPaid?: (order: Order) => void;
}

export const ShoppingRequestDetailModal: React.FC<ShoppingRequestDetailModalProps> = ({
  isOpen,
  request,
  onClose,
  onOrderPaid,
}) => {
  const { language } = useCustomerLanguage();

  const [paymentMethod, setPaymentMethod] = useState<'UPI' | 'CASH' | 'CARD'>('UPI');
  const [isPaying, setIsPaying] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [paidOrder, setPaidOrder] = useState<Order | null>(null);

  if (!isOpen || !request) return null;

  const isPending = request.status === ShoppingRequestStatus.PENDING_SELLER_REVIEW;
  const isFinalized = request.status === ShoppingRequestStatus.BILL_FINALIZED;
  const isPaid = request.status === ShoppingRequestStatus.PAYMENT_COMPLETED;
  const isRejected = request.status === ShoppingRequestStatus.REJECTED;
  const isCancelled = request.status === ShoppingRequestStatus.CANCELLED;

  const finalBill = request.finalBill;

  const handlePayNow = async () => {
    setIsPaying(true);
    setErrorMessage(null);

    try {
      const result = await customerApi.payShoppingRequest(request.id, {
        method: paymentMethod,
        transactionRef: `tx_upi_${Date.now()}`,
      });

      setPaidOrder(result.order);
      if (onOrderPaid) {
        onOrderPaid(result.order);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Payment failed. Please try again.');
    } finally {
      setIsPaying(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="bg-white border border-slate-200 rounded-t-3xl sm:rounded-3xl w-full max-w-lg p-5 space-y-4 shadow-2xl max-h-[92vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Success / Paid View */}
        {paidOrder ? (
          <div className="py-6 text-center space-y-4 animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto shadow-inner">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div className="space-y-1">
              <span className="inline-block px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-black uppercase tracking-wider">
                {paidOrder.orderNumber}
              </span>
              <h2 className="text-xl font-black text-slate-900">
                {language === 'hi' ? '🎉 भुगतान सफल & ऑर्डर कन्फर्म!' : '🎉 Payment Successful & Order Confirmed!'}
              </h2>
              <p className="text-sm text-slate-600 max-w-sm mx-auto">
                {language === 'hi'
                  ? `दुकानदार (${paidOrder.shopName}) को ऑर्डर मिल गया है और वो सामान पैक कर रहे हैं।`
                  : `${paidOrder.shopName} has received your paid order and started packing.`}
              </p>
            </div>

            {/* Pickup PIN Card */}
            {paidOrder.pickupCode && (
              <div className="p-4 bg-amber-50 rounded-2xl border-2 border-amber-300 text-center space-y-1">
                <span className="text-xs font-bold text-amber-900 uppercase tracking-wider">
                  {language === 'hi' ? 'दुकान से पिकअप पिन (Pickup PIN)' : 'Store Pickup PIN'}
                </span>
                <p className="text-3xl font-black text-amber-950 font-mono tracking-widest">
                  {paidOrder.pickupCode}
                </p>
                <p className="text-[11px] text-amber-800">
                  {language === 'hi' ? 'सामान लेते समय दुकानदार को यह 4-अंकों का पिन बताएं।' : 'Show this 4-digit PIN at shop to collect.'}
                </p>
              </div>
            )}

            <button
              type="button"
              onClick={onClose}
              className="w-full py-3.5 px-4 rounded-xl bg-slate-900 text-white font-bold text-sm shadow-md hover:bg-slate-800 transition-all cursor-pointer"
            >
              {language === 'hi' ? 'ऑर्डर देखें व बंद करें' : 'View Order & Close'}
            </button>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="flex items-start justify-between pb-3 border-b border-slate-100">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[10px] font-bold font-mono">
                    {request.requestNumber}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      isFinalized
                        ? 'bg-emerald-100 text-emerald-800 animate-pulse'
                        : isPending
                        ? 'bg-amber-100 text-amber-800'
                        : isPaid
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-rose-100 text-rose-800'
                    }`}
                  >
                    {isFinalized
                      ? '🎉 बिल तैयार है (Final Bill Ready)'
                      : isPending
                      ? '⏳ दुकानदार पर्ची देख रहे हैं'
                      : isPaid
                      ? '✅ भुगतान पूरा हुआ'
                      : '❌ अस्वीकार'}
                  </span>
                </div>

                <h2 className="text-base font-black text-slate-900 mt-1 flex items-center gap-2">
                  <span>{request.shopName}</span>
                </h2>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 hover:text-slate-900 flex items-center justify-center text-xs font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Error message */}
            {errorMessage && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-xs text-rose-700">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Status Banner */}
            {isPending && (
              <div className="p-3.5 bg-amber-50 rounded-2xl border border-amber-200 space-y-2">
                <div className="flex items-center gap-2 text-amber-900 font-bold text-xs">
                  <Clock className="w-4 h-4 text-amber-700 shrink-0 animate-spin" />
                  <span>{language === 'hi' ? 'दुकानदार आपकी पर्ची देख रहे हैं...' : 'Shopkeeper is reviewing your list...'}</span>
                </div>
                <p className="text-xs text-amber-800 leading-relaxed">
                  {language === 'hi'
                    ? 'दुकानदार आपके सामान का भाव व उपलब्धता तय कर रहे हैं। जैसे ही वो फाइनल बिल भेजेंगे, आप यहाँ देख पाएंगे।'
                    : 'The shopkeeper is pricing your requested items. The final bill will appear here once ready.'}
                </p>
              </div>
            )}

            {isFinalized && (
              <div className="p-3.5 bg-emerald-50 rounded-2xl border border-emerald-300 space-y-1">
                <div className="flex items-center gap-2 text-emerald-950 font-black text-xs">
                  <Sparkles className="w-4 h-4 text-emerald-700 shrink-0" />
                  <span>{language === 'hi' ? 'दुकानदार ने आपका फाइनल बिल बना दिया है!' : 'Final Bill is Ready for Payment!'}</span>
                </div>
                <p className="text-xs text-emerald-800">
                  {language === 'hi'
                    ? 'नीचे सामान के पक्के भाव चेक करें और 1-टैप में भुगतान करें।'
                    : 'Review final prices below and pay securely.'}
                </p>
                {request.sellerNotes && (
                  <p className="text-[11px] text-emerald-900 font-medium italic mt-1 bg-white/70 p-2 rounded-lg border border-emerald-200">
                    "{request.sellerNotes}"
                  </p>
                )}
              </div>
            )}

            {/* Line items list */}
            <div className="space-y-2">
              <span className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                <ShoppingBag className="w-3.5 h-3.5 text-emerald-700" />
                <span>
                  {isFinalized || isPaid
                    ? (language === 'hi' ? 'सामान का फाइनल बिल विवरण' : 'Final Bill Items')
                    : (language === 'hi' ? 'सामान का विवरण' : 'Requested Items')}
                </span>
              </span>

              <div className="bg-slate-50 border border-slate-200 rounded-2xl divide-y divide-slate-100 max-h-56 overflow-y-auto">
                {isFinalized && finalBill && finalBill.items && finalBill.items.length > 0 ? (
                  // Authoritative finalized bill items snapshot sent by seller
                  finalBill.items.map((item, idx) => (
                    <div
                      key={item.productId || `item_${idx}`}
                      className="p-2.5 flex items-center justify-between gap-2"
                    >
                      <div className="flex items-center gap-2.5 flex-1 min-w-0">
                        <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold flex items-center justify-center shrink-0">
                          {idx + 1}
                        </span>

                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-bold text-slate-900 truncate">
                            {item.productName}
                          </p>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="px-1.5 py-0.2 bg-emerald-50 text-emerald-700 border border-emerald-200 text-[9px] font-bold rounded">
                              {item.orderedQuantityDisplay || `${item.quantityCount} unit`}
                            </span>
                            {item.quantityCount > 1 && (
                              <span className="text-[9px] text-slate-500 font-mono font-medium">
                                ({item.quantityCount} × ₹{item.unitItemPriceCalculated})
                              </span>
                            )}
                            {item.notes && (
                              <span className="text-[9px] text-indigo-700 bg-indigo-50 px-1.5 py-0.2 rounded font-medium">
                                {item.notes}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <p className="text-xs font-black text-slate-900 font-mono">
                          ₹{item.lineItemTotal}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  // Initial requested items
                  request.items.map((item, idx) => (
                    <div
                      key={item.id}
                      className={`p-2.5 flex items-center justify-between gap-2 ${
                        !item.isAvailable ? 'opacity-50 bg-slate-100' : ''
                      }`}
                    >
                      <div className="flex items-center gap-2.5 flex-1 min-w-0">
                        <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-700 text-[10px] font-bold flex items-center justify-center shrink-0">
                          {idx + 1}
                        </span>

                        <div className="min-w-0 flex-1">
                          <p className={`text-xs font-bold text-slate-900 truncate ${!item.isAvailable ? 'line-through' : ''}`}>
                            {item.matchedProductName || item.rawItemName}
                          </p>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="px-1.5 py-0.2 bg-slate-100 text-slate-700 text-[9px] font-bold rounded">
                              {item.unitDisplay}
                            </span>
                            {item.sellerNote && (
                              <span className="text-[9px] text-indigo-700 bg-indigo-50 px-1.5 py-0.2 rounded font-medium">
                                {item.sellerNote}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        {item.isAvailable ? (
                          <p className="text-xs font-black text-slate-900 font-mono">
                            ₹{item.lineTotal ?? item.unitPrice ?? '—'}
                          </p>
                        ) : (
                          <span className="px-1.5 py-0.5 bg-rose-50 text-rose-700 text-[9px] font-bold rounded border border-rose-200">
                            {language === 'hi' ? 'उपलब्ध नहीं' : 'Not Available'}
                          </span>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Financial Breakdown (if bill finalized) */}
            {finalBill && isFinalized && (
              <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-2xl space-y-2">
                <div className="flex justify-between text-xs text-slate-600">
                  <span>{language === 'hi' ? 'कुल सामान मूल्य (Subtotal):' : 'Items Subtotal:'}</span>
                  <span className="font-bold text-slate-900 font-mono">₹{finalBill.itemSubtotal}</span>
                </div>

                {finalBill.discount !== undefined && finalBill.discount > 0 && (
                  <div className="flex justify-between text-xs text-emerald-600 font-semibold">
                    <span>{language === 'hi' ? 'छूट / डिस्काउंट:' : 'Discount:'}</span>
                    <span className="font-bold font-mono">-₹{finalBill.discount}</span>
                  </div>
                )}

                {request.fulfillmentType === FulfillmentType.HOME_DELIVERY && (
                  <div className="flex justify-between text-xs text-slate-600">
                    <span>{language === 'hi' ? 'डिलीवरी चार्ज:' : 'Delivery Fee:'}</span>
                    <span className="font-bold text-slate-900 font-mono">₹{finalBill.deliveryFee}</span>
                  </div>
                )}

                {finalBill.platformFee !== undefined && finalBill.platformFee > 0 && (
                  <div className="flex justify-between text-xs text-slate-600">
                    <span>{language === 'hi' ? 'प्लेटफॉर्म शुल्क:' : 'Platform Fee:'}</span>
                    <span className="font-bold text-slate-900 font-mono">₹{finalBill.platformFee}</span>
                  </div>
                )}

                <div className="pt-2 border-t border-slate-200 flex justify-between items-center text-sm font-black text-slate-900">
                  <span>{language === 'hi' ? 'कुल भुगतान राशि (Payable):' : 'Total Amount to Pay:'}</span>
                  <span className="text-lg font-black text-emerald-700 font-mono">₹{finalBill.customerTotal}</span>
                </div>
              </div>
            )}

            {/* Payment Mode Selection & Action Button */}
            {isFinalized && (
              <div className="space-y-3 pt-1">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">
                    {language === 'hi' ? 'पेमेंट का तरीका चुनें:' : 'Select Payment Method:'}
                  </label>

                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('UPI')}
                      className={`py-2 px-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-1 transition-all cursor-pointer ${
                        paymentMethod === 'UPI'
                          ? 'bg-emerald-50 border-emerald-500 text-emerald-900 ring-2 ring-emerald-300'
                          : 'bg-white border-slate-200 text-slate-600'
                      }`}
                    >
                      <QrCode className="w-3.5 h-3.5 text-emerald-700" />
                      <span>UPI</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPaymentMethod('CASH')}
                      className={`py-2 px-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-1 transition-all cursor-pointer ${
                        paymentMethod === 'CASH'
                          ? 'bg-emerald-50 border-emerald-500 text-emerald-900 ring-2 ring-emerald-300'
                          : 'bg-white border-slate-200 text-slate-600'
                      }`}
                    >
                      <IndianRupee className="w-3.5 h-3.5 text-emerald-700" />
                      <span>Cash</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPaymentMethod('CARD')}
                      className={`py-2 px-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-1 transition-all cursor-pointer ${
                        paymentMethod === 'CARD'
                          ? 'bg-emerald-50 border-emerald-500 text-emerald-900 ring-2 ring-emerald-300'
                          : 'bg-white border-slate-200 text-slate-600'
                      }`}
                    >
                      <CreditCard className="w-3.5 h-3.5 text-emerald-700" />
                      <span>Card</span>
                    </button>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handlePayNow}
                  disabled={isPaying}
                  className="w-full py-3.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-lg shadow-emerald-200 flex items-center justify-center gap-2 transition-all disabled:opacity-50 cursor-pointer"
                >
                  {isPaying ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>{language === 'hi' ? 'भुगतान सत्यापित हो रहा है...' : 'Processing Payment...'}</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-4 h-4" />
                      <span>
                        {language === 'hi'
                          ? `₹${finalBill?.customerTotal} का भुगतान करें व आर्डर कन्फर्म करें`
                          : `Pay ₹${finalBill?.customerTotal} & Confirm Order`}
                      </span>
                    </>
                  )}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

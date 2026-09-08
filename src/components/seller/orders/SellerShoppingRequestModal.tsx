/**
 * Seller Shopping Request Review & Bill Finalization Modal
 * 
 * Allows kirana storekeeper to:
 * 1. View customer voice shopping list with natural Hindi/Hinglish transcripts
 * 2. Set final prices for unpriced/custom items
 * 3. Mark availability per item (उपलब्ध / नहीं है)
 * 4. Add custom seller notes and delivery charges
 * 5. Send the final verified bill to customer for 1-tap payment
 */

import React, { useState, useEffect } from 'react';
import { ShoppingRequest, ShoppingRequestStatus, FinalizeBillDTO } from '../../../types/shoppingRequest.ts';
import { FulfillmentType } from '../../../types/order.ts';
import { sellerApi } from '../../../services/sellerApi.ts';
import { useSellerLanguage } from '../../../context/SellerLanguageContext.tsx';
import {
  Mic,
  Send,
  AlertCircle,
  Store,
  CheckCircle2,
  Clock,
  MapPin,
  Phone,
  User as UserIcon,
  IndianRupee,
  Check,
  X,
  Loader2,
  FileText,
  Tag,
  ShieldCheck,
  ChevronRight,
  Sparkles,
} from 'lucide-react';

interface SellerShoppingRequestModalProps {
  isOpen: boolean;
  request: ShoppingRequest | null;
  onClose: () => void;
  onBillFinalized: (updatedRequest: ShoppingRequest) => void;
}

interface EditableBillItem {
  id: string;
  originalText: string;
  rawItemName: string;
  productId?: string;
  productName: string;
  productImage?: string;
  unitPrice: number;
  quantityCount: number;
  quantityMultiplier: number;
  unitDisplay: string;
  baseUnit: string;
  isAvailable: boolean;
  sellerNote: string;
}

export const SellerShoppingRequestModal: React.FC<SellerShoppingRequestModalProps> = ({
  isOpen,
  request,
  onClose,
  onBillFinalized,
}) => {
  const { language } = useSellerLanguage();

  const [items, setItems] = useState<EditableBillItem[]>([]);
  const [deliveryFee, setDeliveryFee] = useState<number>(20);
  const [sellerNotes, setSellerNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isRejecting, setIsRejecting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Initialize editable state whenever request opens
  useEffect(() => {
    if (!request) return;

    const initialItems: EditableBillItem[] = request.items.map((i) => ({
      id: i.id,
      originalText: i.originalText,
      rawItemName: i.rawItemName,
      productId: i.matchedProductId,
      productName: i.matchedProductName || i.rawItemName,
      productImage: i.matchedProductImage,
      unitPrice: i.unitPrice ?? (i.isPriceEstimated ? 30 : 20),
      quantityCount: i.quantityCount || 1,
      quantityMultiplier: i.quantityMultiplier || 1.0,
      unitDisplay: i.unitDisplay || `${i.quantityCount || 1} unit`,
      baseUnit: i.baseUnit || 'piece',
      isAvailable: i.isAvailable !== false,
      sellerNote: i.sellerNote || '',
    }));

    setItems(initialItems);
    setDeliveryFee(request.fulfillmentType === FulfillmentType.HOME_DELIVERY ? 20 : 0);
    setSellerNotes(request.sellerNotes || '');
    setErrorMessage(null);
  }, [request]);

  if (!isOpen || !request) return null;

  const handlePriceChange = (id: string, newPrice: number) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, unitPrice: Math.max(0, newPrice) } : item
      )
    );
  };

  const handleToggleAvailable = (id: string) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, isAvailable: !item.isAvailable } : item
      )
    );
  };

  const handleNoteChange = (id: string, note: string) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, sellerNote: note } : item))
    );
  };

  const subtotal = items.reduce((sum, item) => {
    if (!item.isAvailable) return sum;
    return sum + (item.unitPrice * item.quantityMultiplier * item.quantityCount);
  }, 0);

  const roundedSubtotal = Math.round(subtotal * 100) / 100;
  const effectiveDeliveryFee = request.fulfillmentType === FulfillmentType.HOME_DELIVERY ? deliveryFee : 0;
  const finalTotal = Math.round((roundedSubtotal + effectiveDeliveryFee) * 100) / 100;

  const handleFinalizeBill = async () => {
    if (items.filter((i) => i.isAvailable).length === 0) {
      setErrorMessage(
        language === 'hi'
          ? 'कम से कम एक सामान उपलब्ध होना चाहिए।'
          : 'At least one item must be marked as available.'
      );
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const payload: FinalizeBillDTO = {
        deliveryFee: effectiveDeliveryFee,
        sellerNotes,
        items: items.map((i) => ({
          id: i.id,
          productId: i.productId,
          productName: i.productName,
          productImage: i.productImage,
          unitPrice: i.unitPrice,
          quantityCount: i.quantityCount,
          quantityMultiplier: i.quantityMultiplier,
          unitDisplay: i.unitDisplay,
          baseUnit: i.baseUnit,
          isAvailable: i.isAvailable,
          sellerNote: i.sellerNote,
        })),
      };

      const updated = await sellerApi.finalizeBill(request.id, payload);
      onBillFinalized(updated);
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to finalize bill');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReject = async () => {
    const reason = window.prompt(
      language === 'hi' ? 'अस्वीकार करने का कारण लिखें:' : 'Enter rejection reason:'
    );
    if (reason === null) return;

    setIsRejecting(true);
    setErrorMessage(null);

    try {
      const updated = await sellerApi.rejectShoppingRequest(request.id, reason || undefined);
      onBillFinalized(updated);
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to reject request');
    } finally {
      setIsRejecting(false);
    }
  };

  const isAlreadyFinalized = request.status === ShoppingRequestStatus.BILL_FINALIZED;
  const isPaid = request.status === ShoppingRequestStatus.PAYMENT_COMPLETED;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="bg-white border border-slate-200 rounded-t-3xl sm:rounded-3xl w-full max-w-2xl p-5 space-y-4 shadow-2xl max-h-[92vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between pb-3 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-full bg-emerald-100 border border-emerald-300 text-emerald-900 text-[10px] font-black tracking-wide font-mono">
                {request.requestNumber}
              </span>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  isPaid
                    ? 'bg-emerald-100 text-emerald-800'
                    : isAlreadyFinalized
                    ? 'bg-blue-100 text-blue-800'
                    : 'bg-amber-100 text-amber-800'
                }`}
              >
                {isPaid
                  ? '✅ भुगतान हो गया (Paid)'
                  : isAlreadyFinalized
                  ? '⏳ ग्राहक पेमेंट का इंतजार (Waiting for Pay)'
                  : '📥 नई ग्राहक पर्ची (Review & Finalize)'}
              </span>
            </div>

            <h2 className="text-base font-black text-slate-900 mt-1 flex items-center gap-2">
              <span>{language === 'hi' ? 'दुकानदार फाइनल बिल' : 'Seller Final Bill Review'}</span>
              <span className="text-xs font-normal text-slate-500">
                ({request.items.length} {language === 'hi' ? 'सामान' : 'items'})
              </span>
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

        {/* Error Alert */}
        {errorMessage && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-xs text-rose-700">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Customer Profile & Fulfillment Header */}
        <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            {request.customerAvatar && request.customerAvatar.trim() !== '' ? (
              <img
                src={request.customerAvatar}
                alt={request.customerName}
                referrerPolicy="no-referrer"
                className="w-11 h-11 rounded-full object-cover border-2 border-emerald-400 shadow-2xs"
              />
            ) : (
              <div className="w-11 h-11 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-black text-sm border-2 border-emerald-300">
                {request.customerName.slice(0, 2).toUpperCase()}
              </div>
            )}

            <div>
              <p className="text-sm font-black text-slate-900">{request.customerName}</p>
              <p className="text-xs text-slate-500 flex items-center gap-1.5 font-mono">
                <Phone className="w-3 h-3 text-emerald-700" />
                <span>{request.customerPhone}</span>
              </p>
            </div>
          </div>

          <div className="text-right">
            <span
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-bold ${
                request.fulfillmentType === FulfillmentType.STORE_PICKUP
                  ? 'bg-amber-100 text-amber-900 border border-amber-300'
                  : 'bg-indigo-100 text-indigo-900 border border-indigo-300'
              }`}
            >
              {request.fulfillmentType === FulfillmentType.STORE_PICKUP ? (
                <>
                  <Store className="w-3.5 h-3.5" />
                  <span>{language === 'hi' ? 'दुकान से पिकअप' : 'Store Pickup'}</span>
                </>
              ) : (
                <>
                  <MapPin className="w-3.5 h-3.5" />
                  <span>{language === 'hi' ? 'होम डिलीवरी' : 'Home Delivery'}</span>
                </>
              )}
            </span>
            <p className="text-[10px] text-slate-400 mt-0.5">
              {new Date(request.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
        </div>

        {/* Customer Natural Voice Transcript */}
        {request.rawVoiceTranscript && (
          <div className="p-3 bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-2xl space-y-1">
            <div className="flex items-center gap-1.5 text-[11px] font-black text-emerald-900">
              <Mic className="w-3.5 h-3.5 text-emerald-700" />
              <span>{language === 'hi' ? 'ग्राहक द्वारा बोली गई पर्ची (Voice Record):' : 'Customer Voice Audio Transcript:'}</span>
            </div>
            <p className="text-xs text-slate-800 italic bg-white/80 p-2 rounded-xl border border-emerald-100 font-medium">
              "{request.rawVoiceTranscript}"
            </p>
          </div>
        )}

        {/* Line Items Pricing & Availability Table */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-slate-900 flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5 text-emerald-700" />
              <span>{language === 'hi' ? 'सामान का भाव व उपलब्धता तय करें' : 'Set Item Prices & Availability'}</span>
            </span>
            <span className="text-[10px] text-slate-500">
              {language === 'hi' ? '₹ भाव भरें या बदलें' : 'Enter or adjust unit price'}
            </span>
          </div>

          <div className="border border-slate-200 rounded-2xl overflow-hidden divide-y divide-slate-100 bg-white">
            {items.map((item, idx) => {
              const lineTotal = item.isAvailable
                ? Math.round(item.unitPrice * item.quantityMultiplier * item.quantityCount * 100) / 100
                : 0;

              return (
                <div
                  key={item.id}
                  className={`p-3 transition-colors ${
                    !item.isAvailable ? 'bg-slate-50 opacity-60' : 'hover:bg-slate-50/50'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    {/* Item info */}
                    <div className="flex items-start gap-2.5 flex-1 min-w-0">
                      {item.productImage && item.productImage.trim() !== '' ? (
                        <img
                          src={item.productImage}
                          alt={item.productName}
                          referrerPolicy="no-referrer"
                          className="w-10 h-10 rounded-xl object-cover border border-slate-200 shrink-0"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 text-slate-600 flex items-center justify-center font-bold text-xs shrink-0">
                          {idx + 1}
                        </div>
                      )}

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <p className="text-xs font-black text-slate-900">{item.productName}</p>
                          <span className="px-1.5 py-0.2 bg-slate-100 text-slate-700 text-[9px] font-bold rounded">
                            {item.unitDisplay}
                          </span>
                        </div>

                        <p className="text-[11px] text-slate-500 mt-0.5">
                          <span className="font-semibold text-emerald-800">ग्राहक ने मांगा: </span>
                          "{item.originalText}"
                        </p>
                      </div>
                    </div>

                    {/* Pricing Input & Availability Toggle */}
                    <div className="flex items-center gap-2 shrink-0">
                      {/* Price input */}
                      <div className="flex items-center bg-slate-50 border border-slate-300 rounded-xl px-2 py-1 focus-within:ring-2 focus-within:ring-emerald-500 focus-within:bg-white">
                        <span className="text-xs font-bold text-slate-500 mr-1">₹</span>
                        <input
                          type="number"
                          min="0"
                          step="1"
                          disabled={!item.isAvailable || isAlreadyFinalized || isPaid}
                          value={item.unitPrice}
                          onChange={(e) => handlePriceChange(item.id, parseFloat(e.target.value) || 0)}
                          className="w-14 text-xs font-black text-slate-900 bg-transparent focus:outline-none"
                        />
                      </div>

                      {/* Availability toggle */}
                      {!isPaid && (
                        <button
                          type="button"
                          onClick={() => handleToggleAvailable(item.id)}
                          className={`px-2 py-1 rounded-xl text-[10px] font-bold border transition-all cursor-pointer ${
                            item.isAvailable
                              ? 'bg-emerald-50 border-emerald-300 text-emerald-800 hover:bg-emerald-100'
                              : 'bg-rose-50 border-rose-300 text-rose-800 hover:bg-rose-100'
                          }`}
                        >
                          {item.isAvailable ? (
                            <span className="flex items-center gap-1">
                              <Check className="w-3 h-3 text-emerald-700" />
                              {language === 'hi' ? 'उपलब्ध' : 'Avail'}
                            </span>
                          ) : (
                            <span className="flex items-center gap-1">
                              <X className="w-3 h-3 text-rose-700" />
                              {language === 'hi' ? 'नहीं है' : 'Out'}
                            </span>
                          )}
                        </button>
                      )}

                      {/* Line Total */}
                      <div className="text-right w-14">
                        <span className="text-xs font-black text-slate-900 font-mono">
                          {item.isAvailable ? `₹${lineTotal}` : '—'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Optional Seller Note input per item */}
                  {item.isAvailable && !isAlreadyFinalized && !isPaid && (
                    <div className="mt-2 pl-12">
                      <input
                        type="text"
                        placeholder={language === 'hi' ? 'ग्राहक के लिए नोट (उदा. 500g पैकेट उपलब्ध है)' : 'Note for customer...'}
                        value={item.sellerNote}
                        onChange={(e) => handleNoteChange(item.id, e.target.value)}
                        className="w-full text-[10px] text-slate-700 px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:bg-white focus:ring-1 focus:ring-emerald-500"
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Delivery Fee Input (if Home Delivery) */}
        {request.fulfillmentType === FulfillmentType.HOME_DELIVERY && (
          <div className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl border border-slate-200">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-indigo-700" />
              <div>
                <p className="text-xs font-bold text-slate-900">
                  {language === 'hi' ? 'होम डिलीवरी शुल्क (Delivery Charges)' : 'Home Delivery Charges'}
                </p>
                <p className="text-[10px] text-slate-500">
                  {request.deliveryAddress?.street || 'Local Delivery'}
                </p>
              </div>
            </div>

            <div className="flex items-center bg-white border border-slate-300 rounded-xl px-2 py-1">
              <span className="text-xs font-bold text-slate-500 mr-1">₹</span>
              <input
                type="number"
                min="0"
                step="5"
                disabled={isAlreadyFinalized || isPaid}
                value={deliveryFee}
                onChange={(e) => setDeliveryFee(parseFloat(e.target.value) || 0)}
                className="w-12 text-xs font-black text-slate-900 bg-transparent focus:outline-none"
              />
            </div>
          </div>
        )}

        {/* Seller Notes for Customer */}
        {!isPaid && (
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700">
              {language === 'hi' ? 'ग्राहक के लिए विशेष संदेश (Optional Note):' : 'Special note to customer:'}
            </label>
            <input
              type="text"
              placeholder={language === 'hi' ? 'उदा. सारे सामान ताजे हैं, 10 मिनट में पिकअप कर सकते हैं' : 'E.g. Ready in 10 mins'}
              value={sellerNotes}
              onChange={(e) => setSellerNotes(e.target.value)}
              disabled={isAlreadyFinalized || isPaid}
              className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>
        )}

        {/* Bill Summary Calculation */}
        <div className="bg-emerald-50/70 border border-emerald-200 p-4 rounded-2xl space-y-2">
          <div className="flex justify-between text-xs text-slate-600 font-medium">
            <span>{language === 'hi' ? 'सामान का कुल मूल्य (Subtotal):' : 'Items Subtotal:'}</span>
            <span className="font-bold text-slate-900 font-mono">₹{roundedSubtotal}</span>
          </div>

          {request.fulfillmentType === FulfillmentType.HOME_DELIVERY && (
            <div className="flex justify-between text-xs text-slate-600 font-medium">
              <span>{language === 'hi' ? 'डिलीवरी चार्ज:' : 'Delivery Fee:'}</span>
              <span className="font-bold text-slate-900 font-mono">₹{effectiveDeliveryFee}</span>
            </div>
          )}

          <div className="pt-2 border-t border-emerald-200 flex justify-between items-center text-sm font-black text-emerald-950">
            <span>{language === 'hi' ? 'ग्राहक का फाइनल बिल (Total Bill):' : 'Final Customer Bill:'}</span>
            <span className="text-lg font-black text-emerald-700 font-mono">₹{finalTotal}</span>
          </div>
        </div>

        {/* Actions Footer */}
        <div className="pt-2 flex gap-2">
          {!isPaid && (
            <button
              type="button"
              onClick={handleReject}
              disabled={isRejecting || isSubmitting}
              className="px-4 py-3 rounded-xl border border-rose-300 text-rose-700 hover:bg-rose-50 font-bold text-xs transition-colors cursor-pointer"
            >
              {isRejecting ? <Loader2 className="w-4 h-4 animate-spin" /> : language === 'hi' ? 'अस्वीकार' : 'Reject'}
            </button>
          )}

          <button
            type="button"
            onClick={handleFinalizeBill}
            disabled={isSubmitting || isPaid || roundedSubtotal <= 0}
            className="flex-1 py-3.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-lg shadow-emerald-200 flex items-center justify-center gap-2 transition-all disabled:opacity-50 cursor-pointer"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>{language === 'hi' ? 'बिल भेजा जा रहा है...' : 'Sending Bill...'}</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>
                  {language === 'hi'
                    ? `बिल फाइनल करें और ग्राहक को भेजें (₹${finalTotal})`
                    : `Finalize & Send Bill (₹${finalTotal})`}
                </span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

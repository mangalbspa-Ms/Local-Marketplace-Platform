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

  const [isTranscriptExpanded, setIsTranscriptExpanded] = useState<boolean>(false);
  const [openNoteItemIds, setOpenNoteItemIds] = useState<Record<string, boolean>>({});

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
    setOpenNoteItemIds({});
    setIsTranscriptExpanded(false);
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

  const toggleNoteInput = (id: string) => {
    setOpenNoteItemIds((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
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
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="bg-white border border-slate-200 rounded-t-3xl sm:rounded-3xl w-full max-w-xl shadow-2xl max-h-[94vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Compact Header */}
        <div className="px-4 py-2.5 border-b border-slate-100 flex items-center justify-between shrink-0 bg-white">
          <div className="flex items-center gap-2 min-w-0">
            <span className="px-2 py-0.5 rounded-full bg-emerald-100 border border-emerald-300 text-emerald-950 text-[10px] font-black tracking-wide font-mono shrink-0">
              {request.requestNumber}
            </span>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold truncate shrink-0 ${
                isPaid
                  ? 'bg-emerald-100 text-emerald-800'
                  : isAlreadyFinalized
                  ? 'bg-blue-100 text-blue-800'
                  : 'bg-amber-100 text-amber-800'
              }`}
            >
              {isPaid
                ? (language === 'hi' ? '✅ भुगतान हो गया' : '✅ Paid')
                : isAlreadyFinalized
                ? (language === 'hi' ? '⏳ पेमेंट का इंतजार' : '⏳ Awaiting Payment')
                : (language === 'hi' ? '📥 ग्राहक पर्ची (Review & Rate)' : '📥 Customer Request (Review & Rate)')}
            </span>
            <span className="text-xs font-black text-slate-900 truncate">
              {language === 'hi' ? 'दुकानदार फाइनल बिल' : 'Seller Bill'}
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-900 flex items-center justify-center text-xs font-bold cursor-pointer transition shrink-0 ml-2"
          >
            ✕
          </button>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="px-3 py-2 mx-3 mt-2 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-xs text-rose-700 shrink-0">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Context Bar: Customer Profile & Compact Voice Transcript */}
        <div className="px-3.5 pt-2 pb-2 space-y-1.5 shrink-0 bg-slate-50/60 border-b border-slate-100">
          {/* Customer Profile & Fulfillment Header (Slim Row) */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              {request.customerAvatar && request.customerAvatar.trim() !== '' ? (
                <img
                  src={request.customerAvatar}
                  alt={request.customerName}
                  referrerPolicy="no-referrer"
                  className="w-7 h-7 rounded-full object-cover border border-emerald-400 shrink-0"
                />
              ) : (
                <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-black text-[11px] border border-emerald-300 shrink-0">
                  {request.customerName.slice(0, 2).toUpperCase()}
                </div>
              )}

              <div className="min-w-0">
                <p className="text-xs font-black text-slate-900 truncate leading-tight">
                  {request.customerName}
                </p>
                <p className="text-[10px] text-slate-500 flex items-center gap-1 font-mono leading-none mt-0.5">
                  <Phone className="w-2.5 h-2.5 text-emerald-700 shrink-0" />
                  <span>{request.customerPhone}</span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <span
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-extrabold ${
                  request.fulfillmentType === FulfillmentType.STORE_PICKUP
                    ? 'bg-amber-100 text-amber-900 border border-amber-300'
                    : 'bg-indigo-100 text-indigo-900 border border-indigo-300'
                }`}
              >
                {request.fulfillmentType === FulfillmentType.STORE_PICKUP ? (
                  <>
                    <Store className="w-3 h-3" />
                    <span>{language === 'hi' ? 'दुकान पिकअप' : 'Pickup'}</span>
                  </>
                ) : (
                  <>
                    <MapPin className="w-3 h-3" />
                    <span>{language === 'hi' ? 'होम डिलीवरी' : 'Delivery'}</span>
                  </>
                )}
              </span>
              <span className="text-[10px] text-slate-400 font-mono hidden sm:inline">
                {new Date(request.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          </div>

          {/* Customer Voice Transcript (Compact 1-2 Lines with Toggle) */}
          {request.rawVoiceTranscript && (
            <div className="px-2.5 py-1.5 bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200/80 rounded-xl">
              <div className="flex items-center justify-between text-[10px] font-bold text-emerald-900">
                <span className="flex items-center gap-1">
                  <Mic className="w-3 h-3 text-emerald-700 shrink-0" />
                  <span>{language === 'hi' ? 'ग्राहक द्वारा बोली गई पर्ची (Voice Record):' : 'Voice Record:'}</span>
                </span>
                {request.rawVoiceTranscript.length > 80 && (
                  <button
                    type="button"
                    onClick={() => setIsTranscriptExpanded((prev) => !prev)}
                    className="text-emerald-700 hover:text-emerald-950 text-[10px] font-extrabold cursor-pointer ml-1"
                  >
                    {isTranscriptExpanded ? (language === 'hi' ? 'कम देखें ▲' : 'Less ▲') : (language === 'hi' ? 'पूरा देखें ▼' : 'Full ▼')}
                  </button>
                )}
              </div>
              <p
                className={`text-[11px] text-slate-800 italic font-medium mt-0.5 leading-snug ${
                  isTranscriptExpanded ? '' : 'line-clamp-2'
                }`}
              >
                "{request.rawVoiceTranscript}"
              </p>
            </div>
          )}
        </div>

        {/* Sticky Items List Bar */}
        <div className="px-3.5 py-1.5 bg-slate-100/70 border-b border-slate-200/70 flex items-center justify-between text-[11px] font-black text-slate-700 shrink-0">
          <span className="flex items-center gap-1.5">
            <Tag className="w-3.5 h-3.5 text-emerald-700" />
            <span>{language === 'hi' ? 'पर्ची सामान सूची' : 'Parchi Items List'} ({items.length})</span>
          </span>
          <div className="flex items-center gap-3 text-[10px] text-slate-500 font-semibold">
            <span className="hidden sm:inline">{language === 'hi' ? '₹ भाव भरें / बदलें' : 'Set unit price'}</span>
            <span>{language === 'hi' ? 'उपलब्धता' : 'Status'}</span>
          </div>
        </div>

        {/* Scrollable Compact Items List (Holds all 10 items in clean 65-80px rows) */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-100 bg-white min-h-[220px] max-h-[50vh] sm:max-h-[56vh] overscroll-contain">
          {items.map((item, idx) => {
            const lineTotal = item.isAvailable
              ? Math.round(item.unitPrice * item.quantityMultiplier * item.quantityCount * 100) / 100
              : 0;

            return (
              <div
                key={item.id}
                id={`parchi-item-${item.id}`}
                className={`px-3 py-2 transition-colors ${
                  !item.isAvailable ? 'bg-slate-50/80 opacity-60' : 'hover:bg-slate-50/60'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  {/* Left: 40px Photo + Name (max 2 lines) + Requested portion & Note trigger */}
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    {/* Small 40px Product Photo */}
                    {item.productImage && item.productImage.trim() !== '' ? (
                      <img
                        src={item.productImage}
                        alt={item.productName}
                        referrerPolicy="no-referrer"
                        className="w-10 h-10 rounded-lg object-cover border border-slate-200 shrink-0 bg-slate-100 shadow-2xs"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center justify-center font-black text-xs shrink-0">
                        {idx + 1}
                      </div>
                    )}

                    <div className="min-w-0 flex-1">
                      {/* Product Name (Full true name, strictly capped to 2 lines with ellipsis) */}
                      <p
                        className="text-xs font-bold text-slate-900 leading-snug line-clamp-2"
                        title={item.productName}
                      >
                        {item.productName}
                      </p>

                      {/* Small line: Requested Qty/Unit + Customer's original text + Note action */}
                      <div className="flex items-center gap-1.5 flex-wrap mt-0.5 text-[10px]">
                        <span className="font-bold text-emerald-700 bg-emerald-50 border border-emerald-200/80 px-1 py-0.2 rounded shrink-0">
                          {item.unitDisplay}
                        </span>

                        {item.originalText && (
                          <span
                            className="text-slate-500 truncate max-w-[125px] sm:max-w-[210px]"
                            title={language === 'hi' ? `ग्राहक ने मांगा: ${item.originalText}` : `Customer requested: ${item.originalText}`}
                          >
                            • <span className="text-slate-400 font-medium">{language === 'hi' ? 'मांगा:' : 'Req:'}</span> {item.originalText}
                          </span>
                        )}

                        {/* Note toggle action or compact chip */}
                        {!isAlreadyFinalized && !isPaid && item.isAvailable && (
                          item.sellerNote ? (
                            <button
                              type="button"
                              onClick={() => toggleNoteInput(item.id)}
                              className="text-cyan-700 hover:text-cyan-900 font-semibold flex items-center gap-0.5 cursor-pointer shrink-0"
                              title={item.sellerNote}
                            >
                              <FileText className="w-2.5 h-2.5" />
                              <span className="truncate max-w-[80px]">"{item.sellerNote}"</span>
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => toggleNoteInput(item.id)}
                              className="text-slate-400 hover:text-cyan-700 font-medium cursor-pointer shrink-0"
                            >
                              + {language === 'hi' ? 'नोट' : 'Note'}
                            </button>
                          )
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right: Compact Price Input + Compact Available Toggle */}
                  <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                    {/* Price Input (Compact with ₹ prefix) */}
                    <div className="flex items-center bg-slate-50 border border-slate-300 rounded-lg px-1.5 py-0.5 focus-within:ring-1 focus-within:ring-emerald-500 focus-within:bg-white focus-within:border-emerald-500">
                      <span className="text-[11px] font-bold text-slate-500 mr-0.5">₹</span>
                      <input
                        id={`price-input-${item.id}`}
                        type="number"
                        min="0"
                        step="1"
                        disabled={!item.isAvailable || isAlreadyFinalized || isPaid}
                        value={item.unitPrice}
                        onChange={(e) => handlePriceChange(item.id, parseFloat(e.target.value) || 0)}
                        className="w-11 sm:w-14 text-xs font-black text-slate-900 bg-transparent focus:outline-none text-right"
                      />
                    </div>

                    {/* Availability Toggle Button */}
                    {!isPaid && (
                      <button
                        id={`avail-btn-${item.id}`}
                        type="button"
                        onClick={() => handleToggleAvailable(item.id)}
                        disabled={isAlreadyFinalized}
                        className={`px-2 py-1 rounded-lg text-[10px] font-extrabold border transition-all cursor-pointer flex items-center gap-1 shrink-0 ${
                          item.isAvailable
                            ? 'bg-emerald-50 border-emerald-300 text-emerald-800 hover:bg-emerald-100 shadow-2xs'
                            : 'bg-rose-50 border-rose-300 text-rose-700 hover:bg-rose-100'
                        }`}
                      >
                        {item.isAvailable ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-700 stroke-[2.5]" />
                            <span>{language === 'hi' ? 'उपलब्ध' : 'Avail'}</span>
                          </>
                        ) : (
                          <>
                            <X className="w-3 h-3 text-rose-700 stroke-[2.5]" />
                            <span>{language === 'hi' ? 'नहीं है' : 'Out'}</span>
                          </>
                        )}
                      </button>
                    )}

                    {/* Line total (visible on sm screens) */}
                    <div className="text-right w-11 shrink-0 hidden sm:block">
                      <span className="text-xs font-black text-slate-900 font-mono">
                        {item.isAvailable ? `₹${lineTotal}` : '—'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Inline Seller Note Input (Only shown if toggled open) */}
                {openNoteItemIds[item.id] && item.isAvailable && !isAlreadyFinalized && !isPaid && (
                  <div className="mt-1.5 pt-1 border-t border-slate-100 flex items-center gap-1.5 pl-12">
                    <FileText className="w-3 h-3 text-slate-400 shrink-0" />
                    <input
                      type="text"
                      placeholder={language === 'hi' ? 'ग्राहक के लिए नोट लिखें (उदा. 500g उपलब्ध है)...' : 'Note for customer...'}
                      value={item.sellerNote}
                      onChange={(e) => handleNoteChange(item.id, e.target.value)}
                      className="flex-1 text-[10px] text-slate-700 px-2 py-0.5 bg-slate-50 border border-slate-200 rounded focus:outline-none focus:bg-white focus:border-cyan-500"
                    />
                    <button
                      type="button"
                      onClick={() => toggleNoteInput(item.id)}
                      className="text-[10px] text-slate-500 hover:text-slate-800 px-1 font-bold cursor-pointer"
                    >
                      ✕
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Compact Footer: Delivery charges, overall note, summary & action buttons */}
        <div className="px-3.5 py-2.5 bg-slate-50 border-t border-slate-200/80 space-y-2 shrink-0">
          {/* Home Delivery Fee Input (if Home Delivery) */}
          {request.fulfillmentType === FulfillmentType.HOME_DELIVERY && (
            <div className="flex items-center justify-between p-2 bg-white rounded-xl border border-slate-200">
              <div className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-indigo-700 shrink-0" />
                <div>
                  <p className="text-xs font-bold text-slate-900 leading-tight">
                    {language === 'hi' ? 'होम डिलीवरी शुल्क' : 'Home Delivery Charges'}
                  </p>
                  <p className="text-[10px] text-slate-400 truncate max-w-[200px]">
                    {request.deliveryAddress?.street || 'Local Delivery'}
                  </p>
                </div>
              </div>

              <div className="flex items-center bg-slate-50 border border-slate-300 rounded-lg px-2 py-0.5">
                <span className="text-xs font-bold text-slate-500 mr-1">₹</span>
                <input
                  type="number"
                  min="0"
                  step="5"
                  disabled={isAlreadyFinalized || isPaid}
                  value={deliveryFee}
                  onChange={(e) => setDeliveryFee(parseFloat(e.target.value) || 0)}
                  className="w-12 text-xs font-black text-slate-900 bg-transparent focus:outline-none text-right"
                />
              </div>
            </div>
          )}

          {/* Seller Notes for Customer (Compact single line) */}
          {!isPaid && (
            <div className="flex items-center gap-1.5">
              <input
                type="text"
                placeholder={language === 'hi' ? 'ग्राहक के लिए विशेष संदेश (उदा. 10 मिनट में तैयार मिलेगा)...' : 'Special note to customer...'}
                value={sellerNotes}
                onChange={(e) => setSellerNotes(e.target.value)}
                disabled={isAlreadyFinalized || isPaid}
                className="w-full text-xs px-2.5 py-1.5 bg-white border border-slate-200 rounded-xl focus:ring-1 focus:ring-emerald-500 focus:outline-none placeholder:text-slate-400"
              />
            </div>
          )}

          {/* Bill Summary Calculation (Compact Card) */}
          <div className="bg-emerald-50/80 border border-emerald-200 px-3.5 py-2 rounded-xl">
            <div className="flex justify-between text-xs text-slate-700">
              <span>{language === 'hi' ? 'कुल सामान मूल्य (Subtotal):' : 'Items Subtotal:'}</span>
              <span className="font-bold text-slate-900 font-mono">₹{roundedSubtotal}</span>
            </div>

            {request.fulfillmentType === FulfillmentType.HOME_DELIVERY && (
              <div className="flex justify-between text-xs text-slate-700 mt-0.5">
                <span>{language === 'hi' ? 'डिलीवरी चार्ज:' : 'Delivery Fee:'}</span>
                <span className="font-bold text-slate-900 font-mono">₹{effectiveDeliveryFee}</span>
              </div>
            )}

            <div className="pt-1.5 mt-1 border-t border-emerald-200 flex justify-between items-center text-sm font-black text-emerald-950">
              <span>{language === 'hi' ? 'ग्राहक का फाइनल बिल (Total):' : 'Final Bill:'}</span>
              <span className="text-base sm:text-lg font-black text-emerald-700 font-mono">₹{finalTotal}</span>
            </div>
          </div>

          {/* Actions Footer */}
          <div className="flex gap-2">
            {!isPaid && (
              <button
                type="button"
                onClick={handleReject}
                disabled={isRejecting || isSubmitting}
                className="px-3 py-2.5 rounded-xl border border-rose-300 text-rose-700 hover:bg-rose-50 font-bold text-xs transition-colors cursor-pointer shrink-0"
              >
                {isRejecting ? <Loader2 className="w-4 h-4 animate-spin" /> : language === 'hi' ? 'अस्वीकार' : 'Reject'}
              </button>
            )}

            <button
              type="button"
              onClick={handleFinalizeBill}
              disabled={isSubmitting || isPaid || roundedSubtotal <= 0}
              className="flex-1 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs sm:text-sm shadow-md shadow-emerald-200 flex items-center justify-center gap-1.5 transition-all disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>{language === 'hi' ? 'बिल भेजा जा रहा है...' : 'Sending Bill...'}</span>
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  <span>
                    {language === 'hi'
                      ? `बिल फाइनल करें और भेजें (₹${finalTotal})`
                      : `Finalize & Send Bill (₹${finalTotal})`}
                  </span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

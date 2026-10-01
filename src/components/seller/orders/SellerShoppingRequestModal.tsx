/**
 * Seller Shopping Request Review & Bill Finalization Modal
 * 
 * Allows kirana storekeeper to:
 * 1. View customer voice shopping list with natural Hindi/Hinglish transcripts
 * 2. Set final prices and edit item quantities
 * 3. Mark availability per item (उपलब्ध / नहीं है)
 * 4. Add custom seller notes, delivery charges, and optional discounts
 * 5. Save draft bill without notifying customer
 * 6. View Draft / Final Bill Preview with exact calculation
 * 7. Explicitly send final bill to customer ("Customer को Final Bill भेजें")
 */

import React, { useState, useEffect } from 'react';
import { ShoppingRequest, ShoppingRequestStatus, FinalizeBillDTO } from '../../../types/shoppingRequest.ts';
import { FulfillmentType, OrderItem } from '../../../types/order.ts';
import { ProductUnitType } from '../../../types/product.ts';
import { sellerApi } from '../../../services/sellerApi.ts';
import { useSellerLanguage } from '../../../context/SellerLanguageContext.tsx';
import { calculateOrderTotal } from '../../../services/pricingEngine.ts';
import {
  Mic,
  Send,
  AlertCircle,
  Store,
  CheckCircle2,
  Clock,
  MapPin,
  Phone,
  IndianRupee,
  Check,
  X,
  Loader2,
  FileText,
  Tag,
  ShieldCheck,
  ChevronLeft,
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
  const [discount, setDiscount] = useState<number>(0);
  const [sellerNotes, setSellerNotes] = useState<string>('');
  const [viewMode, setViewMode] = useState<'edit' | 'preview'>('edit');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isSavingDraft, setIsSavingDraft] = useState<boolean>(false);
  const [isRejecting, setIsRejecting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [isTranscriptExpanded, setIsTranscriptExpanded] = useState<boolean>(false);
  const [openNoteItemIds, setOpenNoteItemIds] = useState<Record<string, boolean>>({});

  // Initialize editable state whenever request opens
  useEffect(() => {
    if (!request) return;

    // Check if draft bill or final bill already exists
    const existingBill = request.draftBill || request.finalBill;

    const initialItems: EditableBillItem[] = request.items.map((i) => {
      const billItem = existingBill?.items?.find((bi) => bi.productId === i.matchedProductId || bi.productId === i.id || bi.productName === (i.matchedProductName || i.rawItemName));
      
      // Determine default unit price:
      // If billItem exists, take its calculated price
      // Else if i.unitPrice is present, use it
      // Else estimate 20-30
      let price = billItem ? billItem.unitItemPriceCalculated : (i.unitPrice ?? (i.isPriceEstimated ? 30 : 20));

      const count = billItem ? (billItem.quantityCount || 1) : (i.quantityCount || 1);
      const isAvail = billItem ? (billItem.isAvailable !== false) : (i.isAvailable !== false);
      const note = billItem?.notes || i.sellerNote || '';

      return {
        id: i.id,
        originalText: i.originalText,
        rawItemName: i.rawItemName,
        productId: i.matchedProductId,
        productName: i.matchedProductName || i.rawItemName,
        productImage: i.matchedProductImage,
        unitPrice: Math.max(0, price),
        quantityCount: Math.max(1, count),
        quantityMultiplier: i.quantityMultiplier || 1.0,
        unitDisplay: i.unitDisplay || `${count} unit`,
        baseUnit: i.baseUnit || 'piece',
        isAvailable: isAvail,
        sellerNote: note,
      };
    });

    setItems(initialItems);
    setDiscount(existingBill?.discount ?? 0);
    setDeliveryFee(
      existingBill?.deliveryFee !== undefined
        ? existingBill.deliveryFee
        : (request.fulfillmentType === FulfillmentType.HOME_DELIVERY ? 20 : 0)
    );
    setSellerNotes(existingBill?.sellerNotes || request.sellerNotes || '');
    setErrorMessage(null);
    setSuccessMessage(null);
    setOpenNoteItemIds({});
    setIsTranscriptExpanded(false);
    setViewMode('edit');
  }, [request]);

  if (!isOpen || !request) return null;

  const handlePriceChange = (id: string, newPrice: number) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, unitPrice: Math.max(0, newPrice) } : item
      )
    );
  };

  const handleQuantityChange = (id: string, newCount: number) => {
    const validCount = Math.max(1, Math.floor(newCount));
    setItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, quantityCount: validCount } : item
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

  // Immediate recalculation from the current order items every time
  const activeItems = items.filter((i) => i.isAvailable);
  const subtotal = activeItems.reduce((sum, item) => {
    return sum + Math.round(item.unitPrice * item.quantityCount * 100) / 100;
  }, 0);

  const roundedSubtotal = Math.round(subtotal * 100) / 100;
  const effectiveDiscount = Math.max(0, Math.min(Number(discount) || 0, roundedSubtotal));
  const effectiveDeliveryFee = request.fulfillmentType === FulfillmentType.HOME_DELIVERY
    ? Math.max(0, Number(deliveryFee) || 0)
    : 0;
  const platformFee = 0;

  // Order items formatted for centralized calculateOrderTotal
  const orderItems: OrderItem[] = activeItems.map((i) => ({
    productId: i.productId || i.id,
    productName: i.productName,
    productImage: i.productImage,
    unitType: ProductUnitType.PIECE,
    baseUnit: i.baseUnit as any,
    basePriceAtOrderTime: i.unitPrice,
    orderedQuantityMultiplier: i.quantityMultiplier || 1.0,
    orderedQuantityDisplay: i.unitDisplay,
    quantityInBaseUnits: (i.quantityMultiplier || 1.0) * i.quantityCount,
    unitItemPriceCalculated: i.unitPrice,
    quantityCount: i.quantityCount,
    lineItemTotal: Math.round(i.unitPrice * i.quantityCount * 100) / 100,
    notes: i.sellerNote,
    isAvailable: true,
  }));

  const finalTotal = calculateOrderTotal(orderItems, {
    deliveryFee: effectiveDeliveryFee,
    platformFee: 0,
    discount: effectiveDiscount,
  });

  const buildPayload = (isDraft: boolean): FinalizeBillDTO => ({
    deliveryFee: effectiveDeliveryFee,
    discount: effectiveDiscount,
    sellerNotes,
    isDraft,
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
  });

  // Action: Save Draft Final Bill without notifying Customer
  const handleSaveDraft = async () => {
    if (activeItems.length === 0) {
      setErrorMessage(
        language === 'hi'
          ? 'कम से कम एक सामान उपलब्ध होना चाहिए।'
          : 'At least one item must be marked as available.'
      );
      return;
    }

    setIsSavingDraft(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const payload = buildPayload(true);
      const updated = await sellerApi.finalizeBill(request.id, payload);
      setSuccessMessage(
        language === 'hi'
          ? 'ड्राफ्ट बिल सेव हो गया! ग्राहक को अभी बिल नहीं भेजा गया है।'
          : 'Draft bill saved! Bill has not been sent to customer yet.'
      );
      onBillFinalized(updated);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to save draft');
    } finally {
      setIsSavingDraft(false);
    }
  };

  // Action: Explicitly send Final Bill to Customer ("Customer को Final Bill भेजें")
  const handleSendFinalBill = async () => {
    if (activeItems.length === 0) {
      setErrorMessage(
        language === 'hi'
          ? 'कम से कम एक सामान उपलब्ध होना चाहिए।'
          : 'At least one item must be marked as available.'
      );
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const payload = buildPayload(false);
      const updated = await sellerApi.finalizeBill(request.id, payload);
      onBillFinalized(updated);
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to send final bill');
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
                : viewMode === 'preview'
                ? (language === 'hi' ? '👁️ फाइनल बिल ड्राफ्ट प्रीव्यू' : '👁️ Bill Draft Preview')
                : (language === 'hi' ? '📥 ग्राहक पर्ची (Review & Rate)' : '📥 Customer Request')}
            </span>
            <span className="text-xs font-black text-slate-900 truncate">
              {language === 'hi' ? 'दुकानदार फाइनल बिल' : 'Seller Final Bill'}
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

        {/* Success Alert */}
        {successMessage && (
          <div className="px-3 py-2 mx-3 mt-2 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-xs text-emerald-800 shrink-0">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Context Bar: Customer Profile & Compact Voice Transcript */}
        <div className="px-3.5 pt-2 pb-2 space-y-1.5 shrink-0 bg-slate-50/60 border-b border-slate-100">
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

          {/* Customer Voice Transcript */}
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

        {/* ------------------------------------------------------------------ */}
        {/* VIEW MODE 1: EDIT BILL (Prices, Quantities, Notes, Availability)     */}
        {/* ------------------------------------------------------------------ */}
        {viewMode === 'edit' && (
          <>
            {/* Sticky Items List Bar */}
            <div className="px-3.5 py-1.5 bg-slate-100/70 border-b border-slate-200/70 flex items-center justify-between text-[11px] font-black text-slate-700 shrink-0">
              <span className="flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-emerald-700" />
                <span>{language === 'hi' ? 'पर्ची सामान सूची' : 'Parchi Items'} ({items.length})</span>
              </span>
              <div className="flex items-center gap-3 text-[10px] text-slate-500 font-semibold">
                <span>{language === 'hi' ? 'मात्रा (Qty)' : 'Qty'}</span>
                <span>{language === 'hi' ? '₹ भाव (Price)' : '₹ Unit Price'}</span>
                <span>{language === 'hi' ? 'उपलब्ध' : 'Avail'}</span>
              </div>
            </div>

            {/* Scrollable Compact Items List */}
            <div className="flex-1 overflow-y-auto divide-y divide-slate-100 bg-white min-h-[200px] max-h-[46vh] sm:max-h-[52vh] overscroll-contain">
              {items.map((item, idx) => {
                const lineTotal = item.isAvailable
                  ? Math.round(item.unitPrice * item.quantityCount * 100) / 100
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
                      {/* Left: Photo + Name + Portion info + Note trigger */}
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
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
                          <p
                            className="text-xs font-bold text-slate-900 leading-snug line-clamp-2"
                            title={item.productName}
                          >
                            {item.productName}
                          </p>

                          <div className="flex items-center gap-1.5 flex-wrap mt-0.5 text-[10px]">
                            <span className="font-bold text-emerald-700 bg-emerald-50 border border-emerald-200/80 px-1 py-0.2 rounded shrink-0">
                              {item.unitDisplay}
                            </span>

                            {item.originalText && (
                              <span
                                className="text-slate-500 truncate max-w-[110px] sm:max-w-[180px]"
                                title={item.originalText}
                              >
                                • <span className="text-slate-400 font-medium">{language === 'hi' ? 'मांगा:' : 'Req:'}</span> {item.originalText}
                              </span>
                            )}

                            {!isAlreadyFinalized && !isPaid && item.isAvailable && (
                              item.sellerNote ? (
                                <button
                                  type="button"
                                  onClick={() => toggleNoteInput(item.id)}
                                  className="text-cyan-700 hover:text-cyan-900 font-semibold flex items-center gap-0.5 cursor-pointer shrink-0"
                                  title={item.sellerNote}
                                >
                                  <FileText className="w-2.5 h-2.5" />
                                  <span className="truncate max-w-[70px]">"{item.sellerNote}"</span>
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

                      {/* Right: Quantity Stepper + Price Input + Availability Toggle + Line Total */}
                      <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                        {/* Quantity Stepper */}
                        <div className="flex items-center bg-slate-100 border border-slate-300 rounded-lg p-0.5">
                          <button
                            type="button"
                            onClick={() => handleQuantityChange(item.id, item.quantityCount - 1)}
                            disabled={item.quantityCount <= 1 || !item.isAvailable || isAlreadyFinalized || isPaid}
                            className="w-5 h-5 flex items-center justify-center text-xs font-black text-slate-700 hover:bg-white rounded disabled:opacity-30 cursor-pointer"
                            title="Decrease quantity"
                          >
                            -
                          </button>
                          <input
                            type="number"
                            min="1"
                            step="1"
                            disabled={!item.isAvailable || isAlreadyFinalized || isPaid}
                            value={item.quantityCount}
                            onChange={(e) => handleQuantityChange(item.id, parseInt(e.target.value, 10) || 1)}
                            className="w-6 text-center text-xs font-black text-slate-900 bg-transparent focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                          />
                          <button
                            type="button"
                            onClick={() => handleQuantityChange(item.id, item.quantityCount + 1)}
                            disabled={!item.isAvailable || isAlreadyFinalized || isPaid}
                            className="w-5 h-5 flex items-center justify-center text-xs font-black text-slate-700 hover:bg-white rounded disabled:opacity-30 cursor-pointer"
                            title="Increase quantity"
                          >
                            +
                          </button>
                        </div>

                        {/* Price Input (₹ per unit) */}
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

                        {/* Availability Toggle */}
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

                        {/* Line Total */}
                        <div className="text-right w-12 sm:w-14 shrink-0">
                          <span className="text-xs font-black text-slate-900 font-mono">
                            {item.isAvailable ? `₹${lineTotal}` : '—'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Inline Seller Note Input */}
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

            {/* Footer with Delivery Fee, Optional Discount, Note, Summary & Actions */}
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

              {/* Optional Discount Input */}
              {!isPaid && (
                <div className="flex items-center justify-between p-2 bg-white rounded-xl border border-slate-200">
                  <div className="flex items-center gap-1.5">
                    <Tag className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                    <div>
                      <p className="text-xs font-bold text-slate-900 leading-tight">
                        {language === 'hi' ? 'छूट / डिस्काउंट (वैकल्पिक)' : 'Discount (Optional)'}
                      </p>
                      <p className="text-[10px] text-slate-400">
                        {language === 'hi' ? 'यदि कोई छूट नहीं है तो ₹0 रहने दें' : 'Leave ₹0 if no discount'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center bg-slate-50 border border-slate-300 rounded-lg px-2 py-0.5">
                    <span className="text-xs font-bold text-slate-500 mr-1">₹</span>
                    <input
                      id="seller-discount-input"
                      type="number"
                      min="0"
                      max={roundedSubtotal}
                      step="5"
                      disabled={isAlreadyFinalized || isPaid}
                      value={discount || ''}
                      placeholder="0"
                      onChange={(e) => setDiscount(Math.max(0, parseFloat(e.target.value) || 0))}
                      className="w-14 text-xs font-black text-slate-900 bg-transparent focus:outline-none text-right"
                    />
                  </div>
                </div>
              )}

              {/* Seller Notes for Customer */}
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

              {/* Live Recalculated Bill Summary */}
              <div className="bg-emerald-50/80 border border-emerald-200 px-3.5 py-2 rounded-xl">
                <div className="flex justify-between text-xs text-slate-700">
                  <span>{language === 'hi' ? 'कुल सामान मूल्य (Subtotal):' : 'Items Subtotal:'}</span>
                  <span className="font-bold text-slate-900 font-mono">₹{roundedSubtotal}</span>
                </div>

                {effectiveDiscount > 0 && (
                  <div className="flex justify-between text-xs text-emerald-700 mt-0.5">
                    <span>{language === 'hi' ? 'छूट (Discount):' : 'Discount:'}</span>
                    <span className="font-bold font-mono">-₹{effectiveDiscount}</span>
                  </div>
                )}

                {request.fulfillmentType === FulfillmentType.HOME_DELIVERY && (
                  <div className="flex justify-between text-xs text-slate-700 mt-0.5">
                    <span>{language === 'hi' ? 'डिलीवरी चार्ज:' : 'Delivery Fee:'}</span>
                    <span className="font-bold text-slate-900 font-mono">₹{effectiveDeliveryFee}</span>
                  </div>
                )}

                <div className="pt-1.5 mt-1 border-t border-emerald-200 flex justify-between items-center text-sm font-black text-emerald-950">
                  <span>{language === 'hi' ? 'ग्राहक का फाइनल बिल (Payable):' : 'Final Payable:'}</span>
                  <span className="text-base sm:text-lg font-black text-emerald-700 font-mono">₹{finalTotal}</span>
                </div>
              </div>

              {/* Actions Footer */}
              <div className="flex gap-2">
                {!isPaid && !isAlreadyFinalized && (
                  <button
                    type="button"
                    onClick={handleReject}
                    disabled={isRejecting || isSubmitting || isSavingDraft}
                    className="px-3 py-2.5 rounded-xl border border-rose-300 text-rose-700 hover:bg-rose-50 font-bold text-xs transition-colors cursor-pointer shrink-0"
                  >
                    {isRejecting ? <Loader2 className="w-4 h-4 animate-spin" /> : language === 'hi' ? 'अस्वीकार' : 'Reject'}
                  </button>
                )}

                {/* Save Draft Button (Does not notify customer) */}
                {!isPaid && !isAlreadyFinalized && (
                  <button
                    type="button"
                    onClick={handleSaveDraft}
                    disabled={isSavingDraft || isSubmitting || roundedSubtotal <= 0}
                    className="py-2.5 px-3 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-slate-800 font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-2xs shrink-0"
                    title={language === 'hi' ? 'ड्राफ्ट सेव करें (ग्राहक को बिल नहीं भेजा जाएगा)' : 'Save draft without sending to customer'}
                  >
                    {isSavingDraft ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <FileText className="w-3.5 h-3.5 text-slate-600" />
                    )}
                    <span>{language === 'hi' ? 'ड्राफ्ट सेव करें' : 'Save Draft'}</span>
                  </button>
                )}

                {/* Preview Final Bill Button */}
                <button
                  type="button"
                  onClick={() => setViewMode('preview')}
                  disabled={isSubmitting || roundedSubtotal <= 0}
                  className="flex-1 py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs sm:text-sm shadow-md shadow-emerald-200 flex items-center justify-center gap-1.5 transition-all disabled:opacity-50 cursor-pointer"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>
                    {language === 'hi'
                      ? `फाइनल बिल प्रीव्यू देखें (₹${finalTotal})`
                      : `Preview Final Bill (₹${finalTotal})`}
                  </span>
                </button>
              </div>
            </div>
          </>
        )}

        {/* ------------------------------------------------------------------ */}
        {/* VIEW MODE 2: DRAFT FINAL BILL PREVIEW & CONFIRMATION               */}
        {/* ------------------------------------------------------------------ */}
        {viewMode === 'preview' && (
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50 flex flex-col justify-between">
            <div className="space-y-3">
              {/* Preview Header Banner */}
              <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-300 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-xs">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-black text-emerald-950">
                      {language === 'hi' ? 'फाइनल बिल ड्राफ्ट व प्रीव्यू' : 'Final Bill Draft & Preview'}
                    </h3>
                    <p className="text-[10px] text-emerald-800">
                      {language === 'hi'
                        ? 'कृपया सभी सामान व राशि की पुष्टि करें। नीचे बटन दबाने पर ही ग्राहक को बिल भेजा जाएगा।'
                        : 'Review items and total. Bill will only be sent to customer when you click Send.'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Exact Itemized Snapshot Table */}
              <div className="bg-white border border-slate-200 rounded-2xl divide-y divide-slate-100 overflow-hidden shadow-2xs">
                <div className="px-3 py-1.5 bg-slate-100/80 text-[10px] font-black text-slate-600 flex justify-between">
                  <span>{language === 'hi' ? 'सामान विवरण' : 'Item Description'}</span>
                  <span>{language === 'hi' ? 'मात्रा × भाव = कुल' : 'Qty × Price = Total'}</span>
                </div>

                {items.map((item, idx) => (
                  <div
                    key={item.id}
                    className={`px-3 py-2 flex items-center justify-between text-xs ${
                      !item.isAvailable ? 'bg-slate-50 opacity-50' : ''
                    }`}
                  >
                    <div className="min-w-0 flex-1 pr-2">
                      <p className={`font-bold text-slate-900 truncate ${!item.isAvailable ? 'line-through text-slate-400' : ''}`}>
                        {idx + 1}. {item.productName}
                      </p>
                      <div className="flex items-center gap-1.5 text-[10px] text-slate-500 mt-0.5">
                        <span className="font-semibold text-emerald-700 bg-emerald-50 px-1 py-0.2 rounded">
                          {item.unitDisplay}
                        </span>
                        {item.sellerNote && (
                          <span className="italic text-indigo-700 bg-indigo-50 px-1 rounded">
                            "{item.sellerNote}"
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="text-right shrink-0 font-mono">
                      {item.isAvailable ? (
                        <div>
                          <span className="text-[11px] text-slate-500">
                            {item.quantityCount} × ₹{item.unitPrice} =
                          </span>{' '}
                          <span className="font-black text-slate-900">
                            ₹{Math.round(item.unitPrice * item.quantityCount * 100) / 100}
                          </span>
                        </div>
                      ) : (
                        <span className="px-1.5 py-0.5 bg-rose-50 text-rose-700 text-[9px] font-bold rounded border border-rose-200">
                          {language === 'hi' ? 'उपलब्ध नहीं' : 'Out of stock'}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Complete Financial Breakdown */}
              <div className="bg-white border border-slate-200 p-3.5 rounded-2xl space-y-2 shadow-2xs">
                <div className="flex justify-between text-xs text-slate-600">
                  <span>{language === 'hi' ? 'कुल सामान मूल्य (Items Subtotal):' : 'Items Subtotal:'}</span>
                  <span className="font-bold text-slate-900 font-mono">₹{roundedSubtotal}</span>
                </div>

                {effectiveDiscount > 0 && (
                  <div className="flex justify-between text-xs text-emerald-600 font-semibold">
                    <span>{language === 'hi' ? 'दुकानदार छूट (Discount):' : 'Discount:'}</span>
                    <span className="font-bold font-mono">-₹{effectiveDiscount}</span>
                  </div>
                )}

                {request.fulfillmentType === FulfillmentType.HOME_DELIVERY && (
                  <div className="flex justify-between text-xs text-slate-600">
                    <span>{language === 'hi' ? 'होम डिलीवरी शुल्क:' : 'Home Delivery Fee:'}</span>
                    <span className="font-bold text-slate-900 font-mono">₹{effectiveDeliveryFee}</span>
                  </div>
                )}

                <div className="pt-2 border-t border-slate-200 flex justify-between items-center text-sm font-black text-slate-900">
                  <span>{language === 'hi' ? 'ग्राहक द्वारा कुल देय राशि (Final Bill):' : 'Final Payable Amount:'}</span>
                  <span className="text-lg font-black text-emerald-700 font-mono">₹{finalTotal}</span>
                </div>
              </div>

              {sellerNotes && (
                <div className="p-2.5 bg-indigo-50/70 border border-indigo-200 rounded-xl text-xs text-indigo-900">
                  <span className="font-bold">{language === 'hi' ? 'ग्राहक के लिए नोट: ' : 'Note to customer: '}</span>
                  <span className="italic">"{sellerNotes}"</span>
                </div>
              )}
            </div>

            {/* Preview Action Buttons */}
            <div className="pt-3 border-t border-slate-200 flex gap-2">
              <button
                type="button"
                onClick={() => setViewMode('edit')}
                disabled={isSubmitting}
                className="py-3 px-4 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-slate-800 font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-2xs"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>{language === 'hi' ? 'बदलाव करें' : 'Edit Bill'}</span>
              </button>

              <button
                type="button"
                id="btn-send-final-bill"
                onClick={handleSendFinalBill}
                disabled={isSubmitting || roundedSubtotal <= 0}
                className="flex-1 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs sm:text-sm shadow-lg shadow-emerald-200 flex items-center justify-center gap-2 transition-all disabled:opacity-50 cursor-pointer"
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
                        ? `Customer को Final Bill भेजें (₹${finalTotal})`
                        : `Send Final Bill to Customer (₹${finalTotal})`}
                    </span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

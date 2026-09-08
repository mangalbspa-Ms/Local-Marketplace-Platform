/**
 * Customer Voice Shopping Request Modal
 * 
 * Digital Shopping Slip (दुकानदार की पर्ची) & Continuous Voice Assistant:
 * - Clean, compact Kirana receipt layout
 * - Real-time continuous speech with natural pause tolerance
 * - Strict utterance finalization (1300ms debounce) & no partial quantity items
 * - 2.5 second silence timeout with clear auto-stop status & easy resume
 * - Live temporary transcript separated from confirmed shopping slip items
 * - Immediate per-item deletion without interrupting active voice recording
 * - Preserves customer's original Hindi wording & matches catalog products
 * - Scoped directly to the currently opened shop profile
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useCustomerMarket } from '../../../context/CustomerMarketContext.tsx';
import { useCustomerLanguage } from '../../../context/CustomerLanguageContext.tsx';
import { FulfillmentType } from '../../../types/order.ts';
import { ShoppingRequest, CreateShoppingRequestDTO } from '../../../types/shoppingRequest.ts';
import { Shop } from '../../../types/market.ts';
import { Product } from '../../../types/product.ts';
import { customerApi } from '../../../services/customerApi.ts';
import {
  Mic,
  MicOff,
  ShoppingBag,
  Send,
  AlertCircle,
  Store,
  CheckCircle2,
  Trash2,
  Plus,
  Info,
  Clock,
  Loader2,
  MapPin,
  Sparkles,
} from 'lucide-react';
import {
  ParsedKiranaItem,
  isOnlyQuantityOrFiller,
  getProductEmoji,
  normalizeToken,
  removeRepeatedPhrases,
  hasQuantityOrPortion,
  hasCompletionVerb,
  hasMoneyAmount,
  hasPriceVariant,
  hasProductNoun,
  isCompleteThought,
  mergeUtteranceChunks,
  parseVoiceShoppingSlipItem,
  splitUtteranceByCatalogBoundaries,
} from './kiranaVoiceParser.ts';

interface VoiceShoppingRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRequestSubmitted?: (request: ShoppingRequest) => void;
  targetShop?: Shop | null;
  shopProducts?: Product[];
  existingCartItems?: any[];
}

export interface LiveVoiceItem {
  id: string;
  cleanTitle: string;
  originalText: string;
  rawItemName: string;
  productName?: string;
  brand?: string;
  variantPrice?: number;
  quantity?: number;
  unit?: string;
  weight?: string;
  totalPrice?: number;
  rawUtterance?: string;
  itemType?: 'variant' | 'price_variant' | 'money_amount' | 'weight' | 'quantity' | 'general';
  priceVariant?: number;
  priceVariantDisplay?: string;
  sizeVariant?: 'छोटा पैकेट' | 'बड़ा पैकेट';
  moneyAmount?: number;
  moneyAmountDisplay?: string;
  requestedPortion?: string;
  matchedProductId?: string;
  matchedProductName?: string;
  matchedProductImage?: string;
  unitPrice?: number;
  isPriceEstimated?: boolean;
  quantityCount: number;
  quantityMultiplier: number;
  unitDisplay: string;
  baseUnit: string;
  isCatalogMatch?: boolean;
  isCatalogSelected?: boolean;
  masterCategory?: string;
  masterProduct?: any;
}




export const VoiceShoppingRequestModal: React.FC<VoiceShoppingRequestModalProps> = ({
  isOpen,
  onClose,
  onRequestSubmitted,
  targetShop,
  shopProducts,
  existingCartItems,
}) => {
  const { shops } = useCustomerMarket();
  const { language } = useCustomerLanguage();

  const [isListening, setIsListening] = useState(false);
  const [voiceState, setVoiceState] = useState<'IDLE' | 'LISTENING' | 'PROCESSING' | 'ITEM_ADDED' | 'STOPPED'>('IDLE');
  const [liveTranscript, setLiveTranscript] = useState('');
  const [voiceStoppedReason, setVoiceStoppedReason] = useState<'silence' | 'user' | null>(null);
  const [manualInput, setManualInput] = useState('');
  const [selectedShopId, setSelectedShopId] = useState<string>(
    targetShop?.id || shops[0]?.id || 'shp_krishna_grocers'
  );
  const [loadedShopProducts, setLoadedShopProducts] = useState<Product[]>(shopProducts || []);
  const [fulfillmentType, setFulfillmentType] = useState<FulfillmentType>(FulfillmentType.STORE_PICKUP);
  const [customerNotes, setCustomerNotes] = useState('');
  const [isBrowserSupported, setIsBrowserSupported] = useState(true);

  // Confirmed shopping list items
  const [items, setItems] = useState<LiveVoiceItem[]>([]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState<ShoppingRequest | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Continuous speech session state references
  const isVoiceSessionActiveRef = useRef(false);
  const currentSessionIdRef = useRef<string>('');
  const processedUtterancesSetRef = useRef<Set<string>>(new Set());
  const isIntentionalStopRef = useRef(false);
  const isSilenceTimeoutRef = useRef(false);
  const isSpeakingInterimRef = useRef(false);
  const recognitionRef = useRef<any>(null);
  const restartTimeoutRef = useRef<any>(null);
  const silenceTimeoutRef = useRef<any>(null);
  const finalizationTimeoutRef = useRef<any>(null);
  const currentUtteranceBufferRef = useRef<string>('');
  const lastProcessedFinalIndexRef = useRef<number>(0);
  const deletedKeysRef = useRef<Map<string, number>>(new Map());
  const lastLoadedShopIdRef = useRef<string | null>(null);

  // Check Web Speech API support
  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setIsBrowserSupported(false);
    }
  }, []);

  // Update target shop when prop changes
  const targetShopId = targetShop?.id;
  useEffect(() => {
    if (!isOpen) return;
    if (targetShopId) {
      setSelectedShopId(targetShopId);
    } else if (shops.length > 0) {
      setSelectedShopId((prev) => {
        if (!prev || !shops.some((s) => s.id === prev)) {
          return shops[0].id;
        }
        return prev;
      });
    }
  }, [isOpen, targetShopId, shops]);

  // Load shop products only when open and when shop changes
  const hasProvidedProducts = shopProducts && shopProducts.length > 0;
  useEffect(() => {
    if (!isOpen) return;

    if (hasProvidedProducts && shopProducts) {
      setLoadedShopProducts(shopProducts);
      lastLoadedShopIdRef.current = selectedShopId;
      return;
    }

    if (selectedShopId && lastLoadedShopIdRef.current !== selectedShopId) {
      lastLoadedShopIdRef.current = selectedShopId;
      customerApi
        .getShopProducts(selectedShopId)
        .then((prods) => setLoadedShopProducts(prods))
        .catch((err) => {
          console.warn('Could not load products for shop catalog matching:', err);
          lastLoadedShopIdRef.current = null;
        });
    }
  }, [isOpen, selectedShopId, hasProvidedProducts, shopProducts]);

  // Initialize modal state on open: import existing cart items if any from this shop
  useEffect(() => {
    if (isOpen) {
      setSubmitSuccess(null);
      setErrorMessage(null);
      setLiveTranscript('');
      setVoiceStoppedReason(null);
      isVoiceSessionActiveRef.current = false;
      isIntentionalStopRef.current = false;
      isSilenceTimeoutRef.current = false;
      isSpeakingInterimRef.current = false;
      currentUtteranceBufferRef.current = '';
      lastProcessedFinalIndexRef.current = 0;
      currentSessionIdRef.current = '';
      processedUtterancesSetRef.current.clear();
      deletedKeysRef.current.clear();

      if (existingCartItems && existingCartItems.length > 0) {
        const cartConverted: LiveVoiceItem[] = existingCartItems.map((c: any, index: number) => {
          const pName = c.product?.nameHindi || c.product?.name || 'सामान';
          const portion = c.displayLabel || '1 इकाई';
          return {
            id: `cart_${c.product?.id || index}_${Date.now()}`,
            cleanTitle: `${pName} — ${portion}`,
            originalText: `${pName} (${portion})`,
            rawItemName: c.product?.name || 'सामान',
            requestedPortion: portion,
            matchedProductId: c.product?.id,
            matchedProductName: c.product?.name,
            matchedProductImage: c.product?.imageUrl,
            unitPrice: c.product?.basePrice,
            isPriceEstimated: false,
            quantityCount: c.quantity || 1,
            quantityMultiplier: 1.0,
            unitDisplay: portion,
            baseUnit: c.product?.baseUnit || 'piece',
            isCatalogMatch: true,
            isCatalogSelected: true,
          };
        });
        setItems(cartConverted);
      } else {
        setItems([]);
      }
    } else {
      // Abort when closed
      isVoiceSessionActiveRef.current = false;
      isIntentionalStopRef.current = true;
      if (silenceTimeoutRef.current) clearTimeout(silenceTimeoutRef.current);
      if (finalizationTimeoutRef.current) clearTimeout(finalizationTimeoutRef.current);
      if (restartTimeoutRef.current) clearTimeout(restartTimeoutRef.current);
      if (recognitionRef.current) {
        try {
          recognitionRef.current.onstart = null;
          recognitionRef.current.onresult = null;
          recognitionRef.current.onerror = null;
          recognitionRef.current.onend = null;
          recognitionRef.current.abort();
        } catch {
          // ignore
        }
        recognitionRef.current = null;
      }
      setIsListening(false);
    }
  }, [isOpen, existingCartItems]);

  /**
   * Single Source of Truth for confirming shopping list items.
   * Parses customer speech using kiranaVoiceParser and adds or updates items in state.
   */
  const confirmUtterance = useCallback(
    (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || trimmed.length < 2) return;

      // Handle amendment if customer speech contains only quantity or portion (e.g. customer first said "संतूर साबुन" and now says "दस पैकेट दे दो")
      if (isOnlyQuantityOrFiller(trimmed)) {
        const amendedCountMatch =
          trimmed.match(/(\d+)\s*(?:packet|packets|पैकेट|पैक|पैट|पीस|piece)/i) ||
          (trimmed.includes("दस पैकेट") || trimmed.includes("10 पैकेट") ? [null, "10"] : null) ||
          (trimmed.includes("पांच पैकेट") || trimmed.includes("पाँच पैकेट") || trimmed.includes("5 पैकेट") ? [null, "5"] : null) ||
          (trimmed.includes("चार पैकेट") || trimmed.includes("4 पैकेट") ? [null, "4"] : null) ||
          (trimmed.includes("तीन पैकेट") || trimmed.includes("3 पैकेट") ? [null, "3"] : null) ||
          (trimmed.includes("दो पैकेट") || trimmed.includes("2 पैकेट") || trimmed.includes("दुई पैकेट") ? [null, "2"] : null) ||
          (trimmed.includes("एक पैकेट") || trimmed.includes("1 पैकेट") ? [null, "1"] : null);

        const isWeightAmendment =
          trimmed.includes("100 ग्राम") ||
          trimmed.includes("100g") ||
          trimmed.includes("250 ग्राम") ||
          trimmed.includes("एक पाव") ||
          trimmed.includes("पाव") ||
          trimmed.includes("500 ग्राम") ||
          trimmed.includes("आधा किलो") ||
          trimmed.includes("1 किलो") ||
          trimmed.includes("एक किलो") ||
          trimmed.includes("2 किलो") ||
          trimmed.includes("दो किलो");

        if (amendedCountMatch && amendedCountMatch[1]) {
          const newCount = parseInt(amendedCountMatch[1], 10);
          setItems((prev) => {
            if (prev.length === 0) return prev;
            const lastIdx = prev.length - 1;
            const last = prev[lastIdx];
            let updatedTitle = last.cleanTitle;
            if (last.priceVariantDisplay) {
              updatedTitle = `${last.rawItemName} — ${last.priceVariantDisplay} — ${newCount} पैकेट`;
            } else if (last.sizeVariant) {
              updatedTitle = `${last.rawItemName} — ${last.sizeVariant} — ${newCount} पैकेट`;
            } else {
              updatedTitle = `${last.rawItemName} — ${newCount} पैकेट`;
            }
            const updatedItem: LiveVoiceItem = {
              ...last,
              quantityCount: newCount,
              unitDisplay: `${newCount} पैकेट`,
              cleanTitle: updatedTitle,
            };
            const copy = [...prev];
            copy[lastIdx] = updatedItem;
            return copy;
          });
          return;
        } else if (isWeightAmendment) {
          let weightDisplay = "500 ग्राम";
          let mult = 0.5;
          if (trimmed.includes("100 ग्राम") || trimmed.includes("100g")) {
            weightDisplay = "100 ग्राम";
            mult = 0.1;
          } else if (trimmed.includes("250 ग्राम") || trimmed.includes("एक पाव") || trimmed.includes("पाव")) {
            weightDisplay = "250 ग्राम";
            mult = 0.25;
          } else if (trimmed.includes("1 किलो") || trimmed.includes("एक किलो")) {
            weightDisplay = "1 किलो";
            mult = 1.0;
          } else if (trimmed.includes("2 किलो") || trimmed.includes("दो किलो")) {
            weightDisplay = "2 किलो";
            mult = 2.0;
          }

          setItems((prev) => {
            if (prev.length === 0) return prev;
            const lastIdx = prev.length - 1;
            const last = prev[lastIdx];
            const updatedItem: LiveVoiceItem = {
              ...last,
              quantityMultiplier: mult,
              unitDisplay: weightDisplay,
              cleanTitle: `${last.rawItemName} — ${weightDisplay}`,
            };
            const copy = [...prev];
            copy[lastIdx] = updatedItem;
            return copy;
          });
          return;
        }
        return;
      }

      // Clean customer opening fillers and convert punctuation to whitespace
      const cleaned = trimmed
        .replace(/^(bhai|bhaiya|bhai sahab|भाई|अरे भाई|भैया)\s+/i, "")
        .replace(/[,।\.]/g, " ");

      // Split into multiple clauses using Master Kirana Catalog product boundaries,
      // conjunctions, and weights/quantities
      const catalogClauses = splitUtteranceByCatalogBoundaries(cleaned);
      const clauses = catalogClauses.length > 0 ? catalogClauses : [cleaned];

      const itemsToAdd: LiveVoiceItem[] = [];
      const now = Date.now();

      for (const clause of clauses) {
        if (isOnlyQuantityOrFiller(clause)) {
          // Check if clause is a quantity amendment for the previous item
          const amendedCountMatch =
            clause.match(/(\d+)\s*(?:packet|packets|पैकेट|पैक|पैट|पीस|piece)/i) ||
            (clause.includes("दस पैकेट") || clause.includes("10 पैकेट") ? [null, "10"] : null) ||
            (clause.includes("पांच पैकेट") || clause.includes("पाँच पैकेट") || clause.includes("5 पैकेट") ? [null, "5"] : null) ||
            (clause.includes("चार पैकेट") || clause.includes("4 पैकेट") ? [null, "4"] : null) ||
            (clause.includes("तीन पैकेट") || clause.includes("3 पैकेट") ? [null, "3"] : null) ||
            (clause.includes("दो पैकेट") || clause.includes("2 पैकेट") || clause.includes("दुई पैकेट") ? [null, "2"] : null) ||
            (clause.includes("एक पैकेट") || clause.includes("1 पैकेट") ? [null, "1"] : null);

          const isWeightAmendment =
            clause.includes("100 ग्राम") ||
            clause.includes("100g") ||
            clause.includes("250 ग्राम") ||
            clause.includes("एक पाव") ||
            clause.includes("पाव") ||
            clause.includes("500 ग्राम") ||
            clause.includes("आधा किलो") ||
            clause.includes("1 किलो") ||
            clause.includes("एक किलो") ||
            clause.includes("2 किलो") ||
            clause.includes("दो किलो");

          if (amendedCountMatch && amendedCountMatch[1]) {
            const newCount = parseInt(amendedCountMatch[1], 10);
            if (itemsToAdd.length > 0) {
              const lastIdx = itemsToAdd.length - 1;
              const last = itemsToAdd[lastIdx];
              let updatedTitle = last.cleanTitle;
              if (last.priceVariantDisplay) {
                updatedTitle = `${last.rawItemName} — ${last.priceVariantDisplay} — ${newCount} पैकेट`;
              } else {
                updatedTitle = `${last.rawItemName} — ${newCount} पैकेट`;
              }
              itemsToAdd[lastIdx] = {
                ...last,
                quantityCount: newCount,
                unitDisplay: `${newCount} पैकेट`,
                cleanTitle: updatedTitle,
              };
            } else {
              setItems((prev) => {
                if (prev.length === 0) return prev;
                const lastIdx = prev.length - 1;
                const last = prev[lastIdx];
                let updatedTitle = last.cleanTitle;
                if (last.priceVariantDisplay) {
                  updatedTitle = `${last.rawItemName} — ${last.priceVariantDisplay} — ${newCount} पैकेट`;
                } else {
                  updatedTitle = `${last.rawItemName} — ${newCount} पैकेट`;
                }
                const updatedItem: LiveVoiceItem = {
                  ...last,
                  quantityCount: newCount,
                  unitDisplay: `${newCount} पैकेट`,
                  cleanTitle: updatedTitle,
                };
                const copy = [...prev];
                copy[lastIdx] = updatedItem;
                return copy;
              });
            }
          } else if (isWeightAmendment) {
            let weightDisplay = "500 ग्राम";
            let mult = 0.5;
            if (clause.includes("100 ग्राम") || clause.includes("100g")) {
              weightDisplay = "100 ग्राम";
              mult = 0.1;
            } else if (clause.includes("250 ग्राम") || clause.includes("एक पाव") || clause.includes("पाव")) {
              weightDisplay = "250 ग्राम";
              mult = 0.25;
            } else if (clause.includes("1 किलो") || clause.includes("एक किलो")) {
              weightDisplay = "1 किलो";
              mult = 1.0;
            } else if (clause.includes("2 किलो") || clause.includes("दो किलो")) {
              weightDisplay = "2 किलो";
              mult = 2.0;
            }

            if (itemsToAdd.length > 0) {
              const lastIdx = itemsToAdd.length - 1;
              const last = itemsToAdd[lastIdx];
              itemsToAdd[lastIdx] = {
                ...last,
                quantityMultiplier: mult,
                unitDisplay: weightDisplay,
                cleanTitle: `${last.rawItemName} — ${weightDisplay}`,
              };
            } else {
              setItems((prev) => {
                if (prev.length === 0) return prev;
                const lastIdx = prev.length - 1;
                const last = prev[lastIdx];
                const updatedItem: LiveVoiceItem = {
                  ...last,
                  quantityMultiplier: mult,
                  unitDisplay: weightDisplay,
                  cleanTitle: `${last.rawItemName} — ${weightDisplay}`,
                };
                const copy = [...prev];
                copy[lastIdx] = updatedItem;
                return copy;
              });
            }
          }
          continue;
        }

        // Normalized key for duplicate detection in this session
        const normKey = (clause || '')
          .toLowerCase()
          .replace(/^(bhai|bhaiya|bhai sahab|भाई|अरे भाई|भैया)\s*/i, "")
          .replace(/^(de do|chahiye|de dena|दे दो|चाहिए|ला दो)\s*/i, "")
          .replace(/\s*(de do|chahiye|de dena|दे दो|चाहिए|ला दो|दे देना)$/i, "")
          .replace(/\s+/g, " ")
          .trim();

        if (!normKey || normKey.length < 2) continue;

        // Check if recently deleted (within 8 seconds)
        const deletedAt = deletedKeysRef.current.get(normKey);
        if (deletedAt && now - deletedAt < 8000) {
          continue;
        }

        // Duplicate guard:
        const isExplicitAdditional =
          /\b(aur|extra|bhi|another|one more|और|भी|एक और|दोबारा)\b/i.test(clause) ||
          /\b(aur|extra|bhi|another|one more|और|भी|एक और|दोबारा)\b/i.test(trimmed);

        if (processedUtterancesSetRef.current.has(normKey) && !isExplicitAdditional) {
          continue;
        }

        const parsed = parseVoiceShoppingSlipItem(clause, loadedShopProducts);
        if (parsed) {
          // Signature for strict duplicate protection: product + priceVariant + quantity + unit
          const itemSignature = `${parsed.rawItemName}_${parsed.quantityCount}_${parsed.unitDisplay || ""}_${parsed.unitPrice || 0}`.toLowerCase();
          if (processedUtterancesSetRef.current.has(itemSignature) && !isExplicitAdditional) {
            continue;
          }

          processedUtterancesSetRef.current.add(normKey);
          processedUtterancesSetRef.current.add(itemSignature);

          const liveItem: LiveVoiceItem = {
            id: parsed.id,
            cleanTitle: parsed.cleanTitle,
            originalText: parsed.originalText,
            rawItemName: parsed.rawItemName,
            productName: parsed.productName,
            brand: parsed.brand,
            variantPrice: parsed.variantPrice,
            quantity: parsed.quantity,
            unit: parsed.unit,
            weight: parsed.weight,
            totalPrice: parsed.totalPrice,
            rawUtterance: parsed.rawUtterance,
            itemType: parsed.itemType,
            priceVariant: parsed.priceVariant,
            priceVariantDisplay: parsed.priceVariantDisplay,
            sizeVariant: parsed.sizeVariant,
            moneyAmount: parsed.moneyAmount,
            moneyAmountDisplay: parsed.moneyAmountDisplay,
            requestedPortion: parsed.unitDisplay || parsed.moneyAmountDisplay || parsed.priceVariantDisplay,
            matchedProductId: parsed.matchedProductId,
            matchedProductName: parsed.matchedProductName,
            matchedProductImage: parsed.matchedProductImage,
            unitPrice: parsed.unitPrice,
            isPriceEstimated: parsed.isPriceEstimated,
            quantityCount: parsed.quantityCount,
            quantityMultiplier: parsed.quantityMultiplier,
            unitDisplay: parsed.unitDisplay || "",
            baseUnit: parsed.baseUnit,
            isCatalogMatch: parsed.isCatalogMatch,
            masterCategory: parsed.masterCategory,
            masterProduct: parsed.masterProduct,
          };

          itemsToAdd.push(liveItem);
        }
      }

      if (itemsToAdd.length > 0) {
        setItems((prev) => [...prev, ...itemsToAdd]);
      }
    },
    [loadedShopProducts]
  );

  /**
   * Utterance Finalization:
   * Commits accumulated completed phrases in the buffer after ~2300ms debounce
   * ONLY if it represents a complete thought with a product noun.
   */
  const commitCurrentUtterance = useCallback(() => {
    if (!isVoiceSessionActiveRef.current || isIntentionalStopRef.current) return;
    // If customer is in the middle of speaking interim words, wait for final result
    if (isSpeakingInterimRef.current) return;

    const rawCandidate = currentUtteranceBufferRef.current.trim();
    if (!rawCandidate || rawCandidate.length < 2) return;

    // Complete-thought detection:
    // If incomplete (e.g. only "₹10 वाला" or "एक पैकेट" or no product noun),
    // NEVER convert to a shopping-list item. Keep buffer intact and wait for customer to finish speaking.
    if (!isCompleteThought(rawCandidate, loadedShopProducts)) {
      return;
    }

    // Complete customer utterance: commit once and reset buffer
    currentUtteranceBufferRef.current = '';
    setLiveTranscript('');
    confirmUtterance(rawCandidate);
  }, [confirmUtterance, loadedShopProducts]);

  /**
   * Auto-stop when customer has been silent for 3.0 seconds of genuine silence
   */
  const stopListeningDueToSilence = useCallback(() => {
    if (isSpeakingInterimRef.current) return;

    isVoiceSessionActiveRef.current = false;
    isSilenceTimeoutRef.current = true;

    if (restartTimeoutRef.current) clearTimeout(restartTimeoutRef.current);
    if (silenceTimeoutRef.current) clearTimeout(silenceTimeoutRef.current);
    if (finalizationTimeoutRef.current) clearTimeout(finalizationTimeoutRef.current);

    // Commit any finalized complete phrase remaining in the buffer
    const remaining = currentUtteranceBufferRef.current.trim();
    if (remaining.length >= 2 && isCompleteThought(remaining, loadedShopProducts)) {
      confirmUtterance(remaining);
    }
    currentUtteranceBufferRef.current = '';

    if (recognitionRef.current) {
      try {
        recognitionRef.current.onstart = null;
        recognitionRef.current.onresult = null;
        recognitionRef.current.onerror = null;
        recognitionRef.current.onend = null;
        recognitionRef.current.abort();
      } catch {
        // ignore
      }
      recognitionRef.current = null;
    }

    setIsListening(false);
    setLiveTranscript('');
    setVoiceStoppedReason('silence');
  }, [confirmUtterance, loadedShopProducts]);

  /**
   * Reset the silence timer (10000ms of true silence before stopping)
   */
  const resetSilenceTimer = useCallback(
    (durationMs = 10000) => {
      if (silenceTimeoutRef.current) clearTimeout(silenceTimeoutRef.current);
      silenceTimeoutRef.current = setTimeout(() => {
        if (isVoiceSessionActiveRef.current && !isIntentionalStopRef.current) {
          stopListeningDueToSilence();
        }
      }, durationMs);
    },
    [stopListeningDueToSilence]
  );

  /**
   * Continuous Speech Recognition Engine
   */
  const startEngine = useCallback(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setIsBrowserSupported(false);
      return;
    }

    try {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.onstart = null;
          recognitionRef.current.onresult = null;
          recognitionRef.current.onerror = null;
          recognitionRef.current.onend = null;
          recognitionRef.current.abort();
        } catch {
          // ignore
        }
        recognitionRef.current = null;
      }

      lastProcessedFinalIndexRef.current = 0;
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = language === 'hi' ? 'hi-IN' : 'en-IN';

      recognition.onstart = () => {
        setIsListening(true);
        setErrorMessage(null);
      };

      recognition.onresult = (event: any) => {
        if (!isVoiceSessionActiveRef.current || isIntentionalStopRef.current) return;

        let currentInterim = '';
        const newFinalizedSegments: string[] = [];

        // Traverse only from event.resultIndex forward
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const res = event.results[i];
          if (!res || !res[0]) continue;
          const transcript = res[0].transcript?.trim() || '';
          if (!transcript) continue;

          if (res.isFinal) {
            // Process each final result index exactly ONCE for this recognition instance
            if (i >= lastProcessedFinalIndexRef.current) {
              newFinalizedSegments.push(transcript);
              lastProcessedFinalIndexRef.current = i + 1;
            }
          } else {
            currentInterim += (currentInterim ? ' ' : '') + transcript;
          }
        }

        // 1. Interim Speech: Active vocalization
        // RULE #1: NEVER parse interim text. It is purely for visual display feedback.
        if (currentInterim.length > 0) {
          isSpeakingInterimRef.current = true;
          // While customer is actively speaking, never run the silence timer
          if (silenceTimeoutRef.current) {
            clearTimeout(silenceTimeoutRef.current);
            silenceTimeoutRef.current = null;
          }
          // Pause finalization timer while new words are actively being spoken
          if (finalizationTimeoutRef.current) {
            clearTimeout(finalizationTimeoutRef.current);
            finalizationTimeoutRef.current = null;
          }
          // Visual display only: show accumulated finalized buffer + current transient speech
          const display = currentUtteranceBufferRef.current
            ? `${currentUtteranceBufferRef.current} ${currentInterim}`
            : currentInterim;
          setLiveTranscript(display);
        } else {
          isSpeakingInterimRef.current = false;
        }

        // 2. Finalized Speech segments:
        if (newFinalizedSegments.length > 0) {
          for (const seg of newFinalizedSegments) {
            currentUtteranceBufferRef.current = mergeUtteranceChunks(
              currentUtteranceBufferRef.current,
              seg
            );
          }

          // Show current finalized buffer in UI
          setLiveTranscript(currentUtteranceBufferRef.current);

          // Reset silence timer: only stop after 10000ms of real silence
          if (!isSpeakingInterimRef.current) {
            resetSilenceTimer(10000);
          }

          // Adaptive finalization debounce:
          // If the phrase already has a quantity or completion verb, commit quickly (~1200ms)
          // If customer has only spoken product so far, allow 2000ms to add quantity
          if (finalizationTimeoutRef.current) {
            clearTimeout(finalizationTimeoutRef.current);
          }
          const currentText = currentUtteranceBufferRef.current;
          const hasQuantityOrDone =
            /\b(\d+|किलो|ग्राम|packet|packets|पैकेट|पैक|पैट|लीटर|पाव|आधा|दे दो|दे दा|चाहिए|बस)\b/i.test(
              currentText
            );
          const debounceMs = hasQuantityOrDone ? 1200 : 2000;

          finalizationTimeoutRef.current = setTimeout(() => {
            commitCurrentUtterance();
          }, debounceMs);
        }
      };

      recognition.onerror = (event: any) => {
        if (event.error === 'not-allowed') {
          isVoiceSessionActiveRef.current = false;
          isIntentionalStopRef.current = true;
          setIsListening(false);
          setErrorMessage(
            language === 'hi'
              ? 'माइक्रोफ़ोन की अनुमति नहीं मिली। कृपया ब्राउज़र में अनुमति दें या लिखकर सामान जोड़ें।'
              : 'Microphone permission denied. Please enable mic access or type items.'
          );
          return;
        }

        // 'no-speech' is emitted by mobile browsers on brief pauses;
        // do not stop session — let silenceTimer handle genuine 5000ms silence
        if (event.error === 'no-speech') {
          return;
        }
      };

      recognition.onend = () => {
        recognitionRef.current = null;

        // Do not restart if intentional stop or silence timeout
        if (isIntentionalStopRef.current || isSilenceTimeoutRef.current) {
          setIsListening(false);
          setLiveTranscript('');
          return;
        }

        // If session is still active (browser dropped connection prematurely):
        // Automatically restart without losing session history or duplicating results
        if (isVoiceSessionActiveRef.current) {
          lastProcessedFinalIndexRef.current = 0;
          setIsListening(true);
          if (restartTimeoutRef.current) clearTimeout(restartTimeoutRef.current);
          restartTimeoutRef.current = setTimeout(() => {
            if (
              isVoiceSessionActiveRef.current &&
              !isIntentionalStopRef.current &&
              !isSilenceTimeoutRef.current
            ) {
              startEngine();
            }
          }, 100);
        } else {
          setIsListening(false);
          setLiveTranscript('');
        }
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err: any) {
      console.warn('Could not launch speech engine:', err);
      if (
        isVoiceSessionActiveRef.current &&
        !isIntentionalStopRef.current &&
        !isSilenceTimeoutRef.current
      ) {
        restartTimeoutRef.current = setTimeout(() => {
          if (isVoiceSessionActiveRef.current) startEngine();
        }, 250);
      }
    }
  }, [language, commitCurrentUtterance, resetSilenceTimer]);

  /**
   * Turn ON continuous listening mode (Customer taps mic)
   */
  const handleStartListening = useCallback(() => {
    setErrorMessage(null);
    setVoiceStoppedReason(null);

    // Create a new voice session ID and clear processed utterance tracking for this new session
    const newSessionId = `session_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    currentSessionIdRef.current = newSessionId;
    processedUtterancesSetRef.current.clear();

    isVoiceSessionActiveRef.current = true;
    isIntentionalStopRef.current = false;
    isSilenceTimeoutRef.current = false;
    isSpeakingInterimRef.current = false;
    setIsListening(true);
    setLiveTranscript('');
    currentUtteranceBufferRef.current = '';
    lastProcessedFinalIndexRef.current = 0;

    if (restartTimeoutRef.current) clearTimeout(restartTimeoutRef.current);
    if (silenceTimeoutRef.current) clearTimeout(silenceTimeoutRef.current);
    if (finalizationTimeoutRef.current) clearTimeout(finalizationTimeoutRef.current);

    // Initial 10.0s grace period to allow customer to start speaking
    resetSilenceTimer(10000);

    startEngine();
  }, [startEngine, resetSilenceTimer]);

  /**
   * Turn OFF continuous listening mode (Explicit user stop action)
   */
  const handleStopListening = useCallback(() => {
    isVoiceSessionActiveRef.current = false;
    isIntentionalStopRef.current = true;
    setVoiceStoppedReason('user');

    if (restartTimeoutRef.current) clearTimeout(restartTimeoutRef.current);
    if (silenceTimeoutRef.current) clearTimeout(silenceTimeoutRef.current);
    if (finalizationTimeoutRef.current) clearTimeout(finalizationTimeoutRef.current);

    const remaining = currentUtteranceBufferRef.current.trim();
    if (remaining.length >= 2 && isCompleteThought(remaining, loadedShopProducts)) {
      confirmUtterance(remaining);
    }
    currentUtteranceBufferRef.current = '';

    if (recognitionRef.current) {
      try {
        recognitionRef.current.onstart = null;
        recognitionRef.current.onresult = null;
        recognitionRef.current.onerror = null;
        recognitionRef.current.onend = null;
        recognitionRef.current.abort();
      } catch {
        // ignore
      }
      recognitionRef.current = null;
    }

    setIsListening(false);
    setLiveTranscript('');
  }, [confirmUtterance, loadedShopProducts]);

  /**
   * Delete an item without interrupting ongoing continuous voice listening
   */
  const handleRemoveItem = (id: string) => {
    const itemToDelete = items.find((i) => i.id === id);
    if (itemToDelete) {
      const normKey = (itemToDelete.originalText || itemToDelete.cleanTitle || itemToDelete.productName || '')
        .toLowerCase()
        .replace(/\s+/g, ' ')
        .trim();
      if (normKey) {
        deletedKeysRef.current.set(normKey, Date.now());
        processedUtterancesSetRef.current.delete(normKey);
      }
    }
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  /**
   * Manual input fallback
   */
  const handleManualAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualInput.trim()) return;

    confirmUtterance(manualInput.trim());
    setManualInput('');
  };

  /**
   * Simulate speaking a phrase (for quick tests)
   */
  const handleSimulateSpeech = (phrase: string) => {
    setLiveTranscript(phrase);
    setTimeout(() => {
      confirmUtterance(phrase);
      setLiveTranscript('');
    }, 250);
  };

  /**
   * Send unified shopping request to the selected shop
   */
  const handleSubmitRequest = async () => {
    if (items.length === 0) {
      setErrorMessage(
        language === 'hi'
          ? 'कृपया कम से कम एक सामान जोड़ें।'
          : 'Please add at least one item to your shopping list.'
      );
      return;
    }

    handleStopListening();
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const payload: CreateShoppingRequestDTO = {
        shopId: selectedShopId,
        fulfillmentType,
        customerNotes,
        rawVoiceTranscript: items.map((i) => i.originalText).join(', '),
        items: items.map((i) => ({
          originalText: i.originalText,
          rawItemName: i.rawItemName,
          requestedPortion: i.requestedPortion,
          matchedProductId: i.matchedProductId,
          matchedProductName: i.matchedProductName,
          matchedProductImage: i.matchedProductImage,
          unitPrice: i.unitPrice,
          isPriceEstimated: i.isPriceEstimated,
          quantityCount: i.quantityCount,
          quantityMultiplier: i.quantityMultiplier,
          unitDisplay: i.unitDisplay,
          baseUnit: i.baseUnit,
        })),
      };

      const result = await customerApi.createShoppingRequest(payload);
      setSubmitSuccess(result);
      if (onRequestSubmitted) {
        onRequestSubmitted(result);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to submit shopping request');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const selectedShop = shops.find((s) => s.id === selectedShopId) || shops[0] || {
    id: 'shp_krishna_grocers',
    name: 'Shree Krishna Kirana & Grains',
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="bg-white border border-slate-200 rounded-t-3xl sm:rounded-3xl w-full max-w-lg shadow-2xl h-[92vh] sm:h-[86vh] flex flex-col overflow-hidden animate-in slide-in-from-bottom-4 sm:zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Success Confirmation View */}
        {submitSuccess ? (
          <div className="p-6 text-center space-y-4 m-auto">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto shadow-inner">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div className="space-y-1">
              <span className="inline-block px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-black uppercase tracking-wider">
                {submitSuccess.requestNumber}
              </span>
              <h2 className="text-xl font-black text-slate-900">
                {language === 'hi' ? 'दुकानदार को पर्ची भेज दी गई है!' : 'Shopping Request Sent to Shopkeeper!'}
              </h2>
              <p className="text-sm text-slate-600 max-w-sm mx-auto">
                {language === 'hi'
                  ? `दुकानदार (${submitSuccess.shopName}) आपकी लिस्ट देखकर सामान का फाइनल बिल बनाएंगे। बिल तैयार होते ही 1-टैप में भुगतान करें।`
                  : `${submitSuccess.shopName} is reviewing your items. You will receive a notification to review and pay once the final bill is ready.`}
              </p>
            </div>

            <div className="p-3.5 bg-amber-50 rounded-2xl border border-amber-200 text-left space-y-2">
              <div className="flex items-center gap-2 text-amber-900 font-bold text-xs">
                <Clock className="w-4 h-4 text-amber-700 shrink-0" />
                <span>{language === 'hi' ? 'अगला कदम (Next Step):' : 'Next Step:'}</span>
              </div>
              <p className="text-xs text-amber-800 leading-relaxed">
                {language === 'hi'
                  ? 'दुकानदार जब पर्ची फाइनल करेंगे, तब आप सीधे 1-टैप में UPI / Cash द्वारा भुगतान कर सकेंगे। अभी कोई पेमेंट नहीं कटी है।'
                  : 'No payment is charged right now. When the shopkeeper finalizes the bill, you can pay via UPI/Cash with one tap.'}
              </p>
            </div>

            <button
              onClick={onClose}
              className="w-full py-3.5 px-4 rounded-xl bg-slate-900 text-white font-bold text-sm shadow-md hover:bg-slate-800 transition-all cursor-pointer"
            >
              {language === 'hi' ? 'ठीक है, समझ गया' : 'Done & Close'}
            </button>
          </div>
        ) : (
          <>
            {/* 1 & 2. TOP AREA — SHOP NAME & SMALL VOICE ICON ONLY (approx 40-48px) */}
            <div className="p-4 border-b border-slate-200/90 bg-slate-50/60 shrink-0">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-800">
                    <Store className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                    <span className="truncate">{selectedShop.name}</span>
                  </div>
                  <h3 className="text-base font-black text-slate-900 mt-0.5 flex items-center gap-1.5">
                    <span>📝 दुकानदार के लिए सामान की पर्ची</span>
                  </h3>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {/* Small 40-48px voice icon/button as requested */}
                  <button
                    type="button"
                    id="voice-shopping-top-mic-btn"
                    onClick={isListening ? handleStopListening : handleStartListening}
                    className={`w-10 h-10 rounded-full flex items-center justify-center transition-all cursor-pointer shadow-2xs ${
                      isListening
                        ? 'bg-rose-500 text-white animate-pulse shadow-rose-200 ring-2 ring-rose-300'
                        : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200/90 hover:border-emerald-300'
                    }`}
                    title={isListening ? 'माइक बंद करें' : 'बोलकर सामान जोड़ें'}
                    aria-label="Toggle voice input"
                  >
                    {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                  </button>

                  {/* Close modal button */}
                  <button
                    type="button"
                    onClick={onClose}
                    className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-900 flex items-center justify-center text-xs font-bold cursor-pointer transition-colors"
                    title="बंद करें"
                  >
                    ✕
                  </button>
                </div>
              </div>

              {/* Active listening status banner (compact single line preview) */}
              {isListening && (
                <div className="mt-2.5 px-3 py-1.5 bg-rose-50 border border-rose-200/90 rounded-xl flex items-center justify-between gap-2 text-xs text-rose-900 animate-in fade-in duration-150">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <span className="relative flex h-2.5 w-2.5 shrink-0">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-600"></span>
                    </span>
                    <span className="truncate font-semibold flex items-center gap-1.5">
                      {liveTranscript ? (
                        <>
                          <span className="text-rose-700 font-bold shrink-0">🔴 सुन रहा हूँ:</span>
                          <span className="text-slate-800 font-medium truncate">"{liveTranscript}"</span>
                        </>
                      ) : (
                        <>
                          <span className="text-rose-700 font-bold">🔴 सुन रहा हूँ...</span>
                          <span className="text-slate-600 font-normal ml-1">"सामान बोलते जाएँ"</span>
                        </>
                      )}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleStopListening}
                    className="text-[10px] font-bold text-rose-700 hover:text-rose-900 px-2 py-0.5 bg-rose-100 rounded-md shrink-0 cursor-pointer"
                  >
                    रोकें
                  </button>
                </div>
              )}

              {!isListening && voiceStoppedReason === 'silence' && (
                <div className="mt-2 px-3 py-1.5 bg-emerald-50 border border-emerald-200/80 rounded-xl flex items-center justify-between text-[11px] text-emerald-950 animate-in fade-in duration-150">
                  <span className="font-bold flex items-center gap-1.5">
                    <span className="text-emerald-700">🟢 सुनना बंद है</span>
                    <span className="text-slate-600 font-normal">"दोबारा सामान जोड़ने के लिए 🎙️ दबाएँ"</span>
                  </span>
                  <button
                    type="button"
                    onClick={handleStartListening}
                    className="text-[10px] text-emerald-800 font-bold px-2 py-0.5 bg-emerald-100 hover:bg-emerald-200 rounded-md cursor-pointer transition-colors shrink-0 ml-2"
                  >
                    🎙️ बोलें
                  </button>
                </div>
              )}

              {errorMessage && (
                <div className="mt-2 p-2 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-xs text-rose-700">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0 text-rose-600" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {!isBrowserSupported && (
                <div className="mt-2 p-2 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2 text-xs text-amber-800">
                  <Info className="w-3.5 h-3.5 text-amber-700 shrink-0 mt-0.5" />
                  <span>
                    इस डिवाइस पर Voice Recognition उपलब्ध नहीं है। कृपया नीचे लिखकर या दिए गए उदाहरणों से सामान जोड़ें।
                  </span>
                </div>
              )}
            </div>

            {/* SCROLLABLE MAIN CONTENT (Customer Spoken Items + Delivery Options + Send Slip + Secondary Controls) */}
            <div className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-5 space-y-4">
              {/* 3. CUSTOMER SPOKEN ITEMS MUST BE THE MAIN CONTENT */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs sm:text-sm font-black text-slate-900">
                    <span className="text-base">🧾</span>
                    <span>ग्राहक ने जो सामान बोला</span>
                  </div>
                  <span className="text-[11px] font-black font-mono text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    {items.length} सामान
                  </span>
                </div>

                {/* Receipt Paper Card */}
                <div className="bg-amber-50/50 border border-amber-200/80 rounded-2xl divide-y divide-amber-100 overflow-hidden shadow-2xs">
                  {items.length === 0 ? (
                    <div className="py-12 px-4 text-center space-y-2">
                      <p className="text-sm font-bold text-slate-700">अभी कोई सामान नहीं जुड़ा है</p>
                      <p className="text-xs text-slate-500 max-w-xs mx-auto">
                        नीचे दिए गए माइक बटन <span className="font-bold text-emerald-700">"बोलकर सामान ऑर्डर करें"</span> पर टैप करें और सामान बोलें।
                      </p>
                    </div>
                  ) : (
                    items.map((item, idx) => (
                      <div
                        key={item.id}
                        className="p-3 bg-white/90 hover:bg-white flex items-start justify-between gap-3 transition-colors"
                      >
                        <div className="flex items-start gap-2.5 min-w-0 flex-1">
                          <span className="w-6 h-6 rounded-lg bg-amber-50 border border-amber-200 text-slate-800 text-sm flex items-center justify-center shrink-0 mt-0.5" title={`#${idx + 1}`}>
                            {getProductEmoji(item.rawItemName || item.cleanTitle)}
                          </span>

                          <div className="min-w-0 flex-1">
                            {/* Hindi Customer Spoken Item Clean Title */}
                            <p className="text-sm font-bold text-slate-900 leading-snug">
                              {item.cleanTitle || item.originalText}
                            </p>
                            {item.originalText && item.cleanTitle && item.originalText !== item.cleanTitle && (
                              <p className="text-[11px] text-slate-500 mt-0.5 truncate">
                                बोला: "{item.originalText}"
                              </p>
                            )}

                            {/* Portion, Catalog & Price badges */}
                            <div className="flex items-center gap-2 mt-1 flex-wrap text-xs text-slate-600 font-medium">
                              {item.priceVariantDisplay && (
                                <span className="bg-amber-100 text-amber-900 border border-amber-200/80 px-2 py-0.5 rounded font-bold text-[11px]">
                                  {item.priceVariantDisplay}
                                </span>
                              )}

                              {item.moneyAmountDisplay && !item.priceVariantDisplay && (
                                <span className="bg-amber-100 text-amber-900 border border-amber-200/80 px-2 py-0.5 rounded font-bold text-[11px]">
                                  {item.moneyAmountDisplay}
                                </span>
                              )}

                              {item.unitDisplay && item.unitDisplay.trim() !== '' && (
                                <span className="bg-slate-100 px-2 py-0.5 rounded text-slate-800 font-semibold text-[11px]">
                                  {item.unitDisplay.includes('छोटा') || item.unitDisplay.includes('बड़ा')
                                    ? `वेरिएंट: ${item.unitDisplay}`
                                    : `मात्रा: ${item.unitDisplay}`}
                                </span>
                              )}

                              {item.isCatalogMatch && item.matchedProductName && (
                                <span className="text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded text-[10px] font-semibold flex items-center gap-1 border border-emerald-100">
                                  ✓ {item.matchedProductName}
                                </span>
                              )}

                              {item.totalPrice != null ? (
                                <span className="text-slate-800 font-black font-mono text-[11px]">
                                  ₹{item.totalPrice}
                                </span>
                              ) : item.unitPrice && !item.isPriceEstimated ? (
                                <span className="text-slate-800 font-black font-mono text-[11px]">
                                  ₹{item.unitPrice * (item.quantityCount || 1)}
                                </span>
                              ) : (
                                <span className="text-amber-800 bg-amber-50 px-1.5 py-0.5 rounded text-[10px] font-medium border border-amber-200">
                                  ⚠️ दुकानदार वेरिएंट/कीमत तय करेगा
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Delete item button with trash icon 🗑️ */}
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(item.id)}
                          title="हटाएँ"
                          className="text-slate-400 hover:text-rose-600 hover:bg-rose-50 p-1.5 rounded-lg border border-transparent hover:border-rose-200 transition-colors cursor-pointer shrink-0"
                          aria-label="हटाएँ"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Delivery / Pickup Options */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 block">सामान कैसे लेना चाहते हैं?</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setFulfillmentType(FulfillmentType.STORE_PICKUP)}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      fulfillmentType === FulfillmentType.STORE_PICKUP
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-900 shadow-2xs'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <Store className="w-3.5 h-3.5" />
                    <span>दुकान से पिकअप</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFulfillmentType(FulfillmentType.HOME_DELIVERY)}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      fulfillmentType === FulfillmentType.HOME_DELIVERY
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-900 shadow-2xs'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <MapPin className="w-3.5 h-3.5" />
                    <span>होम डिलीवरी</span>
                  </button>
                </div>
              </div>

              {/* Optional Customer Notes */}
              <input
                type="text"
                placeholder="दुकानदार के लिए कोई निर्देश (उदा. ताज़ा सामान देना)..."
                value={customerNotes}
                onChange={(e) => setCustomerNotes(e.target.value)}
                className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />

              {/* 5. SEND SLIP BUTTON: Placed separately above secondary controls */}
              <div className="space-y-1.5">
                <button
                  type="button"
                  onClick={handleSubmitRequest}
                  disabled={isSubmitting || items.length === 0}
                  className="w-full py-3.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 active:scale-[0.99] text-white font-bold text-sm shadow-md flex items-center justify-center gap-2 transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>पर्ची भेजी जा रही है...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 text-emerald-400" />
                      <span>🛍️ दुकानदार को पर्ची भेजें {items.length > 0 ? `(${items.length} सामान)` : ''}</span>
                    </>
                  )}
                </button>
                <p className="text-[11px] text-center text-slate-500 font-medium">
                  यह पर्ची <span className="font-bold text-slate-700">{selectedShop.name}</span> को भेजी जाएगी
                </p>
              </div>

              {/* Small / Secondary Controls (Test chips + manual fallback) */}
              <div className="space-y-2 pt-1 border-t border-slate-100">
                <div className="flex flex-wrap gap-1.5 items-center">
                  <span className="text-[10px] text-slate-400 font-bold flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-amber-500" />
                    <span>टेस्ट करें:</span>
                  </span>
                  {[
                    'भाई ₹10 वाला शैंपू 10 पैकेट दे दो',
                    'आधा किलो चीनी',
                    '₹5 वाला राजेश मसाला दो पैकेट',
                    'भाई ₹10 वाला संतूर साबुन मुझे चाहिए 10 पैकेट',
                  ].map((phrase) => (
                    <button
                      key={phrase}
                      type="button"
                      onClick={() => handleSimulateSpeech(phrase)}
                      className="text-[10px] bg-slate-100 hover:bg-emerald-50 text-slate-700 hover:text-emerald-900 px-2 py-0.5 rounded-lg border border-slate-200 hover:border-emerald-300 font-medium transition-colors cursor-pointer"
                    >
                      + {phrase}
                    </button>
                  ))}
                </div>

                <form onSubmit={handleManualAdd} className="flex gap-1.5">
                  <input
                    type="text"
                    placeholder="या टाइप करके सामान जोड़ें..."
                    value={manualInput}
                    onChange={(e) => setManualInput(e.target.value)}
                    className="flex-1 text-xs px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                  <button
                    type="submit"
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer shrink-0"
                  >
                    <Plus className="w-3 h-3" />
                    <span>जोड़ें</span>
                  </button>
                </form>
              </div>
            </div>

            {/* 4. MAIN MICROPHONE AT THE VERY BOTTOM CENTER (Fixed / Sticky) */}
            <div className="p-3 sm:p-3.5 bg-white border-t border-slate-200/80 shrink-0 shadow-[0_-4px_12px_rgba(0,0,0,0.05)] flex flex-col items-center justify-center">
              <button
                type="button"
                id="voice-shopping-main-bottom-mic-btn"
                onClick={isListening ? handleStopListening : handleStartListening}
                className={`w-12 h-12 sm:w-13 sm:h-13 rounded-full flex items-center justify-center transition-all cursor-pointer active:scale-95 shadow-md ${
                  isListening
                    ? 'bg-rose-600 text-white animate-pulse ring-4 ring-rose-200 shadow-rose-300'
                    : 'bg-emerald-600 hover:bg-emerald-700 text-white ring-4 ring-emerald-100 shadow-emerald-200'
                }`}
                title={isListening ? 'बोलना बंद करें' : 'बोलकर सामान ऑर्डर करें'}
                aria-label={isListening ? 'बोलना जारी रखें' : 'बोलकर सामान ऑर्डर करें'}
              >
                {isListening ? (
                  <span className="w-4 h-4 bg-white rounded-xs"></span>
                ) : (
                  <Mic className="w-6 h-6 text-white" />
                )}
              </button>
              <span className="text-xs font-black text-slate-800 mt-1.5 flex items-center gap-1.5 tracking-tight text-center">
                {isListening ? (
                  <>
                    <span className="text-rose-600 text-sm leading-none">🔴</span>
                    <span className="text-rose-700">सुन रहा हूँ… बोलते रहें</span>
                  </>
                ) : voiceStoppedReason === 'silence' ? (
                  <>
                    <span className="text-emerald-600 text-sm leading-none">🟢</span>
                    <span className="text-slate-800">सुनना बंद है • दोबारा सामान जोड़ने के लिए 🎙️ दबाएँ</span>
                  </>
                ) : (
                  <span>बोलकर सामान ऑर्डर करें</span>
                )}
              </span>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

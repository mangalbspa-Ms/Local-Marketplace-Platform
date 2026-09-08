/**
 * Customer AI Voice Assistant Modal
 * 
 * Natural language voice ordering assistant supporting Hindi, Hinglish, and English.
 * Supports Web Speech Recognition API with pulsing visual waveform, live transcription,
 * smart portion extraction, product matching across active mandi shops, and 1-click cart addition.
 */

import React, { useState, useEffect, useRef } from 'react';
import { useCustomerMarket } from '../../../context/CustomerMarketContext.tsx';
import { useCustomerCart } from '../../../context/CustomerCartContext.tsx';
import { useCustomerLanguage } from '../../../context/CustomerLanguageContext.tsx';
import { Product, ProductUnitType } from '../../../types/product.ts';
import { Shop } from '../../../types/market.ts';
import {
  Mic,
  MicOff,
  Sparkles,
  ShoppingBag,
  Plus,
  Check,
  Send,
  AlertCircle,
  Store,
  CheckCircle2,
} from 'lucide-react';

interface VoiceAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectShop?: (shop: Shop) => void;
}

interface InterpretedVoiceItem {
  id: string;
  originalText: string;
  matchedProduct: Product | null;
  matchedShop: Shop | null;
  quantityMultiplier: number;
  quantityCount: number;
  displayPortion: string;
  estimatedPrice: number;
  confidence: number;
  addedToCart?: boolean;
}

// Common voice prompt samples in Hindi and Hinglish
const SAMPLE_PROMPTS = [
  { textEn: '1 kg Onion, 500g Tomato, 1 packet Amul Milk', textHi: '1 किलो प्याज, 500 ग्राम टमाटर और 1 पैकेट अमूल दूध', display: '1 kg प्याज, 500g टमाटर, 1 पैकेट दूध' },
  { textEn: '500g Fresh Paneer and 2 packets Pav', textHi: '500 ग्राम ताजा पनीर और 2 पैकेट पाव', display: '500g पनीर और 2 पैकेट पाव' },
  { textEn: '1 kg Basmati Rice, 1 kg Sugar, 100g Kaju', textHi: '1 किलो बासमती चावल, 1 किलो चीनी और 100 ग्राम काजू', display: '1 kg चावल, 1 kg चीनी, 100g काजू' },
  { textEn: '100g Ginger and 250g Green Chillies', textHi: '100 ग्राम अदरक और 250 ग्राम हरी मिर्च', display: '100g अदरक, 250g हरी मिर्च' },
];

export const VoiceAssistantModal: React.FC<VoiceAssistantModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { shops } = useCustomerMarket();
  const { addToCart, shopId: activeCartShopId } = useCustomerCart();
  const { language } = useCustomerLanguage();

  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [manualInput, setManualInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [interpretedItems, setInterpretedItems] = useState<InterpretedVoiceItem[]>([]);
  const [allAddedMessage, setAllAddedMessage] = useState<string | null>(null);
  const [speechError, setSpeechError] = useState<string | null>(null);

  const recognitionRef = useRef<any>(null);

  const stopRecognition = () => {
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
  };

  const startRecognition = () => {
    stopRecognition();

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setSpeechError('Speech recognition is not supported in this browser. Please type below.');
      return;
    }

    setTranscript('');
    setInterpretedItems([]);
    setAllAddedMessage(null);
    setSpeechError(null);

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = language === 'hi' ? 'hi-IN' : 'en-IN';

      recognition.onstart = () => {
        setIsListening(true);
        setSpeechError(null);
      };

      recognition.onresult = (event: any) => {
        let currentTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          currentTranscript += event.results[i][0].transcript;
        }
        setTranscript(currentTranscript);
      };

      recognition.onerror = (event: any) => {
        console.warn('Speech recognition error:', event.error);
        setIsListening(false);
        if (event.error === 'not-allowed') {
          setSpeechError('Microphone permission denied. Please allow microphone access or type your order.');
        } else if (event.error !== 'no-speech' && event.error !== 'aborted') {
          setSpeechError(`Voice error: ${event.error}`);
        }
      };

      recognition.onend = () => {
        setIsListening(false);
        recognitionRef.current = null;
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err: any) {
      console.error('Failed to start speech recognition', err);
      setIsListening(false);
      if (err?.name !== 'InvalidStateError') {
        setSpeechError('Could not start speech recognition. Please try typing.');
      }
    }
  };

  const toggleListening = () => {
    if (isListening) {
      stopRecognition();
    } else {
      startRecognition();
    }
  };

  // Stop listening if modal is closed
  useEffect(() => {
    if (!isOpen) {
      stopRecognition();
    }
  }, [isOpen]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopRecognition();
    };
  }, []);

  // When speech recognition finishes or transcript updates with text, parse items
  useEffect(() => {
    if (!isListening && transcript.trim().length > 3) {
      parseVoiceTranscript(transcript);
    }
  }, [isListening, transcript]);

  /**
   * Client-side Natural Language Parser for Hindi & Hinglish Grocery Requests
   */
  const parseVoiceTranscript = async (rawText: string) => {
    if (!rawText || rawText.trim().length === 0) return;
    setIsProcessing(true);
    setAllAddedMessage(null);

    await new Promise((r) => setTimeout(r, 400));

    const text = rawText.toLowerCase().replace(/,/g, ' and ').replace(/aur/g, ' and ').replace(/tatha/g, ' and ');
    const clauses = text.split(/and|\+|\n/).map((c) => c.trim()).filter(Boolean);

    const parsedResults: InterpretedVoiceItem[] = [];

    const commodityDict: Record<string, { aliases: string[]; defaultUnit: import('../../../types/product.ts').BaseUnit; basePrice: number; category: string }> = {
      soap: { aliases: ['soap', 'sabun', 'saabun', 'lifebuoy', 'lux', 'dettol', 'साबुन'], defaultUnit: 'piece', basePrice: 10, category: 'Personal Care' },
      masala: { aliases: ['masala', 'spice', 'garam masala', 'chaat masala', 'spices', 'मसाला', 'मसाले'], defaultUnit: 'packet', basePrice: 25, category: 'Grocery' },
      tomato: { aliases: ['tomato', 'tomatoes', 'tamatar', 'tamator', 'टमाटर'], defaultUnit: 'kg', basePrice: 40, category: 'Vegetables' },
      onion: { aliases: ['onion', 'onions', 'pyaaz', 'pyaz', 'kanda', 'प्याज', 'कांदा'], defaultUnit: 'kg', basePrice: 35, category: 'Vegetables' },
      potato: { aliases: ['potato', 'potatoes', 'aloo', 'alu', 'बटाटा', 'आलू'], defaultUnit: 'kg', basePrice: 30, category: 'Vegetables' },
      paneer: { aliases: ['paneer', 'panir', 'cottage cheese', 'पनीर'], defaultUnit: 'kg', basePrice: 380, category: 'Dairy' },
      milk: { aliases: ['milk', 'doodh', 'dudh', 'amul milk', 'taaza', 'दूध'], defaultUnit: 'L', basePrice: 66, category: 'Dairy' },
      butter: { aliases: ['butter', 'makhan', 'makkhan', 'amul butter', 'मक्खन'], defaultUnit: 'packet', basePrice: 58, category: 'Dairy' },
      pav: { aliases: ['pav', 'paav', 'bread', 'bun', 'पाव'], defaultUnit: 'packet', basePrice: 20, category: 'Bakery' },
      rice: { aliases: ['rice', 'chawal', 'basmati', 'kolam', 'चावल'], defaultUnit: 'kg', basePrice: 90, category: 'Grocery' },
      atta: { aliases: ['atta', 'gehu', 'wheat', 'chakki atta', 'aashirvaad', 'आटा'], defaultUnit: 'kg', basePrice: 45, category: 'Grocery' },
      sugar: { aliases: ['sugar', 'cheeni', 'chini', 'shakkar', 'sakhar', 'चीनी', 'शक्कर'], defaultUnit: 'kg', basePrice: 44, category: 'Grocery' },
      kaju: { aliases: ['kaju', 'cashew', 'cashews', 'काजू'], defaultUnit: 'kg', basePrice: 950, category: 'Grocery' },
      ginger: { aliases: ['ginger', 'adrak', 'adrakh', 'अदरक'], defaultUnit: 'kg', basePrice: 120, category: 'Vegetables' },
      chilli: { aliases: ['chilli', 'chilly', 'mirchi', 'hari mirch', 'मिर्च', 'हरी मिर्च'], defaultUnit: 'kg', basePrice: 80, category: 'Vegetables' },
      coriander: { aliases: ['coriander', 'dhaniya', 'kothmir', 'धनिया', 'कोथिंबीर'], defaultUnit: 'bunch', basePrice: 15, category: 'Vegetables' },
    };

    // Check if a specific shop name is mentioned (e.g. Manish Kirana Store / मनीष किराना)
    let shopMentioned: Shop | null = null;
    if (text.includes('manish') || text.includes('मनीष')) {
      shopMentioned = shops.find((s) => (s.name || '').toLowerCase().includes('manish') || s.name?.includes('मनीष')) || null;
    } else if (text.includes('laxmi') || text.includes('लक्ष्मी')) {
      shopMentioned = shops.find((s) => (s.name || '').toLowerCase().includes('laxmi') || s.name?.includes('लक्ष्मी')) || null;
    } else if (text.includes('ganesh') || text.includes('गणेश')) {
      shopMentioned = shops.find((s) => (s.name || '').toLowerCase().includes('ganesh') || s.name?.includes('गणेश')) || null;
    } else if (text.includes('gokul') || text.includes('गोकुल')) {
      shopMentioned = shops.find((s) => (s.name || '').toLowerCase().includes('gokul') || s.name?.includes('गोकुल')) || null;
    }

    clauses.forEach((clause, idx) => {
      let multiplier = 1.0;
      let count = 1;
      let displayUnit = '1 portion';
      let explicitRupees: number | null = null;

      // Extract explicit rupee amounts like ₹10, ₹25, 10 rupaye, 25 ka
      const rupeeMatch = clause.match(/(?:₹|rs\.?|रुपये?|रु\.?)\s*(\d+)/i) || clause.match(/(\d+)\s*(?:रुपये?|rupaye?|rs|ka\b)/i);
      if (rupeeMatch && rupeeMatch[1]) {
        explicitRupees = parseInt(rupeeMatch[1], 10);
      }

      if (clause.includes('500g') || clause.includes('500 g') || clause.includes('500 gram') || clause.includes('aadha kilo') || clause.includes('half kg') || clause.includes('आधा किलो')) {
        multiplier = 0.5;
        displayUnit = '500g';
      } else if (clause.includes('250g') || clause.includes('250 g') || clause.includes('250 gram') || clause.includes('pav kilo') || clause.includes('paav kilo') || clause.includes('पाव किलो')) {
        multiplier = 0.25;
        displayUnit = '250g';
      } else if (clause.includes('100g') || clause.includes('100 g') || clause.includes('100 gram') || clause.includes('sau gram') || clause.includes('100 ग्राम')) {
        multiplier = 0.1;
        displayUnit = '100g';
      } else if (clause.includes('2kg') || clause.includes('2 kg') || clause.includes('2 kilo') || clause.includes('do kilo') || clause.includes('२ किलो')) {
        multiplier = 2.0;
        displayUnit = '2 kg';
      } else if (clause.includes('5kg') || clause.includes('5 kg') || clause.includes('5 kilo') || clause.includes('paanch kilo') || clause.includes('५ किलो')) {
        multiplier = 5.0;
        displayUnit = '5 kg';
      } else if (clause.includes('1kg') || clause.includes('1 kg') || clause.includes('1 kilo') || clause.includes('ek kilo') || clause.includes('१ किलो')) {
        multiplier = 1.0;
        displayUnit = '1 kg';
      } else if (clause.includes('2 packet') || clause.includes('2 pkt') || clause.includes('do packet')) {
        count = 2;
        multiplier = 1.0;
        displayUnit = '2 packets';
      } else if (clause.includes('3 packet') || clause.includes('3 pkt')) {
        count = 3;
        multiplier = 1.0;
        displayUnit = '3 packets';
      } else if (explicitRupees !== null) {
        displayUnit = `₹${explicitRupees} का पैक`;
      } else {
        multiplier = 1.0;
        displayUnit = '1 portion';
      }

      let matchedKey: string | null = null;
      for (const [key, def] of Object.entries(commodityDict)) {
        if (def.aliases.some((alias) => clause.includes(alias))) {
          matchedKey = key;
          break;
        }
      }

      const preferredShop = shopMentioned || shops.find((s) => s.id === activeCartShopId) || shops[0] || null;

      if (matchedKey) {
        const def = commodityDict[matchedKey];
        const estPrice = explicitRupees !== null ? explicitRupees : Math.round(def.basePrice * multiplier * count);

        const syntheticProduct: Product = {
          id: `prod_voice_${matchedKey}`,
          shopId: preferredShop?.id || 'shp_krishna_grocers',
          name: matchedKey.charAt(0).toUpperCase() + matchedKey.slice(1),
          nameHindi: def.aliases[def.aliases.length - 1],
          description: `Fresh mandi ${matchedKey}`,
          category: def.category,
          imageUrl: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=400&auto=format&fit=crop&q=80',
          fractionalConfig: {
            unitType: ProductUnitType.WEIGHT,
            baseUnit: def.defaultUnit,
            basePrice: explicitRupees !== null ? explicitRupees : def.basePrice,
            minQuantityMultiplier: 0.1,
            maxQuantityMultiplier: 10,
            stepQuantityMultiplier: 0.1,
            allowCustomFractionalInput: true,
            predefinedOptions: [
              { id: 'opt_1', multiplier: 0.25, label: '250g', unitLabel: 'g' },
              { id: 'opt_2', multiplier: 0.5, label: '500g', unitLabel: 'g' },
              { id: 'opt_3', multiplier: 1.0, label: '1 kg', unitLabel: 'kg', isDefault: true },
            ],
          },
          currentStockInBaseUnits: 50,
          lowStockThresholdInBaseUnits: 5,
          isAvailable: true,
          isFeatured: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        parsedResults.push({
          id: `voice_item_${idx}_${Date.now()}`,
          originalText: clause,
          matchedProduct: syntheticProduct,
          matchedShop: preferredShop,
          quantityMultiplier: multiplier,
          quantityCount: count,
          displayPortion: displayUnit,
          estimatedPrice: estPrice,
          confidence: 0.95,
          addedToCart: false,
        });
      } else if (clause.trim().length > 2) {
        const genericName = clause.replace(/\d+/g, '').replace(/kg|gram|g|kilo|packet|pkt/g, '').trim();
        parsedResults.push({
          id: `voice_item_${idx}_${Date.now()}`,
          originalText: clause,
          matchedProduct: {
            id: `prod_gen_${idx}`,
            shopId: preferredShop?.id || 'shp_krishna_grocers',
            name: genericName.charAt(0).toUpperCase() + genericName.slice(1) || 'Mandi Item',
            description: `Fresh mandi ${genericName}`,
            category: 'General',
            imageUrl: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=400&auto=format&fit=crop&q=80',
            fractionalConfig: {
              unitType: ProductUnitType.PIECE,
              baseUnit: 'piece',
              basePrice: 50,
              minQuantityMultiplier: 1,
              maxQuantityMultiplier: 10,
              stepQuantityMultiplier: 1,
              allowCustomFractionalInput: false,
              predefinedOptions: [],
            },
            currentStockInBaseUnits: 20,
            lowStockThresholdInBaseUnits: 5,
            isAvailable: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          matchedShop: preferredShop,
          quantityMultiplier: multiplier,
          quantityCount: count,
          displayPortion: displayUnit,
          estimatedPrice: 50 * count,
          confidence: 0.75,
          addedToCart: false,
        });
      }
    });

    setInterpretedItems(parsedResults);
    setIsProcessing(false);
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualInput.trim()) {
      setTranscript(manualInput);
      parseVoiceTranscript(manualInput);
    }
  };

  const handleAddSingleItem = (item: InterpretedVoiceItem) => {
    if (!item.matchedProduct || !item.matchedShop) return;

    addToCart(
      item.matchedProduct,
      item.matchedShop,
      item.quantityMultiplier,
      item.quantityCount,
      item.displayPortion
    );

    setInterpretedItems((prev) =>
      prev.map((i) => (i.id === item.id ? { ...i, addedToCart: true } : i))
    );
  };

  const handleAddAllToCart = () => {
    let count = 0;
    interpretedItems.forEach((item) => {
      if (item.matchedProduct && item.matchedShop && !item.addedToCart) {
        addToCart(
          item.matchedProduct,
          item.matchedShop,
          item.quantityMultiplier,
          item.quantityCount,
          item.displayPortion
        );
        count++;
      }
    });

    setInterpretedItems((prev) => prev.map((i) => ({ ...i, addedToCart: true })));
    setAllAddedMessage(
      language === 'hi'
        ? `सभी ${count} सामान आपके कार्ट में जोड़ दिए गए हैं!`
        : `Added ${count} items to your cart successfully!`
    );
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="bg-white border border-slate-200 rounded-t-3xl sm:rounded-3xl w-full max-w-md p-5 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-1 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-2xl bg-emerald-100 flex items-center justify-center text-emerald-800 shadow-2xs">
              <Mic className="w-5 h-5 text-emerald-700" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900 flex items-center gap-1.5">
                <span>{language === 'hi' ? '🎙️ बोलकर ऑर्डर करें' : '🎙️ Order by Voice'}</span>
                <span className="px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 text-[9px] font-bold">
                  Hindi / Hinglish
                </span>
              </h3>
              <p className="text-[10px] text-slate-500">
                {language === 'hi' ? 'लिखने की जरूरत नहीं • बस बोलकर सामान बताइए' : 'No typing needed • Just speak your items'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-slate-100 text-slate-500 hover:text-slate-900 flex items-center justify-center text-xs font-bold"
          >
            ✕
          </button>
        </div>

        {/* Large Central Pulsing Microphone / Waveform Area */}
        <div className="bg-slate-50 border border-slate-200 rounded-3xl p-5 text-center space-y-3 shadow-2xs relative overflow-hidden">
          {/* Helper Headline */}
          <div className="space-y-0.5">
            <div className="text-xs font-black text-slate-900">
              {language === 'hi' ? 'लिखने की जरूरत नहीं।' : 'No need to type.'}
            </div>
            <div className="text-xs text-emerald-800 font-bold">
              {language === 'hi' ? 'बस बोलकर अपना सामान बताइए।' : 'Just speak your grocery list naturally.'}
            </div>
          </div>

          {/* Pulsing ring animations when listening */}
          <div className="relative flex items-center justify-center py-2">
            {isListening && (
              <>
                <div className="absolute w-24 h-24 rounded-full bg-emerald-400/40 animate-ping" />
                <div className="absolute w-32 h-32 rounded-full bg-emerald-400/20 animate-pulse" />
              </>
            )}

            <button
              type="button"
              onClick={toggleListening}
              className={`relative z-10 w-20 h-20 rounded-full flex items-center justify-center transition-all shadow-md transform active:scale-95 ${
                isListening
                  ? 'bg-rose-500 text-white ring-4 ring-rose-200 shadow-rose-300 animate-pulse'
                  : 'bg-emerald-600 text-white ring-4 ring-emerald-100 hover:scale-105 shadow-emerald-200'
              }`}
            >
              {isListening ? (
                <MicOff className="w-8 h-8 stroke-[2.5]" />
              ) : (
                <Mic className="w-8 h-8 stroke-[2.5]" />
              )}
            </button>
          </div>

          {/* Status & Natural Speech Example */}
          <div>
            <div className="text-xs font-bold text-slate-900">
              {isListening
                ? language === 'hi'
                  ? '🎙️ सुन रहे हैं... कृपया बोलें'
                  : '🎙️ Listening... Speak your items'
                : language === 'hi'
                ? 'माइक दबाएं और बोलें'
                : 'Tap microphone to speak'}
            </div>
            <div className="text-[11px] text-slate-600 bg-white border border-slate-200 rounded-xl p-2 mt-2 text-left leading-relaxed">
              <span className="font-bold text-slate-800 block text-[10px] uppercase text-emerald-800">
                {language === 'hi' ? 'उदा. बोलकर देखें:' : 'Example:'}
              </span>
              "{language === 'hi'
                ? 'मनीष किराना स्टोर से ₹10 का साबुन, ₹25 का मसाला और 1 किलो चावल चाहिए।'
                : 'Manish Kirana Store se 10 rupaye ka sabun, 25 ka masala aur 1 kg chawal'}"
            </div>
          </div>

          {/* Live Transcript Display */}
          {(transcript || isListening) && (
            <div className="bg-white border border-slate-200 rounded-2xl p-3 text-left space-y-1 shadow-2xs">
              <div className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider">
                {language === 'hi' ? 'लाइव ट्रांसक्रिप्ट (Live Transcript):' : 'Live Transcript:'}
              </div>
              <div className="text-xs font-semibold text-slate-900 italic">
                "{transcript || (language === 'hi' ? 'बोलना शुरू करें...' : 'Listening to speech...')}"
              </div>
            </div>
          )}

          {/* Error notice if any */}
          {speechError && (
            <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-[11px] text-amber-800 flex items-center gap-2 text-left">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>{speechError}</span>
            </div>
          )}
        </div>

        {/* Quick Sample Prompts to Tap */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 px-1">
            <span>{language === 'hi' ? '⚡ त्वरित उदाहरण (Tap to Try):' : '⚡ Quick Voice Prompts:'}</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
            {SAMPLE_PROMPTS.map((sample, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  const query = language === 'hi' ? sample.textHi : sample.textEn;
                  setTranscript(query);
                  parseVoiceTranscript(query);
                }}
                className="p-2 rounded-xl bg-slate-50 border border-slate-200 hover:border-emerald-400 hover:bg-emerald-50 text-left text-[11px] text-slate-700 hover:text-emerald-900 transition-all truncate"
              >
                💬 {sample.display}
              </button>
            ))}
          </div>
        </div>

        {/* Manual Hinglish / Hindi Text Input Fallback */}
        <form onSubmit={handleManualSubmit} className="relative">
          <input
            type="text"
            value={manualInput}
            onChange={(e) => setManualInput(e.target.value)}
            placeholder={language === 'hi' ? 'या यहाँ टाइप करें (उदा: 500g पनीर और 2 पैकेट पाव)...' : 'Or type in Hinglish (e.g. 500g paneer aur 2 pkt pav)...'}
            className="w-full pl-3 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:bg-white"
          />
          <button
            type="submit"
            disabled={!manualInput.trim()}
            className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-emerald-600 disabled:text-slate-300"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>

        {/* Interpreted Items Cards */}
        {isProcessing ? (
          <div className="py-6 text-center space-y-2">
            <div className="w-6 h-6 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto" />
            <div className="text-xs text-slate-500">
              {language === 'hi' ? 'मंडी कैटलॉग से सामान खोजा जा रहा है...' : 'Matching items with local mandi shops...'}
            </div>
          </div>
        ) : interpretedItems.length > 0 ? (
          <div className="space-y-3 pt-1 border-t border-slate-200">
            <div className="flex items-center justify-between">
              <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                <ShoppingBag className="w-4 h-4 text-emerald-600" />
                <span>{language === 'hi' ? 'पहचाने गए सामान' : 'Matched Items'} ({interpretedItems.length})</span>
              </div>

              <button
                type="button"
                onClick={handleAddAllToCart}
                className="px-3 py-1 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs flex items-center gap-1 transition-all"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{language === 'hi' ? 'सभी कार्ट में जोड़ें' : 'Add All to Cart'}</span>
              </button>
            </div>

            {/* Success alert */}
            {allAddedMessage && (
              <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{allAddedMessage}</span>
              </div>
            )}

            {/* List of matched items */}
            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {interpretedItems.map((item) => (
                <div
                  key={item.id}
                  className="p-3 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-3"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-slate-900 truncate">
                        {item.matchedProduct?.name}
                      </span>
                      {item.matchedProduct?.nameHindi && (
                        <span className="text-[10px] text-slate-500 font-medium">
                          ({item.matchedProduct.nameHindi})
                        </span>
                      )}
                    </div>

                    <div className="text-[11px] text-emerald-700 font-bold mt-0.5">
                      {item.displayPortion} × {item.quantityCount} • ≈ ₹{item.estimatedPrice}
                    </div>

                    {item.matchedShop && (
                      <div className="text-[10px] text-slate-500 flex items-center gap-1 mt-0.5">
                        <Store className="w-3 h-3 text-slate-400" />
                        <span className="truncate">{item.matchedShop.name}</span>
                      </div>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => handleAddSingleItem(item)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 transition-all shrink-0 ${
                      item.addedToCart
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                        : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-2xs'
                    }`}
                  >
                    {item.addedToCart ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Added</span>
                      </>
                    ) : (
                      <>
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add</span>
                      </>
                    )}
                  </button>
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
};

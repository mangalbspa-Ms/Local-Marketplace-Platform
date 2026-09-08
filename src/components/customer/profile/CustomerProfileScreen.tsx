/**
 * Screen 9 — Customer Profile & Settings Screen
 * 
 * 1. Top Profile Card:
 *    [Customer Photo]
 *    Rahul Sharma
 *    +91 98201 23456
 *    📍 Dadar West, Mumbai
 * 2. Menu Options:
 *    - 👤 मेरी जानकारी (Account Info)
 *    - 📍 मेरे पते (Saved Addresses)
 *    - 📦 मेरे ऑर्डर (My Orders)
 *    - 🎙️ बोलकर ऑर्डर करें (Voice Assistant)
 *    - 🌐 भाषा (Language - English / हिन्दी toggle)
 *    - ❓ सहायता व अक्सर पूछे जाने वाले सवाल (Help & FAQs)
 *    - 🔄 डेमो ग्राहक खाता बदलें (Switch Demo Profile)
 */

import React, { useState } from 'react';
import { useCustomerAuth, DEMO_CUSTOMERS } from '../../../context/CustomerAuthContext.tsx';
import { useCustomerMarket } from '../../../context/CustomerMarketContext.tsx';
import { useCustomerLanguage } from '../../../context/CustomerLanguageContext.tsx';
import { AddressSelectionModal } from '../cart/AddressSelectionModal.tsx';
import {
  User,
  MapPin,
  Globe,
  Store,
  Phone,
  Mail,
  HelpCircle,
  ChevronRight,
  Sparkles,
  ChevronDown,
  Receipt,
  Check,
  Mic,
  Bell,
  ShieldCheck,
  Package,
} from 'lucide-react';

interface CustomerProfileScreenProps {
  onOpenOrders: () => void;
  onBrowseShops: () => void;
  onOpenVoiceAssistant?: () => void;
  onOpenNotifications?: () => void;
}

export const CustomerProfileScreen: React.FC<CustomerProfileScreenProps> = ({
  onOpenOrders,
  onBrowseShops,
  onOpenVoiceAssistant,
  onOpenNotifications,
}) => {
  const { user, switchCustomer, selectedAddress } = useCustomerAuth();
  const { currentMarket } = useCustomerMarket();
  const { language, setLanguage, t } = useCustomerLanguage();

  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [isCustomerSwitcherOpen, setIsCustomerSwitcherOpen] = useState(false);
  const [expandedFaqIndex, setExpandedFaqIndex] = useState<number | null>(null);

  const faqs = [
    {
      qEn: 'How does 4-Digit PIN Store Pickup work?',
      qHi: '४-अंकों का पिकअप पिन कैसे काम करता है?',
      aEn: 'When your order is prepared, a unique 4-digit PIN is displayed on your order tracker. Simply show this PIN at the merchant counter to collect your verified package instantly without waiting in queue.',
      aHi: 'जब आपका ऑर्डर तैयार हो जाता है, तो ट्रैकर पर ४-अंकों का सुरक्षित पिन दिखता है। दुकान के काउंटर पर यह पिन दिखाकर बिना लाइन में लगे तुरंत सामान प्राप्त करें।',
    },
    {
      qEn: 'Can I order custom portions (e.g. 100g, 250g, 500g)?',
      qHi: 'क्या मैं अपनी पसंद से वजन (जैसे १०० ग्राम, २५० ग्राम, आधा किलो) चुन सकता हूँ?',
      aEn: 'Yes! Local mandi shops support authentic fractional weighing. You can choose predefined chips (250g, 500g, 1kg) or enter any custom portion in grams or kilograms.',
      aHi: 'हाँ! मंडी की सभी दुकानें सटीक तौल का समर्थन करती हैं। आप प्रीसेट बटन चुन सकते हैं या अपनी इच्छानुसार सटीक वजन दर्ज कर सकते हैं।',
    },
    {
      qEn: 'What are the delivery charges and minimum order?',
      qHi: 'डिलीवरी चार्ज और न्यूनतम ऑर्डर क्या है?',
      aEn: 'Delivery fees are set transparently by each neighborhood shop (starting from ₹0 to ₹25). Most merchants offer FREE delivery above ₹299.',
      aHi: 'डिलीवरी शुल्क प्रत्येक स्थानीय दुकान द्वारा तय किया जाता है (₹० से ₹२५ तक)। अधिकांश दुकानें ₹२९९ से ऊपर मुफ्त डिलीवरी देती हैं।',
    },
    {
      qEn: 'How do I use the Voice Assistant in Hindi / Hinglish?',
      qHi: 'हिन्दी या हिंग्लिश में बोलकर ऑर्डर कैसे करें?',
      aEn: 'Tap the microphone button on the Home screen or bottom bar, and speak naturally (e.g., "1 kilo tamatar aur aadha kilo pyaaz"). The assistant will match fresh items across mandi stores and add them directly to your cart.',
      aHi: 'होम स्क्रीन या नीचे दिए माइक बटन को दबाएं और सामान्य रूप से बोलें (जैसे: "1 किलो आलू और 500 ग्राम टमाटर")। ऐप तुरंत सामान पहचान कर आपके कार्ट में जोड़ देगा।',
    },
  ];

  return (
    <div className="space-y-4 p-4 pb-32 bg-white min-h-screen">
      {/* 1. Top Profile Card Matching Reference */}
      <div className="bg-emerald-600 text-white rounded-3xl p-4 shadow-sm space-y-3">
        <div className="flex items-center gap-3">
          {/* Avatar */}
          <div className="w-14 h-14 rounded-2xl bg-white/20 border border-white/30 overflow-hidden flex items-center justify-center shrink-0">
            {user?.avatarUrl && user.avatarUrl.trim() !== '' ? (
              <img
                src={user.avatarUrl}
                alt={user.fullName}
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            ) : (
              <User className="w-6 h-6 text-white" />
            )}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <h1 className="text-sm font-black text-white truncate">
                {user?.fullName || 'Rahul Sharma'}
              </h1>
              <span className="px-1.5 py-0.2 rounded bg-white/20 text-white text-[9px] font-bold shrink-0">
                Verified
              </span>
            </div>
            <div className="text-xs text-emerald-100 flex items-center gap-1 mt-0.5 font-medium">
              <Phone className="w-3 h-3 text-emerald-200" />
              <span>{user?.phone || '+91 98201 23456'}</span>
            </div>
            <div className="text-[11px] text-emerald-100 flex items-center gap-1 mt-0.5">
              <MapPin className="w-3 h-3 text-emerald-200 shrink-0" />
              <span className="truncate">
                {selectedAddress
                  ? `${selectedAddress.area || selectedAddress.streetAddress}, Mumbai`
                  : 'Dadar West, Mumbai'}
              </span>
            </div>
          </div>
        </div>

        {/* Quick Demo Switcher Accordion */}
        <div className="pt-2 border-t border-white/20">
          <button
            type="button"
            onClick={() => setIsCustomerSwitcherOpen(!isCustomerSwitcherOpen)}
            className="w-full flex items-center justify-between text-xs font-bold text-white hover:text-emerald-100 transition-colors"
          >
            <div className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>{language === 'hi' ? 'डेमो ग्राहक खाता बदलें' : 'Switch Demo Customer Account'}</span>
            </div>
            <ChevronDown
              className={`w-3.5 h-3.5 transition-transform ${
                isCustomerSwitcherOpen ? 'rotate-180' : ''
              }`}
            />
          </button>

          {isCustomerSwitcherOpen && (
            <div className="grid grid-cols-1 gap-1.5 mt-2 pt-2 border-t border-white/20">
              {DEMO_CUSTOMERS.map((cust) => {
                const isSelected = cust.id === user?.id;
                return (
                  <button
                    key={cust.id}
                    type="button"
                    onClick={() => {
                      switchCustomer(cust.id);
                      setIsCustomerSwitcherOpen(false);
                    }}
                    className={`w-full flex items-center justify-between p-2 rounded-xl text-left transition-all ${
                      isSelected
                        ? 'bg-white text-emerald-900 font-bold shadow-xs'
                        : 'bg-white/10 text-white hover:bg-white/20'
                    }`}
                  >
                    <div className="truncate">
                      <div className="text-xs">{cust.fullName}</div>
                      <div className={`text-[10px] ${isSelected ? 'text-emerald-700' : 'text-emerald-200'}`}>
                        {cust.phone}
                      </div>
                    </div>
                    {isSelected && <Check className="w-3.5 h-3.5 text-emerald-900" />}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* 2. Menu Options List */}
      <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-2xs divide-y divide-slate-100">
        {/* Saved Addresses */}
        <button
          type="button"
          onClick={() => setIsAddressModalOpen(true)}
          className="w-full p-4 flex items-center justify-between hover:bg-slate-50 transition-colors text-left"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <MapPin className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-900">
                {language === 'hi' ? 'मेरे पते' : 'Saved Addresses'}
              </div>
              <div className="text-[10px] text-slate-500 truncate max-w-[200px]">
                {selectedAddress?.streetAddress || 'Dadar West, Mumbai'}
              </div>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400" />
        </button>

        {/* My Orders */}
        <button
          type="button"
          onClick={onOpenOrders}
          className="w-full p-4 flex items-center justify-between hover:bg-slate-50 transition-colors text-left"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center">
              <Package className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-900">
                {language === 'hi' ? 'मेरे ऑर्डर' : 'My Orders'}
              </div>
              <div className="text-[10px] text-slate-500">
                {language === 'hi' ? 'लाइव ट्रैकिंग व पिछला इतिहास' : 'Live tracking & order history'}
              </div>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400" />
        </button>

        {/* Voice Assistant Shortcut */}
        {onOpenVoiceAssistant && (
          <button
            type="button"
            onClick={onOpenVoiceAssistant}
            className="w-full p-4 flex items-center justify-between hover:bg-slate-50 transition-colors text-left"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
                <Mic className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-bold text-slate-900">
                  {language === 'hi' ? 'बोलकर ऑर्डर करें' : 'Voice Assistant'}
                </div>
                <div className="text-[10px] text-slate-500">
                  {language === 'hi' ? 'हिन्दी / हिंग्लिश में बोलें' : 'Order by speaking in Hindi/Hinglish'}
                </div>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400" />
          </button>
        )}

        {/* Language Selection Toggle (English / हिन्दी) */}
        <div className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center">
              <Globe className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-900">
                {language === 'hi' ? 'भाषा (Language)' : 'Language'}
              </div>
              <div className="text-[10px] text-slate-500">
                {language === 'hi' ? 'हिन्दी चुनी गई है' : 'English is selected'}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-xl border border-slate-200">
            <button
              type="button"
              onClick={() => setLanguage('en')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                language === 'en'
                  ? 'bg-emerald-600 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              English
            </button>
            <button
              type="button"
              onClick={() => setLanguage('hi')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                language === 'hi'
                  ? 'bg-emerald-600 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              हिन्दी
            </button>
          </div>
        </div>
      </div>

      {/* 3. Help & Support / FAQs Accordion */}
      <div className="bg-white border border-slate-200 rounded-3xl p-4 shadow-2xs space-y-3">
        <div className="flex items-center gap-2">
          <HelpCircle className="w-4 h-4 text-emerald-600" />
          <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
            {language === 'hi' ? 'अक्सर पूछे जाने वाले सवाल (FAQs)' : 'Help & Support / FAQs'}
          </h2>
        </div>

        <div className="space-y-2">
          {faqs.map((faq, idx) => {
            const isExpanded = expandedFaqIndex === idx;
            return (
              <div
                key={idx}
                className="bg-slate-50 border border-slate-200 rounded-2xl p-3 space-y-1.5 transition-all"
              >
                <button
                  type="button"
                  onClick={() => setExpandedFaqIndex(isExpanded ? null : idx)}
                  className="w-full flex items-center justify-between text-left text-xs font-bold text-slate-900 gap-2"
                >
                  <span>{language === 'hi' ? faq.qHi : faq.qEn}</span>
                  <ChevronDown
                    className={`w-3.5 h-3.5 text-slate-500 shrink-0 transition-transform ${
                      isExpanded ? 'rotate-180' : ''
                    }`}
                  />
                </button>
                {isExpanded && (
                  <p className="text-[11px] text-slate-600 leading-relaxed pt-1 border-t border-slate-200/60 animate-in fade-in duration-100">
                    {language === 'hi' ? faq.aHi : faq.aEn}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Address Selection Modal */}
      <AddressSelectionModal
        isOpen={isAddressModalOpen}
        onClose={() => setIsAddressModalOpen(false)}
      />
    </div>
  );
};

/**
 * Screen 1 — Customer Home Screen
 * 
 * Production-quality Indian grocery marketplace home screen:
 * - Top Header: Customer Photo, "नमस्ते, {Name} 👋", "📍 {Location}" + 🔔 & 👤 triggers
 * - Clean Search Box: "🔍 सामान, दुकान या प्रोडक्ट खोजें" + 🎙️
 * - Voice Assistant Banner: "बोलकर ताज़ा सामान मंगाएँ" (Hinglish/Hindi)
 * - Section 1: "आपके आसपास की दुकानें" (Compact verified shop cards with delivery ETA & fee)
 * - Section 2: "🔥 आज के ऑफर" (Discounted product cards with instant cart add)
 * - Section 3: "लोकप्रिय कैटेगरी" (Grocery, Fruits, Vegetables, Dairy, Atta, Rice, Oil, Masala, Snacks)
 */

import React, { useState, useMemo } from 'react';
import { useCustomerMarket } from '../../context/CustomerMarketContext.tsx';
import { useCustomerCart } from '../../context/CustomerCartContext.tsx';
import { useCustomerAuth } from '../../context/CustomerAuthContext.tsx';
import { useCustomerLanguage } from '../../context/CustomerLanguageContext.tsx';
import { Shop } from '../../types/market.ts';
import { Product, ProductUnitType } from '../../types/product.ts';
import { ShopCard } from '../shops/ShopCard.tsx';
import {
  Search,
  Store,
  Star,
  Clock,
  Bike,
  Sparkles,
  MapPin,
  ChevronRight,
  Mic,
  Bell,
  User,
  Plus,
  Minus,
  Check,
  Flame,
  ShieldCheck,
  Navigation,
} from 'lucide-react';

interface HomeScreenProps {
  onSelectShop: (shop: Shop) => void;
  onOpenSearch: (initialQuery?: string) => void;
  onOpenVoiceAssistant?: () => void;
  onOpenNotifications?: () => void;
  onOpenProfile?: () => void;
  onOpenAddressSelection?: () => void;
  onOpenProductDetails?: (product: Product, shop: Shop) => void;
}

export const CATEGORIES_LIST = [
  { id: 'all', labelEn: 'All', labelHi: 'सभी', emoji: '🏪' },
  { id: 'grocery', labelEn: 'Grocery', labelHi: 'किराना', emoji: '🌾', match: ['grocery', 'kirana', 'grains', 'atta', 'rice', 'dal', 'oil'] },
  { id: 'fruits', labelEn: 'Fruits', labelHi: 'फल', emoji: '🍎', match: ['fruits', 'apple', 'banana', 'mango'] },
  { id: 'vegetables', labelEn: 'Vegetables', labelHi: 'सब्जियाँ', emoji: '🥦', match: ['vegetables', 'greens', 'tomato', 'potato', 'onion', 'veg'] },
  { id: 'dairy', labelEn: 'Dairy', labelHi: 'डेयरी', emoji: '🥛', match: ['dairy', 'milk', 'paneer', 'curd', 'ghee'] },
  { id: 'masala', labelEn: 'Spices', labelHi: 'मसाले', emoji: '🌶️', match: ['masala', 'spice', 'chilli', 'turmeric'] },
  { id: 'bakery', labelEn: 'Bakery', labelHi: 'बेकरी', emoji: '🍞', match: ['bakery', 'bread', 'rusk', 'biscuit'] },
  { id: 'sweets', labelEn: 'Sweets', labelHi: 'मिठाई', emoji: '🍬', match: ['sweets', 'mithai', 'dessert'] },
  { id: 'pharma', labelEn: 'Pharma', labelHi: 'दवा', emoji: '💊', match: ['pharma', 'medicine', 'health'] },
];

// Curated daily marketplace deals with full product representation
const TODAYS_OFFERS: Array<{
  product: Product;
  shopName: string;
  discountBadge: string;
  strikePrice: number;
}> = [
  {
    product: {
      id: 'deal_tomato',
      shopId: 'shop_veggies_1',
      name: 'Fresh Farm Tomatoes (ताजा टमाटर)',
      nameHindi: 'ताज़ा टमाटर',
      description: 'Plump and ripe juicy farm tomatoes',
      category: 'Vegetables',
      subCategory: 'Daily Veggies',
      fractionalConfig: {
        unitType: ProductUnitType.WEIGHT,
        baseUnit: 'kg',
        basePrice: 24,
        minQuantityMultiplier: 0.25,
        maxQuantityMultiplier: 10,
        stepQuantityMultiplier: 0.25,
        allowCustomFractionalInput: true,
        predefinedOptions: [
          { id: 't_250g', label: '250g', multiplier: 0.25, unitLabel: 'g' },
          { id: 't_500g', label: '500g', multiplier: 0.5, unitLabel: 'g' },
          { id: 't_1kg', label: '1 kg', multiplier: 1.0, unitLabel: 'kg', isDefault: true },
        ],
      },
      imageUrl: 'https://images.unsplash.com/photo-1546094096-0df4bcaaa337?w=400&auto=format&fit=crop&q=80',
      isAvailable: true,
      currentStockInBaseUnits: 50,
      lowStockThresholdInBaseUnits: 5,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    shopName: 'Shree Ganesh Fresh Veggies',
    discountBadge: '20% OFF',
    strikePrice: 30,
  },
  {
    product: {
      id: 'deal_potato',
      shopId: 'shop_veggies_1',
      name: 'Fresh Potatoes (आलू)',
      nameHindi: 'ताज़ा आलू',
      description: 'Clean medium size fresh potatoes',
      category: 'Vegetables',
      subCategory: 'Daily Veggies',
      fractionalConfig: {
        unitType: ProductUnitType.WEIGHT,
        baseUnit: 'kg',
        basePrice: 22,
        minQuantityMultiplier: 0.5,
        maxQuantityMultiplier: 20,
        stepQuantityMultiplier: 0.5,
        allowCustomFractionalInput: true,
        predefinedOptions: [
          { id: 'p_500g', label: '500g', multiplier: 0.5, unitLabel: 'g' },
          { id: 'p_1kg', label: '1 kg', multiplier: 1.0, unitLabel: 'kg', isDefault: true },
          { id: 'p_2kg', label: '2 kg', multiplier: 2.0, unitLabel: 'kg' },
        ],
      },
      imageUrl: 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=400&auto=format&fit=crop&q=80',
      isAvailable: true,
      currentStockInBaseUnits: 90,
      lowStockThresholdInBaseUnits: 10,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    shopName: 'Shree Ganesh Fresh Veggies',
    discountBadge: '21% OFF',
    strikePrice: 28,
  },
  {
    product: {
      id: 'deal_coriander',
      shopId: 'shop_veggies_1',
      name: 'Fresh Coriander Bunch (ताज़ा हरा धनिया)',
      nameHindi: 'ताज़ा हरा धनिया',
      description: 'Aromatic farm-fresh green coriander',
      category: 'Vegetables',
      subCategory: 'Herbs',
      fractionalConfig: {
        unitType: ProductUnitType.PIECE,
        baseUnit: 'bunch',
        basePrice: 15,
        minQuantityMultiplier: 1,
        maxQuantityMultiplier: 10,
        stepQuantityMultiplier: 1,
        allowCustomFractionalInput: false,
        predefinedOptions: [
          { id: 'c_1bunch', label: '1 Bunch', multiplier: 1.0, unitLabel: 'bunch', isDefault: true },
          { id: 'c_2bunch', label: '2 Bunches', multiplier: 2.0, unitLabel: 'bunch' },
        ],
      },
      imageUrl: 'https://images.unsplash.com/photo-1592417817098-8f3d69109853?w=400&auto=format&fit=crop&q=80',
      isAvailable: true,
      currentStockInBaseUnits: 40,
      lowStockThresholdInBaseUnits: 5,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    shopName: 'Shree Ganesh Fresh Veggies',
    discountBadge: '25% OFF',
    strikePrice: 20,
  },
  {
    product: {
      id: 'deal_paneer',
      shopId: 'shop_dairy_1',
      name: 'Fresh Malai Paneer (ताजा मलाई पनीर)',
      nameHindi: 'ताज़ा मलाई पनीर',
      description: 'Soft cottage cheese made from pure buffalo milk',
      category: 'Dairy',
      subCategory: 'Fresh Dairy',
      fractionalConfig: {
        unitType: ProductUnitType.WEIGHT,
        baseUnit: 'kg',
        basePrice: 95,
        minQuantityMultiplier: 0.25,
        maxQuantityMultiplier: 5,
        stepQuantityMultiplier: 0.25,
        allowCustomFractionalInput: true,
        predefinedOptions: [
          { id: 'p_250g', label: '250g', multiplier: 0.25, unitLabel: 'g', isDefault: true },
          { id: 'p_500g', label: '500g', multiplier: 0.5, unitLabel: 'g' },
          { id: 'p_1kg', label: '1 kg', multiplier: 1.0, unitLabel: 'kg' },
        ],
      },
      imageUrl: 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=400&auto=format&fit=crop&q=80',
      isAvailable: true,
      currentStockInBaseUnits: 25,
      lowStockThresholdInBaseUnits: 3,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    shopName: 'Gokul Pure Dairy',
    discountBadge: '14% OFF',
    strikePrice: 110,
  },
  {
    product: {
      id: 'deal_onion',
      shopId: 'shop_veggies_1',
      name: 'Nashik Red Onions (नासिक प्याज)',
      nameHindi: 'नासिक लाल प्याज',
      description: 'Crisp and pungent red onions',
      category: 'Vegetables',
      subCategory: 'Daily Veggies',
      fractionalConfig: {
        unitType: ProductUnitType.WEIGHT,
        baseUnit: 'kg',
        basePrice: 28,
        minQuantityMultiplier: 0.5,
        maxQuantityMultiplier: 20,
        stepQuantityMultiplier: 0.5,
        allowCustomFractionalInput: true,
        predefinedOptions: [
          { id: 'o_500g', label: '500g', multiplier: 0.5, unitLabel: 'g' },
          { id: 'o_1kg', label: '1 kg', multiplier: 1.0, unitLabel: 'kg', isDefault: true },
          { id: 'o_2kg', label: '2 kg', multiplier: 2.0, unitLabel: 'kg' },
        ],
      },
      imageUrl: 'https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?w=400&auto=format&fit=crop&q=80',
      isAvailable: true,
      currentStockInBaseUnits: 80,
      lowStockThresholdInBaseUnits: 10,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    shopName: 'Shree Ganesh Fresh Veggies',
    discountBadge: '20% OFF',
    strikePrice: 35,
  },
  {
    product: {
      id: 'deal_basmati',
      shopId: 'shop_kirana_1',
      name: 'Daawat Rozana Basmati Rice (बासमती चावल)',
      nameHindi: 'दावत रोजाना बासमती चावल',
      description: 'Fragrant long grain basmati rice',
      category: 'Grocery',
      subCategory: 'Rice & Grains',
      fractionalConfig: {
        unitType: ProductUnitType.WEIGHT,
        baseUnit: 'kg',
        basePrice: 110,
        minQuantityMultiplier: 1,
        maxQuantityMultiplier: 10,
        stepQuantityMultiplier: 1,
        allowCustomFractionalInput: true,
        predefinedOptions: [
          { id: 'r_1kg', label: '1 kg', multiplier: 1.0, unitLabel: 'kg', isDefault: true },
          { id: 'r_5kg', label: '5 kg', multiplier: 5.0, unitLabel: 'kg' },
        ],
      },
      imageUrl: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400&auto=format&fit=crop&q=80',
      isAvailable: true,
      currentStockInBaseUnits: 40,
      lowStockThresholdInBaseUnits: 5,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    shopName: 'Manish Kirana Store',
    discountBadge: '12% OFF',
    strikePrice: 125,
  },
];

// Curated Popular / Trending products across mandi shops
const POPULAR_TRENDING_ITEMS: Array<{
  product: Product;
  shopName: string;
  strikePrice: number;
}> = [
  {
    product: {
      id: 'pop_amul_milk',
      shopId: 'shop_dairy_1',
      name: 'Amul Taaza Homogenised Toned Milk 1L',
      nameHindi: 'अमूल ताज़ा टोन्ड दूध 1 लीटर',
      description: 'Pasteurised toned milk with 3.0% fat',
      category: 'Dairy',
      subCategory: 'Milk',
      fractionalConfig: {
        unitType: ProductUnitType.VOLUME,
        baseUnit: 'L',
        basePrice: 66,
        minQuantityMultiplier: 1,
        maxQuantityMultiplier: 10,
        stepQuantityMultiplier: 1,
        allowCustomFractionalInput: false,
        predefinedOptions: [{ id: 'm_1l', label: '1 Litre', multiplier: 1.0, unitLabel: 'L', isDefault: true }],
      },
      imageUrl: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=400&auto=format&fit=crop&q=80',
      isAvailable: true,
      currentStockInBaseUnits: 40,
      lowStockThresholdInBaseUnits: 5,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    shopName: 'Gokul Pure Dairy',
    strikePrice: 70,
  },
  {
    product: {
      id: 'pop_amul_butter',
      shopId: 'shop_dairy_1',
      name: 'Amul Pasteurised Butter 100g',
      nameHindi: 'अमूल मक्खन 100g',
      description: 'Utterly butterly delicious fresh table butter',
      category: 'Dairy',
      subCategory: 'Butter',
      fractionalConfig: {
        unitType: ProductUnitType.PIECE,
        baseUnit: 'pack',
        basePrice: 58,
        minQuantityMultiplier: 1,
        maxQuantityMultiplier: 10,
        stepQuantityMultiplier: 1,
        allowCustomFractionalInput: false,
        predefinedOptions: [{ id: 'b_100g', label: '1 Pack (100g)', multiplier: 1.0, unitLabel: 'pack', isDefault: true }],
      },
      imageUrl: 'https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?w=400&auto=format&fit=crop&q=80',
      isAvailable: true,
      currentStockInBaseUnits: 30,
      lowStockThresholdInBaseUnits: 5,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    shopName: 'Gokul Pure Dairy',
    strikePrice: 62,
  },
  {
    product: {
      id: 'pop_aloo',
      shopId: 'shop_veggies_1',
      name: 'Fresh New Harvest Potatoes (आलू)',
      nameHindi: 'ताजा पहाड़ी आलू',
      description: 'Firm and smooth potatoes for daily cooking',
      category: 'Vegetables',
      subCategory: 'Daily Veggies',
      fractionalConfig: {
        unitType: ProductUnitType.WEIGHT,
        baseUnit: 'kg',
        basePrice: 28,
        minQuantityMultiplier: 0.5,
        maxQuantityMultiplier: 20,
        stepQuantityMultiplier: 0.5,
        allowCustomFractionalInput: true,
        predefinedOptions: [
          { id: 'a_500g', label: '500g', multiplier: 0.5, unitLabel: 'g' },
          { id: 'a_1kg', label: '1 kg', multiplier: 1.0, unitLabel: 'kg', isDefault: true },
          { id: 'a_2kg', label: '2 kg', multiplier: 2.0, unitLabel: 'kg' },
        ],
      },
      imageUrl: 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=400&auto=format&fit=crop&q=80',
      isAvailable: true,
      currentStockInBaseUnits: 100,
      lowStockThresholdInBaseUnits: 10,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    shopName: 'Shree Ganesh Fresh Veggies',
    strikePrice: 35,
  },
  {
    product: {
      id: 'pop_fortune_oil',
      shopId: 'shop_kirana_1',
      name: 'Fortune Sunlite Refined Sunflower Oil 1L',
      nameHindi: 'फॉर्च्यून रिफाइंड सनफ्लावर तेल 1L',
      description: 'Light and healthy sunflower cooking oil',
      category: 'Grocery',
      subCategory: 'Oils & Ghee',
      fractionalConfig: {
        unitType: ProductUnitType.VOLUME,
        baseUnit: 'L',
        basePrice: 145,
        minQuantityMultiplier: 1,
        maxQuantityMultiplier: 5,
        stepQuantityMultiplier: 1,
        allowCustomFractionalInput: false,
        predefinedOptions: [{ id: 'o_1l', label: '1 Litre Pouch', multiplier: 1.0, unitLabel: 'L', isDefault: true }],
      },
      imageUrl: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=400&auto=format&fit=crop&q=80',
      isAvailable: true,
      currentStockInBaseUnits: 25,
      lowStockThresholdInBaseUnits: 5,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    shopName: 'Laxmi Super Kirana',
    strikePrice: 165,
  },
];

export const HomeScreen: React.FC<HomeScreenProps> = ({
  onSelectShop,
  onOpenSearch,
  onOpenVoiceAssistant,
  onOpenNotifications,
  onOpenProfile,
  onOpenAddressSelection,
  onOpenProductDetails,
}) => {
  const { shops, isLoadingShops, selectedCategory, setSelectedCategory, getShopDistance, currentMarket, availableMarkets, selectMarket } =
    useCustomerMarket();
  const { user, selectedAddress } = useCustomerAuth();
  const { language, setLanguage, t } = useCustomerLanguage();
  const { addToCart, items: cartItems } = useCustomerCart();

  const [searchInput, setSearchInput] = useState('');
  const [justAddedItemIds, setJustAddedItemIds] = useState<Record<string, boolean>>({});
  const [isMarketDropdownOpen, setIsMarketDropdownOpen] = useState(false);

  // Filtered nearby shops
  const filteredShops = useMemo(() => {
    if (!shops) return [];
    if (selectedCategory === 'all') return shops;

    const catObj = CATEGORIES_LIST.find((c) => c.id === selectedCategory);
    if (!catObj || !catObj.match) return shops;

    return shops.filter((s) => {
      const catLower = (s.category || '').toLowerCase();
      return catObj.match?.some((m) => catLower.includes(m));
    });
  }, [shops, selectedCategory]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchInput.trim().length > 0) {
      onOpenSearch(searchInput.trim());
    } else {
      onOpenSearch();
    }
  };

  const handleAddDealToCart = (deal: (typeof TODAYS_OFFERS)[0] | (typeof POPULAR_TRENDING_ITEMS)[0]) => {
    const parentShop = shops.find((s) => s.id === deal.product.shopId) || shops[0];
    if (!parentShop) return;

    const defaultOpt =
      deal.product.fractionalConfig.predefinedOptions?.find((o) => o.isDefault) ||
      deal.product.fractionalConfig.predefinedOptions?.[0];
    const mult = defaultOpt ? defaultOpt.multiplier : 1.0;
    const label = defaultOpt ? defaultOpt.label : `1 ${deal.product.fractionalConfig.baseUnit}`;

    const success = addToCart(deal.product, parentShop, mult, 1, label);
    if (success) {
      setJustAddedItemIds((prev) => ({ ...prev, [deal.product.id]: true }));
      setTimeout(() => {
        setJustAddedItemIds((prev) => ({ ...prev, [deal.product.id]: false }));
      }, 1500);
    }
  };

  return (
    <div className="space-y-4 pb-28 bg-white min-h-screen">
      {/* 1. Top Header: [Photo] नमस्ते, Priya 👋 | 📍 Dadar West, Mumbai | 🔔 👤 + Language & Market */}
      <div className="bg-emerald-600 text-white px-4 pt-3 pb-4 rounded-b-3xl shadow-sm space-y-3">
        {/* Top bar: Avatar + Name + Language toggle + Notifications + Profile */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5 min-w-0">
            {/* Customer Avatar */}
            <div
              onClick={onOpenProfile}
              className="w-10 h-10 rounded-2xl bg-white/20 border border-white/30 overflow-hidden flex items-center justify-center cursor-pointer active:scale-95 transition-transform shrink-0"
            >
              {user?.avatarUrl && user.avatarUrl.trim() !== '' ? (
                <img
                  src={user.avatarUrl}
                  alt={user.fullName || 'Customer'}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <User className="w-5 h-5 text-white" />
              )}
            </div>

            {/* Greeting & Location */}
            <div className="min-w-0">
              <div className="text-xs font-semibold text-emerald-100 flex items-center gap-1">
                <span>{language === 'hi' ? 'नमस्ते' : 'Hello'},</span>
                <span className="text-white font-bold truncate max-w-[110px]">
                  {user?.fullName ? user.fullName.split(' ')[0] : (language === 'hi' ? 'Priya' : 'Priya')}
                </span>
                <span>👋</span>
              </div>
              <button
                type="button"
                onClick={onOpenAddressSelection}
                className="flex items-center gap-1 text-[11px] font-bold text-white hover:text-emerald-100 mt-0.5 group"
              >
                <MapPin className="w-3 h-3 text-emerald-200 shrink-0" />
                <span className="truncate max-w-[150px]">
                  {selectedAddress && (selectedAddress.area || selectedAddress.streetAddress) && selectedAddress.area !== 'undefined'
                    ? `${selectedAddress.area || selectedAddress.streetAddress}, ${selectedAddress.city || 'Mumbai'}`
                    : currentMarket?.name && currentMarket.name !== 'undefined'
                    ? currentMarket.name
                    : 'Dadar West, Mumbai'}
                </span>
                <ChevronRight className="w-3 h-3 text-emerald-200 shrink-0 group-hover:translate-x-0.5 transition-transform" />
              </button>
            </div>
          </div>

          {/* Right Action Icons: Language Toggle + Bell + Profile */}
          <div className="flex items-center gap-1.5 shrink-0">
            {/* Language Toggle */}
            <button
              type="button"
              onClick={() => setLanguage(language === 'hi' ? 'en' : 'hi')}
              className="px-2 py-1 rounded-xl bg-white/15 border border-white/20 text-[10px] font-extrabold text-white hover:bg-white/25 transition-colors"
              title="Toggle Language"
            >
              {language === 'hi' ? 'EN' : 'हिन्दी'}
            </button>

            <button
              type="button"
              onClick={onOpenNotifications}
              className="w-8 h-8 rounded-xl bg-white/15 border border-white/20 flex items-center justify-center text-white hover:bg-white/25 transition-colors relative"
              title="Notifications"
            >
              <Bell className="w-4 h-4" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-amber-400" />
            </button>

            <button
              type="button"
              onClick={onOpenProfile}
              className="w-8 h-8 rounded-xl bg-white/15 border border-white/20 flex items-center justify-center text-white hover:bg-white/25 transition-colors"
              title="Profile"
            >
              <User className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 2. Large Search Bar: "🔍 सामान, दुकान या प्रोडक्ट खोजें..." + 🎙️ */}
        <form onSubmit={handleSearchSubmit} className="relative">
          <div className="relative flex items-center">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 pointer-events-none" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder={
                language === 'hi'
                  ? 'सामान, दुकान या प्रोडक्ट खोजें...'
                  : 'Search groceries, vegetables or shops...'
              }
              className="w-full bg-white text-slate-900 placeholder:text-slate-400 text-xs pl-10 pr-11 py-3 rounded-2xl border border-transparent shadow-md focus:outline-hidden focus:ring-2 focus:ring-emerald-400"
            />
            {onOpenVoiceAssistant && (
              <button
                type="button"
                onClick={onOpenVoiceAssistant}
                className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-100 flex items-center justify-center absolute right-1.5 transition-colors border border-emerald-200"
                title="Voice Search"
              >
                <Mic className="w-4 h-4 text-emerald-600" />
              </button>
            )}
          </div>
        </form>
      </div>

      {/* 3. Compact Voice Order Area with Centered Circular Mic Button */}
      {onOpenVoiceAssistant && (
        <div className="px-4">
          <div
            onClick={onOpenVoiceAssistant}
            className="bg-gradient-to-b from-emerald-50 to-white border border-emerald-200 hover:border-emerald-400 rounded-2xl p-3.5 flex flex-col items-center text-center cursor-pointer shadow-xs hover:shadow-md transition-all group"
          >
            {/* Centered Large Attractive Circular Mic Button */}
            <div className="w-12 h-12 rounded-full bg-emerald-600 hover:bg-emerald-700 flex items-center justify-center text-white shadow-md shadow-emerald-600/30 group-hover:scale-110 transition-transform ring-4 ring-emerald-100">
              <Mic className="w-6 h-6 animate-pulse" />
            </div>

            <div className="mt-2 text-xs font-black text-slate-900">
              {language === 'hi' ? 'बोलकर ऑर्डर करें या दुकान सर्च करें' : 'Order by Voice or Search Shops'}
            </div>

            <div className="mt-0.5 text-[11px] text-slate-500 font-medium max-w-[280px]">
              {language === 'hi'
                ? "जैसे बोलें: 'मनीष किराना स्टोर से ₹10 का साबुन और ₹25 का मसाला चाहिए'"
                : "e.g. '1 kg tomatoes, 500g paneer and soap from Manish Kirana'"}
            </div>
          </div>
        </div>
      )}

      {/* 4. "श्रेणियां" (Categories Chips) */}
      <div className="space-y-2">
        <div className="px-4 flex items-center justify-between">
          <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
            {language === 'hi' ? 'श्रेणियां (Categories)' : 'Categories'}
          </h2>
          <span className="text-[11px] text-slate-500 font-medium">
            {language === 'hi' ? 'ताज़ा व शुद्ध' : 'Fresh Daily'}
          </span>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto px-4 pb-1 no-scrollbar">
          {CATEGORIES_LIST.map((cat) => {
            const isSelected = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.id)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all border shrink-0 ${
                  isSelected
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <span>{cat.emoji}</span>
                <span>{language === 'hi' ? cat.labelHi : cat.labelEn}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 5. "🏪 आपके आसपास की दुकानें" (2-Column Responsive Grid of Compact Shop Cards) */}
      <div className="space-y-3 pt-1">
        <div className="px-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-700">
              <Store className="w-3.5 h-3.5" />
            </div>
            <h2 className="text-sm font-extrabold text-slate-900 tracking-tight">
              {language === 'hi' ? '🏪 आपके आसपास की दुकानें' : '🏪 Nearby Mandi Shops'}
            </h2>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              {filteredShops.length} {language === 'hi' ? 'दुकानें' : 'shops'}
            </span>
            <button
              type="button"
              onClick={() => onOpenSearch()}
              className="text-[11px] font-bold text-emerald-700 hover:text-emerald-800"
            >
              {language === 'hi' ? 'सभी देखें →' : 'View All →'}
            </button>
          </div>
        </div>

        {/* 2-Column Responsive Grid of Compact Verified Shop Cards */}
        {isLoadingShops ? (
          <div className="px-4 py-10 text-center text-xs text-slate-500">
            {language === 'hi' ? 'दुकानें लोड हो रही हैं...' : 'Loading nearby shops...'}
          </div>
        ) : filteredShops.length === 0 ? (
          <div className="mx-4 bg-slate-50 border border-dashed border-slate-200 rounded-2xl p-6 text-center text-xs text-slate-500">
            {language === 'hi' ? 'इस श्रेणी में कोई दुकान नहीं मिली' : 'No shops found in this category'}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 px-4">
            {filteredShops.map((shop) => (
              <ShopCard
                key={shop.id}
                shop={shop}
                variant="customer"
                onClick={() => onSelectShop(shop)}
                distanceText={getShopDistance(shop)?.distanceText || shop.distanceText || '0.5 km'}
                language={language}
              />
            ))}
          </div>
        )}
      </div>

      {/* 6. "🔥 आज के ऑफर" (Today's Offers / Product Cards Grid) */}
      <div className="space-y-2 pt-2">
        <div className="px-4 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <div className="w-5 h-5 rounded-md bg-amber-100 flex items-center justify-center text-amber-700">
              <Flame className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
            </div>
            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              {language === 'hi' ? '🔥 आज के ऑफर' : "🔥 Today's Offers"}
            </h2>
          </div>
          <button
            type="button"
            onClick={() => onOpenSearch()}
            className="text-[11px] font-bold text-emerald-700 hover:text-emerald-800"
          >
            {language === 'hi' ? 'सभी देखें →' : 'View All →'}
          </button>
        </div>

        {/* Product Cards Horizontal Scroll */}
        <div className="flex gap-3 overflow-x-auto px-4 pb-2 no-scrollbar">
          {TODAYS_OFFERS.map((deal) => {
            const isAdded = justAddedItemIds[deal.product.id];
            const defaultOpt = deal.product.fractionalConfig.predefinedOptions?.[0];
            const portionText = defaultOpt ? defaultOpt.label : `1 ${deal.product.fractionalConfig.baseUnit}`;

            return (
              <div
                key={deal.product.id}
                className="w-44 shrink-0 bg-white border border-slate-200 rounded-2xl p-2.5 shadow-xs hover:border-emerald-300 transition-all flex flex-col justify-between"
              >
                <div>
                  {/* Image & Discount Badge */}
                  <div
                    onClick={() => {
                      const parentShop = shops.find((s) => s.id === deal.product.shopId) || shops[0];
                      if (parentShop && onOpenProductDetails) {
                        onOpenProductDetails(deal.product, parentShop);
                      }
                    }}
                    className="relative w-full aspect-square rounded-xl bg-slate-100 overflow-hidden border border-slate-100 cursor-pointer group"
                  >
                    <img
                      src={
                        deal.product.imageUrl && deal.product.imageUrl.trim() !== ''
                          ? deal.product.imageUrl
                          : 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=400&auto=format&fit=crop&q=80'
                      }
                      alt={deal.product.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute top-1.5 left-1.5 bg-emerald-600 text-white text-[9px] font-black px-1.5 py-0.5 rounded shadow-2xs">
                      {deal.discountBadge}
                    </div>
                  </div>

                  {/* Product Title & Shop */}
                  <div className="mt-2 space-y-0.5">
                    <h3
                      onClick={() => {
                        const parentShop = shops.find((s) => s.id === deal.product.shopId) || shops[0];
                        if (parentShop && onOpenProductDetails) {
                          onOpenProductDetails(deal.product, parentShop);
                        }
                      }}
                      className="text-xs font-bold text-slate-900 line-clamp-1 cursor-pointer hover:text-emerald-700"
                    >
                      {language === 'hi' && deal.product.nameHindi
                        ? deal.product.nameHindi
                        : deal.product.name}
                    </h3>
                    <p className="text-[10px] text-slate-500 truncate">{deal.shopName}</p>
                    <p className="text-[10px] text-emerald-700 font-medium">{portionText}</p>
                  </div>
                </div>

                {/* Price and Cart Add Button */}
                <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between">
                  <div>
                    <div className="text-xs font-extrabold text-slate-900">₹{deal.product.fractionalConfig.basePrice}</div>
                    <div className="text-[10px] text-slate-400 line-through">₹{deal.strikePrice}</div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleAddDealToCart(deal)}
                    className={`px-2.5 py-1.5 rounded-xl text-[11px] font-bold flex items-center gap-1 transition-all shadow-2xs ${
                      isAdded
                        ? 'bg-emerald-700 text-white'
                        : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-2xs'
                    }`}
                  >
                    {isAdded ? (
                      <>
                        <Check className="w-3 h-3" />
                        <span>{language === 'hi' ? 'जोड़ा गया' : 'Added'}</span>
                      </>
                    ) : (
                      <>
                        <Plus className="w-3 h-3" />
                        <span>{language === 'hi' ? 'कार्ट में डालें' : 'Add to Cart'}</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 7. "✨ लोकप्रिय व ट्रेंडिंग सामान" (Popular / Trending Products across Mandi) */}
      <div className="space-y-3 px-4 pt-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-emerald-600" />
            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              {language === 'hi' ? '✨ लोकप्रिय सामान' : '✨ Popular Items'}
            </h2>
          </div>
          <button
            type="button"
            onClick={() => onOpenSearch()}
            className="text-[11px] font-bold text-emerald-700 hover:text-emerald-800"
          >
            {language === 'hi' ? 'सभी देखें →' : 'View All →'}
          </button>
        </div>

        {/* 2-Column Grid of Popular Products */}
        <div className="grid grid-cols-2 gap-3">
          {POPULAR_TRENDING_ITEMS.map((item) => {
            const isAdded = justAddedItemIds[item.product.id];
            const defaultOpt = item.product.fractionalConfig.predefinedOptions?.[0];
            const portionText = defaultOpt ? defaultOpt.label : `1 ${item.product.fractionalConfig.baseUnit}`;

            return (
              <div
                key={item.product.id}
                className="bg-white border border-slate-200 rounded-2xl p-2.5 shadow-xs hover:border-emerald-300 transition-all flex flex-col justify-between"
              >
                <div>
                  {/* Image */}
                  <div
                    onClick={() => {
                      const parentShop = shops.find((s) => s.id === item.product.shopId) || shops[0];
                      if (parentShop && onOpenProductDetails) {
                        onOpenProductDetails(item.product, parentShop);
                      }
                    }}
                    className="relative w-full aspect-square rounded-xl bg-slate-100 overflow-hidden border border-slate-100 cursor-pointer group"
                  >
                    <img
                      src={
                        item.product.imageUrl && item.product.imageUrl.trim() !== ''
                          ? item.product.imageUrl
                          : 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=400&auto=format&fit=crop&q=80'
                      }
                      alt={item.product.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      referrerPolicy="no-referrer"
                    />
                  </div>

                  {/* Product Title & Shop */}
                  <div className="mt-2 space-y-0.5">
                    <h3
                      onClick={() => {
                        const parentShop = shops.find((s) => s.id === item.product.shopId) || shops[0];
                        if (parentShop && onOpenProductDetails) {
                          onOpenProductDetails(item.product, parentShop);
                        }
                      }}
                      className="text-xs font-bold text-slate-900 line-clamp-1 cursor-pointer hover:text-emerald-700"
                    >
                      {language === 'hi' && item.product.nameHindi ? item.product.nameHindi : item.product.name}
                    </h3>
                    <p className="text-[10px] text-slate-500 truncate">{item.shopName}</p>
                    <p className="text-[10px] text-emerald-700 font-medium">{portionText}</p>
                  </div>
                </div>

                {/* Price and Cart Add Button */}
                <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between">
                  <div>
                    <div className="text-xs font-extrabold text-slate-900">₹{item.product.fractionalConfig.basePrice}</div>
                    <div className="text-[10px] text-slate-400 line-through">₹{item.strikePrice}</div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleAddDealToCart(item)}
                    className={`px-2.5 py-1.5 rounded-xl text-[11px] font-bold flex items-center gap-1 transition-all shadow-2xs ${
                      isAdded
                        ? 'bg-emerald-700 text-white'
                        : 'bg-emerald-50 hover:bg-emerald-600 text-emerald-700 hover:text-white border border-emerald-300'
                    }`}
                  >
                    {isAdded ? (
                      <>
                        <Check className="w-3 h-3" />
                        <span>जोड़ा</span>
                      </>
                    ) : (
                      <>
                        <Plus className="w-3 h-3" />
                        <span>{language === 'hi' ? 'कार्ट में' : 'Add'}</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

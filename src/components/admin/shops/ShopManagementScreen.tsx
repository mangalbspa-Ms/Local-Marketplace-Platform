/**
 * Shop Directory & Verification / Approval Workflow
 * 
 * Review onboarding merchants, approve/reject/suspend shops, configure fulfillment channels (Delivery & Pickup),
 * set custom commission rates, and track shop metrics across local mandis.
 */

import React, { useState, useEffect } from 'react';
import { adminApi } from '../../../services/adminApi.ts';
import {
  Store,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Percent,
  Search,
  Filter,
  Phone,
  Mail,
  MapPin,
  Clock,
  ExternalLink,
  ShieldCheck,
  Ban,
  RotateCcw,
  X,
  IndianRupee,
  PlusCircle,
  Truck,
  ShoppingBag,
  Lock,
  Unlock,
  Check,
  Save,
  Star,
  Package,
  Compass,
  Layers,
} from 'lucide-react';
import { ShopSetupEditScreen } from './ShopSetupEditScreen.tsx';
import { ShopCard } from '../../shops/ShopCard.tsx';
import { ShopVerificationReviewTab } from './ShopVerificationReviewTab.tsx';

interface ShopManagementScreenProps {
  onNavigateToOnboarding?: () => void;
}

export const ShopManagementScreen: React.FC<ShopManagementScreenProps> = ({ onNavigateToOnboarding }) => {
  const [mainTab, setMainTab] = useState<'DIRECTORY' | 'VERIFICATION'>('DIRECTORY');
  const [shops, setShops] = useState<any[]>([]);
  const [markets, setMarkets] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedMarketId, setSelectedMarketId] = useState('ALL');

  // Dedicated Shop Setup & Catalog Screen State
  const [selectedShopForSetup, setSelectedShopForSetup] = useState<any | null>(null);

  // Custom Commission Modal
  const [commissionModalShop, setCommissionModalShop] = useState<any | null>(null);
  const [customCommissionRate, setCustomCommissionRate] = useState<number>(5);
  const [isUpdatingCommission, setIsUpdatingCommission] = useState(false);

  // Fulfillment Configuration Modal
  const [fulfillmentModalShop, setFulfillmentModalShop] = useState<any | null>(null);
  const [fulfillmentSettings, setFulfillmentSettings] = useState<{
    deliveryEnabled: boolean;
    pickupEnabled: boolean;
    deliveryFee: number;
    freeDeliveryThreshold: number;
    minOrderValueForDelivery: number;
    maxDeliveryRadiusKm: number;
    estimatedPreparationTimeMinutes: number;
    pickupInstructions: string;
    sellerCanManageFulfillment: boolean;
  }>({
    deliveryEnabled: true,
    pickupEnabled: true,
    deliveryFee: 25,
    freeDeliveryThreshold: 499,
    minOrderValueForDelivery: 0,
    maxDeliveryRadiusKm: 5.0,
    estimatedPreparationTimeMinutes: 20,
    pickupInstructions: '',
    sellerCanManageFulfillment: true,
  });
  const [isUpdatingFulfillment, setIsUpdatingFulfillment] = useState(false);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [shopsData, marketsData] = await Promise.all([
        adminApi.getShops({
          marketId: selectedMarketId !== 'ALL' ? selectedMarketId : undefined,
          status: statusFilter !== 'ALL' ? statusFilter : undefined,
        }),
        adminApi.getMarkets(),
      ]);
      setShops(shopsData);
      setMarkets(marketsData);
    } catch (err) {
      console.error('Failed to load shops', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [statusFilter, selectedMarketId]);

  const handleUpdateStatus = async (shopId: string, targetStatus: string) => {
    try {
      await adminApi.updateShopStatus(shopId, targetStatus);
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to update shop status');
    }
  };

  const handleOpenCommissionModal = (shop: any) => {
    setCommissionModalShop(shop);
    setCustomCommissionRate(shop.effectiveCommissionPercentage || 5);
  };

  const handleSaveCommission = async () => {
    if (!commissionModalShop) return;
    setIsUpdatingCommission(true);
    try {
      await adminApi.setShopCommission(commissionModalShop.id, customCommissionRate);
      await loadData();
      setCommissionModalShop(null);
    } catch (err: any) {
      alert(err.message || 'Failed to save commission');
    } finally {
      setIsUpdatingCommission(false);
    }
  };

  const handleOpenFulfillmentModal = (shop: any) => {
    setFulfillmentModalShop(shop);
    setFulfillmentSettings({
      deliveryEnabled: shop.fulfillment?.deliveryEnabled !== false,
      pickupEnabled: shop.fulfillment?.pickupEnabled !== false,
      deliveryFee: shop.fulfillment?.deliveryFee ?? 25,
      freeDeliveryThreshold: shop.fulfillment?.freeDeliveryThreshold ?? 499,
      minOrderValueForDelivery: shop.fulfillment?.minOrderValueForDelivery ?? 0,
      maxDeliveryRadiusKm: shop.fulfillment?.maxDeliveryRadiusKm ?? 5.0,
      estimatedPreparationTimeMinutes: shop.fulfillment?.estimatedPreparationTimeMinutes ?? 20,
      pickupInstructions: shop.fulfillment?.pickupInstructions || '',
      sellerCanManageFulfillment: shop.fulfillment?.sellerCanManageFulfillment !== false,
    });
  };

  const handleSaveFulfillment = async () => {
    if (!fulfillmentModalShop) return;
    setIsUpdatingFulfillment(true);
    try {
      await adminApi.updateShopFulfillment(fulfillmentModalShop.id, {
        ...fulfillmentSettings,
        deliveryFee: Number(fulfillmentSettings.deliveryFee),
        freeDeliveryThreshold: Number(fulfillmentSettings.freeDeliveryThreshold),
        minOrderValueForDelivery: Number(fulfillmentSettings.minOrderValueForDelivery),
        maxDeliveryRadiusKm: Number(fulfillmentSettings.maxDeliveryRadiusKm),
        estimatedPreparationTimeMinutes: Number(fulfillmentSettings.estimatedPreparationTimeMinutes),
      });
      await loadData();
      setFulfillmentModalShop(null);
    } catch (err: any) {
      alert(err.message || 'Failed to save fulfillment settings');
    } finally {
      setIsUpdatingFulfillment(false);
    }
  };

  const filtered = shops.filter((s) => {
    const q = (searchQuery || '').toLowerCase();
    const addrStr = typeof s?.address === 'string' ? s.address : (s?.address?.city || '');
    return (
      (s?.name || '').toLowerCase().includes(q) ||
      (s?.category || '').toLowerCase().includes(q) ||
      (s?.sellerName || '').toLowerCase().includes(q) ||
      (s?.marketName || '').toLowerCase().includes(q) ||
      (s?.phone || '').includes(searchQuery || '') ||
      addrStr.toLowerCase().includes(q)
    );
  });

  // If a shop is selected for comprehensive setup & catalog management, render the dedicated screen
  if (selectedShopForSetup) {
    return (
      <ShopSetupEditScreen
        shop={selectedShopForSetup}
        markets={markets}
        onBack={() => {
          setSelectedShopForSetup(null);
          loadData();
        }}
        onShopUpdated={(updated) => {
          setShops((prev) => prev.map((s) => (s.id === updated.id ? { ...s, ...updated } : s)));
          setSelectedShopForSetup((prev: any) => (prev ? { ...prev, ...updated } : null));
        }}
      />
    );
  }

  // Calculate high-level directory metrics
  const activeCount = shops.filter((s) => s.isActive && s.isVerifiedByAdmin).length;
  const pendingCount = shops.filter((s) => !s.isVerifiedByAdmin).length;
  const totalGrossSales = shops.reduce((sum, s) => sum + (s.grossSales || 0), 0);

  return (
    <div className="space-y-3.5">
      {/* Primary Navigation Tabs between Directory and Verification */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2.5 overflow-x-auto no-scrollbar">
        <button
          type="button"
          onClick={() => setMainTab('DIRECTORY')}
          className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition flex items-center gap-2 cursor-pointer shrink-0 ${
            mainTab === 'DIRECTORY'
              ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-900/40'
              : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <Store className="w-3.5 h-3.5" />
          <span>दुकान डायरेक्टरी (Shop Directory)</span>
          <span className="px-1.5 py-0.2 rounded-full bg-slate-950/80 text-slate-300 text-[10px] font-mono">
            {shops.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setMainTab('VERIFICATION')}
          className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition flex items-center gap-2 cursor-pointer shrink-0 ${
            mainTab === 'VERIFICATION'
              ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-900/40'
              : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>सत्यापन समीक्षा (Verifications)</span>
          {pendingCount > 0 && (
            <span className="px-1.5 py-0.2 rounded-full bg-amber-500 text-slate-950 text-[10px] font-black animate-pulse">
              {pendingCount}
            </span>
          )}
        </button>
      </div>

      {mainTab === 'VERIFICATION' ? (
        <ShopVerificationReviewTab
          onShopUpdated={(updated) => {
            setShops((prev) => prev.map((s) => (s.id === updated.id ? { ...s, ...updated } : s)));
          }}
          onOpenShopDetail={(shop) => setSelectedShopForSetup(shop)}
        />
      ) : (
        <>
          {/* Header Bar */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3.5 sm:p-4 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-indigo-500/15 border border-indigo-500/30 text-indigo-400 flex items-center justify-center shrink-0">
                <Store className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-base font-extrabold text-white flex items-center gap-2">
                  <span>दुकानदार / दुकानें (Shops & Merchant Directory)</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                    {filtered.length} / {shops.length}
                  </span>
                </h2>
                <p className="text-[11px] text-slate-400">
                  सभी दुकानों की प्रोफ़ाइल, स्थान, कैटलॉग, इन्वेंटरी, डिलीवरी नियम और कमीशन प्रबंधित करें
                </p>
              </div>
            </div>

            {/* Actions and Filters */}
            <div className="flex flex-wrap items-center gap-1.5">
              {onNavigateToOnboarding && (
                <button
                  type="button"
                  onClick={onNavigateToOnboarding}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-3 py-1.5 rounded-lg flex items-center gap-1.5 shadow-sm shadow-emerald-900/30 transition active:scale-95 shrink-0"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>+ नई दुकान (Onboard)</span>
                </button>
              )}

              {/* Status filter */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 outline-none focus:border-indigo-500 font-semibold"
              >
                <option value="ALL">सभी स्थितियां (All Status)</option>
                <option value="ACTIVE">सक्रिय (Active)</option>
                <option value="PENDING">सत्यापन पेंडिंग (Pending)</option>
                <option value="SUSPENDED">सस्पेंड (Suspended)</option>
                <option value="INACTIVE">बंद (Inactive)</option>
              </select>

              {/* Market filter */}
              <select
                value={selectedMarketId}
                onChange={(e) => setSelectedMarketId(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 outline-none focus:border-indigo-500 font-semibold max-w-[150px] truncate"
              >
                <option value="ALL">सभी मंडियां (All Markets)</option>
                {markets.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Directory Quick Metrics Banner */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 shadow-xs">
              <div className="text-[10px] font-bold text-slate-400 uppercase">कुल दुकानें (Total)</div>
              <div className="text-lg font-black text-white mt-0.5">{shops.length}</div>
            </div>
            <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 shadow-xs">
              <div className="text-[10px] font-bold text-emerald-400 uppercase">सक्रिय (Active Stores)</div>
              <div className="text-lg font-black text-emerald-400 mt-0.5">{activeCount}</div>
            </div>
            <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 shadow-xs">
              <div className="text-[10px] font-bold text-amber-400 uppercase">स्वीकृति पेंडिंग (Pending)</div>
              <div className="text-lg font-black text-amber-400 mt-0.5">{pendingCount}</div>
            </div>
            <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 shadow-xs">
              <div className="text-[10px] font-bold text-indigo-400 uppercase">कुल बिक्री (Platform GMV)</div>
              <div className="text-lg font-black text-indigo-300 mt-0.5">₹{totalGrossSales.toLocaleString('en-IN')}</div>
            </div>
          </div>

          {/* Search Bar */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-2.5">
            <div className="relative max-w-md">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="दुकान का नाम, दुकानदार, फोन नंबर या शहर से खोजें..."
                className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-lg px-3 py-2 pl-8 text-xs text-white placeholder-slate-500 outline-none transition"
              />
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5" />
            </div>
          </div>

          {/* Shops Grid */}
          {isLoading ? (
            <div className="p-8 text-center text-xs text-slate-400 font-bold bg-slate-900/60 border border-slate-800 rounded-xl">
              लोड हो रहा है...
            </div>
          ) : filtered.length === 0 ? (
            <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-8 text-center text-xs text-slate-400">
              कोई दुकान नहीं मिली। कृपया खोज शब्द या फ़िल्टर बदलें।
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {filtered.map((shop) => (
                <ShopCard
                  key={shop.id}
                  shop={shop}
                  variant="admin"
                  onClick={() => setSelectedShopForSetup(shop)}
                  onOpenSetup={() => setSelectedShopForSetup(shop)}
                  onOpenCommission={() => handleOpenCommissionModal(shop)}
                  onOpenFulfillment={() => handleOpenFulfillmentModal(shop)}
                  onToggleStatus={(target) => handleUpdateStatus(shop.id, target)}
                  language="hi"
                />
              ))}
            </div>
          )}
        </>
      )}

      {/* Fulfillment Governance Modal */}
      {fulfillmentModalShop && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg shadow-2xl p-6 relative max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4 sticky top-0 bg-slate-900 z-10">
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <Truck className="w-5 h-5 text-purple-400" />
                <span>Shop Fulfillment Governance</span>
              </h3>
              <button
                type="button"
                onClick={() => setFulfillmentModalShop(null)}
                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-xs font-bold flex items-center gap-1 transition"
              >
                <X className="w-3.5 h-3.5" />
                <span>Close</span>
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800">
                <div className="font-bold text-white text-sm">{fulfillmentModalShop.name}</div>
                <div className="text-slate-400 text-xs">
                  {fulfillmentModalShop.category} • {fulfillmentModalShop.marketName}
                </div>
              </div>

              {/* Admin Authority Lock Switch */}
              <div className={`p-4 rounded-2xl border transition-all ${
                fulfillmentSettings.sellerCanManageFulfillment
                  ? 'bg-emerald-950/20 border-emerald-500/40'
                  : 'bg-amber-950/20 border-amber-500/40'
              }`}>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-bold text-xs text-white flex items-center gap-1.5">
                      {fulfillmentSettings.sellerCanManageFulfillment ? (
                        <Unlock className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <Lock className="w-4 h-4 text-amber-400" />
                      )}
                      <span>Merchant Fulfillment Control Permission</span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      {fulfillmentSettings.sellerCanManageFulfillment
                        ? 'Merchant is permitted to toggle & adjust fulfillment options in Seller Hub.'
                        : 'LOCKED: Only Platform Admin can change fulfillment options for this shop.'}
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={fulfillmentSettings.sellerCanManageFulfillment}
                    onChange={(e) =>
                      setFulfillmentSettings((prev) => ({
                        ...prev,
                        sellerCanManageFulfillment: e.target.checked,
                      }))
                    }
                    className="w-5 h-5 accent-emerald-500 cursor-pointer rounded"
                  />
                </div>
              </div>

              {/* Channel Toggles */}
              <div className="grid grid-cols-2 gap-3">
                <div className={`p-3 rounded-2xl border ${
                  fulfillmentSettings.pickupEnabled
                    ? 'bg-blue-950/40 border-blue-500/50'
                    : 'bg-slate-950 border-slate-800 opacity-60'
                }`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <ShoppingBag className="w-4 h-4 text-blue-400" />
                      <span className="font-bold text-white text-xs">Store Pickup</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={fulfillmentSettings.pickupEnabled}
                      onChange={(e) =>
                        setFulfillmentSettings((prev) => ({ ...prev, pickupEnabled: e.target.checked }))
                      }
                      className="w-4 h-4 accent-emerald-500 cursor-pointer rounded"
                    />
                  </div>
                </div>

                <div className={`p-3 rounded-2xl border ${
                  fulfillmentSettings.deliveryEnabled
                    ? 'bg-purple-950/40 border-purple-500/50'
                    : 'bg-slate-950 border-slate-800 opacity-60'
                }`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Truck className="w-4 h-4 text-purple-400" />
                      <span className="font-bold text-white text-xs">Home Delivery</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={fulfillmentSettings.deliveryEnabled}
                      onChange={(e) =>
                        setFulfillmentSettings((prev) => ({ ...prev, deliveryEnabled: e.target.checked }))
                      }
                      className="w-4 h-4 accent-emerald-500 cursor-pointer rounded"
                    />
                  </div>
                </div>
              </div>

              {/* Delivery Parameters */}
              <div className="grid grid-cols-2 gap-3 p-3.5 rounded-2xl bg-slate-950 border border-slate-800">
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 mb-1">
                    Standard Delivery Fee (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={fulfillmentSettings.deliveryFee}
                    onChange={(e) =>
                      setFulfillmentSettings((prev) => ({ ...prev, deliveryFee: Number(e.target.value) }))
                    }
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white text-xs font-bold outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-400 mb-1">
                    Free Delivery Threshold (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={fulfillmentSettings.freeDeliveryThreshold}
                    onChange={(e) =>
                      setFulfillmentSettings((prev) => ({
                        ...prev,
                        freeDeliveryThreshold: Number(e.target.value),
                      }))
                    }
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white text-xs font-bold outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-400 mb-1">
                    Min Order For Delivery (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={fulfillmentSettings.minOrderValueForDelivery}
                    onChange={(e) =>
                      setFulfillmentSettings((prev) => ({
                        ...prev,
                        minOrderValueForDelivery: Number(e.target.value),
                      }))
                    }
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white text-xs font-bold outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-400 mb-1">
                    Max Delivery Radius (km)
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    min="1"
                    value={fulfillmentSettings.maxDeliveryRadiusKm}
                    onChange={(e) =>
                      setFulfillmentSettings((prev) => ({
                        ...prev,
                        maxDeliveryRadiusKm: Number(e.target.value),
                      }))
                    }
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white text-xs font-bold outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Prep time and pickup instructions */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 mb-1">
                    Prep Time (Minutes)
                  </label>
                  <input
                    type="number"
                    min="5"
                    step="5"
                    value={fulfillmentSettings.estimatedPreparationTimeMinutes}
                    onChange={(e) =>
                      setFulfillmentSettings((prev) => ({
                        ...prev,
                        estimatedPreparationTimeMinutes: Number(e.target.value),
                      }))
                    }
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white text-xs font-bold outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-400 mb-1">
                    Pickup Instructions
                  </label>
                  <input
                    type="text"
                    value={fulfillmentSettings.pickupInstructions}
                    onChange={(e) =>
                      setFulfillmentSettings((prev) => ({
                        ...prev,
                        pickupInstructions: e.target.value,
                      }))
                    }
                    placeholder="e.g. Counter 2"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white text-xs font-bold outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-800 sticky bottom-0 bg-slate-900">
                <button
                  type="button"
                  onClick={() => setFulfillmentModalShop(null)}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 text-slate-300 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isUpdatingFulfillment}
                  onClick={handleSaveFulfillment}
                  className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold flex items-center gap-1.5 shadow-lg shadow-purple-900/30"
                >
                  {isUpdatingFulfillment ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      <span>Save Fulfillment Settings</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Custom Commission Override Modal */}
      {commissionModalShop && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md shadow-2xl p-6 relative">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4 sticky top-0 bg-slate-900 z-10">
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <Percent className="w-4 h-4 text-indigo-400" />
                <span>Shop Commission Override</span>
              </h3>
              <button
                type="button"
                onClick={() => setCommissionModalShop(null)}
                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-xs font-bold flex items-center gap-1 transition"
              >
                <X className="w-3.5 h-3.5" />
                <span>Close</span>
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800">
                <div className="font-bold text-white text-sm">{commissionModalShop.name}</div>
                <div className="text-slate-400 text-xs">{commissionModalShop.category} • {commissionModalShop.marketName}</div>
              </div>

              <div>
                <label className="block text-slate-400 font-bold mb-1.5">
                  Custom Platform Commission Percentage (%)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    max="50"
                    step="0.1"
                    value={customCommissionRate}
                    onChange={(e) => setCustomCommissionRate(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white text-base font-black outline-none focus:border-indigo-500"
                  />
                  <span className="absolute right-4 top-3.5 text-slate-400 font-black">%</span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1.5">
                  Setting a custom rate overrides the global platform baseline (5.0%) for this specific merchant.
                </p>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setCommissionModalShop(null)}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 text-slate-300 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isUpdatingCommission}
                  onClick={handleSaveCommission}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold flex items-center gap-1.5 shadow-lg shadow-emerald-900/30"
                >
                  {isUpdatingCommission ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Save Commission</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

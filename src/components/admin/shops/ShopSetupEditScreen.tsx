/**
 * Shop Setup & Edit Screen (Complete Profile & Catalog Management)
 * 7 Dedicated Tabs: Profile, Location, Catalog, Inventory, Delivery & Pickup, Timings, Settings & Commission.
 */

import React, { useState, useEffect, useMemo } from 'react';
import { Shop, LocalMarket, ShopManagementMode } from '../../../types/market.ts';
import { Product } from '../../../types/product.ts';
import { adminApi } from '../../../services/adminApi.ts';
import {
  ArrowLeft,
  Store,
  User,
  MapPin,
  Package,
  Boxes,
  Truck,
  Clock,
  Settings,
  Percent,
  Plus,
  DownloadCloud,
  Search,
  Edit2,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Save,
  Phone,
  Mail,
  IndianRupee,
  RefreshCw,
  Eye,
  Crosshair,
  Sparkles,
} from 'lucide-react';
import { AddEditProductModal } from './modals/AddEditProductModal.tsx';
import { MasterCatalogBulkAddModal } from './modals/MasterCatalogBulkAddModal.tsx';

interface ShopSetupEditScreenProps {
  shop: Shop;
  markets: LocalMarket[];
  onBack: () => void;
  onShopUpdated: (updatedShop: Shop) => void;
}

export type ShopTabKey =
  | 'profile'
  | 'location'
  | 'catalog'
  | 'inventory'
  | 'delivery'
  | 'timings'
  | 'settings';

export const ShopSetupEditScreen: React.FC<ShopSetupEditScreenProps> = ({
  shop: initialShop,
  markets,
  onBack,
  onShopUpdated,
}) => {
  const [shop, setShop] = useState<Shop>(initialShop);
  const [activeTab, setActiveTab] = useState<ShopTabKey>('catalog'); // Default to catalog as requested

  // Catalog State
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);
  const [productSearch, setProductSearch] = useState('');
  const [productCategoryFilter, setProductCategoryFilter] = useState('ALL');

  // Modals
  const [isAddEditModalOpen, setIsAddEditModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isBulkAddModalOpen, setIsBulkAddModalOpen] = useState(false);

  // Form States for Profile
  const [shopName, setShopName] = useState(shop.name || '');
  const [sellerName, setSellerName] = useState((shop as any).sellerName || '');
  const [phone, setPhone] = useState(shop.phone || '');
  const [email, setEmail] = useState(shop.email || '');
  const [photoUrl, setPhotoUrl] = useState(shop.photoUrl || '');
  const [category, setCategory] = useState(shop.category || 'Grocery & Kirana');
  const [description, setDescription] = useState(shop.description || '');

  // Form States for Location
  const [street, setStreet] = useState(
    (shop as any).address?.street || (typeof shop.address === 'string' ? shop.address : '')
  );
  const [landmark, setLandmark] = useState((shop as any).address?.landmark || shop.landmark || '');
  const [city, setCity] = useState((shop as any).address?.city || '');
  const [stateName, setStateName] = useState((shop as any).address?.state || 'Uttar Pradesh');
  const [pincode, setPincode] = useState((shop as any).address?.pincode || '');
  const [marketId, setMarketId] = useState(shop.marketId || '');
  const [lat, setLat] = useState<number | ''>(shop.coordinates?.lat ?? 26.8467);
  const [lng, setLng] = useState<number | ''>(shop.coordinates?.lng ?? 80.9462);
  const [deliveryRadiusKm, setDeliveryRadiusKm] = useState<number | ''>(
    shop.fulfillment?.maxDeliveryRadiusKm ?? (shop.fulfillment as any)?.deliveryRadiusKm ?? 5
  );

  // Form States for Delivery & Pickup
  const [deliveryEnabled, setDeliveryEnabled] = useState(
    (shop.fulfillment as any)?.homeDeliveryEnabled ?? shop.fulfillment?.deliveryEnabled ?? true
  );
  const [pickupEnabled, setPickupEnabled] = useState(
    (shop.fulfillment as any)?.storePickupEnabled ?? shop.fulfillment?.pickupEnabled ?? true
  );
  const [deliveryFee, setDeliveryFee] = useState<number | ''>(
    (shop.fulfillment as any)?.baseDeliveryFee ?? shop.fulfillment?.deliveryFee ?? 20
  );
  const [freeDeliveryThreshold, setFreeDeliveryThreshold] = useState<number | ''>(
    shop.fulfillment?.freeDeliveryThreshold ?? 500
  );
  const [minOrderValue, setMinOrderValue] = useState<number | ''>(
    (shop.fulfillment as any)?.minimumOrderValue ?? shop.fulfillment?.minOrderValueForDelivery ?? 100
  );
  const [prepTimeMinutes, setPrepTimeMinutes] = useState<number | ''>(
    (shop.fulfillment as any)?.estimatedPrepTimeMinutes ?? shop.fulfillment?.estimatedPreparationTimeMinutes ?? 20
  );
  const [pickupInstructions, setPickupInstructions] = useState(
    shop.fulfillment?.pickupInstructions || ''
  );
  const [allowSellerFulfillment, setAllowSellerFulfillment] = useState(
    (shop.fulfillment as any)?.allowSellerToOverrideFulfillment ?? shop.fulfillment?.sellerCanManageFulfillment ?? true
  );

  // Form States for Timings
  const [openingTime, setOpeningTime] = useState(
    (shop as any).openingTime || shop.operatingHours?.openTime || '07:00 AM'
  );
  const [closingTime, setClosingTime] = useState(
    (shop as any).closingTime || shop.operatingHours?.closeTime || '10:00 PM'
  );
  const [weeklyOff, setWeeklyOff] = useState('None');
  const [isOpenNow, setIsOpenNow] = useState(shop.isOpen ?? true);

  // Form States for Settings & Commission
  const [customCommissionRate, setCustomCommissionRate] = useState<number | ''>(
    shop.financials?.customCommissionPercentage ?? (shop.financials as any)?.customCommissionRate ?? 5
  );
  const [managementMode, setManagementMode] = useState<ShopManagementMode>(
    shop.managementMode || 'HYBRID'
  );
  const [isActive, setIsActive] = useState(shop.isActive ?? true);
  const [isVerified, setIsVerified] = useState(shop.isVerifiedByAdmin ?? true);

  // Save State
  const [isSaving, setIsSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(
    null
  );

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ type, text });
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Load shop products
  const loadShopProducts = async () => {
    setIsLoadingProducts(true);
    try {
      const data = await adminApi.getProducts({ shopId: shop.id });
      setProducts(data || []);
    } catch (err) {
      console.error('Failed to load shop products:', err);
    } finally {
      setIsLoadingProducts(false);
    }
  };

  useEffect(() => {
    loadShopProducts();
  }, [shop.id]);

  // Existing product names set for bulk modal
  const existingProductNames = useMemo(() => {
    const s = new Set<string>();
    products.forEach((p) => {
      if (p.name) s.add(p.name.toLowerCase());
      if (p.nameHindi) s.add(p.nameHindi.toLowerCase());
    });
    return s;
  }, [products]);

  // Categories in this shop's catalog
  const shopCategories = useMemo(() => {
    const cats = new Set<string>();
    products.forEach((p) => {
      if (p.category) cats.add(p.category);
    });
    return Array.from(cats);
  }, [products]);

  // Filtered products
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      if (productCategoryFilter !== 'ALL' && p.category !== productCategoryFilter) {
        return false;
      }
      if (productSearch.trim()) {
        const q = productSearch.toLowerCase().trim();
        const mEng = (p.name || '').toLowerCase().includes(q);
        const mHin = (p.nameHindi || '').toLowerCase().includes(q);
        const mBrand = (p.brand || '').toLowerCase().includes(q);
        if (!mEng && !mHin && !mBrand) return false;
      }
      return true;
    });
  }, [products, productCategoryFilter, productSearch]);

  // Inventory stats
  const inventoryStats = useMemo(() => {
    const total = products.length;
    let inStock = 0;
    let lowStock = 0;
    let outOfStock = 0;

    products.forEach((p) => {
      const stock = p.currentStockInBaseUnits ?? 0;
      const threshold = p.lowStockThresholdInBaseUnits ?? 5;
      if (!p.isAvailable || stock <= 0) {
        outOfStock++;
      } else if (stock <= threshold) {
        lowStock++;
      } else {
        inStock++;
      }
    });

    return { total, inStock, lowStock, outOfStock };
  }, [products]);

  // Save Shop Profile
  const handleSaveProfile = async () => {
    setIsSaving(true);
    try {
      const updated = await adminApi.updateShopDetails(shop.id, {
        name: shopName.trim(),
        sellerName: sellerName.trim(),
        phone: phone.trim(),
        email: email.trim(),
        photoUrl: photoUrl.trim(),
        category: category.trim(),
        description: description.trim(),
      } as any);
      setShop(updated);
      onShopUpdated(updated);
      showToast('दुकान की प्रोफ़ाइल सफलतापूर्वक अपडेट हो गई!');
    } catch (err: any) {
      console.error(err);
      showToast('प्रोफ़ाइल अपडेट करने में विफल: ' + err.message, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // Save Location
  const handleSaveLocation = async () => {
    setIsSaving(true);
    try {
      const formattedAddress = [street.trim(), landmark.trim(), city.trim(), stateName.trim(), pincode.trim()]
        .filter(Boolean)
        .join(', ');

      const updated = await adminApi.updateShopDetails(shop.id, {
        address: formattedAddress,
        coordinates: {
          lat: Number(lat),
          lng: Number(lng),
        },
        marketId: marketId || undefined,
        fulfillment: {
          ...shop.fulfillment,
          maxDeliveryRadiusKm: Number(deliveryRadiusKm),
        },
        street: street.trim(),
        landmark: landmark.trim(),
        city: city.trim(),
        state: stateName.trim(),
        pincode: pincode.trim(),
      } as any);
      setShop(updated);
      onShopUpdated(updated);
      showToast('दुकान का स्थान व दायरा सफलतापूर्वक अपडेट हो गया!');
    } catch (err: any) {
      console.error(err);
      showToast('स्थान अपडेट करने में विफल: ' + err.message, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // Auto-detect GPS coordinates
  const handleDetectGPS = () => {
    if (!navigator.geolocation) {
      alert('ब्राउज़र में GPS उपलब्ध नहीं है');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLat(parseFloat(pos.coords.latitude.toFixed(6)));
        setLng(parseFloat(pos.coords.longitude.toFixed(6)));
        showToast('वर्तमान GPS अक्षांश व देशांतर प्राप्त हुए!');
      },
      (err) => {
        alert('GPS त्रुटि: ' + err.message);
      }
    );
  };

  // Save Delivery & Pickup
  const handleSaveFulfillment = async () => {
    setIsSaving(true);
    try {
      const updated = await adminApi.updateShopFulfillment(shop.id, {
        deliveryEnabled,
        pickupEnabled,
        deliveryFee: Number(deliveryFee),
        freeDeliveryThreshold: Number(freeDeliveryThreshold),
        minOrderValueForDelivery: Number(minOrderValue),
        estimatedPreparationTimeMinutes: Number(prepTimeMinutes),
        pickupInstructions: pickupInstructions.trim(),
        sellerCanManageFulfillment: allowSellerFulfillment,
        maxDeliveryRadiusKm: Number(deliveryRadiusKm),
        homeDeliveryEnabled: deliveryEnabled,
        storePickupEnabled: pickupEnabled,
        baseDeliveryFee: Number(deliveryFee),
        minimumOrderValue: Number(minOrderValue),
        estimatedPrepTimeMinutes: Number(prepTimeMinutes),
        allowSellerToOverrideFulfillment: allowSellerFulfillment,
      } as any);
      setShop(updated);
      onShopUpdated(updated);
      showToast('डिलीवरी व पिकअप नियम सफलतापूर्वक सुरक्षित हुए!');
    } catch (err: any) {
      console.error(err);
      showToast('डिलीवरी नियम अपडेट करने में विफल: ' + err.message, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // Save Timings
  const handleSaveTimings = async () => {
    setIsSaving(true);
    try {
      const updated = await adminApi.updateShopDetails(shop.id, {
        operatingHours: {
          openTime: openingTime,
          closeTime: closingTime,
        },
        isOpen: isOpenNow,
        openingTime,
        closingTime,
      } as any);
      setShop(updated);
      onShopUpdated(updated);
      showToast('दुकान का समय व स्थिति अपडेट हो गई!');
    } catch (err: any) {
      console.error(err);
      showToast('समय अपडेट करने में विफल: ' + err.message, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // Save Commission & Settings
  const handleSaveSettings = async () => {
    setIsSaving(true);
    try {
      // Update commission
      if (customCommissionRate !== '') {
        await adminApi.setShopCommission(shop.id, Number(customCommissionRate));
      }

      // Update active/verified status & management mode
      const updated = await adminApi.updateShopDetails(shop.id, {
        managementMode,
        isActive,
        isVerifiedByAdmin: isVerified,
      } as any);

      setShop(updated);
      onShopUpdated(updated);
      showToast('कमीशन व प्रशासनिक सेटिंग्स सुरक्षित हो गईं!');
    } catch (err: any) {
      console.error(err);
      showToast('सेटिंग्स अपडेट करने में विफल: ' + err.message, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // Quick Stock / Availability Update
  const handleQuickStockUpdate = async (productId: string, stockDelta: number) => {
    const target = products.find((p) => p.id === productId);
    if (!target) return;
    const current = target.currentStockInBaseUnits ?? 0;
    const newStock = Math.max(0, current + stockDelta);

    try {
      const updated = await adminApi.updateProduct(productId, {
        currentStockInBaseUnits: newStock,
        isAvailable: newStock > 0,
      });
      setProducts((prev) => prev.map((p) => (p.id === productId ? updated : p)));
      showToast(`स्टॉक अपडेट: ${updated.name} = ${newStock}`);
    } catch (err: any) {
      console.error(err);
      showToast('स्टॉक अपडेट विफल', 'error');
    }
  };

  const handleToggleProductAvailability = async (productId: string, current: boolean) => {
    try {
      const updated = await adminApi.updateProduct(productId, {
        isAvailable: !current,
      });
      setProducts((prev) => prev.map((p) => (p.id === productId ? updated : p)));
      showToast(`${updated.name} अब ${!current ? 'उपलब्ध (In Stock)' : 'आउट ऑफ स्टॉक'} है`);
    } catch (err: any) {
      console.error(err);
      showToast('उपलब्धता अपडेट विफल', 'error');
    }
  };

  const handleDeleteProduct = async (productId: string, name: string) => {
    if (!window.confirm(`क्या आप वाकई "${name}" को इस दुकान के कैटलॉग से हटाना चाहते हैं?`)) {
      return;
    }
    try {
      await adminApi.deleteProduct(productId);
      setProducts((prev) => prev.filter((p) => p.id !== productId));
      showToast(`"${name}" कैटलॉग से हटा दिया गया`);
    } catch (err: any) {
      console.error(err);
      showToast('हटाने में विफल: ' + err.message, 'error');
    }
  };

  return (
    <div className="space-y-5 pb-16">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-2.5 text-xs font-black animate-in fade-in slide-in-from-top-3 duration-200 ${
            toastMessage.type === 'success'
              ? 'bg-emerald-500 text-slate-950 shadow-emerald-500/30'
              : 'bg-rose-500 text-white shadow-rose-500/30'
          }`}
        >
          {toastMessage.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 shrink-0" />
          ) : (
            <XCircle className="w-4 h-4 shrink-0" />
          )}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Top Header Card */}
      <div className="p-4 sm:p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <button
              type="button"
              onClick={onBack}
              className="w-10 h-10 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition shrink-0 active:scale-95"
              title="वापस सभी दुकानें"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>

            <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/25 overflow-hidden shrink-0 flex items-center justify-center">
              {shop.photoUrl && shop.photoUrl.trim() !== '' ? (
                <img src={shop.photoUrl} alt={shop.name} className="w-full h-full object-cover" />
              ) : (
                <Store className="w-6 h-6 text-indigo-400" />
              )}
            </div>

            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-lg sm:text-xl font-black text-white">{shop.name}</h1>
                <span
                  className={`px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider ${
                    shop.isActive
                      ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-400'
                      : 'bg-rose-500/15 border border-rose-500/30 text-rose-400'
                  }`}
                >
                  {shop.isActive ? 'सक्रिय (Active)' : 'निष्क्रिय (Inactive)'}
                </span>
                <span
                  className={`px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider ${
                    shop.isVerifiedByAdmin
                      ? 'bg-indigo-500/15 border border-indigo-500/30 text-indigo-400'
                      : 'bg-amber-500/15 border border-amber-500/30 text-amber-400'
                  }`}
                >
                  {shop.isVerifiedByAdmin ? 'सत्यापित (Verified)' : 'सत्यापन पेंडिंग'}
                </span>
                <span className="px-2 py-0.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 text-[10px] font-bold">
                  {shop.managementMode || 'HYBRID'}
                </span>
              </div>

              <div className="flex items-center gap-3 text-xs text-slate-400 mt-1 flex-wrap">
                <span className="flex items-center gap-1">
                  <User className="w-3.5 h-3.5 text-slate-500" />
                  <span>दुकानदार: <strong className="text-slate-200">{shop.sellerName || 'अज्ञात'}</strong></span>
                </span>
                {shop.phone && (
                  <span className="flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5 text-slate-500" />
                    <span>{shop.phone}</span>
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-500" />
                  <span>{shop.address?.city || 'City'}, {shop.address?.pincode}</span>
                </span>
              </div>
            </div>
          </div>

          {/* Header Quick Actions */}
          <div className="flex items-center gap-2 self-end md:self-center">
            <button
              type="button"
              onClick={loadShopProducts}
              className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold flex items-center gap-1.5 transition"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoadingProducts ? 'animate-spin' : ''}`} />
              <span>रिफ्रेश कैटलॉग</span>
            </button>
          </div>
        </div>

        {/* 7 Tabs Bar */}
        <div className="flex items-center gap-1.5 overflow-x-auto pt-5 mt-5 border-t border-slate-800/80 scrollbar-none">
          {[
            { key: 'catalog', label: 'कैटलॉग (Catalog)', icon: Package, badge: products.length },
            { key: 'inventory', label: 'इन्वेंटरी (Inventory)', icon: Boxes, badge: inventoryStats.lowStock > 0 ? `${inventoryStats.lowStock} कम` : undefined, badgeColor: 'bg-amber-500 text-slate-950' },
            { key: 'profile', label: 'प्रोफ़ाइल (Profile)', icon: Store },
            { key: 'location', label: 'स्थान (Location)', icon: MapPin },
            { key: 'delivery', label: 'डिलीवरी व पिकअप', icon: Truck },
            { key: 'timings', label: 'समय (Timings)', icon: Clock },
            { key: 'settings', label: 'कमीशन व सेटिंग्स', icon: Settings },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActiveTab = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key as ShopTabKey)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 whitespace-nowrap transition shrink-0 ${
                  isActiveTab
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                    : 'bg-slate-950/60 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800/60'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{tab.label}</span>
                {tab.badge !== undefined && (
                  <span
                    className={`px-1.5 py-0.2 rounded-md text-[10px] font-black ${
                      tab.badgeColor || (isActiveTab ? 'bg-indigo-800 text-white' : 'bg-slate-800 text-slate-300')
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: CATALOG MANAGEMENT */}
      {/* ========================================================================= */}
      {activeTab === 'catalog' && (
        <div className="space-y-4">
          {/* Catalog Toolbar */}
          <div className="p-4 rounded-3xl bg-slate-900 border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex flex-col sm:flex-row items-center gap-2.5 w-full sm:w-auto">
              <div className="relative w-full sm:w-64">
                <input
                  type="text"
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  placeholder="इस दुकान के प्रोडक्ट्स खोजें..."
                  className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl px-3 py-2 pl-9 text-xs text-white placeholder-slate-500 outline-none"
                />
                <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
              </div>

              <select
                value={productCategoryFilter}
                onChange={(e) => setProductCategoryFilter(e.target.value)}
                className="w-full sm:w-48 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:border-indigo-500 outline-none font-bold"
              >
                <option value="ALL">सभी श्रेणियां ({products.length})</option>
                {shopCategories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <button
                type="button"
                id="open-master-catalog-bulk-btn"
                onClick={() => setIsBulkAddModalOpen(true)}
                className="px-3.5 py-2 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-300 hover:bg-amber-500/25 text-xs font-black flex items-center gap-1.5 transition active:scale-95 shadow-sm"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Master Catalogue से सामान जोड़ें</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setEditingProduct(null);
                  setIsAddEditModalOpen(true);
                }}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black flex items-center gap-1.5 shadow-lg shadow-indigo-600/30 transition active:scale-95"
              >
                <Plus className="w-4 h-4" />
                <span>+ नया प्रोडक्ट जोड़ें</span>
              </button>
            </div>
          </div>

          {/* Products List / Table */}
          {isLoadingProducts ? (
            <div className="p-12 text-center text-xs text-slate-400 font-bold bg-slate-900 border border-slate-800 rounded-3xl">
              कैटलॉग लोड हो रहा है...
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="p-12 text-center bg-slate-900 border border-slate-800 rounded-3xl space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/15 border border-indigo-500/25 flex items-center justify-center text-indigo-400 mx-auto">
                <Package className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-black text-white">इस दुकान में अभी कोई प्रोडक्ट नहीं है</h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                Master Catalogue से एक क्लिक में पूरा किराना सामान जोड़ें या नया प्रोडक्ट बनाएं।
              </p>
              <div className="flex items-center justify-center gap-2 pt-2">
                <button
                  type="button"
                  id="empty-state-master-catalog-btn"
                  onClick={() => setIsBulkAddModalOpen(true)}
                  className="px-4 py-2 rounded-xl bg-amber-500 text-slate-950 font-black text-xs shadow-lg shadow-amber-500/30 hover:bg-amber-400 transition"
                >
                  Master Catalogue से सामान जोड़ें
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {filteredProducts.map((p) => {
                const stock = p.currentStockInBaseUnits ?? 0;
                const threshold = p.lowStockThresholdInBaseUnits ?? 5;
                const isOutOfStock = !p.isAvailable || stock <= 0;
                const isLowStock = !isOutOfStock && stock <= threshold;

                return (
                  <div
                    key={p.id}
                    className="p-4 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition flex flex-col justify-between gap-3 group"
                  >
                    {/* Top row: Thumbnail + Details */}
                    <div className="flex items-start gap-3">
                      <div className="w-14 h-14 rounded-xl overflow-hidden bg-slate-950 border border-slate-800 shrink-0 relative">
                        <img
                          src={(p.imageUrl && p.imageUrl.trim() !== '') ? p.imageUrl : 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=500&auto=format&fit=crop&q=60'}
                          alt={p.name}
                          className="w-full h-full object-cover"
                        />
                        {isOutOfStock && (
                          <div className="absolute inset-0 bg-black/75 flex items-center justify-center text-[9px] font-black text-rose-400 uppercase">
                            Out of Stock
                          </div>
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h4 className="text-xs font-black text-white truncate">{p.name}</h4>
                          {p.brand && (
                            <span className="px-1.5 py-0.2 rounded bg-indigo-500/15 text-indigo-400 text-[9px] font-bold">
                              {p.brand}
                            </span>
                          )}
                        </div>
                        {p.nameHindi && (
                          <p className="text-[11px] text-slate-400 font-medium truncate mt-0.5">
                            {p.nameHindi}
                          </p>
                        )}
                        <p className="text-[10px] text-slate-500 mt-1">
                          {p.category} • Base Unit: <strong className="text-slate-300">{p.baseUnit || p.fractionalConfig?.baseUnit || 'unit'}</strong>
                        </p>
                      </div>
                    </div>

                    {/* Middle: Price, Stock & Availability */}
                    <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-center justify-between gap-2">
                      <div>
                        <div className="text-[10px] text-slate-400">मूल्य (Price)</div>
                        <div className="text-xs font-black text-emerald-400">
                          ₹{p.basePricePerUnit || p.fractionalConfig?.basePrice || 0}
                          <span className="text-[10px] text-slate-400">/{p.baseUnit || p.fractionalConfig?.baseUnit || 'unit'}</span>
                        </div>
                      </div>

                      <div>
                        <div className="text-[10px] text-slate-400">स्टॉक (Stock)</div>
                        <div className={`text-xs font-black ${isOutOfStock ? 'text-rose-400' : isLowStock ? 'text-amber-400' : 'text-slate-200'}`}>
                          {stock} {p.baseUnit || 'unit'}
                        </div>
                      </div>

                      <div className="flex flex-col items-end">
                        <div className="text-[10px] text-slate-400">उपलब्धता</div>
                        <button
                          type="button"
                          onClick={() => handleToggleProductAvailability(p.id, p.isAvailable !== false)}
                          className={`px-2 py-0.5 rounded text-[10px] font-black uppercase transition ${
                            p.isAvailable !== false
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                              : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                          }`}
                        >
                          {p.isAvailable !== false ? 'In Stock' : 'Out'}
                        </button>
                      </div>
                    </div>

                    {/* Bottom: Quick stock adjust (+10, -5) + Edit/Delete */}
                    <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-800/60">
                      <div className="flex items-center gap-1">
                        <span className="text-[10px] text-slate-500 font-bold">त्वरित स्टॉक:</span>
                        <button
                          type="button"
                          onClick={() => handleQuickStockUpdate(p.id, 10)}
                          className="px-1.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-black transition active:scale-95"
                          title="+10 स्टॉक बढ़ाएं"
                        >
                          +10
                        </button>
                        <button
                          type="button"
                          onClick={() => handleQuickStockUpdate(p.id, -5)}
                          className="px-1.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-black transition active:scale-95"
                          title="-5 स्टॉक घटाएं"
                        >
                          -5
                        </button>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingProduct(p);
                            setIsAddEditModalOpen(true);
                          }}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
                          title="संपादित करें (Edit)"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteProduct(p.id, p.name)}
                          className="p-1.5 rounded-lg bg-rose-950/40 hover:bg-rose-900/60 text-rose-400 transition"
                          title="हटाएं (Delete)"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: INVENTORY GOVERNANCE */}
      {/* ========================================================================= */}
      {activeTab === 'inventory' && (
        <div className="space-y-4">
          {/* KPI Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
              <div className="text-[11px] font-bold text-slate-400">कुल प्रोडक्ट्स (Total SKUs)</div>
              <div className="text-xl font-black text-white mt-1">{inventoryStats.total}</div>
            </div>
            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
              <div className="text-[11px] font-bold text-emerald-400">इन स्टॉक (In Stock)</div>
              <div className="text-xl font-black text-emerald-400 mt-1">{inventoryStats.inStock}</div>
            </div>
            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
              <div className="text-[11px] font-bold text-amber-400">कम स्टॉक (Low Stock ≤ 5)</div>
              <div className="text-xl font-black text-amber-400 mt-1">{inventoryStats.lowStock}</div>
            </div>
            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
              <div className="text-[11px] font-bold text-rose-400">आउट ऑफ स्टॉक (Out of Stock)</div>
              <div className="text-xl font-black text-rose-400 mt-1">{inventoryStats.outOfStock}</div>
            </div>
          </div>

          {/* Quick Restock List */}
          <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-black text-white flex items-center gap-2">
                  <Boxes className="w-4 h-4 text-indigo-400" />
                  <span>त्वरित स्टॉक रीस्टॉक (Quick Batch Restock)</span>
                </h3>
                <p className="text-xs text-slate-400">
                  कम स्टॉक या आउट ऑफ स्टॉक प्रोडक्ट्स को 1-क्लिक में रीस्टॉक करें
                </p>
              </div>
            </div>

            <div className="divide-y divide-slate-800/60 overflow-hidden">
              {products
                .filter((p) => !p.isAvailable || (p.currentStockInBaseUnits ?? 0) <= 10)
                .map((p) => {
                  const stock = p.currentStockInBaseUnits ?? 0;
                  return (
                    <div key={p.id} className="py-3 flex items-center justify-between gap-3 flex-wrap">
                      <div>
                        <div className="text-xs font-bold text-white">{p.name} ({p.nameHindi || ''})</div>
                        <div className="text-[11px] text-slate-400">
                          वर्तमान: <strong className={stock <= 0 ? 'text-rose-400' : 'text-amber-400'}>{stock} {p.baseUnit}</strong> • मूल्य: ₹{p.basePricePerUnit}
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <span className="text-xs text-slate-500 font-bold">स्टॉक जोड़ें:</span>
                        {[10, 25, 50, 100].map((delta) => (
                          <button
                            key={delta}
                            type="button"
                            onClick={() => handleQuickStockUpdate(p.id, delta)}
                            className="px-2.5 py-1 rounded-xl bg-slate-800 hover:bg-indigo-600 text-slate-200 hover:text-white text-xs font-black transition active:scale-95"
                          >
                            +{delta}
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })}
              {products.filter((p) => !p.isAvailable || (p.currentStockInBaseUnits ?? 0) <= 10).length === 0 && (
                <div className="py-6 text-center text-xs text-emerald-400 font-bold">
                  ✓ सभी प्रोडक्ट्स में पर्याप्त स्टॉक उपलब्ध है!
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: SHOP PROFILE */}
      {/* ========================================================================= */}
      {activeTab === 'profile' && (
        <div className="p-5 sm:p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-5">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div>
              <h3 className="text-sm font-black text-white">दुकानदार व दुकान प्रोफ़ाइल (Shop & Seller Profile)</h3>
              <p className="text-xs text-slate-400">बुनियादी विवरण, संपर्क नंबर, फोटो और श्रेणी</p>
            </div>
            <button
              type="button"
              onClick={handleSaveProfile}
              disabled={isSaving}
              className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black flex items-center gap-1.5 shadow-lg shadow-indigo-600/30 transition disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{isSaving ? 'सेव हो रहा है...' : 'प्रोफ़ाइल सेव करें'}</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                दुकान का नाम (Shop Name) <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                value={shopName}
                onChange={(e) => setShopName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:border-indigo-500 outline-none font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                दुकानदार का नाम (Seller Full Name) <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                value={sellerName}
                onChange={(e) => setSellerName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:border-indigo-500 outline-none font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                फोन नंबर (Phone Number) <span className="text-rose-400">*</span>
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:border-indigo-500 outline-none font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                ईमेल आईडी (Email)
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:border-indigo-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                दुकान की श्रेणी (Category)
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:border-indigo-500 outline-none font-bold"
              >
                <option value="Grocery & Kirana">किराना व जनरल स्टोर (Grocery & Kirana)</option>
                <option value="Fruits & Vegetables">फल व सब्ज़ियां (Fruits & Veggies)</option>
                <option value="Dairy & Bakery">डेयरी व बेकरी (Dairy & Bakery)</option>
                <option value="Spices & Masala">मसाला भंडार (Spices & Masala)</option>
                <option value="Sweets & Snacks">मिठाई व नमकीन (Sweets & Snacks)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                दुकान का फोटो / Logo URL
              </label>
              <input
                type="url"
                value={photoUrl}
                onChange={(e) => setPhotoUrl(e.target.value)}
                placeholder="https://images.unsplash.com/..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:border-indigo-500 outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5">
              दुकान का विवरण (Description / Tagline)
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="ताज़ा किराना सामान, उचित मूल्य और तुरंत डिलीवरी की सुविधा..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white focus:border-indigo-500 outline-none resize-none"
            />
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: LOCATION & TERRITORY */}
      {/* ========================================================================= */}
      {activeTab === 'location' && (
        <div className="p-5 sm:p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-5">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div>
              <h3 className="text-sm font-black text-white">दुकान का पता व डिलीवरी दायरा (Location & Territory)</h3>
              <p className="text-xs text-slate-400">सटीक पता, संबद्ध मंडी, GPS निर्देशांक और डिलीवरी रेडियस</p>
            </div>
            <button
              type="button"
              onClick={handleSaveLocation}
              disabled={isSaving}
              className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black flex items-center gap-1.5 shadow-lg shadow-indigo-600/30 transition disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{isSaving ? 'सेव हो रहा है...' : 'स्थान सुरक्षित करें'}</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                गली / दुकान का पता (Street Address) <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                value={street}
                onChange={(e) => setStreet(e.target.value)}
                placeholder="Shop No. 4, Main Market Road"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:border-indigo-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                नज़दीकी लैंडमार्क (Landmark)
              </label>
              <input
                type="text"
                value={landmark}
                onChange={(e) => setLandmark(e.target.value)}
                placeholder="Near Shiv Mandir"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:border-indigo-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                शहर (City) <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Lucknow"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:border-indigo-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                पिनकोड (Pincode) <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                value={pincode}
                onChange={(e) => setPincode(e.target.value)}
                placeholder="226001"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:border-indigo-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                संबद्ध स्थानीय मंडी / बाज़ार (Associated Local Market)
              </label>
              <select
                value={marketId}
                onChange={(e) => setMarketId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:border-indigo-500 outline-none font-bold"
              >
                <option value="">-- मंडी चुनें --</option>
                {markets.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} ({m.city})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                अधिकतम डिलीवरी दायरा (Max Delivery Radius in KM)
              </label>
              <input
                type="number"
                min="0.5"
                step="0.5"
                value={deliveryRadiusKm}
                onChange={(e) => setDeliveryRadiusKm(e.target.value === '' ? '' : Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:border-indigo-500 outline-none font-bold"
              />
            </div>
          </div>

          {/* Coordinates */}
          <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80 space-y-3">
            <div className="flex items-center justify-between">
              <div className="text-xs font-bold text-white flex items-center gap-2">
                <Crosshair className="w-4 h-4 text-indigo-400" />
                <span>GPS निर्देशांक (Latitude & Longitude)</span>
              </div>
              <button
                type="button"
                onClick={handleDetectGPS}
                className="px-3 py-1 rounded-xl bg-indigo-500/15 border border-indigo-500/30 text-indigo-400 hover:bg-indigo-500/25 text-xs font-bold transition flex items-center gap-1.5"
              >
                <Crosshair className="w-3.5 h-3.5" />
                <span>वर्तमान लोकेशन प्राप्त करें</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-400 mb-1">अक्षांश (Latitude)</label>
                <input
                  type="number"
                  step="any"
                  value={lat}
                  onChange={(e) => setLat(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:border-indigo-500 outline-none font-mono font-bold"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-400 mb-1">देशांतर (Longitude)</label>
                <input
                  type="number"
                  step="any"
                  value={lng}
                  onChange={(e) => setLng(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:border-indigo-500 outline-none font-mono font-bold"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 5: DELIVERY & PICKUP */}
      {/* ========================================================================= */}
      {activeTab === 'delivery' && (
        <div className="p-5 sm:p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-5">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div>
              <h3 className="text-sm font-black text-white">डिलीवरी व स्टोर पिकअप प्रबंधन (Fulfillment)</h3>
              <p className="text-xs text-slate-400">होम डिलीवरी चार्ज, मुफ़्त डिलीवरी लिमिट, मिनिमम ऑर्डर व निर्देश</p>
            </div>
            <button
              type="button"
              onClick={handleSaveFulfillment}
              disabled={isSaving}
              className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black flex items-center gap-1.5 shadow-lg shadow-indigo-600/30 transition disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{isSaving ? 'सेव हो रहा है...' : 'डिलीवरी नियम सेव करें'}</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Toggles */}
            <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 flex items-center justify-between">
              <div>
                <div className="text-xs font-black text-white">होम डिलीवरी (Home Delivery)</div>
                <div className="text-[11px] text-slate-400">ग्राहकों के घर सामान पहुंचाना चालू रखें</div>
              </div>
              <button
                type="button"
                onClick={() => setDeliveryEnabled(!deliveryEnabled)}
                className={`w-12 h-6 rounded-full transition p-0.5 flex items-center ${
                  deliveryEnabled ? 'bg-emerald-600 justify-end' : 'bg-slate-700 justify-start'
                }`}
              >
                <span className="w-5 h-5 rounded-full bg-white shadow-md block" />
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 flex items-center justify-between">
              <div>
                <div className="text-xs font-black text-white">दुकान से पिकअप (Store Pickup)</div>
                <div className="text-[11px] text-slate-400">ग्राहक दुकान पर आकर सामान ले सकते हैं</div>
              </div>
              <button
                type="button"
                onClick={() => setPickupEnabled(!pickupEnabled)}
                className={`w-12 h-6 rounded-full transition p-0.5 flex items-center ${
                  pickupEnabled ? 'bg-indigo-600 justify-end' : 'bg-slate-700 justify-start'
                }`}
              >
                <span className="w-5 h-5 rounded-full bg-white shadow-md block" />
              </button>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                डिलीवरी शुल्क (Base Delivery Fee in ₹)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-xs text-slate-500 font-bold">₹</span>
                <input
                  type="number"
                  min="0"
                  value={deliveryFee}
                  onChange={(e) => setDeliveryFee(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-7 pr-3 py-2 text-xs text-white focus:border-indigo-500 outline-none font-bold"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                मुफ़्त डिलीवरी सीमा (Free Delivery Above ₹)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-xs text-slate-500 font-bold">₹</span>
                <input
                  type="number"
                  min="0"
                  value={freeDeliveryThreshold}
                  onChange={(e) => setFreeDeliveryThreshold(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-7 pr-3 py-2 text-xs text-white focus:border-indigo-500 outline-none font-bold"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                न्यूनतम ऑर्डर मूल्य (Minimum Order Value in ₹)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-xs text-slate-500 font-bold">₹</span>
                <input
                  type="number"
                  min="0"
                  value={minOrderValue}
                  onChange={(e) => setMinOrderValue(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-7 pr-3 py-2 text-xs text-white focus:border-indigo-500 outline-none font-bold"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                तैयारी समय (Estimated Prep Time in Minutes)
              </label>
              <input
                type="number"
                min="5"
                value={prepTimeMinutes}
                onChange={(e) => setPrepTimeMinutes(e.target.value === '' ? '' : Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:border-indigo-500 outline-none font-bold"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5">
              पिकअप निर्देश (Pickup Counter / Instructions)
            </label>
            <input
              type="text"
              value={pickupInstructions}
              onChange={(e) => setPickupInstructions(e.target.value)}
              placeholder="e.g. काउंटर नंबर 1 पर ऑर्डर नंबर बताएं"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:border-indigo-500 outline-none"
            />
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 6: TIMINGS */}
      {/* ========================================================================= */}
      {activeTab === 'timings' && (
        <div className="p-5 sm:p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-5">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div>
              <h3 className="text-sm font-black text-white">दुकान खुलने व बंद होने का समय (Store Timings)</h3>
              <p className="text-xs text-slate-400">खुलने का समय, बंद होने का समय व साप्ताहिक अवकाश</p>
            </div>
            <button
              type="button"
              onClick={handleSaveTimings}
              disabled={isSaving}
              className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black flex items-center gap-1.5 shadow-lg shadow-indigo-600/30 transition disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{isSaving ? 'सेव हो रहा है...' : 'समय सुरक्षित करें'}</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                खुलने का समय (Opening Time)
              </label>
              <input
                type="text"
                value={openingTime}
                onChange={(e) => setOpeningTime(e.target.value)}
                placeholder="07:00 AM"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:border-indigo-500 outline-none font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                बंद होने का समय (Closing Time)
              </label>
              <input
                type="text"
                value={closingTime}
                onChange={(e) => setClosingTime(e.target.value)}
                placeholder="10:00 PM"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:border-indigo-500 outline-none font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                साप्ताहिक अवकाश (Weekly Off Day)
              </label>
              <select
                value={weeklyOff}
                onChange={(e) => setWeeklyOff(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:border-indigo-500 outline-none font-bold"
              >
                <option value="None">कोई छुट्टी नहीं (खुली रहती है)</option>
                <option value="Sunday">रविवार (Sunday)</option>
                <option value="Monday">सोमवार (Monday)</option>
                <option value="Tuesday">मंगलवार (Tuesday)</option>
              </select>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 flex items-center justify-between">
              <div>
                <div className="text-xs font-black text-white">दुकान वर्तमान स्थिति (Store Open Now)</div>
                <div className="text-[11px] text-slate-400">क्या दुकान अभी ग्राहकों के लिए खुली है?</div>
              </div>
              <button
                type="button"
                onClick={() => setIsOpenNow(!isOpenNow)}
                className={`w-12 h-6 rounded-full transition p-0.5 flex items-center ${
                  isOpenNow ? 'bg-emerald-600 justify-end' : 'bg-slate-700 justify-start'
                }`}
              >
                <span className="w-5 h-5 rounded-full bg-white shadow-md block" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 7: SETTINGS & COMMISSION */}
      {/* ========================================================================= */}
      {activeTab === 'settings' && (
        <div className="p-5 sm:p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-5">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div>
              <h3 className="text-sm font-black text-white">कमीशन व प्रशासनिक सेटिंग्स (Commission & Governance)</h3>
              <p className="text-xs text-slate-400">प्लेटफ़ॉर्म कमीशन दर, कैटलॉग मैनेजमेंट मोड व दुकान स्टेटस</p>
            </div>
            <button
              type="button"
              onClick={handleSaveSettings}
              disabled={isSaving}
              className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black flex items-center gap-1.5 shadow-lg shadow-indigo-600/30 transition disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{isSaving ? 'सेव हो रहा है...' : 'सेटिंग्स सुरक्षित करें'}</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                कमीशन दर (Custom Commission % for this Shop)
              </label>
              <div className="relative">
                <span className="absolute right-3 top-2 text-xs text-slate-500 font-bold">%</span>
                <input
                  type="number"
                  min="0"
                  max="50"
                  step="0.5"
                  value={customCommissionRate}
                  onChange={(e) => setCustomCommissionRate(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:border-indigo-500 outline-none font-bold"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                कैटलॉग मैनेजमेंट मोड (Management Mode)
              </label>
              <select
                value={managementMode}
                onChange={(e) => setManagementMode(e.target.value as ShopManagementMode)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:border-indigo-500 outline-none font-bold"
              >
                <option value="ADMIN_MANAGED">
                  ADMIN_MANAGED (एडमिन द्वारा पूर्ण प्रबंधित)
                </option>
                <option value="SELLER_MANAGED">
                  SELLER_MANAGED (दुकानदार स्वयं प्रबंधित)
                </option>
                <option value="HYBRID">
                  HYBRID (हाइब्रिड — दोनों मिलकर प्रबंधित करते हैं)
                </option>
              </select>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 flex items-center justify-between">
              <div>
                <div className="text-xs font-black text-white">दुकान सक्रियता (Shop Active Status)</div>
                <div className="text-[11px] text-slate-400">बाज़ार में ग्राहकों को दुकान दृश्यमान रखें</div>
              </div>
              <button
                type="button"
                onClick={() => setIsActive(!isActive)}
                className={`w-12 h-6 rounded-full transition p-0.5 flex items-center ${
                  isActive ? 'bg-emerald-600 justify-end' : 'bg-slate-700 justify-start'
                }`}
              >
                <span className="w-5 h-5 rounded-full bg-white shadow-md block" />
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 flex items-center justify-between">
              <div>
                <div className="text-xs font-black text-white">एडमिन सत्यापन (Admin Verified)</div>
                <div className="text-[11px] text-slate-400">दुकानदार के दस्तावेज़ व दुकान अनुमोदित</div>
              </div>
              <button
                type="button"
                onClick={() => setIsVerified(!isVerified)}
                className={`w-12 h-6 rounded-full transition p-0.5 flex items-center ${
                  isVerified ? 'bg-indigo-600 justify-end' : 'bg-slate-700 justify-start'
                }`}
              >
                <span className="w-5 h-5 rounded-full bg-white shadow-md block" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Product Add / Edit Modal */}
      <AddEditProductModal
        isOpen={isAddEditModalOpen}
        onClose={() => {
          setIsAddEditModalOpen(false);
          setEditingProduct(null);
        }}
        shopId={shop.id}
        shopName={shop.name}
        productToEdit={editingProduct}
        onProductSaved={(saved) => {
          setProducts((prev) => {
            const exists = prev.some((p) => p.id === saved.id);
            if (exists) {
              return prev.map((p) => (p.id === saved.id ? saved : p));
            }
            return [saved, ...prev];
          });
          showToast(`"${saved.name}" सफलतापूर्वक सुरक्षित हुआ!`);
        }}
      />

      {/* Master Catalog Bulk Add Modal */}
      <MasterCatalogBulkAddModal
        isOpen={isBulkAddModalOpen}
        onClose={() => setIsBulkAddModalOpen(false)}
        shopId={shop.id}
        shopName={shop.name}
        existingProductNames={existingProductNames}
        existingProducts={products}
        onBulkAdded={(_count) => {
          loadShopProducts();
          showToast(`कैटलॉग में नए प्रोडक्ट्स सफलतापूर्वक जुड़ गए!`);
        }}
      />
    </div>
  );
};

/**
 * Shop Setup & Edit Screen (Complete Profile & Catalog Management)
 * 7 Dedicated Tabs: Profile, Location, Catalog, Inventory, Delivery & Pickup, Timings, Settings & Commission.
 */

import React, { useState, useEffect, useMemo, useRef } from 'react';
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
  Camera,
  Image as ImageIcon,
  ShieldCheck,
  Building,
  Navigation,
  X,
  Check,
} from 'lucide-react';
import { motion } from 'motion/react';
import { AddEditProductModal } from './modals/AddEditProductModal.tsx';
import { MasterCatalogBulkAddModal } from './modals/MasterCatalogBulkAddModal.tsx';
import { AdminGoogleMapLocationPickerModal } from './modals/AdminGoogleMapLocationPickerModal.tsx';
import { PhotoDisplayControl } from '../../common/PhotoDisplayControl.tsx';
import { PhotoManagerModal } from '../../common/PhotoManagerModal.tsx';
import { PhotoApiService } from '../../../services/photoApi.ts';
import { requestFreshDeviceLocation } from '../../../utils/deviceGeolocation.ts';

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
  const [photoModalTarget, setPhotoModalTarget] = useState<'profile' | 'cover' | null>(null);
  const [isEditProfileModalOpen, setIsEditProfileModalOpen] = useState(false);
  const [profilePopKey, setProfilePopKey] = useState(0);
  const [coverPopKey, setCoverPopKey] = useState(0);

  // Direct file picker refs for Android gallery
  const profileFileInputRef = useRef<HTMLInputElement>(null);
  const coverFileInputRef = useRef<HTMLInputElement>(null);

  // Form States for Profile
  const [shopName, setShopName] = useState(shop.name || '');
  const [sellerName, setSellerName] = useState((shop as any).sellerName || '');
  const [phone, setPhone] = useState(shop.phone || '');
  const [email, setEmail] = useState(shop.email || '');
  const [photoUrl, setPhotoUrl] = useState(shop.profilePhotoUrl || shop.photoUrl || '');
  const [coverPhotoUrl, setCoverPhotoUrl] = useState(shop.coverPhotoUrl || (shop as any).bannerUrl || '');
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
  const [isMapModalOpen, setIsMapModalOpen] = useState(false);
  const [mapLocationSource, setMapLocationSource] = useState<'google_map' | 'device_gps' | null>(null);
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

  // Product Delete Modal State
  const [productToDelete, setProductToDelete] = useState<{ id: string; name: string } | null>(null);
  const [isDeletingProduct, setIsDeletingProduct] = useState(false);

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

  // Handle Direct Profile / Cover Photo Updates with Pop Animation & Gallery
  const handlePhotoUpdate = async (
    type: 'profile' | 'cover',
    result: { action: 'set' | 'remove'; url?: string; imageData?: string }
  ) => {
    try {
      const updated = await PhotoApiService.manageShopPhoto(
        shop.id,
        {
          type,
          action: result.action,
          url: result.url,
          imageData: result.imageData,
        },
        'admin'
      );
      setShop(updated);
      if (type === 'profile') {
        setPhotoUrl(updated.profilePhotoUrl || updated.photoUrl || '');
        setProfilePopKey((k) => k + 1);
      }
      if (type === 'cover') {
        setCoverPhotoUrl(updated.coverPhotoUrl || (updated as any).bannerUrl || '');
        setCoverPopKey((k) => k + 1);
      }
      onShopUpdated(updated);
      showToast(
        `${type === 'profile' ? 'दुकान प्रोफ़ाइल फोटो' : 'दुकान कवर फोटो'} सफलतापूर्वक ${
          result.action === 'remove' ? 'हटा दी गई' : 'अपडेट हो गई'
        }!`
      );
    } catch (err: any) {
      showToast('फोटो अपडेट करने में विफल: ' + err.message, 'error');
      throw err;
    }
  };

  // Direct Phone Gallery file selection & instant persistent save
  const handleDirectGalleryUpload = async (
    type: 'profile' | 'cover',
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showToast('कृपया केवल इमेज (JPG, PNG, WEBP) फ़ाइल चुनें', 'error');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      showToast('फ़ाइल का आकार 5MB से कम होना चाहिए', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = async (uploadEvent) => {
      const dataUrl = uploadEvent.target?.result as string;
      if (!dataUrl) return;

      // Optimistic preview
      if (type === 'profile') {
        setPhotoUrl(dataUrl);
        setProfilePopKey((k) => k + 1);
      } else {
        setCoverPhotoUrl(dataUrl);
        setCoverPopKey((k) => k + 1);
      }

      showToast(`${type === 'profile' ? 'प्रोफ़ाइल' : 'कवर'} फोटो अपलोड व सेव हो रही है...`);

      try {
        await handlePhotoUpdate(type, { action: 'set', imageData: dataUrl });
      } catch (err) {
        console.error(err);
      }
    };
    reader.readAsDataURL(file);
    // Reset file input so selecting same file again fires event
    e.target.value = '';
  };

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
        profilePhotoUrl: photoUrl.trim(),
        coverPhotoUrl: coverPhotoUrl.trim(),
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

  // Save Shop Profile from Design #5 Modal
  const handleSaveProfileModal = async () => {
    setIsSaving(true);
    try {
      const formattedAddress = [street.trim(), landmark.trim(), city.trim(), stateName.trim(), pincode.trim()]
        .filter(Boolean)
        .join(', ');

      const updated = await adminApi.updateShopDetails(shop.id, {
        name: shopName.trim(),
        sellerName: sellerName.trim(),
        phone: phone.trim(),
        email: email.trim(),
        photoUrl: photoUrl.trim(),
        profilePhotoUrl: photoUrl.trim(),
        coverPhotoUrl: coverPhotoUrl.trim(),
        category: category.trim(),
        description: description.trim(),
        address: formattedAddress,
        isActive,
        isVerifiedByAdmin: isVerified,
        operatingHours: {
          ...shop.operatingHours,
          openTime: openingTime,
          closeTime: closingTime,
        },
      } as any);

      setShop(updated);
      onShopUpdated(updated);
      setIsEditProfileModalOpen(false);
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

  // Auto-detect GPS coordinates with fresh high-accuracy device GPS
  const handleDetectGPS = async () => {
    try {
      showToast('सटीक GPS लोकेशन खोजी जा रही है...');
      const res = await requestFreshDeviceLocation();
      const freshLat = parseFloat(res.lat.toFixed(6));
      const freshLng = parseFloat(res.lng.toFixed(6));
      setLat(freshLat);
      setLng(freshLng);
      setMapLocationSource('device_gps');
      showToast(`वर्तमान GPS प्राप्त हुआ! सटीकता: ±${Math.round(res.accuracy)}m (${res.source})`);
    } catch (err: any) {
      alert('GPS त्रुटि: ' + (err?.message || 'लोकेशन प्राप्त नहीं हो सकी'));
    }
  };

  // Confirm and persist location chosen from Google Map
  const handleConfirmMapLocation = async (coords: { lat: number; lng: number }, formattedAddress?: string) => {
    setLat(coords.lat);
    setLng(coords.lng);
    setMapLocationSource('google_map');

    try {
      const formattedAddr = [street.trim(), landmark.trim(), city.trim(), stateName.trim(), pincode.trim()]
        .filter(Boolean)
        .join(', ') || formattedAddress;

      const updated = await adminApi.updateShopDetails(shop.id, {
        coordinates: {
          lat: coords.lat,
          lng: coords.lng,
        },
        address: formattedAddr || shop.address,
        fulfillment: {
          ...shop.fulfillment,
          maxDeliveryRadiusKm: Number(deliveryRadiusKm),
        },
      } as any);

      setShop(updated);
      onShopUpdated(updated);
      showToast('दुकान की Location सफलतापूर्वक सेव हो गई।');
    } catch (err: any) {
      console.error(err);
      showToast('लोकेशन सुरक्षित करने में विफल: ' + err.message, 'error');
    }
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

  // Direct Admin Verification & Field Locking
  const handleVerifyShopDirect = async () => {
    try {
      setIsSaving(true);
      const updated = await adminApi.verifyShop(shop.id);
      setShop(updated);
      setIsVerified(true);
      onShopUpdated(updated);
      showToast('दुकान आधिकारिक रूप से सत्यापित एवं विवरण सुरक्षित (Locked) कर दिए गए!');
    } catch (err: any) {
      showToast('सत्यापन विफल: ' + err.message, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleRejectShopDirect = async () => {
    const reason = window.prompt('सत्यापन अस्वीकार करने का कारण दर्ज करें:');
    if (!reason?.trim()) return;
    try {
      setIsSaving(true);
      const updated = await adminApi.rejectShop(shop.id, reason.trim());
      setShop(updated);
      setIsVerified(false);
      onShopUpdated(updated);
      showToast('दुकान सत्यापन अस्वीकृत किया गया');
    } catch (err: any) {
      showToast('त्रुटि: ' + err.message, 'error');
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

  const handleDeleteProduct = (productId: string, name: string) => {
    setProductToDelete({ id: productId, name });
  };

  const handleConfirmDeleteProduct = async () => {
    if (!productToDelete) return;
    setIsDeletingProduct(true);
    try {
      await adminApi.deleteProduct(productToDelete.id);
      setProducts((prev) => prev.filter((p) => p.id !== productToDelete.id));
      showToast(`"${productToDelete.name}" दुकान के कैटलॉग से हटा दिया गया`);
      setProductToDelete(null);
    } catch (err: any) {
      console.error('Failed to delete product from shop:', err);
      showToast('हटाने में विफल: ' + (err?.message || 'अज्ञात त्रुटि'), 'error');
    } finally {
      setIsDeletingProduct(false);
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

      {/* ========================================================================= */}
      {/* DESIGN #5: COMPACT MOBILE-FIRST SHOP/SELLER PROFILE & HEADER */}
      {/* ========================================================================= */}
      <div className="rounded-3xl bg-slate-900 border border-slate-800 shadow-xl overflow-hidden">
        {/* 1. SHOP PROFILE HEADER: Compact horizontal profile header */}
        <div className="p-3 sm:p-4 border-b border-slate-800/80 bg-slate-900/95 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 sm:gap-3.5 min-w-0">
            {/* Back Button */}
            <button
              type="button"
              onClick={onBack}
              className="w-9 h-9 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition shrink-0 active:scale-95 cursor-pointer"
              title="वापस सभी दुकानें"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>

            {/* Direct Android Phone Gallery File Inputs */}
            <input
              ref={profileFileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => handleDirectGalleryUpload('profile', e)}
            />
            <input
              ref={coverFileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => handleDirectGalleryUpload('cover', e)}
            />

            {/* Shop Profile Photo / Logo (Small circular image, 60-75px, not hidden) */}
            <div className="relative shrink-0 group">
              <motion.div
                key={profilePopKey}
                initial={{ scale: 0.95 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                onClick={() => setPhotoModalTarget('profile')}
                className="w-14 h-14 sm:w-16 sm:h-16 rounded-full border-2 border-indigo-500/60 overflow-hidden cursor-pointer shadow-md bg-slate-950 flex items-center justify-center relative active:scale-95 transition-transform"
                title="फोटो बदलें"
              >
                {photoUrl || shop.profilePhotoUrl || shop.photoUrl ? (
                  <img
                    src={photoUrl || shop.profilePhotoUrl || shop.photoUrl}
                    alt={shop.name}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <Store className="w-7 h-7 text-indigo-400" />
                )}

                {/* Tap / Hover Overlay Badge */}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white">
                  <Camera className="w-4 h-4" />
                </div>
              </motion.div>

              {/* Camera icon trigger badge */}
              <button
                type="button"
                onClick={() => setPhotoModalTarget('profile')}
                className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white flex items-center justify-center shadow-md border border-slate-900 text-xs transition active:scale-95 cursor-pointer"
                title="फोटो बदलें (Photo Manager / Gallery)"
              >
                <Camera className="w-3 h-3" />
              </button>
            </div>

            {/* Shop Name & Owner Name beside Profile Photo */}
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <h1 className="text-sm sm:text-base font-black text-white truncate max-w-[180px] sm:max-w-xs md:max-w-md">
                  {shop.name || shopName}
                </h1>

                {/* Shop Active/Inactive Status */}
                <span
                  className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wide border shrink-0 ${
                    shop.isActive
                      ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
                      : 'bg-rose-500/15 border-rose-500/30 text-rose-400'
                  }`}
                >
                  {shop.isActive ? 'सक्रिय (Active)' : 'निष्क्रिय (Inactive)'}
                </span>

                {/* Shop Verified Status */}
                <span
                  className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wide border shrink-0 ${
                    shop.isVerifiedByAdmin
                      ? 'bg-indigo-500/15 border-indigo-500/30 text-indigo-400'
                      : 'bg-amber-500/15 border-amber-500/30 text-amber-400'
                  }`}
                >
                  {shop.isVerifiedByAdmin ? 'सत्यापित' : 'सत्यापन पेंडिंग'}
                </span>
              </div>

              {/* Seller / Owner Name below Shop Name */}
              <div className="text-[11px] text-slate-300 font-medium flex items-center gap-1.5 mt-0.5 truncate">
                <User className="w-3 h-3 text-indigo-400 shrink-0" />
                <span>दुकानदार: <strong className="text-white font-bold">{shop.sellerName || sellerName || 'अज्ञात'}</strong></span>
                <span className="text-slate-600">•</span>
                <span className="text-slate-400">{shop.category || category}</span>
              </div>
            </div>
          </div>

          {/* Header Actions: Refresh & Close */}
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={loadShopProducts}
              className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold flex items-center gap-1 transition active:scale-95 cursor-pointer"
              title="कैटलॉग रिफ्रेश करें"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoadingProducts ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">रिफ्रेश</span>
            </button>

            <button
              type="button"
              onClick={onBack}
              className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-xs font-bold flex items-center gap-1 transition active:scale-95 cursor-pointer"
              title="Close"
            >
              <X className="w-3.5 h-3.5" />
              <span>Close</span>
            </button>
          </div>
        </div>

        {/* 2. COVER PHOTO: Wide and short cover banner directly below profile header */}
        <div className="relative w-full h-24 sm:h-32 bg-slate-950 overflow-hidden border-b border-slate-800">
          <motion.div
            key={coverPopKey}
            initial={{ scale: 0.98 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            className="w-full h-full relative group"
          >
            {coverPhotoUrl || shop.coverPhotoUrl || (shop as any).bannerUrl ? (
              <img
                src={coverPhotoUrl || shop.coverPhotoUrl || (shop as any).bannerUrl}
                alt={`${shop.name} Cover`}
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            ) : (
              /* Clean Default Cover Placeholder */
              <div className="w-full h-full bg-gradient-to-r from-slate-950 via-indigo-950/40 to-slate-950 flex items-center justify-center relative">
                <div className="absolute inset-0 bg-[radial-gradient(#334155_1px,transparent_1px)] [background-size:16px_16px] opacity-25" />
                <div className="flex items-center gap-2 text-slate-500 text-xs font-bold relative z-10">
                  <ImageIcon className="w-4 h-4 text-slate-400" />
                  <span>डिफ़ॉल्ट दुकान कवर (Default Cover Banner)</span>
                </div>
              </div>
            )}

            {/* ONLY ONE Small Camera / "कवर बदलें" button inside Cover */}
            <div className="absolute top-2.5 right-2.5 z-10">
              <button
                type="button"
                onClick={() => setPhotoModalTarget('cover')}
                className="px-2.5 py-1 rounded-full bg-black/80 hover:bg-black text-white text-[11px] font-bold border border-white/20 shadow-lg flex items-center gap-1 active:scale-95 transition backdrop-blur-sm cursor-pointer"
                title="कवर बदलें"
              >
                <Camera className="w-3 h-3 text-indigo-300" />
                <span>कवर बदलें</span>
              </button>
            </div>
          </motion.div>
        </div>

        {/* 3. SHOP INFORMATION: Ultra-compact rows with zero excessive height */}
        <div className="p-3 sm:p-4 bg-slate-900 border-b border-slate-800">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-black text-white flex items-center gap-1.5">
              <Store className="w-3.5 h-3.5 text-indigo-400" />
              <span>दुकान विवरण (Shop Information)</span>
            </span>
            <button
              type="button"
              onClick={() => setIsEditProfileModalOpen(true)}
              className="px-2.5 py-1 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-black flex items-center gap-1 shadow-md shadow-indigo-600/30 transition active:scale-95 cursor-pointer"
            >
              <Edit2 className="w-3 h-3" />
              <span>विवरण बदलें</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-1.5 text-xs">
            {/* 1. दुकान का नाम */}
            <div className="flex items-center justify-between py-1.5 px-2.5 rounded-xl bg-slate-950/60 border border-slate-800/70">
              <span className="text-[11px] text-slate-400 font-semibold flex items-center gap-1.5 shrink-0">
                <Store className="w-3.5 h-3.5 text-indigo-400" />
                <span>दुकान का नाम</span>
              </span>
              <span className="text-[11px] font-black text-white truncate max-w-[55%] text-right">{shop.name || shopName}</span>
            </div>

            {/* 2. दुकानदार का नाम */}
            <div className="flex items-center justify-between py-1.5 px-2.5 rounded-xl bg-slate-950/60 border border-slate-800/70">
              <span className="text-[11px] text-slate-400 font-semibold flex items-center gap-1.5 shrink-0">
                <User className="w-3.5 h-3.5 text-teal-400" />
                <span>दुकानदार का नाम</span>
              </span>
              <span className="text-[11px] font-bold text-white truncate max-w-[55%] text-right">{shop.sellerName || sellerName || 'अज्ञात'}</span>
            </div>

            {/* 3. मोबाइल */}
            <div className="flex items-center justify-between py-1.5 px-2.5 rounded-xl bg-slate-950/60 border border-slate-800/70">
              <span className="text-[11px] text-slate-400 font-semibold flex items-center gap-1.5 shrink-0">
                <Phone className="w-3.5 h-3.5 text-emerald-400" />
                <span>मोबाइल</span>
              </span>
              <span className="text-[11px] font-mono font-bold text-emerald-400 truncate max-w-[55%] text-right">{shop.phone || phone || 'उपलब्ध नहीं'}</span>
            </div>

            {/* 4. ईमेल */}
            <div className="flex items-center justify-between py-1.5 px-2.5 rounded-xl bg-slate-950/60 border border-slate-800/70">
              <span className="text-[11px] text-slate-400 font-semibold flex items-center gap-1.5 shrink-0">
                <Mail className="w-3.5 h-3.5 text-blue-400" />
                <span>ईमेल</span>
              </span>
              <span className="text-[11px] text-slate-300 font-medium truncate max-w-[55%] text-right">{shop.sellerEmail || (shop as any).email || email || 'seller@apnidukan.local'}</span>
            </div>

            {/* 5. पूरा पता */}
            <div className="flex items-center justify-between py-1.5 px-2.5 rounded-xl bg-slate-950/60 border border-slate-800/70 sm:col-span-2 lg:col-span-1">
              <span className="text-[11px] text-slate-400 font-semibold flex items-center gap-1.5 shrink-0">
                <MapPin className="w-3.5 h-3.5 text-rose-400" />
                <span>पूरा पता</span>
              </span>
              <span className="text-[11px] text-white font-medium truncate max-w-[55%] text-right">
                {street ? `${street}, ` : ''}{shop.address?.city || city || 'जयपुर'}, {shop.address?.pincode || pincode || '302001'}
              </span>
            </div>

            {/* 6. शहर */}
            <div className="flex items-center justify-between py-1.5 px-2.5 rounded-xl bg-slate-950/60 border border-slate-800/70">
              <span className="text-[11px] text-slate-400 font-semibold flex items-center gap-1.5 shrink-0">
                <Building className="w-3.5 h-3.5 text-purple-400" />
                <span>शहर</span>
              </span>
              <span className="text-[11px] font-bold text-white truncate max-w-[55%] text-right">{shop.address?.city || city || 'जयपुर'}</span>
            </div>

            {/* 7. पिनकोड */}
            <div className="flex items-center justify-between py-1.5 px-2.5 rounded-xl bg-slate-950/60 border border-slate-800/70">
              <span className="text-[11px] text-slate-400 font-semibold flex items-center gap-1.5 shrink-0">
                <MapPin className="w-3.5 h-3.5 text-amber-400" />
                <span>पिनकोड</span>
              </span>
              <span className="text-[11px] font-mono font-bold text-white truncate max-w-[55%] text-right">{shop.address?.pincode || pincode || '302001'}</span>
            </div>

            {/* 8. GPS/location */}
            <div className="flex items-center justify-between py-1.5 px-2.5 rounded-xl bg-slate-950/60 border border-slate-800/70">
              <span className="text-[11px] text-slate-400 font-semibold flex items-center gap-1.5 shrink-0">
                <Navigation className="w-3.5 h-3.5 text-cyan-400" />
                <span>GPS / Location</span>
              </span>
              <span className="text-[10px] font-mono text-cyan-300 truncate max-w-[55%] text-right">
                {shop.address?.location ? `${shop.address.location.lat.toFixed(4)}, ${shop.address.location.lng.toFixed(4)}` : `${typeof lat === 'number' ? lat.toFixed(4) : '26.9124'}, ${typeof lng === 'number' ? lng.toFixed(4) : '75.7873'}`}
              </span>
            </div>

            {/* 9. डिलीवरी क्षेत्र */}
            <div className="flex items-center justify-between py-1.5 px-2.5 rounded-xl bg-slate-950/60 border border-slate-800/70">
              <span className="text-[11px] text-slate-400 font-semibold flex items-center gap-1.5 shrink-0">
                <Truck className="w-3.5 h-3.5 text-emerald-400" />
                <span>डिलीवरी दायरा</span>
              </span>
              <span className="text-[11px] font-bold text-white truncate max-w-[55%] text-right">
                {deliveryRadiusKm || shop.fulfillment?.maxDeliveryRadiusKm || 5} km ({deliveryEnabled ? 'चालू' : 'पिकअप केवल'})
              </span>
            </div>

            {/* 10. दुकान खुलने का समय */}
            <div className="flex items-center justify-between py-1.5 px-2.5 rounded-xl bg-slate-950/60 border border-slate-800/70">
              <span className="text-[11px] text-slate-400 font-semibold flex items-center gap-1.5 shrink-0">
                <Clock className="w-3.5 h-3.5 text-emerald-400" />
                <span>खुलने का समय</span>
              </span>
              <span className="text-[11px] font-bold text-emerald-400 truncate max-w-[55%] text-right">{openingTime || shop.operatingHours?.openTime || '08:00 AM'}</span>
            </div>

            {/* 11. दुकान बंद होने का समय */}
            <div className="flex items-center justify-between py-1.5 px-2.5 rounded-xl bg-slate-950/60 border border-slate-800/70">
              <span className="text-[11px] text-slate-400 font-semibold flex items-center gap-1.5 shrink-0">
                <Clock className="w-3.5 h-3.5 text-rose-400" />
                <span>बंद होने का समय</span>
              </span>
              <span className="text-[11px] font-bold text-rose-400 truncate max-w-[55%] text-right">{closingTime || shop.operatingHours?.closeTime || '09:00 PM'}</span>
            </div>

            {/* 12. दुकान की स्थिति */}
            <div className="flex items-center justify-between py-1.5 px-2.5 rounded-xl bg-slate-950/60 border border-slate-800/70">
              <span className="text-[11px] text-slate-400 font-semibold flex items-center gap-1.5 shrink-0">
                <CheckCircle2 className="w-3.5 h-3.5 text-amber-400" />
                <span>दुकान स्थिति</span>
              </span>
              <span className="text-[11px] font-bold mt-0.5 flex items-center gap-1.5 truncate">
                <span className={`w-2 h-2 rounded-full shrink-0 ${shop.isActive ? 'bg-emerald-400' : 'bg-rose-400'}`} />
                <span className={shop.isActive ? 'text-emerald-400' : 'text-rose-400'}>{shop.isActive ? 'सक्रिय' : 'निष्क्रिय'}</span>
                <span className="text-slate-600">•</span>
                <span className={isOpenNow ? 'text-emerald-400 font-bold' : 'text-slate-400'}>
                  {isOpenNow ? 'खुली है' : 'बंद'}
                </span>
              </span>
            </div>

            {/* 13. Verification status */}
            <div className="flex items-center justify-between py-1.5 px-2.5 rounded-xl bg-slate-950/60 border border-slate-800/70">
              <span className="text-[11px] text-slate-400 font-semibold flex items-center gap-1.5 shrink-0">
                <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
                <span>सत्यापन स्थिति</span>
              </span>
              <span className={`text-[11px] font-black truncate ${shop.isVerifiedByAdmin ? 'text-indigo-400' : 'text-amber-400'}`}>
                {shop.isVerifiedByAdmin ? '✓ सत्यापित (Verified)' : 'सत्यापन पेंडिंग'}
              </span>
            </div>
          </div>
        </div>

        {/* 5. TABS BAR - Compact navigation keeping Catalog immediately below */}
        <div className="flex items-center gap-1.5 overflow-x-auto px-3 sm:px-4 py-2 bg-slate-950/90 border-t border-slate-800 scrollbar-none touch-pan-x">
          {[
            { key: 'catalog', label: 'दुकान कैटलॉग (Products)', icon: Package, badge: products.length },
            { key: 'inventory', label: 'इन्वेंटरी (Stock)', icon: Boxes, badge: inventoryStats.lowStock > 0 ? `${inventoryStats.lowStock} कम` : undefined, badgeColor: 'bg-amber-500 text-slate-950' },
            { key: 'profile', label: 'प्रोफ़ाइल विवरण (Profile)', icon: Store },
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
                className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 whitespace-nowrap transition shrink-0 ${
                  isActiveTab
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                    : 'bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800'
                }`}
              >
                <Icon className="w-3.5 h-3.5 shrink-0" />
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-2.5">
              {filteredProducts.map((p) => {
                const stock = p.currentStockInBaseUnits ?? 0;
                const threshold = p.lowStockThresholdInBaseUnits ?? 5;
                const isOutOfStock = !p.isAvailable || stock <= 0;
                const isLowStock = !isOutOfStock && stock <= threshold;

                return (
                  <div
                    key={p.id}
                    className="p-2.5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition flex items-center justify-between gap-2.5 group"
                  >
                    {/* Left: Product Image Thumbnail & Info */}
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      <div className="w-12 h-12 rounded-xl overflow-hidden bg-slate-950 border border-slate-800 shrink-0 relative">
                        <img
                          src={(p.imageUrl && p.imageUrl.trim() !== '') ? p.imageUrl : 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=500&auto=format&fit=crop&q=60'}
                          alt={p.name}
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                        {isOutOfStock && (
                          <div className="absolute inset-0 bg-black/80 flex items-center justify-center text-[8px] font-black text-rose-400 uppercase">
                            Out
                          </div>
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h4 className="text-xs font-bold text-white truncate max-w-[150px] sm:max-w-xs">{p.name}</h4>
                          {p.brand && (
                            <span className="px-1.5 py-0.2 rounded bg-indigo-500/15 text-indigo-400 text-[9px] font-bold">
                              {p.brand}
                            </span>
                          )}
                        </div>
                        {p.nameHindi && (
                          <p className="text-[10px] text-slate-400 font-medium truncate">
                            {p.nameHindi}
                          </p>
                        )}
                        <div className="flex items-center gap-2 mt-0.5 text-[11px] flex-wrap">
                          <span className="font-black text-emerald-400">
                            ₹{p.basePricePerUnit || p.fractionalConfig?.basePrice || 0}
                            <span className="text-[10px] text-slate-400 font-normal">/{p.baseUnit || p.fractionalConfig?.baseUnit || 'unit'}</span>
                          </span>
                          <span className="text-slate-600">•</span>
                          <span className={`text-[10px] font-bold ${isOutOfStock ? 'text-rose-400' : isLowStock ? 'text-amber-400' : 'text-slate-300'}`}>
                            स्टॉक: {stock} {p.baseUnit || 'unit'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Right: Availability Toggle & Action Buttons */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleToggleProductAvailability(p.id, p.isAvailable !== false)}
                        className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase transition cursor-pointer ${
                          p.isAvailable !== false
                            ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                            : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                        }`}
                        title="उपलब्धता बदलें"
                      >
                        {p.isAvailable !== false ? 'In Stock' : 'Out'}
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setEditingProduct(p);
                          setIsAddEditModalOpen(true);
                        }}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition cursor-pointer"
                        title="संपादित करें (Edit)"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeleteProduct(p.id, p.name)}
                        className="p-1.5 rounded-lg bg-rose-950/40 hover:bg-rose-900/60 text-rose-400 hover:text-rose-300 transition cursor-pointer"
                        title="हटाएं (Delete)"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
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

          {/* ========================================================================= */}
          {/* PHOTO MANAGEMENT (Profile Photo & Cover Photo) - Requirement 1, 2, 6, 10 */}
          {/* ========================================================================= */}
          <div className="p-4 sm:p-5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
              <div>
                <h4 className="text-xs font-black text-white flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                  <span>दुकान की तस्वीरें (Profile & Cover Photos Management)</span>
                </h4>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Admin किसी भी दुकान की Profile Photo और Cover Photo को देख सकता है, फोन Gallery से बदल सकता है और हटा सकता है
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Profile Photo Control */}
              <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 flex flex-col justify-between">
                <PhotoDisplayControl
                  type="profile"
                  photoUrl={photoUrl || shop.profilePhotoUrl || shop.photoUrl}
                  title="दुकान प्रोफ़ाइल फोटो (Shop Profile Photo)"
                  subtitle="लोगो या दुकान का मुख्य पहचान चिह्न (टैप करें या बदलें)"
                  targetName={shop.name}
                  roleLabel="Admin Control"
                  canEdit={true}
                  onUpdatePhoto={(res) => handlePhotoUpdate('profile', res)}
                />
                <div className="mt-3 pt-3 border-t border-slate-800/80">
                  <label className="block text-[11px] font-bold text-slate-400 mb-1">
                    सीधे URL से प्रोफ़ाइल फोटो लिंक करें:
                  </label>
                  <input
                    type="url"
                    value={photoUrl}
                    onChange={(e) => setPhotoUrl(e.target.value)}
                    placeholder="https://images.unsplash.com/..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white focus:border-indigo-500 outline-none"
                  />
                </div>
              </div>

              {/* Cover Photo Control */}
              <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 flex flex-col justify-between">
                <PhotoDisplayControl
                  type="cover"
                  photoUrl={coverPhotoUrl || shop.coverPhotoUrl || (shop as any).bannerUrl}
                  title="दुकान कवर फोटो (Shop Cover Photo / Banner)"
                  subtitle="दुकान के शीर्ष पर दिखने वाला लैंडस्केप बैनर"
                  targetName={shop.name}
                  roleLabel="Admin Control"
                  canEdit={true}
                  onUpdatePhoto={(res) => handlePhotoUpdate('cover', res)}
                />
                <div className="mt-3 pt-3 border-t border-slate-800/80">
                  <label className="block text-[11px] font-bold text-slate-400 mb-1">
                    सीधे URL से कवर फोटो लिंक करें:
                  </label>
                  <input
                    type="url"
                    value={coverPhotoUrl}
                    onChange={(e) => setCoverPhotoUrl(e.target.value)}
                    placeholder="https://images.unsplash.com/..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white focus:border-indigo-500 outline-none"
                  />
                </div>
              </div>
            </div>
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
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
              <div className="text-xs font-bold text-white flex items-center gap-2">
                <Crosshair className="w-4 h-4 text-indigo-400" />
                <span>GPS निर्देशांक (Latitude & Longitude)</span>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsMapModalOpen(true)}
                  className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black shadow-md shadow-indigo-600/30 transition flex items-center gap-1.5 cursor-pointer"
                >
                  <MapPin className="w-3.5 h-3.5" />
                  <span>📍 Google Map से Location सेट करें</span>
                </button>
                <button
                  type="button"
                  onClick={handleDetectGPS}
                  className="px-3 py-1.5 rounded-xl bg-indigo-500/15 border border-indigo-500/30 text-indigo-400 hover:bg-indigo-500/25 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                >
                  <Crosshair className="w-3.5 h-3.5" />
                  <span>वर्तमान लोकेशन प्राप्त करें</span>
                </button>
              </div>
            </div>

            {mapLocationSource && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-emerald-400 text-xs font-bold">
                <Check className="w-3.5 h-3.5 shrink-0" />
                <span>
                  {mapLocationSource === 'google_map' ? '✓ Google Map से सटीक लोकेशन चुनी गई' : '✓ डिवाइस GPS से सटीक लोकेशन प्राप्त हुई'} ({Number(lat).toFixed(5)}, {Number(lng).toFixed(5)})
                </span>
              </div>
            )}

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

            {/* Formal Verification Actions Banner */}
            <div className="sm:col-span-2 p-4 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <ShieldCheck className={`w-4 h-4 ${shop.verificationStatus === 'VERIFIED' ? 'text-emerald-400' : 'text-amber-400'}`} />
                  <span className="text-xs font-black text-white">
                    सत्यापन स्थिति (Official Verification Governance):
                  </span>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                    shop.verificationStatus === 'VERIFIED'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : shop.verificationStatus === 'REJECTED'
                      ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                      : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  }`}>
                    {shop.verificationStatus || (shop.isVerifiedByAdmin ? 'VERIFIED' : 'PENDING')}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  {shop.verificationStatus === 'VERIFIED'
                    ? 'दुकान सत्यापित है। नाम, श्रेणी, पता, जीपीएस व यूपीआई लॉक हैं। केवल एडमिन अनुमति पर ही बदले जा सकते हैं।'
                    : 'सत्यापित करने पर विक्रेता के संवेदनशील विवरण लॉक हो जाएंगे और ग्राहक बाज़ार में विश्वास बैज दिखेगा।'}
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {shop.verificationStatus !== 'VERIFIED' ? (
                  <>
                    <button
                      type="button"
                      onClick={handleVerifyShopDirect}
                      disabled={isSaving}
                      className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black flex items-center gap-1.5 shadow-lg shadow-emerald-900/30 transition active:scale-95 disabled:opacity-50"
                    >
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>स्वीकृत व लॉक करें</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleRejectShopDirect}
                      disabled={isSaving}
                      className="px-3.5 py-2 rounded-xl bg-rose-600/20 hover:bg-rose-600/30 border border-rose-500/30 text-rose-300 text-xs font-bold flex items-center gap-1.5 transition active:scale-95 disabled:opacity-50"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      <span>अस्वीकार</span>
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={handleRejectShopDirect}
                    disabled={isSaving}
                    className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-rose-950/40 border border-slate-700 hover:border-rose-500/40 text-slate-300 hover:text-rose-300 text-xs font-bold flex items-center gap-1.5 transition active:scale-95"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    <span>सत्यापन रिवोक / अस्वीकार करें</span>
                  </button>
                )}
              </div>
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

      {/* Photo Manager Modal for Profile / Cover Photo (Design #5 Action Buttons) */}
      {photoModalTarget && (
        <PhotoManagerModal
          isOpen={true}
          onClose={() => setPhotoModalTarget(null)}
          type={photoModalTarget}
          currentPhotoUrl={
            photoModalTarget === 'profile'
              ? photoUrl || shop.profilePhotoUrl || shop.photoUrl
              : coverPhotoUrl || shop.coverPhotoUrl || (shop as any).bannerUrl
          }
          targetName={shop.name}
          roleLabel="Admin Control"
          onConfirm={async (res) => {
            await handlePhotoUpdate(photoModalTarget, res);
            setPhotoModalTarget(null);
          }}
          onSave={async (res) => {
            await handlePhotoUpdate(photoModalTarget, res);
            setPhotoModalTarget(null);
          }}
        />
      )}

      {/* Edit Profile Modal (Design #5 Action Button: प्रोफाइल संपादित करें) */}
      {isEditProfileModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center">
                  <Edit2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-white">दुकान प्रोफाइल संपादित करें</h3>
                  <p className="text-[11px] text-slate-400">दुकान व दुकानदार की सभी मुख्य जानकारी अपडेट करें</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsEditProfileModalOpen(false)}
                className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Form Scrollable Body */}
            <div className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">दुकान का नाम *</label>
                  <input
                    type="text"
                    value={shopName}
                    onChange={(e) => setShopName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-bold focus:border-indigo-500 outline-none"
                    placeholder="दुकान का नाम"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1">दुकानदार का नाम *</label>
                  <input
                    type="text"
                    value={sellerName}
                    onChange={(e) => setSellerName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-bold focus:border-indigo-500 outline-none"
                    placeholder="दुकानदार का नाम"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1">मोबाइल नंबर *</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-bold focus:border-indigo-500 outline-none"
                    placeholder="10 अंकों का मोबाइल"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1">ईमेल (Email)</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-bold focus:border-indigo-500 outline-none"
                    placeholder="seller@market.in"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1">श्रेणी (Category)</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-bold focus:border-indigo-500 outline-none"
                  >
                    <option value="Grocery & Kirana">किराना व जनरल स्टोर (Grocery & Kirana)</option>
                    <option value="Fruits & Vegetables">फल व सब्ज़ियां (Fruits & Veggies)</option>
                    <option value="Dairy & Bakery">डेयरी व बेकरी (Dairy & Bakery)</option>
                    <option value="Spices & Masala">मसाला भंडार (Spices & Masala)</option>
                    <option value="Sweets & Snacks">मिठाई व नमकीन (Sweets & Snacks)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1">सड़क / मोहल्ला (Street / Area)</label>
                  <input
                    type="text"
                    value={street}
                    onChange={(e) => setStreet(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-bold focus:border-indigo-500 outline-none"
                    placeholder="गली / बाज़ार का नाम"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1">शहर (City)</label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-bold focus:border-indigo-500 outline-none"
                    placeholder="शहर"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1">पिनकोड (Pincode)</label>
                  <input
                    type="text"
                    value={pincode}
                    onChange={(e) => setPincode(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-bold focus:border-indigo-500 outline-none"
                    placeholder="6 अंकों का पिनकोड"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1">खुलने का समय (Opening Time)</label>
                  <input
                    type="time"
                    value={openingTime}
                    onChange={(e) => setOpeningTime(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-bold focus:border-indigo-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1">बंद होने का समय (Closing Time)</label>
                  <input
                    type="time"
                    value={closingTime}
                    onChange={(e) => setClosingTime(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-bold focus:border-indigo-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">दुकान का विवरण (Description)</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-medium focus:border-indigo-500 outline-none resize-none"
                  placeholder="दुकान के बारे में संक्षिप्त जानकारी..."
                />
              </div>

              {/* Status Toggles */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div className="p-3 rounded-2xl bg-slate-950/70 border border-slate-800 flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold text-white">दुकान स्थिति (Active)</div>
                    <div className="text-[10px] text-slate-400">दुकान बाज़ार में चालू या बंद</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsActive(!isActive)}
                    className={`w-11 h-6 rounded-full transition p-0.5 flex items-center ${
                      isActive ? 'bg-emerald-600 justify-end' : 'bg-slate-700 justify-start'
                    }`}
                  >
                    <span className="w-5 h-5 rounded-full bg-white shadow-md block" />
                  </button>
                </div>

                <div className="p-3 rounded-2xl bg-slate-950/70 border border-slate-800 flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold text-white">सत्यापन स्थिति (Verified)</div>
                    <div className="text-[10px] text-slate-400">एडमिन द्वारा अनुमोदित दुकान</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsVerified(!isVerified)}
                    className={`w-11 h-6 rounded-full transition p-0.5 flex items-center ${
                      isVerified ? 'bg-indigo-600 justify-end' : 'bg-slate-700 justify-start'
                    }`}
                  >
                    <span className="w-5 h-5 rounded-full bg-white shadow-md block" />
                  </button>
                </div>
              </div>
            </div>

            {/* Modal Footer Actions */}
            <div className="p-4 border-t border-slate-800 bg-slate-950/80 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setIsEditProfileModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition active:scale-95"
              >
                रद्द करें
              </button>
              <button
                type="button"
                onClick={handleSaveProfileModal}
                disabled={isSaving}
                className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black flex items-center gap-1.5 shadow-lg shadow-indigo-600/30 transition active:scale-95 disabled:opacity-50 cursor-pointer"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{isSaving ? 'सेव हो रहा है...' : 'प्रोफाइल सुरक्षित करें'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Custom Product Delete Confirmation Dialog */}
      {productToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-sm rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl p-5 text-center flex flex-col items-center">
            <div className="w-12 h-12 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mb-3">
              <Trash2 className="w-6 h-6" />
            </div>
            
            <h3 className="text-base font-bold text-white mb-1.5">
              क्या आप इस सामान को हटाना चाहते हैं?
            </h3>
            
            <p className="text-xs text-slate-300 mb-4">
              क्या आप वाकई <strong className="text-white">"{productToDelete.name}"</strong> को इस दुकान के कैटलॉग से हटाना चाहते हैं?
            </p>

            <div className="grid grid-cols-2 gap-2.5 w-full">
              <button
                type="button"
                onClick={() => setProductToDelete(null)}
                disabled={isDeletingProduct}
                className="w-full py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition cursor-pointer disabled:opacity-50"
              >
                रद्द करें
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteProduct}
                disabled={isDeletingProduct}
                className="w-full py-2 px-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-black text-xs shadow-lg shadow-rose-600/30 flex items-center justify-center gap-1.5 transition cursor-pointer disabled:opacity-50"
              >
                {isDeletingProduct ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>हटा रहे हैं...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>हटाएँ</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Google Maps Location Picker Modal for Admin */}
      <AdminGoogleMapLocationPickerModal
        isOpen={isMapModalOpen}
        shopName={shop.name}
        initialCoordinates={
          lat !== '' && lng !== ''
            ? { lat: Number(lat), lng: Number(lng) }
            : shop.coordinates
        }
        initialAddressHint={`${street} ${city} ${stateName}`.trim()}
        onClose={() => setIsMapModalOpen(false)}
        onConfirmLocation={handleConfirmMapLocation}
      />
    </div>
  );
};

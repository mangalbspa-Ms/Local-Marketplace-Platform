/**
 * Quick Shop Setup Component (Phase 10: Real Seller Onboarding)
 * 
 * Mobile-first workflow optimized for the platform owner to visit shopkeepers
 * in person and configure seller accounts, shop details, business models,
 * management modes (Admin/Seller/Hybrid), and rapid starter catalogs.
 */

import React, { useState, useEffect } from 'react';
import {
  Store,
  User,
  MapPin,
  Clock,
  Truck,
  Percent,
  Zap,
  Package,
  Plus,
  Trash2,
  Copy,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet,
  Layers,
  ArrowRight,
  ArrowLeft,
  Smartphone,
  Check,
  Building2,
  Compass,
  QrCode,
  Share2,
  Send,
  RefreshCw,
} from 'lucide-react';
import { LocalMarket } from '../../../types/market.ts';
import { SubscriptionPlan } from '../../../types/financial.ts';

interface QuickShopSetupProps {
  onSuccess?: (createdShop: any) => void;
}

const CATEGORY_TEMPLATES: Record<string, Array<{ name: string; nameHindi?: string; unit: string; price: number; stock: number; category: string }>> = {
  'Grocery & Kirana': [
    { name: 'Aashirvaad Shudh Chakki Atta', nameHindi: 'आशीर्वाद चक्की आटा', unit: 'kg', price: 48, stock: 50, category: 'Grocery & Kirana' },
    { name: 'Tata Salt Vaccum Evaporated', nameHindi: 'टाटा नमक', unit: 'packet', price: 28, stock: 100, category: 'Grocery & Kirana' },
    { name: 'Fortune Sunlite Refined Sunflower Oil', nameHindi: 'फॉर्च्यून रिफाइंड तेल', unit: 'L', price: 145, stock: 30, category: 'Grocery & Kirana' },
    { name: 'India Gate Basmati Rice Feast Rozzana', nameHindi: 'बासमती चावल', unit: 'kg', price: 95, stock: 40, category: 'Grocery & Kirana' },
    { name: 'Madhur Pure & Hygienic Sugar', nameHindi: 'मधुर चीनी', unit: 'kg', price: 44, stock: 60, category: 'Grocery & Kirana' },
    { name: 'Tata Tea Gold Leaf Tea', nameHindi: 'टाटा चाय गोल्ड', unit: 'g', price: 140, stock: 35, category: 'Grocery & Kirana' },
  ],
  'Fresh Produce': [
    { name: 'Fresh Hybrid Tomato', nameHindi: 'टमाटर', unit: 'kg', price: 35, stock: 40, category: 'Fresh Produce' },
    { name: 'Nashik Red Onion', nameHindi: 'प्याज', unit: 'kg', price: 30, stock: 60, category: 'Fresh Produce' },
    { name: 'Pahari Potato (Aloo)', nameHindi: 'आलू', unit: 'kg', price: 25, stock: 100, category: 'Fresh Produce' },
    { name: 'Fresh Green Cauliflower (Gobhi)', nameHindi: 'फूलगोभी', unit: 'piece', price: 35, stock: 20, category: 'Fresh Produce' },
    { name: 'Fresh Coriander Bunch (Dhaniya)', nameHindi: 'धनिया पत्ता', unit: 'bunch', price: 15, stock: 50, category: 'Fresh Produce' },
    { name: 'Robusta Golden Banana', nameHindi: 'केला (दर्जन)', unit: 'dozen', price: 60, stock: 25, category: 'Fresh Produce' },
  ],
  'Dairy & Sweets': [
    { name: 'Amul Taaza Toned Fresh Milk', nameHindi: 'अमूल ताजा दूध', unit: 'L', price: 56, stock: 40, category: 'Dairy & Sweets' },
    { name: 'Amul Pasteurised Salted Butter', nameHindi: 'अमूल मक्खन', unit: 'packet', price: 58, stock: 30, category: 'Dairy & Sweets' },
    { name: 'Fresh Malai Paneer (Loose)', nameHindi: 'मलाई पनीर', unit: 'kg', price: 360, stock: 15, category: 'Dairy & Sweets' },
    { name: 'Mother Dairy Classic Curd Dahi', nameHindi: 'दही', unit: 'g', price: 35, stock: 25, category: 'Dairy & Sweets' },
    { name: 'Amul Pure Cow Ghee Tin', nameHindi: 'अमूल गाय का घी', unit: 'L', price: 650, stock: 12, category: 'Dairy & Sweets' },
  ],
};

export const QuickShopSetup: React.FC<QuickShopSetupProps> = ({ onSuccess }) => {
  const [step, setStep] = useState<number>(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successData, setSuccessData] = useState<any | null>(null);

  // Reference Data
  const [markets, setMarkets] = useState<LocalMarket[]>([]);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);

  // Step 1: Seller & Shop Basic Info
  const [sellerName, setSellerName] = useState('');
  const [sellerPhone, setSellerPhone] = useState('');
  const [sellerEmail, setSellerEmail] = useState('');
  const [sellerStatus, setSellerStatus] = useState<'ACTIVE' | 'PENDING'>('ACTIVE');

  const [shopName, setShopName] = useState('');
  const [category, setCategory] = useState('Grocery & Kirana');
  const [shopNumber, setShopNumber] = useState('');
  const [address, setAddress] = useState('');
  const [landmark, setLandmark] = useState('');
  const [marketId, setMarketId] = useState('');
  const [latitude, setLatitude] = useState<number>(28.6139);
  const [longitude, setLongitude] = useState<number>(77.2090);
  const [photoUrl, setPhotoUrl] = useState('');

  // Step 2: Timings & Fulfillment
  const [openTime, setOpenTime] = useState('08:00');
  const [closeTime, setCloseTime] = useState('21:30');
  const [closedOnDays, setClosedOnDays] = useState<number[]>([]);
  const [pickupEnabled, setPickupEnabled] = useState(true);
  const [deliveryEnabled, setDeliveryEnabled] = useState(true);
  const [minOrderValue, setMinOrderValue] = useState(99);
  const [deliveryFee, setDeliveryFee] = useState(25);
  const [freeDeliveryThreshold, setFreeDeliveryThreshold] = useState(499);
  const [maxDeliveryRadiusKm, setMaxDeliveryRadiusKm] = useState(5);

  // Step 3: Business Model & Governance
  const [billingMode, setBillingMode] = useState<'COMMISSION' | 'SUBSCRIPTION' | 'COMMISSION_PLUS_SUBSCRIPTION'>('COMMISSION');
  const [selectedPlanId, setSelectedPlanId] = useState('');
  const [customCommissionRate, setCustomCommissionRate] = useState<number | ''>('');
  const [payoutUpiId, setPayoutUpiId] = useState('');
  const [gstin, setGstin] = useState('');
  const [managementMode, setManagementMode] = useState<'ADMIN_MANAGED' | 'SELLER_MANAGED' | 'HYBRID'>('SELLER_MANAGED');

  // Step 4: Rapid Product Catalog
  const [products, setProducts] = useState<Array<{
    id: string;
    name: string;
    nameHindi?: string;
    category: string;
    unit: string;
    price: number;
    stock: number;
  }>>([]);

  const [csvText, setCsvText] = useState('');
  const [showCsvBox, setShowCsvBox] = useState(false);

  const getAdminHeaders = () => {
    const userId = localStorage.getItem('admin_user_id') || 'usr_admin_01';
    const token = localStorage.getItem('admin_auth_token') || localStorage.getItem('auth_token') || `token_${userId}`;
    return {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      'x-auth-user-id': userId,
    };
  };

  // Fetch reference markets and subscription plans
  useEffect(() => {
    const fetchRefData = async () => {
      try {
        const [mRes, pRes] = await Promise.all([
          fetch('/api/markets'),
          fetch('/api/admin/subscription-plans', { headers: getAdminHeaders() }),
        ]);

        if (mRes.ok) {
          const mData = await mRes.json();
          const list = mData.data || [];
          setMarkets(list);
          if (list.length > 0 && !marketId) {
            setMarketId(list[0].id);
          }
        }

        if (pRes.ok) {
          const pData = await pRes.json();
          setPlans(pData.data || []);
        }
      } catch (err) {
        console.error('Failed to load onboarding metadata', err);
      }
    };

    fetchRefData();
  }, []);

  // Prepopulate starter products when category changes
  useEffect(() => {
    if (products.length === 0 && CATEGORY_TEMPLATES[category]) {
      loadCategoryPreset(category);
    }
  }, [category]);

  const loadCategoryPreset = (cat: string) => {
    const preset = CATEGORY_TEMPLATES[cat] || [];
    const mapped = preset.map((p, idx) => ({
      id: `temp-${Date.now()}-${idx}`,
      name: p.name,
      nameHindi: p.nameHindi,
      category: p.category,
      unit: p.unit,
      price: p.price,
      stock: p.stock,
    }));
    setProducts(mapped);
  };

  const handleGetCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLatitude(parseFloat(pos.coords.latitude.toFixed(6)));
          setLongitude(parseFloat(pos.coords.longitude.toFixed(6)));
        },
        (err) => {
          console.warn('Geolocation failed', err);
          setError('GPS location access denied. Defaulting to market center.');
        }
      );
    }
  };

  const handleAddEmptyProduct = () => {
    setProducts((prev) => [
      ...prev,
      {
        id: `temp-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        name: '',
        category: category,
        unit: 'kg',
        price: 50,
        stock: 20,
      },
    ]);
  };

  const handleDuplicateProduct = (index: number) => {
    const item = products[index];
    setProducts((prev) => [
      ...prev.slice(0, index + 1),
      {
        ...item,
        id: `temp-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        name: `${item.name} (Copy)`,
      },
      ...prev.slice(index + 1),
    ]);
  };

  const handleRemoveProduct = (index: number) => {
    setProducts((prev) => prev.filter((_, i) => i !== index));
  };

  const handleProductChange = (index: number, field: string, value: any) => {
    setProducts((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  const handleParseCsv = () => {
    if (!csvText.trim()) return;
    const lines = csvText.trim().split('\n');
    const parsed: typeof products = [];

    for (const line of lines) {
      // Name, Price, Unit, Stock, Category
      const parts = line.split(',').map((p) => p.trim());
      if (parts.length >= 2 && parts[0] && !isNaN(Number(parts[1]))) {
        parsed.push({
          id: `temp-${Date.now()}-${Math.random()}`,
          name: parts[0],
          price: Number(parts[1]),
          unit: parts[2] || 'kg',
          stock: parts[3] ? Number(parts[3]) : 50,
          category: parts[4] || category,
        });
      }
    }

    if (parsed.length > 0) {
      setProducts((prev) => [...prev, ...parsed]);
      setCsvText('');
      setShowCsvBox(false);
    }
  };

  const handleSubmitOnboarding = async () => {
    setError(null);
    setIsLoading(true);

    try {
      if (!sellerName.trim() || !sellerPhone.trim()) {
        throw new Error('Please provide Seller Name and Mobile Number');
      }
      if (!shopName.trim() || !address.trim() || !marketId) {
        throw new Error('Please fill in Shop Name, Address, and Market');
      }

      const payload = {
        sellerName: sellerName.trim(),
        sellerPhone: sellerPhone.trim(),
        sellerEmail: sellerEmail.trim() || undefined,
        sellerStatus,
        shopName: shopName.trim(),
        category,
        shopNumber: shopNumber.trim() || undefined,
        address: address.trim(),
        landmark: landmark.trim() || undefined,
        marketId,
        coordinates: { latitude, longitude },
        phone: sellerPhone.trim(),
        photoUrl: photoUrl || 'https://images.unsplash.com/photo-1578916171728-46686eac8d58?w=600&auto=format&fit=crop&q=60',
        openTime,
        closeTime,
        closedOnDays,
        pickupEnabled,
        deliveryEnabled,
        minOrderValueForDelivery: Number(minOrderValue),
        deliveryFee: Number(deliveryFee),
        freeDeliveryThreshold: Number(freeDeliveryThreshold),
        maxDeliveryRadiusKm: Number(maxDeliveryRadiusKm),
        billingMode,
        subscriptionPlanId: billingMode !== 'COMMISSION' ? selectedPlanId : undefined,
        customCommissionPercentage: customCommissionRate !== '' ? Number(customCommissionRate) : undefined,
        payoutUpiId: payoutUpiId.trim() || undefined,
        gstin: gstin.trim() || undefined,
        managementMode,
        initialProducts: products
          .filter((p) => p.name.trim().length > 0)
          .map((p) => ({
            name: p.name.trim(),
            nameHindi: p.nameHindi,
            category: p.category || category,
            baseUnit: p.unit as any,
            basePricePerUnit: Number(p.price),
            currentStockInBaseUnits: Number(p.stock),
            isAvailable: true,
          })),
      };

      const res = await fetch('/api/admin/onboard-shop', {
        method: 'POST',
        headers: getAdminHeaders(),
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error?.message || json.message || 'Failed to onboard shop');
      }

      setSuccessData(json.data);
      if (onSuccess) onSuccess(json.data);
    } catch (err: any) {
      setError(err.message || 'An error occurred during onboarding');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetForNext = () => {
    setSuccessData(null);
    setStep(1);
    setSellerName('');
    setSellerPhone('');
    setSellerEmail('');
    setShopName('');
    setShopNumber('');
    setAddress('');
    setLandmark('');
    setProducts([]);
    setError(null);
  };

  // Success View
  if (successData) {
    const { seller, shop, products: createdProds, invitation } = successData;
    const inviteToken = invitation?.invitationToken || `inv_${Date.now()}_${seller.phone.slice(-4)}`;
    const inviteLink = `${window.location.origin}/?token=${inviteToken}`;
    const whatsappText = `नमस्ते ${seller.name} जी! आपकी दुकान "${shop.name}" Local Marketplace पर लाइव हो गई है।\n\nअपने सेलर पोर्टल में लॉगिन करने के लिए इस लिंक पर क्लिक करें:\n${inviteLink}\n\nटोकन कोड: ${inviteToken}`;
    const whatsappUrl = `https://wa.me/91${seller.phone.replace(/\D/g, '')}?text=${encodeURIComponent(whatsappText)}`;

    return (
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-2xl mx-auto shadow-2xl animate-fade-in text-white space-y-6">
        <div className="text-center space-y-2">
          <div className="w-16 h-16 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto border border-emerald-500/30">
            <CheckCircle2 className="w-9 h-9" />
          </div>
          <h2 className="text-2xl font-black tracking-tight text-white">Shop Onboarded Successfully!</h2>
          <p className="text-slate-400 text-sm">
            {shop.name} is now live and registered under {seller.name}.
          </p>
        </div>

        {/* Seller Credentials & Details */}
        <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-700/60 pb-3">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Seller Credentials</span>
            <span className="text-xs font-bold bg-indigo-500/20 text-indigo-400 px-2.5 py-1 rounded-full">
              {shop.managementMode} Mode
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4 text-xs">
            <div>
              <div className="text-slate-400">Seller Name</div>
              <div className="font-bold text-white text-sm">{seller.name}</div>
            </div>
            <div>
              <div className="text-slate-400">Mobile (Login)</div>
              <div className="font-bold text-white text-sm">{seller.phone}</div>
            </div>
            <div>
              <div className="text-slate-400">Shop ID</div>
              <div className="font-mono text-slate-300">{shop.id}</div>
            </div>
            <div>
              <div className="text-slate-400">Catalog Initialized</div>
              <div className="font-bold text-emerald-400">{createdProds?.length || 0} Products</div>
            </div>
          </div>
        </div>

        {/* Real Field Operator: Seller Invitation Dispatch Card */}
        <div className="bg-emerald-950/40 border border-emerald-500/40 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <QrCode className="w-5 h-5 text-emerald-400" />
              <span className="text-xs font-bold text-emerald-300 uppercase tracking-wider">
                Seller Invitation & Shop Handover
              </span>
            </div>
            <span className="text-[10px] font-mono bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-500/30">
              Active Token
            </span>
          </div>

          <p className="text-xs text-slate-300">
            Share this one-touch activation link with <strong className="text-white">{seller.name}</strong> so they can log into their shop on their phone immediately.
          </p>

          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3 flex items-center justify-between gap-3">
            <div className="truncate font-mono text-xs text-emerald-400 font-bold select-all">
              {inviteToken}
            </div>
            <button
              type="button"
              onClick={() => {
                navigator.clipboard.writeText(inviteLink);
                alert('Invitation link copied to clipboard!');
              }}
              className="py-1 px-3 bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 rounded-lg flex items-center gap-1.5 shrink-0 transition"
            >
              <Copy className="w-3.5 h-3.5" /> Copy Link
            </button>
          </div>

          <div className="flex flex-col sm:flex-row gap-2.5">
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition shadow-md shadow-emerald-600/20"
            >
              <Send className="w-4 h-4" /> Share on WhatsApp (+91 {seller.phone})
            </a>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <button
            onClick={handleResetForNext}
            className="flex-1 py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-sm transition flex items-center justify-center gap-2 border border-slate-700"
          >
            <Plus className="w-4 h-4" />
            Onboard Another Shop
          </button>
          <button
            onClick={() => {
              // Store token and reload into seller portal
              const token = successData.session?.token || `token_${successData.seller?.id || 'usr_seller_01'}`;
              localStorage.setItem('seller_auth_token', token);
              localStorage.setItem('seller_user_id', successData.seller?.id || 'usr_seller_01');
              if (successData.shop?.id) {
                localStorage.setItem('seller_shop_id', successData.shop.id);
              }
              window.location.href = `/?token=${inviteToken}`;
            }}
            className="flex-1 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-sm transition flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/30"
          >
            <Smartphone className="w-4 h-4" />
            Open Seller App Now
          </button>
        </div>
      </div>
    );
  }


  return (
    <div className="space-y-4 max-w-4xl mx-auto">
      {/* Compact Header & Step Tracker */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3.5 sm:p-4 shadow-sm text-white space-y-3">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-500/15 border border-indigo-500/30 text-indigo-400 flex items-center justify-center shrink-0">
              <Store className="w-4 h-4" />
            </div>
            <div>
              <h1 className="text-base font-extrabold text-white flex items-center gap-2">
                <span>Quick Shop Onboarding</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                  Field Agent
                </span>
              </h1>
              <p className="text-[11px] text-slate-400">
                Rapid shopkeeper registration, operations policy, and starter catalog configuration
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-stretch sm:self-auto justify-between sm:justify-end">
            <button
              onClick={() => {
                const text = prompt('बोलकर या लिखकर दुकान का विवरण दें (Speak or paste shop details):\n\nउदा: "राम की किराना दुकान है। फोन 9876543210। चीनी 70 रुपये किलो। चावल 50 रुपये किलो। तेल 140 रुपये लीटर। काजू 900 रुपये किलो।"');
                if (text && text.trim()) {
                  fetch('/api/ai/admin-onboard/parse', {
                    method: 'POST',
                    headers: getAdminHeaders(),
                    body: JSON.stringify({ transcript: text.trim() }),
                  })
                    .then((res) => res.json())
                    .then((res) => {
                      if (res.success && res.data?.draft) {
                        const d = res.data.draft;
                        if (d.sellerName) setSellerName(d.sellerName);
                        if (d.sellerPhone) setSellerPhone(d.sellerPhone);
                        if (d.shopName) setShopName(d.shopName);
                        if (d.category) setCategory(d.category);
                        if (d.address) setAddress(d.address);
                        if (d.products && d.products.length > 0) {
                          setProducts(d.products.map((p: any, i: number) => ({
                            id: `ai-prod-${Date.now()}-${i}`,
                            name: p.name,
                            nameHindi: p.nameHindi,
                            category: p.category || d.category,
                            unit: p.unit,
                            price: p.price,
                            stock: p.stock || 50,
                          })));
                        }
                        alert('AI ने दुकान और सामान की जानकारी भर दी है। कृपया समीक्षा करें!');
                      }
                    })
                    .catch((err) => alert('AI parsing failed: ' + err.message));
                }
              }}
              className="py-1 px-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-lg text-[11px] font-bold flex items-center gap-1.5 shadow-xs transition"
            >
              <Zap className="w-3.5 h-3.5" />
              <span>AI Assistant</span>
            </button>

            <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-[11px] font-bold">
              {[
                { num: 1, label: 'Identity' },
                { num: 2, label: 'Hours' },
                { num: 3, label: 'Finance' },
                { num: 4, label: 'Catalog' },
              ].map((s) => (
                <button
                  key={s.num}
                  onClick={() => setStep(s.num)}
                  className={`px-2.5 py-1 rounded-lg transition text-[11px] ${
                    step === s.num
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : step > s.num
                      ? 'text-emerald-400 hover:bg-slate-800'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {step > s.num ? '✓ ' : `${s.num}. `}{s.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {error && (
          <div className="p-2.5 bg-rose-500/10 border border-rose-500/30 rounded-xl flex items-center gap-2 text-rose-400 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Step 1: Seller & Shop Identity */}
        {step === 1 && (
          <div className="space-y-3.5 pt-1">
            {/* Section 1: Owner Information */}
            <div className="space-y-2">
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-indigo-400" />
                <span>Seller / Owner Information</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <div>
                  <label className="block text-[11px] text-slate-400 font-bold mb-1">Seller Full Name *</label>
                  <div className="relative">
                    <User className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5" />
                    <input
                      type="text"
                      placeholder="e.g. Ramesh Kumar"
                      value={sellerName}
                      onChange={(e) => setSellerName(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-2.5 py-2 text-xs text-white placeholder-slate-500 focus:border-indigo-500 outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] text-slate-400 font-bold mb-1">Seller Mobile Number *</label>
                  <div className="relative">
                    <Smartphone className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5" />
                    <input
                      type="tel"
                      placeholder="e.g. 9876543210"
                      value={sellerPhone}
                      onChange={(e) => setSellerPhone(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-2.5 py-2 text-xs text-white placeholder-slate-500 focus:border-indigo-500 outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] text-slate-400 font-bold mb-1">Email Address (Optional)</label>
                  <input
                    type="email"
                    placeholder="e.g. shop@example.com"
                    value={sellerEmail}
                    onChange={(e) => setSellerEmail(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-2 text-xs text-white placeholder-slate-500 focus:border-indigo-500 outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Section 2: Shop Details */}
            <div className="space-y-2 pt-1 border-t border-slate-800/80">
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 pt-1">
                <Store className="w-3.5 h-3.5 text-indigo-400" />
                <span>Shop Profile & Categorization</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <div>
                  <label className="block text-[11px] text-slate-400 font-bold mb-1">Shop Name *</label>
                  <input
                    type="text"
                    placeholder="e.g. Ramesh Kirana Store"
                    value={shopName}
                    onChange={(e) => setShopName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-2 text-xs text-white placeholder-slate-500 focus:border-indigo-500 outline-none font-bold"
                  />
                </div>

                <div>
                  <label className="block text-[11px] text-slate-400 font-bold mb-1">Primary Category *</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-2 text-xs text-white focus:border-indigo-500 outline-none"
                  >
                    <option value="Grocery & Kirana">Grocery & Kirana</option>
                    <option value="Fresh Produce">Fresh Produce (Vegetables & Fruits)</option>
                    <option value="Dairy & Sweets">Dairy & Sweets</option>
                    <option value="Meat & Fish">Meat & Fish</option>
                    <option value="Bakery & Snacks">Bakery & Snacks</option>
                    <option value="Pooja Samagri">Pooja Samagri</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] text-slate-400 font-bold mb-1">Target Market Territory *</label>
                  <select
                    value={marketId}
                    onChange={(e) => setMarketId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-2 text-xs text-white focus:border-indigo-500 outline-none"
                  >
                    {markets.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name} ({m.city})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Section 3: Address & Geolocation */}
            <div className="space-y-2 pt-1 border-t border-slate-800/80">
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 pt-1">
                <MapPin className="w-3.5 h-3.5 text-indigo-400" />
                <span>Physical Address & Location</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
                <div className="sm:col-span-1">
                  <label className="block text-[11px] text-slate-400 font-bold mb-1">Shop / Booth No.</label>
                  <input
                    type="text"
                    placeholder="e.g. Shop No. 14"
                    value={shopNumber}
                    onChange={(e) => setShopNumber(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-2 text-xs text-white placeholder-slate-500 focus:border-indigo-500 outline-none"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-[11px] text-slate-400 font-bold mb-1">Street Address *</label>
                  <input
                    type="text"
                    placeholder="e.g. Near Shiv Mandir, Sector 4, Rohini"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-2 text-xs text-white placeholder-slate-500 focus:border-indigo-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] text-slate-400 font-bold mb-1">Landmark</label>
                  <input
                    type="text"
                    placeholder="e.g. Opp. Post Office"
                    value={landmark}
                    onChange={(e) => setLandmark(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-2 text-xs text-white placeholder-slate-500 focus:border-indigo-500 outline-none"
                  />
                </div>
              </div>

              {/* Coordinates row */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 pt-1 bg-slate-950/60 p-2 rounded-lg border border-slate-800/80">
                <div className="flex items-center gap-2 text-[11px] text-slate-400">
                  <span className="font-bold text-slate-300">Coordinates:</span>
                  <input
                    type="number"
                    step="0.0001"
                    placeholder="Lat"
                    value={latitude}
                    onChange={(e) => setLatitude(parseFloat(e.target.value))}
                    className="w-24 bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-white font-mono"
                  />
                  <input
                    type="number"
                    step="0.0001"
                    placeholder="Lng"
                    value={longitude}
                    onChange={(e) => setLongitude(parseFloat(e.target.value))}
                    className="w-24 bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-white font-mono"
                  />
                </div>

                <button
                  type="button"
                  onClick={handleGetCurrentLocation}
                  className="text-[11px] font-bold text-indigo-400 hover:text-indigo-300 flex items-center justify-center gap-1 px-2.5 py-1 bg-indigo-500/10 rounded-md border border-indigo-500/30 transition self-end sm:self-auto"
                >
                  <Compass className="w-3 h-3" />
                  <span>Detect My GPS</span>
                </button>
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-800/80">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="py-2 px-4 bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs rounded-lg flex items-center gap-1.5 shadow-md shadow-indigo-600/20 transition"
              >
                <span>Next: Operations & Hours</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Timings & Fulfillment */}
        {step === 2 && (
          <div className="space-y-3.5 pt-1">
            <div className="space-y-2">
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-indigo-400" />
                <span>Operating Schedule</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[11px] text-slate-400 font-bold mb-1">Opening Time</label>
                  <div className="relative">
                    <Clock className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5" />
                    <input
                      type="time"
                      value={openTime}
                      onChange={(e) => setOpenTime(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-2.5 py-2 text-xs text-white outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] text-slate-400 font-bold mb-1">Closing Time</label>
                  <div className="relative">
                    <Clock className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5" />
                    <input
                      type="time"
                      value={closeTime}
                      onChange={(e) => setCloseTime(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-2.5 py-2 text-xs text-white outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Fulfillment Options */}
            <div className="space-y-2 pt-1 border-t border-slate-800/80">
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 pt-1">
                <Truck className="w-3.5 h-3.5 text-indigo-400" />
                <span>Fulfillment Channels & Delivery Policy</span>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <label className={`flex items-center gap-2.5 p-2.5 rounded-lg border cursor-pointer transition ${pickupEnabled ? 'bg-indigo-600/15 border-indigo-500/50 text-white' : 'bg-slate-950 border-slate-800 text-slate-400'}`}>
                  <input
                    type="checkbox"
                    checked={pickupEnabled}
                    onChange={(e) => setPickupEnabled(e.target.checked)}
                    className="hidden"
                  />
                  <Store className="w-4 h-4 text-indigo-400" />
                  <div>
                    <div className="text-xs font-bold">Store Pickup</div>
                    <div className="text-[10px] text-slate-400">Customer counter collection</div>
                  </div>
                </label>

                <label className={`flex items-center gap-2.5 p-2.5 rounded-lg border cursor-pointer transition ${deliveryEnabled ? 'bg-indigo-600/15 border-indigo-500/50 text-white' : 'bg-slate-950 border-slate-800 text-slate-400'}`}>
                  <input
                    type="checkbox"
                    checked={deliveryEnabled}
                    onChange={(e) => setDeliveryEnabled(e.target.checked)}
                    className="hidden"
                  />
                  <Truck className="w-4 h-4 text-teal-400" />
                  <div>
                    <div className="text-xs font-bold">Home Delivery</div>
                    <div className="text-[10px] text-slate-400">Local delivery by merchant</div>
                  </div>
                </label>
              </div>

              {deliveryEnabled && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
                  <div>
                    <label className="block text-[11px] text-slate-400 font-bold mb-1">Min Order (₹)</label>
                    <input
                      type="number"
                      value={minOrderValue}
                      onChange={(e) => setMinOrderValue(Number(e.target.value))}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white outline-none focus:border-indigo-500 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-slate-400 font-bold mb-1">Delivery Fee (₹)</label>
                    <input
                      type="number"
                      value={deliveryFee}
                      onChange={(e) => setDeliveryFee(Number(e.target.value))}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white outline-none focus:border-indigo-500 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-slate-400 font-bold mb-1">Free Delivery (₹)</label>
                    <input
                      type="number"
                      value={freeDeliveryThreshold}
                      onChange={(e) => setFreeDeliveryThreshold(Number(e.target.value))}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white outline-none focus:border-indigo-500 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-slate-400 font-bold mb-1">Radius (Km)</label>
                    <input
                      type="number"
                      value={maxDeliveryRadiusKm}
                      onChange={(e) => setMaxDeliveryRadiusKm(Number(e.target.value))}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white outline-none focus:border-indigo-500 font-mono"
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-between pt-2 border-t border-slate-800/80">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="py-1.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-lg flex items-center gap-1.5 transition"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back</span>
              </button>
              <button
                type="button"
                onClick={() => setStep(3)}
                className="py-2 px-4 bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs rounded-lg flex items-center gap-1.5 shadow-md shadow-indigo-600/20 transition"
              >
                <span>Next: Business & Governance</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Business Model & Governance */}
        {step === 3 && (
          <div className="space-y-3.5 pt-1">
            {/* Management Mode */}
            <div className="space-y-2">
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-indigo-400" />
                <span>Shop Management Mode</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {[
                  {
                    id: 'SELLER_MANAGED',
                    title: 'Seller Managed',
                    desc: 'Shopkeeper manages prices, stock & orders from Seller App.',
                  },
                  {
                    id: 'ADMIN_MANAGED',
                    title: 'Admin Managed',
                    desc: 'Admin team manages catalog & settings on behalf of shop.',
                  },
                  {
                    id: 'HYBRID',
                    title: 'Hybrid Co-Managed',
                    desc: 'Both Admin and Seller have live collaborative access.',
                  },
                ].map((mode) => (
                  <label
                    key={mode.id}
                    className={`p-2.5 rounded-lg border cursor-pointer transition flex flex-col justify-between ${
                      managementMode === mode.id
                        ? 'bg-indigo-600/15 border-indigo-500/50 text-white shadow-xs'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <input
                      type="radio"
                      name="mgmtMode"
                      value={mode.id}
                      checked={managementMode === mode.id}
                      onChange={() => setManagementMode(mode.id as any)}
                      className="hidden"
                    />
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-white">{mode.title}</span>
                      {managementMode === mode.id && <Check className="w-3.5 h-3.5 text-indigo-400" />}
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1 leading-normal">{mode.desc}</p>
                  </label>
                ))}
              </div>
            </div>

            {/* Revenue Model */}
            <div className="space-y-2 pt-1 border-t border-slate-800/80">
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 pt-1">
                <Percent className="w-3.5 h-3.5 text-emerald-400" />
                <span>Revenue & Billing Model</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <label
                  className={`p-2.5 rounded-lg border cursor-pointer transition ${
                    billingMode === 'COMMISSION'
                      ? 'bg-emerald-600/15 border-emerald-500/50 text-white'
                      : 'bg-slate-950 border-slate-800 text-slate-400'
                  }`}
                >
                  <input
                    type="radio"
                    name="billingMode"
                    value="COMMISSION"
                    checked={billingMode === 'COMMISSION'}
                    onChange={() => setBillingMode('COMMISSION')}
                    className="hidden"
                  />
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white">Order Commission Model</span>
                    {billingMode === 'COMMISSION' && <Check className="w-3.5 h-3.5 text-emerald-400" />}
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">Platform takes commission per completed order.</p>
                </label>

                <label
                  className={`p-2.5 rounded-lg border cursor-pointer transition ${
                    billingMode === 'SUBSCRIPTION'
                      ? 'bg-indigo-600/15 border-indigo-500/50 text-white'
                      : 'bg-slate-950 border-slate-800 text-slate-400'
                  }`}
                >
                  <input
                    type="radio"
                    name="billingMode"
                    value="SUBSCRIPTION"
                    checked={billingMode === 'SUBSCRIPTION'}
                    onChange={() => setBillingMode('SUBSCRIPTION')}
                    className="hidden"
                  />
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white">Monthly Subscription Plan</span>
                    {billingMode === 'SUBSCRIPTION' && <Check className="w-3.5 h-3.5 text-indigo-400" />}
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">Fixed periodic subscription fee without order commission.</p>
                </label>
              </div>

              {billingMode === 'SUBSCRIPTION' && (
                <div className="space-y-1">
                  <label className="block text-[11px] text-slate-400 font-bold">Select Active Subscription Plan</label>
                  <select
                    value={selectedPlanId}
                    onChange={(e) => setSelectedPlanId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white focus:border-indigo-500 outline-none"
                  >
                    <option value="">-- Choose active plan --</option>
                    {plans.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} — ₹{p.price}/{p.interval?.toLowerCase() || 'month'} ({p.maxProducts} max products)
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* Payouts & GST */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1 border-t border-slate-800/80">
              <div>
                <label className="block text-[11px] text-slate-400 font-bold mb-1">Seller UPI Payout ID</label>
                <input
                  type="text"
                  placeholder="e.g. ramesh@okhdfcbank"
                  value={payoutUpiId}
                  onChange={(e) => setPayoutUpiId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-2 text-xs text-white outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-[11px] text-slate-400 font-bold mb-1">GSTIN / Trade No. (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. 07AAAAA0000A1Z5"
                  value={gstin}
                  onChange={(e) => setGstin(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-2 text-xs text-white outline-none uppercase focus:border-indigo-500"
                />
              </div>
            </div>

            <div className="flex justify-between pt-2 border-t border-slate-800/80">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="py-1.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-lg flex items-center gap-1.5 transition"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back</span>
              </button>
              <button
                type="button"
                onClick={() => setStep(4)}
                className="py-2 px-4 bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs rounded-lg flex items-center gap-1.5 shadow-md shadow-indigo-600/20 transition"
              >
                <span>Next: Starter Catalog</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Rapid Product Catalog */}
        {step === 4 && (
          <div className="space-y-3 pt-1">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 bg-slate-950 p-2.5 rounded-xl border border-slate-800">
              <div>
                <h3 className="text-xs font-black text-white flex items-center gap-2">
                  <Package className="w-4 h-4 text-indigo-400" />
                  <span>Initial Catalog ({products.length} Products)</span>
                </h3>
                <p className="text-[10px] text-slate-400">
                  Pre-configured from "{category}". Edit prices, stock, or paste CSV.
                </p>
              </div>

              <div className="flex items-center gap-1.5 self-end sm:self-auto">
                <button
                  type="button"
                  onClick={() => setShowCsvBox(!showCsvBox)}
                  className="py-1 px-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-lg flex items-center gap-1 transition border border-slate-700/60"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-teal-400" />
                  <span>CSV</span>
                </button>
                <button
                  type="button"
                  onClick={handleAddEmptyProduct}
                  className="py-1 px-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-lg flex items-center gap-1 transition shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Row</span>
                </button>
              </div>
            </div>

            {showCsvBox && (
              <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-2 animate-fade-in">
                <div className="flex justify-between items-center text-xs text-slate-300">
                  <span className="font-bold text-[11px]">Format: Product Name, Price, Unit, Stock, Category</span>
                  <button onClick={() => setShowCsvBox(false)} className="text-slate-400 hover:text-white">✕</button>
                </div>
                <textarea
                  rows={3}
                  placeholder={`Amul Butter, 58, packet, 40, Dairy & Sweets\nTata Salt, 28, packet, 50, Grocery & Kirana`}
                  value={csvText}
                  onChange={(e) => setCsvText(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-white font-mono outline-none"
                />
                <button
                  type="button"
                  onClick={handleParseCsv}
                  className="py-1.5 px-3 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg transition"
                >
                  Import CSV Rows
                </button>
              </div>
            )}

            {/* Compact Product Table */}
            <div className="space-y-1.5 max-h-80 overflow-y-auto pr-1">
              {products.map((prod, idx) => (
                <div
                  key={prod.id}
                  className="bg-slate-950 border border-slate-800/80 rounded-lg p-2 flex flex-col sm:flex-row items-start sm:items-center gap-2 justify-between hover:border-slate-700 transition"
                >
                  <div className="flex-1 grid grid-cols-1 sm:grid-cols-4 gap-1.5 w-full">
                    <input
                      type="text"
                      placeholder="Product Name"
                      value={prod.name}
                      onChange={(e) => handleProductChange(idx, 'name', e.target.value)}
                      className="sm:col-span-2 bg-slate-900 border border-slate-800 rounded px-2 py-1 text-xs text-white font-bold outline-none focus:border-indigo-500"
                    />

                    <div className="flex items-center gap-1">
                      <span className="text-xs text-slate-400 font-bold">₹</span>
                      <input
                        type="number"
                        placeholder="Price"
                        value={prod.price}
                        onChange={(e) => handleProductChange(idx, 'price', Number(e.target.value))}
                        className="w-full bg-slate-900 border border-slate-800 rounded px-1.5 py-1 text-xs text-emerald-400 font-bold outline-none focus:border-indigo-500 font-mono"
                      />
                      <select
                        value={prod.unit}
                        onChange={(e) => handleProductChange(idx, 'unit', e.target.value)}
                        className="bg-slate-900 border border-slate-800 rounded px-1 py-1 text-xs text-slate-300 outline-none"
                      >
                        <option value="kg">kg</option>
                        <option value="g">g</option>
                        <option value="L">L</option>
                        <option value="ml">ml</option>
                        <option value="piece">pc</option>
                        <option value="packet">pack</option>
                        <option value="dozen">doz</option>
                        <option value="bunch">bunch</option>
                      </select>
                    </div>

                    <div className="flex items-center gap-1">
                      <span className="text-[11px] text-slate-400">Qty:</span>
                      <input
                        type="number"
                        placeholder="Stock"
                        value={prod.stock}
                        onChange={(e) => handleProductChange(idx, 'stock', Number(e.target.value))}
                        className="w-full bg-slate-900 border border-slate-800 rounded px-1.5 py-1 text-xs text-white outline-none focus:border-indigo-500 font-mono"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0 self-end sm:self-center">
                    <button
                      type="button"
                      title="Duplicate"
                      onClick={() => handleDuplicateProduct(idx)}
                      className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      title="Remove"
                      onClick={() => handleRemoveProduct(idx)}
                      className="p-1 text-rose-400 hover:text-rose-300 rounded hover:bg-rose-500/10"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Submission Actions */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setStep(3)}
                className="w-full sm:w-auto py-1.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-lg flex items-center justify-center gap-1.5 transition"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back</span>
              </button>

              <button
                type="button"
                disabled={isLoading}
                onClick={handleSubmitOnboarding}
                className="w-full sm:w-auto py-2 px-6 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs rounded-lg flex items-center justify-center gap-1.5 shadow-md shadow-emerald-600/30 transition disabled:opacity-50"
              >
                {isLoading ? (
                  <span className="flex items-center gap-1.5">
                    <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Creating Shop & Account...</span>
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5" />
                    <span>Complete Onboard & Go Live</span>
                  </span>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

import React, { useState, useEffect, useRef } from 'react';
import {
  Store,
  Camera,
  MapPin,
  Clock,
  Truck,
  CreditCard,
  Phone,
  ShieldCheck,
  ChevronLeft,
  Check,
  AlertCircle,
  QrCode,
  Save,
  Loader2,
  Calendar,
  Building,
  Navigation,
  Lock,
  Shield,
  X,
  Plus,
  Trash2,
  RefreshCw,
  Eye,
  Play,
  Pause,
  ChevronRight,
} from 'lucide-react';
import { useSellerAuth } from '../../../context/SellerAuthContext';
import { useSellerLanguage } from '../../../context/SellerLanguageContext';
import { GoogleMapsLocationPickerModal } from './GoogleMapsLocationPickerModal';
import { ShopChangeRequestModal } from './ShopChangeRequestModal';
import { lookupPostalPincode, PostalData } from '../../../utils/postalPincodeService';
import { requestFreshDeviceLocation } from '../../../utils/deviceGeolocation';
import { MarketCoordinates, ShopChangeRequest } from '../../../types/market';
import { sellerApi } from '../../../services/sellerApi';

interface ShopInformationScreenProps {
  onBack: () => void;
  onClose?: () => void;
  onShowToast?: (message: string, type?: 'success' | 'error') => void;
}

const SHOP_CATEGORIES = [
  'किराना एवं जनरल स्टोर (Grocery & Kirana)',
  'ताज़ी सब्जी एवं फल (Fresh Fruits & Vegetables)',
  'डेयरी एवं मिठाई (Dairy & Sweets)',
  'जनरल एवं स्टेशनरी (General Store)',
  'मेडिकल एवं फार्मेसी (Pharmacy & Medical)',
  'बेकरी एवं कन्फेक्शनरी (Bakery & Snacks)',
  'पूजा सामग्री एवं मसाले (Spices & Puja Needs)',
  'अन्य स्थानीय विक्रेता (Other Local Merchant)',
];

const DAYS_OF_WEEK = [
  { id: 'Mon', labelHi: 'सोम (Mon)', labelEn: 'Mon' },
  { id: 'Tue', labelHi: 'मंगल (Tue)', labelEn: 'Tue' },
  { id: 'Wed', labelHi: 'बुध (Wed)', labelEn: 'Wed' },
  { id: 'Thu', labelHi: 'गुरु (Thu)', labelEn: 'Thu' },
  { id: 'Fri', labelHi: 'शुक्र (Fri)', labelEn: 'Fri' },
  { id: 'Sat', labelHi: 'शनि (Sat)', labelEn: 'Sat' },
  { id: 'Sun', labelHi: 'रवि (Sun)', labelEn: 'Sun' },
];

export const ShopInformationScreen: React.FC<ShopInformationScreenProps> = ({
  onBack,
  onClose,
  onShowToast,
}) => {
  const {
    shop,
    user,
    updateShopProfile,
    updateShopPhoto,
    updateFulfillmentSettings,
  } = useSellerAuth();
  const { language, t } = useSellerLanguage();
  const isHindi = language === 'hi';

  // Hidden file inputs
  const profilePhotoInputRef = useRef<HTMLInputElement>(null);
  const coverPhotoInputRef = useRef<HTMLInputElement>(null);
  const qrImageInputRef = useRef<HTMLInputElement>(null);

  // Cover Photo Gallery & Slideshow refs and state
  const coverGallerySlotInputRef = useRef<HTMLInputElement>(null);
  const targetCoverSlotIndexRef = useRef<number | null>(null);
  const coverContainerRef = useRef<HTMLDivElement>(null);

  // Initialize cover photos list from shop data
  const getShopCoverPhotos = (): string[] => {
    if (shop?.coverPhotos && Array.isArray(shop.coverPhotos)) {
      const list = shop.coverPhotos.filter((p): p is string => Boolean(p && typeof p === 'string' && p.trim().length > 0));
      if (list.length > 0) return list;
    }
    const single = shop?.coverPhotoUrl || (shop as any)?.bannerUrl || (shop as any)?.bannerImageUrl;
    if (single && typeof single === 'string' && single.trim().length > 0) {
      return [single];
    }
    return ['https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=1200&q=80'];
  };

  const [coverPhotoList, setCoverPhotoList] = useState<string[]>(getShopCoverPhotos);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [isCoverInView, setIsCoverInView] = useState(true);
  const [isManualPaused, setIsManualPaused] = useState(false);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [activeMenuSlotIndex, setActiveMenuSlotIndex] = useState<number | null>(null);
  const [photoToDeleteIndex, setPhotoToDeleteIndex] = useState<number | null>(null);

  // SECTION 1: दुकान की पहचान व मूल विवरण
  const [shopName, setShopName] = useState(shop?.name || '');
  const [category, setCategory] = useState(shop?.category || SHOP_CATEGORIES[0]);
  const [description, setDescription] = useState(shop?.description || '');
  const [ownerName, setOwnerName] = useState(
    (shop as any)?.ownerName ||
      (shop as any)?.merchantName ||
      user?.fullName ||
      (user as any)?.name ||
      (isHindi ? 'दुकानदार' : 'Shop Owner')
  );

  // SECTION B: 📍 दुकान का पता और LOCATION
  const initialAddressStr = typeof shop?.address === 'string' ? shop.address : '';
  const initialPincode =
    (shop as any)?.pincode ||
    (typeof shop?.address === 'object' ? (shop.address as any)?.pincode : '') ||
    '302004';

  const [pincode, setPincode] = useState(initialPincode);
  const [isLookingUpPin, setIsLookingUpPin] = useState(false);
  const [pinValidationMessage, setPinValidationMessage] = useState<string | null>(null);

  // Auto-filled & editable postal details
  const [stateName, setStateName] = useState((shop as any)?.postalData?.state || 'राजस्थान (Rajasthan)');
  const [district, setDistrict] = useState((shop as any)?.postalData?.district || 'जयपुर (Jaipur)');
  const [tehsil, setTehsil] = useState((shop as any)?.postalData?.tehsil || 'जयपुर');
  const [postOffice, setPostOffice] = useState((shop as any)?.postalData?.postOffice || 'राजा पार्क SO');
  const [locality, setLocality] = useState((shop as any)?.postalData?.locality || 'राजा पार्क मुख्य मंडी');
  const [streetAddress, setStreetAddress] = useState(
    initialAddressStr || 'दुकान संख्या 42, ब्लॉक B, मुख्य मंडी'
  );

  // SECTION 3: Coordinates & Device GPS Location
  const [coordinates, setCoordinates] = useState<MarketCoordinates>(
    shop?.coordinates || { lat: 26.8912, lng: 75.8239 }
  );
  const [isMapModalOpen, setIsMapModalOpen] = useState(false);
  const [isLocationSaved, setIsLocationSaved] = useState(true);
  const [isDetectingGps, setIsDetectingGps] = useState(false);
  const [gpsAccuracy, setGpsAccuracy] = useState<number | null>(
    (shop as any)?.locationAccuracy || null
  );
  const [gpsStatusMsg, setGpsStatusMsg] = useState<string | null>(null);

  // Sync coordinates whenever shop data is loaded from backend/localStorage
  useEffect(() => {
    if (shop?.coordinates && typeof shop.coordinates.lat === 'number' && typeof shop.coordinates.lng === 'number') {
      console.log('[ShopInformationScreen] Loaded shop coordinates from backend/cache:', shop.coordinates);
      setCoordinates(shop.coordinates);
      setIsLocationSaved(true);
    }
  }, [shop?.id, shop?.coordinates?.lat, shop?.coordinates?.lng]);

  const handleGetCurrentGps = async () => {
    if (isShopVerified) {
      handleOpenChangeModal('coordinates');
      return;
    }
    setIsDetectingGps(true);
    setGpsStatusMsg('डिवाइस GPS से ताज़ा लोकेशन प्राप्त की जा रही है...');
    try {
      const res = await requestFreshDeviceLocation({
        timeoutMs: 15000,
        onStatusChange: (status) => setGpsStatusMsg(status),
      });
      const newCoords = { lat: res.lat, lng: res.lng };
      setCoordinates(newCoords);
      setGpsAccuracy(res.accuracy);
      setIsLocationSaved(true);
      setGpsStatusMsg(`सटीक GPS प्राप्त हुआ (सटीकता: ±${res.accuracy} मी.) ✓`);
      onShowToast?.(`📍 ताज़ा GPS लोकेशन प्राप्त हुई: ${res.lat.toFixed(5)}, ${res.lng.toFixed(5)} (±${res.accuracy} मी.)`, 'success');
      setTimeout(() => setGpsStatusMsg(null), 6000);
    } catch (err: any) {
      console.error('Device GPS error:', err);
      setGpsStatusMsg(err.message || 'GPS प्राप्त नहीं हुआ');
      onShowToast?.(err.message || 'GPS प्राप्त करने में असमर्थ', 'error');
    } finally {
      setIsDetectingGps(false);
    }
  };

  // SECTION C: 🕐 दुकान का समय
  const [openTime, setOpenTime] = useState(shop?.operatingHours?.openTime || '07:30 AM');
  const [closeTime, setCloseTime] = useState(shop?.operatingHours?.closeTime || '09:30 PM');
  const [isDayWiseExpanded, setIsDayWiseExpanded] = useState(false);
  const [openDays, setOpenDays] = useState<string[]>(
    shop?.operatingHours?.openDays || ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
  );

  // SECTION D: 🚚 ORDER / FULFILLMENT SETTINGS
  const [pickupEnabled, setPickupEnabled] = useState(shop?.fulfillment?.pickupEnabled ?? true);
  const [deliveryEnabled, setDeliveryEnabled] = useState(shop?.fulfillment?.deliveryEnabled ?? true);
  const [deliveryFee, setDeliveryFee] = useState<number>(shop?.fulfillment?.deliveryFee ?? 25);
  const [freeDeliveryThreshold, setFreeDeliveryThreshold] = useState<number>(
    shop?.fulfillment?.freeDeliveryThreshold ?? 499
  );
  const [maxDistance, setMaxDistance] = useState<number>(
    shop?.fulfillment?.maxDeliveryRadiusKm ?? 5
  );

  // SECTION E: 💳 PAYMENT / UPI INFORMATION
  const [upiId, setUpiId] = useState(
    (shop as any)?.upiPayoutId || shop?.financials?.payoutUpiId || 'shreekrishna@okaxis'
  );
  const [paymentName, setPaymentName] = useState(
    (shop as any)?.paymentName || shop?.name || 'श्री कृष्णा किराना स्टोर'
  );
  const [upiQrUrl, setUpiQrUrl] = useState<string>((shop as any)?.upiQrUrl || '');

  // SECTION F: 📞 SHOP CONTACT INFORMATION
  const [phone, setPhone] = useState(shop?.phone || '+91 98290 12345');
  const [whatsapp, setWhatsapp] = useState((shop as any)?.whatsapp || shop?.phone || '+91 98290 12345');
  const [sameAsShopMobile, setSameAsShopMobile] = useState(whatsapp === phone);
  const [email, setEmail] = useState(shop?.email || 'krishna.shop@example.com');

  // Saving state
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccessNotice, setSaveSuccessNotice] = useState(false);

  // Verification & Change Request Governance
  const isShopVerified = shop?.verificationStatus === 'VERIFIED' || Boolean(shop?.isVerifiedByAdmin);
  const [isChangeModalOpen, setIsChangeModalOpen] = useState(false);
  const [changeField, setChangeField] = useState<'name' | 'category' | 'address' | 'coordinates' | 'upiPayoutId'>('name');
  const [changeRequests, setChangeRequests] = useState<ShopChangeRequest[]>([]);
  const [isLoadingChangeRequests, setIsLoadingChangeRequests] = useState(false);

  const loadChangeRequests = async () => {
    if (!shop?.id) return;
    try {
      setIsLoadingChangeRequests(true);
      const list = await sellerApi.getChangeRequests(shop.id);
      setChangeRequests(list || []);
    } catch (err) {
      console.error('Failed to load shop change requests:', err);
    } finally {
      setIsLoadingChangeRequests(false);
    }
  };

  useEffect(() => {
    loadChangeRequests();
  }, [shop?.id]);

  const pendingRequest = changeRequests.find((r) => r.status === 'PENDING');

  const handleOpenChangeModal = (field: 'name' | 'category' | 'address' | 'coordinates' | 'upiPayoutId') => {
    setChangeField(field);
    setIsChangeModalOpen(true);
  };

  // Auto postal lookup when PIN code is 6 digits
  useEffect(() => {
    const cleanPin = pincode.replace(/\D/g, '').trim();
    if (cleanPin.length === 6) {
      handlePincodeLookup(cleanPin);
    } else if (cleanPin.length > 0 && cleanPin.length < 6) {
      setPinValidationMessage('कृपया 6-अंकों का पिनकोड दर्ज करें');
    } else {
      setPinValidationMessage(null);
    }
  }, [pincode]);

  const handlePincodeLookup = async (pin: string) => {
    setIsLookingUpPin(true);
    setPinValidationMessage(null);
    try {
      const data: PostalData | null = await lookupPostalPincode(pin);
      if (data) {
        if (data.state) setStateName(data.state);
        if (data.district) setDistrict(data.district);
        if (data.tehsil) setTehsil(data.tehsil);
        if (data.postOffice) setPostOffice(data.postOffice);
        if (data.locality) setLocality(data.locality);
        setPinValidationMessage(null);
      } else {
        setPinValidationMessage('❌ यह PIN Code अमान्य है या डेटा उपलब्ध नहीं है। कृपया सही 6-अंकों का पिनकोड दर्ज करें।');
      }
    } catch (err) {
      setPinValidationMessage('पोस्टल डेटा प्राप्त करने में असमर्थ। आप मैन्युअल रूप से जानकारी भर सकते हैं।');
    } finally {
      setIsLookingUpPin(false);
    }
  };

  // Sync WhatsApp when "Same as Shop Mobile" is toggled
  const handleToggleSameAsMobile = (checked: boolean) => {
    setSameAsShopMobile(checked);
    if (checked) {
      setWhatsapp(phone);
    }
  };

  const handlePhoneChange = (val: string) => {
    setPhone(val);
    if (sameAsShopMobile) {
      setWhatsapp(val);
    }
  };

  // Photo handlers
  const handleUploadPhoto = async (type: 'profile' | 'cover', e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';

    if (!file.type.startsWith('image/')) {
      onShowToast?.('कृपया वैध इमेज फ़ाइल चुनें', 'error');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      onShowToast?.('फोटो 5MB से कम होनी चाहिए', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const base64 = reader.result as string;
        await updateShopPhoto({
          type,
          action: 'set',
          imageData: base64,
        });
        onShowToast?.(
          type === 'profile'
            ? 'दुकान प्रोफाइल फोटो अपडेट हो गई!'
            : 'दुकान कवर फोटो अपडेट हो गई!'
        );
      } catch (err: any) {
        onShowToast?.(err?.message || 'फोटो अपडेट में त्रुटि', 'error');
      }
    };
    reader.readAsDataURL(file);
  };

  // Sync coverPhotoList when shop changes
  useEffect(() => {
    const list = getShopCoverPhotos();
    setCoverPhotoList(list);
  }, [shop?.id, shop?.coverPhotoUrl, (shop as any)?.bannerUrl, JSON.stringify((shop as any)?.coverPhotos)]);

  // Scroll detection via IntersectionObserver: Pause when offscreen, Resume when onscreen
  useEffect(() => {
    const el = coverContainerRef.current;
    if (!el) return;
    try {
      if (typeof IntersectionObserver !== 'undefined') {
        const observer = new IntersectionObserver(
          ([entry]) => {
            setIsCoverInView(entry.isIntersecting && entry.intersectionRatio > 0.05);
          },
          { threshold: [0, 0.05, 0.2] }
        );
        observer.observe(el);
        return () => {
          try {
            observer.disconnect();
          } catch {
            // ignore
          }
        };
      }
    } catch {
      // ignore
    }
  }, []);

  // Auto Slideshow (~1s interval) only when >= 2 photos, in view, and not paused/lightbox
  useEffect(() => {
    if (coverPhotoList.length < 2 || !isCoverInView || isManualPaused || isLightboxOpen) {
      return;
    }
    const timer = setInterval(() => {
      setCurrentSlideIndex((prev) => (prev + 1) % coverPhotoList.length);
    }, 1200);
    return () => clearInterval(timer);
  }, [coverPhotoList.length, isCoverInView, isManualPaused, isLightboxOpen]);

  // Persist updated cover photos list to state, context and local cache
  const saveCoverPhotos = async (newPhotos: string[]) => {
    setCoverPhotoList(newPhotos);
    const primaryCover = newPhotos[0] || '';
    if (!shop) return;
    try {
      await updateShopProfile({
        coverPhotos: newPhotos,
        coverPhotoUrl: primaryCover,
      });
      try {
        const cached = localStorage.getItem(`seller_shop_cached_${shop.id}`);
        if (cached) {
          const parsed = JSON.parse(cached);
          parsed.coverPhotos = newPhotos;
          parsed.coverPhotoUrl = primaryCover;
          parsed.bannerUrl = primaryCover;
          parsed.bannerImageUrl = primaryCover;
          localStorage.setItem(`seller_shop_cached_${shop.id}`, JSON.stringify(parsed));
        }
      } catch (e) {}
    } catch (err: any) {
      console.warn('Cover photos update error:', err);
    }
  };

  // Upload handler for cover gallery slots (add or replace)
  const handleUploadCoverSlotPhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';

    if (!file.type.startsWith('image/')) {
      onShowToast?.('कृपया वैध इमेज फ़ाइल चुनें', 'error');
      targetCoverSlotIndexRef.current = null;
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      onShowToast?.('फोटो 5MB से कम होनी चाहिए', 'error');
      targetCoverSlotIndexRef.current = null;
      return;
    }

    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const base64 = reader.result as string;
        const targetIdx = targetCoverSlotIndexRef.current;
        const updated = [...coverPhotoList];

        if (targetIdx !== null && targetIdx < updated.length) {
          updated[targetIdx] = base64;
          setCurrentSlideIndex(targetIdx);
        } else {
          updated.push(base64);
          setCurrentSlideIndex(updated.length - 1);
        }

        await saveCoverPhotos(updated);
        onShowToast?.(
          isHindi
            ? 'कवर फोटो गैलरी सफलतापूर्वक अपडेट हो गई!'
            : 'Cover photo gallery updated successfully!'
        );
      } catch (err: any) {
        onShowToast?.(err?.message || 'फोटो अपडेट में त्रुटि', 'error');
      } finally {
        targetCoverSlotIndexRef.current = null;
      }
    };
    reader.readAsDataURL(file);
  };

  const handleAddPhotoSlotClick = (slotIdx: number) => {
    targetCoverSlotIndexRef.current = slotIdx;
    coverGallerySlotInputRef.current?.click();
  };

  const handleThumbnailClick = (slotIdx: number) => {
    setCurrentSlideIndex(slotIdx);
    setIsManualPaused(true);
  };

  const handleOpenSlotMenu = (slotIdx: number) => {
    setCurrentSlideIndex(slotIdx);
    setIsManualPaused(true);
    setActiveMenuSlotIndex(slotIdx);
  };

  const handleReplacePhoto = (slotIdx: number) => {
    setActiveMenuSlotIndex(null);
    targetCoverSlotIndexRef.current = slotIdx;
    coverGallerySlotInputRef.current?.click();
  };

  const handleDeletePhoto = (slotIdx: number) => {
    setActiveMenuSlotIndex(null);
    setPhotoToDeleteIndex(slotIdx);
  };

  const handleConfirmDelete = async () => {
    if (photoToDeleteIndex === null) return;
    const idx = photoToDeleteIndex;
    setPhotoToDeleteIndex(null);

    const updated = coverPhotoList.filter((_, i) => i !== idx);
    const finalPhotos =
      updated.length > 0
        ? updated
        : ['https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=1200&q=80'];

    await saveCoverPhotos(finalPhotos);
    setCurrentSlideIndex(0);
    onShowToast?.(
      isHindi
        ? `कवर फोटो #${idx + 1} हटा दी गई, स्लॉट खाली है`
        : `Cover photo #${idx + 1} removed, slot is empty`
    );
  };

  const handleMainChangeCoverClick = () => {
    const safeIdx = coverPhotoList.length > 0 ? (currentSlideIndex % coverPhotoList.length) : 0;
    targetCoverSlotIndexRef.current = safeIdx;
    coverGallerySlotInputRef.current?.click();
  };

  // QR Code Image Handler
  const handleUploadQrImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';

    if (!file.type.startsWith('image/')) {
      onShowToast?.('कृपया QR कोड की वैध इमेज चुनें', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      setUpiQrUrl(base64);
      onShowToast?.('UPI QR इमेज चुनी गई! सुरक्षित करने के लिए सेव दबाएँ।');
    };
    reader.readAsDataURL(file);
  };

  // Save All Changes to Backend
  const handleSaveAll = async () => {
    if (!shopName.trim()) {
      onShowToast?.('दुकान का नाम खाली नहीं हो सकता', 'error');
      return;
    }

    if (!pickupEnabled && !deliveryEnabled) {
      onShowToast?.('कम से कम एक सेवा (Pickup या Home Delivery) चालू रहनी चाहिए', 'error');
      return;
    }

    setIsSaving(true);
    setSaveSuccessNotice(false);

    try {
      const formattedAddress = `${streetAddress}, ${locality}, ${postOffice}, ${tehsil}, ${district}, ${stateName} - ${pincode}`;

      if (isShopVerified) {
        // Shop is verified by Admin:
        // Core identity/address/payout fields are locked by Admin and require Change Request.
        // We safely persist permitted operational settings directly: operatingHours and upiQrUrl
        await updateShopProfile({
          operatingHours: {
            openTime: openTime.trim(),
            closeTime: closeTime.trim(),
            openDays,
          },
          upiQrUrl: upiQrUrl || undefined,
        });

        // Update Fulfillment Settings
        await updateFulfillmentSettings({
          pickupEnabled,
          deliveryEnabled,
          deliveryFee: Number(deliveryFee),
          freeDeliveryThreshold: Number(freeDeliveryThreshold),
          maxDeliveryRadiusKm: Number(maxDistance),
        });

        setSaveSuccessNotice(true);
        onShowToast?.('कार्य समय व डिलीवरी सेटिंग्स सुरक्षित हो गईं! (सुरक्षित विवरण बदलने हेतु "Admin से बदलाव का अनुरोध" करें)', 'success');
        setTimeout(() => setSaveSuccessNotice(false), 5000);
      } else {
        // Shop is NOT verified yet: All profile fields can be saved directly
        await updateShopProfile({
          name: shopName.trim(),
          ownerName: ownerName.trim(),
          category,
          description: description.trim(),
          phone: phone.trim(),
          email: email.trim(),
          address: formattedAddress,
          coordinates,
          pincode: pincode.trim(),
          postalData: {
            state: stateName,
            district,
            tehsil,
            postOffice,
            locality,
          },
          whatsapp: whatsapp.trim(),
          upiPayoutId: upiId.trim(),
          paymentName: paymentName.trim(),
          upiQrUrl: upiQrUrl || undefined,
          operatingHours: {
            openTime: openTime.trim(),
            closeTime: closeTime.trim(),
            openDays,
          },
        });

        // Update Fulfillment Settings
        await updateFulfillmentSettings({
          pickupEnabled,
          deliveryEnabled,
          deliveryFee: Number(deliveryFee),
          freeDeliveryThreshold: Number(freeDeliveryThreshold),
          maxDeliveryRadiusKm: Number(maxDistance),
        });

        setSaveSuccessNotice(true);
        onShowToast?.('दुकान की सभी जानकारी सफलतापूर्वक सुरक्षित हो गई!', 'success');
        setTimeout(() => setSaveSuccessNotice(false), 4000);
      }
    } catch (err: any) {
      console.error('Save shop info error:', err);
      const userMessage = err?.message || 'जानकारी सुरक्षित करने में विफल';
      if (
        userMessage.includes('सत्यापित') ||
        userMessage.includes('सुरक्षित फ़ील्ड') ||
        userMessage.includes('403') ||
        userMessage.includes('FORBIDDEN')
      ) {
        try {
          await updateFulfillmentSettings({
            pickupEnabled,
            deliveryEnabled,
            deliveryFee: Number(deliveryFee),
            freeDeliveryThreshold: Number(freeDeliveryThreshold),
            maxDeliveryRadiusKm: Number(maxDistance),
          });
        } catch {
          // ignore
        }
      }
      onShowToast?.(userMessage, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const profilePhotoDisplay = shop?.profilePhotoUrl || shop?.photoUrl || (shop as any)?.logoImageUrl;
  const coverPhotoDisplay =
    shop?.coverPhotoUrl ||
    (shop as any)?.bannerUrl ||
    'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=1200&q=80';

  const safeSlideIndex = coverPhotoList.length > 0 ? currentSlideIndex % coverPhotoList.length : 0;
  const activeCoverPhoto = coverPhotoList[safeSlideIndex] || coverPhotoDisplay;
  const totalSlotsCount = Math.max(5, coverPhotoList.length + 1);
  const gallerySlots = Array.from({ length: totalSlotsCount }, (_, i) => coverPhotoList[i] || null);

  return (
    <div id="shop-information-full-screen" className="space-y-4 pb-12 animate-in fade-in duration-200">
      {/* Hidden File Pickers */}
      <input
        ref={profilePhotoInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => handleUploadPhoto('profile', e)}
      />
      <input
        ref={coverPhotoInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => handleUploadPhoto('cover', e)}
      />
      <input
        ref={coverGallerySlotInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleUploadCoverSlotPhoto}
      />
      <input
        ref={qrImageInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleUploadQrImage}
      />

      {/* Top Header Navigation Bar */}
      <div className="relative z-10 flex items-center justify-between bg-[#0b142c]/95 backdrop-blur-md p-3 sm:p-4 rounded-2xl border border-cyan-500/30 shadow-[0_4px_25px_rgba(0,0,0,0.7)] mb-2">
        <div className="flex items-center space-x-2 sm:space-x-3 min-w-0">
          <button
            id="btn-back-to-profile-menu"
            type="button"
            onClick={onBack}
            className="p-2 rounded-xl bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 hover:text-white hover:bg-cyan-900 transition cursor-pointer flex items-center gap-1 text-xs font-bold shrink-0"
            title={isHindi ? 'वापस जाएं (Back)' : 'Back'}
          >
            <ChevronLeft className="w-4 h-4 stroke-[2.5]" />
            <span>{isHindi ? 'वापस' : 'Back'}</span>
          </button>
          <div className="min-w-0">
            <h1 className="text-sm sm:text-base font-black text-white flex items-center gap-1.5 truncate">
              <span>🏪</span>
              <span>{isHindi ? 'दुकान जानकारी विस्तृत संपादक' : 'Shop Information Detailed Editor'}</span>
            </h1>
            <p className="text-[10px] sm:text-[11px] text-cyan-300/70 truncate">
              {isHindi
                ? 'पहचान • पता • GPS लोकेशन • समय • डिलीवरी • UPI • सत्यापन'
                : 'Identity • Address • GPS Location • Timings • Delivery • UPI • Verification'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            id="btn-top-save-shop-info"
            type="button"
            disabled={isSaving}
            onClick={handleSaveAll}
            className="py-2 px-3 sm:px-3.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-extrabold text-xs flex items-center gap-1.5 shadow-[0_0_15px_rgba(6,182,212,0.3)] transition cursor-pointer active:scale-95 disabled:opacity-50 shrink-0"
          >
            {isSaving ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Save className="w-3.5 h-3.5 stroke-[2.5]" />
            )}
            <span>{isHindi ? 'सेव करें' : 'Save'}</span>
          </button>
          {onClose && (
            <button
              id="btn-top-close-shop-info"
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-400 hover:text-white hover:border-cyan-500/40 transition cursor-pointer shrink-0"
              title={isHindi ? 'बंद करें (Close)' : 'Close'}
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Floating Save Notice */}
      {saveSuccessNotice && (
        <div className="p-3 rounded-2xl bg-emerald-950/90 border border-emerald-500/50 text-emerald-200 text-xs font-bold flex items-center gap-2 shadow-[0_0_20px_rgba(16,185,129,0.3)] animate-in slide-in-from-top-2 duration-150">
          <Check className="w-4 h-4 text-emerald-400 shrink-0 stroke-[3]" />
          <span>{isHindi ? 'दुकान की सभी जानकारी सफलतापूर्वक सुरक्षित कर ली गई है! ✓' : 'All shop information has been successfully saved! ✓'}</span>
        </div>
      )}

      {/* Verification Governance Status Banner */}
      {isShopVerified ? (
        <div className="p-3.5 rounded-2xl bg-emerald-950/40 border border-emerald-500/40 shadow-[0_0_15px_rgba(16,185,129,0.1)] flex items-start gap-3">
          <div className="w-8 h-8 rounded-xl bg-emerald-950 border border-emerald-500/60 flex items-center justify-center text-emerald-300 shrink-0 mt-0.5">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-black text-emerald-300">
                {isHindi ? '🛡️ अधिकृत रूप से सत्यापित दुकान (Verified Store)' : '🛡️ Officially Verified Store'}
              </span>
              <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                {isHindi ? '🔒 विवरण सुरक्षित (Locked)' : '🔒 Details Locked'}
              </span>
            </div>
            <p className="text-[11px] text-slate-300 mt-1 leading-relaxed">
              {isHindi ? (
                <>
                  दुकान की पहचान, श्रेणी, पता, जीपीएस लोकेशन व UPI आईडी आधिकारिक रूप से सत्यापित हैं। सुरक्षा व विश्वसनीयता बनाए रखने हेतु इनमें सीधे बदलाव की अनुमति नहीं है। बदलाव करने के लिए आप संबंधित फ़ील्ड के पास <strong className="text-cyan-300">"बदलाव अनुरोध"</strong> बटन पर टैप कर सकते हैं।
                </>
              ) : (
                <>
                  Shop identity, category, address, GPS location, and UPI ID are officially verified. For security and trust, direct edits are locked. You may tap the <strong className="text-cyan-300">"Request Change"</strong> button next to each field to request updates.
                </>
              )}
            </p>
          </div>
        </div>
      ) : (
        <div className="p-3.5 rounded-2xl bg-amber-950/40 border border-amber-500/40 shadow-[0_0_15px_rgba(245,158,11,0.1)] flex items-start gap-3">
          <div className="w-8 h-8 rounded-xl bg-amber-950 border border-amber-500/60 flex items-center justify-center text-amber-300 shrink-0 mt-0.5">
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-black text-amber-300">
                {isHindi ? '⏳ दुकान सत्यापन समीक्षाधीन (Verification in Progress)' : '⏳ Verification in Progress'}
              </span>
              <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                {isHindi ? 'एडमिन समीक्षा' : 'Admin Review'}
              </span>
            </div>
            <p className="text-[11px] text-slate-300 mt-1 leading-relaxed">
              {isHindi
                ? 'आपकी दुकान का पंजीकरण एडमिन सत्यापन प्रक्रिया में है। सत्यापन पूर्ण होने तक आप सीधे सभी जानकारी भर व अपडेट कर सकते हैं।'
                : 'Your shop registration is under admin review. Until verification is complete, you can edit and update all details directly.'}
            </p>
          </div>
        </div>
      )}

      {/* Active Pending Change Request Banner */}
      {pendingRequest && (
        <div className="p-3.5 rounded-2xl bg-blue-950/60 border border-cyan-500/50 shadow-[0_0_20px_rgba(6,182,212,0.15)] flex items-start justify-between gap-3">
          <div className="flex items-start space-x-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-cyan-950 border border-cyan-400/60 flex items-center justify-center text-cyan-300 shrink-0 mt-0.5">
              <Clock className="w-4 h-4 text-cyan-400 animate-pulse" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-black text-cyan-200">
                  {isHindi ? '📝 सक्रिय बदलाव अनुरोध (Change Request Under Review)' : '📝 Active Change Request Under Review'}
                </span>
                <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                  {isHindi ? 'पेंडिंग (Pending)' : 'Pending'}
                </span>
              </div>
              <p className="text-[11px] text-slate-200 mt-1">
                <strong>{isHindi ? 'फ़ील्ड:' : 'Field:'}</strong> {pendingRequest.fieldLabel || pendingRequest.field} •{' '}
                <strong>{isHindi ? 'प्रस्तावित मान:' : 'Proposed Value:'}</strong>{' '}
                <span className="text-cyan-300 font-medium">
                  {typeof pendingRequest.proposedValue === 'object'
                    ? JSON.stringify(pendingRequest.proposedValue)
                    : String(pendingRequest.proposedValue)}
                </span>
              </p>
              {pendingRequest.reason && (
                <p className="text-[10px] text-slate-400 mt-0.5 italic">
                  {isHindi ? 'कारण:' : 'Reason:'} "{pendingRequest.reason}"
                </p>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={() => handleOpenChangeModal(pendingRequest.field as any)}
            className="px-2.5 py-1.5 rounded-xl bg-cyan-950 hover:bg-cyan-900 border border-cyan-400 text-cyan-200 text-[11px] font-bold shrink-0 cursor-pointer"
          >
            {isHindi ? 'विवरण देखें' : 'View Details'}
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION 1 — 🏪 दुकान का मूल विवरण                                          */}
      {/* ========================================================================= */}
      <div className="rounded-3xl bg-[#0b142c] border border-cyan-500/25 p-4 sm:p-5 space-y-4 shadow-[0_0_20px_rgba(6,182,212,0.08)]">
        <div className="flex items-center space-x-2 border-b border-cyan-500/20 pb-2.5">
          <Store className="w-4 h-4 text-cyan-400" />
          <h2 className="text-xs sm:text-sm font-black text-white uppercase tracking-wider">
            {isHindi ? 'SECTION 1 — 🏪 दुकान का मूल विवरण' : 'SECTION 1 — 🏪 Basic Shop Details'}
          </h2>
        </div>

        {/* Main Cover Photo Area with Auto-Slideshow & Scroll Pause */}
        <div
          ref={coverContainerRef}
          onClick={() => {
            setIsManualPaused(true);
            setIsLightboxOpen(true);
          }}
          className="relative w-full h-36 sm:h-44 rounded-2xl overflow-hidden bg-[#070e24] border border-cyan-500/30 cursor-pointer group select-none"
          title={isHindi ? 'बड़ा देखने के लिए टैप करें' : 'Tap to view full screen'}
        >
          <img
            key={activeCoverPhoto}
            src={activeCoverPhoto}
            alt="Cover Preview"
            className="w-full h-full object-cover select-none transition-opacity duration-300"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/30 pointer-events-none" />

          {/* Top-Right: Keep the exact "कवर बदलें" button */}
          <div className="absolute top-2.5 right-2.5 z-20">
            <button
              id="btn-change-cover-photo-identity"
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleMainChangeCoverClick();
              }}
              className="px-3 py-1.5 rounded-xl bg-slate-950/90 hover:bg-black text-cyan-300 border border-cyan-400/50 text-[11px] font-extrabold flex items-center gap-1.5 shadow-lg backdrop-blur-md cursor-pointer transition active:scale-95"
            >
              <Camera className="w-3.5 h-3.5 text-cyan-400" />
              <span>{isHindi ? 'कवर बदलें' : 'Change Cover'}</span>
            </button>
          </div>

          {/* Top-Left: Multi-photo Indicator & Play/Pause (when >1 photo) */}
          {coverPhotoList.length > 1 && (
            <div className="absolute top-2.5 left-2.5 z-20 flex items-center gap-1.5">
              <span className="px-2 py-1 rounded-lg bg-black/75 backdrop-blur-md text-cyan-300 border border-cyan-500/40 text-[10px] font-black tracking-wider flex items-center gap-1 shadow">
                <span>{safeSlideIndex + 1}</span>
                <span className="text-cyan-500">/</span>
                <span>{coverPhotoList.length}</span>
              </span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsManualPaused((prev) => !prev);
                }}
                className="p-1 rounded-lg bg-black/75 backdrop-blur-md text-cyan-300 border border-cyan-500/40 hover:bg-black transition cursor-pointer shadow"
                title={isManualPaused ? (isHindi ? 'स्लाइड चालू करें' : 'Play') : (isHindi ? 'रोकें' : 'Pause')}
              >
                {isManualPaused ? (
                  <Play className="w-3 h-3 text-emerald-400 fill-emerald-400" />
                ) : (
                  <Pause className="w-3 h-3 text-amber-400 fill-amber-400" />
                )}
              </button>
            </div>
          )}

          {/* Bottom-Right: Quick Fullscreen hint */}
          <div className="absolute bottom-2.5 right-2.5 z-10 pointer-events-none">
            <span className="px-2 py-1 rounded-lg bg-black/70 backdrop-blur-xs text-[10px] font-bold text-cyan-300/90 border border-cyan-500/30 flex items-center gap-1 opacity-85 group-hover:opacity-100 transition">
              <Eye className="w-3 h-3 text-cyan-400" />
              <span>{isHindi ? 'बड़ा देखें' : 'View'}</span>
            </span>
          </div>

          {/* Bottom-Left: Shop Name Overlay */}
          <div className="absolute bottom-2.5 left-3 z-10 pointer-events-none">
            <span className="text-[10px] font-bold text-cyan-300 uppercase tracking-wider block">
              {isHindi ? 'दुकान कवर फोटो' : 'Shop Cover Photo'}
            </span>
            <span className="text-sm font-black text-white drop-shadow truncate block max-w-xs">
              {shopName || (isHindi ? 'दुकान का नाम' : 'Shop Name')}
            </span>
          </div>
        </div>

        {/* Cover Photo Gallery Slots */}
        <div className="space-y-1.5 pt-0.5">
          <div className="flex items-center justify-between px-0.5">
            <span className="text-[11px] font-extrabold text-cyan-300 flex items-center gap-1.5">
              <span>🖼️</span>
              <span>{isHindi ? 'कवर फोटो गैलरी' : 'Cover Photo Gallery'}</span>
              <span className="text-[10px] font-normal text-slate-400">
                ({coverPhotoList.length} {isHindi ? 'फोटो' : 'photos'} • {isHindi ? 'स्लाइड ~1s' : 'slide ~1s'})
              </span>
            </span>
            {coverPhotoList.length > 1 && (
              <span className="text-[10px] font-semibold text-cyan-400/80">
                {isManualPaused
                  ? (isHindi ? '⏸ रुका हुआ' : '⏸ Paused')
                  : (isHindi ? '▶ ऑटो स्लाइड' : '▶ Auto-slide')}
              </span>
            )}
          </div>

          {/* Horizontal scrollable slots */}
          <div className="flex items-center gap-2.5 overflow-x-auto pb-1.5 pt-1 px-1 no-scrollbar max-w-full">
            {gallerySlots.map((photoUrl, slotIdx) => {
              const hasPhoto = Boolean(photoUrl);
              const isActive = hasPhoto && slotIdx === safeSlideIndex;

              if (hasPhoto && photoUrl) {
                return (
                  <div
                    key={`cover-slot-${slotIdx}`}
                    onClick={() => handleThumbnailClick(slotIdx)}
                    className={`relative w-14 h-14 sm:w-16 sm:h-16 rounded-xl overflow-hidden shrink-0 border-2 cursor-pointer transition-all active:scale-95 group ${
                      isActive
                        ? 'border-cyan-400 ring-2 ring-cyan-400/60 shadow-[0_0_12px_rgba(6,182,212,0.6)] scale-102'
                        : 'border-cyan-500/30 hover:border-cyan-400/70 opacity-80 hover:opacity-100'
                    }`}
                    title={isHindi ? `कवर फोटो #${slotIdx + 1}` : `Cover Photo #${slotIdx + 1}`}
                  >
                    <img
                      src={photoUrl}
                      alt={`Cover thumbnail ${slotIdx + 1}`}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                    {/* Index Tag */}
                    <span className="absolute top-1 left-1 px-1 py-0.2 rounded bg-black/80 text-[9px] font-black text-cyan-300 pointer-events-none">
                      #{slotIdx + 1}
                    </span>

                    {/* Quick Menu Button (Replace / Delete) */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenSlotMenu(slotIdx);
                      }}
                      className="absolute bottom-1 right-1 p-1 rounded-md bg-black/80 hover:bg-cyan-900 text-cyan-300 border border-cyan-400/40 shadow text-[9px] flex items-center justify-center transition cursor-pointer"
                      title={isHindi ? 'बदलें / हटाएं' : 'Replace / Delete'}
                    >
                      <RefreshCw className="w-2.5 h-2.5" />
                    </button>
                  </div>
                );
              }

              // Empty Slot with "+"
              return (
                <button
                  key={`cover-slot-empty-${slotIdx}`}
                  type="button"
                  onClick={() => handleAddPhotoSlotClick(slotIdx)}
                  className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl border-2 border-dashed border-cyan-500/40 hover:border-cyan-400 bg-[#070e24]/70 hover:bg-cyan-950/40 flex flex-col items-center justify-center shrink-0 cursor-pointer transition active:scale-95 group text-cyan-400 hover:text-cyan-200"
                  title={isHindi ? `खाली स्लॉट #${slotIdx + 1}: फोटो जोड़ें` : `Empty Slot #${slotIdx + 1}: Add photo`}
                >
                  <Plus className="w-5 h-5 group-hover:scale-110 transition-transform stroke-[2.5]" />
                  <span className="text-[9px] font-extrabold text-cyan-400/80 group-hover:text-cyan-300 mt-0.5">
                    +{slotIdx + 1}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Profile Photo with single "बदलें" control */}
        <div className="flex items-center gap-3.5 p-3 rounded-2xl bg-[#070e24] border border-cyan-500/20">
          <div className="relative shrink-0">
            <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-cyan-400 bg-cyan-950/70 shadow-[0_0_12px_rgba(6,182,212,0.4)] flex items-center justify-center">
              {profilePhotoDisplay ? (
                <img
                  src={profilePhotoDisplay}
                  alt={shopName}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <Store className="w-8 h-8 text-cyan-400" />
              )}
            </div>
            <button
              id="btn-change-profile-photo-identity"
              type="button"
              onClick={() => profilePhotoInputRef.current?.click()}
              className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-cyan-500 text-slate-950 flex items-center justify-center shadow-md border-2 border-[#070e24] cursor-pointer hover:bg-cyan-400 transition active:scale-90"
              title={isHindi ? 'प्रोफाइल फोटो बदलें' : 'Change Profile Photo'}
            >
              <Camera className="w-3 h-3 stroke-[2.5]" />
            </button>
          </div>

          <div className="min-w-0 flex-1">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wide block">
              {isHindi ? 'दुकान प्रोफाइल फोटो' : 'Shop Profile Photo'}
            </span>
            <p className="text-xs text-slate-200 mt-0.5">
              {isHindi
                ? 'ग्राहकों को सर्च और लिस्टिंग में यह फोटो दिखाई देगी।'
                : 'Customers will see this photo in search and store listings.'}
            </p>
            <button
              type="button"
              onClick={() => profilePhotoInputRef.current?.click()}
              className="mt-1 text-[11px] font-bold text-cyan-400 hover:text-cyan-300 underline cursor-pointer"
            >
              {isHindi ? 'फोटो बदलें' : 'Change Photo'}
            </button>
          </div>
        </div>

        {/* दुकान का नाम */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <span>{isHindi ? 'दुकान का नाम' : 'Shop Name'}</span>
              <span className="text-rose-400">*</span>
              {isShopVerified && (
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                  <Lock className="w-2.5 h-2.5" />
                  <span>{isHindi ? 'सत्यापित (Locked)' : 'Verified (Locked)'}</span>
                </span>
              )}
            </label>
            {isShopVerified && (
              <button
                type="button"
                onClick={() => handleOpenChangeModal('name')}
                className="text-[11px] font-bold text-cyan-400 hover:text-cyan-300 flex items-center gap-1 underline cursor-pointer"
              >
                <Lock className="w-3 h-3 text-amber-400" />
                <span>{isHindi ? 'बदलाव अनुरोध' : 'Request Change'}</span>
              </button>
            )}
          </div>
          <div className="relative">
            <input
              id="input-identity-shop-name"
              type="text"
              disabled={isShopVerified}
              value={shopName}
              onChange={(e) => setShopName(e.target.value)}
              placeholder={isHindi ? 'उदा. श्री कृष्णा किराना एवं जनरल स्टोर' : 'e.g. Shri Krishna Kirana & General Store'}
              className={`w-full px-3 py-2 rounded-xl text-xs font-semibold focus:outline-none transition ${
                isShopVerified
                  ? 'bg-slate-900/80 border border-slate-700/70 text-slate-300 cursor-not-allowed pr-9'
                  : 'bg-[#070e24] border border-cyan-500/30 text-white focus:border-cyan-400'
              }`}
            />
            {isShopVerified && (
              <div className="absolute right-3 top-2.5 text-amber-400" title={isHindi ? 'यह फ़ील्ड एडमिन द्वारा सत्यापित है' : 'This field is verified by Admin'}>
                <Lock className="w-3.5 h-3.5" />
              </div>
            )}
          </div>
        </div>

        {/* दुकान का प्रकार / Category */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <span>{isHindi ? 'दुकान का प्रकार / Category' : 'Shop Category'}</span>
              {isShopVerified && (
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                  <Lock className="w-2.5 h-2.5" />
                  <span>{isHindi ? 'सत्यापित (Locked)' : 'Verified (Locked)'}</span>
                </span>
              )}
            </label>
            {isShopVerified && (
              <button
                type="button"
                onClick={() => handleOpenChangeModal('category')}
                className="text-[11px] font-bold text-cyan-400 hover:text-cyan-300 flex items-center gap-1 underline cursor-pointer"
              >
                <Lock className="w-3 h-3 text-amber-400" />
                <span>{isHindi ? 'बदलाव अनुरोध' : 'Request Change'}</span>
              </button>
            )}
          </div>
          <div className="relative">
            <select
              id="select-identity-category"
              disabled={isShopVerified}
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className={`w-full px-3 py-2 rounded-xl text-xs font-semibold focus:outline-none transition ${
                isShopVerified
                  ? 'bg-slate-900/80 border border-slate-700/70 text-slate-300 cursor-not-allowed pr-9'
                  : 'bg-[#070e24] border border-cyan-500/30 text-cyan-200 focus:border-cyan-400 cursor-pointer'
              }`}
            >
              {SHOP_CATEGORIES.map((cat, i) => (
                <option key={i} value={cat} className="bg-[#0b142c] text-white">
                  {cat}
                </option>
              ))}
            </select>
            {isShopVerified && (
              <div className="absolute right-8 top-2.5 text-amber-400 pointer-events-none" title={isHindi ? 'यह फ़ील्ड एडमिन द्वारा सत्यापित है' : 'This field is verified by Admin'}>
                <Lock className="w-3.5 h-3.5" />
              </div>
            )}
          </div>
        </div>

        {/* दुकानदार / Shop Owner Name */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <span>{isHindi ? 'दुकानदार / Shop Owner Name' : 'Shop Owner Name'}</span>
              {isShopVerified && (
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                  <Lock className="w-2.5 h-2.5" />
                  <span>{isHindi ? 'सत्यापित (Locked)' : 'Verified (Locked)'}</span>
                </span>
              )}
            </label>
            {isShopVerified && (
              <button
                type="button"
                onClick={() => handleOpenChangeModal('ownerName' as any)}
                className="text-[11px] font-bold text-cyan-400 hover:text-cyan-300 flex items-center gap-1 underline cursor-pointer"
              >
                <Lock className="w-3 h-3 text-amber-400" />
                <span>{isHindi ? 'बदलाव अनुरोध' : 'Request Change'}</span>
              </button>
            )}
          </div>
          <div className="relative">
            <input
              id="input-identity-owner-name"
              type="text"
              disabled={isShopVerified}
              value={ownerName}
              onChange={(e) => setOwnerName(e.target.value)}
              placeholder={isHindi ? 'उदा. राजेश कुमार' : 'e.g. Rajesh Kumar'}
              className={`w-full px-3 py-2 rounded-xl text-xs font-semibold focus:outline-none transition ${
                isShopVerified
                  ? 'bg-slate-900/80 border border-slate-700/70 text-slate-300 cursor-not-allowed pr-9'
                  : 'bg-[#070e24] border border-cyan-500/30 text-white focus:border-cyan-400'
              }`}
            />
            {isShopVerified && (
              <div className="absolute right-3 top-2.5 text-amber-400" title={isHindi ? 'यह फ़ील्ड एडमिन द्वारा सत्यापित है' : 'This field is verified by Admin'}>
                <Lock className="w-3.5 h-3.5" />
              </div>
            )}
          </div>
        </div>

        {/* दुकान का छोटा परिचय */}
        <div>
          <label className="block text-xs font-bold text-slate-300 mb-1">
            {isHindi ? 'दुकान का छोटा परिचय (Short Description)' : 'Short Description'}
          </label>
          <textarea
            id="textarea-identity-description"
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={isHindi ? 'दुकान के खास सामान, गुणवत्ता और सेवा के बारे में संक्षिप्त विवरण...' : 'Brief description of special products, quality, and service...'}
            className="w-full px-3 py-2 bg-[#070e24] border border-cyan-500/30 rounded-xl text-slate-200 text-xs leading-relaxed focus:outline-none focus:border-cyan-400"
          />
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SECTION 2 — 📍 दुकान का पूरा पता                                            */}
      {/* ========================================================================= */}
      <div className="rounded-3xl bg-[#0b142c] border border-cyan-500/25 p-4 sm:p-5 space-y-4 shadow-[0_0_20px_rgba(6,182,212,0.08)]">
        <div className="flex items-center justify-between border-b border-cyan-500/20 pb-2.5">
          <div className="flex items-center space-x-2">
            <MapPin className="w-4 h-4 text-cyan-400" />
            <h2 className="text-xs sm:text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
              <span>{isHindi ? 'SECTION 2 — 📍 दुकान का पूरा पता' : 'SECTION 2 — 📍 Full Shop Address'}</span>
              {isShopVerified && (
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                  <Lock className="w-2.5 h-2.5" />
                  <span>{isHindi ? 'सत्यापित (Locked)' : 'Verified (Locked)'}</span>
                </span>
              )}
            </h2>
          </div>

          {isShopVerified && (
            <button
              type="button"
              onClick={() => handleOpenChangeModal('address')}
              className="text-[11px] font-bold text-cyan-400 hover:text-cyan-300 flex items-center gap-1 underline cursor-pointer shrink-0"
            >
              <Lock className="w-3 h-3 text-amber-400" />
              <span>{isHindi ? 'पता बदलने का अनुरोध' : 'Request Address Change'}</span>
            </button>
          )}
        </div>

        {/* PIN Code with reliable Indian Postal lookup */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <span>PIN Code</span>
              <span className="text-rose-400">*</span>
              {isShopVerified && (
                <span className="text-[10px] text-amber-300 font-normal">
                  ({isHindi ? 'एडमिन सत्यापित' : 'Admin Verified'})
                </span>
              )}
            </label>
            {isLookingUpPin && !isShopVerified && (
              <span className="text-[10px] text-cyan-300 flex items-center gap-1 font-mono">
                <Loader2 className="w-3 h-3 animate-spin" />
                <span>{isHindi ? 'पोस्टल डेटा खोज रहे हैं...' : 'Looking up postal data...'}</span>
              </span>
            )}
          </div>
          <div className="relative">
            <input
              id="input-address-pincode"
              type="text"
              maxLength={6}
              disabled={isShopVerified}
              value={pincode}
              onChange={(e) => setPincode(e.target.value.replace(/\D/g, ''))}
              placeholder="302004"
              className={`w-full px-3 py-2 rounded-xl font-mono text-xs font-bold tracking-widest focus:outline-none transition ${
                isShopVerified
                  ? 'bg-slate-900/80 border border-slate-700/70 text-slate-300 cursor-not-allowed pr-16'
                  : 'bg-[#070e24] border border-cyan-500/30 text-white focus:border-cyan-400 pr-16'
              }`}
            />
            <div className="absolute right-3 top-2 flex items-center gap-1.5">
              {isShopVerified && <Lock className="w-3.5 h-3.5 text-amber-400" />}
              <span className="text-[10px] text-slate-400 font-mono font-bold">
                IN POST
              </span>
            </div>
          </div>
          {pinValidationMessage && !isShopVerified && (
            <p className="text-[11px] text-amber-300 mt-1.5 flex items-center gap-1 font-medium">
              <AlertCircle className="w-3.5 h-3.5 shrink-0 text-amber-400" />
              <span>{pinValidationMessage}</span>
            </p>
          )}
        </div>

        {/* Auto-filled & postal Details */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
          {/* राज्य */}
          <div>
            <label className="block text-[10px] text-slate-400 font-bold mb-0.5">
              {isHindi ? 'राज्य (State):' : 'State:'}
            </label>
            <input
              type="text"
              disabled={isShopVerified}
              value={stateName}
              onChange={(e) => setStateName(e.target.value)}
              placeholder={isHindi ? 'राजस्थान' : 'Rajasthan'}
              className={`w-full px-2.5 py-1.5 rounded-xl text-xs font-semibold focus:outline-none transition ${
                isShopVerified
                  ? 'bg-slate-900/80 border border-slate-700/70 text-slate-300 cursor-not-allowed'
                  : 'bg-[#070e24] border border-cyan-500/20 text-white focus:border-cyan-400'
              }`}
            />
          </div>

          {/* जिला */}
          <div>
            <label className="block text-[10px] text-slate-400 font-bold mb-0.5">
              {isHindi ? 'जिला (District):' : 'District:'}
            </label>
            <input
              type="text"
              disabled={isShopVerified}
              value={district}
              onChange={(e) => setDistrict(e.target.value)}
              placeholder={isHindi ? 'जयपुर' : 'Jaipur'}
              className={`w-full px-2.5 py-1.5 rounded-xl text-xs font-semibold focus:outline-none transition ${
                isShopVerified
                  ? 'bg-slate-900/80 border border-slate-700/70 text-slate-300 cursor-not-allowed'
                  : 'bg-[#070e24] border border-cyan-500/20 text-white focus:border-cyan-400'
              }`}
            />
          </div>

          {/* तहसील */}
          <div>
            <label className="block text-[10px] text-slate-400 font-bold mb-0.5">
              {isHindi ? 'तहसील (Tehsil / Taluk):' : 'Tehsil / Taluk:'}
            </label>
            <input
              type="text"
              disabled={isShopVerified}
              value={tehsil}
              onChange={(e) => setTehsil(e.target.value)}
              placeholder={isHindi ? 'जयपुर' : 'Jaipur'}
              className={`w-full px-2.5 py-1.5 rounded-xl text-xs font-semibold focus:outline-none transition ${
                isShopVerified
                  ? 'bg-slate-900/80 border border-slate-700/70 text-slate-300 cursor-not-allowed'
                  : 'bg-[#070e24] border border-cyan-500/20 text-white focus:border-cyan-400'
              }`}
            />
          </div>

          {/* पोस्ट ऑफिस */}
          <div>
            <label className="block text-[10px] text-slate-400 font-bold mb-0.5">
              {isHindi ? 'पोस्ट ऑफिस (Post Office):' : 'Post Office:'}
            </label>
            <input
              type="text"
              disabled={isShopVerified}
              value={postOffice}
              onChange={(e) => setPostOffice(e.target.value)}
              placeholder={isHindi ? 'राजा पार्क SO' : 'Raja Park SO'}
              className={`w-full px-2.5 py-1.5 rounded-xl text-xs font-semibold focus:outline-none transition ${
                isShopVerified
                  ? 'bg-slate-900/80 border border-slate-700/70 text-slate-300 cursor-not-allowed'
                  : 'bg-[#070e24] border border-cyan-500/20 text-white focus:border-cyan-400'
              }`}
            />
          </div>

          {/* क्षेत्र / Locality */}
          <div className="sm:col-span-2">
            <label className="block text-[10px] text-slate-400 font-bold mb-0.5">
              {isHindi ? 'क्षेत्र / Locality / मंडी नाम:' : 'Locality / Area / Market Name:'}
            </label>
            <input
              type="text"
              disabled={isShopVerified}
              value={locality}
              onChange={(e) => setLocality(e.target.value)}
              placeholder={isHindi ? 'राजा पार्क मुख्य फल व सब्जी मंडी' : 'Raja Park Main Market'}
              className={`w-full px-2.5 py-1.5 rounded-xl text-xs font-semibold focus:outline-none transition ${
                isShopVerified
                  ? 'bg-slate-900/80 border border-slate-700/70 text-slate-300 cursor-not-allowed'
                  : 'bg-[#070e24] border border-cyan-500/20 text-cyan-200 focus:border-cyan-400'
              }`}
            />
          </div>

          {/* दुकान संख्या / स्ट्रीट पता */}
          <div className="sm:col-span-2">
            <label className="block text-[10px] text-slate-400 font-bold mb-0.5">
              {isHindi ? 'दुकान संख्या, ब्लॉक व लैंडमार्क:' : 'Shop No., Block & Landmark:'}
            </label>
            <input
              type="text"
              disabled={isShopVerified}
              value={streetAddress}
              onChange={(e) => setStreetAddress(e.target.value)}
              placeholder={isHindi ? 'दुकान संख्या 42, ब्लॉक B, मुख्य मंडी चौराहा' : 'Shop No. 42, Block B, Main Market'}
              className={`w-full px-2.5 py-1.5 rounded-xl text-xs font-semibold focus:outline-none transition ${
                isShopVerified
                  ? 'bg-slate-900/80 border border-slate-700/70 text-slate-300 cursor-not-allowed'
                  : 'bg-[#070e24] border border-cyan-500/20 text-white focus:border-cyan-400'
              }`}
            />
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SECTION 3 — 🗺️ दुकान की Google Map / GPS Location                          */}
      {/* ========================================================================= */}
      <div className="rounded-3xl bg-[#0b142c] border border-cyan-500/25 p-4 sm:p-5 space-y-4 shadow-[0_0_20px_rgba(6,182,212,0.08)]">
        <div className="flex items-center justify-between border-b border-cyan-500/20 pb-2.5">
          <div className="flex items-center space-x-2">
            <Navigation className="w-4 h-4 text-cyan-400" />
            <h2 className="text-xs sm:text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
              <span>{isHindi ? 'SECTION 3 — 🗺️ दुकान की Google Map / GPS Location' : 'SECTION 3 — 🗺️ Google Map / GPS Location'}</span>
              {isShopVerified && (
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                  <Lock className="w-2.5 h-2.5" />
                  <span>{isHindi ? 'सत्यापित GPS' : 'Verified GPS'}</span>
                </span>
              )}
            </h2>
          </div>

          {isShopVerified && (
            <button
              id="btn-request-location-change"
              type="button"
              onClick={() => handleOpenChangeModal('coordinates')}
              className="text-[11px] font-bold text-amber-300 hover:text-amber-200 flex items-center gap-1 underline cursor-pointer shrink-0"
            >
              <Lock className="w-3 h-3 text-amber-400" />
              <span>{isHindi ? 'GPS बदलने का अनुरोध' : 'Request GPS Change'}</span>
            </button>
          )}
        </div>

        {/* Live GPS Coordinates Card */}
        <div className="p-3.5 rounded-2xl bg-[#070e24] border border-cyan-500/30 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-cyan-950/80 border border-cyan-500/50 flex items-center justify-center text-cyan-300 shrink-0">
                <MapPin className="w-5 h-5 stroke-[2.5]" />
              </div>
              <div>
                <span className="text-xs font-black text-white flex items-center gap-1.5">
                  <span>{isHindi ? 'वर्तमान GPS Location' : 'Current GPS Location'}</span>
                  {gpsAccuracy && (
                    <span className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-cyan-950 text-cyan-300 border border-cyan-500/40">
                      ±{gpsAccuracy} {isHindi ? 'मी. सटीकता' : 'm accuracy'}
                    </span>
                  )}
                </span>
                <div className="text-xs font-mono font-bold text-cyan-300 mt-0.5">
                  Latitude: {coordinates.lat.toFixed(6)} | Longitude: {coordinates.lng.toFixed(6)}
                </div>
              </div>
            </div>

            {/* Quick Location Actions */}
            <div className="flex items-center gap-2 flex-wrap">
              <button
                id="btn-get-current-device-gps"
                type="button"
                disabled={isDetectingGps || isShopVerified}
                onClick={handleGetCurrentGps}
                className={`py-2 px-3 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition cursor-pointer active:scale-95 shrink-0 ${
                  isShopVerified
                    ? 'bg-slate-900 border border-slate-700 text-slate-400 cursor-not-allowed'
                    : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-[0_0_12px_rgba(16,185,129,0.3)]'
                }`}
                title={isHindi ? 'डिवाइस के हार्डवेयर GPS से वास्तविक लोकेशन प्राप्त करें' : 'Get actual location from device hardware GPS'}
              >
                {isDetectingGps ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Navigation className="w-3.5 h-3.5" />
                )}
                <span>{isHindi ? '📍 मेरी वर्तमान Location लें' : '📍 Use My Current Location'}</span>
              </button>

              <button
                id="btn-open-google-maps-picker"
                type="button"
                onClick={() => setIsMapModalOpen(true)}
                className="py-2 px-3 rounded-xl bg-cyan-950 hover:bg-cyan-900 border border-cyan-400 text-cyan-200 text-xs font-extrabold flex items-center gap-1.5 shadow-[0_0_12px_rgba(6,182,212,0.25)] transition cursor-pointer active:scale-95 shrink-0"
              >
                <MapPin className="w-3.5 h-3.5 text-cyan-400" />
                <span>{isHindi ? '🗺️ पिन ड्रैग / सेट करें' : '🗺️ Drag / Set Pin'}</span>
              </button>
            </div>
          </div>

          {/* GPS Feedback Status Message */}
          {gpsStatusMsg && (
            <p className="text-[11px] font-mono text-cyan-300 bg-cyan-950/40 p-2 rounded-lg border border-cyan-500/20">
              {gpsStatusMsg}
            </p>
          )}

          {/* Interactive Map Visual Preview */}
          <div className="relative w-full h-44 rounded-xl overflow-hidden border border-cyan-500/30 bg-[#050b18]">
            <iframe
              title={isHindi ? 'दुकान लोकेशन मैप प्रीव्यू' : 'Shop Location Map Preview'}
              width="100%"
              height="100%"
              style={{ border: 0 }}
              loading="lazy"
              src={`https://maps.google.com/maps?q=${coordinates.lat},${coordinates.lng}&z=16&output=embed`}
            />
            <div className="absolute top-2 left-2 px-2.5 py-1 rounded-lg bg-black/80 backdrop-blur-md border border-cyan-500/40 text-[10px] text-cyan-300 font-mono font-bold flex items-center gap-1">
              <span>📍 {isHindi ? 'पिन:' : 'Pin:'} {coordinates.lat.toFixed(5)}, {coordinates.lng.toFixed(5)}</span>
            </div>
          </div>

          {/* Save Location Button */}
          <div className="flex justify-end pt-1">
            <button
              id="btn-save-location-only"
              type="button"
              disabled={isSaving}
              onClick={handleSaveAll}
              className="py-1.5 px-3 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-black text-xs flex items-center gap-1.5 shadow transition cursor-pointer active:scale-95"
            >
              <Save className="w-3 h-3 stroke-[2.5]" />
              <span>{isHindi ? 'लोकेशन सुरक्षित करें (Save Location)' : 'Save Location'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SECTION 4 — 🕐 दुकान का समय                                                */}
      {/* ========================================================================= */}
      <div className="rounded-3xl bg-[#0b142c] border border-cyan-500/25 p-4 sm:p-5 space-y-4 shadow-[0_0_20px_rgba(6,182,212,0.08)]">
        <div className="flex items-center justify-between border-b border-cyan-500/20 pb-2.5">
          <div className="flex items-center space-x-2">
            <Clock className="w-4 h-4 text-cyan-400" />
            <h2 className="text-xs sm:text-sm font-black text-white uppercase tracking-wider">
              {isHindi ? 'SECTION 4 — 🕐 दुकान का समय (Shop Timings)' : 'SECTION 4 — 🕐 Shop Timings'}
            </h2>
          </div>
          <span className="text-[10px] font-mono text-cyan-300 bg-cyan-950/60 px-2 py-0.5 rounded-full border border-cyan-500/30">
            Primary Timings
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">
              {isHindi ? 'खुलने का समय' : 'Opening Time'} <span className="text-cyan-300 font-mono">[ 07:30 AM ]</span>
            </label>
            <input
              id="input-timing-open-time"
              type="text"
              value={openTime}
              onChange={(e) => setOpenTime(e.target.value)}
              placeholder="07:30 AM"
              className="w-full px-3 py-2 bg-[#070e24] border border-cyan-500/30 rounded-xl text-white font-mono text-xs font-bold focus:outline-none focus:border-cyan-400"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">
              {isHindi ? 'बंद होने का समय' : 'Closing Time'} <span className="text-cyan-300 font-mono">[ 09:30 PM ]</span>
            </label>
            <input
              id="input-timing-close-time"
              type="text"
              value={closeTime}
              onChange={(e) => setCloseTime(e.target.value)}
              placeholder="09:30 PM"
              className="w-full px-3 py-2 bg-[#070e24] border border-cyan-500/30 rounded-xl text-white font-mono text-xs font-bold focus:outline-none focus:border-cyan-400"
            />
          </div>
        </div>

        {/* Optional Day-wise Timings Control */}
        <div className="pt-2 border-t border-cyan-500/20">
          <button
            type="button"
            onClick={() => setIsDayWiseExpanded(!isDayWiseExpanded)}
            className="text-xs font-bold text-cyan-400 hover:text-cyan-300 flex items-center gap-1.5 cursor-pointer"
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>
              {isHindi ? 'दिन के अनुसार समय बदलें (Day-wise timings)' : 'Change day-wise timings'}{' '}
              {isDayWiseExpanded ? '▲' : '▼'}
            </span>
          </button>

          {isDayWiseExpanded && (
            <div className="mt-3 p-3 rounded-2xl bg-[#070e24] border border-cyan-500/20 space-y-2 text-xs">
              <span className="text-[11px] text-slate-400 font-medium block">
                {isHindi ? 'किन दिनों दुकान खुली रहती है:' : 'Days when shop is open:'}
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {DAYS_OF_WEEK.map((day) => {
                  const isOpenDay = openDays.includes(day.id);
                  return (
                    <label
                      key={day.id}
                      className={`p-2 rounded-xl border flex items-center justify-between cursor-pointer transition ${
                        isOpenDay
                          ? 'bg-cyan-950/80 border-cyan-400 text-cyan-200'
                          : 'bg-slate-900 border-slate-800 text-slate-500'
                      }`}
                    >
                      <span className="font-bold text-[11px]">
                        {isHindi ? day.labelHi : day.labelEn}
                      </span>
                      <input
                        type="checkbox"
                        checked={isOpenDay}
                        onChange={() => {
                          if (isOpenDay) {
                            setOpenDays(openDays.filter((d) => d !== day.id));
                          } else {
                            setOpenDays([...openDays, day.id]);
                          }
                        }}
                        className="w-3.5 h-3.5 accent-cyan-500 rounded"
                      />
                    </label>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SECTION 5 — 🚚 ऑर्डर और Delivery (Fulfillment Settings)                    */}
      {/* ========================================================================= */}
      <div className="rounded-3xl bg-[#0b142c] border border-cyan-500/25 p-4 sm:p-5 space-y-4 shadow-[0_0_20px_rgba(6,182,212,0.08)]">
        <div className="flex items-center space-x-2 border-b border-cyan-500/20 pb-2.5">
          <Truck className="w-4 h-4 text-cyan-400" />
          <h2 className="text-xs sm:text-sm font-black text-white uppercase tracking-wider">
            {isHindi ? 'SECTION 5 — 🚚 ऑर्डर और Delivery (Fulfillment Settings)' : 'SECTION 5 — 🚚 Orders & Delivery (Fulfillment)'}
          </h2>
        </div>

        {/* Options: Store Pickup & Home Delivery */}
        <div className="grid grid-cols-2 gap-3">
          <label
            className={`p-3 rounded-2xl border flex flex-col justify-between cursor-pointer transition ${
              pickupEnabled
                ? 'bg-cyan-950/80 border-cyan-400 text-white shadow-[0_0_12px_rgba(6,182,212,0.2)]'
                : 'bg-[#070e24] border-slate-800 text-slate-400'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="font-extrabold text-xs">Store Pickup</span>
              <input
                id="checkbox-store-pickup"
                type="checkbox"
                checked={pickupEnabled}
                onChange={(e) => setPickupEnabled(e.target.checked)}
                className="w-4 h-4 accent-cyan-500 rounded"
              />
            </div>
            <span className="text-[10px] text-slate-400">
              {isHindi ? 'दुकान से ग्राहक स्वयं लेंगे' : 'Customers pick up at store'}
            </span>
          </label>

          <label
            className={`p-3 rounded-2xl border flex flex-col justify-between cursor-pointer transition ${
              deliveryEnabled
                ? 'bg-emerald-950/80 border-emerald-400 text-white shadow-[0_0_12px_rgba(16,185,129,0.2)]'
                : 'bg-[#070e24] border-slate-800 text-slate-400'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="font-extrabold text-xs">Home Delivery</span>
              <input
                id="checkbox-home-delivery"
                type="checkbox"
                checked={deliveryEnabled}
                onChange={(e) => setDeliveryEnabled(e.target.checked)}
                className="w-4 h-4 accent-emerald-500 rounded"
              />
            </div>
            <span className="text-[10px] text-slate-400">
              {isHindi ? 'दुकानदार घर पर पहुँचाएँगे' : 'Shop delivers to customer'}
            </span>
          </label>
        </div>

        {/* If Home Delivery is Enabled: Delivery fee, free delivery limit, max distance */}
        {deliveryEnabled ? (
          <div className="p-3.5 rounded-2xl bg-[#070e24] border border-cyan-500/20 space-y-3">
            <span className="text-[11px] font-bold text-cyan-300 block">
              {isHindi ? 'Home Delivery नियम व शुल्क:' : 'Home Delivery Rules & Fees:'}
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <div>
                <label className="block text-[10px] text-slate-400 font-bold mb-0.5">
                  {isHindi ? 'Delivery शुल्क (₹):' : 'Delivery Fee (₹):'}
                </label>
                <input
                  id="input-delivery-fee"
                  type="number"
                  min={0}
                  value={deliveryFee}
                  onChange={(e) => setDeliveryFee(Number(e.target.value))}
                  className="w-full px-2.5 py-1.5 bg-[#0b142c] border border-cyan-500/30 rounded-xl text-white font-mono text-xs font-bold focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="block text-[10px] text-slate-400 font-bold mb-0.5">
                  {isHindi ? 'Free Delivery सीमा (₹):' : 'Free Delivery Above (₹):'}
                </label>
                <input
                  id="input-free-delivery-threshold"
                  type="number"
                  min={0}
                  value={freeDeliveryThreshold}
                  onChange={(e) => setFreeDeliveryThreshold(Number(e.target.value))}
                  className="w-full px-2.5 py-1.5 bg-[#0b142c] border border-cyan-500/30 rounded-xl text-white font-mono text-xs font-bold focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="block text-[10px] text-slate-400 font-bold mb-0.5">
                  {isHindi ? 'अधिकतम डिलीवरी दूरी (किमी):' : 'Max Delivery Distance (km):'}
                </label>
                <input
                  id="input-max-distance"
                  type="number"
                  min={1}
                  step={0.5}
                  value={maxDistance}
                  onChange={(e) => setMaxDistance(Number(e.target.value))}
                  className="w-full px-2.5 py-1.5 bg-[#0b142c] border border-cyan-500/30 rounded-xl text-white font-mono text-xs font-bold focus:outline-none focus:border-cyan-400"
                />
              </div>
            </div>
          </div>
        ) : (
          <div className="p-3 rounded-2xl bg-slate-900/60 border border-slate-800 text-slate-400 text-xs">
            {isHindi
              ? 'ℹ️ Home Delivery बंद है। ग्राहक केवल दुकान से पिकअप कर सकेंगे।'
              : 'ℹ️ Home Delivery is disabled. Customers can only pick up from the shop.'}
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* SECTION 6 — 💳 PAYMENT / UPI INFORMATION                                 */}
      {/* ========================================================================= */}
      <div className="rounded-3xl bg-[#0b142c] border border-cyan-500/25 p-4 sm:p-5 space-y-4 shadow-[0_0_20px_rgba(6,182,212,0.08)]">
        <div className="flex items-center justify-between border-b border-cyan-500/20 pb-2.5">
          <div className="flex items-center space-x-2">
            <CreditCard className="w-4 h-4 text-cyan-400" />
            <h2 className="text-xs sm:text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
              <span>{isHindi ? 'SECTION 6 — 💳 पेमेंट जानकारी (Payment Information)' : 'SECTION 6 — 💳 Payment Information'}</span>
              {isShopVerified && (
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                  <Lock className="w-2.5 h-2.5" />
                  <span>{isHindi ? 'UPI सत्यापित (Locked)' : 'UPI Verified (Locked)'}</span>
                </span>
              )}
            </h2>
          </div>

          {isShopVerified && (
            <button
              type="button"
              onClick={() => handleOpenChangeModal('upiPayoutId')}
              className="text-[11px] font-bold text-cyan-400 hover:text-cyan-300 flex items-center gap-1 underline cursor-pointer shrink-0"
            >
              <Lock className="w-3 h-3 text-amber-400" />
              <span>{isHindi ? 'UPI बदलने का अनुरोध' : 'Request UPI Change'}</span>
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <span>UPI ID</span>
                {isShopVerified && (
                  <span className="text-[10px] text-amber-300 font-normal">
                    ({isHindi ? 'एडमिन सत्यापित' : 'Admin Verified'})
                  </span>
                )}
              </label>
              {isShopVerified && (
                <button
                  type="button"
                  onClick={() => handleOpenChangeModal('upiPayoutId')}
                  className="text-[10px] font-bold text-cyan-400 hover:text-cyan-300 underline cursor-pointer"
                >
                  {isHindi ? 'अनुरोध भेजें' : 'Request Change'}
                </button>
              )}
            </div>
            <div className="relative">
              <input
                id="input-payment-upi-id"
                type="text"
                disabled={isShopVerified}
                value={upiId}
                onChange={(e) => setUpiId(e.target.value)}
                placeholder="shreekrishna@okaxis"
                className={`w-full px-3 py-2 rounded-xl font-mono text-xs font-bold focus:outline-none transition ${
                  isShopVerified
                    ? 'bg-slate-900/80 border border-slate-700/70 text-slate-300 cursor-not-allowed pr-9'
                    : 'bg-[#070e24] border border-cyan-500/30 text-cyan-300 focus:border-cyan-400'
                }`}
              />
              {isShopVerified && (
                <div className="absolute right-3 top-2.5 text-amber-400" title={isHindi ? 'यह UPI ID एडमिन द्वारा सत्यापित है' : 'This UPI ID is verified by Admin'}>
                  <Lock className="w-3.5 h-3.5" />
                </div>
              )}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">
              {isHindi ? 'भुगतान नाम (Payment Name)' : 'Payment Name'}
            </label>
            <input
              id="input-payment-name"
              type="text"
              value={paymentName}
              onChange={(e) => setPaymentName(e.target.value)}
              placeholder={isHindi ? 'श्री कृष्णा किराना' : 'Shri Krishna Kirana'}
              className="w-full px-3 py-2 bg-[#070e24] border border-cyan-500/30 rounded-xl text-white text-xs font-semibold focus:outline-none focus:border-cyan-400"
            />
          </div>
        </div>

        {/* UPI QR Code Preview & Image Picker */}
        <div className="p-3.5 rounded-2xl bg-[#070e24] border border-cyan-500/20 flex items-center justify-between gap-3">
          <div className="flex items-center space-x-3 min-w-0">
            <div className="w-14 h-14 rounded-xl bg-white p-1.5 flex items-center justify-center shrink-0 border border-slate-700 shadow-md">
              {upiQrUrl ? (
                <img
                  src={upiQrUrl}
                  alt="UPI QR Code"
                  className="w-full h-full object-contain"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-full h-full border-2 border-slate-900 border-dashed rounded flex flex-col items-center justify-center text-slate-900">
                  <QrCode className="w-5 h-5" />
                  <span className="text-[7px] font-bold font-mono">UPI QR</span>
                </div>
              )}
            </div>

            <div className="min-w-0">
              <span className="text-xs font-extrabold text-white block">
                UPI QR Code Preview
              </span>
              <p className="text-[11px] text-slate-400 mt-0.5">
                {isHindi ? 'फोन से अपनी दुकान का UPI QR कोड चुनें' : 'Select your store UPI QR code from phone'}
              </p>
            </div>
          </div>

          <button
            id="btn-upload-upi-qr"
            type="button"
            onClick={() => qrImageInputRef.current?.click()}
            className="py-2 px-3 rounded-xl bg-cyan-950 hover:bg-cyan-900 border border-cyan-400 text-cyan-200 text-xs font-bold flex items-center gap-1.5 shadow transition cursor-pointer active:scale-95 shrink-0"
          >
            <Camera className="w-3.5 h-3.5 text-cyan-400" />
            <span>{isHindi ? 'QR बदलें' : 'Change QR'}</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SECTION 7 — 🔐 ADMIN VERIFICATION                                          */}
      {/* ========================================================================= */}
      <div className="rounded-3xl bg-[#0b142c] border border-cyan-500/25 p-4 space-y-2 shadow-[0_0_20px_rgba(6,182,212,0.08)]">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <ShieldCheck className="w-4 h-4 text-cyan-400" />
            <span className="text-xs font-black text-white uppercase tracking-wider">
              {isHindi ? 'SECTION 7 — 🔐 दुकान सत्यापन स्थिति (Admin Verification)' : 'SECTION 7 — 🔐 Shop Verification Status'}
            </span>
          </div>

          {shop?.isVerifiedByAdmin ? (
            <span className="px-3 py-1 rounded-full bg-emerald-950/90 border border-emerald-400 text-emerald-300 font-extrabold text-xs flex items-center gap-1.5 shadow-[0_0_10px_rgba(52,211,153,0.3)]">
              <span>🟢</span>
              <span>{isHindi ? 'सत्यापित (Verified)' : 'Verified'}</span>
            </span>
          ) : (
            <span className="px-3 py-1 rounded-full bg-amber-950/90 border border-amber-400 text-amber-300 font-extrabold text-xs flex items-center gap-1.5 shadow-[0_0_10px_rgba(245,158,11,0.3)]">
              <span>🟠</span>
              <span>{isHindi ? 'सत्यापन लंबित (Pending)' : 'Verification Pending'}</span>
            </span>
          )}
        </div>
        <p className="text-[11px] text-slate-400">
          {shop?.isVerifiedByAdmin
            ? (isHindi ? 'आपकी दुकान एडमिन द्वारा आधिकारिक रूप से सत्यापित है। सभी फीचर्स सक्रिय हैं।' : 'Your shop is officially verified by admin. All features are active.')
            : (isHindi ? 'सत्यापन प्रक्रियाधीन है। एडमिन द्वारा समीक्षा पूरी होते ही ग्रीन बैज सक्रिय हो जाएगा।' : 'Verification is under review. Green badge will activate once verified by admin.')}
        </p>
      </div>

      {/* Big Bottom Save Action Bar */}
      <div className="pt-2 sticky bottom-2 z-30">
        <button
          id="btn-bottom-save-all-shop-info"
          type="button"
          disabled={isSaving}
          onClick={handleSaveAll}
          className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-cyan-500 via-blue-600 to-cyan-500 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black text-sm flex items-center justify-center gap-2 shadow-[0_0_25px_rgba(6,182,212,0.4)] transition cursor-pointer active:scale-98 disabled:opacity-50"
        >
          {isSaving ? (
            <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
          ) : (
            <Save className="w-4 h-4 stroke-[2.5]" />
          )}
          <span>
            {isSaving
              ? (isHindi ? 'सुरक्षित हो रहा है...' : 'Saving...')
              : (isHindi ? '💾 दुकान की सभी जानकारी सुरक्षित करें (Save Shop Info)' : '💾 Save All Shop Information')}
          </span>
        </button>
      </div>

      {/* Google Maps Location Picker Modal */}
      <GoogleMapsLocationPickerModal
        isOpen={isMapModalOpen}
        initialCoordinates={coordinates}
        shopName={shopName}
        initialAccuracy={(shop as any)?.locationAccuracy}
        initialSource={(shop as any)?.locationSource}
        onClose={() => setIsMapModalOpen(false)}
        onSaveLocation={async (newCoords, notes, acc, src) => {
          console.log('[ShopInformationScreen] Received updated coordinates from location picker:', newCoords, 'acc:', acc, 'src:', src);
          setCoordinates(newCoords);
          setIsLocationSaved(true);

          if (shop?.id) {
            try {
              await updateShopProfile({
                coordinates: newCoords,
                locationAccuracy: acc,
                locationSource: src,
              } as any);
              onShowToast?.(
                isHindi
                  ? '📍 दुकान की नई लोकेशन सुरक्षित कर दी गई!'
                  : '📍 New shop location saved successfully!',
                'success'
              );
            } catch (err: any) {
              console.warn('[ShopInformationScreen] Auto-persist coordinates notice:', err);
              onShowToast?.(
                isHindi
                  ? '📍 मैप लोकेशन सेट कर दी गई है! सेव बटन दबाकर सुरक्षित करें।'
                  : '📍 Map location set! Tap save to persist changes.'
              );
            }
          } else {
            onShowToast?.(
              isHindi
                ? '📍 मैप लोकेशन सेट कर दी गई है! सेव बटन दबाकर सुरक्षित करें।'
                : '📍 Map location set! Tap save to persist changes.'
            );
          }
        }}
      />

      {/* Shop Change Request Modal for Verified Store Governance */}
      {shop && (
        <ShopChangeRequestModal
          isOpen={isChangeModalOpen}
          shop={shop}
          initialField={changeField}
          onClose={() => setIsChangeModalOpen(false)}
          onSubmitted={() => {
            loadChangeRequests();
            onShowToast?.(
              isHindi
                ? 'बदलाव का अनुरोध सफलतापूर्वक एडमिन को भेज दिया गया!'
                : 'Change request submitted successfully to Admin!',
              'success'
            );
          }}
          onShowToast={onShowToast}
        />
      )}

      {/* ========================================================================= */}
      {/* COVER PHOTO GALLERY: FULL-SCREEN LIGHTBOX MODAL                           */}
      {/* ========================================================================= */}
      {isLightboxOpen && (
        <div
          id="modal-cover-photo-lightbox"
          className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex flex-col justify-between p-3 sm:p-5 animate-in fade-in duration-200"
          onClick={() => {
            setIsLightboxOpen(false);
            setIsManualPaused(false);
          }}
        >
          {/* Top Bar */}
          <div
            className="w-full max-w-4xl mx-auto flex items-center justify-between py-2 text-white"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-2">
              <span className="text-xs sm:text-sm font-black text-cyan-300">
                {shopName || (isHindi ? 'दुकान कवर फोटो' : 'Shop Cover Photo')}
              </span>
              <span className="px-2 py-0.5 rounded-md text-[10px] sm:text-xs font-bold bg-cyan-950 text-cyan-300 border border-cyan-500/40">
                {safeSlideIndex + 1} / {coverPhotoList.length}
              </span>
            </div>
            <button
              id="btn-close-cover-lightbox"
              type="button"
              onClick={() => {
                setIsLightboxOpen(false);
                setIsManualPaused(false);
              }}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
              title={isHindi ? 'बंद करें (Close)' : 'Close'}
            >
              <X className="w-5 h-5 stroke-[2.5]" />
            </button>
          </div>

          {/* Main Large Image View */}
          <div
            className="relative flex-1 w-full max-w-4xl mx-auto flex items-center justify-center my-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={activeCoverPhoto}
              alt={`Full view ${safeSlideIndex + 1}`}
              className="max-h-[75vh] sm:max-h-[80vh] w-auto max-w-full rounded-2xl object-contain shadow-2xl border border-cyan-500/30"
              referrerPolicy="no-referrer"
            />

            {/* Prev / Next controls if multiple photos */}
            {coverPhotoList.length > 1 && (
              <>
                <button
                  id="btn-lightbox-prev-slide"
                  type="button"
                  onClick={() => {
                    setCurrentSlideIndex((prev) => (prev - 1 + coverPhotoList.length) % coverPhotoList.length);
                  }}
                  className="absolute left-2 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-black/60 hover:bg-black/90 text-cyan-300 border border-cyan-400/40 backdrop-blur-md cursor-pointer transition active:scale-95"
                  title={isHindi ? 'पिछली फोटो' : 'Previous'}
                >
                  <ChevronLeft className="w-5 h-5 stroke-[2.5]" />
                </button>
                <button
                  id="btn-lightbox-next-slide"
                  type="button"
                  onClick={() => {
                    setCurrentSlideIndex((prev) => (prev + 1) % coverPhotoList.length);
                  }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-black/60 hover:bg-black/90 text-cyan-300 border border-cyan-400/40 backdrop-blur-md cursor-pointer transition active:scale-95"
                  title={isHindi ? 'अगली फोटो' : 'Next'}
                >
                  <ChevronRight className="w-5 h-5 stroke-[2.5]" />
                </button>
              </>
            )}
          </div>

          {/* Bottom Thumbnail Strip in Lightbox */}
          {coverPhotoList.length > 1 && (
            <div
              className="w-full max-w-xl mx-auto flex items-center justify-center gap-2 py-2 overflow-x-auto no-scrollbar"
              onClick={(e) => e.stopPropagation()}
            >
              {coverPhotoList.map((photoUrl, idx) => (
                <button
                  key={`lightbox-thumb-${idx}`}
                  type="button"
                  onClick={() => setCurrentSlideIndex(idx)}
                  className={`w-12 h-12 rounded-xl overflow-hidden border-2 shrink-0 transition-all cursor-pointer ${
                    idx === safeSlideIndex
                      ? 'border-cyan-400 ring-2 ring-cyan-400/50 scale-105'
                      : 'border-white/20 opacity-60 hover:opacity-100'
                  }`}
                >
                  <img src={photoUrl} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* COVER PHOTO GALLERY: SLOT ACTION MENU (REPLACE / DELETE / CANCEL)        */}
      {/* ========================================================================= */}
      {activeMenuSlotIndex !== null && coverPhotoList[activeMenuSlotIndex] && (
        <div
          id="modal-cover-slot-actions"
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
          onClick={() => setActiveMenuSlotIndex(null)}
        >
          <div
            className="bg-[#0b142c] border border-cyan-500/40 rounded-3xl p-5 max-w-sm w-full space-y-4 shadow-[0_0_30px_rgba(6,182,212,0.2)] text-white"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-cyan-500/20 pb-3">
              <div className="flex items-center gap-2">
                <span className="text-base">🖼️</span>
                <h3 className="text-sm font-black text-white">
                  {isHindi
                    ? `कवर फोटो #${activeMenuSlotIndex + 1} विकल्प`
                    : `Cover Photo #${activeMenuSlotIndex + 1} Options`}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setActiveMenuSlotIndex(null)}
                className="p-1 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Thumbnail Preview */}
            <div className="w-full h-32 rounded-2xl overflow-hidden border border-cyan-500/30 bg-[#070e24]">
              <img
                src={coverPhotoList[activeMenuSlotIndex]}
                alt="Preview"
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>

            {/* Action Buttons */}
            <div className="space-y-2 pt-1">
              {/* 1. Replace Photo */}
              <button
                id="btn-slot-replace-photo"
                type="button"
                onClick={() => handleReplacePhoto(activeMenuSlotIndex)}
                className="w-full py-2.5 px-4 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-black text-xs flex items-center justify-center gap-2 shadow-md cursor-pointer transition active:scale-95"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>{isHindi ? '1. 🔄 फोटो बदलें (Replace Photo)' : '1. 🔄 Replace Photo'}</span>
              </button>

              {/* 2. Delete Photo */}
              <button
                id="btn-slot-delete-photo"
                type="button"
                onClick={() => handleDeletePhoto(activeMenuSlotIndex)}
                className="w-full py-2.5 px-4 rounded-xl bg-rose-950/80 hover:bg-rose-900 text-rose-300 border border-rose-500/40 font-black text-xs flex items-center justify-center gap-2 shadow-md cursor-pointer transition active:scale-95"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                <span>{isHindi ? '2. 🗑️ फोटो हटाएं (Delete Photo)' : '2. 🗑️ Delete Photo'}</span>
              </button>

              {/* 3. Cancel */}
              <button
                id="btn-slot-cancel-action"
                type="button"
                onClick={() => setActiveMenuSlotIndex(null)}
                className="w-full py-2 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer transition"
              >
                <X className="w-3.5 h-3.5" />
                <span>{isHindi ? '3. रद्द करें (Cancel)' : '3. Cancel'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* COVER PHOTO GALLERY: DELETE CONFIRMATION DIALOG                          */}
      {/* ========================================================================= */}
      {photoToDeleteIndex !== null && (
        <div
          id="modal-confirm-delete-cover-photo"
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
          onClick={() => setPhotoToDeleteIndex(null)}
        >
          <div
            className="bg-[#0b142c] border border-rose-500/40 rounded-3xl p-5 max-w-sm w-full space-y-4 shadow-[0_0_30px_rgba(244,63,94,0.2)] text-white"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-2.5 text-rose-400">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <h3 className="text-sm font-black">
                {isHindi ? 'कवर फोटो हटाने की पुष्टि' : 'Confirm Delete Cover Photo'}
              </h3>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              {isHindi
                ? `क्या आप कवर फोटो #${photoToDeleteIndex + 1} को हटाना चाहते हैं? यह स्लॉट खाली हो जाएगा और उसकी जगह "＋" दिखाई देगा।`
                : `Are you sure you want to delete Cover Photo #${photoToDeleteIndex + 1}? This slot will become empty with "+".`}
            </p>
            <div className="flex items-center gap-2 pt-2">
              <button
                id="btn-cancel-delete-cover-photo"
                type="button"
                onClick={() => setPhotoToDeleteIndex(null)}
                className="flex-1 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-bold transition cursor-pointer"
              >
                {isHindi ? 'रद्द करें' : 'Cancel'}
              </button>
              <button
                id="btn-confirm-delete-cover-photo"
                type="button"
                onClick={handleConfirmDelete}
                className="flex-1 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-black transition shadow-lg cursor-pointer active:scale-95"
              >
                {isHindi ? 'हाँ, हटाएं' : 'Yes, Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

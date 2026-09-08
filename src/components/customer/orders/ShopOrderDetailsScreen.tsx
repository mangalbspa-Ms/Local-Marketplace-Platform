import React, { useState, useEffect, useRef } from 'react';
import { Order, OrderStatus, FulfillmentType } from '../../../types/order.ts';
import { Shop } from '../../../types/market.ts';
import { customerApi } from '../../../services/customerApi.ts';
import { useCustomerLanguage } from '../../../context/CustomerLanguageContext.tsx';
import { useCustomerCart } from '../../../context/CustomerCartContext.tsx';
import { LiveOrderTrackingModal } from './LiveOrderTrackingModal.tsx';
import {
  ArrowLeft,
  ShieldCheck,
  Star,
  MapPin,
  Clock,
  Phone,
  Store,
  Bike,
  ShoppingBag,
  Receipt,
  Copy,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Sparkles,
  PackageCheck,
  ChevronRight,
  Navigation,
  XCircle,
  RotateCcw,
  Check,
  AlertTriangle,
} from 'lucide-react';

interface ShopOrderDetailsScreenProps {
  order: Order;
  shop?: Shop;
  onBack: () => void;
  onOrderUpdated?: (updatedOrder: Order) => void;
  onOpenStorefront?: (shopId: string) => void;
}

export const ShopOrderDetailsScreen: React.FC<ShopOrderDetailsScreenProps> = ({
  order: initialOrder,
  shop: initialShop,
  onBack,
  onOrderUpdated,
  onOpenStorefront,
}) => {
  const { language } = useCustomerLanguage();
  const { addToCart, clearCart } = useCustomerCart();

  const [order, setOrder] = useState<Order>(initialOrder);
  const [shop, setShop] = useState<Shop | undefined>(initialShop);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [copiedPin, setCopiedPin] = useState(false);
  const [showLiveTracking, setShowLiveTracking] = useState(false);
  
  // Cancel Order Modal State
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('ordered_wrong_item');
  const [customReasonText, setCustomReasonText] = useState('');
  const [isCancelling, setIsCancelling] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);

  // Reorder State
  const [isReordering, setIsReordering] = useState(false);
  const [reorderSuccessMsg, setReorderSuccessMsg] = useState<string | null>(null);

  const pollIntervalRef = useRef<number | null>(null);

  // Sync state if initialOrder changes
  useEffect(() => {
    setOrder(initialOrder);
  }, [initialOrder]);

  // Load latest order and shop data
  const refreshOrderData = async (silent = false) => {
    if (!silent) setIsRefreshing(true);
    try {
      const updated = await customerApi.getOrderDetails(order.id);
      if (updated) {
        setOrder(updated);
        onOrderUpdated?.(updated);
      }
      if (!shop && order.shopId) {
        const shops = await customerApi.getShops();
        const found = shops.find((s) => s.id === order.shopId);
        if (found) setShop(found);
      }
    } catch (err) {
      console.error('Failed to poll order status:', err);
    } finally {
      if (!silent) setIsRefreshing(false);
    }
  };

  // Real-time auto-polling every 5 seconds for active orders
  useEffect(() => {
    const isTerminal =
      order.status === OrderStatus.COMPLETED || order.status === OrderStatus.CANCELLED;

    if (!isTerminal) {
      pollIntervalRef.current = window.setInterval(() => {
        refreshOrderData(true);
      }, 5000);
    }

    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, [order.id, order.status]);

  // Fulfillment Configuration
  const isShopPickupOnly = shop?.fulfillment?.pickupEnabled && !shop?.fulfillment?.deliveryEnabled;
  const isShopDeliveryOnly = !shop?.fulfillment?.pickupEnabled && shop?.fulfillment?.deliveryEnabled;

  const isPickup = isShopPickupOnly || (order.fulfillmentType === FulfillmentType.STORE_PICKUP && !isShopDeliveryOnly);
  const isTerminal = order.status === OrderStatus.COMPLETED || order.status === OrderStatus.CANCELLED;
  const isCancelled = order.status === OrderStatus.CANCELLED;
  const isCompleted = order.status === OrderStatus.COMPLETED;
  const canCancel = !isTerminal && (
    order.status === OrderStatus.PAYMENT_PENDING ||
    order.status === OrderStatus.CONFIRMED ||
    order.status === OrderStatus.ACCEPTED ||
    order.status === OrderStatus.PREPARING
  );

  const totalPayable = order.financials?.customerTotal ?? 0;
  const orderNumberDisplay = order.orderNumber || `#ORD-${order.id.slice(-6).toUpperCase()}`;
  const formattedDateTime = new Date(order.createdAt).toLocaleDateString(
    language === 'hi' ? 'hi-IN' : 'en-IN',
    {
      day: 'numeric',
      month: 'short',
      hour: 'numeric',
      minute: 'numeric',
      hour12: true,
    }
  );

  const shopName = shop?.name || order.shopName || 'Local Mandi Merchant';
  const shopPhone = shop?.phone || order.shopPhone || '+919820000001';
  const shopPhoto =
    (shop?.bannerImageUrl && shop.bannerImageUrl.trim()) ||
    (shop?.photoUrl && shop.photoUrl.trim()) ||
    (shop?.logoImageUrl && shop.logoImageUrl.trim()) ||
    'https://images.unsplash.com/photo-1578916171728-46686eac8d58?w=800&auto=format&fit=crop&q=80';
  const rating = shop?.averageRating ? shop.averageRating.toFixed(1) : '4.8';
  const reviewCount = shop?.totalRatingsCount ? `${shop.totalRatingsCount}+` : '120+';
  const distance = shop?.distanceText || (shop?.distanceKm ? `${shop.distanceKm} km` : '0.5 km');
  const isOpen = shop?.isOpenNow !== undefined ? shop.isOpenNow : true;
  const prepTime = shop?.estimatedDeliveryTimeMinutes
    ? `${shop.estimatedDeliveryTimeMinutes} min`
    : '20–30 min';
  const shopAddress =
    shop?.address?.addressLine1 ||
    `${shop?.marketName || 'Dadar Central Market'}, Dadar West, Mumbai - 400028`;

  // Copy PIN helper
  const handleCopyPin = () => {
    if (order.pickupCode) {
      navigator.clipboard?.writeText(order.pickupCode);
      setCopiedPin(true);
      setTimeout(() => setCopiedPin(false), 2500);
    }
  };

  // Handle Cancel Order
  const handleConfirmCancel = async () => {
    setIsCancelling(true);
    setCancelError(null);
    try {
      const reasonNotes = cancelReason === 'other' ? customReasonText : cancelReason;
      const updated = await customerApi.cancelOrder(order.id, reasonNotes);
      setOrder(updated);
      onOrderUpdated?.(updated);
      setIsCancelModalOpen(false);
    } catch (err: any) {
      setCancelError(err?.message || 'Failed to cancel order');
    } finally {
      setIsCancelling(false);
    }
  };

  // Handle Reorder Items
  const handleReorder = async () => {
    setIsReordering(true);
    setReorderSuccessMsg(null);
    try {
      const allShops = await customerApi.getShops();
      const targetShop = allShops.find((s) => s.id === order.shopId) || shop;
      const products = await customerApi.getShopProducts(order.shopId);

      if (targetShop && products.length > 0) {
        clearCart();
        let addedCount = 0;
        for (const item of order.items) {
          const matchedProd = products.find(
            (p) =>
              (item.productId && p.id === item.productId) ||
              (p.name && item.productName && p.name.toLowerCase() === item.productName.toLowerCase())
          );
          if (matchedProd && matchedProd.isAvailable) {
            addToCart(
              matchedProd,
              targetShop,
              item.orderedQuantityMultiplier || 1,
              item.quantityCount || 1,
              item.orderedQuantityDisplay
            );
            addedCount++;
          }
        }

        setReorderSuccessMsg(
          language === 'hi'
            ? `${addedCount} सामान कार्ट में जोड़े गए! आप कार्ट से दोबारा ऑर्डर कर सकते हैं।`
            : `${addedCount} items added to cart! You can checkout again from Cart.`
        );

        setTimeout(() => {
          if (onOpenStorefront) {
            onOpenStorefront(order.shopId);
          }
        }, 1200);
      } else if (onOpenStorefront) {
        onOpenStorefront(order.shopId);
      }
    } catch (err) {
      console.error('Failed to reorder items:', err);
      if (onOpenStorefront) {
        onOpenStorefront(order.shopId);
      }
    } finally {
      setIsReordering(false);
    }
  };

  // Timeline steps for store pickup vs delivery
  const pickupSteps = [
    {
      status: OrderStatus.CONFIRMED,
      title: language === 'hi' ? 'ऑर्डर कन्फर्म हुआ' : 'Order Confirmed',
      desc: language === 'hi' ? 'दुकानदार को ऑर्डर भेजा गया' : 'Order sent to shop',
    },
    {
      status: OrderStatus.ACCEPTED,
      title: language === 'hi' ? 'दुकानदार ने स्वीकार किया' : 'Accepted by Shop',
      desc: language === 'hi' ? 'दुकानदार ने ऑर्डर स्वीकार किया' : 'Shopkeeper accepted order',
    },
    {
      status: OrderStatus.PREPARING,
      title: language === 'hi' ? 'सामान तैयार हो रहा है' : 'Weighing & Packing',
      desc: language === 'hi' ? 'ताज़ा सामान तौला और पैक किया जा रहा है' : 'Items being packed at counter',
    },
    {
      status: OrderStatus.READY_FOR_PICKUP,
      title: language === 'hi' ? 'पिकअप के लिए तैयार' : 'Ready for Pickup',
      desc: language === 'hi' ? 'काउंटर पर 4-अंकों का PIN दिखाएँ' : 'Show 4-digit PIN at shop counter',
    },
    {
      status: OrderStatus.COMPLETED,
      title: language === 'hi' ? 'ऑर्डर प्राप्त हुआ' : 'Handed Over / Completed',
      desc: language === 'hi' ? 'सामान सफलतापूर्वक ले लिया गया' : 'Order collected successfully',
    },
  ];

  const deliverySteps = [
    {
      status: OrderStatus.CONFIRMED,
      title: language === 'hi' ? 'ऑर्डर कन्फर्म हुआ' : 'Order Confirmed',
      desc: language === 'hi' ? 'दुकानदार को ऑर्डर भेजा गया' : 'Order sent to shop',
    },
    {
      status: OrderStatus.ACCEPTED,
      title: language === 'hi' ? 'दुकानदार ने स्वीकार किया' : 'Accepted by Shop',
      desc: language === 'hi' ? 'दुकानदार ने ऑर्डर स्वीकार किया' : 'Shopkeeper accepted order',
    },
    {
      status: OrderStatus.PREPARING,
      title: language === 'hi' ? 'सामान पैक हो रहा है' : 'Weighing & Packing',
      desc: language === 'hi' ? 'ताज़ा सामान तौला और पैक किया जा रहा है' : 'Items packed for dispatch',
    },
    {
      status: OrderStatus.OUT_FOR_DELIVERY,
      title: language === 'hi' ? 'डिलीवरी के लिए रवाना' : 'Out for Delivery',
      desc: language === 'hi' ? 'डिलीवरी पार्टनर आपके पते पर आ रहा है' : 'Rider dispatched to your address',
    },
    {
      status: OrderStatus.COMPLETED,
      title: language === 'hi' ? 'सफलतापूर्वक डिलीवर हुआ' : 'Delivered & Completed',
      desc: language === 'hi' ? 'ऑर्डर आपके पते पर पहुंच गया' : 'Handed over at doorstep',
    },
  ];

  const steps = isPickup ? pickupSteps : deliverySteps;

  // Compute active step index
  const getActiveStepIndex = () => {
    if (order.status === OrderStatus.PAYMENT_PENDING || order.status === OrderStatus.CONFIRMED) return 0;
    if (order.status === OrderStatus.ACCEPTED) return 1;
    if (order.status === OrderStatus.PREPARING) return 2;
    if (order.status === OrderStatus.READY_FOR_PICKUP || order.status === OrderStatus.OUT_FOR_DELIVERY) return 3;
    if (order.status === OrderStatus.COMPLETED) return 4;
    return -1;
  };

  const activeStepIdx = getActiveStepIndex();

  return (
    <div className="bg-slate-50 min-h-screen pb-32">
      {/* 1. Sticky Navigation Header */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200 px-4 py-3 shadow-2xs">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <button
            type="button"
            onClick={onBack}
            className="flex items-center gap-1.5 px-3 py-2 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{language === 'hi' ? 'सभी ऑर्डर्स' : 'All Orders'}</span>
          </button>

          <div className="text-center">
            <h1 className="text-sm font-black text-slate-900 flex items-center justify-center gap-1.5">
              <span>{language === 'hi' ? 'दुकान ऑर्डर विवरण' : 'Shop Order Details'}</span>
            </h1>
            <p className="text-[11px] font-mono font-bold text-slate-500">{orderNumberDisplay}</p>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => refreshOrderData(false)}
              disabled={isRefreshing}
              className={`p-2 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors ${
                isRefreshing ? 'animate-spin text-emerald-600' : ''
              }`}
              title="Refresh order details"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Body */}
      <main className="max-w-2xl mx-auto p-3.5 sm:p-5 space-y-3.5">
        {/* =========================================================
            CANCELLED BANNER (If order is cancelled)
        ========================================================== */}
        {isCancelled && (
          <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-rose-950 shadow-2xs">
            <div className="flex items-start gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center shrink-0">
                <XCircle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-xs sm:text-sm font-black">
                  {language === 'hi' ? 'यह ऑर्डर रद्द (Cancelled) हो चुका है' : 'Order Cancelled'}
                </h3>
                <p className="text-[11px] text-rose-800">
                  {language === 'hi'
                    ? 'यदि कोई भुगतान हुआ था तो रिफंड की प्रक्रिया शुरू हो गई है।'
                    : 'Automatic refund workflow has been initiated.'}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleReorder}
              disabled={isReordering}
              className="inline-flex items-center justify-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-2xs transition-colors shrink-0"
            >
              <RotateCcw className={`w-3 h-3 ${isReordering ? 'animate-spin' : ''}`} />
              <span>{language === 'hi' ? 'फिर से ऑर्डर करें' : 'Reorder'}</span>
            </button>
          </div>
        )}

        {/* Reorder Success Feedback */}
        {reorderSuccessMsg && (
          <div className="bg-emerald-50 border border-emerald-300 rounded-xl p-3 text-xs text-emerald-950 font-bold flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{reorderSuccessMsg}</span>
          </div>
        )}

        {/* =========================================================
            SECTION 1: COMPACT SHOP PROFILE & ORDER HEADER
        ========================================================== */}
        <section className="bg-white rounded-xl border border-slate-200/90 shadow-2xs p-3 sm:p-3.5 space-y-2">
          <div className="flex items-start justify-between gap-2.5">
            <div className="flex items-center gap-2.5 min-w-0">
              <img
                src={shopPhoto}
                alt={shopName}
                className="w-11 h-11 sm:w-12 sm:h-12 rounded-lg object-cover bg-slate-100 border border-slate-200/80 shrink-0"
                referrerPolicy="no-referrer"
                loading="lazy"
              />
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <h2 className="text-sm sm:text-base font-black tracking-tight text-slate-900 truncate">
                    {shopName}
                  </h2>
                  <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-200 shrink-0">
                    <ShieldCheck className="w-2.5 h-2.5 text-emerald-600" />
                    <span>{language === 'hi' ? 'सत्यापित' : 'Verified'}</span>
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-semibold text-slate-500 mt-0.5">
                  <span className="flex items-center gap-0.5 text-amber-600 font-bold bg-amber-50 px-1 py-0.2 rounded">
                    <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />
                    <span>{rating}</span>
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-0.5 text-slate-600">
                    <MapPin className="w-2.5 h-2.5 text-emerald-600" />
                    <span>{distance}</span>
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-0.5 text-slate-600">
                    <Clock className="w-2.5 h-2.5 text-sky-600" />
                    <span>{prepTime}</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Actions: Call & Visit */}
            <div className="flex items-center gap-1 shrink-0">
              <a
                href={`tel:${shopPhone}`}
                className="inline-flex items-center justify-center p-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 transition-colors"
                title={language === 'hi' ? 'कॉल करें' : 'Call Shop'}
              >
                <Phone className="w-3.5 h-3.5 text-emerald-600" />
              </a>

              {onOpenStorefront && order.shopId && (
                <button
                  type="button"
                  onClick={() => onOpenStorefront(order.shopId)}
                  className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 text-[11px] font-bold transition-colors"
                >
                  <Store className="w-3 h-3 text-emerald-700" />
                  <span>{language === 'hi' ? 'दुकान' : 'Shop'}</span>
                </button>
              )}
            </div>
          </div>

          {/* Shop Address & Order # / Date Footer */}
          <div className="pt-1.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500 gap-2">
            <div className="flex items-center gap-1 truncate">
              <MapPin className="w-3 h-3 text-emerald-600 shrink-0" />
              <span className="truncate">{shopAddress}</span>
            </div>
            <div className="font-mono font-bold text-slate-600 shrink-0">
              {orderNumberDisplay} • {formattedDateTime}
            </div>
          </div>
        </section>

        {/* =========================================================
            SECTION 2: ONE DIGITAL BILL / INVOICE CONTAINER
        ========================================================== */}
        <section className="bg-white rounded-xl border border-slate-200/90 shadow-2xs overflow-hidden">
          {/* Invoice Header */}
          <div className="px-3.5 py-2.5 bg-slate-50 border-b border-slate-200/80 flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="text-sm">🛍️</span>
              <div>
                <h3 className="text-xs sm:text-sm font-black text-slate-900 leading-tight">
                  {language === 'hi' ? 'आपका पूरा ऑर्डर' : 'Your Complete Order'}
                </h3>
                <p className="text-[10px] text-slate-500 font-medium">
                  {order.items.length} {language === 'hi' ? 'सामान' : 'items'} • {shopName}
                </p>
              </div>
            </div>

            <span className="text-[10px] font-mono font-bold text-slate-600 bg-white border border-slate-200 px-1.5 py-0.5 rounded shadow-2xs">
              {orderNumberDisplay}
            </span>
          </div>

          {/* High-Density Product Rows (Compact horizontal row per product) */}
          <div className="divide-y divide-slate-100 px-3.5">
            {order.items.map((item, idx) => {
              const itemImage =
                (item.productImage && item.productImage.trim() !== '')
                  ? item.productImage
                  : 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=500&auto=format&fit=crop&q=80';
              const linePrice = item.lineItemTotal ?? item.unitItemPriceCalculated ?? 0;
              const qtyDisplay = item.orderedQuantityDisplay || `${item.quantityInBaseUnits || 1} ${item.baseUnit || 'unit'}`;

              return (
                <div
                  key={`${item.productId}-${idx}`}
                  className="py-2 flex items-center justify-between gap-2.5 group hover:bg-slate-50/70 -mx-3.5 px-3.5 transition-colors"
                >
                  {/* Left: Thumbnail (32-36px) & Item Details */}
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <img
                      src={itemImage}
                      alt={item.productName}
                      className="w-8 h-8 sm:w-9 sm:h-9 rounded-md object-cover bg-slate-100 border border-slate-200/80 shrink-0"
                      referrerPolicy="no-referrer"
                      loading="lazy"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-slate-900 truncate leading-tight">
                        {item.productName}
                      </p>
                      <div className="flex items-center gap-1.5 text-[10px] text-slate-500 mt-0.5 font-medium">
                        <span className="bg-slate-100 text-slate-600 px-1 py-0.2 rounded">
                          {qtyDisplay}
                        </span>
                        {item.quantityCount && item.quantityCount > 1 && (
                          <span className="text-slate-400">× {item.quantityCount}</span>
                        )}
                        {item.notes && (
                          <span className="text-amber-700 bg-amber-50 px-1 py-0.2 rounded truncate max-w-[120px]">
                            {item.notes}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right: Price */}
                  <div className="text-right shrink-0">
                    <span className="text-xs sm:text-sm font-black text-slate-900">
                      ₹{linePrice}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Unified Digital Invoice Subtotals (Inside SAME Container) */}
          <div className="p-3.5 bg-slate-50/90 border-t border-slate-200 space-y-1.5">
            <div className="flex items-center justify-between text-[11px] text-slate-600">
              <span>{language === 'hi' ? 'सामान का कुल' : 'Items Subtotal'}</span>
              <span className="font-bold text-slate-800">
                ₹{order.financials?.itemSubtotal ?? 0}
              </span>
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-600">
              <span>{language === 'hi' ? 'डिलीवरी शुल्क' : 'Delivery Fee'}</span>
              <span className="font-bold text-slate-800">
                {isPickup || (order.financials?.deliveryFee ?? 0) === 0 ? (
                  <span className="text-emerald-700 font-black">
                    {language === 'hi' ? 'मुफ्त (FREE)' : 'FREE'}
                  </span>
                ) : (
                  `₹${order.financials?.deliveryFee}`
                )}
              </span>
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-600">
              <span>{language === 'hi' ? 'प्लेटफॉर्म शुल्क' : 'Platform Fee'}</span>
              <span className="font-bold text-slate-800">
                ₹{order.financials?.platformFee ?? 2}
              </span>
            </div>

            {(order.financials?.discount ?? 0) > 0 && (
              <div className="flex items-center justify-between text-[11px] text-emerald-700 font-bold">
                <span>{language === 'hi' ? 'छूट' : 'Discount'}</span>
                <span>-₹{order.financials?.discount}</span>
              </div>
            )}

            {/* Total Grand Bill Divider & Prominent Amount */}
            <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
              <div>
                <span className="text-xs sm:text-sm font-black text-slate-900">
                  {language === 'hi' ? 'कुल भुगतान' : 'Total Amount'}
                </span>
                <p className="text-[10px] text-emerald-700 font-bold flex items-center gap-1 mt-0.5">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>{language === 'hi' ? 'भुगतान सत्यापित' : 'Payment Verified'}</span>
                </p>
              </div>
              <span className="text-base sm:text-lg font-black text-slate-900">
                ₹{totalPayable}
              </span>
            </div>
          </div>
        </section>

        {/* =========================================================
            SECTION 3: EXACTLY ONE COMPACT TRACKING CARD
        ========================================================== */}
        {!isCancelled && (
          <section className="bg-white rounded-xl border border-slate-200/90 shadow-2xs p-3 sm:p-3.5 space-y-2.5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <div className="flex items-center gap-1.5">
                <span className="w-6 h-6 rounded-md bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
                  <PackageCheck className="w-3.5 h-3.5 text-emerald-700" />
                </span>
                <div>
                  <h3 className="text-xs sm:text-sm font-black text-slate-900">
                    {language === 'hi' ? 'ऑर्डर की स्थिति' : 'Order Status'}
                  </h3>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowLiveTracking(true)}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-[11px] font-bold transition-colors"
              >
                <Navigation className="w-2.5 h-2.5 text-emerald-600" />
                <span>{language === 'hi' ? 'लाइव ट्रैकिंग' : 'Live Tracking'}</span>
              </button>
            </div>

            {/* Compact Stepper Timeline */}
            <div className="py-0.5 space-y-2">
              {steps.map((step, idx) => {
                const isPassed = activeStepIdx >= idx;
                const isCurrent = activeStepIdx === idx;

                return (
                  <div key={step.status} className="flex items-start gap-2 relative">
                    {/* Vertical Connector Line */}
                    {idx < steps.length - 1 && (
                      <div
                        className={`absolute left-2.5 top-5 bottom-0 w-0.5 -mb-2 ${
                          activeStepIdx > idx ? 'bg-emerald-500' : 'bg-slate-200'
                        }`}
                      />
                    )}

                    {/* Step Icon */}
                    <div
                      className={`relative z-10 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 transition-colors ${
                        isCurrent
                          ? 'bg-emerald-600 text-white ring-2 ring-emerald-100'
                          : isPassed
                          ? 'bg-emerald-500 text-white'
                          : 'bg-slate-100 text-slate-400 border border-slate-200'
                      }`}
                    >
                      {isPassed ? <CheckCircle2 className="w-3 h-3" /> : idx + 1}
                    </div>

                    {/* Step Content */}
                    <div className="flex-1 pb-0.5 min-w-0">
                      <p
                        className={`text-xs font-bold leading-tight ${
                          isCurrent
                            ? 'text-emerald-950 font-black'
                            : isPassed
                            ? 'text-slate-900'
                            : 'text-slate-400'
                        }`}
                      >
                        {step.title}
                      </p>
                      <p
                        className={`text-[10px] ${
                          isCurrent
                            ? 'text-emerald-700 font-medium'
                            : isPassed
                            ? 'text-slate-500'
                            : 'text-slate-400'
                        }`}
                      >
                        {step.desc}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* =========================================================
            SECTION 4: EXACTLY ONE COMPACT FULFILLMENT SECTION
        ========================================================== */}
        <section className="bg-white rounded-xl border border-slate-200/90 shadow-2xs p-3 sm:p-3.5 space-y-2">
          <div className="flex items-center gap-1.5 border-b border-slate-100 pb-2">
            <span className="w-6 h-6 rounded-md bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
              {isPickup ? <Store className="w-3.5 h-3.5 text-emerald-700" /> : <Bike className="w-3.5 h-3.5 text-emerald-700" />}
            </span>
            <div>
              <h3 className="text-xs sm:text-sm font-black text-slate-900">
                {isPickup
                  ? language === 'hi' ? 'दुकान से पिकअप' : 'Store Pickup'
                  : language === 'hi' ? 'घर पर डिलीवरी' : 'Home Delivery'}
              </h3>
            </div>
          </div>

          {isPickup ? (
            <div className="space-y-2">
              {/* Pickup PIN Display */}
              {order.pickupCode && (
                <div className="bg-gradient-to-br from-emerald-50 via-teal-50 to-emerald-100/60 rounded-lg p-2.5 border border-emerald-300/80 flex items-center justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-1 text-emerald-950 font-bold text-xs">
                      <Sparkles className="w-3 h-3 text-emerald-600" />
                      <span>{language === 'hi' ? 'पिकअप PIN:' : 'Pickup PIN:'}</span>
                    </div>
                    <p className="text-[10px] text-emerald-800">
                      {language === 'hi' ? 'काउंटर पर दिखाएँ' : 'Show at counter'}
                    </p>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <div className="flex items-center gap-1">
                      {order.pickupCode.split('').map((digit, idx) => (
                        <span
                          key={idx}
                          className="w-7 h-8 rounded-md bg-white border border-emerald-400 shadow-2xs flex items-center justify-center font-mono font-black text-sm text-emerald-950"
                        >
                          {digit}
                        </span>
                      ))}
                    </div>

                    <button
                      type="button"
                      onClick={handleCopyPin}
                      className="p-1.5 rounded-md bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold transition-colors shrink-0"
                      title={language === 'hi' ? 'PIN कॉपी करें' : 'Copy PIN'}
                    >
                      {copiedPin ? <CheckCircle2 className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                    </button>
                  </div>
                </div>
              )}

              {/* Shop Pickup Address */}
              <div className="bg-slate-50 rounded-lg p-2.5 border border-slate-100 text-[11px] text-slate-700 space-y-0.5">
                <p className="font-bold text-slate-900">{shopName}</p>
                <p className="text-slate-600">{shopAddress}</p>
              </div>
            </div>
          ) : (
            <div className="bg-slate-50 rounded-lg p-2.5 border border-slate-100 text-[11px] space-y-0.5">
              <div className="flex items-center justify-between text-slate-900 font-bold">
                <span>
                  {order.deliveryAddress?.recipientName || order.customerName || 'Priya Sharma'}
                </span>
                <span className="text-slate-500 font-medium font-mono">
                  {order.deliveryAddress?.recipientPhone || order.customerPhone || '+919876543210'}
                </span>
              </div>
              <p className="text-slate-700">
                {order.deliveryAddress?.addressLine1 || 'B-304, Sunshine Residency, Ranade Road'}
              </p>
              {order.deliveryAddress?.landmark && (
                <p className="text-slate-500">
                  {language === 'hi' ? 'लैंडमार्क:' : 'Landmark:'} {order.deliveryAddress.landmark}
                </p>
              )}
              <p className="text-slate-500">
                {order.deliveryAddress?.city || 'Mumbai'} - {order.deliveryAddress?.pincode || '400028'}
              </p>
            </div>
          )}
        </section>

        {/* =========================================================
            SECTION 5: CUSTOMER ACTION BUTTONS (CANCEL / REORDER)
        ========================================================== */}
        <section className="space-y-2 pt-1">
          {canCancel && (
            <button
              type="button"
              onClick={() => setIsCancelModalOpen(true)}
              className="w-full py-2.5 px-3.5 rounded-xl bg-white hover:bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold transition-all shadow-2xs flex items-center justify-center gap-1.5"
            >
              <XCircle className="w-3.5 h-3.5" />
              <span>{language === 'hi' ? 'ऑर्डर रद्द करें (Cancel Order)' : 'Cancel Order'}</span>
            </button>
          )}

          {(isCompleted || isCancelled) && (
            <button
              type="button"
              onClick={handleReorder}
              disabled={isReordering}
              className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black transition-all shadow-sm flex items-center justify-center gap-1.5"
            >
              <RotateCcw className={`w-3.5 h-3.5 ${isReordering ? 'animate-spin' : ''}`} />
              <span>{language === 'hi' ? 'सामान फिर से ऑर्डर करें (Reorder Items)' : 'Reorder Items'}</span>
            </button>
          )}
        </section>
      </main>

      {/* Cancel Order Confirmation Modal */}
      {isCancelModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-5 sm:p-6 border border-slate-200 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-rose-100 text-rose-700 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900">
                  {language === 'hi' ? 'क्या आप ऑर्डर रद्द करना चाहते हैं?' : 'Cancel this order?'}
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  {language === 'hi' ? 'रद्द करने का कारण चुनें:' : 'Please select a reason for cancellation:'}
                </p>
              </div>
            </div>

            {/* Cancel Reasons Selection */}
            <div className="space-y-2 text-xs">
              {[
                { id: 'ordered_wrong_item', hi: 'गलत सामान चुना गया (Wrong item selected)', en: 'Wrong items selected' },
                { id: 'delivery_delay', hi: 'डिलीवरी का समय अधिक है (Delivery taking too long)', en: 'Delivery taking too long' },
                { id: 'change_address', hi: 'पता या फोन नंबर बदलना है (Need to change details)', en: 'Need to change delivery details' },
                { id: 'ordered_by_mistake', hi: 'गलती से ऑर्डर हो गया (Placed by mistake)', en: 'Placed by mistake' },
                { id: 'other', hi: 'अन्य कारण (Other reason)', en: 'Other reason' },
              ].map((reason) => (
                <label
                  key={reason.id}
                  className={`flex items-center gap-2.5 p-2.5 rounded-xl border cursor-pointer transition-all ${
                    cancelReason === reason.id
                      ? 'bg-rose-50/70 border-rose-300 text-rose-950 font-bold'
                      : 'border-slate-200 text-slate-700 hover:bg-slate-50 font-medium'
                  }`}
                >
                  <input
                    type="radio"
                    name="cancelReason"
                    value={reason.id}
                    checked={cancelReason === reason.id}
                    onChange={() => setCancelReason(reason.id)}
                    className="text-rose-600 focus:ring-rose-500"
                  />
                  <span>{language === 'hi' ? reason.hi : reason.en}</span>
                </label>
              ))}

              {cancelReason === 'other' && (
                <textarea
                  value={customReasonText}
                  onChange={(e) => setCustomReasonText(e.target.value)}
                  placeholder={language === 'hi' ? 'कृपया कारण बताएं...' : 'Please specify the reason...'}
                  rows={2}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-rose-400 mt-2"
                />
              )}
            </div>

            {cancelError && (
              <p className="text-xs text-rose-600 font-bold bg-rose-50 p-2 rounded-xl border border-rose-200">
                {cancelError}
              </p>
            )}

            {/* Modal Actions */}
            <div className="grid grid-cols-2 gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setIsCancelModalOpen(false)}
                disabled={isCancelling}
                className="py-2.5 px-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-colors"
              >
                {language === 'hi' ? 'वापस जाएँ' : 'Keep Order'}
              </button>

              <button
                type="button"
                onClick={handleConfirmCancel}
                disabled={isCancelling}
                className="py-2.5 px-3 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-black shadow-xs transition-colors flex items-center justify-center gap-1.5"
              >
                {isCancelling ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <XCircle className="w-3.5 h-3.5" />}
                <span>{language === 'hi' ? 'रद्द करें' : 'Confirm Cancel'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Live Order Tracking Modal */}
      <LiveOrderTrackingModal
        order={order}
        isOpen={showLiveTracking}
        onClose={() => setShowLiveTracking(false)}
      />
    </div>
  );
};

/**
 * Seller Home Dashboard Screen (2050 Futuristic Command Center)
 * 
 * Strict Single Shop Header + Structured Primary Workflow:
 * 1. [Top compact header is exclusively handled by SellerHeader]
 * 2. NEW CUSTOMER SHOPPING REQUESTS (Voice / Text shopping requests)
 * 3. PENDING / NEW ORDERS (Orders requiring immediate seller action: Accept / Reject)
 * 4. PACKING (Orders currently being weighed, packed and prepared)
 * 5. BUSINESS DASHBOARD / CORE KPIs (Today's Sales, Total Orders, Pending Orders, Completed Orders)
 * 6. SALES OVERVIEW (Weekly trend chart)
 * 7. RECENT ORDERS (Latest transactions list)
 */

import React, { useState } from 'react';
import {
  ShoppingBag,
  Plus,
  Boxes,
  CheckCircle2,
  Clock,
  Truck,
  IndianRupee,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  FileBarChart,
  Mic,
  Package,
  ChevronRight,
  ClipboardList,
  Sparkles,
  XCircle,
  Check,
  Calendar,
} from 'lucide-react';
import { Order, OrderStatus, FulfillmentType } from '../../types/order.ts';
import { OrderStatusBadge } from '../common/OrderStatusBadge.tsx';
import { Product } from '../../types/product.ts';
import { ShoppingRequest, ShoppingRequestStatus } from '../../types/shoppingRequest.ts';
import { useSellerAuth } from '../../context/SellerAuthContext.tsx';
import { useSellerLanguage } from '../../context/SellerLanguageContext.tsx';
import { SellerTab } from './common/SellerBottomNav.tsx';
import { calculateOrderTotal } from '../../services/pricingEngine.ts';

interface HomeScreenProps {
  orders: Order[];
  products: Product[];
  shoppingRequests?: ShoppingRequest[];
  onSelectTab: (tab: SellerTab) => void;
  onOpenShopStatus: () => void;
  onViewOrderDetails: (order: Order) => void;
  onOpenShoppingRequest?: (request: ShoppingRequest) => void;
  onAcceptOrder: (orderId: string) => Promise<void>;
  onRejectOrder: (orderId: string) => Promise<void>;
  onOpenAddProduct: () => void;
  onOpenVoiceAssistant?: () => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  orders,
  products,
  shoppingRequests = [],
  onSelectTab,
  onOpenShopStatus,
  onViewOrderDetails,
  onOpenShoppingRequest,
  onAcceptOrder,
  onRejectOrder,
  onOpenAddProduct,
  onOpenVoiceAssistant,
}) => {
  const { shop } = useSellerAuth();
  const { language } = useSellerLanguage();

  const [processingOrderId, setProcessingOrderId] = useState<string | null>(null);

  if (!shop) return null;

  // 1. Incoming Shopping Requests (Voice / Text)
  const pendingRequests = shoppingRequests.filter(
    (r) => r.status === ShoppingRequestStatus.PENDING_SELLER_REVIEW
  );

  // 2. Pending Orders (Requires Seller Acceptance)
  const pendingOrders = orders.filter((o) => o.status === OrderStatus.CONFIRMED);

  // 3. Orders Currently Being Packed
  const packingOrders = orders.filter(
    (o) => o.status === OrderStatus.ACCEPTED || o.status === OrderStatus.PREPARING
  );

  // 4. Completed & Active Orders
  const completedOrders = orders.filter((o) => o.status === OrderStatus.COMPLETED);
  const activeOrders = orders.filter(
    (o) =>
      o.status === OrderStatus.ACCEPTED ||
      o.status === OrderStatus.PREPARING ||
      o.status === OrderStatus.READY_FOR_PICKUP ||
      o.status === OrderStatus.OUT_FOR_DELIVERY
  );

  // 5. Earnings & Low Stock Calculations
  const todayEarnings = completedOrders.reduce(
    (sum, o) => sum + (o.financials?.sellerNetAmount || calculateOrderTotal(o)),
    0
  );

  const lowStockProducts = products.filter((p) => {
    if (!p) return false;
    const stock = p.currentStockInBaseUnits ?? p.inventory?.currentStockInBaseUnits ?? 0;
    const threshold = p.lowStockThresholdInBaseUnits ?? p.inventory?.lowStockThreshold ?? 5;
    return stock <= threshold;
  });

  // 6. Recent Orders (sorted by placedAt/createdAt desc)
  const recentOrders = [...orders]
    .sort(
      (a, b) =>
        new Date(b.timeline?.placedAt || b.createdAt || 0).getTime() -
        new Date(a.timeline?.placedAt || a.createdAt || 0).getTime()
    )
    .slice(0, 5);

  // 7. Interactive Sales Overview (7 Days of the week ending in 'आज')
  const weeklyDaysConfig = [
    { id: 'mon', name: 'सोमवार', dayOfWeek: 1, isToday: false },
    { id: 'tue', name: 'मंगलवार', dayOfWeek: 2, isToday: false },
    { id: 'wed', name: 'बुधवार', dayOfWeek: 3, isToday: false },
    { id: 'thu', name: 'गुरुवार', dayOfWeek: 4, isToday: false },
    { id: 'fri', name: 'शुक्रवार', dayOfWeek: 5, isToday: false },
    { id: 'sat', name: 'शनिवार', dayOfWeek: 6, isToday: false },
    { id: 'today', name: 'आज', dayOfWeek: 0, isToday: true },
  ];

  // Default selected day is 'आज' (index 6)
  const [selectedDayIndex, setSelectedDayIndex] = useState<number>(6);

  const now = new Date();
  const currentDayOfWeek = now.getDay();

  const weeklyData = weeklyDaysConfig.map((day) => {
    const matchedOrders = orders.filter((order) => {
      const dateStr = order.createdAt || (order as any).timeline?.placedAt;
      if (!dateStr) return false;
      const orderDate = new Date(dateStr);

      const isSameCalendarDate =
        orderDate.getFullYear() === now.getFullYear() &&
        orderDate.getMonth() === now.getMonth() &&
        orderDate.getDate() === now.getDate();

      if (day.isToday) {
        return isSameCalendarDate || orderDate.getDay() === 0;
      }

      if (isSameCalendarDate && currentDayOfWeek === day.dayOfWeek) {
        return true;
      }

      return orderDate.getDay() === day.dayOfWeek;
    });

    const validOrders = matchedOrders.filter(
      (o) => o.status !== OrderStatus.CANCELLED && o.status !== OrderStatus.PAYMENT_FAILED
    );

    const sales = validOrders.reduce(
      (sum, o) => sum + (o.financials?.sellerNetAmount || calculateOrderTotal(o)),
      0
    );

    const completedCount = matchedOrders.filter((o) => o.status === OrderStatus.COMPLETED).length;
    const activeCount = matchedOrders.filter(
      (o) =>
        o.status === OrderStatus.ACCEPTED ||
        o.status === OrderStatus.PREPARING ||
        o.status === OrderStatus.READY_FOR_PICKUP ||
        o.status === OrderStatus.OUT_FOR_DELIVERY ||
        o.status === OrderStatus.CONFIRMED
    ).length;
    const cancelledCount = matchedOrders.filter((o) => o.status === OrderStatus.CANCELLED).length;

    return {
      id: day.id,
      name: day.name,
      dayOfWeek: day.dayOfWeek,
      isToday: day.isToday,
      sales,
      ordersCount: matchedOrders.length,
      completedCount,
      activeCount,
      cancelledCount,
      orders: matchedOrders,
    };
  });

  const weeklyTotalSales = weeklyData.reduce((sum, d) => sum + d.sales, 0);
  const selectedDayData = weeklyData[selectedDayIndex] || weeklyData[6];

  // Dynamic Chart Points Calculation
  const maxSales = Math.max(...weeklyData.map((d) => d.sales), 100);
  const chartPoints = weeklyData.map((d, index) => {
    const x = 50 + index * 100;
    const ratio = maxSales > 0 ? d.sales / maxSales : 0;
    const y = 145 - ratio * 115;
    return { x, y, sales: d.sales, index, data: d };
  });

  const createSmoothPath = (pts: { x: number; y: number }[]) => {
    if (pts.length === 0) return '';
    let path = `M ${pts[0].x} ${pts[0].y}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[i];
      const p1 = pts[i + 1];
      const mx = (p0.x + p1.x) / 2;
      path += ` C ${mx} ${p0.y}, ${mx} ${p1.y}, ${p1.x} ${p1.y}`;
    }
    return path;
  };

  const linePath = createSmoothPath(chartPoints);
  const areaPath = `${linePath} L ${chartPoints[chartPoints.length - 1].x} 145 L ${chartPoints[0].x} 145 Z`;

  const handleAction = async (orderId: string, action: 'accept' | 'reject') => {
    setProcessingOrderId(orderId);
    try {
      if (action === 'accept') {
        await onAcceptOrder(orderId);
      } else {
        await onRejectOrder(orderId);
      }
    } finally {
      setProcessingOrderId(null);
    }
  };

  return (
    <div id="seller-home-dashboard" className="p-3 sm:p-4 space-y-4 max-w-4xl mx-auto text-slate-100 pb-24 sm:pb-28">
      
      {/* ==================================================================== */}
      {/* SECTION 1: NEW CUSTOMER SHOPPING REQUESTS (Voice / Text Orders)     */}
      {/* ==================================================================== */}
      <section id="home-section-shopping-requests" className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-xl bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center text-cyan-300 shadow-[0_0_10px_rgba(6,182,212,0.3)]">
              <Mic className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
            </div>
            <div>
              <h2 className="text-xs sm:text-sm font-black text-white flex items-center gap-1.5">
                <span>{language === 'hi' ? 'ग्राहक खरीदारी पर्चियाँ (Shopping Requests)' : 'Customer Shopping Requests'}</span>
                {pendingRequests.length > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full bg-cyan-400 text-slate-950 text-[10px] font-black animate-pulse">
                    {pendingRequests.length} {language === 'hi' ? 'नई' : 'New'}
                  </span>
                )}
              </h2>
              <p className="text-[10px] text-cyan-300/80">
                {language === 'hi'
                  ? 'ग्राहकों द्वारा बोलकर या लिखकर भेजी गई पर्चियाँ'
                  : 'Incoming voice and text shopping lists'}
              </p>
            </div>
          </div>

          {onOpenVoiceAssistant && (
            <button
              type="button"
              onClick={onOpenVoiceAssistant}
              className="px-2.5 py-1 rounded-xl bg-[#0b142c] hover:bg-cyan-950/60 text-cyan-300 border border-cyan-500/30 text-[11px] font-bold flex items-center gap-1 transition cursor-pointer"
            >
              <Sparkles className="w-3 h-3 text-cyan-400" />
              <span>{language === 'hi' ? 'AI सहायक' : 'AI Assistant'}</span>
            </button>
          )}
        </div>

        {pendingRequests.length > 0 ? (
          <div className="space-y-2">
            {pendingRequests.map((req) => (
              <div
                key={req.id}
                onClick={() => onOpenShoppingRequest?.(req)}
                className="bg-gradient-to-r from-cyan-950/80 via-[#0c1c3d] to-[#070e24] border border-cyan-500/35 hover:border-cyan-400/60 rounded-2xl p-3 shadow-lg shadow-black/40 flex items-center justify-between gap-3 transition cursor-pointer group"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-black text-xs text-white group-hover:text-cyan-300 transition">
                      {req.customerName || (language === 'hi' ? 'ग्राहक' : 'Customer')}
                    </span>
                    <span className="font-mono text-[10px] text-cyan-400/90 bg-cyan-950/80 px-1.5 py-0.5 rounded-md border border-cyan-500/25">
                      {req.requestNumber}
                    </span>
                    {req.customerPhone && (
                      <span className="text-[10px] text-slate-400 font-mono">
                        {req.customerPhone}
                      </span>
                    )}
                  </div>
                  {req.rawVoiceTranscript && (
                    <p className="text-[11px] text-slate-300 truncate italic mt-1 bg-black/25 px-2 py-1 rounded-lg border border-cyan-500/10">
                      "{req.rawVoiceTranscript}"
                    </p>
                  )}
                  {req.parsedItems && req.parsedItems.length > 0 && (
                    <div className="flex items-center gap-1.5 mt-1.5 text-[10px] text-slate-400 truncate">
                      <span className="font-bold text-cyan-300">
                        {req.parsedItems.length} {language === 'hi' ? 'सामान:' : 'items:'}
                      </span>
                      <span className="truncate">
                        {req.parsedItems.map((item) => `${item.rawText || item.productName} (${item.quantity} ${item.unit})`).join(', ')}
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenShoppingRequest?.(req);
                    }}
                    className="px-3 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs shadow-[0_0_12px_rgba(6,182,212,0.4)] transition cursor-pointer active:scale-95 flex items-center gap-1"
                  >
                    <span>{language === 'hi' ? 'पर्ची का बिल बनाएं' : 'Create Bill'}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-3 rounded-2xl bg-[#0b142c]/60 border border-cyan-500/15 flex items-center justify-between gap-3 text-xs text-slate-400">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
              <span>{language === 'hi' ? 'कोई नई ग्राहक पर्ची पेंडिंग नहीं है' : 'No pending shopping requests at this moment'}</span>
            </div>
            <span className="text-[10px] font-mono text-cyan-400/80">Ready</span>
          </div>
        )}
      </section>

      {/* ==================================================================== */}
      {/* SECTION 2: PENDING / NEW ORDERS (Orders Requiring Action)            */}
      {/* ==================================================================== */}
      <section id="home-section-pending-orders" className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-300 shadow-[0_0_10px_rgba(245,158,11,0.25)]">
              <ShoppingBag className="w-3.5 h-3.5 text-amber-400" />
            </div>
            <div>
              <h2 className="text-xs sm:text-sm font-black text-white flex items-center gap-1.5">
                <span>{language === 'hi' ? 'नए व पेंडिंग ऑर्डर्स (Pending Orders)' : 'Pending / New Orders'}</span>
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                  pendingOrders.length > 0 ? 'bg-amber-400 text-slate-950 animate-pulse' : 'bg-slate-800 text-slate-400'
                }`}>
                  {pendingOrders.length}
                </span>
              </h2>
              <p className="text-[10px] text-slate-400">
                {language === 'hi'
                  ? 'ग्राहकों के नए ऑर्डर्स - तुरंत स्वीकार या अस्वीकार करें'
                  : 'Orders awaiting your acceptance or rejection'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => onSelectTab('orders')}
            className="text-xs font-bold text-cyan-300 hover:text-cyan-200 flex items-center gap-0.5 cursor-pointer"
          >
            <span>{language === 'hi' ? 'सभी ऑर्डर्स' : 'All Orders'}</span>
            <ChevronRight className="w-3 h-3" />
          </button>
        </div>

        {pendingOrders.length > 0 ? (
          <div className="space-y-2">
            {pendingOrders.map((order) => {
              const totalAmount = calculateOrderTotal(order);
              const isProcessing = processingOrderId === order.id;

              return (
                <div
                  key={order.id}
                  onClick={() => onViewOrderDetails(order)}
                  className="p-3 rounded-2xl bg-[#0b142c]/95 border border-amber-500/40 hover:border-amber-400 shadow-md shadow-black/40 transition cursor-pointer"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-xs text-white">
                          {order.customerName}
                        </span>
                        <span className="font-mono text-[10px] text-amber-300 bg-amber-950/70 border border-amber-500/30 px-1.5 py-0.2 rounded-md">
                          {order.orderNumber}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {order.fulfillmentType === FulfillmentType.STORE_PICKUP ? '🏪 स्टोर पिकअप' : '🚚 होम डिलीवरी'}
                        </span>
                      </div>

                      {/* Items Preview */}
                      <div className="text-[11px] text-slate-300 mt-1 truncate">
                        {order.items.map((it) => `${it.productNameHindi || it.productName} (${it.quantity})`).join(', ')}
                      </div>

                      <div className="flex items-center gap-2.5 mt-2 text-[11px]">
                        <span className="font-mono font-black text-white text-xs">
                          ₹{totalAmount.toFixed(0)}
                        </span>
                        <span className="text-slate-500">•</span>
                        <span className="text-slate-400 font-mono text-[10px]">
                          {order.items.length} सामान
                        </span>
                        {order.timeline?.placedAt && (
                          <>
                            <span className="text-slate-500">•</span>
                            <span className="text-slate-400 text-[10px] flex items-center gap-0.5">
                              <Clock className="w-2.5 h-2.5" />
                              {new Date(order.timeline.placedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Action Buttons: Accept / Reject */}
                    <div className="flex items-center gap-1.5 shrink-0 self-center">
                      <button
                        type="button"
                        disabled={isProcessing}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAction(order.id, 'reject');
                        }}
                        className="p-2 rounded-xl bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-500/30 text-xs font-bold transition cursor-pointer disabled:opacity-50 active:scale-95"
                        title="अस्वीकार करें"
                      >
                        <XCircle className="w-4 h-4 text-rose-400" />
                      </button>

                      <button
                        type="button"
                        disabled={isProcessing}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAction(order.id, 'accept');
                        }}
                        className="px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs shadow-[0_0_12px_rgba(16,185,129,0.4)] transition cursor-pointer disabled:opacity-50 active:scale-95 flex items-center gap-1.5"
                      >
                        <Check className="w-3.5 h-3.5 stroke-[3px]" />
                        <span>{language === 'hi' ? 'स्वीकार करें' : 'Accept'}</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-3 rounded-2xl bg-[#0b142c]/60 border border-cyan-500/15 flex items-center justify-between gap-3 text-xs text-slate-400">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{language === 'hi' ? 'सभी नए ऑर्डर्स प्रोसेस हो चुके हैं' : 'No pending orders waiting for approval'}</span>
            </div>
            <span className="text-[10px] font-mono text-emerald-400">All Clear</span>
          </div>
        )}
      </section>

      {/* ==================================================================== */}
      {/* SECTION 3: PACKING (Orders Currently Being Packed)                   */}
      {/* ==================================================================== */}
      <section id="home-section-packing" className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-xl bg-teal-500/20 border border-teal-400/40 flex items-center justify-center text-teal-300 shadow-[0_0_10px_rgba(20,184,166,0.25)]">
              <ClipboardList className="w-3.5 h-3.5 text-teal-400" />
            </div>
            <div>
              <h2 className="text-xs sm:text-sm font-black text-white flex items-center gap-1.5">
                <span>{language === 'hi' ? 'पैकिंग स्टेज (Orders in Packing)' : 'Packing Orders'}</span>
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                  packingOrders.length > 0 ? 'bg-cyan-400 text-slate-950' : 'bg-slate-800 text-slate-400'
                }`}>
                  {packingOrders.length}
                </span>
              </h2>
              <p className="text-[10px] text-slate-400">
                {language === 'hi'
                  ? 'स्वीकृत ऑर्डर्स - सामान तोलें व पैक करें'
                  : 'Accepted orders currently being weighed and packed'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => onSelectTab('packing')}
            className="text-xs font-bold text-cyan-300 hover:text-cyan-200 flex items-center gap-0.5 cursor-pointer"
          >
            <span>{language === 'hi' ? 'पैकिंग स्क्रीन खोलें' : 'Open Packing'}</span>
            <ChevronRight className="w-3 h-3" />
          </button>
        </div>

        {packingOrders.length > 0 ? (
          <div className="space-y-2">
            {packingOrders.map((order) => {
              const totalAmount = calculateOrderTotal(order);

              return (
                <div
                  key={order.id}
                  onClick={() => onViewOrderDetails(order)}
                  className="p-3 rounded-2xl bg-[#0b142c]/90 border border-teal-500/30 hover:border-teal-400 shadow-md shadow-black/40 transition cursor-pointer flex items-center justify-between gap-3"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-xs text-white">
                        {order.customerName}
                      </span>
                      <span className="font-mono text-[10px] text-teal-300 bg-teal-950/70 border border-teal-500/30 px-1.5 py-0.2 rounded-md">
                        {order.orderNumber}
                      </span>
                      <span className="text-[10px] text-cyan-300 font-bold">
                        {order.fulfillmentType === FulfillmentType.STORE_PICKUP ? '🏪 पिकअप' : '🚚 डिलीवरी'}
                      </span>
                    </div>

                    <div className="text-[11px] text-slate-300 mt-1 truncate">
                      {order.items.map((it) => `${it.productNameHindi || it.productName} (${it.quantity})`).join(', ')}
                    </div>

                    <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-1.5 font-mono">
                      <span>{order.items.length} सामान</span>
                      <span>•</span>
                      <span className="text-cyan-300 font-bold">₹{totalAmount.toFixed(0)}</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectTab('packing');
                    }}
                    className="px-3 py-1.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-black text-xs shadow-[0_0_10px_rgba(20,184,166,0.35)] shrink-0 transition cursor-pointer active:scale-95 flex items-center gap-1"
                  >
                    <span>{language === 'hi' ? 'पैकिंग करें' : 'Pack'}</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-3 rounded-2xl bg-[#0b142c]/60 border border-cyan-500/15 flex items-center justify-between gap-3 text-xs text-slate-400">
            <div className="flex items-center gap-2">
              <Package className="w-4 h-4 text-cyan-400 shrink-0" />
              <span>{language === 'hi' ? 'वर्तमान में कोई ऑर्डर पैकिंग में नहीं है' : 'No orders in packing queue'}</span>
            </div>
            <button
              type="button"
              onClick={() => onSelectTab('orders')}
              className="text-[10px] font-bold text-cyan-400 hover:underline cursor-pointer"
            >
              {language === 'hi' ? 'ऑर्डर्स देखें' : 'View Orders'}
            </button>
          </div>
        )}
      </section>

      {/* ==================================================================== */}
      {/* SECTION 4: RECENT ORDERS (Latest Transactions) - ABOVE CORE KPIS    */}
      {/* ==================================================================== */}
      <section id="home-section-recent-orders" className="bg-[#0b142c]/90 border border-cyan-500/20 rounded-3xl p-3.5 sm:p-4 shadow-xl shadow-black/40 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xs sm:text-sm font-black text-white flex items-center gap-1.5">
              <ShoppingBag className="w-3.5 h-3.5 text-cyan-400" />
              <span>{language === 'hi' ? 'हाल के ऑर्डर्स (Recent Orders)' : 'Recent Orders'}</span>
            </h2>
            <p className="text-[10px] text-slate-400">{language === 'hi' ? 'नवीनतम ग्राहक लेन-देन व डिलीवरी स्थिति' : 'Latest customer transactions & status'}</p>
          </div>
          <button
            type="button"
            onClick={() => onSelectTab('orders')}
            className="text-xs font-bold text-cyan-300 hover:text-cyan-200 flex items-center gap-1 transition cursor-pointer px-2.5 py-1 rounded-xl bg-cyan-950/50 hover:bg-cyan-900/60 border border-cyan-500/20"
          >
            <span>{language === 'hi' ? 'सभी देखें' : 'View All'}</span>
            <ChevronRight className="w-3 h-3" />
          </button>
        </div>

        <div className="space-y-2.5">
          {recentOrders.length === 0 ? (
            <div className="py-6 text-center text-slate-400 text-xs rounded-2xl bg-slate-900/60 border border-dashed border-slate-800">
              <CheckCircle2 className="w-6 h-6 text-cyan-400 mx-auto mb-1.5 opacity-80" />
              <p className="font-bold text-slate-300">{language === 'hi' ? 'कोई सक्रिय ऑर्डर नहीं है' : 'No active orders'}</p>
            </div>
          ) : (
            recentOrders.map((order) => {
              const firstItem = order.items?.[0];
              const totalAmount = calculateOrderTotal(order);
              const isConfirmed = order.status === OrderStatus.CONFIRMED;
              const isProcessing = processingOrderId === order.id;

              return (
                <div
                  key={order.id}
                  onClick={() => onViewOrderDetails(order)}
                  className="p-3 rounded-2xl bg-[#070e24]/90 border border-cyan-500/15 hover:border-cyan-400/40 transition flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 cursor-pointer group shadow-sm hover:shadow-cyan-950/40"
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-cyan-950/60 border border-cyan-500/30 overflow-hidden shrink-0 flex items-center justify-center shadow-inner">
                      {firstItem?.productImage ? (
                        <img
                          src={firstItem.productImage}
                          alt={firstItem.productName}
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <Package className="w-5 h-5 text-cyan-400" />
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-xs text-white group-hover:text-cyan-300 transition truncate">
                          {order.customerName}
                        </span>
                        <span className="font-mono text-[10px] text-cyan-400/90 bg-cyan-950/80 px-1.5 py-0.5 rounded border border-cyan-500/25 shrink-0">
                          {order.orderNumber}
                        </span>
                        <span className="text-[10px] text-slate-400 shrink-0">
                          {order.fulfillmentType === FulfillmentType.STORE_PICKUP ? '🏪 पिकअप' : '🚚 डिलीवरी'}
                        </span>
                      </div>
                      
                      <div className="text-[11px] text-slate-300 mt-1 truncate">
                        {order.items.map((it) => `${it.productNameHindi || it.productName} (${it.quantity})`).join(', ')}
                      </div>

                      <div className="flex items-center gap-2.5 text-[10px] text-slate-400 mt-1 font-mono">
                        <span className="font-black text-xs text-white font-mono">
                          ₹{totalAmount.toFixed(0)}
                        </span>
                        <span>•</span>
                        <span>{order.items.length} आइटम</span>
                        {(order.timeline?.placedAt || order.createdAt) && (
                          <>
                            <span>•</span>
                            <span className="flex items-center gap-0.5 text-slate-400 font-sans">
                              <Clock className="w-2.5 h-2.5" />
                              {new Date(order.timeline?.placedAt || order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-2 shrink-0 pt-1.5 sm:pt-0 border-t sm:border-t-0 border-cyan-500/10">
                    {isConfirmed ? (
                      <div className="flex items-center gap-1.5 w-full sm:w-auto">
                        <button
                          type="button"
                          disabled={isProcessing}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAction(order.id, 'reject');
                          }}
                          className="px-2.5 py-1.5 rounded-xl bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-500/30 text-xs font-bold transition cursor-pointer disabled:opacity-50 active:scale-95"
                          title="अस्वीकार करें"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          disabled={isProcessing}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAction(order.id, 'accept');
                          }}
                          className="flex-1 sm:flex-initial px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs shadow-[0_0_10px_rgba(16,185,129,0.4)] cursor-pointer active:scale-95 flex items-center justify-center gap-1"
                        >
                          <Check className="w-3.5 h-3.5 stroke-[3px]" />
                          <span>{language === 'hi' ? 'स्वीकार करें' : 'Accept'}</span>
                        </button>
                      </div>
                    ) : (
                        <OrderStatusBadge
                          status={order.status}
                          variant="seller"
                          size="sm"
                          language={language}
                        />
                    )}
                    <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-cyan-400 transition hidden sm:block" />
                  </div>
                </div>
              );
            })
          )}
        </div>
      </section>

      {/* ==================================================================== */}
      {/* SECTION 5: SALES OVERVIEW (Interactive Real 7-Day Chart)             */}
      {/* ==================================================================== */}
      <section id="home-section-sales-overview" className="bg-[#0b142c]/90 border border-cyan-500/20 rounded-3xl p-3.5 sm:p-4 shadow-xl shadow-black/40 space-y-3.5">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <h2 className="text-xs sm:text-sm font-black text-white flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-cyan-400" />
              <span>{language === 'hi' ? 'बिक्री अवलोकन (Sales Overview)' : 'Sales Overview'}</span>
            </h2>
            <p className="text-[10px] text-cyan-300/70">
              {language === 'hi'
                ? 'साप्ताहिक वास्तविक बिक्री व ऑर्डर्स • किसी भी दिन को छूकर विवरण देखें'
                : 'Weekly actual sales & orders • Tap any day to inspect'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-black text-cyan-300 bg-cyan-950/70 border border-cyan-400/30 px-2.5 py-1 rounded-xl shadow-sm">
              ₹{weeklyTotalSales > 0 ? weeklyTotalSales.toLocaleString('en-IN') : '0'} / {language === 'hi' ? 'सप्ताह' : 'wk'}
            </span>
          </div>
        </div>

        {/* Interactive SVG Real Area & Bar Graph */}
        <div className="w-full bg-[#060c20]/80 border border-cyan-500/15 rounded-2xl p-2 sm:p-3 relative overflow-hidden select-none">
          <div className="w-full h-36 sm:h-44 relative">
            <svg
              className="w-full h-full overflow-visible"
              viewBox="0 0 700 160"
              preserveAspectRatio="none"
            >
              <defs>
                <linearGradient id="realSalesGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.4" />
                  <stop offset="60%" stopColor="#06b6d4" stopOpacity="0.1" />
                  <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.0" />
                </linearGradient>
                <linearGradient id="activeColumnGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#22d3ee" stopOpacity="0.02" />
                </linearGradient>
              </defs>

              {/* Horizontal Reference Grid Lines */}
              <line x1="20" y1="30" x2="680" y2="30" stroke="#06b6d4" strokeOpacity="0.1" strokeDasharray="3 3" />
              <line x1="20" y1="87" x2="680" y2="87" stroke="#06b6d4" strokeOpacity="0.1" strokeDasharray="3 3" />
              <line x1="20" y1="145" x2="680" y2="145" stroke="#06b6d4" strokeOpacity="0.25" />

              {/* Vertical Columns and Highlights for each of the 7 Days */}
              {chartPoints.map((pt) => {
                const isSelected = selectedDayIndex === pt.index;
                const barHeight = 145 - pt.y;

                return (
                  <g key={pt.index} className="cursor-pointer">
                    {/* Active Column Light Beam */}
                    {isSelected && (
                      <rect
                        x={pt.x - 40}
                        y="10"
                        width="80"
                        height="135"
                        fill="url(#activeColumnGrad)"
                        rx="8"
                      />
                    )}

                    {/* Bar Cylinder */}
                    {barHeight > 4 && (
                      <rect
                        x={pt.x - 12}
                        y={pt.y}
                        width="24"
                        height={barHeight}
                        rx="6"
                        fill={isSelected ? '#22d3ee' : '#0891b2'}
                        fillOpacity={isSelected ? 0.8 : 0.35}
                        stroke={isSelected ? '#67e8f9' : '#06b6d4'}
                        strokeOpacity={isSelected ? 0.9 : 0.4}
                        strokeWidth={isSelected ? 1.5 : 1}
                      />
                    )}

                    {/* Guideline to axis */}
                    <line
                      x1={pt.x}
                      y1={pt.y}
                      x2={pt.x}
                      y2="145"
                      stroke={isSelected ? '#22d3ee' : '#0e7490'}
                      strokeOpacity={isSelected ? 0.6 : 0.2}
                      strokeWidth="1"
                      strokeDasharray={isSelected ? 'none' : '2 2'}
                    />
                  </g>
                );
              })}

              {/* Area Gradient Fill Under Curve */}
              {maxSales > 0 && (
                <path
                  d={areaPath}
                  fill="url(#realSalesGrad)"
                />
              )}

              {/* Glowing Line Spline */}
              <path
                d={linePath}
                fill="none"
                stroke="#22d3ee"
                strokeWidth="3"
                className="drop-shadow-[0_0_10px_#22d3ee]"
              />

              {/* Data Point Nodes and Touch Targets */}
              {chartPoints.map((pt) => {
                const isSelected = selectedDayIndex === pt.index;

                return (
                  <g
                    key={pt.index}
                    onClick={() => setSelectedDayIndex(pt.index)}
                    onTouchStart={() => setSelectedDayIndex(pt.index)}
                    className="cursor-pointer"
                  >
                    {/* Broad Invisible Hitbox for touch accuracy on mobile */}
                    <rect
                      x={pt.x - 45}
                      y="0"
                      width="90"
                      height="160"
                      fill="transparent"
                    />

                    {/* Outer Ring on selected */}
                    {isSelected && (
                      <>
                        <circle
                          cx={pt.x}
                          cy={pt.y}
                          r="12"
                          fill="none"
                          stroke="#34d399"
                          strokeWidth="2"
                          opacity="0.8"
                          className="animate-pulse"
                        />
                        <circle
                          cx={pt.x}
                          cy={pt.y}
                          r="18"
                          fill="#34d399"
                          opacity="0.15"
                        />
                      </>
                    )}

                    {/* Node Dot */}
                    <circle
                      cx={pt.x}
                      cy={pt.y}
                      r={isSelected ? 6.5 : 4.5}
                      fill={isSelected ? '#34d399' : '#06b6d4'}
                      stroke="#070e24"
                      strokeWidth="2"
                    />

                    {/* Tooltip Pill directly on active point */}
                    {isSelected && (
                      <g transform={`translate(${pt.x}, ${Math.max(18, pt.y - 14)})`}>
                        <rect
                          x="-32"
                          y="-16"
                          width="64"
                          height="18"
                          rx="9"
                          fill="#0b142c"
                          stroke="#34d399"
                          strokeWidth="1.5"
                        />
                        <text
                          x="0"
                          y="-4"
                          textAnchor="middle"
                          fill="#34d399"
                          fontSize="10"
                          fontWeight="900"
                          fontFamily="monospace"
                        >
                          ₹{pt.sales.toFixed(0)}
                        </text>
                      </g>
                    )}
                  </g>
                );
              })}
            </svg>
          </div>

          {/* 7 Days Complete Labels Row (Full Hindi Names) */}
          <div className="grid grid-cols-7 gap-1 pt-2 border-t border-cyan-500/15">
            {weeklyData.map((d, index) => {
              const isSelected = selectedDayIndex === index;

              return (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => setSelectedDayIndex(index)}
                  onTouchStart={() => setSelectedDayIndex(index)}
                  className={`py-1.5 px-0.5 sm:px-1 rounded-xl flex flex-col items-center justify-center transition-all cursor-pointer select-none active:scale-95 ${
                    isSelected
                      ? 'bg-cyan-400 text-slate-950 font-black shadow-[0_0_12px_rgba(6,182,212,0.6)] border border-cyan-300 scale-105 z-10'
                      : 'bg-[#070e24]/70 hover:bg-[#0c1a3d] text-slate-300 border border-cyan-500/15'
                  }`}
                >
                  <span className={`text-[9px] sm:text-xs font-bold leading-tight truncate ${isSelected ? 'text-slate-950 font-black' : 'text-slate-300'}`}>
                    {d.name}
                  </span>
                  <span className={`text-[8px] sm:text-[9px] font-mono leading-none mt-0.5 truncate ${
                    isSelected ? 'text-slate-900 font-black' : d.sales > 0 ? 'text-cyan-400 font-bold' : 'text-slate-500'
                  }`}>
                    ₹{d.sales > 0 ? d.sales.toFixed(0) : '0'}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected Day Live Data Breakdown */}
        <div className="p-3 rounded-2xl bg-[#070e24]/90 border border-cyan-500/20 shadow-md space-y-2">
          <div className="flex items-center justify-between flex-wrap gap-1.5">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs font-black text-white">
                {selectedDayData.isToday ? '✨ आज (Today) का व्यापार विवरण' : `📅 ${selectedDayData.name} का व्यापार विवरण`}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-black text-cyan-300 bg-cyan-950/70 border border-cyan-500/30 px-2 py-0.5 rounded-lg">
                कुल बिक्री: ₹{selectedDayData.sales.toFixed(0)}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center text-[10px]">
            <div className="p-2 rounded-xl bg-[#0b142c] border border-cyan-500/15">
              <div className="text-slate-400">{language === 'hi' ? 'कुल ऑर्डर्स' : 'Total Orders'}</div>
              <div className="font-mono text-sm font-black text-white mt-0.5">
                {selectedDayData.ordersCount}
              </div>
            </div>
            <div className="p-2 rounded-xl bg-[#0b142c] border border-emerald-500/20">
              <div className="text-emerald-400/90">{language === 'hi' ? 'पूर्ण ऑर्डर्स' : 'Completed'}</div>
              <div className="font-mono text-sm font-black text-emerald-300 mt-0.5">
                {selectedDayData.completedCount}
              </div>
            </div>
            <div className="p-2 rounded-xl bg-[#0b142c] border border-amber-500/20">
              <div className="text-amber-400/90">{language === 'hi' ? 'सक्रिय / पेंडिंग' : 'Active/Pending'}</div>
              <div className="font-mono text-sm font-black text-amber-300 mt-0.5">
                {selectedDayData.activeCount}
              </div>
            </div>
          </div>

          {selectedDayData.ordersCount === 0 ? (
            <div className="p-2.5 rounded-xl bg-[#0b142c]/60 border border-dashed border-cyan-500/15 text-center text-xs text-slate-400">
              {language === 'hi'
                ? '₹0 • इस दिन कोई ऑर्डर या बिक्री दर्ज नहीं हुई'
                : '₹0 • No orders or sales recorded for this day'}
            </div>
          ) : (
            <div className="space-y-1.5 pt-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                {language === 'hi' ? 'इस दिन के ऑर्डर्स सूची:' : 'Orders on this day:'}
              </span>
              <div className="max-h-36 overflow-y-auto space-y-1.5 pr-1">
                {selectedDayData.orders.map((o) => (
                  <div
                    key={o.id}
                    onClick={() => onViewOrderDetails(o)}
                    className="p-2 rounded-xl bg-[#0b142c] hover:bg-[#0e1d42] border border-cyan-500/15 hover:border-cyan-400/30 flex items-center justify-between gap-2 transition cursor-pointer text-xs"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-white truncate">{o.customerName}</span>
                        <span className="font-mono text-[10px] text-cyan-400">{o.orderNumber}</span>
                      </div>
                      <div className="text-[10px] text-slate-400 truncate">
                        {o.items.length} आइटम • {o.fulfillmentType === FulfillmentType.STORE_PICKUP ? 'पिकअप' : 'डिलीवरी'}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="font-mono font-bold text-white text-xs">
                        ₹{calculateOrderTotal(o).toFixed(0)}
                      </span>
                      <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ==================================================================== */}
      {/* SECTION 6: BUSINESS DASHBOARD / CORE KPIs (Sales, Orders, Pending)   */}
      {/* ==================================================================== */}
      <section id="home-section-kpi-dashboard" className="space-y-2 pt-1">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold text-cyan-400/90 uppercase tracking-wider flex items-center gap-1.5">
            <TrendingUp className="w-3.5 h-3.5 text-cyan-400" />
            <span>{language === 'hi' ? 'व्यापार डैशबोर्ड (Core KPIs)' : 'Business Dashboard'}</span>
          </h2>
          <span className="text-[10px] text-slate-400 font-mono">Live Mandi Hub</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {/* A) Today's Sales */}
          <div
            onClick={() => onSelectTab('earnings')}
            className="p-3 rounded-2xl bg-[#0b142c]/90 border border-cyan-500/20 hover:border-cyan-400/50 shadow-md transition cursor-pointer flex flex-col justify-between"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-400 uppercase">
                {language === 'hi' ? "आज की बिक्री" : "Today's Sales"}
              </span>
              <span className="px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center gap-0.5">
                <TrendingUp className="w-2.5 h-2.5" /> +12%
              </span>
            </div>
            <div className="font-mono text-lg font-black text-cyan-300 mt-1">
              ₹{todayEarnings.toFixed(0)}
            </div>
            <span className="text-[10px] text-slate-400 mt-0.5">
              {completedOrders.length} {language === 'hi' ? 'पूर्ण आर्डर' : 'completed'}
            </span>
          </div>

          {/* B) Total Orders */}
          <div
            onClick={() => onSelectTab('orders')}
            className="p-3 rounded-2xl bg-[#0b142c]/90 border border-cyan-500/20 hover:border-cyan-400/50 shadow-md transition cursor-pointer flex flex-col justify-between"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-400 uppercase">
                {language === 'hi' ? "कुल ऑर्डर्स" : "Total Orders"}
              </span>
              <span className="px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 flex items-center gap-0.5">
                <TrendingUp className="w-2.5 h-2.5" /> +8%
              </span>
            </div>
            <div className="font-mono text-lg font-black text-white mt-1">
              {orders.length}
            </div>
            <span className="text-[10px] text-cyan-400/80 mt-0.5">
              {activeOrders.length} {language === 'hi' ? 'प्रक्रिया में' : 'active'}
            </span>
          </div>

          {/* C) Pending Orders */}
          <div
            onClick={() => onSelectTab('orders')}
            className="p-3 rounded-2xl bg-[#0b142c]/90 border border-cyan-500/20 hover:border-amber-400/50 shadow-md transition cursor-pointer flex flex-col justify-between"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-400 uppercase">
                {language === 'hi' ? "पेंडिंग ऑर्डर्स" : "Pending Orders"}
              </span>
              <span
                className={`px-1.5 py-0.2 rounded-full text-[9px] font-black border ${
                  pendingOrders.length > 0
                    ? 'bg-rose-500/20 border-rose-400/40 text-rose-300 animate-pulse'
                    : 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
                }`}
              >
                {pendingOrders.length > 0 ? 'Action' : 'OK'}
              </span>
            </div>
            <div
              className={`font-mono text-lg font-black mt-1 ${
                pendingOrders.length > 0 ? 'text-rose-400' : 'text-emerald-400'
              }`}
            >
              {pendingOrders.length}
            </div>
            <span className="text-[10px] text-slate-400 mt-0.5">
              {pendingOrders.length > 0
                ? language === 'hi'
                  ? 'स्वीकार करें'
                  : 'Action needed'
                : language === 'hi'
                ? 'कोई पेंडिंग नहीं'
                : 'Up to date'}
            </span>
          </div>

          {/* D) Completed Orders */}
          <div
            onClick={() => onSelectTab('orders')}
            className="p-3 rounded-2xl bg-[#0b142c]/90 border border-cyan-500/20 hover:border-emerald-400/50 shadow-md transition cursor-pointer flex flex-col justify-between"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-400 uppercase">
                {language === 'hi' ? "पूर्ण ऑर्डर्स" : "Completed"}
              </span>
              <span className="px-1.5 py-0.2 rounded-full text-[9px] font-black border bg-emerald-500/15 border-emerald-500/30 text-emerald-300">
                Done
              </span>
            </div>
            <div className="font-mono text-lg font-black text-emerald-400 mt-1">
              {completedOrders.length}
            </div>
            <span className="text-[10px] text-slate-400 mt-0.5">
              {language === 'hi' ? 'सफलतापूर्वक दिए गए' : 'Delivered / Picked'}
            </span>
          </div>
        </div>

        {/* Low Stock Warning Alert if any */}
        {lowStockProducts.length > 0 && (
          <div
            onClick={() => onSelectTab('products')}
            className="p-3 rounded-2xl bg-rose-950/30 border border-rose-500/30 flex items-center justify-between gap-2 shadow-sm cursor-pointer hover:border-rose-400/60 transition"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-rose-500/20 border border-rose-400/40 text-rose-300 flex items-center justify-center shrink-0">
                <Boxes className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-black text-rose-200 flex items-center gap-1.5">
                  <span>{language === 'hi' ? 'कम स्टॉक चेतावनी' : 'Low Stock Warning'}</span>
                  <span className="px-1.5 py-0.2 rounded-full bg-rose-500 text-white text-[10px] font-black">
                    {lowStockProducts.length} सामान
                  </span>
                </div>
                <p className="text-[10px] text-rose-300/80 truncate mt-0.5">
                  {lowStockProducts.map((p) => p.nameHindi || p.name).slice(0, 3).join(', ')}
                </p>
              </div>
            </div>
            <span className="text-xs font-bold text-rose-300 flex items-center gap-0.5 shrink-0">
              <span>{language === 'hi' ? 'स्टॉक अपडेट' : 'Update'}</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </span>
          </div>
        )}

        {/* Unique Home Quick Actions (Only unique non-bottom-nav actions) */}
        <div className="grid grid-cols-2 gap-2.5 pt-1">
          <button
            type="button"
            id="home-action-add-product"
            onClick={onOpenAddProduct}
            className="p-3 rounded-2xl bg-[#0b142c]/80 hover:bg-cyan-950/40 border border-cyan-500/20 hover:border-cyan-400/50 shadow-md transition flex items-center justify-center gap-2.5 text-center cursor-pointer group"
          >
            <div className="w-8 h-8 rounded-xl bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 flex items-center justify-center group-hover:scale-110 transition-transform shrink-0">
              <Plus className="w-4 h-4" />
            </div>
            <div className="text-left">
              <span className="text-xs font-bold text-white block">
                {language === 'hi' ? 'सामान जोड़ें' : 'Add Product'}
              </span>
              <span className="text-[10px] text-cyan-300/70 block">
                {language === 'hi' ? 'नया प्रोडक्ट' : 'List new item'}
              </span>
            </div>
          </button>

          <button
            type="button"
            id="home-action-reports"
            onClick={() => onSelectTab('earnings')}
            className="p-3 rounded-2xl bg-[#0b142c]/80 hover:bg-cyan-950/40 border border-cyan-500/20 hover:border-cyan-400/50 shadow-md transition flex items-center justify-center gap-2.5 text-center cursor-pointer group"
          >
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 flex items-center justify-center group-hover:scale-110 transition-transform shrink-0">
              <FileBarChart className="w-4 h-4" />
            </div>
            <div className="text-left">
              <span className="text-xs font-bold text-white block">
                {language === 'hi' ? 'रिपोर्ट्स' : 'Reports'}
              </span>
              <span className="text-[10px] text-emerald-300/70 block">
                {language === 'hi' ? 'कमाई व हिसाब' : 'Sales & Earnings'}
              </span>
            </div>
          </button>
        </div>
      </section>
    </div>
  );
};

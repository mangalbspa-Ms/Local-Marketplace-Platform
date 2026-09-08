/**
 * Main Application Entry Point - Local Market Marketplace (Seller Hub)
 * 
 * Phase 2: Complete, professional Android-style Mobile-First Seller App UI.
 * Connects directly to existing backend services, strictly enforcing shop isolation,
 * fractional pricing, order state machine, and financial transparency.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { SellerAuthProvider, useSellerAuth } from './context/SellerAuthContext.tsx';
import { SellerLanguageProvider, useSellerLanguage } from './context/SellerLanguageContext.tsx';
import { CustomerApp } from './components/customer/CustomerApp.tsx';
import { SellerHeader } from './components/seller/common/SellerHeader.tsx';
import { SellerBottomNav, SellerTab } from './components/seller/common/SellerBottomNav.tsx';
import { LoginScreen } from './components/seller/LoginScreen.tsx';
import { HomeScreen } from './components/seller/HomeScreen.tsx';
import { OrdersScreen } from './components/seller/orders/OrdersScreen.tsx';
import { PackingScreen } from './components/seller/orders/PackingScreen.tsx';
import { PickupVerificationScreen } from './components/seller/orders/PickupVerificationScreen.tsx';
import { DeliveryTrackingScreen } from './components/seller/orders/DeliveryTrackingScreen.tsx';
import { ProductsScreen } from './components/seller/products/ProductsScreen.tsx';
import { InventoryScreen } from './components/seller/products/InventoryScreen.tsx';
import { AddProductModal } from './components/seller/products/AddProductModal.tsx';
import { EarningsScreen } from './components/seller/finance/EarningsScreen.tsx';
import { ShopProfileScreen } from './components/seller/profile/ShopProfileScreen.tsx';
import { NotificationsScreen } from './components/seller/common/NotificationsScreen.tsx';
import { ShopStatusModal } from './components/seller/ShopStatusModal.tsx';
import { OrderDetailModal } from './components/seller/orders/OrderDetailModal.tsx';
import { AIVoiceAssistantModal } from './components/seller/ai/AIVoiceAssistantModal.tsx';
import { Order, OrderStatus } from './types/order.ts';
import { Product, CreateProductDTO } from './types/product.ts';
import { ShoppingRequest } from './types/shoppingRequest.ts';
import { AppNotification } from './types/notification.ts';
import { sellerApi } from './services/sellerApi.ts';
import { SellerShoppingRequestModal } from './components/seller/orders/SellerShoppingRequestModal.tsx';
import { Store, ShoppingBag, ArrowLeftRight, Shield, Mic, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';
import { AdminPortal } from './components/admin/AdminPortal.tsx';

function SellerAppInner() {
  const { user, shop, isAuthenticated, isLoading } = useSellerAuth();
  const { language, t } = useSellerLanguage();

  const [currentTab, setCurrentTab] = useState<SellerTab>('home');
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [shoppingRequests, setShoppingRequests] = useState<ShoppingRequest[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Modals state
  const [isShopStatusOpen, setIsShopStatusOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isAddProductOpen, setIsAddProductOpen] = useState(false);
  const [isVoiceAssistantOpen, setIsVoiceAssistantOpen] = useState(false);
  const [selectedOrderForDetail, setSelectedOrderForDetail] = useState<Order | null>(null);
  const [selectedOrderForPickup, setSelectedOrderForPickup] = useState<Order | null>(null);
  const [selectedShoppingRequest, setSelectedShoppingRequest] = useState<ShoppingRequest | null>(null);

  // Load shop products, orders, and voice shopping requests
  const loadData = useCallback(async () => {
    if (!shop) return;
    setIsRefreshing(true);
    try {
      const [orderList, productList, notifList, requestList] = await Promise.all([
        sellerApi.getOrders(),
        sellerApi.getShopProducts(shop.id),
        sellerApi.getNotifications(),
        sellerApi.getShoppingRequests().catch(() => [] as ShoppingRequest[]),
      ]);
      setOrders(orderList);
      setProducts(productList);
      setNotifications(notifList);
      setShoppingRequests(requestList);
    } catch (err) {
      console.error('Failed to fetch seller data', err);
    } finally {
      setIsRefreshing(false);
    }
  }, [shop]);

  useEffect(() => {
    if (isAuthenticated && shop) {
      loadData();
      // Periodically refresh data every 10 seconds for real-time order alerts
      const interval = setInterval(loadData, 10000);
      return () => clearInterval(interval);
    }
  }, [isAuthenticated, shop, loadData]);

  // Order Handlers
  const handleAcceptOrder = async (orderId: string) => {
    try {
      const updated = await sellerApi.updateOrderStatus(orderId, OrderStatus.ACCEPTED, 'Order accepted by seller');
      setOrders((prev) => prev.map((o) => (o.id === orderId ? updated : o)));
      if (selectedOrderForDetail?.id === orderId) {
        setSelectedOrderForDetail(updated);
      }
    } catch (err) {
      console.error('Failed to accept order', err);
    }
  };

  const handleRejectOrder = async (orderId: string) => {
    try {
      const updated = await sellerApi.updateOrderStatus(orderId, OrderStatus.CANCELLED, 'Order rejected by seller');
      setOrders((prev) => prev.map((o) => (o.id === orderId ? updated : o)));
      if (selectedOrderForDetail?.id === orderId) {
        setSelectedOrderForDetail(updated);
      }
    } catch (err) {
      console.error('Failed to reject order', err);
    }
  };

  const handleUpdateOrderStatus = async (orderId: string, targetStatus: OrderStatus, note?: string) => {
    const updated = await sellerApi.updateOrderStatus(orderId, targetStatus, note);
    setOrders((prev) => prev.map((o) => (o.id === orderId ? updated : o)));
    if (selectedOrderForDetail?.id === orderId) {
      setSelectedOrderForDetail(updated);
    }
    // Refresh products in case stock changed
    if (shop) {
      const updatedProducts = await sellerApi.getShopProducts(shop.id);
      setProducts(updatedProducts);
    }
  };

  const handleCompletePacking = async (orderId: string, isPickup: boolean) => {
    const targetStatus = isPickup ? OrderStatus.READY_FOR_PICKUP : OrderStatus.OUT_FOR_DELIVERY;
    await handleUpdateOrderStatus(orderId, targetStatus, 'Items weighed, packed & sealed');
  };

  const handleCompletePickup = async (orderId: string, enteredPin: string) => {
    await handleUpdateOrderStatus(orderId, OrderStatus.COMPLETED, `Pickup PIN ${enteredPin} verified at counter`);
    setSelectedOrderForPickup(null);
  };

  // Product Handlers
  const handleCreateProduct = async (data: CreateProductDTO) => {
    if (!shop) return;
    const created = await sellerApi.createProduct(shop.id, data);
    setProducts((prev) => [created, ...prev]);
  };

  const handleUpdateProduct = async (productId: string, updates: Partial<Product>) => {
    const updated = await sellerApi.updateProduct(productId, updates as any);
    setProducts((prev) => prev.map((p) => (p.id === productId ? updated : p)));
  };

  const handleUpdateStock = async (productId: string, newStock: number) => {
    const updated = await sellerApi.updateStock(productId, newStock);
    setProducts((prev) => prev.map((p) => (p.id === productId ? updated : p)));
  };

  const handleDeleteProduct = async (productId: string) => {
    await sellerApi.deleteProduct(productId);
    setProducts((prev) => prev.filter((p) => p.id !== productId));
  };

  // Notification Handlers
  const handleMarkNotificationAsRead = async (id: string) => {
    await sellerApi.markNotificationAsRead(id);
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );
  };

  const handleMarkAllNotificationsAsRead = async () => {
    await sellerApi.markAllNotificationsAsRead();
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  // Loading Splash
  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center space-y-4 text-slate-100">
        <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
        <div className="text-sm font-bold text-slate-300">
          व्यापार केंद्र प्रारंभ हो रहा है (Loading Seller Hub)...
        </div>
      </div>
    );
  }

  // If not authenticated, render Login Screen
  if (!isAuthenticated || !shop) {
    return <LoginScreen />;
  }

  const unreadNotifsCount = notifications.filter((n) => !n.isRead).length;
  const pendingOrdersCount = orders.filter((o) => o.status === OrderStatus.CONFIRMED).length;
  const preparingOrdersCount = orders.filter(
    (o) => o.status === OrderStatus.ACCEPTED || o.status === OrderStatus.PREPARING
  ).length;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans pb-24 max-w-md mx-auto relative shadow-md border-x border-slate-200">
      {/* Top Android App Bar Header */}
      <SellerHeader
        unreadNotifsCount={unreadNotifsCount}
        onOpenNotifications={() => setIsNotificationsOpen(true)}
        onOpenShopStatus={() => setIsShopStatusOpen(true)}
        onRefresh={loadData}
        isRefreshing={isRefreshing}
      />

      {/* Main Tab Screen Content */}
      <main className="min-h-[calc(100vh-140px)]">
        {currentTab === 'home' && (
          <HomeScreen
            orders={orders}
            products={products}
            shoppingRequests={shoppingRequests}
            onSelectTab={setCurrentTab}
            onOpenShopStatus={() => setIsShopStatusOpen(true)}
            onViewOrderDetails={(order) => setSelectedOrderForDetail(order)}
            onOpenShoppingRequest={(req) => setSelectedShoppingRequest(req)}
            onAcceptOrder={handleAcceptOrder}
            onRejectOrder={handleRejectOrder}
            onOpenAddProduct={() => setIsAddProductOpen(true)}
            onOpenVoiceAssistant={() => setIsVoiceAssistantOpen(true)}
          />
        )}

        {currentTab === 'orders' && (
          <OrdersScreen
            orders={orders}
            onViewOrderDetails={(order) => setSelectedOrderForDetail(order)}
            onOpenPacking={(order) => {
              setCurrentTab('packing');
            }}
            onOpenPickupVerification={(order) => {
              setSelectedOrderForPickup(order);
            }}
          />
        )}

        {currentTab === 'packing' && (
          <PackingScreen
            orders={orders}
            onCompletePacking={handleCompletePacking}
            onViewOrderDetails={(order) => setSelectedOrderForDetail(order)}
          />
        )}

        {currentTab === 'products' && (
          <ProductsScreen
            products={products}
            onCreateProduct={handleCreateProduct}
            onUpdateProduct={handleUpdateProduct}
            onDeleteProduct={handleDeleteProduct}
            onOpenVoiceAssistant={() => setIsVoiceAssistantOpen(true)}
          />
        )}

        {currentTab === 'earnings' && (
          <EarningsScreen orders={orders} />
        )}

        {currentTab === 'more' && (
          <ShopProfileScreen />
        )}
      </main>

      {/* Floating AI Voice Assistant Trigger */}
      <div className="fixed bottom-20 right-4 z-40">
        <button
          onClick={() => setIsVoiceAssistantOpen(true)}
          className="group relative flex items-center gap-2 p-3 bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white rounded-full shadow-2xl shadow-emerald-950/60 border border-emerald-400/40 transform active:scale-95 transition-all"
          title="AI Dukan Sahayak (Voice & Photo)"
        >
          <span className="absolute -top-1 -right-1 flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
          </span>
          <Mic className="w-5 h-5 text-white" />
          <span className="text-xs font-black pr-1 hidden group-hover:inline">
            {language === 'hi' ? 'बोलें' : 'AI Sahayak'}
          </span>
        </button>
      </div>

      {/* Fixed Android Bottom Navigation Bar */}
      <SellerBottomNav
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        pendingOrdersCount={pendingOrdersCount}
        preparingOrdersCount={preparingOrdersCount}
      />

      {/* --- Global Modals --- */}

      {/* 1. Shop Operational Status Modal (Screen 3) */}
      <ShopStatusModal
        isOpen={isShopStatusOpen}
        onClose={() => setIsShopStatusOpen(false)}
      />

      {/* 2. Order Detail & State Progression Modal (Screens 5 & 6) */}
      <OrderDetailModal
        isOpen={!!selectedOrderForDetail}
        order={selectedOrderForDetail}
        onClose={() => setSelectedOrderForDetail(null)}
        onUpdateStatus={handleUpdateOrderStatus}
        onOpenPacking={(order) => {
          setSelectedOrderForDetail(null);
          setCurrentTab('packing');
        }}
        onOpenPickupVerification={(order) => {
          setSelectedOrderForDetail(null);
          setSelectedOrderForPickup(order);
        }}
      />

      {/* 3. Pickup PIN Handover Modal (Screen 8) */}
      {selectedOrderForPickup && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md">
            <PickupVerificationScreen
              orders={[selectedOrderForPickup]}
              onCompletePickup={handleCompletePickup}
              onViewOrderDetails={(order) => {
                setSelectedOrderForPickup(null);
                setSelectedOrderForDetail(order);
              }}
            />
            <div className="text-center pt-2">
              <button
                onClick={() => setSelectedOrderForPickup(null)}
                className="px-4 py-1.5 rounded-xl bg-slate-800 text-xs font-bold text-slate-300"
              >
                Close Handover Screen
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. Add / Edit Product Modal (Screens 11 & 12) */}
      <AddProductModal
        isOpen={isAddProductOpen}
        onClose={() => setIsAddProductOpen(false)}
        onSave={handleCreateProduct}
      />

      {/* 5. Notifications Drawer / Modal (Screen 18) */}
      {isNotificationsOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4"
          onClick={() => setIsNotificationsOpen(false)}
        >
          <div
            className="bg-slate-900 border border-slate-800 rounded-t-3xl sm:rounded-3xl w-full max-w-md max-h-[90vh] overflow-y-auto shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <NotificationsScreen
              notifications={notifications}
              onMarkAsRead={handleMarkNotificationAsRead}
              onMarkAllAsRead={handleMarkAllNotificationsAsRead}
              onClose={() => setIsNotificationsOpen(false)}
            />
            <div className="p-4 border-t border-slate-800">
              <button
                onClick={() => setIsNotificationsOpen(false)}
                className="w-full py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300"
              >
                {language === 'hi' ? 'बंद करें (Close)' : 'Close'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. AI Voice & Photo Assistant Modal (Gemini 3.7 Flash) */}
      <AIVoiceAssistantModal
        isOpen={isVoiceAssistantOpen}
        onClose={() => setIsVoiceAssistantOpen(false)}
        onSuccessAction={() => {
          loadData();
          confetti({
            particleCount: 50,
            spread: 60,
            origin: { y: 0.8 },
          });
        }}
      />

      {/* 7. Seller Voice Shopping Request Review & Bill Finalization Modal */}
      <SellerShoppingRequestModal
        isOpen={!!selectedShoppingRequest}
        request={selectedShoppingRequest}
        onClose={() => setSelectedShoppingRequest(null)}
        onBillFinalized={(updated) => {
          setSelectedShoppingRequest(null);
          loadData();
          confetti({
            particleCount: 40,
            spread: 50,
            origin: { y: 0.7 },
          });
        }}
      />
    </div>
  );
}

export default function App() {
  const [activePortal, setActivePortal] = useState<'customer' | 'seller' | 'admin'>(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      if (params.get('token') || params.get('portal') === 'seller') return 'seller';
      if (params.get('portal') === 'admin') return 'admin';
    } catch {
      // fallback
    }
    return 'customer';
  });

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col">
      {/* Top Marketplace Role Switcher Bar */}
      <aside aria-label="Portal Navigation" className="sticky top-0 z-50 bg-slate-950/95 backdrop-blur-md border-b border-slate-800/80 px-3 py-1.5 flex items-center justify-between text-xs max-w-lg mx-auto w-full">
        <div className="flex items-center gap-1.5 text-slate-400 font-extrabold text-[11px]">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-slate-200">LOCAL MANDI PLATFORM</span>
        </div>

        <div className="flex items-center bg-slate-900 border border-slate-700/80 p-0.5 rounded-xl">
          <button
            onClick={() => setActivePortal('customer')}
            className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-black transition-all ${
              activePortal === 'customer'
                ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <ShoppingBag className="w-3 h-3" />
            <span className="hidden xs:inline">Customer</span>
          </button>

          <button
            onClick={() => setActivePortal('seller')}
            className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-black transition-all ${
              activePortal === 'seller'
                ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Store className="w-3 h-3" />
            <span className="hidden xs:inline">Seller</span>
          </button>

          <button
            onClick={() => setActivePortal('admin')}
            className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-black transition-all ${
              activePortal === 'admin'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Shield className="w-3 h-3" />
            <span>Admin</span>
          </button>
        </div>
      </aside>

      {/* Render Active Subsystem */}
      <div className="flex-1">
        {activePortal === 'customer' ? (
          <CustomerApp />
        ) : activePortal === 'seller' ? (
          <SellerLanguageProvider>
            <SellerAuthProvider>
              <SellerAppInner />
            </SellerAuthProvider>
          </SellerLanguageProvider>
        ) : (
          <AdminPortal />
        )}
      </div>
    </div>
  );
}

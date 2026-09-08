/**
 * Customer Marketplace App Container
 * 
 * Manages the Customer App UI workflow including:
 * - Local Mandi Home & Category Filtering
 * - Cross-Shop Search & Compare Rates
 * - Smart AI Voice Assistant (Hindi / Hinglish / English)
 * - Shop Storefront & Fractional Portion Selection
 * - Single-Shop Cart & Transparent 3-Step Checkout
 * - Server-Verified Payments
 * - Real-Time Live Order Tracking with 4-Digit Pickup PIN
 * - Customer Profile & Preferences
 */

import React, { useState } from 'react';
import { CustomerAuthProvider } from '../../context/CustomerAuthContext.tsx';
import { CustomerMarketProvider, useCustomerMarket } from '../../context/CustomerMarketContext.tsx';
import { CustomerCartProvider, useCustomerCart } from '../../context/CustomerCartContext.tsx';
import { CustomerLanguageProvider, useCustomerLanguage } from '../../context/CustomerLanguageContext.tsx';
import { CustomerHeader } from './common/CustomerHeader.tsx';
import { CustomerBottomNav, CustomerTab } from './common/CustomerBottomNav.tsx';
import { HomeScreen } from './HomeScreen.tsx';
import { SearchScreen } from './search/SearchScreen.tsx';
import { ShopStorefront } from './storefront/ShopStorefront.tsx';
import { CartScreen } from './cart/CartScreen.tsx';
import { CartConflictModal } from './cart/CartConflictModal.tsx';
import { PaymentModal } from './payment/PaymentModal.tsx';
import { OrdersListScreen } from './orders/OrdersListScreen.tsx';
import { LiveOrderTrackingModal } from './orders/LiveOrderTrackingModal.tsx';
import { AddressSelectionModal } from './cart/AddressSelectionModal.tsx';
import { NotificationsModal } from './common/NotificationsModal.tsx';
import { VoiceAssistantModal } from './voice/VoiceAssistantModal.tsx';
import { VoiceShoppingRequestModal } from './voice/VoiceShoppingRequestModal.tsx';
import { ShoppingRequestDetailModal } from './orders/ShoppingRequestDetailModal.tsx';
import { CustomerProfileScreen } from './profile/CustomerProfileScreen.tsx';
import { Shop } from '../../types/market.ts';
import { Order } from '../../types/order.ts';
import { ShoppingRequest } from '../../types/shoppingRequest.ts';
import { customerApi } from '../../services/customerApi.ts';

const CustomerMainContent: React.FC = () => {
  const [currentTab, setCurrentTab] = useState<CustomerTab>('home');
  const [selectedShop, setSelectedShop] = useState<Shop | null>(null);
  const [searchInitialQuery, setSearchInitialQuery] = useState<string>('');

  // Modals state
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isVoiceAssistantOpen, setIsVoiceAssistantOpen] = useState(false);
  const [activeTrackingOrder, setActiveTrackingOrder] = useState<Order | null>(null);
  const [activeShoppingRequest, setActiveShoppingRequest] = useState<ShoppingRequest | null>(null);

  const handleSelectShop = (shop: Shop) => {
    setSelectedShop(shop);
  };

  const handleOpenSearch = (initialQuery?: string) => {
    setSearchInitialQuery(initialQuery || '');
    setCurrentTab('search');
  };

  const handlePaymentSuccess = (confirmedOrder: Order) => {
    setIsPaymentOpen(false);
    setActiveTrackingOrder(confirmedOrder);
    setCurrentTab('orders');
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 flex justify-center selection:bg-emerald-500 selection:text-white font-sans antialiased">
      <div className="w-full max-w-md min-h-screen bg-slate-50 flex flex-col relative border-x border-slate-200/80 shadow-2xl">
        {/* Top Header (only on non-home main tabs, storefront has its own bar, home has its integrated header) */}
        {!selectedShop && currentTab !== 'home' && (
          <CustomerHeader
            unreadNotifsCount={1}
            onOpenNotifications={() => setIsNotificationsOpen(true)}
            onOpenAddressModal={() => setIsAddressModalOpen(true)}
          />
        )}

        {/* Main Body Switcher */}
        <main className="flex-1 overflow-y-auto">
          {selectedShop ? (
            <ShopStorefront
              shop={selectedShop}
              onBack={() => setSelectedShop(null)}
              onViewCart={() => {
                setSelectedShop(null);
                setCurrentTab('cart');
              }}
              onOpenVoiceAssistant={() => setIsVoiceAssistantOpen(true)}
            />
          ) : currentTab === 'home' ? (
            <HomeScreen
              onSelectShop={handleSelectShop}
              onOpenSearch={handleOpenSearch}
              onOpenVoiceAssistant={() => setIsVoiceAssistantOpen(true)}
              onOpenNotifications={() => setIsNotificationsOpen(true)}
              onOpenProfile={() => setCurrentTab('profile')}
              onOpenAddressSelection={() => setIsAddressModalOpen(true)}
            />
          ) : currentTab === 'search' ? (
            <SearchScreen
              initialQuery={searchInitialQuery}
              onSelectShop={handleSelectShop}
            />
          ) : currentTab === 'cart' ? (
            <CartScreen
              onPaymentSuccess={handlePaymentSuccess}
              onOpenPayment={() => setIsPaymentOpen(true)}
              onBrowseShops={() => setCurrentTab('home')}
            />
          ) : currentTab === 'orders' ? (
            <OrdersListScreen
              onBrowseShops={() => setCurrentTab('home')}
              onOpenStorefront={(shopId) => {
                customerApi.getShops().then((shops) => {
                  const s = shops.find((x) => x.id === shopId);
                  if (s) {
                    setSelectedShop(s);
                  }
                });
              }}
            />
          ) : currentTab === 'profile' ? (
            <CustomerProfileScreen
              onOpenOrders={() => setCurrentTab('orders')}
              onBrowseShops={() => setCurrentTab('home')}
              onOpenVoiceAssistant={() => setIsVoiceAssistantOpen(true)}
              onOpenNotifications={() => setIsNotificationsOpen(true)}
            />
          ) : null}
        </main>

        {/* Bottom Navigation (Fixed) */}
        {!selectedShop && (
          <CustomerBottomNav
            currentTab={currentTab}
            onSelectTab={(tab) => {
              setSelectedShop(null);
              if (tab === 'voice') {
                setIsVoiceAssistantOpen(true);
              } else {
                setCurrentTab(tab);
              }
            }}
            onOpenVoice={() => setIsVoiceAssistantOpen(true)}
          />
        )}

        {/* Global Cart Conflict Modal (Enforces Single-Shop Cart Rule) */}
        <CartConflictModal />

        {/* Payment Gateway Modal */}
        <PaymentModal
          isOpen={isPaymentOpen}
          onClose={() => setIsPaymentOpen(false)}
          onPaymentSuccess={handlePaymentSuccess}
        />

        {/* Address Selection Modal */}
        <AddressSelectionModal
          isOpen={isAddressModalOpen}
          onClose={() => setIsAddressModalOpen(false)}
        />

        {/* Notifications Modal */}
        <NotificationsModal
          isOpen={isNotificationsOpen}
          onClose={() => setIsNotificationsOpen(false)}
        />

        {/* Voice Assistant Modal */}
        {isVoiceAssistantOpen && (
          <VoiceShoppingRequestModal
            isOpen={isVoiceAssistantOpen}
            targetShop={selectedShop || undefined}
            onClose={() => setIsVoiceAssistantOpen(false)}
            onRequestSubmitted={(req) => {
              setActiveShoppingRequest(req);
              setCurrentTab('orders');
            }}
          />
        )}

        {/* Live Shopping Request Detail & Bill Payment Modal */}
        <ShoppingRequestDetailModal
          isOpen={!!activeShoppingRequest}
          request={activeShoppingRequest}
          onClose={() => setActiveShoppingRequest(null)}
          onOrderPaid={(confirmed) => {
            setActiveShoppingRequest(null);
            setActiveTrackingOrder(confirmed);
            setCurrentTab('orders');
          }}
        />

        {/* Live Order Tracking Modal */}
        <LiveOrderTrackingModal
          order={activeTrackingOrder}
          isOpen={!!activeTrackingOrder}
          onClose={() => setActiveTrackingOrder(null)}
        />
      </div>
    </div>
  );
};

export const CustomerApp: React.FC = () => {
  return (
    <CustomerLanguageProvider>
      <CustomerAuthProvider>
        <CustomerMarketProvider>
          <CustomerCartProvider>
            <CustomerMainContent />
          </CustomerCartProvider>
        </CustomerMarketProvider>
      </CustomerAuthProvider>
    </CustomerLanguageProvider>
  );
};

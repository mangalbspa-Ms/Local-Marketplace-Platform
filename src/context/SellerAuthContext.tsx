/**
 * Seller Authentication & Active Shop Context
 * 
 * Enforces shop isolation in the UI: The seller only ever operates on their own shop.
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User, UserRole } from '../types/auth.ts';
import { Shop } from '../types/market.ts';
import { sellerApi } from '../services/sellerApi.ts';

interface SellerAuthContextType {
  user: User | null;
  shop: Shop | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (phone: string, otp: string) => Promise<void>;
  loginAsDemoSeller: (sellerUserId: string) => Promise<void>;
  logout: () => void;
  refreshShop: () => Promise<void>;
  toggleShopStatus: (isOpen: boolean, closedReason?: string, nextOpenTime?: string) => Promise<void>;
  updateFulfillmentSettings: (fulfillment: Partial<Shop['fulfillment']>) => Promise<void>;
  updateShopProfile: (updates: {
    name?: string;
    description?: string;
    phone?: string;
    photoUrl?: string;
  }) => Promise<void>;
}

// Pre-seeded demo sellers for quick testing
export const DEMO_SELLERS = [
  {
    userId: 'usr_seller_01',
    name: 'Ramesh Patel (रमेश पटेल)',
    phone: '+919820000001',
    shopId: 'shp_krishna_grocers',
    shopName: 'Shree Krishna Kirana & Grains (श्री कृष्णा किराना)',
    marketName: 'Dadar Central Vegetable & Grain Market',
    category: 'Kirana & Grocery',
  },
  {
    userId: 'usr_seller_02',
    name: 'Fatima Sheikh (फातिमा शेख)',
    phone: '+919820000002',
    shopId: 'shp_dadar_fresh_mart',
    shopName: 'Dadar Fresh Dairy & Greens (दादर फ्रेश डेयरी)',
    marketName: 'Dadar Central Vegetable & Grain Market',
    category: 'Dairy & Vegetables',
  },
];

const SellerAuthContext = createContext<SellerAuthContextType>({
  user: null,
  shop: null,
  isAuthenticated: false,
  isLoading: true,
  login: async () => {},
  loginAsDemoSeller: async () => {},
  logout: () => {},
  refreshShop: async () => {},
  toggleShopStatus: async () => {},
  updateFulfillmentSettings: async () => {},
  updateShopProfile: async () => {},
});

export const SellerAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [shop, setShop] = useState<Shop | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const refreshShop = useCallback(async () => {
    const savedShopId = localStorage.getItem('seller_shop_id') || 'shp_krishna_grocers';
    try {
      const shopData = await sellerApi.getShop(savedShopId);
      setShop(shopData);
    } catch (err) {
      console.error('Failed to load shop data', err);
    }
  }, []);

  // Initialize session
  useEffect(() => {
    const initAuth = async () => {
      setIsLoading(true);
      const savedUserId = localStorage.getItem('seller_user_id');
      const savedShopId = localStorage.getItem('seller_shop_id');
      
      if (savedUserId && savedShopId) {
        // Find matching demo seller or set basic session
        const demo = DEMO_SELLERS.find((s) => s.userId === savedUserId) || DEMO_SELLERS[0];
        setUser({
          id: demo.userId,
          phone: demo.phone,
          fullName: demo.name,
          role: UserRole.SELLER,
          shopId: demo.shopId,
          isPhoneVerified: true,
          isActive: true,
          createdAt: '2026-08-01T00:00:00Z',
          updatedAt: '2026-08-27T00:00:00Z',
        });

        try {
          const shopData = await sellerApi.getShop(demo.shopId);
          setShop(shopData);
        } catch (err) {
          console.error('Failed to bootstrap shop', err);
        }
      } else {
        // Auto-login default seller 1 for immediate preview
        const defaultSeller = DEMO_SELLERS[0];
        localStorage.setItem('seller_user_id', defaultSeller.userId);
        localStorage.setItem('seller_shop_id', defaultSeller.shopId);
        localStorage.setItem('seller_auth_token', `token_${defaultSeller.userId}`);

        setUser({
          id: defaultSeller.userId,
          phone: defaultSeller.phone,
          fullName: defaultSeller.name,
          role: UserRole.SELLER,
          shopId: defaultSeller.shopId,
          isPhoneVerified: true,
          isActive: true,
          createdAt: '2026-08-01T00:00:00Z',
          updatedAt: '2026-08-27T00:00:00Z',
        });

        try {
          const shopData = await sellerApi.getShop(defaultSeller.shopId);
          setShop(shopData);
        } catch (err) {
          console.error('Initial shop load failed', err);
        }
      }
      setIsLoading(false);
    };

    initAuth();
  }, [refreshShop]);

  const login = async (phone: string, otp: string) => {
    setIsLoading(true);
    try {
      const { token, user: loggedInUser } = await sellerApi.loginWithPhone(phone, otp);
      localStorage.setItem('seller_auth_token', token);
      localStorage.setItem('seller_user_id', loggedInUser.id);
      if (loggedInUser.shopId) {
        localStorage.setItem('seller_shop_id', loggedInUser.shopId);
        const shopData = await sellerApi.getShop(loggedInUser.shopId);
        setShop(shopData);
      }
      setUser(loggedInUser);
    } finally {
      setIsLoading(false);
    }
  };

  const loginAsDemoSeller = async (sellerUserId: string) => {
    setIsLoading(true);
    const demo = DEMO_SELLERS.find((s) => s.userId === sellerUserId) || DEMO_SELLERS[0];
    localStorage.setItem('seller_user_id', demo.userId);
    localStorage.setItem('seller_shop_id', demo.shopId);
    localStorage.setItem('seller_auth_token', `token_${demo.userId}`);

    setUser({
      id: demo.userId,
      phone: demo.phone,
      fullName: demo.name,
      role: UserRole.SELLER,
      shopId: demo.shopId,
      isPhoneVerified: true,
      isActive: true,
      createdAt: '2026-08-01T00:00:00Z',
      updatedAt: '2026-08-27T00:00:00Z',
    });

    try {
      const shopData = await sellerApi.getShop(demo.shopId);
      setShop(shopData);
    } catch (err) {
      console.error('Demo shop switch failed', err);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('seller_auth_token');
    localStorage.removeItem('seller_user_id');
    localStorage.removeItem('seller_shop_id');
    setUser(null);
    setShop(null);
  };

  const toggleShopStatus = async (isOpen: boolean, closedReason?: string, nextOpenTime?: string) => {
    if (!shop) return;
    const updated = await sellerApi.updateShopStatus(shop.id, {
      isOpen,
      closedReason,
      nextOpenTime,
    });
    setShop(updated);
  };

  const updateFulfillmentSettings = async (fulfillment: Partial<Shop['fulfillment']>) => {
    if (!shop) return;
    const updated = await sellerApi.updateShopStatus(shop.id, {
      fulfillment,
    });
    setShop(updated);
  };

  const updateShopProfile = async (profileUpdates: {
    name?: string;
    description?: string;
    phone?: string;
    photoUrl?: string;
  }) => {
    if (!shop) return;
    const updated = await sellerApi.updateShopStatus(shop.id, {
      profileUpdates,
    });
    setShop(updated);
  };

  return (
    <SellerAuthContext.Provider
      value={{
        user,
        shop,
        isAuthenticated: !!user && !!shop,
        isLoading,
        login,
        loginAsDemoSeller,
        logout,
        refreshShop,
        toggleShopStatus,
        updateFulfillmentSettings,
        updateShopProfile,
      }}
    >
      {children}
    </SellerAuthContext.Provider>
  );
};

export const useSellerAuth = () => useContext(SellerAuthContext);

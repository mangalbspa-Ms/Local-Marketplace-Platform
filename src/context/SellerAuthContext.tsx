/**
 * Seller Authentication & Active Shop Context
 * 
 * Enforces shop isolation in the UI: The seller only ever operates on their own shop.
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User, UserRole } from '../types/auth.ts';
import { Shop } from '../types/market.ts';
import { sellerApi } from '../services/sellerApi.ts';
import { PhotoApiService, ManagePhotoParams } from '../services/photoApi.ts';
import { seedShops } from '../server/storage/seedData.ts';

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
  toggleOrderAcceptance: (isAccepting: boolean) => Promise<void>;
  updateFulfillmentSettings: (fulfillment: Partial<Shop['fulfillment']>) => Promise<void>;
  updateShopProfile: (updates: {
    name?: string;
    description?: string;
    category?: string;
    phone?: string;
    email?: string;
    photoUrl?: string;
    profilePhotoUrl?: string;
    coverPhotoUrl?: string;
    coverPhotos?: (string | null)[];
    isAcceptingOrders?: boolean;
    operatingHours?: Shop['operatingHours'];
    address?: any;
    coordinates?: any;
    locationAccuracy?: number;
    locationSource?: string;
    locationUpdatedAt?: string;
    pincode?: string;
    postalData?: any;
    whatsapp?: string;
    upiPayoutId?: string;
    paymentName?: string;
    upiQrUrl?: string;
  }) => Promise<void>;
  updateShopPhoto: (params: ManagePhotoParams) => Promise<void>;
  updateSellerPhoto: (params: ManagePhotoParams) => Promise<void>;
  updateSellerProfile: (updates: {
    fullName?: string;
    phone?: string;
    email?: string;
    profilePhotoUrl?: string;
  }) => Promise<User>;
}

export const normalizeShopId = (id: string | null | undefined): string => {
  if (!id) return 'shp_krishna_grocers';
  if (id === 'shp_dadar_fresh_mart') return 'shp_green_harvest';
  return id;
};

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
    name: 'Sunil Jadhav (सुनील जाधव)',
    phone: '+919820000002',
    shopId: 'shp_green_harvest',
    shopName: 'Green Harvest Farm Produce (ग्रीन हार्वेस्ट फार्म)',
    marketName: 'Dadar Central Vegetable & Grain Market',
    category: 'Fresh Vegetables & Fruits',
  },
  {
    userId: 'usr_seller_03',
    name: 'Anil Deshmukh (अनिल देशमुख)',
    phone: '+919820000003',
    shopId: 'shp_city_dairy',
    shopName: 'City Dairy & Fresh Milk Centre (सिटी डेयरी)',
    marketName: 'Dadar Central Vegetable & Grain Market',
    category: 'Dairy & Bakery',
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
  toggleOrderAcceptance: async () => {},
  updateFulfillmentSettings: async () => {},
  updateShopProfile: async () => {},
  updateShopPhoto: async () => {},
  updateSellerPhoto: async () => {},
  updateSellerProfile: async () => ({} as User),
});

export const SellerAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [shop, setShop] = useState<Shop | null>(() => {
    const rawSavedShopId = typeof window !== 'undefined' ? localStorage.getItem('seller_shop_id') : null;
    const targetShopId = normalizeShopId(rawSavedShopId);
    if (typeof window !== 'undefined' && rawSavedShopId === 'shp_dadar_fresh_mart') {
      try { localStorage.setItem('seller_shop_id', targetShopId); } catch (e) {}
    }
    if (typeof window !== 'undefined') {
      const cached = localStorage.getItem(`seller_shop_cached_${targetShopId}`);
      if (cached) {
        try {
          return JSON.parse(cached);
        } catch (e) {}
      }
    }
    return seedShops.find((s) => s.id === targetShopId) || seedShops[0];
  });
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Auto-sync shop changes to local cache for instant reload persistence
  useEffect(() => {
    if (shop?.id && typeof window !== 'undefined') {
      try {
        localStorage.setItem(`seller_shop_cached_${shop.id}`, JSON.stringify(shop));
      } catch (e) {}
    }
  }, [shop]);

  const refreshShop = useCallback(async () => {
    const rawSavedShopId = localStorage.getItem('seller_shop_id');
    const targetShopId = normalizeShopId(rawSavedShopId);
    if (rawSavedShopId === 'shp_dadar_fresh_mart') {
      try { localStorage.setItem('seller_shop_id', targetShopId); } catch (e) {}
    }
    try {
      const shopData = await sellerApi.getShop(targetShopId);
      if (shopData) {
        setShop(shopData);
        try {
          localStorage.setItem(`seller_shop_cached_${targetShopId}`, JSON.stringify(shopData));
        } catch (e) {}
      }
    } catch (err) {
      console.warn('Network shop refresh deferred, using cached shop data:', err);
    }
  }, []);

  // Initialize session
  useEffect(() => {
    const initAuth = async () => {
      const savedUserId = localStorage.getItem('seller_user_id');
      const rawSavedShopId = localStorage.getItem('seller_shop_id');
      const savedShopId = normalizeShopId(rawSavedShopId);
      if (rawSavedShopId === 'shp_dadar_fresh_mart') {
        try { localStorage.setItem('seller_shop_id', savedShopId); } catch (e) {}
      }
      
      if (savedUserId && savedShopId) {
        // Find matching demo seller or set basic session
        const demo = DEMO_SELLERS.find((s) => s.userId === savedUserId) || DEMO_SELLERS[0];
        const activeShopId = normalizeShopId(savedShopId || demo.shopId);
        // Load cached user if available, else fallback to demo
        let loadedUser: User | null = null;
        try {
          const cachedUser = localStorage.getItem(`seller_user_cached_${demo.userId}`);
          if (cachedUser) {
            loadedUser = JSON.parse(cachedUser);
          }
        } catch (e) {}

        setUser(
          loadedUser || {
            id: demo.userId,
            phone: demo.phone,
            fullName: demo.name,
            role: UserRole.SELLER,
            shopId: activeShopId,
            isPhoneVerified: true,
            isActive: true,
            createdAt: '2026-08-01T00:00:00Z',
            updatedAt: '2026-08-27T00:00:00Z',
          }
        );

        // Sync fresh profile from server in background
        fetch('/api/me', {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('seller_auth_token') || `token_${demo.userId}`}`,
            'x-auth-user-id': demo.userId,
          },
        })
          .then((r) => r.json())
          .then((d) => {
            if (d.success && d.data) {
              setUser(d.data);
              try {
                localStorage.setItem(`seller_user_cached_${demo.userId}`, JSON.stringify(d.data));
              } catch (e) {}
            }
          })
          .catch(() => {});

        // Load cached shop if available, else seed fallback
        let loadedShop: Shop | null = null;
        try {
          const cached = localStorage.getItem(`seller_shop_cached_${activeShopId}`);
          if (cached) {
            loadedShop = JSON.parse(cached);
          }
        } catch (e) {}

        const fallbackShop = loadedShop || seedShops.find((s) => s.id === activeShopId) || seedShops[0];
        setShop(fallbackShop);

        try {
          const shopData = await sellerApi.getShop(activeShopId);
          if (shopData) {
            setShop(shopData);
            try {
              localStorage.setItem(`seller_shop_cached_${activeShopId}`, JSON.stringify(shopData));
            } catch (e) {}
          }
        } catch (err) {
          console.warn('Bootstrap shop using seed state:', err);
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

        let loadedShop: Shop | null = null;
        try {
          const cached = localStorage.getItem(`seller_shop_cached_${defaultSeller.shopId}`);
          if (cached) {
            loadedShop = JSON.parse(cached);
          }
        } catch (e) {}

        const fallbackShop = loadedShop || seedShops.find((s) => s.id === defaultSeller.shopId) || seedShops[0];
        setShop(fallbackShop);

        try {
          const shopData = await sellerApi.getShop(defaultSeller.shopId);
          if (shopData) {
            setShop(shopData);
            try {
              localStorage.setItem(`seller_shop_cached_${defaultSeller.shopId}`, JSON.stringify(shopData));
            } catch (e) {}
          }
        } catch (err) {
          console.warn('Initial shop loaded from local state:', err);
        }
      }
      setIsLoading(false);
    };

    initAuth();
  }, []);

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
    const targetShopId = normalizeShopId(demo.shopId);
    localStorage.setItem('seller_user_id', demo.userId);
    localStorage.setItem('seller_shop_id', targetShopId);
    localStorage.setItem('seller_auth_token', `token_${demo.userId}`);

    let loadedUser: User | null = null;
    try {
      const cachedUser = localStorage.getItem(`seller_user_cached_${demo.userId}`);
      if (cachedUser) {
        loadedUser = JSON.parse(cachedUser);
      }
    } catch (e) {}

    setUser(
      loadedUser || {
        id: demo.userId,
        phone: demo.phone,
        fullName: demo.name,
        role: UserRole.SELLER,
        shopId: targetShopId,
        isPhoneVerified: true,
        isActive: true,
        createdAt: '2026-08-01T00:00:00Z',
        updatedAt: '2026-08-27T00:00:00Z',
      }
    );

    // Sync fresh profile from server in background
    fetch('/api/me', {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('seller_auth_token') || `token_${demo.userId}`}`,
        'x-auth-user-id': demo.userId,
      },
    })
      .then((r) => r.json())
      .then((d) => {
        if (d.success && d.data) {
          setUser(d.data);
          try {
            localStorage.setItem(`seller_user_cached_${demo.userId}`, JSON.stringify(d.data));
          } catch (e) {}
        }
      })
      .catch(() => {});

    // Provide immediate fallback seed/cached shop state so UI never crashes
    let loadedShop: Shop | null = null;
    try {
      const cached = localStorage.getItem(`seller_shop_cached_${targetShopId}`);
      if (cached) {
        loadedShop = JSON.parse(cached);
      }
    } catch (e) {}

    const fallbackShop = loadedShop || seedShops.find((s) => s.id === targetShopId) || seedShops[0];
    setShop(fallbackShop);

    try {
      const shopData = await sellerApi.getShop(targetShopId);
      if (shopData) {
        setShop(shopData);
        try {
          localStorage.setItem(`seller_shop_cached_${targetShopId}`, JSON.stringify(shopData));
        } catch (e) {}
      }
    } catch (err) {
      console.warn('Demo shop switch deferred, keeping current/cached shop data:', err);
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

  const toggleOrderAcceptance = async (isAccepting: boolean) => {
    if (!shop) return;
    const updated = await sellerApi.updateShopStatus(shop.id, {
      isAcceptingOrders: isAccepting,
      profileUpdates: {
        isAcceptingOrders: isAccepting,
      },
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
    category?: string;
    phone?: string;
    email?: string;
    photoUrl?: string;
    profilePhotoUrl?: string;
    coverPhotoUrl?: string;
    coverPhotos?: (string | null)[];
    isAcceptingOrders?: boolean;
    operatingHours?: Shop['operatingHours'];
    address?: any;
    coordinates?: any;
    locationAccuracy?: number;
    locationSource?: string;
    locationUpdatedAt?: string;
    pincode?: string;
    postalData?: any;
    whatsapp?: string;
    upiPayoutId?: string;
    paymentName?: string;
    upiQrUrl?: string;
  }) => {
    if (!shop) return;
    const updated = await sellerApi.updateShopStatus(shop.id, {
      profileUpdates,
    });
    setShop(updated);
    try {
      localStorage.setItem(`seller_shop_cached_${shop.id}`, JSON.stringify(updated));
    } catch (e) {}
  };

  const updateShopPhoto = async (params: ManagePhotoParams) => {
    if (!shop) return;
    try {
      const updated = await PhotoApiService.manageShopPhoto(shop.id, params, 'seller');
      setShop(updated);
      try {
        localStorage.setItem(`seller_shop_cached_${shop.id}`, JSON.stringify(updated));
      } catch (e) {}
    } catch (err) {
      console.warn('Backend photo update failed, using client-side fallback:', err);
      const finalUrl = params.imageData || params.url || '';
      const updated: Shop = {
        ...shop,
        ...(params.type === 'profile'
          ? { profilePhotoUrl: finalUrl, photoUrl: finalUrl, logoImageUrl: finalUrl }
          : { coverPhotoUrl: finalUrl, bannerUrl: finalUrl, bannerImageUrl: finalUrl }),
      };
      setShop(updated);
      try {
        localStorage.setItem(`seller_shop_cached_${shop.id}`, JSON.stringify(updated));
      } catch (e) {}
    }
  };

  const updateSellerPhoto = async (params: ManagePhotoParams) => {
    if (!user) return;
    const updated = await PhotoApiService.manageUserPhoto(user.id, params, 'seller');
    setUser(updated);
    try {
      localStorage.setItem(`seller_user_cached_${user.id}`, JSON.stringify(updated));
    } catch (e) {}
  };

  const updateSellerProfile = async (updates: {
    fullName?: string;
    phone?: string;
    email?: string;
    profilePhotoUrl?: string;
  }): Promise<User> => {
    if (!user) throw new Error('No authenticated user');
    const token = localStorage.getItem('seller_auth_token') || `token_${user.id}`;
    const res = await fetch('/api/profile', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        'x-auth-user-id': user.id,
      },
      body: JSON.stringify(updates),
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error?.message || 'Failed to update personal profile');
    }
    const updatedUser: User = data.data;
    setUser(updatedUser);
    try {
      localStorage.setItem(`seller_user_cached_${user.id}`, JSON.stringify(updatedUser));
    } catch (e) {}
    return updatedUser;
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
        toggleOrderAcceptance,
        updateFulfillmentSettings,
        updateShopProfile,
        updateShopPhoto,
        updateSellerPhoto,
        updateSellerProfile,
      }}
    >
      {children}
    </SellerAuthContext.Provider>
  );
};

export const useSellerAuth = () => useContext(SellerAuthContext);

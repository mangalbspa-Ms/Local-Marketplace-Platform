/**
 * Customer Market & Discovery Context
 * 
 * Manages active local market selection, shop listings, distance calculations,
 * and smart sorting (Nearest, Rating, Fastest Delivery, Low Fee).
 */

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { LocalMarket, Shop } from '../types/market.ts';
import { customerApi } from '../services/customerApi.ts';
import { useCustomerAuth } from './CustomerAuthContext.tsx';
import { calculateDistanceKm, formatDistance } from '../core/geoUtils.ts';

export type ShopSortOption = 'nearest' | 'rating' | 'fastest' | 'fee' | 'name';

interface CustomerMarketContextType {
  markets: LocalMarket[];
  currentMarket: LocalMarket | null;
  setCurrentMarket: (market: LocalMarket) => void;
  shops: Shop[];
  rawShops: Shop[];
  isLoadingMarkets: boolean;
  isLoadingShops: boolean;
  selectedCategory: string | null;
  setSelectedCategory: (cat: string | null) => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  sortBy: ShopSortOption;
  setSortBy: (sort: ShopSortOption) => void;
  refreshShops: () => Promise<void>;
  getShopDistance: (shop: Shop) => { distanceKm: number; distanceText: string };
}

const CustomerMarketContext = createContext<CustomerMarketContextType>({
  markets: [],
  currentMarket: null,
  setCurrentMarket: () => {},
  shops: [],
  rawShops: [],
  isLoadingMarkets: true,
  isLoadingShops: true,
  selectedCategory: null,
  setSelectedCategory: () => {},
  searchQuery: '',
  setSearchQuery: () => {},
  sortBy: 'nearest',
  setSortBy: () => {},
  refreshShops: async () => {},
  getShopDistance: () => ({ distanceKm: 0.5, distanceText: '500 m' }),
});

export const CustomerMarketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { selectedAddress } = useCustomerAuth();

  const [markets, setMarkets] = useState<LocalMarket[]>([]);
  const [currentMarket, setCurrentMarket] = useState<LocalMarket | null>(null);
  const [rawShops, setRawShops] = useState<Shop[]>([]);
  const [isLoadingMarkets, setIsLoadingMarkets] = useState<boolean>(true);
  const [isLoadingShops, setIsLoadingShops] = useState<boolean>(true);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<ShopSortOption>('nearest');

  // 1. Load available markets on boot
  useEffect(() => {
    const fetchMarkets = async () => {
      setIsLoadingMarkets(true);
      try {
        const list = await customerApi.getMarkets();
        setMarkets(list);
        if (list.length > 0) {
          // Default to Dadar Mandi or first market
          const defaultMkt = list.find((m) => m.id === 'mkt_dadar_central') || list[0];
          setCurrentMarket(defaultMkt);
        }
      } catch (err) {
        console.error('Failed to load markets', err);
      } finally {
        setIsLoadingMarkets(false);
      }
    };

    fetchMarkets();
  }, []);

  // 2. Fetch shops whenever currentMarket changes
  const refreshShops = useCallback(async () => {
    if (!currentMarket) return;
    setIsLoadingShops(true);
    try {
      const shopList = await customerApi.getShops(currentMarket.id);
      setRawShops(shopList);
    } catch (err) {
      console.error('Failed to load shops for market', err);
    } finally {
      setIsLoadingShops(false);
    }
  }, [currentMarket]);

  useEffect(() => {
    refreshShops();
  }, [refreshShops]);

  // Reference coordinates for distance calculation: customer selected address or market center
  const customerCoords = useMemo(() => {
    if (selectedAddress?.coordinates && selectedAddress.coordinates.lat && selectedAddress.coordinates.lng) {
      return selectedAddress.coordinates;
    }
    if (currentMarket?.coordinates) {
      return currentMarket.coordinates;
    }
    return { lat: 19.0195, lng: 72.8441 }; // Default Dadar Mandi center
  }, [selectedAddress, currentMarket]);

  // Helper to compute distance for any shop
  const getShopDistance = useCallback(
    (shop: Shop) => {
      const dist = calculateDistanceKm(customerCoords, shop.coordinates);
      return {
        distanceKm: dist,
        distanceText: formatDistance(dist),
      };
    },
    [customerCoords]
  );

  // Decorate shops with distances and apply active sorting
  const shops = useMemo(() => {
    const decorated = rawShops.map((s) => {
      const { distanceKm, distanceText } = getShopDistance(s);
      return {
        ...s,
        distanceKm,
        distanceText,
      };
    });

    return decorated.sort((a, b) => {
      // Prioritize open shops slightly or follow strict user sorting
      if (sortBy === 'nearest') {
        return (a.distanceKm || 0) - (b.distanceKm || 0);
      }
      if (sortBy === 'rating') {
        return (b.averageRating || 0) - (a.averageRating || 0);
      }
      if (sortBy === 'fastest') {
        const timeA = a.fulfillment?.estimatedPreparationTimeMinutes || 20;
        const timeB = b.fulfillment?.estimatedPreparationTimeMinutes || 20;
        return timeA - timeB;
      }
      if (sortBy === 'fee') {
        const feeA = a.fulfillment?.deliveryFee || 0;
        const feeB = b.fulfillment?.deliveryFee || 0;
        return feeA - feeB;
      }
      if (sortBy === 'name') {
        return a.name.localeCompare(b.name);
      }
      return 0;
    });
  }, [rawShops, getShopDistance, sortBy]);

  return (
    <CustomerMarketContext.Provider
      value={{
        markets,
        currentMarket,
        setCurrentMarket,
        shops,
        rawShops,
        isLoadingMarkets,
        isLoadingShops,
        selectedCategory,
        setSelectedCategory,
        searchQuery,
        setSearchQuery,
        sortBy,
        setSortBy,
        refreshShops,
        getShopDistance,
      }}
    >
      {children}
    </CustomerMarketContext.Provider>
  );
};

export const useCustomerMarket = () => useContext(CustomerMarketContext);

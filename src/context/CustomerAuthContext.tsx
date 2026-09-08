/**
 * Customer Authentication & Profile Context
 * 
 * Manages customer session, saved delivery addresses, and seamless demo customer switching.
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User, UserAddress, UserRole } from '../types/auth.ts';
import { customerApi } from '../services/customerApi.ts';

export const DEMO_CUSTOMERS = [
  {
    id: 'usr_cust_01',
    fullName: 'Priya Sharma (प्रिया शर्मा)',
    phone: '+919876543210',
    email: 'priya.sharma@example.com',
    role: UserRole.CUSTOMER,
    addresses: [
      {
        id: 'addr_c1',
        label: 'Home (घर)',
        streetAddress: 'Flat 402, Sai Sagar Heights, Gokhale Road',
        landmark: 'Near Portuguese Church',
        area: 'Dadar West',
        city: 'Mumbai',
        pincode: '400028',
        isDefault: true,
      },
      {
        id: 'addr_c1_work',
        label: 'Work (ऑफिस)',
        streetAddress: '6th Floor, Ruby Tower, Senapati Bapat Marg',
        landmark: 'Opposite Dadar Station (West)',
        area: 'Dadar West',
        city: 'Mumbai',
        pincode: '400028',
        isDefault: false,
      },
    ],
  },
  {
    id: 'usr_cust_02',
    fullName: 'Rahul Verma (राहुल वर्मा)',
    phone: '+919833445566',
    email: 'rahul.verma@example.com',
    role: UserRole.CUSTOMER,
    addresses: [
      {
        id: 'addr_c2',
        label: 'Home (घर)',
        streetAddress: 'B-14, Shanti Niketan CHS, Ranade Road',
        landmark: 'Near Shivaji Park',
        area: 'Dadar West',
        city: 'Mumbai',
        pincode: '400028',
        isDefault: true,
      },
    ],
  },
];

interface CustomerAuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  selectedAddress: UserAddress | null;
  setSelectedAddress: (addr: UserAddress | null) => void;
  switchCustomer: (userId: string) => Promise<void>;
  addAddress: (addr: Omit<UserAddress, 'id'>) => Promise<void>;
  deleteAddress: (addressId: string) => Promise<void>;
  setDefaultAddress: (addressId: string) => Promise<void>;
  updateProfile: (updates: Partial<User>) => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const CustomerAuthContext = createContext<CustomerAuthContextType>({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  selectedAddress: null,
  setSelectedAddress: () => {},
  switchCustomer: async () => {},
  addAddress: async () => {},
  deleteAddress: async () => {},
  setDefaultAddress: async () => {},
  updateProfile: async () => {},
  refreshProfile: async () => {},
});

export const CustomerAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [selectedAddress, setSelectedAddress] = useState<UserAddress | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const refreshProfile = useCallback(async () => {
    try {
      const profile = await customerApi.getProfile();
      setUser(profile);
      const defaultAddr = profile.addresses?.find((a) => a.isDefault) || profile.addresses?.[0] || null;
      setSelectedAddress(defaultAddr);
    } catch (err) {
      console.warn('Customer profile load fallback to demo account', err);
      const demo = DEMO_CUSTOMERS[0];
      setUser({
        id: demo.id,
        fullName: demo.fullName,
        phone: demo.phone,
        email: demo.email,
        role: UserRole.CUSTOMER,
        addresses: demo.addresses,
        isPhoneVerified: true,
        isActive: true,
        createdAt: '2026-08-01T00:00:00Z',
        updatedAt: '2026-08-27T00:00:00Z',
      });
      setSelectedAddress(demo.addresses[0]);
    }
  }, []);

  useEffect(() => {
    const initCustomer = async () => {
      setIsLoading(true);
      const savedUserId = localStorage.getItem('customer_user_id') || 'usr_cust_01';
      localStorage.setItem('customer_user_id', savedUserId);
      localStorage.setItem('customer_auth_token', `token_${savedUserId}`);
      await refreshProfile();
      setIsLoading(false);
    };

    initCustomer();
  }, [refreshProfile]);

  const switchCustomer = async (userId: string) => {
    setIsLoading(true);
    localStorage.setItem('customer_user_id', userId);
    localStorage.setItem('customer_auth_token', `token_${userId}`);
    await refreshProfile();
    setIsLoading(false);
  };

  const addAddress = async (addr: Omit<UserAddress, 'id'>) => {
    const updated = await customerApi.addAddress(addr);
    setUser(updated);
    const newAdded = updated.addresses?.[updated.addresses.length - 1] || null;
    if (addr.isDefault || !selectedAddress) {
      setSelectedAddress(newAdded);
    }
  };

  const deleteAddress = async (addressId: string) => {
    const updated = await customerApi.deleteAddress(addressId);
    setUser(updated);
    if (selectedAddress?.id === addressId) {
      const nextDefault = updated.addresses?.find((a) => a.isDefault) || updated.addresses?.[0] || null;
      setSelectedAddress(nextDefault);
    }
  };

  const setDefaultAddress = async (addressId: string) => {
    const updated = await customerApi.setDefaultAddress(addressId);
    setUser(updated);
    const match = updated.addresses?.find((a) => a.id === addressId) || null;
    setSelectedAddress(match);
  };

  const updateProfile = async (updates: Partial<User>) => {
    const updated = await customerApi.updateProfile(updates);
    setUser(updated);
  };

  return (
    <CustomerAuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        selectedAddress,
        setSelectedAddress,
        switchCustomer,
        addAddress,
        deleteAddress,
        setDefaultAddress,
        updateProfile,
        refreshProfile,
      }}
    >
      {children}
    </CustomerAuthContext.Provider>
  );
};

export const useCustomerAuth = () => useContext(CustomerAuthContext);

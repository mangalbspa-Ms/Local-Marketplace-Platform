/**
 * Authentication and User Role Types
 */

export enum UserRole {
  ADMIN = 'ADMIN',
  SELLER = 'SELLER',
  CUSTOMER = 'CUSTOMER',
  DELIVERY_PERSON = 'DELIVERY_PERSON',
}

export interface UserAddress {
  id: string;
  tag: 'Home' | 'Work' | 'Other';
  recipientName: string;
  recipientPhone: string;
  addressLine1: string;
  addressLine2?: string;
  landmark?: string;
  city: string;
  pincode: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
  isDefault?: boolean;
}

export interface User {
  id: string;
  phone: string;
  email?: string;
  fullName: string;
  role: UserRole;
  avatarUrl?: string;
  shopId?: string; // Assigned if role === UserRole.SELLER
  deliveryVehicleType?: 'BICYCLE' | 'MOTORBIKE' | 'SCOOTER' | 'VAN'; // If role === DELIVERY_PERSON
  addresses: UserAddress[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AuthSession {
  token: string;
  user: User;
  expiresAt: string;
}

export interface AuthenticatedUserPayload {
  userId: string;
  id?: string;
  role: UserRole;
  shopId?: string;
  phone: string;
  email?: string;
}

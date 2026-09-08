/**
 * Customer API Service
 * 
 * Typed client communicating with the backend Express API.
 * Handles market catalog browsing, fractional product calculations,
 * single-shop orders, and server-side payment verification.
 */

import { LocalMarket, Shop } from '../types/market.ts';
import { Product } from '../types/product.ts';
import { Order, FulfillmentType } from '../types/order.ts';
import { ShoppingRequest, ShoppingRequestStatus, CreateShoppingRequestDTO } from '../types/shoppingRequest.ts';
import { PaymentIntentResponse, PaymentVerificationRequest } from '../types/payment.ts';
import { User, UserAddress } from '../types/auth.ts';
import { AppNotification } from '../types/notification.ts';

const API_BASE = '/api';

export interface CreateCustomerOrderPayload {
  shopId: string;
  fulfillmentType: FulfillmentType;
  items: Array<{
    productId: string;
    requestedMultiplier?: number;
    requestedQuantity?: number;
    requestedUnit?: string;
    quantityCount?: number;
    notes?: string;
  }>;
  deliveryAddressId?: string;
  customerNotes?: string;
}

class CustomerApiService {
  private shopProductsCache = new Map<string, { data: Product[]; timestamp: number }>();
  private shopProductsInflight = new Map<string, Promise<Product[]>>();

  private getHeaders(): HeadersInit {
    const token = localStorage.getItem('customer_auth_token') || 'token_usr_cust_01';
    const userId = localStorage.getItem('customer_user_id') || 'usr_cust_01';

    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      'x-auth-user-id': userId,
    };
  }

  // --- Markets & Shops ---
  public async getMarkets(): Promise<LocalMarket[]> {
    const res = await fetch(`${API_BASE}/markets`, {
      headers: this.getHeaders(),
    });
    const data = await res.json();
    if (!data.success) {
      throw new Error(data.error?.message || 'Failed to fetch markets');
    }
    return data.data;
  }

  public async getShops(marketId?: string): Promise<Shop[]> {
    const url = marketId ? `${API_BASE}/shops?marketId=${marketId}` : `${API_BASE}/shops`;
    const res = await fetch(url, {
      headers: this.getHeaders(),
    });
    const data = await res.json();
    if (!data.success) {
      throw new Error(data.error?.message || 'Failed to fetch shops');
    }
    return data.data;
  }

  public async getShop(shopId: string): Promise<Shop> {
    const res = await fetch(`${API_BASE}/shops/${shopId}`, {
      headers: this.getHeaders(),
    });
    const data = await res.json();
    if (!data.success) {
      throw new Error(data.error?.message || 'Failed to fetch shop');
    }
    return data.data;
  }

  // --- Products & Search ---
  public async getShopProducts(shopId: string, availableOnly = false): Promise<Product[]> {
    const cacheKey = `${shopId}_${availableOnly}`;
    const cached = this.shopProductsCache.get(cacheKey);
    // Return cached data if fresh within 30 seconds
    if (cached && Date.now() - cached.timestamp < 30000) {
      return cached.data;
    }

    // Deduplicate concurrent in-flight requests
    if (this.shopProductsInflight.has(cacheKey)) {
      return this.shopProductsInflight.get(cacheKey)!;
    }

    const fetchPromise = (async () => {
      try {
        const url = `${API_BASE}/shops/${shopId}/products${availableOnly ? '?available=true' : ''}`;
        const res = await fetch(url, {
          headers: this.getHeaders(),
        });
        const data = await res.json();
        if (!data.success) {
          // If rate limited or error occurred, fallback to stale cache if available
          if (cached) {
            return cached.data;
          }
          throw new Error(data.error?.message || 'Failed to fetch products');
        }
        this.shopProductsCache.set(cacheKey, { data: data.data, timestamp: Date.now() });
        return data.data;
      } catch (err) {
        if (cached) {
          return cached.data;
        }
        throw err;
      } finally {
        this.shopProductsInflight.delete(cacheKey);
      }
    })();

    this.shopProductsInflight.set(cacheKey, fetchPromise);
    return fetchPromise;
  }

  public async getProduct(productId: string): Promise<Product> {
    const res = await fetch(`${API_BASE}/products/${productId}`, {
      headers: this.getHeaders(),
    });
    const data = await res.json();
    if (!data.success) {
      throw new Error(data.error?.message || 'Failed to fetch product details');
    }
    return data.data;
  }

  public async searchCatalog(query: string, marketId?: string): Promise<{ product: Product; shop: Shop }[]> {
    if (!query || query.trim().length === 0) return [];
    const params = new URLSearchParams({ q: query.trim() });
    if (marketId) params.append('marketId', marketId);

    const res = await fetch(`${API_BASE}/products/search?${params.toString()}`, {
      headers: this.getHeaders(),
    });
    const data = await res.json();
    if (!data.success) {
      throw new Error(data.error?.message || 'Search failed');
    }
    return data.data;
  }

  // --- Orders & Checkout ---
  public async createOrder(payload: CreateCustomerOrderPayload): Promise<Order> {
    const res = await fetch(`${API_BASE}/orders`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!data.success) {
      throw new Error(data.error?.message || 'Failed to create order');
    }
    return data.data;
  }

  public async createPaymentIntent(orderId: string): Promise<PaymentIntentResponse> {
    const res = await fetch(`${API_BASE}/payments/create-intent`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ orderId }),
    });
    const data = await res.json();
    if (!data.success) {
      throw new Error(data.error?.message || 'Failed to initialize payment gateway');
    }
    return data.data;
  }

  public async verifyPayment(payload: PaymentVerificationRequest): Promise<{ success: boolean; orderId: string; paymentRecord: any }> {
    const res = await fetch(`${API_BASE}/payments/verify`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!data.success) {
      throw new Error(data.error?.message || 'Payment verification failed');
    }
    return data.data;
  }

  public async getMyOrders(): Promise<Order[]> {
    const res = await fetch(`${API_BASE}/orders`, {
      headers: this.getHeaders(),
    });
    const data = await res.json();
    if (!data.success) {
      throw new Error(data.error?.message || 'Failed to fetch customer orders');
    }
    return data.data;
  }

  public async getOrderDetails(orderId: string): Promise<Order> {
    const res = await fetch(`${API_BASE}/orders/${orderId}`, {
      headers: this.getHeaders(),
    });
    const data = await res.json();
    if (!data.success) {
      throw new Error(data.error?.message || 'Failed to fetch order details');
    }
    return data.data;
  }

  public async cancelOrder(orderId: string, reason?: string): Promise<Order> {
    const res = await fetch(`${API_BASE}/orders/${orderId}/status`, {
      method: 'PATCH',
      headers: this.getHeaders(),
      body: JSON.stringify({
        targetStatus: 'CANCELLED',
        note: reason || 'Cancelled by customer',
      }),
    });
    const data = await res.json();
    if (!data.success) {
      throw new Error(data.error?.message || 'Failed to cancel order');
    }
    return data.data;
  }

  public async updateOrderStatus(orderId: string, targetStatus: string, note?: string): Promise<Order> {
    const res = await fetch(`${API_BASE}/orders/${orderId}/status`, {
      method: 'PATCH',
      headers: this.getHeaders(),
      body: JSON.stringify({
        targetStatus,
        note,
      }),
    });
    const data = await res.json();
    if (!data.success) {
      throw new Error(data.error?.message || 'Failed to update order status');
    }
    return data.data;
  }

  // --- Customer Profile & Addresses ---
  public async getProfile(): Promise<User> {
    const res = await fetch(`${API_BASE}/auth/me`, {
      headers: this.getHeaders(),
    });
    const data = await res.json();
    if (!data.success) {
      throw new Error(data.error?.message || 'Failed to fetch profile');
    }
    return data.data;
  }

  public async updateProfile(updates: Partial<Pick<User, 'fullName' | 'email' | 'phone' | 'avatarUrl'>>): Promise<User> {
    const res = await fetch(`${API_BASE}/auth/profile`, {
      method: 'PATCH',
      headers: this.getHeaders(),
      body: JSON.stringify(updates),
    });
    const data = await res.json();
    if (!data.success) {
      throw new Error(data.error?.message || 'Failed to update profile');
    }
    return data.data;
  }

  public async addAddress(address: Omit<UserAddress, 'id'>): Promise<User> {
    const res = await fetch(`${API_BASE}/auth/profile/addresses`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(address),
    });
    const data = await res.json();
    if (!data.success) {
      throw new Error(data.error?.message || 'Failed to add address');
    }
    return data.data;
  }

  public async deleteAddress(addressId: string): Promise<User> {
    const res = await fetch(`${API_BASE}/auth/profile/addresses/${addressId}`, {
      method: 'DELETE',
      headers: this.getHeaders(),
    });
    const data = await res.json();
    if (!data.success) {
      throw new Error(data.error?.message || 'Failed to remove address');
    }
    return data.data;
  }

  public async setDefaultAddress(addressId: string): Promise<User> {
    const res = await fetch(`${API_BASE}/auth/profile/addresses/${addressId}/default`, {
      method: 'PATCH',
      headers: this.getHeaders(),
    });
    const data = await res.json();
    if (!data.success) {
      throw new Error(data.error?.message || 'Failed to set default address');
    }
    return data.data;
  }

  // --- Notifications ---
  public async getNotifications(): Promise<AppNotification[]> {
    const res = await fetch(`${API_BASE}/notifications`, {
      headers: this.getHeaders(),
    });
    const data = await res.json();
    if (!data.success) {
      throw new Error(data.error?.message || 'Failed to fetch notifications');
    }
    return data.data;
  }

  public async markNotificationAsRead(id: string): Promise<void> {
    await fetch(`${API_BASE}/notifications/${id}/read`, {
      method: 'PATCH',
      headers: this.getHeaders(),
    });
  }

  public async markAllNotificationsAsRead(): Promise<void> {
    await fetch(`${API_BASE}/notifications/read-all`, {
      method: 'POST',
      headers: this.getHeaders(),
    });
  }

  // --- Voice Shopping Requests & Final Bills ---
  public async createShoppingRequest(payload: CreateShoppingRequestDTO): Promise<ShoppingRequest> {
    const res = await fetch(`${API_BASE}/shopping-requests`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!data.success) {
      throw new Error(data.error?.message || 'Failed to submit shopping request');
    }
    return data.data;
  }

  public async getMyShoppingRequests(status?: ShoppingRequestStatus): Promise<ShoppingRequest[]> {
    const url = status ? `${API_BASE}/shopping-requests?status=${status}` : `${API_BASE}/shopping-requests`;
    const res = await fetch(url, {
      headers: this.getHeaders(),
    });
    const data = await res.json();
    if (!data.success) {
      throw new Error(data.error?.message || 'Failed to fetch shopping requests');
    }
    return data.data;
  }

  public async getShoppingRequest(id: string): Promise<ShoppingRequest> {
    const res = await fetch(`${API_BASE}/shopping-requests/${id}`, {
      headers: this.getHeaders(),
    });
    const data = await res.json();
    if (!data.success) {
      throw new Error(data.error?.message || 'Failed to fetch shopping request');
    }
    return data.data;
  }

  public async payShoppingRequest(
    id: string,
    paymentDetails?: { method?: string; transactionRef?: string }
  ): Promise<{ order: Order; shoppingRequest: ShoppingRequest }> {
    const res = await fetch(`${API_BASE}/shopping-requests/${id}/pay`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(paymentDetails || {}),
    });
    const data = await res.json();
    if (!data.success) {
      throw new Error(data.error?.message || 'Failed to complete payment for shopping request');
    }
    return data.data;
  }

  public async cancelShoppingRequest(id: string, reason?: string): Promise<ShoppingRequest> {
    const res = await fetch(`${API_BASE}/shopping-requests/${id}/cancel`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ reason }),
    });
    const data = await res.json();
    if (!data.success) {
      throw new Error(data.error?.message || 'Failed to cancel shopping request');
    }
    return data.data;
  }
}

export const customerApi = new CustomerApiService();

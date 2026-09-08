/**
 * Seller API Service
 * 
 * Typed frontend client communicating with the backend Express API.
 * Uses authentication tokens and enforces shop isolation.
 */

import { Shop } from '../types/market.ts';
import { Product, CreateProductDTO, UpdateProductDTO } from '../types/product.ts';
import { Order, OrderStatus } from '../types/order.ts';
import {
  ShoppingRequest,
  ShoppingRequestStatus,
  FinalizeBillDTO,
} from '../types/shoppingRequest.ts';
import {
  SellerSettlement,
  SubscriptionPlan,
  SellerSubscription,
  SubscriptionInvoice,
  BillingTransaction,
} from '../types/financial.ts';
import { AppNotification } from '../types/notification.ts';

const API_BASE = '/api';

class SellerApiService {
  private getHeaders(): HeadersInit {
    const userId = localStorage.getItem('seller_user_id') || 'usr_seller_01';
    const token = localStorage.getItem('seller_auth_token') || `token_${userId}`;
    
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      'x-auth-user-id': userId,
    };
  }

  // --- Auth & User ---
  public async loginWithPhone(phone: string, otp: string): Promise<{ token: string; user: any }> {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, otp, requestedRole: 'SELLER' }),
    });
    const data = await res.json();
    if (!data.success) {
      throw new Error(data.error?.message || 'Login failed');
    }
    return data.data;
  }

  // --- Shop Operations ---
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

  public async updateShopStatus(
    shopId: string,
    updates: {
      isOpen?: boolean;
      nextOpenTime?: string;
      closedReason?: string;
      fulfillment?: Partial<Shop['fulfillment']>;
      profileUpdates?: {
        name?: string;
        description?: string;
        phone?: string;
        photoUrl?: string;
        operatingHours?: Shop['operatingHours'];
      };
    }
  ): Promise<Shop> {
    const res = await fetch(`${API_BASE}/shops/${shopId}/status`, {
      method: 'PATCH',
      headers: this.getHeaders(),
      body: JSON.stringify(updates),
    });
    const data = await res.json();
    if (!data.success) {
      throw new Error(data.error?.message || 'Failed to update shop status');
    }
    return data.data;
  }

  // --- Products ---
  public async getShopProducts(shopId: string): Promise<Product[]> {
    const res = await fetch(`${API_BASE}/shops/${shopId}/products`, {
      headers: this.getHeaders(),
    });
    const data = await res.json();
    if (!data.success) {
      throw new Error(data.error?.message || 'Failed to fetch products');
    }
    return data.data;
  }

  public async createProduct(shopId: string, payload: CreateProductDTO): Promise<Product> {
    const res = await fetch(`${API_BASE}/shops/${shopId}/products`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!data.success) {
      throw new Error(data.error?.message || 'Failed to create product');
    }
    return data.data;
  }

  public async updateProduct(productId: string, payload: UpdateProductDTO): Promise<Product> {
    const res = await fetch(`${API_BASE}/products/${productId}`, {
      method: 'PATCH',
      headers: this.getHeaders(),
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!data.success) {
      throw new Error(data.error?.message || 'Failed to update product');
    }
    return data.data;
  }

  public async updateStock(productId: string, newStock: number): Promise<Product> {
    const res = await fetch(`${API_BASE}/products/${productId}/stock`, {
      method: 'PATCH',
      headers: this.getHeaders(),
      body: JSON.stringify({ currentStockInBaseUnits: newStock }),
    });
    const data = await res.json();
    if (!data.success) {
      throw new Error(data.error?.message || 'Failed to update stock');
    }
    return data.data;
  }

  public async deleteProduct(productId: string): Promise<{ success: boolean; id: string }> {
    const res = await fetch(`${API_BASE}/products/${productId}`, {
      method: 'DELETE',
      headers: this.getHeaders(),
    });
    const data = await res.json();
    if (!data.success) {
      throw new Error(data.error?.message || 'Failed to delete product');
    }
    return data.data;
  }

  // --- Orders ---
  public async getOrders(status?: OrderStatus): Promise<Order[]> {
    const url = status ? `${API_BASE}/orders?status=${status}` : `${API_BASE}/orders`;
    const res = await fetch(url, {
      headers: this.getHeaders(),
    });
    const data = await res.json();
    if (!data.success) {
      throw new Error(data.error?.message || 'Failed to fetch orders');
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

  public async updateOrderStatus(orderId: string, targetStatus: OrderStatus, note?: string): Promise<Order> {
    const res = await fetch(`${API_BASE}/orders/${orderId}/status`, {
      method: 'PATCH',
      headers: this.getHeaders(),
      body: JSON.stringify({ targetStatus, note }),
    });
    const data = await res.json();
    if (!data.success) {
      throw new Error(data.error?.message || 'Failed to update order status');
    }
    return data.data;
  }

  // --- Financials & Settlements ---
  public async getSellerSettlements(): Promise<SellerSettlement[]> {
    const res = await fetch(`${API_BASE}/seller/settlements`, {
      headers: this.getHeaders(),
    });
    const data = await res.json();
    if (!data.success) {
      throw new Error(data.error?.message || 'Failed to fetch settlements');
    }
    return data.data;
  }

  public async getSellerEarningsSummary(): Promise<{
    totalOrders: number;
    completedOrders: number;
    grossSales: number;
    platformCommission: number;
    deliveryFees: number;
    netPayable: number;
  }> {
    const res = await fetch(`${API_BASE}/seller/earnings-summary`, {
      headers: this.getHeaders(),
    });
    const data = await res.json();
    if (!data.success) {
      throw new Error(data.error?.message || 'Failed to fetch earnings summary');
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

  // --- Phase 9: Billing & Subscriptions ---
  public async getBillingSummary(shopId?: string): Promise<any> {
    const q = shopId ? `?shopId=${shopId}` : '';
    const res = await fetch(`${API_BASE}/seller/billing/summary${q}`, {
      headers: this.getHeaders(),
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.error?.message || 'Failed to fetch billing summary');
    return data.data;
  }

  public async getAvailablePlans(): Promise<SubscriptionPlan[]> {
    const res = await fetch(`${API_BASE}/billing/plans`, {
      headers: this.getHeaders(),
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.error?.message || 'Failed to fetch subscription plans');
    return data.data;
  }

  public async subscribeToPlan(payload: {
    shopId: string;
    planId: string;
    autoRenew?: boolean;
    startTrial?: boolean;
    paymentMethod?: string;
  }): Promise<{ subscription: SellerSubscription; invoice?: SubscriptionInvoice }> {
    const res = await fetch(`${API_BASE}/seller/subscription/subscribe`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.error?.message || 'Failed to subscribe to plan');
    return data.data;
  }

  public async cancelSubscription(payload: { shopId: string; reason?: string }): Promise<SellerSubscription> {
    const res = await fetch(`${API_BASE}/seller/subscription/cancel`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.error?.message || 'Failed to cancel subscription');
    return data.data;
  }

  public async getInvoices(shopId?: string, status?: string): Promise<SubscriptionInvoice[]> {
    const q = new URLSearchParams();
    if (shopId) q.append('shopId', shopId);
    if (status) q.append('status', status);

    const res = await fetch(`${API_BASE}/seller/invoices?${q.toString()}`, {
      headers: this.getHeaders(),
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.error?.message || 'Failed to fetch invoices');
    return data.data;
  }

  public async payInvoice(invoiceId: string, paymentMethod = 'UPI'): Promise<SubscriptionInvoice> {
    const res = await fetch(`${API_BASE}/seller/invoices/${invoiceId}/pay`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ paymentMethod }),
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.error?.message || 'Payment failed');
    return data.data;
  }

  public async getStatements(shopId?: string): Promise<BillingTransaction[]> {
    const q = shopId ? `?shopId=${shopId}` : '';
    const res = await fetch(`${API_BASE}/seller/billing/statements${q}`, {
      headers: this.getHeaders(),
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.error?.message || 'Failed to fetch billing statements');
    return data.data;
  }

  // --- Voice Shopping Requests & Final Bill Review ---
  public async getShoppingRequests(status?: ShoppingRequestStatus): Promise<ShoppingRequest[]> {
    const q = status ? `?status=${status}` : '';
    const res = await fetch(`${API_BASE}/shopping-requests${q}`, {
      headers: this.getHeaders(),
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.error?.message || 'Failed to fetch shopping requests');
    return data.data;
  }

  public async getShoppingRequest(id: string): Promise<ShoppingRequest> {
    const res = await fetch(`${API_BASE}/shopping-requests/${id}`, {
      headers: this.getHeaders(),
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.error?.message || 'Failed to fetch shopping request');
    return data.data;
  }

  public async finalizeBill(id: string, payload: FinalizeBillDTO): Promise<ShoppingRequest> {
    const res = await fetch(`${API_BASE}/shopping-requests/${id}/finalize-bill`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.error?.message || 'Failed to finalize bill');
    return data.data;
  }

  public async rejectShoppingRequest(id: string, reason?: string): Promise<ShoppingRequest> {
    const res = await fetch(`${API_BASE}/shopping-requests/${id}/reject`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ reason }),
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.error?.message || 'Failed to reject shopping request');
    return data.data;
  }
}

export const sellerApi = new SellerApiService();

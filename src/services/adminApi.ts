/**
 * Master Admin API Client Service
 * 
 * Typed frontend client communicating with the backend Admin Express APIs.
 * Automatically injects the admin bearer token and enforces `role === ADMIN`.
 */

import {
  AdminPlatformStats,
  DailySalesChartPoint,
  SupportTicket,
  SystemSettings,
  ShopPerformanceReport,
  CommissionReportSummary,
} from '../types/admin.ts';
import { LocalMarket, Shop } from '../types/market.ts';
import { Product, MasterProduct, CreateMasterProductDTO, UpdateMasterProductDTO } from '../types/product.ts';
import { Order } from '../types/order.ts';
import { PaymentRecord } from '../types/payment.ts';
import {
  SellerSettlement,
  CommissionConfig,
  AuditTransactionRecord,
  SubscriptionPlan,
  SellerSubscription,
  SubscriptionInvoice,
  BillingTransaction,
} from '../types/financial.ts';
import { AppNotification } from '../types/notification.ts';

const API_BASE = '/api';

class AdminApiService {
  private getHeaders(): HeadersInit {
    const token = localStorage.getItem('admin_auth_token') || 'token_usr_admin_01';
    const userId = localStorage.getItem('admin_user_id') || 'usr_admin_01';

    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      'x-auth-user-id': userId,
    };
  }

  // --- Dashboard & Analytics ---
  public async getStats(timeFilter: string = 'TODAY'): Promise<AdminPlatformStats> {
    const res = await fetch(`${API_BASE}/admin/stats?timeFilter=${timeFilter}`, {
      headers: this.getHeaders(),
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.error?.message || 'Failed to fetch platform stats');
    return data.data;
  }

  public async getAnalyticsCharts(): Promise<DailySalesChartPoint[]> {
    const res = await fetch(`${API_BASE}/admin/analytics/charts`, {
      headers: this.getHeaders(),
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.error?.message || 'Failed to fetch analytics charts');
    return data.data;
  }

  // --- Market Management ---
  public async getMarkets(): Promise<LocalMarket[]> {
    const res = await fetch(`${API_BASE}/admin/markets`, {
      headers: this.getHeaders(),
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.error?.message || 'Failed to fetch markets');
    return data.data;
  }

  public async createMarket(marketData: Partial<LocalMarket>): Promise<LocalMarket> {
    const res = await fetch(`${API_BASE}/admin/markets`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(marketData),
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.error?.message || 'Failed to create market');
    return data.data;
  }

  public async updateMarket(marketId: string, updates: Partial<LocalMarket>): Promise<LocalMarket> {
    const res = await fetch(`${API_BASE}/admin/markets/${marketId}`, {
      method: 'PATCH',
      headers: this.getHeaders(),
      body: JSON.stringify(updates),
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.error?.message || 'Failed to update market');
    return data.data;
  }

  public async toggleMarketStatus(marketId: string, isActive: boolean): Promise<LocalMarket> {
    const res = await fetch(`${API_BASE}/admin/markets/${marketId}/status`, {
      method: 'PATCH',
      headers: this.getHeaders(),
      body: JSON.stringify({ isActive }),
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.error?.message || 'Failed to toggle market status');
    return data.data;
  }

  // --- Shop Management ---
  public async getShops(params?: { marketId?: string; status?: string }): Promise<any[]> {
    const q = new URLSearchParams();
    if (params?.marketId) q.append('marketId', params.marketId);
    if (params?.status) q.append('status', params.status);

    const res = await fetch(`${API_BASE}/admin/shops?${q.toString()}`, {
      headers: this.getHeaders(),
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.error?.message || 'Failed to fetch shops');
    return data.data;
  }

  public async updateShopStatus(shopId: string, status: string): Promise<Shop> {
    const res = await fetch(`${API_BASE}/admin/shops/${shopId}/status`, {
      method: 'PATCH',
      headers: this.getHeaders(),
      body: JSON.stringify({ status }),
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.error?.message || 'Failed to update shop status');
    return data.data;
  }

  public async updateShopDetails(shopId: string, updates: Partial<Shop>): Promise<Shop> {
    const res = await fetch(`${API_BASE}/admin/shops/${shopId}`, {
      method: 'PATCH',
      headers: this.getHeaders(),
      body: JSON.stringify(updates),
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.error?.message || 'Failed to update shop details');
    return data.data;
  }

  public async updateShopFulfillment(shopId: string, fulfillment: Partial<Shop['fulfillment']>): Promise<Shop> {
    const res = await fetch(`${API_BASE}/admin/shops/${shopId}/fulfillment`, {
      method: 'PATCH',
      headers: this.getHeaders(),
      body: JSON.stringify(fulfillment),
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.error?.message || 'Failed to update shop fulfillment settings');
    return data.data;
  }

  public async setShopCommission(shopId: string, customPercentage: number): Promise<any> {
    const res = await fetch(`${API_BASE}/admin/shops/${shopId}/commission`, {
      method: 'PATCH',
      headers: this.getHeaders(),
      body: JSON.stringify({ customPercentage }),
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.error?.message || 'Failed to update custom commission');
    return data.data;
  }

  // --- Seller Management ---
  public async getSellers(): Promise<any[]> {
    const res = await fetch(`${API_BASE}/admin/sellers`, {
      headers: this.getHeaders(),
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.error?.message || 'Failed to fetch sellers');
    return data.data;
  }

  public async toggleSellerStatus(sellerId: string): Promise<any> {
    const res = await fetch(`${API_BASE}/admin/sellers/${sellerId}/status`, {
      method: 'PATCH',
      headers: this.getHeaders(),
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.error?.message || 'Failed to toggle seller status');
    return data.data;
  }

  // --- Customer Management ---
  public async getCustomers(): Promise<any[]> {
    const res = await fetch(`${API_BASE}/admin/customers`, {
      headers: this.getHeaders(),
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.error?.message || 'Failed to fetch customers');
    return data.data;
  }

  public async toggleCustomerStatus(customerId: string): Promise<any> {
    const res = await fetch(`${API_BASE}/admin/customers/${customerId}/status`, {
      method: 'PATCH',
      headers: this.getHeaders(),
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.error?.message || 'Failed to toggle customer status');
    return data.data;
  }

  // --- Product Management ---
  public async getProducts(params?: {
    marketId?: string;
    shopId?: string;
    category?: string;
    stockStatus?: string;
  }): Promise<any[]> {
    const q = new URLSearchParams();
    if (params?.marketId) q.append('marketId', params.marketId);
    if (params?.shopId) q.append('shopId', params.shopId);
    if (params?.category) q.append('category', params.category);
    if (params?.stockStatus) q.append('stockStatus', params.stockStatus);

    const res = await fetch(`${API_BASE}/admin/products?${q.toString()}`, {
      headers: this.getHeaders(),
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.error?.message || 'Failed to fetch products');
    return data.data;
  }

  public async createProduct(productData: Partial<Product> & { shopId: string }): Promise<Product> {
    const res = await fetch(`${API_BASE}/admin/products`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(productData),
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.error?.message || 'Failed to create product');
    return data.data;
  }

  public async updateProduct(
    productId: string,
    updates: Partial<Product> & {
      baseUnitPrice?: number;
      currentStockInBaseUnits?: number;
      isAvailable?: boolean;
    }
  ): Promise<Product> {
    const res = await fetch(`${API_BASE}/admin/products/${productId}`, {
      method: 'PATCH',
      headers: this.getHeaders(),
      body: JSON.stringify(updates),
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.error?.message || 'Failed to update product');
    return data.data;
  }

  public async deleteProduct(productId: string): Promise<any> {
    const res = await fetch(`${API_BASE}/admin/products/${productId}`, {
      method: 'DELETE',
      headers: this.getHeaders(),
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.error?.message || 'Failed to delete product');
    return data.data;
  }

  public async bulkUploadProducts(shopId: string, products: any[]): Promise<{ count: number; products: Product[] }> {
    const res = await fetch(`${API_BASE}/admin/shops/${shopId}/bulk-products`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ products }),
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.error?.message || 'Failed to bulk upload products');
    return data.data;
  }

  // --- Master Orders & Details ---
  public async getOrders(params?: {
    orderId?: string;
    shopId?: string;
    status?: string;
    paymentStatus?: string;
    fulfillment?: string;
    search?: string;
  }): Promise<any[]> {
    const q = new URLSearchParams();
    if (params?.orderId) q.append('orderId', params.orderId);
    if (params?.shopId) q.append('shopId', params.shopId);
    if (params?.status) q.append('status', params.status);
    if (params?.paymentStatus) q.append('paymentStatus', params.paymentStatus);
    if (params?.fulfillment) q.append('fulfillment', params.fulfillment);
    if (params?.search) q.append('search', params.search);

    const res = await fetch(`${API_BASE}/admin/orders?${q.toString()}`, {
      headers: this.getHeaders(),
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.error?.message || 'Failed to fetch master orders');
    return data.data;
  }

  public async getOrderDetails(orderId: string): Promise<any> {
    const res = await fetch(`${API_BASE}/admin/orders/${orderId}`, {
      headers: this.getHeaders(),
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.error?.message || 'Failed to fetch order details');
    return data.data;
  }

  // --- Payment Monitor ---
  public async getPayments(): Promise<PaymentRecord[]> {
    const res = await fetch(`${API_BASE}/admin/payments`, {
      headers: this.getHeaders(),
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.error?.message || 'Failed to fetch payments');
    return data.data;
  }

  // --- Settlements ---
  public async getSettlements(): Promise<any[]> {
    const res = await fetch(`${API_BASE}/admin/settlements`, {
      headers: this.getHeaders(),
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.error?.message || 'Failed to fetch settlements');
    return data.data;
  }

  public async updateSettlementStatus(
    settlementId: string,
    status: string,
    payoutReferenceId?: string
  ): Promise<SellerSettlement> {
    const res = await fetch(`${API_BASE}/admin/settlements/${settlementId}/status`, {
      method: 'PATCH',
      headers: this.getHeaders(),
      body: JSON.stringify({ status, payoutReferenceId }),
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.error?.message || 'Failed to update settlement status');
    return data.data;
  }

  // --- Commission & Reports ---
  public async getCommissionConfig(): Promise<CommissionConfig> {
    const res = await fetch(`${API_BASE}/admin/commissions`, {
      headers: this.getHeaders(),
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.error?.message || 'Failed to fetch commission config');
    return data.data;
  }

  public async updateCommissionConfig(updates: Partial<CommissionConfig>): Promise<CommissionConfig> {
    const res = await fetch(`${API_BASE}/admin/commissions`, {
      method: 'PATCH',
      headers: this.getHeaders(),
      body: JSON.stringify(updates),
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.error?.message || 'Failed to update commission config');
    return data.data;
  }

  public async getCommissionReports(): Promise<CommissionReportSummary & { shopReports: any[]; marketReports: any[] }> {
    const res = await fetch(`${API_BASE}/admin/reports/commissions`, {
      headers: this.getHeaders(),
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.error?.message || 'Failed to fetch commission reports');
    return data.data;
  }

  public async getOrderAnalytics(): Promise<any> {
    const res = await fetch(`${API_BASE}/admin/reports/order-analytics`, {
      headers: this.getHeaders(),
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.error?.message || 'Failed to fetch order analytics');
    return data.data;
  }

  public async getShopPerformance(): Promise<ShopPerformanceReport[]> {
    const res = await fetch(`${API_BASE}/admin/reports/shop-performance`, {
      headers: this.getHeaders(),
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.error?.message || 'Failed to fetch shop performance');
    return data.data;
  }

  // --- Support & Disputes ---
  public async getSupportTickets(params?: { status?: string; type?: string }): Promise<SupportTicket[]> {
    const q = new URLSearchParams();
    if (params?.status) q.append('status', params.status);
    if (params?.type) q.append('type', params.type);

    const res = await fetch(`${API_BASE}/admin/support/tickets?${q.toString()}`, {
      headers: this.getHeaders(),
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.error?.message || 'Failed to fetch support tickets');
    return data.data;
  }

  public async updateSupportTicket(ticketId: string, status: string, adminNotes?: string): Promise<SupportTicket> {
    const res = await fetch(`${API_BASE}/admin/support/tickets/${ticketId}`, {
      method: 'PATCH',
      headers: this.getHeaders(),
      body: JSON.stringify({ status, adminNotes }),
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.error?.message || 'Failed to update support ticket');
    return data.data;
  }

  // --- Audit Logs & System Settings ---
  public async getAuditLogs(limit: number = 100): Promise<AuditTransactionRecord[]> {
    const res = await fetch(`${API_BASE}/admin/audit-logs?limit=${limit}`, {
      headers: this.getHeaders(),
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.error?.message || 'Failed to fetch audit logs');
    return data.data;
  }

  public async getSystemSettings(): Promise<SystemSettings> {
    const res = await fetch(`${API_BASE}/admin/settings`, {
      headers: this.getHeaders(),
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.error?.message || 'Failed to fetch system settings');
    return data.data;
  }

  public async updateSystemSettings(settings: Partial<SystemSettings>): Promise<SystemSettings> {
    const res = await fetch(`${API_BASE}/admin/settings`, {
      method: 'PATCH',
      headers: this.getHeaders(),
      body: JSON.stringify(settings),
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.error?.message || 'Failed to update system settings');
    return data.data;
  }

  public async getNotifications(): Promise<AppNotification[]> {
    const res = await fetch(`${API_BASE}/admin/notifications`, {
      headers: this.getHeaders(),
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.error?.message || 'Failed to fetch admin notifications');
    return data.data;
  }

  // --- Phase 9: Subscription Plans & Billing ---
  public async getSubscriptionPlans(onlyActive = false): Promise<SubscriptionPlan[]> {
    const res = await fetch(`${API_BASE}/admin/subscription-plans?onlyActive=${onlyActive}`, {
      headers: this.getHeaders(),
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.error?.message || 'Failed to fetch subscription plans');
    return data.data;
  }

  public async createSubscriptionPlan(planData: Partial<SubscriptionPlan>): Promise<SubscriptionPlan> {
    const res = await fetch(`${API_BASE}/admin/subscription-plans`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(planData),
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.error?.message || 'Failed to create subscription plan');
    return data.data;
  }

  public async updateSubscriptionPlan(planId: string, updates: Partial<SubscriptionPlan>): Promise<SubscriptionPlan> {
    const res = await fetch(`${API_BASE}/admin/subscription-plans/${planId}`, {
      method: 'PATCH',
      headers: this.getHeaders(),
      body: JSON.stringify(updates),
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.error?.message || 'Failed to update subscription plan');
    return data.data;
  }

  public async deleteSubscriptionPlan(planId: string): Promise<boolean> {
    const res = await fetch(`${API_BASE}/admin/subscription-plans/${planId}`, {
      method: 'DELETE',
      headers: this.getHeaders(),
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.error?.message || 'Failed to delete subscription plan');
    return true;
  }

  public async updateShopBilling(
    shopId: string,
    billingData: {
      billingMode?: string;
      customCommissionPercentage?: number;
      subscriptionPlanId?: string;
      deductSubscriptionFromSettlement?: boolean;
    }
  ): Promise<any> {
    const res = await fetch(`${API_BASE}/admin/shops/${shopId}/billing`, {
      method: 'PATCH',
      headers: this.getHeaders(),
      body: JSON.stringify(billingData),
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.error?.message || 'Failed to update shop billing configuration');
    return data.data;
  }

  public async getSubscriptionInvoices(params?: { sellerId?: string; shopId?: string; status?: string }): Promise<SubscriptionInvoice[]> {
    const q = new URLSearchParams();
    if (params?.sellerId) q.append('sellerId', params.sellerId);
    if (params?.shopId) q.append('shopId', params.shopId);
    if (params?.status) q.append('status', params.status);

    const res = await fetch(`${API_BASE}/admin/subscription-invoices?${q.toString()}`, {
      headers: this.getHeaders(),
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.error?.message || 'Failed to fetch subscription invoices');
    return data.data;
  }

  public async getSellerSubscriptions(params?: { sellerId?: string; shopId?: string; status?: string }): Promise<SellerSubscription[]> {
    const q = new URLSearchParams();
    if (params?.sellerId) q.append('sellerId', params.sellerId);
    if (params?.shopId) q.append('shopId', params.shopId);
    if (params?.status) q.append('status', params.status);

    const res = await fetch(`${API_BASE}/admin/subscriptions?${q.toString()}`, {
      headers: this.getHeaders(),
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.error?.message || 'Failed to fetch seller subscriptions');
    return data.data;
  }

  public async getBillingTransactions(params?: { sellerId?: string; shopId?: string }): Promise<BillingTransaction[]> {
    const q = new URLSearchParams();
    if (params?.sellerId) q.append('sellerId', params.sellerId);
    if (params?.shopId) q.append('shopId', params.shopId);

    const res = await fetch(`${API_BASE}/admin/billing-transactions?${q.toString()}`, {
      headers: this.getHeaders(),
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.error?.message || 'Failed to fetch billing transactions');
    return data.data;
  }

  public async createSettlementBatch(params: { shopId: string; payoutMethod?: string; payoutReferenceId?: string }): Promise<SellerSettlement> {
    const res = await fetch(`${API_BASE}/admin/settlements/create-batch`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(params),
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.error?.message || 'Failed to generate settlement batch');
    return data.data;
  }

  // --- Central Master Catalogue System ---

  /**
   * Get all products from Central Master Catalogue with optional filtering
   */
  public async getMasterProducts(params?: {
    search?: string;
    category?: string;
    subCategory?: string;
    isActiveOnly?: boolean;
  }): Promise<{ total: number; products: MasterProduct[] }> {
    const q = new URLSearchParams();
    if (params?.search) q.append('search', params.search);
    if (params?.category) q.append('category', params.category);
    if (params?.subCategory) q.append('subCategory', params.subCategory);
    if (params?.isActiveOnly) q.append('isActiveOnly', 'true');

    const res = await fetch(`${API_BASE}/admin/master-catalog?${q.toString()}`, {
      headers: this.getHeaders(),
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.error?.message || 'Failed to fetch master catalog products');
    return data.data;
  }

  /**
   * Get single master product by ID
   */
  public async getMasterProductById(id: string): Promise<MasterProduct> {
    const res = await fetch(`${API_BASE}/admin/master-catalog/${id}`, {
      headers: this.getHeaders(),
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.error?.message || 'Failed to fetch master product');
    return data.data;
  }

  /**
   * Create a new product in Central Master Catalogue
   */
  public async createMasterProduct(product: CreateMasterProductDTO): Promise<MasterProduct> {
    const res = await fetch(`${API_BASE}/admin/master-catalog`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(product),
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.error?.message || 'Failed to create master product');
    return data.data;
  }

  /**
   * Update an existing product in Central Master Catalogue
   */
  public async updateMasterProduct(id: string, updates: UpdateMasterProductDTO): Promise<MasterProduct> {
    const res = await fetch(`${API_BASE}/admin/master-catalog/${id}`, {
      method: 'PATCH',
      headers: this.getHeaders(),
      body: JSON.stringify(updates),
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.error?.message || 'Failed to update master product');
    return data.data;
  }

  /**
   * Delete a product from Central Master Catalogue
   */
  public async deleteMasterProduct(id: string): Promise<boolean> {
    const res = await fetch(`${API_BASE}/admin/master-catalog/${id}`, {
      method: 'DELETE',
      headers: this.getHeaders(),
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.error?.message || 'Failed to delete master product');
    return true;
  }

  /**
   * Bulk add selected products from Master Catalogue into a shop's catalog.
   * Prevents duplicates strictly.
   * Price and stock will be managed independently by the shopkeeper/admin in that shop.
   */
  public async bulkAddFromMaster(
    shopId: string,
    masterProductIds: string[]
  ): Promise<{ addedCount: number; skippedCount: number; products: Product[] }> {
    const res = await fetch(`${API_BASE}/admin/shops/${shopId}/bulk-from-master`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ masterProductIds }),
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.error?.message || 'Failed to add products from master catalog');
    return data.data;
  }
}

export const adminApi = new AdminApiService();

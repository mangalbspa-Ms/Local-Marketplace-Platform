/**
 * Admin Governance, Management, Reports, and System Settings Types
 */

import { Shop } from './market.ts';
import { User } from './auth.ts';
import { Order } from './order.ts';

export type ShopAdminStatus = 'PENDING' | 'APPROVED' | 'SUSPENDED' | 'REJECTED' | 'ACTIVE' | 'INACTIVE';

export type SettlementCycle = 'DAILY' | 'WEEKLY' | 'BIWEEKLY' | 'MONTHLY';

export interface SystemSettings {
  appName?: string;
  defaultCommissionPercentage: number;
  minCommissionPerOrder?: number;
  maxCommissionCap?: number;
  platformFee: number;
  defaultDeliveryFee: number;
  baseDeliveryFee?: number;
  minOrderValueForDelivery: number;
  freeDeliveryThreshold: number;
  settlementCycle: SettlementCycle;
  cancellationTimeLimitMinutes: number;
  autoApproveShops: boolean;
  supportEmail: string;
  supportPhone: string;
  maintenanceMode?: boolean;
  maintenanceMessage?: string;
  // Phase 9 Billing and Subscriptions
  commissionOnDeliveryFee?: boolean;
  commissionOnPlatformFee?: boolean;
  subscriptionGracePeriodDays?: number;
  freeTrialDays?: number;
  trialEnabled?: boolean;
  deductSubscriptionFromSettlementDefault?: boolean;
  optionalTaxPercentage?: number;
}

export interface SellerInvitation {
  id: string;
  invitationToken: string;
  shopId: string;
  sellerId: string;
  createdByAdminId: string;
  sellerName: string;
  sellerPhone: string;
  shopName: string;
  status: 'PENDING' | 'ACCEPTED' | 'EXPIRED' | 'REVOKED';
  expiresAt: string;
  acceptedAt?: string;
  invitationUrl: string;
  qrCodePayload?: string;
  createdAt: string;
}

export type SupportTicketType =
  | 'CUSTOMER_COMPLAINT'
  | 'SELLER_COMPLAINT'
  | 'PAYMENT_ISSUE'
  | 'ORDER_ISSUE'
  | 'REFUND_REQUEST';

export type SupportTicketStatus = 'OPEN' | 'IN_REVIEW' | 'RESOLVED' | 'CLOSED';

export interface SupportTicket {
  id: string;
  ticketType: SupportTicketType;
  userId: string;
  userName: string;
  userPhone?: string;
  userRole: string;
  orderId?: string;
  shopId?: string;
  shopName?: string;
  subject: string;
  description: string;
  status: SupportTicketStatus;
  adminNotes?: string;
  assignedAdminId?: string;
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
}

export interface AdminPlatformStats {
  totalShops: number;
  activeShops: number;
  pendingShopApprovals: number;
  totalCustomers: number;
  todayOrders: number;
  activeOrders: number;
  completedOrders: number;
  todaySales: number;
  totalGrossMerchandiseValue: number;
  monthlyGrossMerchandiseValue?: number;
  totalPlatformCommission: number;
  totalSubscriptionRevenue?: number;
  monthlySubscriptionRevenue?: number;
  totalPlatformRevenue?: number;
  pendingSellerSettlements: number;
  activeSubscribersCount?: number;
  trialSubscribersCount?: number;
  pastDueSubscribersCount?: number;
  cancelledSubscribersCount?: number;
  commissionShopsCount?: number;
  subscriptionShopsCount?: number;
  commissionPlusSubShopsCount?: number;
  timeFilter: 'TODAY' | '7_DAYS' | '30_DAYS' | 'THIS_MONTH' | 'CUSTOM';
}

export interface DailySalesChartPoint {
  date: string;
  label: string;
  sales: number;
  orders: number;
  commission: number;
  activeShops: number;
}

export interface SellerAdminSummary {
  seller: User;
  shop?: Shop;
  marketName?: string;
  totalOrders: number;
  totalSales: number;
  totalCommissionPaid: number;
  pendingSettlementAmount: number;
}

export interface CustomerAdminSummary {
  customer: User;
  totalOrders: number;
  totalSpending: number;
  lastOrderDate?: string;
  favoriteMarketName?: string;
}

export interface ShopPerformanceReport {
  shopId: string;
  shopName: string;
  category: string;
  marketName: string;
  ownerName: string;
  totalOrders: number;
  grossSales: number;
  averageOrderValue: number;
  commissionCollected: number;
  completedOrdersCount: number;
  cancelledOrdersCount: number;
  completionRatePercentage: number;
  cancellationRatePercentage: number;
}

export interface MarketAnalyticsReport {
  marketId: string;
  marketName: string;
  code: string;
  city: string;
  state: string;
  totalShopsCount: number;
  activeShopsCount: number;
  totalCustomersCount: number;
  totalOrdersCount: number;
  totalGrossMerchandiseValue: number;
  totalCommissionCollected: number;
  averageOrderValue: number;
}

export interface CommissionReportSummary {
  periodLabel: string;
  grossSales: number;
  commissionEarned: number;
  refundsDeducted: number;
  netSellerPayout: number;
  platformNetRevenue: number;
  orderCount: number;
}

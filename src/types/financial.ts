/**
 * Financials, Commission Rules, Settlements, and Audit Logs
 */

export type BillingMode = 'COMMISSION' | 'SUBSCRIPTION' | 'COMMISSION_PLUS_SUBSCRIPTION';

export enum SubscriptionStatus {
  ACTIVE = 'ACTIVE',
  TRIAL = 'TRIAL',
  PAST_DUE = 'PAST_DUE',
  CANCELLED = 'CANCELLED',
  EXPIRED = 'EXPIRED',
  SUSPENDED = 'SUSPENDED',
  GRACE_PERIOD = 'GRACE_PERIOD',
}

export enum SubscriptionPaymentStatus {
  PENDING = 'PENDING',
  PAID = 'PAID',
  FAILED = 'FAILED',
  REFUNDED = 'REFUNDED',
}

export interface SubscriptionPlan {
  id: string;
  name: string; // e.g. 'FREE', 'BASIC', 'STANDARD', 'PREMIUM'
  monthlyPrice?: number; // in ₹
  price?: number; // alias for monthlyPrice
  commissionPercentage: number; // e.g. 0%, 2%, 3%, 5%
  billingInterval?: 'MONTHLY' | 'YEARLY';
  interval?: 'MONTHLY' | 'YEARLY'; // alias for billingInterval
  description?: string;
  features: string[];
  maxProducts?: number;
  isActive: boolean;
  isPopular?: boolean;
  sortOrder?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface SellerSubscription {
  id: string;
  sellerId: string;
  shopId: string;
  planId: string;
  planName?: string;
  amount?: number;
  price?: number;
  interval?: 'MONTHLY' | 'YEARLY' | string;
  billingPeriodStart?: string;
  billingPeriodEnd?: string;
  startDate?: string;
  currentPeriodStart?: string;
  currentPeriodEnd?: string;
  commissionOverride?: number;
  status: SubscriptionStatus | string;
  paymentStatus?: SubscriptionPaymentStatus | string;
  paymentReference?: string;
  nextDueDate?: string;
  nextBillingDate?: string;
  autoRenew?: boolean;
  gracePeriodEnd?: string;
  trialEndDate?: string;
  createdAt?: string;
  updatedAt?: string;
  paidAt?: string;
  cancelledAt?: string;
}

export interface SubscriptionInvoice {
  id: string;
  invoiceNumber: string;
  sellerId: string;
  sellerName?: string;
  shopId: string;
  shopName?: string;
  subscriptionId?: string;
  planId: string;
  planName: string;
  billingPeriodStart: string;
  billingPeriodEnd: string;
  subscriptionAmount?: number;
  subtotal?: number;
  tax?: number;
  taxPercentage?: number;
  taxAmount?: number;
  totalAmount?: number;
  total?: number;
  status: 'PAID' | 'PENDING' | 'CANCELLED' | 'REFUNDED' | 'FAILED' | string;
  paymentReference?: string;
  paymentMethod?: string;
  issueDate?: string;
  dueDate?: string;
  paidAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface BillingTransaction {
  id: string;
  sellerId: string;
  shopId: string;
  type: 'SUBSCRIPTION_PAYMENT' | 'COMMISSION_DEDUCTION' | 'SETTLEMENT_PAYOUT' | 'REFUND' | 'ADJUSTMENT' | string;
  amount: number;
  direction?: 'DEBIT' | 'CREDIT';
  referenceId: string;
  description: string;
  status: 'SUCCESS' | 'PENDING' | 'FAILED' | string;
  createdAt?: string;
  timestamp?: string;
}

export interface CommissionConfig {
  defaultPercentage: number;
  minCommissionPerOrder: number;
  maxCommissionCap?: number;
  platformFeePerOrder: number;
  deliveryCommissionRate: number; // usually 0% if seller delivers
  commissionOnDeliveryFee?: boolean; // default false
  commissionOnPlatformFee?: boolean; // default false
  subscriptionGracePeriodDays?: number; // default 7
  freeTrialDays?: number; // default 14
  trialEnabled?: boolean; // default true
  deductSubscriptionFromSettlementDefault?: boolean; // default false
  optionalTaxPercentage?: number; // default 0%
}

export enum SettlementStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  ON_HOLD = 'ON_HOLD',
}

export interface SellerSettlement {
  id: string;
  settlementBatchId: string;
  sellerId: string;
  shopId: string;
  periodStart: string;
  periodEnd: string;
  totalOrdersCount: number;
  grossSalesAmount: number;
  totalPlatformCommission: number;
  totalDeliveryFeesCollected: number;
  subscriptionDeductionsAmount?: number;
  subscriptionFeeDeducted?: number;
  netPayableToSeller: number;
  status: SettlementStatus;
  payoutMethod: 'UPI' | 'BANK_TRANSFER' | string;
  payoutReferenceId?: string;
  processedAt?: string;
  createdAt: string;
}

export enum AuditEventType {
  ORDER_CREATED = 'ORDER_CREATED',
  PAYMENT_INTENT_CREATED = 'PAYMENT_INTENT_CREATED',
  PAYMENT_VERIFIED = 'PAYMENT_VERIFIED',
  PAYMENT_FAILED = 'PAYMENT_FAILED',
  ORDER_STATUS_CHANGED = 'ORDER_STATUS_CHANGED',
  INVENTORY_DEDUCTED = 'INVENTORY_DEDUCTED',
  INVENTORY_RESTOCKED = 'INVENTORY_RESTOCKED',
  PRODUCT_CREATED = 'PRODUCT_CREATED',
  PRODUCT_UPDATED = 'PRODUCT_UPDATED',
  COMMISSION_RECORDED = 'COMMISSION_RECORDED',
  SETTLEMENT_PROCESSED = 'SETTLEMENT_PROCESSED',
  SETTLEMENT_CREATED = 'SETTLEMENT_CREATED',
  SETTLEMENT_PAID = 'SETTLEMENT_PAID',
  COMMISSION_RATE_UPDATED = 'COMMISSION_RATE_UPDATED',
  BILLING_MODE_CHANGED = 'BILLING_MODE_CHANGED',
  BILLING_CONFIG_UPDATED = 'BILLING_CONFIG_UPDATED',
  ADMIN_BILLING_OVERRIDE = 'ADMIN_BILLING_OVERRIDE',
  PLAN_CREATED = 'PLAN_CREATED',
  PLAN_UPDATED = 'PLAN_UPDATED',
  PLAN_DELETED = 'PLAN_DELETED',
  PLAN_CHANGED = 'PLAN_CHANGED',
  SUBSCRIPTION_PLAN_ASSIGNED = 'SUBSCRIPTION_PLAN_ASSIGNED',
  SUBSCRIPTION_CREATED = 'SUBSCRIPTION_CREATED',
  SUBSCRIPTION_RENEWED = 'SUBSCRIPTION_RENEWED',
  SUBSCRIPTION_PAYMENT_SUCCESS = 'SUBSCRIPTION_PAYMENT_SUCCESS',
  SUBSCRIPTION_PAYMENT_FAILED = 'SUBSCRIPTION_PAYMENT_FAILED',
  SUBSCRIPTION_CANCELLED = 'SUBSCRIPTION_CANCELLED',
  SUBSCRIPTION_PAST_DUE = 'SUBSCRIPTION_PAST_DUE',
  INVOICE_CREATED = 'INVOICE_CREATED',
  SUBSCRIPTION_INVOICE_GENERATED = 'SUBSCRIPTION_INVOICE_GENERATED',
  SHOP_ISOLATION_VIOLATION_ATTEMPT = 'SHOP_ISOLATION_VIOLATION_ATTEMPT',
  SELLER_CREATED = 'SELLER_CREATED',
  SELLER_INVITATION_CREATED = 'SELLER_INVITATION_CREATED',
  SELLER_INVITATION_ACCEPTED = 'SELLER_INVITATION_ACCEPTED',
}


export interface AuditTransactionRecord {
  id: string;
  eventType: AuditEventType;
  orderId?: string;
  paymentId?: string;
  sellerId?: string;
  shopId?: string;
  customerId?: string;
  performedByUserId: string;
  amount?: number;
  commission?: number;
  details: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  timestamp: string;
}

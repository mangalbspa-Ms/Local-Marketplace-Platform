/**
 * Subscription & Billing Service for Local Marketplace
 * 
 * Manages admin subscription plans, shop subscriptions, billing cycles,
 * grace periods, trial accounts, automated invoicing, and payment processing.
 */

import { db } from '../storage/db.ts';
import {
  BillingMode,
  SubscriptionPlan,
  SellerSubscription,
  SubscriptionInvoice,
  SubscriptionStatus,
  SubscriptionPaymentStatus,
  AuditEventType,
  BillingTransaction,
} from '../../types/financial.ts';
import { activePaymentProvider } from '../../core/paymentProvider.ts';
import { Logger } from '../utils/logger.ts';

export class SubscriptionService {
  /**
   * Get all subscription plans
   */
  public static getAllPlans(onlyActive = false): SubscriptionPlan[] {
    return db.getSubscriptionPlans(onlyActive);
  }

  public static getPlans(onlyActive = false): SubscriptionPlan[] {
    return db.getSubscriptionPlans(onlyActive);
  }

  /**
   * Get plan by ID
   */
  public static getPlanById(planId: string): SubscriptionPlan | undefined {
    return db.getSubscriptionPlanById(planId);
  }

  /**
   * Create a new subscription plan (Admin only)
   */
  public static createPlan(data: {
    name: string;
    description?: string;
    price: number;
    interval?: 'MONTHLY' | 'YEARLY';
    commissionPercentage: number;
    maxProducts?: number;
    features?: string[];
    isPopular?: boolean;
    sortOrder?: number;
    adminUserId: string;
  }): SubscriptionPlan {
    const planId = `plan_${data.name.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${Date.now().toString(36)}`;
    const newPlan: SubscriptionPlan = {
      id: planId,
      name: data.name.toUpperCase(),
      description: data.description,
      price: Math.round(Math.max(0, data.price) * 100) / 100,
      interval: data.interval || 'MONTHLY',
      commissionPercentage: Math.round(Math.max(0, data.commissionPercentage) * 100) / 100,
      maxProducts: data.maxProducts,
      features: data.features || [],
      isActive: true,
      isPopular: !!data.isPopular,
      sortOrder: data.sortOrder || 10,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const saved = db.createSubscriptionPlan(newPlan);

    db.recordAuditLog({
      eventType: AuditEventType.BILLING_CONFIG_UPDATED,
      performedByUserId: data.adminUserId,
      details: { action: 'CREATE_PLAN', planId: saved.id, planName: saved.name, price: saved.price },
    });

    return saved;
  }

  /**
   * Update an existing subscription plan (Admin only)
   */
  public static updatePlan(
    planId: string,
    updates: Partial<SubscriptionPlan>,
    adminUserId: string
  ): SubscriptionPlan {
    const existing = db.getSubscriptionPlanById(planId);
    if (!existing) {
      throw new Error(`Subscription plan ${planId} not found.`);
    }

    if (updates.name !== undefined && typeof updates.name === 'string') {
      updates.name = updates.name.trim();
    }
    if (updates.price !== undefined) {
      updates.price = Math.round(Math.max(0, Number(updates.price)) * 100) / 100;
      updates.monthlyPrice = updates.price;
    }
    if (updates.commissionPercentage !== undefined) {
      updates.commissionPercentage = Math.round(Math.max(0, Math.min(100, Number(updates.commissionPercentage))) * 100) / 100;
    }
    if (updates.interval !== undefined) {
      updates.billingInterval = updates.interval;
    }
    if (updates.features !== undefined && Array.isArray(updates.features)) {
      updates.features = updates.features.map((f) => String(f).trim()).filter(Boolean);
    }

    const updated = db.updateSubscriptionPlan(planId, updates);
    if (!updated) {
      throw new Error('Failed to update subscription plan');
    }

    db.recordAuditLog({
      eventType: AuditEventType.BILLING_CONFIG_UPDATED,
      performedByUserId: adminUserId,
      details: { action: 'UPDATE_PLAN', planId, updates },
    });

    return updated;
  }

  /**
   * Subscribe a shop to a plan or change plan
   */
  public static async subscribeShopToPlan(params: {
    sellerId: string;
    shopId: string;
    planId: string;
    performedByUserId: string;
    autoRenew?: boolean;
    startTrial?: boolean;
    paymentMethod?: string;
  }): Promise<{ subscription: SellerSubscription; invoice?: SubscriptionInvoice }> {
    const shop = db.getShopById(params.shopId);
    if (!shop) {
      throw new Error(`Shop ${params.shopId} not found.`);
    }

    const plan = db.getSubscriptionPlanById(params.planId);
    if (!plan) {
      throw new Error(`Subscription plan ${params.planId} not found.`);
    }

    const now = new Date();
    const systemSettings = db.getSystemSettings();
    const isFreePlan = plan.price === 0;

    // Check if trial requested or enabled
    let status = SubscriptionStatus.ACTIVE;
    let trialEndDate: string | undefined;

    if (params.startTrial && (systemSettings.trialEnabled ?? true)) {
      const trialDays = systemSettings.freeTrialDays || 14;
      const trialEnd = new Date(now.getTime() + trialDays * 24 * 60 * 60 * 1000);
      status = SubscriptionStatus.TRIAL;
      trialEndDate = trialEnd.toISOString();
    }

    const periodEnd = new Date(now);
    periodEnd.setMonth(periodEnd.getMonth() + 1);

    // Look for existing active subscription
    const existingSub = db.getActiveSubscriptionForShop(params.shopId);
    let subscription: SellerSubscription;

    if (existingSub) {
      // Update existing subscription
      subscription = db.updateSellerSubscription(existingSub.id, {
        planId: plan.id,
        status,
        price: plan.price,
        commissionOverride: plan.commissionPercentage,
        currentPeriodStart: now.toISOString(),
        currentPeriodEnd: periodEnd.toISOString(),
        nextBillingDate: trialEndDate || periodEnd.toISOString(),
        trialEndDate,
        autoRenew: params.autoRenew !== undefined ? params.autoRenew : true,
      })!;
    } else {
      // Create new subscription record
      const subId = `sub_${params.shopId}_${Date.now().toString(36)}`;
      subscription = db.createSellerSubscription({
        id: subId,
        sellerId: params.sellerId,
        shopId: params.shopId,
        planId: plan.id,
        status,
        startDate: now.toISOString(),
        trialEndDate,
        currentPeriodStart: now.toISOString(),
        currentPeriodEnd: periodEnd.toISOString(),
        nextBillingDate: trialEndDate || periodEnd.toISOString(),
        price: plan.price,
        interval: plan.interval || 'MONTHLY',
        commissionOverride: plan.commissionPercentage,
        autoRenew: params.autoRenew !== undefined ? params.autoRenew : true,
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
      });
    }

    // Update shop financial settings
    const updatedBillingMode: BillingMode = plan.commissionPercentage === 0
      ? 'SUBSCRIPTION'
      : (plan.price > 0 ? 'COMMISSION_PLUS_SUBSCRIPTION' : 'COMMISSION');

    db.saveShop({
      ...shop,
      financials: {
        ...shop.financials,
        billingMode: updatedBillingMode,
        subscriptionPlanId: plan.id,
        subscriptionPlanName: plan.name,
        subscriptionStatus: status,
        subscriptionStartDate: subscription.startDate,
        subscriptionNextDueDate: subscription.nextBillingDate,
        subscriptionAmount: plan.price,
        customCommissionPercentage: plan.commissionPercentage,
      },
    });

    let invoice: SubscriptionInvoice | undefined;

    // If it's a paid plan and not in trial mode, generate an invoice
    if (!isFreePlan && status !== SubscriptionStatus.TRIAL) {
      invoice = await this.generateSubscriptionInvoice({
        subscriptionId: subscription.id,
        sellerId: params.sellerId,
        shopId: params.shopId,
        plan,
        periodStart: now.toISOString(),
        periodEnd: periodEnd.toISOString(),
        autoPay: true,
        paymentMethod: params.paymentMethod || 'UPI',
        performedByUserId: params.performedByUserId,
      });
    }

    db.recordAuditLog({
      eventType: AuditEventType.SUBSCRIPTION_PLAN_ASSIGNED,
      performedByUserId: params.performedByUserId,
      sellerId: params.sellerId,
      shopId: params.shopId,
      amount: plan.price,
      details: {
        planId: plan.id,
        planName: plan.name,
        billingMode: updatedBillingMode,
        status,
        trialEndDate,
      },
    });

    return { subscription, invoice };
  }

  /**
   * Cancel subscription for a shop
   */
  public static cancelSubscription(params: {
    shopId: string;
    sellerId: string;
    performedByUserId: string;
    reason?: string;
  }): SellerSubscription {
    const sub = db.getActiveSubscriptionForShop(params.shopId);
    if (!sub) {
      throw new Error(`No active subscription found for shop ${params.shopId}`);
    }

    const cancelled = db.updateSellerSubscription(sub.id, {
      status: SubscriptionStatus.CANCELLED,
      cancelledAt: new Date().toISOString(),
      autoRenew: false,
    });

    if (!cancelled) {
      throw new Error('Failed to cancel subscription');
    }

    const shop = db.getShopById(params.shopId);
    if (shop) {
      // Revert shop to pure commission mode
      const defaultCommission = db.getCommissionConfig().defaultPercentage;
      db.saveShop({
        ...shop,
        financials: {
          ...shop.financials,
          billingMode: 'COMMISSION',
          subscriptionStatus: SubscriptionStatus.CANCELLED,
          customCommissionPercentage: defaultCommission,
        },
      });
    }

    db.recordAuditLog({
      eventType: AuditEventType.SUBSCRIPTION_CANCELLED,
      performedByUserId: params.performedByUserId,
      sellerId: params.sellerId,
      shopId: params.shopId,
      details: { subscriptionId: sub.id, reason: params.reason },
    });

    return cancelled;
  }

  /**
   * Generate a subscription invoice
   */
  public static async generateSubscriptionInvoice(params: {
    subscriptionId: string;
    sellerId: string;
    shopId: string;
    plan: SubscriptionPlan;
    periodStart: string;
    periodEnd: string;
    autoPay?: boolean;
    paymentMethod?: string;
    performedByUserId: string;
  }): Promise<SubscriptionInvoice> {
    const sysSettings = db.getSystemSettings();
    const taxRate = sysSettings.optionalTaxPercentage || 0;
    
    const subtotal = Math.round(params.plan.price * 100) / 100;
    const tax = Math.round((subtotal * (taxRate / 100)) * 100) / 100;
    const total = Math.round((subtotal + tax) * 100) / 100;

    const invoiceId = `inv_sub_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const invoiceNumber = `INV-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`;

    const newInvoice: SubscriptionInvoice = {
      id: invoiceId,
      invoiceNumber,
      sellerId: params.sellerId,
      shopId: params.shopId,
      subscriptionId: params.subscriptionId,
      planId: params.plan.id,
      planName: params.plan.name,
      billingPeriodStart: params.periodStart,
      billingPeriodEnd: params.periodEnd,
      subtotal,
      tax,
      total,
      status: SubscriptionPaymentStatus.PENDING,
      paymentMethod: params.paymentMethod || 'UPI',
      dueDate: params.periodStart,
      createdAt: new Date().toISOString(),
    };

    const savedInvoice = db.createSubscriptionInvoice(newInvoice);

    db.recordAuditLog({
      eventType: AuditEventType.SUBSCRIPTION_INVOICE_GENERATED,
      performedByUserId: params.performedByUserId,
      sellerId: params.sellerId,
      shopId: params.shopId,
      amount: total,
      details: { invoiceId: savedInvoice.id, invoiceNumber: savedInvoice.invoiceNumber },
    });

    if (params.autoPay && total > 0) {
      // Process payment through payment provider
      const payResult = await activePaymentProvider.processSubscriptionPayment({
        sellerId: params.sellerId,
        shopId: params.shopId,
        invoiceId: savedInvoice.id,
        amount: total,
        currency: 'INR',
        planId: params.plan.id,
        planName: params.plan.name,
        paymentMethod: params.paymentMethod || 'UPI',
      });

      if (payResult.success) {
        const paidInvoice = db.updateSubscriptionInvoice(savedInvoice.id, {
          status: SubscriptionPaymentStatus.PAID,
          paymentReference: payResult.paymentReference,
          paidAt: payResult.paidAt,
        })!;

        // Record billing transaction
        const txId = `tx_bill_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
        db.createBillingTransaction({
          id: txId,
          sellerId: params.sellerId,
          shopId: params.shopId,
          type: 'SUBSCRIPTION_PAYMENT',
          amount: total,
          referenceId: paidInvoice.id,
          description: `${params.plan.name} Plan Subscription Payment (${invoiceNumber})`,
          status: 'SUCCESS',
          timestamp: new Date().toISOString(),
        });

        db.recordAuditLog({
          eventType: AuditEventType.SUBSCRIPTION_PAYMENT_SUCCESS,
          performedByUserId: params.performedByUserId,
          sellerId: params.sellerId,
          shopId: params.shopId,
          amount: total,
          details: { invoiceId: paidInvoice.id, paymentReference: payResult.paymentReference },
        });

        return paidInvoice;
      }
    }

    return savedInvoice;
  }

  /**
   * Pay an existing subscription invoice manually or via payment gateway
   */
  public static async paySubscriptionInvoice(params: {
    invoiceId: string;
    paymentMethod: string;
    performedByUserId: string;
  }): Promise<SubscriptionInvoice> {
    const invoice = db.getSubscriptionInvoiceById(params.invoiceId);
    if (!invoice) {
      throw new Error(`Invoice ${params.invoiceId} not found.`);
    }

    if (invoice.status === SubscriptionPaymentStatus.PAID) {
      return invoice;
    }

    const payResult = await activePaymentProvider.processSubscriptionPayment({
      sellerId: invoice.sellerId,
      shopId: invoice.shopId,
      invoiceId: invoice.id,
      amount: invoice.total,
      currency: 'INR',
      planId: invoice.planId,
      planName: invoice.planName,
      paymentMethod: params.paymentMethod,
    });

    if (!payResult.success) {
      db.updateSubscriptionInvoice(invoice.id, { status: SubscriptionPaymentStatus.FAILED });
      throw new Error(payResult.error || 'Payment failed.');
    }

    const paid = db.updateSubscriptionInvoice(invoice.id, {
      status: SubscriptionPaymentStatus.PAID,
      paymentReference: payResult.paymentReference,
      paymentMethod: params.paymentMethod,
      paidAt: payResult.paidAt,
    })!;

    // Also verify if shop subscription should be restored to ACTIVE
    const sub = db.getSellerSubscriptionById(invoice.subscriptionId);
    if (sub && sub.status !== SubscriptionStatus.ACTIVE) {
      db.updateSellerSubscription(sub.id, {
        status: SubscriptionStatus.ACTIVE,
      });

      const shop = db.getShopById(invoice.shopId);
      if (shop) {
        db.saveShop({
          ...shop,
          financials: {
            ...shop.financials,
            subscriptionStatus: SubscriptionStatus.ACTIVE,
          },
        });
      }
    }

    // Record billing transaction
    const txId = `tx_bill_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    db.createBillingTransaction({
      id: txId,
      sellerId: invoice.sellerId,
      shopId: invoice.shopId,
      type: 'SUBSCRIPTION_PAYMENT',
      amount: invoice.total,
      referenceId: paid.id,
      description: `${invoice.planName} Plan Subscription Payment (${invoice.invoiceNumber})`,
      status: 'SUCCESS',
      timestamp: new Date().toISOString(),
    });

    db.recordAuditLog({
      eventType: AuditEventType.SUBSCRIPTION_PAYMENT_SUCCESS,
      performedByUserId: params.performedByUserId,
      sellerId: invoice.sellerId,
      shopId: invoice.shopId,
      amount: invoice.total,
      details: { invoiceId: paid.id, paymentReference: payResult.paymentReference },
    });

    return paid;
  }

  /**
   * Check subscriptions for grace periods, trials, or due dates
   */
  public static checkAndEvaluateSubscriptionStatuses(): void {
    const subscriptions = db.getSellerSubscriptions();
    const systemSettings = db.getSystemSettings();
    const graceDays = systemSettings.subscriptionGracePeriodDays || 7;
    const now = new Date();

    for (const sub of subscriptions) {
      if (sub.status === SubscriptionStatus.CANCELLED || sub.status === SubscriptionStatus.EXPIRED) {
        continue;
      }

      // Handle Trial Expiry
      if (sub.status === SubscriptionStatus.TRIAL && sub.trialEndDate) {
        const trialEnd = new Date(sub.trialEndDate);
        if (now > trialEnd) {
          // Trial has ended. Transition to ACTIVE if free or PAST_DUE if unpaid
          const plan = db.getSubscriptionPlanById(sub.planId);
          if (plan && plan.price === 0) {
            db.updateSellerSubscription(sub.id, { status: SubscriptionStatus.ACTIVE });
          } else {
            db.updateSellerSubscription(sub.id, { status: SubscriptionStatus.PAST_DUE });
            const shop = db.getShopById(sub.shopId);
            if (shop) {
              db.saveShop({
                ...shop,
                financials: {
                  ...shop.financials,
                  subscriptionStatus: SubscriptionStatus.PAST_DUE,
                },
              });
            }
          }
        }
      }

      // Handle Active Due Date & Grace Period
      if (sub.status === SubscriptionStatus.ACTIVE && sub.nextBillingDate) {
        const nextDue = new Date(sub.nextBillingDate);
        if (now > nextDue) {
          const graceEnd = new Date(nextDue.getTime() + graceDays * 24 * 60 * 60 * 1000);
          if (now <= graceEnd) {
            db.updateSellerSubscription(sub.id, { status: SubscriptionStatus.GRACE_PERIOD });
          } else {
            db.updateSellerSubscription(sub.id, { status: SubscriptionStatus.PAST_DUE });
          }
        }
      }
    }
  }
}

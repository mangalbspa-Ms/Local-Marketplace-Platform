/**
 * Commission & Settlement Calculation Service (Rule F & G, Phase 9)
 * 
 * Platform Owner configurable commissions, shop billing modes,
 * subscription deductions from settlements, and revenue calculations.
 */

import { db } from '../storage/db.ts';
import {
  BillingMode,
  CommissionConfig,
  SellerSettlement,
  SettlementStatus,
  AuditEventType,
  SubscriptionPaymentStatus,
} from '../../types/financial.ts';
import { OrderStatus } from '../../types/order.ts';
import { UserRole } from '../../types/auth.ts';
import { ValidationError, NotFoundError, ForbiddenError } from '../utils/errors.ts';

export class CommissionService {
  public static getPlatformCommissionConfig(): CommissionConfig {
    return db.getCommissionConfig();
  }

  public static updateCommissionConfig(adminUserId: string, updates: Partial<CommissionConfig>): CommissionConfig {
    if (adminUserId) {
      const user = db.getUserById(adminUserId);
      if (user && user.role !== UserRole.ADMIN) {
        throw new ForbiddenError('Only platform administrators can modify platform commission configurations.');
      }
    }

    if (updates.defaultPercentage !== undefined && (updates.defaultPercentage < 0 || updates.defaultPercentage > 100)) {
      throw new ValidationError('Commission percentage must be between 0% and 100%.');
    }

    const previous = db.getCommissionConfig();
    const updated = db.updateCommissionConfig(updates);

    db.recordAuditLog({
      eventType: AuditEventType.COMMISSION_RATE_UPDATED,
      performedByUserId: adminUserId,
      details: { previous, updated },
    });

    return updated;
  }

  public static setShopBillingSettings(
    adminUserId: string,
    shopId: string,
    settings: {
      billingMode?: BillingMode;
      customCommissionPercentage?: number;
      subscriptionPlanId?: string;
      deductSubscriptionFromSettlement?: boolean;
    }
  ): void {
    const shop = db.getShopById(shopId);
    if (!shop) {
      throw new NotFoundError('Shop', shopId);
    }

    if (
      settings.customCommissionPercentage !== undefined &&
      (settings.customCommissionPercentage < 0 || settings.customCommissionPercentage > 100)
    ) {
      throw new ValidationError('Commission percentage must be between 0% and 100%.');
    }

    const previousFinancials = { ...shop.financials };

    let planName = shop.financials.subscriptionPlanName;
    if (settings.subscriptionPlanId) {
      const plan = db.getSubscriptionPlanById(settings.subscriptionPlanId);
      if (plan) planName = plan.name;
    }

    shop.financials = {
      ...shop.financials,
      billingMode: settings.billingMode ?? shop.financials.billingMode ?? 'COMMISSION',
      customCommissionPercentage:
        settings.customCommissionPercentage !== undefined
          ? settings.customCommissionPercentage
          : shop.financials.customCommissionPercentage,
      subscriptionPlanId: settings.subscriptionPlanId ?? shop.financials.subscriptionPlanId,
      subscriptionPlanName: planName,
      deductSubscriptionFromSettlement:
        settings.deductSubscriptionFromSettlement !== undefined
          ? settings.deductSubscriptionFromSettlement
          : shop.financials.deductSubscriptionFromSettlement ?? false,
    };

    db.saveShop(shop);

    db.recordAuditLog({
      eventType: AuditEventType.BILLING_MODE_CHANGED,
      shopId: shop.id,
      sellerId: shop.sellerId,
      performedByUserId: adminUserId,
      details: { previous: previousFinancials, current: shop.financials },
    });
  }

  public static setShopCustomCommission(adminUserId: string, shopId: string, customPercentage: number): void {
    this.setShopBillingSettings(adminUserId, shopId, { customCommissionPercentage: customPercentage });
  }

  /**
   * Generates a calculated settlement summary for a seller's shop
   */
  public static calculateSellerSettlementSummary(shopId: string): {
    totalOrders: number;
    completedOrders: number;
    grossSales: number;
    platformCommission: number;
    deliveryFees: number;
    pendingSubscriptionDeduction: number;
    netPayable: number;
  } {
    const shop = db.getShopById(shopId);
    const orders = db.getOrders({ shopId });
    const completedOrders = orders.filter((o) => o.status === OrderStatus.COMPLETED || o.status === OrderStatus.CONFIRMED);

    let grossSales = 0;
    let platformCommission = 0;
    let deliveryFees = 0;

    for (const order of completedOrders) {
      grossSales += order.financials.itemSubtotal;
      platformCommission += order.financials.commissionAmount;
      deliveryFees += order.financials.deliveryFee;
    }

    // Check if subscription should be deducted from settlement
    let pendingSubscriptionDeduction = 0;
    if (shop?.financials.deductSubscriptionFromSettlement) {
      const pendingInvoices = db.getSubscriptionInvoices({
        shopId,
        status: SubscriptionPaymentStatus.PENDING,
      });
      pendingSubscriptionDeduction = pendingInvoices.reduce((sum, inv) => sum + inv.total, 0);
    }

    grossSales = Math.round(grossSales * 100) / 100;
    platformCommission = Math.round(platformCommission * 100) / 100;
    deliveryFees = Math.round(deliveryFees * 100) / 100;
    pendingSubscriptionDeduction = Math.round(pendingSubscriptionDeduction * 100) / 100;

    const netPayable = Math.max(0, Math.round((grossSales + deliveryFees - platformCommission - pendingSubscriptionDeduction) * 100) / 100);

    return {
      totalOrders: orders.length,
      completedOrders: completedOrders.length,
      grossSales,
      platformCommission,
      deliveryFees,
      pendingSubscriptionDeduction,
      netPayable,
    };
  }

  public static generateSettlementForShop(shopId: string, adminUserId = 'usr_admin_01'): SellerSettlement {
    return this.createSettlementBatch({ shopId, adminUserId });
  }

  /**
   * Generate an official settlement payout batch for a seller
   */
  public static createSettlementBatch(params: {
    shopId: string;
    adminUserId: string;
    periodStart?: string;
    periodEnd?: string;
    payoutMethod?: string;
    payoutReferenceId?: string;
  }): SellerSettlement {
    const shop = db.getShopById(params.shopId);
    if (!shop) throw new NotFoundError('Shop', params.shopId);

    const summary = this.calculateSellerSettlementSummary(params.shopId);
    const batchId = `BATCH-${new Date().getFullYear()}-W${Math.floor(10 + Math.random() * 80)}`;
    const settlementId = `set_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

    const newSettlement: SellerSettlement = {
      id: settlementId,
      settlementBatchId: batchId,
      sellerId: shop.sellerId,
      shopId: shop.id,
      periodStart: params.periodStart || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      periodEnd: params.periodEnd || new Date().toISOString(),
      totalOrdersCount: summary.completedOrders,
      grossSalesAmount: summary.grossSales,
      totalPlatformCommission: summary.platformCommission,
      totalDeliveryFeesCollected: summary.deliveryFees,
      subscriptionFeeDeducted: summary.pendingSubscriptionDeduction,
      netPayableToSeller: summary.netPayable,
      status: SettlementStatus.PENDING,
      payoutMethod: params.payoutMethod || 'UPI',
      payoutReferenceId: params.payoutReferenceId,
      createdAt: new Date().toISOString(),
    };

    const saved = db.saveSettlement(newSettlement);

    // If subscription fees were deducted, mark pending subscription invoices as paid via settlement
    if (summary.pendingSubscriptionDeduction > 0) {
      const pendingInvoices = db.getSubscriptionInvoices({
        shopId: shop.id,
        status: SubscriptionPaymentStatus.PENDING,
      });

      for (const inv of pendingInvoices) {
        db.updateSubscriptionInvoice(inv.id, {
          status: SubscriptionPaymentStatus.PAID,
          paymentMethod: 'SETTLEMENT_DEDUCTION',
          paymentReference: `DEDUCTED_FROM_${batchId}`,
          paidAt: new Date().toISOString(),
        });
      }
    }

    db.recordAuditLog({
      eventType: AuditEventType.SETTLEMENT_PROCESSED,
      performedByUserId: params.adminUserId,
      sellerId: shop.sellerId,
      shopId: shop.id,
      amount: summary.netPayable,
      details: {
        settlementId: saved.id,
        batchId: saved.settlementBatchId,
        grossSales: summary.grossSales,
        commission: summary.platformCommission,
        subscriptionDeduction: summary.pendingSubscriptionDeduction,
      },
    });

    return saved;
  }

  /**
   * Process and mark a settlement as COMPLETED
   */
  public static markSettlementCompleted(settlementId: string, adminUserId: string, payoutReferenceId?: string): SellerSettlement {
    const settlement = db.getSettlementById(settlementId);
    if (!settlement) throw new NotFoundError('Settlement', settlementId);

    settlement.status = SettlementStatus.COMPLETED;
    settlement.processedAt = new Date().toISOString();
    if (payoutReferenceId) {
      settlement.payoutReferenceId = payoutReferenceId;
    }

    const saved = db.saveSettlement(settlement);

    db.recordAuditLog({
      eventType: AuditEventType.SETTLEMENT_PROCESSED,
      performedByUserId: adminUserId,
      sellerId: settlement.sellerId,
      shopId: settlement.shopId,
      amount: settlement.netPayableToSeller,
      details: { action: 'SETTLEMENT_COMPLETED', settlementId, payoutReference: settlement.payoutReferenceId },
    });

    return saved;
  }
}

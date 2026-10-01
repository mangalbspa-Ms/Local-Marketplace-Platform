/**
 * Master Admin Governance, Management, Reports & Settings Routes
 */

import { Router } from 'express';
import { AdminController } from '../controllers/admin.controller.ts';
import { authenticate } from '../middleware/auth.middleware.ts';
import { requireAdmin } from '../middleware/role.middleware.ts';

const router = Router();

// Strict RBAC: All Admin routes require valid bearer token AND role = ADMIN
router.use('/admin', authenticate(true), requireAdmin);

// Dashboard & Analytics
router.get('/admin/stats', AdminController.getPlatformStats);
router.get('/admin/analytics/charts', AdminController.getAnalyticsCharts);

// Market Management
router.get('/admin/markets', AdminController.listMarkets);
router.post('/admin/markets', AdminController.createMarket);
router.patch('/admin/markets/:marketId', AdminController.updateMarket);
router.patch('/admin/markets/:marketId/status', AdminController.toggleMarketStatus);

// Shop Management
router.get('/admin/shops', AdminController.listShops);
router.patch('/admin/shops/:shopId/status', AdminController.updateShopStatus);
router.post('/admin/shops/:shopId/verify', AdminController.verifyShop);
router.post('/admin/shops/:shopId/reject', AdminController.rejectShop);
router.get('/admin/change-requests', AdminController.listChangeRequests);
router.post('/admin/change-requests/:requestId/review', AdminController.reviewChangeRequest);
router.patch('/admin/shops/:shopId', AdminController.updateShopDetails);
router.patch('/admin/shops/:shopId/photos', AdminController.manageShopPhotos);
router.patch('/admin/shops/:shopId/fulfillment', AdminController.updateShopFulfillment);
router.patch('/admin/shops/:shopId/commission', AdminController.setShopCommission);
router.get('/admin/shops/:shopId/settlement', AdminController.getSellerSettlementSummary);

// Seller Management
router.get('/admin/sellers', AdminController.listSellers);
router.patch('/admin/sellers/:sellerId/status', AdminController.toggleSellerStatus);

// Customer Management
router.get('/admin/customers', AdminController.listCustomers);
router.patch('/admin/customers/:customerId/status', AdminController.toggleCustomerStatus);
router.patch('/admin/users/:userId/photos', AdminController.manageUserPhotos);

// Product Management
router.get('/admin/products', AdminController.listProducts);
router.post('/admin/products', AdminController.createProduct);
router.patch('/admin/products/:productId', AdminController.updateProduct);
router.delete('/admin/products/:productId', AdminController.deleteProduct);

// Central Master Catalogue System
router.get('/admin/master-catalog', AdminController.listMasterProducts);
router.get('/admin/master-catalog/:id', AdminController.getMasterProductById);
router.post('/admin/master-catalog', AdminController.createMasterProduct);
router.patch('/admin/master-catalog/:id', AdminController.updateMasterProduct);
router.delete('/admin/master-catalog/:id', AdminController.deleteMasterProduct);
router.post('/admin/shops/:shopId/bulk-from-master', AdminController.bulkAddFromMaster);

// Master Orders & Details
router.get('/admin/orders', AdminController.listOrders);
router.get('/admin/orders/:orderId', AdminController.getOrderDetails);

// Payment Monitor
router.get('/admin/payments', AdminController.listPayments);

// Settlements
router.get('/admin/settlements', AdminController.listSettlements);
router.post('/admin/settlements/create-batch', AdminController.createSettlementBatch);
router.patch('/admin/settlements/:settlementId/status', AdminController.updateSettlementStatus);

// Phase 9: Subscription Plans & Shop Billing
router.get('/admin/subscription-plans', AdminController.listSubscriptionPlans);
router.post('/admin/subscription-plans', AdminController.createSubscriptionPlan);
router.patch('/admin/subscription-plans/:planId', AdminController.updateSubscriptionPlan);
router.delete('/admin/subscription-plans/:planId', AdminController.deleteSubscriptionPlan);
router.patch('/admin/shops/:shopId/billing', AdminController.updateShopBillingSettings);
router.get('/admin/subscription-invoices', AdminController.listSubscriptionInvoices);
router.get('/admin/subscriptions', AdminController.listSellerSubscriptions);
router.get('/admin/billing-transactions', AdminController.listBillingTransactions);

// Phase 10 & 13: Admin Quick Onboarding, Seller Invitations & Management Mode
router.post('/admin/onboard-shop', AdminController.quickOnboardShop);
router.post('/admin/seller-invitations', AdminController.createSellerInvitation);
router.get('/admin/seller-invitations', AdminController.getSellerInvitations);
router.post('/admin/shops/:shopId/bulk-products', AdminController.bulkUploadProducts);
router.patch('/admin/shops/:shopId/management-mode', AdminController.updateManagementMode);

// Commission & Financials
router.get('/admin/commissions', AdminController.getCommissionConfig);
router.patch('/admin/commissions', AdminController.updateCommissionConfig);
router.get('/admin/reports/commissions', AdminController.getCommissionReports);
router.get('/admin/reports/order-analytics', AdminController.getOrderAnalytics);
router.get('/admin/reports/shop-performance', AdminController.getShopPerformance);

// Support & Disputes
router.get('/admin/support/tickets', AdminController.listSupportTickets);
router.patch('/admin/support/tickets/:ticketId', AdminController.updateSupportTicket);

// System Logs & Settings
router.get('/admin/audit-logs', AdminController.listAuditLogs);
router.get('/admin/settings', AdminController.getSystemSettings);
router.patch('/admin/settings', AdminController.updateSystemSettings);
router.get('/admin/notifications', AdminController.listAdminNotifications);

export default router;

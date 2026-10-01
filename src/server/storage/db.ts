/**
 * Persistent Production Database Repository
 * 
 * Provides relational collections, transactional inventory operations,
 * atomic durability with disk persistence, PostgreSQL interoperability,
 * indexing by IDs, and audit logging.
 */

import fs from 'fs';
import path from 'path';
import { User, UserAddress, UserRole } from '../../types/auth.ts';
import { LocalMarket, Shop, ShopVerificationStatus, ShopChangeRequest, LocationSource } from '../../types/market.ts';
import { Product, MasterProduct, CreateMasterProductDTO, UpdateMasterProductDTO, ProductUnitType } from '../../types/product.ts';
import { Order, OrderStatus } from '../../types/order.ts';
import { ShoppingRequest, ShoppingRequestStatus } from '../../types/shoppingRequest.ts';
import { PaymentRecord } from '../../types/payment.ts';
import {
  CommissionConfig,
  SellerSettlement,
  AuditTransactionRecord,
  AuditEventType,
  SubscriptionPlan,
  SellerSubscription,
  SubscriptionInvoice,
  BillingTransaction,
  SubscriptionStatus,
  SubscriptionPaymentStatus,
} from '../../types/financial.ts';
import { AppNotification } from '../../types/notification.ts';
import { SupportTicket, SystemSettings, SellerInvitation } from '../../types/admin.ts';
import { AIVoiceDraft, AIAuditRecord } from '../../types/ai.ts';
import {
  seedUsers,
  seedMarkets,
  seedShops,
  seedProducts,
  seedOrders,
  seedSettlements,
  seedNotifications,
  seedCommissionConfig,
  seedAuditLogs,
  seedSupportTickets,
  seedSystemSettings,
  seedSubscriptionPlans,
  seedSellerSubscriptions,
  seedSubscriptionInvoices,
  seedBillingTransactions,
  seedShoppingRequests,
} from './seedData.ts';
import { getSeedMasterProducts } from './seedMasterCatalog.ts';
import { Logger } from '../utils/logger.ts';

interface PersistentDatabaseState {
  version: number;
  lastSavedAt: string;
  users: User[];
  markets: LocalMarket[];
  shops: Shop[];
  products: Product[];
  orders: Order[];
  shoppingRequests?: ShoppingRequest[];
  payments: PaymentRecord[];
  settlements: SellerSettlement[];
  notifications: AppNotification[];
  supportTickets: SupportTicket[];
  systemSettings: SystemSettings;
  commissionConfig: CommissionConfig;
  auditLogs: AuditTransactionRecord[];
  subscriptionPlans?: SubscriptionPlan[];
  sellerSubscriptions?: SellerSubscription[];
  subscriptionInvoices?: SubscriptionInvoice[];
  billingTransactions?: BillingTransaction[];
  aiAudits?: AIAuditRecord[];
  aiDrafts?: AIVoiceDraft[];
  sellerInvitations?: SellerInvitation[];
  masterProducts?: MasterProduct[];
  shopChangeRequests?: ShopChangeRequest[];
}

class Database {
  private users: Map<string, User> = new Map();
  private markets: Map<string, LocalMarket> = new Map();
  private shops: Map<string, Shop> = new Map();
  private products: Map<string, Product> = new Map();
  private masterProducts: Map<string, MasterProduct> = new Map();
  private orders: Map<string, Order> = new Map();
  private shoppingRequests: Map<string, ShoppingRequest> = new Map();
  private payments: Map<string, PaymentRecord> = new Map();
  private settlements: Map<string, SellerSettlement> = new Map();
  private notifications: Map<string, AppNotification> = new Map();
  private supportTickets: Map<string, SupportTicket> = new Map();
  private systemSettings: SystemSettings = { ...seedSystemSettings };
  private commissionConfig: CommissionConfig = { ...seedCommissionConfig };
  private auditLogs: AuditTransactionRecord[] = [];
  private subscriptionPlans: Map<string, SubscriptionPlan> = new Map();
  private sellerSubscriptions: Map<string, SellerSubscription> = new Map();
  private subscriptionInvoices: Map<string, SubscriptionInvoice> = new Map();
  private billingTransactions: BillingTransaction[] = [];
  private aiAudits: AIAuditRecord[] = [];
  private aiDrafts: Map<string, AIVoiceDraft> = new Map();
  private sellerInvitations: Map<string, SellerInvitation> = new Map();
  private shopChangeRequests: Map<string, ShopChangeRequest> = new Map();

  private persistenceFilePath: string;
  private isPersisting: boolean = false;

  constructor() {
    const dataDir = process.env.DATABASE_PERSISTENCE_DIR || path.join(process.cwd(), 'data');
    if (!fs.existsSync(dataDir)) {
      try {
        fs.mkdirSync(dataDir, { recursive: true });
      } catch (err) {
        Logger.error('Failed to create data persistence directory', err);
      }
    }
    this.persistenceFilePath = path.join(dataDir, 'marketplace_db.json');
    this.init();
  }

  private init() {
    if (fs.existsSync(this.persistenceFilePath)) {
      try {
        const raw = fs.readFileSync(this.persistenceFilePath, 'utf8');
        const state: PersistentDatabaseState = JSON.parse(raw);
        this.loadState(state);
        Logger.info('Loaded database from persistent disk storage', {
          file: this.persistenceFilePath,
          users: this.users.size,
          shops: this.shops.size,
          products: this.products.size,
          orders: this.orders.size,
          lastSavedAt: state.lastSavedAt,
        });
        return;
      } catch (err: any) {
        Logger.error('Failed to parse persistent database file. Falling back to bootstrap seed.', err);
      }
    }

    this.bootstrap();
  }

  private loadState(state: PersistentDatabaseState) {
    this.users.clear();
    this.markets.clear();
    this.shops.clear();
    this.products.clear();
    this.orders.clear();
    this.shoppingRequests.clear();
    this.payments.clear();
    this.settlements.clear();
    this.notifications.clear();
    this.supportTickets.clear();
    this.subscriptionPlans.clear();
    this.sellerSubscriptions.clear();
    this.subscriptionInvoices.clear();
    this.billingTransactions = [];
    this.auditLogs = [];
    this.aiAudits = [];
    this.aiDrafts.clear();

    (state.users || []).forEach((u) => {
      // Ensure seed users with avatars keep their avatar if missing
      const seedUserMatch = seedUsers.find((su) => su.id === u.id || su.phone === u.phone || su.fullName === u.fullName);
      if (!u.avatarUrl && seedUserMatch?.avatarUrl) {
        u.avatarUrl = seedUserMatch.avatarUrl;
      }
      this.users.set(u.id, u);
    });
    // Ensure any missing seed users are present
    seedUsers.forEach((su) => {
      if (!this.users.has(su.id)) {
        this.users.set(su.id, { ...su });
      }
    });

    (state.markets || []).forEach((m) => this.markets.set(m.id, m));
    (state.shops || []).forEach((s) => this.shops.set(s.id, s));
    (state.products || []).forEach((p) => this.products.set(p.id, p));
    (state.orders || []).forEach((o) => {
      this.orders.set(o.id, this.enrichOrder(o));
    });
    (state.shoppingRequests && state.shoppingRequests.length > 0 ? state.shoppingRequests : seedShoppingRequests)
      .forEach((sr) => this.shoppingRequests.set(sr.id, sr));
    (state.payments || []).forEach((p) => this.payments.set(p.id, p));
    (state.settlements || []).forEach((s) => this.settlements.set(s.id, s));
    (state.notifications || []).forEach((n) => this.notifications.set(n.id, n));
    seedNotifications.forEach((sn) => {
      if (!this.notifications.has(sn.id)) {
        this.notifications.set(sn.id, { ...sn });
      }
    });
    (state.supportTickets || []).forEach((t) => this.supportTickets.set(t.id, t));
    (Array.isArray(state.subscriptionPlans) ? state.subscriptionPlans : seedSubscriptionPlans)
      .forEach((sp) => this.subscriptionPlans.set(sp.id, sp));
    (state.sellerSubscriptions && state.sellerSubscriptions.length > 0 ? state.sellerSubscriptions : seedSellerSubscriptions)
      .forEach((ss) => this.sellerSubscriptions.set(ss.id, ss));
    (state.subscriptionInvoices && state.subscriptionInvoices.length > 0 ? state.subscriptionInvoices : seedSubscriptionInvoices)
      .forEach((si) => this.subscriptionInvoices.set(si.id, si));
    this.billingTransactions = state.billingTransactions && state.billingTransactions.length > 0
      ? state.billingTransactions
      : [...seedBillingTransactions];
    this.aiAudits = state.aiAudits || [];
    (state.aiDrafts || []).forEach((d) => this.aiDrafts.set(d.id, d));
    (state.sellerInvitations || []).forEach((inv) => this.sellerInvitations.set(inv.invitationToken, inv));
    this.shopChangeRequests.clear();
    (state.shopChangeRequests || []).forEach((cr) => this.shopChangeRequests.set(cr.id, cr));

    // Safe Migration: Ensure all shops have a verificationStatus, location metadata, and normalized photos
    this.shops.forEach((s) => {
      const profilePhoto = s.profilePhotoUrl || s.logoImageUrl || s.photoUrl;
      const coverPhoto = s.coverPhotoUrl || s.bannerImageUrl || s.bannerUrl;
      if (profilePhoto) {
        s.profilePhotoUrl = s.profilePhotoUrl || profilePhoto;
        s.logoImageUrl = s.logoImageUrl || profilePhoto;
        s.photoUrl = s.photoUrl || profilePhoto;
      }
      if (coverPhoto) {
        s.coverPhotoUrl = s.coverPhotoUrl || coverPhoto;
        s.bannerImageUrl = s.bannerImageUrl || coverPhoto;
        s.bannerUrl = s.bannerUrl || coverPhoto;
      }
      const seedShopMatch = seedShops.find((ss) => ss.id === s.id);
      if (seedShopMatch?.coverPhotos && (!s.coverPhotos || s.coverPhotos.length === 0)) {
        s.coverPhotos = [...seedShopMatch.coverPhotos];
      }
      if (!s.coverPhotos && coverPhoto) {
        s.coverPhotos = [coverPhoto];
      }
      if (!s.verificationStatus) {
        if (s.isVerifiedByAdmin && s.isActive) {
          s.verificationStatus = 'VERIFIED';
          s.verifiedAt = s.verifiedAt || '2026-08-01T00:00:00Z';
          s.verifiedBy = s.verifiedBy || 'usr_admin_01';
          s.verifiedByName = s.verifiedByName || 'Rajesh Malhotra (Platform Admin)';
          s.locationSource = s.locationSource || 'gps';
          s.locationAccuracy = s.locationAccuracy || 8.5;
        } else {
          s.verificationStatus = 'PENDING_VERIFICATION';
        }
      }
      // Attach active change request if pending
      if (!s.activeChangeRequest) {
        const pendingCR = Array.from(this.shopChangeRequests.values()).find(
          (cr) => cr.shopId === s.id && cr.status === 'PENDING'
        );
        if (pendingCR) {
          s.activeChangeRequest = pendingCR;
          s.verificationStatus = 'CHANGE_REQUEST_PENDING';
        }
      }
    });

    // Load Master Catalogue items
    this.masterProducts.clear();
    const seedMaster = getSeedMasterProducts();
    const incomingMaster = (state.masterProducts && state.masterProducts.length > 0)
      ? state.masterProducts
      : seedMaster;

    incomingMaster.forEach((mp) => this.masterProducts.set(mp.id, mp));
    seedMaster.forEach((sm) => {
      if (!this.masterProducts.has(sm.id)) {
        this.masterProducts.set(sm.id, sm);
      }
    });

    this.systemSettings = state.systemSettings || { ...seedSystemSettings };
    this.commissionConfig = state.commissionConfig || { ...seedCommissionConfig };
    this.auditLogs = state.auditLogs || [];
  }

  /**
   * Helper to ensure an Order object always contains valid customer avatar and product images
   */
  public enrichOrder(o: Order): Order {
    let customerAvatar = o.customerAvatar;
    if (!customerAvatar) {
      const cust = this.users.get(o.customerId) ||
        Array.from(this.users.values()).find(
          (u) => (o.customerName && u.fullName && u.fullName.toLowerCase() === o.customerName.toLowerCase()) || (u.phone && u.phone === o.customerPhone)
        ) ||
        seedUsers.find(
          (u) => (o.customerName && u.fullName && u.fullName.toLowerCase() === o.customerName.toLowerCase()) || (u.phone && u.phone === o.customerPhone)
        );
      if (cust?.avatarUrl) {
        customerAvatar = cust.avatarUrl;
      }
    }

    const enrichedItems = (o.items || []).map((item) => {
      let productImage = item.productImage;
      if (!productImage) {
        const prod = this.products.get(item.productId) ||
          Array.from(this.products.values()).find(
            (p) => Boolean(item.productName && p.name && p.name.toLowerCase() === item.productName.toLowerCase())
          ) ||
          seedProducts.find(
            (p) => Boolean(item.productName && p.name && p.name.toLowerCase() === item.productName.toLowerCase())
          );
        if (prod) {
          productImage = prod.imageUrl;
        }
      }
      return {
        ...item,
        productImage: productImage && productImage.trim() !== '' ? productImage : undefined,
      };
    });

    return {
      ...o,
      customerAvatar: customerAvatar && customerAvatar.trim() !== '' ? customerAvatar : undefined,
      items: enrichedItems,
    };
  }

  private flushToDisk() {
    if (this.isPersisting) return;
    try {
      this.isPersisting = true;
      const state: PersistentDatabaseState = {
        version: 1,
        lastSavedAt: new Date().toISOString(),
        users: Array.from(this.users.values()),
        markets: Array.from(this.markets.values()),
        shops: Array.from(this.shops.values()),
        products: Array.from(this.products.values()),
        orders: Array.from(this.orders.values()),
        shoppingRequests: Array.from(this.shoppingRequests.values()),
        payments: Array.from(this.payments.values()),
        settlements: Array.from(this.settlements.values()),
        notifications: Array.from(this.notifications.values()),
        supportTickets: Array.from(this.supportTickets.values()),
        systemSettings: this.systemSettings,
        commissionConfig: this.commissionConfig,
        auditLogs: this.auditLogs,
        subscriptionPlans: Array.from(this.subscriptionPlans.values()),
        sellerSubscriptions: Array.from(this.sellerSubscriptions.values()),
        subscriptionInvoices: Array.from(this.subscriptionInvoices.values()),
        billingTransactions: this.billingTransactions,
        aiAudits: this.aiAudits,
        aiDrafts: Array.from(this.aiDrafts.values()),
        sellerInvitations: Array.from(this.sellerInvitations.values()),
        masterProducts: Array.from(this.masterProducts.values()),
        shopChangeRequests: Array.from(this.shopChangeRequests.values()),
      };

      const dir = path.dirname(this.persistenceFilePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      fs.writeFileSync(this.persistenceFilePath, JSON.stringify(state, null, 2), 'utf8');
    } catch (err: any) {
      Logger.error('Failed to flush database state to disk', err);
    } finally {
      this.isPersisting = false;
    }
  }

  public bootstrap() {
    this.users.clear();
    this.markets.clear();
    this.shops.clear();
    this.products.clear();
    this.orders.clear();
    this.shoppingRequests.clear();
    this.payments.clear();
    this.settlements.clear();
    this.notifications.clear();
    this.supportTickets.clear();
    this.subscriptionPlans.clear();
    this.sellerSubscriptions.clear();
    this.subscriptionInvoices.clear();
    this.billingTransactions = [];
    this.auditLogs = [];

    const isStrictProduction = process.env.NODE_ENV === 'production' && process.env.ENABLE_DEMO_SEED !== 'true';

    if (isStrictProduction) {
      // In strict production mode without demo seed flag, only initialize system foundations and admin credentials
      seedUsers.filter((u) => u.role === UserRole.ADMIN).forEach((u) => this.users.set(u.id, { ...u }));
      seedSubscriptionPlans.forEach((sp) => this.subscriptionPlans.set(sp.id, { ...sp }));
      this.systemSettings = { ...seedSystemSettings };
      this.commissionConfig = { ...seedCommissionConfig };

      Logger.info('Database initialized in clean PRODUCTION mode (no demo data)', {
        adminUsers: this.users.size,
        subscriptionPlans: this.subscriptionPlans.size,
      });
    } else {
      // Development / Staging / Demo / Testing mode with rich fixture dataset
      seedUsers.forEach((u) => this.users.set(u.id, { ...u }));
      seedMarkets.forEach((m) => this.markets.set(m.id, { ...m }));
      seedShops.forEach((s) => {
        const profilePhoto = s.profilePhotoUrl || s.logoImageUrl || s.photoUrl;
        const coverPhoto = s.coverPhotoUrl || s.bannerImageUrl || s.bannerUrl;
        const migrated: Shop = {
          ...s,
          profilePhotoUrl: profilePhoto,
          photoUrl: s.photoUrl || profilePhoto,
          logoImageUrl: s.logoImageUrl || profilePhoto,
          coverPhotoUrl: coverPhoto,
          coverPhotos: s.coverPhotos && s.coverPhotos.length > 0 ? s.coverPhotos : (coverPhoto ? [coverPhoto] : undefined),
          bannerImageUrl: s.bannerImageUrl || coverPhoto,
          bannerUrl: s.bannerUrl || coverPhoto,
          verificationStatus: s.verificationStatus || ((s.isVerifiedByAdmin && s.isActive) ? 'VERIFIED' : 'PENDING_VERIFICATION'),
          verifiedAt: s.verifiedAt || (s.isVerifiedByAdmin ? '2026-08-01T00:00:00Z' : undefined),
          verifiedBy: s.verifiedBy || (s.isVerifiedByAdmin ? 'usr_admin_01' : undefined),
          verifiedByName: s.verifiedByName || (s.isVerifiedByAdmin ? 'Rajesh Malhotra (Platform Admin)' : undefined),
          locationSource: s.locationSource || 'gps',
          locationAccuracy: s.locationAccuracy || 8.5,
          locationUpdatedAt: s.locationUpdatedAt || s.updatedAt,
        };
        this.shops.set(s.id, migrated);
      });
      seedProducts.forEach((p) => this.products.set(p.id, { ...p }));
      seedOrders.forEach((o) => this.orders.set(o.id, { ...o }));
      seedShoppingRequests.forEach((sr) => this.shoppingRequests.set(sr.id, { ...sr }));
      seedSettlements.forEach((s) => this.settlements.set(s.id, { ...s }));
      seedNotifications.forEach((n) => this.notifications.set(n.id, { ...n }));
      seedSupportTickets.forEach((t) => this.supportTickets.set(t.id, { ...t }));
      seedSubscriptionPlans.forEach((sp) => this.subscriptionPlans.set(sp.id, { ...sp }));
      seedSellerSubscriptions.forEach((ss) => this.sellerSubscriptions.set(ss.id, { ...ss }));
      seedSubscriptionInvoices.forEach((si) => this.subscriptionInvoices.set(si.id, { ...si }));
      this.billingTransactions = seedBillingTransactions.map((bt) => ({ ...bt }));
      this.systemSettings = { ...seedSystemSettings };
      this.commissionConfig = { ...seedCommissionConfig };
      this.auditLogs = seedAuditLogs.map((a) => ({ ...a }));

      Logger.info('Database initialized with bootstrap seed data', {
        users: this.users.size,
        markets: this.markets.size,
        shops: this.shops.size,
        products: this.products.size,
        orders: this.orders.size,
        settlements: this.settlements.size,
        notifications: this.notifications.size,
        supportTickets: this.supportTickets.size,
        subscriptionPlans: this.subscriptionPlans.size,
        sellerSubscriptions: this.sellerSubscriptions.size,
      });
    }

    this.flushToDisk();
  }

  // --- Users ---
  public getUsers(): User[] {
    return Array.from(this.users.values());
  }

  public getUserById(id: string): User | undefined {
    return this.users.get(id);
  }

  public getUserByPhone(phone: string): User | undefined {
    return Array.from(this.users.values()).find((u) => u.phone === phone);
  }

  public getUserByEmail(email: string): User | undefined {
    return Array.from(this.users.values()).find((u) => u.email?.toLowerCase() === email.toLowerCase());
  }

  public saveUser(user: User): User {
    this.users.set(user.id, { ...user, updatedAt: new Date().toISOString() });
    this.flushToDisk();
    return this.users.get(user.id)!;
  }

  public addUserAddress(userId: string, address: Omit<UserAddress, 'id'>): User {
    const user = this.getUserById(userId);
    if (!user) throw new Error('User not found');
    const newAddress: UserAddress = {
      id: `addr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      ...address,
    };
    if (newAddress.isDefault || user.addresses.length === 0) {
      user.addresses.forEach((a) => (a.isDefault = false));
      newAddress.isDefault = true;
    }
    user.addresses.unshift(newAddress);
    return this.saveUser(user);
  }

  public deleteUserAddress(userId: string, addressId: string): User {
    const user = this.getUserById(userId);
    if (!user) throw new Error('User not found');
    user.addresses = user.addresses.filter((a) => a.id !== addressId);
    if (user.addresses.length > 0 && !user.addresses.some((a) => a.isDefault)) {
      user.addresses[0].isDefault = true;
    }
    return this.saveUser(user);
  }

  public setDefaultUserAddress(userId: string, addressId: string): User {
    const user = this.getUserById(userId);
    if (!user) throw new Error('User not found');
    user.addresses.forEach((a) => {
      a.isDefault = a.id === addressId;
    });
    return this.saveUser(user);
  }

  public updateUserProfile(userId: string, data: Partial<Pick<User, 'fullName' | 'email' | 'phone' | 'avatarUrl' | 'profilePhotoUrl' | 'coverPhotoUrl'>>): User {
    const user = this.getUserById(userId);
    if (!user) throw new Error('User not found');
    if (data.fullName !== undefined) user.fullName = data.fullName;
    if (data.email !== undefined) user.email = data.email;
    if (data.phone !== undefined) user.phone = data.phone;
    if (data.avatarUrl !== undefined) {
      user.avatarUrl = data.avatarUrl;
      user.profilePhotoUrl = data.avatarUrl;
    }
    if (data.profilePhotoUrl !== undefined) {
      user.profilePhotoUrl = data.profilePhotoUrl;
      user.avatarUrl = data.profilePhotoUrl;
    }
    if (data.coverPhotoUrl !== undefined) {
      user.coverPhotoUrl = data.coverPhotoUrl;
    }
    return this.saveUser(user);
  }

  // --- Markets ---
  public getMarkets(): LocalMarket[] {
    return Array.from(this.markets.values()).filter((m) => m.isActive);
  }

  public getAllMarketsForAdmin(): LocalMarket[] {
    return Array.from(this.markets.values()).sort((a, b) => a.name.localeCompare(b.name));
  }

  public getMarketById(id: string): LocalMarket | undefined {
    return this.markets.get(id);
  }

  public saveMarket(market: LocalMarket): LocalMarket {
    this.markets.set(market.id, { ...market });
    this.flushToDisk();
    return this.markets.get(market.id)!;
  }

  public deleteMarket(id: string): boolean {
    const res = this.markets.delete(id);
    this.flushToDisk();
    return res;
  }

  // --- Shops ---
  public getShops(filterOrMarketId?: string | { marketId?: string; status?: string }): Shop[] {
    let list = Array.from(this.shops.values()).filter((s) => s.isActive);
    if (typeof filterOrMarketId === 'string' && filterOrMarketId) {
      list = list.filter((s) => s.marketId === filterOrMarketId);
    } else if (typeof filterOrMarketId === 'object' && filterOrMarketId !== null) {
      if (filterOrMarketId.marketId) {
        list = list.filter((s) => s.marketId === filterOrMarketId.marketId);
      }
    }
    return list;
  }

  public getAllShopsForAdmin(filters?: { marketId?: string; status?: string }): Shop[] {
    let list = Array.from(this.shops.values());
    if (filters?.marketId) {
      list = list.filter((s) => s.marketId === filters.marketId);
    }
    return list.sort((a, b) => a.name.localeCompare(b.name));
  }

  public getShopById(id: string): Shop | undefined {
    return this.shops.get(id);
  }

  public getShopBySellerId(sellerId: string): Shop | undefined {
    return Array.from(this.shops.values()).find((s) => s.sellerId === sellerId);
  }

  public getShopsBySeller(sellerId: string): Shop[] {
    return Array.from(this.shops.values()).filter((s) => s.sellerId === sellerId);
  }

  public saveShop(shop: Shop): Shop {
    this.shops.set(shop.id, { ...shop, updatedAt: new Date().toISOString() });
    this.flushToDisk();
    return this.shops.get(shop.id)!;
  }

  public updateShop(id: string, updates: Partial<Shop>): Shop {
    const existing = this.shops.get(id);
    if (!existing) throw new Error(`Shop ${id} not found`);
    const merged: Shop = {
      ...existing,
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    if (updates.profilePhotoUrl !== undefined) {
      merged.profilePhotoUrl = updates.profilePhotoUrl;
      merged.photoUrl = updates.profilePhotoUrl;
      merged.logoImageUrl = updates.profilePhotoUrl;
    } else if (updates.photoUrl !== undefined) {
      merged.photoUrl = updates.photoUrl;
      merged.profilePhotoUrl = updates.photoUrl;
      merged.logoImageUrl = updates.photoUrl;
    }
    if (updates.coverPhotoUrl !== undefined) {
      merged.coverPhotoUrl = updates.coverPhotoUrl;
      merged.bannerUrl = updates.coverPhotoUrl;
      merged.bannerImageUrl = updates.coverPhotoUrl;
    } else if (updates.bannerUrl !== undefined) {
      merged.bannerUrl = updates.bannerUrl;
      merged.coverPhotoUrl = updates.bannerUrl;
      merged.bannerImageUrl = updates.bannerUrl;
    }
    if ((updates as any).coverPhotos !== undefined) {
      (merged as any).coverPhotos = (updates as any).coverPhotos;
    }
    return this.saveShop(merged);
  }

  // --- Shop Verification & Change Requests ---
  public getShopChangeRequests(shopId?: string): ShopChangeRequest[] {
    const list = Array.from(this.shopChangeRequests.values());
    if (shopId) {
      return list.filter((cr) => cr.shopId === shopId);
    }
    return list.sort((a, b) => new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime());
  }

  public getShopChangeRequestById(id: string): ShopChangeRequest | undefined {
    return this.shopChangeRequests.get(id);
  }

  public saveShopChangeRequest(cr: ShopChangeRequest): ShopChangeRequest {
    this.shopChangeRequests.set(cr.id, cr);
    this.flushToDisk();
    return cr;
  }

  public verifyShop(shopId: string, adminId: string, adminName: string): Shop {
    const shop = this.getShopById(shopId);
    if (!shop) throw new Error(`Shop ${shopId} not found`);

    shop.verificationStatus = 'VERIFIED';
    shop.isVerifiedByAdmin = true;
    shop.isActive = true;
    shop.verifiedAt = new Date().toISOString();
    shop.verifiedBy = adminId;
    shop.verifiedByName = adminName;
    shop.rejectionReason = undefined;

    this.saveShop(shop);
    return shop;
  }

  public rejectShop(shopId: string, adminId: string, rejectionReason: string): Shop {
    const shop = this.getShopById(shopId);
    if (!shop) throw new Error(`Shop ${shopId} not found`);

    shop.verificationStatus = 'REJECTED';
    shop.isVerifiedByAdmin = false;
    shop.isActive = false;
    shop.rejectionReason = rejectionReason;

    this.saveShop(shop);
    return shop;
  }

  public submitShopChangeRequest(
    shopId: string,
    sellerId: string,
    requestedChanges: any,
    reason: string
  ): { shop: Shop; changeRequest: ShopChangeRequest } {
    const shop = this.getShopById(shopId);
    if (!shop) throw new Error(`Shop ${shopId} not found`);

    const seller = this.getUserById(sellerId);
    const crId = `cr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    const currentSnapshot = {
      name: shop.name,
      category: shop.category,
      description: shop.description,
      phone: shop.phone,
      email: shop.email,
      whatsapp: shop.whatsapp,
      address: shop.address,
      pincode: shop.pincode,
      postalData: shop.postalData,
      coordinates: shop.coordinates,
      locationAccuracy: shop.locationAccuracy,
      locationSource: shop.locationSource,
      photoUrl: shop.photoUrl,
      profilePhotoUrl: shop.profilePhotoUrl,
      coverPhotoUrl: shop.coverPhotoUrl,
      upiPayoutId: shop.upiPayoutId,
      paymentName: shop.paymentName,
    };

    const changeRequest: ShopChangeRequest = {
      id: crId,
      shopId: shop.id,
      sellerId: sellerId,
      sellerName: seller?.fullName || 'Seller',
      shopName: shop.name,
      requestedAt: new Date().toISOString(),
      status: 'PENDING',
      reason,
      requestedChanges,
      currentSnapshot,
    };

    this.shopChangeRequests.set(crId, changeRequest);

    // Update shop state to CHANGE_REQUEST_PENDING, but keep existing verified details intact in the shop and marketplace!
    shop.verificationStatus = 'CHANGE_REQUEST_PENDING';
    shop.activeChangeRequest = changeRequest;

    this.saveShop(shop);
    this.flushToDisk();

    return { shop, changeRequest };
  }

  public reviewShopChangeRequest(
    requestId: string,
    adminId: string,
    action: 'APPROVE' | 'REJECT',
    adminNotes?: string,
    rejectionReason?: string
  ): { shop: Shop; changeRequest: ShopChangeRequest } {
    const cr = this.shopChangeRequests.get(requestId);
    if (!cr) throw new Error(`Change request ${requestId} not found`);

    const shop = this.getShopById(cr.shopId);
    if (!shop) throw new Error(`Shop ${cr.shopId} not found`);

    cr.reviewedAt = new Date().toISOString();
    cr.reviewedBy = adminId;
    cr.adminNotes = adminNotes;

    if (action === 'APPROVE') {
      cr.status = 'APPROVED';
      const req = cr.requestedChanges;

      if (req.name) shop.name = req.name;
      if (req.category) shop.category = req.category;
      if (req.description !== undefined) shop.description = req.description;
      if (req.phone) shop.phone = req.phone;
      if (req.email !== undefined) shop.email = req.email;
      if (req.whatsapp !== undefined) shop.whatsapp = req.whatsapp;
      if (req.address) shop.address = req.address;
      if (req.pincode) shop.pincode = req.pincode;
      if (req.postalData) shop.postalData = req.postalData;
      if (req.coordinates) {
        shop.coordinates = req.coordinates;
        shop.locationUpdatedAt = new Date().toISOString();
      }
      if (req.locationAccuracy !== undefined) shop.locationAccuracy = req.locationAccuracy;
      if (req.locationSource) shop.locationSource = req.locationSource;
      if (req.profilePhotoUrl !== undefined || req.photoUrl !== undefined) {
        const photo = req.profilePhotoUrl || req.photoUrl;
        shop.profilePhotoUrl = photo;
        shop.photoUrl = photo;
        shop.logoImageUrl = photo;
      }
      if (req.coverPhotoUrl !== undefined || req.bannerUrl !== undefined) {
        const cover = req.coverPhotoUrl || req.bannerUrl;
        shop.coverPhotoUrl = cover;
        shop.bannerUrl = cover;
        shop.bannerImageUrl = cover;
      }
      if (req.upiPayoutId !== undefined) shop.upiPayoutId = req.upiPayoutId;
      if (req.paymentName !== undefined) shop.paymentName = req.paymentName;

      shop.verificationStatus = 'VERIFIED';
      shop.activeChangeRequest = undefined;
    } else {
      cr.status = 'REJECTED';
      cr.rejectionReason = rejectionReason;

      shop.verificationStatus = 'VERIFIED';
      shop.activeChangeRequest = undefined;
    }

    this.shopChangeRequests.set(cr.id, cr);
    this.saveShop(shop);
    this.flushToDisk();

    return { shop, changeRequest: cr };
  }

  // --- Seller Self-Registration & Onboarding Flow ---
  public registerSellerAndShop(params: {
    sellerName: string;
    phone: string;
    email?: string;
    shopName: string;
    category: string;
    description?: string;
    address: string;
    pincode?: string;
    postalData?: any;
    coordinates: { lat: number; lng: number };
    locationAccuracy?: number;
    locationSource?: LocationSource;
    upiPayoutId?: string;
    paymentName?: string;
    whatsapp?: string;
    photoUrl?: string;
    coverPhotoUrl?: string;
    marketId?: string;
  }): { seller: User; shop: Shop } {
    const existingUser = this.getUserByPhone(params.phone);
    let sellerId = existingUser?.id;
    let seller = existingUser;

    if (!seller) {
      sellerId = `user-seller-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      seller = {
        id: sellerId,
        fullName: params.sellerName,
        phone: params.phone,
        email: params.email || `${params.phone}@seller.localmart.in`,
        role: UserRole.SELLER,
        addresses: [],
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      this.users.set(seller.id, seller);
    }

    const shopId = `shop-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    seller.shopId = shopId;
    this.saveUser(seller);

    // Fallback market ID if not supplied
    const defaultMarketId = params.marketId || Array.from(this.markets.keys())[0] || 'mkt_dadar_central';

    const photo = params.photoUrl || 'https://images.unsplash.com/photo-1578916171728-46686eac8d58?w=800&auto=format&fit=crop&q=80';
    const cover = params.coverPhotoUrl || 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=1200&auto=format&fit=crop&q=80';

    const newShop: Shop = {
      id: shopId,
      sellerId: seller.id,
      marketId: defaultMarketId,
      name: params.shopName,
      description: params.description || `${params.shopName} - Quality ${params.category} store`,
      category: params.category,
      tagline: 'Your Trusted Neighborhood Shop',
      phone: params.phone,
      email: params.email,
      whatsapp: params.whatsapp,
      address: params.address,
      pincode: params.pincode,
      postalData: params.postalData,
      coordinates: params.coordinates,
      locationAccuracy: params.locationAccuracy,
      locationSource: params.locationSource || 'gps',
      locationUpdatedAt: new Date().toISOString(),
      photoUrl: photo,
      profilePhotoUrl: photo,
      logoImageUrl: photo,
      coverPhotoUrl: cover,
      bannerUrl: cover,
      bannerImageUrl: cover,
      upiPayoutId: params.upiPayoutId,
      paymentName: params.paymentName,
      verificationStatus: 'PENDING_VERIFICATION',
      isVerifiedByAdmin: false,
      isActive: false, // Inactive until admin verifies
      operatingHours: {
        openTime: '08:00',
        closeTime: '21:00',
        closedOnDays: [],
        openDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
      },
      fulfillment: {
        pickupEnabled: true,
        deliveryEnabled: true,
        minOrderValueForDelivery: 99,
        deliveryFee: 25,
        freeDeliveryThreshold: 499,
        maxDeliveryRadiusKm: 6.0,
        estimatedPreparationTimeMinutes: 20,
      },
      financials: {
        billingMode: 'COMMISSION' as any,
        customCommissionPercentage: 5.0,
        payoutUpiId: params.upiPayoutId,
      },
      isOpen: true,
      isOpenNow: true,
      isAcceptingOrders: true,
      averageRating: 5.0,
      totalReviewsCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.shops.set(shopId, newShop);
    this.flushToDisk();

    return { seller, shop: newShop };
  }

  // --- Products (Strict Shop Isolation) ---
  public getAllProducts(): Product[] {
    return Array.from(this.products.values());
  }

  public getProductsByShopId(shopId: string): Product[] {
    return Array.from(this.products.values()).filter((p) => p.shopId === shopId);
  }

  public getProductsByShop(shopId: string): Product[] {
    return this.getProductsByShopId(shopId);
  }

  public updateProduct(productId: string, updates: Partial<Product>): Product {
    const existing = this.getProductById(productId);
    if (!existing) throw new Error(`Product ${productId} not found`);
    const updated: Product = {
      ...existing,
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    return this.saveProduct(updated);
  }

  public updateStock(productId: string, newStock: number): Product {
    const existing = this.getProductById(productId);
    if (!existing) throw new Error(`Product ${productId} not found`);
    existing.currentStockInBaseUnits = newStock;
    if (existing.inventory) {
      existing.inventory.currentStockInBaseUnits = newStock;
    }
    existing.isAvailable = newStock > 0;
    return this.saveProduct(existing);
  }

  public searchProducts(query: string, marketId?: string): { product: Product; shop: Shop }[] {
    const q = (query || '').toLowerCase().trim();
    if (!q) return [];
    const results: { product: Product; shop: Shop }[] = [];

    for (const product of this.products.values()) {
      if (!product || !product.isAvailable) continue;
      const shop = this.shops.get(product.shopId);
      if (!shop || !shop.isActive) continue;
      if (marketId && shop.marketId !== marketId) continue;

      const matchesProduct =
        (product.name || '').toLowerCase().includes(q) ||
        (product.nameHindi ? product.nameHindi.toLowerCase().includes(q) : false) ||
        (product.category || '').toLowerCase().includes(q) ||
        (product.tags && product.tags.some((t) => (t || '').toLowerCase().includes(q)));

      const matchesShop = (shop.name || '').toLowerCase().includes(q) || (shop.category || '').toLowerCase().includes(q);

      if (matchesProduct || matchesShop) {
        results.push({ product, shop });
      }
    }

    return results;
  }

  public getProductById(id: string): Product | undefined {
    return this.products.get(id);
  }

  public saveProduct(product: Product): Product {
    this.products.set(product.id, { ...product, updatedAt: new Date().toISOString() });
    this.flushToDisk();
    return this.products.get(product.id)!;
  }

  public deleteProduct(id: string): boolean {
    const res = this.products.delete(id);
    this.flushToDisk();
    return res;
  }

  /**
   * Duplicate Product Detection within a Shop (Phase 14)
   * Matches exact, case-insensitive, Hindi names, and common variants (e.g. "shampoo", "Shampoo 100ml").
   */
  public findDuplicateProducts(shopId: string, name: string): Product[] {
    if (!name || !name.trim()) return [];
    const cleanName = name.toLowerCase().trim().replace(/[\s\-_]+/g, ' ');
    const baseTokens = cleanName.split(' ').filter((t) => t.length > 2 && !['100ml', '200ml', '500g', '1kg', '2kg', '1l', 'pcs', 'piece'].includes(t));
    const shopProducts = this.getProductsByShopId(shopId);

    return shopProducts.filter((p) => {
      const pClean = (p.name || '').toLowerCase().trim().replace(/[\s\-_]+/g, ' ');
      if (pClean === cleanName) return true;
      if (pClean.includes(cleanName) || cleanName.includes(pClean)) return true;
      if (p.nameHindi && (p.nameHindi.includes(name) || name.includes(p.nameHindi))) return true;

      // Check key token overlap
      if (baseTokens.length > 0) {
        const matchesAllTokens = baseTokens.every((token) => pClean.includes(token));
        if (matchesAllTokens) return true;
      }
      return false;
    });
  }

  /**
   * Fast Bulk Product Text Parser (Phase 14)
   * Supports:
   * 1. Space / Slash format: "Sugar 70/kg 100kg", "Rice 60/kg 80kg", "Kaju 900/kg 20kg", "Oil 130/litre 50 litre", "Shampoo 10/piece 100 pieces"
   * 2. CSV format: "Sugar, 70, kg, 100, Grocery & Kirana"
   * 3. Freeform text with rate and stock.
   */
  public parseBulkProductsText(
    rawText: string,
    defaultCategory: string = 'Grocery & Kirana'
  ): Array<{
    name: string;
    nameHindi?: string;
    category: string;
    unit: string;
    baseUnit?: string;
    price: number;
    basePricePerUnit?: number;
    stock: number;
    currentStockInBaseUnits?: number;
  }> {
    if (!rawText || !rawText.trim()) return [];
    const lines = rawText.split(/\r?\n/).map((l) => l.trim()).filter((l) => l.length > 0);
    const parsed: Array<{
      name: string;
      nameHindi?: string;
      category: string;
      unit: string;
      baseUnit?: string;
      price: number;
      basePricePerUnit?: number;
      stock: number;
      currentStockInBaseUnits?: number;
    }> = [];

    for (const line of lines) {
      // 1. Check CSV format
      if (line.includes(',')) {
        const parts = line.split(',').map((p) => p.trim());
        if (parts.length >= 2 && parts[0] && !isNaN(Number(parts[1]))) {
          const unit = parts[2] || 'kg';
          const stock = parts[3] ? Number(parts[3]) : 50;
          const category = parts[4] || defaultCategory;
          parsed.push({
            name: parts[0],
            price: Number(parts[1]),
            basePricePerUnit: Number(parts[1]),
            unit,
            baseUnit: unit,
            stock,
            currentStockInBaseUnits: stock,
            category,
          });
          continue;
        }
      }

      // 2. Natural Slash/Space format: "Sugar 70/kg 100kg", "Shampoo 10/piece 100 pieces", "Oil 130/litre 50 litre"
      // Regex matches: <ProductName> <Price>/<Unit> <Stock>[Unit]
      const slashMatch = line.match(/^(.+?)\s+(\d+(?:\.\d+)?)\s*\/\s*([a-zA-Z\u0900-\u097F]+)(?:\s+(\d+(?:\.\d+)?)\s*([a-zA-Z\u0900-\u097F]*))?/i);
      if (slashMatch) {
        const name = slashMatch[1].trim();
        const price = parseFloat(slashMatch[2]);
        let unit = slashMatch[3].trim().toLowerCase();
        let stock = slashMatch[4] ? parseFloat(slashMatch[4]) : 50;

        if (unit === 'kilo' || unit === 'kilogram' || unit === 'किग्रा' || unit === 'किलो') unit = 'kg';
        else if (unit === 'gram' || unit === 'g' || unit === 'grams' || unit === 'ग्राम') unit = 'g';
        else if (unit === 'liter' || unit === 'litre' || unit === 'l' || unit === 'ltr' || unit === 'लीटर') unit = 'litre';
        else if (unit === 'milli' || unit === 'ml' || unit === 'मिली') unit = 'ml';
        else if (unit === 'pcs' || unit === 'pc' || unit === 'piece' || unit === 'pieces' || unit === 'पीस' || unit === 'नग') unit = 'piece';
        else if (unit === 'packet' || unit === 'pack' || unit === 'packets' || unit === 'पैकेट') unit = 'packet';
        else if (unit === 'box' || unit === 'boxes' || unit === 'डिब्बा') unit = 'box';
        else if (unit === 'dozen' || unit === 'darjan' || unit === 'दर्जन') unit = 'dozen';
        else if (unit === 'bottle' || unit === 'bottles' || unit === 'बोतल') unit = 'bottle';
        else if (unit === 'pouch' || unit === 'pouches' || unit === 'पाउच') unit = 'pouch';
        else if (unit === 'bundle' || unit === 'bundles' || unit === 'बंडल') unit = 'bundle';
        else if (unit === 'pair' || unit === 'pairs' || unit === 'जोड़ी') unit = 'pair';

        parsed.push({
          name,
          price,
          basePricePerUnit: price,
          unit,
          baseUnit: unit,
          stock,
          currentStockInBaseUnits: stock,
          category: defaultCategory,
        });
        continue;
      }

      // 3. Fallback space-separated: e.g. "Rice 60 kg 80" or "Sugar 70 100"
      const tokens = line.split(/\s+/);
      if (tokens.length >= 2) {
        const numIndices = tokens.map((t, idx) => (!isNaN(Number(t)) ? idx : -1)).filter((idx) => idx !== -1);
        if (numIndices.length >= 1) {
          const priceIdx = numIndices[0];
          const name = tokens.slice(0, priceIdx).join(' ').trim();
          const price = Number(tokens[priceIdx]);
          let unit = 'kg';
          let stock = 50;

          if (tokens.length > priceIdx + 1) {
            const nextToken = tokens[priceIdx + 1].toLowerCase();
            if (['kg', 'g', 'gram', 'l', 'litre', 'ml', 'piece', 'packet', 'box', 'dozen', 'bottle', 'pouch', 'bundle', 'pair'].includes(nextToken)) {
              unit = nextToken;
              if (tokens.length > priceIdx + 2 && !isNaN(Number(tokens[priceIdx + 2]))) {
                stock = Number(tokens[priceIdx + 2]);
              }
            } else if (!isNaN(Number(nextToken))) {
              stock = Number(nextToken);
            }
          }

          if (name && !isNaN(price)) {
            parsed.push({
              name,
              price,
              basePricePerUnit: price,
              unit,
              baseUnit: unit,
              stock,
              currentStockInBaseUnits: stock,
              category: defaultCategory,
            });
          }
        }
      }
    }

    return parsed;
  }

  /**
   * Transactional atomic stock deduction in Base Units
   * Ensures money and weight precision with concurrency safety.
   */
  public deductInventoryForOrder(order: Order): { success: boolean; errors?: string[] } {
    const errors: string[] = [];

    // 1. Dry run verification across all items
    for (const item of order.items) {
      const product = this.products.get(item.productId);
      if (!product) {
        errors.push(`Product '${item.productName}' (${item.productId}) no longer exists.`);
        continue;
      }
      if (!product.isAvailable) {
        errors.push(`Product '${item.productName}' is currently marked unavailable.`);
        continue;
      }
      const neededStock = item.quantityInBaseUnits;
      if (product.currentStockInBaseUnits < neededStock) {
        errors.push(
          `Insufficient stock for '${item.productName}'. Available: ${product.currentStockInBaseUnits} ${product.fractionalConfig.baseUnit}, Requested: ${neededStock} ${product.fractionalConfig.baseUnit}`
        );
      }
    }

    if (errors.length > 0) {
      return { success: false, errors };
    }

    // 2. Commit deduction atomically
    const deductionsAudit: any[] = [];
    for (const item of order.items) {
      const product = this.products.get(item.productId)!;
      const oldStock = product.currentStockInBaseUnits;
      // High-precision subtraction to 4 decimal places
      product.currentStockInBaseUnits = Math.round((product.currentStockInBaseUnits - item.quantityInBaseUnits) * 10000) / 10000;
      product.updatedAt = new Date().toISOString();
      this.products.set(product.id, product);

      deductionsAudit.push({
        productId: product.id,
        name: product.name,
        deductedBaseUnits: item.quantityInBaseUnits,
        previousStock: oldStock,
        newStock: product.currentStockInBaseUnits,
        baseUnit: product.fractionalConfig.baseUnit,
      });
    }

    this.recordAuditLog({
      eventType: AuditEventType.INVENTORY_DEDUCTED,
      orderId: order.id,
      shopId: order.shopId,
      performedByUserId: 'SYSTEM_PAYMENT_WEBHOOK',
      details: { deductions: deductionsAudit },
    });

    this.flushToDisk();
    return { success: true };
  }

  // --- Orders ---
  public getOrders(filters?: {
    shopId?: string;
    sellerId?: string;
    customerId?: string;
    status?: OrderStatus;
  }): Order[] {
    let list = Array.from(this.orders.values()).map((o) => this.enrichOrder(o));
    if (filters?.shopId) {
      list = list.filter((o) => o.shopId === filters.shopId);
    }
    if (filters?.sellerId) {
      list = list.filter((o) => o.sellerId === filters.sellerId);
    }
    if (filters?.customerId) {
      list = list.filter((o) => o.customerId === filters.customerId);
    }
    if (filters?.status) {
      list = list.filter((o) => o.status === filters.status);
    }
    return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  public getOrderById(id: string): Order | undefined {
    const o = this.orders.get(id);
    return o ? this.enrichOrder(o) : undefined;
  }

  public saveOrder(order: Order): Order {
    const enriched = this.enrichOrder(order);
    this.orders.set(enriched.id, { ...enriched, updatedAt: new Date().toISOString() });
    this.flushToDisk();
    return this.orders.get(enriched.id)!;
  }

  // --- Shopping Requests (Voice Orders / Unpriced Lists) ---
  public getShoppingRequests(filters?: {
    shopId?: string;
    sellerId?: string;
    customerId?: string;
    status?: ShoppingRequestStatus;
  }): ShoppingRequest[] {
    let list = Array.from(this.shoppingRequests.values());
    if (filters?.shopId) {
      list = list.filter((r) => r.shopId === filters.shopId);
    }
    if (filters?.sellerId) {
      list = list.filter((r) => r.sellerId === filters.sellerId);
    }
    if (filters?.customerId) {
      list = list.filter((r) => r.customerId === filters.customerId);
    }
    if (filters?.status) {
      list = list.filter((r) => r.status === filters.status);
    }
    return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  public getShoppingRequestById(id: string): ShoppingRequest | undefined {
    return this.shoppingRequests.get(id);
  }

  public saveShoppingRequest(request: ShoppingRequest): ShoppingRequest {
    this.shoppingRequests.set(request.id, { ...request, updatedAt: new Date().toISOString() });
    this.flushToDisk();
    return this.shoppingRequests.get(request.id)!;
  }

  public deleteShoppingRequest(id: string): boolean {
    const res = this.shoppingRequests.delete(id);
    if (res) this.flushToDisk();
    return res;
  }

  // --- Payments ---
  public getPayments(): PaymentRecord[] {
    return Array.from(this.payments.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  public savePayment(payment: PaymentRecord): PaymentRecord {
    this.payments.set(payment.id, { ...payment, updatedAt: new Date().toISOString() });
    this.flushToDisk();
    return this.payments.get(payment.id)!;
  }

  public getPaymentById(id: string): PaymentRecord | undefined {
    return this.payments.get(id);
  }

  public getPaymentByOrderId(orderId: string): PaymentRecord | undefined {
    return Array.from(this.payments.values()).find((p) => p.orderId === orderId);
  }

  // --- Commission Config ---
  public getCommissionConfig(): CommissionConfig {
    return { ...this.commissionConfig };
  }

  public updateCommissionConfig(config: Partial<CommissionConfig>): CommissionConfig {
    this.commissionConfig = { ...this.commissionConfig, ...config };
    this.flushToDisk();
    return { ...this.commissionConfig };
  }

  // --- System Settings ---
  public getSystemSettings(): SystemSettings {
    return { ...this.systemSettings };
  }

  public updateSystemSettings(settings: Partial<SystemSettings>): SystemSettings {
    this.systemSettings = { ...this.systemSettings, ...settings };
    this.flushToDisk();
    return { ...this.systemSettings };
  }

  // --- Settlements ---
  public getSettlements(shopId?: string): SellerSettlement[] {
    let list = Array.from(this.settlements.values());
    if (shopId) {
      list = list.filter((s) => s.shopId === shopId);
    }
    return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  public getSettlementById(id: string): SellerSettlement | undefined {
    return this.settlements.get(id);
  }

  public saveSettlement(settlement: SellerSettlement): SellerSettlement {
    this.settlements.set(settlement.id, settlement);
    this.flushToDisk();
    return settlement;
  }

  // --- Support Tickets ---
  public getSupportTickets(filters?: { status?: string; type?: string }): SupportTicket[] {
    let list = Array.from(this.supportTickets.values());
    if (filters?.status && filters.status !== 'ALL') {
      list = list.filter((t) => t.status === filters.status);
    }
    if (filters?.type && filters.type !== 'ALL') {
      list = list.filter((t) => t.ticketType === filters.type);
    }
    return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  public getSupportTicketById(id: string): SupportTicket | undefined {
    return this.supportTickets.get(id);
  }

  public saveSupportTicket(ticket: SupportTicket): SupportTicket {
    this.supportTickets.set(ticket.id, { ...ticket, updatedAt: new Date().toISOString() });
    this.flushToDisk();
    return this.supportTickets.get(ticket.id)!;
  }

  // --- Notifications ---
  public getNotifications(recipientUserId: string, shopId?: string): AppNotification[] {
    return Array.from(this.notifications.values())
      .filter((n) => n.recipientUserId === recipientUserId || (shopId && n.shopId === shopId))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  public addNotification(notification: AppNotification): AppNotification {
    this.notifications.set(notification.id, notification);
    this.flushToDisk();
    return notification;
  }

  public markNotificationAsRead(id: string): boolean {
    const notif = this.notifications.get(id);
    if (notif) {
      notif.isRead = true;
      this.notifications.set(id, notif);
      this.flushToDisk();
      return true;
    }
    return false;
  }

  public markAllNotificationsAsRead(recipientUserId: string): void {
    this.notifications.forEach((n) => {
      if (n.recipientUserId === recipientUserId) {
        n.isRead = true;
      }
    });
    this.flushToDisk();
  }

  // --- Audit Logs ---
  public recordAuditLog(log: Omit<AuditTransactionRecord, 'id' | 'timestamp'>): AuditTransactionRecord {
    const entry: AuditTransactionRecord = {
      id: `aud_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      timestamp: new Date().toISOString(),
      ...log,
    };
    this.auditLogs.unshift(entry);
    Logger.audit(entry.eventType, entry);
    this.flushToDisk();
    return entry;
  }

  public getAuditLogs(limit: number = 100): AuditTransactionRecord[] {
    return this.auditLogs.slice(0, limit);
  }

  // --- Subscription Plans ---
  public getSubscriptionPlans(onlyActive?: boolean): SubscriptionPlan[] {
    let plans = Array.from(this.subscriptionPlans.values());
    if (onlyActive) {
      plans = plans.filter((p) => p.isActive);
    }
    return plans.sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
  }

  public getSubscriptionPlanById(planId: string): SubscriptionPlan | undefined {
    return this.subscriptionPlans.get(planId);
  }

  public createSubscriptionPlan(plan: SubscriptionPlan): SubscriptionPlan {
    this.subscriptionPlans.set(plan.id, plan);
    this.flushToDisk();
    return plan;
  }

  public updateSubscriptionPlan(planId: string, updates: Partial<SubscriptionPlan>): SubscriptionPlan | null {
    const existing = this.subscriptionPlans.get(planId);
    if (!existing) return null;
    const updated: SubscriptionPlan = {
      ...existing,
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    if (updates.maxProducts === null || (updates as any).maxProducts === '' || (updates as any).unlimitedProducts) {
      delete updated.maxProducts;
    }
    this.subscriptionPlans.set(planId, updated);
    this.flushToDisk();
    return updated;
  }

  public deleteSubscriptionPlan(planId: string): boolean {
    const res = this.subscriptionPlans.delete(planId);
    if (res) this.flushToDisk();
    return res;
  }

  // --- Seller Subscriptions ---
  public getSellerSubscriptions(filters?: {
    sellerId?: string;
    shopId?: string;
    status?: SubscriptionStatus;
  }): SellerSubscription[] {
    let list = Array.from(this.sellerSubscriptions.values());
    if (filters?.sellerId) {
      list = list.filter((s) => s.sellerId === filters.sellerId);
    }
    if (filters?.shopId) {
      list = list.filter((s) => s.shopId === filters.shopId);
    }
    if (filters?.status) {
      list = list.filter((s) => s.status === filters.status);
    }
    return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  public getSellerSubscriptionById(id: string): SellerSubscription | undefined {
    return this.sellerSubscriptions.get(id);
  }

  public getActiveSubscriptionForShop(shopId: string): SellerSubscription | undefined {
    return Array.from(this.sellerSubscriptions.values()).find(
      (s) => s.shopId === shopId && (s.status === SubscriptionStatus.ACTIVE || s.status === SubscriptionStatus.TRIAL)
    );
  }

  public createSellerSubscription(subscription: SellerSubscription): SellerSubscription {
    this.sellerSubscriptions.set(subscription.id, subscription);
    this.flushToDisk();
    return subscription;
  }

  public updateSellerSubscription(id: string, updates: Partial<SellerSubscription>): SellerSubscription | null {
    const existing = this.sellerSubscriptions.get(id);
    if (!existing) return null;
    const updated: SellerSubscription = {
      ...existing,
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    this.sellerSubscriptions.set(id, updated);
    this.flushToDisk();
    return updated;
  }

  // --- Subscription Invoices ---
  public getSubscriptionInvoices(filters?: {
    sellerId?: string;
    shopId?: string;
    subscriptionId?: string;
    status?: SubscriptionPaymentStatus;
  }): SubscriptionInvoice[] {
    let list = Array.from(this.subscriptionInvoices.values());
    if (filters?.sellerId) {
      list = list.filter((i) => i.sellerId === filters.sellerId);
    }
    if (filters?.shopId) {
      list = list.filter((i) => i.shopId === filters.shopId);
    }
    if (filters?.subscriptionId) {
      list = list.filter((i) => i.subscriptionId === filters.subscriptionId);
    }
    if (filters?.status) {
      list = list.filter((i) => i.status === filters.status);
    }
    return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  public getSubscriptionInvoiceById(id: string): SubscriptionInvoice | undefined {
    return this.subscriptionInvoices.get(id);
  }

  public createSubscriptionInvoice(invoice: SubscriptionInvoice): SubscriptionInvoice {
    this.subscriptionInvoices.set(invoice.id, invoice);
    this.flushToDisk();
    return invoice;
  }

  public updateSubscriptionInvoice(id: string, updates: Partial<SubscriptionInvoice>): SubscriptionInvoice | null {
    const existing = this.subscriptionInvoices.get(id);
    if (!existing) return null;
    const updated: SubscriptionInvoice = {
      ...existing,
      ...updates,
    };
    this.subscriptionInvoices.set(id, updated);
    this.flushToDisk();
    return updated;
  }

  // --- Billing Transactions ---
  public getBillingTransactions(filters?: { sellerId?: string; shopId?: string }): BillingTransaction[] {
    let list = [...this.billingTransactions];
    if (filters?.sellerId) {
      list = list.filter((t) => t.sellerId === filters.sellerId);
    }
    if (filters?.shopId) {
      list = list.filter((t) => t.shopId === filters.shopId);
    }
    return list.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  public createBillingTransaction(tx: BillingTransaction): BillingTransaction {
    this.billingTransactions.unshift(tx);
    this.flushToDisk();
    return tx;
  }

  // --- AI Voice Assistant & Governance Audits ---
  public saveAIDraft(draft: AIVoiceDraft): AIVoiceDraft {
    this.aiDrafts.set(draft.id, draft);
    this.flushToDisk();
    return draft;
  }

  public getAIDraft(id: string): AIVoiceDraft | undefined {
    return this.aiDrafts.get(id);
  }

  public deleteAIDraft(id: string): boolean {
    const deleted = this.aiDrafts.delete(id);
    if (deleted) this.flushToDisk();
    return deleted;
  }

  public recordAIAudit(audit: AIAuditRecord): AIAuditRecord {
    this.aiAudits.unshift(audit);
    // Keep max 500 records
    if (this.aiAudits.length > 500) {
      this.aiAudits.pop();
    }
    this.flushToDisk();
    return audit;
  }

  public getAIAudits(filters?: { sellerId?: string; shopId?: string; action?: string }): AIAuditRecord[] {
    let list = [...this.aiAudits];
    if (filters?.sellerId) {
      list = list.filter((a) => a.sellerId === filters.sellerId);
    }
    if (filters?.shopId) {
      list = list.filter((a) => a.shopId === filters.shopId);
    }
    if (filters?.action) {
      list = list.filter((a) => a.action === filters.action);
    }
    return list;
  }

  public getShopsByMarket(marketId: string): Shop[] {
    return this.getShops({ marketId });
  }

  public getProductsByMarket(marketId: string): Product[] {
    const marketShops = this.getShops({ marketId }).map((s) => s.id);
    return Array.from(this.products.values()).filter((p) => marketShops.includes(p.shopId));
  }

  public onboardShopAndSeller(params: any): { seller: User; shop: Shop } {
    return this.onboardSellerAndShop(params);
  }

  // --- Admin Quick Onboarding (Seller + Shop Atomic Creation) ---
  public onboardSellerAndShop(params: {
    sellerName: string;
    sellerPhone: string;
    sellerEmail?: string;
    sellerStatus?: 'ACTIVE' | 'PENDING' | 'SUSPENDED';
    shopName: string;
    category: string;
    shopNumber?: string;
    address: string;
    landmark?: string;
    marketId: string;
    coordinates?: { latitude: number; longitude: number };
    phone: string;
    photoUrl?: string;
    logoImageUrl?: string;
    bannerImageUrl?: string;
    openTime?: string;
    closeTime?: string;
    closedOnDays?: number[];
    openDays?: string[];
    pickupEnabled?: boolean;
    deliveryEnabled?: boolean;
    minOrderValueForDelivery?: number;
    deliveryFee?: number;
    freeDeliveryThreshold?: number;
    maxDeliveryRadiusKm?: number;
    estimatedPreparationTimeMinutes?: number;
    billingMode?: any;
    subscriptionPlanId?: string;
    customCommissionPercentage?: number;
    payoutUpiId?: string;
    gstin?: string;
    managementMode?: 'ADMIN_MANAGED' | 'SELLER_MANAGED' | 'HYBRID';
    adminId: string;
    initialProducts?: any[];
  }): { seller: User; shop: Shop; invitation?: SellerInvitation } {
    const sellerId = `user-seller-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const shopId = `shop-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    const newSeller: User = {
      id: sellerId,
      fullName: params.sellerName,
      email: params.sellerEmail || `${params.sellerPhone}@seller.localmart.in`,
      phone: params.sellerPhone,
      role: UserRole.SELLER,
      shopId: shopId,
      addresses: [],
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Calculate market coords fallback
    const targetMarket = this.markets.get(params.marketId);
    let coords: { lat: number; lng: number } = { lat: 28.6139, lng: 77.2090 };
    if (params.coordinates) {
      coords = {
        lat: (params.coordinates as any).lat ?? (params.coordinates as any).latitude ?? 28.6139,
        lng: (params.coordinates as any).lng ?? (params.coordinates as any).longitude ?? 77.2090,
      };
    } else if (targetMarket && targetMarket.coordinates) {
      coords = {
        lat: targetMarket.coordinates.lat,
        lng: targetMarket.coordinates.lng,
      };
    }

    const newShop: Shop = {
      id: shopId,
      sellerId: sellerId,
      marketId: params.marketId,
      name: params.shopName,
      description: `${params.shopName} - Quality ${params.category} store`,
      category: params.category,
      tagline: 'Your Trusted Local Neighborhood Shop',
      shopNumber: params.shopNumber,
      landmark: params.landmark,
      gstin: params.gstin,
      upiPayoutId: params.payoutUpiId,
      managementMode: params.managementMode || 'SELLER_MANAGED',
      onboardedByAdminId: params.adminId,
      phone: params.phone || params.sellerPhone,
      email: params.sellerEmail,
      photoUrl: params.photoUrl,
      logoImageUrl: params.logoImageUrl,
      bannerImageUrl: params.bannerImageUrl,
      address: params.address,
      coordinates: coords,
      operatingHours: {
        openTime: params.openTime || '08:00',
        closeTime: params.closeTime || '21:00',
        closedOnDays: params.closedOnDays || [],
        openDays: params.openDays || ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
      },
      fulfillment: {
        pickupEnabled: params.pickupEnabled ?? true,
        deliveryEnabled: params.deliveryEnabled ?? true,
        minOrderValueForDelivery: params.minOrderValueForDelivery ?? 99,
        deliveryFee: params.deliveryFee ?? 25,
        freeDeliveryThreshold: params.freeDeliveryThreshold ?? 499,
        maxDeliveryRadiusKm: params.maxDeliveryRadiusKm ?? 6.0,
        estimatedPreparationTimeMinutes: params.estimatedPreparationTimeMinutes ?? 20,
      },
      financials: {
        billingMode: params.billingMode || ('COMMISSION' as any),
        subscriptionPlanId: params.subscriptionPlanId,
        customCommissionPercentage: params.customCommissionPercentage,
        payoutUpiId: params.payoutUpiId,
        gstNumber: params.gstin,
        subscriptionStatus: params.subscriptionPlanId ? ('ACTIVE' as any) : undefined,
        subscriptionStartDate: params.subscriptionPlanId ? new Date().toISOString() : undefined,
      },
      isOpen: true,
      isOpenNow: true,
      verificationStatus: 'VERIFIED',
      isVerifiedByAdmin: true,
      isActive: true,
      verifiedAt: new Date().toISOString(),
      verifiedBy: params.adminId,
      verifiedByName: 'Admin',
      locationSource: 'gps',
      locationAccuracy: 10,
      locationUpdatedAt: new Date().toISOString(),
      averageRating: 4.8,
      totalReviewsCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // If subscription plan was chosen, create active subscription record
    if (params.subscriptionPlanId) {
      const plan = this.subscriptionPlans.get(params.subscriptionPlanId);
      if (plan) {
        newShop.financials.subscriptionPlanName = plan.name;
        newShop.financials.subscriptionAmount = plan.price;
        
        const subId = `sub-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
        const startDate = new Date();
        const nextDueDate = new Date();
        if (plan.interval === 'YEARLY') {
          nextDueDate.setFullYear(nextDueDate.getFullYear() + 1);
        } else {
          nextDueDate.setMonth(nextDueDate.getMonth() + 1);
        }

        const sellerSub: SellerSubscription = {
          id: subId,
          sellerId: sellerId,
          shopId: shopId,
          planId: plan.id,
          planName: plan.name,
          amount: plan.price,
          interval: plan.interval,
          status: 'ACTIVE' as any,
          startDate: startDate.toISOString(),
          nextDueDate: nextDueDate.toISOString(),
          nextBillingDate: nextDueDate.toISOString(),
          autoRenew: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        this.sellerSubscriptions.set(subId, sellerSub);
      }
    }

    const invitationToken = `inv_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(); // 30 days
    const invitation: SellerInvitation = {
      id: `invi_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      invitationToken,
      shopId,
      sellerId,
      createdByAdminId: params.adminId,
      sellerName: params.sellerName,
      sellerPhone: params.sellerPhone,
      shopName: params.shopName,
      status: 'PENDING',
      expiresAt,
      invitationUrl: `/seller/invite?token=${invitationToken}`,
      qrCodePayload: JSON.stringify({ token: invitationToken, shopId, phone: params.sellerPhone }),
      createdAt: new Date().toISOString(),
    };
    this.sellerInvitations.set(invitationToken, invitation);

    this.users.set(sellerId, newSeller);
    this.shops.set(shopId, newShop);

    // If initial products are provided (e.g. during field onboarding / bulk import)
    if (Array.isArray(params.initialProducts) && params.initialProducts.length > 0) {
      this.bulkUpsertProducts(shopId, params.initialProducts);
    }

    this.flushToDisk();

    return { seller: newSeller, shop: newShop, invitation } as any;
  }

  public getPlatformConfig() {
    return {
      platformCommissionPercent: this.commissionConfig.defaultPercentage ?? 5,
      deliveryCommissionPercent: this.commissionConfig.deliveryCommissionRate ?? 0,
      minOrderAmount: this.systemSettings.minOrderValueForDelivery ?? 50,
      currency: 'INR',
      fieldTestMode: true,
      maintenanceMode: false,
    };
  }

  // --- Seller Invitation Management ---
  public createSellerInvitation(params: {
    shopId: string;
    sellerId: string;
    adminId: string;
  }): SellerInvitation {
    const shop = this.shops.get(params.shopId);
    const seller = this.users.get(params.sellerId);
    if (!shop || !seller) {
      throw new Error('Shop or Seller not found to create invitation');
    }

    const invitationToken = `inv_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    const invitation: SellerInvitation = {
      id: `invi_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      invitationToken,
      shopId: shop.id,
      sellerId: seller.id,
      createdByAdminId: params.adminId,
      sellerName: seller.fullName,
      sellerPhone: seller.phone,
      shopName: shop.name,
      status: 'PENDING',
      expiresAt,
      invitationUrl: `/seller/invite?token=${invitationToken}`,
      qrCodePayload: JSON.stringify({ token: invitationToken, shopId: shop.id, phone: seller.phone }),
      createdAt: new Date().toISOString(),
    };

    this.sellerInvitations.set(invitationToken, invitation);
    this.flushToDisk();
    return invitation;
  }

  public getSellerInvitationByToken(token: string): SellerInvitation | undefined {
    return this.sellerInvitations.get(token);
  }

  public getSellerInvitations(filters?: { shopId?: string; sellerId?: string }): SellerInvitation[] {
    let list = Array.from(this.sellerInvitations.values());
    if (filters?.shopId) list = list.filter((i) => i.shopId === filters.shopId);
    if (filters?.sellerId) list = list.filter((i) => i.sellerId === filters.sellerId);
    return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  public acceptSellerInvitation(token: string): { seller: User; shop: Shop; invitation: SellerInvitation } {
    const invitation = this.sellerInvitations.get(token);
    if (!invitation) {
      throw new Error('Invalid or non-existent invitation token');
    }
    if (invitation.status === 'ACCEPTED') {
      throw new Error('This invitation has already been accepted');
    }
    if (new Date(invitation.expiresAt).getTime() < Date.now()) {
      invitation.status = 'EXPIRED';
      this.flushToDisk();
      throw new Error('This invitation link has expired');
    }

    invitation.status = 'ACCEPTED';
    invitation.acceptedAt = new Date().toISOString();

    const seller = this.users.get(invitation.sellerId);
    const shop = this.shops.get(invitation.shopId);

    if (seller) {
      seller.isActive = true;
      this.users.set(seller.id, seller);
    }
    if (shop) {
      shop.isActive = true;
      this.shops.set(shop.id, shop);
    }

    this.recordAuditLog({
      eventType: AuditEventType.SELLER_CREATED,
      sellerId: invitation.sellerId,
      shopId: invitation.shopId,
      performedByUserId: invitation.sellerId,
      details: { action: 'SELLER_INVITATION_ACCEPTED', token },
    });

    this.flushToDisk();
    return { seller: seller!, shop: shop!, invitation };
  }

  // --- Bulk Product Operations ---
  public bulkUpsertProducts(shopId: string, items: Array<Partial<Product>>): Product[] {
    const createdOrUpdated: Product[] = [];
    const now = new Date().toISOString();

    for (const item of items) {
      if (!item.name) continue;

      let product: Product;
      if (item.id && this.products.has(item.id)) {
        // Update existing
        const existing = this.products.get(item.id)!;
        product = {
          ...existing,
          ...item,
          shopId: shopId, // strictly isolate
          updatedAt: now,
        };
      } else {
        // Create new
        const pid = item.id || `prod-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
        const baseUnit = item.baseUnit || item.fractionalConfig?.baseUnit || 'kg';
        const unitType = item.fractionalConfig?.unitType || ('WEIGHT' as any);
        const basePrice = item.basePricePerUnit || item.fractionalConfig?.basePrice || 100;
        const stock = item.currentStockInBaseUnits ?? 50;

        product = {
          id: pid,
          shopId: shopId,
          name: item.name,
          nameHindi: item.nameHindi,
          brand: item.brand,
          category: item.category || 'Grocery & Kirana',
          subCategory: item.subCategory,
          description: item.description || `${item.name} fresh stock`,
          imageUrl: item.imageUrl || 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=500&auto=format&fit=crop&q=60',
          sku: item.sku,
          barcode: item.barcode,
          baseUnit: baseUnit,
          basePricePerUnit: basePrice,
          fractionalConfig: item.fractionalConfig || {
            unitType: unitType,
            baseUnit: baseUnit,
            basePrice: basePrice,
            minQuantityMultiplier: unitType === 'WEIGHT' ? 0.1 : 1,
            maxQuantityMultiplier: 50,
            stepQuantityMultiplier: unitType === 'WEIGHT' ? 0.1 : 1,
            allowCustomFractionalInput: true,
            predefinedOptions: [
              { id: 'opt-1', label: unitType === 'WEIGHT' ? '250 g' : '1 pc', multiplier: unitType === 'WEIGHT' ? 0.25 : 1, unitLabel: unitType === 'WEIGHT' ? 'grams' : 'pc' },
              { id: 'opt-2', label: unitType === 'WEIGHT' ? '500 g' : '2 pcs', multiplier: unitType === 'WEIGHT' ? 0.5 : 2, unitLabel: unitType === 'WEIGHT' ? 'grams' : 'pcs' },
              { id: 'opt-3', label: unitType === 'WEIGHT' ? '1 kg' : '5 pcs', multiplier: unitType === 'WEIGHT' ? 1.0 : 5, unitLabel: unitType === 'WEIGHT' ? 'kg' : 'pcs', isDefault: true },
            ],
          },
          currentStockInBaseUnits: stock,
          lowStockThresholdInBaseUnits: item.lowStockThresholdInBaseUnits ?? 5,
          minStockAlert: item.minStockAlert ?? 5,
          isAvailable: item.isAvailable ?? true,
          isActive: item.isActive ?? true,
          tags: item.tags || [item.category || 'grocery'],
          createdAt: now,
          updatedAt: now,
        };
      }

      this.products.set(product.id, product);
      createdOrUpdated.push(product);
    }

    this.flushToDisk();
    return createdOrUpdated;
  }

  /**
   * Safe Database Backup Export
   */
  public exportDatabaseBackup(): string {
    const state: PersistentDatabaseState = {
      version: 1,
      users: Array.from(this.users.values()),
      markets: Array.from(this.markets.values()),
      shops: Array.from(this.shops.values()),
      products: Array.from(this.products.values()),
      orders: Array.from(this.orders.values()),
      payments: Array.from(this.payments.values()),
      settlements: Array.from(this.settlements.values()),
      notifications: Array.from(this.notifications.values()),
      supportTickets: Array.from(this.supportTickets.values()),
      systemSettings: this.systemSettings,
      commissionConfig: this.commissionConfig,
      auditLogs: this.auditLogs,
      subscriptionPlans: Array.from(this.subscriptionPlans.values()),
      sellerSubscriptions: Array.from(this.sellerSubscriptions.values()),
      subscriptionInvoices: Array.from(this.subscriptionInvoices.values()),
      billingTransactions: this.billingTransactions,
      aiAudits: this.aiAudits,
      aiDrafts: Array.from(this.aiDrafts.values()),
      sellerInvitations: Array.from(this.sellerInvitations.values()),
      lastSavedAt: new Date().toISOString(),
    };
    return JSON.stringify(state, null, 2);
  }

  /**
   * Safe Database Restore
   */
  public restoreDatabaseBackup(backupJson: string): boolean {
    try {
      const state: PersistentDatabaseState = JSON.parse(backupJson);
      this.loadState(state);
      this.flushToDisk();
      return true;
    } catch (err) {
      Logger.error('Failed to restore database backup', err);
      return false;
    }
  }

  // =========================================================================
  // CENTRAL MASTER CATALOGUE OPERATIONS
  // =========================================================================

  /**
   * Get all Master Catalogue items with optional search & category filters
   */
  public getMasterProducts(params?: {
    search?: string;
    category?: string;
    subCategory?: string;
    isActiveOnly?: boolean;
  }): MasterProduct[] {
    let list = Array.from(this.masterProducts.values());

    if (params?.isActiveOnly) {
      list = list.filter((p) => p.isActive !== false);
    }

    if (params?.category && params.category !== 'ALL') {
      list = list.filter((p) => p.category === params.category);
    }

    if (params?.subCategory && params.subCategory !== 'ALL') {
      list = list.filter((p) => p.subCategory === params.subCategory);
    }

    if (params?.search && params.search.trim() !== '') {
      const q = params.search.toLowerCase().trim();
      list = list.filter((p) => {
        const eng = (p.name || '').toLowerCase();
        const hindi = (p.nameHindi || '').toLowerCase();
        const brand = (p.brand || '').toLowerCase();
        const subcat = (p.subCategory || '').toLowerCase();
        const aliasesMatch = p.aliases?.some((a) => a.toLowerCase().includes(q));
        return (
          eng.includes(q) ||
          hindi.includes(q) ||
          brand.includes(q) ||
          subcat.includes(q) ||
          Boolean(aliasesMatch)
        );
      });
    }

    return list;
  }

  /**
   * Get a single master product by ID
   */
  public getMasterProductById(id: string): MasterProduct | undefined {
    return this.masterProducts.get(id);
  }

  /**
   * Create a new Master Product
   * Master Catalogue items strictly do NOT require price or stock.
   */
  public createMasterProduct(data: CreateMasterProductDTO): MasterProduct {
    const id = `master_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date().toISOString();

    const masterProduct: MasterProduct = {
      id,
      name: data.name.trim(),
      nameHindi: data.nameHindi.trim(),
      aliases: data.aliases || [],
      category: data.category,
      subCategory: data.subCategory,
      imageUrl: (data.imageUrl && data.imageUrl.trim() !== '')
        ? data.imageUrl.trim()
        : 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=500&auto=format&fit=crop&q=60',
      brand: data.brand?.trim(),
      defaultUnit: data.defaultUnit || 'kg',
      barcode: data.barcode?.trim(),
      description: data.description?.trim(),
      isActive: true,
      createdAt: now,
      updatedAt: now,
    };

    this.masterProducts.set(masterProduct.id, masterProduct);
    this.flushToDisk();
    return masterProduct;
  }

  /**
   * Update an existing Master Product
   * Modifying master details does NOT disrupt individual shop prices or stock.
   */
  public updateMasterProduct(id: string, data: UpdateMasterProductDTO): MasterProduct | null {
    const existing = this.masterProducts.get(id);
    if (!existing) return null;

    const now = new Date().toISOString();
    const updated: MasterProduct = {
      ...existing,
      ...data,
      name: data.name !== undefined ? data.name.trim() : existing.name,
      nameHindi: data.nameHindi !== undefined ? data.nameHindi.trim() : existing.nameHindi,
      aliases: data.aliases !== undefined ? data.aliases : existing.aliases,
      imageUrl: data.imageUrl !== undefined ? data.imageUrl : existing.imageUrl,
      updatedAt: now,
    };

    this.masterProducts.set(id, updated);
    this.flushToDisk();
    return updated;
  }

  /**
   * Delete a Master Product
   */
  public deleteMasterProduct(id: string): boolean {
    const deleted = this.masterProducts.delete(id);
    if (deleted) {
      this.flushToDisk();
    }
    return deleted;
  }

  /**
   * Bulk Add from Master Catalog to a Shop
   * Prevents duplicates strictly by checking masterProductId and canonical/Hindi names.
   * Does NOT alter price or stock settings of existing products.
   * Shopkeeper/Admin sets custom price, variants, and stock independently in the shop.
   */
  public bulkAddProductsFromMaster(
    shopId: string,
    masterProductIds: string[]
  ): { addedCount: number; skippedCount: number; products: Product[] } {
    const shop = this.shops.get(shopId);
    if (!shop) {
      throw new Error(`Shop with id ${shopId} not found`);
    }

    const existingShopProducts = Array.from(this.products.values()).filter((p) => p.shopId === shopId);
    const existingMasterIds = new Set(existingShopProducts.map((p) => p.masterProductId).filter(Boolean));
    const existingNames = new Set(existingShopProducts.map((p) => p.name.trim().toLowerCase()));
    const existingHindiNames = new Set(
      existingShopProducts.map((p) => p.nameHindi?.trim().toLowerCase()).filter(Boolean)
    );

    const now = new Date().toISOString();
    const created: Product[] = [];
    let skippedCount = 0;

    for (const masterId of masterProductIds) {
      const master = this.masterProducts.get(masterId);
      if (!master) continue;

      const normEng = master.name.trim().toLowerCase();
      const normHindi = master.nameHindi.trim().toLowerCase();

      // DUPLICATE CHECK:
      // If already added via masterProductId or matching name, skip to prevent duplication!
      if (
        existingMasterIds.has(master.id) ||
        existingNames.has(normEng) ||
        (normHindi && existingHindiNames.has(normHindi))
      ) {
        skippedCount++;
        continue;
      }

      const defaultUnit = (master.defaultUnit || 'kg') as any;
      const unitType = ['kg', 'g', 'gram'].includes(defaultUnit)
        ? ProductUnitType.WEIGHT
        : ['L', 'ml', 'litre'].includes(defaultUnit)
        ? ProductUnitType.VOLUME
        : ProductUnitType.PIECE;

      const newProduct: Product = {
        id: `prod-${Date.now()}-${Math.floor(Math.random() * 100000)}`,
        shopId,
        masterProductId: master.id,
        name: master.name,
        nameHindi: master.nameHindi,
        brand: master.brand,
        category: master.category,
        subCategory: master.subCategory,
        description: master.description || `${master.nameHindi || master.name} शुद्ध किराना सामान`,
        imageUrl: (master.imageUrl && master.imageUrl.trim() !== '')
          ? master.imageUrl
          : 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=500&auto=format&fit=crop&q=60',
        barcode: master.barcode,
        baseUnit: defaultUnit,
        basePricePerUnit: 0, // Admin does not set price in Master; Shopkeeper sets later
        fractionalConfig: {
          unitType,
          baseUnit: defaultUnit,
          basePrice: 0,
          minQuantityMultiplier: unitType === ProductUnitType.WEIGHT ? 0.05 : 1,
          maxQuantityMultiplier: 50,
          stepQuantityMultiplier: unitType === ProductUnitType.WEIGHT ? 0.05 : 1,
          allowCustomFractionalInput: true,
          allowAmountBasedPurchase: true,
          amountQuickPills: [20, 50, 100, 200, 500],
          predefinedOptions:
            unitType === ProductUnitType.WEIGHT
              ? [
                  { id: 'opt-250', label: '250 g', multiplier: 0.25, unitLabel: 'grams' },
                  { id: 'opt-500', label: '500 g', multiplier: 0.5, unitLabel: 'grams' },
                  { id: 'opt-1kg', label: '1 kg', multiplier: 1.0, unitLabel: 'kg', isDefault: true },
                ]
              : [
                  { id: 'opt-1pc', label: '1 इकाई', multiplier: 1.0, unitLabel: 'piece', isDefault: true },
                  { id: 'opt-2pc', label: '2 इकाई', multiplier: 2.0, unitLabel: 'piece' },
                ],
        },
        currentStockInBaseUnits: 50,
        lowStockThresholdInBaseUnits: 5,
        minStockAlert: 5,
        isAvailable: true,
        isActive: true,
        tags: [master.category, ...(master.aliases || [])],
        createdAt: now,
        updatedAt: now,
      };

      this.products.set(newProduct.id, newProduct);
      created.push(newProduct);

      // Add to sets so subsequent duplicates in the same bulk batch are also blocked
      existingMasterIds.add(master.id);
      existingNames.add(normEng);
      if (normHindi) existingHindiNames.add(normHindi);
    }

    if (created.length > 0) {
      this.flushToDisk();
    }

    return {
      addedCount: created.length,
      skippedCount,
      products: created,
    };
  }

  /**
   * PostgreSQL Production DDL Migration Verification & Generator
   */
  public generatePostgresMigrationSQL(): string {
    return `-- Production PostgreSQL DDL Schema for Local Marketplace Platform
CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(64) PRIMARY KEY,
  phone VARCHAR(20) UNIQUE NOT NULL,
  email VARCHAR(255),
  full_name VARCHAR(255) NOT NULL,
  role VARCHAR(32) NOT NULL,
  shop_id VARCHAR(64),
  addresses JSONB DEFAULT '[]'::jsonb,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS markets (
  id VARCHAR(64) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  description TEXT,
  city VARCHAR(100) NOT NULL,
  state VARCHAR(100) NOT NULL,
  pincode VARCHAR(20) NOT NULL,
  coordinates JSONB NOT NULL,
  radius_km NUMERIC(6,2) DEFAULT 5.0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS shops (
  id VARCHAR(64) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  market_id VARCHAR(64) REFERENCES markets(id),
  category VARCHAR(100) NOT NULL,
  address TEXT NOT NULL,
  coordinates JSONB NOT NULL,
  contact_phone VARCHAR(20) NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  is_open BOOLEAN DEFAULT TRUE,
  billing_model VARCHAR(32) DEFAULT 'HYBRID',
  commission_rate NUMERIC(5,2) DEFAULT 5.0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS products (
  id VARCHAR(64) PRIMARY KEY,
  shop_id VARCHAR(64) REFERENCES shops(id),
  name VARCHAR(255) NOT NULL,
  name_hindi VARCHAR(255),
  category VARCHAR(100) NOT NULL,
  unit_type VARCHAR(32) NOT NULL,
  base_unit VARCHAR(32) NOT NULL,
  base_price_per_unit NUMERIC(10,2) NOT NULL,
  current_stock_in_base_units NUMERIC(12,3) NOT NULL,
  fractional_config JSONB,
  is_available BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS orders (
  id VARCHAR(64) PRIMARY KEY,
  order_number VARCHAR(64) UNIQUE NOT NULL,
  shop_id VARCHAR(64) REFERENCES shops(id),
  customer_id VARCHAR(64) REFERENCES users(id),
  fulfillment_type VARCHAR(32) NOT NULL,
  status VARCHAR(32) NOT NULL,
  is_paid BOOLEAN DEFAULT FALSE,
  payment_id VARCHAR(128),
  pickup_pin VARCHAR(10),
  items JSONB NOT NULL,
  financials JSONB NOT NULL,
  delivery_address JSONB,
  status_history JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS settlements (
  id VARCHAR(64) PRIMARY KEY,
  seller_id VARCHAR(64) REFERENCES users(id),
  shop_id VARCHAR(64) REFERENCES shops(id),
  batch_id VARCHAR(64) NOT NULL,
  gross_sales NUMERIC(12,2) NOT NULL,
  commission_deducted NUMERIC(12,2) NOT NULL,
  subscription_deducted NUMERIC(12,2) NOT NULL,
  net_payout NUMERIC(12,2) NOT NULL,
  status VARCHAR(32) NOT NULL,
  payout_reference VARCHAR(128),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id VARCHAR(64) PRIMARY KEY,
  timestamp TIMESTAMPTZ NOT NULL,
  event_type VARCHAR(64) NOT NULL,
  performed_by_user_id VARCHAR(64) NOT NULL,
  order_id VARCHAR(64),
  shop_id VARCHAR(64),
  seller_id VARCHAR(64),
  customer_id VARCHAR(64),
  amount NUMERIC(12,2),
  details JSONB
);
`;
  }
}

export const db = new Database();

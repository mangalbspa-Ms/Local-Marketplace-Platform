-- Local Marketplace Relational Database Migration
-- Version: 001_initial_schema.sql
-- Dialect: PostgreSQL (Compatible with Standard Relational Engines)

-- 1. USERS TABLE
CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(64) PRIMARY KEY,
  full_name VARCHAR(255) NOT NULL,
  phone VARCHAR(20) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE,
  role VARCHAR(32) NOT NULL DEFAULT 'CUSTOMER', -- 'CUSTOMER', 'SELLER', 'ADMIN', 'DELIVERY_PERSON'
  avatar_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- 2. USER ADDRESSES TABLE
CREATE TABLE IF NOT EXISTS user_addresses (
  id VARCHAR(64) PRIMARY KEY,
  user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  label VARCHAR(64) NOT NULL, -- 'Home', 'Work', 'Other'
  recipient_name VARCHAR(255) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  address_line1 TEXT NOT NULL,
  address_line2 TEXT,
  landmark TEXT,
  city VARCHAR(100) NOT NULL,
  postal_code VARCHAR(20) NOT NULL,
  is_default BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_addresses_user_id ON user_addresses(user_id);

-- 3. MARKETS TABLE
CREATE TABLE IF NOT EXISTS markets (
  id VARCHAR(64) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  name_hindi VARCHAR(255),
  slug VARCHAR(128) UNIQUE NOT NULL,
  description TEXT,
  location VARCHAR(255) NOT NULL,
  city VARCHAR(100) NOT NULL,
  state VARCHAR(100) NOT NULL,
  postal_code VARCHAR(20) NOT NULL,
  banner_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_markets_city ON markets(city);
CREATE INDEX IF NOT EXISTS idx_markets_active ON markets(is_active);

-- 4. SHOPS TABLE (SELLER LINKED)
CREATE TABLE IF NOT EXISTS shops (
  id VARCHAR(64) PRIMARY KEY,
  market_id VARCHAR(64) NOT NULL REFERENCES markets(id) ON DELETE RESTRICT,
  seller_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  name VARCHAR(255) NOT NULL,
  name_hindi VARCHAR(255),
  stall_number VARCHAR(64),
  category VARCHAR(100) NOT NULL,
  description TEXT,
  phone VARCHAR(20) NOT NULL,
  logo_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  is_verified_by_admin BOOLEAN NOT NULL DEFAULT TRUE,
  commission_rate NUMERIC(5, 2) NOT NULL DEFAULT 5.00, -- percentage e.g. 5.00%
  fulfillment_config JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT uq_shop_seller UNIQUE (seller_id)
);

CREATE INDEX IF NOT EXISTS idx_shops_market_id ON shops(market_id);
CREATE INDEX IF NOT EXISTS idx_shops_seller_id ON shops(seller_id);
CREATE INDEX IF NOT EXISTS idx_shops_active ON shops(is_active);

-- 5. PRODUCTS TABLE (FRACTIONAL PRICING & ATOMIC STOCK)
CREATE TABLE IF NOT EXISTS products (
  id VARCHAR(64) PRIMARY KEY,
  shop_id VARCHAR(64) NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  name_hindi VARCHAR(255),
  category VARCHAR(100) NOT NULL,
  sub_category VARCHAR(100),
  description TEXT,
  image_url TEXT,
  base_unit VARCHAR(32) NOT NULL DEFAULT 'kg', -- 'kg', 'liter', 'packet', 'dozen', 'piece', 'bundle'
  base_price NUMERIC(10, 2) NOT NULL, -- Price for 1 base unit (e.g. ₹100 for 1kg)
  allowed_portion_options JSONB NOT NULL, -- Fractional preset configurations
  current_stock_in_base_units NUMERIC(12, 4) NOT NULL DEFAULT 0.0000,
  low_stock_threshold_in_base_units NUMERIC(12, 4) NOT NULL DEFAULT 5.0000,
  is_available BOOLEAN NOT NULL DEFAULT TRUE,
  is_featured BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_products_shop_id ON products(shop_id);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_available ON products(is_available);

-- 6. ORDERS TABLE
CREATE TABLE IF NOT EXISTS orders (
  id VARCHAR(64) PRIMARY KEY,
  order_number VARCHAR(64) UNIQUE NOT NULL,
  customer_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  customer_name VARCHAR(255) NOT NULL,
  customer_phone VARCHAR(20) NOT NULL,
  shop_id VARCHAR(64) NOT NULL REFERENCES shops(id) ON DELETE RESTRICT,
  shop_name VARCHAR(255) NOT NULL,
  seller_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  market_id VARCHAR(64) NOT NULL REFERENCES markets(id) ON DELETE RESTRICT,
  fulfillment_type VARCHAR(32) NOT NULL, -- 'STORE_PICKUP', 'HOME_DELIVERY'
  pickup_code VARCHAR(8),
  delivery_address_json JSONB,
  item_subtotal NUMERIC(10, 2) NOT NULL,
  delivery_fee NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  platform_fee NUMERIC(10, 2) NOT NULL DEFAULT 2.00,
  tax_amount NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  customer_total NUMERIC(10, 2) NOT NULL,
  commission_percentage NUMERIC(5, 2) NOT NULL DEFAULT 5.00,
  commission_amount NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  seller_net_amount NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  status VARCHAR(32) NOT NULL DEFAULT 'PAYMENT_PENDING',
  is_paid BOOLEAN NOT NULL DEFAULT FALSE,
  payment_method VARCHAR(32) NOT NULL DEFAULT 'ONLINE',
  status_history_json JSONB NOT NULL DEFAULT '[]'::jsonb,
  note TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_seller_id ON orders(seller_id);
CREATE INDEX IF NOT EXISTS idx_orders_shop_id ON orders(shop_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);

-- 7. ORDER ITEMS TABLE (PRICE SNAPSHOT AT TIME OF ORDER)
CREATE TABLE IF NOT EXISTS order_items (
  id VARCHAR(64) PRIMARY KEY,
  order_id VARCHAR(64) NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id VARCHAR(64) NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  product_name VARCHAR(255) NOT NULL,
  product_name_hindi VARCHAR(255),
  category VARCHAR(100),
  ordered_quantity_display VARCHAR(64) NOT NULL, -- e.g. "250 grams"
  ordered_quantity_multiplier NUMERIC(10, 4) NOT NULL, -- e.g. 0.25
  quantity_in_base_units NUMERIC(10, 4) NOT NULL, -- e.g. 0.25 kg
  unit_price NUMERIC(10, 2) NOT NULL, -- e.g. ₹25.00
  line_item_total NUMERIC(10, 2) NOT NULL, -- e.g. ₹25.00
  base_unit VARCHAR(32) NOT NULL, -- 'kg'
  base_unit_price NUMERIC(10, 2) NOT NULL, -- e.g. ₹100.00
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON order_items(product_id);

-- 8. PAYMENTS TABLE
CREATE TABLE IF NOT EXISTS payments (
  id VARCHAR(64) PRIMARY KEY,
  order_id VARCHAR(64) NOT NULL REFERENCES orders(id) ON DELETE RESTRICT,
  customer_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  shop_id VARCHAR(64) NOT NULL REFERENCES shops(id) ON DELETE RESTRICT,
  amount NUMERIC(10, 2) NOT NULL,
  currency VARCHAR(10) NOT NULL DEFAULT 'INR',
  status VARCHAR(32) NOT NULL DEFAULT 'PENDING', -- 'PENDING', 'VERIFIED', 'FAILED', 'REFUNDED'
  gateway VARCHAR(32) NOT NULL DEFAULT 'TEST_GATEWAY',
  gateway_order_id VARCHAR(128),
  gateway_payment_id VARCHAR(128),
  gateway_signature TEXT,
  paid_at TIMESTAMP WITH TIME ZONE,
  failure_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_payments_order_id ON payments(order_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);

-- 9. COMMISSIONS TABLE
CREATE TABLE IF NOT EXISTS commissions (
  id VARCHAR(64) PRIMARY KEY,
  order_id VARCHAR(64) UNIQUE NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  shop_id VARCHAR(64) NOT NULL REFERENCES shops(id) ON DELETE RESTRICT,
  seller_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  order_amount NUMERIC(10, 2) NOT NULL,
  commission_rate NUMERIC(5, 2) NOT NULL,
  commission_amount NUMERIC(10, 2) NOT NULL,
  seller_net_amount NUMERIC(10, 2) NOT NULL,
  status VARCHAR(32) NOT NULL DEFAULT 'ACCRUED',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_commissions_shop_id ON commissions(shop_id);
CREATE INDEX IF NOT EXISTS idx_commissions_seller_id ON commissions(seller_id);

-- 10. SELLER SETTLEMENTS TABLE
CREATE TABLE IF NOT EXISTS seller_settlements (
  id VARCHAR(64) PRIMARY KEY,
  shop_id VARCHAR(64) NOT NULL REFERENCES shops(id) ON DELETE RESTRICT,
  seller_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  period_start TIMESTAMP WITH TIME ZONE NOT NULL,
  period_end TIMESTAMP WITH TIME ZONE NOT NULL,
  gross_sales NUMERIC(12, 2) NOT NULL,
  platform_commission NUMERIC(12, 2) NOT NULL,
  net_payable NUMERIC(12, 2) NOT NULL,
  completed_orders INTEGER NOT NULL DEFAULT 0,
  settlement_status VARCHAR(32) NOT NULL DEFAULT 'PENDING', -- 'PENDING', 'PROCESSED', 'FAILED'
  payout_reference VARCHAR(128),
  bank_account_last4 VARCHAR(8),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  processed_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_settlements_shop_id ON seller_settlements(shop_id);
CREATE INDEX IF NOT EXISTS idx_settlements_seller_id ON seller_settlements(seller_id);

-- 11. NOTIFICATIONS TABLE
CREATE TABLE IF NOT EXISTS notifications (
  id VARCHAR(64) PRIMARY KEY,
  recipient_user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  shop_id VARCHAR(64) REFERENCES shops(id) ON DELETE CASCADE,
  type VARCHAR(64) NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  order_id VARCHAR(64) REFERENCES orders(id) ON DELETE SET NULL,
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_notifications_recipient ON notifications(recipient_user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON notifications(recipient_user_id, is_read);

-- 12. AUDIT LOGS TABLE
CREATE TABLE IF NOT EXISTS audit_logs (
  id VARCHAR(64) PRIMARY KEY,
  event_type VARCHAR(64) NOT NULL,
  order_id VARCHAR(64),
  shop_id VARCHAR(64),
  seller_id VARCHAR(64),
  customer_id VARCHAR(64),
  performed_by_user_id VARCHAR(64) NOT NULL,
  amount NUMERIC(12, 2),
  commission NUMERIC(12, 2),
  details_json JSONB,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_audit_timestamp ON audit_logs(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_audit_event_type ON audit_logs(event_type);

-- 13. SUPPORT TICKETS TABLE
CREATE TABLE IF NOT EXISTS support_tickets (
  id VARCHAR(64) PRIMARY KEY,
  ticket_number VARCHAR(64) UNIQUE NOT NULL,
  customer_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  customer_name VARCHAR(255) NOT NULL,
  customer_phone VARCHAR(20) NOT NULL,
  order_id VARCHAR(64) REFERENCES orders(id) ON DELETE SET NULL,
  shop_id VARCHAR(64) REFERENCES shops(id) ON DELETE SET NULL,
  ticket_type VARCHAR(64) NOT NULL,
  subject VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  status VARCHAR(32) NOT NULL DEFAULT 'OPEN',
  priority VARCHAR(32) NOT NULL DEFAULT 'MEDIUM',
  resolution_note TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_tickets_customer ON support_tickets(customer_id);
CREATE INDEX IF NOT EXISTS idx_tickets_status ON support_tickets(status);

-- 14. SYSTEM SETTINGS TABLE
CREATE TABLE IF NOT EXISTS system_settings (
  id VARCHAR(64) PRIMARY KEY,
  platform_name VARCHAR(255) NOT NULL,
  support_phone VARCHAR(20) NOT NULL,
  support_email VARCHAR(255) NOT NULL,
  default_commission_rate NUMERIC(5, 2) NOT NULL DEFAULT 5.00,
  min_order_amount NUMERIC(10, 2) NOT NULL DEFAULT 50.00,
  default_platform_fee NUMERIC(10, 2) NOT NULL DEFAULT 2.00,
  enable_sms_notifications BOOLEAN NOT NULL DEFAULT TRUE,
  maintenance_mode BOOLEAN NOT NULL DEFAULT FALSE,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

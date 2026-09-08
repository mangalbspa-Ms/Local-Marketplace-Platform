-- Local Marketplace Schema Migration
-- Version: 003_seller_invitations_and_profiles.sql
-- Seller Invitations, Shop Profiles, Field Operator Onboarding

-- 1. SELLER INVITATIONS TABLE
CREATE TABLE IF NOT EXISTS seller_invitations (
  id VARCHAR(64) PRIMARY KEY,
  invitation_token VARCHAR(128) UNIQUE NOT NULL,
  shop_id VARCHAR(64) NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  seller_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_by_admin_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  seller_name VARCHAR(255) NOT NULL,
  seller_phone VARCHAR(20) NOT NULL,
  shop_name VARCHAR(255) NOT NULL,
  status VARCHAR(32) NOT NULL DEFAULT 'PENDING', -- 'PENDING', 'ACCEPTED', 'EXPIRED', 'REVOKED'
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  accepted_at TIMESTAMP WITH TIME ZONE,
  invitation_url TEXT NOT NULL,
  qr_code_payload TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_invitations_token ON seller_invitations(invitation_token);
CREATE INDEX IF NOT EXISTS idx_invitations_shop ON seller_invitations(shop_id);
CREATE INDEX IF NOT EXISTS idx_invitations_phone ON seller_invitations(seller_phone);

-- 2. SCHEMA MIGRATION TRACKING TABLE
CREATE TABLE IF NOT EXISTS schema_migrations (
  id VARCHAR(255) PRIMARY KEY,
  applied_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  checksum VARCHAR(64)
);

/**
 * Server Configuration & Environment Variables (Phase 13: Production Architecture)
 */

export type EnvironmentType = 'development' | 'staging' | 'production';

const nodeEnv: EnvironmentType = (process.env.NODE_ENV as EnvironmentType) || 'development';
const isProduction = nodeEnv === 'production';
const isStaging = nodeEnv === 'staging';
const isDevelopment = nodeEnv === 'development' || (!isProduction && !isStaging);

export const serverConfig = {
  port: parseInt(process.env.PORT || '3000', 10),
  nodeEnv,
  isProduction,
  isStaging,
  isDevelopment,

  // App & API URLs
  appUrl: process.env.APP_URL || 'http://localhost:3000',
  apiUrl: process.env.API_URL || 'http://localhost:3000/api',

  // Authentication & Secrets (safe default for local development)
  jwtSecret: process.env.JWT_SECRET || 'local-marketplace-dev-secret-key-change-in-prod',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  sessionSecret: process.env.SESSION_SECRET || 'dev-session-secret-salt-key-9988',

  // Database
  databaseUrl: process.env.DATABASE_URL || '',
  hasPostgres: Boolean(process.env.DATABASE_URL),

  // Platform Business & Financial Defaults
  platform: {
    defaultCommissionPercentage: parseFloat(process.env.DEFAULT_COMMISSION_PERCENTAGE || '5.0'),
    defaultPlatformFee: parseFloat(process.env.DEFAULT_PLATFORM_FEE || '2.00'),
    defaultDeliveryFee: parseFloat(process.env.DEFAULT_DELIVERY_FEE || '30.00'),
    freeDeliveryThreshold: parseFloat(process.env.MIN_ORDER_AMOUNT_FOR_FREE_DELIVERY || '500.00'),
  },

  // Payment Gateway Provider
  paymentGateway: {
    provider: process.env.PAYMENT_PROVIDER || 'RAZORPAY',
    keyId: process.env.PAYMENT_GATEWAY_KEY_ID || process.env.PAYMENT_GATEWAY_KEY || 'rzp_test_sample_key_id',
    keySecret: process.env.PAYMENT_GATEWAY_KEY_SECRET || process.env.PAYMENT_GATEWAY_SECRET || 'rzp_test_sample_secret_key',
    webhookSecret: process.env.PAYMENT_WEBHOOK_SECRET || process.env.WEBHOOK_SECRET || 'whsec_sample_verification_secret',
    isConfigured: Boolean(process.env.PAYMENT_GATEWAY_KEY_ID && process.env.PAYMENT_GATEWAY_KEY_SECRET),
  },

  // Image Storage Provider
  imageStorage: {
    provider: (process.env.IMAGE_STORAGE_PROVIDER as 'local' | 's3' | 'gcs') || 'local',
    bucket: process.env.IMAGE_STORAGE_BUCKET || 'local-marketplace-media',
  },

  // Validation helper
  validateConfig(): { valid: boolean; warnings: string[]; errors: string[] } {
    const warnings: string[] = [];
    const errors: string[] = [];

    if (this.isProduction && (!process.env.JWT_SECRET || process.env.JWT_SECRET.includes('dev-secret'))) {
      warnings.push('JWT_SECRET should be set to a cryptographically random secret in production.');
    }

    if (!process.env.GEMINI_API_KEY) {
      warnings.push('GEMINI_API_KEY is not set; AI multi-modal features operate in resilient rule-based NLP fallback mode.');
    }
    if (!this.databaseUrl) {
      warnings.push('DATABASE_URL is not set; local persistent file database (/data) is active.');
    }
    if (!this.paymentGateway.isConfigured) {
      warnings.push('Payment Gateway production keys not set; sandbox verification is active.');
    }

    return { valid: errors.length === 0, warnings, errors };
  },
};


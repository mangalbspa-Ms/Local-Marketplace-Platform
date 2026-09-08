/**
 * Payment Verification and Gateway Types
 */

export enum PaymentGateway {
  RAZORPAY = 'RAZORPAY',
  STRIPE = 'STRIPE',
  UPI_QR = 'UPI_QR',
  MOCK_TEST_GATEWAY = 'MOCK_TEST_GATEWAY',
}

export enum PaymentStatus {
  INITIATED = 'INITIATED',
  AUTHORIZED = 'AUTHORIZED',
  VERIFIED = 'VERIFIED',
  FAILED = 'FAILED',
  REFUND_PENDING = 'REFUND_PENDING',
  REFUNDED = 'REFUNDED',
}

export interface PaymentIntentRequest {
  orderId: string;
  amount: number;
  currency: string;
  customerId: string;
  shopId: string;
  metadata?: Record<string, any>;
}

export interface PaymentIntentResponse {
  intentId: string;
  gatewayOrderId: string;
  amount: number;
  currency: string;
  gateway: PaymentGateway;
  keyId: string;
  customerPhone: string;
  customerEmail?: string;
  expiresAt: string;
}

export interface PaymentVerificationRequest {
  orderId: string;
  intentId: string;
  gatewayPaymentId: string;
  gatewayOrderId: string;
  gatewaySignature: string;
  paymentMethod?: string;
}

export interface PaymentRecord {
  id: string;
  orderId: string;
  customerId: string;
  sellerId: string;
  shopId: string;
  amount: number;
  currency: string;
  gateway: PaymentGateway;
  gatewayPaymentId: string;
  gatewayOrderId?: string;
  status: PaymentStatus;
  verifiedAt?: string;
  rawGatewayResponse?: Record<string, any>;
  failureReason?: string;
  refundId?: string;
  refundAmount?: number;
  createdAt: string;
  updatedAt: string;
}

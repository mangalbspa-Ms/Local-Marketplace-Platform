/**
 * Unified Payment Provider Interface & Test/Mock Implementation
 * 
 * Abstraction layer decoupling order/subscription billing from payment gateway implementations
 * (Razorpay, Stripe, Mock Test Provider, etc.)
 */

export interface PaymentIntentParams {
  orderId?: string;
  subscriptionInvoiceId?: string;
  sellerId?: string;
  customerId?: string;
  amount: number;
  currency: string;
  description: string;
  metadata?: Record<string, any>;
  idempotencyKey?: string;
}

export interface PaymentIntentResult {
  intentId: string;
  gatewayOrderId: string;
  amount: number;
  currency: string;
  clientSecret?: string;
  status: 'PENDING' | 'SUCCEEDED' | 'FAILED';
  provider: string;
  createdAt: string;
}

export interface VerifyPaymentParams {
  intentId: string;
  gatewayPaymentId: string;
  gatewayOrderId: string;
  gatewaySignature: string;
  amount: number;
  idempotencyKey?: string;
}

export interface PaymentVerificationResult {
  isSuccess: boolean;
  gatewayPaymentId: string;
  amount: number;
  currency: string;
  errorMessage?: string;
  verifiedAt: string;
}

export interface SubscriptionPaymentParams {
  sellerId: string;
  shopId: string;
  invoiceId: string;
  amount: number;
  currency: string;
  planId: string;
  planName: string;
  paymentMethod: string;
  idempotencyKey?: string;
}

export interface SubscriptionPaymentResult {
  success: boolean;
  paymentReference: string;
  invoiceId: string;
  amountPaid: number;
  paidAt: string;
  error?: string;
}

export interface RefundParams {
  paymentId: string;
  amount: number;
  reason?: string;
  idempotencyKey?: string;
}

export interface RefundResult {
  success: boolean;
  refundId: string;
  amountRefunded: number;
  refundedAt: string;
}

export interface IPaymentProvider {
  name: string;
  createPaymentIntent(params: PaymentIntentParams): Promise<PaymentIntentResult>;
  verifyPayment(params: VerifyPaymentParams): Promise<PaymentVerificationResult>;
  processSubscriptionPayment(params: SubscriptionPaymentParams): Promise<SubscriptionPaymentResult>;
  refundPayment(params: RefundParams): Promise<RefundResult>;
}

export class MockPaymentProvider implements IPaymentProvider {
  public name = 'MOCK_TEST_GATEWAY';
  private processedTransactions: Set<string> = new Set();

  public async createPaymentIntent(params: PaymentIntentParams): Promise<PaymentIntentResult> {
    const intentId = `pi_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const gatewayOrderId = `order_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

    return {
      intentId,
      gatewayOrderId,
      amount: Math.round(params.amount * 100) / 100,
      currency: params.currency || 'INR',
      clientSecret: `mock_secret_${intentId}`,
      status: 'PENDING',
      provider: this.name,
      createdAt: new Date().toISOString(),
    };
  }

  public async verifyPayment(params: VerifyPaymentParams): Promise<PaymentVerificationResult> {
    // Idempotent signature checking
    if (params.gatewaySignature === 'INVALID_SIGNATURE' || params.gatewaySignature === 'FAIL_PAYMENT') {
      return {
        isSuccess: false,
        gatewayPaymentId: params.gatewayPaymentId,
        amount: params.amount,
        currency: 'INR',
        errorMessage: 'Payment signature verification failed.',
        verifiedAt: new Date().toISOString(),
      };
    }

    const txKey = `${params.intentId}_${params.gatewayPaymentId}`;
    this.processedTransactions.add(txKey);

    return {
      isSuccess: true,
      gatewayPaymentId: params.gatewayPaymentId || `pay_mock_${Date.now()}`,
      amount: params.amount,
      currency: 'INR',
      verifiedAt: new Date().toISOString(),
    };
  }

  public async processSubscriptionPayment(params: SubscriptionPaymentParams): Promise<SubscriptionPaymentResult> {
    const paymentRef = `sub_pay_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    
    return {
      success: true,
      paymentReference: paymentRef,
      invoiceId: params.invoiceId,
      amountPaid: Math.round(params.amount * 100) / 100,
      paidAt: new Date().toISOString(),
    };
  }

  public async refundPayment(params: RefundParams): Promise<RefundResult> {
    return {
      success: true,
      refundId: `ref_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      amountRefunded: params.amount,
      refundedAt: new Date().toISOString(),
    };
  }
}

// Global active payment provider instance (can be swapped with Razorpay/Stripe in future)
export const activePaymentProvider: IPaymentProvider = new MockPaymentProvider();

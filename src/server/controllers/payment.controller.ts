/**
 * Payment Controller
 * Backend Verification & Payment Intent Generation (Rule D)
 */

import { Request, Response, NextFunction } from 'express';
import { PaymentService } from '../services/payment.service.ts';
import { ResponseUtil } from '../utils/response.ts';
import { ValidationError } from '../utils/errors.ts';

export class PaymentController {
  public static async createIntent(req: Request, res: Response, next: NextFunction) {
    try {
      const { orderId } = req.body;
      if (!orderId) {
        throw new ValidationError('orderId is required to create a payment intent.');
      }
      const intent = PaymentService.createPaymentIntent(orderId, req.user!.userId);
      return ResponseUtil.created(res, intent, 'Payment intent created');
    } catch (err) {
      next(err);
    }
  }

  public static async verifyPayment(req: Request, res: Response, next: NextFunction) {
    try {
      const { orderId, intentId, gatewayPaymentId, gatewayOrderId, gatewaySignature, paymentMethod } = req.body;

      if (!orderId || !gatewayPaymentId || !gatewaySignature) {
        throw new ValidationError('orderId, gatewayPaymentId, and gatewaySignature are required for verification.');
      }

      const result = PaymentService.verifyPayment({
        orderId,
        intentId: intentId || 'intent_direct',
        gatewayPaymentId,
        gatewayOrderId: gatewayOrderId || 'order_direct',
        gatewaySignature,
        paymentMethod,
      });

      return ResponseUtil.success(res, result, 'Payment verified and order confirmed successfully');
    } catch (err) {
      next(err);
    }
  }
}

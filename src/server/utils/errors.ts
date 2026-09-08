/**
 * Centralized Application Error Classes
 */

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly isOperational: boolean;
  public readonly details?: any;

  constructor(message: string, statusCode: number = 500, code: string = 'INTERNAL_ERROR', details?: any) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true;
    this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: any) {
    super(message, 400, 'VALIDATION_ERROR', details);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = 'Authentication required to access this resource') {
    super(message, 401, 'UNAUTHORIZED');
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = 'You do not have permission to access this resource') {
    super(message, 403, 'FORBIDDEN');
  }
}

export class ShopIsolationError extends AppError {
  constructor(message: string = 'Access denied: You can only view and manage your own shop data') {
    super(message, 403, 'SHOP_ISOLATION_VIOLATION');
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string = 'Resource', identifier?: string) {
    const msg = identifier ? `${resource} with id '${identifier}' not found` : `${resource} not found`;
    super(msg, 404, 'NOT_FOUND');
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(message, 409, 'CONFLICT');
  }
}

export class PaymentVerificationError extends AppError {
  constructor(message: string = 'Payment signature verification failed. Order cannot be confirmed.') {
    super(message, 402, 'PAYMENT_VERIFICATION_FAILED');
  }
}

export class InvalidStateTransitionError extends AppError {
  constructor(message: string) {
    super(message, 422, 'INVALID_STATE_TRANSITION');
  }
}

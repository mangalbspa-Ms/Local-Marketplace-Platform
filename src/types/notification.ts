/**
 * Notification Types
 */

export enum NotificationType {
  NEW_ORDER = 'NEW_ORDER',
  NEW_ORDER_PAID = 'NEW_ORDER_PAID',
  ORDER_ACCEPTED = 'ORDER_ACCEPTED',
  ORDER_CANCELLED = 'ORDER_CANCELLED',
  ORDER_STATUS_CHANGED = 'ORDER_STATUS_CHANGED',
  PAYMENT_UPDATE = 'PAYMENT_UPDATE',
  SETTLEMENT_UPDATE = 'SETTLEMENT_UPDATE',
  SETTLEMENT_PROCESSED = 'SETTLEMENT_PROCESSED',
  LOW_STOCK = 'LOW_STOCK',
  LOW_STOCK_ALERT = 'LOW_STOCK_ALERT',
  ADMIN_ANNOUNCEMENT = 'ADMIN_ANNOUNCEMENT',
}

export interface AppNotification {
  id: string;
  recipientUserId: string;
  shopId?: string;
  type: NotificationType;
  title: string;
  message: string;
  titleHi?: string;
  titleEn?: string;
  descHi?: string;
  descEn?: string;
  orderId?: string;
  productId?: string;
  amount?: number;
  isRead: boolean;
  actionUrl?: string;
  createdAt: string;
}

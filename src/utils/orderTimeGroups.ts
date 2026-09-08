import { Order } from '../types/order.ts';

export type TimeSlotId = 'morning' | 'afternoon' | 'evening';

export interface OrderTimeSlotGroup {
  id: TimeSlotId;
  titleHi: string;
  titleEn: string;
  badgeHi: string;
  badgeEn: string;
  timeRangeHi: string;
  timeRangeEn: string;
  icon: string;
  bgGradient: string;
  borderColor: string;
  orders: Order[];
}

/**
 * Categorizes orders into time-of-day slots:
 * - Morning: 06:00 AM – 11:59 AM (06:00 to 11:59)
 * - Afternoon: 12:00 PM – 03:59 PM (12:00 to 15:59)
 * - Evening: 04:00 PM onward (16:00 to 05:59)
 *
 * Orders are sorted newest-first within each group.
 */
export function groupOrdersByTimeSlot(orders: Order[]): OrderTimeSlotGroup[] {
  const morning: Order[] = [];
  const afternoon: Order[] = [];
  const evening: Order[] = [];

  const sorted = [...orders].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  for (const o of sorted) {
    const d = new Date(o.createdAt);
    const hour = d.getHours(); // 0-23
    if (hour >= 6 && hour < 12) {
      morning.push(o);
    } else if (hour >= 12 && hour < 16) {
      afternoon.push(o);
    } else {
      evening.push(o);
    }
  }

  const groups: OrderTimeSlotGroup[] = [];

  if (morning.length > 0) {
    groups.push({
      id: 'morning',
      titleHi: '🌅 सुबह के ऑर्डर',
      titleEn: '🌅 Morning Orders',
      badgeHi: '06:00 AM – 11:59 AM',
      badgeEn: '06:00 AM – 11:59 AM',
      timeRangeHi: 'सुबह 06:00 AM से 11:59 AM के बीच प्राप्त ऑर्डर',
      timeRangeEn: 'Orders placed from 06:00 AM to 11:59 AM',
      icon: '🌅',
      bgGradient: 'bg-amber-50/50',
      borderColor: 'border-amber-200/80',
      orders: morning,
    });
  }

  if (afternoon.length > 0) {
    groups.push({
      id: 'afternoon',
      titleHi: '☀️ दोपहर के ऑर्डर',
      titleEn: '☀️ Afternoon Orders',
      badgeHi: '12:00 PM – 03:59 PM',
      badgeEn: '12:00 PM – 03:59 PM',
      timeRangeHi: 'दोपहर 12:00 PM से 03:59 PM के बीच प्राप्त ऑर्डर',
      timeRangeEn: 'Orders placed from 12:00 PM to 03:59 PM',
      icon: '☀️',
      bgGradient: 'bg-orange-50/50',
      borderColor: 'border-orange-200/80',
      orders: afternoon,
    });
  }

  if (evening.length > 0) {
    groups.push({
      id: 'evening',
      titleHi: '🌆 शाम / रात के ऑर्डर',
      titleEn: '🌆 Evening Orders',
      badgeHi: '04:00 PM onward',
      badgeEn: '04:00 PM onward',
      timeRangeHi: 'शाम 04:00 PM से आगे के ऑर्डर',
      timeRangeEn: 'Orders placed from 04:00 PM onward',
      icon: '🌆',
      bgGradient: 'bg-indigo-50/50',
      borderColor: 'border-indigo-200/80',
      orders: evening,
    });
  }

  return groups;
}

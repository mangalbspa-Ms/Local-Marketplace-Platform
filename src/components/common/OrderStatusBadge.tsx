import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { OrderStatus } from '../../types/order.ts';

export interface OrderStatusBadgeProps {
  status: OrderStatus | string;
  language?: 'hi' | 'en';
  variant?: 'customer' | 'seller' | 'admin' | 'light' | 'dark';
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
  showPulse?: boolean;
  customLabel?: string;
  className?: string;
}

interface StatusVisualConfig {
  labelHi: string;
  labelEn: string;
  icon: string;
  lightStyle: string;
  darkStyle: string;
  pulseColor: string;
  dotColor: string;
  isLive: boolean;
}

const STATUS_CONFIGS: Record<string, StatusVisualConfig> = {
  [OrderStatus.PAYMENT_PENDING]: {
    labelHi: 'भुगतान लंबित',
    labelEn: 'Payment Pending',
    icon: '⏳',
    lightStyle: 'bg-amber-50 text-amber-900 border-amber-200/90 shadow-2xs',
    darkStyle: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
    pulseColor: 'bg-amber-400',
    dotColor: 'bg-amber-500',
    isLive: true,
  },
  [OrderStatus.CONFIRMED]: {
    labelHi: 'ऑर्डर कन्फर्म हुआ',
    labelEn: 'Order Confirmed',
    icon: '🔵',
    lightStyle: 'bg-blue-50 text-blue-900 border-blue-200/90 shadow-2xs',
    darkStyle: 'bg-blue-500/15 text-blue-300 border-blue-500/30',
    pulseColor: 'bg-blue-400',
    dotColor: 'bg-blue-500',
    isLive: true,
  },
  [OrderStatus.ACCEPTED]: {
    labelHi: 'दुकानदार ने स्वीकार किया',
    labelEn: 'Accepted by Shop',
    icon: '⚡',
    lightStyle: 'bg-sky-50 text-sky-900 border-sky-300/80 ring-1 ring-sky-400/20 shadow-2xs',
    darkStyle: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30 ring-1 ring-cyan-400/20',
    pulseColor: 'bg-sky-400',
    dotColor: 'bg-sky-500',
    isLive: true,
  },
  [OrderStatus.PREPARING]: {
    labelHi: 'ऑर्डर तैयार हो रहा है',
    labelEn: 'Preparing Order',
    icon: '📦',
    lightStyle: 'bg-purple-50 text-purple-900 border-purple-200/90 shadow-2xs',
    darkStyle: 'bg-purple-500/15 text-purple-300 border-purple-500/30 ring-1 ring-purple-400/20',
    pulseColor: 'bg-purple-400',
    dotColor: 'bg-purple-500',
    isLive: true,
  },
  [OrderStatus.READY_FOR_PICKUP]: {
    labelHi: 'पिकअप हेतु तैयार',
    labelEn: 'Ready for Pickup',
    icon: '🏪',
    lightStyle: 'bg-emerald-50 text-emerald-950 border-emerald-300 ring-1 ring-emerald-400/30 shadow-2xs',
    darkStyle: 'bg-teal-500/15 text-teal-300 border-teal-500/30 ring-1 ring-teal-400/20',
    pulseColor: 'bg-emerald-400',
    dotColor: 'bg-emerald-500',
    isLive: true,
  },
  [OrderStatus.OUT_FOR_DELIVERY]: {
    labelHi: 'डिलीवरी के लिए रवाना',
    labelEn: 'Out for Delivery',
    icon: '🛵',
    lightStyle: 'bg-indigo-50 text-indigo-950 border-indigo-300/80 ring-1 ring-indigo-400/20 shadow-2xs',
    darkStyle: 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30 ring-1 ring-indigo-400/20',
    pulseColor: 'bg-indigo-400',
    dotColor: 'bg-indigo-500',
    isLive: true,
  },
  [OrderStatus.ARRIVED]: {
    labelHi: 'पहुंच गया',
    labelEn: 'Arrived',
    icon: '📍',
    lightStyle: 'bg-fuchsia-50 text-fuchsia-950 border-fuchsia-200/90 shadow-2xs',
    darkStyle: 'bg-fuchsia-500/15 text-fuchsia-300 border-fuchsia-500/30',
    pulseColor: 'bg-fuchsia-400',
    dotColor: 'bg-fuchsia-500',
    isLive: true,
  },
  [OrderStatus.COMPLETED]: {
    labelHi: 'पूर्ण हुआ',
    labelEn: 'Delivered / Completed',
    icon: '✅',
    lightStyle: 'bg-emerald-50 text-emerald-900 border-emerald-200/90 shadow-2xs',
    darkStyle: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
    pulseColor: 'bg-emerald-400',
    dotColor: 'bg-emerald-500',
    isLive: false,
  },
  [OrderStatus.CANCELLED]: {
    labelHi: 'रद्द हुआ',
    labelEn: 'Cancelled',
    icon: '❌',
    lightStyle: 'bg-rose-50 text-rose-900 border-rose-200/90 shadow-2xs',
    darkStyle: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
    pulseColor: 'bg-rose-400',
    dotColor: 'bg-rose-500',
    isLive: false,
  },
  [OrderStatus.REFUND_PENDING]: {
    labelHi: 'रिफंड प्रक्रिया में',
    labelEn: 'Refund Pending',
    icon: '↩️',
    lightStyle: 'bg-orange-50 text-orange-900 border-orange-200 shadow-2xs',
    darkStyle: 'bg-orange-500/15 text-orange-300 border-orange-500/30',
    pulseColor: 'bg-orange-400',
    dotColor: 'bg-orange-500',
    isLive: true,
  },
  [OrderStatus.REFUNDED]: {
    labelHi: 'रिफंड पूर्ण',
    labelEn: 'Refunded',
    icon: '💰',
    lightStyle: 'bg-slate-100 text-slate-800 border-slate-200 shadow-2xs',
    darkStyle: 'bg-slate-800 text-slate-300 border-slate-700',
    pulseColor: 'bg-slate-400',
    dotColor: 'bg-slate-500',
    isLive: false,
  },
  [OrderStatus.PAYMENT_FAILED]: {
    labelHi: 'भुगतान विफल',
    labelEn: 'Payment Failed',
    icon: '⚠️',
    lightStyle: 'bg-red-50 text-red-900 border-red-200 shadow-2xs',
    darkStyle: 'bg-red-500/15 text-red-300 border-red-500/30',
    pulseColor: 'bg-red-400',
    dotColor: 'bg-red-500',
    isLive: false,
  },
};

const DEFAULT_CONFIG: StatusVisualConfig = {
  labelHi: 'अज्ञात स्थिति',
  labelEn: 'Unknown Status',
  icon: '📋',
  lightStyle: 'bg-slate-50 text-slate-800 border-slate-200 shadow-2xs',
  darkStyle: 'bg-slate-800 text-slate-300 border-slate-700',
  pulseColor: 'bg-slate-400',
  dotColor: 'bg-slate-500',
  isLive: false,
};

export const OrderStatusBadge: React.FC<OrderStatusBadgeProps> = ({
  status,
  language = 'hi',
  variant = 'customer',
  size = 'md',
  showIcon = true,
  showPulse = true,
  customLabel,
  className = '',
}) => {
  const config = STATUS_CONFIGS[status] || {
    ...DEFAULT_CONFIG,
    labelHi: String(status),
    labelEn: String(status),
  };

  const isDark = variant === 'seller' || variant === 'dark';
  const styleClass = isDark ? config.darkStyle : config.lightStyle;

  const displayLabel = customLabel || (language === 'hi' ? config.labelHi : config.labelEn);

  // Track status changes to trigger a subtle visual pop, flash, and smooth progression animation
  const prevStatusRef = useRef(status);
  const [justChanged, setJustChanged] = useState(false);

  useEffect(() => {
    if (prevStatusRef.current !== status) {
      prevStatusRef.current = status;
      setJustChanged(true);
      const timer = setTimeout(() => setJustChanged(false), 1100);
      return () => clearTimeout(timer);
    }
  }, [status]);

  // Size configurations
  const sizeClasses = {
    sm: 'text-[9px] sm:text-[10px] px-2 py-0.5 rounded-full font-bold gap-1',
    md: 'text-[11px] sm:text-xs px-2.5 py-0.5 rounded-lg font-bold gap-1.5',
    lg: 'text-xs sm:text-sm px-3 py-1 rounded-xl font-black gap-2',
  }[size];

  return (
    <motion.span
      layout
      animate={{
        scale: justChanged ? [1, 1.06, 0.98, 1] : 1,
      }}
      transition={{
        layout: { duration: 0.3, ease: [0.16, 1, 0.3, 1] },
        scale: { duration: 0.45, ease: [0.16, 1, 0.3, 1] },
      }}
      className={`relative inline-flex items-center border transition-colors duration-400 ease-out select-none overflow-hidden ${sizeClasses} ${styleClass} ${
        justChanged
          ? isDark
            ? 'ring-2 ring-cyan-400/60 ring-offset-1 ring-offset-slate-900 shadow-xs'
            : 'ring-2 ring-sky-400/60 ring-offset-1 ring-offset-white shadow-xs'
          : ''
      } ${className}`}
    >
      {/* Subtle status update highlight sweep when status transitions */}
      {justChanged && (
        <motion.span
          initial={{ opacity: 0.6, scale: 0.9 }}
          animate={{ opacity: 0, scale: 1.15 }}
          transition={{ duration: 0.75, ease: 'easeOut' }}
          className="absolute inset-0 rounded-[inherit] bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none"
        />
      )}

      {/* Subtle Live Pulsing Dot */}
      {showPulse && config.isLive && (
        <span className="relative flex h-1.5 w-1.5 shrink-0">
          <span
            className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${config.pulseColor}`}
          />
          <span
            className={`relative inline-flex rounded-full h-1.5 w-1.5 ${config.dotColor}`}
          />
        </span>
      )}

      {/* Animated icon & text with AnimatePresence */}
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={`${status}_${displayLabel}`}
          initial={{ opacity: 0, y: 4, filter: 'blur(1.5px)' }}
          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          exit={{ opacity: 0, y: -4, filter: 'blur(1.5px)' }}
          transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
          className="inline-flex items-center gap-1 min-w-0"
        >
          {showIcon && config.icon && (
            <span className="shrink-0 leading-none">{config.icon}</span>
          )}
          <span className="truncate leading-tight">{displayLabel}</span>
        </motion.span>
      </AnimatePresence>
    </motion.span>
  );
};

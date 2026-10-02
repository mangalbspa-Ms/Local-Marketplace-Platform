/**
 * Store Pickup Verification Screen (Screen 8)
 * 4-digit Pickup PIN verification and customer handover workflow.
 */

import React, { useState } from 'react';
import {
  ShoppingBag,
  KeyRound,
  CheckCircle2,
  AlertCircle,
  User,
  Phone,
  Clock,
  Sparkles,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import { Order, OrderStatus } from '../../../types/order.ts';
import { useSellerLanguage } from '../../../context/SellerLanguageContext.tsx';
import confetti from 'canvas-confetti';

interface PickupVerificationScreenProps {
  orders: Order[];
  onCompletePickup: (orderId: string, enteredPin: string) => Promise<void>;
  onViewOrderDetails: (order) => void;
}

export const PickupVerificationScreen: React.FC<PickupVerificationScreenProps> = ({
  orders,
  onCompletePickup,
  onViewOrderDetails,
}) => {
  const { language, t } = useSellerLanguage();

  // Orders waiting for store pickup
  const pickupOrders = orders.filter((o) => o.status === OrderStatus.READY_FOR_PICKUP);

  const [selectedOrderId, setSelectedOrderId] = useState<string>(
    pickupOrders[0]?.id || ''
  );
  const [pin, setPin] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);

  const currentOrder = pickupOrders.find((o) => o.id === selectedOrderId) || pickupOrders[0];

  const handleVerifyPin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentOrder) return;
    setError(null);

    if (pin.length !== 4) {
      setError(language === 'hi' ? 'कृपया 4 अंकों का पिकअप पिन दर्ज करें' : 'Please enter 4-digit Pickup PIN');
      return;
    }

    // Verify against order pickupCode if set
    if (currentOrder.pickupCode && currentOrder.pickupCode !== pin) {
      setError(
        language === 'hi'
          ? `गलत पिन! ग्राहक से 4-digit PIN पूछें (Test PIN: ${currentOrder.pickupCode})`
          : `Invalid PIN! Ask customer for 4-digit code (Test PIN: ${currentOrder.pickupCode})`
      );
      return;
    }

    setIsVerifying(true);
    try {
      await onCompletePickup(currentOrder.id, pin);
      confetti({ particleCount: 90, spread: 70, origin: { y: 0.6 } });
      setPin('');
    } catch (err: any) {
      setError(err.message || 'Verification failed');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleKeypadPress = (digit: string) => {
    if (pin.length < 4) {
      setPin((prev) => prev + digit);
    }
  };

  const handleKeypadBackspace = () => {
    setPin((prev) => prev.slice(0, -1));
  };

  if (pickupOrders.length === 0) {
    return (
      <div className="p-6 text-center py-16 space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-blue-50 border border-blue-200 text-blue-700 flex items-center justify-center mx-auto shadow-xs">
          <ShoppingBag className="w-7 h-7" />
        </div>
        <div>
          <h2 className="font-extrabold text-base text-slate-900">
            {language === 'hi' ? 'पिकअप हेतु कोई आर्डर लंबित नहीं है' : 'No Store Pickup Orders Waiting'}
          </h2>
          <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
            {language === 'hi'
              ? 'जैसे ही ग्राहक का आर्डर पैक होकर तैयार होगा, यहाँ पिन सत्यापन हेतु दिखेगा'
              : 'When packed store pickup orders are ready, they will appear here for PIN handover.'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-black text-lg text-slate-900 tracking-tight flex items-center space-x-2">
            <ShoppingBag className="w-5 h-5 text-blue-700" />
            <span>{language === 'hi' ? 'दुकान से पिकअप (Store Pickup)' : 'Store Pickup Queue'}</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            {language === 'hi' ? 'ग्राहक से 4-अंकों का पिन लेकर सामान हैंडओवर करें' : 'Verify customer 4-digit PIN for safe counter handover'}
          </p>
        </div>

        <span className="px-2.5 py-0.5 rounded-full bg-blue-50 border border-blue-200 text-blue-800 text-xs font-bold font-mono">
          {pickupOrders.length} Ready
        </span>
      </div>

      {/* Multiple Orders Tabs */}
      {pickupOrders.length > 1 && (
        <div className="flex space-x-2 overflow-x-auto pb-1 scrollbar-none">
          {pickupOrders.map((ord) => {
            const isSelected = ord.id === currentOrder?.id;
            return (
              <button
                key={ord.id}
                onClick={() => {
                  setSelectedOrderId(ord.id);
                  setPin('');
                  setError(null);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold border shrink-0 transition-all flex items-center space-x-1.5 ${
                  isSelected
                    ? 'bg-blue-600 border-blue-600 text-white shadow-xs'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                <span>{ord.orderNumber}</span>
                <span className={isSelected ? 'text-blue-100 text-[11px]' : 'text-slate-400 text-[11px]'}>
                  ({ord.customerName})
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* Active Pickup Verification Card */}
      {currentOrder && (
        <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-4 shadow-xs">
          {/* Order Details Banner */}
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
            <div className="space-y-0.5">
              <div className="flex items-center space-x-2">
                <span className="font-mono font-black text-base text-slate-900">{currentOrder.orderNumber}</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 border border-blue-200 text-blue-800">
                  Ready for Pickup
                </span>
              </div>
              <div className="flex items-center space-x-2 text-xs text-slate-600">
                <span className="font-bold text-slate-900">{currentOrder.customerName}</span>
                <span className="text-slate-400">•</span>
                <span>{currentOrder.customerPhone}</span>
              </div>
            </div>

            <div className="text-right">
              <div className="font-mono font-black text-sm text-slate-900">
                ₹{currentOrder.financials.customerTotal.toFixed(2)}
              </div>
              <span className="text-[10px] text-slate-500">{currentOrder.items.length} items packed</span>
            </div>
          </div>

          {/* Test PIN Hint */}
          {currentOrder.pickupCode && (
            <div className="p-2.5 rounded-xl bg-blue-50 border border-blue-200 text-xs text-blue-900 flex items-center justify-between">
              <span className="flex items-center space-x-1.5 font-medium">
                <KeyRound className="w-3.5 h-3.5 text-blue-700" />
                <span>Customer Handover PIN:</span>
              </span>
              <span className="font-mono font-black text-sm text-blue-900 bg-white px-2.5 py-0.5 rounded border border-blue-300">
                {currentOrder.pickupCode}
              </span>
            </div>
          )}

          {error && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* PIN Input Displays */}
          <div className="space-y-2 text-center">
            <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block">
              {language === 'hi' ? 'ग्राहक से 4-अंकों का कोड पूछकर दर्ज करें:' : 'Enter 4-Digit Pickup PIN:'}
            </label>

            <div className="flex justify-center space-x-2.5">
              {[0, 1, 2, 3].map((idx) => {
                const char = pin[idx] || '';
                return (
                  <div
                    key={idx}
                    className={`w-12 h-12 rounded-xl border-2 flex items-center justify-center font-mono font-black text-xl transition-all ${
                      char
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-800 shadow-xs'
                        : 'border-slate-200 bg-slate-50 text-slate-400'
                    }`}
                  >
                    {char ? '•' : ''}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Large Touch Keypad for Counter Staff */}
          <div className="grid grid-cols-3 gap-1.5 max-w-xs mx-auto pt-1">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
              <button
                key={digit}
                type="button"
                onClick={() => handleKeypadPress(digit)}
                className="py-3 rounded-xl bg-slate-50 border border-slate-200 hover:bg-slate-100 active:bg-slate-200 font-mono font-bold text-base text-slate-900 transition-all shadow-xs cursor-pointer"
              >
                {digit}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setPin('')}
              className="py-3 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
            >
              Clear
            </button>
            <button
              type="button"
              onClick={() => handleKeypadPress('0')}
              className="py-3 rounded-xl bg-slate-50 border border-slate-200 hover:bg-slate-100 active:bg-slate-200 font-mono font-bold text-base text-slate-900 transition-all cursor-pointer"
            >
              0
            </button>
            <button
              type="button"
              onClick={handleKeypadBackspace}
              className="py-3 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
            >
              ⌫ Del
            </button>
          </div>

          {/* Verify Action Button */}
          <div className="pt-2 border-t border-slate-100 space-y-2">
            <button
              type="button"
              disabled={pin.length !== 4 || isVerifying}
              onClick={handleVerifyPin}
              className={`w-full py-3 px-4 rounded-xl font-black text-xs shadow-sm flex items-center justify-center space-x-2 transition-all cursor-pointer ${
                pin.length === 4
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                  : 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
              }`}
            >
              {isVerifying ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>{language === 'hi' ? 'पिन सत्यापित करें व सामान हैंडओवर करें' : 'Verify PIN & Complete Handover'}</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => onViewOrderDetails(currentOrder)}
              className="w-full text-center text-xs font-bold text-slate-600 hover:text-emerald-700 py-1 cursor-pointer"
            >
              {language === 'hi' ? 'आर्डर की पूरी रसीद देखें →' : 'View Full Receipt →'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

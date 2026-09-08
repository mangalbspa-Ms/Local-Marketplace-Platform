/**
 * Customer Payment Modal
 * 
 * Executes real backend order creation (PLACED) and server-side verified payment flow (CONFIRMED).
 * Frontend never blindly marks an order as paid without backend verification.
 */

import React, { useState } from 'react';
import { useCustomerCart } from '../../../context/CustomerCartContext.tsx';
import { useCustomerAuth } from '../../../context/CustomerAuthContext.tsx';
import { useCustomerLanguage } from '../../../context/CustomerLanguageContext.tsx';
import { customerApi } from '../../../services/customerApi.ts';
import { Order } from '../../../types/order.ts';
import {
  ShieldCheck,
  CreditCard,
  Smartphone,
  Building,
  Lock,
  AlertCircle,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPaymentSuccess: (order: Order) => void;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  onClose,
  onPaymentSuccess,
}) => {
  const {
    shop,
    items,
    fulfillmentType,
    customerNotes,
    finalPayableAmount,
    clearCart,
  } = useCustomerCart();

  const { selectedAddress } = useCustomerAuth();
  const { language, t } = useCustomerLanguage();

  const [paymentMethod, setPaymentMethod] = useState<'UPI' | 'CARD' | 'NET_BANKING'>('UPI');
  const [upiOption, setUpiOption] = useState<'gpay' | 'phonepe' | 'paytm' | 'custom'>('gpay');
  const [customUpiId] = useState('');
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen || !shop || items.length === 0) return null;

  const handlePay = async () => {
    setIsProcessing(true);
    setErrorMessage(null);
    setProcessingStep('Creating order with local mandi server...');

    try {
      // 1. Create Order on backend (starts in PLACED state)
      const orderPayload = {
        shopId: shop.id,
        fulfillmentType,
        deliveryAddressId: selectedAddress?.id,
        customerNotes: customerNotes.trim() || undefined,
        items: items.map((item) => ({
          productId: item.product.id,
          requestedMultiplier: item.multiplier,
          quantityCount: item.quantityCount,
          notes: item.notes,
        })),
      };

      const createdOrder = await customerApi.createOrder(orderPayload);

      // 2. Request Payment Intent from backend
      setProcessingStep('Initializing secure payment gateway...');
      const paymentIntent = await customerApi.createPaymentIntent(createdOrder.id);

      // 3. Simulate customer authentication & biometric approval
      setProcessingStep(t('verifyingPayment'));
      await new Promise((r) => setTimeout(r, 1200));

      // 4. Determine payment method and format signature & gateway ID
      let methodLabel = 'UPI (Google Pay)';
      let paymentPrefix = 'pay_gpay';
      let signaturePrefix = 'sig_valid_gpay';

      if (paymentMethod === 'UPI') {
        if (upiOption === 'phonepe') {
          methodLabel = 'UPI (PhonePe)';
          paymentPrefix = 'pay_phonepe';
          signaturePrefix = 'sig_valid_phonepe';
        } else if (upiOption === 'paytm') {
          methodLabel = 'UPI (Paytm UPI)';
          paymentPrefix = 'pay_paytm';
          signaturePrefix = 'sig_valid_paytm';
        } else if (upiOption === 'custom') {
          methodLabel = `UPI (${customUpiId.trim() || 'Custom UPI'})`;
          paymentPrefix = 'pay_upi';
          signaturePrefix = 'sig_valid_upi';
        } else {
          methodLabel = 'UPI (Google Pay)';
          paymentPrefix = 'pay_gpay';
          signaturePrefix = 'sig_valid_gpay';
        }
      } else if (paymentMethod === 'CARD') {
        methodLabel = 'Credit/Debit Card (Visa/RuPay/Master)';
        paymentPrefix = 'pay_card';
        signaturePrefix = 'sig_valid_card';
      } else if (paymentMethod === 'NET_BANKING') {
        methodLabel = 'Net Banking (Direct Mandi Settlement)';
        paymentPrefix = 'pay_netbanking';
        signaturePrefix = 'sig_valid_netbanking';
      }

      const simulatedPaymentId = `${paymentPrefix}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const simulatedSignature = `${signaturePrefix}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      
      const verificationResult = await customerApi.verifyPayment({
        orderId: createdOrder.id,
        intentId: paymentIntent.intentId,
        gatewayPaymentId: simulatedPaymentId,
        gatewayOrderId: paymentIntent.gatewayOrderId,
        gatewaySignature: simulatedSignature,
        paymentMethod: methodLabel,
      });

      if (!verificationResult.success) {
        throw new Error('Payment verification was rejected by server');
      }

      // 5. Fetch updated confirmed order
      const confirmedOrder = await customerApi.getOrderDetails(createdOrder.id);

      // 6. Confetti & Success Transition
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
      });

      clearCart();
      onPaymentSuccess(confirmedOrder);
    } catch (err: any) {
      console.error('Payment failure', err);
      setErrorMessage(err.message || 'Payment failed. Please try again.');
      setIsProcessing(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200"
      onClick={isProcessing ? undefined : onClose}
    >
      <div
        className="bg-white border border-slate-200 rounded-t-3xl sm:rounded-3xl w-full max-w-md p-5 space-y-4 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">{t('paymentHeader')}</h3>
              <p className="text-[10px] text-slate-500">{t('simulatedGateway')}</p>
            </div>
          </div>
          {!isProcessing && (
            <button
              onClick={onClose}
              className="w-7 h-7 rounded-full bg-slate-100 text-slate-500 hover:text-slate-900 flex items-center justify-center text-xs font-bold"
            >
              ✕
            </button>
          )}
        </div>

        {/* Order & Fulfillment Summary Card */}
        <div className="bg-slate-50 rounded-2xl p-3.5 border border-slate-200 space-y-2">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[10px] text-slate-500 font-medium">Paying to {shop.name}</div>
              <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5 mt-0.5">
                <span>{fulfillmentType === 'HOME_DELIVERY' ? '🏠 Home Delivery' : '🏪 Store Pickup'}</span>
              </div>
            </div>
            <div className="text-right">
              <div className="text-[10px] text-slate-500 font-medium">Total Amount</div>
              <div className="text-base font-bold text-slate-900">₹{finalPayableAmount}</div>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-200 text-[11px] text-slate-600 flex items-center justify-between">
            <span className="truncate max-w-[220px]">
              {fulfillmentType === 'HOME_DELIVERY'
                ? `Deliver to: ${selectedAddress?.streetAddress || 'Saved Address'}, ${selectedAddress?.area || ''}`
                : `Pickup at: ${shop.address}`}
            </span>
            <span className="text-emerald-700 font-bold shrink-0">
              {items.length} {items.length === 1 ? 'item' : 'items'}
            </span>
          </div>
        </div>

        {/* Payment Methods Selection */}
        {!isProcessing ? (
          <div className="space-y-3">
            <div className="text-xs font-bold text-slate-900">{t('choosePaymentMethod')}</div>

            {/* UPI Option */}
            <div
              onClick={() => setPaymentMethod('UPI')}
              className={`p-3.5 rounded-2xl border transition-all cursor-pointer space-y-2.5 ${
                paymentMethod === 'UPI'
                  ? 'bg-emerald-50 border-emerald-500 shadow-xs'
                  : 'bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <Smartphone className={`w-4 h-4 ${paymentMethod === 'UPI' ? 'text-emerald-600' : 'text-slate-500'}`} />
                  <span className="text-xs font-bold text-slate-900">{t('upiGooglePay')}</span>
                </div>
                <div className="w-4 h-4 rounded-full border border-emerald-600 flex items-center justify-center">
                  {paymentMethod === 'UPI' && <div className="w-2 h-2 rounded-full bg-emerald-600" />}
                </div>
              </div>

              {/* UPI Sub-options */}
              {paymentMethod === 'UPI' && (
                <div className="grid grid-cols-3 gap-1.5 pt-1">
                  {[
                    { id: 'gpay', label: 'Google Pay' },
                    { id: 'phonepe', label: 'PhonePe' },
                    { id: 'paytm', label: 'Paytm UPI' },
                  ].map((app) => (
                    <button
                      key={app.id}
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setUpiOption(app.id as any);
                      }}
                      className={`py-1.5 px-2 rounded-xl text-[11px] font-bold border transition-all ${
                        upiOption === app.id
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs'
                          : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      {app.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Card Option */}
            <div
              onClick={() => setPaymentMethod('CARD')}
              className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                paymentMethod === 'CARD'
                  ? 'bg-emerald-50 border-emerald-500 shadow-xs'
                  : 'bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <CreditCard className={`w-4 h-4 ${paymentMethod === 'CARD' ? 'text-emerald-600' : 'text-slate-500'}`} />
                <span className="text-xs font-bold text-slate-900">{t('card')} (Visa / RuPay / Master)</span>
              </div>
              <div className="w-4 h-4 rounded-full border border-emerald-600 flex items-center justify-center">
                {paymentMethod === 'CARD' && <div className="w-2 h-2 rounded-full bg-emerald-600" />}
              </div>
            </div>

            {/* Net Banking Option */}
            <div
              onClick={() => setPaymentMethod('NET_BANKING')}
              className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                paymentMethod === 'NET_BANKING'
                  ? 'bg-emerald-50 border-emerald-500 shadow-xs'
                  : 'bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Building className={`w-4 h-4 ${paymentMethod === 'NET_BANKING' ? 'text-emerald-600' : 'text-slate-500'}`} />
                <span className="text-xs font-bold text-slate-900">{t('netBanking')} (SBI / HDFC / ICICI)</span>
              </div>
              <div className="w-4 h-4 rounded-full border border-emerald-600 flex items-center justify-center">
                {paymentMethod === 'NET_BANKING' && <div className="w-2 h-2 rounded-full bg-emerald-600" />}
              </div>
            </div>

            {errorMessage && (
              <div className="bg-rose-50 border border-rose-200 p-2.5 rounded-xl text-xs text-rose-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Pay Button */}
            <button
              onClick={handlePay}
              className="w-full py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xs active:scale-98 transition-all"
            >
              <Lock className="w-4 h-4" />
              <span>{t('payNow')} (₹{finalPayableAmount})</span>
            </button>
          </div>
        ) : (
          /* Live Processing State */
          <div className="py-8 text-center space-y-4">
            <div className="relative w-14 h-14 mx-auto">
              <div className="w-14 h-14 border-4 border-emerald-100 border-t-emerald-600 rounded-full animate-spin" />
              <ShieldCheck className="w-6 h-6 text-emerald-600 absolute inset-0 m-auto" />
            </div>
            <div className="space-y-1">
              <div className="text-sm font-bold text-slate-900">
                {language === 'hi' ? 'भुगतान प्रक्रियाधीन है...' : 'Processing Transaction...'}
              </div>
              <p className="text-xs text-slate-600 font-medium">{processingStep}</p>
            </div>
            <div className="text-[10px] text-slate-500">
              Please do not close this window while the order is verified.
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

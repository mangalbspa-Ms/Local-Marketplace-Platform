/**
 * Screens 5, 6, 7 — Customer Cart & 3-Step Checkout Flow
 * 
 * Screen 5: Cart review with prominent fulfillment toggle (🏠 Home Delivery vs 🏪 Store Pickup)
 * Screen 6: Delivery / Pickup Details (Step 2 of 3)
 * Screen 7: Payment & Verification (Step 3 of 3)
 */

import React, { useState } from 'react';
import { useCustomerCart } from '../../../context/CustomerCartContext.tsx';
import { useCustomerAuth } from '../../../context/CustomerAuthContext.tsx';
import { useCustomerLanguage } from '../../../context/CustomerLanguageContext.tsx';
import { useCustomerMarket } from '../../../context/CustomerMarketContext.tsx';
import { customerApi } from '../../../services/customerApi.ts';
import { FulfillmentType, Order } from '../../../types/order.ts';
import { AddressSelectionModal } from './AddressSelectionModal.tsx';
import {
  ShoppingBag,
  Trash2,
  Plus,
  Minus,
  MapPin,
  Clock,
  Sparkles,
  AlertCircle,
  CreditCard,
  ArrowRight,
  ArrowLeft,
  Smartphone,
  Building,
  Lock,
  Phone,
  Store,
  Check,
  ShieldCheck,
  Zap,
  Info,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface CartScreenProps {
  onPaymentSuccess?: (order: Order) => void;
  onOpenPayment?: () => void;
  onBrowseShops: () => void;
}

export const CartScreen: React.FC<CartScreenProps> = ({
  onPaymentSuccess,
  onOpenPayment,
  onBrowseShops,
}) => {
  const {
    shop,
    items,
    fulfillmentType,
    setFulfillmentType,
    customerNotes,
    setCustomerNotes,
    updateItemQuantity,
    removeItem,
    clearCart,
    itemCount,
    itemSubtotal,
    deliveryFee,
    platformFee,
    finalPayableAmount,
    isDeliveryFree,
    amountNeededForFreeDelivery,
    meetsMinOrderValueForDelivery,
    minOrderValueDifference,
  } = useCustomerCart();

  const { user, selectedAddress, setSelectedAddress } = useCustomerAuth();
  const { language, t } = useCustomerLanguage();

  // 3-Step Checkout Navigation State: 1 = Cart, 2 = Delivery/Pickup, 3 = Payment
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);

  // Payment Selection State for Step 3
  const [paymentMethod, setPaymentMethod] = useState<'UPI' | 'CARD' | 'NET_BANKING'>('UPI');
  const [upiOption, setUpiOption] = useState<'gpay' | 'phonepe' | 'paytm' | 'custom'>('gpay');
  const [customUpiId, setCustomUpiId] = useState('');

  // Processing state for real sandbox verified payment
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const pickupAvailable = shop?.fulfillment?.pickupEnabled !== false;
  const deliveryAvailable = shop?.fulfillment?.deliveryEnabled !== false;
  const neitherAvailable = !pickupAvailable && !deliveryAvailable;
  const savedAddresses = user?.addresses || [];

  // Automatically ensure selected fulfillment matches shop availability
  React.useEffect(() => {
    if (!shop || items.length === 0) return;
    if (deliveryAvailable && !pickupAvailable && fulfillmentType !== FulfillmentType.HOME_DELIVERY) {
      setFulfillmentType(FulfillmentType.HOME_DELIVERY);
    } else if (pickupAvailable && !deliveryAvailable && fulfillmentType !== FulfillmentType.STORE_PICKUP) {
      setFulfillmentType(FulfillmentType.STORE_PICKUP);
    }
  }, [shop, items.length, deliveryAvailable, pickupAvailable, fulfillmentType, setFulfillmentType]);

  // Empty cart view
  if (!shop || items.length === 0) {
    return (
      <div className="min-h-[75vh] flex flex-col items-center justify-center p-6 text-center space-y-4 bg-white">
        <div className="w-20 h-20 rounded-3xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400 shadow-xs">
          <ShoppingBag className="w-10 h-10 text-slate-400" />
        </div>
        <div className="space-y-1">
          <h2 className="text-base font-bold text-slate-900">
            {language === 'hi' ? 'आपका कार्ट खाली है' : 'Your cart is empty'}
          </h2>
          <p className="text-xs text-slate-500 max-w-xs">
            {language === 'hi'
              ? 'मंडी की दुकानों से ताज़ा सामान अपने कार्ट में जोड़ें'
              : 'Add fresh groceries from local neighborhood shops'}
          </p>
        </div>
        <button
          onClick={onBrowseShops}
          className="px-6 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md transition-all"
        >
          {language === 'hi' ? 'दुकानें देखें' : 'Browse Shops'}
        </button>
      </div>
    );
  }

  // Step 1 -> Step 2 transition
  const handleStep1Next = () => {
    if (neitherAvailable) return;
    if (fulfillmentType === FulfillmentType.HOME_DELIVERY && !selectedAddress && savedAddresses.length === 0) {
      setIsAddressModalOpen(true);
      return;
    }
    if (fulfillmentType === FulfillmentType.HOME_DELIVERY && !selectedAddress && savedAddresses.length > 0) {
      setSelectedAddress(savedAddresses[0]);
    }
    setCurrentStep(2);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Step 2 -> Step 3 transition
  const handleStep2Next = () => {
    if (neitherAvailable) return;
    if (fulfillmentType === FulfillmentType.HOME_DELIVERY) {
      if (!selectedAddress) {
        setIsAddressModalOpen(true);
        return;
      }
      if (!meetsMinOrderValueForDelivery) {
        return;
      }
    }
    setCurrentStep(3);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Step 3: Pay & Place Order execution (verified with server backend)
  const handlePayAndPlaceOrder = async () => {
    if (onOpenPayment && !onPaymentSuccess) {
      onOpenPayment();
      return;
    }

    setIsProcessing(true);
    setErrorMessage(null);
    setProcessingStep(
      language === 'hi' ? 'मंडी सर्वर पर ऑर्डर दर्ज हो रहा है...' : 'Creating order with local mandi server...'
    );

    try {
      // 1. Create order on backend (starts in PLACED state)
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
      setProcessingStep(
        language === 'hi'
          ? 'सुरक्षित पेमेंट गेटवे प्रारंभ हो रहा है...'
          : 'Initializing secure payment gateway...'
      );
      const paymentIntent = await customerApi.createPaymentIntent(createdOrder.id);

      // 3. Simulate payment verification
      setProcessingStep(language === 'hi' ? 'भुगतान सत्यापित किया जा रहा है...' : 'Verifying payment...');
      await new Promise((r) => setTimeout(r, 1000));

      // 4. Format payment method signature and identifiers
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

      // 5. Fetch confirmed updated order with pickup PIN
      const confirmedOrder = await customerApi.getOrderDetails(createdOrder.id);

      // 6. Confetti celebration
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
      });

      clearCart();
      if (onPaymentSuccess) {
        onPaymentSuccess(confirmedOrder);
      }
    } catch (err: any) {
      console.error('Payment failure', err);
      setErrorMessage(err.message || 'Payment failed. Please try again.');
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-4 p-4 pb-36 bg-white min-h-screen">
      {/* ---------------------------------------------------- */}
      {/* TOP HEADER & BACK NAVIGATION                         */}
      {/* ---------------------------------------------------- */}
      <div className="flex items-center justify-between gap-2 pb-2 border-b border-slate-200">
        <button
          type="button"
          onClick={() => {
            if (currentStep === 1) {
              onBrowseShops();
            } else if (currentStep === 2) {
              setCurrentStep(1);
            } else {
              setCurrentStep(2);
            }
          }}
          className="flex items-center gap-1 text-xs font-bold text-slate-700 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>
            {currentStep === 1
              ? language === 'hi' ? 'दुकानें' : 'Shops'
              : currentStep === 2
              ? language === 'hi' ? 'कार्ट' : 'Cart'
              : language === 'hi' ? 'डिलीवरी' : 'Delivery'}
          </span>
        </button>

        <h1 className="text-sm font-black text-slate-900 text-center truncate">
          {currentStep === 1
            ? language === 'hi' ? 'मेरा कार्ट' : 'My Cart'
            : currentStep === 2
            ? language === 'hi' ? 'डिलीवरी / पिकअप' : 'Delivery / Pickup'
            : language === 'hi' ? 'सुरक्षित भुगतान' : 'Secure Payment'}
        </h1>

        <div className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
          Step {currentStep} of 3
        </div>
      </div>

      {/* ---------------------------------------------------- */}
      {/* 3-STEP PROGRESS STEPPER INDICATOR                     */}
      {/* ---------------------------------------------------- */}
      <div className="grid grid-cols-3 gap-2 bg-slate-50 p-1.5 rounded-2xl border border-slate-200">
        {/* Step 1 */}
        <button
          type="button"
          onClick={() => setCurrentStep(1)}
          className={`py-1.5 px-2 rounded-xl text-center transition-all ${
            currentStep === 1
              ? 'bg-emerald-600 text-white font-bold shadow-xs'
              : currentStep > 1
              ? 'bg-emerald-100 text-emerald-900 font-bold'
              : 'text-slate-500 font-medium'
          }`}
        >
          <div className="text-[10px] uppercase">Step 1</div>
          <div className="text-[11px] truncate">① {language === 'hi' ? 'सामान' : 'Items'}</div>
        </button>

        {/* Step 2 */}
        <button
          type="button"
          onClick={() => {
            if (currentStep > 2) setCurrentStep(2);
          }}
          disabled={currentStep < 2}
          className={`py-1.5 px-2 rounded-xl text-center transition-all ${
            currentStep === 2
              ? 'bg-emerald-600 text-white font-bold shadow-xs'
              : currentStep > 2
              ? 'bg-emerald-100 text-emerald-900 font-bold'
              : 'text-slate-400 font-medium'
          }`}
        >
          <div className="text-[10px] uppercase">Step 2</div>
          <div className="text-[11px] truncate">② {language === 'hi' ? 'डिलीवरी' : 'Delivery'}</div>
        </button>

        {/* Step 3 */}
        <button
          type="button"
          disabled={currentStep < 3}
          className={`py-1.5 px-2 rounded-xl text-center transition-all ${
            currentStep === 3
              ? 'bg-emerald-600 text-white font-bold shadow-xs'
              : 'text-slate-400 font-medium'
          }`}
        >
          <div className="text-[10px] uppercase">Step 3</div>
          <div className="text-[11px] truncate">③ {language === 'hi' ? 'भुगतान' : 'Payment'}</div>
        </button>
      </div>

      {/* ==================================================== */}
      {/* SCREEN 5 (STEP 1): CART ITEMS & FULFILLMENT SELECTOR */}
      {/* ==================================================== */}
      {currentStep === 1 && (
        <div className="space-y-4 animate-in fade-in duration-150">
          {/* Shop Card */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 flex items-center justify-between">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
                <Store className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-bold text-slate-900 truncate flex items-center gap-1">
                  <span>{shop.name}</span>
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                </div>
                <div className="text-[10px] text-slate-500 truncate">{shop.address}</div>
              </div>
            </div>

            <button
              type="button"
              onClick={clearCart}
              className="text-[11px] font-bold text-rose-600 hover:text-rose-700 flex items-center gap-1 shrink-0 p-1"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>{language === 'hi' ? 'खाली करें' : 'Clear'}</span>
            </button>
          </div>

          {/* Product Rows List */}
          <div className="space-y-2.5">
            <div className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              {language === 'hi' ? 'कार्ट के सामान' : 'Cart Items'} ({itemCount})
            </div>

            <div className="space-y-2">
              {items.map((item) => (
                <div
                  key={`${item.product.id}_${item.multiplier}`}
                  className="bg-white border border-slate-200 rounded-2xl p-3 shadow-2xs flex items-center gap-3"
                >
                  {/* Thumbnail */}
                  <div className="w-16 h-16 rounded-xl bg-slate-100 overflow-hidden border border-slate-100 shrink-0">
                    {item.product.imageUrl && item.product.imageUrl.trim() !== '' ? (
                      <img
                        src={item.product.imageUrl}
                        alt={item.product.name}
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-xl">🛒</div>
                    )}
                  </div>

                  {/* Details */}
                  <div className="min-w-0 flex-1 space-y-0.5">
                    <h3 className="text-xs font-bold text-slate-900 truncate">
                      {language === 'hi' && item.product.nameHindi
                        ? item.product.nameHindi
                        : item.product.name}
                    </h3>
                    <div className="text-[11px] text-emerald-700 font-bold">{item.displayLabel}</div>
                    <div className="text-xs font-extrabold text-slate-900">₹{item.lineTotal}</div>
                  </div>

                  {/* Stepper & Delete */}
                  <div className="flex items-center gap-2 shrink-0">
                    <div className="flex items-center gap-1 bg-slate-100 border border-slate-200 rounded-xl p-0.5">
                      <button
                        type="button"
                        onClick={() =>
                          updateItemQuantity(item.product.id, item.multiplier, Math.max(0, item.quantityCount - 1))
                        }
                        className="w-6 h-6 rounded-lg bg-white text-slate-800 flex items-center justify-center font-bold text-xs shadow-2xs"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="w-4 text-center text-xs font-bold text-slate-900">
                        {item.quantityCount}
                      </span>
                      <button
                        type="button"
                        onClick={() => updateItemQuantity(item.product.id, item.multiplier, item.quantityCount + 1)}
                        className="w-6 h-6 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold text-xs shadow-2xs"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => removeItem(item.product.id, item.multiplier)}
                      className="text-slate-400 hover:text-rose-600 p-1 transition-colors"
                      title="Remove item"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ---------------------------------------------------- */}
          {/* PROMINENT FULFILLMENT SELECTOR BEFORE PAYMENT        */}
          {/* ---------------------------------------------------- */}
          <div className="space-y-2 pt-2">
            <div className="text-xs font-bold text-slate-900">
              {language === 'hi' ? 'आप सामान कैसे प्राप्त करना चाहते हैं?' : 'How do you want your order?'}
            </div>

            {neitherAvailable ? (
              <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
                <span>
                  {language === 'hi'
                    ? 'यह दुकान वर्तमान में कोई नया ऑर्डर (डिलीवरी/पिकअप) स्वीकार नहीं कर रही है।'
                    : 'This shop is currently not accepting new delivery or pickup orders.'}
                </span>
              </div>
            ) : deliveryAvailable && pickupAvailable ? (
              <div className="grid grid-cols-2 gap-3">
                {/* Option 1: 🏠 घर पर मंगाएँ (Home Delivery) */}
                <button
                  type="button"
                  onClick={() => setFulfillmentType(FulfillmentType.HOME_DELIVERY)}
                  className={`p-3.5 rounded-2xl border text-left transition-all ${
                    fulfillmentType === FulfillmentType.HOME_DELIVERY
                      ? 'bg-emerald-50 border-2 border-emerald-600 shadow-xs'
                      : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="text-2xl">🏠</div>
                    {fulfillmentType === FulfillmentType.HOME_DELIVERY && (
                      <div className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center">
                        <Check className="w-3.5 h-3.5" />
                      </div>
                    )}
                  </div>
                  <div className="text-xs font-bold text-slate-900 mt-2">
                    {language === 'hi' ? 'घर पर मंगाएँ' : 'Home Delivery'}
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5">
                    {language === 'hi' ? 'आपके पते पर डिलीवरी' : 'Delivered to your doorstep'}
                  </div>
                  <div className="text-[10px] font-bold text-emerald-700 mt-1">
                    {isDeliveryFree ? (language === 'hi' ? 'मुफ्त डिलीवरी' : 'Free Delivery') : `शुल्क ₹${deliveryFee}`}
                  </div>
                </button>

                {/* Option 2: 🏪 दुकान से पिकअप करें (Store Pickup) */}
                <button
                  type="button"
                  onClick={() => setFulfillmentType(FulfillmentType.STORE_PICKUP)}
                  className={`p-3.5 rounded-2xl border text-left transition-all ${
                    fulfillmentType === FulfillmentType.STORE_PICKUP
                      ? 'bg-emerald-50 border-2 border-emerald-600 shadow-xs'
                      : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="text-2xl">🏪</div>
                    {fulfillmentType === FulfillmentType.STORE_PICKUP && (
                      <div className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center">
                        <Check className="w-3.5 h-3.5" />
                      </div>
                    )}
                  </div>
                  <div className="text-xs font-bold text-slate-900 mt-2">
                    {language === 'hi' ? 'दुकान से पिकअप' : 'Store Pickup'}
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5">
                    {language === 'hi' ? '४-अंकों का पिन दिखाकर लें' : 'Pick up at counter with PIN'}
                  </div>
                  <div className="text-[10px] font-bold text-emerald-700 mt-1">
                    {language === 'hi' ? 'डिलीवरी शुल्क ₹0' : 'Delivery Fee ₹0'}
                  </div>
                </button>
              </div>
            ) : deliveryAvailable ? (
              <div className="p-3.5 rounded-2xl bg-emerald-50/80 border-2 border-emerald-600 shadow-xs flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="text-3xl">🏠</div>
                  <div>
                    <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                      <span>{language === 'hi' ? 'घर पर डिलीवरी' : 'Home Delivery'}</span>
                      <span className="text-[10px] bg-emerald-600 text-white px-2 py-0.5 rounded-full font-bold">
                        {language === 'hi' ? 'केवल डिलीवरी उपलब्ध' : 'Delivery Only'}
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-500 mt-0.5">
                      {language === 'hi' ? 'दुकान से पिकअप उपलब्ध नहीं है' : 'Store pickup is not available for this shop'}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs font-black text-emerald-700">
                    {isDeliveryFree ? (language === 'hi' ? 'मुफ्त' : 'FREE') : `₹${deliveryFee}`}
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-3.5 rounded-2xl bg-blue-50/80 border-2 border-blue-600 shadow-xs flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="text-3xl">🏪</div>
                  <div>
                    <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                      <span>{language === 'hi' ? 'दुकान से पिकअप' : 'Store Pickup'}</span>
                      <span className="text-[10px] bg-blue-600 text-white px-2 py-0.5 rounded-full font-bold">
                        {language === 'hi' ? 'केवल पिकअप उपलब्ध' : 'Pickup Only'}
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-500 mt-0.5">
                      {language === 'hi' ? 'घर पर डिलीवरी उपलब्ध नहीं है' : 'Home delivery is not available for this shop'}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs font-black text-blue-700">
                    {language === 'hi' ? 'शुल्क ₹0' : 'FREE ₹0'}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Free delivery threshold incentive */}
          {fulfillmentType === FulfillmentType.HOME_DELIVERY && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-2.5 text-xs text-emerald-900 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>
                {isDeliveryFree
                  ? language === 'hi'
                    ? 'बधाई! आपको इस ऑर्डर पर मुफ्त डिलीवरी मिल रही है 🎉'
                    : 'Congratulations! You qualify for FREE Delivery 🎉'
                  : language === 'hi'
                  ? `मुफ्त डिलीवरी के लिए ₹${amountNeededForFreeDelivery} का सामान और जोड़ें`
                  : `Add ₹${amountNeededForFreeDelivery} more for FREE delivery`}
              </span>
            </div>
          )}

          {/* Customer Special Instructions Note */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-700">
              {language === 'hi' ? 'दुकानदार के लिए विशेष निर्देश (वैकल्पिक)' : 'Special Instructions for Shopkeeper'}
            </label>
            <input
              type="text"
              value={customerNotes}
              onChange={(e) => setCustomerNotes(e.target.value)}
              placeholder={language === 'hi' ? 'उदा. ताज़ा धनिया देना, पके हुए टमाटर...' : 'e.g. Please send fresh coriander...'}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-hidden focus:border-emerald-500"
            />
          </div>

          {/* Order Bill Summary */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 space-y-2">
            <div className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              {language === 'hi' ? 'बिल विवरण' : 'Bill Summary'}
            </div>

            <div className="space-y-1.5 text-xs text-slate-600">
              <div className="flex justify-between">
                <span>{language === 'hi' ? 'सामान कुल' : 'Item Total'}</span>
                <span className="font-bold text-slate-900">₹{itemSubtotal}</span>
              </div>
              <div className="flex justify-between">
                <span>{language === 'hi' ? 'डिलीवरी शुल्क' : 'Delivery Fee'}</span>
                <span className="font-bold text-slate-900">
                  {fulfillmentType === FulfillmentType.STORE_PICKUP || isDeliveryFree
                    ? '₹0 (मुफ्त)'
                    : `₹${deliveryFee}`}
                </span>
              </div>
              <div className="flex justify-between">
                <span>{language === 'hi' ? 'प्लेटफॉर्म शुल्क' : 'Platform Fee'}</span>
                <span className="font-bold text-slate-900">₹{platformFee}</span>
              </div>
              <div className="flex justify-between text-emerald-700 font-bold">
                <span>{language === 'hi' ? 'छूट' : 'Discounts'}</span>
                <span>-₹0</span>
              </div>
              <div className="pt-2 border-t border-slate-200 flex justify-between text-sm font-black text-slate-900">
                <span>{language === 'hi' ? 'कुल भुगतान' : 'Total Payable'}</span>
                <span>₹{finalPayableAmount}</span>
              </div>
            </div>
          </div>

          {/* Bottom Sticky Action Bar */}
          <div className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-200 p-4 shadow-xl max-w-md mx-auto">
            <button
              type="button"
              onClick={handleStep1Next}
              className="w-full py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-md active:scale-98 transition-all"
            >
              <span>{language === 'hi' ? 'आगे बढ़ें (डिलीवरी विवरण)' : 'Proceed to Delivery'}</span>
              <span className="bg-emerald-800/40 px-2 py-0.5 rounded-md">₹{finalPayableAmount}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* SCREEN 6 (STEP 2): DELIVERY / PICKUP DETAILS         */}
      {/* ==================================================== */}
      {currentStep === 2 && (
        <div className="space-y-4 animate-in fade-in duration-150">
          <div className="text-xs font-bold text-slate-900">
            {language === 'hi' ? 'आप सामान कैसे प्राप्त करना चाहते हैं?' : 'How do you want your order?'}
          </div>

          {/* 1. Fulfillment Mode Selector Cards */}
          {deliveryAvailable && pickupAvailable ? (
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setFulfillmentType(FulfillmentType.HOME_DELIVERY)}
                className={`p-3 rounded-2xl border text-left transition-all ${
                  fulfillmentType === FulfillmentType.HOME_DELIVERY
                    ? 'bg-emerald-50 border-2 border-emerald-600 shadow-xs'
                    : 'bg-white border-slate-200'
                }`}
              >
                <div className="text-xl">🏠</div>
                <div className="text-xs font-bold text-slate-900 mt-1">
                  {language === 'hi' ? 'घर पर मंगाएँ' : 'Home Delivery'}
                </div>
                <div className="text-[10px] text-slate-500">
                  {shop.fulfillment?.estimatedPreparationTimeMinutes ? `${shop.fulfillment.estimatedPreparationTimeMinutes + 10} min ETA` : '20–30 min ETA'}
                </div>
              </button>

              <button
                type="button"
                onClick={() => setFulfillmentType(FulfillmentType.STORE_PICKUP)}
                className={`p-3 rounded-2xl border text-left transition-all ${
                  fulfillmentType === FulfillmentType.STORE_PICKUP
                    ? 'bg-emerald-50 border-2 border-emerald-600 shadow-xs'
                    : 'bg-white border-slate-200'
                }`}
              >
                <div className="text-xl">🏪</div>
                <div className="text-xs font-bold text-slate-900 mt-1">
                  {language === 'hi' ? 'दुकान से पिकअप' : 'Store Pickup'}
                </div>
                <div className="text-[10px] text-emerald-700 font-bold">शुल्क ₹0 FREE</div>
              </button>
            </div>
          ) : deliveryAvailable ? (
            <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-300 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="text-2xl">🏠</span>
                <div>
                  <div className="text-xs font-bold text-slate-900">
                    {language === 'hi' ? 'घर पर होम डिलीवरी' : 'Home Delivery'}
                  </div>
                  <div className="text-[10px] text-slate-500">
                    {language === 'hi' ? 'दुकानदार द्वारा सुरक्षित डिलीवरी' : 'Delivered directly to your address'}
                  </div>
                </div>
              </div>
              <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-md">
                {isDeliveryFree ? (language === 'hi' ? 'मुफ्त' : 'FREE') : `₹${deliveryFee}`}
              </span>
            </div>
          ) : pickupAvailable ? (
            <div className="p-3 rounded-2xl bg-blue-50 border border-blue-300 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="text-2xl">🏪</span>
                <div>
                  <div className="text-xs font-bold text-slate-900">
                    {language === 'hi' ? 'दुकान से पिकअप' : 'Store Counter Pickup'}
                  </div>
                  <div className="text-[10px] text-slate-500">
                    {language === 'hi' ? '४-अंकों का पिन दिखाकर काउंटर से लें' : 'Show PIN at counter for instant pickup'}
                  </div>
                </div>
              </div>
              <span className="text-[10px] font-bold text-blue-800 bg-blue-100 px-2 py-0.5 rounded-md">
                {language === 'hi' ? 'शुल्क ₹0' : 'FREE ₹0'}
              </span>
            </div>
          ) : null}

          {/* 2. Specific Fulfillment Details */}
          {fulfillmentType === FulfillmentType.HOME_DELIVERY ? (
            /* Home Delivery Address Card */
            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-emerald-600" />
                  <span className="text-xs font-bold text-slate-900">
                    {language === 'hi' ? 'डिलीवरी पता' : 'Delivery Address'}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => setIsAddressModalOpen(true)}
                  className="text-xs font-bold text-emerald-700 hover:text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200"
                >
                  {language === 'hi' ? 'पता बदलें' : 'Change Address'}
                </button>
              </div>

              {selectedAddress ? (
                <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 space-y-1 text-xs">
                  <div className="font-bold text-slate-900 flex items-center gap-1.5">
                    <span>{selectedAddress.receiverName || user?.fullName}</span>
                    <span className="text-[10px] font-medium text-slate-500">
                      ({selectedAddress.receiverPhone || user?.phone})
                    </span>
                  </div>
                  <div className="text-slate-600 leading-relaxed">
                    {selectedAddress.streetAddress}, {selectedAddress.area}, Mumbai
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsAddressModalOpen(true)}
                  className="w-full py-3 bg-amber-50 border border-amber-300 rounded-xl text-xs font-bold text-amber-800 flex items-center justify-center gap-1.5"
                >
                  <AlertCircle className="w-4 h-4 text-amber-600" />
                  <span>{language === 'hi' ? 'कृपया डिलीवरी पता जोड़ें' : 'Please add a delivery address'}</span>
                </button>
              )}

              {/* Min order validation warning */}
              {!meetsMinOrderValueForDelivery && (
                <div className="bg-amber-50 border border-amber-300 rounded-xl p-2.5 text-xs text-amber-900 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>
                    {language === 'hi'
                      ? `होम डिलीवरी के लिए न्यूनतम ऑर्डर ₹${shop.fulfillment?.minOrderValueForDelivery} है। कृपया ₹${minOrderValueDifference} का सामान और जोड़ें।`
                      : `Minimum order for delivery is ₹${shop.fulfillment?.minOrderValueForDelivery}. Add ₹${minOrderValueDifference} more.`}
                  </span>
                </div>
              )}

              <div className="flex items-center gap-2 text-xs text-slate-600 pt-1">
                <Clock className="w-4 h-4 text-emerald-600" />
                <span>
                  {language === 'hi'
                    ? `अनुमानित डिलीवरी समय: ${shop.fulfillment?.estimatedPreparationTimeMinutes ? shop.fulfillment.estimatedPreparationTimeMinutes + 10 : 25} मिनट`
                    : `Estimated Delivery Time: ${shop.fulfillment?.estimatedPreparationTimeMinutes ? shop.fulfillment.estimatedPreparationTimeMinutes + 10 : 25} minutes`}
                </span>
              </div>
            </div>
          ) : (
            /* Store Pickup Details Card */
            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
                  <Store className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-900">{shop.name}</h3>
                  <p className="text-[11px] text-slate-500">{shop.address}</p>
                </div>
              </div>

              {shop.phone && (
                <div className="flex items-center gap-1.5 text-xs text-slate-700 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                  <Phone className="w-3.5 h-3.5 text-emerald-600" />
                  <span>दुकान फोन: {shop.phone}</span>
                </div>
              )}

              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-xs text-emerald-900 space-y-1">
                <div className="font-bold flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                  <span>{language === 'hi' ? 'पिकअप निर्देश' : 'Pickup Instructions'}</span>
                </div>
                <p className="text-[11px] text-emerald-800 leading-relaxed">
                  {shop.fulfillment?.pickupInstructions || (
                    language === 'hi'
                      ? 'ऑर्डर तैयार होने पर आपको ४-अंकों का सुरक्षित पिकअप पिन मिलेगा। दुकान के काउंटर पर यह पिन दिखाकर तुरंत सामान लें।'
                      : 'A 4-digit verification PIN will be generated. Show it at the counter for zero-wait instant collection.'
                  )}
                </p>
                {shop.fulfillment?.estimatedPreparationTimeMinutes && (
                  <div className="text-[11px] text-emerald-700 font-bold pt-1">
                    ⏱ {language === 'hi' ? `तैयारी समय: ~${shop.fulfillment.estimatedPreparationTimeMinutes} मिनट` : `Prep time: ~${shop.fulfillment.estimatedPreparationTimeMinutes} mins`}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Bottom Sticky Action Bar */}
          <div className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-200 p-4 shadow-xl max-w-md mx-auto">
            <button
              type="button"
              disabled={neitherAvailable || (fulfillmentType === FulfillmentType.HOME_DELIVERY && !meetsMinOrderValueForDelivery)}
              onClick={handleStep2Next}
              className={`w-full py-3.5 rounded-2xl font-extrabold text-xs flex items-center justify-center gap-2 shadow-md active:scale-98 transition-all ${
                neitherAvailable || (fulfillmentType === FulfillmentType.HOME_DELIVERY && !meetsMinOrderValueForDelivery)
                  ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white'
              }`}
            >
              <span>{language === 'hi' ? 'आगे बढ़ें (भुगतान)' : 'Proceed to Payment'}</span>
              <span className="bg-emerald-800/40 px-2 py-0.5 rounded-md">₹{finalPayableAmount}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* SCREEN 7 (STEP 3): SECURE PAYMENT & UPI OPTIONS      */}
      {/* ==================================================== */}
      {currentStep === 3 && (
        <div className="space-y-4 animate-in fade-in duration-150">
          {/* Order Summary Pill */}
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3 flex items-center justify-between text-xs">
            <div>
              <div className="font-bold text-slate-900">{shop.name}</div>
              <div className="text-[11px] text-emerald-800">
                {itemCount} {language === 'hi' ? 'सामान' : 'items'} •{' '}
                {fulfillmentType === FulfillmentType.STORE_PICKUP
                  ? language === 'hi' ? 'दुकान पिकअप' : 'Store Pickup'
                  : language === 'hi' ? 'होम डिलीवरी' : 'Home Delivery'}
              </div>
            </div>
            <div className="text-base font-black text-slate-900">₹{finalPayableAmount}</div>
          </div>

          {/* Heading */}
          <div className="text-xs font-bold text-slate-900 uppercase tracking-wider">
            {language === 'hi' ? 'भुगतान का तरीका चुनें' : 'Select Payment Method'}
          </div>

          {/* 1. UPI Payment Options */}
          <div className="bg-white border border-slate-200 rounded-2xl p-3.5 space-y-3 shadow-2xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-emerald-600" />
                <span className="text-xs font-bold text-slate-900">UPI Payments (Instant)</span>
              </div>
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                Fastest
              </span>
            </div>

            <div className="space-y-2">
              {/* Google Pay */}
              <button
                type="button"
                onClick={() => {
                  setPaymentMethod('UPI');
                  setUpiOption('gpay');
                }}
                className={`w-full p-2.5 rounded-xl border flex items-center justify-between transition-all ${
                  paymentMethod === 'UPI' && upiOption === 'gpay'
                    ? 'bg-emerald-50 border-2 border-emerald-600'
                    : 'bg-slate-50 border-slate-200'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-white border border-slate-200 flex items-center justify-center font-black text-xs text-blue-600 shadow-2xs">
                    G
                  </div>
                  <span className="text-xs font-bold text-slate-900">Google Pay</span>
                </div>
                <div
                  className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                    paymentMethod === 'UPI' && upiOption === 'gpay'
                      ? 'border-emerald-600 bg-emerald-600 text-white'
                      : 'border-slate-300'
                  }`}
                >
                  {paymentMethod === 'UPI' && upiOption === 'gpay' && <Check className="w-3 h-3" />}
                </div>
              </button>

              {/* PhonePe */}
              <button
                type="button"
                onClick={() => {
                  setPaymentMethod('UPI');
                  setUpiOption('phonepe');
                }}
                className={`w-full p-2.5 rounded-xl border flex items-center justify-between transition-all ${
                  paymentMethod === 'UPI' && upiOption === 'phonepe'
                    ? 'bg-emerald-50 border-2 border-emerald-600'
                    : 'bg-slate-50 border-slate-200'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-purple-600 text-white flex items-center justify-center font-black text-xs shadow-2xs">
                    पे
                  </div>
                  <span className="text-xs font-bold text-slate-900">PhonePe UPI</span>
                </div>
                <div
                  className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                    paymentMethod === 'UPI' && upiOption === 'phonepe'
                      ? 'border-emerald-600 bg-emerald-600 text-white'
                      : 'border-slate-300'
                  }`}
                >
                  {paymentMethod === 'UPI' && upiOption === 'phonepe' && <Check className="w-3 h-3" />}
                </div>
              </button>

              {/* Paytm */}
              <button
                type="button"
                onClick={() => {
                  setPaymentMethod('UPI');
                  setUpiOption('paytm');
                }}
                className={`w-full p-2.5 rounded-xl border flex items-center justify-between transition-all ${
                  paymentMethod === 'UPI' && upiOption === 'paytm'
                    ? 'bg-emerald-50 border-2 border-emerald-600'
                    : 'bg-slate-50 border-slate-200'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-sky-500 text-white flex items-center justify-center font-black text-[10px] shadow-2xs">
                    Paytm
                  </div>
                  <span className="text-xs font-bold text-slate-900">Paytm UPI</span>
                </div>
                <div
                  className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                    paymentMethod === 'UPI' && upiOption === 'paytm'
                      ? 'border-emerald-600 bg-emerald-600 text-white'
                      : 'border-slate-300'
                  }`}
                >
                  {paymentMethod === 'UPI' && upiOption === 'paytm' && <Check className="w-3 h-3" />}
                </div>
              </button>
            </div>
          </div>

          {/* 2. Card & NetBanking Options */}
          <div className="space-y-2">
            {/* Card */}
            <button
              type="button"
              onClick={() => setPaymentMethod('CARD')}
              className={`w-full p-3 rounded-2xl border flex items-center justify-between transition-all ${
                paymentMethod === 'CARD'
                  ? 'bg-emerald-50 border-2 border-emerald-600 shadow-2xs'
                  : 'bg-white border-slate-200'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <CreditCard className="w-4 h-4 text-emerald-600" />
                <span className="text-xs font-bold text-slate-900">
                  Credit / Debit Card (Visa / RuPay / Master)
                </span>
              </div>
              <div
                className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                  paymentMethod === 'CARD'
                    ? 'border-emerald-600 bg-emerald-600 text-white'
                    : 'border-slate-300'
                }`}
              >
                {paymentMethod === 'CARD' && <Check className="w-3 h-3" />}
              </div>
            </button>

            {/* NetBanking */}
            <button
              type="button"
              onClick={() => setPaymentMethod('NET_BANKING')}
              className={`w-full p-3 rounded-2xl border flex items-center justify-between transition-all ${
                paymentMethod === 'NET_BANKING'
                  ? 'bg-emerald-50 border-2 border-emerald-600 shadow-2xs'
                  : 'bg-white border-slate-200'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Building className="w-4 h-4 text-emerald-600" />
                <span className="text-xs font-bold text-slate-900">
                  Net Banking (SBI / HDFC / ICICI)
                </span>
              </div>
              <div
                className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                  paymentMethod === 'NET_BANKING'
                    ? 'border-emerald-600 bg-emerald-600 text-white'
                    : 'border-slate-300'
                }`}
              >
                {paymentMethod === 'NET_BANKING' && <Check className="w-3 h-3" />}
              </div>
            </button>
          </div>

          {/* Security Assurance */}
          <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-500 pt-1">
            <Lock className="w-3.5 h-3.5 text-emerald-600" />
            <span>256-Bit SSL Encrypted • Direct Mandi Settlement</span>
          </div>

          {/* Error Message if any */}
          {errorMessage && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-bold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Bottom Sticky Payment Button */}
          <div className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-200 p-4 shadow-xl max-w-md mx-auto">
            <button
              type="button"
              disabled={isProcessing}
              onClick={handlePayAndPlaceOrder}
              className="w-full py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-md active:scale-98 transition-all"
            >
              {isProcessing ? (
                <span>{processingStep || 'Processing...'}</span>
              ) : (
                <>
                  <Lock className="w-4 h-4" />
                  <span>
                    {language === 'hi'
                      ? `₹${finalPayableAmount} का भुगतान करें`
                      : `Pay ₹${finalPayableAmount} & Confirm`}
                  </span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Address Selection Modal */}
      <AddressSelectionModal
        isOpen={isAddressModalOpen}
        onClose={() => setIsAddressModalOpen(false)}
      />
    </div>
  );
};

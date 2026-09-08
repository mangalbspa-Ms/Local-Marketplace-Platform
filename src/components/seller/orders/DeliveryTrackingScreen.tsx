/**
 * Home Delivery Tracking Screen (Screen 9)
 * Manage delivery orders, recipient directions, dispatching, and completion.
 */

import React, { useState } from 'react';
import {
  Truck,
  MapPin,
  Phone,
  CheckCircle2,
  Clock,
  Navigation,
  User,
  ShoppingBag,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { Order, OrderStatus, FulfillmentType } from '../../../types/order.ts';
import { useSellerLanguage } from '../../../context/SellerLanguageContext.tsx';
import confetti from 'canvas-confetti';

interface DeliveryTrackingScreenProps {
  orders: Order[];
  onUpdateStatus: (orderId: string, targetStatus: OrderStatus, note?: string) => Promise<void>;
  onViewOrderDetails: (order: Order) => void;
}

export const DeliveryTrackingScreen: React.FC<DeliveryTrackingScreenProps> = ({
  orders,
  onUpdateStatus,
  onViewOrderDetails,
}) => {
  const { language, t } = useSellerLanguage();

  const deliveryOrders = orders.filter(
    (o) => o.fulfillmentType === FulfillmentType.HOME_DELIVERY
  );

  const [activeTab, setActiveTab] = useState<'ACTIVE' | 'DELIVERED'>('ACTIVE');
  const [isUpdating, setIsUpdating] = useState(false);

  const activeOrders = deliveryOrders.filter(
    (o) => o.status !== OrderStatus.COMPLETED && o.status !== OrderStatus.CANCELLED
  );
  const completedOrders = deliveryOrders.filter(
    (o) => o.status === OrderStatus.COMPLETED
  );

  const displayedOrders = activeTab === 'ACTIVE' ? activeOrders : completedOrders;

  const handleMarkDelivered = async (orderId: string) => {
    setIsUpdating(true);
    try {
      await onUpdateStatus(orderId, OrderStatus.COMPLETED, 'Handed over at customer doorstep');
      confetti({ particleCount: 70, spread: 60, origin: { y: 0.6 } });
    } catch (err) {
      console.error('Failed to mark delivered', err);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDispatch = async (orderId: string) => {
    setIsUpdating(true);
    try {
      await onUpdateStatus(orderId, OrderStatus.OUT_FOR_DELIVERY, 'Dispatched with delivery person');
    } catch (err) {
      console.error('Failed to dispatch', err);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-black text-xl text-white tracking-tight flex items-center space-x-2">
            <Truck className="w-5 h-5 text-purple-400" />
            <span>{language === 'hi' ? 'होम डिलीवरी प्रबंधन' : 'Home Delivery Dispatch'}</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            {language === 'hi' ? 'ग्राहक के पते पर डिलीवरी व स्थिति अपडेट' : 'Customer addresses & dispatch status'}
          </p>
        </div>

        <span className="px-2.5 py-1 rounded-full bg-purple-950 border border-purple-800 text-purple-300 text-xs font-bold font-mono">
          {activeOrders.length} Active
        </span>
      </div>

      {/* Tabs Filter */}
      <div className="flex p-1 bg-slate-900 rounded-2xl border border-slate-800">
        <button
          onClick={() => setActiveTab('ACTIVE')}
          className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'ACTIVE'
              ? 'bg-purple-600 text-white shadow-md'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          {language === 'hi' ? `सक्रिय डिलीवरी (${activeOrders.length})` : `Active Deliveries (${activeOrders.length})`}
        </button>
        <button
          onClick={() => setActiveTab('DELIVERED')}
          className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'DELIVERED'
              ? 'bg-purple-600 text-white shadow-md'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          {language === 'hi' ? `पूर्ण डिलीवरी (${completedOrders.length})` : `Delivered History (${completedOrders.length})`}
        </button>
      </div>

      {/* Orders List */}
      {displayedOrders.length === 0 ? (
        <div className="p-8 text-center bg-slate-900 border border-slate-800 rounded-3xl space-y-3">
          <Truck className="w-8 h-8 text-slate-600 mx-auto" />
          <p className="text-xs text-slate-400 font-medium">
            {language === 'hi' ? 'इस श्रेणी में कोई आर्डर नहीं है' : 'No delivery orders in this section'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {displayedOrders.map((order) => {
            const isOutForDelivery = order.status === OrderStatus.OUT_FOR_DELIVERY;
            const isCompleted = order.status === OrderStatus.COMPLETED;

            return (
              <div
                key={order.id}
                className="bg-slate-900 border border-slate-800 rounded-3xl p-4 sm:p-5 space-y-4 shadow-md"
              >
                {/* Order Header */}
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <div className="flex items-center space-x-2">
                    <span className="font-mono font-black text-base text-white">{order.orderNumber}</span>
                    <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                      isOutForDelivery
                        ? 'bg-indigo-950 border-indigo-500 text-indigo-300 animate-pulse'
                        : isCompleted
                        ? 'bg-emerald-950 border-emerald-500 text-emerald-300'
                        : 'bg-purple-950 border-purple-500 text-purple-300'
                    }`}>
                      {t(`status.${order.status}`)}
                    </span>
                  </div>

                  <span className="font-mono font-bold text-sm text-emerald-400">
                    ₹{order.financials.customerTotal.toFixed(2)}
                  </span>
                </div>

                {/* Customer Address Details */}
                <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <User className="w-4 h-4 text-purple-400" />
                      <span className="font-bold text-sm text-white">{order.customerName}</span>
                    </div>

                    <a
                      href={`tel:${order.customerPhone}`}
                      className="px-2.5 py-1 rounded-xl bg-purple-950 border border-purple-700 text-purple-300 text-xs font-bold flex items-center space-x-1 hover:bg-purple-900"
                    >
                      <Phone className="w-3 h-3" />
                      <span>Call</span>
                    </a>
                  </div>

                  {order.deliveryAddress ? (
                    <div className="text-xs text-slate-300 flex items-start space-x-2 pt-1 border-t border-slate-850">
                      <MapPin className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <div>
                        <div className="font-medium">{order.deliveryAddress.addressLine1}</div>
                        {order.deliveryAddress.landmark && (
                          <div className="text-slate-400 text-[11px]">
                            Landmark: {order.deliveryAddress.landmark} ({order.deliveryAddress.pincode})
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="text-xs text-slate-400">Standard Delivery Area</div>
                  )}
                </div>

                {/* Items Summary */}
                <div className="flex items-center justify-between text-xs text-slate-400 px-1">
                  <span>{order.items.length} items ({order.items.map((i) => `${i.productName} (${i.orderedQuantityDisplay})`).join(', ')})</span>
                </div>

                {/* Dispatch Controls */}
                <div className="pt-2 border-t border-slate-800 flex items-center space-x-2">
                  {order.status === OrderStatus.PREPARING && (
                    <button
                      type="button"
                      disabled={isUpdating}
                      onClick={() => handleDispatch(order.id)}
                      className="flex-1 py-3 px-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold flex items-center justify-center space-x-1.5 shadow-md"
                    >
                      <Truck className="w-4 h-4" />
                      <span>{language === 'hi' ? 'डिलीवरी के लिए रवाना करें' : 'Dispatch for Delivery'}</span>
                    </button>
                  )}

                  {isOutForDelivery && (
                    <button
                      type="button"
                      disabled={isUpdating}
                      onClick={() => handleMarkDelivered(order.id)}
                      className="flex-1 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black flex items-center justify-center space-x-1.5 shadow-lg shadow-emerald-950"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>{language === 'hi' ? 'डिलीवर हो गया (Mark Delivered)' : 'Mark as Delivered'}</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => onViewOrderDetails(order)}
                    className="py-3 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
                  >
                    Details
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

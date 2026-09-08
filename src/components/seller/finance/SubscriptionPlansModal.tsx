/**
 * Subscription Plans Selector Modal for Sellers
 * Allows browsing marketplace plans (Starter Free, Growth Monthly, Pro Market Dominance),
 * viewing transparent commission rates, starting 14-day free trials, and subscribing.
 */

import React, { useState } from 'react';
import {
  X,
  Check,
  Zap,
  Crown,
  Shield,
  Sparkles,
  ArrowRight,
  IndianRupee,
  Calendar,
  AlertCircle,
} from 'lucide-react';
import { SubscriptionPlan } from '../../../types/financial.ts';
import { useSellerLanguage } from '../../../context/SellerLanguageContext.tsx';

interface SubscriptionPlansModalProps {
  isOpen: boolean;
  onClose: () => void;
  plans: SubscriptionPlan[];
  currentPlanId?: string;
  onSelectPlan: (plan: SubscriptionPlan, startTrial?: boolean) => Promise<void>;
  isLoading?: boolean;
}

export const SubscriptionPlansModal: React.FC<SubscriptionPlansModalProps> = ({
  isOpen,
  onClose,
  plans,
  currentPlanId,
  onSelectPlan,
  isLoading = false,
}) => {
  const { language } = useSellerLanguage();
  const [selectedPlanId, setSelectedPlanId] = useState<string>(currentPlanId || (plans[0]?.id ?? ''));
  const [paymentMethod, setPaymentMethod] = useState<'UPI' | 'NET_BANKING' | 'CARD'>('UPI');

  if (!isOpen) return null;

  const selectedPlan = plans.find((p) => p.id === selectedPlanId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-3xl max-h-[90vh] overflow-y-auto p-5 sm:p-7 space-y-6 shadow-2xl relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="space-y-1">
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-emerald-950/80 border border-emerald-800 text-emerald-300 text-xs font-bold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>{language === 'hi' ? 'दुकानदार सब्सक्रिप्शन योजनाएं' : 'Shop Subscription Plans'}</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            {language === 'hi' ? 'अपने व्यापार के लिए सही योजना चुनें' : 'Choose the Right Plan for Your Shop'}
          </h2>
          <p className="text-xs sm:text-sm text-slate-400">
            {language === 'hi'
              ? 'कम कमीशन दर और असीमित उत्पाद सूची के साथ अपनी दुकान का मुनाफा बढ़ाएं।'
              : 'Maximize your profit margins with lower commission rates, higher product limits, and priority market discovery.'}
          </p>
        </div>

        {/* Plans Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {plans.map((plan) => {
            const isCurrent = plan.id === currentPlanId;
            const isSelected = plan.id === selectedPlanId;

            return (
              <div
                key={plan.id}
                onClick={() => setSelectedPlanId(plan.id)}
                className={`relative p-5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                  isSelected
                    ? 'bg-slate-800/90 border-emerald-500 shadow-lg ring-2 ring-emerald-500/20'
                    : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                }`}
              >
                {plan.isPopular && (
                  <span className="absolute -top-2.5 right-4 px-2 py-0.5 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-black text-[10px] uppercase tracking-wider shadow">
                    Most Popular
                  </span>
                )}

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-black text-base text-white">{plan.name}</h3>
                    {isCurrent && (
                      <span className="px-2 py-0.5 rounded bg-emerald-950 border border-emerald-700 text-emerald-300 text-[10px] font-bold">
                        Current
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-slate-400 min-h-[32px]">{plan.description}</p>

                  <div className="pt-2 border-t border-slate-800/80">
                    <div className="flex items-baseline space-x-1">
                      <span className="text-2xl font-black text-white">₹{plan.price}</span>
                      <span className="text-xs text-slate-400 font-medium">/{plan.interval === 'YEARLY' ? 'year' : 'month'}</span>
                    </div>

                    <div className="mt-2 inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-emerald-400 text-xs font-bold font-mono">
                      <span>{plan.commissionPercentage}% Commission</span>
                    </div>
                  </div>

                  {/* Features List */}
                  <ul className="space-y-2 pt-3 border-t border-slate-800/60 text-xs text-slate-300">
                    <li className="flex items-center space-x-2">
                      <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>{plan.maxProducts ? `Up to ${plan.maxProducts} products` : 'Unlimited products'}</span>
                    </li>
                    {plan.features.map((f, i) => (
                      <li key={i} className="flex items-center space-x-2">
                        <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mt-4 pt-3">
                  <button
                    type="button"
                    className={`w-full py-2 rounded-xl text-xs font-bold transition-all ${
                      isSelected
                        ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-md'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    {isSelected ? 'Selected' : 'Select Plan'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Selected Plan Details & Action */}
        {selectedPlan && (
          <div className="p-4 sm:p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <span className="text-xs text-slate-400">Plan Summary</span>
                <h4 className="font-bold text-white text-base">
                  {selectedPlan.name} Plan — ₹{selectedPlan.price}/month ({selectedPlan.commissionPercentage}% platform commission)
                </h4>
              </div>

              {selectedPlan.price > 0 && (
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-slate-400">Pay via:</span>
                  <div className="inline-flex rounded-lg bg-slate-900 p-0.5 border border-slate-800 text-xs font-bold">
                    {(['UPI', 'CARD', 'NET_BANKING'] as const).map((method) => (
                      <button
                        key={method}
                        onClick={() => setPaymentMethod(method)}
                        className={`px-2.5 py-1 rounded-md transition-all ${
                          paymentMethod === method ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        {method}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              {selectedPlan.price > 0 && (
                <button
                  disabled={isLoading}
                  onClick={() => onSelectPlan(selectedPlan, true)}
                  className="flex-1 py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-300 border border-emerald-800/60 font-bold text-xs flex items-center justify-center space-x-2 transition-all disabled:opacity-50"
                >
                  <Calendar className="w-4 h-4 text-emerald-400" />
                  <span>Start 14-Day Free Trial</span>
                </button>
              )}

              <button
                disabled={isLoading}
                onClick={() => onSelectPlan(selectedPlan, false)}
                className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs flex items-center justify-center space-x-2 transition-all shadow-lg shadow-emerald-950/40 disabled:opacity-50"
              >
                <Zap className="w-4 h-4" />
                <span>
                  {isLoading
                    ? 'Processing...'
                    : selectedPlan.price === 0
                    ? 'Activate Free Plan'
                    : `Subscribe Now (₹${selectedPlan.price}/mo)`}
                </span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

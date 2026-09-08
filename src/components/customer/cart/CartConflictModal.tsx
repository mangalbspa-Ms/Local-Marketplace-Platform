/**
 * Cart Conflict Modal
 * 
 * Enforces strict single-shop cart isolation with transparent confirmation dialog.
 */

import React from 'react';
import { useCustomerCart } from '../../../context/CustomerCartContext.tsx';
import { useCustomerLanguage } from '../../../context/CustomerLanguageContext.tsx';
import { AlertTriangle, Trash2, ArrowRight } from 'lucide-react';

export const CartConflictModal: React.FC = () => {
  const { conflictState, resolveConflict } = useCustomerCart();
  const { language, t } = useCustomerLanguage();

  if (!conflictState.isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
      onClick={() => resolveConflict(false)}
    >
      <div
        className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-sm p-5 space-y-4 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Warning Icon */}
        <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 mx-auto">
          <AlertTriangle className="w-6 h-6" />
        </div>

        {/* Title & Message */}
        <div className="text-center space-y-2">
          <h3 className="text-base font-black text-slate-100">
            {t('cartConflictTitle')}
          </h3>
          <p className="text-xs text-slate-300 leading-relaxed">
            {t('cartConflictMsg')}{' '}
            <strong className="text-amber-300 font-bold block mt-1">
              "{conflictState.existingShopName}"
            </strong>
          </p>
          <p className="text-[11px] text-slate-400">
            {language === 'hi'
              ? `स्थानीय मंडी में प्रत्येक ऑर्डर केवल एक ही दुकान से तैयार किया जाता है। क्या आप पुरानी कार्ट हटाकर "${conflictState.newShopName}" से नया ऑर्डर शुरू करना चाहते हैं?`
              : `Local Mandi orders are packed individually per store. Would you like to discard items from "${conflictState.existingShopName}" and start an order with "${conflictState.newShopName}"?`}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2 pt-2">
          <button
            onClick={() => resolveConflict(true)}
            className="w-full py-3 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-lg shadow-rose-600/20 transition-all"
          >
            <Trash2 className="w-4 h-4" />
            <span>{t('cartConflictDiscard')}</span>
          </button>

          <button
            onClick={() => resolveConflict(false)}
            className="w-full py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition-all"
          >
            {t('cancel')}
          </button>
        </div>
      </div>
    </div>
  );
};

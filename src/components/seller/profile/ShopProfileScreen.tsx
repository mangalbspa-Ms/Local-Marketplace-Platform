import React, { useState } from 'react';
import { ShopInformationScreen } from './ShopInformationScreen';
import { Product, CreateProductDTO } from '../../../types/product';

interface ShopProfileScreenProps {
  products?: Product[];
  onCreateProduct?: (data: CreateProductDTO) => Promise<void>;
  onUpdateProduct?: (productId: string, updates: Partial<Product>) => Promise<void>;
  onDeleteProduct?: (productId: string) => Promise<void>;
  onBack?: () => void;
}

/**
 * ShopProfileScreen
 * Dedicated standalone container for the Complete Shop Information Editor.
 * Decoupled from the 8-item Quick Menu to prevent duplicate hub menus.
 */
export const ShopProfileScreen: React.FC<ShopProfileScreenProps> = ({ onBack }) => {
  const [toastMsg, setToastMsg] = useState<{ text: string; type?: 'success' | 'error' } | null>(null);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMsg({ text, type });
    setTimeout(() => setToastMsg(null), 3000);
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-2 sm:px-4 py-3 sm:py-4 pb-28">
      {toastMsg && (
        <div
          className={`fixed top-16 right-4 z-50 p-3 rounded-2xl border text-xs font-bold flex items-center gap-2 shadow-2xl animate-in slide-in-from-top-2 duration-150 ${
            toastMsg.type === 'error'
              ? 'bg-rose-950/95 border-rose-500/60 text-rose-200'
              : 'bg-emerald-950/95 border-emerald-500/60 text-emerald-200'
          }`}
        >
          <span>{toastMsg.text}</span>
        </div>
      )}

      <ShopInformationScreen
        onBack={onBack || (() => {})}
        onShowToast={showToast}
      />
    </div>
  );
};

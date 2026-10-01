import React from 'react';
import { useCustomerMarket } from '../../context/CustomerMarketContext.tsx';
import { useCustomerLanguage } from '../../context/CustomerLanguageContext.tsx';
import { ShopCard } from '../shops/ShopCard.tsx';
import { Shop } from '../../types/market.ts';
import { ArrowLeft, Store } from 'lucide-react';

interface NearbyShopsScreenProps {
  onSelectShop: (shop: Shop) => void;
  onBack: () => void;
}

export const NearbyShopsScreen: React.FC<NearbyShopsScreenProps> = ({
  onSelectShop,
  onBack,
}) => {
  const { shops, isLoadingShops, getShopDistance, currentMarket } = useCustomerMarket();
  const { language } = useCustomerLanguage();

  return (
    <div className="min-h-screen bg-slate-50 pb-28">
      {/* Dedicated Sticky Header */}
      <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-4 py-3 shadow-xs flex items-center gap-3">
        <button
          id="btn-back-from-all-shops"
          type="button"
          onClick={onBack}
          className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-700 flex items-center justify-center transition cursor-pointer shrink-0"
          aria-label={language === 'hi' ? 'पीछे जाएं' : 'Back to Home'}
          title={language === 'hi' ? 'पीछे जाएं' : 'Back'}
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <Store className="w-4 h-4 text-emerald-600 shrink-0" />
            <h1 className="text-sm font-extrabold text-slate-900 tracking-tight truncate">
              {language === 'hi' ? '🏪 आपके आसपास की दुकानें' : '🏪 Nearby Mandi Shops'}
            </h1>
          </div>
          <p className="text-[11px] text-slate-500 truncate flex items-center gap-1 mt-0.5 font-medium">
            <span className="font-semibold text-emerald-700">
              {shops.length} {language === 'hi' ? 'दुकानें उपलब्ध' : 'shops available'}
            </span>
            <span>•</span>
            <span className="truncate">{currentMarket?.name || 'Local Mandi'}</span>
          </p>
        </div>
      </div>

      {/* Full Nearby Shops 2-Column Responsive Grid */}
      <div className="pt-3">
        {isLoadingShops ? (
          <div className="px-4 py-16 text-center text-xs text-slate-500">
            {language === 'hi' ? 'दुकानें लोड हो रही हैं...' : 'Loading nearby shops...'}
          </div>
        ) : !shops || shops.length === 0 ? (
          <div className="mx-4 mt-6 bg-white border border-dashed border-slate-200 rounded-2xl p-8 text-center text-xs text-slate-500">
            {language === 'hi' ? 'कोई दुकान उपलब्ध नहीं है' : 'No nearby shops available'}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 px-4">
            {shops.map((shop) => (
              <ShopCard
                key={shop.id}
                shop={shop}
                variant="customer"
                onClick={() => onSelectShop(shop)}
                distanceText={getShopDistance(shop)?.distanceText || shop.distanceText || '0.5 km'}
                language={language}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

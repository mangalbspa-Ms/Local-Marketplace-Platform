/**
 * Seller Accounts Governance & Management Screen
 */

import React, { useState, useEffect } from 'react';
import { adminApi } from '../../../services/adminApi.ts';
import {
  Users,
  Store,
  Phone,
  Mail,
  Search,
  CheckCircle2,
  Ban,
  RotateCcw,
  IndianRupee,
  Calendar,
  ShieldAlert,
} from 'lucide-react';

export const SellerManagementScreen: React.FC = () => {
  const [sellers, setSellers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const loadSellers = async () => {
    setIsLoading(true);
    try {
      const data = await adminApi.getSellers();
      setSellers(data);
    } catch (err) {
      console.error('Failed to load sellers', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadSellers();
  }, []);

  const handleToggleStatus = async (sellerId: string) => {
    try {
      await adminApi.toggleSellerStatus(sellerId);
      await loadSellers();
    } catch (err: any) {
      alert(err.message || 'Failed to update seller status');
    }
  };

  const filtered = sellers.filter(
    (s) =>
      (s.fullName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.phone || '').includes(searchQuery) ||
      (s.shop?.name && s.shop.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (s.marketName || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-indigo-400" />
            <span>Seller Account Management</span>
          </h2>
          <p className="text-xs text-slate-400">
            Monitor merchant access, lifetime gross sales, and governance status across local mandi sellers.
          </p>
        </div>

        <div className="text-xs text-slate-400">
          <span className="font-bold text-white">{sellers.length}</span> Registered Sellers
        </div>
      </div>

      {/* Search Input */}
      <div className="relative max-w-md">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by merchant name, phone, or shop..."
          className="w-full bg-slate-900 border border-slate-800 focus:border-indigo-500 rounded-2xl px-4 py-2.5 pl-10 text-xs text-white placeholder-slate-500 outline-none transition"
        />
        <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
      </div>

      {/* Sellers Grid */}
      {isLoading ? (
        <div className="p-8 text-center text-xs text-slate-400 font-bold">Loading seller accounts...</div>
      ) : filtered.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 text-center text-xs text-slate-400">
          No matching seller accounts found.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((seller) => (
            <div
              key={seller.id}
              className={`rounded-3xl border p-5 bg-slate-900 shadow-lg flex flex-col justify-between ${
                seller.isActive ? 'border-slate-800' : 'border-rose-900/40 bg-slate-950/60 opacity-80'
              }`}
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-9 h-9 rounded-xl bg-indigo-600/20 text-indigo-400 font-black text-sm flex items-center justify-center border border-indigo-500/30">
                      {seller.fullName?.charAt(0) || 'M'}
                    </div>
                    <div>
                      <h3 className="text-sm font-black text-white">{seller.fullName}</h3>
                      <div className="text-[10px] text-slate-400 font-mono">{seller.id}</div>
                    </div>
                  </div>

                  <span
                    className={`text-[10px] font-black px-2.5 py-0.5 rounded-full border ${
                      seller.isActive
                        ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                        : 'bg-rose-500/20 text-rose-400 border-rose-500/30'
                    }`}
                  >
                    {seller.isActive ? 'ACTIVE' : 'SUSPENDED'}
                  </span>
                </div>

                {/* Contact */}
                <div className="space-y-1 text-xs text-slate-300 mb-3 bg-slate-950/60 p-3 rounded-2xl border border-slate-800/60">
                  <div className="flex items-center gap-2 text-[11px]">
                    <Phone className="w-3.5 h-3.5 text-slate-500" />
                    <span>{seller.phone}</span>
                  </div>
                  {seller.email && (
                    <div className="flex items-center gap-2 text-[11px]">
                      <Mail className="w-3.5 h-3.5 text-slate-500" />
                      <span className="truncate">{seller.email}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-[11px] text-slate-400 pt-1 border-t border-slate-800/80">
                    <Store className="w-3.5 h-3.5 text-indigo-400" />
                    <span className="font-bold text-slate-200 truncate">
                      {seller.shop?.name || 'No Shop Assigned'}
                    </span>
                  </div>
                </div>

                {/* Lifetime Metrics */}
                <div className="grid grid-cols-3 gap-2 py-2.5 border-y border-slate-800/80 mb-3 text-center">
                  <div className="bg-slate-950/40 p-2 rounded-xl">
                    <div className="text-[9px] text-slate-400 font-bold uppercase">Orders</div>
                    <div className="text-xs font-black text-white mt-0.5">{seller.totalOrdersCount || 0}</div>
                  </div>

                  <div className="bg-slate-950/40 p-2 rounded-xl">
                    <div className="text-[9px] text-slate-400 font-bold uppercase">Gross GMV</div>
                    <div className="text-xs font-black text-white mt-0.5">₹{seller.totalSales || 0}</div>
                  </div>

                  <div className="bg-slate-950/40 p-2 rounded-xl">
                    <div className="text-[9px] text-slate-400 font-bold uppercase">Pending Payout</div>
                    <div className="text-xs font-black text-amber-400 mt-0.5">₹{seller.pendingSettlementAmount || 0}</div>
                  </div>
                </div>
              </div>

              {/* Action */}
              <div className="pt-2">
                <button
                  onClick={() => handleToggleStatus(seller.id)}
                  className={`w-full py-2.5 px-3 rounded-xl text-xs font-extrabold flex items-center justify-center gap-1.5 transition border ${
                    seller.isActive
                      ? 'bg-rose-950/30 border-rose-800/60 text-rose-300 hover:bg-rose-900/50'
                      : 'bg-emerald-950/30 border-emerald-800/60 text-emerald-300 hover:bg-emerald-900/50'
                  }`}
                >
                  {seller.isActive ? (
                    <>
                      <Ban className="w-3.5 h-3.5" />
                      <span>Suspend Merchant Account</span>
                    </>
                  ) : (
                    <>
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Reactivate Merchant Account</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

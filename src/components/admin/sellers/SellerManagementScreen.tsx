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
  const [statusFilter, setStatusFilter] = useState('ALL');

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

  const filtered = sellers.filter((s) => {
    const q = (searchQuery || '').toLowerCase();
    const matchesSearch =
      (s?.fullName || '').toLowerCase().includes(q) ||
      (s?.phone || '').includes(searchQuery || '') ||
      (s?.shop?.name ? s.shop.name.toLowerCase().includes(q) : false) ||
      (s?.marketName || '').toLowerCase().includes(q);

    const matchesStatus =
      statusFilter === 'ALL'
        ? true
        : statusFilter === 'ACTIVE'
        ? s?.isActive
        : !s?.isActive;

    return matchesSearch && matchesStatus;
  });

  const activeSellers = sellers.filter((s) => s.isActive).length;
  const totalPendingPayout = sellers.reduce((sum, s) => sum + (s.pendingSettlementAmount || 0), 0);

  return (
    <div className="space-y-4">
      {/* Compact Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3.5 sm:p-4 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-indigo-500/15 border border-indigo-500/30 text-indigo-400 flex items-center justify-center shrink-0">
            <Users className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-base font-extrabold text-white flex items-center gap-2">
              <span>Seller Account Management</span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                {filtered.length} Merchants
              </span>
            </h2>
            <p className="text-[11px] text-slate-400">
              Monitor merchant access, lifetime gross sales, and governance status across local mandi sellers
            </p>
          </div>
        </div>

        <button
          onClick={loadSellers}
          disabled={isLoading}
          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700/60 transition self-start sm:self-auto"
          title="Refresh Sellers"
        >
          <RotateCcw className={`w-4 h-4 text-indigo-400 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* 3 Compact KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
        <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Registered Sellers</p>
            <h3 className="text-lg font-black text-white mt-0.5">{sellers.length}</h3>
            <p className="text-[10px] text-slate-500">Mandi merchant partners</p>
          </div>
          <div className="w-9 h-9 rounded-lg bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 flex items-center justify-center shrink-0">
            <Users className="w-4 h-4" />
          </div>
        </div>

        <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">Active Merchants</p>
            <h3 className="text-lg font-black text-emerald-400 mt-0.5">{activeSellers}</h3>
            <p className="text-[10px] text-emerald-400/70">Authorised & selling</p>
          </div>
          <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-4 h-4" />
          </div>
        </div>

        <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold text-amber-400 uppercase tracking-wider">Pending Payouts</p>
            <h3 className="text-lg font-black text-amber-400 mt-0.5">₹{totalPendingPayout.toLocaleString()}</h3>
            <p className="text-[10px] text-amber-400/70">Due for merchant settlement</p>
          </div>
          <div className="w-9 h-9 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center shrink-0">
            <IndianRupee className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* Search Input Bar & Quick Filters */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-2 sm:p-2.5 space-y-2">
        <div className="relative max-w-md">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by merchant name, phone, or shop..."
            className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-lg px-2.5 py-1.5 pl-7 text-xs text-white placeholder-slate-500 outline-none transition"
          />
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2 top-2" />
        </div>

        {/* Quick Status Chips */}
        <div className="flex items-center gap-1 overflow-x-auto pb-0.5 no-scrollbar text-[11px]">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mr-1">Status:</span>
          {[
            { id: 'ALL', label: 'All' },
            { id: 'ACTIVE', label: 'Active' },
            { id: 'SUSPENDED', label: 'Suspended' },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setStatusFilter(item.id)}
              className={`px-2 py-0.5 rounded-md font-semibold transition shrink-0 ${
                statusFilter === item.id
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-950 hover:bg-slate-800 text-slate-400 border border-slate-800/80'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Sellers Grid */}
      {isLoading ? (
        <div className="p-8 text-center text-xs text-slate-400 font-bold bg-slate-900/60 border border-slate-800 rounded-xl">
          Loading seller accounts...
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-8 text-center text-xs text-slate-400">
          No matching seller accounts found.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map((seller) => (
            <div
              key={seller.id}
              className={`rounded-xl border p-3.5 bg-slate-900/90 shadow-sm flex flex-col justify-between hover:border-slate-700 transition ${
                seller.isActive ? 'border-slate-800' : 'border-rose-900/40 bg-slate-950/60 opacity-85'
              }`}
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2.5">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-indigo-600/20 text-indigo-400 font-black text-xs flex items-center justify-center border border-indigo-500/30 shrink-0">
                      {seller.fullName?.charAt(0) || 'M'}
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-xs font-black text-white truncate">{seller.fullName}</h3>
                      <div className="text-[9px] text-slate-500 font-mono truncate">{seller.id}</div>
                    </div>
                  </div>

                  <span
                    className={`text-[9px] font-black px-2 py-0.5 rounded-md border shrink-0 ${
                      seller.isActive
                        ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                        : 'bg-rose-500/15 text-rose-400 border-rose-500/30'
                    }`}
                  >
                    {seller.isActive ? 'ACTIVE' : 'SUSPENDED'}
                  </span>
                </div>

                {/* Contact */}
                <div className="space-y-1 text-xs text-slate-300 mb-2.5 bg-slate-950/60 p-2 rounded-lg border border-slate-800/60">
                  <div className="flex items-center gap-1.5 text-[10px]">
                    <Phone className="w-3 h-3 text-slate-500 shrink-0" />
                    <span>{seller.phone}</span>
                  </div>
                  {seller.email && (
                    <div className="flex items-center gap-1.5 text-[10px]">
                      <Mail className="w-3 h-3 text-slate-500 shrink-0" />
                      <span className="truncate">{seller.email}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-1.5 text-[10px] text-slate-400 pt-1 border-t border-slate-800/80">
                    <Store className="w-3 h-3 text-indigo-400 shrink-0" />
                    <span className="font-semibold text-slate-200 truncate">
                      {seller.shop?.name || 'No Shop Assigned'}
                    </span>
                  </div>
                </div>

                {/* Lifetime Metrics */}
                <div className="grid grid-cols-3 gap-1 py-1.5 border-y border-slate-800/80 mb-2.5 text-center">
                  <div className="bg-slate-950/40 p-1.5 rounded-lg">
                    <div className="text-[8px] text-slate-400 font-bold uppercase">Orders</div>
                    <div className="text-[11px] font-black text-white mt-0.5">{seller.totalOrdersCount || 0}</div>
                  </div>

                  <div className="bg-slate-950/40 p-1.5 rounded-lg">
                    <div className="text-[8px] text-slate-400 font-bold uppercase">Gross GMV</div>
                    <div className="text-[11px] font-black text-white mt-0.5">₹{seller.totalSales || 0}</div>
                  </div>

                  <div className="bg-slate-950/40 p-1.5 rounded-lg">
                    <div className="text-[8px] text-slate-400 font-bold uppercase">Pending</div>
                    <div className="text-[11px] font-black text-amber-400 mt-0.5">₹{seller.pendingSettlementAmount || 0}</div>
                  </div>
                </div>
              </div>

              {/* Action */}
              <div className="pt-1">
                <button
                  onClick={() => handleToggleStatus(seller.id)}
                  className={`w-full py-1.5 px-2.5 rounded-lg text-[11px] font-bold flex items-center justify-center gap-1.5 transition border ${
                    seller.isActive
                      ? 'bg-rose-950/30 border-rose-800/60 text-rose-300 hover:bg-rose-900/50'
                      : 'bg-emerald-950/30 border-emerald-800/60 text-emerald-300 hover:bg-emerald-900/50'
                  }`}
                >
                  {seller.isActive ? (
                    <>
                      <Ban className="w-3 h-3" />
                      <span>Suspend Merchant</span>
                    </>
                  ) : (
                    <>
                      <RotateCcw className="w-3 h-3" />
                      <span>Reactivate Merchant</span>
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

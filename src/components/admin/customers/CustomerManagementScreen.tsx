/**
 * Customer Directory & Governance Screen
 */

import React, { useState, useEffect } from 'react';
import { adminApi } from '../../../services/adminApi.ts';
import {
  UserCheck,
  ShoppingBag,
  IndianRupee,
  Calendar,
  Phone,
  Mail,
  MapPin,
  Search,
  Ban,
  RotateCcw,
  UserX,
} from 'lucide-react';

export const CustomerManagementScreen: React.FC = () => {
  const [customers, setCustomers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const loadCustomers = async () => {
    setIsLoading(true);
    try {
      const data = await adminApi.getCustomers();
      setCustomers(data);
    } catch (err) {
      console.error('Failed to load customers', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCustomers();
  }, []);

  const handleToggleStatus = async (customerId: string) => {
    try {
      await adminApi.toggleCustomerStatus(customerId);
      await loadCustomers();
    } catch (err: any) {
      alert(err.message || 'Failed to update customer status');
    }
  };

  const filtered = customers.filter(
    (c) =>
      (c.fullName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.phone || '').includes(searchQuery) ||
      (c.email && c.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (c.city || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-white flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-indigo-400" />
            <span>Customer Directory & Orders History</span>
          </h2>
          <p className="text-xs text-slate-400">
            View registered local customers, lifetime spending, order frequencies, and account status.
          </p>
        </div>

        <div className="text-xs text-slate-400">
          <span className="font-bold text-white">{customers.length}</span> Active Buyers
        </div>
      </div>

      {/* Search Input */}
      <div className="relative max-w-md">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by customer name, phone, email, or city..."
          className="w-full bg-slate-900 border border-slate-800 focus:border-indigo-500 rounded-2xl px-4 py-2.5 pl-10 text-xs text-white placeholder-slate-500 outline-none transition"
        />
        <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="p-8 text-center text-xs text-slate-400 font-bold">Loading customers...</div>
      ) : filtered.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 text-center text-xs text-slate-400">
          No matching customer accounts found.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((customer) => (
            <div
              key={customer.id}
              className={`rounded-3xl border p-5 bg-slate-900 shadow-lg flex flex-col justify-between ${
                customer.isActive ? 'border-slate-800' : 'border-rose-900/40 bg-slate-950/60 opacity-80'
              }`}
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-9 h-9 rounded-xl bg-emerald-600/20 text-emerald-400 font-black text-sm flex items-center justify-center border border-emerald-500/30">
                      {customer.fullName?.charAt(0) || 'C'}
                    </div>
                    <div>
                      <h3 className="text-sm font-black text-white">{customer.fullName}</h3>
                      <div className="text-[10px] text-slate-400 font-mono">{customer.id}</div>
                    </div>
                  </div>

                  <span
                    className={`text-[10px] font-black px-2.5 py-0.5 rounded-full border ${
                      customer.isActive
                        ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                        : 'bg-rose-500/20 text-rose-400 border-rose-500/30'
                    }`}
                  >
                    {customer.isActive ? 'ACTIVE' : 'SUSPENDED'}
                  </span>
                </div>

                {/* Contact info */}
                <div className="space-y-1 text-xs text-slate-300 mb-3 bg-slate-950/60 p-3 rounded-2xl border border-slate-800/60">
                  <div className="flex items-center gap-2 text-[11px]">
                    <Phone className="w-3.5 h-3.5 text-slate-500" />
                    <span>{customer.phone}</span>
                  </div>
                  {customer.email && customer.email !== 'N/A' && (
                    <div className="flex items-center gap-2 text-[11px]">
                      <Mail className="w-3.5 h-3.5 text-slate-500" />
                      <span className="truncate">{customer.email}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-[11px] text-slate-400 pt-1 border-t border-slate-800/80">
                    <MapPin className="w-3.5 h-3.5 text-teal-400" />
                    <span className="text-slate-300 font-bold">
                      {customer.city} • {customer.marketName}
                    </span>
                  </div>
                </div>

                {/* Spending Metrics */}
                <div className="grid grid-cols-2 gap-2 py-2.5 border-y border-slate-800/80 mb-3 text-center">
                  <div className="bg-slate-950/40 p-2 rounded-xl">
                    <div className="text-[9px] text-slate-400 font-bold uppercase">Total Orders</div>
                    <div className="text-xs font-black text-white mt-0.5">{customer.totalOrdersCount || 0}</div>
                  </div>

                  <div className="bg-slate-950/40 p-2 rounded-xl">
                    <div className="text-[9px] text-slate-400 font-bold uppercase">Lifetime Spend</div>
                    <div className="text-xs font-black text-emerald-400 mt-0.5">₹{customer.totalSpending || 0}</div>
                  </div>
                </div>

                {customer.lastOrderDate && (
                  <p className="text-[10px] text-slate-500 mb-2">
                    Last active: {new Date(customer.lastOrderDate).toLocaleDateString()}
                  </p>
                )}
              </div>

              {/* Action */}
              <div className="pt-2">
                <button
                  onClick={() => handleToggleStatus(customer.id)}
                  className={`w-full py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition border ${
                    customer.isActive
                      ? 'bg-rose-950/30 border-rose-800/60 text-rose-300 hover:bg-rose-900/50'
                      : 'bg-emerald-950/30 border-emerald-800/60 text-emerald-300 hover:bg-emerald-900/50'
                  }`}
                >
                  {customer.isActive ? (
                    <>
                      <Ban className="w-3.5 h-3.5" />
                      <span>Suspend Buyer</span>
                    </>
                  ) : (
                    <>
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Reactivate Buyer</span>
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

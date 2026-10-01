/**
 * Payment Gateway & Transaction Monitor Screen
 * 
 * Verifies online payment gateway logs, customer transactions, and payment gateway signatures.
 */

import React, { useState, useEffect } from 'react';
import { adminApi } from '../../../services/adminApi.ts';
import { PaymentRecord } from '../../../types/payment.ts';
import {
  CreditCard,
  Search,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ShieldCheck,
  IndianRupee,
  Smartphone,
  Building,
  RefreshCw,
  LayoutGrid,
  List,
  X,
} from 'lucide-react';

export const PaymentMonitorScreen: React.FC = () => {
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [gatewayFilter, setGatewayFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');

  const loadPayments = async () => {
    setIsLoading(true);
    try {
      const data = await adminApi.getPayments();
      setPayments(data);
    } catch (err) {
      console.error('Failed to load payments', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadPayments();
  }, []);

  const filtered = payments.filter((p) => {
    const q = (searchQuery || '').toLowerCase();
    const matchesSearch =
      (p?.id || '').toLowerCase().includes(q) ||
      (p?.orderId || '').toLowerCase().includes(q) ||
      (p?.gatewayPaymentId ? p.gatewayPaymentId.toLowerCase().includes(q) : false);

    const matchesGateway = gatewayFilter === 'ALL' || p?.gateway === gatewayFilter;
    const matchesStatus = statusFilter === 'ALL' || p?.status === statusFilter;

    return matchesSearch && matchesGateway && matchesStatus;
  });

  const getMethodIcon = (method: string) => {
    switch (method) {
      case 'UPI':
        return <Smartphone className="w-3.5 h-3.5 text-emerald-400" />;
      case 'NET_BANKING':
        return <Building className="w-3.5 h-3.5 text-sky-400" />;
      default:
        return <CreditCard className="w-3.5 h-3.5 text-indigo-400" />;
    }
  };

  const totalVolume = payments.reduce((sum, p) => sum + (p.amount || 0), 0);
  const successCount = payments.filter((p) => p.status === 'SUCCESS').length;
  const pendingCount = payments.filter((p) => p.status === 'PENDING').length;

  return (
    <div className="space-y-3 sm:space-y-4 animate-fade-in">
      {/* Compact Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 sm:p-3.5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-indigo-500/15 border border-indigo-500/30 text-indigo-400 flex items-center justify-center shrink-0">
            <CreditCard className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-extrabold text-white flex items-center gap-2">
              <span>Payment Gateway Monitor</span>
              <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-slate-800 text-slate-300 border border-slate-700 font-mono">
                {filtered.length}
              </span>
            </h2>
            <p className="text-[10px] sm:text-[11px] text-slate-400">
              Audit digital transactions (UPI, Cards, Net Banking) & verified gateway signatures
            </p>
          </div>
        </div>

        {/* Gateway filter, View Toggle & Refresh */}
        <div className="flex items-center gap-1.5 self-end sm:self-auto">
          <select
            value={gatewayFilter}
            onChange={(e) => setGatewayFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-lg px-2 py-1.5 text-xs text-slate-200 outline-none focus:border-indigo-500 font-medium"
          >
            <option value="ALL">All Gateways</option>
            <option value="RAZORPAY">Razorpay</option>
            <option value="MOCK_GATEWAY">Mock Gateway</option>
          </select>

          <div className="flex items-center bg-slate-950 p-0.5 rounded-lg border border-slate-800">
            <button
              onClick={() => setViewMode('cards')}
              className={`p-1 rounded ${viewMode === 'cards' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-slate-200'}`}
              title="Card View"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-1 rounded ${viewMode === 'table' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-slate-200'}`}
              title="Table View"
            >
              <List className="w-3.5 h-3.5" />
            </button>
          </div>

          <button
            onClick={loadPayments}
            disabled={isLoading}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700/60 transition active:scale-95"
            title="Refresh Transactions"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-indigo-400 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* 3 Compact KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        <div className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Transactions</p>
            <h3 className="text-base sm:text-lg font-black text-white mt-0.5">{payments.length}</h3>
            <p className="text-[10px] text-slate-500">Processed online</p>
          </div>
          <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 flex items-center justify-center shrink-0">
            <CreditCard className="w-3.5 h-3.5" />
          </div>
        </div>

        <div className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">Gross Online Volume</p>
            <h3 className="text-base sm:text-lg font-black text-emerald-400 mt-0.5 font-mono">
              ₹{totalVolume.toLocaleString('en-IN')}
            </h3>
            <p className="text-[10px] text-emerald-400/70">{successCount} transfers completed</p>
          </div>
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shrink-0">
            <IndianRupee className="w-3.5 h-3.5" />
          </div>
        </div>

        <div className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold text-amber-400 uppercase tracking-wider">Pending / Processing</p>
            <h3 className="text-base sm:text-lg font-black text-amber-400 mt-0.5">{pendingCount}</h3>
            <p className="text-[10px] text-amber-400/70">Awaiting webhook</p>
          </div>
          <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center shrink-0">
            <Clock className="w-3.5 h-3.5" />
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
            placeholder="Search by Payment ID, Order ID or Gateway Ref..."
            className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-lg px-2.5 py-1.5 pl-7 text-xs text-white placeholder-slate-500 outline-none transition"
          />
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2 top-2" />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-2 top-2 text-slate-400 hover:text-white"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* Quick Status Chips */}
        <div className="flex items-center gap-1 overflow-x-auto pb-0.5 no-scrollbar text-[11px]">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mr-1">Status:</span>
          {['ALL', 'SUCCESS', 'PENDING', 'FAILED'].map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-2 py-0.5 rounded-md font-semibold transition shrink-0 ${
                statusFilter === s
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-950 hover:bg-slate-800 text-slate-400 border border-slate-800/80'
              }`}
            >
              {s === 'ALL' ? 'All' : s}
            </button>
          ))}
        </div>
      </div>

      {/* Payments List / Table */}
      {isLoading ? (
        <div className="p-8 text-center text-xs text-slate-400 font-bold bg-slate-900/60 border border-slate-800 rounded-xl">
          <Clock className="w-5 h-5 mx-auto mb-2 text-indigo-400 animate-spin" />
          Querying payment ledger...
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-8 text-center text-xs text-slate-400">
          No payment transactions found.
        </div>
      ) : viewMode === 'table' ? (
        <div className="rounded-xl border border-slate-800 overflow-x-auto bg-slate-900/80 shadow-xs">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/80 text-[10px] font-extrabold uppercase tracking-wider text-slate-400 border-b border-slate-800">
              <tr>
                <th className="p-2.5">Transaction ID</th>
                <th className="p-2.5">Order</th>
                <th className="p-2.5">Method</th>
                <th className="p-2.5">Gateway / Ref</th>
                <th className="p-2.5 text-right">Amount</th>
                <th className="p-2.5 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filtered.map((payment) => (
                <tr key={payment.id} className="hover:bg-slate-800/40 transition">
                  <td className="p-2.5 font-mono font-bold text-white whitespace-nowrap">
                    {payment.id}
                    <div className="text-[10px] text-slate-500 font-normal">
                      {new Date(payment.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </td>
                  <td className="p-2.5 whitespace-nowrap font-mono text-indigo-300 font-semibold">
                    #{payment.orderId?.slice(-8).toUpperCase() || payment.orderId}
                  </td>
                  <td className="p-2.5 whitespace-nowrap">
                    <div className="flex items-center gap-1.5">
                      {getMethodIcon(payment.paymentMethod)}
                      <span className="text-[11px] font-medium">{payment.paymentMethod}</span>
                    </div>
                  </td>
                  <td className="p-2.5 whitespace-nowrap font-mono text-[11px] text-slate-400">
                    <div>{payment.gateway}</div>
                    <div className="text-[10px] text-slate-500">{payment.gatewayPaymentId || '—'}</div>
                  </td>
                  <td className="p-2.5 text-right font-mono font-black text-emerald-400 whitespace-nowrap">
                    ₹{payment.amount}
                  </td>
                  <td className="p-2.5 text-center whitespace-nowrap">
                    {payment.status === 'SUCCESS' ? (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-400 text-[9px] font-bold border border-emerald-500/30">
                        <ShieldCheck className="w-3 h-3" />
                        <span>VERIFIED</span>
                      </span>
                    ) : payment.status === 'PENDING' ? (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-400 text-[9px] font-bold border border-amber-500/30">
                        <Clock className="w-3 h-3" />
                        <span>PENDING</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-rose-500/15 text-rose-400 text-[9px] font-bold border border-rose-500/30">
                        <AlertTriangle className="w-3 h-3" />
                        <span>{payment.status}</span>
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((payment) => (
            <div
              key={payment.id}
              className="bg-slate-900/90 border border-slate-800 rounded-xl p-2.5 sm:p-3 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 hover:border-slate-700 transition"
            >
              {/* Left Column: ID & Order */}
              <div className="space-y-1 min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <div className="w-6 h-6 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-center shrink-0">
                    {getMethodIcon(payment.paymentMethod)}
                  </div>
                  <div className="min-w-0">
                    <span className="text-xs font-black text-white font-mono">{payment.id}</span>
                    <span className="text-[10px] text-slate-400 ml-2 font-medium">
                      Order: <span className="font-mono text-indigo-300 font-bold">#{payment.orderId?.slice(-8).toUpperCase() || payment.orderId}</span>
                    </span>
                  </div>
                </div>

                <div className="text-[10px] text-slate-400 font-mono flex items-center gap-1.5 flex-wrap">
                  <span>Ref: {payment.gatewayPaymentId || 'N/A'}</span>
                  <span>•</span>
                  <span className="text-slate-300 font-semibold">{payment.gateway}</span>
                  <span>•</span>
                  <span>{new Date(payment.createdAt).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              </div>

              {/* Right Column: Amount & Verified Badge */}
              <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center border-t sm:border-t-0 pt-1.5 sm:pt-0 border-slate-800 shrink-0">
                <div className="text-sm sm:text-base font-black text-emerald-400 font-mono">
                  ₹{payment.amount}
                </div>

                <div className="mt-0.5">
                  {payment.status === 'SUCCESS' ? (
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded-md bg-emerald-500/15 text-emerald-400 text-[9px] font-bold border border-emerald-500/30">
                      <ShieldCheck className="w-3 h-3" />
                      <span>VERIFIED</span>
                    </span>
                  ) : payment.status === 'PENDING' ? (
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded-md bg-amber-500/15 text-amber-400 text-[9px] font-bold border border-amber-500/30">
                      <Clock className="w-3 h-3" />
                      <span>PENDING</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded-md bg-rose-500/15 text-rose-400 text-[9px] font-bold border border-rose-500/30">
                      <AlertTriangle className="w-3 h-3" />
                      <span>{payment.status}</span>
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

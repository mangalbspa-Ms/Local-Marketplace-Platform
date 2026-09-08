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
} from 'lucide-react';

export const PaymentMonitorScreen: React.FC = () => {
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [gatewayFilter, setGatewayFilter] = useState('ALL');

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
    const matchesSearch =
      (p.id || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.orderId || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.gatewayPaymentId && p.gatewayPaymentId.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesGateway = gatewayFilter === 'ALL' || p.gateway === gatewayFilter;

    return matchesSearch && matchesGateway;
  });

  const getMethodIcon = (method: string) => {
    switch (method) {
      case 'UPI':
        return <Smartphone className="w-4 h-4 text-emerald-400" />;
      case 'NET_BANKING':
        return <Building className="w-4 h-4 text-sky-400" />;
      default:
        return <CreditCard className="w-4 h-4 text-indigo-400" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-white flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-indigo-400" />
            <span>Payment Gateway & Transaction Monitor</span>
          </h2>
          <p className="text-xs text-slate-400">
            Audit customer digital payments (UPI, Cards, Net Banking) and cryptographically verified gateway IDs.
          </p>
        </div>

        {/* Gateway filter */}
        <div className="flex items-center gap-2">
          <select
            value={gatewayFilter}
            onChange={(e) => setGatewayFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-indigo-500 font-bold"
          >
            <option value="ALL">All Gateways</option>
            <option value="RAZORPAY">Razorpay</option>
            <option value="MOCK_GATEWAY">Mock UPI Gateway</option>
          </select>

          <button
            onClick={loadPayments}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
            title="Refresh Transactions"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Search Input */}
      <div className="relative max-w-md">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by Payment ID, Order ID or Gateway Ref..."
          className="w-full bg-slate-900 border border-slate-800 focus:border-indigo-500 rounded-2xl px-4 py-2.5 pl-10 text-xs text-white placeholder-slate-500 outline-none transition"
        />
        <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
      </div>

      {/* Payments Table / Cards */}
      {isLoading ? (
        <div className="p-8 text-center text-xs text-slate-400 font-bold">Querying payment ledger...</div>
      ) : filtered.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 text-center text-xs text-slate-400">
          No payment transactions found.
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((payment) => (
            <div
              key={payment.id}
              className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              {/* Left Column: ID & Order */}
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center">
                    {getMethodIcon(payment.paymentMethod)}
                  </div>
                  <div>
                    <div className="text-xs font-black text-white font-mono">{payment.id}</div>
                    <div className="text-[10px] text-slate-400">
                      Order: <span className="font-mono text-indigo-300 font-bold">{payment.orderId}</span>
                    </div>
                  </div>
                </div>

                <div className="text-[10px] text-slate-500 pt-1 font-mono">
                  Gateway Ref: {payment.gatewayPaymentId || 'N/A'} • {payment.gateway}
                </div>
              </div>

              {/* Middle Column: Method & Time */}
              <div className="text-xs space-y-0.5">
                <div className="text-slate-300 font-bold flex items-center gap-1.5">
                  <span>Method: {payment.paymentMethod}</span>
                </div>
                <div className="text-[10px] text-slate-500">
                  {new Date(payment.createdAt).toLocaleString()}
                </div>
              </div>

              {/* Right Column: Amount & Verified Badge */}
              <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-800">
                <div className="text-sm sm:text-base font-black text-emerald-400 font-mono">
                  ₹{payment.amount}
                </div>

                <div className="mt-1">
                  {payment.status === 'SUCCESS' ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-black border border-emerald-500/30">
                      <ShieldCheck className="w-3 h-3" />
                      <span>GATEWAY VERIFIED</span>
                    </span>
                  ) : payment.status === 'PENDING' ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-400 text-[10px] font-black border border-amber-500/30">
                      <Clock className="w-3 h-3" />
                      <span>PENDING</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-400 text-[10px] font-black border border-rose-500/30">
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

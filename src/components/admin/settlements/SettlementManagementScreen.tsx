/**
 * Seller Settlements & Payout Governance Screen
 * 
 * Manages periodic merchant disbursements, banking reference IDs, and payout logs.
 */

import React, { useState, useEffect } from 'react';
import { adminApi } from '../../../services/adminApi.ts';
import { SellerSettlement } from '../../../types/financial.ts';
import {
  Banknote,
  IndianRupee,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Search,
  Building2,
  ArrowRight,
  ExternalLink,
  ShieldCheck,
  X,
  Send,
} from 'lucide-react';

export const SettlementManagementScreen: React.FC = () => {
  const [settlements, setSettlements] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Payout Modal
  const [payoutModalSettlement, setPayoutModalSettlement] = useState<any | null>(null);
  const [payoutRefId, setPayoutRefId] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  const loadSettlements = async () => {
    setIsLoading(true);
    try {
      const data = await adminApi.getSettlements();
      setSettlements(data);
    } catch (err) {
      console.error('Failed to load settlements', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadSettlements();
  }, []);

  const handleOpenPayout = (settlement: any) => {
    setPayoutModalSettlement(settlement);
    setPayoutRefId(`TXN_NEFT_${Date.now().toString().slice(-6)}`);
  };

  const handleExecutePayout = async (targetStatus: string) => {
    if (!payoutModalSettlement) return;
    setIsUpdating(true);
    try {
      await adminApi.updateSettlementStatus(
        payoutModalSettlement.id,
        targetStatus,
        payoutRefId.trim() || undefined
      );
      await loadSettlements();
      setPayoutModalSettlement(null);
    } catch (err: any) {
      alert(err.message || 'Failed to update settlement');
    } finally {
      setIsUpdating(false);
    }
  };

  const filtered = settlements.filter((s) => {
    const matchesSearch =
      (s.id || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.shopName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.sellerName || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || s.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalPendingPayout = settlements
    .filter((s) => s.status === 'PENDING')
    .reduce((sum, s) => sum + s.netPayable, 0);

  const totalPaidOut = settlements
    .filter((s) => s.status === 'PAID')
    .reduce((sum, s) => sum + s.netPayable, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-white flex items-center gap-2">
            <Banknote className="w-5 h-5 text-indigo-400" />
            <span>Merchant Settlements & Payouts</span>
          </h2>
          <p className="text-xs text-slate-400">
            Reconcile merchant gross GMV, deduct platform commissions, and release banking disbursements.
          </p>
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-indigo-500 font-bold"
          >
            <option value="ALL">All Settlements</option>
            <option value="PENDING">Pending Release</option>
            <option value="PROCESSING">Processing</option>
            <option value="PAID">Disbursed (Paid)</option>
          </select>
        </div>
      </div>

      {/* Summary KPI Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 flex items-center justify-between shadow-lg">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Pending Payout Obligations
            </p>
            <h3 className="text-2xl font-black text-amber-400 mt-1 font-mono">
              ₹{totalPendingPayout.toLocaleString('en-IN')}
            </h3>
            <p className="text-[11px] text-slate-500 mt-1">Awaiting administrative bank release</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center">
            <Clock className="w-6 h-6" />
          </div>
        </div>

        <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 flex items-center justify-between shadow-lg">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Total Lifetime Disbursed
            </p>
            <h3 className="text-2xl font-black text-emerald-400 mt-1 font-mono">
              ₹{totalPaidOut.toLocaleString('en-IN')}
            </h3>
            <p className="text-[11px] text-slate-500 mt-1">Directly credited to merchant bank accounts</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Search Input */}
      <div className="relative max-w-md">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search settlement by Shop Name, Merchant or ID..."
          className="w-full bg-slate-900 border border-slate-800 focus:border-indigo-500 rounded-2xl px-4 py-2.5 pl-10 text-xs text-white placeholder-slate-500 outline-none transition"
        />
        <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
      </div>

      {/* Settlements Ledger List */}
      {isLoading ? (
        <div className="p-8 text-center text-xs text-slate-400 font-bold">Querying settlement records...</div>
      ) : filtered.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 text-center text-xs text-slate-400">
          No settlement records found.
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((settlement) => (
            <div
              key={settlement.id}
              className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-lg flex flex-col lg:flex-row lg:items-center justify-between gap-4"
            >
              {/* Left Column: Settlement Meta & Shop */}
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black font-mono text-white">{settlement.id}</span>
                  <span
                    className={`text-[10px] font-black px-2.5 py-0.5 rounded-full border ${
                      settlement.status === 'PAID'
                        ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                        : settlement.status === 'PROCESSING'
                        ? 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30'
                        : 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                    }`}
                  >
                    {settlement.status}
                  </span>
                </div>

                <h3 className="text-base font-black text-white">{settlement.shopName}</h3>
                <p className="text-xs text-slate-400">
                  Merchant: <span className="text-slate-200 font-bold">{settlement.sellerName}</span> • Period:{' '}
                  <span className="font-mono text-slate-300">
                    {new Date(settlement.periodStart).toLocaleDateString()} -{' '}
                    {new Date(settlement.periodEnd).toLocaleDateString()}
                  </span>
                </p>

                {settlement.payoutReferenceId && (
                  <div className="text-[11px] font-mono text-emerald-400 pt-1">
                    Bank Payout Ref: {settlement.payoutReferenceId}
                  </div>
                )}
              </div>

              {/* Middle Column: Financial Breakdown */}
              <div className="grid grid-cols-3 gap-3 bg-slate-950/70 p-3 rounded-2xl border border-slate-800 text-center text-xs">
                <div>
                  <div className="text-[9px] text-slate-400 font-bold uppercase">Gross GMV</div>
                  <div className="text-xs font-black text-white font-mono mt-0.5">
                    ₹{settlement.grossAmount}
                  </div>
                </div>

                <div>
                  <div className="text-[9px] text-slate-400 font-bold uppercase">Comm Deducted</div>
                  <div className="text-xs font-black text-rose-400 font-mono mt-0.5">
                    - ₹{settlement.commissionDeducted}
                  </div>
                </div>

                <div>
                  <div className="text-[9px] text-slate-400 font-bold uppercase">Net Payable</div>
                  <div className="text-xs font-black text-emerald-400 font-mono mt-0.5">
                    ₹{settlement.netPayable}
                  </div>
                </div>
              </div>

              {/* Right Column: Action Button */}
              <div className="flex items-center gap-2">
                {settlement.status === 'PENDING' ? (
                  <button
                    onClick={() => handleOpenPayout(settlement)}
                    className="w-full lg:w-auto px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-1.5 transition"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Initiate Payout</span>
                  </button>
                ) : settlement.status === 'PROCESSING' ? (
                  <button
                    onClick={() => handleOpenPayout(settlement)}
                    className="w-full lg:w-auto px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-1.5 transition"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Confirm Bank Transfer</span>
                  </button>
                ) : (
                  <div className="text-[11px] text-slate-500 font-bold flex items-center gap-1">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    <span>Disbursed</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Payout Modal */}
      {payoutModalSettlement && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md shadow-2xl p-6 relative">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <Banknote className="w-4 h-4 text-emerald-400" />
                <span>Process Merchant Bank Disbursement</span>
              </h3>
              <button
                onClick={() => setPayoutModalSettlement(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
                <div className="text-sm font-black text-white">{payoutModalSettlement.shopName}</div>
                <div className="text-slate-400">Merchant: {payoutModalSettlement.sellerName}</div>
                <div className="pt-2 border-t border-slate-800 flex items-center justify-between font-black text-sm">
                  <span className="text-slate-400">Net Amount to Credit:</span>
                  <span className="text-emerald-400 font-mono text-base">
                    ₹{payoutModalSettlement.netPayable}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-slate-400 font-bold mb-1.5">
                  Bank / UPI Payout Transaction Reference ID *
                </label>
                <input
                  type="text"
                  required
                  value={payoutRefId}
                  onChange={(e) => setPayoutRefId(e.target.value)}
                  placeholder="e.g. TXN_NEFT_982341"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-white font-mono text-xs outline-none focus:border-indigo-500"
                />
                <p className="text-[10px] text-slate-500 mt-1">
                  Reference number received from bank API or payout gateway.
                </p>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setPayoutModalSettlement(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isUpdating}
                  onClick={() => handleExecutePayout('PAID')}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold shadow-lg shadow-emerald-600/30 flex items-center gap-1.5"
                >
                  {isUpdating ? 'Recording...' : 'Mark Disbursed & Paid'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

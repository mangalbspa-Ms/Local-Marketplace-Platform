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
    const q = (searchQuery || '').toLowerCase();
    const matchesSearch =
      (s?.id || '').toLowerCase().includes(q) ||
      (s?.shopName || '').toLowerCase().includes(q) ||
      (s?.sellerName || '').toLowerCase().includes(q);
    const matchesStatus = statusFilter === 'ALL' || s?.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalPendingPayout = settlements
    .filter((s) => s.status === 'PENDING')
    .reduce((sum, s) => sum + s.netPayable, 0);

  const totalPaidOut = settlements
    .filter((s) => s.status === 'PAID')
    .reduce((sum, s) => sum + s.netPayable, 0);

  const pendingList = settlements.filter((s) => s.status === 'PENDING');
  const paidList = settlements.filter((s) => s.status === 'PAID');
  const totalCommissionRetained = settlements.reduce((sum, s) => sum + (s.commissionDeducted || 0), 0);

  return (
    <div className="space-y-4">
      {/* Compact Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3.5 sm:p-4 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shrink-0">
            <Banknote className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-base font-extrabold text-white flex items-center gap-2">
              <span>Merchant Settlements & Payouts</span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                {settlements.length} Records
              </span>
            </h2>
            <p className="text-[11px] text-slate-400">
              Reconcile merchant gross GMV, deduct platform fees, and release verified bank disbursements
            </p>
          </div>
        </div>

        {/* Status Filter & Refresh */}
        <div className="flex items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 outline-none focus:border-indigo-500 font-semibold"
          >
            <option value="ALL">All Settlements</option>
            <option value="PENDING">Pending Release</option>
            <option value="PROCESSING">Processing</option>
            <option value="PAID">Disbursed (Paid)</option>
          </select>

          <button
            onClick={loadSettlements}
            disabled={isLoading}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700/60 transition"
            title="Refresh Settlements"
          >
            <Clock className={`w-4 h-4 text-indigo-400 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Summary KPI Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
        <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold text-amber-400 uppercase tracking-wider">
              Pending Payout Obligations
            </p>
            <h3 className="text-lg font-black text-amber-400 mt-0.5 font-mono">
              ₹{totalPendingPayout.toLocaleString('en-IN')}
            </h3>
            <p className="text-[10px] text-slate-400">{pendingList.length} merchants awaiting release</p>
          </div>
          <div className="w-9 h-9 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center shrink-0">
            <Clock className="w-4 h-4" />
          </div>
        </div>

        <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">
              Lifetime Disbursed
            </p>
            <h3 className="text-lg font-black text-emerald-400 mt-0.5 font-mono">
              ₹{totalPaidOut.toLocaleString('en-IN')}
            </h3>
            <p className="text-[10px] text-slate-400">{paidList.length} transfers completed</p>
          </div>
          <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-4 h-4" />
          </div>
        </div>

        <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider">
              Commission Retained
            </p>
            <h3 className="text-lg font-black text-indigo-300 mt-0.5 font-mono">
              ₹{totalCommissionRetained.toLocaleString('en-IN')}
            </h3>
            <p className="text-[10px] text-slate-400">Platform revenue earned</p>
          </div>
          <div className="w-9 h-9 rounded-lg bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* Search Input Bar */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-2.5">
        <div className="relative max-w-md">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search settlement by Shop Name, Merchant or ID..."
            className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-lg px-3 py-2 pl-8 text-xs text-white placeholder-slate-500 outline-none transition"
          />
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5" />
        </div>
      </div>

      {/* Settlements Ledger List */}
      {isLoading ? (
        <div className="p-8 text-center text-xs text-slate-400 font-bold bg-slate-900/60 border border-slate-800 rounded-xl">
          <Clock className="w-5 h-5 mx-auto mb-2 text-indigo-400 animate-spin" />
          Querying settlement records...
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-8 text-center text-xs text-slate-400">
          No settlement records found matching current criteria.
        </div>
      ) : (
        <div className="space-y-2.5">
          {filtered.map((settlement) => (
            <div
              key={settlement.id}
              className="bg-slate-900/90 border border-slate-800 rounded-xl p-3 sm:p-3.5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3 hover:border-slate-700 transition"
            >
              {/* Left Column: Settlement Meta & Shop */}
              <div className="space-y-1 min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-black font-mono text-white">#{settlement.id}</span>
                  <span
                    className={`text-[9px] font-extrabold px-2 py-0.5 rounded-md border tracking-wide uppercase ${
                      settlement.status === 'PAID'
                        ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                        : settlement.status === 'PROCESSING'
                        ? 'bg-indigo-500/15 text-indigo-400 border-indigo-500/30'
                        : 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                    }`}
                  >
                    {settlement.status}
                  </span>
                  <span className="text-[10px] text-slate-400 font-medium">
                    Cycle: {new Date(settlement.periodStart).toLocaleDateString([], { month: 'short', day: 'numeric' })} -{' '}
                    {new Date(settlement.periodEnd).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                  </span>
                </div>

                <div className="flex items-center gap-2 text-xs">
                  <h3 className="font-extrabold text-white truncate">{settlement.shopName}</h3>
                  <span className="text-slate-400">•</span>
                  <span className="text-slate-300 truncate">Merchant: {settlement.sellerName}</span>
                </div>

                {settlement.payoutReferenceId && (
                  <div className="text-[10px] font-mono text-emerald-400 pt-0.5">
                    Ref ID: {settlement.payoutReferenceId}
                  </div>
                )}
              </div>

              {/* Middle Column: Financial Breakdown */}
              <div className="grid grid-cols-3 gap-2 bg-slate-950/70 p-2 rounded-lg border border-slate-800 text-center text-xs shrink-0 w-full sm:w-auto">
                <div className="px-2">
                  <div className="text-[8px] text-slate-400 font-bold uppercase">Gross GMV</div>
                  <div className="text-xs font-black text-white font-mono mt-0.5">
                    ₹{settlement.grossAmount}
                  </div>
                </div>

                <div className="px-2 border-x border-slate-800">
                  <div className="text-[8px] text-slate-400 font-bold uppercase">Comm Fee</div>
                  <div className="text-xs font-black text-rose-400 font-mono mt-0.5">
                    -₹{settlement.commissionDeducted}
                  </div>
                </div>

                <div className="px-2">
                  <div className="text-[8px] text-emerald-400 font-bold uppercase">Net Payable</div>
                  <div className="text-xs font-black text-emerald-400 font-mono mt-0.5">
                    ₹{settlement.netPayable}
                  </div>
                </div>
              </div>

              {/* Right Column: Action Button */}
              <div className="shrink-0 flex items-center justify-end">
                {settlement.status === 'PENDING' ? (
                  <button
                    onClick={() => handleOpenPayout(settlement)}
                    className="w-full sm:w-auto px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-sm shadow-emerald-900/30 flex items-center justify-center gap-1.5 transition active:scale-95"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Initiate Payout</span>
                  </button>
                ) : settlement.status === 'PROCESSING' ? (
                  <button
                    onClick={() => handleOpenPayout(settlement)}
                    className="w-full sm:w-auto px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-sm shadow-indigo-900/30 flex items-center justify-center gap-1.5 transition active:scale-95"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Confirm Bank Transfer</span>
                  </button>
                ) : (
                  <div className="text-[11px] text-slate-400 font-bold flex items-center gap-1 px-2 py-1 rounded bg-slate-950/60 border border-slate-800">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
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
                type="button"
                onClick={() => setPayoutModalSettlement(null)}
                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-xs font-bold flex items-center gap-1 transition"
              >
                <X className="w-3.5 h-3.5" />
                <span>Close</span>
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

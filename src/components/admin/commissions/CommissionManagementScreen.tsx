/**
 * Commission Engine & Pricing Governance Screen
 */

import React, { useState, useEffect } from 'react';
import { adminApi } from '../../../services/adminApi.ts';
import { CommissionConfig } from '../../../types/financial.ts';
import {
  Percent,
  IndianRupee,
  Save,
  CheckCircle2,
  AlertCircle,
  Store,
  Info,
  ShieldCheck,
  Zap,
} from 'lucide-react';

export const CommissionManagementScreen: React.FC = () => {
  const [config, setConfig] = useState<CommissionConfig | null>(null);
  const [shops, setShops] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Form State
  const [defaultRate, setDefaultRate] = useState<number>(5.0);
  const [minCap, setMinCap] = useState<number>(2.0);
  const [maxCap, setMaxCap] = useState<number>(50.0);
  const [settlementCycleDays, setSettlementCycleDays] = useState<number>(7);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [commData, shopsData] = await Promise.all([
        adminApi.getCommissionConfig(),
        adminApi.getShops(),
      ]);
      setConfig(commData);
      setDefaultRate(commData.defaultPercentage || 5.0);
      setMinCap(commData.minCommissionPerOrder || 2.0);
      setMaxCap(commData.maxCommissionCap || 50.0);
      setSettlementCycleDays(7);
      setShops(shopsData);
    } catch (err) {
      console.error('Failed to load commission config', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveSuccess(false);
    try {
      await adminApi.updateCommissionConfig({
        defaultPercentage: Number(defaultRate),
        minCommissionPerOrder: Number(minCap),
        maxCommissionCap: Number(maxCap),
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      alert(err.message || 'Failed to update commission config');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Compact Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3.5 sm:p-4 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-indigo-500/15 border border-indigo-500/30 text-indigo-400 flex items-center justify-center shrink-0">
            <Percent className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-base font-extrabold text-white flex items-center gap-2">
              <span>Commission Engine & Fees</span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                {defaultRate}% Baseline
              </span>
            </h2>
            <p className="text-[11px] text-slate-400">
              Platform take-rates, merchant settlement cycles, and shop fee structures
            </p>
          </div>
        </div>

        {saveSuccess && (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-950 border border-emerald-700 text-emerald-300 text-[11px] font-bold animate-in fade-in self-start sm:self-auto">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Policy Saved</span>
          </div>
        )}
      </div>

      {/* 3 Compact KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
        <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Platform Take-Rate</p>
            <h3 className="text-lg font-black text-indigo-400 mt-0.5">{defaultRate}%</h3>
            <p className="text-[10px] text-slate-500">Order gross deduction</p>
          </div>
          <div className="w-9 h-9 rounded-lg bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 flex items-center justify-center shrink-0">
            <Percent className="w-4 h-4" />
          </div>
        </div>

        <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold text-teal-400 uppercase tracking-wider">Order Min / Max Cap</p>
            <h3 className="text-lg font-black text-teal-400 mt-0.5">₹{minCap} – ₹{maxCap}</h3>
            <p className="text-[10px] text-teal-400/70">Per order threshold</p>
          </div>
          <div className="w-9 h-9 rounded-lg bg-teal-500/10 border border-teal-500/30 text-teal-400 flex items-center justify-center shrink-0">
            <IndianRupee className="w-4 h-4" />
          </div>
        </div>

        <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold text-amber-400 uppercase tracking-wider">Settlement Recurrence</p>
            <h3 className="text-lg font-black text-amber-400 mt-0.5">{settlementCycleDays} Days</h3>
            <p className="text-[10px] text-amber-400/70">Payout cycle frequency</p>
          </div>
          <div className="w-9 h-9 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center shrink-0">
            <Zap className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* Global Config Form & Formula Card */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        {/* Global Commission Setting Form */}
        <div className="lg:col-span-2 bg-slate-900/90 border border-slate-800 rounded-xl p-3.5 sm:p-4 shadow-sm space-y-3.5">
          <div className="flex items-center gap-2 border-b border-slate-800/80 pb-2.5">
            <Zap className="w-4 h-4 text-amber-400" />
            <h3 className="text-xs font-black text-white">Platform Commission Policy</h3>
          </div>

          <form onSubmit={handleSaveConfig} className="space-y-3 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <label className="block text-[11px] text-slate-400 font-bold mb-1">
                  Default Platform Commission Rate (%)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="50"
                    required
                    value={defaultRate}
                    onChange={(e) => setDefaultRate(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white text-sm font-black outline-none focus:border-indigo-500"
                  />
                  <span className="absolute right-3 top-2 text-slate-400 font-bold text-xs">%</span>
                </div>
                <p className="text-[10px] text-slate-500 mt-0.5">
                  Deducted automatically from merchant order gross.
                </p>
              </div>

              <div>
                <label className="block text-[11px] text-slate-400 font-bold mb-1">
                  Settlement Cycle (Days)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="1"
                    max="30"
                    required
                    value={settlementCycleDays}
                    onChange={(e) => setSettlementCycleDays(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white text-sm font-black outline-none focus:border-indigo-500"
                  />
                  <span className="absolute right-3 top-2 text-slate-400 font-bold text-xs">Days</span>
                </div>
                <p className="text-[10px] text-slate-500 mt-0.5">
                  Payout recurrence for generating settlement balance reports.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <label className="block text-[11px] text-slate-400 font-bold mb-1">
                  Min Commission Cap per Order (₹)
                </label>
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  required
                  value={minCap}
                  onChange={(e) => setMinCap(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white font-bold outline-none focus:border-indigo-500 text-xs"
                />
              </div>

              <div>
                <label className="block text-[11px] text-slate-400 font-bold mb-1">
                  Max Commission Cap per Order (₹)
                </label>
                <input
                  type="number"
                  step="1"
                  min="0"
                  required
                  value={maxCap}
                  onChange={(e) => setMaxCap(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white font-bold outline-none focus:border-indigo-500 text-xs"
                />
              </div>
            </div>

            <div className="pt-2.5 border-t border-slate-800 flex justify-end">
              <button
                type="submit"
                disabled={isSaving}
                className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs shadow-md shadow-indigo-600/30 flex items-center gap-1.5 transition"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{isSaving ? 'Saving Policy...' : 'Save Global Policy'}</span>
              </button>
            </div>
          </form>
        </div>

        {/* Calculation Logic Info */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5 sm:p-4 shadow-sm space-y-3 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 border-b border-slate-800/80 pb-2.5">
              <Info className="w-4 h-4 text-indigo-400" />
              <h3 className="text-xs font-black text-white">Financial Enforcement</h3>
            </div>
            <p className="text-[11px] text-slate-400 mt-2 leading-relaxed">
              Mathematical revenue separation executes automatically upon order confirmation.
            </p>

            <div className="mt-2.5 p-2.5 rounded-lg bg-slate-950 border border-slate-800 space-y-1.5 text-xs">
              <div className="text-[9px] font-mono text-slate-400 uppercase">Settlement Formula:</div>
              <div className="p-2 rounded-md bg-slate-900 border border-slate-800 font-mono text-emerald-400 text-[10px] leading-relaxed">
                NetPayable = Subtotal - (Subtotal × Rate)
              </div>
              <p className="text-[10px] text-slate-500 mt-1">
                Platform fees and delivery are processed independently to ensure zero merchant distortion.
              </p>
            </div>
          </div>

          <div className="p-2.5 rounded-lg bg-indigo-950/40 border border-indigo-800/40 text-[11px] text-indigo-300">
            <span className="font-bold">Shop Overrides:</span> To assign a custom negotiated rate, open the <span className="font-bold text-white">Shops & Approvals</span> tab.
          </div>
        </div>
      </div>

      {/* Shop Specific Commission Table */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5 sm:p-4 shadow-sm space-y-3">
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5">
          <div className="flex items-center gap-2">
            <Store className="w-4 h-4 text-indigo-400" />
            <h3 className="text-xs font-black text-white">Active Merchant Commission Rates</h3>
          </div>
          <span className="text-[11px] text-slate-400">Baseline default: <span className="text-indigo-400 font-bold">{defaultRate}%</span></span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-800 text-[9px] font-extrabold uppercase tracking-wider text-slate-400">
              <tr>
                <th className="pb-2">Shop & Mandi</th>
                <th className="pb-2">Merchant Name</th>
                <th className="pb-2 text-center">Category</th>
                <th className="pb-2 text-right">Commission Rate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {shops.map((shop) => (
                <tr key={shop.id} className="hover:bg-slate-800/30 transition">
                  <td className="py-2.5 font-bold text-white">
                    <span className="text-xs">{shop.name}</span>
                    <div className="text-[10px] text-slate-400 font-normal">{shop.marketName}</div>
                  </td>
                  <td className="py-2.5 text-slate-300 text-xs">{shop.sellerName}</td>
                  <td className="py-2.5 text-center">
                    <span className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 text-[10px] font-bold">
                      {shop.category}
                    </span>
                  </td>
                  <td className="py-2.5 text-right font-black font-mono text-indigo-400 text-xs">
                    {shop.effectiveCommissionPercentage}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

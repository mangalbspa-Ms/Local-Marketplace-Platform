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
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-white flex items-center gap-2">
            <Percent className="w-5 h-5 text-indigo-400" />
            <span>Commission Engine & Fee Structures</span>
          </h2>
          <p className="text-xs text-slate-400">
            Define platform take-rates, merchant settlement cycles, and custom shop rate overrides.
          </p>
        </div>

        {saveSuccess && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-950 border border-emerald-700 text-emerald-300 text-xs font-bold animate-in fade-in">
            <CheckCircle2 className="w-4 h-4" />
            <span>Configuration Updated Successfully</span>
          </div>
        )}
      </div>

      {/* Global Config Form & Formula Card */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Global Commission Setting Form */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl space-y-5">
          <h3 className="text-base font-black text-white flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-400" />
            <span>Platform Commission Policy</span>
          </h3>

          <form onSubmit={handleSaveConfig} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-400 font-bold mb-1.5">
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
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white text-base font-black outline-none focus:border-indigo-500"
                  />
                  <span className="absolute right-4 top-3.5 text-slate-400 font-bold">%</span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Baseline platform commission deducted automatically from merchant order gross.
                </p>
              </div>

              <div>
                <label className="block text-slate-400 font-bold mb-1.5">
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
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white text-base font-black outline-none focus:border-indigo-500"
                  />
                  <span className="absolute right-4 top-3.5 text-slate-400 font-bold">Days</span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Payout recurrence for generating merchant settlement balance reports.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-400 font-bold mb-1.5">
                  Minimum Commission Cap per Order (₹)
                </label>
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  required
                  value={minCap}
                  onChange={(e) => setMinCap(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-white font-bold outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-bold mb-1.5">
                  Maximum Commission Cap per Order (₹)
                </label>
                <input
                  type="number"
                  step="1"
                  min="0"
                  required
                  value={maxCap}
                  onChange={(e) => setMaxCap(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-white font-bold outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800 flex justify-end">
              <button
                type="submit"
                disabled={isSaving}
                className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs shadow-lg shadow-indigo-600/30 flex items-center gap-2 transition"
              >
                <Save className="w-4 h-4" />
                <span>{isSaving ? 'Saving Policy...' : 'Save Global Policy'}</span>
              </button>
            </div>
          </form>
        </div>

        {/* Calculation Logic Info */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl space-y-4 flex flex-col justify-between">
          <div>
            <h3 className="text-base font-black text-white flex items-center gap-2">
              <Info className="w-4 h-4 text-indigo-400" />
              <span>Financial Rules Enforcement</span>
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              The platform executes mathematical revenue separation at the moment of order confirmation.
            </p>

            <div className="mt-4 p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2 text-xs">
              <div className="text-[10px] font-mono text-slate-400 uppercase">Settlement Formula:</div>
              <div className="p-2 rounded-xl bg-slate-900 border border-slate-800 font-mono text-emerald-400 text-[11px] leading-relaxed">
                SellerNetPayable = ItemSubtotal - (ItemSubtotal × CommissionRate)
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Platform fees and delivery charges are processed independently to ensure zero merchant balance distortion.
              </p>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-indigo-950/40 border border-indigo-800/40 text-xs text-indigo-300">
            <span className="font-bold">Shop-Specific Overrides:</span> To assign a special negotiated rate to an individual shop, navigate to the <span className="font-bold text-white">Shops & Approvals</span> tab.
          </div>
        </div>
      </div>

      {/* Shop Specific Commission Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-black text-white flex items-center gap-2">
            <Store className="w-4 h-4 text-indigo-400" />
            <span>Active Merchant Commission Rates</span>
          </h3>
          <span className="text-xs text-slate-400">Baseline default: {defaultRate}%</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-800 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
              <tr>
                <th className="pb-3">Shop & Mandi</th>
                <th className="pb-3">Merchant Name</th>
                <th className="pb-3 text-center">Category</th>
                <th className="pb-3 text-right">Commission Rate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {shops.map((shop) => (
                <tr key={shop.id} className="hover:bg-slate-800/30 transition">
                  <td className="py-3 font-bold text-white">
                    {shop.name}
                    <div className="text-[10px] text-slate-400 font-normal">{shop.marketName}</div>
                  </td>
                  <td className="py-3 text-slate-300">{shop.sellerName}</td>
                  <td className="py-3 text-center">
                    <span className="px-2 py-0.5 rounded-lg bg-slate-800 text-slate-300 text-[10px] font-bold">
                      {shop.category}
                    </span>
                  </td>
                  <td className="py-3 text-right font-black font-mono text-indigo-400 text-sm">
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

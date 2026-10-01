/**
 * System Settings & Governance Parameters Screen
 */

import React, { useState, useEffect } from 'react';
import { adminApi } from '../../../services/adminApi.ts';
import { SystemSettings } from '../../../types/admin.ts';
import {
  Settings,
  Save,
  CheckCircle2,
  AlertTriangle,
  ShieldAlert,
  Phone,
  Mail,
  Truck,
  IndianRupee,
  Lock,
} from 'lucide-react';

export const SystemSettingsScreen: React.FC = () => {
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Form State
  const [appName, setAppName] = useState('Local Bazaar Mandi');
  const [supportPhone, setSupportPhone] = useState('+919999999999');
  const [supportEmail, setSupportEmail] = useState('support@localbazaar.in');
  const [baseDeliveryFee, setBaseDeliveryFee] = useState<number>(30);
  const [freeDeliveryThreshold, setFreeDeliveryThreshold] = useState<number>(499);
  const [platformFee, setPlatformFee] = useState<number>(5);
  const [maintenanceMode, setMaintenanceMode] = useState<boolean>(false);
  const [maintenanceMessage, setMaintenanceMessage] = useState(
    'Marketplace undergoing scheduled system maintenance.'
  );

  const loadSettings = async () => {
    setIsLoading(true);
    try {
      const data = await adminApi.getSystemSettings();
      setSettings(data);
      setAppName(data.appName || 'Local Bazaar Mandi');
      setSupportPhone(data.supportPhone || '+919999999999');
      setSupportEmail(data.supportEmail || 'support@localbazaar.in');
      setBaseDeliveryFee(data.baseDeliveryFee || 30);
      setFreeDeliveryThreshold(data.freeDeliveryThreshold || 499);
      setPlatformFee(data.platformFee || 5);
      setMaintenanceMode(data.maintenanceMode || false);
      setMaintenanceMessage(data.maintenanceMessage || 'Marketplace undergoing maintenance.');
    } catch (err) {
      console.error('Failed to load system settings', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveSuccess(false);
    try {
      await adminApi.updateSystemSettings({
        appName,
        supportPhone,
        supportEmail,
        baseDeliveryFee: Number(baseDeliveryFee),
        freeDeliveryThreshold: Number(freeDeliveryThreshold),
        platformFee: Number(platformFee),
        maintenanceMode,
        maintenanceMessage,
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      alert(err.message || 'Failed to update system settings');
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
            <Settings className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-base font-extrabold text-white flex items-center gap-2">
              <span>Platform Governance & Global Settings</span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                maintenanceMode
                  ? 'bg-rose-500/15 text-rose-400 border-rose-500/30'
                  : 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
              }`}>
                {maintenanceMode ? 'Lockdown' : 'Operational'}
              </span>
            </h2>
            <p className="text-[11px] text-slate-400">
              System parameters, support contact channels, default logistics fees, and emergency locks
            </p>
          </div>
        </div>

        {saveSuccess && (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-950 border border-emerald-700 text-emerald-300 text-[11px] font-bold animate-in fade-in self-start sm:self-auto">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Settings Saved</span>
          </div>
        )}
      </div>

      {/* 3 Compact KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
        <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Base Delivery Fee</p>
            <h3 className="text-lg font-black text-white mt-0.5 font-mono">₹{baseDeliveryFee}</h3>
            <p className="text-[10px] text-slate-500">Free above ₹{freeDeliveryThreshold}</p>
          </div>
          <div className="w-9 h-9 rounded-lg bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 flex items-center justify-center shrink-0">
            <Truck className="w-4 h-4" />
          </div>
        </div>

        <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold text-teal-400 uppercase tracking-wider">Platform Tech Fee</p>
            <h3 className="text-lg font-black text-teal-400 mt-0.5 font-mono">₹{platformFee}</h3>
            <p className="text-[10px] text-teal-400/70">Charged per order</p>
          </div>
          <div className="w-9 h-9 rounded-lg bg-teal-500/10 border border-teal-500/30 text-teal-400 flex items-center justify-center shrink-0">
            <IndianRupee className="w-4 h-4" />
          </div>
        </div>

        <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 shadow-xs flex items-center justify-between">
          <div>
            <p className={`text-[10px] font-bold uppercase tracking-wider ${maintenanceMode ? 'text-rose-400' : 'text-emerald-400'}`}>
              Maintenance Mode
            </p>
            <h3 className={`text-lg font-black mt-0.5 ${maintenanceMode ? 'text-rose-400' : 'text-emerald-400'}`}>
              {maintenanceMode ? 'LOCKED' : 'ACTIVE'}
            </h3>
            <p className="text-[10px] text-slate-500">
              {maintenanceMode ? 'Storefront paused' : 'Storefront live'}
            </p>
          </div>
          <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 border ${
            maintenanceMode
              ? 'bg-rose-500/10 border-rose-500/30 text-rose-400'
              : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
          }`}>
            <Lock className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* Settings Form */}
      <form onSubmit={handleSaveSettings} className="space-y-3 text-xs">
        {/* Marketplace Identity & Contact */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5 sm:p-4 shadow-sm space-y-3">
          <div className="flex items-center gap-2 border-b border-slate-800/80 pb-2.5">
            <ShieldAlert className="w-4 h-4 text-indigo-400" />
            <h3 className="text-xs font-black text-white">Marketplace Identity & Support Helpline</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <div>
              <label className="block text-[11px] text-slate-400 font-bold mb-1">Platform Brand Name</label>
              <input
                type="text"
                required
                value={appName}
                onChange={(e) => setAppName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white font-bold outline-none focus:border-indigo-500 text-xs"
              />
            </div>

            <div>
              <label className="block text-[11px] text-slate-400 font-bold mb-1">Support Phone Helpline</label>
              <input
                type="text"
                required
                value={supportPhone}
                onChange={(e) => setSupportPhone(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white font-bold outline-none focus:border-indigo-500 text-xs"
              />
            </div>

            <div>
              <label className="block text-[11px] text-slate-400 font-bold mb-1">Support Email Address</label>
              <input
                type="email"
                required
                value={supportEmail}
                onChange={(e) => setSupportEmail(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white font-bold outline-none focus:border-indigo-500 text-xs"
              />
            </div>
          </div>
        </div>

        {/* Global Delivery & Logistics Policy */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5 sm:p-4 shadow-sm space-y-3">
          <div className="flex items-center gap-2 border-b border-slate-800/80 pb-2.5">
            <Truck className="w-4 h-4 text-indigo-400" />
            <h3 className="text-xs font-black text-white">Default Logistics & Pricing Policy</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <div>
              <label className="block text-[11px] text-slate-400 font-bold mb-1">
                Base Delivery Fee (₹)
              </label>
              <input
                type="number"
                min="0"
                required
                value={baseDeliveryFee}
                onChange={(e) => setBaseDeliveryFee(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white font-bold outline-none focus:border-indigo-500 font-mono text-xs"
              />
            </div>

            <div>
              <label className="block text-[11px] text-slate-400 font-bold mb-1">
                Free Delivery Threshold (₹)
              </label>
              <input
                type="number"
                min="0"
                required
                value={freeDeliveryThreshold}
                onChange={(e) => setFreeDeliveryThreshold(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white font-bold outline-none focus:border-indigo-500 font-mono text-xs"
              />
            </div>

            <div>
              <label className="block text-[11px] text-slate-400 font-bold mb-1">
                Platform Technology Fee (₹)
              </label>
              <input
                type="number"
                min="0"
                required
                value={platformFee}
                onChange={(e) => setPlatformFee(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white font-bold outline-none focus:border-indigo-500 font-mono text-xs"
              />
            </div>
          </div>
        </div>

        {/* Emergency Maintenance Lockdown */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5 sm:p-4 shadow-sm space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5">
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-rose-400" />
              <h3 className="text-xs font-black text-rose-400">Emergency Maintenance Lockdown</h3>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="maintToggle"
                checked={maintenanceMode}
                onChange={(e) => setMaintenanceMode(e.target.checked)}
                className="w-4 h-4 rounded text-rose-600 bg-slate-950 border-slate-700 focus:ring-0 cursor-pointer"
              />
              <label
                htmlFor="maintToggle"
                className="text-[11px] font-black text-slate-200 cursor-pointer"
              >
                ENABLE LOCKDOWN
              </label>
            </div>
          </div>

          <p className="text-[11px] text-slate-400">
            When enabled, customer checkout and seller order intake will display a maintenance warning.
          </p>

          <div>
            <label className="block text-[11px] text-slate-400 font-bold mb-1">
              Public Maintenance Notice Message
            </label>
            <input
              type="text"
              value={maintenanceMessage}
              onChange={(e) => setMaintenanceMessage(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white outline-none focus:border-indigo-500 text-xs"
            />
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end pt-1">
          <button
            type="submit"
            disabled={isSaving}
            className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs shadow-md shadow-indigo-600/30 flex items-center gap-1.5 transition"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{isSaving ? 'Saving Parameters...' : 'Save Settings'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};

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
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-white flex items-center gap-2">
            <Settings className="w-5 h-5 text-indigo-400" />
            <span>Platform Governance & Global Settings</span>
          </h2>
          <p className="text-xs text-slate-400">
            Configure system parameters, support contact channels, default logistics fees, and emergency locks.
          </p>
        </div>

        {saveSuccess && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-950 border border-emerald-700 text-emerald-300 text-xs font-bold animate-in fade-in">
            <CheckCircle2 className="w-4 h-4" />
            <span>Settings Saved Successfully</span>
          </div>
        )}
      </div>

      {/* Settings Form */}
      <form onSubmit={handleSaveSettings} className="space-y-6 text-xs">
        {/* Marketplace Identity & Contact */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl space-y-4">
          <h3 className="text-base font-black text-white flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-indigo-400" />
            <span>Marketplace Identity & Support Hotline</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-slate-400 font-bold mb-1.5">Platform Brand Name</label>
              <input
                type="text"
                required
                value={appName}
                onChange={(e) => setAppName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-white font-bold outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-slate-400 font-bold mb-1.5">Support Phone Helpline</label>
              <input
                type="text"
                required
                value={supportPhone}
                onChange={(e) => setSupportPhone(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-white font-bold outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-slate-400 font-bold mb-1.5">Support Email Address</label>
              <input
                type="email"
                required
                value={supportEmail}
                onChange={(e) => setSupportEmail(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-white font-bold outline-none focus:border-indigo-500"
              />
            </div>
          </div>
        </div>

        {/* Global Delivery & Logistics Policy */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl space-y-4">
          <h3 className="text-base font-black text-white flex items-center gap-2">
            <Truck className="w-4 h-4 text-indigo-400" />
            <span>Default Customer Logistics & Pricing Policy</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-slate-400 font-bold mb-1.5">
                Base Delivery Fee (₹)
              </label>
              <input
                type="number"
                min="0"
                required
                value={baseDeliveryFee}
                onChange={(e) => setBaseDeliveryFee(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-white font-bold outline-none focus:border-indigo-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-slate-400 font-bold mb-1.5">
                Free Delivery Order Threshold (₹)
              </label>
              <input
                type="number"
                min="0"
                required
                value={freeDeliveryThreshold}
                onChange={(e) => setFreeDeliveryThreshold(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-white font-bold outline-none focus:border-indigo-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-slate-400 font-bold mb-1.5">
                Platform Technology Fee (₹)
              </label>
              <input
                type="number"
                min="0"
                required
                value={platformFee}
                onChange={(e) => setPlatformFee(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-white font-bold outline-none focus:border-indigo-500 font-mono"
              />
            </div>
          </div>
        </div>

        {/* Emergency Maintenance Lockdown */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-black text-rose-400 flex items-center gap-2">
              <Lock className="w-4 h-4 text-rose-400" />
              <span>Emergency Maintenance Lockdown</span>
            </h3>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="maintToggle"
                checked={maintenanceMode}
                onChange={(e) => setMaintenanceMode(e.target.checked)}
                className="w-5 h-5 rounded text-rose-600 bg-slate-950 border-slate-700 focus:ring-0 cursor-pointer"
              />
              <label
                htmlFor="maintToggle"
                className="text-xs font-black text-slate-200 cursor-pointer"
              >
                ENABLE MAINTENANCE MODE
              </label>
            </div>
          </div>

          <p className="text-xs text-slate-400">
            When enabled, customer checkout and seller order intake will display a maintenance warning.
          </p>

          <div>
            <label className="block text-slate-400 font-bold mb-1.5">
              Public Maintenance Notice Message
            </label>
            <input
              type="text"
              value={maintenanceMessage}
              onChange={(e) => setMaintenanceMessage(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-white outline-none focus:border-indigo-500"
            />
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={isSaving}
            className="px-6 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs shadow-lg shadow-indigo-600/30 flex items-center gap-2 transition"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? 'Saving System Parameters...' : 'Save System Settings'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};

/**
 * Secure Admin Login Screen
 * 
 * Strict RBAC: Access is restricted to `role === ADMIN`.
 * Non-admin roles (Customer / Seller) are blocked with a clear security notice.
 */

import React, { useState } from 'react';
import { useAdminAuth } from '../../../context/AdminAuthContext.tsx';
import { Shield, Lock, AlertCircle, CheckCircle2, UserCheck, ArrowRight } from 'lucide-react';

export const AdminLoginScreen: React.FC = () => {
  const { login, loginAsDemoAdmin, isLoading, error, clearError } = useAdminAuth();
  const [credential, setCredential] = useState('');
  const [password, setPassword] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    clearError();

    if (!credential.trim()) {
      setLocalError('Please enter your Admin Phone Number or User ID.');
      return;
    }

    try {
      await login(credential, password);
    } catch (err: any) {
      // Error handled in context
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center px-4 py-8 relative">
      {/* Background Ambience */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative z-10">
        {/* Header */}
        <div className="text-center space-y-3 mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 mb-2">
            <Shield className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white">
            Admin Governance Portal
          </h1>
          <p className="text-xs text-slate-400 max-w-xs mx-auto">
            Local Marketplace Platform Control Panel. Restricted strictly to authorized administrative officers.
          </p>
        </div>

        {/* Error Alert */}
        {(error || localError) && (
          <div className="mb-6 p-4 rounded-2xl bg-rose-950/50 border border-rose-800/80 flex items-start gap-3 text-rose-300 text-xs">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Authentication Refused</p>
              <p className="mt-0.5 text-rose-200/90">{error || localError}</p>
            </div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-400 mb-1.5">
              Admin Identifier / Phone
            </label>
            <div className="relative">
              <input
                type="text"
                value={credential}
                onChange={(e) => setCredential(e.target.value)}
                placeholder="e.g. +919999999999 or usr_admin_01"
                className="w-full bg-slate-950 border border-slate-700/80 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 outline-none transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-400 mb-1.5">
              Security Token / Password
            </label>
            <div className="relative">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full bg-slate-950 border border-slate-700/80 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 outline-none transition"
              />
              <Lock className="w-4 h-4 text-slate-500 absolute right-3.5 top-3.5" />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-extrabold text-sm shadow-lg shadow-indigo-600/25 flex items-center justify-center gap-2 transition disabled:opacity-50"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <span>Enter Admin Console</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Quick Sandbox Evaluation Button */}
        <div className="mt-8 pt-6 border-t border-slate-800 text-center">
          <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider mb-3">
            Sandbox & Development Access
          </p>
          <button
            type="button"
            onClick={loginAsDemoAdmin}
            disabled={isLoading}
            className="w-full py-2.5 px-3 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700 text-slate-300 text-xs font-bold flex items-center justify-center gap-2 transition"
          >
            <UserCheck className="w-4 h-4 text-emerald-400" />
            <span>Sign in as Super Admin (Rajesh Malhotra)</span>
          </button>
          <p className="text-[10px] text-slate-500 mt-2">
            Role validation enforced: non-admin roles will be rejected automatically.
          </p>
        </div>
      </div>
    </div>
  );
};

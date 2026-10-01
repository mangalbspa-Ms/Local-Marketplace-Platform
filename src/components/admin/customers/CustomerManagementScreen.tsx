/**
 * Customer Directory & Governance Screen
 */

import React, { useState, useEffect } from 'react';
import { adminApi } from '../../../services/adminApi.ts';
import { PhotoManagerModal } from '../../common/PhotoManagerModal.tsx';
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
  Camera,
  Image as ImageIcon,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';

export const CustomerManagementScreen: React.FC = () => {
  const [customers, setCustomers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activePhotoTarget, setActivePhotoTarget] = useState<{
    customer: any;
    type: 'profile' | 'cover';
  } | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

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

  const handleSaveCustomerPhoto = async (result: {
    action: 'set' | 'remove';
    url?: string;
    imageData?: string;
  }) => {
    if (!activePhotoTarget) return;
    try {
      const updated = await adminApi.manageUserPhotos(activePhotoTarget.customer.id, {
        type: activePhotoTarget.type,
        action: result.action,
        url: result.url,
        imageData: result.imageData,
      });
      // Update locally in customer list
      setCustomers((prev) =>
        prev.map((c) =>
          c.id === activePhotoTarget.customer.id
            ? {
                ...c,
                ...(activePhotoTarget.type === 'profile'
                  ? { profilePhotoUrl: updated.profilePhotoUrl, avatarUrl: updated.avatarUrl }
                  : { coverPhotoUrl: updated.coverPhotoUrl }),
              }
            : c
        )
      );
      showToast(
        `${activePhotoTarget.customer.fullName} की ${
          activePhotoTarget.type === 'profile' ? 'Profile Photo' : 'Cover Photo'
        } सफलतापूर्वक ${result.action === 'remove' ? 'हटा दी गई' : 'अपडेट हो गई'}!`
      );
      setActivePhotoTarget(null);
    } catch (err: any) {
      alert('फोटो अपडेट करने में विफल: ' + err.message);
      throw err;
    }
  };

  const filtered = customers.filter((c) => {
    const q = (searchQuery || '').toLowerCase();
    return (
      (c?.fullName || '').toLowerCase().includes(q) ||
      (c?.phone || '').includes(searchQuery || '') ||
      (c?.email ? c.email.toLowerCase().includes(q) : false) ||
      (c?.city || '').toLowerCase().includes(q)
    );
  });

  const totalSpending = customers.reduce((sum, c) => sum + (c.totalSpending || 0), 0);
  const activeCount = customers.filter((c) => c.isActive).length;

  return (
    <div className="space-y-4">
      {/* Compact Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3.5 sm:p-4 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-indigo-500/15 border border-indigo-500/30 text-indigo-400 flex items-center justify-center shrink-0">
            <UserCheck className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-base font-extrabold text-white flex items-center gap-2">
              <span>Customer Directory & Orders</span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                {filtered.length} Buyers
              </span>
            </h2>
            <p className="text-[11px] text-slate-400">
              Registered customers, lifetime spending, order frequencies, and account status
            </p>
          </div>
        </div>

        <button
          onClick={loadCustomers}
          disabled={isLoading}
          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700/60 transition self-start sm:self-auto"
          title="Refresh Customers"
        >
          <RotateCcw className={`w-4 h-4 text-indigo-400 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* 3 Compact KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
        <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Registered Buyers</p>
            <h3 className="text-lg font-black text-white mt-0.5">{customers.length}</h3>
            <p className="text-[10px] text-slate-500">Customer accounts</p>
          </div>
          <div className="w-9 h-9 rounded-lg bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 flex items-center justify-center shrink-0">
            <UserCheck className="w-4 h-4" />
          </div>
        </div>

        <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">Active Customers</p>
            <h3 className="text-lg font-black text-emerald-400 mt-0.5">{activeCount}</h3>
            <p className="text-[10px] text-emerald-400/70">Verified & active</p>
          </div>
          <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-4 h-4" />
          </div>
        </div>

        <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold text-teal-400 uppercase tracking-wider">Lifetime Spend</p>
            <h3 className="text-lg font-black text-teal-400 mt-0.5">₹{totalSpending.toLocaleString()}</h3>
            <p className="text-[10px] text-teal-400/70">Total customer GMV</p>
          </div>
          <div className="w-9 h-9 rounded-lg bg-teal-500/10 border border-teal-500/30 text-teal-400 flex items-center justify-center shrink-0">
            <IndianRupee className="w-4 h-4" />
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
            placeholder="Search by customer name, phone, email, or city..."
            className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-lg px-3 py-2 pl-8 text-xs text-white placeholder-slate-500 outline-none transition"
          />
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5" />
        </div>
      </div>

      {/* Toast */}
      {toastMessage && (
        <div className="fixed top-4 right-4 z-50 px-3.5 py-2.5 rounded-xl bg-emerald-500 text-slate-950 font-black text-xs shadow-2xl flex items-center gap-2 animate-in fade-in slide-in-from-top-3">
          <CheckCircle2 className="w-4 h-4" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Grid */}
      {isLoading ? (
        <div className="p-8 text-center text-xs text-slate-400 font-bold bg-slate-900/60 border border-slate-800 rounded-xl">
          Loading customers...
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-8 text-center text-xs text-slate-400">
          No matching customer accounts found.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map((customer) => (
            <div
              key={customer.id}
              className={`rounded-xl border overflow-hidden bg-slate-900/90 shadow-sm flex flex-col justify-between hover:border-slate-700 transition ${
                customer.isActive ? 'border-slate-800' : 'border-rose-900/40 bg-slate-950/60 opacity-85'
              }`}
            >
              {/* Mini Cover Photo Header */}
              <div className="relative h-12 w-full bg-gradient-to-r from-emerald-800 via-teal-900 to-slate-900 overflow-hidden border-b border-slate-800">
                {customer.coverPhotoUrl && customer.coverPhotoUrl.trim() !== '' ? (
                  <img
                    src={customer.coverPhotoUrl}
                    alt={`${customer.fullName} Cover`}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center opacity-25">
                    <ImageIcon className="w-5 h-5 text-white" />
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => setActivePhotoTarget({ customer, type: 'cover' })}
                  className="absolute top-1.5 right-1.5 px-2 py-0.5 rounded-full bg-black/60 hover:bg-black/80 text-[9px] font-bold text-white flex items-center gap-1 border border-white/20 transition cursor-pointer"
                  title="Admin: Cover Photo बदलें/हटाएं"
                >
                  <Camera className="w-2.5 h-2.5" />
                  <span>Cover</span>
                </button>
              </div>

              <div className="p-3 sm:p-3.5 pt-2">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    {/* Customer Profile Photo */}
                    <div
                      onClick={() => setActivePhotoTarget({ customer, type: 'profile' })}
                      className="relative w-8 h-8 rounded-lg bg-emerald-600/20 border border-emerald-500/40 overflow-hidden cursor-pointer group shrink-0 flex items-center justify-center"
                      title="Admin: Profile Photo बदलें/हटाएं"
                    >
                      {customer.profilePhotoUrl || (customer.avatarUrl && customer.avatarUrl.trim() !== '') ? (
                        <img
                          src={customer.profilePhotoUrl || customer.avatarUrl}
                          alt={customer.fullName}
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <span className="text-emerald-400 font-black text-xs">
                          {customer.fullName?.charAt(0) || 'C'}
                        </span>
                      )}
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white">
                        <Camera className="w-3 h-3" />
                      </div>
                    </div>

                    <div className="min-w-0">
                      <h3 className="text-xs font-black text-white truncate">{customer.fullName}</h3>
                      <div className="text-[9px] text-slate-500 font-mono truncate">{customer.id}</div>
                    </div>
                  </div>

                  <span
                    className={`text-[9px] font-black px-2 py-0.5 rounded-md border shrink-0 ${
                      customer.isActive
                        ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                        : 'bg-rose-500/15 text-rose-400 border-rose-500/30'
                    }`}
                  >
                    {customer.isActive ? 'ACTIVE' : 'SUSPENDED'}
                  </span>
                </div>

                {/* Photo Quick Governance Buttons */}
                <div className="flex items-center gap-1.5 mb-2 p-1.5 rounded-lg bg-slate-950/80 border border-slate-800 text-[10px]">
                  <span className="text-slate-400 font-bold text-[9px]">Photos:</span>
                  <button
                    type="button"
                    onClick={() => setActivePhotoTarget({ customer, type: 'profile' })}
                    className="px-1.5 py-0.5 rounded bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-300 font-bold border border-indigo-500/30 transition text-[9px] flex items-center gap-1 cursor-pointer"
                  >
                    <Camera className="w-2.5 h-2.5" />
                    <span>Profile</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActivePhotoTarget({ customer, type: 'cover' })}
                    className="px-1.5 py-0.5 rounded bg-teal-600/30 hover:bg-teal-600/50 text-teal-300 font-bold border border-teal-500/30 transition text-[9px] flex items-center gap-1 cursor-pointer"
                  >
                    <ImageIcon className="w-2.5 h-2.5" />
                    <span>Cover</span>
                  </button>
                </div>

                {/* Contact info */}
                <div className="space-y-1 text-xs text-slate-300 mb-2 bg-slate-950/60 p-2 rounded-lg border border-slate-800/60">
                  <div className="flex items-center gap-1.5 text-[10px]">
                    <Phone className="w-3 h-3 text-slate-500 shrink-0" />
                    <span>{customer.phone}</span>
                  </div>
                  {customer.email && customer.email !== 'N/A' && (
                    <div className="flex items-center gap-1.5 text-[10px]">
                      <Mail className="w-3 h-3 text-slate-500 shrink-0" />
                      <span className="truncate">{customer.email}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-1.5 text-[10px] text-slate-400 pt-1 border-t border-slate-800/80">
                    <MapPin className="w-3 h-3 text-teal-400 shrink-0" />
                    <span className="text-slate-300 font-semibold truncate">
                      {customer.city} • {customer.marketName}
                    </span>
                  </div>
                </div>

                {/* Spending Metrics */}
                <div className="grid grid-cols-2 gap-1 py-1.5 border-y border-slate-800/80 mb-2 text-center">
                  <div className="bg-slate-950/40 p-1.5 rounded-lg">
                    <div className="text-[8px] text-slate-400 font-bold uppercase">Orders</div>
                    <div className="text-[11px] font-black text-white mt-0.5">{customer.totalOrdersCount || 0}</div>
                  </div>

                  <div className="bg-slate-950/40 p-1.5 rounded-lg">
                    <div className="text-[8px] text-slate-400 font-bold uppercase">Spend</div>
                    <div className="text-[11px] font-black text-emerald-400 mt-0.5">₹{customer.totalSpending || 0}</div>
                  </div>
                </div>

                {customer.lastOrderDate && (
                  <p className="text-[9px] text-slate-500 mb-2">
                    Last: {new Date(customer.lastOrderDate).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                  </p>
                )}
              </div>

              {/* Action */}
              <div className="p-3 pt-0">
                <button
                  onClick={() => handleToggleStatus(customer.id)}
                  className={`w-full py-1.5 px-2.5 rounded-lg text-[11px] font-bold flex items-center justify-center gap-1.5 transition border ${
                    customer.isActive
                      ? 'bg-rose-950/30 border-rose-800/60 text-rose-300 hover:bg-rose-900/50'
                      : 'bg-emerald-950/30 border-emerald-800/60 text-emerald-300 hover:bg-emerald-900/50'
                  }`}
                >
                  {customer.isActive ? (
                    <>
                      <Ban className="w-3 h-3" />
                      <span>Suspend Buyer</span>
                    </>
                  ) : (
                    <>
                      <RotateCcw className="w-3 h-3" />
                      <span>Reactivate Buyer</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Admin Photo Manager Modal for Customer */}
      {activePhotoTarget && (
        <PhotoManagerModal
          isOpen={true}
          onClose={() => setActivePhotoTarget(null)}
          type={activePhotoTarget.type}
          currentPhotoUrl={
            activePhotoTarget.type === 'profile'
              ? activePhotoTarget.customer.profilePhotoUrl || activePhotoTarget.customer.avatarUrl
              : activePhotoTarget.customer.coverPhotoUrl
          }
          targetName={activePhotoTarget.customer.fullName}
          onConfirm={handleSaveCustomerPhoto}
        />
      )}
    </div>
  );
};

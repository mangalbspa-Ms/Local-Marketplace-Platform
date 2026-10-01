/**
 * Admin Subscription & Billing Management Screen (Phase 9)
 * 
 * Comprehensive control panel for:
 * 1. Subscription Plans CRUD (Pricing, commission rate overrides, feature lists).
 * 2. Shop Billing Configurations (BillingMode, custom rates, assigned plans, status).
 * 3. Subscription Invoices & Payment Ledger.
 * 4. Platform Revenue Analytics (Commission + Subscription MRR/ARR).
 */

import React, { useState, useEffect } from 'react';
import {
  Zap,
  Plus,
  Edit2,
  Trash2,
  Check,
  X,
  CreditCard,
  Building2,
  FileText,
  DollarSign,
  TrendingUp,
  Percent,
  Calendar,
  AlertTriangle,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  RotateCcw,
  Sparkles,
  Shield,
  Layers,
  ArrowRight,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import { adminApi } from '../../../services/adminApi.ts';
import { useAdminPreferences } from '../../../context/AdminPreferencesContext.tsx';
import {
  SubscriptionPlan,
  SellerSubscription,
  SubscriptionInvoice,
  BillingTransaction,
} from '../../../types/financial.ts';

export const SubscriptionBillingScreen: React.FC = () => {
  const { t } = useAdminPreferences();
  const [activeSubTab, setActiveSubTab] = useState<'PLANS' | 'SHOPS_BILLING' | 'INVOICES' | 'TRANSACTIONS'>('PLANS');
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [shops, setShops] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<SubscriptionInvoice[]>([]);
  const [subscriptions, setSubscriptions] = useState<SellerSubscription[]>([]);
  const [transactions, setTransactions] = useState<BillingTransaction[]>([]);
  const [platformStats, setPlatformStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Plan Edit / Create Modal State
  const [editingPlan, setEditingPlan] = useState<Partial<SubscriptionPlan> | null>(null);
  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
  const [isSavingPlan, setIsSavingPlan] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [newFeatureInput, setNewFeatureInput] = useState('');

  // Delete Confirmation Modal State
  const [planToDelete, setPlanToDelete] = useState<SubscriptionPlan | null>(null);
  const [isDeletingPlan, setIsDeletingPlan] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Shop Billing Edit Modal State
  const [editingShop, setEditingShop] = useState<any | null>(null);
  const [isShopBillingModalOpen, setIsShopBillingModalOpen] = useState(false);
  const [shopBillingForm, setShopBillingForm] = useState({
    billingMode: 'COMMISSION',
    customCommissionPercentage: 5,
    subscriptionPlanId: '',
    deductSubscriptionFromSettlement: false,
  });

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [plansResult, shopsResult, invsResult, subsResult, txsResult, statsResult] =
        await Promise.allSettled([
          adminApi.getSubscriptionPlans(false),
          adminApi.getShops(),
          adminApi.getSubscriptionInvoices(),
          adminApi.getSellerSubscriptions(),
          adminApi.getBillingTransactions(),
          adminApi.getStats(),
        ]);

      if (plansResult.status === 'fulfilled' && Array.isArray(plansResult.value)) {
        setPlans(plansResult.value);
      }
      if (shopsResult.status === 'fulfilled' && Array.isArray(shopsResult.value)) {
        setShops(shopsResult.value);
      }
      if (invsResult.status === 'fulfilled' && Array.isArray(invsResult.value)) {
        setInvoices(invsResult.value);
      }
      if (subsResult.status === 'fulfilled' && Array.isArray(subsResult.value)) {
        setSubscriptions(subsResult.value);
      }
      if (txsResult.status === 'fulfilled' && Array.isArray(txsResult.value)) {
        setTransactions(txsResult.value);
      }
      if (statsResult.status === 'fulfilled') {
        setPlatformStats(statsResult.value);
      }
    } catch (err) {
      console.error('Failed to load subscription & billing data', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // --- Plan Handlers ---
  const handleOpenCreatePlan = () => {
    setEditingPlan({
      name: '',
      description: '',
      price: 999,
      interval: 'MONTHLY',
      commissionPercentage: 2.5,
      features: ['Priority Search Listing', 'Unlimited Products', 'Direct Phone Support'],
      maxProducts: undefined,
      isActive: true,
      isPopular: false,
    });
    setFormError(null);
    setNewFeatureInput('');
    setIsPlanModalOpen(true);
  };

  const handleOpenEditPlan = (plan: SubscriptionPlan) => {
    setEditingPlan({
      ...plan,
      features: Array.isArray(plan.features) ? [...plan.features] : [],
    });
    setFormError(null);
    setNewFeatureInput('');
    setIsPlanModalOpen(true);
  };

  const handleAddFeature = () => {
    const trimmed = newFeatureInput.trim();
    if (!trimmed || !editingPlan) return;
    const currentFeatures = Array.isArray(editingPlan.features) ? [...editingPlan.features] : [];
    if (!currentFeatures.includes(trimmed)) {
      setEditingPlan({
        ...editingPlan,
        features: [...currentFeatures, trimmed],
      });
    }
    setNewFeatureInput('');
  };

  const handleRemoveFeature = (indexToRemove: number) => {
    if (!editingPlan) return;
    const currentFeatures = Array.isArray(editingPlan.features) ? [...editingPlan.features] : [];
    setEditingPlan({
      ...editingPlan,
      features: currentFeatures.filter((_, idx) => idx !== indexToRemove),
    });
  };

  const handleSavePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPlan) return;

    const trimmedName = (editingPlan.name || '').trim();
    if (!trimmedName) {
      setFormError('Plan name is required.');
      return;
    }

    const priceNum = Number(editingPlan.price);
    if (isNaN(priceNum) || priceNum < 0) {
      setFormError('Price must be a valid number (0 or higher).');
      return;
    }

    const commNum = Number(editingPlan.commissionPercentage);
    if (isNaN(commNum) || commNum < 0 || commNum > 100) {
      setFormError('Commission rate must be between 0% and 100%.');
      return;
    }

    try {
      setIsSavingPlan(true);
      setFormError(null);

      // Clean feature list
      let finalFeatures = (editingPlan.features || [])
        .map((f) => String(f).trim())
        .filter(Boolean);

      // If user typed something in newFeatureInput without clicking add, include it
      if (newFeatureInput.trim()) {
        const extra = newFeatureInput.trim();
        if (!finalFeatures.includes(extra)) {
          finalFeatures.push(extra);
        }
      }

      const payload: any = {
        name: trimmedName,
        description: (editingPlan.description || '').trim(),
        price: priceNum,
        monthlyPrice: priceNum,
        interval: editingPlan.interval || 'MONTHLY',
        billingInterval: editingPlan.interval || 'MONTHLY',
        commissionPercentage: Math.round(commNum * 100) / 100,
        features: finalFeatures,
        isActive: editingPlan.isActive !== false,
        isPopular: Boolean(editingPlan.isPopular),
      };

      if (editingPlan.maxProducts && Number(editingPlan.maxProducts) > 0) {
        payload.maxProducts = Number(editingPlan.maxProducts);
      } else {
        payload.maxProducts = null;
        payload.unlimitedProducts = true;
      }

      if (editingPlan.id) {
        const updated = await adminApi.updateSubscriptionPlan(editingPlan.id, payload);
        // Immediately reflect the updated plan in the UI state
        setPlans((prev) =>
          prev.map((p) => (p.id === updated.id ? { ...p, ...updated } : p))
        );
      } else {
        const created = await adminApi.createSubscriptionPlan(payload);
        // Immediately add the new plan into UI state
        setPlans((prev) => [...prev, created]);
      }

      setIsPlanModalOpen(false);
      setEditingPlan(null);
      setNewFeatureInput('');
      // Background sync to update dependent platform stats
      loadData();
    } catch (err: any) {
      console.error('Failed to save subscription plan', err);
      setFormError(err.message || 'Failed to save plan. Please check your inputs.');
    } finally {
      setIsSavingPlan(false);
    }
  };

  const handleDeletePlan = (plan: SubscriptionPlan) => {
    setDeleteError(null);
    setPlanToDelete(plan);
  };

  const confirmDeletePlan = async () => {
    if (!planToDelete) return;
    try {
      setIsDeletingPlan(true);
      setDeleteError(null);
      await adminApi.deleteSubscriptionPlan(planToDelete.id);
      // Immediately remove the plan from UI state
      setPlans((prev) => prev.filter((p) => p.id !== planToDelete.id));
      setPlanToDelete(null);
      // Background sync
      loadData();
    } catch (err: any) {
      console.error('Failed to delete subscription plan', err);
      setDeleteError(err.message || 'Failed to delete plan.');
    } finally {
      setIsDeletingPlan(false);
    }
  };

  // --- Shop Billing Handlers ---
  const handleOpenEditShopBilling = (shop: any) => {
    setEditingShop(shop);
    setShopBillingForm({
      billingMode: shop.financials?.billingMode || 'COMMISSION',
      customCommissionPercentage: shop.financials?.customCommissionPercentage ?? 5,
      subscriptionPlanId: shop.financials?.subscriptionPlanId || '',
      deductSubscriptionFromSettlement: shop.financials?.deductSubscriptionFromSettlement ?? false,
    });
    setIsShopBillingModalOpen(true);
  };

  const handleSaveShopBilling = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingShop) return;

    try {
      await adminApi.updateShopBilling(editingShop.id, shopBillingForm);
      setIsShopBillingModalOpen(false);
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to update shop billing');
    }
  };

  const filteredShops = shops.filter((s) => {
    const q = (searchQuery || '').toLowerCase();
    const matchesSearch =
      (s?.name || '').toLowerCase().includes(q) ||
      (s?.shopNumber ? s.shopNumber.toLowerCase().includes(q) : false);
    const matchesStatus =
      statusFilter === 'ALL' ||
      s?.financials?.billingMode === statusFilter ||
      s?.financials?.subscriptionStatus === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-4">
      {/* Compact Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3.5 sm:p-4 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-indigo-500/15 border border-indigo-500/30 text-indigo-400 flex items-center justify-center shrink-0">
            <Zap className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-base font-extrabold text-white flex items-center gap-2">
              <span>Subscription & Monetization Engine</span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-800 text-indigo-300 border border-slate-700">
                {plans.length} Active Plans
              </span>
            </h2>
            <p className="text-[11px] text-slate-400">
              Manage merchant recurring plans, commission override rules, invoices and billing ledger
            </p>
          </div>
        </div>

        <button
          onClick={loadData}
          disabled={isLoading}
          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700/60 transition self-start sm:self-auto"
          title="Refresh Data"
        >
          <RotateCcw className={`w-4 h-4 text-indigo-400 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Top Revenue Summary KPIs (Compact) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
        <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] font-bold uppercase tracking-wider">Total Platform Revenue</span>
            <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className="font-mono text-lg font-black text-white">
            ₹{((platformStats?.totalPlatformRevenue ?? 0)).toFixed(2)}
          </div>
          <div className="text-[10px] text-slate-400 flex items-center justify-between pt-1 border-t border-slate-800/80">
            <span>Comm: ₹{(platformStats?.platformCommissionEarned ?? 0).toFixed(0)}</span>
            <span className="text-emerald-400">Sub: ₹{(platformStats?.totalSubscriptionRevenue ?? 0).toFixed(0)}</span>
          </div>
        </div>

        <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] font-bold uppercase tracking-wider">Subscription MRR</span>
            <Zap className="w-3.5 h-3.5 text-indigo-400" />
          </div>
          <div className="font-mono text-lg font-black text-indigo-400">
            ₹{((platformStats?.subscriptionMRR ?? 0)).toFixed(2)}
          </div>
          <div className="text-[10px] text-slate-400 flex items-center justify-between pt-1 border-t border-slate-800/80">
            <span>ARR: ₹{((platformStats?.subscriptionARR ?? 0)).toFixed(0)}</span>
            <span className="text-indigo-300 font-semibold">{platformStats?.activeSubscribersCount ?? 0} active</span>
          </div>
        </div>

        <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] font-bold uppercase tracking-wider">Active Subscribers</span>
            <Building2 className="w-3.5 h-3.5 text-teal-400" />
          </div>
          <div className="font-mono text-lg font-black text-teal-400">
            {platformStats?.activeSubscribersCount ?? 0}
          </div>
          <div className="text-[10px] text-slate-400 flex items-center justify-between pt-1 border-t border-slate-800/80">
            <span>{platformStats?.trialSubscribersCount ?? 0} in Trial</span>
            <span className="text-amber-400 font-semibold">{platformStats?.pastDueSubscribersCount ?? 0} Past Due</span>
          </div>
        </div>

        <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] font-bold uppercase tracking-wider">Billing Models</span>
            <Layers className="w-3.5 h-3.5 text-purple-400" />
          </div>
          <div className="font-mono text-lg font-black text-purple-400">
            {plans.length} Plans
          </div>
          <div className="text-[10px] text-slate-400 flex items-center justify-between pt-1 border-t border-slate-800/80">
            <span>Comm: {platformStats?.billingModeBreakdown?.COMMISSION ?? 0}</span>
            <span>Sub: {platformStats?.billingModeBreakdown?.SUBSCRIPTION ?? 0}</span>
          </div>
        </div>
      </div>

      {/* Subtabs Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-1 bg-slate-900 rounded-xl border border-slate-800">
        <div className="flex space-x-1 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          {[
            { id: 'PLANS', label: 'Subscription Plans', icon: Zap },
            { id: 'SHOPS_BILLING', label: 'Shop Billing & Plans', icon: Building2 },
            { id: 'INVOICES', label: 'Invoices & Payments', icon: FileText },
            { id: 'TRANSACTIONS', label: 'Ledger Audit', icon: CreditCard },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeSubTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveSubTab(tab.id as any)}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {activeSubTab === 'PLANS' && (
          <button
            onClick={handleOpenCreatePlan}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-sm shrink-0 self-start sm:self-auto"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create New Plan</span>
          </button>
        )}
      </div>

      {/* 1. PLANS TAB */}
      {activeSubTab === 'PLANS' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className="p-5 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col justify-between space-y-4 relative hover:border-slate-700 transition-all"
            >
              {plan.isPopular && (
                <span className="absolute -top-2.5 right-4 px-2.5 py-0.5 rounded-full bg-indigo-500 text-white text-[10px] font-black uppercase tracking-wider shadow">
                  Most Popular
                </span>
              )}

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-black text-lg text-white">{plan.name}</h3>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      plan.isActive ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {plan.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>

                <p className="text-xs text-slate-400">{plan.description}</p>

                <div className="pt-2 border-t border-slate-800 flex items-baseline space-x-1">
                  <span className="text-3xl font-black text-white">₹{plan.price}</span>
                  <span className="text-xs text-slate-400">/{plan.interval?.toLowerCase()}</span>
                </div>

                <div className="flex items-center space-x-2">
                  <span className="px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-emerald-400 text-xs font-bold font-mono">
                    {plan.commissionPercentage}% Commission
                  </span>
                  <span className="px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-slate-300 text-xs font-bold">
                    {plan.maxProducts ? `Max ${plan.maxProducts} items` : 'Unlimited items'}
                  </span>
                </div>

                <ul className="space-y-1.5 pt-2 border-t border-slate-800 text-xs text-slate-300">
                  {plan.features.map((feat, idx) => (
                    <li key={idx} className="flex items-center space-x-2">
                      <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="flex space-x-2 pt-3 border-t border-slate-800">
                <button
                  onClick={() => handleOpenEditPlan(plan)}
                  className="flex-1 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center justify-center space-x-1.5 transition-all"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>{t('subs.editPlan', 'Edit Plan')}</span>
                </button>
                <button
                  onClick={() => handleDeletePlan(plan)}
                  className="p-2 rounded-xl bg-slate-800 hover:bg-red-950/80 text-slate-400 hover:text-red-400 transition-all"
                  title={t('subs.delete', 'Delete Plan')}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 2. SHOPS BILLING TAB */}
      {activeSubTab === 'SHOPS_BILLING' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search shop name or number..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="flex items-center space-x-2">
              <span className="text-xs text-slate-400">Filter Mode:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white focus:outline-none"
              >
                <option value="ALL">All Modes</option>
                <option value="COMMISSION">COMMISSION</option>
                <option value="SUBSCRIPTION">SUBSCRIPTION</option>
                <option value="COMMISSION_PLUS_SUBSCRIPTION">HYBRID</option>
              </select>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider font-bold border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-4">Shop</th>
                    <th className="py-3 px-4">Billing Mode</th>
                    <th className="py-3 px-4">Assigned Plan</th>
                    <th className="py-3 px-4">Comm Rate</th>
                    <th className="py-3 px-4">Subscription Status</th>
                    <th className="py-3 px-4">Next Due Date</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredShops.map((shop) => (
                    <tr key={shop.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-bold text-white">{shop.name}</div>
                        <div className="text-[11px] text-slate-400 font-mono">{shop.shopNumber}</div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2.5 py-1 rounded-full text-[11px] font-bold font-mono bg-slate-800 text-slate-200 border border-slate-700">
                          {shop.financials?.billingMode || 'COMMISSION'}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-medium text-white">
                          {shop.financials?.subscriptionPlanName || 'None (Standard)'}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-emerald-400">
                        {shop.financials?.customCommissionPercentage ?? 5}%
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            shop.financials?.subscriptionStatus === 'ACTIVE'
                              ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                              : shop.financials?.subscriptionStatus === 'TRIAL'
                              ? 'bg-indigo-950 text-indigo-300 border border-indigo-800'
                              : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          {shop.financials?.subscriptionStatus || 'NONE'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-400 font-mono">
                        {shop.financials?.subscriptionNextDueDate
                          ? new Date(shop.financials.subscriptionNextDueDate).toLocaleDateString()
                          : '—'}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => handleOpenEditShopBilling(shop)}
                          className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-indigo-300 border border-slate-700 text-xs font-bold transition-all"
                        >
                          Configure Billing
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 3. INVOICES TAB */}
      {activeSubTab === 'INVOICES' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider font-bold border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Invoice #</th>
                  <th className="py-3 px-4">Shop</th>
                  <th className="py-3 px-4">Plan Name</th>
                  <th className="py-3 px-4">Billing Period</th>
                  <th className="py-3 px-4">Amount</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Payment Ref</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {invoices.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-6 text-slate-500">
                      No subscription invoices generated yet.
                    </td>
                  </tr>
                ) : (
                  invoices.map((inv) => (
                    <tr key={inv.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-white">{inv.invoiceNumber}</td>
                      <td className="py-3 px-4 font-medium text-slate-200">{inv.shopId}</td>
                      <td className="py-3 px-4 text-emerald-400 font-bold">{inv.planName}</td>
                      <td className="py-3 px-4 text-slate-400">
                        {new Date(inv.billingPeriodStart).toLocaleDateString()} - {new Date(inv.billingPeriodEnd).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4 font-mono font-black text-white text-sm">
                        ₹{inv.total.toFixed(2)}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            inv.status === 'PAID'
                              ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                              : 'bg-amber-950 text-amber-300 border border-amber-800'
                          }`}
                        >
                          {inv.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono text-[11px] text-slate-400">
                        {inv.paymentReference || 'Pending'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 4. TRANSACTIONS TAB */}
      {activeSubTab === 'TRANSACTIONS' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider font-bold border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Reference</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Description</th>
                  <th className="py-3 px-4">Amount</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {transactions.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-6 text-slate-500">
                      No billing transactions recorded yet.
                    </td>
                  </tr>
                ) : (
                  transactions.map((tx) => (
                    <tr key={tx.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-4 text-slate-400 font-mono">
                        {new Date(tx.timestamp).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-white">{tx.referenceId}</td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-200">
                          {tx.type}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-300">{tx.description}</td>
                      <td className="py-3 px-4 font-mono font-black text-white text-sm">
                        ₹{tx.amount.toFixed(2)}
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-800">
                          {tx.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Plan Create / Edit Modal */}
      {isPlanModalOpen && editingPlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg p-6 space-y-5 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button
              type="button"
              onClick={() => setIsPlanModalOpen(false)}
              className="absolute top-5 right-5 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-xs font-bold flex items-center gap-1 transition"
            >
              <X className="w-3.5 h-3.5" />
              <span>{t('header.close', 'Close')}</span>
            </button>

            <div>
              <h3 className="font-black text-lg text-white">
                {editingPlan.id
                  ? t('subs.editPlan', 'Edit Subscription Plan')
                  : t('subs.createPlan', 'Create Subscription Plan')}
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                {editingPlan.id
                  ? `Update plan parameters, item limits, pricing, and features for ${editingPlan.name || 'this plan'}`
                  : 'Define a new merchant tier with pricing, commissions, and limits'}
              </p>
            </div>

            {formError && (
              <div className="p-3 rounded-xl bg-red-950/50 border border-red-800/80 text-xs text-red-300 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSavePlan} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs text-slate-400 font-semibold">{t('subs.planName', 'Plan Name')}</label>
                <input
                  type="text"
                  required
                  value={editingPlan.name || ''}
                  onChange={(e) => setEditingPlan({ ...editingPlan, name: e.target.value })}
                  placeholder="e.g. Growth Monthly"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs text-slate-400 font-semibold">{t('subs.description', 'Description')}</label>
                <input
                  type="text"
                  value={editingPlan.description || ''}
                  onChange={(e) => setEditingPlan({ ...editingPlan, description: e.target.value })}
                  placeholder="e.g. For expanding shops with high volume"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs text-slate-400 font-semibold">{t('subs.price', 'Price (₹)')}</label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={editingPlan.price ?? 0}
                    onChange={(e) => setEditingPlan({ ...editingPlan, price: Number(e.target.value) })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-slate-400 font-semibold">{t('subs.interval', 'Billing Interval')}</label>
                  <select
                    value={editingPlan.interval || 'MONTHLY'}
                    onChange={(e) => setEditingPlan({ ...editingPlan, interval: e.target.value as any })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none"
                  >
                    <option value="MONTHLY">MONTHLY</option>
                    <option value="YEARLY">YEARLY</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs text-slate-400 font-semibold">{t('subs.commissionRate', 'Commission Rate (%)')}</label>
                  <input
                    type="number"
                    step="0.1"
                    min={0}
                    max={100}
                    value={editingPlan.commissionPercentage ?? 0}
                    onChange={(e) => setEditingPlan({ ...editingPlan, commissionPercentage: Number(e.target.value) })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-slate-400 font-semibold">{t('subs.maxProducts', 'Item Limit (Blank = Unlimited)')}</label>
                  <input
                    type="number"
                    value={editingPlan.maxProducts || ''}
                    onChange={(e) =>
                      setEditingPlan({
                        ...editingPlan,
                        maxProducts: e.target.value ? Number(e.target.value) : undefined,
                      })
                    }
                    placeholder="Unlimited"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Features List Management */}
              <div className="space-y-2 pt-1 border-t border-slate-800/80">
                <div className="flex items-center justify-between">
                  <label className="text-xs text-slate-400 font-semibold">{t('subs.features', 'Features Included')}</label>
                  <span className="text-[11px] text-slate-500">
                    {(editingPlan.features || []).length} {t('orders.items', 'items')}
                  </span>
                </div>

                <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                  {(editingPlan.features || []).map((feat, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between gap-2 px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800/80 text-xs text-slate-200"
                    >
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <input
                          type="text"
                          value={feat}
                          onChange={(e) => {
                            const updatedFeats = [...(editingPlan.features || [])];
                            updatedFeats[idx] = e.target.value;
                            setEditingPlan({ ...editingPlan, features: updatedFeats });
                          }}
                          className="bg-transparent border-none outline-none text-xs text-white w-full focus:ring-0 p-0"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveFeature(idx)}
                        className="p-1 rounded-md text-slate-500 hover:text-red-400 hover:bg-slate-900 transition"
                        title="Remove feature"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>

                {/* Add new feature input */}
                <div className="flex gap-2 pt-1">
                  <input
                    type="text"
                    placeholder="Type feature and click Add..."
                    value={newFeatureInput}
                    onChange={(e) => setNewFeatureInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddFeature();
                      }
                    }}
                    className="flex-1 px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                  <button
                    type="button"
                    onClick={handleAddFeature}
                    className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition flex items-center gap-1.5 shrink-0"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>{t('subs.addFeature', 'Add')}</span>
                  </button>
                </div>
              </div>

              <div className="flex items-center space-x-4 pt-2">
                <label className="flex items-center space-x-2 text-xs text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingPlan.isActive ?? true}
                    onChange={(e) => setEditingPlan({ ...editingPlan, isActive: e.target.checked })}
                    className="rounded bg-slate-950 border-slate-800 text-indigo-600 focus:ring-0"
                  />
                  <span>{t('subs.activeStatus', 'Active & Available')}</span>
                </label>

                <label className="flex items-center space-x-2 text-xs text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingPlan.isPopular ?? false}
                    onChange={(e) => setEditingPlan({ ...editingPlan, isPopular: e.target.checked })}
                    className="rounded bg-slate-950 border-slate-800 text-indigo-600 focus:ring-0"
                  />
                  <span>{t('subs.popularBadge', 'Highlight as "Most Popular"')}</span>
                </label>
              </div>

              <div className="flex space-x-3 pt-3">
                <button
                  type="button"
                  disabled={isSavingPlan}
                  onClick={() => setIsPlanModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold hover:bg-slate-700 transition disabled:opacity-50"
                >
                  {t('subs.cancel', 'Cancel')}
                </button>
                <button
                  type="submit"
                  disabled={isSavingPlan}
                  className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md flex items-center justify-center space-x-1.5 transition disabled:opacity-50"
                >
                  {isSavingPlan ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <span>{t('subs.save', 'Save Plan')}</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Compact Delete Plan Confirmation Modal */}
      {planToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md p-6 space-y-4 shadow-2xl relative">
            <div className="flex items-center space-x-3">
              <div className="p-3 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-black text-lg text-white">
                  {t('subs.delete', 'Delete Plan')}
                </h3>
                <p className="text-xs text-slate-400">
                  {t('subs.deleteWarning', 'This will permanently remove this subscription plan.')}
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800/80 space-y-1.5 text-xs text-slate-300">
              <div className="flex justify-between items-center">
                <span className="text-slate-400">{t('subs.planName', 'Plan Name')}:</span>
                <span className="font-bold text-white">{planToDelete.name}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">{t('subs.price', 'Price')}:</span>
                <span className="font-bold text-white">
                  ₹{planToDelete.price ?? planToDelete.monthlyPrice ?? 0}/
                  {planToDelete.interval?.toLowerCase() || 'monthly'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">{t('subs.commissionRate', 'Commission Rate')}:</span>
                <span className="font-mono font-bold text-emerald-400">
                  {planToDelete.commissionPercentage}%
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">{t('subs.maxProducts', 'Item Limit')}:</span>
                <span className="font-bold text-slate-200">
                  {planToDelete.maxProducts ? `Max ${planToDelete.maxProducts} items` : 'Unlimited'}
                </span>
              </div>
            </div>

            {deleteError && (
              <div className="p-3 rounded-xl bg-red-950/50 border border-red-800/80 text-xs text-red-300 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
                <span>{deleteError}</span>
              </div>
            )}

            <div className="flex space-x-3 pt-2">
              <button
                type="button"
                disabled={isDeletingPlan}
                onClick={() => {
                  setPlanToDelete(null);
                  setDeleteError(null);
                }}
                className="flex-1 py-2.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold hover:bg-slate-700 transition disabled:opacity-50"
              >
                {t('subs.cancel', 'Cancel')}
              </button>
              <button
                type="button"
                disabled={isDeletingPlan}
                onClick={confirmDeletePlan}
                className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold shadow-md flex items-center justify-center space-x-1.5 transition disabled:opacity-50"
              >
                {isDeletingPlan ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>{t('subs.confirmDelete', 'Confirm Delete')}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Shop Billing Configure Modal */}
      {isShopBillingModalOpen && editingShop && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg p-6 space-y-5 shadow-2xl relative">
            <button
              type="button"
              onClick={() => setIsShopBillingModalOpen(false)}
              className="absolute top-5 right-5 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-xs font-bold flex items-center gap-1 transition"
            >
              <X className="w-3.5 h-3.5" />
              <span>Close</span>
            </button>

            <div>
              <h3 className="font-black text-lg text-white">Configure Shop Billing</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                {editingShop.name} ({editingShop.shopNumber})
              </p>
            </div>

            <form onSubmit={handleSaveShopBilling} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs text-slate-400">Billing Mode</label>
                <select
                  value={shopBillingForm.billingMode}
                  onChange={(e) => setShopBillingForm({ ...shopBillingForm, billingMode: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none"
                >
                  <option value="COMMISSION">COMMISSION (Pay-per-order % fee)</option>
                  <option value="SUBSCRIPTION">SUBSCRIPTION (Fixed monthly fee, 0% commission)</option>
                  <option value="COMMISSION_PLUS_SUBSCRIPTION">COMMISSION_PLUS_SUBSCRIPTION (Hybrid fee + lower %)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs text-slate-400">Assigned Subscription Plan</label>
                <select
                  value={shopBillingForm.subscriptionPlanId}
                  onChange={(e) => setShopBillingForm({ ...shopBillingForm, subscriptionPlanId: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none"
                >
                  <option value="">None (Custom or Free)</option>
                  {plans.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} — ₹{p.price}/mo ({p.commissionPercentage}% comm)
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs text-slate-400">Custom Commission Percentage Override (%)</label>
                <input
                  type="number"
                  step="0.1"
                  min={0}
                  max={100}
                  value={shopBillingForm.customCommissionPercentage}
                  onChange={(e) =>
                    setShopBillingForm({
                      ...shopBillingForm,
                      customCommissionPercentage: Number(e.target.value),
                    })
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="pt-2">
                <label className="flex items-center space-x-2 text-xs text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={shopBillingForm.deductSubscriptionFromSettlement}
                    onChange={(e) =>
                      setShopBillingForm({
                        ...shopBillingForm,
                        deductSubscriptionFromSettlement: e.target.checked,
                      })
                    }
                    className="rounded bg-slate-950 border-slate-800 text-indigo-600 focus:ring-0"
                  />
                  <span>Deduct pending subscription invoices automatically from payouts</span>
                </label>
              </div>

              <div className="flex space-x-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsShopBillingModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md"
                >
                  Apply Settings
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

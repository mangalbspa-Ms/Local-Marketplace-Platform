/**
 * Market Management Screen
 * 
 * Create, edit, and configure local trading mandis / markets, operational radius, and active status.
 */

import React, { useState, useEffect } from 'react';
import { adminApi } from '../../../services/adminApi.ts';
import { LocalMarket } from '../../../types/market.ts';
import {
  MapPin,
  Plus,
  Edit2,
  Power,
  Store,
  Compass,
  CheckCircle2,
  AlertCircle,
  Search,
  X,
} from 'lucide-react';

export const MarketManagementScreen: React.FC = () => {
  const [markets, setMarkets] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingMarket, setEditingMarket] = useState<any | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    area: '',
    city: 'Mumbai',
    state: 'Maharashtra',
    pincode: '',
    radiusKm: 5,
    lat: 19.0178,
    lng: 72.8478,
    description: '',
    imageUrl: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=800&auto=format&fit=crop',
  });
  const [actionError, setActionError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadMarkets = async () => {
    setIsLoading(true);
    try {
      const data = await adminApi.getMarkets();
      setMarkets(data);
    } catch (err) {
      console.error('Failed to load markets', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadMarkets();
  }, []);

  const handleToggleStatus = async (market: any) => {
    try {
      const updated = await adminApi.toggleMarketStatus(market.id, !market.isActive);
      setMarkets((prev) =>
        prev.map((m) => (m.id === market.id ? { ...m, isActive: updated.isActive } : m))
      );
    } catch (err: any) {
      alert(err.message || 'Failed to toggle status');
    }
  };

  const handleOpenCreate = () => {
    setEditingMarket(null);
    setFormData({
      name: '',
      code: '',
      area: '',
      city: 'Mumbai',
      state: 'Maharashtra',
      pincode: '400028',
      radiusKm: 5,
      lat: 19.0178,
      lng: 72.8478,
      description: '',
      imageUrl: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=800&auto=format&fit=crop',
    });
    setActionError(null);
    setIsCreateModalOpen(true);
  };

  const handleOpenEdit = (market: any) => {
    setEditingMarket(market);
    setFormData({
      name: market.name,
      code: market.code,
      area: market.area,
      city: market.city,
      state: market.state || 'Maharashtra',
      pincode: market.pincode,
      radiusKm: market.radiusKm || 5,
      lat: market.coordinates?.lat || 19.0178,
      lng: market.coordinates?.lng || 72.8478,
      description: market.description || '',
      imageUrl: market.imageUrl || '',
    });
    setActionError(null);
    setIsCreateModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionError(null);
    setIsSubmitting(true);

    try {
      if (!formData.name.trim() || !formData.code.trim() || !formData.area.trim() || !formData.pincode.trim()) {
        throw new Error('Please fill in all mandatory market identity fields.');
      }

      if (editingMarket) {
        await adminApi.updateMarket(editingMarket.id, {
          name: formData.name,
          code: formData.code.toUpperCase(),
          area: formData.area,
          city: formData.city,
          state: formData.state,
          pincode: formData.pincode,
          radiusKm: Number(formData.radiusKm),
          coordinates: { lat: Number(formData.lat), lng: Number(formData.lng) },
          description: formData.description,
          imageUrl: formData.imageUrl,
        });
      } else {
        await adminApi.createMarket({
          name: formData.name,
          code: formData.code.toUpperCase(),
          area: formData.area,
          city: formData.city,
          state: formData.state,
          pincode: formData.pincode,
          radiusKm: Number(formData.radiusKm),
          coordinates: { lat: Number(formData.lat), lng: Number(formData.lng) },
          description: formData.description,
          imageUrl: formData.imageUrl,
        });
      }

      await loadMarkets();
      setIsCreateModalOpen(false);
    } catch (err: any) {
      setActionError(err.message || 'Operation failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filtered = markets.filter((m) => {
    const q = (searchQuery || '').toLowerCase();
    return (
      (m?.name || '').toLowerCase().includes(q) ||
      (m?.code || '').toLowerCase().includes(q) ||
      (m?.area || '').toLowerCase().includes(q) ||
      (m?.city || '').toLowerCase().includes(q)
    );
  });

  const activeMarkets = markets.filter((m) => m.isActive).length;
  const totalShopsInMarkets = markets.reduce((sum, m) => sum + (m.totalShopsCount || 0), 0);

  return (
    <div className="space-y-4">
      {/* Compact Header & Actions */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3.5 sm:p-4 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-indigo-500/15 border border-indigo-500/30 text-indigo-400 flex items-center justify-center shrink-0">
            <MapPin className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-base font-extrabold text-white flex items-center gap-2">
              <span>Local Market Territories</span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                {filtered.length} Mandis
              </span>
            </h2>
            <p className="text-[11px] text-slate-400">
              Define regional physical mandis, geographical geofence coordinates, and radius coverage
            </p>
          </div>
        </div>

        <button
          onClick={handleOpenCreate}
          className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs shadow-md shadow-indigo-600/30 flex items-center gap-1.5 transition self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add Mandi</span>
        </button>
      </div>

      {/* 3 Compact KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
        <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Mandi Territories</p>
            <h3 className="text-lg font-black text-white mt-0.5">{markets.length}</h3>
            <p className="text-[10px] text-slate-500">Configured zones</p>
          </div>
          <div className="w-9 h-9 rounded-lg bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 flex items-center justify-center shrink-0">
            <MapPin className="w-4 h-4" />
          </div>
        </div>

        <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">Operational Mandis</p>
            <h3 className="text-lg font-black text-emerald-400 mt-0.5">{activeMarkets}</h3>
            <p className="text-[10px] text-emerald-400/70">Active & trading</p>
          </div>
          <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-4 h-4" />
          </div>
        </div>

        <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold text-teal-400 uppercase tracking-wider">Registered Shops</p>
            <h3 className="text-lg font-black text-teal-400 mt-0.5">{totalShopsInMarkets}</h3>
            <p className="text-[10px] text-teal-400/70">Across all territories</p>
          </div>
          <div className="w-9 h-9 rounded-lg bg-teal-500/10 border border-teal-500/30 text-teal-400 flex items-center justify-center shrink-0">
            <Store className="w-4 h-4" />
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
            placeholder="Filter by market name, code, area or pincode..."
            className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-lg px-3 py-2 pl-8 text-xs text-white placeholder-slate-500 outline-none transition"
          />
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5" />
        </div>
      </div>

      {/* Markets Cards Grid */}
      {isLoading ? (
        <div className="p-8 text-center text-xs text-slate-400 font-bold bg-slate-900/60 border border-slate-800 rounded-xl">
          Loading market territories...
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-8 text-center text-xs text-slate-400">
          No matching markets found.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map((market) => (
            <div
              key={market.id}
              className={`rounded-xl border p-3.5 bg-slate-900/90 transition shadow-sm flex flex-col justify-between hover:border-slate-700 ${
                market.isActive ? 'border-slate-800' : 'border-rose-900/40 bg-slate-950/60 opacity-85'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-2.5 mb-2.5">
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-400 text-[9px] font-black tracking-wider uppercase border border-indigo-500/30">
                        {market.code}
                      </span>
                      <span
                        className={`text-[9px] font-black px-2 py-0.5 rounded-md ${
                          market.isActive ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                        }`}
                      >
                        {market.isActive ? 'ACTIVE' : 'INACTIVE'}
                      </span>
                    </div>
                    <h3 className="text-sm font-black text-white mt-1 truncate">{market.name}</h3>
                    <p className="text-[11px] text-slate-400 truncate">{market.area}, {market.city} - {market.pincode}</p>
                  </div>

                  <div className="w-10 h-10 rounded-xl overflow-hidden shrink-0 border border-slate-800">
                    <img
                      src={
                        market.imageUrl && market.imageUrl.trim() !== ''
                          ? market.imageUrl
                          : 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=500&auto=format&fit=crop&q=80'
                      }
                      alt={market.name}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                </div>

                {/* Stats Bar */}
                <div className="grid grid-cols-3 gap-1 py-2 border-y border-slate-800/80 my-2 text-center">
                  <div className="bg-slate-950/40 p-1.5 rounded-lg border border-slate-800/40">
                    <div className="text-[8px] text-slate-400 font-bold uppercase">Shops</div>
                    <div className="text-[11px] font-black text-white mt-0.5">
                      {market.activeShopsCount || 0} / {market.totalShopsCount || 0}
                    </div>
                  </div>

                  <div className="bg-slate-950/40 p-1.5 rounded-lg border border-slate-800/40">
                    <div className="text-[8px] text-slate-400 font-bold uppercase">Radius</div>
                    <div className="text-[11px] font-black text-teal-400 mt-0.5">{market.radiusKm} km</div>
                  </div>

                  <div className="bg-slate-950/40 p-1.5 rounded-lg border border-slate-800/40">
                    <div className="text-[8px] text-slate-400 font-bold uppercase">GPS</div>
                    <div className="text-[10px] font-mono text-slate-300 mt-0.5 truncate">
                      {market.coordinates?.lat?.toFixed(1)}, {market.coordinates?.lng?.toFixed(1)}
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-1.5 pt-1">
                <button
                  onClick={() => handleOpenEdit(market)}
                  className="flex-1 py-1.5 px-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-bold flex items-center justify-center gap-1 transition"
                >
                  <Edit2 className="w-3 h-3 text-indigo-400" />
                  <span>Configure</span>
                </button>

                <button
                  onClick={() => handleToggleStatus(market)}
                  className={`py-1.5 px-2.5 rounded-lg text-[11px] font-bold flex items-center gap-1 transition border ${
                    market.isActive
                      ? 'bg-rose-950/40 border-rose-800/60 text-rose-300 hover:bg-rose-900/50'
                      : 'bg-emerald-950/40 border-emerald-800/60 text-emerald-300 hover:bg-emerald-900/50'
                  }`}
                  title={market.isActive ? 'Deactivate Market' : 'Activate Market'}
                >
                  <Power className="w-3 h-3" />
                  <span>{market.isActive ? 'Deactivate' : 'Activate'}</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create / Edit Market Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg shadow-2xl p-6 relative max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3 sticky top-0 bg-slate-900 z-10">
              <h3 className="text-sm sm:text-base font-black text-white flex items-center gap-2">
                <MapPin className="w-4 h-4 text-indigo-400" />
                <span>{editingMarket ? 'Edit Mandi Territory' : 'Create New Mandi Territory'}</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-xs font-bold flex items-center gap-1 transition"
              >
                <X className="w-3.5 h-3.5" />
                <span>Close</span>
              </button>
            </div>

            {actionError && (
              <div className="mb-4 p-3 rounded-xl bg-rose-950/50 border border-rose-800 text-rose-300 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{actionError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-slate-400 font-bold mb-1">Market Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Dadar Flower & Veg Mandi"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-slate-400 font-bold mb-1">Market Code *</label>
                  <input
                    type="text"
                    required
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    placeholder="e.g. DADAR_MANDI"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white outline-none focus:border-indigo-500 uppercase font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-400 font-bold mb-1">Area / Locality *</label>
                  <input
                    type="text"
                    required
                    value={formData.area}
                    onChange={(e) => setFormData({ ...formData, area: e.target.value })}
                    placeholder="e.g. Dadar West"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-bold mb-1">City *</label>
                  <input
                    type="text"
                    required
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    placeholder="e.g. Mumbai"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-bold mb-1">Pincode *</label>
                  <input
                    type="text"
                    required
                    value={formData.pincode}
                    onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
                    placeholder="400028"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-400 font-bold mb-1">Radius (Km)</label>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    value={formData.radiusKm}
                    onChange={(e) => setFormData({ ...formData, radiusKm: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-bold mb-1">Latitude</label>
                  <input
                    type="number"
                    step="0.0001"
                    value={formData.lat}
                    onChange={(e) => setFormData({ ...formData, lat: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white outline-none focus:border-indigo-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-bold mb-1">Longitude</label>
                  <input
                    type="number"
                    step="0.0001"
                    value={formData.lng}
                    onChange={(e) => setFormData({ ...formData, lng: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white outline-none focus:border-indigo-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 font-bold mb-1">Description</label>
                <textarea
                  rows={2}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Market trade specialities, opening hours, landmarks..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-white outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-bold mb-1">Banner Image URL</label>
                <input
                  type="url"
                  value={formData.imageUrl}
                  onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                  placeholder="https://..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white outline-none focus:border-indigo-500"
                />
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold shadow-lg shadow-indigo-600/30 flex items-center gap-2"
                >
                  {isSubmitting ? 'Saving...' : editingMarket ? 'Save Changes' : 'Create Territory'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

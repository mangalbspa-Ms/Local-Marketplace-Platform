import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  MapPin,
  Phone,
  Store,
  CreditCard,
  Building,
  Navigation,
  ExternalLink,
  MessageSquare,
  Loader2,
  RefreshCw,
  Search,
  Check,
  X,
  Eye,
} from 'lucide-react';
import { adminApi } from '../../../services/adminApi';
import { Shop, ShopChangeRequest } from '../../../types/market';

interface ShopVerificationReviewTabProps {
  onShopUpdated?: (shop: Shop) => void;
  onOpenShopDetail?: (shop: Shop) => void;
}

export const ShopVerificationReviewTab: React.FC<ShopVerificationReviewTabProps> = ({
  onShopUpdated,
  onOpenShopDetail,
}) => {
  const [subTab, setSubTab] = useState<'VERIFICATIONS' | 'CHANGE_REQUESTS'>('VERIFICATIONS');
  const [shops, setShops] = useState<Shop[]>([]);
  const [changeRequests, setChangeRequests] = useState<ShopChangeRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Rejection modal
  const [rejectModalShop, setRejectModalShop] = useState<Shop | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  // Change request rejection modal
  const [rejectModalCR, setRejectModalCR] = useState<ShopChangeRequest | null>(null);
  const [crRejectionReason, setCrRejectionReason] = useState('');
  const [crAdminNotes, setCrAdminNotes] = useState('');

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [shopsData, crData] = await Promise.all([
        adminApi.getShops(),
        adminApi.getChangeRequests(),
      ]);
      setShops(shopsData || []);
      setChangeRequests(crData || []);
    } catch (err) {
      console.error('Failed to load verification data', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Pending shops to verify
  const pendingShops = shops.filter(
    (s) => s.verificationStatus === 'PENDING_VERIFICATION' || (!s.isVerifiedByAdmin && s.verificationStatus !== 'REJECTED')
  );

  // Verified shops
  const verifiedShops = shops.filter((s) => s.verificationStatus === 'VERIFIED' || s.isVerifiedByAdmin);

  // Pending change requests
  const pendingCRs = changeRequests.filter((cr) => cr.status === 'PENDING');

  // Verify Shop handler
  const handleVerifyShop = async (shop: Shop) => {
    setIsProcessing(true);
    try {
      const updated = await adminApi.verifyShop(shop.id);
      setShops((prev) => prev.map((s) => (s.id === shop.id ? { ...s, ...updated } : s)));
      onShopUpdated?.(updated);
      alert(`दुकान "${shop.name}" को सफलतापूर्वक सत्यापित कर दिया गया है! मुख्य विवरण लॉक हो गए हैं।`);
    } catch (err: any) {
      alert(err.message || 'सत्यापन विफल');
    } finally {
      setIsProcessing(false);
    }
  };

  // Reject Shop handler
  const handleConfirmRejectShop = async () => {
    if (!rejectModalShop) return;
    if (!rejectionReason.trim()) {
      alert('कृपया अस्वीकृति का कारण दर्ज करें');
      return;
    }

    setIsProcessing(true);
    try {
      const updated = await adminApi.rejectShop(rejectModalShop.id, rejectionReason.trim());
      setShops((prev) => prev.map((s) => (s.id === rejectModalShop.id ? { ...s, ...updated } : s)));
      onShopUpdated?.(updated);
      setRejectModalShop(null);
      setRejectionReason('');
      alert(`दुकान "${rejectModalShop.name}" का सत्यापन अस्वीकृत कर दिया गया है।`);
    } catch (err: any) {
      alert(err.message || 'अस्वीकृति दर्ज करने में विफल');
    } finally {
      setIsProcessing(false);
    }
  };

  // Review Change Request
  const handleReviewChangeRequest = async (
    cr: ShopChangeRequest,
    action: 'APPROVE' | 'REJECT',
    notes?: string,
    rejectReason?: string
  ) => {
    setIsProcessing(true);
    try {
      await adminApi.reviewChangeRequest(cr.id, action, notes, rejectReason);
      await loadData();
      setRejectModalCR(null);
      setCrRejectionReason('');
      setCrAdminNotes('');
      alert(
        action === 'APPROVE'
          ? 'बदलाव अनुरोध स्वीकार कर लिया गया! दुकान का विवरण अपडेट हो गया है।'
          : 'बदलाव अनुरोध अस्वीकृत कर दिया गया।'
      );
    } catch (err: any) {
      alert(err.message || 'कार्रवाई विफल');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Header & Subtabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900 border border-slate-800 rounded-3xl p-4">
        <div>
          <h2 className="text-sm sm:text-base font-black text-white flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            <span>दुकान सत्यापन एवं बदलाव समीक्षा (Verification Governance)</span>
          </h2>
          <p className="text-[11px] text-slate-400 mt-0.5">
            नये विक्रेताओं की जानकारी सत्यापित करें एवं लॉक किए गए विवरणों में बदलाव के अनुरोधों को नियंत्रित करें।
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={loadData}
            disabled={isLoading}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition cursor-pointer"
            title="रिफ्रेश करें"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>

          {/* Subtab Buttons */}
          <div className="flex items-center bg-slate-950 p-1 rounded-2xl border border-slate-800">
            <button
              type="button"
              onClick={() => setSubTab('VERIFICATIONS')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                subTab === 'VERIFICATIONS'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span>सत्यापन पेंडिंग</span>
              {pendingShops.length > 0 && (
                <span className="px-1.5 py-0.2 bg-emerald-950 text-emerald-300 rounded-full text-[10px] font-black border border-emerald-400/50">
                  {pendingShops.length}
                </span>
              )}
            </button>
            <button
              type="button"
              onClick={() => setSubTab('CHANGE_REQUESTS')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                subTab === 'CHANGE_REQUESTS'
                  ? 'bg-amber-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span>बदलाव अनुरोध</span>
              {pendingCRs.length > 0 && (
                <span className="px-1.5 py-0.2 bg-amber-950 text-amber-300 rounded-full text-[10px] font-black border border-amber-400/50">
                  {pendingCRs.length}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* SUBTAB 1: SHOP VERIFICATION QUEUE */}
      {subTab === 'VERIFICATIONS' && (
        <div className="space-y-4">
          {/* Quick Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800">
              <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wide block">
                समीक्षा हेतु लंबित (Pending)
              </span>
              <span className="text-xl font-black text-amber-400 mt-1 block">
                {pendingShops.length}
              </span>
            </div>
            <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800">
              <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wide block">
                सत्यापित दुकानें (Verified & Locked)
              </span>
              <span className="text-xl font-black text-emerald-400 mt-1 block">
                {verifiedShops.length}
              </span>
            </div>
            <div className="col-span-2 sm:col-span-1 p-3.5 rounded-2xl bg-slate-900 border border-slate-800">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block">
                सुरक्षा नियम (Security Rule)
              </span>
              <span className="text-xs text-slate-300 font-semibold mt-1 block">
                सत्यापित होने पर नाम, पता, GPS व UPI लॉक हो जाते हैं।
              </span>
            </div>
          </div>

          {/* Pending List */}
          {isLoading ? (
            <div className="p-12 text-center text-slate-400 text-xs font-bold">लोड हो रहा है...</div>
          ) : pendingShops.length === 0 ? (
            <div className="p-8 rounded-3xl bg-slate-900 border border-slate-800 text-center text-xs text-slate-400 space-y-1">
              <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-1" />
              <p className="font-bold text-white text-sm">सभी दुकानें सत्यापित हैं!</p>
              <p>वर्तमान में कोई नई दुकान सत्यापन हेतु लंबित नहीं है।</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5">
              {pendingShops.map((shop) => (
                <div
                  key={shop.id}
                  className="p-4 rounded-3xl bg-slate-900 border border-slate-800 space-y-3 relative hover:border-slate-700 transition"
                >
                  {/* Card Header */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center space-x-3 min-w-0">
                      <div className="w-12 h-12 rounded-2xl bg-slate-800 overflow-hidden border border-slate-700 flex items-center justify-center shrink-0">
                        {shop.profilePhotoUrl || shop.photoUrl ? (
                          <img
                            src={shop.profilePhotoUrl || shop.photoUrl}
                            alt={shop.name}
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <Store className="w-6 h-6 text-slate-400" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-sm font-bold text-white truncate">{shop.name}</h3>
                        <p className="text-xs text-slate-400 truncate">{shop.category}</p>
                        <p className="text-[11px] text-indigo-400 truncate font-semibold">
                          {shop.marketName || 'स्थानीय मंडी'}
                        </p>
                      </div>
                    </div>

                    <span className="px-2.5 py-1 rounded-full bg-amber-950 border border-amber-500/40 text-amber-300 font-extrabold text-[10px] shrink-0">
                      लंबित सत्यापन ⏳
                    </span>
                  </div>

                  {/* Verification Details Checklist */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] pt-1 border-t border-slate-800/80">
                    {/* Owner & Phone */}
                    <div className="space-y-0.5">
                      <span className="text-slate-500 font-bold block">दुकानदार / फोन:</span>
                      <span className="text-slate-300 font-semibold flex items-center gap-1">
                        <Phone className="w-3 h-3 text-slate-400" />
                        <span>{shop.sellerName || 'दुकानदार'} ({shop.phone})</span>
                      </span>
                    </div>

                    {/* UPI ID */}
                    <div className="space-y-0.5">
                      <span className="text-slate-500 font-bold block">UPI भुगतान आईडी:</span>
                      <span className="text-cyan-300 font-mono font-bold flex items-center gap-1 truncate">
                        <CreditCard className="w-3 h-3 text-cyan-400 shrink-0" />
                        <span>{(shop as any).upiPayoutId || shop.financials?.payoutUpiId || 'उपलब्ध नहीं'}</span>
                      </span>
                    </div>

                    {/* Address & Pincode */}
                    <div className="sm:col-span-2 space-y-0.5">
                      <span className="text-slate-500 font-bold block">पता एवं पिनकोड:</span>
                      <span className="text-slate-300 font-medium flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                        <span className="truncate">
                          {typeof shop.address === 'string'
                            ? shop.address
                            : `${shop.address?.line1 || ''}, ${shop.address?.city || ''} - ${shop.address?.pincode || ''}`}
                        </span>
                      </span>
                    </div>

                    {/* GPS Coordinates & Accuracy Badge */}
                    <div className="sm:col-span-2 p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <span className="text-[10px] text-slate-400 font-bold flex items-center gap-1">
                          <Navigation className="w-3 h-3 text-indigo-400" />
                          <span>Google Maps Coordinates:</span>
                        </span>
                        <span className="text-xs font-mono font-bold text-white block mt-0.5 truncate">
                          {shop.coordinates
                            ? `${shop.coordinates.lat.toFixed(5)}° N, ${shop.coordinates.lng.toFixed(5)}° E`
                            : '📍 लोकेशन सेट नहीं है'}
                        </span>
                      </div>

                      {shop.coordinates && (
                        <div className="text-right shrink-0">
                          <span className="px-2 py-0.5 rounded-md bg-emerald-950 border border-emerald-500/40 text-emerald-300 text-[10px] font-bold block">
                            {shop.locationSource === 'HIGH_ACCURACY_GPS' ? '✓ Fresh GPS' : '📍 Map Pin'}
                          </span>
                          {shop.locationAccuracy !== undefined && (
                            <span className="text-[9px] text-slate-400 font-mono">
                              ±{Math.round(shop.locationAccuracy)}m
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="pt-2 border-t border-slate-800 flex items-center justify-between gap-2">
                    {onOpenShopDetail && (
                      <button
                        type="button"
                        onClick={() => onOpenShopDetail(shop)}
                        className="text-xs text-indigo-400 hover:text-indigo-300 font-bold flex items-center gap-1 cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>पूर्ण विवरण</span>
                      </button>
                    )}

                    <div className="flex items-center gap-2 ml-auto">
                      <button
                        type="button"
                        disabled={isProcessing}
                        onClick={() => setRejectModalShop(shop)}
                        className="py-1.5 px-3 rounded-xl bg-rose-950/80 hover:bg-rose-900 border border-rose-500/40 text-rose-300 font-bold text-xs flex items-center gap-1 transition cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                        <span>अस्वीकार करें</span>
                      </button>

                      <button
                        type="button"
                        disabled={isProcessing}
                        onClick={() => handleVerifyShop(shop)}
                        className="py-1.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs flex items-center gap-1.5 shadow-md shadow-emerald-900/40 transition cursor-pointer active:scale-95"
                      >
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                        <span>सत्यापित करें (Verify & Lock)</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* SUBTAB 2: SHOP CHANGE REQUESTS */}
      {subTab === 'CHANGE_REQUESTS' && (
        <div className="space-y-4">
          <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-xs font-black text-white block">
                विक्रेताओं द्वारा प्रस्तुत बदलाव अनुरोध (Seller Modification Requests)
              </span>
              <p className="text-[11px] text-slate-400 mt-0.5">
                सत्यापित विवरणों में संशोधन की अनुमति देने से पहले सटीकता की पुष्टि करें।
              </p>
            </div>
            <span className="text-xs font-bold text-amber-300 bg-amber-950 px-2.5 py-1 rounded-full border border-amber-500/40">
              लंबित अनुरोध: {pendingCRs.length}
            </span>
          </div>

          {isLoading ? (
            <div className="p-12 text-center text-slate-400 text-xs font-bold">लोड हो रहा है...</div>
          ) : changeRequests.length === 0 ? (
            <div className="p-8 rounded-3xl bg-slate-900 border border-slate-800 text-center text-xs text-slate-400">
              कोई बदलाव अनुरोध नहीं मिला।
            </div>
          ) : (
            <div className="space-y-3">
              {changeRequests.map((cr) => {
                const targetShop = shops.find((s) => s.id === cr.shopId);
                const isPending = cr.status === 'PENDING';

                return (
                  <div
                    key={cr.id}
                    className={`p-4 rounded-3xl border transition space-y-3 ${
                      isPending
                        ? 'bg-slate-900 border-amber-500/40 shadow-lg'
                        : 'bg-slate-900/60 border-slate-800'
                    }`}
                  >
                    {/* Header */}
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-extrabold text-white text-sm">
                            {targetShop?.name || cr.shopId}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-black border ${
                              cr.status === 'APPROVED'
                                ? 'bg-emerald-950 text-emerald-300 border-emerald-400/40'
                                : cr.status === 'REJECTED'
                                ? 'bg-rose-950 text-rose-300 border-rose-400/40'
                                : 'bg-amber-950 text-amber-300 border-amber-400/40'
                            }`}
                          >
                            {cr.status === 'APPROVED'
                              ? 'स्वीकृत ✓'
                              : cr.status === 'REJECTED'
                              ? 'अस्वीकृत ❌'
                              : 'लंबित समीक्षा ⏳'}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          अनुरोध तिथि: {new Date(cr.createdAt).toLocaleString('hi-IN')}
                        </p>
                      </div>

                      {isPending && (
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            disabled={isProcessing}
                            onClick={() => setRejectModalCR(cr)}
                            className="py-1.5 px-3 rounded-xl bg-rose-950/80 hover:bg-rose-900 border border-rose-500/40 text-rose-300 font-bold text-xs flex items-center gap-1 cursor-pointer"
                          >
                            <X className="w-3.5 h-3.5" />
                            <span>अस्वीकार</span>
                          </button>
                          <button
                            type="button"
                            disabled={isProcessing}
                            onClick={() => handleReviewChangeRequest(cr, 'APPROVE', 'Admin Approved')}
                            className="py-1.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs flex items-center gap-1 shadow cursor-pointer active:scale-95"
                          >
                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                            <span>स्वीकार करें (Approve)</span>
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Requested Fields Comparison */}
                    <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 space-y-2 text-xs">
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wide block">
                        प्रस्तावित बदलाव (Requested Modifications):
                      </span>
                      {Object.entries(cr.requestedFields || {}).map(([key, val]) => (
                        <div key={key} className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                          <div className="p-2 rounded-xl bg-slate-900 border border-slate-800">
                            <span className="text-[10px] text-slate-500 font-bold block">फील्ड: {key}</span>
                            <span className="text-amber-200 font-mono break-all font-semibold">
                              नया मान: {typeof val === 'object' ? JSON.stringify(val) : String(val)}
                            </span>
                          </div>
                          <div className="p-2 rounded-xl bg-slate-900 border border-slate-800">
                            <span className="text-[10px] text-slate-500 font-bold block">विक्रेता का कारण:</span>
                            <span className="text-slate-300 italic">{cr.reason}</span>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Admin Notes / Rejection Reason if processed */}
                    {!isPending && (
                      <div className="text-[11px] text-slate-400 flex items-center gap-2">
                        {cr.rejectionReason && (
                          <span className="text-rose-400 font-medium">
                            अस्वीकृति कारण: {cr.rejectionReason}
                          </span>
                        )}
                        {cr.adminNotes && (
                          <span className="text-slate-300">टिप्पणी: {cr.adminNotes}</span>
                        )}
                        {cr.reviewedAt && (
                          <span className="text-slate-500 font-mono">
                            ({new Date(cr.reviewedAt).toLocaleDateString('hi-IN')})
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Reject Shop Modal */}
      {rejectModalShop && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-slate-900 border border-rose-500/40 rounded-3xl p-5 w-full max-w-md space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-white text-sm flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-400" />
                <span>दुकान सत्यापन अस्वीकार करें</span>
              </h3>
              <button
                type="button"
                onClick={() => setRejectModalShop(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2">
              <p className="text-xs text-slate-300">
                दुकान: <strong className="text-white">{rejectModalShop.name}</strong>
              </p>
              <label className="block text-xs font-bold text-slate-300">
                अस्वीकृति का कारण (Reason for Rejection) <span className="text-rose-400">*</span>:
              </label>
              <textarea
                rows={3}
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="उदा. लोकेशन अस्पष्ट है, दुकान फोटो अमान्य है, या पता अधूरा है..."
                className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-rose-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setRejectModalShop(null)}
                className="py-2 px-3 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold"
              >
                रद्द करें
              </button>
              <button
                type="button"
                disabled={isProcessing}
                onClick={handleConfirmRejectShop}
                className="py-2 px-4 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer"
              >
                {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                <span>अस्वीकार करें</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Change Request Modal */}
      {rejectModalCR && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-slate-900 border border-rose-500/40 rounded-3xl p-5 w-full max-w-md space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-white text-sm flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-400" />
                <span>बदलाव अनुरोध अस्वीकार करें</span>
              </h3>
              <button
                type="button"
                onClick={() => setRejectModalCR(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-300">
                अस्वीकृति का कारण <span className="text-rose-400">*</span>:
              </label>
              <textarea
                rows={3}
                value={crRejectionReason}
                onChange={(e) => setCrRejectionReason(e.target.value)}
                placeholder="कारण दर्ज करें जो विक्रेता को प्रदर्शित होगा..."
                className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-rose-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setRejectModalCR(null)}
                className="py-2 px-3 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold"
              >
                रद्द करें
              </button>
              <button
                type="button"
                disabled={isProcessing}
                onClick={() =>
                  handleReviewChangeRequest(
                    rejectModalCR,
                    'REJECT',
                    crAdminNotes,
                    crRejectionReason.trim() || 'Admin Rejected'
                  )
                }
                className="py-2 px-4 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer"
              >
                {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                <span>अस्वीकार करें</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

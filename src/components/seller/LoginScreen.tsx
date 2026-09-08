/**
 * Seller Login Screen (Screen 1)
 * Mobile-first login with phone & OTP verification, plus 1-click test seller accounts.
 */

import React, { useState, useEffect } from 'react';
import {
  Store,
  Phone,
  ShieldCheck,
  ArrowRight,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  Lock,
  Languages,
  Zap,
} from 'lucide-react';
import { useSellerAuth, DEMO_SELLERS } from '../../context/SellerAuthContext.tsx';
import { useSellerLanguage } from '../../context/SellerLanguageContext.tsx';
import { SellerInviteAcceptModal } from './SellerInviteAcceptModal.tsx';
import { QrCode } from 'lucide-react';

export const LoginScreen: React.FC = () => {
  const { login, loginAsDemoSeller, isLoading } = useSellerAuth();
  const { language, setLanguage, t } = useSellerLanguage();

  const [phone, setPhone] = useState('9820000001');
  const [otp, setOtp] = useState('123456');
  const [step, setStep] = useState<'PHONE' | 'OTP'>('PHONE');
  const [error, setError] = useState<string | null>(null);
  const [timer, setTimer] = useState(30);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [urlToken, setUrlToken] = useState('');

  useEffect(() => {
    // Check if token is in URL
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    if (token) {
      setUrlToken(token);
      setIsInviteModalOpen(true);
    }
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (step === 'OTP' && timer > 0) {
      interval = setInterval(() => setTimer((prev) => prev - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [step, timer]);

  const handleSendOtp = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!phone || phone.length < 10) {
      setError(language === 'hi' ? 'कृपया 10 अंकों का मान्य मोबाइल नंबर दर्ज करें' : 'Please enter a valid 10-digit phone number');
      return;
    }
    setIsSendingOtp(true);
    setTimeout(() => {
      setIsSendingOtp(false);
      setStep('OTP');
      setTimer(30);
      setOtp('123456'); // Pre-fill development test OTP
    }, 600);
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!otp || otp.length < 4) {
      setError(language === 'hi' ? 'कृपया सही OTP दर्ज करें' : 'Please enter valid OTP');
      return;
    }
    try {
      const formattedPhone = phone.startsWith('+91') ? phone : `+91${phone}`;
      await login(formattedPhone, otp);
    } catch (err: any) {
      setError(err.message || 'Login failed');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between p-4 sm:p-6 max-w-md mx-auto">
      {/* Top Header */}
      <div className="flex items-center justify-between pt-2">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-xl bg-emerald-600 flex items-center justify-center text-white font-bold">
            <Store className="w-4 h-4" />
          </div>
          <span className="font-bold text-sm text-emerald-400">व्यापार केंद्र (Vyapar Kendra)</span>
        </div>

        <button
          onClick={() => setLanguage(language === 'hi' ? 'en' : 'hi')}
          className="flex items-center space-x-1 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-xs font-semibold text-slate-300 hover:text-white"
        >
          <Languages className="w-3.5 h-3.5 text-emerald-400" />
          <span>{language === 'hi' ? 'English' : 'हिंदी'}</span>
        </button>
      </div>

      {/* Main Login Card */}
      <div className="my-auto py-6">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-emerald-950 border border-emerald-800/60 text-emerald-400 shadow-xl mb-3">
            <Store className="w-8 h-8" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            {t('login.title', 'Seller Portal')}
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            {language === 'hi'
              ? 'स्थानीय बाजार के दुकानदार अपनी दुकान व आर्डर प्रबंधित करें'
              : 'Local Market Merchant Hub - Manage your shop & orders'}
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-950/70 border border-red-800/80 text-red-200 text-xs flex items-start space-x-2">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {step === 'PHONE' ? (
          <form onSubmit={handleSendOtp} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                {t('login.phone_label', 'Mobile Number')}
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-3.5 text-slate-400 font-semibold text-sm">
                  +91
                </span>
                <input
                  type="tel"
                  maxLength={10}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                  placeholder={t('login.phone_placeholder', 'Enter 10-digit number')}
                  className="w-full pl-13 pr-4 py-3 bg-slate-900 border border-slate-800 rounded-xl text-white font-medium text-base focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSendingOtp || phone.length < 10}
              className="w-full py-3.5 px-4 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold rounded-xl flex items-center justify-center space-x-2 shadow-lg shadow-emerald-950 transition-all text-sm"
            >
              {isSendingOtp ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>{t('login.send_otp', 'Get OTP')}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp} className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-slate-300">
                  {t('login.otp_label', 'Enter 6-digit OTP')}
                </label>
                <button
                  type="button"
                  onClick={() => setStep('PHONE')}
                  className="text-xs text-emerald-400 hover:underline"
                >
                  Change (+91 {phone})
                </button>
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                  placeholder="123456"
                  className="w-full pl-10 pr-4 py-3 bg-slate-900 border border-slate-800 rounded-xl text-white font-mono text-center tracking-widest text-xl focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                />
              </div>
              <p className="text-[11px] text-emerald-400/80 mt-1">
                ✓ Test OTP: <span className="font-mono font-bold">123456</span>
              </p>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 px-4 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold rounded-xl flex items-center justify-center space-x-2 shadow-lg shadow-emerald-950 transition-all text-sm"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <ShieldCheck className="w-5 h-5" />
                  <span>{t('login.verify_otp', 'Verify & Login')}</span>
                </>
              )}
            </button>

            <div className="text-center pt-1">
              {timer > 0 ? (
                <p className="text-xs text-slate-400">
                  Resend OTP in <span className="font-bold text-slate-200">{timer}s</span>
                </p>
              ) : (
                <button
                  type="button"
                  onClick={() => setTimer(30)}
                  className="text-xs text-emerald-400 font-semibold hover:underline"
                >
                  {t('login.resend_otp', 'Resend OTP')}
                </button>
              )}
            </div>
          </form>
        )}

        {/* Demo One-Touch Switchers */}
        <div className="mt-8 pt-6 border-t border-slate-900 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center space-x-1">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span>{t('login.quick_demo', '1-Click Demo Login')}</span>
            </span>
            <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded">Testing Mode</span>
          </div>

          <div className="space-y-2">
            {DEMO_SELLERS.map((seller) => (
              <button
                key={seller.userId}
                type="button"
                onClick={() => loginAsDemoSeller(seller.userId)}
                className="w-full text-left p-3 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-emerald-500/50 hover:bg-slate-900 transition-all flex items-center justify-between group"
              >
                <div>
                  <div className="font-bold text-sm text-white group-hover:text-emerald-300 transition-colors">
                    {seller.shopName}
                  </div>
                  <div className="text-xs text-slate-400 mt-0.5">
                    {seller.name} • {seller.category}
                  </div>
                </div>
                <div className="px-2 py-1 rounded-lg bg-emerald-950 border border-emerald-800/80 text-emerald-300 text-xs font-semibold">
                  Login →
                </div>
              </button>
            ))}
          </div>

          {/* Invite Code Claim Option */}
          <div className="pt-2">
            <button
              type="button"
              onClick={() => setIsInviteModalOpen(true)}
              className="w-full py-2.5 px-3 rounded-xl bg-slate-900 border border-emerald-500/30 text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10 text-xs font-bold flex items-center justify-center gap-2 transition"
            >
              <QrCode className="w-4 h-4" />
              <span>{language === 'hi' ? 'फील्ड ऑपरेटर आमंत्रण कोड है? दुकान एक्टिवेट करें' : 'Have a Field Invite Code? Claim Your Shop'}</span>
            </button>
          </div>
        </div>
      </div>


      {/* Seller Invite Modal */}
      <SellerInviteAcceptModal
        isOpen={isInviteModalOpen}
        initialToken={urlToken}
        onClose={() => setIsInviteModalOpen(false)}
      />

      {/* Footer Notice */}
      <div className="text-center py-2 text-[11px] text-slate-500 border-t border-slate-900">
        Strict Shop Isolation & Fractional Pricing Engine Active
      </div>
    </div>
  );
};

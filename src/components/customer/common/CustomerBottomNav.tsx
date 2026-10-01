/**
 * Customer Bottom Navigation Bar
 * 
 * Fixed Android bottom tab bar with dynamic cart badge and order tracking alerts.
 * Designed with modern light marketplace aesthetics, emerald accents, and crisp typography.
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useCustomerLanguage } from '../../../context/CustomerLanguageContext.tsx';
import { useCustomerCart } from '../../../context/CustomerCartContext.tsx';
import { useCustomerMarket } from '../../../context/CustomerMarketContext.tsx';
import { Shop } from '../../../types/market.ts';
import { findMatchingShop } from '../voice/shopVoiceMatcher.ts';
import { createSpeechRecognition, requestMicrophonePermission } from '../../../utils/speechRecognitionHelper.ts';
import { Store, Search, ShoppingBag, Receipt, Mic, User } from 'lucide-react';

export type CustomerTab = 'home' | 'search' | 'voice' | 'cart' | 'orders' | 'profile';

interface CustomerBottomNavProps {
  currentTab: CustomerTab;
  onSelectTab: (tab: CustomerTab) => void;
  onOpenVoice?: () => void;
  activeOrdersCount?: number;
  onSelectShop?: (shop: Shop) => void;
  onOpenSearch?: (query?: string) => void;
}

export const CustomerBottomNav: React.FC<CustomerBottomNavProps> = ({
  currentTab,
  onSelectTab,
  onOpenVoice,
  activeOrdersCount = 0,
  onSelectShop,
  onOpenSearch,
}) => {
  const { language } = useCustomerLanguage();
  const { itemCount, itemSubtotal, shop: cartShop } = useCustomerCart();
  const { shops } = useCustomerMarket();

  const [isVoiceActive, setIsVoiceActive] = useState(false);
  const [hasStartedSpeaking, setHasStartedSpeaking] = useState(false);
  const [liveTranscript, setLiveTranscript] = useState('');

  const recognitionRef = useRef<any>(null);
  const transcriptRef = useRef<string>('');
  const silenceTimerRef = useRef<any>(null);

  const stopVoiceSession = useCallback(() => {
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
    if (recognitionRef.current) {
      try {
        recognitionRef.current.onstart = null;
        recognitionRef.current.onresult = null;
        recognitionRef.current.onerror = null;
        recognitionRef.current.onend = null;
        recognitionRef.current.abort();
      } catch {
        // ignore
      }
      recognitionRef.current = null;
    }
    setIsVoiceActive(false);
    setHasStartedSpeaking(false);
  }, []);

  const handleVoiceTap = useCallback(async () => {
    // If voice is currently active, tapping again cancels it
    if (isVoiceActive) {
      stopVoiceSession();
      setLiveTranscript('');
      return;
    }

    stopVoiceSession();

    const permResult = await requestMicrophonePermission();
    if (!permResult.granted) {
      if (onOpenVoice) {
        onOpenVoice();
      }
      return;
    }

    try {
      const recognition = createSpeechRecognition();
      if (!recognition) {
        // Fallback if SpeechRecognition is not available
        if (onOpenSearch) {
          onOpenSearch('');
        } else if (onOpenVoice) {
          onOpenVoice();
        }
        return;
      }

      setIsVoiceActive(true);
      setHasStartedSpeaking(false);
      setLiveTranscript('');
      transcriptRef.current = '';

      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = language === 'hi' ? 'hi-IN' : 'en-IN';

      // Safety timeout: 10s if no speech occurs
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = setTimeout(() => {
        stopVoiceSession();
        setLiveTranscript('');
      }, 10000);

      recognition.onstart = () => {
        setIsVoiceActive(true);
        setHasStartedSpeaking(false);
      };

      recognition.onresult = (event: any) => {
        let interim = '';
        let final = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const item = event.results[i];
          if (item.isFinal) {
            final += item[0].transcript;
          } else {
            interim += item[0].transcript;
          }
        }
        const currentText = (final || interim || '').trim();
        if (currentText) {
          setHasStartedSpeaking(true);
          setLiveTranscript(currentText);
          transcriptRef.current = currentText;

          if (final) {
            const matchedShop = findMatchingShop(final.trim(), shops);
            if (matchedShop && onSelectShop) {
              stopVoiceSession();
              setLiveTranscript('');
              onSelectShop(matchedShop);
              return;
            }
          }

          // Automatically stop after user pauses speaking for 2.2s
          if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
          silenceTimerRef.current = setTimeout(() => {
            if (recognitionRef.current) {
              try {
                recognitionRef.current.stop();
              } catch {
                // ignore
              }
            }
          }, 2200);
        }
      };

      recognition.onerror = (event: any) => {
        console.warn('Voice recognition error:', event?.error);
        if (event?.error !== 'no-speech') {
          stopVoiceSession();
          setLiveTranscript('');
        }
      };

      recognition.onend = () => {
        if (silenceTimerRef.current) {
          clearTimeout(silenceTimerRef.current);
          silenceTimerRef.current = null;
        }
        recognitionRef.current = null;
        setIsVoiceActive(false);
        setHasStartedSpeaking(false);

        const finalText = transcriptRef.current.trim();
        setLiveTranscript('');

        if (finalText) {
          // Check for seller / shop name first
          const matchedShop = findMatchingShop(finalText, shops);
          if (matchedShop && onSelectShop) {
            onSelectShop(matchedShop);
          } else if (onOpenSearch) {
            onOpenSearch(finalText);
          } else if (onOpenVoice) {
            onOpenVoice();
          }
        }
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.error('Failed to start voice recognition', err);
      stopVoiceSession();
      setLiveTranscript('');
    }
  }, [isVoiceActive, language, onOpenSearch, onOpenVoice, onSelectShop, shops, stopVoiceSession]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      stopVoiceSession();
    };
  }, [stopVoiceSession]);

  // If user switches tab, cancel voice session
  useEffect(() => {
    if (isVoiceActive) {
      stopVoiceSession();
      setLiveTranscript('');
    }
  }, [currentTab]); // eslint-disable-line react-hooks/exhaustive-deps

  const tabs: Array<{
    id: CustomerTab;
    labelEn: string;
    labelHi: string;
    icon: React.ComponentType<{ className?: string }>;
    badgeCount?: number;
    isSpecialVoice?: boolean;
  }> = [
    {
      id: 'home',
      labelEn: 'Home',
      labelHi: 'होम',
      icon: Store,
    },
    {
      id: 'search',
      labelEn: 'Search',
      labelHi: 'खोजें',
      icon: Search,
    },
    {
      id: 'voice',
      labelEn: 'Voice Search',
      labelHi: 'बोलकर खोजें',
      icon: Mic,
      isSpecialVoice: true,
    },
    {
      id: 'orders',
      labelEn: 'Orders',
      labelHi: 'ऑर्डर्स',
      icon: Receipt,
      badgeCount: activeOrdersCount,
    },
    {
      id: 'profile',
      labelEn: 'Profile',
      labelHi: 'प्रोफ़ाइल',
      icon: User,
    },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 max-w-md mx-auto pointer-events-none">
      {/* Floating Sticky Cart Summary Bar above bottom nav when cart has items */}
      {itemCount > 0 && currentTab !== 'cart' && (
        <div className="px-3 pb-2 pointer-events-auto animate-in slide-in-from-bottom-2 duration-200">
          <button
            type="button"
            onClick={() => onSelectTab('cart')}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white p-3 rounded-2xl shadow-xl flex items-center justify-between transition-all transform active:scale-98"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center font-black text-xs text-white">
                <ShoppingBag className="w-4 h-4 text-white" />
              </div>
              <div className="text-left">
                <div className="text-xs font-black leading-tight text-white">
                  {itemCount} {itemCount === 1 ? 'Item' : 'Items'} • ₹{itemSubtotal}
                </div>
                <div className="text-[10px] font-medium text-emerald-100 truncate max-w-[170px]">
                  From {cartShop?.name || 'Local Mandi Shop'}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1 bg-white text-emerald-700 px-3 py-1.5 rounded-xl text-xs font-bold shadow-xs">
              <span>{language === 'hi' ? 'कार्ट देखें' : 'View Cart'}</span>
              <span>→</span>
            </div>
          </button>
        </div>
      )}

      {/* Main Bottom Nav Bar */}
      <nav className="bg-white/98 backdrop-blur-xl border-t border-slate-200/80 px-2 py-1.5 shadow-lg pointer-events-auto">
        <div className="flex items-center justify-around">
          {tabs.map((tab) => {
            const isActive = currentTab === tab.id;
            const Icon = tab.icon;

            if (tab.isSpecialVoice) {
              return (
                <div key={tab.id} className="relative -top-3.5 flex flex-col items-center justify-center">
                  {/* Floating Voice Status Pill right above mic */}
                  {isVoiceActive && (
                    <div
                      id="bottom-voice-status-popup"
                      className="absolute -top-14 left-1/2 -translate-x-1/2 bg-slate-900/95 backdrop-blur-md text-white px-3.5 py-1.5 rounded-2xl shadow-xl flex flex-col items-center max-w-[280px] z-50 pointer-events-none animate-in fade-in slide-in-from-bottom-2 duration-150 border border-slate-700/60"
                    >
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-400 whitespace-nowrap">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                        <span>{hasStartedSpeaking ? 'Listening…' : 'Speak now'}</span>
                      </div>
                      {liveTranscript ? (
                        <div className="text-[11px] text-slate-200 truncate max-w-[240px] font-medium mt-0.5">
                          “{liveTranscript}”
                        </div>
                      ) : null}
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={handleVoiceTap}
                    className="relative flex flex-col items-center justify-center group focus:outline-hidden"
                    id="bottom-nav-voice-search-btn"
                    aria-label={
                      isVoiceActive
                        ? (hasStartedSpeaking ? 'Listening…' : 'Speak now')
                        : (language === 'hi' ? tab.labelHi : tab.labelEn)
                    }
                  >
                    <div
                      className={`w-12 h-12 rounded-full flex items-center justify-center text-white transition-all ${
                        isVoiceActive
                          ? 'bg-emerald-600 shadow-lg shadow-emerald-600/40 ring-4 ring-emerald-300 animate-pulse scale-105'
                          : 'bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-600/30 group-hover:scale-105 ring-4 ring-white'
                      }`}
                    >
                      <Mic className="w-5 h-5 text-white stroke-[2.2px]" />
                    </div>
                    <span className="text-[10px] font-bold text-emerald-700 mt-0.5 tracking-tight whitespace-nowrap">
                      {isVoiceActive
                        ? (hasStartedSpeaking ? 'Listening…' : 'Speak now')
                        : (language === 'hi' ? tab.labelHi : tab.labelEn)}
                    </span>
                  </button>
                </div>
              );
            }

            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => onSelectTab(tab.id)}
                className={`relative flex flex-col items-center justify-center py-1 px-2.5 rounded-2xl transition-all duration-150 ${
                  isActive
                    ? 'text-emerald-700 font-bold scale-105'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <div className="relative">
                  <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5px] text-emerald-600' : 'stroke-2 text-slate-400'}`} />
                  {!!tab.badgeCount && tab.badgeCount > 0 && (
                    <span className="absolute -top-1.5 -right-2 px-1.5 py-0.2 rounded-full bg-emerald-600 text-white text-[9px] font-bold shadow-xs">
                      {tab.badgeCount}
                    </span>
                  )}
                </div>
                <span className="text-[10px] mt-1 tracking-tight">
                  {language === 'hi' ? tab.labelHi : tab.labelEn}
                </span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
};

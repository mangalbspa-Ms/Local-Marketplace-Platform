import React, { useState } from 'react';
import { Globe, X, Check, Languages } from 'lucide-react';
import { useSellerLanguage } from '../../../context/SellerLanguageContext';

interface SellerLanguageModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SellerLanguageModal: React.FC<SellerLanguageModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { language, setLanguage } = useSellerLanguage();
  const [selectedLang, setSelectedLang] = useState<'hi' | 'en'>(language);
  const [saveFeedback, setSaveFeedback] = useState<string | null>(null);

  if (!isOpen) return null;

  const languagesList = [
    {
      id: 'hi' as const,
      nativeName: 'हिन्दी',
      englishName: 'Hindi',
      badge: 'प्राथमिक भाषा (Default)',
      description: 'विक्रेता ऐप का संपूर्ण इंटरफ़ेस हिन्दी में प्रदर्शित होगा',
    },
    {
      id: 'en' as const,
      nativeName: 'English',
      englishName: 'English',
      badge: 'English Interface',
      description: 'The entire seller app interface will be displayed in English',
    },
  ];

  const handleSelectLanguage = (langId: 'hi' | 'en') => {
    setSelectedLang(langId);
    setLanguage(langId);
    setSaveFeedback(
      langId === 'hi'
        ? 'भाषा हिन्दी में सफलतापूर्वक सेट की गई!'
        : 'Language successfully changed to English!'
    );
    setTimeout(() => {
      setSaveFeedback(null);
      onClose();
    }, 900);
  };

  return (
    <div
      id="modal-seller-language"
      className="fixed inset-0 z-[100] bg-black/85 backdrop-blur-md flex flex-col items-center justify-start sm:justify-center p-3 sm:p-4 pt-4 sm:pt-6 animate-in fade-in duration-150 overflow-hidden"
      onClick={onClose}
    >
      <div
        className="bg-[#0b142c] border border-cyan-500/35 rounded-3xl w-full max-w-md max-h-[calc(100dvh-2rem)] flex flex-col text-slate-100 shadow-[0_0_50px_rgba(0,0,0,0.95)] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header - Fixed & Always Visible */}
        <div className="flex items-center justify-between border-b border-cyan-500/20 px-4 sm:px-5 py-3.5 bg-[#070e24] shrink-0">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-cyan-950/80 border border-cyan-500/40 flex items-center justify-center text-cyan-300">
              <Globe className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-extrabold text-white text-sm sm:text-base flex items-center gap-1.5">
                <span>4. 🌐 भाषा (Language)</span>
              </h3>
              <p className="text-[11px] text-cyan-300/70">
                विक्रेता ऐप की प्रदर्शन भाषा चुनें
              </p>
            </div>
          </div>
          <button
            type="button"
            id="btn-close-language-modal"
            onClick={onClose}
            className="p-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:border-cyan-500/40 transition cursor-pointer"
            title="बंद करें"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Feedback Alert if changed */}
        {saveFeedback && (
          <div className="mx-4 mt-3 py-2 px-3 rounded-xl bg-emerald-950/90 border border-emerald-400/50 text-emerald-200 text-xs font-bold flex items-center gap-2 shadow-lg animate-in slide-in-from-top-2 shrink-0">
            <Check className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{saveFeedback}</span>
          </div>
        )}

        {/* Scrollable Language Options List */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-3 flex-1 text-xs">
          {languagesList.map((item) => {
            const isSelected = selectedLang === item.id;
            return (
              <button
                key={item.id}
                type="button"
                id={`btn-select-lang-${item.id}`}
                onClick={() => handleSelectLanguage(item.id)}
                className={`w-full p-3.5 rounded-2xl border text-left transition-all flex items-start justify-between gap-3 cursor-pointer ${
                  isSelected
                    ? 'bg-cyan-950/70 border-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.25)] ring-1 ring-cyan-400/40'
                    : 'bg-[#070e24] border-cyan-500/20 hover:border-cyan-500/40 hover:bg-slate-900/60'
                }`}
              >
                <div className="space-y-1 min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-black text-white text-sm">
                      {item.nativeName}
                    </span>
                    <span className="text-[11px] text-cyan-300 font-semibold">
                      ({item.englishName})
                    </span>
                    <span
                      className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border ${
                        isSelected
                          ? 'bg-cyan-500 text-slate-950 border-cyan-300'
                          : 'bg-slate-800 text-slate-400 border-slate-700'
                      }`}
                    >
                      {item.badge}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    {item.description}
                  </p>
                </div>

                <div
                  className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 mt-0.5 ${
                    isSelected
                      ? 'bg-cyan-500 border-cyan-400 text-slate-950'
                      : 'border-slate-600 bg-slate-800/80'
                  }`}
                >
                  {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                </div>
              </button>
            );
          })}

          <div className="p-3 rounded-2xl bg-slate-900/50 border border-slate-800 text-[11px] text-slate-400 space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-slate-300">
              <Languages className="w-3.5 h-3.5 text-cyan-400" />
              <span>भाषा संबंधी सूचना</span>
            </div>
            <p>
              भाषा बदलने पर बटन, लेबल, आदेश स्थिति व सूचनाएं चुनी गई भाषा में प्रदर्शित होंगी।
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 sm:p-4 border-t border-cyan-500/20 bg-[#070e24] flex items-center justify-end shrink-0">
          <button
            type="button"
            id="btn-close-lang-modal-footer"
            onClick={onClose}
            className="py-2 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 transition cursor-pointer"
          >
            बंद करें (Close)
          </button>
        </div>
      </div>
    </div>
  );
};

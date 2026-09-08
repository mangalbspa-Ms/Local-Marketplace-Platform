/**
 * AI Voice & Photo Assistant Modal for Sellers
 * 
 * Powered by Gemini 3.7 Flash with fallback NLP rule-engine.
 * Features:
 * - Hindi, English & Hinglish voice recognition with audio-meter pulse.
 * - Photo OCR & product metadata extraction.
 * - Mandatory AI Safety confirmation pipeline before DB execution.
 * - Live AI action audit history.
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  Mic,
  MicOff,
  Camera,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Volume2,
  X,
  Send,
  RotateCcw,
  ArrowRight,
  ShieldCheck,
  History,
  FileText,
  Package,
  Layers,
  Edit2,
  Plus,
} from 'lucide-react';
import { useSellerAuth } from '../../../context/SellerAuthContext.tsx';
import { useSellerLanguage } from '../../../context/SellerLanguageContext.tsx';
import { AIVoiceDraft, AIAuditRecord, PhotoExtractionResult } from '../../../types/ai.ts';

interface AIVoiceAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccessAction?: (result: any) => void;
}

export const AIVoiceAssistantModal: React.FC<AIVoiceAssistantModalProps> = ({
  isOpen,
  onClose,
  onSuccessAction,
}) => {
  const { shop, seller } = useSellerAuth();
  const { language } = useSellerLanguage();

  const [activeMode, setActiveMode] = useState<'VOICE' | 'PHOTO' | 'HISTORY'>('VOICE');
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Active AI Draft
  const [currentDraft, setCurrentDraft] = useState<AIVoiceDraft | null>(null);
  const [editablePrice, setEditablePrice] = useState<number | ''>('');
  const [editableStock, setEditableStock] = useState<number | ''>('');
  const [editableName, setEditableName] = useState('');
  const [editableUnit, setEditableUnit] = useState('kg');

  // Photo state
  const [selectedPhotoBase64, setSelectedPhotoBase64] = useState<string | null>(null);
  const [photoExtractResult, setPhotoExtractResult] = useState<PhotoExtractionResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // History state
  const [audits, setAudits] = useState<AIAuditRecord[]>([]);

  // Speech Recognition Reference
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if (!isOpen) {
      resetState();
    } else {
      loadAudits();
    }
  }, [isOpen]);

  const stopSpeechRecognition = () => {
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
    setIsListening(false);
  };

  const resetState = () => {
    stopSpeechRecognition();
    setTranscript('');
    setCurrentDraft(null);
    setSelectedPhotoBase64(null);
    setPhotoExtractResult(null);
    setError(null);
  };

  const getAuthHeaders = () => {
    const userId = localStorage.getItem('seller_user_id') || 'usr_seller_01';
    const token = localStorage.getItem('seller_auth_token') || localStorage.getItem('auth_token') || `token_${userId}`;
    return {
      Authorization: `Bearer ${token}`,
      'x-auth-user-id': userId,
    };
  };

  const loadAudits = async () => {
    try {
      const res = await fetch('/api/ai/audits', {
        headers: getAuthHeaders(),
      });
      if (res.ok) {
        const json = await res.json();
        setAudits(json.data?.audits || []);
      }
    } catch (err) {
      console.warn('Failed to load AI audits', err);
    }
  };

  // Setup Web Speech API for Hindi/English
  const toggleSpeechRecognition = () => {
    if (isListening) {
      stopSpeechRecognition();
      return;
    }

    stopSpeechRecognition();
    setError(null);
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setError('Voice recognition is not supported in this browser. Please type your command below.');
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = language === 'hi' ? 'hi-IN' : 'en-IN';

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event: any) => {
        let current = '';
        for (let i = 0; i < event.results.length; i++) {
          current += event.results[i][0].transcript;
        }
        setTranscript(current);
      };

      recognition.onerror = (event: any) => {
        console.error('Speech error', event);
        setIsListening(false);
        if (event.error !== 'no-speech' && event.error !== 'aborted') {
          setError(`Microphone error: ${event.error}. You can also type directly.`);
        }
      };

      recognition.onend = () => {
        setIsListening(false);
        recognitionRef.current = null;
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err: any) {
      console.error('Microphone start error', err);
      setIsListening(false);
      if (err?.name !== 'InvalidStateError') {
        setError('Microphone access blocked or failed. Please type your command.');
      }
    }
  };

  // Submit voice transcript to AI backend
  const handleProcessTranscript = async (textToProcess?: string) => {
    const text = textToProcess || transcript;
    if (!text.trim()) {
      setError('Please speak or type a command');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/ai/voice/parse', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify({
          transcript: text.trim(),
          shopId: shop?.id,
          language: language === 'hi' ? 'hi' : 'hinglish',
          draftId: currentDraft?.id,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error?.message || json.message || 'Failed to process voice instruction');
      }

      const draft: AIVoiceDraft = json.data.draft;
      setCurrentDraft(draft);

      // Populate edit fields
      if (draft.extractedEntities.price !== undefined) setEditablePrice(draft.extractedEntities.price);
      if (draft.extractedEntities.stock !== undefined) setEditableStock(draft.extractedEntities.stock);
      if (draft.extractedEntities.productName) setEditableName(draft.extractedEntities.productName);
      if (draft.extractedEntities.unit) setEditableUnit(draft.extractedEntities.unit);
    } catch (err: any) {
      setError(err.message || 'AI processing error');
    } finally {
      setIsLoading(false);
    }
  };

  // Confirm and apply AI Draft to catalog
  const handleConfirmAction = async () => {
    if (!currentDraft) return;

    setIsLoading(true);
    setError(null);

    try {
      const overrides: any = {};
      if (editablePrice !== '') overrides.price = Number(editablePrice);
      if (editableStock !== '') overrides.stock = Number(editableStock);
      if (editableName.trim()) overrides.productName = editableName.trim();
      if (editableUnit) overrides.unit = editableUnit;

      const res = await fetch('/api/ai/voice/confirm', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify({
          draftId: currentDraft.id,
          shopId: shop?.id,
          overrideEntities: overrides,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error?.message || json.message || 'Failed to execute AI action');
      }

      if (onSuccessAction) {
        onSuccessAction(json.data);
      }

      // Reset modal and show success
      setCurrentDraft(null);
      setTranscript('');
      loadAudits();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to apply changes');
    } finally {
      setIsLoading(false);
    }
  };

  // Photo Upload & Gemini Recognition
  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = reader.result as string;
      setSelectedPhotoBase64(base64);
      processPhotoExtraction(base64);
    };
    reader.readAsDataURL(file);
  };

  const processPhotoExtraction = async (base64: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/ai/photo/extract', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify({ imageBase64: base64 }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error?.message || json.message || 'Failed to analyze photo');
      }

      const extracted: PhotoExtractionResult = json.data.extracted;
      setPhotoExtractResult(extracted);

      // Create a draft for quick adding
      setEditableName(extracted.productName);
      setEditablePrice(extracted.suggestedPrice || 100);
      setEditableUnit(extracted.unit || 'packet');
      setEditableStock(30);

      setCurrentDraft({
        id: `photodraft-${Date.now()}`,
        shopId: shop?.id || '',
        sellerId: seller?.id || '',
        actionType: 'CREATE_PRODUCT',
        extractedEntities: {
          productName: extracted.productName,
          productNameHindi: extracted.productNameHindi,
          brand: extracted.brand,
          category: extracted.category,
          price: extracted.suggestedPrice || 100,
          unit: extracted.unit || 'packet',
          stock: 30,
        },
        missingFields: [],
        isComplete: true,
        replyMessage: `Detected ${extracted.productName} (${extracted.brand}). Suggested Price: ₹${extracted.suggestedPrice || 100}`,
        replyMessageHindi: `पहचाना गया: ${extracted.productNameHindi || extracted.productName}। अनुमानित मूल्य: ₹${extracted.suggestedPrice || 100}`,
        confirmationPrompt: `Add "${extracted.productName}" to catalog?`,
        confirmationPromptHindi: `क्या आप "${extracted.productName}" को कैटलॉग में जोड़ना चाहते हैं?`,
        status: 'PENDING_CONFIRMATION',
        createdAt: new Date().toISOString(),
      });
    } catch (err: any) {
      setError(err.message || 'Photo OCR failed');
    } finally {
      setIsLoading(false);
    }
  };

  const QUICK_PROMPTS = [
    { text: 'टाटा नमक 1kg दाम 28 रुपये स्टॉक 50 पैकेट जोड़ो', label: 'Add Tata Salt' },
    { text: 'Amul Butter 100g price 58 stock 20 add karo', label: 'Add Butter' },
    { text: 'Update Atta price to 48', label: 'Change Atta Price' },
    { text: 'Sugar out of stock karo', label: 'Mark Out of Stock' },
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-t-3xl sm:rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden text-white flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-slate-950 flex items-center justify-center font-black shadow-lg shadow-emerald-500/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-black text-base text-white">AI Dukan Sahayak</h3>
                <span className="bg-emerald-500/20 text-emerald-400 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-500/30">
                  Gemini 3.7 Flash
                </span>
              </div>
              <p className="text-xs text-slate-400">Speak in Hindi, Hinglish or English to manage store</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-full hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode Selector Tabs */}
        <div className="grid grid-cols-3 p-2 bg-slate-950/60 border-b border-slate-800 text-xs font-bold">
          <button
            onClick={() => setActiveMode('VOICE')}
            className={`py-2 px-3 rounded-xl flex items-center justify-center gap-2 transition ${
              activeMode === 'VOICE'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Mic className="w-4 h-4" /> Voice Assistant
          </button>
          <button
            onClick={() => setActiveMode('PHOTO')}
            className={`py-2 px-3 rounded-xl flex items-center justify-center gap-2 transition ${
              activeMode === 'PHOTO'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Camera className="w-4 h-4" /> Photo OCR
          </button>
          <button
            onClick={() => setActiveMode('HISTORY')}
            className={`py-2 px-3 rounded-xl flex items-center justify-center gap-2 transition ${
              activeMode === 'HISTORY'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <History className="w-4 h-4" /> Audits ({audits.length})
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 flex-1">
          {error && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-2xl flex items-center gap-3 text-rose-400 text-xs animate-shake">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* MODE 1: VOICE */}
          {activeMode === 'VOICE' && (
            <div className="space-y-5">
              {/* Mic Visualizer & Button */}
              <div className="flex flex-col items-center justify-center py-4 space-y-4">
                <div className="relative">
                  {isListening && (
                    <div className="absolute -inset-4 bg-emerald-500/20 rounded-full animate-ping" />
                  )}
                  <button
                    onClick={toggleSpeechRecognition}
                    disabled={isLoading}
                    className={`relative w-20 h-20 rounded-full flex items-center justify-center transition-all transform active:scale-95 shadow-xl ${
                      isListening
                        ? 'bg-rose-600 text-white shadow-rose-600/40 ring-4 ring-rose-500/30'
                        : 'bg-emerald-600 text-white hover:bg-emerald-500 shadow-emerald-600/30'
                    }`}
                  >
                    {isListening ? (
                      <MicOff className="w-9 h-9 animate-pulse" />
                    ) : (
                      <Mic className="w-9 h-9" />
                    )}
                  </button>
                </div>

                <div className="text-center">
                  <div className="text-sm font-bold text-white">
                    {isListening
                      ? 'Listening... बोलिए (Recording)'
                      : 'Tap Mic to Speak (बोलने के लिए दबाएं)'}
                  </div>
                  <div className="text-xs text-slate-400 mt-0.5">
                    Hindi, Hinglish & English naturally supported
                  </div>
                </div>
              </div>

              {/* Transcript input/editor */}
              <div className="space-y-2">
                <div className="relative">
                  <textarea
                    rows={2}
                    value={transcript}
                    onChange={(e) => setTranscript(e.target.value)}
                    placeholder="e.g. 'Add Fortune Oil 1L price 140 stock 25' or 'दूध का दाम 56 करो'"
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-3 pr-10 text-xs text-white placeholder-slate-500 focus:border-emerald-500 outline-hidden resize-none"
                  />
                  {transcript && (
                    <button
                      onClick={() => handleProcessTranscript()}
                      disabled={isLoading}
                      className="absolute right-3 bottom-3 p-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl transition shadow-xs"
                    >
                      <Send className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Quick Prompts */}
                {!currentDraft && (
                  <div className="space-y-1.5 pt-1">
                    <div className="text-[11px] font-bold text-slate-400">Or try quick sample commands:</div>
                    <div className="flex flex-wrap gap-1.5">
                      {QUICK_PROMPTS.map((qp, i) => (
                        <button
                          key={i}
                          onClick={() => {
                            setTranscript(qp.text);
                            handleProcessTranscript(qp.text);
                          }}
                          className="py-1 px-2.5 bg-slate-800/80 hover:bg-slate-700 text-slate-300 text-[11px] rounded-xl border border-slate-700 transition"
                        >
                          "{qp.label}"
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* AI Draft Card (Confirmation Stage) */}
              {currentDraft && (
                <div className="bg-slate-800/90 border border-emerald-500/40 rounded-3xl p-4 sm:p-5 space-y-4 shadow-xl animate-fade-in">
                  <div className="flex items-center justify-between border-b border-slate-700 pb-3">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-5 h-5 text-emerald-400" />
                      <span className="text-xs font-black uppercase tracking-wider text-emerald-400">
                        AI Safety Confirmation
                      </span>
                    </div>
                    <span className="text-[10px] font-bold bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded-full">
                      {currentDraft.actionType}
                    </span>
                  </div>

                  {/* Duplicate Product Match Alert */}
                  {currentDraft.isDuplicateWarning && currentDraft.duplicateMatch && (
                    <div className="bg-amber-500/15 border border-amber-500/40 rounded-2xl p-3 space-y-2">
                      <div className="flex items-center gap-2 text-amber-400 font-bold text-xs">
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        <span>समान सामान पहले से मौजूद है (Duplicate Product Warning)</span>
                      </div>
                      <div className="text-[11px] text-amber-200/90">
                        {currentDraft.duplicateMatch.existingProductName} (₹{currentDraft.duplicateMatch.currentPrice}/{currentDraft.duplicateMatch.currentUnit}, Stock: {currentDraft.duplicateMatch.currentStock})
                      </div>
                      <div className="flex gap-2 pt-1">
                        <button
                          onClick={() => {
                            if (currentDraft && currentDraft.duplicateMatch) {
                              setCurrentDraft({
                                ...currentDraft,
                                actionType: 'UPDATE_PRICE',
                                isDuplicateWarning: false,
                                extractedEntities: {
                                  ...currentDraft.extractedEntities,
                                  targetProductId: currentDraft.duplicateMatch.existingProductId,
                                  targetProductName: currentDraft.duplicateMatch.existingProductName,
                                },
                              });
                            }
                          }}
                          className="py-1 px-2.5 bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold text-[11px] rounded-lg transition"
                        >
                          मौजूदा का दाम बदलें (Update Existing Price)
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="text-xs text-slate-200 bg-slate-900/80 p-3 rounded-2xl border border-slate-800">
                    <div className="font-semibold">{currentDraft.replyMessage}</div>
                    {currentDraft.replyMessageHindi && (
                      <div className="text-slate-400 mt-1 font-hindi">
                        {currentDraft.replyMessageHindi}
                      </div>
                    )}
                  </div>

                  {/* Editable Preview Fields */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                    <div className="col-span-2">
                      <label className="text-[10px] font-bold text-slate-400">Product Name</label>
                      <input
                        type="text"
                        value={editableName}
                        onChange={(e) => setEditableName(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-white font-bold outline-hidden"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-slate-400">Price (₹)</label>
                      <input
                        type="number"
                        value={editablePrice}
                        onChange={(e) => setEditablePrice(e.target.value === '' ? '' : Number(e.target.value))}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-emerald-400 font-bold outline-hidden"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-slate-400">Stock ({editableUnit})</label>
                      <input
                        type="number"
                        value={editableStock}
                        onChange={(e) => setEditableStock(e.target.value === '' ? '' : Number(e.target.value))}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-white font-bold outline-hidden"
                      />
                    </div>
                  </div>

                  {/* Confirmation Actions */}
                  <div className="flex gap-2 pt-2">
                    <button
                      onClick={() => {
                        setCurrentDraft(null);
                        setTranscript('');
                      }}
                      className="py-2.5 px-3 bg-slate-700 hover:bg-slate-600 text-slate-300 text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5"
                    >
                      <RotateCcw className="w-3.5 h-3.5" /> Cancel
                    </button>
                    <button
                      onClick={handleConfirmAction}
                      disabled={isLoading}
                      className="flex-1 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black rounded-xl transition flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/30"
                    >
                      {isLoading ? (
                        <span>Updating Catalog...</span>
                      ) : (
                        <>
                          <CheckCircle2 className="w-4 h-4" />
                          Confirm & Apply to Dukan
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* MODE 2: PHOTO OCR */}
          {activeMode === 'PHOTO' && (
            <div className="space-y-4">
              <input
                type="file"
                accept="image/*"
                capture="environment"
                ref={fileInputRef}
                onChange={handlePhotoSelect}
                className="hidden"
              />

              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-700 hover:border-emerald-500 rounded-3xl p-6 text-center cursor-pointer transition bg-slate-950/40 space-y-3"
              >
                {selectedPhotoBase64 && selectedPhotoBase64.trim() !== '' ? (
                  <div className="space-y-3">
                    <img
                      src={selectedPhotoBase64}
                      alt="Uploaded packet"
                      className="max-h-48 mx-auto rounded-2xl object-contain border border-slate-700 shadow-md"
                    />
                    <div className="text-xs text-emerald-400 font-bold">Photo loaded! Tap to change.</div>
                  </div>
                ) : (
                  <>
                    <div className="w-14 h-14 bg-emerald-500/10 text-emerald-400 rounded-full flex items-center justify-center mx-auto border border-emerald-500/20">
                      <Camera className="w-7 h-7" />
                    </div>
                    <div>
                      <div className="text-sm font-bold text-white">Click or Upload Product Photo</div>
                      <div className="text-xs text-slate-400 mt-1">
                        AI will read brand, name, MRP & weight automatically
                      </div>
                    </div>
                  </>
                )}
              </div>

              {photoExtractResult && (
                <div className="bg-slate-800/90 border border-slate-700 rounded-2xl p-4 space-y-3">
                  <div className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                    Detected Product Info
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-slate-400">Name: </span>
                      <span className="font-bold text-white">{photoExtractResult.productName}</span>
                    </div>
                    <div>
                      <span className="text-slate-400">Brand: </span>
                      <span className="font-bold text-white">{photoExtractResult.brand}</span>
                    </div>
                    <div>
                      <span className="text-slate-400">MRP: </span>
                      <span className="font-bold text-emerald-400">₹{photoExtractResult.suggestedPrice}</span>
                    </div>
                    <div>
                      <span className="text-slate-400">Pack: </span>
                      <span className="font-bold text-white">{photoExtractResult.packSize}</span>
                    </div>
                  </div>

                  <button
                    onClick={handleConfirmAction}
                    disabled={isLoading}
                    className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black rounded-xl transition flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/30"
                  >
                    <Plus className="w-4 h-4" /> Add to Catalog Now
                  </button>
                </div>
              )}
            </div>
          )}

          {/* MODE 3: AUDITS HISTORY */}
          {activeMode === 'HISTORY' && (
            <div className="space-y-3">
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Immutable AI Action Logs
              </div>
              {audits.length === 0 ? (
                <div className="text-center py-8 text-slate-500 text-xs">
                  No AI voice/photo actions recorded yet.
                </div>
              ) : (
                <div className="space-y-2">
                  {audits.map((a) => (
                    <div
                      key={a.id}
                      className="bg-slate-800/70 border border-slate-700/80 rounded-2xl p-3 text-xs space-y-1"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-emerald-400">{a.action}</span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {new Date(a.executedAt).toLocaleTimeString()}
                        </span>
                      </div>
                      <div className="text-slate-300 text-[11px] font-sans">
                        "{a.rawVoiceTranscript}"
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

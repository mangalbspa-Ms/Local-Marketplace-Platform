/**
 * PhotoManagerModal.tsx
 * 
 * Comprehensive modal for managing Profile Photos and Cover Photos:
 * - Direct tap to change photo or choose from Phone Gallery (Android file picker)
 * - Live photo preview before saving
 * - Save/Set Photo and Cancel buttons
 * - Remove Photo with default restoration
 * - Presets for easy selection
 */

import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Camera,
  Image as ImageIcon,
  Trash2,
  X,
  Upload,
  Check,
  Loader2,
  AlertCircle,
  Sparkles,
  RefreshCw,
} from 'lucide-react';

export interface PhotoManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  type: 'profile' | 'cover';
  currentPhotoUrl?: string;
  targetName: string;
  onSave?: (result: { action: 'set' | 'remove'; url?: string; imageData?: string }) => Promise<void>;
  onConfirm?: (result: { action: 'set' | 'remove'; url?: string; imageData?: string }) => Promise<void>;
  roleLabel?: string;
}

const PRESET_PROFILE_PHOTOS = [
  'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1543610892-0b1f7e6d8ac1?auto=format&fit=crop&w=400&q=80',
];

const PRESET_COVER_PHOTOS = [
  'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1610348725531-843dff563e2c?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1579113800032-c38bd7635818?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1488459716781-31db52582fe9?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1506484381205-f7945653044d?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1518843875459-f738682238a6?auto=format&fit=crop&w=1200&q=80',
];

export const PhotoManagerModal: React.FC<PhotoManagerModalProps> = ({
  isOpen,
  onClose,
  title,
  type,
  currentPhotoUrl,
  targetName,
  onSave,
  onConfirm,
  roleLabel,
}) => {
  const saveHandler = onSave || onConfirm;
  const fileInputRef = useRef<HTMLInputElement>(null);

  // States
  const [selectedImageData, setSelectedImageData] = useState<string | null>(null);
  const [selectedUrl, setSelectedUrl] = useState<string>('');
  const [isCustomUrlMode, setIsCustomUrlMode] = useState(false);
  const [customUrlInput, setCustomUrlInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  // Reset states when modal is opened or closed
  React.useEffect(() => {
    if (isOpen) {
      setSelectedImageData(null);
      setSelectedUrl('');
      setIsCustomUrlMode(false);
      setCustomUrlInput('');
      setErrorMessage(null);
      setConfirmDelete(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Handle phone gallery file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMessage('कृपया केवल इमेज (JPG, PNG, WEBP) फ़ाइल चुनें।');
      return;
    }

    // 5MB limit
    if (file.size > 5 * 1024 * 1024) {
      setErrorMessage('फ़ाइल का आकार 5MB से कम होना चाहिए।');
      return;
    }

    setErrorMessage(null);
    const reader = new FileReader();
    reader.onload = (uploadEvent) => {
      const dataUrl = uploadEvent.target?.result as string;
      setSelectedImageData(dataUrl);
      setSelectedUrl('');
    };
    reader.readAsDataURL(file);
  };

  const handleOpenGallery = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
      fileInputRef.current.click();
    }
  };

  const handleSelectPreset = (url: string) => {
    setSelectedUrl(url);
    setSelectedImageData(null);
    setErrorMessage(null);
  };

  const handleApplyCustomUrl = () => {
    if (!customUrlInput.trim()) return;
    setSelectedUrl(customUrlInput.trim());
    setSelectedImageData(null);
    setIsCustomUrlMode(false);
    setErrorMessage(null);
  };

  const handleSavePhoto = async () => {
    try {
      setIsLoading(true);
      setErrorMessage(null);

      if (selectedImageData) {
        if (saveHandler) await saveHandler({ action: 'set', imageData: selectedImageData });
      } else if (selectedUrl) {
        if (saveHandler) await saveHandler({ action: 'set', url: selectedUrl });
      } else {
        setErrorMessage('कृपया पहले एक फोटो चुनें।');
        setIsLoading(false);
        return;
      }

      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'फोटो सेव करने में त्रुटि हुई');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeletePhoto = async () => {
    try {
      setIsLoading(true);
      setErrorMessage(null);
      if (saveHandler) await saveHandler({ action: 'remove' });
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'फोटो हटाने में त्रुटि हुई');
    } finally {
      setIsLoading(false);
    }
  };

  const activePreview = selectedImageData || selectedUrl || currentPhotoUrl;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-slate-100 flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
            <div>
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-emerald-100 text-emerald-700">
                  {type === 'profile' ? <Camera className="w-4 h-4" /> : <ImageIcon className="w-4 h-4" />}
                </span>
                <h3 className="text-base font-bold text-slate-800">{title}</h3>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {targetName} {roleLabel ? `• ${roleLabel}` : ''}
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-2.5 py-1 text-slate-500 hover:text-slate-800 rounded-lg hover:bg-slate-200/70 border border-slate-200 text-xs font-bold flex items-center gap-1 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
              <span>Close</span>
            </button>
          </div>

          {/* Hidden File Input for Phone Gallery */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
          />

          {/* Body Content */}
          <div className="p-6 overflow-y-auto space-y-5">
            {/* Error banner */}
            {errorMessage && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2.5 text-xs text-rose-700 font-medium">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Photo Preview Stage */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-600">
                <span>फोटो पूर्वावलोकन (Preview)</span>
                {selectedImageData && (
                  <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    गैलरी से चयनित (Selected from Gallery)
                  </span>
                )}
                {selectedUrl && !selectedImageData && (
                  <span className="text-[11px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                    नई फोटो चयनित
                  </span>
                )}
              </div>

              {type === 'profile' ? (
                /* Profile Photo Preview Box */
                <div className="flex flex-col items-center justify-center p-6 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                  <div className="relative w-32 h-32 rounded-full overflow-hidden border-4 border-white shadow-md bg-slate-200 flex items-center justify-center">
                    {activePreview ? (
                      <img
                        src={activePreview}
                        alt="Profile Preview"
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center text-slate-400">
                        <Camera className="w-10 h-10 mb-1" />
                        <span className="text-[10px] font-medium">Default Icon</span>
                      </div>
                    )}
                  </div>
                  <span className="text-xs text-slate-500 mt-2 font-medium">
                    {activePreview ? 'सुझाव: चौकोर (1:1) फोटो सबसे अच्छी दिखती है' : 'कोई फोटो नहीं है (Default Icon सक्रिय)'}
                  </span>
                </div>
              ) : (
                /* Cover Photo Preview Box */
                <div className="space-y-1">
                  <div className="relative w-full h-36 rounded-2xl overflow-hidden border-2 border-slate-200 shadow-xs bg-slate-100 flex items-center justify-center">
                    {activePreview ? (
                      <img
                        src={activePreview}
                        alt="Cover Preview"
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-r from-emerald-600 to-teal-700 flex flex-col items-center justify-center text-white/80 p-4 text-center">
                        <ImageIcon className="w-8 h-8 mb-1" />
                        <span className="text-xs font-bold">Default Cover Banner Pattern</span>
                      </div>
                    )}
                  </div>
                  <span className="text-[11px] text-slate-500 font-medium block">
                    {activePreview ? 'सुझाव: लैंडस्केप (16:9) बैनर फोटो सबसे अच्छी दिखती है' : 'कोई कवर फोटो नहीं है (Default Cover सक्रिय)'}
                  </span>
                </div>
              )}
            </div>

            {/* Action 1: Choose from Phone Gallery Button */}
            <div className="space-y-2">
              <button
                type="button"
                onClick={handleOpenGallery}
                disabled={isLoading}
                className="w-full py-3 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white font-bold text-sm shadow-sm flex items-center justify-center gap-2.5 transition-all cursor-pointer"
              >
                <Upload className="w-4 h-4" />
                <span>फोन Gallery से फोटो चुनें (Choose from Gallery)</span>
              </button>
              <p className="text-[11px] text-slate-500 text-center">
                Android फोन या डिवाइस से तुरंत फोटो सेलेक्ट या कैमरा से क्लिक करें
              </p>
            </div>

            {/* Preset Suggestions */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  <span>सुझाए गए विकल्प (Preset Suggestions)</span>
                </span>
                <button
                  type="button"
                  onClick={() => setIsCustomUrlMode(!isCustomUrlMode)}
                  className="text-xs font-semibold text-emerald-600 hover:underline"
                >
                  {isCustomUrlMode ? 'प्रीसेट देखें' : 'URL से जोड़ें'}
                </button>
              </div>

              {isCustomUrlMode ? (
                <div className="flex items-center gap-2">
                  <input
                    type="url"
                    value={customUrlInput}
                    onChange={(e) => setCustomUrlInput(e.target.value)}
                    placeholder="https://example.com/photo.jpg"
                    className="flex-1 px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  <button
                    type="button"
                    onClick={handleApplyCustomUrl}
                    className="px-3 py-2 bg-slate-800 text-white rounded-xl text-xs font-bold hover:bg-slate-700 transition-colors"
                  >
                    सेट करें
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-6 gap-2">
                  {(type === 'profile' ? PRESET_PROFILE_PHOTOS : PRESET_COVER_PHOTOS).map((url, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleSelectPreset(url)}
                      className={`relative aspect-square rounded-xl overflow-hidden border-2 transition-all cursor-pointer ${
                        selectedUrl === url
                          ? 'border-emerald-600 ring-2 ring-emerald-400 scale-105 shadow-sm'
                          : 'border-slate-200 hover:border-slate-400 opacity-80 hover:opacity-100'
                      }`}
                    >
                      <img
                        src={url}
                        alt={`Preset ${idx + 1}`}
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                      {selectedUrl === url && (
                        <div className="absolute inset-0 bg-emerald-600/30 flex items-center justify-center">
                          <Check className="w-4 h-4 text-white drop-shadow-md" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

          </div>

          {/* Footer Save & Cancel Buttons (Requirement 7 & 10) */}
          <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-100 transition-colors cursor-pointer"
            >
              रद्द करें (Cancel)
            </button>
            <button
              type="button"
              onClick={handleSavePhoto}
              disabled={isLoading || (!selectedImageData && !selectedUrl)}
              className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-bold shadow-sm transition-all flex items-center gap-2 cursor-pointer active:scale-95"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>सेव हो रहा है...</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>फोटो सेट करें (Save Photo)</span>
                </>
              )}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

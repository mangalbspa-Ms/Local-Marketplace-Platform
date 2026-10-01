/**
 * PhotoDisplayControl.tsx
 * 
 * Interactive display container for Profile Photo or Cover Photo:
 * - Shows current photo with responsive fallbacks
 * - Clear [फोटो बदलें] (Change Photo) and [हटाएँ] (Remove Photo) buttons
 * - Executes subtle 'pop' scale animation on update
 * - Supports Admin, Seller, and Customer views
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Camera, Image as ImageIcon, Trash2, Edit3, Upload } from 'lucide-react';
import { PhotoManagerModal } from './PhotoManagerModal.tsx';

export interface PhotoDisplayControlProps {
  type: 'profile' | 'cover';
  photoUrl?: string;
  title: string;
  subtitle?: string;
  targetName: string;
  roleLabel?: string;
  canEdit?: boolean;
  onUpdatePhoto: (result: { action: 'set' | 'remove'; url?: string; imageData?: string }) => Promise<void>;
  className?: string;
}

export const PhotoDisplayControl: React.FC<PhotoDisplayControlProps> = ({
  type,
  photoUrl,
  title,
  subtitle,
  targetName,
  roleLabel,
  canEdit = true,
  onUpdatePhoto,
  className = '',
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPopping, setIsPopping] = useState(false);

  // Trigger subtle pop animation whenever photoUrl changes
  useEffect(() => {
    setIsPopping(true);
    const timer = setTimeout(() => setIsPopping(false), 600);
    return () => clearTimeout(timer);
  }, [photoUrl]);

  const handleSave = async (result: { action: 'set' | 'remove'; url?: string; imageData?: string }) => {
    await onUpdatePhoto(result);
    // Pop animation triggers on photoUrl update
  };

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
            {type === 'profile' ? <Camera className="w-3.5 h-3.5 text-emerald-600" /> : <ImageIcon className="w-3.5 h-3.5 text-teal-600" />}
            <span>{title}</span>
          </h4>
          {subtitle && <p className="text-[11px] text-slate-500">{subtitle}</p>}
        </div>

        {/* Quick action buttons (Requirement 10) */}
        {canEdit && (
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 transition-colors flex items-center gap-1 cursor-pointer"
            >
              <Edit3 className="w-3 h-3" />
              <span>फोटो बदलें</span>
            </button>
            {photoUrl && photoUrl.trim() !== '' && (
              <button
                type="button"
                onClick={() => handleSave({ action: 'remove' })}
                className="px-2 py-1 text-[11px] font-bold rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-200 transition-colors flex items-center gap-1 cursor-pointer"
                title="हटाएँ"
              >
                <Trash2 className="w-3 h-3" />
                <span>हटाएँ</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Container with Subtle Pop Animation on update */}
      <motion.div
        animate={isPopping ? { scale: [1, 1.035, 1], filter: ['brightness(1)', 'brightness(1.1)', 'brightness(1)'] } : { scale: 1 }}
        transition={{ duration: 0.45, ease: 'easeOut' }}
        onClick={() => canEdit && setIsModalOpen(true)}
        className={`relative group overflow-hidden rounded-2xl border-2 transition-all ${
          canEdit ? 'cursor-pointer hover:border-emerald-400 hover:shadow-md' : ''
        } ${type === 'profile' ? 'w-24 h-24 sm:w-28 sm:h-28 rounded-2xl border-slate-200 bg-slate-100' : 'w-full h-36 sm:h-44 border-slate-200 bg-slate-100'}`}
      >
        {photoUrl && photoUrl.trim() !== '' ? (
          <img
            src={photoUrl}
            alt={title}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            referrerPolicy="no-referrer"
          />
        ) : type === 'profile' ? (
          /* Default Profile Icon */
          <div className="w-full h-full flex flex-col items-center justify-center bg-slate-100 text-slate-400 group-hover:bg-slate-200/80 transition-colors">
            <Camera className="w-8 h-8 text-slate-400 mb-0.5" />
            <span className="text-[10px] font-semibold text-slate-500">Default Icon</span>
          </div>
        ) : (
          /* Default Cover Pattern */
          <div className="w-full h-full bg-gradient-to-r from-emerald-700 via-teal-700 to-emerald-900 flex flex-col items-center justify-center text-white/90 p-4 text-center group-hover:brightness-105 transition-all">
            <ImageIcon className="w-8 h-8 mb-1.5 opacity-80" />
            <span className="text-xs font-bold tracking-wide">Default Shop Cover Pattern</span>
            <span className="text-[10px] text-emerald-100/70 mt-0.5">टैप करके अपनी दुकान का बैनर जोड़ें</span>
          </div>
        )}

        {/* Hover Overlay for Editing */}
        {canEdit && (
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white gap-1.5 backdrop-blur-[1px]">
            <Upload className="w-4 h-4" />
            <span className="text-xs font-bold">फोटो बदलें</span>
          </div>
        )}

        {/* Pop indicator badge */}
        {isPopping && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-emerald-600 text-white text-[9px] font-bold shadow-sm pointer-events-none"
          >
            अपडेटेड ✓
          </motion.div>
        )}
      </motion.div>

      {/* Modal Dialog */}
      <PhotoManagerModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={type === 'profile' ? `${targetName} - प्रोफ़ाइल फोटो` : `${targetName} - कवर फोटो`}
        type={type}
        currentPhotoUrl={photoUrl}
        targetName={targetName}
        roleLabel={roleLabel}
        onSave={handleSave}
      />
    </div>
  );
};

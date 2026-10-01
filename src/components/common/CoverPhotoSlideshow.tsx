import React, { useState, useEffect, useRef, useMemo } from 'react';

export interface CoverPhotoSlideshowProps {
  photos: string[];
  fallbackPhoto?: string;
  alt?: string;
  className?: string;
  containerClassName?: string;
  intervalMs?: number;
  transitionDurationMs?: number;
  isPaused?: boolean;
  imgId?: string;
  onPhotoClick?: (currentPhotoUrl: string, currentIndex: number) => void;
  onCurrentPhotoChange?: (currentPhotoUrl: string, currentIndex: number) => void;
}

export const CoverPhotoSlideshow: React.FC<CoverPhotoSlideshowProps> = ({
  photos,
  fallbackPhoto,
  alt = 'Cover Photo',
  className = 'w-full h-full object-cover',
  containerClassName = 'absolute inset-0 w-full h-full',
  intervalMs = 4500, // 4.5 seconds visible before transition
  transitionDurationMs = 1800, // 1.8 seconds smooth cross-fade
  isPaused = false,
  imgId,
  onPhotoClick,
  onCurrentPhotoChange,
}) => {
  // Normalize and clean photo list
  const validPhotos = useMemo(() => {
    const list = (photos || []).filter(
      (p): p is string => Boolean(p && typeof p === 'string' && p.trim().length > 0)
    );
    if (list.length > 0) return list;
    return fallbackPhoto ? [fallbackPhoto] : [];
  }, [photos, fallbackPhoto]);

  const [baseIndex, setBaseIndex] = useState(0);
  const [incomingIndex, setIncomingIndex] = useState<number | null>(null);
  const [isFading, setIsFading] = useState(false);

  // Notify parent of current photo
  const currentDisplayedPhoto = validPhotos[baseIndex] || fallbackPhoto || '';
  const onCurrentPhotoChangeRef = useRef(onCurrentPhotoChange);
  useEffect(() => {
    onCurrentPhotoChangeRef.current = onCurrentPhotoChange;
  });

  useEffect(() => {
    onCurrentPhotoChangeRef.current?.(currentDisplayedPhoto, baseIndex);
  }, [currentDisplayedPhoto, baseIndex]);

  // Keep track of timeouts and animation frames for clean cancellation
  const intervalTimerRef = useRef<NodeJS.Timeout | null>(null);
  const fadeStartTimerRef = useRef<NodeJS.Timeout | null>(null);
  const fadeEndTimerRef = useRef<NodeJS.Timeout | null>(null);
  const rafRef = useRef<number | null>(null);

  // Pointer & Long-press detection
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isLongPressedRef = useRef(false);

  const handlePointerDown = (photo: string, index: number) => {
    if (!onPhotoClick) return;
    isLongPressedRef.current = false;
    longPressTimerRef.current = setTimeout(() => {
      isLongPressedRef.current = true;
      onPhotoClick(photo, index);
    }, 450);
  };

  const handlePointerUpOrCancel = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };

  const handleClick = (photo: string, index: number) => {
    if (!onPhotoClick) return;
    if (isLongPressedRef.current) {
      isLongPressedRef.current = false;
      return;
    }
    onPhotoClick(photo, index);
  };

  // Ensure baseIndex is within bounds if photos length changes
  useEffect(() => {
    if (validPhotos.length === 0) {
      setBaseIndex(0);
      setIncomingIndex(null);
      setIsFading(false);
    } else if (baseIndex >= validPhotos.length) {
      setBaseIndex(0);
      setIncomingIndex(null);
      setIsFading(false);
    }
  }, [validPhotos.length, baseIndex]);

  // Preload the next upcoming photo into memory
  useEffect(() => {
    if (validPhotos.length > 1) {
      const nextIdx = (baseIndex + 1) % validPhotos.length;
      const nextUrl = validPhotos[nextIdx];
      if (nextUrl) {
        try {
          if (typeof document !== 'undefined') {
            const img = document.createElement('img');
            img.src = nextUrl;
          }
        } catch {
          // Preload error ignored
        }
      }
    }
  }, [baseIndex, validPhotos]);

  // Main automatic slideshow loop
  useEffect(() => {
    // Clear any previous running timers
    const clearTimers = () => {
      if (intervalTimerRef.current) clearTimeout(intervalTimerRef.current);
      if (fadeStartTimerRef.current) clearTimeout(fadeStartTimerRef.current);
      if (fadeEndTimerRef.current) clearTimeout(fadeEndTimerRef.current);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };

    clearTimers();

    // If only 1 photo or no photos or paused, do not cycle
    if (validPhotos.length <= 1 || isPaused) {
      return clearTimers;
    }

    // Schedule the next transition after intervalMs
    intervalTimerRef.current = setTimeout(() => {
      const targetIdx = (baseIndex + 1) % validPhotos.length;

      // 1. Mount incoming image layer at opacity: 0
      setIncomingIndex(targetIdx);
      setIsFading(false);

      // 2. Trigger opacity transition in next animation frame / tick
      fadeStartTimerRef.current = setTimeout(() => {
        rafRef.current = requestAnimationFrame(() => {
          setIsFading(true);
        });
      }, 30);

      // 3. When the 1.8s transition completes, promote incoming photo to base layer and reset
      fadeEndTimerRef.current = setTimeout(() => {
        setBaseIndex(targetIdx);
        setIncomingIndex(null);
        setIsFading(false);
      }, transitionDurationMs + 60);
    }, intervalMs);

    return clearTimers;
  }, [baseIndex, validPhotos.length, isPaused, intervalMs, transitionDurationMs]);

  // If 0 or 1 photo, render simple static image with zero animation overhead
  if (validPhotos.length <= 1) {
    const singlePhoto = validPhotos[0] || fallbackPhoto || '';
    return (
      <div
        className={`overflow-hidden select-none isolate ${
          onPhotoClick ? 'pointer-events-auto cursor-pointer' : 'pointer-events-none'
        } ${containerClassName}`}
        onPointerDown={() => handlePointerDown(singlePhoto, 0)}
        onPointerUp={handlePointerUpOrCancel}
        onPointerLeave={handlePointerUpOrCancel}
        onPointerCancel={handlePointerUpOrCancel}
        onClick={() => handleClick(singlePhoto, 0)}
      >
        <img
          id={imgId}
          src={singlePhoto}
          alt={alt}
          className={`${className} w-full h-full object-cover select-none`}
          referrerPolicy="no-referrer"
          onError={(e) => {
            if (fallbackPhoto && (e.target as HTMLImageElement).src !== fallbackPhoto) {
              (e.target as HTMLImageElement).src = fallbackPhoto;
            }
          }}
        />
      </div>
    );
  }

  // Multi-photo smooth cross-fade layers:
  // - Base image: always sits at 100% opacity underneath, preventing any background flash or brightness dip
  // - Incoming image: smoothly fades in over 1.5-2.0s on top, then seamlessly becomes the base image
  return (
    <div
      className={`overflow-hidden select-none isolate ${
        onPhotoClick ? 'pointer-events-auto cursor-pointer' : 'pointer-events-none'
      } ${containerClassName}`}
      onPointerDown={() => handlePointerDown(currentDisplayedPhoto, baseIndex)}
      onPointerUp={handlePointerUpOrCancel}
      onPointerLeave={handlePointerUpOrCancel}
      onPointerCancel={handlePointerUpOrCancel}
      onClick={() => handleClick(currentDisplayedPhoto, baseIndex)}
    >
      {/* Base Layer Image */}
      <img
        id={incomingIndex === null ? imgId : undefined}
        key={`cover-base-${validPhotos[baseIndex]}`}
        src={validPhotos[baseIndex]}
        alt={alt}
        className={`absolute inset-0 w-full h-full object-cover select-none ${className}`}
        referrerPolicy="no-referrer"
        onError={(e) => {
          if (fallbackPhoto && (e.target as HTMLImageElement).src !== fallbackPhoto) {
            (e.target as HTMLImageElement).src = fallbackPhoto;
          }
        }}
      />

      {/* Incoming Layer Image (Fading in smoothly from 0% to 100% over transitionDurationMs) */}
      {incomingIndex !== null && (
        <img
          id={imgId}
          key={`cover-incoming-${validPhotos[incomingIndex]}`}
          src={validPhotos[incomingIndex]}
          alt={alt}
          className={`absolute inset-0 w-full h-full object-cover select-none pointer-events-none ${className}`}
          style={{
            transitionProperty: 'opacity',
            transitionDuration: `${transitionDurationMs}ms`,
            transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)',
            opacity: isFading ? 1 : 0,
            willChange: 'opacity',
            zIndex: 2,
          }}
          referrerPolicy="no-referrer"
          onError={(e) => {
            if (fallbackPhoto && (e.target as HTMLImageElement).src !== fallbackPhoto) {
              (e.target as HTMLImageElement).src = fallbackPhoto;
            }
          }}
        />
      )}
    </div>
  );
};

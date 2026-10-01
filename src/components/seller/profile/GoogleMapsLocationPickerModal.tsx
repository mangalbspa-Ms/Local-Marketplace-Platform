import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  MapPin,
  Crosshair,
  ZoomIn,
  ZoomOut,
  Check,
  RotateCcw,
  ExternalLink,
  ShieldCheck,
  AlertTriangle,
} from 'lucide-react';
import { MarketCoordinates, LocationSource } from '../../../types/market';
import { requestFreshDeviceLocation } from '../../../utils/deviceGeolocation';
import { useSellerLanguage } from '../../../context/SellerLanguageContext';

interface GoogleMapsLocationPickerModalProps {
  isOpen: boolean;
  initialCoordinates?: MarketCoordinates;
  initialAddress?: string;
  shopName: string;
  initialAccuracy?: number;
  initialSource?: LocationSource;
  onClose: () => void;
  onSaveLocation: (
    coordinates: MarketCoordinates,
    locationNotes?: string,
    accuracy?: number,
    source?: LocationSource
  ) => void;
}

export const GoogleMapsLocationPickerModal: React.FC<GoogleMapsLocationPickerModalProps> = ({
  isOpen,
  initialCoordinates,
  initialAddress,
  shopName,
  initialAccuracy,
  initialSource,
  onClose,
  onSaveLocation,
}) => {
  const { language } = useSellerLanguage();
  const isHindi = language === 'hi';

  // Use passed initialCoordinates if valid, else empty/zero or initial fallback
  const [lat, setLat] = useState<number>(initialCoordinates?.lat || 28.6139);
  const [lng, setLng] = useState<number>(initialCoordinates?.lng || 77.2090);
  const [accuracy, setAccuracy] = useState<number | undefined>(initialAccuracy);
  const [locationSource, setLocationSource] = useState<LocationSource>(initialSource || 'manual_pin');
  const [zoomLevel, setZoomLevel] = useState<number>(16);
  const [isDetectingGps, setIsDetectingGps] = useState(false);
  const [gpsStatusMessage, setGpsStatusMessage] = useState<string | null>(null);
  const [gpsSuccess, setGpsSuccess] = useState(false);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);

  // Sync state when modal opens or initialCoordinates change
  useEffect(() => {
    if (isOpen) {
      if (initialCoordinates && typeof initialCoordinates.lat === 'number' && typeof initialCoordinates.lng === 'number') {
        console.log('[LocationPicker] Modal opened with initialCoordinates:', initialCoordinates);
        setLat(initialCoordinates.lat);
        setLng(initialCoordinates.lng);
      }
      setAccuracy(initialAccuracy);
      setLocationSource(initialSource || 'manual_pin');
      setGpsError(null);
      setGpsSuccess(false);
      setGpsStatusMessage(null);
    }
  }, [isOpen, initialCoordinates?.lat, initialCoordinates?.lng, initialAccuracy, initialSource]);

  if (!isOpen) return null;

  // 1. Fresh Device GPS Auto-Detect (Uses navigator.geolocation with enableHighAccuracy: true & maximumAge: 0)
  const handleDetectCurrentLocation = async () => {
    setGpsError(null);
    setGpsSuccess(false);
    setIsDetectingGps(true);

    try {
      console.log('[LocationPicker] User triggered "मेरी वर्तमान लोकेशन लें (Device GPS)" - fetching fresh position...');
      const res = await requestFreshDeviceLocation({
        timeoutMs: 15000,
        onStatusChange: (status) => {
          setGpsStatusMessage(status);
        },
      });

      console.log('[Device GPS] Fresh hardware coordinates returned:', {
        latitude: res.lat,
        longitude: res.lng,
        accuracy: res.accuracy,
        timestamp: res.timestamp,
      });

      // Update state immediately so React state, map center, marker, and displayed text reflect fresh GPS
      setLat(res.lat);
      setLng(res.lng);
      setAccuracy(res.accuracy);
      setLocationSource('gps');
      setGpsSuccess(true);
      setGpsStatusMessage(
        isHindi
          ? `सटीक GPS प्राप्त हुआ (सटीकता: ±${res.accuracy} मी.)`
          : `Accurate GPS acquired (Accuracy: ±${res.accuracy}m)`
      );
      setTimeout(() => setGpsSuccess(false), 6000);
    } catch (err: any) {
      console.error('[Device GPS] Error obtaining location:', err);
      setGpsError(
        err.message ||
          (isHindi
            ? 'डिवाइस से GPS लोकेशन प्राप्त करने में असमर्थ।'
            : 'Unable to retrieve GPS location from device.')
      );
    } finally {
      setIsDetectingGps(false);
    }
  };

  // Delta degrees per zoom level for real map bounding box & interactive adjustments
  const deltaLat = 0.0035 * Math.pow(2, 16 - zoomLevel);
  const deltaLng = 0.0055 * Math.pow(2, 16 - zoomLevel);
  const minLat = (lat - deltaLat).toFixed(5);
  const maxLat = (lat + deltaLat).toFixed(5);
  const minLng = (lng - deltaLng).toFixed(5);
  const maxLng = (lng + deltaLng).toFixed(5);

  // Real map embed URL centered on current lat & lng
  const mapEmbedUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${minLng}%2C${minLat}%2C${maxLng}%2C${maxLat}&layer=mapnik&marker=${lat.toFixed(5)}%2C${lng.toFixed(5)}`;

  // 2. Click on map container to adjust pin and center
  const handleMapClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!mapContainerRef.current) return;
    const rect = mapContainerRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    // Offset from center (-0.5 to +0.5)
    const offsetX = (clickX / rect.width) - 0.5;
    const offsetY = 0.5 - (clickY / rect.height);

    const newLat = parseFloat((lat + offsetY * deltaLat * 2).toFixed(6));
    const newLng = parseFloat((lng + offsetX * deltaLng * 2).toFixed(6));

    console.log('[LocationPicker] User adjusted location via map tap:', { newLat, newLng });
    setLat(newLat);
    setLng(newLng);
    setLocationSource('manual_pin');
    setAccuracy(undefined);
  };

  // 3. Quick Landmark selection
  const handleSelectQuickLandmark = (item: { nameHi: string; nameEn: string; lat: number; lng: number }) => {
    console.log('[LocationPicker] Selected quick landmark:', item);
    setLat(item.lat);
    setLng(item.lng);
    setLocationSource('manual_pin');
    setAccuracy(undefined);
  };

  // 4. Save exact location - passes CURRENT active latitude & longitude
  const handleSave = () => {
    console.log('[LocationPicker] Saving current coordinates to parent & backend:', {
      lat,
      lng,
      accuracy,
      locationSource,
    });
    onSaveLocation({ lat, lng }, undefined, accuracy, locationSource);
    onClose();
  };

  // 5. Reset button - restores initial coordinates from shop if available, never hardcoded fake value
  const handleReset = () => {
    if (initialCoordinates) {
      console.log('[LocationPicker] Resetting to initial coordinates:', initialCoordinates);
      setLat(initialCoordinates.lat);
      setLng(initialCoordinates.lng);
      setAccuracy(initialAccuracy);
      setLocationSource(initialSource || 'manual_pin');
    }
    setGpsError(null);
    setGpsSuccess(false);
    setGpsStatusMessage(null);
  };

  const quickLandmarks = [
    { nameHi: 'राजा पार्क मुख्य मंडी, जयपुर', nameEn: 'Raja Park Main Mandi, Jaipur', lat: 26.8912, lng: 75.8239 },
    { nameHi: 'दादर सब्जी मंडी, मुंबई', nameEn: 'Dadar Vegetable Mandi, Mumbai', lat: 19.0178, lng: 72.8478 },
    { nameHi: 'आजादपुर थोक मंडी, दिल्ली', nameEn: 'Azadpur Wholesale Mandi, Delhi', lat: 28.7153, lng: 77.1782 },
    { nameHi: 'एम.आई. रोड कमर्शियल हब, जयपुर', nameEn: 'M.I. Road Commercial Hub, Jaipur', lat: 26.9157, lng: 75.8189 },
    { nameHi: 'वाशी APMC मार्केट, नवी मुंबई', nameEn: 'Vashi APMC Market, Navi Mumbai', lat: 19.076, lng: 73.0033 },
  ];

  return (
    <div
      id="google-maps-location-picker-modal"
      className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="bg-[#0b142c] border border-cyan-500/30 rounded-3xl p-4 sm:p-5 w-full max-w-lg text-slate-100 shadow-[0_0_50px_rgba(0,0,0,0.95)] space-y-4 max-h-[92vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-cyan-500/20 pb-3 shrink-0">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-cyan-950/80 border border-cyan-500/40 flex items-center justify-center text-cyan-300">
              <MapPin className="w-4 h-4 text-cyan-400" />
            </div>
            <div>
              <h3 className="font-bold text-white text-sm sm:text-base">
                {isHindi ? '🗺️ दुकान की मैप लोकेशन (Live Map)' : '🗺️ Shop Map Location (Live Map)'}
              </h3>
              <p className="text-[11px] text-cyan-300/70">
                {isHindi
                  ? 'डिवाइस GPS या मैप पिन से दुकान की सटीक लोकेशन सेट करें'
                  : 'Set precise shop location using Device GPS or map pin'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white cursor-pointer transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="space-y-3.5 overflow-y-auto pr-1">
          {/* Action 1: GPS Auto-Detect Button */}
          <div className="space-y-2">
            <div className="flex flex-col sm:flex-row gap-2">
              <button
                id="btn-detect-gps-location"
                type="button"
                disabled={isDetectingGps}
                onClick={handleDetectCurrentLocation}
                className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 border border-cyan-400/40 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 cursor-pointer transition active:scale-95 disabled:opacity-60 shadow-[0_0_15px_rgba(6,182,212,0.3)]"
              >
                <Crosshair className={`w-4 h-4 text-cyan-200 ${isDetectingGps ? 'animate-spin' : ''}`} />
                <span>
                  {isDetectingGps
                    ? gpsStatusMessage || (isHindi ? 'GPS से लोकेशन खोजी जा रही है...' : 'Searching location with GPS...')
                    : (isHindi ? '📍 मेरी वर्तमान लोकेशन लें (Device GPS)' : '📍 Get My Current Location (Device GPS)')}
                </span>
              </button>

              <button
                type="button"
                onClick={handleReset}
                className="px-3.5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer transition"
                title={isHindi ? 'पहले से सुरक्षित लोकेशन पर रीसेट करें' : 'Reset to saved location'}
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>{isHindi ? 'रीसेट' : 'Reset'}</span>
              </button>
            </div>

            {/* GPS In-Progress Status */}
            {isDetectingGps && (
              <div className="p-2.5 rounded-xl bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 text-xs flex items-center gap-2 animate-pulse">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                <span>
                  {gpsStatusMessage ||
                    (isHindi ? 'GPS सिग्नल से संपर्क किया जा रहा है...' : 'Connecting to GPS signal...')}
                </span>
              </div>
            )}

            {/* GPS Success & Accuracy Badge */}
            {gpsSuccess && (
              <div className="p-2.5 rounded-xl bg-emerald-950/90 border border-emerald-500/50 text-emerald-300 text-xs font-bold flex items-center justify-between gap-2 shadow-sm">
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 shrink-0 text-emerald-400 stroke-[3]" />
                  <span>{gpsStatusMessage || (isHindi ? 'सटीक लोकेशन प्राप्त हुई' : 'Precise location obtained')}</span>
                </div>
                {accuracy !== undefined && (
                  <span className="px-2 py-0.5 rounded-full bg-emerald-900 border border-emerald-400/40 text-[10px] text-emerald-200 font-mono">
                    ±{accuracy}m
                  </span>
                )}
              </div>
            )}

            {/* Accuracy Indicator when already set via GPS */}
            {!gpsSuccess && accuracy !== undefined && locationSource === 'gps' && (
              <div className="px-3 py-1.5 rounded-xl bg-cyan-950/60 border border-cyan-500/30 text-cyan-300 text-[11px] flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
                  <span>{isHindi ? 'GPS आधारित लोकेशन सक्रिय' : 'GPS-based location active'}</span>
                </span>
                <span className="font-mono text-cyan-200 text-[10px] font-bold">
                  🎯 {isHindi ? `सटीकता: ±${accuracy} मी.` : `Accuracy: ±${accuracy}m`}
                </span>
              </div>
            )}

            {/* GPS Error Guidance */}
            {gpsError && (
              <div className="p-2.5 rounded-xl bg-rose-950/90 border border-rose-500/50 text-rose-200 text-xs flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
                <div className="space-y-0.5">
                  <p className="font-semibold">{gpsError}</p>
                  <p className="text-[11px] text-rose-300/80">
                    {isHindi
                      ? 'सलाह: फोन/कंप्यूटर सेटिंग्स में जाकर लोकेशन (GPS) चालू करें और ब्राउज़र को परमिशन दें।'
                      : 'Tip: Enable Location (GPS) in phone/computer settings and allow browser permission.'}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Action 2: Real Interactive Map Canvas */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[11px] text-slate-400">
              <span className="font-semibold text-slate-300">
                {isHindi ? 'मैप पर कहीं भी टैप करके पिन एडजस्ट करें:' : 'Tap anywhere on the map to adjust pin:'}
              </span>
              <span className="font-mono text-cyan-400 text-[10px] font-bold">
                {lat.toFixed(5)}° N, {lng.toFixed(5)}° E
              </span>
            </div>

            <div
              ref={mapContainerRef}
              onClick={handleMapClick}
              className="relative w-full h-64 sm:h-72 rounded-2xl overflow-hidden border border-cyan-500/40 bg-[#071329] cursor-crosshair select-none shadow-inner group"
            >
              {/* Real Map Tile Embed */}
              <iframe
                key={`${lat.toFixed(4)}-${lng.toFixed(4)}-${zoomLevel}`}
                src={mapEmbedUrl}
                title="Shop Real Map Location"
                className="w-full h-full border-0 pointer-events-none select-none opacity-90"
                loading="lazy"
              />

              {/* Floating Center Drop Pin with Shop Tag */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
                <div className="flex flex-col items-center -translate-y-4">
                  <div className="px-2 py-0.5 rounded-full bg-slate-950/90 border border-cyan-400 text-cyan-300 text-[10px] font-bold shadow-xl mb-1 whitespace-nowrap flex items-center gap-1.5 backdrop-blur-sm">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                    <span>{shopName || (isHindi ? 'दुकान की लोकेशन' : 'Shop Location')}</span>
                  </div>
                  <div className="relative">
                    <MapPin className="w-9 h-9 text-rose-500 fill-rose-500/90 drop-shadow-[0_0_12px_rgba(244,63,94,0.9)] stroke-white stroke-[1.5]" />
                  </div>
                  <div className="w-3 h-1 rounded-full bg-black/70 blur-[1px] -mt-0.5" />
                </div>
              </div>

              {/* Map Controls: Zoom */}
              <div className="absolute top-2.5 right-2.5 flex flex-col gap-1 z-30">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setZoomLevel((z) => Math.min(z + 1, 19));
                  }}
                  className="w-7 h-7 rounded-lg bg-slate-900/90 hover:bg-slate-800 border border-cyan-500/30 text-white flex items-center justify-center cursor-pointer shadow transition"
                  title={isHindi ? 'ज़ूम इन' : 'Zoom in'}
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setZoomLevel((z) => Math.max(z - 1, 13));
                  }}
                  className="w-7 h-7 rounded-lg bg-slate-900/90 hover:bg-slate-800 border border-cyan-500/30 text-white flex items-center justify-center cursor-pointer shadow transition"
                  title={isHindi ? 'ज़ूम आउट' : 'Zoom out'}
                >
                  <ZoomOut className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Live Status & External Google Maps Link */}
              <div className="absolute bottom-2 left-2.5 right-2.5 z-30 flex items-center justify-between pointer-events-auto">
                <div className="px-2 py-0.5 rounded-md bg-slate-950/85 border border-slate-800 text-[9px] font-mono text-slate-300 flex items-center gap-1.5">
                  <span className="text-cyan-400 font-bold">🗺️ Real Map</span>
                  <span>• Zoom {zoomLevel}x</span>
                </div>
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${lat},${lng}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="px-2.5 py-1 rounded-md bg-slate-950/90 hover:bg-cyan-950 border border-cyan-500/40 text-[10px] text-cyan-300 font-bold flex items-center gap-1 transition shadow cursor-pointer"
                  title={isHindi ? 'Google Maps में नया टैब खोलें' : 'Open in Google Maps in new tab'}
                >
                  <span>Google Maps</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          </div>

          {/* Quick Mandi Area Selectors */}
          <div className="space-y-1">
            <span className="text-[10px] text-slate-400 font-bold block">
              {isHindi ? 'प्रमुख मंडी क्षेत्र से चुनें:' : 'Select from major mandi areas:'}
            </span>
            <div className="flex flex-wrap gap-1.5">
              {quickLandmarks.map((lm, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSelectQuickLandmark(lm)}
                  className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-cyan-950/60 border border-slate-800 hover:border-cyan-500/40 text-[10px] text-slate-300 hover:text-cyan-200 transition cursor-pointer font-medium"
                >
                  📍 {isHindi ? lm.nameHi : lm.nameEn}
                </button>
              ))}
            </div>
          </div>

          {/* Manual Fine-Tuning Coordinates Inputs */}
          <div className="p-3 rounded-2xl bg-[#070e24] border border-cyan-500/20 grid grid-cols-2 gap-2 text-xs">
            <div>
              <label className="block text-[10px] text-slate-400 font-bold mb-0.5">
                {isHindi ? 'Latitude (अक्षांश):' : 'Latitude:'}
              </label>
              <input
                type="number"
                step="0.000001"
                value={lat}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  if (!isNaN(val)) {
                    setLat(val);
                    setLocationSource('manual_pin');
                    setAccuracy(undefined);
                  }
                }}
                className="w-full px-2 py-1 bg-slate-900 border border-slate-700 rounded-lg text-white font-mono text-xs focus:outline-none focus:border-cyan-400"
              />
            </div>
            <div>
              <label className="block text-[10px] text-slate-400 font-bold mb-0.5">
                {isHindi ? 'Longitude (देशांतर):' : 'Longitude:'}
              </label>
              <input
                type="number"
                step="0.000001"
                value={lng}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  if (!isNaN(val)) {
                    setLng(val);
                    setLocationSource('manual_pin');
                    setAccuracy(undefined);
                  }
                }}
                className="w-full px-2 py-1 bg-slate-900 border border-slate-700 rounded-lg text-white font-mono text-xs focus:outline-none focus:border-cyan-400"
              />
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="pt-2 border-t border-cyan-500/20 flex items-center justify-end gap-2 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition cursor-pointer"
          >
            {isHindi ? 'रद्द करें' : 'Cancel'}
          </button>
          <button
            id="btn-confirm-save-location"
            type="button"
            onClick={handleSave}
            className="py-2.5 px-5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-extrabold flex items-center gap-1.5 shadow-[0_0_15px_rgba(6,182,212,0.3)] transition cursor-pointer active:scale-95"
          >
            <Check className="w-4 h-4 stroke-[2.5]" />
            <span>{isHindi ? '📍 दुकान की यह लोकेशन सेट करें' : '📍 Set This Shop Location'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

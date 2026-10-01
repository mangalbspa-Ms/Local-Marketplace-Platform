/**
 * Google Maps Location Picker Modal for Admin Portal
 * 
 * Enables Admin to:
 * 1. View interactive Google Map for a Seller/Shop.
 * 2. Set/drag the pin to the shop's exact physical location.
 * 3. Fetch fresh high-accuracy device GPS when standing at the shop ("वर्तमान Location प्राप्त करें").
 * 4. Save/update the shop's exact Latitude and Longitude coordinates.
 */

import React, { useEffect, useRef, useState } from 'react';
import { setOptions, importLibrary } from '@googlemaps/js-api-loader';
import { X, MapPin, Crosshair, Check, ZoomIn, ZoomOut, Search, AlertCircle } from 'lucide-react';
import { requestFreshDeviceLocation } from '../../../../utils/deviceGeolocation.ts';

interface AdminGoogleMapLocationPickerModalProps {
  isOpen: boolean;
  shopName: string;
  initialCoordinates?: { lat: number; lng: number };
  initialAddressHint?: string;
  onClose: () => void;
  onConfirmLocation: (coords: { lat: number; lng: number }, formattedAddress?: string) => Promise<void> | void;
}

export const AdminGoogleMapLocationPickerModal: React.FC<AdminGoogleMapLocationPickerModalProps> = ({
  isOpen,
  shopName,
  initialCoordinates,
  initialAddressHint,
  onClose,
  onConfirmLocation,
}) => {
  // Default coordinates fallback: Lucknow center or provided shop coordinates
  const defaultLat = initialCoordinates?.lat && !isNaN(initialCoordinates.lat) ? initialCoordinates.lat : 26.8467;
  const defaultLng = initialCoordinates?.lng && !isNaN(initialCoordinates.lng) ? initialCoordinates.lng : 80.9462;

  const [lat, setLat] = useState<number>(defaultLat);
  const [lng, setLng] = useState<number>(defaultLng);
  const [isLoadingMap, setIsLoadingMap] = useState(true);
  const [isDetectingGps, setIsDetectingGps] = useState(false);
  const [gpsStatusMessage, setGpsStatusMessage] = useState<string | null>(null);
  const [gpsSuccess, setGpsSuccess] = useState(false);
  const [geocodedAddress, setGeocodedAddress] = useState<string>('');
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [searchQuery, setSearchQuery] = useState(initialAddressHint || '');
  const [mapError, setMapError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const markerInstanceRef = useRef<google.maps.Marker | null>(null);
  const geocoderRef = useRef<google.maps.Geocoder | null>(null);

  // Sync initial coordinates when modal opens or coordinates change
  useEffect(() => {
    if (isOpen) {
      const initialLat = initialCoordinates?.lat && !isNaN(initialCoordinates.lat) ? initialCoordinates.lat : 26.8467;
      const initialLng = initialCoordinates?.lng && !isNaN(initialCoordinates.lng) ? initialCoordinates.lng : 80.9462;
      setLat(initialLat);
      setLng(initialLng);
      setSearchQuery(initialAddressHint || '');
      setGpsSuccess(false);
      setGpsStatusMessage(null);
      setMapError(null);
    }
  }, [isOpen, initialCoordinates?.lat, initialCoordinates?.lng, initialAddressHint]);

  // Reverse geocode helper
  const reverseGeocode = (latitude: number, longitude: number) => {
    if (!geocoderRef.current) return;
    setIsGeocoding(true);
    geocoderRef.current.geocode(
      { location: { lat: latitude, lng: longitude } },
      (results: google.maps.GeocoderResult[] | null, status: google.maps.GeocoderStatus) => {
        setIsGeocoding(false);
        if (status === 'OK' && results && results[0]) {
          setGeocodedAddress(results[0].formatted_address);
        } else {
          setGeocodedAddress('');
        }
      }
    );
  };

  // Initialize Google Maps
  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    const apiKey = (import.meta as any).env?.VITE_GOOGLE_MAPS_API_KEY || '';

    setIsLoadingMap(true);

    const initMap = async () => {
      try {
        setOptions({
          key: apiKey,
          v: 'weekly',
          solutionChannel: 'gmp_git_agentskills_v1',
        });

        const [{ Map }, { Marker }, { Geocoder }] = await Promise.all([
          importLibrary('maps'),
          importLibrary('marker'),
          importLibrary('geocoding'),
        ]);

        if (!isMounted || !mapContainerRef.current) return;

        geocoderRef.current = new Geocoder();

        const centerCoords = {
          lat: initialCoordinates?.lat && !isNaN(initialCoordinates.lat) ? initialCoordinates.lat : 26.8467,
          lng: initialCoordinates?.lng && !isNaN(initialCoordinates.lng) ? initialCoordinates.lng : 80.9462,
        };

        const mapOptions: google.maps.MapOptions = {
          center: centerCoords,
          zoom: 16,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
          zoomControl: true,
          internalUsageAttributionIds: ['gmp_git_agentskills_v1'] as any,
        };

        const map = new Map(mapContainerRef.current, mapOptions);
        mapInstanceRef.current = map;

        const marker = new Marker({
          position: centerCoords,
          map,
          draggable: true,
          title: shopName || 'दुकान की लोकेशन',
          animation: google.maps.Animation.DROP,
        });
        markerInstanceRef.current = marker;

        // Map Click Listener
        map.addListener('click', (e: google.maps.MapMouseEvent) => {
          if (e.latLng) {
            const clickedLat = e.latLng.lat();
            const clickedLng = e.latLng.lng();
            setLat(clickedLat);
            setLng(clickedLng);
            marker.setPosition(e.latLng);
            reverseGeocode(clickedLat, clickedLng);
          }
        });

        // Marker Drag End Listener
        marker.addListener('dragend', () => {
          const pos = marker.getPosition();
          if (pos) {
            const draggedLat = pos.lat();
            const draggedLng = pos.lng();
            setLat(draggedLat);
            setLng(draggedLng);
            reverseGeocode(draggedLat, draggedLng);
          }
        });

        setIsLoadingMap(false);

        // Perform initial reverse geocode
        reverseGeocode(centerCoords.lat, centerCoords.lng);
      } catch (err) {
        console.warn('Google Maps JS API load notice:', err);
        if (isMounted) {
          setIsLoadingMap(false);
          setMapError('Google Maps लोड करने में असमर्थ। कृपया नेटवर्क व सेटिंग्स जांचें।');
        }
      }
    };

    initMap();

    return () => {
      isMounted = false;
    };
  }, [isOpen]);

  // GPS Current Location detection
  const handleDetectCurrentLocation = async () => {
    setIsDetectingGps(true);
    setGpsStatusMessage('सटीक GPS सिग्नल खोजा जा रहा है...');
    setGpsSuccess(false);

    try {
      const res = await requestFreshDeviceLocation({
        timeoutMs: 15000,
        onStatusChange: (status) => setGpsStatusMessage(status),
      });

      const freshLat = res.lat;
      const freshLng = res.lng;

      setLat(freshLat);
      setLng(freshLng);
      setGpsSuccess(true);
      setGpsStatusMessage(`वर्तमान लोकेशन प्राप्त हुई (सटीकता: ±${Math.round(res.accuracy)}m)`);

      if (mapInstanceRef.current && markerInstanceRef.current) {
        const newLatLng = new google.maps.LatLng(freshLat, freshLng);
        mapInstanceRef.current.panTo(newLatLng);
        mapInstanceRef.current.setZoom(17);
        markerInstanceRef.current.setPosition(newLatLng);
        reverseGeocode(freshLat, freshLng);
      }

      setTimeout(() => {
        setGpsSuccess(false);
      }, 5000);
    } catch (err: any) {
      setGpsStatusMessage(err.message || 'GPS लोकेशन प्राप्त करने में असमर्थ।');
    } finally {
      setIsDetectingGps(false);
    }
  };

  // Search Address / Landmark
  const handleSearchLocation = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!searchQuery.trim() || !geocoderRef.current) return;

    geocoderRef.current.geocode(
      { address: searchQuery },
      (results: google.maps.GeocoderResult[] | null, status: google.maps.GeocoderStatus) => {
        if (status === 'OK' && results && results[0]) {
          const loc = results[0].geometry.location;
          const searchLat = loc.lat();
          const searchLng = loc.lng();

          setLat(searchLat);
          setLng(searchLng);
          setGeocodedAddress(results[0].formatted_address);

          if (mapInstanceRef.current && markerInstanceRef.current) {
            mapInstanceRef.current.panTo(loc);
            mapInstanceRef.current.setZoom(16);
            markerInstanceRef.current.setPosition(loc);
          }
        } else {
          setGpsStatusMessage('यह स्थान नहीं मिला, कृपया पुनः प्रयास करें।');
        }
      }
    );
  };

  // Confirm and save coordinates
  const handleConfirm = async () => {
    setIsSubmitting(true);
    try {
      await onConfirmLocation(
        {
          lat: parseFloat(lat.toFixed(6)),
          lng: parseFloat(lng.toFixed(6)),
        },
        geocodedAddress
      );
      onClose();
    } catch (err: any) {
      alert('लोकेशन सेव करने में त्रुटि: ' + (err?.message || 'अज्ञात त्रुटि'));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      id="admin-google-maps-location-picker-modal"
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4"
      onClick={onClose}
    >
      <div
        className="bg-slate-900 border border-slate-800 rounded-2xl sm:rounded-3xl w-full max-w-3xl text-slate-100 shadow-2xl flex flex-col h-[90vh] max-h-[720px] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="shrink-0 flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-b border-slate-800 bg-slate-900">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-2xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shrink-0">
              <MapPin className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div>
              <h3 className="font-black text-sm sm:text-base text-white flex items-center gap-2">
                <span>Google Map से Location सेट करें</span>
                <span className="text-[10px] px-2 py-0.5 rounded-md bg-indigo-950 border border-indigo-500/40 text-indigo-300 font-bold truncate max-w-[150px] sm:max-w-xs">
                  {shopName}
                </span>
              </h3>
              <p className="text-[11px] text-slate-400">
                दुकान की सटीक स्थिति पर पिन लगाएं और नीचे “Location Save करें” दबाएं
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition cursor-pointer shrink-0"
            title="बंद करें"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Toolbar: Search + Current GPS Button */}
        <div className="shrink-0 px-4 sm:px-6 py-2.5 bg-slate-950/80 border-b border-slate-800 flex flex-col sm:flex-row gap-2 items-center justify-between">
          <form onSubmit={handleSearchLocation} className="flex-1 w-full flex items-center gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="स्थान या पता खोजें (e.g. Hazratganj, Dadar, Connaught Place)..."
                className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:border-indigo-500 outline-none"
              />
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5" />
            </div>
            <button
              type="submit"
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition shrink-0 cursor-pointer"
            >
              खोजें
            </button>
          </form>

          {/* Current GPS Location Button */}
          <button
            type="button"
            onClick={handleDetectCurrentLocation}
            disabled={isDetectingGps}
            className="w-full sm:w-auto px-3.5 py-1.5 rounded-xl bg-indigo-500/15 hover:bg-indigo-500/25 border border-indigo-500/40 text-indigo-300 text-xs font-bold flex items-center justify-center gap-1.5 transition shrink-0 disabled:opacity-50 cursor-pointer"
          >
            <Crosshair className={`w-3.5 h-3.5 ${isDetectingGps ? 'animate-spin' : ''}`} />
            <span>{isDetectingGps ? 'खोज रहे हैं...' : 'वर्तमान Location प्राप्त करें'}</span>
          </button>
        </div>

        {/* Status bar */}
        {gpsStatusMessage && (
          <div
            className={`shrink-0 px-4 sm:px-6 py-1.5 text-[11px] font-medium border-b flex items-center gap-1.5 ${
              gpsSuccess
                ? 'bg-emerald-950/40 border-emerald-800/60 text-emerald-400'
                : 'bg-indigo-950/30 border-indigo-900/40 text-indigo-300'
            }`}
          >
            {gpsSuccess ? <Check className="w-3.5 h-3.5 shrink-0" /> : <AlertCircle className="w-3.5 h-3.5 shrink-0" />}
            <span className="truncate">{gpsStatusMessage}</span>
          </div>
        )}

        {/* Interactive Map Area (Responsive Flex child, min-h-0) */}
        <div className="relative flex-1 min-h-0 w-full bg-slate-950 overflow-hidden">
          <div ref={mapContainerRef} className="w-full h-full" />

          {isLoadingMap && (
            <div className="absolute inset-0 bg-slate-950/80 flex flex-col items-center justify-center gap-2">
              <div className="w-7 h-7 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-xs text-slate-400 font-medium">Google Map लोड हो रहा है...</p>
            </div>
          )}

          {mapError && (
            <div className="absolute inset-0 bg-slate-950/90 flex flex-col items-center justify-center p-6 text-center gap-2">
              <AlertCircle className="w-8 h-8 text-amber-400" />
              <p className="text-xs text-slate-300 font-bold">{mapError}</p>
              <p className="text-[11px] text-slate-500 max-w-sm">
                आप वर्तमान GPS प्राप्त कर सकते हैं या नीचे दिए गए निर्देशांकों को सीधे अपडेट कर सकते हैं।
              </p>
            </div>
          )}

          {/* Quick instructions floating badge */}
          <div className="absolute top-3 left-3 pointer-events-none bg-slate-900/90 border border-slate-800 backdrop-blur-md px-3 py-1.5 rounded-xl text-[10px] text-slate-300 font-medium flex items-center gap-1.5 shadow-lg">
            <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
            <span>मैप पर क्लिक करें या पिन को दुकान के ऊपर खींचें (Drag)</span>
          </div>

          {/* Zoom controls */}
          <div className="absolute right-3 bottom-3 flex flex-col gap-1.5">
            <button
              type="button"
              onClick={() => mapInstanceRef.current?.setZoom((mapInstanceRef.current?.getZoom() || 16) + 1)}
              className="w-8 h-8 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-white border border-slate-800 flex items-center justify-center shadow-lg transition cursor-pointer"
              title="Zoom In"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => mapInstanceRef.current?.setZoom((mapInstanceRef.current?.getZoom() || 16) - 1)}
              className="w-8 h-8 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-white border border-slate-800 flex items-center justify-center shadow-lg transition cursor-pointer"
              title="Zoom Out"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Selected Coordinates & Save Action Footer - Strictly Fixed at bottom */}
        <div className="shrink-0 px-4 sm:px-6 py-3 sm:py-3.5 border-t border-slate-800 bg-slate-900 space-y-2.5 shadow-2xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] text-slate-400 font-semibold">Lat:</span>
                <span className="font-mono font-bold text-indigo-300 bg-slate-950 px-2 py-0.5 rounded-lg border border-slate-800">
                  {lat.toFixed(6)}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] text-slate-400 font-semibold">Lng:</span>
                <span className="font-mono font-bold text-indigo-300 bg-slate-950 px-2 py-0.5 rounded-lg border border-slate-800">
                  {lng.toFixed(6)}
                </span>
              </div>
            </div>

            {geocodedAddress && (
              <div className="text-[11px] text-slate-400 flex items-center gap-1.5 truncate max-w-sm">
                <MapPin className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                <span className="truncate">{geocodedAddress}</span>
              </div>
            )}
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-1 border-t border-slate-800/80">
            <button
              type="button"
              id="admin-cancel-map-modal-btn"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition cursor-pointer"
            >
              रद्द करें
            </button>
            <button
              type="button"
              id="admin-save-map-location-btn"
              onClick={handleConfirm}
              disabled={isSubmitting}
              className="px-5 sm:px-6 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white text-xs sm:text-sm font-black flex items-center gap-2 shadow-lg shadow-emerald-600/30 transition disabled:opacity-50 cursor-pointer"
            >
              <Check className="w-4 h-4 stroke-[3]" />
              <span>{isSubmitting ? 'सेव हो रहा है...' : 'Location Save करें'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

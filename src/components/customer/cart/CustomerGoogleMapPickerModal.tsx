/**
 * Customer Google Maps Location Picker Modal
 * 
 * Allows customer to interactively select/pin delivery location on Google Maps,
 * retrieve accurate latitude & longitude, and automatically reverse-geocode address details.
 */

import React, { useEffect, useRef, useState } from 'react';
import { setOptions, importLibrary } from '@googlemaps/js-api-loader';
import { X, MapPin, Navigation, Check, ZoomIn, ZoomOut, AlertCircle } from 'lucide-react';
import { useCustomerLanguage } from '../../../context/CustomerLanguageContext.tsx';

interface CustomerGoogleMapPickerModalProps {
  isOpen: boolean;
  initialCoordinates?: { lat: number; lng: number };
  initialAddressHint?: string;
  onClose: () => void;
  onConfirmLocation: (location: {
    lat: number;
    lng: number;
    formattedAddress?: string;
    area?: string;
    city?: string;
    state?: string;
    pincode?: string;
  }) => void;
}

export const CustomerGoogleMapPickerModal: React.FC<CustomerGoogleMapPickerModalProps> = ({
  isOpen,
  initialCoordinates,
  initialAddressHint,
  onClose,
  onConfirmLocation,
}) => {
  const { language } = useCustomerLanguage();
  const isHi = language === 'hi';

  // Default coordinates (Mumbai / Dadar West if not provided)
  const defaultLat = initialCoordinates?.lat || 19.0178;
  const defaultLng = initialCoordinates?.lng || 72.8478;

  const [lat, setLat] = useState<number>(defaultLat);
  const [lng, setLng] = useState<number>(defaultLng);
  const [addressPreview, setAddressPreview] = useState<string>(initialAddressHint || '');
  const [detectedArea, setDetectedArea] = useState<string>('');
  const [detectedCity, setDetectedCity] = useState<string>('');
  const [detectedState, setDetectedState] = useState<string>('');
  const [detectedPincode, setDetectedPincode] = useState<string>('');
  const [isLoadingMap, setIsLoadingMap] = useState<boolean>(true);
  const [isLocating, setIsLocating] = useState<boolean>(false);
  const [mapError, setMapError] = useState<string | null>(null);

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const markerInstanceRef = useRef<google.maps.Marker | null>(null);
  const geocoderRef = useRef<google.maps.Geocoder | null>(null);

  // Sync initial coordinates when modal opens
  useEffect(() => {
    if (isOpen) {
      const targetLat = initialCoordinates?.lat || 19.0178;
      const targetLng = initialCoordinates?.lng || 72.8478;
      setLat(targetLat);
      setLng(targetLng);
      setMapError(null);
    }
  }, [isOpen, initialCoordinates]);

  // Reverse geocode coordinates to get address components
  const reverseGeocode = (latitude: number, longitude: number) => {
    if (!geocoderRef.current) return;

    geocoderRef.current.geocode(
      { location: { lat: latitude, lng: longitude } },
      (results, status) => {
        if (status === 'OK' && results && results[0]) {
          const res = results[0];
          setAddressPreview(res.formatted_address);

          let foundArea = '';
          let foundCity = '';
          let foundState = '';
          let foundPin = '';

          res.address_components.forEach((comp) => {
            const types = comp.types;
            if (types.includes('sublocality') || types.includes('neighborhood')) {
              foundArea = comp.long_name;
            } else if (types.includes('locality')) {
              foundCity = comp.long_name;
            } else if (types.includes('administrative_area_level_1')) {
              foundState = comp.long_name;
            } else if (types.includes('postal_code')) {
              foundPin = comp.long_name;
            }
          });

          if (foundArea) setDetectedArea(foundArea);
          if (foundCity) setDetectedCity(foundCity);
          if (foundState) setDetectedState(foundState);
          if (foundPin) setDetectedPincode(foundPin);
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

        const mapOptions: google.maps.MapOptions = {
          center: { lat: defaultLat, lng: defaultLng },
          zoom: 16,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
          zoomControl: true,
          // Mandatory solution attribution ID from Google Maps Platform guidelines
          internalUsageAttributionIds: ['gmp_git_agentskills_v1'] as any,
        };

        const map = new Map(mapContainerRef.current, mapOptions);
        mapInstanceRef.current = map;

        const marker = new Marker({
          position: { lat: defaultLat, lng: defaultLng },
          map,
          draggable: true,
          title: isHi ? 'डिलीवरी स्थान' : 'Delivery Location',
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
        reverseGeocode(defaultLat, defaultLng);
      } catch (err) {
        console.warn('Google Maps JS API load notice:', err);
        if (isMounted) {
          setIsLoadingMap(false);
          setMapError(isHi ? 'मैप लोड करने में असमर्थ' : 'Unable to load Google Maps');
        }
      }
    };

    initMap();

    return () => {
      isMounted = false;
    };
  }, [isOpen]);

  // Handle Current Location button
  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert(isHi ? 'आपके ब्राउज़र में GPS उपलब्ध नहीं है' : 'Geolocation is not supported by your browser');
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsLocating(false);
        const currentLat = pos.coords.latitude;
        const currentLng = pos.coords.longitude;

        setLat(currentLat);
        setLng(currentLng);

        if (mapInstanceRef.current && markerInstanceRef.current) {
          const latLng = new google.maps.LatLng(currentLat, currentLng);
          mapInstanceRef.current.setCenter(latLng);
          mapInstanceRef.current.setZoom(17);
          markerInstanceRef.current.setPosition(latLng);
        }

        reverseGeocode(currentLat, currentLng);
      },
      (err) => {
        setIsLocating(false);
        console.warn('Geolocation error:', err);
        alert(
          isHi
            ? 'वर्तमान स्थान प्राप्त नहीं हो सका। कृपया मैप पर पिन चुनें।'
            : 'Unable to acquire current location. Please tap/drag the pin on the map.'
        );
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const handleConfirm = () => {
    onConfirmLocation({
      lat,
      lng,
      formattedAddress: addressPreview,
      area: detectedArea,
      city: detectedCity,
      state: detectedState,
      pincode: detectedPincode,
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="bg-white border border-slate-200 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70 shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-700">
              <MapPin className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                {isHi ? '📍 Map से डिलीवरी स्थान चुनें' : '📍 Select Delivery Location on Map'}
              </h3>
              <p className="text-[10px] text-slate-500">
                {isHi ? 'सटीक डिलीवरी के लिए मैप पर पिन लगाएं' : 'Pin your exact delivery address on Google Maps'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-slate-100 text-slate-500 hover:text-slate-900 flex items-center justify-center text-xs font-bold"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Map Container */}
        <div className="relative w-full h-80 sm:h-96 bg-slate-100">
          <div ref={mapContainerRef} className="w-full h-full" />

          {/* Loading Indicator */}
          {isLoadingMap && (
            <div className="absolute inset-0 bg-slate-100/90 flex flex-col items-center justify-center gap-2 text-slate-600">
              <div className="w-6 h-6 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
              <p className="text-xs font-semibold">
                {isHi ? 'Google Maps लोड हो रहा है...' : 'Loading Google Maps...'}
              </p>
            </div>
          )}

          {/* Fallback if map fails to load */}
          {mapError && (
            <div className="absolute inset-0 bg-slate-50 flex flex-col items-center justify-center p-6 text-center space-y-3">
              <AlertCircle className="w-8 h-8 text-amber-600" />
              <p className="text-xs font-bold text-slate-800">{mapError}</p>
              <p className="text-[11px] text-slate-500">
                {isHi
                  ? 'आप नीचे दिए गए निर्देशांक (Coordinates) या वर्तमान GPS का उपयोग कर सकते हैं।'
                  : 'You can use current device GPS or enter coordinates.'}
              </p>
            </div>
          )}

          {/* Device GPS Quick Button */}
          <button
            type="button"
            onClick={handleUseCurrentLocation}
            disabled={isLocating}
            className="absolute top-3 right-3 z-10 px-3 py-2 bg-white/95 hover:bg-white text-slate-800 rounded-xl shadow-md border border-slate-200 text-xs font-bold flex items-center gap-1.5 transition-all disabled:opacity-50"
          >
            <Navigation className={`w-3.5 h-3.5 text-emerald-600 ${isLocating ? 'animate-spin' : ''}`} />
            <span>
              {isLocating
                ? isHi ? 'स्थान खोज रहे हैं...' : 'Locating...'
                : isHi ? 'मेरी वर्तमान लोकेशन' : 'Use Current GPS'}
            </span>
          </button>
        </div>

        {/* Selected Coordinates & Address Info Bar */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 space-y-3 shrink-0">
          <div className="flex items-start gap-2.5">
            <div className="w-6 h-6 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0 mt-0.5">
              <MapPin className="w-3.5 h-3.5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-slate-900 line-clamp-2">
                {addressPreview || (isHi ? 'मैप पर पिन लगाया गया' : 'Pinned Location')}
              </p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-[10px] font-mono font-medium px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-md">
                  Lat: {lat.toFixed(5)}, Lng: {lng.toFixed(5)}
                </span>
                {detectedPincode && (
                  <span className="text-[10px] font-semibold text-slate-600">
                    PIN: {detectedPincode}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold transition-all"
            >
              {isHi ? 'रद्द करें' : 'Cancel'}
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md transition-all flex items-center justify-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>{isHi ? 'यह लोकेशन चुनें' : 'Confirm Pinned Location'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

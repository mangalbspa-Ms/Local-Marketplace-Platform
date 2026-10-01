/**
 * Device Geolocation Utility
 * Enforces high-accuracy device GPS, maximumAge: 0, status feedback, and retry handling.
 * Never uses fake coordinates or IP-based remote fallbacks.
 */

export interface DeviceGeolocationResult {
  lat: number;
  lng: number;
  accuracy: number; // in meters
  source: 'gps';
  timestamp: number;
}

export interface GeolocationStatusCallbacks {
  onStatusChange?: (statusMessage: string) => void;
  timeoutMs?: number;
}

/**
 * Requests fresh GPS position directly from the device hardware/browser API.
 */
export function requestFreshDeviceLocation(
  callbacks: GeolocationStatusCallbacks = {}
): Promise<DeviceGeolocationResult> {
  const timeoutMs = callbacks.timeoutMs || 15000;
  const onStatus = callbacks.onStatusChange || (() => {});

  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !navigator.geolocation) {
      return reject(new Error('ब्राउज़र में GPS की सुविधा उपलब्ध नहीं है (Geolocation not supported)'));
    }

    onStatus('GPS अनुमति मांगी जा रही है...');

    const executePositionRequest = (isRetry: boolean) => {
      onStatus(isRetry ? 'GPS सिग्नल पुनः खोजा जा रहा है...' : 'सटीक लोकेशन प्राप्त हो रही है...');

      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = parseFloat(pos.coords.latitude.toFixed(6));
          const lng = parseFloat(pos.coords.longitude.toFixed(6));
          const accuracy = Math.round(pos.coords.accuracy || 8);

          onStatus(`सटीक लोकेशन प्राप्त हुई (सटीकता: ±${accuracy} मी.)`);
          resolve({
            lat,
            lng,
            accuracy,
            source: 'gps',
            timestamp: pos.timestamp || Date.now(),
          });
        },
        (err) => {
          // GeolocationPositionError codes:
          // 1: PERMISSION_DENIED
          // 2: POSITION_UNAVAILABLE
          // 3: TIMEOUT
          if (err.code === 1) {
            onStatus('लोकेशन अनुमति अस्वीकृत');
            return reject(
              new Error('कृपया अपने ब्राउज़र और मोबाइल सेटिंग्स में लोकेशन अनुमति (Location Permission) चालू करें।')
            );
          }

          if (err.code === 3 && !isRetry) {
            onStatus('GPS सिग्नल कमजोर, पुनः प्रयास जारी...');
            return executePositionRequest(true);
          }

          if (err.code === 3) {
            onStatus('GPS समय समाप्त (Timeout)');
            return reject(
              new Error('GPS सिग्नल नहीं मिला। कृपया खुली जगह में आएं या पुनः प्रयास करें।')
            );
          }

          onStatus('GPS अनुपलब्ध');
          return reject(
            new Error(err.message || 'डिवाइस से लोकेशन प्राप्त करने में असमर्थ। कृपया जीपीएस चालू रखें और पुनः प्रयास करें।')
          );
        },
        {
          enableHighAccuracy: true,
          timeout: isRetry ? 20000 : timeoutMs,
          maximumAge: 0,
        }
      );
    };

    executePositionRequest(false);
  });
}

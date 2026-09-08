/**
 * Geographic Distance Utilities (Haversine Formula)
 * 
 * Accurately calculates ground distance between customer coordinates and shop coordinates.
 */

import { MarketCoordinates } from '../types/market.ts';

/**
 * Calculates distance in kilometers between two lat/lng coordinates using the Haversine formula.
 */
export function calculateDistanceKm(
  coord1?: MarketCoordinates | { lat: number; lng: number } | null,
  coord2?: MarketCoordinates | { lat: number; lng: number } | null
): number {
  if (!coord1 || !coord2) return 0.5; // Reasonable default for local mandi within same neighborhood
  if (typeof coord1.lat !== 'number' || typeof coord1.lng !== 'number') return 0.5;
  if (typeof coord2.lat !== 'number' || typeof coord2.lng !== 'number') return 0.5;

  const R = 6371; // Earth's radius in kilometers
  const dLat = ((coord2.lat - coord1.lat) * Math.PI) / 180;
  const dLon = ((coord2.lng - coord1.lng) * Math.PI) / 180;

  const lat1 = (coord1.lat * Math.PI) / 180;
  const lat2 = (coord2.lat * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  const distance = R * c;
  return Math.round(distance * 10) / 10; // Round to 1 decimal place (e.g. 0.4 km)
}

/**
 * Formats a distance in kilometers into a friendly human-readable string.
 * e.g. 0.4 km, 1.2 km, 800 m
 */
export function formatDistance(distanceKm: number): string {
  if (distanceKm < 1.0 && distanceKm > 0) {
    const meters = Math.round(distanceKm * 1000);
    return `${meters} m`;
  }
  return `${distanceKm.toFixed(1)} km`;
}

// =============================================================================
// ROAM — Destination coordinates for maps
// City center lat/lng for MapView centering
// =============================================================================

export const DESTINATION_COORDS: Record<string, { lat: number; lng: number }> = {
  Tokyo: { lat: 35.6762, lng: 139.6503 },
  Paris: { lat: 48.8566, lng: 2.3522 },
  Bali: { lat: -8.4095, lng: 115.1889 },
  'New York': { lat: 40.7128, lng: -74.006 },
  Barcelona: { lat: 41.3851, lng: 2.1734 },
  Rome: { lat: 41.9028, lng: 12.4964 },
  London: { lat: 51.5074, lng: -0.1278 },
  Bangkok: { lat: 13.7563, lng: 100.5018 },
  Marrakech: { lat: 31.6295, lng: -7.9811 },
  Lisbon: { lat: 38.7223, lng: -9.1393 },
  'Cape Town': { lat: -33.9249, lng: 18.4241 },
  Reykjavik: { lat: 64.1466, lng: -21.9426 },
  Seoul: { lat: 37.5665, lng: 126.978 },
  'Buenos Aires': { lat: -34.6037, lng: -58.3816 },
  Istanbul: { lat: 41.0082, lng: 28.9784 },
  Sydney: { lat: -33.8688, lng: 151.2093 },
  'Mexico City': { lat: 19.4326, lng: -99.1332 },
  Dubai: { lat: 25.2048, lng: 55.2708 },
  Kyoto: { lat: 35.0116, lng: 135.7681 },
  Amsterdam: { lat: 52.3676, lng: 4.9041 },
  Medellín: { lat: 6.2476, lng: -75.5658 },
  Tbilisi: { lat: 41.7151, lng: 44.8271 },
  'Chiang Mai': { lat: 18.7883, lng: 98.9853 },
  Porto: { lat: 41.1579, lng: -8.6291 },
  Oaxaca: { lat: 17.0732, lng: -96.7266 },
  Dubrovnik: { lat: 42.6507, lng: 18.0944 },
  Budapest: { lat: 47.4979, lng: 19.0402 },
  'Hoi An': { lat: 15.8801, lng: 108.3381 },
  Cartagena: { lat: 10.391, lng: -75.4794 },
  Jaipur: { lat: 26.9124, lng: 75.7873 },
  Queenstown: { lat: -45.0312, lng: 168.6626 },
  Azores: { lat: 37.7412, lng: -25.6756 },
  Ljubljana: { lat: 46.0569, lng: 14.5058 },
  Santorini: { lat: 36.3932, lng: 25.4615 },
  'Siem Reap': { lat: 13.3671, lng: 103.8448 },
};

export function getCoordsForDestination(destination: string): { lat: number; lng: number } | null {
  const key = Object.keys(DESTINATION_COORDS).find(
    (k) => k.toLowerCase() === destination.toLowerCase()
  );
  return key ? DESTINATION_COORDS[key] : null;
}

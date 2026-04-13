/**
 * Calculate the Haversine distance between two GPS coordinates.
 * Returns distance in meters.
 */
export function haversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371000; // Earth radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) ** 2 +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2;

  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/**
 * Filter an array of items with lat/lng to those within `radiusMeters`.
 */
export function filterByRadius<T extends { locationLat: number; locationLng: number }>(
  items: T[],
  centerLat: number,
  centerLng: number,
  radiusMeters: number
): Array<T & { distanceMeters: number }> {
  return items
    .map((item) => ({
      ...item,
      distanceMeters: Math.round(
        haversineDistance(centerLat, centerLng, item.locationLat, item.locationLng)
      ),
    }))
    .filter((item) => item.distanceMeters <= radiusMeters)
    .sort((a, b) => a.distanceMeters - b.distanceMeters);
}

/**
 * Validate GPS coordinates are within valid ranges.
 */
export function isValidCoords(lat: number, lng: number): boolean {
  return lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
}

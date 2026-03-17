// =============================================================================
// ROAM — Deep Link Generators (Phase 2)
// Universal link URLs for sharing trips and destinations
// =============================================================================

const BASE_URL = 'https://roamapp.app';

// ---------------------------------------------------------------------------
// Trip share URL
// ---------------------------------------------------------------------------

/**
 * Generate a universal link URL for sharing a specific trip.
 *
 * @param tripId  The unique trip identifier
 * @returns       Universal link URL e.g. "https://roamapp.app/trip/abc-123"
 */
export function generateTripShareUrl(tripId: string): string {
  return `${BASE_URL}/trip/${tripId}`;
}

// ---------------------------------------------------------------------------
// Destination share URL
// ---------------------------------------------------------------------------

/**
 * Generate a universal link URL for sharing a destination.
 * Destination name is URI-encoded for safe URL usage.
 *
 * @param destination  The destination name e.g. "Tokyo" or "Buenos Aires"
 * @returns            Universal link URL e.g. "https://roamapp.app/destination/Buenos%20Aires"
 */
export function generateDestinationShareUrl(destination: string): string {
  return `${BASE_URL}/destination/${encodeURIComponent(destination)}`;
}

// =============================================================================
// ROAM — Deep link / URL params validation
// Sanitize params from useLocalSearchParams to prevent injection and malformed data
// =============================================================================

/** Max length for destination/city strings */
const MAX_DESTINATION_LENGTH = 100;

/** Destination: letters, digits, spaces, hyphens, apostrophes */
const DESTINATION_REGEX = /^[\w\s'-]+$/;

/** UUID v4 format */
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/** Alphanumeric + hyphen (invite codes, etc.) */
const CODE_REGEX = /^[a-zA-Z0-9-]+$/;

/** Generic short string (titles, keys) */
const SAFE_STRING_REGEX = /^[\w\s.-]*$/;

/**
 * Validate destination param from deep link.
 * Returns trimmed string if valid, null otherwise.
 */
export function validateDestination(
  value: string | string[] | undefined
): string | null {
  const s = Array.isArray(value) ? value[0] : value;
  if (typeof s !== 'string' || !s.trim()) return null;
  const trimmed = s.trim();
  if (trimmed.length > MAX_DESTINATION_LENGTH) return null;
  if (!DESTINATION_REGEX.test(trimmed)) return null;
  return trimmed;
}

/**
 * Validate UUID param (trip id, share id, etc.).
 */
export function validateUuid(value: string | string[] | undefined): string | null {
  const s = Array.isArray(value) ? value[0] : value;
  if (typeof s !== 'string' || !s.trim()) return null;
  return UUID_REGEX.test(s.trim()) ? s.trim() : null;
}

/**
 * Validate invite/code param (alphanumeric + hyphen).
 */
export function validateCode(
  value: string | string[] | undefined,
  maxLength = 50
): string | null {
  const s = Array.isArray(value) ? value[0] : value;
  if (typeof s !== 'string' || !s.trim()) return null;
  const trimmed = s.trim();
  if (trimmed.length > maxLength) return null;
  return CODE_REGEX.test(trimmed) ? trimmed : null;
}

/**
 * Validate safe short string (title, reason, etc.).
 */
export function validateSafeString(
  value: string | string[] | undefined,
  maxLength = 100
): string | null {
  const s = Array.isArray(value) ? value[0] : value;
  if (typeof s !== 'string' || !s.trim()) return null;
  const trimmed = s.trim();
  if (trimmed.length > maxLength) return null;
  return SAFE_STRING_REGEX.test(trimmed) ? trimmed : null;
}

/**
 * Validate year param (e.g. for travel-time-machine).
 */
export function validateYear(value: string | string[] | undefined): string | null {
  const s = Array.isArray(value) ? value[0] : value;
  if (typeof s !== 'string' || !s.trim()) return null;
  const year = parseInt(s.trim(), 10);
  if (Number.isNaN(year) || year < 1900 || year > 2100) return null;
  return String(year);
}

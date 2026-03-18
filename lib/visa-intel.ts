// =============================================================================
// ROAM — Visa Intelligence
// Curated visa data for US + Austrian passports (2025–2026)
// Show before every trip generates so travelers know entry requirements.
// =============================================================================
import { COLORS } from './constants';

export type PassportNationality = 'US' | 'AT';

export type VisaStatus =
  | 'visa_free'      // No visa required
  | 'eta'            // eTA / electronic travel authorization
  | 'visa_on_arrival'// VOA at border
  | 'e_visa'         // Apply online before travel
  | 'visa_required'; // Embassy/consulate visa

export interface VisaInfo {
  status: VisaStatus;
  stayDays?: number;
  notes?: string;
  /** Cost for VOA/e-visa in USD if applicable */
  cost?: number;
}

// Country code (ISO 3166-1 alpha-2) → VisaInfo for each passport
const VISA_US: Record<string, VisaInfo> = {
  JP: { status: 'visa_free', stayDays: 90 },
  FR: { status: 'visa_free', stayDays: 90 },
  ES: { status: 'visa_free', stayDays: 90 },
  IT: { status: 'visa_free', stayDays: 90 },
  DE: { status: 'visa_free', stayDays: 90 },
  NL: { status: 'visa_free', stayDays: 90 },
  PT: { status: 'visa_free', stayDays: 90 },
  GB: { status: 'visa_free', stayDays: 180 },
  AT: { status: 'visa_free', stayDays: 90 },
  CH: { status: 'visa_free', stayDays: 90 },
  GR: { status: 'visa_free', stayDays: 90 },
  HR: { status: 'visa_free', stayDays: 90 },
  HU: { status: 'visa_free', stayDays: 90 },
  SI: { status: 'visa_free', stayDays: 90 },
  ID: { status: 'visa_free', stayDays: 30, notes: 'VOA or e-VOA available' },
  TH: { status: 'visa_free', stayDays: 30 },
  KR: { status: 'visa_free', stayDays: 90, notes: 'K-ETA required (online)' },
  AE: { status: 'visa_free', stayDays: 30 },
  TR: { status: 'e_visa', stayDays: 90, notes: 'Apply online before travel' },
  IN: { status: 'e_visa', stayDays: 30, notes: 'Apply e-Visa 4 days before' },
  VN: { status: 'e_visa', stayDays: 30, notes: 'e-Visa or VOA available' },
  KH: { status: 'visa_on_arrival', stayDays: 30, cost: 30 },
  MA: { status: 'visa_free', stayDays: 90 },
  ZA: { status: 'visa_free', stayDays: 90 },
  IS: { status: 'visa_free', stayDays: 90 },
  AR: { status: 'visa_free', stayDays: 90 },
  AU: { status: 'eta', stayDays: 90, notes: 'ETA required (online)' },
  NZ: { status: 'eta', stayDays: 90, notes: 'NZeTA required (online)' },
  MX: { status: 'visa_free', stayDays: 180 },
  CO: { status: 'visa_free', stayDays: 90 },
  GE: { status: 'visa_free', stayDays: 365 },
  US: { status: 'visa_free', stayDays: 999 },
};

const VISA_AT: Record<string, VisaInfo> = {
  JP: { status: 'visa_free', stayDays: 180 },
  FR: { status: 'visa_free', stayDays: 90 },
  ES: { status: 'visa_free', stayDays: 90 },
  IT: { status: 'visa_free', stayDays: 90 },
  DE: { status: 'visa_free', stayDays: 90 },
  NL: { status: 'visa_free', stayDays: 90 },
  PT: { status: 'visa_free', stayDays: 90 },
  GB: { status: 'visa_free', stayDays: 180 },
  AT: { status: 'visa_free', stayDays: 999 },
  CH: { status: 'visa_free', stayDays: 90 },
  GR: { status: 'visa_free', stayDays: 90 },
  HR: { status: 'visa_free', stayDays: 90 },
  HU: { status: 'visa_free', stayDays: 90 },
  SI: { status: 'visa_free', stayDays: 90 },
  ID: { status: 'visa_free', stayDays: 30 },
  TH: { status: 'visa_free', stayDays: 30 },
  KR: { status: 'visa_free', stayDays: 90 },
  AE: { status: 'visa_free', stayDays: 90 },
  TR: { status: 'e_visa', stayDays: 90, notes: 'Apply online before travel' },
  IN: { status: 'e_visa', stayDays: 30, notes: 'Apply e-Visa before travel' },
  VN: { status: 'visa_free', stayDays: 15 },
  KH: { status: 'visa_on_arrival', stayDays: 30, cost: 30 },
  MA: { status: 'visa_free', stayDays: 90 },
  ZA: { status: 'visa_free', stayDays: 90 },
  IS: { status: 'visa_free', stayDays: 90 },
  AR: { status: 'visa_free', stayDays: 90 },
  AU: { status: 'eta', stayDays: 90, notes: 'ETA required (online)' },
  NZ: { status: 'visa_free', stayDays: 90 },
  MX: { status: 'visa_free', stayDays: 180 },
  CO: { status: 'visa_free', stayDays: 90 },
  GE: { status: 'visa_free', stayDays: 365 },
  US: { status: 'eta', stayDays: 90, notes: 'ESTA required (online)' },
  BR: { status: 'visa_free', stayDays: 90 },
  CN: { status: 'visa_free', stayDays: 15, notes: '15-day visa-free for tourism (2025)' },
};

// City/country name → country code (for destinations not in DESTINATIONS)
const DEST_TO_COUNTRY: Record<string, string> = {
  tokyo: 'JP', kyoto: 'JP', osaka: 'JP', japan: 'JP',
  paris: 'FR', france: 'FR', barcelona: 'ES', rome: 'IT', madrid: 'ES', spain: 'ES', italy: 'IT',
  london: 'GB', england: 'GB', uk: 'GB', britain: 'GB',
  bali: 'ID', indonesia: 'ID', jakarta: 'ID',
  bangkok: 'TH', 'chiang mai': 'TH', thailand: 'TH', phuket: 'TH',
  seoul: 'KR', korea: 'KR', 'south korea': 'KR',
  dubai: 'AE', uae: 'AE', 'abu dhabi': 'AE',
  istanbul: 'TR', turkey: 'TR',
  marrakech: 'MA', morocco: 'MA',
  lisbon: 'PT', porto: 'PT', portugal: 'PT',
  amsterdam: 'NL', netherlands: 'NL',
  'cape town': 'ZA', 'south africa': 'ZA', johannesburg: 'ZA',
  reykjavik: 'IS', iceland: 'IS',
  'buenos aires': 'AR', argentina: 'AR',
  sydney: 'AU', melbourne: 'AU', australia: 'AU',
  'mexico city': 'MX', oaxaca: 'MX', cancun: 'MX', mexico: 'MX',
  dubrovnik: 'HR', croatia: 'HR', 'split': 'HR',
  budapest: 'HU', hungary: 'HU',
  'hoi an': 'VN', 'ho chi minh': 'VN', hanoi: 'VN', vietnam: 'VN',
  'siem reap': 'KH', cambodia: 'KH', 'phnom penh': 'KH',
  medellín: 'CO', medellin: 'CO', cartagena: 'CO', colombia: 'CO', bogota: 'CO',
  tbilisi: 'GE', georgia: 'GE',
  jaipur: 'IN', delhi: 'IN', mumbai: 'IN', india: 'IN', goa: 'IN',
  queenstown: 'NZ', auckland: 'NZ', 'new zealand': 'NZ',
  santorini: 'GR', athens: 'GR', greece: 'GR',
  ljubljana: 'SI', slovenia: 'SI',
  'new york': 'US', 'los angeles': 'US', miami: 'US', usa: 'US', 'united states': 'US',
  vienna: 'AT', austria: 'AT', salzburg: 'AT',
  singapore: 'SG', 'hong kong': 'HK', taipei: 'TW', 'kuala lumpur': 'MY',
  'sao paulo': 'BR', rio: 'BR', brazil: 'BR',
  cairo: 'EG', nairobi: 'KE',
};

const statusLabels: Record<VisaStatus, string> = {
  visa_free: 'Visa-free',
  eta: 'eTA required',
  visa_on_arrival: 'Visa on arrival',
  e_visa: 'e-Visa required',
  visa_required: 'Visa required',
};

/** User-friendly status message for display */
export function getVisaStatusMessage(
  info: VisaInfo,
  passport: PassportNationality,
  countryCode: string
): string {
  const p = passport === 'US' ? 'US passport' : 'Austrian passport';
  const days = info.stayDays != null && info.stayDays < 999 ? ` ${info.stayDays} days` : '';
  switch (info.status) {
    case 'visa_free':
      return `Visa-free${days} — ${p}. No action needed.`;
    case 'eta':
      return `eTA required — ${p}. Apply online before travel.`;
    case 'visa_on_arrival':
      return info.cost
        ? `Visa on arrival $${info.cost} — get at the airport.`
        : `Visa on arrival — get at the airport.`;
    case 'e_visa':
      return `Visa required — apply online at least 3 weeks before.`;
    case 'visa_required':
      return `Visa required — apply at embassy at least 3 weeks before.`;
    default:
      return statusLabels[info.status];
  }
}

export const PASSPORT_FLAGS: Record<PassportNationality, string> = {
  US: '🇺🇸',
  AT: '🇦🇹',
};

const statusColors: Record<VisaStatus, string> = {
  visa_free: COLORS.primary,
  eta: COLORS.gold,
  visa_on_arrival: COLORS.primary,
  e_visa: COLORS.gold,
  visa_required: COLORS.danger,
};

/**
 * Resolve destination string (e.g. "Tokyo", "5 days in Bali") to country code.
 */
export function destinationToCountryCode(destination: string): string | null {
  const lower = destination.toLowerCase().trim();
  // Extract first meaningful place name (before comma, numbers, etc.)
  const match = lower.match(/^([a-z\sáéíóúñãõ]+?)(?:\s*[,\d]|$)/i) ?? [null, lower];
  const place = (match[1] ?? match[0] ?? lower).trim().replace(/\s+/g, ' ');
  if (!place) return null;

  // Direct lookup
  const key = place.replace(/\s+/g, ' ').toLowerCase();
  if (DEST_TO_COUNTRY[key]) return DEST_TO_COUNTRY[key];

  // Partial match
  for (const [k, code] of Object.entries(DEST_TO_COUNTRY)) {
    if (key.includes(k) || k.includes(key)) return code;
  }
  return null;
}

/**
 * Get visa info for a destination given passport nationality.
 */
export function getVisaInfo(
  destination: string,
  passport: PassportNationality
): { countryCode: string; info: VisaInfo; label: string; color: string; statusMessage: string } | null {
  const countryCode = destinationToCountryCode(destination);
  if (!countryCode) return null;

  const map = passport === 'US' ? VISA_US : VISA_AT;
  const info = map[countryCode];
  if (!info) {
    const fallbackInfo: VisaInfo = { status: 'visa_required', notes: 'Check embassy requirements' };
    return {
      countryCode,
      info: fallbackInfo,
      label: 'Visa required',
      color: statusColors.visa_required,
      statusMessage: getVisaStatusMessage(fallbackInfo, passport, countryCode),
    };
  }

  return {
    countryCode,
    info,
    label: statusLabels[info.status],
    color: statusColors[info.status],
    statusMessage: getVisaStatusMessage(info, passport, countryCode),
  };
}

export { statusLabels, statusColors };

// =============================================================================
// Backward-compatible API (replaces visa-data.ts)
// Consumers that need the simple { status, maxStay, notes, officialLink } shape
// should use getSimpleVisaInfo() instead of getVisaInfo().
// =============================================================================

/** Hyphenated status values used by the legacy visa-data API */
export type SimpleVisaStatus = 'visa-free' | 'visa-on-arrival' | 'e-visa' | 'visa-required';

export interface SimpleVisaInfo {
  status: SimpleVisaStatus;
  maxStay: number;
  notes: string;
  officialLink?: string;
}

/** Map underscored status → hyphenated status for backward compat */
function toSimpleStatus(s: VisaStatus): SimpleVisaStatus {
  switch (s) {
    case 'visa_free': return 'visa-free';
    case 'eta': return 'visa-free'; // eTA is effectively visa-free for the traveler
    case 'visa_on_arrival': return 'visa-on-arrival';
    case 'e_visa': return 'e-visa';
    case 'visa_required': return 'visa-required';
    default: return 'visa-required';
  }
}

/**
 * Backward-compatible visa lookup that returns the simple flat shape.
 * Drop-in replacement for the old visa-data.ts getVisaInfo().
 */
export function getSimpleVisaInfo(
  destination: string,
  _nationality: 'US' | 'UK' | 'EU' | 'AU' | 'CA' = 'US',
): SimpleVisaInfo | null {
  const result = getVisaInfo(destination, 'US');
  if (!result) return null;
  return {
    status: toSimpleStatus(result.info.status),
    maxStay: result.info.stayDays ?? 0,
    notes: result.info.notes ?? result.statusMessage,
    officialLink: undefined,
  };
}

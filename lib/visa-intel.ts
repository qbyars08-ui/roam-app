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
// Rich Visa Requirement Intelligence
// Destination-level data with requirements lists, tips, cost, processing time.
// For US passport holders visiting the 10 most popular ROAM destinations.
// Sources: US State Dept, IATA Travel Centre, official embassy sites.
// Last verified: March 2026
// =============================================================================

export type VisaType = 'visa-free' | 'visa-on-arrival' | 'e-visa' | 'embassy-visa';
export type VisaComplexity = 'easy' | 'moderate' | 'complex';

export interface RichVisaRequirement {
  readonly destination: string;
  readonly country: string;
  readonly visaFree: boolean;
  readonly maxStayDays: number;
  readonly visaType: VisaType;
  readonly cost: string;
  readonly processingTime: string;
  readonly requirements: readonly string[];
  readonly tips: readonly string[];
  readonly lastUpdated: string;
}

// ---------------------------------------------------------------------------
// Curated visa data — US passport holders, single-entry unless noted
// ---------------------------------------------------------------------------
const RICH_VISA_DATA: Record<string, RichVisaRequirement> = {
  japan: {
    destination: 'Japan',
    country: 'JP',
    visaFree: true,
    maxStayDays: 90,
    visaType: 'visa-free',
    cost: 'Free',
    processingTime: 'Instant on arrival',
    requirements: [
      'Valid US passport (6+ months validity)',
      'Return or onward ticket',
      'Proof of sufficient funds',
      'Address of first accommodation',
    ],
    tips: [
      'Fill out the arrival card on the plane — have your hotel address ready before landing.',
      'The 90-day limit is strict. Extensions are rarely granted and overstaying can result in an entry ban.',
      'Japan does not have a digital nomad visa. Remote workers must exit by day 90.',
    ],
    lastUpdated: 'March 2026',
  },

  france: {
    destination: 'France',
    country: 'FR',
    visaFree: true,
    maxStayDays: 90,
    visaType: 'visa-free',
    cost: 'Free',
    processingTime: 'Instant on arrival',
    requirements: [
      'Valid US passport (3+ months beyond intended stay)',
      'Return or onward ticket',
      'Proof of sufficient funds (~€100/day recommended)',
      'Travel insurance covering the Schengen area',
    ],
    tips: [
      '90 days applies across the entire Schengen Area — time in Germany, Spain, or Italy all count toward the same limit.',
      'The 90/180 rule: 90 days within any rolling 180-day window. Track your days across all Schengen countries.',
      'ETIAS (EU Travel Authorization) has been delayed past 2025 — confirm whether it is live before travel.',
    ],
    lastUpdated: 'March 2026',
  },

  thailand: {
    destination: 'Thailand',
    country: 'TH',
    visaFree: true,
    maxStayDays: 30,
    visaType: 'visa-free',
    cost: 'Free',
    processingTime: 'Instant on arrival',
    requirements: [
      'Valid US passport (6+ months validity)',
      'Return or onward ticket',
      'Proof of funds (20,000 THB / ~$550 per person)',
      'Completed TM6 arrival card (often distributed on the plane)',
    ],
    tips: [
      'Thailand extended visa-free stays to 60 days in late 2024 — confirm the current allowance before booking.',
      'You can extend your stay once at any immigration office for ~1,900 THB ($52). Maximum total: 60–90 days.',
      'The Thailand LTR (Long-Term Resident) visa is available for remote workers at ~50,000 THB/year.',
    ],
    lastUpdated: 'March 2026',
  },

  indonesia: {
    destination: 'Indonesia',
    country: 'ID',
    visaFree: false,
    maxStayDays: 30,
    visaType: 'visa-on-arrival',
    cost: '$35 USD',
    processingTime: '10–30 min at the airport',
    requirements: [
      'Valid US passport (6+ months validity)',
      'Return or onward ticket',
      '$35 USD cash or credit card for the VOA fee',
      'Completed arrival card',
    ],
    tips: [
      'Pay the VOA fee at the dedicated counter before the main immigration line — look for "Visa on Arrival" signs.',
      'Extend the VOA once for another 30 days (total 60) for ~500,000 IDR ($32) at any Bali immigration office.',
      'Credit cards are accepted at most major airports, but bring $35 USD cash as a backup.',
    ],
    lastUpdated: 'March 2026',
  },

  'united kingdom': {
    destination: 'United Kingdom',
    country: 'GB',
    visaFree: true,
    maxStayDays: 180,
    visaType: 'visa-free',
    cost: 'Free (ETA: ~£10)',
    processingTime: 'ETA approved in minutes; instant at border',
    requirements: [
      'Valid US passport',
      'UK Electronic Travel Authorisation (ETA) — required before travel as of 2025',
      'Return or onward ticket (border agents may ask)',
      'Proof of accommodation and sufficient funds',
    ],
    tips: [
      'The UK ETA for US citizens rolled out in 2025. Apply online before booking (~£10). Approval is usually instant.',
      'The UK is not in the Schengen Area. Your UK days are entirely separate from any EU country days.',
      'US citizens can use the e-passport gates at most major UK airports — significantly faster than the standard queue.',
    ],
    lastUpdated: 'March 2026',
  },

  'south korea': {
    destination: 'South Korea',
    country: 'KR',
    visaFree: true,
    maxStayDays: 90,
    visaType: 'visa-free',
    cost: 'Free (K-ETA: ~$10)',
    processingTime: 'K-ETA approved within 24–72 hours',
    requirements: [
      'Valid US passport (6+ months validity)',
      'K-ETA (Korea Electronic Travel Authorization) — required before travel',
      'Return or onward ticket',
      'Proof of accommodation',
    ],
    tips: [
      'K-ETA is mandatory for US citizens. Apply at k-eta.go.kr at least 72 hours before your flight.',
      'Do not book your flight without K-ETA approval — airlines may deny boarding without it.',
      'K-ETA costs ~$10, is valid for 2 years, and allows multiple entries.',
    ],
    lastUpdated: 'March 2026',
  },

  mexico: {
    destination: 'Mexico',
    country: 'MX',
    visaFree: true,
    maxStayDays: 180,
    visaType: 'visa-free',
    cost: 'Free',
    processingTime: 'Instant on arrival',
    requirements: [
      'Valid US passport',
      'Completed FMM tourist card (digital or paper)',
      'Return or onward ticket',
    ],
    tips: [
      'Mexico allows up to 180 days, but the officer sets your actual stay on arrival — explicitly request 180 days.',
      'The FMM form is now mostly digital. Some airlines handle it; otherwise complete it at immigration.',
      'Keep a copy of your FMM — you surrender it on exit. Losing it can cause delays and a fine.',
    ],
    lastUpdated: 'March 2026',
  },

  australia: {
    destination: 'Australia',
    country: 'AU',
    visaFree: false,
    maxStayDays: 90,
    visaType: 'e-visa',
    cost: '~$20 AUD (~$13 USD)',
    processingTime: 'Usually instant; up to 48 hours',
    requirements: [
      'Valid US e-passport (must have biometric chip)',
      'Electronic Travel Authority (ETA) — subclass 601, applied via the official app',
      'Return or onward ticket',
      'Proof of sufficient funds',
    ],
    tips: [
      'Apply via the "Australian ETA" app on iOS or Android — fastest and cheapest at $20 AUD.',
      'The ETA is linked digitally to your passport; no stamp required. Airlines verify it electronically at check-in.',
      'ETA is valid for 12 months from approval date with unlimited entries, each stay up to 3 months.',
      'Avoid third-party websites — they charge 3–5x the official price for the exact same authorization.',
    ],
    lastUpdated: 'March 2026',
  },

  india: {
    destination: 'India',
    country: 'IN',
    visaFree: false,
    maxStayDays: 90,
    visaType: 'e-visa',
    cost: '$25 (30-day) · $40 (1-year) · $80 (5-year)',
    processingTime: '72–96 hours — apply at least 4 days before travel',
    requirements: [
      'Valid US passport (6+ months validity, 2 blank pages)',
      'e-Visa applied at indianvisaonline.gov.in before departure',
      'Recent passport-size photo (white background)',
      'Return or onward ticket',
      'Proof of accommodation',
    ],
    tips: [
      'Apply at least 4 business days before your flight — processing takes 72–96 hours with no expediting option.',
      'The official portal is indianvisaonline.gov.in — third-party sites charge $100+ for the same result.',
      'The 30-day e-Tourist visa allows double entry. The 1-year is worth it for multiple trips.',
      'Print your e-Visa confirmation — you\'ll need to show it at check-in and again on arrival.',
    ],
    lastUpdated: 'March 2026',
  },

  brazil: {
    destination: 'Brazil',
    country: 'BR',
    visaFree: true,
    maxStayDays: 90,
    visaType: 'visa-free',
    cost: 'Free',
    processingTime: 'Instant on arrival',
    requirements: [
      'Valid US passport (6+ months validity)',
      'Return or onward ticket',
      'Proof of sufficient funds',
      'Proof of accommodation',
    ],
    tips: [
      'Brazil restored visa-free access for US citizens in June 2024 after years of reciprocal requirements.',
      '90 days in any 180-day period. Extensions require an application to the Federal Police.',
      'Yellow fever vaccination is required if arriving from or transiting through endemic countries — carry your card.',
    ],
    lastUpdated: 'March 2026',
  },
};

// ---------------------------------------------------------------------------
// Destination name aliases → canonical key
// ---------------------------------------------------------------------------
const RICH_VISA_ALIASES: Record<string, string> = {
  japan: 'japan',
  tokyo: 'japan',
  kyoto: 'japan',
  osaka: 'japan',
  france: 'france',
  paris: 'france',
  lyon: 'france',
  nice: 'france',
  thailand: 'thailand',
  bangkok: 'thailand',
  'chiang mai': 'thailand',
  phuket: 'thailand',
  indonesia: 'indonesia',
  bali: 'indonesia',
  jakarta: 'indonesia',
  'united kingdom': 'united kingdom',
  uk: 'united kingdom',
  london: 'united kingdom',
  england: 'united kingdom',
  britain: 'united kingdom',
  'south korea': 'south korea',
  korea: 'south korea',
  seoul: 'south korea',
  mexico: 'mexico',
  'mexico city': 'mexico',
  oaxaca: 'mexico',
  cancun: 'mexico',
  australia: 'australia',
  sydney: 'australia',
  melbourne: 'australia',
  india: 'india',
  jaipur: 'india',
  delhi: 'india',
  mumbai: 'india',
  goa: 'india',
  brazil: 'brazil',
  'sao paulo': 'brazil',
  rio: 'brazil',
};

// ---------------------------------------------------------------------------
// Rich API — public functions
// ---------------------------------------------------------------------------

/**
 * Get full rich visa requirement data for a destination.
 * Defaults to US passport. Returns null if not in curated dataset.
 */
export function getVisaRequirement(
  destination: string,
  _nationality = 'US'
): RichVisaRequirement | null {
  const key = destination.toLowerCase().trim();
  const canonical = RICH_VISA_ALIASES[key] ?? key;
  return RICH_VISA_DATA[canonical] ?? null;
}

/**
 * Traffic-light complexity for a destination entry requirement.
 * - 'easy'     → visa-free
 * - 'moderate' → visa-on-arrival or e-visa (some online/airport process)
 * - 'complex'  → embassy visa (in-person appointment, long processing)
 */
export function getVisaComplexity(destination: string): VisaComplexity {
  const req = getVisaRequirement(destination);
  if (!req) return 'moderate';

  switch (req.visaType) {
    case 'visa-free':
      return 'easy';
    case 'visa-on-arrival':
    case 'e-visa':
      return 'moderate';
    case 'embassy-visa':
      return 'complex';
    default:
      return 'moderate';
  }
}

/**
 * One-line entry summary for display in cards and lists.
 * Example: "90 days visa-free for US citizens"
 */
export function getVisaSummary(destination: string): string {
  const req = getVisaRequirement(destination);
  if (!req) return 'Visa requirements unknown — check official sources';

  switch (req.visaType) {
    case 'visa-free':
      return `${req.maxStayDays} days visa-free for US citizens`;
    case 'visa-on-arrival':
      return `${req.maxStayDays} days visa on arrival · ${req.cost}`;
    case 'e-visa':
      return `e-Visa required · ${req.cost} · ${req.processingTime}`;
    case 'embassy-visa':
      return `Embassy visa required · ${req.cost} · ${req.processingTime}`;
    default:
      return 'Check official sources for entry requirements';
  }
}

/**
 * Short badge label for UI chips.
 * Examples: "VISA FREE", "VOA $35", "e-VISA $20"
 */
export function getVisaBadgeLabel(destination: string): string {
  const req = getVisaRequirement(destination);
  if (!req) return 'CHECK VISA';

  switch (req.visaType) {
    case 'visa-free':
      return 'VISA FREE';
    case 'visa-on-arrival':
      return `VOA ${req.cost}`;
    case 'e-visa':
      return `e-VISA ${req.cost}`;
    case 'embassy-visa':
      return 'EMBASSY VISA';
    default:
      return 'CHECK VISA';
  }
}

export const RICH_VISA_STATUS_COLORS: Record<VisaComplexity, string> = {
  easy: '#4ADE80',      // green
  moderate: '#F59E0B',  // amber
  complex: '#E8614A',   // coral / danger
} as const;

export const VISA_TYPE_LABELS: Record<VisaType, string> = {
  'visa-free': 'Visa Free',
  'visa-on-arrival': 'Visa on Arrival',
  'e-visa': 'e-Visa',
  'embassy-visa': 'Embassy Visa',
} as const;

export function hasRichVisaData(destination: string): boolean {
  return getVisaRequirement(destination) !== null;
}

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

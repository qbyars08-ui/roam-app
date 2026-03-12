// =============================================================================
// ROAM — Visa Requirements (Travel Buddy AI API via RapidAPI)
// Free tier: 120-200 req/month. Each trip only needs one call.
// User has US + Austrian passports — check both and show the better option.
// =============================================================================
import AsyncStorage from '@react-native-async-storage/async-storage';

const RAPID_API_KEY = process.env.EXPO_PUBLIC_VISA_API_KEY ?? '';
const BASE = 'https://visa-requirement.p.rapidapi.com/visa';
const CACHE_PREFIX = 'roam_visa_';
const CACHE_TTL = 7 * 24 * 60 * 60 * 1000; // 7 days — visa rules change infrequently

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
export type VisaStatus = 'visa-free' | 'visa-on-arrival' | 'e-visa' | 'visa-required' | 'unknown';

export interface VisaRequirement {
  passportCountry: string;         // "United States" or "Austria"
  passportCode: string;            // "US" or "AT"
  destinationCountry: string;      // "Japan"
  destinationCode: string;         // "JP"
  status: VisaStatus;
  maxStay: string | null;          // "90 days" or null
  notes: string | null;            // Additional details
  applyUrl: string | null;         // eVisa application link
}

export interface VisaResult {
  /** The best visa option between the user's passports */
  best: VisaRequirement;
  /** All checked results (US + Austrian passports) */
  all: VisaRequirement[];
  /** True if user can enter without pre-arranging a visa */
  canEnterWithoutVisa: boolean;
}

// ---------------------------------------------------------------------------
// Destination → ISO country code
// ---------------------------------------------------------------------------
const DESTINATION_COUNTRY: Record<string, { code: string; name: string }> = {
  Tokyo: { code: 'JP', name: 'Japan' },
  Kyoto: { code: 'JP', name: 'Japan' },
  Paris: { code: 'FR', name: 'France' },
  Bali: { code: 'ID', name: 'Indonesia' },
  'New York': { code: 'US', name: 'United States' },
  Barcelona: { code: 'ES', name: 'Spain' },
  Rome: { code: 'IT', name: 'Italy' },
  London: { code: 'GB', name: 'United Kingdom' },
  Bangkok: { code: 'TH', name: 'Thailand' },
  'Chiang Mai': { code: 'TH', name: 'Thailand' },
  Marrakech: { code: 'MA', name: 'Morocco' },
  Lisbon: { code: 'PT', name: 'Portugal' },
  Porto: { code: 'PT', name: 'Portugal' },
  'Cape Town': { code: 'ZA', name: 'South Africa' },
  Reykjavik: { code: 'IS', name: 'Iceland' },
  Seoul: { code: 'KR', name: 'South Korea' },
  'Buenos Aires': { code: 'AR', name: 'Argentina' },
  Istanbul: { code: 'TR', name: 'Turkey' },
  Sydney: { code: 'AU', name: 'Australia' },
  'Mexico City': { code: 'MX', name: 'Mexico' },
  Oaxaca: { code: 'MX', name: 'Mexico' },
  Cancun: { code: 'MX', name: 'Mexico' },
  Dubai: { code: 'AE', name: 'United Arab Emirates' },
  Amsterdam: { code: 'NL', name: 'Netherlands' },
  Medellín: { code: 'CO', name: 'Colombia' },
  Cartagena: { code: 'CO', name: 'Colombia' },
  Tbilisi: { code: 'GE', name: 'Georgia' },
  Dubrovnik: { code: 'HR', name: 'Croatia' },
  Budapest: { code: 'HU', name: 'Hungary' },
  'Hoi An': { code: 'VN', name: 'Vietnam' },
  Jaipur: { code: 'IN', name: 'India' },
  Queenstown: { code: 'NZ', name: 'New Zealand' },
  Azores: { code: 'PT', name: 'Portugal' },
  Ljubljana: { code: 'SI', name: 'Slovenia' },
  Santorini: { code: 'GR', name: 'Greece' },
  'Siem Reap': { code: 'KH', name: 'Cambodia' },
  Prague: { code: 'CZ', name: 'Czech Republic' },
  Berlin: { code: 'DE', name: 'Germany' },
  Vienna: { code: 'AT', name: 'Austria' },
  Copenhagen: { code: 'DK', name: 'Denmark' },
  Singapore: { code: 'SG', name: 'Singapore' },
  'Kuala Lumpur': { code: 'MY', name: 'Malaysia' },
  Havana: { code: 'CU', name: 'Cuba' },
  Lima: { code: 'PE', name: 'Peru' },
  Cusco: { code: 'PE', name: 'Peru' },
  'Costa Rica': { code: 'CR', name: 'Costa Rica' },
};

// ---------------------------------------------------------------------------
// Passport storage (user's passport countries)
// ---------------------------------------------------------------------------
const PASSPORTS_KEY = 'roam_user_passports';
const DEFAULT_PASSPORTS: PassportEntry[] = [
  { code: 'US', name: 'United States' },
  { code: 'AT', name: 'Austria' },
];

export interface PassportEntry {
  code: string;
  name: string;
}

export async function getUserPassports(): Promise<PassportEntry[]> {
  try {
    const raw = await AsyncStorage.getItem(PASSPORTS_KEY);
    if (raw) return JSON.parse(raw) as PassportEntry[];
  } catch {
    // Fall through to default
  }
  return DEFAULT_PASSPORTS;
}

export async function setUserPassports(passports: PassportEntry[]): Promise<void> {
  await AsyncStorage.setItem(PASSPORTS_KEY, JSON.stringify(passports));
}

// ---------------------------------------------------------------------------
// Visa status priority (lower = better for traveler)
// ---------------------------------------------------------------------------
const STATUS_PRIORITY: Record<VisaStatus, number> = {
  'visa-free': 0,
  'visa-on-arrival': 1,
  'e-visa': 2,
  'visa-required': 3,
  'unknown': 4,
};

// ---------------------------------------------------------------------------
// Display helpers
// ---------------------------------------------------------------------------
export function getVisaStatusDisplay(status: VisaStatus): {
  label: string;
  color: string;
  emoji: string;
} {
  switch (status) {
    case 'visa-free':
      return { label: 'Visa-free', color: '#7CAF8A', emoji: '' };
    case 'visa-on-arrival':
      return { label: 'Visa on arrival', color: '#7CAF8A', emoji: '' };
    case 'e-visa':
      return { label: 'e-Visa required', color: '#C9A84C', emoji: '' };
    case 'visa-required':
      return { label: 'Visa required', color: '#C0392B', emoji: '' };
    default:
      return { label: 'Check requirements', color: '#C9A84C', emoji: '' };
  }
}

// ---------------------------------------------------------------------------
// Cache helpers
// ---------------------------------------------------------------------------
function cacheKey(passportCode: string, destCode: string): string {
  return `${CACHE_PREFIX}${passportCode}_${destCode}`;
}

async function getCached(key: string): Promise<VisaRequirement | null> {
  try {
    const raw = await AsyncStorage.getItem(key);
    if (!raw) return null;
    const { ts, data } = JSON.parse(raw);
    if (Date.now() - ts > CACHE_TTL) {
      AsyncStorage.removeItem(key).catch(() => {});
      return null;
    }
    return data as VisaRequirement;
  } catch {
    return null;
  }
}

async function setCache(key: string, data: VisaRequirement): Promise<void> {
  try {
    await AsyncStorage.setItem(key, JSON.stringify({ ts: Date.now(), data }));
  } catch {
    // Non-critical
  }
}

// ---------------------------------------------------------------------------
// Fetch single visa requirement
// ---------------------------------------------------------------------------
function normalizeStatus(raw: string): VisaStatus {
  const lower = (raw ?? '').toLowerCase();
  if (lower.includes('free') || lower.includes('no visa')) return 'visa-free';
  if (lower.includes('on arrival') || lower.includes('voa')) return 'visa-on-arrival';
  if (lower.includes('e-visa') || lower.includes('evisa') || lower.includes('electronic')) return 'e-visa';
  if (lower.includes('required') || lower.includes('need')) return 'visa-required';
  return 'unknown';
}

async function fetchSingleVisa(
  passportCode: string,
  passportName: string,
  destCode: string,
  destName: string,
): Promise<VisaRequirement> {
  const key = cacheKey(passportCode, destCode);

  // Check cache
  const cached = await getCached(key);
  if (cached) return cached;

  // If same country, visa-free by default
  if (passportCode === destCode) {
    const result: VisaRequirement = {
      passportCountry: passportName,
      passportCode,
      destinationCountry: destName,
      destinationCode: destCode,
      status: 'visa-free',
      maxStay: null,
      notes: 'Home country — no visa needed',
      applyUrl: null,
    };
    await setCache(key, result);
    return result;
  }

  // No API key → use static fallback data
  if (!RAPID_API_KEY) {
    return getStaticVisaData(passportCode, passportName, destCode, destName);
  }

  try {
    const res = await fetch(
      `${BASE}?passport=${passportCode}&destination=${destCode}`,
      {
        headers: {
          'X-RapidAPI-Key': RAPID_API_KEY,
          'X-RapidAPI-Host': 'visa-requirement.p.rapidapi.com',
        },
      }
    );

    if (!res.ok) {
      return getStaticVisaData(passportCode, passportName, destCode, destName);
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data: any = await res.json();

    const result: VisaRequirement = {
      passportCountry: passportName,
      passportCode,
      destinationCountry: destName,
      destinationCode: destCode,
      status: normalizeStatus(data.status ?? data.visa_status ?? data.requirement ?? ''),
      maxStay: data.max_stay ?? data.duration ?? data.allowed_stay ?? null,
      notes: data.notes ?? data.additional_info ?? null,
      applyUrl: data.apply_url ?? data.visa_url ?? null,
    };

    await setCache(key, result);
    return result;
  } catch {
    return getStaticVisaData(passportCode, passportName, destCode, destName);
  }
}

// ---------------------------------------------------------------------------
// Static fallback data for US and Austrian passports
// Used when API key is not configured. Covers the most common destinations.
// Source: US State Department & Austrian Foreign Ministry (as of early 2026)
// ---------------------------------------------------------------------------
type StaticEntry = { status: VisaStatus; maxStay: string; notes: string | null };

const US_VISA_DATA: Record<string, StaticEntry> = {
  JP: { status: 'visa-free', maxStay: '90 days', notes: null },
  FR: { status: 'visa-free', maxStay: '90 days in Schengen', notes: null },
  ID: { status: 'visa-on-arrival', maxStay: '30 days', notes: '$35 fee on arrival' },
  ES: { status: 'visa-free', maxStay: '90 days in Schengen', notes: null },
  IT: { status: 'visa-free', maxStay: '90 days in Schengen', notes: null },
  GB: { status: 'visa-free', maxStay: '6 months', notes: null },
  TH: { status: 'visa-free', maxStay: '30 days', notes: 'Extendable to 60 days at immigration' },
  MA: { status: 'visa-free', maxStay: '90 days', notes: null },
  PT: { status: 'visa-free', maxStay: '90 days in Schengen', notes: null },
  ZA: { status: 'visa-free', maxStay: '90 days', notes: null },
  IS: { status: 'visa-free', maxStay: '90 days in Schengen', notes: null },
  KR: { status: 'visa-free', maxStay: '90 days', notes: 'K-ETA required' },
  AR: { status: 'visa-free', maxStay: '90 days', notes: null },
  TR: { status: 'e-visa', maxStay: '90 days', notes: 'Apply online at evisa.gov.tr' },
  AU: { status: 'e-visa', maxStay: '90 days', notes: 'ETA required — apply via app' },
  MX: { status: 'visa-free', maxStay: '180 days', notes: null },
  AE: { status: 'visa-free', maxStay: '30 days', notes: null },
  NL: { status: 'visa-free', maxStay: '90 days in Schengen', notes: null },
  CO: { status: 'visa-free', maxStay: '90 days', notes: null },
  GE: { status: 'visa-free', maxStay: '365 days', notes: null },
  HR: { status: 'visa-free', maxStay: '90 days in Schengen', notes: null },
  HU: { status: 'visa-free', maxStay: '90 days in Schengen', notes: null },
  VN: { status: 'e-visa', maxStay: '90 days', notes: 'Apply at evisa.xuatnhapcanh.gov.vn' },
  IN: { status: 'e-visa', maxStay: '30 days', notes: 'Apply at indianvisaonline.gov.in' },
  NZ: { status: 'visa-free', maxStay: '90 days', notes: 'NZeTA required' },
  SI: { status: 'visa-free', maxStay: '90 days in Schengen', notes: null },
  GR: { status: 'visa-free', maxStay: '90 days in Schengen', notes: null },
  KH: { status: 'visa-on-arrival', maxStay: '30 days', notes: '$30 fee on arrival' },
  CZ: { status: 'visa-free', maxStay: '90 days in Schengen', notes: null },
  DE: { status: 'visa-free', maxStay: '90 days in Schengen', notes: null },
  AT: { status: 'visa-free', maxStay: '90 days in Schengen', notes: null },
  DK: { status: 'visa-free', maxStay: '90 days in Schengen', notes: null },
  SG: { status: 'visa-free', maxStay: '90 days', notes: null },
  MY: { status: 'visa-free', maxStay: '90 days', notes: null },
  CU: { status: 'visa-required', maxStay: '30 days', notes: 'Tourist card required. US restrictions apply.' },
  PE: { status: 'visa-free', maxStay: '183 days', notes: null },
  CR: { status: 'visa-free', maxStay: '90 days', notes: null },
};

// Austrian passport has same or better access for most of these (EU citizen)
const AT_VISA_DATA: Record<string, StaticEntry> = {
  ...US_VISA_DATA,
  // Austria-specific overrides (EU passport advantages)
  TR: { status: 'visa-free', maxStay: '90 days', notes: null }, // EU citizens visa-free
  AU: { status: 'e-visa', maxStay: '90 days', notes: 'ETA required' },
  CU: { status: 'visa-on-arrival', maxStay: '30 days', notes: 'Tourist card at airport' },
  // All Schengen = home territory for AT passport
  FR: { status: 'visa-free', maxStay: 'Unlimited (EU)', notes: 'EU citizen — free movement' },
  ES: { status: 'visa-free', maxStay: 'Unlimited (EU)', notes: 'EU citizen — free movement' },
  IT: { status: 'visa-free', maxStay: 'Unlimited (EU)', notes: 'EU citizen — free movement' },
  NL: { status: 'visa-free', maxStay: 'Unlimited (EU)', notes: 'EU citizen — free movement' },
  PT: { status: 'visa-free', maxStay: 'Unlimited (EU)', notes: 'EU citizen — free movement' },
  HR: { status: 'visa-free', maxStay: 'Unlimited (EU)', notes: 'EU citizen — free movement' },
  HU: { status: 'visa-free', maxStay: 'Unlimited (EU)', notes: 'EU citizen — free movement' },
  SI: { status: 'visa-free', maxStay: 'Unlimited (EU)', notes: 'EU citizen — free movement' },
  GR: { status: 'visa-free', maxStay: 'Unlimited (EU)', notes: 'EU citizen — free movement' },
  CZ: { status: 'visa-free', maxStay: 'Unlimited (EU)', notes: 'EU citizen — free movement' },
  DE: { status: 'visa-free', maxStay: 'Unlimited (EU)', notes: 'EU citizen — free movement' },
  DK: { status: 'visa-free', maxStay: 'Unlimited (EU)', notes: 'EU citizen — free movement' },
  IS: { status: 'visa-free', maxStay: 'Unlimited (EEA)', notes: 'EEA citizen — free movement' },
};

const STATIC_DATA: Record<string, Record<string, StaticEntry>> = {
  US: US_VISA_DATA,
  AT: AT_VISA_DATA,
};

function getStaticVisaData(
  passportCode: string,
  passportName: string,
  destCode: string,
  destName: string,
): VisaRequirement {
  const data = STATIC_DATA[passportCode]?.[destCode];
  if (data) {
    return {
      passportCountry: passportName,
      passportCode,
      destinationCountry: destName,
      destinationCode: destCode,
      status: data.status,
      maxStay: data.maxStay,
      notes: data.notes,
      applyUrl: null,
    };
  }
  return {
    passportCountry: passportName,
    passportCode,
    destinationCountry: destName,
    destinationCode: destCode,
    status: 'unknown',
    maxStay: null,
    notes: 'Check your country\'s foreign ministry for requirements',
    applyUrl: null,
  };
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Get country info for a ROAM destination label.
 */
export function getDestinationCountry(destination: string): { code: string; name: string } | null {
  if (DESTINATION_COUNTRY[destination]) return DESTINATION_COUNTRY[destination];
  const key = Object.keys(DESTINATION_COUNTRY).find(
    (k) => k.toLowerCase() === destination.toLowerCase()
  );
  return key ? DESTINATION_COUNTRY[key] : null;
}

/**
 * Check visa requirements for a destination using all of the user's passports.
 * Returns the best option (easiest entry) and all results.
 */
export async function checkVisaRequirements(destination: string): Promise<VisaResult | null> {
  const country = getDestinationCountry(destination);
  if (!country) return null;

  const passports = await getUserPassports();
  if (passports.length === 0) return null;

  // Check all passports in parallel
  const results = await Promise.all(
    passports.map((p) =>
      fetchSingleVisa(p.code, p.name, country.code, country.name)
    )
  );

  // Sort by best status (lowest priority number = best for traveler)
  const sorted = [...results].sort(
    (a, b) => STATUS_PRIORITY[a.status] - STATUS_PRIORITY[b.status]
  );

  const best = sorted[0];
  const canEnterWithoutVisa =
    best.status === 'visa-free' || best.status === 'visa-on-arrival';

  return { best, all: results, canEnterWithoutVisa };
}

/**
 * Check if the visa API is configured (has RapidAPI key).
 * The feature works without it using static data, but API provides more coverage.
 */
export function isVisaApiConfigured(): boolean {
  return RAPID_API_KEY.length > 0;
}

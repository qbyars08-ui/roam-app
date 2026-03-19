// =============================================================================
// ROAM — Reservation / Booking Parser
// Extracts structured reservation data from pasted confirmation email text.
// =============================================================================

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
export type ReservationType = 'flight' | 'hotel' | 'activity' | 'restaurant' | 'transport';

export interface Reservation {
  readonly type: ReservationType;
  readonly title: string;
  readonly date: string;
  readonly time?: string;
  readonly endDate?: string;
  readonly endTime?: string;
  readonly confirmationCode?: string;
  readonly location?: string;
  readonly notes?: string;
  readonly raw: string;
}

// ---------------------------------------------------------------------------
// Airline lookup — 2-letter IATA codes to names
// ---------------------------------------------------------------------------
const AIRLINE_MAP: Readonly<Record<string, string>> = {
  UA: 'United',
  AA: 'American',
  DL: 'Delta',
  WN: 'Southwest',
  B6: 'JetBlue',
  AS: 'Alaska',
  NK: 'Spirit',
  F9: 'Frontier',
  HA: 'Hawaiian',
  BA: 'British Airways',
  LH: 'Lufthansa',
  AF: 'Air France',
  KL: 'KLM',
  EK: 'Emirates',
  QR: 'Qatar Airways',
  SQ: 'Singapore Airlines',
  CX: 'Cathay Pacific',
  NH: 'ANA',
  JL: 'JAL',
  QF: 'Qantas',
  AC: 'Air Canada',
  LX: 'Swiss',
  TK: 'Turkish Airlines',
  IB: 'Iberia',
  AZ: 'ITA Airways',
  EY: 'Etihad',
  VS: 'Virgin Atlantic',
  WS: 'WestJet',
  RY: 'Ryanair',
  FR: 'Ryanair',
  U2: 'easyJet',
  VY: 'Vueling',
};

// ---------------------------------------------------------------------------
// Hotel brand keywords
// ---------------------------------------------------------------------------
const HOTEL_BRANDS: readonly string[] = [
  'hilton', 'marriott', 'hyatt', 'ihg', 'airbnb', 'vrbo',
  'holiday inn', 'hampton inn', 'courtyard', 'sheraton', 'westin',
  'doubletree', 'embassy suites', 'residence inn', 'springhill',
  'fairfield', 'four seasons', 'ritz-carlton', 'ritz carlton',
  'st. regis', 'w hotel', 'aloft', 'intercontinental',
  'crowne plaza', 'radisson', 'best western', 'comfort inn',
  'la quinta', 'wyndham', 'omni', 'kimpton', 'ace hotel',
  'nobu hotel', 'andaz', 'park hyatt', 'grand hyatt',
  'waldorf astoria', 'conrad', 'canopy', 'curio', 'tapestry',
  'booking.com', 'hotels.com', 'hostelworld',
] as const;

// ---------------------------------------------------------------------------
// Transport keywords
// ---------------------------------------------------------------------------
const TRANSPORT_KEYWORDS: readonly string[] = [
  'uber', 'lyft', 'taxi', 'shuttle', 'amtrak', 'train',
  'eurostar', 'sncf', 'renfe', 'bus', 'greyhound', 'flixbus',
  'car rental', 'hertz', 'avis', 'enterprise', 'sixt', 'turo',
  'ferry', 'cruise', 'transfer',
] as const;

// ---------------------------------------------------------------------------
// Restaurant keywords
// ---------------------------------------------------------------------------
const RESTAURANT_KEYWORDS: readonly string[] = [
  'restaurant', 'reservation at', 'dinner at', 'lunch at',
  'brunch at', 'opentable', 'resy', 'yelp reservation',
  'table for', 'dining',
] as const;

// ---------------------------------------------------------------------------
// Activity keywords
// ---------------------------------------------------------------------------
const ACTIVITY_KEYWORDS: readonly string[] = [
  'tour', 'museum', 'ticket', 'excursion', 'experience',
  'adventure', 'class', 'workshop', 'viator', 'getyourguide',
  'airbnb experience', 'concert', 'show', 'performance',
  'spa', 'massage', 'safari', 'snorkeling', 'diving',
  'hiking', 'cooking class',
] as const;

// ---------------------------------------------------------------------------
// Regex patterns
// ---------------------------------------------------------------------------
const FLIGHT_PATTERN = /\b([A-Z]{2})\s?(\d{1,4})\b/g;

const DATE_PATTERNS: readonly RegExp[] = [
  // 2026-03-15
  /\b(\d{4}-\d{2}-\d{2})\b/g,
  // 03/15/2026 or 3/15/2026
  /\b(\d{1,2}\/\d{1,2}\/\d{4})\b/g,
  // Mar 15, 2026 or March 15, 2026
  /\b((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s+\d{1,2},?\s+\d{4})\b/gi,
  // 15 Mar 2026 or 15 March 2026
  /\b(\d{1,2}\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s+\d{4})\b/gi,
] as const;

const TIME_12H_PATTERN = /\b(\d{1,2}:\d{2}\s*[APap][Mm])\b/g;
const TIME_24H_PATTERN = /\b([01]?\d|2[0-3]):[0-5]\d\b/g;

const CONFIRMATION_CODE_PATTERN = /\b(?:confirmation|booking|reference|code|#|conf)[:\s#]*([A-Z0-9]{5,8})\b/gi;
const STANDALONE_CONF_PATTERN = /\b([A-Z]{6})\b/g;

// ---------------------------------------------------------------------------
// Month name lookup for date parsing
// ---------------------------------------------------------------------------
const MONTH_MAP: Readonly<Record<string, number>> = {
  jan: 0, january: 0,
  feb: 1, february: 1,
  mar: 2, march: 2,
  apr: 3, april: 3,
  may: 4,
  jun: 5, june: 5,
  jul: 6, july: 6,
  aug: 7, august: 7,
  sep: 8, september: 8,
  oct: 9, october: 9,
  nov: 10, november: 10,
  dec: 11, december: 11,
};

// ---------------------------------------------------------------------------
// categorizeReservation — Classify text into a ReservationType
// ---------------------------------------------------------------------------
export function categorizeReservation(text: string): ReservationType {
  const lower = text.toLowerCase();

  // Flight: check for airline codes + numbers
  const flightMatch = text.match(/\b[A-Z]{2}\s?\d{1,4}\b/);
  if (flightMatch) {
    const code = flightMatch[0].slice(0, 2);
    if (code in AIRLINE_MAP) return 'flight';
  }
  if (lower.includes('flight') || lower.includes('boarding pass') || lower.includes('departure')) {
    return 'flight';
  }

  // Hotel
  if (HOTEL_BRANDS.some((brand) => lower.includes(brand))) return 'hotel';
  if (lower.includes('check-in') || lower.includes('checkout') || lower.includes('hotel') || lower.includes('resort')) {
    return 'hotel';
  }

  // Transport
  if (TRANSPORT_KEYWORDS.some((kw) => lower.includes(kw))) return 'transport';

  // Restaurant
  if (RESTAURANT_KEYWORDS.some((kw) => lower.includes(kw))) return 'restaurant';

  // Activity
  if (ACTIVITY_KEYWORDS.some((kw) => lower.includes(kw))) return 'activity';

  // Default to activity
  return 'activity';
}

// ---------------------------------------------------------------------------
// parseDateToISO — Convert various date formats to ISO date string
// ---------------------------------------------------------------------------
function parseDateToISO(raw: string): string | null {
  const trimmed = raw.trim().replace(/,/g, '').replace(/\./g, '');

  // ISO format: 2026-03-15
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;

  // US format: 03/15/2026
  const usMatch = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (usMatch) {
    const m = usMatch[1].padStart(2, '0');
    const d = usMatch[2].padStart(2, '0');
    return `${usMatch[3]}-${m}-${d}`;
  }

  // Month Day Year: Mar 15 2026 or March 15 2026
  const mdyMatch = trimmed.match(/^([A-Za-z]+)\s+(\d{1,2})\s+(\d{4})$/);
  if (mdyMatch) {
    const monthNum = MONTH_MAP[mdyMatch[1].toLowerCase()];
    if (monthNum !== undefined) {
      const m = String(monthNum + 1).padStart(2, '0');
      const d = mdyMatch[2].padStart(2, '0');
      return `${mdyMatch[3]}-${m}-${d}`;
    }
  }

  // Day Month Year: 15 Mar 2026 or 15 March 2026
  const dmyMatch = trimmed.match(/^(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})$/);
  if (dmyMatch) {
    const monthNum = MONTH_MAP[dmyMatch[2].toLowerCase()];
    if (monthNum !== undefined) {
      const m = String(monthNum + 1).padStart(2, '0');
      const d = dmyMatch[1].padStart(2, '0');
      return `${dmyMatch[3]}-${m}-${d}`;
    }
  }

  return null;
}

// ---------------------------------------------------------------------------
// extractDates — Pull all dates from text
// ---------------------------------------------------------------------------
function extractDates(text: string): string[] {
  const dates: string[] = [];

  for (const pattern of DATE_PATTERNS) {
    const regex = new RegExp(pattern.source, pattern.flags);
    let match: RegExpExecArray | null = regex.exec(text);
    while (match !== null) {
      const iso = parseDateToISO(match[1]);
      if (iso !== null && !dates.includes(iso)) {
        dates.push(iso);
      }
      match = regex.exec(text);
    }
  }

  return dates.sort();
}

// ---------------------------------------------------------------------------
// extractTimes — Pull all times from text
// ---------------------------------------------------------------------------
function extractTimes(text: string): string[] {
  const times: string[] = [];

  // 12-hour
  const regex12 = new RegExp(TIME_12H_PATTERN.source, TIME_12H_PATTERN.flags);
  let match: RegExpExecArray | null = regex12.exec(text);
  while (match !== null) {
    times.push(normalizeTime(match[1]));
    match = regex12.exec(text);
  }

  // 24-hour (avoid picking up dates)
  const regex24 = new RegExp(TIME_24H_PATTERN.source, TIME_24H_PATTERN.flags);
  match = regex24.exec(text);
  while (match !== null) {
    const candidate = match[0];
    // Skip if it looks like part of a date (preceded by - or /)
    const idx = match.index;
    const prev = idx > 0 ? text[idx - 1] : '';
    if (prev !== '-' && prev !== '/') {
      if (!times.includes(candidate)) {
        times.push(candidate);
      }
    }
    match = regex24.exec(text);
  }

  return times;
}

// ---------------------------------------------------------------------------
// normalizeTime — Convert 12h to HH:MM
// ---------------------------------------------------------------------------
function normalizeTime(raw: string): string {
  const cleaned = raw.trim().toUpperCase();
  const timeMatch = cleaned.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/);
  if (!timeMatch) return raw;

  let hours = parseInt(timeMatch[1], 10);
  const minutes = timeMatch[2];
  const period = timeMatch[3];

  if (period === 'AM' && hours === 12) hours = 0;
  if (period === 'PM' && hours !== 12) hours += 12;

  return `${String(hours).padStart(2, '0')}:${minutes}`;
}

// ---------------------------------------------------------------------------
// extractConfirmationCodes — Pull confirmation/booking codes
// ---------------------------------------------------------------------------
function extractConfirmationCodes(text: string): string[] {
  const codes: string[] = [];

  // Labeled codes
  const labeledRegex = new RegExp(CONFIRMATION_CODE_PATTERN.source, CONFIRMATION_CODE_PATTERN.flags);
  let match: RegExpExecArray | null = labeledRegex.exec(text);
  while (match !== null) {
    const code = match[1].toUpperCase();
    if (!codes.includes(code)) codes.push(code);
    match = labeledRegex.exec(text);
  }

  // Standalone 6-char alpha codes (common confirmation format)
  if (codes.length === 0) {
    const standaloneRegex = new RegExp(STANDALONE_CONF_PATTERN.source, STANDALONE_CONF_PATTERN.flags);
    match = standaloneRegex.exec(text);
    while (match !== null) {
      const code = match[1];
      // Filter out common words and airline codes
      const isAirlineCode = code.length === 2;
      const isCommonWord = ['FLIGHT', 'HOTEL', 'CHECK', 'ENTER', 'TOTAL', 'PRICE'].includes(code);
      if (!isAirlineCode && !isCommonWord && !codes.includes(code)) {
        codes.push(code);
      }
      match = standaloneRegex.exec(text);
    }
  }

  return codes;
}

// ---------------------------------------------------------------------------
// extractFlightTitle — Build "United UA123" from flight code
// ---------------------------------------------------------------------------
function extractFlightTitle(text: string): string | null {
  const regex = new RegExp(FLIGHT_PATTERN.source, FLIGHT_PATTERN.flags);
  const match = regex.exec(text);
  if (!match) return null;

  const airline = match[1];
  const number = match[2];
  const name = AIRLINE_MAP[airline];

  if (name) return `${name} ${airline}${number}`;
  return `${airline}${number}`;
}

// ---------------------------------------------------------------------------
// extractHotelTitle — Find hotel brand + property name
// ---------------------------------------------------------------------------
function extractHotelTitle(text: string): string | null {
  const lower = text.toLowerCase();

  for (const brand of HOTEL_BRANDS) {
    const idx = lower.indexOf(brand);
    if (idx === -1) continue;

    // Grab the line containing the brand
    const lineStart = text.lastIndexOf('\n', idx) + 1;
    const lineEnd = text.indexOf('\n', idx);
    const line = text.slice(lineStart, lineEnd === -1 ? undefined : lineEnd).trim();

    if (line.length > 0 && line.length < 100) return line;
    // Fall back to brand name with proper casing
    return brand.split(' ').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  }

  return null;
}

// ---------------------------------------------------------------------------
// extractGenericTitle — Best-effort title from first meaningful line
// ---------------------------------------------------------------------------
function extractGenericTitle(text: string, type: ReservationType): string {
  const lines = text.split('\n').map((l) => l.trim()).filter((l) => l.length > 3 && l.length < 80);
  if (lines.length > 0) return lines[0];

  const labels: Record<ReservationType, string> = {
    flight: 'Flight',
    hotel: 'Hotel Booking',
    activity: 'Activity',
    restaurant: 'Restaurant',
    transport: 'Transport',
  };
  return labels[type];
}

// ---------------------------------------------------------------------------
// parseReservationText — Main parser: text → Reservation[]
// ---------------------------------------------------------------------------
export function parseReservationText(text: string): Reservation[] {
  if (!text || text.trim().length === 0) return [];

  // Split on common email separators or double newlines for multiple bookings
  const blocks = text
    .split(/(?:\n\s*\n\s*\n|\n-{3,}\n|\n={3,}\n|\n\*{3,}\n)/)
    .map((b) => b.trim())
    .filter((b) => b.length > 10);

  // If no meaningful splits, treat whole text as one block
  const segments = blocks.length > 0 ? blocks : [text.trim()];

  const reservations: Reservation[] = [];

  for (const segment of segments) {
    const type = categorizeReservation(segment);
    const dates = extractDates(segment);
    const times = extractTimes(segment);
    const codes = extractConfirmationCodes(segment);

    let title: string;
    if (type === 'flight') {
      title = extractFlightTitle(segment) ?? extractGenericTitle(segment, type);
    } else if (type === 'hotel') {
      title = extractHotelTitle(segment) ?? extractGenericTitle(segment, type);
    } else {
      title = extractGenericTitle(segment, type);
    }

    const reservation: Reservation = {
      type,
      title,
      date: dates[0] ?? new Date().toISOString().split('T')[0],
      time: times[0],
      endDate: dates.length > 1 ? dates[dates.length - 1] : undefined,
      endTime: times.length > 1 ? times[times.length - 1] : undefined,
      confirmationCode: codes[0],
      raw: segment,
    };

    reservations.push(reservation);
  }

  return reservations;
}

// ---------------------------------------------------------------------------
// formatReservationDate — Pretty-print an ISO date
// ---------------------------------------------------------------------------
export function formatReservationDate(isoDate: string): string {
  const parts = isoDate.split('-');
  if (parts.length !== 3) return isoDate;

  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1;
  const day = parseInt(parts[2], 10);

  const date = new Date(year, month, day);
  if (isNaN(date.getTime())) return isoDate;

  const monthNames = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
  ] as const;

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;

  return `${dayNames[date.getDay()]}, ${monthNames[month]} ${day}, ${year}`;
}

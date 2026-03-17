// =============================================================================
// ROAM — Visa Intelligence
// Offline-first visa requirements for US passport holders
// =============================================================================

export type PassportNationality = 'US' | 'UK' | 'EU' | 'AU' | 'CA';

export type VisaStatus = 'visa-free' | 'visa-on-arrival' | 'e-visa' | 'required';

export interface VisaInfo {
  status: VisaStatus;
  maxStay: number; // days
  notes: string;
  officialLink?: string;
}

interface VisaRecord {
  countryCode: string;
  destinations: string[];
  us: VisaInfo;
}

const VISA_DATA: VisaRecord[] = [
  { countryCode: 'JP', destinations: ['Tokyo', 'Kyoto', 'Osaka'], us: { status: 'visa-free', maxStay: 90, notes: 'No visa needed for tourism up to 90 days' } },
  { countryCode: 'FR', destinations: ['Paris'], us: { status: 'visa-free', maxStay: 90, notes: 'Schengen zone — 90 days within 180-day period' } },
  { countryCode: 'ID', destinations: ['Bali'], us: { status: 'visa-on-arrival', maxStay: 30, notes: 'Visa on arrival at airport, ~$35 USD, extendable once for 30 more days' } },
  { countryCode: 'US', destinations: ['New York'], us: { status: 'visa-free', maxStay: 999, notes: 'Domestic travel — no visa needed' } },
  { countryCode: 'ES', destinations: ['Barcelona'], us: { status: 'visa-free', maxStay: 90, notes: 'Schengen zone — 90 days within 180-day period' } },
  { countryCode: 'IT', destinations: ['Rome', 'Florence', 'Amalfi Coast'], us: { status: 'visa-free', maxStay: 90, notes: 'Schengen zone — 90 days within 180-day period' } },
  { countryCode: 'GB', destinations: ['London'], us: { status: 'visa-free', maxStay: 180, notes: 'No visa needed for tourism up to 6 months' } },
  { countryCode: 'TH', destinations: ['Bangkok', 'Chiang Mai'], us: { status: 'visa-free', maxStay: 30, notes: '30 days visa-free by air, extendable 30 days at immigration office' } },
  { countryCode: 'MA', destinations: ['Marrakech'], us: { status: 'visa-free', maxStay: 90, notes: 'No visa needed for tourism up to 90 days' } },
  { countryCode: 'PT', destinations: ['Lisbon', 'Porto', 'Azores'], us: { status: 'visa-free', maxStay: 90, notes: 'Schengen zone — 90 days within 180-day period' } },
  { countryCode: 'ZA', destinations: ['Cape Town'], us: { status: 'visa-free', maxStay: 90, notes: 'No visa needed for tourism up to 90 days' } },
  { countryCode: 'IS', destinations: ['Reykjavik'], us: { status: 'visa-free', maxStay: 90, notes: 'Schengen zone — 90 days within 180-day period' } },
  { countryCode: 'KR', destinations: ['Seoul'], us: { status: 'visa-free', maxStay: 90, notes: 'K-ETA required (online, ~$10), 90-day visa-free stay', officialLink: 'https://www.k-eta.go.kr' } },
  { countryCode: 'AR', destinations: ['Buenos Aires'], us: { status: 'visa-free', maxStay: 90, notes: 'No visa needed for tourism up to 90 days, extendable once' } },
  { countryCode: 'TR', destinations: ['Istanbul'], us: { status: 'e-visa', maxStay: 90, notes: 'E-visa required (~$50), apply online before travel', officialLink: 'https://www.evisa.gov.tr' } },
  { countryCode: 'AU', destinations: ['Sydney'], us: { status: 'e-visa', maxStay: 90, notes: 'ETA required (online, ~$15), apply before travel', officialLink: 'https://www.eta.homeaffairs.gov.au' } },
  { countryCode: 'MX', destinations: ['Mexico City', 'Oaxaca'], us: { status: 'visa-free', maxStay: 180, notes: 'No visa needed for tourism up to 180 days' } },
  { countryCode: 'AE', destinations: ['Dubai'], us: { status: 'visa-on-arrival', maxStay: 30, notes: 'Visa on arrival, free of charge, 30 days' } },
  { countryCode: 'NL', destinations: ['Amsterdam'], us: { status: 'visa-free', maxStay: 90, notes: 'Schengen zone — 90 days within 180-day period' } },
  { countryCode: 'CO', destinations: ['Medellín', 'Cartagena', "Colombia's Coffee Axis"], us: { status: 'visa-free', maxStay: 90, notes: 'No visa needed, extendable to 180 days total' } },
  { countryCode: 'GE', destinations: ['Tbilisi'], us: { status: 'visa-free', maxStay: 365, notes: 'No visa needed for stays up to 1 year — one of the most generous policies' } },
  { countryCode: 'HR', destinations: ['Dubrovnik'], us: { status: 'visa-free', maxStay: 90, notes: 'Schengen zone — 90 days within 180-day period' } },
  { countryCode: 'HU', destinations: ['Budapest'], us: { status: 'visa-free', maxStay: 90, notes: 'Schengen zone — 90 days within 180-day period' } },
  { countryCode: 'VN', destinations: ['Hoi An'], us: { status: 'e-visa', maxStay: 90, notes: 'E-visa required (~$25), single entry, apply 3+ days before', officialLink: 'https://evisa.xuatnhapcanh.gov.vn' } },
  { countryCode: 'IN', destinations: ['Jaipur'], us: { status: 'e-visa', maxStay: 90, notes: 'E-visa required (~$25), apply 4+ days before travel', officialLink: 'https://indianvisaonline.gov.in' } },
  { countryCode: 'NZ', destinations: ['Queenstown'], us: { status: 'e-visa', maxStay: 90, notes: 'NZeTA required (online, ~$12), apply before travel', officialLink: 'https://www.immigration.govt.nz/nzeta' } },
  { countryCode: 'SI', destinations: ['Ljubljana'], us: { status: 'visa-free', maxStay: 90, notes: 'Schengen zone — 90 days within 180-day period' } },
  { countryCode: 'GR', destinations: ['Santorini'], us: { status: 'visa-free', maxStay: 90, notes: 'Schengen zone — 90 days within 180-day period' } },
  { countryCode: 'KH', destinations: ['Siem Reap'], us: { status: 'visa-on-arrival', maxStay: 30, notes: 'Visa on arrival at airport ($30 USD cash), or e-visa online', officialLink: 'https://www.evisa.gov.kh' } },
];

/** Map destination name to country code */
export function destinationToCountryCode(destination: string): string | null {
  const lower = destination.toLowerCase();
  const record = VISA_DATA.find((r) =>
    r.destinations.some((d) => lower.includes(d.toLowerCase()) || d.toLowerCase().includes(lower))
  );
  return record?.countryCode ?? null;
}

/** Get visa info for a destination (US passport default) */
export function getVisaInfo(
  destination: string,
  _nationality: PassportNationality = 'US',
): VisaInfo | null {
  const lower = destination.toLowerCase();
  const record = VISA_DATA.find((r) =>
    r.destinations.some((d) => lower.includes(d.toLowerCase()) || d.toLowerCase().includes(lower))
  );
  if (!record) return null;
  return record.us;
}

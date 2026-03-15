// =============================================================================
// ROAM — Design System & App Constants
// Editorial, sophisticated — nothing else on the App Store
// =============================================================================

// ---------------------------------------------------------------------------
// Colors — Natural sage, warm gold, almost-black with hint of green
// ---------------------------------------------------------------------------
export const COLORS = {
  // Base
  bg: '#080F0A',
  bgCard: 'rgba(255,255,255,0.04)',
  bgGlass: 'rgba(255,255,255,0.04)',
  bgElevated: 'rgba(255,255,255,0.08)',
  border: 'rgba(255,255,255,0.06)',
  // Primary & accent
  primary: '#7CAF8A',
  sage: '#7CAF8A',
  sageLight: 'rgba(124,175,138,0.2)',
  sageSubtle: 'rgba(124,175,138,0.08)',
  sageMuted: 'rgba(124,175,138,0.12)',
  sageBorder: 'rgba(124,175,138,0.25)',
  sageHighlight: 'rgba(124,175,138,0.15)',
  sageStrong: 'rgba(124,175,138,0.3)',
  sageFaint: 'rgba(124,175,138,0.06)',
  sageSoft: 'rgba(124,175,138,0.1)',
  sageVeryFaint: 'rgba(124,175,138,0.05)',
  sageMedium: 'rgba(124,175,138,0.4)',
  sageAlpha80: 'rgba(124,175,138,0.8)',
  creamDim: 'rgba(245,237,216,0.4)',
  creamFaint: 'rgba(245,237,216,0.25)',
  creamSoft: 'rgba(245,237,216,0.6)',
  creamBright: 'rgba(245,237,216,0.85)',
  creamHighlight: 'rgba(245,237,216,0.7)',
  creamMutedLight: 'rgba(245,237,216,0.45)',
  creamMinimal: 'rgba(245,237,216,0.08)',
  creamSubtle: 'rgba(245,237,216,0.1)',
  creamVeryFaint: 'rgba(245,237,216,0.2)',
  creamDimLight: 'rgba(245,237,216,0.3)',
  creamDimMedium: 'rgba(245,237,216,0.35)',
  creamBrightDim: 'rgba(245,237,216,0.8)',
  creamBrightSoft: 'rgba(245,237,216,0.75)',
  creamBrightMuted: 'rgba(245,237,216,0.72)',
  coralBorder: 'rgba(232,97,74,0.4)',
  coralSubtle: 'rgba(232,97,74,0.15)',
  coralMuted: 'rgba(232,97,74,0.3)',
  coralStrong: 'rgba(232,97,74,0.9)',
  gold: '#C9A84C',
  goldMuted: 'rgba(201,168,76,0.3)',
  accentGold: '#C9A84C',
  // Legacy aliases (map to new palette)
  accentGreen: '#7CAF8A',
  cream: '#F5EDD8',
  creamMuted: 'rgba(245,237,216,0.5)',
  coral: '#E8614A',
  coralLight: 'rgba(232,97,74,0.2)',
  white: '#FFFFFF',
  black: '#000000',
  transparent: 'transparent',
  overlay: 'rgba(0, 0, 0, 0.6)',
  overlayDark: 'rgba(0,0,0,0.7)',
  overlayStrong: 'rgba(0,0,0,0.85)',
  overlayLight: 'rgba(0,0,0,0.5)',
  overlayMedium: 'rgba(0,0,0,0.4)',
  overlaySoft: 'rgba(0,0,0,0.3)',
  overlayFaint: 'rgba(0,0,0,0.15)',
  overlayVeryFaint: 'rgba(0,0,0,0.05)',
  overlayDim: 'rgba(0,0,0,0.65)',
  overlaySoftDim: 'rgba(0,0,0,0.24)',
  overlayMuted: 'rgba(0,0,0,0.28)',
  overlayDeep: 'rgba(0,0,0,0.88)',
  overlayDeeper: 'rgba(0,0,0,0.9)',
  overlayDarkest: 'rgba(0,0,0,0.95)',
  overlayFull: 'rgba(0,0,0,0.92)',
  overlayDarkDim: 'rgba(0,0,0,0.2)',
  overlayVeryDim: 'rgba(0,0,0,0.03)',
  overlayMinimal: 'rgba(0,0,0,0.04)',
  // White/slate tints
  whiteFaint: 'rgba(255,255,255,0.02)',
  whiteVeryFaint: 'rgba(255,255,255,0.03)',
  whiteFaintBorder: 'rgba(255,255,255,0.08)',
  whiteSoft: 'rgba(255,255,255,0.1)',
  whiteMuted: 'rgba(255,255,255,0.15)',
  whiteDim: 'rgba(255,255,255,0.2)',
  whiteHighlight: 'rgba(255,255,255,0.75)',
  whiteBright: 'rgba(255,255,255,0.85)',
  slateBright: 'rgba(248,250,252,0.85)',
  slateDim: 'rgba(248,250,252,0.7)',
  // Gold variants
  goldFaint: 'rgba(201,168,76,0.04)',
  goldVeryFaint: 'rgba(201,168,76,0.03)',
  goldSoft: 'rgba(201,168,76,0.08)',
  goldSubtle: 'rgba(201,168,76,0.1)',
  goldMutedLight: 'rgba(201,168,76,0.12)',
  goldHighlight: 'rgba(201,168,76,0.15)',
  goldBorder: 'rgba(201,168,76,0.2)',
  goldBorderStrong: 'rgba(201,168,76,0.3)',
  goldDim: 'rgba(201,168,76,0.4)',
  goldMutedDim: 'rgba(201,168,76,0.5)',
  goldAlpha80: 'rgba(201,168,76,0.8)',
  goldDark: '#B8943F',
  goldBright: '#E8B84A',
  // Danger / red / chaos
  danger: '#C0392B',
  dangerLight: '#E74C3C',
  dangerSubtle: 'rgba(192,57,43,0.05)',
  dangerHighlight: 'rgba(192,57,43,0.15)',
  dangerBorder: 'rgba(192,57,43,0.3)',
  dangerBorderLight: 'rgba(192,57,43,0.2)',
  dangerSoft: 'rgba(192,57,43,0.4)',
  dangerMedium: 'rgba(192,57,43,0.5)',
  dangerMuted: 'rgba(192,57,43,0.8)',
  dangerFaint: 'rgba(192,57,43,0.08)',
  dangerFaintBorder: 'rgba(192,57,43,0.15)',
  dangerDim: 'rgba(192,57,43,0.04)',
  emergencyRed: '#B91C1C',
  // Success / green
  successLight: 'rgba(74,222,128,0.2)',
  successHighlight: 'rgba(74,222,128,0.15)',
  successBorder: 'rgba(74,222,128,0.3)',
  successBorderLight: 'rgba(74,222,128,0.2)',
  successBorderMedium: 'rgba(74,222,128,0.35)',
  successFaint: 'rgba(74,222,128,0.08)',
  // Warning / amber
  warningHighlight: 'rgba(245,158,11,0.2)',
  warningSubtle: 'rgba(245,158,11,0.15)',
  warningBorder: 'rgba(245,158,11,0.3)',
  // Brand accents (alter-ego, airline, etc.)
  sageDark: '#5a9a6a',
  sageDarkMuted: '#6A9A78',
  sageDarker: '#5E9A6E',
  sageDeep: '#5a9468',
  purpleAccent: '#9B59B6',
  orangeAccent: '#E67E22',
  purpleFaint: 'rgba(155,89,182,0.1)',
  blueAccent: '#5B9BD5',
  spotifyGreen: '#1DB954',
  lavender: '#B488D9',
  amber: '#F0A05E',
  // Gradient bg stops
  gradientForestDark: '#0a1a12',
  gradientForestDarkGreen: '#0a1a10',
  gradientForest14: '#0a1a14',
  tanAccent: '#D4A574',
  violetAccent: '#B07CC6',
  grayAccent: '#8899AA',
  slateMuted: '#94A3B8',
  weatherCoralBorder: 'rgba(234, 88, 84, 0.3)',
  weatherCoralBg: 'rgba(234, 88, 84, 0.08)',
  passportUS: { bg: 'rgba(59,130,246,0.15)', text: '#6FA8DC' },
  passportAT: { bg: 'rgba(220,38,38,0.12)', text: '#E87C7C' },
  carbonGreen: '#22c55e',
  chartGreen: '#4ADE80',
  chartGold: '#F59E0B',
  chartBlue: '#60A5FA',
  chartViolet: '#A78BFA',
  carbonGreenBg: 'rgba(34, 197, 94, 0.2)',
  globeBg: 'rgba(10,31,26,0.9)',
  goldDark2: '#B89640',
  gradientForestLight: '#0a1812',
  gradientForestSoft: '#0a1410',
  gradientForestDeep: '#0a1f1a',
  gradientForestDarker: '#0c2a20',
  gradientCard: '#0D1F1A',
  gradientCardLight: '#142B24',
  gradientCardDeep: '#1A3A2E',
  coralDark: '#D14A35',
  whiteMuted90: 'rgba(255,255,255,0.9)',
  whiteMuted12: 'rgba(255,255,255,0.12)',
  whiteMuted15: 'rgba(255,255,255,0.15)',
  slateMuted75: 'rgba(248,250,252,0.75)',
  successMuted: 'rgba(74,222,128,0.5)',
  slateMuted50: 'rgba(248,250,252,0.5)',
  slateMuted40: 'rgba(248,250,252,0.4)',
  bgDarkGreen: 'rgba(8,15,10,0.95)',
  bgDarkGreenSoft: 'rgba(8,15,10,0.6)',
  bgDarkGreenMedium: 'rgba(8,15,10,0.92)',
  bgDarkGreenFull: 'rgba(8,15,10,0.4)',
  bgDarkGreenFaint: 'rgba(8,15,10,0.3)',
  bgDarkGreenDeep: 'rgba(8,15,10,0.98)',
  bgDarkGreenOverlay: 'rgba(8,15,10,0.85)',
  bgDarkGreen80: 'rgba(8,15,10,0.8)',
  bgDarkGreenDeeper: 'rgba(8,15,10,0.97)',
  bgDarkGreen88: 'rgba(8,15,10,0.88)',
  bgCardOverlay: 'rgba(13,31,26,0.85)',
  bgDark1515: 'rgba(8,15,15,0.4)',
  bgDark1515Medium: 'rgba(8,15,15,0.7)',
  bgDark1515Deep: 'rgba(8,15,15,0.9)',
  bgDark1515Overlay: 'rgba(8,15,15,0.85)',
  bgDark1515End: '#080F0F',
  bgDark1210Faint: 'rgba(8,12,10,0.12)',
  bgDark1210Medium: 'rgba(8,12,10,0.68)',
  bgDark1210Deep: 'rgba(8,12,10,0.96)',
  purpleOverlay: 'rgba(26,10,46,0.7)',
  purpleWithAlpha: '#9B59B6CC',
  // Airline / booking gradients (TripInsuranceCards, itinerary)
  blueGradientStart: '#2563eb',
  blueGradientEnd: '#3b82f6',
  emeraldStart: '#059669',
  emeraldEnd: '#10b981',
  flightBlueStart: '#003580',
  flightBlueEnd: '#0057B8',
  flightRedStart: '#C5162E',
  flightRedEnd: '#E8301C',
  flightUnitedStart: '#0770E3',
  flightUnitedEnd: '#00A4E8',
  // Map styles (Google Maps)
  mapGeometry: '#1a2e27',
  mapLabelFill: '#7caf8a',
  mapLabelStroke: '#0d1f1a',
  mapWater: '#243b33',
  mapRoad: '#5a8a66',
  mapLandscape: '#0a1812',
  mapNatural: '#1e3329',
  mapPoi: '#5a8a66',
  // Receipt / print (light theme)
  receiptBg: '#FAF8F2',
  receiptText: '#1A1A1A',
  receiptMuted: '#666',
  receiptBorder: '#CCC',
  receiptDim: '#999',
  receiptDark: '#333',
  receiptMedium: '#555',
  receiptLight: '#444',
  receiptSoft: '#888',
  receiptSofter: '#777',
  receiptFaint: '#AAA',
  receiptFaintBorder: '#DDD',
  // Chaos / alter-ego gradients
  chaosGradientStart: '#C0392B',
  chaosGradientEnd: '#E74C3C',
  alterSage: ['#1a3a2a', '#0D1F1A'],
  alterGold: ['#2a1a0a', '#1a0d00'],
  alterPurple: ['#1a1a2a', '#0d0d1a'],
  alterRed: ['#2a0d0d', '#1a0800'],
  alterAmber: ['#1a1508', '#0d0d00'],
  alterGreen: ['#0d1a0d', '#001a00'],
  alterNavy: ['#0d0d1a', '#00001a'],
  alterCoral: '#a83125',
  neutralDark: '#333',
  neutralDarker: '#222',
  // Safety overlay (neighborhood-safety)
  safetyModerate: 'rgba(201,168,76,0.25)',
  safetyCaution: 'rgba(192,57,43,0.2)',
  // Affiliate brand colors
  affiliateSkyscanner: '#0770E3',
  affiliateBooking: '#003580',
  affiliateGetyourguide: '#FF5533',
  affiliateRentalcars: '#F7B731',
  // Theme fallback (unknown destinations)
  themeDefaultSecondary: '#A3D9B1',
  themeDefaultGradientStart: '#7CAF8A',
  themeDefaultGradientMid: '#2D5F3B',
  themeDefaultGradientEnd: '#0B2E1A',
  // Semantic
  success: '#7CAF8A',
  destructive: '#E8614A',
  // Gradient stops (keep legacy)
  gradientMidnight: '#0c1445',
  gradientForest: '#0a1f1a',
  gradientPurple: '#1a0a2e',
  gradientNavy: '#0d0f1a',
} as const;

// ---------------------------------------------------------------------------
// Destination theme palettes — unique accent colors per destination
// ---------------------------------------------------------------------------
export const DESTINATION_THEME_PALETTES: Record<string, { primary: string; secondary: string; gradient: [string, string, string]; glowColor: string }> = {
  Tokyo: { primary: '#FF6B8A', secondary: '#FF9EB5', gradient: ['#FF6B8A', '#C73866', '#2D1B2E'], glowColor: 'rgba(255,107,138,0.3)' },
  Kyoto: { primary: '#E8A0BF', secondary: '#F2C6DE', gradient: ['#E8A0BF', '#8B4570', '#2A1525'], glowColor: 'rgba(232,160,191,0.3)' },
  Seoul: { primary: '#8B5CF6', secondary: '#C4B5FD', gradient: ['#8B5CF6', '#5B21B6', '#1E0A3E'], glowColor: 'rgba(139,92,246,0.3)' },
  Bangkok: { primary: '#FBBF24', secondary: '#FDE68A', gradient: ['#FBBF24', '#92400E', '#2E1B06'], glowColor: 'rgba(251,191,36,0.3)' },
  'Chiang Mai': { primary: '#A3E635', secondary: '#D9F99D', gradient: ['#A3E635', '#4D7C0F', '#1A2E05'], glowColor: 'rgba(163,230,53,0.3)' },
  Bali: { primary: '#4ADE80', secondary: '#86EFAC', gradient: ['#4ADE80', '#166534', '#0B2E1A'], glowColor: 'rgba(74,222,128,0.3)' },
  'Hoi An': { primary: '#FB923C', secondary: '#FED7AA', gradient: ['#FB923C', '#9A3412', '#2E1006'], glowColor: 'rgba(251,146,60,0.3)' },
  Jaipur: { primary: '#F472B6', secondary: '#FBCFE8', gradient: ['#F472B6', '#9D174D', '#2E0719'], glowColor: 'rgba(244,114,182,0.3)' },
  Paris: { primary: '#C4B5FD', secondary: '#DDD6FE', gradient: ['#C4B5FD', '#6D28D9', '#1E0A3E'], glowColor: 'rgba(196,181,253,0.3)' },
  Barcelona: { primary: '#F97316', secondary: '#FDBA74', gradient: ['#F97316', '#9A3412', '#2E1006'], glowColor: 'rgba(249,115,22,0.3)' },
  Rome: { primary: '#D4A574', secondary: '#E8CDB0', gradient: ['#D4A574', '#7C4A2D', '#2E1A0E'], glowColor: 'rgba(212,165,116,0.3)' },
  London: { primary: '#94A3B8', secondary: '#CBD5E1', gradient: ['#94A3B8', '#334155', '#0F172A'], glowColor: 'rgba(148,163,184,0.3)' },
  Lisbon: { primary: '#F59E0B', secondary: '#FCD34D', gradient: ['#F59E0B', '#B45309', '#3B1F06'], glowColor: 'rgba(245,158,11,0.3)' },
  Amsterdam: { primary: '#F97316', secondary: '#FB923C', gradient: ['#F97316', '#78350F', '#2E1B06'], glowColor: 'rgba(249,115,22,0.3)' },
  Porto: { primary: '#3B82F6', secondary: '#93C5FD', gradient: ['#3B82F6', '#1E3A8A', '#0C1A3E'], glowColor: 'rgba(59,130,246,0.3)' },
  Dubrovnik: { primary: '#F87171', secondary: '#FECACA', gradient: ['#F87171', '#991B1B', '#2D0808'], glowColor: 'rgba(248,113,113,0.3)' },
  Budapest: { primary: '#E879F9', secondary: '#F0ABFC', gradient: ['#E879F9', '#86198F', '#2E0A30'], glowColor: 'rgba(232,121,249,0.3)' },
  Reykjavik: { primary: '#94A3B8', secondary: '#CBD5E1', gradient: ['#94A3B8', '#475569', '#1E293B'], glowColor: 'rgba(148,163,184,0.3)' },
  Istanbul: { primary: '#DC2626', secondary: '#FCA5A5', gradient: ['#DC2626', '#7F1D1D', '#2D0808'], glowColor: 'rgba(220,38,38,0.3)' },
  Tbilisi: { primary: '#A78BFA', secondary: '#C4B5FD', gradient: ['#A78BFA', '#5B21B6', '#1E0A3E'], glowColor: 'rgba(167,139,250,0.3)' },
  'New York': { primary: '#FBBF24', secondary: '#FDE68A', gradient: ['#FBBF24', '#78350F', '#2E1B06'], glowColor: 'rgba(251,191,36,0.3)' },
  'Mexico City': { primary: '#EF4444', secondary: '#FCA5A5', gradient: ['#EF4444', '#991B1B', '#2D0808'], glowColor: 'rgba(239,68,68,0.3)' },
  Oaxaca: { primary: '#A855F7', secondary: '#D8B4FE', gradient: ['#A855F7', '#6B21A8', '#1E0A3E'], glowColor: 'rgba(168,85,247,0.3)' },
  'Buenos Aires': { primary: '#60A5FA', secondary: '#BFDBFE', gradient: ['#60A5FA', '#1E40AF', '#0C1A3E'], glowColor: 'rgba(96,165,250,0.3)' },
  Cartagena: { primary: '#2DD4BF', secondary: '#99F6E4', gradient: ['#2DD4BF', '#0F766E', '#062E2B'], glowColor: 'rgba(45,212,191,0.3)' },
  'Medellín': { primary: '#F97316', secondary: '#FDBA74', gradient: ['#F97316', '#9A3412', '#2E1006'], glowColor: 'rgba(249,115,22,0.3)' },
  Marrakech: { primary: '#D97706', secondary: '#FDE68A', gradient: ['#D97706', '#78350F', '#2E1B06'], glowColor: 'rgba(217,119,6,0.3)' },
  'Cape Town': { primary: '#06B6D4', secondary: '#67E8F9', gradient: ['#06B6D4', '#0E7490', '#082F38'], glowColor: 'rgba(6,182,212,0.3)' },
  Dubai: { primary: '#C9A84C', secondary: '#E8D48B', gradient: ['#C9A84C', '#78591C', '#2E2008'], glowColor: 'rgba(201,168,76,0.3)' },
  Sydney: { primary: '#38BDF8', secondary: '#7DD3FC', gradient: ['#38BDF8', '#0369A1', '#082F49'], glowColor: 'rgba(56,189,248,0.3)' },
  Queenstown: { primary: '#34D399', secondary: '#A7F3D0', gradient: ['#34D399', '#065F46', '#022C22'], glowColor: 'rgba(52,211,153,0.3)' },
  Azores: { primary: '#22D3EE', secondary: '#A5F3FC', gradient: ['#22D3EE', '#0E7490', '#082F38'], glowColor: 'rgba(34,211,238,0.3)' },
  Ljubljana: { primary: '#4ADE80', secondary: '#BBF7D0', gradient: ['#4ADE80', '#15803D', '#052E16'], glowColor: 'rgba(74,222,128,0.3)' },
  "Colombia's Coffee Axis": { primary: '#92400E', secondary: '#D4A574', gradient: ['#92400E', '#5C2D0A', '#2E1606'], glowColor: 'rgba(146,64,14,0.3)' },
  Santorini: { primary: '#3B82F6', secondary: '#BFDBFE', gradient: ['#3B82F6', '#1E3A8A', '#0C1A3E'], glowColor: 'rgba(59,130,246,0.3)' },
  'Siem Reap': { primary: '#D97706', secondary: '#FCD34D', gradient: ['#D97706', '#6B3A10', '#2E1B06'], glowColor: 'rgba(217,119,6,0.3)' },
};

// ---------------------------------------------------------------------------
// Persona archetype accent colors
// ---------------------------------------------------------------------------
export const PERSONA_COLORS: Record<string, string> = {
  'midnight-explorer': '#6C5CE7',
  'dawn-chaser': '#E17055',
  'food-archaeologist': '#D63031',
  'comfort-maximalist': COLORS.gold,
  'chaos-tourist': '#00B894',
  'culture-collector': '#0984E3',
  'budget-ninja': '#00CEC9',
  'adventure-junkie': '#E84393',
  'slow-traveler': COLORS.primary,
  'digital-nomad': '#636E72',
  'romantic-wanderer': '#FD79A8',
  'solo-wolf': '#2D3436',
};

// ---------------------------------------------------------------------------
// Typography — Cormorant Garamond (headlines), DM Sans (body), DM Mono (data)
// Letter spacing: 0.15em on all caps; line height 1.6 on body
// ---------------------------------------------------------------------------
export const FONTS = {
  header: 'CormorantGaramond_700Bold',
  headerMedium: 'CormorantGaramond_600SemiBold',
  body: 'DMSans_400Regular',
  bodyMedium: 'DMSans_500Medium',
  bodySemiBold: 'DMSans_700Bold',
  mono: 'DMMono_400Regular',
  monoMedium: 'DMMono_500Medium',
} as const;

export const TYPOGRAPHY = {
  letterSpacingCaps: 0.15,
  lineHeightBody: 1.6,
} as const;

// ---------------------------------------------------------------------------
// Spacing & Radius — max 12px radius, no aggressive rounding
// ---------------------------------------------------------------------------
export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  xxxl: 64,
} as const;

export const RADIUS = {
  sm: 6,
  md: 10,
  lg: 12,
  xl: 12,
  full: 9999,
} as const;

// ---------------------------------------------------------------------------
// Free-tier limits
// ---------------------------------------------------------------------------
export const FREE_TRIPS_PER_MONTH = 1;

// ---------------------------------------------------------------------------
// Affiliate links
// ---------------------------------------------------------------------------
export const AFFILIATES = {
  booking: 'https://www.booking.com/?aid=roam',
  getyourguide: 'https://www.getyourguide.com/?partner_id=roam',
  skyscanner: 'https://www.skyscanner.com/?associateId=roam',
  rentalcars: 'https://www.rentalcars.com/?affiliateCode=roam',
} as const;

// ---------------------------------------------------------------------------
// Destinations — no emojis; typography and photography do the work
// ---------------------------------------------------------------------------
export interface Destination {
  label: string;
  /** @deprecated No emojis — use label + photo only */
  emoji: string;
  country: string;
  hook: string;
  photoQuery: string;
  unsplashUrl?: string;
  category: string;
  dailyCost: number;
  trendScore: number;
  bestMonths: number[];
}

export const DESTINATIONS: Destination[] = [
  { label: 'Tokyo', emoji: '', country: 'JP', hook: 'More to do per block than most cities have total', photoQuery: 'Shibuya crossing Tokyo Japan', category: 'cities', unsplashUrl: 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?w=800&q=85', dailyCost: 120, trendScore: 92, bestMonths: [3, 4, 10, 11] },
  { label: 'Paris', emoji: '', country: 'FR', hook: 'Skip the Eiffel Tower line. Walk the Marais instead.', photoQuery: 'Eiffel Tower Paris France', category: 'couples', unsplashUrl: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=800&q=85', dailyCost: 150, trendScore: 88, bestMonths: [4, 5, 6, 9, 10] },
  { label: 'Bali', emoji: '', country: 'ID', hook: 'Ubud for the mornings. Canggu for the nights. Skip Kuta.', photoQuery: 'Tegallalang rice terrace Bali Indonesia', category: 'beaches', unsplashUrl: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=800&q=85', dailyCost: 45, trendScore: 95, bestMonths: [4, 5, 6, 9, 10] },
  { label: 'New York', emoji: '', country: 'US', hook: '$1 pizza, $1M views. Still unmatched.', photoQuery: 'Times Square New York City USA', category: 'cities', unsplashUrl: 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=800&q=85', dailyCost: 180, trendScore: 85, bestMonths: [4, 5, 9, 10, 12] },
  { label: 'Barcelona', emoji: '', country: 'ES', hook: "Dinner starts at 10pm. You'll get used to it.", photoQuery: 'La Sagrada Familia Barcelona Spain', category: 'cities', unsplashUrl: 'https://images.unsplash.com/photo-1583422409516-2895a77efded?w=800&q=85', dailyCost: 100, trendScore: 82, bestMonths: [5, 6, 9, 10] },
  { label: 'Rome', emoji: '', country: 'IT', hook: 'Eat carbonara. Walk 10 miles. Repeat.', photoQuery: 'Colosseum Rome Italy', category: 'food', unsplashUrl: 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=800&q=85', dailyCost: 110, trendScore: 80, bestMonths: [4, 5, 9, 10] },
  { label: 'London', emoji: '', country: 'GB', hook: 'The best city for people who hate tourist stuff', photoQuery: 'Tower Bridge London England', category: 'cities', unsplashUrl: 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=800&q=85', dailyCost: 160, trendScore: 78, bestMonths: [5, 6, 7, 9] },
  { label: 'Bangkok', emoji: '', country: 'TH', hook: 'Jay Fai for breakfast. Chatuchak for the afternoon. Khao San never.', photoQuery: 'Wat Arun temple Bangkok Thailand', category: 'budget', unsplashUrl: 'https://images.unsplash.com/photo-1508009603885-50cf7c579365?w=800&q=85', dailyCost: 35, trendScore: 87, bestMonths: [11, 12, 1, 2, 3] },
  { label: 'Marrakech', emoji: '', country: 'MA', hook: "Get lost on purpose. That's the point.", photoQuery: 'Jemaa el-Fnaa Marrakech Morocco', category: 'adventure', unsplashUrl: 'https://images.unsplash.com/photo-1597212618440-806262de4f6b?w=800&q=85', dailyCost: 55, trendScore: 74, bestMonths: [3, 4, 5, 10, 11] },
  { label: 'Lisbon', emoji: '', country: 'PT', hook: 'Europe before it got expensive', photoQuery: 'Tram 28 Alfama Lisbon Portugal', category: 'budget', unsplashUrl: 'https://images.unsplash.com/photo-1555881400-74d7acaacd8b?w=800&q=85', dailyCost: 75, trendScore: 90, bestMonths: [4, 5, 6, 9, 10] },
  { label: 'Cape Town', emoji: '', country: 'ZA', hook: 'Table Mountain at sunrise. Trust me.', photoQuery: 'Table Mountain Cape Town South Africa', category: 'mountains', unsplashUrl: 'https://images.unsplash.com/photo-1580060839134-75a5edca2e99?w=800&q=85', dailyCost: 65, trendScore: 72, bestMonths: [10, 11, 12, 1, 2, 3] },
  { label: 'Reykjavik', emoji: '', country: 'IS', hook: "Expensive but you'll talk about it forever", photoQuery: 'Blue Lagoon Iceland', category: 'adventure', unsplashUrl: 'https://images.unsplash.com/photo-1504829857797-ddff29c27927?w=800&q=85', dailyCost: 200, trendScore: 76, bestMonths: [6, 7, 8, 9] },
  { label: 'Seoul', emoji: '', country: 'KR', hook: 'The food alone is worth the 14-hour flight', photoQuery: 'Bukchon Hanok Village Seoul South Korea', category: 'food', unsplashUrl: 'https://images.unsplash.com/photo-1534274988757-a28bf1a57c17?w=800&q=85', dailyCost: 85, trendScore: 91, bestMonths: [3, 4, 5, 9, 10] },
  { label: 'Buenos Aires', emoji: '', country: 'AR', hook: 'Steak for $8. Bookshops open at midnight.', photoQuery: 'La Boca Buenos Aires Argentina', category: 'food', unsplashUrl: 'https://images.unsplash.com/photo-1589909202802-8f4aadce1849?w=800&q=85', dailyCost: 50, trendScore: 70, bestMonths: [3, 4, 5, 10, 11] },
  { label: 'Istanbul', emoji: '', country: 'TR', hook: 'Two continents, one breakfast spread', photoQuery: 'Hagia Sophia Istanbul Turkey', category: 'food', unsplashUrl: 'https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?w=800&q=85', dailyCost: 60, trendScore: 83, bestMonths: [4, 5, 9, 10] },
  { label: 'Sydney', emoji: '', country: 'AU', hook: 'Bondi at 7am, opera at 7pm', photoQuery: 'Sydney Opera House Australia', category: 'beaches', unsplashUrl: 'https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?w=800&q=85', dailyCost: 140, trendScore: 68, bestMonths: [10, 11, 12, 1, 2, 3] },
  { label: 'Mexico City', emoji: '', country: 'MX', hook: 'Mezcal, mole, and a city that never stops', photoQuery: 'Palacio de Bellas Artes Mexico City', category: 'food', unsplashUrl: 'https://images.unsplash.com/photo-1585464231875-d9ef1f5ad396?w=800&q=85', dailyCost: 55, trendScore: 93, bestMonths: [3, 4, 5, 10, 11, 12] },
  { label: 'Dubai', emoji: '', country: 'AE', hook: "Over the top. That's kind of the point.", photoQuery: 'Burj Khalifa Dubai UAE', category: 'couples', unsplashUrl: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=800&q=85', dailyCost: 175, trendScore: 79, bestMonths: [11, 12, 1, 2, 3] },
  { label: 'Kyoto', emoji: '', country: 'JP', hook: 'Go in April or November. You\'ll thank me.', photoQuery: 'Fushimi Inari Shrine Kyoto Japan', category: 'couples', unsplashUrl: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=800&q=85', dailyCost: 110, trendScore: 86, bestMonths: [3, 4, 10, 11] },
  { label: 'Amsterdam', emoji: '', country: 'NL', hook: 'Rent a bike. Skip the tourist traps.', photoQuery: 'Amsterdam canal houses Netherlands', category: 'cities', unsplashUrl: 'https://images.unsplash.com/photo-1534351590666-13e3e96b5017?w=800&q=85', dailyCost: 130, trendScore: 75, bestMonths: [4, 5, 6, 9] },
  { label: 'Medellín', emoji: '', country: 'CO', hook: 'The comeback story of the century', photoQuery: 'Medellin Colombia city view', category: 'budget', unsplashUrl: 'https://images.unsplash.com/photo-1568632234157-ce7aecd03d0d?w=800&q=85', dailyCost: 40, trendScore: 89, bestMonths: [1, 2, 3, 7, 8, 12] },
  { label: 'Tbilisi', emoji: '', country: 'GE', hook: "The most underrated city you'll visit this decade", photoQuery: 'Tbilisi old town Georgia', category: 'budget', unsplashUrl: 'https://images.unsplash.com/photo-1565008576549-57569a49371d?w=800&q=85', dailyCost: 35, trendScore: 84, bestMonths: [5, 6, 9, 10] },
  { label: 'Chiang Mai', emoji: '', country: 'TH', hook: "Slow down. It's worth it.", photoQuery: 'Doi Suthep temple Chiang Mai Thailand', category: 'budget', unsplashUrl: 'https://images.unsplash.com/photo-1598935898639-81586f7d2129?w=800&q=85', dailyCost: 30, trendScore: 81, bestMonths: [11, 12, 1, 2] },
  { label: 'Porto', emoji: '', country: 'PT', hook: 'Wine, tiles, and zero pretension', photoQuery: 'Ribeira Porto Portugal', category: 'food', unsplashUrl: 'https://images.unsplash.com/photo-1569959220744-ff553533f492?w=800&q=85', dailyCost: 70, trendScore: 77, bestMonths: [5, 6, 9, 10] },
  { label: 'Oaxaca', emoji: '', country: 'MX', hook: 'Better food than Mexico City. I said it.', photoQuery: 'Oaxaca city center Mexico', category: 'food', unsplashUrl: 'https://images.unsplash.com/photo-1518105779142-d975f22f1b0a?w=800&q=85', dailyCost: 40, trendScore: 88, bestMonths: [10, 11, 3, 4] },
  { label: 'Dubrovnik', emoji: '', country: 'HR', hook: 'Go in September. Avoid the cruise ship crowds.', photoQuery: 'Dubrovnik old town walls Croatia', category: 'couples', unsplashUrl: 'https://images.unsplash.com/photo-1580137189272-c9379f8864fd?w=800&q=85', dailyCost: 95, trendScore: 73, bestMonths: [5, 6, 9, 10] },
  { label: 'Budapest', emoji: '', country: 'HU', hook: "Vienna's cooler, cheaper cousin", photoQuery: 'Hungarian Parliament Budapest', category: 'cities', unsplashUrl: 'https://images.unsplash.com/photo-1551867633-194f125bddfa?w=800&q=85', dailyCost: 60, trendScore: 80, bestMonths: [4, 5, 6, 9, 10] },
  { label: 'Hoi An', emoji: '', country: 'VN', hook: 'Custom suit for $40. Banh mi for $1. Sold.', photoQuery: 'Hoi An lanterns Vietnam', category: 'budget', unsplashUrl: 'https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?w=800&q=85', dailyCost: 25, trendScore: 78, bestMonths: [2, 3, 4] },
  { label: 'Cartagena', emoji: '', country: 'CO', hook: 'Pastel walls, Caribbean soul, $3 ceviche', photoQuery: 'Cartagena old city Colombia', category: 'beaches', unsplashUrl: 'https://images.unsplash.com/photo-1533050487297-09b450131914?w=800&q=85', dailyCost: 55, trendScore: 71, bestMonths: [12, 1, 2, 3] },
  { label: 'Jaipur', emoji: '', country: 'IN', hook: 'Sensory overload in the best way', photoQuery: 'Hawa Mahal Jaipur India', category: 'adventure', unsplashUrl: 'https://images.unsplash.com/photo-1477587458883-47145ed94245?w=800&q=85', dailyCost: 30, trendScore: 69, bestMonths: [10, 11, 12, 1, 2, 3] },
  { label: 'Queenstown', emoji: '', country: 'NZ', hook: 'Bungee jump before breakfast. Why not.', photoQuery: 'Queenstown New Zealand mountains', category: 'mountains', unsplashUrl: 'https://images.unsplash.com/photo-1506038634487-60a69ae4b7b1?w=800&q=85', dailyCost: 130, trendScore: 67, bestMonths: [12, 1, 2, 6, 7, 8] },
];

export const HIDDEN_DESTINATIONS: Destination[] = [
  { label: 'Azores', emoji: '', country: 'PT', hook: 'Hydrangeas, whale routes, and basically no tourists yet.', photoQuery: 'Sete Cidades Azores Portugal', category: 'adventure', unsplashUrl: 'https://images.unsplash.com/photo-1565073182887-6bcefbe225b1?w=800&q=85', dailyCost: 90, trendScore: 65, bestMonths: [5, 6, 7, 8, 9] },
  { label: 'Ljubljana', emoji: '', country: 'SI', hook: "Europe's smallest capital. Dragon Bridge, zero attitude.", photoQuery: 'Ljubljana castle Slovenia', category: 'cities', unsplashUrl: 'https://images.unsplash.com/photo-1569396116180-210c182bedb8?w=800&q=85', dailyCost: 70, trendScore: 62, bestMonths: [5, 6, 9, 10] },
  { label: "Colombia's Coffee Axis", emoji: '', country: 'CO', hook: 'Wake up inside the farm your coffee came from.', photoQuery: 'Coffee farm Colombia Eje Cafetero', category: 'adventure', unsplashUrl: 'https://images.unsplash.com/photo-1447933601403-0c6688de566e?w=800&q=85', dailyCost: 45, trendScore: 60, bestMonths: [1, 2, 3, 12] },
  { label: 'Santorini', emoji: '', country: 'GR', hook: 'Go in May. You\u2019ll have Oia to yourself for 20 minutes.', photoQuery: 'Oia Santorini Greece sunset', category: 'couples', unsplashUrl: 'https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?w=800&q=85', dailyCost: 140, trendScore: 70, bestMonths: [5, 6, 9, 10] },
  { label: 'Siem Reap', emoji: '', country: 'KH', hook: 'Angkor Wat at 5am, before the tour buses arrive.', photoQuery: 'Angkor Wat Cambodia sunrise', category: 'adventure', unsplashUrl: 'https://images.unsplash.com/photo-1569683795645-b62e50fbf103?w=800&q=85', dailyCost: 40, trendScore: 68, bestMonths: [11, 12, 1, 2] },
];

// ---------------------------------------------------------------------------
// Destination category chips — iconId for custom SVG, no emoji
// ---------------------------------------------------------------------------
export interface DestinationCategory {
  id: string;
  label: string;
  emoji: string;
  iconId: 'all' | 'beaches' | 'mountains' | 'cities' | 'food' | 'adventure' | 'budget' | 'couples';
}

export const DESTINATION_CATEGORIES: DestinationCategory[] = [
  { id: 'all', label: 'All', emoji: '', iconId: 'all' },
  { id: 'beaches', label: 'Beaches', emoji: '', iconId: 'beaches' },
  { id: 'mountains', label: 'Mountains', emoji: '', iconId: 'mountains' },
  { id: 'cities', label: 'Cities', emoji: '', iconId: 'cities' },
  { id: 'food', label: 'Food', emoji: '', iconId: 'food' },
  { id: 'adventure', label: 'Adventure', emoji: '', iconId: 'adventure' },
  { id: 'budget', label: 'Budget', emoji: '', iconId: 'budget' },
  { id: 'couples', label: 'Couples', emoji: '', iconId: 'couples' },
];

// ---------------------------------------------------------------------------
// Budget tiers — text only
// ---------------------------------------------------------------------------
export interface BudgetTier {
  id: string;
  label: string;
  emoji: string;
  range: string;
  vibe: string;
}

export const BUDGETS: BudgetTier[] = [
  { id: 'backpacker', label: 'Budget-friendly', emoji: '', range: '$0–75/day', vibe: 'Hostels, street food, and great memories' },
  { id: 'comfort', label: 'Comfortable', emoji: '', range: '$75–200/day', vibe: 'Nice stays without overdoing it' },
  { id: 'treat-yourself', label: 'Treat myself', emoji: '', range: '$200–500/day', vibe: "You deserve it — let's make it special" },
  { id: 'no-budget', label: 'No limits', emoji: '', range: '$500+/day', vibe: 'Splurge on what matters most' },
];

// ---------------------------------------------------------------------------
// Vibe tags — text only
// ---------------------------------------------------------------------------
export interface Vibe {
  id: string;
  label: string;
  emoji: string;
}

export const VIBES: Vibe[] = [
  { id: 'local-eats', label: 'Local Eats', emoji: '' },
  { id: 'hidden-gems', label: 'Hidden Gems', emoji: '' },
  { id: 'adrenaline', label: 'Adrenaline', emoji: '' },
  { id: 'sunset-chaser', label: 'Sunset Chaser', emoji: '' },
  { id: 'art-design', label: 'Art & Design', emoji: '' },
  { id: 'night-owl', label: 'Night Owl', emoji: '' },
  { id: 'slow-morning', label: 'Slow Mornings', emoji: '' },
  { id: 'deep-history', label: 'Deep History', emoji: '' },
  { id: 'beach-vibes', label: 'Beach Vibes', emoji: '' },
  { id: 'market-hopper', label: 'Market Hopper', emoji: '' },
  { id: 'nature-escape', label: 'Nature Escape', emoji: '' },
  { id: 'solo-friendly', label: 'Solo Friendly', emoji: '' },
  { id: 'date-night', label: 'Date Night', emoji: '' },
  { id: 'photo-worthy', label: 'Photo Worthy', emoji: '' },
  { id: 'wellness', label: 'Wellness', emoji: '' },
  { id: 'off-grid', label: 'Off the Grid', emoji: '' },
];

// ---------------------------------------------------------------------------
// Rotating editorial headers — warm, welcoming, human
// ---------------------------------------------------------------------------
export const DISCOVER_HEADERS: string[] = [
  'Travel like you know someone there',
  'Pick a place. We handle the rest.',
  '30 seconds to your next trip.',
  'Some trips plan themselves. This is one.',
  'Tell us where. We tell you everything.',
  'Real recs from someone who\u2019s been',
  'Where to next? We\u2019ve got opinions.',
];

// ---------------------------------------------------------------------------
// Chat conversation starters
// ---------------------------------------------------------------------------
export const CHAT_STARTERS: string[] = [
  'Where should I go?',
  'What should I pack for Tokyo in April?',
  'Best ramen in Tokyo under $15?',
  'Is Bali worth it right now?',
  'How do I get a SIM in Thailand?',
  "What's actually worth seeing in Paris?",
  'Best neighborhoods in Mexico City?',
];

// ---------------------------------------------------------------------------
// Pet Travel Hub — no emojis
// ---------------------------------------------------------------------------
export interface PetDestination {
  city: string;
  emoji: string;
  petScore: number;
  highlight: string;
}

export const PET_DESTINATIONS: PetDestination[] = [
  { city: 'Portland, OR', emoji: '', petScore: 5, highlight: 'Off-leash parks everywhere' },
  { city: 'San Diego, CA', emoji: '', petScore: 5, highlight: 'Dog beaches + pet hotels' },
  { city: 'Asheville, NC', emoji: '', petScore: 4, highlight: 'Trail-friendly + breweries' },
  { city: 'Denver, CO', emoji: '', petScore: 5, highlight: '300+ dog-friendly patios' },
  { city: 'Barcelona, Spain', emoji: '', petScore: 4, highlight: 'Pets welcome on transit' },
  { city: 'Amsterdam, Netherlands', emoji: '', petScore: 4, highlight: 'Bikes + dogs = culture' },
];

/** Pet type labels only — icons used instead of emoji */
export const PET_EMOJIS: Record<string, string[]> = {
  dog: ['Dog'],
  cat: ['Cat'],
  other: ['Pet'],
};

// Group trip expense categories
export const EXPENSE_CATEGORIES = [
  { id: 'food', label: 'Food' },
  { id: 'transport', label: 'Transport' },
  { id: 'accommodation', label: 'Accommodation' },
  { id: 'activity', label: 'Activity' },
  { id: 'drinks', label: 'Drinks' },
  { id: 'other', label: 'Other' },
] as const;

export const ROVER_AFFILIATE_URL =
  'https://www.rover.com/search/?utm_source=roamapp&utm_medium=affiliate&utm_campaign=pet_tab';
export const WAG_AFFILIATE_URL =
  'https://wagwalking.com/?utm_source=roamapp';

// =============================================================================
// Shared types, constants and styles for Prep tab sub-components
// =============================================================================
import { StyleSheet, type ViewStyle, type TextStyle } from 'react-native';
import { COLORS, FONTS, SPACING, RADIUS } from '../../lib/constants';

// ---------------------------------------------------------------------------
// Section pill types
// ---------------------------------------------------------------------------
export type SectionId =
  | 'schedule'
  | 'overview'
  | 'currency'
  | 'connectivity'
  | 'culture'
  | 'packing'
  | 'jetlag'
  | 'crowds'
  | 'emergency'
  | 'health'
  | 'language'
  | 'visa';

export const SECTIONS: Array<{ id: SectionId; label: string }> = [
  { id: 'schedule', label: 'Schedule' },
  { id: 'overview', label: 'Overview' },
  { id: 'packing', label: 'Packing' },
  { id: 'jetlag', label: 'Jet Lag' },
  { id: 'crowds', label: 'Crowds' },
  { id: 'emergency', label: 'Emergency' },
  { id: 'health', label: 'Health' },
  { id: 'language', label: 'Language' },
  { id: 'visa', label: 'Visa' },
  { id: 'currency', label: 'Currency' },
  { id: 'connectivity', label: 'SIM & WiFi' },
  { id: 'culture', label: 'Culture' },
];

// ---------------------------------------------------------------------------
// E-Visa apply URLs (local, no network)
// ---------------------------------------------------------------------------
export const E_VISA_URLS: Record<string, string> = {
  TR: 'https://www.evisa.gov.tr',
  IN: 'https://indianvisaonline.gov.in',
  VN: 'https://evisa.xuatnhapcanh.gov.vn',
  AU: 'https://www.eta.homeaffairs.gov.au',
  NZ: 'https://www.immigration.govt.nz/nzeta',
  US: 'https://esta.cbp.dhs.gov',
};

// ---------------------------------------------------------------------------
// Survival phrase keys
// ---------------------------------------------------------------------------
export const SURVIVAL_PHRASE_KEYS = [
  'Hello',
  'Thank you',
  'Thank You',
  'Help',
  'Help!',
  'Where is',
  'Where is...?',
  'How much',
  'How much?',
  'I need a doctor',
];

// ---------------------------------------------------------------------------
// Schedule slot defaults
// ---------------------------------------------------------------------------
export const SLOT_DEFAULTS: Record<string, string> = {
  morning: '9:00 AM',
  afternoon: '2:00 PM',
  evening: '6:00 PM',
};

// ---------------------------------------------------------------------------
// Shared apiCardStyles (used by WeatherSection, EntryRequirements, etc.)
// ---------------------------------------------------------------------------
export const apiCardStyles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.bgMagazine,
    borderRadius: RADIUS.lg,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.sage,
    padding: SPACING.md,
  } as ViewStyle,
  sectionLabel: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    color: COLORS.sage,
    letterSpacing: 1.5,
    marginBottom: SPACING.sm,
  } as TextStyle,
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.sm,
    marginBottom: SPACING.xs,
  } as ViewStyle,
  rowText: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: COLORS.cream,
    flex: 1,
    lineHeight: 18,
  } as TextStyle,
  dot: {
    width: 5,
    height: 5,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.sage,
    marginTop: 6,
  } as ViewStyle,
  weatherHero: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    marginBottom: SPACING.md,
  } as ViewStyle,
  weatherEmoji: {
    fontSize: 36,
    lineHeight: 44,
  } as TextStyle,
  weatherTemp: {
    fontFamily: FONTS.header,
    fontSize: 32,
    color: COLORS.cream,
    lineHeight: 36,
  } as TextStyle,
  weatherCondition: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: COLORS.creamMuted,
    marginTop: 2,
  } as TextStyle,
  weatherGrid: {
    flexDirection: 'row',
    gap: SPACING.sm,
  } as ViewStyle,
  weatherStat: {
    flex: 1,
    alignItems: 'center',
    gap: SPACING.xs,
    backgroundColor: COLORS.bgElevated,
    borderRadius: RADIUS.md,
    paddingVertical: SPACING.sm,
  } as ViewStyle,
  weatherStatLabel: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    color: COLORS.creamMuted,
    letterSpacing: 0.5,
  } as TextStyle,
  weatherStatValue: {
    fontFamily: FONTS.mono,
    fontSize: 13,
    color: COLORS.cream,
  } as TextStyle,
});

// ---------------------------------------------------------------------------
// Shared styles used across multiple section components
// ---------------------------------------------------------------------------
export const sharedStyles = StyleSheet.create({
  tabContent: {
    paddingHorizontal: 20,
    marginBottom: 40,
  } as ViewStyle,
  noDataText: {
    fontFamily: FONTS.body,
    fontSize: 14,
    color: COLORS.creamMuted,
    textAlign: 'center',
    lineHeight: 20,
  } as TextStyle,
  noDataWrap: {
    paddingVertical: SPACING.xl,
    alignItems: 'center',
  } as ViewStyle,
  noDataTitle: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 16,
    color: COLORS.cream,
    marginBottom: SPACING.sm,
    textAlign: 'center',
  } as TextStyle,
  infoCard: {
    backgroundColor: COLORS.bgMagazine,
    borderRadius: RADIUS.lg,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.sage,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
  } as ViewStyle,
  infoCardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.xs,
  } as ViewStyle,
  infoCardLabel: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    color: COLORS.sage,
    letterSpacing: 1,
  } as TextStyle,
  infoCardBody: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: COLORS.cream,
    lineHeight: 18,
  } as TextStyle,
  bodyIntelCta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginTop: SPACING.lg,
    padding: SPACING.md,
    backgroundColor: COLORS.bgMagazine,
    borderRadius: RADIUS.lg,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.sage,
  } as ViewStyle,
  bodyIntelCtaTitle: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 14,
    color: COLORS.sage,
  } as TextStyle,
  bodyIntelCtaSubtitle: {
    fontFamily: FONTS.body,
    fontSize: 12,
    color: COLORS.creamMuted,
    marginTop: 2,
  } as TextStyle,
  currencySectionLabel: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    color: COLORS.sage,
    letterSpacing: 1,
    marginTop: SPACING.lg,
    marginBottom: SPACING.sm,
  } as TextStyle,
  currencyTipRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.sm,
    marginBottom: SPACING.xs,
  } as ViewStyle,
  currencyTipDot: {
    width: 5,
    height: 5,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.sage,
    marginTop: 6,
  } as ViewStyle,
  currencyTipText: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: COLORS.cream,
    flex: 1,
    lineHeight: 18,
  } as TextStyle,
  healthSectionLabel: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    color: COLORS.sage,
    marginBottom: SPACING.sm,
  } as TextStyle,
});

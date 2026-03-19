// =============================================================================
// ROAM — Flights Tab Styles (Premium Redesign)
// Generous whitespace, clear hierarchy, consistent cards.
// =============================================================================
import { Dimensions, StyleSheet, type ImageStyle, type TextStyle, type ViewStyle } from 'react-native';
import { COLORS, FONTS, SPACING, RADIUS, MAGAZINE } from '../../lib/constants';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  } as ViewStyle,
  fill: {
    flex: 1,
  } as ViewStyle,
  scrollContent: {
    paddingBottom: 120,
  } as ViewStyle,

  // ── Hero ──
  hero: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.xl,
    paddingBottom: SPACING.xl,
  } as ViewStyle,
  heroTitle: {
    fontFamily: FONTS.header,
    fontSize: 36,
    color: COLORS.cream,
    lineHeight: 42,
    letterSpacing: -1,
  } as TextStyle,
  heroSub: {
    fontFamily: FONTS.body,
    fontSize: 16,
    color: COLORS.creamDim,
    marginTop: SPACING.sm,
    lineHeight: 24,
    maxWidth: '85%',
  } as TextStyle,

  // ── Search Card ──
  searchCard: {
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.xl,
    gap: SPACING.lg,
  } as ViewStyle,
  fromToRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: SPACING.sm,
  } as ViewStyle,
  inputColumn: {
    flex: 1,
    gap: SPACING.sm,
  } as ViewStyle,
  inputLabel: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    color: COLORS.sage,
    letterSpacing: 1,
  } as TextStyle,
  inputWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    backgroundColor: COLORS.surface1,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: SPACING.md,
    height: 48,
    position: 'relative',
    zIndex: 10,
  } as ViewStyle,
  inputFocused: {
    borderColor: COLORS.sage,
  } as ViewStyle,
  input: {
    flex: 1,
    fontFamily: FONTS.body,
    fontSize: 16,
    color: COLORS.cream,
    padding: 0,
  } as TextStyle,
  swapBtn: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.surface1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.xs,
    borderWidth: 1,
    borderColor: COLORS.border,
  } as ViewStyle,
  dateRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
  } as ViewStyle,
  passengersRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  } as ViewStyle,
  passengersLabel: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    color: COLORS.sage,
    letterSpacing: 1,
  } as TextStyle,
  counter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  } as ViewStyle,
  counterBtn: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.surface1,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  } as ViewStyle,
  counterValue: {
    fontFamily: FONTS.mono,
    fontSize: 16,
    color: COLORS.cream,
    width: 24,
    textAlign: 'center',
  } as TextStyle,
  searchBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    height: 52,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.sage,
  } as ViewStyle,
  searchBtnText: {
    fontFamily: FONTS.header,
    fontSize: 16,
    color: COLORS.bg,
  } as TextStyle,

  // ── Section Headers ──
  sectionHeader: {
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.md,
  } as ViewStyle,
  sectionLabel: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    color: COLORS.sage,
    letterSpacing: 3,
    marginBottom: SPACING.sm,
  } as TextStyle,
  sectionTitle: {
    fontFamily: FONTS.header,
    fontSize: 20,
    color: COLORS.cream,
    letterSpacing: -0.3,
    lineHeight: 26,
  } as TextStyle,

  // ── Popular Routes ──
  routeScroll: {
    paddingHorizontal: SPACING.lg,
    gap: SPACING.md,
    paddingBottom: SPACING.sm,
    marginBottom: SPACING.xl,
  } as ViewStyle,
  routeCard: {
    width: (SCREEN_WIDTH - SPACING.lg * 2 - SPACING.md * 2) / 3,
    height: 160,
    borderRadius: RADIUS.xl,
    overflow: 'hidden',
  } as ViewStyle,
  routeImage: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  } as ImageStyle,
  routeContent: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: SPACING.sm,
  } as ViewStyle,
  routeCodeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    marginBottom: SPACING.xs,
  } as ViewStyle,
  routeCode: {
    fontFamily: FONTS.mono,
    fontSize: 12,
    color: COLORS.cream,
    letterSpacing: 1,
  } as TextStyle,
  routeLabel: {
    fontFamily: FONTS.body,
    fontSize: 11,
    color: COLORS.creamSoft,
    marginBottom: SPACING.xs,
  } as TextStyle,
  routeBottom: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  } as ViewStyle,
  routePrice: {
    fontFamily: FONTS.mono,
    fontSize: 16,
    color: COLORS.cream,
    lineHeight: 20,
  } as TextStyle,
  routeSearchText: {
    fontFamily: FONTS.body,
    fontSize: 10,
    color: COLORS.sage,
    letterSpacing: 0.3,
  } as TextStyle,

  // ── Inspiration ──
  inspirationScroll: {
    paddingHorizontal: SPACING.lg,
    gap: SPACING.md,
    paddingBottom: SPACING.xl,
  } as ViewStyle,
  inspirationCard: {
    width: 200,
    height: 260,
    borderRadius: RADIUS.xl,
    overflow: 'hidden',
  } as ViewStyle,
  inspirationImage: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  } as ImageStyle,
  inspirationContent: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: SPACING.md,
  } as ViewStyle,
  inspirationMonthBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    marginBottom: SPACING.xs,
  } as ViewStyle,
  inspirationMonthText: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    color: COLORS.sage,
    letterSpacing: 1,
  } as TextStyle,
  inspirationDest: {
    fontFamily: FONTS.header,
    fontSize: 20,
    color: COLORS.cream,
  } as TextStyle,
  inspirationReason: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: COLORS.creamSoft,
    marginTop: SPACING.xs,
    lineHeight: 18,
  } as TextStyle,

  // ── Disclaimer ──
  disclaimer: {
    fontFamily: FONTS.body,
    fontSize: 11,
    color: COLORS.creamDim,
    textAlign: 'center',
    paddingHorizontal: SPACING.xl,
    marginTop: SPACING.md,
    lineHeight: 16,
  } as TextStyle,
  layoverBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    marginHorizontal: SPACING.lg,
    marginTop: SPACING.xl,
    padding: SPACING.lg,
    backgroundColor: COLORS.surface1,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.sage,
  } as ViewStyle,
  layoverTitle: {
    fontFamily: FONTS.header,
    fontSize: 20,
    color: COLORS.cream,
  } as TextStyle,
  layoverSub: {
    fontFamily: FONTS.body,
    fontSize: 14,
    color: COLORS.creamSoft,
    marginTop: 2,
  } as TextStyle,

  // ── Amadeus Real-Time Prices ──
  amadeusSection: {
    paddingHorizontal: SPACING.lg,
    marginTop: SPACING.xl,
    marginBottom: SPACING.md,
    gap: SPACING.sm,
  } as ViewStyle,
  amadeusCard: {
    backgroundColor: COLORS.surface1,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.lg,
  } as ViewStyle,
  amadeusCardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  } as ViewStyle,
  amadeusAirlineCode: {
    fontFamily: FONTS.mono,
    fontSize: 13,
    color: COLORS.sage,
    letterSpacing: 1,
    width: 44,
  } as TextStyle,
  amadeusRouteCol: {
    flex: 1,
    gap: 2,
  } as ViewStyle,
  amadeusTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  } as ViewStyle,
  amadeusTime: {
    fontFamily: FONTS.mono,
    fontSize: 14,
    color: COLORS.cream,
  } as TextStyle,
  amadeusMeta: {
    fontFamily: FONTS.body,
    fontSize: 12,
    color: COLORS.creamDim,
    lineHeight: 16,
  } as TextStyle,
  amadeusPriceCol: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  } as ViewStyle,
  amadeusPrice: {
    fontFamily: FONTS.mono,
    fontSize: 18,
    color: COLORS.cream,
    letterSpacing: -0.3,
  } as TextStyle,
  // Skeleton
  amadeusSkeletonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.xs,
  } as ViewStyle,
  amadeusSkeletonCode: {
    width: 44,
    height: 14,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.surface2,
  } as ViewStyle,
  amadeusSkeletonFill: {
    flex: 1,
    height: 14,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.surface2,
  } as ViewStyle,
  amadeusSkeletonPrice: {
    width: 56,
    height: 20,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.surface2,
  } as ViewStyle,
  amadeusSkeletonMeta: {
    width: 120,
    height: 12,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.surface2,
    marginTop: 2,
  } as ViewStyle,

  // ── Sonar flight intel ──
  sonarSection: {
    paddingHorizontal: SPACING.lg,
    marginTop: SPACING.xl,
  } as ViewStyle,
  sonarSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.xs,
  } as ViewStyle,
  sonarCard: {
    backgroundColor: COLORS.surface1,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.sage,
    padding: SPACING.lg,
    marginTop: SPACING.md,
  } as ViewStyle,
  sonarAnswer: {
    fontFamily: FONTS.body,
    fontSize: 16,
    color: COLORS.cream,
    lineHeight: 24,
  } as TextStyle,

  // ── Alternative routes (Rome2Rio) — compact list ──
  apiSection: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.xl,
  } as ViewStyle,
  apiSectionLabel: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    color: COLORS.sage,
    letterSpacing: 2,
    marginBottom: SPACING.xs,
  } as TextStyle,
  apiSectionHeading: {
    fontFamily: FONTS.header,
    fontSize: 20,
    color: COLORS.cream,
    letterSpacing: -0.3,
    marginBottom: SPACING.md,
  } as TextStyle,
  apiCardStack: {
    gap: SPACING.sm,
  } as ViewStyle,
  apiCard: {
    backgroundColor: COLORS.surface1,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.lg,
    gap: 4,
  } as ViewStyle,
  apiCardName: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 16,
    color: COLORS.cream,
  } as TextStyle,
  apiCardMeta: {
    fontFamily: FONTS.mono,
    fontSize: 12,
    color: COLORS.sage,
  } as TextStyle,
  apiCardSub: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: COLORS.creamDim,
  } as TextStyle,
  airportGuideBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.surface1,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
  } as ViewStyle,
  airportGuideBtnTitle: {
    fontFamily: FONTS.headerMedium,
    fontSize: 14,
    color: COLORS.cream,
  } as TextStyle,
  fallbackContainer: { paddingVertical: SPACING.md, alignItems: 'center' } as ViewStyle,
  fallbackText: { color: COLORS.muted, fontSize: 14, fontFamily: FONTS.body } as TextStyle,
});

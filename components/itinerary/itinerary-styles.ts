// =============================================================================
// ROAM — Extracted Styles
// From app/itinerary.tsx for file size management.
// =============================================================================
import { Dimensions, StyleSheet, type ImageStyle, type TextStyle, type ViewStyle } from 'react-native';
import { COLORS, FONTS, SPACING, RADIUS, MAGAZINE } from '../../lib/constants';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export const styles = StyleSheet.create({
  // ── Screen ──────────────────────────────────────────────────────────────
  screen: {
    flex: 1,
    backgroundColor: COLORS.bg,
  } as ViewStyle,

  // ── Header ──────────────────────────────────────────────────────────────
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  } as ViewStyle,
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  } as ViewStyle,
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  } as ViewStyle,
  headerBtn: {
    width: 36,
    height: 36,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.bgGlass,
    alignItems: 'center',
    justifyContent: 'center',
  } as ViewStyle,
  headerBtnText: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 16,
    color: COLORS.cream,
  } as TextStyle,
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontFamily: FONTS.headerMedium,
    fontSize: 18,
    color: COLORS.cream,
    marginHorizontal: SPACING.sm,
  } as TextStyle,

  // ── View toggle (List / Map) ───────────────────────────────────────────
  viewToggle: {
    flexDirection: 'row',
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
  } as ViewStyle,
  viewToggleBtn: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
  } as ViewStyle,
  viewToggleBtnActive: {
    backgroundColor: COLORS.sageLight,
  } as ViewStyle,
  viewToggleText: {
    fontFamily: FONTS.monoMedium,
    fontSize: 11,
    color: COLORS.creamMutedLight,
    letterSpacing: 0.5,
  } as TextStyle,
  viewToggleTextActive: {
    color: COLORS.sage,
  } as TextStyle,

  // ── Explore Map button ──────────────────────────────────────────────────
  mapExploreBtn: {
    backgroundColor: COLORS.sageSubtle,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
    borderColor: COLORS.sageBorder,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 5,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  } as ViewStyle,
  mapExploreBtnText: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    color: COLORS.sage,
    letterSpacing: 0.5,
  } as TextStyle,
  hereNowPill: {
    backgroundColor: COLORS.sage,
    borderRadius: RADIUS.pill,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 5,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  } as ViewStyle,
  hereNowPillText: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    color: COLORS.bg,
    letterSpacing: 0.5,
  } as TextStyle,

  // ── Scroll ──────────────────────────────────────────────────────────────
  scrollView: {
    flex: 1,
  } as ViewStyle,
  scrollContent: {
    paddingHorizontal: 0,
    paddingTop: 0,
  } as ViewStyle,

  // ── Hero (cinematic) ────────────────────────────────────────────────────
  heroWrapper: {
    width: SCREEN_WIDTH,
    height: 340,
    marginBottom: SPACING.lg,
  } as ViewStyle,
  heroImage: {
    flex: 1,
    width: '100%',
    justifyContent: 'flex-end',
  } as ViewStyle,
  heroGradient: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.xl,
    paddingBottom: SPACING.xl + 8,
    justifyContent: 'flex-end',
    flex: 1,
  } as ViewStyle,
  heroDestination: {
    fontFamily: FONTS.header,
    fontSize: 44,
    color: COLORS.cream,
    letterSpacing: -1,
    marginBottom: SPACING.xs,
  } as TextStyle,
  heroTagline: {
    fontFamily: FONTS.header,
    fontSize: 18,
    color: COLORS.slateBright,
    lineHeight: 26,
    marginBottom: SPACING.sm,
  } as TextStyle,
  heroMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  } as ViewStyle,
  heroMetaText: {
    fontFamily: FONTS.mono,
    fontSize: 12,
    color: COLORS.sage,
    letterSpacing: 1,
  } as TextStyle,
  mockBadgeWrap: {
    marginTop: SPACING.sm,
  } as ViewStyle,

  // ── Share CTA ────────────────────────────────────────────────────────────
  stealCtaCard: {
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
  } as ViewStyle,
  stealCtaGradient: {
    padding: SPACING.lg,
  } as ViewStyle,
  stealCtaTitle: {
    fontFamily: FONTS.header,
    fontSize: 20,
    color: COLORS.bg,
  } as TextStyle,
  stealCtaSub: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: COLORS.bgDarkGreen80,
    marginTop: SPACING.xs,
  } as TextStyle,
  shareCtaCard: {
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.successBorder,
    overflow: 'hidden',
  } as ViewStyle,
  shareCtaGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    gap: SPACING.md,
  } as ViewStyle,
  shareCtaIconWrap: {
    marginRight: SPACING.sm,
  } as ViewStyle,
  shareCtaContent: {
    flex: 1,
  } as ViewStyle,
  shareCtaTitle: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 16,
    color: COLORS.cream,
  } as TextStyle,
  shareCtaSub: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: COLORS.sage,
    marginTop: 2,
  } as TextStyle,
  shareCtaArrow: {
    fontSize: 20,
    color: COLORS.sage,
  } as TextStyle,

  shareNudge: {
    marginHorizontal: SPACING.lg,
    marginBottom: SPACING.md,
  } as ViewStyle,
  shareNudgeInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    backgroundColor: COLORS.bgCard,
    borderWidth: 1,
    borderColor: COLORS.sageBorder,
    borderRadius: RADIUS.lg,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
  } as ViewStyle,
  shareNudgeTitle: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 15,
    color: COLORS.cream,
  } as TextStyle,
  shareNudgeSub: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    color: COLORS.sage,
    marginTop: 1,
  } as TextStyle,

  countdownBanner: {
    marginHorizontal: SPACING.lg,
    marginBottom: SPACING.md,
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
  } as ViewStyle,
  countdownBannerInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
  } as ViewStyle,
  countdownBannerTitle: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 15,
    color: COLORS.cream,
  } as TextStyle,
  countdownBannerSub: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    color: COLORS.creamMuted,
    marginTop: 1,
  } as TextStyle,
  countdownBannerArrow: {
    fontSize: 20,
    color: COLORS.cream,
  } as TextStyle,

  itineraryExtrasRow: {
    flexDirection: 'row',
    gap: SPACING.md,
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.md,
  } as ViewStyle,
  itineraryExtraCard: {
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.successBorderLight,
    overflow: 'hidden',
  } as ViewStyle,
  itineraryExtraGradient: {
    padding: SPACING.md,
    alignItems: 'center',
    gap: SPACING.xs,
  } as ViewStyle,
  itineraryExtraIconWrap: {
    marginBottom: SPACING.xs,
  } as ViewStyle,
  itineraryExtraTitle: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 14,
    color: COLORS.cream,
  } as TextStyle,
  itineraryExtraSub: {
    fontFamily: FONTS.body,
    fontSize: 11,
    color: COLORS.creamMuted,
  } as TextStyle,

  // ── Save trip CTA ───────────────────────────────────────────────────────
  saveTripCard: {
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.successBorderMedium,
    overflow: 'hidden',
  } as ViewStyle,
  saveTripGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.lg,
    gap: SPACING.md,
  } as ViewStyle,
  saveTripContent: {
    flex: 1,
  } as ViewStyle,
  saveTripTitle: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 17,
    color: COLORS.cream,
  } as TextStyle,
  saveTripSub: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: COLORS.sage,
    marginTop: 2,
  } as TextStyle,
  saveTripCta: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 14,
    color: COLORS.sage,
  } as TextStyle,

  // ── Day theme editorial headline ────────────────────────────────────────
  dayThemeHero: {
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.lg,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: SPACING.lg,
  } as ViewStyle,
  dayThemeHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: SPACING.sm,
    marginBottom: SPACING.xs,
  } as ViewStyle,
  dayThemeNumber: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    color: COLORS.sage,
    letterSpacing: 2,
  } as TextStyle,
  dayWeatherBadge: {
    backgroundColor: COLORS.sageSubtle,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: COLORS.sageBorder,
  } as ViewStyle,
  dayWeatherBadgeText: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    color: COLORS.sage,
    letterSpacing: 0.3,
  } as TextStyle,
  dayThemeTitle: {
    fontFamily: FONTS.header,
    fontSize: 28,
    color: COLORS.cream,
    lineHeight: 34,
    letterSpacing: -0.3,
  } as TextStyle,

  // ── Sections ────────────────────────────────────────────────────────────
  section: {
    marginBottom: SPACING.md,
    paddingHorizontal: SPACING.lg,
  } as ViewStyle,

  // ── Glass card ──────────────────────────────────────────────────────────
  glassCard: {
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderTopColor: COLORS.border,
    borderTopWidth: 1,
    padding: SPACING.md,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  } as ViewStyle,

  fallbackVenueCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.md,
  } as ViewStyle,
  fallbackVenueContent: { flex: 1 } as ViewStyle,
  fallbackVenueName: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 15,
    color: COLORS.cream,
  } as TextStyle,
  fallbackVenueAction: {
    fontFamily: FONTS.mono,
    fontSize: 12,
    color: COLORS.sage,
    marginTop: SPACING.xs,
  } as TextStyle,

  // ── Tagline + budget summary ────────────────────────────────────────────
  tagline: {
    fontFamily: FONTS.header,
    fontSize: 24,
    color: COLORS.cream,
    lineHeight: 30,
    marginBottom: SPACING.md,
  } as TextStyle,
  totalBudgetRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.bgGlass,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  } as ViewStyle,
  totalBudgetLabel: {
    fontFamily: FONTS.mono,
    fontSize: 12,
    color: COLORS.sage,
    letterSpacing: 1,
    textTransform: 'uppercase',
  } as TextStyle,
  totalBudgetValue: {
    fontFamily: FONTS.header,
    fontSize: 26,
    color: COLORS.cream,
  } as TextStyle,

  // ── Budget breakdown ────────────────────────────────────────────────────
  sectionLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  } as ViewStyle,
  sectionLabel: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    color: COLORS.sage,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  } as TextStyle,
  budgetRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
  } as ViewStyle,
  budgetRowLabel: {
    fontFamily: FONTS.body,
    fontSize: 15,
    color: COLORS.cream,
  } as TextStyle,
  budgetRowValue: {
    fontFamily: FONTS.monoMedium,
    fontSize: 14,
    color: COLORS.cream,
  } as TextStyle,
  budgetRowBold: {
    fontFamily: FONTS.bodySemiBold,
    color: COLORS.sage,
    fontSize: 16,
  } as TextStyle,
  budgetDivider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: SPACING.xs,
  } as ViewStyle,

  // ── Day tabs ────────────────────────────────────────────────────────────
  dayTabsScroll: {
    flexGrow: 0,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  } as ViewStyle,
  dayTabsContainer: {
    paddingVertical: SPACING.md,
  } as ViewStyle,
  dayTab: {
    width: SCREEN_WIDTH,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.lg,
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
  } as ViewStyle,
  dayTabActive: {
    backgroundColor: COLORS.sageLight,
    borderColor: COLORS.sage,
  } as ViewStyle,
  dayTabTheme: {
    fontFamily: FONTS.header,
    fontSize: 22,
    color: COLORS.slateDim,
    lineHeight: 30,
    letterSpacing: -0.3,
    marginBottom: SPACING.xs,
  } as TextStyle,
  dayTabThemeActive: {
    color: COLORS.cream,
    fontFamily: FONTS.headerMedium,
    fontSize: 24,
  } as TextStyle,
  dayTabNumber: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    color: COLORS.creamMuted,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  } as TextStyle,
  dayTabNumberActive: {
    color: COLORS.sage,
  } as TextStyle,

  // ── Time slots ──────────────────────────────────────────────────────────
  timeSlotLabel: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    color: COLORS.sage,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginBottom: SPACING.sm,
  } as TextStyle,
  activityTitle: {
    fontFamily: FONTS.headerMedium,
    fontSize: 20,
    color: COLORS.cream,
    lineHeight: 26,
    marginBottom: SPACING.sm,
  } as TextStyle,
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    marginBottom: SPACING.sm,
  } as ViewStyle,
  locationPin: {
    fontSize: 14,
  } as TextStyle,
  locationText: {
    fontFamily: FONTS.body,
    fontSize: 14,
    color: COLORS.creamHighlight,
    flex: 1,
  } as TextStyle,
  activityMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.sm,
    gap: SPACING.md,
  } as ViewStyle,
  neighborhoodRow: {
    flex: 1,
  } as ViewStyle,
  neighborhoodLabel: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    color: COLORS.sage,
    letterSpacing: 1,
    marginBottom: 2,
  } as TextStyle,
  neighborhoodValue: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 14,
    color: COLORS.cream,
  } as TextStyle,
  tipCard: {
    backgroundColor: COLORS.successFaint,
    borderRadius: RADIUS.md,
    padding: SPACING.sm,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.gold,
  } as ViewStyle,
  tipLabel: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    color: COLORS.sage,
    letterSpacing: 1,
    marginBottom: SPACING.xs,
  } as TextStyle,
  tipText: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: COLORS.creamBright,
    lineHeight: 19,
  } as TextStyle,
  costBadge: {
    alignSelf: 'flex-start',
    backgroundColor: COLORS.bgGlass,
    borderRadius: RADIUS.sm,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
  } as ViewStyle,
  costText: {
    fontFamily: FONTS.monoMedium,
    fontSize: 13,
    color: COLORS.sage,
  } as TextStyle,

  // ── Accommodation ───────────────────────────────────────────────────────
  accommodationName: {
    fontFamily: FONTS.headerMedium,
    fontSize: 18,
    color: COLORS.cream,
    marginBottom: SPACING.xs,
  } as TextStyle,
  accommodationMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  } as ViewStyle,
  accommodationType: {
    fontFamily: FONTS.body,
    fontSize: 14,
    color: COLORS.creamSoft,
  } as TextStyle,
  accommodationPrice: {
    fontFamily: FONTS.monoMedium,
    fontSize: 14,
    color: COLORS.sage,
  } as TextStyle,

  // ── Daily total ─────────────────────────────────────────────────────────
  dailyTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  } as ViewStyle,
  dailyTotalLabel: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 15,
    color: COLORS.cream,
  } as TextStyle,
  dailyTotalValue: {
    fontFamily: FONTS.header,
    fontSize: 24,
    color: COLORS.sage,
  } as TextStyle,

  // ── Pro Tip ─────────────────────────────────────────────────────────────
  proTipLabel: {
    fontFamily: FONTS.monoMedium,
    fontSize: 11,
    color: COLORS.gold,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginBottom: SPACING.sm,
  } as TextStyle,
  proTipText: {
    fontFamily: FONTS.body,
    fontSize: 15,
    color: COLORS.cream,
    lineHeight: 22,
  } as TextStyle,

  // ── Visa Info ───────────────────────────────────────────────────────────
  visaLabel: {
    fontFamily: FONTS.monoMedium,
    fontSize: 11,
    color: COLORS.sage,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginBottom: SPACING.sm,
  } as TextStyle,
  visaText: {
    fontFamily: FONTS.body,
    fontSize: 15,
    color: COLORS.cream,
    lineHeight: 22,
  } as TextStyle,



  // ── Affiliate cards ─────────────────────────────────────────────────────
  affiliateGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: RADIUS.lg,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    gap: SPACING.sm,
  } as ViewStyle,
  affiliateContent: {
    flex: 1,
  } as ViewStyle,
  affiliateTitle: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 16,
    color: COLORS.white,
    marginBottom: 2,
  } as TextStyle,
  affiliateSubtitle: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: COLORS.whiteHighlight,
  } as TextStyle,
  affiliateArrow: {
    fontSize: 20,
    color: COLORS.white,
  } as TextStyle,

  // ── Share modal ─────────────────────────────────────────────────────────
  modalOverlay: {
    flex: 1,
    backgroundColor: COLORS.overlay,
    justifyContent: 'center',
    alignItems: 'center',
  } as ViewStyle,
  modalContent: {
    width: '100%',
    maxWidth: 400,
  } as ViewStyle,

  // ── Error / Loading ─────────────────────────────────────────────────────
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
  } as ViewStyle,
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
    gap: SPACING.lg,
  } as ViewStyle,
  errorIconWrap: {
    marginBottom: SPACING.md,
  } as ViewStyle,
  errorHint: {
    fontFamily: FONTS.body,
    fontSize: 14,
    color: COLORS.creamMuted,
    marginTop: SPACING.sm,
    textAlign: 'center',
  } as TextStyle,
  errorText: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 16,
    color: COLORS.coral,
    textAlign: 'center',
    marginBottom: SPACING.lg,
    lineHeight: 22,
  } as TextStyle,
  errorButton: {
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
  } as ViewStyle,
  errorButtonText: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 15,
    color: COLORS.cream,
  } as TextStyle,
  loadingText: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 18,
    color: COLORS.cream,
  } as TextStyle,
  loadingSubtext: {
    fontFamily: FONTS.mono,
    fontSize: 12,
    color: COLORS.sage,
    opacity: 0.7,
  } as TextStyle,
  loadingPulse: {
    width: 48,
    height: 48,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.sageLight,
    opacity: 0.4,
  } as ViewStyle,

  // ── Edit mode ─────────────────────────────────────────────────────────
  editBtnActive: {
    backgroundColor: COLORS.sage,
  } as ViewStyle,
  draggableWrapper: {
    marginBottom: SPACING.md,
  } as ViewStyle,
  draggableItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: SPACING.xs,
  } as ViewStyle,
  draggableItemActive: {
    opacity: 0.85,
    transform: [{ scale: 1.02 }],
  } as ViewStyle,
  dragHandle: {
    width: 28,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: SPACING.lg,
  } as ViewStyle,
  dragHandleText: {
    fontSize: 18,
    color: COLORS.sage,
    letterSpacing: 2,
  } as TextStyle,
  draggableContent: {
    flex: 1,
  } as ViewStyle,

  // ── Map view ──────────────────────────────────────────────────────────
  mapContainer: {
    flex: 1,
  } as ViewStyle,
  mapView: {
    flex: 1,
  } as ViewStyle,
  mapEmptyOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.bgCardOverlay,
  } as ViewStyle,
  mapEmptyText: {
    fontFamily: FONTS.body,
    fontSize: 15,
    color: COLORS.creamMuted,
  } as TextStyle,
  safetyToggle: {
    position: 'absolute',
    top: SPACING.md,
    right: SPACING.md,
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
  } as ViewStyle,
  safetyToggleActive: {
    borderColor: COLORS.sage,
    backgroundColor: COLORS.sageHighlight,
  } as ViewStyle,
  safetyToggleText: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    color: COLORS.cream,
    letterSpacing: 1,
  } as TextStyle,
  safetyLegend: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    marginTop: SPACING.xs,
  } as ViewStyle,
  safetyDot: {
    width: 6,
    height: 6,
    borderRadius: RADIUS.pill,
  } as ViewStyle,
  safetyLegendText: {
    fontFamily: FONTS.mono,
    fontSize: 9,
    color: COLORS.creamMuted,
    marginRight: SPACING.xs,
  } as TextStyle,

  // ── Map pins ──────────────────────────────────────────────────────────
  pinContainer: {
    alignItems: 'center',
  } as ViewStyle,
  pinCircle: {
    width: 32,
    height: 32,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.sage,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: COLORS.cream,
  } as ViewStyle,
  pinNumber: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 14,
    color: COLORS.cream,
  } as TextStyle,
  pinTail: {
    width: 0,
    height: 0,
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderTopWidth: 8,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: COLORS.sage,
    marginTop: -1,
  } as ViewStyle,

  // ── Map bottom sheet ──────────────────────────────────────────────────
  mapSheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.bg,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.sm,
    maxHeight: 320,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  } as ViewStyle,
  mapSheetHandle: {
    width: 36,
    height: 4,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.whiteDim,
    alignSelf: 'center',
    marginBottom: SPACING.sm,
  } as ViewStyle,
  directionsBtn: {
    backgroundColor: COLORS.sage,
    borderRadius: RADIUS.md,
    paddingVertical: SPACING.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: SPACING.sm,
  } as ViewStyle,
  directionsBtnInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  } as ViewStyle,
  directionsBtnText: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 15,
    color: COLORS.bg,
  } as TextStyle,

  // ── Transit styles ──────────────────────────────────────────────────────
  transitConnector: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    marginTop: SPACING.sm,
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  } as ViewStyle,
  transitText: {
    fontFamily: FONTS.mono,
    fontSize: 12,
    color: COLORS.sage,
    flex: 1,
  } as TextStyle,
  transitSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  } as ViewStyle,
  transitSectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  } as ViewStyle,
  transitExpandArrow: {
    fontFamily: FONTS.mono,
    fontSize: 12,
    color: COLORS.creamSoft,
  } as TextStyle,
  transitHeadline: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 15,
    color: COLORS.cream,
    marginTop: SPACING.sm,
    lineHeight: 22,
  } as TextStyle,
  transitExpanded: {
    marginTop: SPACING.md,
    gap: SPACING.md,
  } as ViewStyle,
  transitBlock: {
    gap: SPACING.sm,
  } as ViewStyle,
  transitBlockTitle: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    color: COLORS.creamSoft,
    letterSpacing: 1,
  } as TextStyle,
  transitBlockTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  } as ViewStyle,
  transitLineRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.sm,
  } as ViewStyle,
  transitLineDot: {
    width: 10,
    height: 10,
    borderRadius: RADIUS.pill,
    marginTop: SPACING.xs,
  } as ViewStyle,
  transitLineInfo: {
    flex: 1,
  } as ViewStyle,
  transitLineName: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 14,
    color: COLORS.cream,
  } as TextStyle,
  transitLineNote: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: COLORS.creamSoft,
    lineHeight: 18,
  } as TextStyle,
  transitPaymentCard: {
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.md,
    padding: SPACING.sm,
    gap: SPACING.xs,
  } as ViewStyle,
  transitPaymentMethod: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 14,
    color: COLORS.cream,
  } as TextStyle,
  transitPaymentHow: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: COLORS.creamSoft,
  } as TextStyle,
  transitPaymentCost: {
    fontFamily: FONTS.mono,
    fontSize: 13,
    color: COLORS.sage,
  } as TextStyle,
  transitPaymentTip: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: COLORS.gold,
    lineHeight: 18,
  } as TextStyle,
  transitTransferCard: {
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.md,
    padding: SPACING.sm,
    gap: SPACING.xs,
  } as ViewStyle,
  transitTransferHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  } as ViewStyle,
  transitTransferName: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 14,
    color: COLORS.cream,
    flex: 1,
  } as TextStyle,
  transitTransferCost: {
    fontFamily: FONTS.mono,
    fontSize: 14,
    color: COLORS.sage,
  } as TextStyle,
  transitTransferDuration: {
    fontFamily: FONTS.mono,
    fontSize: 12,
    color: COLORS.creamSoft,
  } as TextStyle,
  transitLateNight: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: COLORS.creamBrightDim,
    lineHeight: 20,
  } as TextStyle,
  transitMistakeRow: {
    flexDirection: 'row',
    gap: SPACING.xs,
    alignItems: 'flex-start',
  } as ViewStyle,
  transitMistakeDot: {
    fontFamily: FONTS.mono,
    fontSize: 13,
    color: COLORS.coral,
    marginTop: 1,
  } as TextStyle,
  transitMistakeText: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: COLORS.creamBrightDim,
    flex: 1,
    lineHeight: 18,
  } as TextStyle,
  transitMapsNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.xs,
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  } as ViewStyle,
  transitMapsText: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: COLORS.creamSoft,
    flex: 1,
    lineHeight: 18,
  } as TextStyle,

  // Medical & Safety Abroad styles
  medicalEmergencyRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginTop: SPACING.sm,
  } as ViewStyle,
  medicalNumberCard: {
    flex: 1,
    backgroundColor: COLORS.bgGlass,
    borderRadius: RADIUS.sm,
    padding: SPACING.sm,
    alignItems: 'center',
  } as ViewStyle,
  medicalNumberLabel: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    color: COLORS.creamSoft,
    letterSpacing: 1,
    marginBottom: SPACING.xs,
  } as TextStyle,
  medicalNumber: {
    fontFamily: FONTS.mono,
    fontSize: 18,
    color: COLORS.coral,
    fontWeight: '700',
  } as TextStyle,
  medicalQualityBadge: {
    fontFamily: FONTS.mono,
    fontSize: 12,
    color: COLORS.sage,
    letterSpacing: 1,
    marginBottom: SPACING.xs,
  } as TextStyle,
  medicalCost: {
    fontFamily: FONTS.mono,
    fontSize: 12,
    color: COLORS.gold,
    marginTop: SPACING.xs,
  } as TextStyle,
  medicalPriorityBadge: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderRadius: RADIUS.sm,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    marginBottom: SPACING.xs,
  } as ViewStyle,
  medicalPriorityText: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    letterSpacing: 1,
  } as TextStyle,

  // Destination Intel styles
  intelSummaryRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginTop: SPACING.sm,
    flexWrap: 'wrap',
  } as ViewStyle,
  intelChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    backgroundColor: COLORS.bgGlass,
    borderRadius: RADIUS.sm,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
  } as ViewStyle,
  intelChipLabel: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    color: COLORS.sage,
    letterSpacing: 0.5,
  } as TextStyle,
  intelChipValue: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    color: COLORS.creamSoft,
  } as TextStyle,
  intelDetail: {
    fontFamily: FONTS.body,
    fontSize: 12,
    color: COLORS.creamMuted,
    marginTop: SPACING.xs,
    lineHeight: 16,
  } as TextStyle,
  intelAqiBadge: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderRadius: RADIUS.sm,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    marginBottom: SPACING.xs,
  } as ViewStyle,
  intelAqiText: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    letterSpacing: 1,
  } as TextStyle,
  intelSunRow: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginBottom: SPACING.xs,
  } as ViewStyle,
  intelSunItem: {
    alignItems: 'center',
  } as ViewStyle,
  intelSunLabel: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    color: COLORS.creamMuted,
    letterSpacing: 1,
    marginBottom: 2,
  } as TextStyle,
  intelSunTime: {
    fontFamily: FONTS.mono,
    fontSize: 16,
    color: COLORS.gold,
  } as TextStyle,
  intelCostGrid: {
    flexDirection: 'row',
    gap: SPACING.sm,
  } as ViewStyle,
  intelCostCol: {
    flex: 1,
    backgroundColor: COLORS.bgGlass,
    borderRadius: RADIUS.sm,
    padding: SPACING.sm,
    alignItems: 'center',
  } as ViewStyle,
  intelCostTier: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    color: COLORS.creamMuted,
    letterSpacing: 1,
    marginBottom: SPACING.xs,
  } as TextStyle,
  intelCostTotal: {
    fontFamily: FONTS.mono,
    fontSize: 14,
    color: COLORS.sage,
    fontWeight: '700',
    marginBottom: 2,
  } as TextStyle,

  // ── Foursquare Tips ──────────────────────────────────────────────────────
  fsqTipsContainer: {
    marginTop: SPACING.xs,
    paddingHorizontal: SPACING.sm,
    gap: SPACING.xs,
  } as ViewStyle,
  fsqTipRow: {
    backgroundColor: COLORS.bgGlass,
    borderRadius: RADIUS.sm,
    padding: SPACING.sm,
  } as ViewStyle,
  fsqTipText: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: COLORS.muted,
    lineHeight: 18,
  } as TextStyle,
  fsqTipAgree: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    color: COLORS.sage,
    marginTop: 4,
  } as TextStyle,

  // ── GetYourGuide Experiences ─────────────────────────────────────────────
  gygSection: {
    marginTop: SPACING.md,
    paddingHorizontal: SPACING.md,
  } as ViewStyle,
  gygLabel: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    color: COLORS.muted,
    letterSpacing: 1,
    marginBottom: SPACING.sm,
  } as TextStyle,
  gygScroll: {
    flexGrow: 0,
  } as ViewStyle,
  gygCard: {
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    width: 200,
    marginRight: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
  } as ViewStyle,
  gygTitle: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 14,
    color: COLORS.cream,
    marginBottom: SPACING.xs,
  } as TextStyle,
  gygPrice: {
    fontFamily: FONTS.mono,
    fontSize: 12,
    color: COLORS.sage,
  } as TextStyle,
  gygRating: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    color: COLORS.muted,
    marginTop: 2,
  } as TextStyle,
});

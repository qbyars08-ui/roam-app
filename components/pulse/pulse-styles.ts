// =============================================================================
// ROAM — Pulse Tab Styles
// Premium redesign — generous whitespace, clear hierarchy, consistent cards.
// =============================================================================
import { StyleSheet, type TextStyle, type ViewStyle } from 'react-native';
import { COLORS, FONTS, SPACING, RADIUS } from '../../lib/constants';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  } as ViewStyle,

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
  } as ViewStyle,

  headerLabel: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    color: COLORS.sage,
    letterSpacing: 4,
  } as TextStyle,

  scrollContent: {
    paddingBottom: 120,
  } as ViewStyle,

  // ── Destination pill chip row ──
  destChipScroll: {
    marginBottom: SPACING.xl,
  } as ViewStyle,
  destChipRow: {
    paddingHorizontal: SPACING.lg,
    gap: SPACING.sm,
  } as ViewStyle,

  // ── Hero stat row ──
  heroStatRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.xl,
    gap: SPACING.sm,
  } as ViewStyle,
  heroStatText: {
    fontFamily: FONTS.mono,
    fontSize: 14,
    color: COLORS.creamSoft,
    letterSpacing: 0.3,
  } as TextStyle,
  heroStatDot: {
    fontFamily: FONTS.mono,
    fontSize: 14,
    color: COLORS.muted,
  } as TextStyle,

  // ── Sections ──
  section: {
    marginBottom: SPACING.xl,
    paddingHorizontal: SPACING.lg,
  } as ViewStyle,
  sectionLast: {
    marginBottom: 0,
  } as ViewStyle,
  sectionHeading: {
    fontFamily: FONTS.header,
    fontSize: 20,
    color: COLORS.cream,
    marginBottom: SPACING.xs,
    letterSpacing: -0.3,
    lineHeight: 26,
  } as TextStyle,
  sectionSubMono: {
    fontFamily: FONTS.mono,
    fontSize: 12,
    color: COLORS.creamSoft,
    marginBottom: SPACING.md,
    letterSpacing: 0.3,
  } as TextStyle,
  tipsLabel: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    color: COLORS.gold,
    letterSpacing: 3,
    marginBottom: SPACING.sm,
  } as TextStyle,
  seasonLabel: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    color: COLORS.sage,
    letterSpacing: 3,
    marginBottom: SPACING.sm,
  } as TextStyle,

  // ── Editorial card stack ──
  editorialStack: {
    gap: SPACING.md,
    marginTop: SPACING.md,
  } as ViewStyle,

  // ── Tips ──
  tipsStack: {
    marginTop: SPACING.md,
  } as ViewStyle,

  // ── Seasonal small cards ──
  seasonalSmallScroll: {
    marginLeft: -(SPACING.lg),
    marginRight: -(SPACING.lg),
  } as ViewStyle,
  seasonalSmallRow: {
    paddingHorizontal: SPACING.lg,
    gap: SPACING.md,
  } as ViewStyle,

  // ── Empty state ──
  emptyState: {
    alignItems: 'center',
    gap: SPACING.md,
    paddingVertical: SPACING.xl,
  } as ViewStyle,
  emptyText: {
    fontFamily: FONTS.body,
    fontSize: 14,
    color: COLORS.creamMuted,
    textAlign: 'center',
    lineHeight: 20,
  } as TextStyle,

  // ── Sonar live intel ──
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
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
  sonarCardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.sm,
  } as ViewStyle,
  sonarCardTitle: {
    fontFamily: FONTS.headerMedium,
    fontSize: 16,
    color: COLORS.cream,
  } as TextStyle,
  sonarSkeletonStack: {
    marginTop: SPACING.md,
  } as ViewStyle,
  sonarAnswer: {
    fontFamily: FONTS.body,
    fontSize: 16,
    color: COLORS.cream,
    lineHeight: 24,
  } as TextStyle,
  sonarTimestamp: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    color: COLORS.creamDim,
    marginTop: SPACING.sm,
  } as TextStyle,

  // ── Live Events ──
  liveEventsLabel: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    color: COLORS.sage,
    letterSpacing: 3,
    marginBottom: SPACING.sm,
  } as TextStyle,
  liveEventsStack: {
    marginTop: SPACING.md,
    gap: SPACING.sm,
  } as ViewStyle,

  // ── API integration sections ──
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

  // ── Venue cards (horizontal scroll) ──
  venueScrollRow: {
    gap: SPACING.md,
    paddingHorizontal: SPACING.lg,
  } as ViewStyle,
  venueCard: {
    width: 160,
    height: 200,
    borderRadius: RADIUS.xl,
    overflow: 'hidden',
    position: 'relative',
  } as ViewStyle,
  venuePhoto: {
    width: '100%',
    height: '100%',
  } as ViewStyle,
  venuePhotoFallback: {
    backgroundColor: COLORS.surface1,
    alignItems: 'center',
    justifyContent: 'center',
  } as ViewStyle,
  venueGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 80,
  } as ViewStyle,
  venueBottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: SPACING.sm + 2,
  } as ViewStyle,
  venueName: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 14,
    color: COLORS.cream,
    lineHeight: 18,
  } as TextStyle,
  venueRating: {
    fontFamily: FONTS.mono,
    fontSize: 12,
    color: COLORS.sage,
    marginTop: 2,
  } as TextStyle,

  // ── Compact event list ──
  eventRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    paddingVertical: SPACING.sm + 2,
  } as ViewStyle,
  eventDatePill: {
    backgroundColor: COLORS.surface1,
    borderRadius: RADIUS.pill,
    paddingHorizontal: SPACING.sm + 2,
    paddingVertical: SPACING.xs,
  } as ViewStyle,
  eventDateText: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    color: COLORS.creamSoft,
    letterSpacing: 0.3,
  } as TextStyle,
  eventName: {
    fontFamily: FONTS.body,
    fontSize: 15,
    color: COLORS.cream,
    flex: 1,
  } as TextStyle,
  eventArrow: {
    fontFamily: FONTS.body,
    fontSize: 16,
    color: COLORS.muted,
  } as TextStyle,

  // ── Action buttons ──
  hereNowBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    backgroundColor: COLORS.sage,
    borderRadius: RADIUS.pill,
    paddingVertical: 14,
    paddingHorizontal: SPACING.lg,
  } as ViewStyle,
  hereNowBtnText: {
    fontFamily: FONTS.header,
    fontSize: 16,
    color: COLORS.bg,
    letterSpacing: 0.3,
  } as TextStyle,
  checkInFloatBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    backgroundColor: COLORS.surface1,
    borderRadius: RADIUS.pill,
    paddingVertical: SPACING.sm + 2,
    paddingHorizontal: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.sageBorder,
  } as ViewStyle,
  checkInFloatBtnText: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 15,
    color: COLORS.cream,
  } as TextStyle,
  checkInFloatBtnSub: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    color: COLORS.creamMuted,
    letterSpacing: 0.3,
    flex: 1,
    textAlign: 'right',
  } as TextStyle,
  noTripCtaCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface1,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingVertical: SPACING.lg,
    paddingHorizontal: SPACING.lg,
  } as ViewStyle,
  noTripCtaText: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 15,
    color: COLORS.cream,
    marginBottom: 2,
  } as TextStyle,
  noTripCtaSub: {
    fontFamily: FONTS.body,
    fontSize: 12,
    color: COLORS.muted,
  } as TextStyle,
  pulseNavCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.surface1,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingVertical: SPACING.lg,
    paddingHorizontal: SPACING.lg,
  } as ViewStyle,
  pulseNavCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    flex: 1,
  } as ViewStyle,
  pulseNavCardTitle: {
    fontFamily: FONTS.headerMedium,
    fontSize: 15,
    color: COLORS.cream,
  } as TextStyle,
  pulseNavCardSub: {
    fontFamily: FONTS.body,
    fontSize: 12,
    color: COLORS.muted,
    marginTop: 2,
  } as TextStyle,

  // ── Right now data pills ──
  rightNowPill: {
    backgroundColor: COLORS.surface1,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.pill,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
  } as ViewStyle,
  rightNowPillAlert: {
    borderColor: COLORS.coral + '40',
    backgroundColor: COLORS.coralSubtle,
  } as ViewStyle,
  rightNowPillText: {
    fontFamily: FONTS.mono,
    fontSize: 12,
    color: COLORS.creamSoft,
    letterSpacing: 0.3,
  } as TextStyle,
  comparePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    backgroundColor: COLORS.surface1,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
    borderColor: COLORS.sageBorder,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs + 2,
  } as ViewStyle,
  comparePillText: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 13,
    color: COLORS.sage,
  } as TextStyle,

  // Legacy compat — kept for DestinationCard scroll (replaced by chips but kept for TS)
  destCardScroll: {
    marginBottom: SPACING.xl,
  } as ViewStyle,
  destCardRow: {
    paddingHorizontal: SPACING.lg,
    gap: SPACING.md,
  } as ViewStyle,

  // Legacy — fsq places row (replaced by venueScrollRow)
  fsqPlacesRow: {
    gap: SPACING.md,
    paddingHorizontal: SPACING.lg,
  } as ViewStyle,
  fsqPlaceCard: {
    width: 160,
    height: 200,
    borderRadius: RADIUS.xl,
    overflow: 'hidden',
    position: 'relative',
  } as ViewStyle,
  fsqPlacePhoto: {
    width: '100%',
    height: '100%',
  } as ViewStyle,
  fsqPlacePhotoFallback: {
    backgroundColor: COLORS.surface1,
    alignItems: 'center',
    justifyContent: 'center',
  } as ViewStyle,
  fsqPlaceGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 80,
  } as ViewStyle,
  fsqPlaceBottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: SPACING.sm + 2,
  } as ViewStyle,
  fsqPlaceName: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 14,
    color: COLORS.cream,
    lineHeight: 18,
  } as TextStyle,
  fsqPlaceCategory: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    color: COLORS.creamMuted,
    marginTop: 2,
  } as TextStyle,
});

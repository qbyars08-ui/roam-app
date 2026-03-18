// =============================================================================
// ROAM — Pulse Tab Styles
// Extracted from app/(tabs)/pulse.tsx for file size management.
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

  // Destination card row
  destCardScroll: {
    marginBottom: SPACING.xxl,
  } as ViewStyle,
  destCardRow: {
    paddingHorizontal: SPACING.lg,
    gap: SPACING.md,
  } as ViewStyle,

  // Sections
  section: {
    marginBottom: SPACING.xxl,
    paddingHorizontal: SPACING.lg,
  } as ViewStyle,
  sectionLast: {
    marginBottom: 0,
  } as ViewStyle,
  sectionHeading: {
    fontFamily: FONTS.header,
    fontSize: 32,
    color: COLORS.cream,
    marginBottom: SPACING.xs + 2,
    letterSpacing: -0.8,
    lineHeight: 38,
  } as TextStyle,
  sectionSubMono: {
    fontFamily: FONTS.mono,
    fontSize: 12,
    color: COLORS.creamSoft,
    marginBottom: SPACING.lg,
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

  // Editorial card stack
  editorialStack: {
    gap: SPACING.md,
    marginTop: SPACING.lg,
  } as ViewStyle,

  // Tips
  tipsStack: {
    marginTop: SPACING.lg,
  } as ViewStyle,

  // Seasonal small cards
  seasonalSmallScroll: {
    marginLeft: -(SPACING.lg),
    marginRight: -(SPACING.lg),
  } as ViewStyle,
  seasonalSmallRow: {
    paddingHorizontal: SPACING.lg,
    gap: SPACING.md,
  } as ViewStyle,

  // Empty state
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

  // Sonar live intel
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  } as ViewStyle,
  sonarCard: {
    backgroundColor: COLORS.surface1,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.md,
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
    fontSize: 14,
    color: COLORS.cream,
    lineHeight: 21,
  } as TextStyle,
  sonarTimestamp: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    color: COLORS.creamDim,
    marginTop: SPACING.sm,
  } as TextStyle,

  // Live Events (Eventbrite)
  liveEventsLabel: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    color: COLORS.coral,
    letterSpacing: 3,
    marginBottom: SPACING.sm,
  } as TextStyle,
  liveEventsStack: {
    marginTop: SPACING.lg,
    gap: SPACING.sm,
  } as ViewStyle,

  // API integration sections
  apiSection: {
    paddingHorizontal: 20,
    paddingTop: SPACING.xl,
    gap: SPACING.sm,
  } as ViewStyle,
  apiSectionLabel: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    color: COLORS.sage,
    letterSpacing: 2,
  } as TextStyle,
  apiSectionHeading: {
    fontFamily: FONTS.header,
    fontSize: 22,
    color: COLORS.cream,
    letterSpacing: -0.5,
    marginBottom: SPACING.md,
  } as TextStyle,
  apiCardStack: {
    gap: SPACING.sm,
  } as ViewStyle,
  apiCard: {
    backgroundColor: COLORS.surface1,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    gap: 4,
  } as ViewStyle,
  apiCardName: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 15,
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

  // Foursquare places
  fsqPlacesRow: {
    gap: SPACING.md,
    paddingRight: SPACING.lg,
  } as ViewStyle,
  fsqPlaceCard: {
    width: 160,
    height: 140,
    borderRadius: RADIUS.lg,
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
    height: 70,
  } as ViewStyle,
  fsqPlaceBottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: SPACING.sm,
  } as ViewStyle,
  fsqPlaceName: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 13,
    color: COLORS.cream,
    lineHeight: 17,
  } as TextStyle,
  fsqPlaceCategory: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    color: COLORS.creamMuted,
    marginTop: 2,
  } as TextStyle,

  // Action buttons
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
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingVertical: 14,
    paddingHorizontal: SPACING.md,
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
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingVertical: 14,
    paddingHorizontal: SPACING.md,
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

  // Right now data pills
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
});

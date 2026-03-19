// =============================================================================
// ROAM — Extracted Styles
// From app/(tabs)/people.tsx for file size management.
// =============================================================================
import { Dimensions, StyleSheet, type ImageStyle, type TextStyle, type ViewStyle } from 'react-native';
import { COLORS, FONTS, SPACING, RADIUS, MAGAZINE } from '../../lib/constants';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  pressed: {
    opacity: 0.75,
  },
  btnDisabled: {
    opacity: 0.4,
  },

  // ---------------------------------------------------------------------------
  // Step indicator
  // ---------------------------------------------------------------------------
  stepRow: {
    flexDirection: 'row',
    gap: SPACING.xs,
    paddingHorizontal: MAGAZINE.padding,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.md,
  },
  stepDot: {
    flex: 1,
    height: 3,
    borderRadius: RADIUS.full,
  },
  stepDotActive: {
    backgroundColor: COLORS.sage,
  },
  stepDotComplete: {
    backgroundColor: COLORS.sageMedium,
  },
  stepDotInactive: {
    backgroundColor: COLORS.bgElevated,
  },

  // ---------------------------------------------------------------------------
  // Profile creation (State 1)
  // ---------------------------------------------------------------------------
  creationScroll: {
    paddingBottom: SPACING.xxxl,
    flexGrow: 1,
  },
  stepContainer: {
    flex: 1,
    paddingHorizontal: MAGAZINE.padding,
    paddingTop: SPACING.xl,
  },
  stepContent: {
    gap: SPACING.md,
  },
  stepQuestion: {
    fontFamily: FONTS.header,
    fontSize: 34,
    color: COLORS.cream,
    lineHeight: 40,
    letterSpacing: -0.8,
  },
  stepHint: {
    fontFamily: FONTS.mono,
    fontSize: 12,
    color: COLORS.creamMuted,
    letterSpacing: 0.5,
  },
  textInput: {
    fontFamily: FONTS.body,
    fontSize: 18,
    color: COLORS.cream,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.sage,
    paddingVertical: SPACING.sm,
    minHeight: 44,
  },
  textArea: {
    borderBottomWidth: 0,
    borderWidth: 1,
    borderColor: COLORS.sageBorder,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.sm,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  charCount: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    color: COLORS.creamMuted,
    alignSelf: 'flex-end',
  },
  dateRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  dateInput: {
    flex: 1,
    fontSize: 14,
  },

  // Travel style grid (2x4)
  styleGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  styleCard: {
    width: (SCREEN_WIDTH - MAGAZINE.padding * 2 - SPACING.sm) / 2,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.sm,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.xs,
    minHeight: 80,
  },
  styleCardSelected: {
    borderColor: COLORS.sage,
    backgroundColor: COLORS.sageVeryFaint,
  },
  styleCardUnselected: {
    borderColor: COLORS.creamDimLight,
    backgroundColor: COLORS.transparent,
  },
  styleCardIcon: {
    marginBottom: SPACING.xs,
  },
  styleCardLabel: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 13,
    textAlign: 'center',
  },
  styleCardLabelSelected: {
    color: COLORS.sage,
  },
  styleCardLabelUnselected: {
    color: COLORS.creamMuted,
  },
  styleCardCheck: {
    position: 'absolute',
    top: SPACING.xs,
    right: SPACING.xs,
  },

  // Language chips
  langGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  langChip: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  langChipSelected: {
    borderColor: COLORS.sage,
    backgroundColor: COLORS.sageVeryFaint,
  },
  langChipUnselected: {
    borderColor: COLORS.creamDimLight,
    backgroundColor: COLORS.transparent,
  },
  langChipText: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 14,
  },
  langChipTextSelected: {
    color: COLORS.sage,
  },
  langChipTextUnselected: {
    color: COLORS.creamMuted,
  },

  // Nav buttons
  navRow: {
    paddingHorizontal: MAGAZINE.padding,
    paddingTop: SPACING.xl,
    gap: SPACING.sm,
  },
  nextBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.sage,
    minHeight: 52,
  },
  nextBtnFinal: {
    backgroundColor: COLORS.sage,
  },
  nextBtnText: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 16,
    color: COLORS.bg,
  },
  skipBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.sm,
    minHeight: 44,
  },
  skipBtnText: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 14,
    color: COLORS.creamMuted,
  },

  // ---------------------------------------------------------------------------
  // State 2 — Profile exists, no trip
  // ---------------------------------------------------------------------------
  state2Scroll: {
    paddingBottom: SPACING.xxxl,
  },
  networkLabel: {
    fontFamily: FONTS.body,
    fontSize: 14,
    color: COLORS.creamSoft,
    paddingHorizontal: MAGAZINE.padding,
    paddingTop: SPACING.lg,
  },
  sectionHeader: {
    paddingHorizontal: MAGAZINE.padding,
    paddingTop: SPACING.xl,
    paddingBottom: SPACING.sm,
  },
  sectionTitle: {
    fontFamily: FONTS.header,
    fontSize: 24,
    color: COLORS.cream,
    letterSpacing: -0.4,
  },
  destChipsRow: {
    paddingHorizontal: MAGAZINE.padding,
    gap: SPACING.sm,
    paddingBottom: SPACING.md,
  },
  destChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: COLORS.sageBorder,
    backgroundColor: COLORS.sageVeryFaint,
    minHeight: 44,
  },
  destChipText: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 14,
    color: COLORS.cream,
  },
  destChipCount: {
    fontFamily: FONTS.mono,
    fontSize: 12,
    color: COLORS.sage,
  },
  addTripCard: {
    marginHorizontal: MAGAZINE.padding,
    marginTop: SPACING.xl,
    padding: MAGAZINE.padding,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.bgCard,
    gap: SPACING.md,
  },
  addTripTitle: {
    fontFamily: FONTS.header,
    fontSize: 28,
    color: COLORS.cream,
    letterSpacing: -0.6,
  },

  // Share button
  shareBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    marginHorizontal: MAGAZINE.padding,
    marginBottom: SPACING.md,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
    borderColor: COLORS.sageBorder,
    backgroundColor: COLORS.sageVeryFaint,
  },
  shareBtnText: {
    flex: 1,
    fontFamily: FONTS.bodyMedium,
    fontSize: 13,
    color: COLORS.sage,
  },

  // ---------------------------------------------------------------------------
  // Social Discovery Nav Cards
  // ---------------------------------------------------------------------------
  socialNavRow: {
    paddingHorizontal: MAGAZINE.padding,
    paddingBottom: SPACING.md,
    gap: SPACING.sm,
  },
  socialNavCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    backgroundColor: COLORS.surface1,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    minHeight: 60,
  },
  socialNavCardText: {
    flex: 1,
    gap: 2,
  },
  socialNavCardTitle: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 15,
    color: COLORS.cream,
  },
  socialNavCardSubtitle: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    color: COLORS.creamMuted,
    letterSpacing: 0.3,
  },

  // ---------------------------------------------------------------------------
  // State 3 — Full experience
  // ---------------------------------------------------------------------------
  fullScroll: {
    paddingBottom: SPACING.xxxl,
  },
  fullHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: MAGAZINE.padding,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.sm,
  },
  fullTitle: {
    fontFamily: FONTS.header,
    fontSize: 32,
    color: COLORS.cream,
    letterSpacing: -0.8,
  },
  privacyToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  privacyLabel: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    color: COLORS.creamMuted,
  },
  section: {
    paddingHorizontal: MAGAZINE.padding,
    paddingTop: SPACING.xl,
    gap: SPACING.md,
  },

  // Roamer profile cards
  roamerCard: {
    height: 140,
    backgroundColor: COLORS.bgMagazine,
    borderRadius: RADIUS.md,
    borderLeftWidth: MAGAZINE.accentBorder,
    borderLeftColor: COLORS.sage,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    justifyContent: 'space-between',
  },
  roamerCardHeader: {
    gap: SPACING.xs,
  },
  roamerNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  roamerName: {
    fontFamily: FONTS.header,
    fontSize: 20,
    color: COLORS.cream,
  },
  roamerScore: {
    fontFamily: FONTS.mono,
    fontSize: 14,
    color: COLORS.gold,
  },
  roamerMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  roamerCity: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    color: COLORS.creamMuted,
    marginRight: SPACING.xs,
  },
  roamerLangs: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    color: COLORS.creamMuted,
    flex: 1,
  },
  roamerTags: {
    flexDirection: 'row',
    gap: SPACING.xs,
    flexWrap: 'wrap',
  },
  roamerTag: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.coralSubtle,
  },
  roamerTagText: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    color: COLORS.coral,
  },
  roamerFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: SPACING.sm,
  },
  roamerBio: {
    fontFamily: FONTS.body,
    fontSize: 12,
    color: COLORS.creamMuted,
    flex: 1,
  },
  connectBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.pill,
    minHeight: 44,
  },
  connectBtnDefault: {
    backgroundColor: COLORS.sage,
  },
  connectBtnRequested: {
    backgroundColor: COLORS.transparent,
    borderWidth: 1,
    borderColor: COLORS.goldBorder,
  },
  connectBtnConnected: {
    backgroundColor: COLORS.transparent,
    borderWidth: 1,
    borderColor: COLORS.successBorder,
  },
  connectBtnText: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 13,
  },
  connectBtnTextDefault: {
    color: COLORS.bg,
  },
  connectBtnTextRequested: {
    color: COLORS.gold,
  },
  connectBtnTextConnected: {
    color: COLORS.sage,
  },

  // Empty state
  emptyState: {
    paddingHorizontal: MAGAZINE.padding,
    paddingTop: SPACING.xxl,
    alignItems: 'center',
    gap: SPACING.lg,
  },
  emptyStatePinWrap: {
    marginBottom: SPACING.sm,
  },
  emptyText: {
    fontFamily: FONTS.body,
    fontSize: 15,
    color: COLORS.creamMuted,
    textAlign: 'center',
    lineHeight: 22,
  },
  emptySubtext: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: COLORS.muted,
    textAlign: 'center',
    lineHeight: 18,
    marginTop: -SPACING.xs,
  },
  addTripCta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    backgroundColor: COLORS.sage,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.xl,
    borderRadius: RADIUS.pill,
    minHeight: 48,
  },
  addTripCtaText: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 16,
    color: COLORS.bg,
  },
  inviteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    paddingVertical: SPACING.sm,
    minHeight: 44,
  },
  inviteBtnText: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 14,
    color: COLORS.sage,
  },

  // Network horizontal scroll (State 3, section 3)
  networkScroll: {
    gap: SPACING.sm,
    paddingRight: MAGAZINE.padding,
  },
  networkCard: {
    width: 100,
    alignItems: 'center',
    gap: SPACING.xs,
  },
  networkAvatar: {
    width: 56,
    height: 56,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.bgElevated,
    borderWidth: 1,
    borderColor: COLORS.sageBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  networkAvatarText: {
    fontFamily: FONTS.header,
    fontSize: 22,
    color: COLORS.sage,
  },
  networkName: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 12,
    color: COLORS.cream,
    textAlign: 'center',
  },
  networkCity: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    color: COLORS.creamMuted,
    textAlign: 'center',
  },
});

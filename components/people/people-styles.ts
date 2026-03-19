// =============================================================================
// ROAM — People Tab Styles (v2)
// Extracted from app/(tabs)/people.tsx for file size management.
// =============================================================================
import { Dimensions, StyleSheet, type ImageStyle, type TextStyle, type ViewStyle } from 'react-native';
import { COLORS, FONTS, SPACING, RADIUS, MAGAZINE } from '../../lib/constants';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.bg,
  } as ViewStyle,
  pressed: { opacity: 0.75 } as ViewStyle,
  disabled: { opacity: 0.4 } as ViewStyle,
  loadingWrap: {
    padding: SPACING.lg,
    gap: SPACING.md,
  } as ViewStyle,

  // -- Hero (State 1) --------------------------------------------------------
  heroCenter: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
  } as ViewStyle,
  heroIconCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: COLORS.sageVeryFaint,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.lg,
  } as ViewStyle,
  heroTitle: {
    fontFamily: FONTS.header,
    fontSize: 28,
    color: COLORS.cream,
    textAlign: 'center',
    letterSpacing: -0.6,
    marginBottom: SPACING.sm,
  } as TextStyle,
  heroSub: {
    fontFamily: FONTS.body,
    fontSize: 16,
    color: COLORS.muted,
    textAlign: 'center',
    marginBottom: SPACING.xl,
  } as TextStyle,
  sagePill: {
    backgroundColor: COLORS.sage,
    borderRadius: RADIUS.pill,
    paddingVertical: 14,
    paddingHorizontal: SPACING.xl,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
  } as ViewStyle,
  sagePillText: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 16,
    color: COLORS.bg,
  } as TextStyle,

  // -- Form (State 2) --------------------------------------------------------
  formScroll: {
    paddingHorizontal: MAGAZINE.padding,
    paddingTop: SPACING.xl,
    paddingBottom: SPACING.xxxl,
    gap: SPACING.md,
  } as ViewStyle,
  formHeading: {
    fontFamily: FONTS.header,
    fontSize: 28,
    color: COLORS.cream,
    letterSpacing: -0.6,
    marginBottom: SPACING.sm,
  } as TextStyle,
  formLabel: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 14,
    color: COLORS.creamSoft,
    marginTop: SPACING.sm,
  } as TextStyle,
  avatarPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.surface1,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  } as ViewStyle,
  avatarPlaceholderText: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    color: COLORS.muted,
  } as TextStyle,
  pillInput: {
    fontFamily: FONTS.body,
    fontSize: 16,
    color: COLORS.cream,
    backgroundColor: COLORS.surface1,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.pill,
    paddingHorizontal: SPACING.lg,
    height: 48,
  } as TextStyle,
  styleGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  } as ViewStyle,
  styleCard: {
    width: '31%',
    aspectRatio: 1,
    backgroundColor: COLORS.surface1,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.lg,
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.xs,
  } as ViewStyle,
  styleCardSelected: {
    borderColor: COLORS.sage,
    backgroundColor: COLORS.sageVeryFaint,
  } as ViewStyle,
  styleCardLabel: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 12,
    color: COLORS.muted,
    textAlign: 'center',
  } as TextStyle,
  styleCardLabelActive: {
    color: COLORS.sage,
  } as TextStyle,

  // -- Main (State 3) --------------------------------------------------------
  mainScroll: {
    paddingBottom: SPACING.xxxl,
  } as ViewStyle,

  // Your card
  yourCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: MAGAZINE.padding,
    marginTop: SPACING.lg,
    paddingVertical: SPACING.md,
    gap: SPACING.sm,
  } as ViewStyle,
  yourCardAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.sageVeryFaint,
    borderWidth: 1,
    borderColor: COLORS.sageBorder,
    alignItems: 'center',
    justifyContent: 'center',
  } as ViewStyle,
  yourCardAvatarText: {
    fontFamily: FONTS.header,
    fontSize: 18,
    color: COLORS.sage,
  } as TextStyle,
  yourCardInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  } as ViewStyle,
  yourCardName: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 16,
    color: COLORS.cream,
  } as TextStyle,
  editText: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 14,
    color: COLORS.sage,
  } as TextStyle,

  // Badge
  badge: {
    backgroundColor: COLORS.sageVeryFaint,
    borderWidth: 1,
    borderColor: COLORS.sageBorder,
    borderRadius: RADIUS.pill,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
  } as ViewStyle,
  badgeText: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    color: COLORS.sage,
  } as TextStyle,

  // Sections
  section: {
    marginTop: SPACING.xl,
    paddingHorizontal: MAGAZINE.padding,
    gap: SPACING.md,
  } as ViewStyle,
  sectionTitle: {
    fontFamily: FONTS.header,
    fontSize: 20,
    color: COLORS.cream,
    letterSpacing: -0.4,
  } as TextStyle,

  // Traveler rows
  travelerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface1,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    gap: SPACING.sm,
  } as ViewStyle,
  travelerAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.sageVeryFaint,
    alignItems: 'center',
    justifyContent: 'center',
  } as ViewStyle,
  travelerAvatarText: {
    fontFamily: FONTS.header,
    fontSize: 20,
    color: COLORS.sage,
  } as TextStyle,
  travelerInfo: {
    flex: 1,
    gap: 2,
  } as ViewStyle,
  travelerName: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 15,
    color: COLORS.cream,
  } as TextStyle,
  travelerMeta: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    color: COLORS.muted,
  } as TextStyle,
  seeAll: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 14,
    color: COLORS.sage,
  } as TextStyle,
  emptyText: {
    fontFamily: FONTS.body,
    fontSize: 15,
    color: COLORS.muted,
    lineHeight: 22,
  } as TextStyle,

  // Trending destinations
  trendingRow: {
    gap: SPACING.sm,
    paddingRight: MAGAZINE.padding,
  } as ViewStyle,
  trendingCard: {
    width: 120,
    height: 160,
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
    backgroundColor: COLORS.surface1,
    borderWidth: 1,
    borderColor: COLORS.border,
  } as ViewStyle,
  trendingPhoto: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  } as ImageStyle,
  trendingOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    padding: SPACING.sm,
    backgroundColor: 'rgba(0,0,0,0.35)',
  } as ViewStyle,
  trendingName: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 14,
    color: COLORS.white,
  } as TextStyle,
  trendingCount: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    color: COLORS.whiteDim,
  } as TextStyle,

  // Quick links
  quickLinksRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginTop: SPACING.xl,
    paddingHorizontal: MAGAZINE.padding,
  } as ViewStyle,
  quickLink: {
    flex: 1,
    backgroundColor: COLORS.surface1,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    gap: SPACING.sm,
    alignItems: 'flex-start',
  } as ViewStyle,
  quickLinkText: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 14,
    color: COLORS.cream,
    flex: 1,
  } as TextStyle,

  // ── Legacy styles (used by PeopleCards.tsx) ─────────────────────────────────
  stepRow: { flexDirection: 'row', gap: SPACING.xs, paddingHorizontal: MAGAZINE.padding, paddingTop: SPACING.lg, paddingBottom: SPACING.md } as ViewStyle,
  stepDot: { flex: 1, height: 3, borderRadius: RADIUS.full } as ViewStyle,
  stepDotActive: { backgroundColor: COLORS.sage } as ViewStyle,
  stepDotComplete: { backgroundColor: COLORS.sageMedium } as ViewStyle,
  stepDotInactive: { backgroundColor: COLORS.bgElevated } as ViewStyle,
  styleCardUnselected: { borderColor: COLORS.creamDimLight, backgroundColor: COLORS.transparent } as ViewStyle,
  styleCardIcon: { marginBottom: SPACING.xs } as ViewStyle,
  styleCardLabelSelected: { color: COLORS.sage } as TextStyle,
  styleCardLabelUnselected: { color: COLORS.creamMuted } as TextStyle,
  styleCardCheck: { position: 'absolute', top: SPACING.xs, right: SPACING.xs } as ViewStyle,
  langChip: { paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm, borderRadius: RADIUS.full, borderWidth: 1, minHeight: 44, alignItems: 'center', justifyContent: 'center' } as ViewStyle,
  langChipSelected: { borderColor: COLORS.sage, backgroundColor: COLORS.sageVeryFaint } as ViewStyle,
  langChipUnselected: { borderColor: COLORS.creamDimLight, backgroundColor: COLORS.transparent } as ViewStyle,
  langChipText: { fontFamily: FONTS.bodyMedium, fontSize: 14 } as TextStyle,
  langChipTextSelected: { color: COLORS.sage } as TextStyle,
  langChipTextUnselected: { color: COLORS.creamMuted } as TextStyle,
  destChip: { flexDirection: 'row', alignItems: 'center', gap: SPACING.xs, paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm, borderRadius: RADIUS.full, borderWidth: 1, borderColor: COLORS.sageBorder, backgroundColor: COLORS.sageVeryFaint, minHeight: 44 } as ViewStyle,
  destChipText: { fontFamily: FONTS.bodyMedium, fontSize: 14, color: COLORS.cream } as TextStyle,
  destChipCount: { fontFamily: FONTS.mono, fontSize: 12, color: COLORS.sage } as TextStyle,
  roamerCard: { height: 140, backgroundColor: COLORS.bgMagazine, borderRadius: RADIUS.md, borderLeftWidth: MAGAZINE.accentBorder, borderLeftColor: COLORS.sage, paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm, justifyContent: 'space-between' } as ViewStyle,
  roamerCardHeader: { gap: SPACING.xs } as ViewStyle,
  roamerNameRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' } as ViewStyle,
  roamerName: { fontFamily: FONTS.header, fontSize: 20, color: COLORS.cream } as TextStyle,
  roamerScore: { fontFamily: FONTS.mono, fontSize: 14, color: COLORS.gold } as TextStyle,
  roamerMeta: { flexDirection: 'row', alignItems: 'center', gap: SPACING.xs } as ViewStyle,
  roamerCity: { fontFamily: FONTS.mono, fontSize: 11, color: COLORS.creamMuted, marginRight: SPACING.xs } as TextStyle,
  roamerLangs: { fontFamily: FONTS.mono, fontSize: 11, color: COLORS.creamMuted, flex: 1 } as TextStyle,
  roamerTags: { flexDirection: 'row', gap: SPACING.xs, flexWrap: 'wrap' } as ViewStyle,
  roamerTag: { paddingHorizontal: SPACING.sm, paddingVertical: SPACING.xs, borderRadius: RADIUS.full, backgroundColor: COLORS.coralSubtle } as ViewStyle,
  roamerTagText: { fontFamily: FONTS.mono, fontSize: 10, color: COLORS.coral } as TextStyle,
  roamerFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: SPACING.sm } as ViewStyle,
  roamerBio: { fontFamily: FONTS.body, fontSize: 12, color: COLORS.creamMuted, flex: 1 } as TextStyle,
  connectBtn: { flexDirection: 'row', alignItems: 'center', gap: SPACING.xs, paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm, borderRadius: RADIUS.pill, minHeight: 44 } as ViewStyle,
  connectBtnDefault: { backgroundColor: COLORS.sage } as ViewStyle,
  connectBtnRequested: { backgroundColor: COLORS.transparent, borderWidth: 1, borderColor: COLORS.goldBorder } as ViewStyle,
  connectBtnConnected: { backgroundColor: COLORS.transparent, borderWidth: 1, borderColor: COLORS.successBorder } as ViewStyle,
  connectBtnText: { fontFamily: FONTS.bodySemiBold, fontSize: 13 } as TextStyle,
  connectBtnTextDefault: { color: COLORS.bg } as TextStyle,
  connectBtnTextRequested: { color: COLORS.gold } as TextStyle,
  connectBtnTextConnected: { color: COLORS.sage } as TextStyle,
  emptyState: { paddingHorizontal: MAGAZINE.padding, paddingTop: SPACING.xxl, alignItems: 'center', gap: SPACING.lg } as ViewStyle,
  emptyStatePinWrap: { marginBottom: SPACING.sm } as ViewStyle,
  emptySubtext: { fontFamily: FONTS.body, fontSize: 13, color: COLORS.muted, textAlign: 'center', lineHeight: 18, marginTop: -SPACING.xs } as TextStyle,
  addTripCta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: SPACING.sm, backgroundColor: COLORS.sage, paddingVertical: SPACING.md, paddingHorizontal: SPACING.xl, borderRadius: RADIUS.pill, minHeight: 48 } as ViewStyle,
  addTripCtaText: { fontFamily: FONTS.bodySemiBold, fontSize: 16, color: COLORS.bg } as TextStyle,
  btnDisabled: { opacity: 0.4 } as ViewStyle,
  container: { flex: 1, backgroundColor: COLORS.bg } as ViewStyle,
  fullScroll: { paddingBottom: SPACING.xxxl } as ViewStyle,
  socialNavCard: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, backgroundColor: COLORS.surface1, borderRadius: RADIUS.md, padding: SPACING.md, borderWidth: 1, borderColor: COLORS.border, minHeight: 60 } as ViewStyle,
  socialNavCardText: { flex: 1, gap: 2 } as ViewStyle,
  socialNavCardTitle: { fontFamily: FONTS.bodyMedium, fontSize: 15, color: COLORS.cream } as TextStyle,
  socialNavCardSubtitle: { fontFamily: FONTS.mono, fontSize: 11, color: COLORS.creamMuted, letterSpacing: 0.3 } as TextStyle,
  destChipsRow: { paddingHorizontal: MAGAZINE.padding, gap: SPACING.sm, paddingBottom: SPACING.md } as ViewStyle,
});

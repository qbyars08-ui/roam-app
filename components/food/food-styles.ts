// =============================================================================
// ROAM — Extracted Styles
// From app/(tabs)/food.tsx for file size management.
// =============================================================================
import { Dimensions, StyleSheet, type ImageStyle, type TextStyle, type ViewStyle } from 'react-native';
import { COLORS, FONTS, SPACING, RADIUS, MAGAZINE } from '../../lib/constants';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.bg,
  } as ViewStyle,
  scrollView: {
    flex: 1,
  } as ViewStyle,
  scrollContent: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
  } as ViewStyle,
  hero: {
    paddingBottom: SPACING.md,
  } as ViewStyle,
  heroTitle: {
    fontFamily: FONTS.header,
    fontSize: 40,
    color: COLORS.cream,
    lineHeight: 46,
  } as TextStyle,
  heroSub: {
    fontFamily: FONTS.body,
    fontSize: 15,
    color: COLORS.creamMuted,
    marginTop: SPACING.xs,
    lineHeight: 22,
  } as TextStyle,
  sectionHeader: {
    marginBottom: SPACING.md,
  } as ViewStyle,
  sectionTitle: {
    fontFamily: FONTS.header,
    fontSize: 24,
    color: COLORS.cream,
    marginBottom: SPACING.md,
  } as TextStyle,
  sectionSub: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: COLORS.creamMuted,
    marginTop: 2,
  } as TextStyle,
  popularCitiesScroll: {
    gap: SPACING.md,
    paddingBottom: SPACING.xl,
  } as ViewStyle,
  popularCityCard: {
    width: 180,
    height: 200,
    borderRadius: RADIUS.xl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.border,
  } as ViewStyle,
  popularCityImage: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  } as ImageStyle,
  popularCityContent: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: SPACING.md,
  } as ViewStyle,
  popularCityName: {
    fontFamily: FONTS.header,
    fontSize: 22,
    color: COLORS.white,
  } as TextStyle,
  popularCityVibe: {
    fontFamily: FONTS.body,
    fontSize: 12,
    color: COLORS.creamSoft,
    marginTop: 2,
  } as TextStyle,
  categoryScroll: {
    marginHorizontal: -SPACING.lg,
    marginBottom: SPACING.lg,
  } as ViewStyle,
  categoryContent: {
    paddingHorizontal: SPACING.lg,
    gap: SPACING.sm,
    flexDirection: 'row',
  } as ViewStyle,
  categoryPill: {
    paddingHorizontal: SPACING.md,
    paddingVertical: 9,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.bgCard,
    borderWidth: 1,
    borderColor: COLORS.creamDim,
    marginRight: SPACING.sm,
  } as ViewStyle,
  categoryPillSelected: {
    backgroundColor: COLORS.coral,
    borderColor: COLORS.coral,
  } as ViewStyle,
  categoryPillText: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: COLORS.cream,
  } as TextStyle,
  categoryPillTextSelected: {
    color: COLORS.bg,
  } as TextStyle,
  heroCard: {
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
    overflow: 'hidden',
    borderLeftWidth: 3,
    borderLeftColor: COLORS.sage,
    position: 'relative',
  } as ViewStyle,
  heroBorder: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 3,
    backgroundColor: COLORS.sage,
  } as ViewStyle,
  heroTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  } as ViewStyle,
  aiPickBadge: {
    backgroundColor: COLORS.gold,
    borderRadius: RADIUS.sm,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 3,
  } as ViewStyle,
  aiPickBadgeText: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    color: COLORS.bg,
  } as TextStyle,
  updatedToday: {
    fontFamily: FONTS.body,
    fontSize: 11,
    color: COLORS.creamDim,
  } as TextStyle,
  heroName: {
    fontFamily: FONTS.header,
    fontSize: 26,
    color: COLORS.cream,
    marginBottom: SPACING.xs,
  } as TextStyle,
  heroCuisine: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: COLORS.creamMuted,
    marginBottom: SPACING.sm,
  } as TextStyle,
  mustTryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.xs,
  } as ViewStyle,
  mustTryLabel: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    color: COLORS.sage,
  } as TextStyle,
  mustTryDish: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 15,
    color: COLORS.cream,
  } as TextStyle,
  insiderTip: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: COLORS.creamSoft,
    marginBottom: SPACING.md,
    maxWidth: '95%',
  } as TextStyle,
  heroBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  } as ViewStyle,
  heroPrice: {
    fontFamily: FONTS.mono,
    fontSize: 13,
    color: COLORS.creamMuted,
  } as TextStyle,
  heroStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  } as ViewStyle,
  heroStatusText: {
    fontFamily: FONTS.body,
    fontSize: 12,
    color: COLORS.cream,
  } as TextStyle,
  heroDistance: {
    fontFamily: FONTS.body,
    fontSize: 12,
    color: COLORS.creamDim,
  } as TextStyle,
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  } as ViewStyle,
  statusDotSmall: {
    width: 6,
    height: 6,
    borderRadius: 3,
  } as ViewStyle,
  seeAllRow: {
    paddingVertical: SPACING.sm,
    marginBottom: SPACING.md,
  } as ViewStyle,
  seeAllText: {
    fontFamily: FONTS.mono,
    fontSize: 12,
    color: COLORS.sage,
    textDecorationLine: 'underline',
  } as TextStyle,
  restaurantCard: {
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.xl,
    padding: SPACING.sm + 6,
    marginBottom: 10,
    flexDirection: 'row',
    flexWrap: 'wrap',
    position: 'relative',
  } as ViewStyle,
  cardAccent: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 3,
    borderTopLeftRadius: 14,
    borderBottomLeftRadius: 14,
  } as ViewStyle,
  cardName: {
    fontFamily: FONTS.header,
    fontSize: 18,
    color: COLORS.cream,
    width: '100%',
    marginBottom: 2,
  } as TextStyle,
  cardCategory: {
    fontFamily: FONTS.body,
    fontSize: 11,
    color: COLORS.creamDim,
    marginBottom: SPACING.xs,
  } as TextStyle,
  tryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: SPACING.xs,
    width: '100%',
  } as ViewStyle,
  tryLabel: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    color: COLORS.sage,
  } as TextStyle,
  tryDish: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: COLORS.cream,
  } as TextStyle,
  cardDesc: {
    fontFamily: FONTS.body,
    fontSize: 12,
    color: COLORS.creamMuted,
    marginBottom: SPACING.sm,
  } as TextStyle,
  cardBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  } as ViewStyle,
  cardPrice: {
    fontFamily: FONTS.mono,
    fontSize: 12,
    color: COLORS.creamDim,
  } as TextStyle,
  cardStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  } as ViewStyle,
  cardDistance: {
    fontFamily: FONTS.body,
    fontSize: 12,
    color: COLORS.creamDim,
  } as TextStyle,
  bookmarkBtn: {
    padding: 4,
  } as ViewStyle,
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
  } as ViewStyle,
  emptyList: {
    alignItems: 'center',
    paddingVertical: SPACING.xxl,
  } as ViewStyle,
  emptyListTitle: {
    fontFamily: FONTS.body,
    fontSize: 16,
    color: COLORS.creamMuted,
    marginTop: SPACING.md,
  } as TextStyle,
  emptyListSub: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: COLORS.creamDim,
    marginTop: SPACING.xs,
  } as TextStyle,
  emptyTitle: {
    fontFamily: FONTS.body,
    fontSize: 15,
    color: COLORS.creamDim,
    marginTop: SPACING.lg,
    textAlign: 'center',
  } as TextStyle,
  emptyHeader: {
    fontFamily: FONTS.header,
    fontSize: 26,
    color: COLORS.cream,
    paddingHorizontal: SPACING.lg,
    marginTop: SPACING.md,
    marginBottom: SPACING.xs,
  } as TextStyle,
  emptySubtext: {
    fontFamily: FONTS.body,
    fontSize: 15,
    color: COLORS.creamDim,
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.lg,
    lineHeight: 22,
  } as TextStyle,
  foodCategoryCard: {
    marginHorizontal: SPACING.lg,
    marginBottom: SPACING.sm + 4,
    borderRadius: RADIUS.xl,
    overflow: 'hidden',
    height: 140,
    position: 'relative',
  } as ViewStyle,
  foodCategoryImage: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  } as ImageStyle,
  foodCategoryContent: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: SPACING.md,
  } as ViewStyle,
  foodCategoryTitle: {
    fontFamily: FONTS.header,
    fontSize: 22,
    color: COLORS.cream,
  } as TextStyle,
  foodCategorySub: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: COLORS.creamSoft,
    marginTop: 2,
  } as TextStyle,
  toastWrap: {
    position: 'absolute',
    bottom: 100,
    alignSelf: 'center',
    backgroundColor: COLORS.sage,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.md,
  } as ViewStyle,
  toastText: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 14,
    color: COLORS.bg,
  } as TextStyle,

  // ── Skeleton loaders ──
  skeletonWrap: {
    gap: SPACING.md,
    marginTop: SPACING.md,
  } as ViewStyle,

  // ── Card actions ──
  cardActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  } as ViewStyle,

  // Sonar live food intel
  sonarSection: {
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.lg,
  } as ViewStyle,
  sonarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.sm,
  } as ViewStyle,
  sonarLabel: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    color: COLORS.sage,
    letterSpacing: 1,
  } as TextStyle,
  sonarCard: {
    backgroundColor: COLORS.surface1,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.md,
  } as ViewStyle,
  sonarAnswer: {
    fontFamily: FONTS.body,
    fontSize: 14,
    color: COLORS.cream,
    lineHeight: 21,
  } as TextStyle,

  // ── Foursquare nearby restaurants ──
  fsqSection: {
    marginBottom: SPACING.lg,
  } as ViewStyle,
  fsqSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.sm,
  } as ViewStyle,
  fsqSectionLabel: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    color: COLORS.sage,
    letterSpacing: 1,
  } as TextStyle,
  fsqLoadingText: {
    fontFamily: FONTS.body,
    fontSize: 11,
    color: COLORS.creamDim,
  } as TextStyle,
  fsqSkeletonWrap: {
    gap: 8,
  } as ViewStyle,
  fsqCard: {
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.md,
    padding: SPACING.sm + 4,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
  } as ViewStyle,
  fsqCardAccent: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 3,
    backgroundColor: COLORS.sage,
    borderTopLeftRadius: RADIUS.md,
    borderBottomLeftRadius: RADIUS.md,
  } as ViewStyle,
  fsqCardContent: {
    flex: 1,
    marginLeft: SPACING.sm + 4,
  } as ViewStyle,
  fsqCardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: SPACING.sm,
    marginBottom: 2,
  } as ViewStyle,
  fsqCardName: {
    fontFamily: FONTS.header,
    fontSize: 16,
    color: COLORS.cream,
    flex: 1,
  } as TextStyle,
  fsqCardMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  } as ViewStyle,
  fsqCardPrice: {
    fontFamily: FONTS.mono,
    fontSize: 12,
    color: COLORS.creamDim,
  } as TextStyle,
  fsqRatingBadge: {
    backgroundColor: COLORS.sageLight,
    borderRadius: RADIUS.sm,
    paddingHorizontal: 6,
    paddingVertical: 2,
  } as ViewStyle,
  fsqRatingText: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    color: COLORS.sage,
  } as TextStyle,
  fsqCardCategory: {
    fontFamily: FONTS.body,
    fontSize: 12,
    color: COLORS.creamMuted,
    marginBottom: 2,
  } as TextStyle,
  fsqCardDistance: {
    fontFamily: FONTS.body,
    fontSize: 11,
    color: COLORS.creamDim,
  } as TextStyle,
  fsqExternalIcon: {
    marginLeft: SPACING.xs,
    flexShrink: 0,
  } as ViewStyle,

  // ── Google Places + TripAdvisor ──
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
  localEatsNavCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.surface1,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingVertical: 14,
    paddingHorizontal: SPACING.md,
    marginTop: SPACING.md,
    marginBottom: SPACING.sm,
  } as ViewStyle,
  localEatsNavLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    flex: 1,
  } as ViewStyle,
  localEatsNavTitle: {
    fontFamily: FONTS.headerMedium,
    fontSize: 15,
    color: COLORS.cream,
  } as TextStyle,
  localEatsNavSub: {
    fontFamily: FONTS.body,
    fontSize: 12,
    color: COLORS.muted,
    marginTop: 2,
  } as TextStyle,
  fallbackContainer: { paddingVertical: SPACING.md, alignItems: 'center' } as ViewStyle,
  fallbackText: { color: COLORS.muted, fontSize: 14, fontFamily: FONTS.body } as TextStyle,
});

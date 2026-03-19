// =============================================================================
// ROAM — Food Tab Styles
// Premium, Instagram-like feel. Compact pills, no source labels.
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
    paddingTop: SPACING.lg,
  } as ViewStyle,

  // Hero
  hero: {
    paddingBottom: SPACING.lg,
    alignItems: 'center',
  } as ViewStyle,
  heroTitle: {
    fontFamily: FONTS.header,
    fontSize: 24,
    color: COLORS.cream,
    textAlign: 'center',
  } as TextStyle,
  heroSub: {
    fontFamily: FONTS.body,
    fontSize: 14,
    color: COLORS.creamMuted,
    marginTop: SPACING.xs,
    textAlign: 'center',
    lineHeight: 20,
  } as TextStyle,

  // Section headers
  sectionHeader: {
    marginBottom: SPACING.md,
  } as ViewStyle,
  sectionTitle: {
    fontFamily: FONTS.header,
    fontSize: 20,
    color: COLORS.cream,
    marginBottom: SPACING.sm,
  } as TextStyle,
  sectionSub: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: COLORS.creamMuted,
    marginTop: 2,
  } as TextStyle,

  // Popular cities horizontal scroll
  popularCitiesScroll: {
    gap: SPACING.md,
    paddingBottom: SPACING.xl,
  } as ViewStyle,
  popularCityCard: {
    width: 160,
    height: 200,
    borderRadius: RADIUS.lg,
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
    fontSize: 20,
    color: COLORS.white,
  } as TextStyle,
  popularCityVibe: {
    fontFamily: FONTS.body,
    fontSize: 12,
    color: COLORS.creamSoft,
    marginTop: 2,
  } as TextStyle,

  // Category filter pills — compact, not bloated
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
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.surface1,
    borderWidth: 1,
    borderColor: COLORS.border,
  } as ViewStyle,
  categoryPillSelected: {
    backgroundColor: COLORS.sageSoft,
    borderColor: COLORS.sageBorder,
  } as ViewStyle,
  categoryPillText: {
    fontFamily: FONTS.body,
    fontSize: 12,
    color: COLORS.muted,
  } as TextStyle,
  categoryPillTextSelected: {
    color: COLORS.sage,
    fontFamily: FONTS.bodyMedium,
  } as TextStyle,

  // AI Pick hero card
  heroCard: {
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: COLORS.surface1,
    borderWidth: 1,
    borderColor: COLORS.sageBorder,
  } as ViewStyle,
  heroBorder: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 0,
  } as ViewStyle,
  heroTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  } as ViewStyle,
  aiPickBadge: {
    backgroundColor: COLORS.gold,
    borderRadius: RADIUS.pill,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 3,
  } as ViewStyle,
  aiPickBadgeText: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    color: COLORS.bg,
    letterSpacing: 0.5,
  } as TextStyle,
  updatedToday: {
    fontFamily: FONTS.body,
    fontSize: 11,
    color: COLORS.creamDim,
  } as TextStyle,
  heroName: {
    fontFamily: FONTS.header,
    fontSize: 22,
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
    fontSize: 10,
    color: COLORS.sage,
    letterSpacing: 0.5,
  } as TextStyle,
  mustTryDish: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 14,
    color: COLORS.cream,
  } as TextStyle,
  insiderTip: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: COLORS.creamSoft,
    marginBottom: SPACING.md,
    maxWidth: '95%',
    lineHeight: 18,
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
    fontFamily: FONTS.mono,
    fontSize: 11,
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

  // Restaurant cards
  restaurantCard: {
    backgroundColor: COLORS.surface1,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.sm,
    flexDirection: 'row',
    flexWrap: 'wrap',
    position: 'relative',
    borderWidth: 1,
    borderColor: COLORS.border,
  } as ViewStyle,
  cardAccent: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 3,
    borderTopLeftRadius: RADIUS.lg,
    borderBottomLeftRadius: RADIUS.lg,
  } as ViewStyle,
  cardName: {
    fontFamily: FONTS.header,
    fontSize: 17,
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
    fontSize: 10,
    color: COLORS.sage,
    letterSpacing: 0.5,
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
    lineHeight: 18,
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

  // Empty states
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

  // Food category cards
  foodCategoryCard: {
    marginHorizontal: SPACING.lg,
    marginBottom: SPACING.sm + 4,
    borderRadius: RADIUS.lg,
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

  // Toast
  toastWrap: {
    position: 'absolute',
    bottom: 100,
    alignSelf: 'center',
    backgroundColor: COLORS.sage,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.pill,
  } as ViewStyle,
  toastText: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 14,
    color: COLORS.bg,
  } as TextStyle,

  // Skeleton loaders
  skeletonWrap: {
    gap: SPACING.md,
    marginTop: SPACING.md,
  } as ViewStyle,

  // Card actions
  cardActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  } as ViewStyle,

  // Sonar section — no source labels
  sonarSection: {
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
    fontSize: 10,
    color: COLORS.sage,
    letterSpacing: 1.5,
  } as TextStyle,
  sonarCard: {
    backgroundColor: COLORS.surface1,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.lg,
  } as ViewStyle,
  sonarAnswer: {
    fontFamily: FONTS.body,
    fontSize: 14,
    color: COLORS.cream,
    lineHeight: 21,
  } as TextStyle,

  // Foursquare nearby restaurants — no "NEARBY RESTAURANTS" label
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
    fontFamily: FONTS.header,
    fontSize: 20,
    color: COLORS.cream,
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
    backgroundColor: COLORS.surface1,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.border,
  } as ViewStyle,
  fsqCardAccent: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 3,
    backgroundColor: COLORS.sage,
    borderTopLeftRadius: RADIUS.lg,
    borderBottomLeftRadius: RADIUS.lg,
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
    fontFamily: FONTS.headerMedium,
    fontSize: 15,
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
    backgroundColor: COLORS.sageSoft,
    borderRadius: RADIUS.pill,
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
    fontFamily: FONTS.mono,
    fontSize: 11,
    color: COLORS.creamDim,
  } as TextStyle,
  fsqExternalIcon: {
    marginLeft: SPACING.xs,
    flexShrink: 0,
  } as ViewStyle,

  // API sections — no source labels visible to users
  apiSection: {
    paddingTop: SPACING.lg,
    gap: SPACING.sm,
  } as ViewStyle,
  apiSectionLabel: {
    fontFamily: FONTS.header,
    fontSize: 20,
    color: COLORS.cream,
  } as TextStyle,
  apiSectionHeading: {
    fontFamily: FONTS.body,
    fontSize: 14,
    color: COLORS.creamMuted,
    marginBottom: SPACING.sm,
  } as TextStyle,
  apiCardStack: {
    gap: SPACING.sm,
  } as ViewStyle,
  apiCard: {
    backgroundColor: COLORS.surface1,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    gap: 4,
    borderWidth: 1,
    borderColor: COLORS.border,
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

  // Local Eats nav card
  localEatsNavCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.surface1,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    marginTop: SPACING.lg,
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

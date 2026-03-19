// =============================================================================
// ROAM — TripCard + NextTripHero (individual trip card components)
// =============================================================================
import React, { useCallback, useMemo } from 'react';
import {
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
  type ImageStyle,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import {
  Calendar,
  ChevronRight,
  Clock,
  Flame,
  Heart,
  Plane,
  ShieldCheck,
  Sparkle,
  Users,
  Wallet,
} from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import * as Haptics from '../../lib/haptics';
import { COLORS, FONTS, SPACING, RADIUS, CARD_SHADOW } from '../../lib/constants';
import type { Trip } from '../../lib/store';
import { parseItinerary } from '../../lib/types/itinerary';
import { DEST_IMAGES, FALLBACK_IMAGE, getDestinationMeta, isPerfectTiming } from './plan-helpers';

// ---------------------------------------------------------------------------
// TripCard — compact card for trip list
// ---------------------------------------------------------------------------
export interface TripCardProps {
  trip: Trip;
  onPress: () => void;
  isLatest: boolean;
  collaboratorCount?: number;
}

export const TripCard = React.memo(function TripCard({ trip, onPress, isLatest, collaboratorCount }: TripCardProps) {
  const { t } = useTranslation();
  const imageUrl = DEST_IMAGES[trip.destination] ?? FALLBACK_IMAGE;
  const destMeta = useMemo(() => getDestinationMeta(trip.destination), [trip.destination]);
  const isTrending = (destMeta?.trendScore ?? 0) >= 85;
  const perfectTiming = destMeta ? isPerfectTiming(destMeta.bestMonths) : false;
  const parsed = useMemo(() => {
    try {
      return parseItinerary(JSON.parse(trip.itinerary));
    } catch {
      return null;
    }
  }, [trip.itinerary]);

  const dayCount = parsed?.days?.length ?? trip.days;
  const dateLabel = useMemo(() => {
    const d = new Date(trip.createdAt);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return t('plan.today');
    if (diffDays === 1) return t('plan.yesterday');
    if (diffDays < 7) return t('plan.daysAgo', { count: diffDays });
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  }, [trip.createdAt, t]);

  return (
    <Pressable
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress();
      }}
      accessibilityLabel={`Open ${trip.destination} itinerary — ${dayCount} days, ${trip.budget} budget`}
      accessibilityRole="button"
      style={({ pressed }) => [
        styles.tripCard,
        isLatest && styles.tripCardLatest,
        { transform: [{ scale: pressed ? 0.97 : 1 }] },
      ]}
    >
      <Image
        source={{ uri: imageUrl }}
        style={styles.tripCardImage}
        accessibilityLabel={`${trip.destination} destination photo`}
      />
      <LinearGradient
        colors={['transparent', COLORS.overlayDark]}
        style={styles.tripCardGradient}
      />
      {isLatest && (
        <View style={styles.latestBadge}>
          <Text style={styles.latestBadgeText}>{t('plan.latest')}</Text>
        </View>
      )}
      {/* Trending + Perfect Timing badges */}
      <View style={styles.trendBadgeRow}>
        {isTrending && (
          <View style={styles.trendBadge}>
            <Flame size={10} color={COLORS.coral} strokeWidth={1.5} />
            <Text style={styles.trendBadgeText}>Trending</Text>
          </View>
        )}
        {perfectTiming && (
          <View style={styles.timingBadge}>
            <Sparkle size={10} color={COLORS.gold} strokeWidth={1.5} />
            <Text style={styles.timingBadgeText}>Perfect timing</Text>
          </View>
        )}
      </View>
      <View style={styles.tripCardContent}>
        <Text style={styles.tripCardDest}>{trip.destination}</Text>
        <View style={styles.tripCardMeta}>
          <View style={styles.tripCardChip}>
            <Calendar size={12} color={COLORS.creamSoft} strokeWidth={1.5} />
            <Text style={styles.tripCardChipText}>{t('common.days', { count: dayCount })}</Text>
          </View>
          <View style={styles.tripCardChip}>
            <Wallet size={12} color={COLORS.creamSoft} strokeWidth={1.5} />
            <Text style={styles.tripCardChipText}>{trip.budget}</Text>
          </View>
          <View style={styles.tripCardChip}>
            <Clock size={12} color={COLORS.creamSoft} strokeWidth={1.5} />
            <Text style={styles.tripCardChipText}>{dateLabel}</Text>
          </View>
          {(collaboratorCount ?? 0) > 1 && (
            <View style={styles.tripCardChip}>
              <Users size={12} color={COLORS.creamSoft} strokeWidth={1.5} />
              <Text style={styles.tripCardChipText}>{`${collaboratorCount} people planning`}</Text>
            </View>
          )}
        </View>
      </View>
      <View style={styles.tripCardArrow}>
        <ChevronRight size={20} color={COLORS.cream} strokeWidth={1.5} />
      </View>
    </Pressable>
  );
});

// ---------------------------------------------------------------------------
// NextTripHero — full-bleed hero card for the most recent trip
// ---------------------------------------------------------------------------
export interface NextTripHeroProps {
  trip: Trip;
  onPress: () => void;
  collaboratorCount?: number;
}

export const NextTripHero = React.memo(function NextTripHero({ trip, onPress, collaboratorCount }: NextTripHeroProps) {
  const router = useRouter();
  const imageUrl = DEST_IMAGES[trip.destination] ?? FALLBACK_IMAGE;
  const destMeta = useMemo(() => getDestinationMeta(trip.destination), [trip.destination]);
  const isTrending = (destMeta?.trendScore ?? 0) >= 85;
  const perfectTiming = destMeta ? isPerfectTiming(destMeta.bestMonths) : false;

  const tagline = useMemo(() => {
    try {
      const parsed = parseItinerary(JSON.parse(trip.itinerary));
      return parsed?.tagline ?? null;
    } catch {
      return null;
    }
  }, [trip.itinerary]);

  const handleBeforeYouLand = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push({ pathname: '/before-you-land', params: { destination: trip.destination } } as never);
  }, [router, trip.destination]);

  const handleHealthBrief = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push('/(tabs)/body-intel' as never);
  }, [router]);

  const handleEmergencyCard = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push({ pathname: '/emergency-card', params: { destination: trip.destination } } as never);
  }, [router, trip.destination]);

  return (
    <Pressable
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress();
      }}
      accessibilityLabel={`Open ${trip.destination} itinerary`}
      accessibilityRole="button"
      style={({ pressed }) => [
        styles.heroCard,
        { transform: [{ scale: pressed ? 0.98 : 1 }] },
      ]}
    >
      <Image
        source={{ uri: imageUrl }}
        style={styles.heroImage}
        accessibilityLabel={`${trip.destination} hero photo`}
      />
      <LinearGradient
        colors={['transparent', COLORS.overlayStrong]}
        style={styles.heroGradient}
      />

      {/* Trending + Perfect Timing badges */}
      <View style={styles.heroTrendRow}>
        {isTrending && (
          <View style={styles.trendBadge}>
            <Flame size={10} color={COLORS.coral} strokeWidth={1.5} />
            <Text style={styles.trendBadgeText}>Trending</Text>
          </View>
        )}
        {perfectTiming && (
          <View style={styles.timingBadge}>
            <Sparkle size={10} color={COLORS.gold} strokeWidth={1.5} />
            <Text style={styles.timingBadgeText}>Perfect timing</Text>
          </View>
        )}
      </View>

      {/* Destination name + tagline */}
      <View style={styles.heroContent}>
        <Text style={styles.heroDest}>{trip.destination}</Text>
        {tagline ? (
          <Text style={styles.heroTagline} numberOfLines={2}>{tagline}</Text>
        ) : null}
        {(collaboratorCount ?? 0) > 1 && (
          <View style={styles.collabBadge}>
            <Users size={12} color={COLORS.sage} strokeWidth={1.5} />
            <Text style={styles.collabBadgeText}>{`${collaboratorCount} people planning`}</Text>
          </View>
        )}

        {/* Quick-link pills */}
        <View style={styles.heroPills}>
          <Pressable
            onPress={handleBeforeYouLand}
            accessibilityLabel={`Before you land briefing for ${trip.destination}`}
            accessibilityRole="button"
            style={({ pressed }) => [
              styles.heroPill,
              styles.heroPillGold,
              { opacity: pressed ? 0.75 : 1 },
            ]}
            hitSlop={8}
          >
            <Plane size={12} color={COLORS.gold} strokeWidth={1.5} />
            <Text style={[styles.heroPillText, styles.heroPillTextGold]}>Before You Land</Text>
          </Pressable>

          <Pressable
            onPress={handleHealthBrief}
            accessibilityLabel="View health brief for this destination"
            accessibilityRole="button"
            style={({ pressed }) => [
              styles.heroPill,
              styles.heroPillSage,
              { opacity: pressed ? 0.75 : 1 },
            ]}
            hitSlop={8}
          >
            <ShieldCheck size={12} color={COLORS.sage} strokeWidth={1.5} />
            <Text style={[styles.heroPillText, styles.heroPillTextSage]}>Health Brief</Text>
          </Pressable>

          <Pressable
            onPress={handleEmergencyCard}
            accessibilityLabel={`View emergency card for ${trip.destination}`}
            accessibilityRole="button"
            style={({ pressed }) => [
              styles.heroPill,
              styles.heroPillCoral,
              { opacity: pressed ? 0.75 : 1 },
            ]}
            hitSlop={8}
          >
            <Heart size={12} color={COLORS.coral} strokeWidth={1.5} />
            <Text style={[styles.heroPillText, styles.heroPillTextCoral]}>Emergency Card</Text>
          </Pressable>
        </View>
      </View>

      {/* Tap-to-open arrow */}
      <View style={styles.heroArrow}>
        <ChevronRight size={20} color={COLORS.cream} strokeWidth={1.5} />
      </View>
    </Pressable>
  );
});

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------
const styles = StyleSheet.create({
  // ── Trip Cards ──
  tripCard: {
    height: 180,
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
    marginBottom: SPACING.md,
    ...CARD_SHADOW,
  } as ViewStyle,
  tripCardLatest: {
    height: 220,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.sage,
  } as ViewStyle,
  tripCardImage: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  } as ImageStyle,
  tripCardGradient: {
    ...StyleSheet.absoluteFillObject,
  } as ViewStyle,
  tripCardContent: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: SPACING.lg,
  } as ViewStyle,
  tripCardDest: {
    fontFamily: FONTS.header,
    fontSize: 28,
    color: COLORS.cream,
    letterSpacing: -0.5,
    marginBottom: 6,
  } as TextStyle,
  tripCardMeta: {
    flexDirection: 'row',
    gap: SPACING.sm,
  } as ViewStyle,
  tripCardChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  } as ViewStyle,
  tripCardChipText: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    color: COLORS.creamSoft,
  } as TextStyle,
  tripCardArrow: {
    position: 'absolute',
    right: 20,
    top: '50%',
    marginTop: -10,
  } as ViewStyle,
  latestBadge: {
    position: 'absolute',
    top: 20,
    left: 20,
  } as ViewStyle,
  latestBadgeText: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    color: COLORS.sage,
    letterSpacing: 1,
    textTransform: 'uppercase',
  } as TextStyle,
  trendBadgeRow: {
    position: 'absolute',
    top: 12,
    right: 12,
    flexDirection: 'row',
    gap: 6,
  } as ViewStyle,
  heroTrendRow: {
    position: 'absolute',
    top: 16,
    right: 16,
    flexDirection: 'row',
    gap: 6,
    zIndex: 2,
  } as ViewStyle,
  trendBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: COLORS.coralSubtle,
    borderWidth: 1,
    borderColor: COLORS.coralBorder,
    borderRadius: RADIUS.md,
    paddingHorizontal: 7,
    paddingVertical: 3,
  } as ViewStyle,
  trendBadgeText: {
    fontFamily: FONTS.mono,
    fontSize: 9,
    color: COLORS.coral,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  } as TextStyle,
  timingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: COLORS.goldSubtle,
    borderWidth: 1,
    borderColor: COLORS.goldBorderStrong,
    borderRadius: RADIUS.md,
    paddingHorizontal: 7,
    paddingVertical: 3,
  } as ViewStyle,
  timingBadgeText: {
    fontFamily: FONTS.mono,
    fontSize: 9,
    color: COLORS.gold,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  } as TextStyle,

  // ── Next Trip Hero ──
  heroCard: {
    height: 280,
    borderRadius: RADIUS.xl,
    overflow: 'hidden',
    marginBottom: SPACING.lg,
    ...CARD_SHADOW,
  } as ViewStyle,
  heroImage: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  } as ImageStyle,
  heroGradient: {
    ...StyleSheet.absoluteFillObject,
  } as ViewStyle,
  heroContent: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: SPACING.md,
  } as ViewStyle,
  heroDest: {
    fontFamily: FONTS.header,
    fontSize: 36,
    color: COLORS.white,
    marginBottom: 4,
  } as TextStyle,
  heroTagline: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: COLORS.creamSoft,
    marginBottom: SPACING.md,
    lineHeight: 18,
  } as TextStyle,
  heroPills: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.xs,
  } as ViewStyle,
  heroPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    backgroundColor: COLORS.overlayMedium,
  } as ViewStyle,
  heroPillGold: {
    borderColor: COLORS.goldBorder,
  } as ViewStyle,
  heroPillSage: {
    borderColor: COLORS.sageBorder,
  } as ViewStyle,
  heroPillCoral: {
    borderColor: COLORS.coralBorder,
  } as ViewStyle,
  heroPillText: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    letterSpacing: 0.3,
  } as TextStyle,
  heroPillTextGold: {
    color: COLORS.gold,
  } as TextStyle,
  heroPillTextSage: {
    color: COLORS.sage,
  } as TextStyle,
  heroPillTextCoral: {
    color: COLORS.coral,
  } as TextStyle,
  heroArrow: {
    position: 'absolute',
    right: SPACING.md,
    top: SPACING.md,
    backgroundColor: COLORS.whiteMuted,
    borderRadius: RADIUS.full,
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  } as ViewStyle,
  collabBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: SPACING.xs,
    backgroundColor: COLORS.sageVeryFaint,
    borderRadius: RADIUS.pill,
    paddingVertical: 3,
    paddingHorizontal: SPACING.sm,
    alignSelf: 'flex-start',
  } as ViewStyle,
  collabBadgeText: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    color: COLORS.sage,
  } as TextStyle,
});

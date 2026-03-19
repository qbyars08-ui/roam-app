// =============================================================================
// ROAM — TripCard + NextTripHero (consistent card system)
// Full-width photo cards, gradient overlay, destination at bottom-left.
// Clean hierarchy: destination name (Space Grotesk 24px), date in DM Mono.
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
  ChevronRight,
  Heart,
  Plane,
  ShieldCheck,
  Users,
} from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import * as Haptics from '../../lib/haptics';
import { COLORS, FONTS, SPACING, RADIUS } from '../../lib/constants';
import type { Trip } from '../../lib/store';
import { DEST_IMAGES, FALLBACK_IMAGE } from './plan-helpers';

// ---------------------------------------------------------------------------
// TripCard — compact card for trip list
// ---------------------------------------------------------------------------
export interface TripCardProps {
  trip: Trip;
  onPress: () => void;
  isLatest: boolean;
  collaboratorCount?: number;
}

export const TripCard = React.memo(function TripCard({ trip, onPress, collaboratorCount }: TripCardProps) {
  const { t } = useTranslation();
  const imageUrl = DEST_IMAGES[trip.destination] ?? FALLBACK_IMAGE;

  const dateLabel = useMemo(() => {
    if (trip.startDate) {
      const start = new Date(trip.startDate);
      const end = new Date(start.getTime() + (trip.days - 1) * 24 * 60 * 60 * 1000);
      const fmt = (d: Date) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      return `${fmt(start)} - ${fmt(end)}`;
    }
    return t('common.days', { count: trip.days });
  }, [trip.startDate, trip.days, t]);

  return (
    <Pressable
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress();
      }}
      accessibilityLabel={`Open ${trip.destination} itinerary`}
      accessibilityRole="button"
      style={({ pressed }) => [
        styles.tripCard,
        { transform: [{ scale: pressed ? 0.98 : 1 }] },
      ]}
    >
      <Image
        source={{ uri: imageUrl }}
        style={styles.cardImage}
        accessibilityLabel={`${trip.destination} photo`}
      />
      <LinearGradient
        colors={['transparent', COLORS.overlayStrong]}
        locations={[0.3, 1]}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.cardContent}>
        <Text style={styles.cardDest}>{trip.destination}</Text>
        <View style={styles.cardMeta}>
          <Text style={styles.cardDate}>{dateLabel}</Text>
          {(collaboratorCount ?? 0) > 1 && (
            <View style={styles.collabChip}>
              <Users size={10} color={COLORS.cream} strokeWidth={1.5} />
              <Text style={styles.collabChipText}>{collaboratorCount}</Text>
            </View>
          )}
        </View>
      </View>
    </Pressable>
  );
});

// ---------------------------------------------------------------------------
// NextTripHero — larger hero card for the most recent trip
// ---------------------------------------------------------------------------
export interface NextTripHeroProps {
  trip: Trip;
  onPress: () => void;
  collaboratorCount?: number;
}

export const NextTripHero = React.memo(function NextTripHero({ trip, onPress, collaboratorCount }: NextTripHeroProps) {
  const router = useRouter();
  const imageUrl = DEST_IMAGES[trip.destination] ?? FALLBACK_IMAGE;

  const dateLabel = useMemo(() => {
    if (trip.startDate) {
      const start = new Date(trip.startDate);
      const end = new Date(start.getTime() + (trip.days - 1) * 24 * 60 * 60 * 1000);
      const fmt = (d: Date) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      return `${fmt(start)} - ${fmt(end)}`;
    }
    return `${trip.days} days`;
  }, [trip.startDate, trip.days]);

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
        style={styles.cardImage}
        accessibilityLabel={`${trip.destination} hero photo`}
      />
      <LinearGradient
        colors={['transparent', COLORS.overlayStrong]}
        locations={[0.2, 1]}
        style={StyleSheet.absoluteFill}
      />

      {/* Arrow */}
      <View style={styles.heroArrow}>
        <ChevronRight size={18} color={COLORS.cream} strokeWidth={1.5} />
      </View>

      {/* Content */}
      <View style={styles.heroContent}>
        <Text style={styles.heroDest}>{trip.destination}</Text>
        <Text style={styles.heroDate}>{dateLabel}</Text>

        {(collaboratorCount ?? 0) > 1 && (
          <View style={styles.collabBadge}>
            <Users size={11} color={COLORS.sage} strokeWidth={1.5} />
            <Text style={styles.collabBadgeText}>{collaboratorCount} planning</Text>
          </View>
        )}

        {/* Quick-link pills */}
        <View style={styles.heroPills}>
          <Pressable
            onPress={handleBeforeYouLand}
            accessibilityLabel={`Before you land briefing for ${trip.destination}`}
            accessibilityRole="button"
            style={({ pressed }) => [styles.heroPill, { opacity: pressed ? 0.75 : 1 }]}
            hitSlop={8}
          >
            <Plane size={11} color={COLORS.gold} strokeWidth={1.5} />
            <Text style={[styles.heroPillText, { color: COLORS.gold }]}>Before You Land</Text>
          </Pressable>

          <Pressable
            onPress={handleHealthBrief}
            accessibilityLabel="View health brief"
            accessibilityRole="button"
            style={({ pressed }) => [styles.heroPill, { opacity: pressed ? 0.75 : 1 }]}
            hitSlop={8}
          >
            <ShieldCheck size={11} color={COLORS.sage} strokeWidth={1.5} />
            <Text style={[styles.heroPillText, { color: COLORS.sage }]}>Health Brief</Text>
          </Pressable>

          <Pressable
            onPress={handleEmergencyCard}
            accessibilityLabel={`Emergency card for ${trip.destination}`}
            accessibilityRole="button"
            style={({ pressed }) => [styles.heroPill, { opacity: pressed ? 0.75 : 1 }]}
            hitSlop={8}
          >
            <Heart size={11} color={COLORS.coral} strokeWidth={1.5} />
            <Text style={[styles.heroPillText, { color: COLORS.coral }]}>Emergency</Text>
          </Pressable>
        </View>
      </View>
    </Pressable>
  );
});

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------
const styles = StyleSheet.create({
  // ── Trip Card (compact) ──
  tripCard: {
    height: 200,
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
    marginBottom: SPACING.md,
  } as ViewStyle,
  cardImage: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  } as ImageStyle,
  cardContent: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: SPACING.lg,
  } as ViewStyle,
  cardDest: {
    fontFamily: FONTS.header,
    fontSize: 24,
    color: COLORS.cream,
    letterSpacing: -0.3,
    marginBottom: 4,
  } as TextStyle,
  cardMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  } as ViewStyle,
  cardDate: {
    fontFamily: FONTS.mono,
    fontSize: 12,
    color: COLORS.creamSoft,
    letterSpacing: 0.3,
  } as TextStyle,
  collabChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: COLORS.overlayMedium,
    borderRadius: RADIUS.pill,
    paddingHorizontal: 6,
    paddingVertical: 2,
  } as ViewStyle,
  collabChipText: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    color: COLORS.cream,
  } as TextStyle,

  // ── Hero Card (larger, first trip) ──
  heroCard: {
    height: 280,
    borderRadius: RADIUS.xl,
    overflow: 'hidden',
    marginBottom: SPACING.lg,
  } as ViewStyle,
  heroContent: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: SPACING.lg,
  } as ViewStyle,
  heroDest: {
    fontFamily: FONTS.header,
    fontSize: 32,
    color: COLORS.white,
    letterSpacing: -0.5,
    marginBottom: 2,
  } as TextStyle,
  heroDate: {
    fontFamily: FONTS.mono,
    fontSize: 13,
    color: COLORS.creamSoft,
    letterSpacing: 0.3,
    marginBottom: SPACING.md,
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
    marginBottom: SPACING.sm,
    alignSelf: 'flex-start',
  } as ViewStyle,
  collabBadgeText: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    color: COLORS.sage,
  } as TextStyle,

  heroPills: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.xs,
  } as ViewStyle,
  heroPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: COLORS.whiteMuted,
    backgroundColor: COLORS.overlayMedium,
  } as ViewStyle,
  heroPillText: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    letterSpacing: 0.3,
  } as TextStyle,
});

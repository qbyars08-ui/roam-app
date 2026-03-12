// =============================================================================
// ROAM — Travel Passport
// Beautiful passport-style stamp collection + badges
// =============================================================================
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';

import { COLORS, FONTS, SPACING, RADIUS, DESTINATIONS } from '../../lib/constants';
import { Share2, BookOpen, MapPin, Lock } from 'lucide-react-native';
import { EmptyPassport } from '../../components/ui/EmptyStateIllustrations';
import { useAppStore } from '../../lib/store';
import {
  addStamp,
  getStats,
  getEarnedBadges,
  type PassportStamp,
  type TravelStats,
  BADGES,
} from '../../lib/passport';
import WorldMap from '../../components/features/WorldMap';

export default function PassportScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const trips = useAppStore((s) => s.trips);

  const [stats, setStats] = useState<TravelStats>({
    countriesVisited: 0,
    tripsCompleted: 0,
    stamps: [],
  });

  // Load stats on mount
  useEffect(() => {
    getStats().then(setStats);
  }, []);

  const earnedBadges = useMemo(() => getEarnedBadges(stats), [stats]);
  const unearnedBadges = useMemo(
    () => BADGES.filter((b) => !earnedBadges.find((e) => e.id === b.id)),
    [earnedBadges]
  );

  // Mark a trip as completed → add stamp
  const handleStampTrip = useCallback(
    async (trip: { id: string; destination: string }) => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      // Find destination info
      const dest = DESTINATIONS.find(
        (d) => d.label.toLowerCase() === trip.destination.toLowerCase()
      );

      const stamp: PassportStamp = {
        destination: trip.destination,
        country: dest?.country ?? '??',
        stampedAt: new Date().toISOString(),
        tripId: trip.id,
        emoji: dest?.emoji ?? '\uD83C\uDF0D',
      };

      await addStamp(stamp);
      const newStats = await getStats();
      setStats(newStats);
    },
    []
  );

  const handleShare = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const stampList = stats.stamps
      .map((s) => s.destination)
      .join(' \u2022 ');

    await Share.share({
      message: `My ROAM Travel Passport\n\n${stats.countriesVisited} countries \u2022 ${stats.tripsCompleted} trips\n\n${stampList}\n\nTrack your travels with ROAM`,
    });
  }, [stats]);

  // Unstamped trips
  const unstampedTrips = useMemo(
    () =>
      trips.filter(
        (t) => !stats.stamps.some((s) => s.tripId === t.id)
      ),
    [trips, stats.stamps]
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Your Passport</Text>
          <Pressable onPress={handleShare} hitSlop={8} style={styles.shareBtn}>
            <Share2 size={22} color={COLORS.cream} strokeWidth={2} />
          </Pressable>
        </View>

        {/* World map — visited countries in sage */}
        <View style={styles.section}>
          <WorldMap stamps={stats.stamps} />
        </View>

        {/* Stats row */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{stats.countriesVisited}</Text>
            <Text style={styles.statLabel}>COUNTRIES</Text>
          </View>
          <View style={styles.passportIcon}>
            <BookOpen size={36} color={COLORS.gold} strokeWidth={1.5} />
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{stats.tripsCompleted}</Text>
            <Text style={styles.statLabel}>TRIPS</Text>
          </View>
        </View>

        {/* Stamps grid */}
        {stats.stamps.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>YOUR STAMPS</Text>
            <View style={styles.stampsGrid}>
              {stats.stamps.map((stamp, i) => (
                <View key={`${stamp.tripId}-${i}`} style={styles.stampCard}>
                  <View style={styles.stampIconWrap}>
                    <MapPin size={28} color={COLORS.gold} strokeWidth={1.5} />
                  </View>
                  <Text style={styles.stampDest}>{stamp.destination}</Text>
                  <Text style={styles.stampCountry}>{stamp.country}</Text>
                  <Text style={styles.stampDate}>
                    {new Date(stamp.stampedAt).toLocaleDateString('en-US', {
                      month: 'short',
                      year: 'numeric',
                    })}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Unstamped trips */}
        {unstampedTrips.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>BEEN THERE? STAMP IT.</Text>
            {unstampedTrips.map((trip) => (
              <Pressable
                key={trip.id}
                onPress={() => handleStampTrip(trip)}
                style={({ pressed }) => [
                  styles.unstampedRow,
                  { opacity: pressed ? 0.7 : 1 },
                ]}
              >
                <View>
                  <Text style={styles.unstampedDest}>{trip.destination}</Text>
                  <Text style={styles.unstampedDate}>
                    {trip.days} days \u2022{' '}
                    {new Date(trip.createdAt).toLocaleDateString()}
                  </Text>
                </View>
                <View style={styles.stampBtn}>
                  <Text style={styles.stampBtnText}>Stamp</Text>
                </View>
              </Pressable>
            ))}
          </View>
        )}

        {/* Badges */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>BADGES</Text>
          <View style={styles.badgesGrid}>
            {earnedBadges.map((badge) => (
              <View key={badge.id} style={styles.badgeCard}>
                {null}
                <Text style={styles.badgeLabel}>{badge.label}</Text>
                <Text style={styles.badgeDesc}>{badge.description}</Text>
              </View>
            ))}
            {unearnedBadges.map((badge) => (
              <View
                key={badge.id}
                style={[styles.badgeCard, styles.badgeLocked]}
              >
                <View style={styles.badgeIconWrap}>
                  <Lock size={20} color={COLORS.creamMuted} strokeWidth={1.5} />
                </View>
                <Text style={[styles.badgeLabel, styles.badgeLabelLocked]}>
                  {badge.label}
                </Text>
                <Text style={[styles.badgeDesc, styles.badgeDescLocked]}>
                  {badge.description}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Empty state */}
        {stats.stamps.length === 0 && unstampedTrips.length === 0 && (
          <View style={styles.emptyState}>
            <EmptyPassport size={120} />
            <Text style={styles.emptyTitle}>A blank passport</Text>
            <Text style={styles.emptySubtitle}>
              Every stamp is a story. Plan a trip, take it, and come back to make it official.
            </Text>
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push('/(tabs)/plan');
              }}
              style={({ pressed }) => [styles.emptyCta, { opacity: pressed ? 0.85 : 1 }]}
            >
              <Text style={styles.emptyCtaText}>Plan your first trip</Text>
            </Pressable>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  } as ViewStyle,
  scrollContent: {
    paddingBottom: SPACING.xxxl,
  } as ViewStyle,
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.md,
  } as ViewStyle,
  title: {
    fontFamily: FONTS.header,
    fontSize: 28,
    color: COLORS.cream,
  } as TextStyle,
  shareBtn: {
    padding: SPACING.xs,
  } as ViewStyle,

  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.xl,
    paddingVertical: SPACING.lg,
    paddingHorizontal: SPACING.lg,
  } as ViewStyle,
  statCard: {
    alignItems: 'center',
    gap: SPACING.xs,
  } as ViewStyle,
  statValue: {
    fontFamily: FONTS.header,
    fontSize: 40,
    color: COLORS.cream,
  } as TextStyle,
  statLabel: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    color: COLORS.sage,
    letterSpacing: 1.5,
  } as TextStyle,
  passportIcon: {
    width: 72,
    height: 72,
    borderRadius: 12,
    backgroundColor: COLORS.bgCard,
    borderWidth: 2,
    borderColor: COLORS.gold,
    alignItems: 'center',
    justifyContent: 'center',
  } as ViewStyle,

  section: {
    paddingHorizontal: SPACING.lg,
    marginTop: SPACING.lg,
  } as ViewStyle,
  sectionLabel: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    color: COLORS.sage,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginBottom: SPACING.md,
  } as TextStyle,

  stampsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  } as ViewStyle,
  stampCard: {
    width: '31%',
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.gold,
    padding: SPACING.sm + 2,
    alignItems: 'center',
    gap: 2,
  } as ViewStyle,
  stampIconWrap: {
    marginBottom: 2,
  } as ViewStyle,
  stampDest: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 12,
    color: COLORS.cream,
    textAlign: 'center',
  } as TextStyle,
  stampCountry: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    color: COLORS.sage,
  } as TextStyle,
  stampDate: {
    fontFamily: FONTS.mono,
    fontSize: 9,
    color: COLORS.creamMuted,
    marginTop: 2,
  } as TextStyle,

  unstampedRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
  } as ViewStyle,
  unstampedDest: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 16,
    color: COLORS.cream,
  } as TextStyle,
  unstampedDate: {
    fontFamily: FONTS.mono,
    fontSize: 12,
    color: COLORS.creamMuted,
    marginTop: 2,
  } as TextStyle,
  stampBtn: {
    backgroundColor: COLORS.gold,
    borderRadius: RADIUS.sm,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  } as ViewStyle,
  stampBtnText: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 13,
    color: COLORS.bg,
  } as TextStyle,

  badgesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  } as ViewStyle,
  badgeCard: {
    width: '48%',
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.gold,
    padding: SPACING.md,
    alignItems: 'center',
    gap: SPACING.xs,
  } as ViewStyle,
  badgeLocked: {
    borderColor: COLORS.border,
    opacity: 0.5,
  } as ViewStyle,
  badgeIconWrap: {
    marginBottom: SPACING.xs,
  } as ViewStyle,
  badgeLabel: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 13,
    color: COLORS.cream,
  } as TextStyle,
  badgeLabelLocked: {
    color: COLORS.creamMuted,
  } as TextStyle,
  badgeDesc: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    color: COLORS.sage,
    textAlign: 'center',
  } as TextStyle,
  badgeDescLocked: {
    color: COLORS.creamMuted,
  } as TextStyle,

  emptyState: {
    alignItems: 'center',
    paddingTop: SPACING.xxxl,
    gap: SPACING.md,
    paddingHorizontal: SPACING.xl,
  } as ViewStyle,
  emptyEmoji: {
    fontSize: 64,
  } as TextStyle,
  emptyTitle: {
    fontFamily: FONTS.header,
    fontSize: 22,
    color: COLORS.cream,
  } as TextStyle,
  emptySubtitle: {
    fontFamily: FONTS.body,
    fontSize: 14,
    color: COLORS.creamMuted,
    textAlign: 'center',
    lineHeight: 20,
  } as TextStyle,
  emptyCta: {
    backgroundColor: COLORS.sage,
    borderRadius: RADIUS.md,
    paddingVertical: 12,
    paddingHorizontal: SPACING.xl,
    marginTop: SPACING.md,
  } as ViewStyle,
  emptyCtaText: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 14,
    color: COLORS.bg,
  } as TextStyle,
});

// =============================================================================
// ROAM — Return Trip: "What's new since your last visit"
// Shown when user has been to destination before
// =============================================================================
import React, { useMemo } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import * as Haptics from '../../lib/haptics';
import { RotateCcw, Clock } from 'lucide-react-native';
import { COLORS, FONTS, SPACING, RADIUS } from '../../lib/constants';
import type { Trip } from '../../lib/store';

interface ReturnTripSectionProps {
  destination: string;
  trips: Trip[];
  currentTripId?: string;
  /** AI-generated "what's new" summary — can come from itinerary or separate API */
  whatsNew?: string;
}

export default function ReturnTripSection({
  destination,
  trips,
  currentTripId,
  whatsNew,
}: ReturnTripSectionProps) {
  const router = useRouter();
  const priorVisit = useMemo(() => {
    const dest = destination.toLowerCase();
    const prior = trips
      .filter((t) => t.id !== currentTripId && (t.destination.toLowerCase().includes(dest) || dest.includes(t.destination.toLowerCase())))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
    return prior ?? null;
  }, [destination, trips, currentTripId]);

  if (!priorVisit) return null;

  const priorDate = new Date(priorVisit.createdAt);
  const priorYear = priorDate.getFullYear();
  const priorLabel = priorDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });

  return (
    <View style={styles.wrap}>
      <View style={styles.header}>
        <RotateCcw size={18} color={COLORS.accentGold} strokeWidth={1.5} />
        <Text style={styles.title}>Returning to {destination}</Text>
      </View>
      <Text style={styles.meta}>Last visit: {priorLabel}</Text>
      {whatsNew ? (
        <Text style={styles.body}>{whatsNew}</Text>
      ) : (
        <Text style={styles.body}>
          New neighborhoods, restaurants, and experiences have opened since {priorYear}. Your itinerary reflects the latest local favorites.
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: COLORS.goldSubtle,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.goldBorderStrong,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  title: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 15,
    color: COLORS.cream,
  },
  meta: {
    fontFamily: FONTS.mono,
    fontSize: 12,
    color: COLORS.creamMuted,
    marginTop: 4,
  },
  body: {
    fontFamily: FONTS.body,
    fontSize: 14,
    color: COLORS.creamMuted,
    lineHeight: 20,
    marginTop: SPACING.sm,
  },
  cta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginTop: SPACING.md,
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.goldBorderStrong,
  },
  ctaText: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 13,
    color: COLORS.accentGold,
  },
});

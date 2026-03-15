// =============================================================================
// ROAM — Social Proof Banner
// "847 people planned Tokyo this week" — FOMO that drives action
// =============================================================================
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, type TextStyle, type ViewStyle } from 'react-native';
import { COLORS, FONTS, SPACING } from '../../lib/constants';
import { getDestinationStats, type DestinationStats } from '../../lib/social-proof';

interface SocialProofBannerProps {
  destination: string;
}

export default function SocialProofBanner({ destination }: SocialProofBannerProps) {
  const [stats, setStats] = useState<DestinationStats | null>(null);

  useEffect(() => {
    let cancelled = false;
    getDestinationStats(destination).then((s: DestinationStats) => {
      if (!cancelled) setStats(s);
    });
    return () => { cancelled = true; };
  }, [destination]);

  if (!stats || stats.plannedThisWeek < 50) return null;

  return (
    <View style={styles.container}>
      <Text style={styles.text}>
        <Text style={styles.count}>{stats.plannedThisWeek.toLocaleString()}</Text>
        {' '}people planned {destination} trips this week
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    marginBottom: SPACING.sm,
  } as ViewStyle,
  text: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: COLORS.creamMuted,
  } as TextStyle,
  count: {
    fontFamily: FONTS.bodySemiBold,
    color: COLORS.sage,
  } as TextStyle,
});

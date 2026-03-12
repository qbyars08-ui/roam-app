// =============================================================================
// ROAM — Compact safety badge (1–4 pill) for plan wizard and destination cards
// US State Department travel advisory
// =============================================================================
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, type ViewStyle, type TextStyle } from 'react-native';
import { COLORS, FONTS, SPACING, RADIUS } from '../../lib/constants';
import {
  getAdvisory,
  getAdvisoryDisplay,
  getCountryForDestination,
  type TravelAdvisory,
} from '../../lib/travel-advisory';

interface SafetyScoreBadgeProps {
  destination: string;
  /** Compact pill (default) or full badge */
  variant?: 'pill' | 'full';
}

export default function SafetyScoreBadge({ destination, variant = 'pill' }: SafetyScoreBadgeProps) {
  const [advisory, setAdvisory] = useState<TravelAdvisory | null>(null);

  useEffect(() => {
    let cancelled = false;
    const dest = destination.trim();
    if (!dest) return;

    getAdvisory(dest)
      .then((data) => {
        if (!cancelled) setAdvisory(data);
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [destination]);

  if (!advisory) return null;

  const display = getAdvisoryDisplay(advisory);
  const country = getCountryForDestination(destination);

  if (variant === 'pill') {
    return (
      <View style={[styles.pill, { backgroundColor: display.color + '25', borderColor: display.color + '60' }]}>
        <View style={[styles.pillDot, { backgroundColor: display.color }]} />
        <Text style={[styles.pillText, { color: display.color }]}>
          Level {advisory.level}/4 — {display.shortLabel}
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.full}>
      <View style={[styles.fullBadge, { backgroundColor: display.color + '20' }]}>
        <Text style={[styles.fullNumber, { color: display.color }]}>{advisory.level}</Text>
        <Text style={[styles.fullOf, { color: display.color }]}>/4</Text>
      </View>
      <View style={styles.fullCol}>
        <Text style={[styles.fullLabel, { color: display.color }]}>{display.shortLabel}</Text>
        <Text style={styles.fullCountry}>{country?.name ?? destination}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    paddingHorizontal: SPACING.sm + 4,
    paddingVertical: SPACING.xs + 2,
    borderRadius: RADIUS.full,
    borderWidth: 1,
  } as ViewStyle,
  pillDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  } as ViewStyle,
  pillText: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    letterSpacing: 0.5,
  } as TextStyle,
  full: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.md,
  } as ViewStyle,
  fullBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  } as ViewStyle,
  fullNumber: {
    fontFamily: FONTS.header,
    fontSize: 18,
  } as TextStyle,
  fullOf: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    marginTop: 2,
  } as TextStyle,
  fullCol: {
    flex: 1,
  } as ViewStyle,
  fullLabel: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 14,
  } as TextStyle,
  fullCountry: {
    fontFamily: FONTS.body,
    fontSize: 12,
    color: COLORS.creamMuted,
    marginTop: 2,
  } as TextStyle,
});

// =============================================================================
// ROAM — Travel Advisory Card (US State Department)
// Color-coded safety level 1-4 for every destination. No auth. Unlimited.
// =============================================================================
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, type ViewStyle, type TextStyle } from 'react-native';
import { useTranslation } from 'react-i18next';
import { COLORS, FONTS, SPACING, RADIUS } from '../../lib/constants';
import {
  getAdvisory,
  getAdvisoryDisplay,
  getCountryForDestination,
  type TravelAdvisory,
} from '../../lib/travel-advisory';

interface SafetyScoreCardProps {
  destination: string;
}

export default function SafetyScoreCard({ destination }: SafetyScoreCardProps) {
  const { t } = useTranslation();
  const [advisory, setAdvisory] = useState<TravelAdvisory | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- async data load
    setLoading(true);
    getAdvisory(destination)
      .then((data) => {
        if (!cancelled) {
          // eslint-disable-next-line react-hooks/set-state-in-effect -- async data load
          setAdvisory(data);
          // eslint-disable-next-line react-hooks/set-state-in-effect -- async data load
          setLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          // eslint-disable-next-line react-hooks/set-state-in-effect -- async data load
          setLoading(false);
        }
      });
    return () => { cancelled = true; };
  }, [destination]);

  if (loading || !advisory) return null;

  const display = getAdvisoryDisplay(advisory);
  const country = getCountryForDestination(destination);

  return (
    <View style={styles.card}>
      <Text style={styles.sectionLabel}>{t('safety.travelAdvisory', { defaultValue: 'TRAVEL ADVISORY' })}</Text>
      <View style={styles.row}>
        <View style={[styles.levelBadge, { backgroundColor: display.color + '20', borderColor: display.color }]}>
          <Text style={[styles.levelNumber, { color: display.color }]}>{advisory.level}</Text>
          <Text style={[styles.levelOf, { color: display.color }]}>/4</Text>
        </View>
        <View style={styles.textCol}>
          <View style={styles.labelRow}>
            <View style={[styles.statusDot, { backgroundColor: display.color }]} />
            <Text style={[styles.statusLabel, { color: display.color }]}>{display.shortLabel}</Text>
          </View>
          <Text style={styles.country}>{country?.name ?? destination}</Text>
          <Text style={styles.source}>{t('safety.source', { defaultValue: 'US State Department' })}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.md,
  } as ViewStyle,
  sectionLabel: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    color: COLORS.sage,
    letterSpacing: 1.5,
    marginBottom: SPACING.sm,
  } as TextStyle,
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  } as ViewStyle,
  levelBadge: {
    width: 52,
    height: 52,
    borderRadius: RADIUS.pill,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  } as ViewStyle,
  levelNumber: {
    fontFamily: FONTS.header,
    fontSize: 24,
  } as TextStyle,
  levelOf: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    marginTop: 4,
  } as TextStyle,
  textCol: {
    flex: 1,
  } as ViewStyle,
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  } as ViewStyle,
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  } as ViewStyle,
  statusLabel: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 15,
  } as TextStyle,
  country: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: COLORS.cream,
    marginTop: 2,
  } as TextStyle,
  source: {
    fontFamily: FONTS.mono,
    fontSize: 9,
    color: COLORS.creamDim,
    marginTop: 4,
  } as TextStyle,
});

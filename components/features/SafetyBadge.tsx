// =============================================================================
// ROAM — Safety Badge for activity/venue cards
// Color-coded: green (very safe), amber (take care), red (avoid at night)
// =============================================================================
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, type ViewStyle, type TextStyle } from 'react-native';
import { COLORS, FONTS } from '../../lib/constants';
import { getCitySafetyScore, SAFETY_COLORS, type SafetyLevel } from '../../lib/teleport-safety';

interface SafetyBadgeProps {
  city: string;
  /** Compact = smaller, for inline use */
  compact?: boolean;
}

export default function SafetyBadge({ city, compact }: SafetyBadgeProps) {
  const [safety, setSafety] = useState<{
    level: SafetyLevel;
    label: string;
    timeNote?: string;
  } | null>(null);

  useEffect(() => {
    getCitySafetyScore(city).then((s) =>
      s ? setSafety({ level: s.level, label: s.label, timeNote: s.timeNote }) : setSafety(null)
    );
  }, [city]);

  if (!safety) return null;

  const color = SAFETY_COLORS[safety.level];

  return (
    <View style={[styles.badge, compact && styles.compact, { borderColor: `${color}66` }]}>
      <View style={[styles.dot, { backgroundColor: color }]} />
      <Text style={[styles.label, compact && styles.labelSmall, { color }]}>
        {safety.label}
      </Text>
      {!compact && safety.timeNote && (
        <Text style={styles.note}>{safety.timeNote}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    backgroundColor: COLORS.bgCard,
  } as ViewStyle,
  compact: {
    paddingHorizontal: 6,
    paddingVertical: 2,
  } as ViewStyle,
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  } as ViewStyle,
  label: {
    fontFamily: FONTS.monoMedium,
    fontSize: 11,
  } as TextStyle,
  labelSmall: {
    fontSize: 10,
  } as TextStyle,
  note: {
    fontFamily: FONTS.body,
    fontSize: 10,
    marginStart: 4,
  } as TextStyle,
});

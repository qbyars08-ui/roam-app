// =============================================================================
// ROAM — Mock/Offline Data Badge
// User-visible indicator when sample or offline demo data is displayed
// =============================================================================
import React from 'react';
import { View, Text, StyleSheet, type ViewStyle, type TextStyle } from 'react-native';
import { COLORS, FONTS, SPACING, RADIUS } from '../../lib/constants';

interface MockDataBadgeProps {
  label?: string;
  style?: ViewStyle;
}

const DEFAULT_LABEL = 'Offline demo';

export default function MockDataBadge({ label = DEFAULT_LABEL, style }: MockDataBadgeProps) {
  return (
    <View style={[styles.badge, style]}>
      <Text style={styles.text}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: COLORS.goldMuted,
    borderRadius: RADIUS.sm,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderWidth: 1,
    borderColor: COLORS.gold,
  } as ViewStyle,
  text: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    color: COLORS.gold,
    letterSpacing: 0.5,
  } as TextStyle,
});

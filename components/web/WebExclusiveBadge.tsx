import React from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import { COLORS, FONTS, RADIUS } from '../../lib/constants';

/**
 * Small "WEB" badge for web-only features.
 * Use next to: CRAFT split-screen, flight table, budget spreadsheet, command-K.
 */
export default function WebExclusiveBadge() {
  if (Platform.OS !== 'web') return null;

  return (
    <View style={styles.badge}>
      <Text style={styles.label}>WEB</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    backgroundColor: COLORS.surface2,
    borderWidth: 1,
    borderColor: COLORS.sage,
    borderRadius: RADIUS.sm,
    paddingHorizontal: 5,
    paddingVertical: 1,
    alignSelf: 'flex-start',
  },
  label: {
    fontFamily: FONTS.mono,
    fontSize: 9,
    color: COLORS.sage,
    letterSpacing: 0.5,
  },
});

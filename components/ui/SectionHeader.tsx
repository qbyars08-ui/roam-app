// =============================================================================
// ROAM — SectionHeader: consistent section label + optional right accessory
// =============================================================================
import React from 'react';
import { View, Text, StyleSheet, type TextStyle, type ViewStyle } from 'react-native';
import { COLORS, FONTS, SPACING } from '../../lib/constants';

interface SectionHeaderProps {
  label: string;
  right?: React.ReactNode;
}

export default function SectionHeader({ label, right }: SectionHeaderProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      {right ?? null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.md,
  } as ViewStyle,
  label: {
    fontFamily: FONTS.body,
    fontSize: 14,
    color: COLORS.muted,
    textTransform: 'uppercase',
    letterSpacing: 1,
  } as TextStyle,
});

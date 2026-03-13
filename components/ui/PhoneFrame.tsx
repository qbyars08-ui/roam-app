// =============================================================================
// ROAM — Responsive layout wrapper
// Mobile: full screen. Desktop web: full-width fluid layout (no phone frame).
// =============================================================================
import React from 'react';
import { View, StyleSheet, type ViewStyle } from 'react-native';
import { COLORS } from '../../lib/constants';

export default function PhoneFrame({ children }: { children: React.ReactNode }) {
  // Always render full-width — no phone frame constraint
  return <View style={styles.full}>{children}</View>;
}

const styles = StyleSheet.create({
  full: {
    flex: 1,
    width: '100%',
    backgroundColor: COLORS.bg,
  } as ViewStyle,
});

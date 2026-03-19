// =============================================================================
// ROAM — PeopleNudgeBanner (clean social proof nudge)
// =============================================================================
import React from 'react';
import { Pressable, StyleSheet, Text, View, type TextStyle, type ViewStyle } from 'react-native';
import { Users, X } from 'lucide-react-native';
import * as Haptics from '../../lib/haptics';
import { COLORS, FONTS, SPACING, RADIUS } from '../../lib/constants';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------
export interface PeopleNudgeBannerProps {
  destination: string;
  onTap: () => void;
  onDismiss: () => void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export default function PeopleNudgeBanner({ destination, onTap, onDismiss }: PeopleNudgeBannerProps) {
  return (
    <Pressable
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onTap();
      }}
      accessibilityLabel={`See who else is heading to ${destination}`}
      accessibilityRole="button"
      style={({ pressed }) => [styles.banner, { opacity: pressed ? 0.85 : 1 }]}
    >
      <Users size={16} color={COLORS.sage} strokeWidth={1.5} />
      <Text style={styles.text}>
        See who else is heading to{' '}
        <Text style={styles.bold}>{destination}</Text>
      </Text>
      <Pressable
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          onDismiss();
        }}
        hitSlop={12}
        accessibilityLabel="Dismiss"
        accessibilityRole="button"
        style={styles.dismiss}
      >
        <X size={14} color={COLORS.muted} strokeWidth={1.5} />
      </Pressable>
    </Pressable>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------
const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    backgroundColor: COLORS.surface1,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    marginBottom: SPACING.lg,
  } as ViewStyle,
  text: {
    fontFamily: FONTS.body,
    fontSize: 14,
    color: COLORS.muted,
    flex: 1,
    lineHeight: 20,
  } as TextStyle,
  bold: {
    fontFamily: FONTS.bodyMedium,
    color: COLORS.sage,
  } as TextStyle,
  dismiss: {
    padding: SPACING.xs,
  } as ViewStyle,
});

// =============================================================================
// ROAM — Plan Pro Teaser
// Shows locked Pro features (Re-generate, Hotel alternatives) to free users.
// Extracted from app/(tabs)/plan.tsx for 800-line compliance.
// =============================================================================
import React from 'react';
import { Pressable, StyleSheet, Text, View, type TextStyle, type ViewStyle } from 'react-native';
import { Bed, Lock, RefreshCw } from 'lucide-react-native';
import { COLORS, FONTS, SPACING, RADIUS } from '../../lib/constants';

interface PlanProTeaserProps {
  onUpgrade: (feature: string) => void;
}

export default function PlanProTeaser({ onUpgrade }: PlanProTeaserProps) {
  return (
    <View style={styles.row}>
      <Pressable
        style={({ pressed }) => [styles.card, { opacity: pressed ? 0.85 : 1 }]}
        onPress={() => onUpgrade('plan-regenerate')}
      >
        <RefreshCw size={16} color={COLORS.gold} strokeWidth={2} />
        <Text style={styles.label}>Re-generate</Text>
        <Lock size={12} color={COLORS.gold} strokeWidth={2} />
      </Pressable>
      <Pressable
        style={({ pressed }) => [styles.card, { opacity: pressed ? 0.85 : 1 }]}
        onPress={() => onUpgrade('plan-hotel-alternatives')}
      >
        <Bed size={16} color={COLORS.gold} strokeWidth={2} />
        <Text style={styles.label}>Hotel alternatives</Text>
        <Lock size={12} color={COLORS.gold} strokeWidth={2} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: SPACING.sm, marginBottom: SPACING.xl } as ViewStyle,
  card: {
    flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: COLORS.bgCard, borderRadius: RADIUS.lg,
    borderWidth: 1, borderColor: COLORS.goldBorder,
    paddingVertical: SPACING.sm, paddingHorizontal: SPACING.md,
  } as ViewStyle,
  label: { flex: 1, fontFamily: FONTS.bodyMedium, fontSize: 12, color: COLORS.gold } as TextStyle,
});

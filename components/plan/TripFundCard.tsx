// =============================================================================
// ROAM — TripFundCard (savings goal progress — clean, minimal)
// =============================================================================
import React from 'react';
import { Pressable, StyleSheet, Text, View, type TextStyle, type ViewStyle } from 'react-native';
import { useRouter } from 'expo-router';
import { ChevronRight, Wallet } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import * as Haptics from '../../lib/haptics';
import { COLORS, FONTS, SPACING, RADIUS } from '../../lib/constants';
import { useSavingsStore } from '../../lib/savings-store';

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export default function TripFundCard() {
  const { t } = useTranslation();
  const router = useRouter();
  const goals = useSavingsStore((s) => s.goals);

  if (goals.length === 0) return null;

  const totalSaved = goals.reduce((sum, g) => sum + g.savedAmount, 0);
  const totalTarget = goals.reduce((sum, g) => sum + g.targetAmount, 0);
  const pct = totalTarget > 0 ? Math.min(100, Math.round((totalSaved / totalTarget) * 100)) : 0;

  return (
    <Pressable
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
        router.push('/money' as never);
      }}
      accessibilityLabel={t('plan.tripFund', { defaultValue: 'Trip Fund' })}
      accessibilityRole="button"
      style={({ pressed }) => [styles.card, { opacity: pressed ? 0.8 : 1 }]}
    >
      <Wallet size={16} color={COLORS.sage} strokeWidth={1.5} />
      <View style={styles.content}>
        <Text style={styles.label}>
          {t('plan.tripFundLabel', {
            defaultValue: `Trip Fund \u00B7 $${totalSaved.toLocaleString()} of $${totalTarget.toLocaleString()}`,
          })}
        </Text>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${pct}%` }]} />
        </View>
      </View>
      <ChevronRight size={16} color={COLORS.sage} strokeWidth={1.5} />
    </Pressable>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------
const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    marginTop: SPACING.md,
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.surface1,
    borderWidth: 1,
    borderColor: COLORS.border,
  } as ViewStyle,
  content: {
    flex: 1,
  } as ViewStyle,
  label: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 14,
    color: COLORS.sage,
    marginBottom: SPACING.xs,
  } as TextStyle,
  progressTrack: {
    height: 3,
    borderRadius: 2,
    backgroundColor: COLORS.surface2,
    overflow: 'hidden',
  } as ViewStyle,
  progressFill: {
    height: 3,
    borderRadius: 2,
    backgroundColor: COLORS.sage,
  } as ViewStyle,
});

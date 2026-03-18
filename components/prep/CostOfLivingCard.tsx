// =============================================================================
// ROAM — Cost of Living Card (prep tab)
// Offline data from lib/cost-of-living.ts — no API call
// =============================================================================
import React, { useMemo } from 'react';
import { View, Text, Pressable, Linking, StyleSheet } from 'react-native';
import { Wallet, TrendingDown, TrendingUp } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import * as Haptics from '../../lib/haptics';
import { COLORS, FONTS, SPACING, RADIUS } from '../../lib/constants';
import { getCostOfLiving, type CostOfLiving } from '../../lib/cost-of-living';

interface Props {
  readonly destination: string;
}

export default function CostOfLivingCard({ destination }: Props) {
  const { t } = useTranslation();
  const data: CostOfLiving | null = useMemo(
    () => getCostOfLiving(destination),
    [destination],
  );

  if (!data) return null;

  const tiers = [
    { label: t('costOfLiving.budget', { defaultValue: 'Budget' }), total: data.budget.dailyTotal, icon: TrendingDown, color: COLORS.sage },
    { label: t('costOfLiving.comfort', { defaultValue: 'Comfort' }), total: data.comfort.dailyTotal, icon: Wallet, color: COLORS.gold },
    { label: t('costOfLiving.luxury', { defaultValue: 'Luxury' }), total: data.luxury.dailyTotal, icon: TrendingUp, color: COLORS.coral },
  ] as const;

  return (
    <View style={s.container}>
      <Text style={s.sectionTitle}>{t('costOfLiving.dailyBudget', { defaultValue: 'Daily Budget' })}</Text>
      <View style={s.row}>
        {tiers.map((tier) => (
          <Pressable key={tier.label} style={s.card} onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); Linking.openURL(`https://www.numbeo.com/cost-of-living/in/${encodeURIComponent(destination)}`).catch(() => {}); }} accessibilityLabel={`${tier.label} budget: ${tier.total} per day`} accessibilityRole="button">
            <tier.icon size={16} color={tier.color} strokeWidth={1.5} />
            <Text style={s.tierTotal}>{tier.total}</Text>
            <Text style={s.tierLabel}>{tier.label}</Text>
          </Pressable>
        ))}
      </View>
      {data.tipping ? (
        <Text style={s.tipNote}>{data.tipping}</Text>
      ) : null}
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    marginBottom: SPACING.lg,
    paddingHorizontal: SPACING.md,
  },
  sectionTitle: {
    fontFamily: FONTS.header,
    fontSize: 22,
    color: COLORS.cream,
    marginBottom: SPACING.md,
  },
  row: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  card: {
    flex: 1,
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.md,
    gap: 4,
  },
  tierTotal: {
    fontFamily: FONTS.header,
    fontSize: 20,
    color: COLORS.cream,
  },
  tierLabel: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    color: COLORS.creamMuted,
    textTransform: 'uppercase',
  },
  tipNote: {
    fontFamily: FONTS.body,
    fontSize: 12,
    color: COLORS.creamMuted,
    marginTop: SPACING.sm,
    paddingHorizontal: SPACING.xs,
  },
});

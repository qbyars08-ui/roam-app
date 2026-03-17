// =============================================================================
// ROAM — Price Oracle Card
// "Your $150/day in Tokyo buys: ..."
// =============================================================================
import React from 'react';
import { useTranslation } from 'react-i18next';
import { View, Text, StyleSheet } from 'react-native';
import { Receipt } from 'lucide-react-native';
import { COLORS, FONTS, SPACING, RADIUS } from '../../lib/constants';
import { getCostBreakdown, type CostBreakdown } from '../../lib/price-oracle';

interface PriceOracleCardProps {
  destination: string;
  dailyBudget: number;
}

export default function PriceOracleCard({ destination, dailyBudget }: PriceOracleCardProps) {
  const { t } = useTranslation();
  const data: CostBreakdown = getCostBreakdown(destination, dailyBudget);

  return (
    <View style={styles.card}>
      <Receipt size={20} color={COLORS.gold} strokeWidth={1.5} />
      <View style={styles.content}>
        <Text style={styles.title}>{t('price.costOfLiving', { defaultValue: 'Cost of living' })}</Text>
        <Text style={styles.breakdown}>{data.breakdown}</Text>
        {data.trend ? (
          <Text style={styles.trend}>{data.trend}</Text>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: SPACING.md,
    backgroundColor: COLORS.bgGlass,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: SPACING.md,
  },
  content: { flex: 1 },
  title: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 14,
    color: COLORS.creamMuted,
  },
  breakdown: {
    fontFamily: FONTS.body,
    fontSize: 14,
    color: COLORS.cream,
    marginTop: 4,
    lineHeight: 20,
  },
  trend: {
    fontFamily: FONTS.body,
    fontSize: 12,
    color: COLORS.creamMuted,
    marginTop: 6,
  },
});

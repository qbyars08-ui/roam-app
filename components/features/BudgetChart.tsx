// =============================================================================
// ROAM — Budget Breakdown Donut Chart (luxury magazine style)
// =============================================================================
import React from 'react';
import { useTranslation } from 'react-i18next';
import { View, Text, StyleSheet, type ViewStyle, type TextStyle } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { COLORS, FONTS, SPACING, RADIUS } from '../../lib/constants';
import { formatUSD, type ExchangeRates } from '../../lib/currency';

const CHART_COLORS = [
  COLORS.chartGreen,
  COLORS.coral,
  COLORS.chartGold,
  COLORS.chartBlue,
  COLORS.chartViolet,
];

export interface BudgetSlice {
  label: string;
  value: number;
}

interface BudgetChartProps {
  breakdown: {
    accommodation: string;
    food: string;
    activities: string;
    transportation: string;
    miscellaneous: string;
  };
  totalBudget: string;
  currency?: string;
  rates?: ExchangeRates | null;
}

function parseBudget(str: string): number {
  const num = parseFloat(str.replace(/[^0-9.]/g, ''));
  return isNaN(num) ? 0 : num;
}

function arcPath(cx: number, cy: number, r: number, startDeg: number, endDeg: number): string {
  const rad = (d: number) => (d * Math.PI) / 180;
  const x1 = cx + r * Math.cos(rad(startDeg));
  const y1 = cy + r * Math.sin(rad(startDeg));
  const x2 = cx + r * Math.cos(rad(endDeg));
  const y2 = cy + r * Math.sin(rad(endDeg));
  const large = endDeg - startDeg > 180 ? 1 : 0;
  return `M ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2}`;
}

export default function BudgetChart({ breakdown, totalBudget, currency = 'USD', rates }: BudgetChartProps) {
  const { t } = useTranslation();
  const items: BudgetSlice[] = [
    { label: t('budgetChart.stay', { defaultValue: 'Stay' }), value: parseBudget(breakdown.accommodation) },
    { label: t('budgetChart.food', { defaultValue: 'Food' }), value: parseBudget(breakdown.food) },
    { label: t('budgetChart.activities', { defaultValue: 'Activities' }), value: parseBudget(breakdown.activities) },
    { label: t('budgetChart.transport', { defaultValue: 'Transport' }), value: parseBudget(breakdown.transportation) },
    { label: t('budgetChart.extras', { defaultValue: 'Extras' }), value: parseBudget(breakdown.miscellaneous) },
  ];

  const total = items.reduce((s, i) => s + i.value, 0) || 1;
  const size = 140;
  const stroke = 14;
  const radius = (size - stroke) / 2;
  const cx = size / 2;
  const cy = size / 2;

  let startAngle = -90;
  const segments = items.map((item, i) => {
    const sweep = (item.value / total) * 360;
    const endAngle = startAngle + sweep;
    const d = arcPath(cx, cy, radius, startAngle, endAngle);
    startAngle = endAngle;
    return { d, color: CHART_COLORS[i] };
  });

  return (
    <View style={styles.wrapper}>
      <View style={styles.chartRow}>
        <View style={styles.chartContainer}>
          <Svg width={size} height={size}>
            {segments.map((seg, i) => (
              <Path
                key={i}
                d={seg.d}
                stroke={seg.color}
                strokeWidth={stroke}
                fill="none"
                strokeLinecap="round"
              />
            ))}
          </Svg>
          <View style={styles.chartCenter}>
            <Text style={styles.chartTotal}>
              {currency !== 'USD' && rates ? formatUSD(items.reduce((s, i) => s + i.value, 0), currency, rates) : totalBudget}
            </Text>
            <Text style={styles.chartLabel}>{t('budgetChart.total', { defaultValue: 'TOTAL' })}</Text>
          </View>
        </View>
        <View style={styles.legend}>
          {items.map((item, i) => (
            <View key={i} style={styles.legendRow}>
              <View style={[styles.legendDot, { backgroundColor: CHART_COLORS[i] }]} />
              <Text style={styles.legendLabel}>{item.label}</Text>
              <Text style={styles.legendValue}>
                {currency !== 'USD' && rates ? formatUSD(item.value, currency, rates) : `$${Math.round(item.value).toLocaleString()}`}
              </Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: SPACING.md,
  } as ViewStyle,
  chartRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.lg,
  } as ViewStyle,
  chartContainer: {
    width: 140,
    height: 140,
    alignItems: 'center',
    justifyContent: 'center',
  } as ViewStyle,
  chartCenter: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  } as ViewStyle,
  chartTotal: {
    fontFamily: FONTS.header,
    fontSize: 20,
    color: COLORS.cream,
  } as TextStyle,
  chartLabel: {
    fontFamily: FONTS.mono,
    fontSize: 9,
    color: COLORS.sage,
    letterSpacing: 1.5,
  } as TextStyle,
  legend: {
    flex: 1,
    gap: SPACING.sm,
  } as ViewStyle,
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  } as ViewStyle,
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: RADIUS.sm,
  } as ViewStyle,
  legendLabel: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: COLORS.cream,
    flex: 1,
  } as TextStyle,
  legendValue: {
    fontFamily: FONTS.monoMedium,
    fontSize: 13,
    color: COLORS.sage,
  } as TextStyle,
});

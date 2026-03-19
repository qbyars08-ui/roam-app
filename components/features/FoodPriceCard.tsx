// =============================================================================
// ROAM — Food Price Card
// Local vs tourist prices for must-try foods
// =============================================================================
import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  type ViewStyle,
  type TextStyle,
} from 'react-native';
import { UtensilsCrossed, ChevronDown } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';

import { COLORS, FONTS, SPACING, RADIUS } from '../../lib/constants';
import { getFoodPriceIndex, type FoodPriceIndex } from '../../lib/food-prices';
import PressableScale from '../ui/PressableScale';
import * as Haptics from '../../lib/haptics';

interface Props {
  readonly destination: string;
  readonly compact?: boolean;
}

export default function FoodPriceCard({ destination, compact = false }: Props): React.JSX.Element | null {
  const { t } = useTranslation();
  const data = getFoodPriceIndex(destination);
  const [expanded, setExpanded] = useState(false);

  const toggleExpand = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    setExpanded((prev) => !prev);
  }, []);

  if (!data) return null;

  const items = compact && !expanded ? data.localMustTry.slice(0, 3) : data.localMustTry;

  return (
    <View style={s.card}>
      {/* Header */}
      <View style={s.header}>
        <View style={s.iconWrap}>
          <UtensilsCrossed size={16} color={COLORS.sage} strokeWidth={1.5} />
        </View>
        <Text style={s.title}>
          {t('foodPrices.title', { defaultValue: 'What Things Cost' })}
        </Text>
      </View>

      {/* Quick stats */}
      <View style={s.stats}>
        <View style={s.stat}>
          <Text style={s.statLabel}>{t('foodPrices.budget', { defaultValue: 'Budget meal' })}</Text>
          <Text style={s.statValue}>{data.mealBudget}</Text>
        </View>
        <View style={s.statDivider} />
        <View style={s.stat}>
          <Text style={s.statLabel}>{t('foodPrices.coffee', { defaultValue: 'Coffee' })}</Text>
          <Text style={s.statValue}>{data.coffeePrice}</Text>
        </View>
        <View style={s.statDivider} />
        <View style={s.stat}>
          <Text style={s.statLabel}>{t('foodPrices.beer', { defaultValue: 'Beer' })}</Text>
          <Text style={s.statValue}>{data.beerPrice}</Text>
        </View>
      </View>

      {/* Must-try items */}
      <View style={s.items}>
        <Text style={s.sectionLabel}>
          {t('foodPrices.mustTry', { defaultValue: 'MUST TRY' })}
        </Text>
        {items.map((item) => (
          <View key={item.item} style={s.item}>
            <View style={s.itemHeader}>
              <Text style={s.itemName}>{item.item}</Text>
              <View style={s.priceCompare}>
                <Text style={s.localPrice}>{item.local}</Text>
                <Text style={s.vs}>vs</Text>
                <Text style={s.touristPrice}>{item.tourist}</Text>
              </View>
            </View>
            <Text style={s.itemWhere}>{item.where}</Text>
          </View>
        ))}
      </View>

      {/* Expand toggle */}
      {compact && data.localMustTry.length > 3 && (
        <PressableScale onPress={toggleExpand} style={s.expandBtn}>
          <Text style={s.expandText}>
            {expanded
              ? t('common.showLess', { defaultValue: 'Show less' })
              : t('common.showAll', { defaultValue: `Show all ${data.localMustTry.length} items` })}
          </Text>
          <ChevronDown
            size={14}
            color={COLORS.sage}
            strokeWidth={1.5}
            style={expanded ? { transform: [{ rotate: '180deg' }] } : undefined}
          />
        </PressableScale>
      )}

      {/* Legend */}
      <View style={s.legend}>
        <View style={s.legendItem}>
          <View style={[s.legendDot, { backgroundColor: COLORS.sage }]} />
          <Text style={s.legendText}>
            {t('foodPrices.localPrice', { defaultValue: 'Local price' })}
          </Text>
        </View>
        <View style={s.legendItem}>
          <View style={[s.legendDot, { backgroundColor: COLORS.coral }]} />
          <Text style={s.legendText}>
            {t('foodPrices.touristPrice', { defaultValue: 'Tourist price' })}
          </Text>
        </View>
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------
const s = StyleSheet.create({
  card: {
    backgroundColor: COLORS.surface1,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.md,
    gap: SPACING.sm,
  } as ViewStyle,
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  } as ViewStyle,
  iconWrap: {
    width: 28,
    height: 28,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.sageSubtle,
    alignItems: 'center',
    justifyContent: 'center',
  } as ViewStyle,
  title: {
    fontFamily: FONTS.headerMedium,
    fontSize: 15,
    color: COLORS.cream,
  } as TextStyle,
  stats: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.bgElevated,
    borderRadius: RADIUS.md,
    padding: SPACING.sm,
  } as ViewStyle,
  stat: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  } as ViewStyle,
  statDivider: {
    width: 1,
    height: 24,
    backgroundColor: COLORS.border,
  } as ViewStyle,
  statLabel: {
    fontFamily: FONTS.mono,
    fontSize: 9,
    color: COLORS.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  } as TextStyle,
  statValue: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 11,
    color: COLORS.cream,
    textAlign: 'center',
  } as TextStyle,
  sectionLabel: {
    fontFamily: FONTS.mono,
    fontSize: 9,
    color: COLORS.sage,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  } as TextStyle,
  items: {
    gap: SPACING.sm,
  } as ViewStyle,
  item: {
    gap: 2,
  } as ViewStyle,
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  } as ViewStyle,
  itemName: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 13,
    color: COLORS.cream,
    flex: 1,
  } as TextStyle,
  priceCompare: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  } as ViewStyle,
  localPrice: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    color: COLORS.sage,
  } as TextStyle,
  vs: {
    fontFamily: FONTS.mono,
    fontSize: 8,
    color: COLORS.muted,
  } as TextStyle,
  touristPrice: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    color: COLORS.coral,
  } as TextStyle,
  itemWhere: {
    fontFamily: FONTS.body,
    fontSize: 11,
    color: COLORS.muted,
    lineHeight: 15,
  } as TextStyle,
  expandBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.xs,
    paddingVertical: SPACING.xs,
  } as ViewStyle,
  expandText: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    color: COLORS.sage,
  } as TextStyle,
  legend: {
    flexDirection: 'row',
    gap: SPACING.md,
    paddingTop: SPACING.xs,
  } as ViewStyle,
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  } as ViewStyle,
  legendDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  } as ViewStyle,
  legendText: {
    fontFamily: FONTS.mono,
    fontSize: 9,
    color: COLORS.muted,
  } as TextStyle,
});

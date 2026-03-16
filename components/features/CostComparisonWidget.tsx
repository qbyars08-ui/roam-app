// =============================================================================
// ROAM — Cost Comparison Widget
// Side-by-side "Your Dollar Abroad" comparison across destinations.
// =============================================================================
import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  ScrollView,
  StyleSheet,
  type ViewStyle,
  type TextStyle,
} from 'react-native';
import { DollarSign, ChevronDown, TrendingDown } from 'lucide-react-native';
import * as Haptics from '../../lib/haptics';
import { COLORS, FONTS, SPACING, RADIUS, DESTINATIONS } from '../../lib/constants';
import { getCostOfLiving, type CostOfLiving } from '../../lib/cost-of-living';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
type BudgetTier = 'budget' | 'comfort' | 'luxury';

interface ParsedCost {
  destination: string;
  dailyUsd: number;
  accommodation: string;
  meal: string;
  transport: string;
  tipping: string;
}

// ---------------------------------------------------------------------------
// Parse daily total from cost data (extract USD number)
// ---------------------------------------------------------------------------
function parseDailyUsd(totalStr: string): number {
  // Handles formats like "~$35–50", "~$80–150", "~$250+"
  const match = totalStr.match(/\$(\d+)/);
  if (!match) return 50; // fallback
  return parseInt(match[1], 10);
}

function getCostForTier(cost: CostOfLiving, tier: BudgetTier): ParsedCost {
  const tierData = cost[tier];
  return {
    destination: cost.city,
    dailyUsd: parseDailyUsd(tierData.dailyTotal),
    accommodation: tierData.accommodation,
    meal: tierData.meal,
    transport: tierData.transport,
    tipping: cost.tipping,
  };
}

// ---------------------------------------------------------------------------
// Comparison Bar
// ---------------------------------------------------------------------------
function ComparisonBar({
  label,
  values,
  maxValue,
}: {
  label: string;
  values: { destination: string; amount: number; color: string }[];
  maxValue: number;
}) {
  return (
    <View style={styles.barSection}>
      <Text style={styles.barLabel}>{label}</Text>
      {values.map((v) => {
        const width = maxValue > 0
          ? Math.max(10, (v.amount / maxValue) * 100)
          : 50;
        return (
          <View key={v.destination} style={styles.barRow}>
            <Text style={styles.barDest}>{v.destination}</Text>
            <View style={styles.barTrack}>
              <View
                style={[
                  styles.barFill,
                  {
                    width: `${width}%` as unknown as number,
                    backgroundColor: v.color,
                  },
                ]}
              />
            </View>
            <Text style={styles.barAmount}>${v.amount}/day</Text>
          </View>
        );
      })}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------
interface CostComparisonWidgetProps {
  destinations: string[]; // 2-3 destinations to compare
  initialTier?: BudgetTier;
}

export default function CostComparisonWidget({
  destinations,
  initialTier = 'comfort',
}: CostComparisonWidgetProps) {
  const [tier, setTier] = useState<BudgetTier>(initialTier);

  const accentColors = [COLORS.sage, COLORS.gold, COLORS.coral];

  const costs = useMemo(() => {
    return destinations
      .map((dest) => {
        const cost = getCostOfLiving(dest);
        if (!cost) return null;
        return getCostForTier(cost, tier);
      })
      .filter(Boolean) as ParsedCost[];
  }, [destinations, tier]);

  const maxDaily = useMemo(() => {
    return Math.max(...costs.map((c) => c.dailyUsd), 1);
  }, [costs]);

  const cheapest = useMemo(() => {
    if (costs.length < 2) return null;
    const sorted = [...costs].sort((a, b) => a.dailyUsd - b.dailyUsd);
    const saving = sorted[sorted.length - 1].dailyUsd - sorted[0].dailyUsd;
    return { destination: sorted[0].destination, savingPerDay: saving };
  }, [costs]);

  if (costs.length < 2) return null;

  const tiers: { key: BudgetTier; label: string }[] = [
    { key: 'budget', label: 'Budget' },
    { key: 'comfort', label: 'Comfort' },
    { key: 'luxury', label: 'Luxury' },
  ];

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <DollarSign size={18} color={COLORS.sage} strokeWidth={2} />
        <Text style={styles.headerTitle}>Your dollar abroad</Text>
      </View>

      {/* Tier selector */}
      <View style={styles.tierRow}>
        {tiers.map((t) => (
          <Pressable
            key={t.key}
            style={[styles.tierPill, tier === t.key && styles.tierPillActive]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setTier(t.key);
            }}
          >
            <Text
              style={[
                styles.tierText,
                tier === t.key && styles.tierTextActive,
              ]}
            >
              {t.label}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Daily cost comparison bars */}
      <ComparisonBar
        label="Daily budget"
        values={costs.map((c, i) => ({
          destination: c.destination,
          amount: c.dailyUsd,
          color: accentColors[i % accentColors.length],
        }))}
        maxValue={maxDaily}
      />

      {/* Savings callout */}
      {cheapest && cheapest.savingPerDay > 0 && (
        <View style={styles.savingsCard}>
          <TrendingDown size={16} color={COLORS.sage} strokeWidth={2} />
          <Text style={styles.savingsText}>
            Save ${cheapest.savingPerDay}/day by choosing{' '}
            <Text style={styles.savingsBold}>{cheapest.destination}</Text>
            {' '}({costs.length > 2 ? 'cheapest option' : `vs ${costs.find((c) => c.destination !== cheapest.destination)?.destination}`})
          </Text>
        </View>
      )}

      {/* Detail breakdown */}
      <View style={styles.detailGrid}>
        {costs.map((cost, i) => (
          <View
            key={cost.destination}
            style={[
              styles.detailCard,
              { borderTopColor: accentColors[i % accentColors.length] },
            ]}
          >
            <Text style={styles.detailDest}>{cost.destination}</Text>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Stay</Text>
              <Text style={styles.detailValue}>{cost.accommodation}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Meal</Text>
              <Text style={styles.detailValue}>{cost.meal}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Transport</Text>
              <Text style={styles.detailValue}>{cost.transport}</Text>
            </View>
            <View style={styles.detailDivider} />
            <Text style={styles.detailTip}>{cost.tipping}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------
const styles = StyleSheet.create({
  container: {
    gap: SPACING.md,
  } as ViewStyle,

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  } as ViewStyle,
  headerTitle: {
    fontFamily: FONTS.header,
    fontSize: 20,
    color: COLORS.cream,
  } as TextStyle,

  // Tier selector
  tierRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
  } as ViewStyle,
  tierPill: {
    flex: 1,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    backgroundColor: COLORS.bgCard,
    borderWidth: 1,
    borderColor: COLORS.border,
  } as ViewStyle,
  tierPillActive: {
    backgroundColor: COLORS.sageLight,
    borderColor: COLORS.sageBorder,
  } as ViewStyle,
  tierText: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 13,
    color: COLORS.creamMuted,
  } as TextStyle,
  tierTextActive: {
    color: COLORS.sage,
  } as TextStyle,

  // Comparison bars
  barSection: {
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.md,
    gap: SPACING.sm,
  } as ViewStyle,
  barLabel: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    color: COLORS.creamMuted,
    letterSpacing: 0.5,
    marginBottom: SPACING.xs,
  } as TextStyle,
  barRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  } as ViewStyle,
  barDest: {
    fontFamily: FONTS.body,
    fontSize: 12,
    color: COLORS.creamSoft,
    width: 70,
  } as TextStyle,
  barTrack: {
    flex: 1,
    height: 12,
    backgroundColor: COLORS.bg,
    borderRadius: RADIUS.sm,
    overflow: 'hidden',
  } as ViewStyle,
  barFill: {
    height: '100%',
    borderRadius: RADIUS.sm,
  } as ViewStyle,
  barAmount: {
    fontFamily: FONTS.mono,
    fontSize: 12,
    color: COLORS.cream,
    width: 65,
    textAlign: 'right',
  } as TextStyle,

  // Savings callout
  savingsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    backgroundColor: COLORS.sageFaint,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.sageBorder,
    padding: SPACING.md,
  } as ViewStyle,
  savingsText: {
    flex: 1,
    fontFamily: FONTS.body,
    fontSize: 13,
    color: COLORS.creamSoft,
    lineHeight: 20,
  } as TextStyle,
  savingsBold: {
    fontFamily: FONTS.bodySemiBold,
    color: COLORS.sage,
  } as TextStyle,

  // Detail grid
  detailGrid: {
    flexDirection: 'row',
    gap: SPACING.sm,
  } as ViewStyle,
  detailCard: {
    flex: 1,
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderTopWidth: 3,
    padding: SPACING.md,
    gap: 6,
  } as ViewStyle,
  detailDest: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 14,
    color: COLORS.cream,
    marginBottom: SPACING.xs,
  } as TextStyle,
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  } as ViewStyle,
  detailLabel: {
    fontFamily: FONTS.body,
    fontSize: 11,
    color: COLORS.creamMuted,
  } as TextStyle,
  detailValue: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    color: COLORS.cream,
    textAlign: 'right',
    flex: 1,
    marginLeft: 4,
  } as TextStyle,
  detailDivider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: 4,
  } as ViewStyle,
  detailTip: {
    fontFamily: FONTS.body,
    fontSize: 10,
    color: COLORS.creamDim,
    lineHeight: 14,
  } as TextStyle,
});

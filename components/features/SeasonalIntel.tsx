// =============================================================================
// ROAM — Seasonal Intelligence Widget
// Shows why now is (or isn't) the right time to visit a destination.
// Combines bestMonths, crowd data, weather, and pricing.
// =============================================================================
import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  type ViewStyle,
  type TextStyle,
} from 'react-native';
import {
  Sun,
  Cloud,
  Snowflake,
  Umbrella,
  Users,
  TrendingDown,
  TrendingUp,
  CalendarDays,
  ThermometerSun,
} from 'lucide-react-native';
import { COLORS, FONTS, SPACING, RADIUS, DESTINATIONS, HIDDEN_DESTINATIONS } from '../../lib/constants';

import type { LucideIcon } from 'lucide-react-native';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface SeasonLabel {
  name: string;
  icon: LucideIcon;
  color: string;
}

type SeasonRating = 'peak' | 'great' | 'good' | 'off-season';

// ---------------------------------------------------------------------------
// Season data by month
// ---------------------------------------------------------------------------
const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
] as const;

const SEASON_LABELS: Record<SeasonRating, SeasonLabel> = {
  peak: { name: 'Peak Season', icon: Sun, color: COLORS.coral },
  great: { name: 'Great Time', icon: ThermometerSun, color: COLORS.sage },
  good: { name: 'Good Time', icon: Cloud, color: COLORS.gold },
  'off-season': { name: 'Off-Season', icon: Snowflake, color: COLORS.creamMuted },
};

// Crowd labels
const CROWD_LABELS: Record<SeasonRating, string> = {
  peak: 'Very crowded — book early',
  great: 'Moderate crowds — sweet spot',
  good: 'Lighter crowds — fewer queues',
  'off-season': 'Minimal tourists — cheapest rates',
};

const PRICE_LABELS: Record<SeasonRating, string> = {
  peak: 'Highest prices of the year',
  great: 'Mid-range pricing',
  good: 'Below-average prices',
  'off-season': 'Best deals available',
};

const PRICE_ICONS: Record<SeasonRating, LucideIcon> = {
  peak: TrendingUp,
  great: TrendingUp,
  good: TrendingDown,
  'off-season': TrendingDown,
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function getSeasonRating(destination: string, month: number): SeasonRating {
  const all = [...DESTINATIONS, ...HIDDEN_DESTINATIONS];
  const dest = all.find((d) => d.label === destination);
  if (!dest) return 'good';

  const isBest = dest.bestMonths.includes(month);

  // Adjacent months to bestMonths = good
  const isAdjacent = dest.bestMonths.some((bm) => {
    const prev = bm === 1 ? 12 : bm - 1;
    const next = bm === 12 ? 1 : bm + 1;
    return month === prev || month === next;
  });

  if (isBest && dest.trendScore >= 85) return 'peak';
  if (isBest) return 'great';
  if (isAdjacent) return 'good';
  return 'off-season';
}

function getMonthInsight(destination: string, month: number): string {
  const all = [...DESTINATIONS, ...HIDDEN_DESTINATIONS];
  const dest = all.find((d) => d.label === destination);
  if (!dest) return 'Check local weather before booking.';

  const isBest = dest.bestMonths.includes(month);
  const monthName = MONTH_NAMES[month - 1];

  if (isBest) {
    return `${monthName} is one of the best months to visit ${destination}. Expect ideal weather and vibrant local energy.`;
  }

  const nextBest = dest.bestMonths.find((bm) => bm > month) ?? dest.bestMonths[0];
  const nextBestName = MONTH_NAMES[(nextBest ?? 1) - 1];

  return `${monthName} is quieter in ${destination}. For peak conditions, consider visiting in ${nextBestName}.`;
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------
interface SeasonalIntelProps {
  destination: string;
  month?: number; // 1-12, defaults to current
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
function SeasonalIntel({ destination, month }: SeasonalIntelProps) {
  const currentMonth = useMemo(() => month ?? new Date().getMonth() + 1, [month]);

  const rating = useMemo(
    () => getSeasonRating(destination, currentMonth),
    [destination, currentMonth],
  );

  const season = useMemo(() => SEASON_LABELS[rating], [rating]);
  const insight = useMemo(
    () => getMonthInsight(destination, currentMonth),
    [destination, currentMonth],
  );

  const SeasonIcon = season.icon;
  const PriceIcon = PRICE_ICONS[rating];

  // Best months display
  const bestMonthsDisplay = useMemo(() => {
    const all = [...DESTINATIONS, ...HIDDEN_DESTINATIONS];
    const dest = all.find((d) => d.label === destination);
    if (!dest) return '';
    return dest.bestMonths
      .map((m) => MONTH_NAMES[m - 1].slice(0, 3))
      .join(', ');
  }, [destination]);

  return (
    <View style={styles.container}>
      {/* Season badge */}
      <View style={[styles.seasonBadge, { backgroundColor: season.color + '18' }]}>
        <SeasonIcon size={18} color={season.color} strokeWidth={2} />
        <Text style={[styles.seasonName, { color: season.color }]}>{season.name}</Text>
        <Text style={styles.monthLabel}>{MONTH_NAMES[currentMonth - 1]}</Text>
      </View>

      {/* Insight */}
      <Text style={styles.insight}>{insight}</Text>

      {/* Info rows */}
      <View style={styles.infoRow}>
        <Users size={14} color={COLORS.creamMuted} strokeWidth={2} />
        <Text style={styles.infoText}>{CROWD_LABELS[rating]}</Text>
      </View>

      <View style={styles.infoRow}>
        <PriceIcon size={14} color={COLORS.creamMuted} strokeWidth={2} />
        <Text style={styles.infoText}>{PRICE_LABELS[rating]}</Text>
      </View>

      {bestMonthsDisplay.length > 0 && (
        <View style={styles.infoRow}>
          <CalendarDays size={14} color={COLORS.sage} strokeWidth={2} />
          <Text style={[styles.infoText, { color: COLORS.sage }]}>
            Best months: {bestMonthsDisplay}
          </Text>
        </View>
      )}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------
const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.bgElevated,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    gap: SPACING.sm,
  } as ViewStyle,
  seasonBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    alignSelf: 'flex-start',
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.full,
  } as ViewStyle,
  seasonName: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 14,
  } as TextStyle,
  monthLabel: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    color: COLORS.creamMuted,
    letterSpacing: 0.5,
    marginLeft: SPACING.xs,
  } as TextStyle,
  insight: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: COLORS.cream,
    lineHeight: 18,
  } as TextStyle,
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  } as ViewStyle,
  infoText: {
    fontFamily: FONTS.body,
    fontSize: 12,
    color: COLORS.creamMuted,
    flex: 1,
  } as TextStyle,
});

export default React.memo(SeasonalIntel);
